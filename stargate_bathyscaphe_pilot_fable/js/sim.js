// ============================================================================
//  Vessel simulation — DSV-7 Cerulean Lantern
//  A purely client-side model of the vessel: phase state machine, the
//  ballast / trim neutral-buoyancy lock dynamics, activation staging,
//  emergency ascent, and telemetry with physically-linked relationships.
// ============================================================================
import { VESSEL, GLYPH_BY_ID, CHANNELS } from './data.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeInOutCubic = u => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const easeInQuad = u => u * u;
const easeOutCubic = u => 1 - Math.pow(1 - u, 3);

// ---- environmental physics --------------------------------------------------
export function pressureBar(depth) {
  // hydrostatic with a mild compressibility term (seawater density rises with depth)
  return 1.01325 + depth * 0.1005 * (1 + depth * 2.2e-6);
}
export const RATED_BAR = pressureBar(VESSEL.ratedDepth);
export const CRUSH_BAR = pressureBar(VESSEL.crushDepth);
export function waterTemp(depth) {
  // warm mixed layer → thermocline → near-constant deep water with slight adiabatic warming
  return 1.6 + 20.4 * Math.exp(-depth / 380) + depth * 0.00004;
}
export function ambientLux(depth) {
  return 2000 * Math.exp(-depth * 0.045);
}

export const PHASES = ['idle', 'locking', 'pending', 'buildup', 'breakthrough', 'active', 'ascending'];

export const TIMING = {
  lockManual: 2600,
  lockAuto: 850,
  autoGap: 180,
  buildup: 2200,
  breakthrough: 900,
  ascendMin: 1800,
  ascendMax: 3200,
};

export class Sim {
  constructor(listener) {
    this.listener = listener || (() => {});
    this.reset(true);
    this.sessionStart = performance.now();
    this.energyUsed = 0;
  }

  emit(type, payload) { this.listener(type, payload || {}); }

  reset(hard) {
    this.phase = 'idle';
    this.depth = 0;
    this.holdDepth = 0;
    this.vel = 0;
    this.sequence = [];
    this.lock = null;
    this.auto = null;
    this.act = null;
    this.ascent = null;
    this.pitch = 0;
    this.roll = 0;
    this.shake = 0;
    this.lightDim = 0;       // 0..1 — extra darkness driven by activation
    this.aperture = 0;       // 0..1 — pressure-hull aperture opening
    this.ringGlow = 0;       // 0..1 — ring response
    this.activeSince = 0;
    this.maxHullLoad = 0;
    this.ringDepth = 0;
    this.presetId = null;
    if (hard) {
      this.lockout = false;  // hull-integrity lockout — RELEASED by default, always
      this.ch = {};
      for (const c of CHANNELS) this.ch[c.id] = { v: 0, cmd: 0 };
      this.lastDepth = 0;
    } else {
      for (const c of CHANNELS) { this.ch[c.id].v = 0; this.ch[c.id].cmd = 0; }
    }
  }

  // ---- helpers --------------------------------------------------------------
  targetFill(depth) { return 0.28 + 0.62 * (depth / VESSEL.ratedDepth); }
  get complete() { return this.sequence.length >= VESSEL.sequenceLength; }
  get busy() { return this.phase !== 'idle' && this.phase !== 'pending'; }
  nextGlyphAllowed(glyphId) {
    const g = GLYPH_BY_ID[glyphId];
    if (!g) return { ok: false, why: 'UNKNOWN STRATUM' };
    if (this.phase === 'locking') return { ok: false, why: 'TRIM SEQUENCE IN PROGRESS' };
    if (this.phase !== 'idle' && this.phase !== 'pending') return { ok: false, why: 'DISENGAGE FIRST' };
    if (this.complete) return { ok: false, why: 'PROFILE COMPLETE — COMMENCE OR ASCEND' };
    if (this.sequence.includes(glyphId)) return { ok: false, why: 'STRATUM ALREADY IN PROFILE' };
    if (g.depth <= this.holdDepth) return { ok: false, why: 'PROFILE MUST DESCEND' };
    return { ok: true };
  }

  // ---- commands -------------------------------------------------------------
  selectGlyph(glyphId, opts = {}) {
    const chk = this.nextGlyphAllowed(glyphId);
    if (!chk.ok) { this.emit('reject', { glyphId, why: chk.why }); return false; }
    const g = GLYPH_BY_ID[glyphId];
    const dur = opts.auto ? TIMING.lockAuto : TIMING.lockManual;
    const delta = g.depth - this.holdDepth;
    this.lock = {
      glyphId, from: this.holdDepth, to: g.depth, t0: performance.now(), dur,
      over: Math.max(6, delta * 0.014),
      fillFrom: this.ch.BT1.v, fillTo: this.targetFill(g.depth),
      stage: 'flood', thrFired: false, ventFired: false, groanFired: false, auto: !!opts.auto,
      index: this.sequence.length,
    };
    this.phase = 'locking';
    this.emit('lockStart', { glyphId, from: this.holdDepth, to: g.depth, dur, auto: !!opts.auto, index: this.sequence.length });
    return true;
  }

  startAuto(preset) {
    if (this.phase !== 'idle' || this.sequence.length > 0) { this.emit('reject', { why: this.phase === 'idle' ? 'ASCEND TO SURFACE BEFORE REPLAY' : 'DISENGAGE BEFORE REPLAY' }); return false; }
    this.auto = { preset, index: 0, nextAt: performance.now() + 350 };
    this.presetId = preset.id;
    this.emit('autoStart', { preset });
    return true;
  }

  commence() {
    if (this.phase !== 'pending') { this.emit('reject', { why: this.phase === 'active' ? 'ALREADY AT RING' : 'PROFILE NOT COMPLETE' }); return false; }
    if (this.lockout) { this.emit('lockoutBlocked', {}); return false; }
    const t = performance.now();
    this.ringDepth = this.holdDepth + VESSEL.ringOffset;
    this.act = { t0: t, from: this.holdDepth, to: this.ringDepth, stage: 'buildup', fillFrom: this.ch.BT1.v };
    this.phase = 'buildup';
    this.emit('buildup', { from: this.holdDepth, to: this.ringDepth, dur: TIMING.buildup });
    return true;
  }

  setLockout(on) {
    this.lockout = !!on;
    this.emit('lockout', { on: this.lockout });
  }

  emergencyAscent() {
    const t = performance.now();
    const fromPhase = this.phase;
    const fromDepth = this.depth;
    const wasActive = fromPhase === 'active' || fromPhase === 'breakthrough' || fromPhase === 'buildup';
    const seq = this.sequence.slice();
    const dur = TIMING.ascendMin + (TIMING.ascendMax - TIMING.ascendMin) * clamp(fromDepth / VESSEL.ratedDepth, 0, 1);
    this.ascent = { t0: t, from: fromDepth, dur, fillFrom: this.ch.BT1.v, apertureFrom: this.aperture, glowFrom: this.ringGlow, dimFrom: this.lightDim };
    this.lock = null; this.auto = null; this.act = null;
    this.sequence = [];
    this.holdDepth = 0;
    this.phase = 'ascending';
    this.emit('ascendStart', { fromPhase, fromDepth, dur, wasActive, sequence: seq, presetId: this.presetId, maxHullLoad: this.maxHullLoad });
    this.presetId = null;
    return true;
  }

  // ---- per-frame update -------------------------------------------------------
  update(now, dt) {
    const ch = this.ch;
    switch (this.phase) {
      case 'locking': this._updateLock(now); break;
      case 'buildup': case 'breakthrough': case 'active': this._updateAct(now); break;
      case 'ascending': this._updateAscent(now); break;
      case 'idle': case 'pending': this._updateHold(now, dt); break;
    }
    if (this.auto && this.phase !== 'locking' && now >= this.auto.nextAt) this._autoStep(now);

    // channel smoothing: each channel drifts toward its command value
    for (const c of CHANNELS) {
      const s = ch[c.id];
      const k = c.kind === 'ballast' ? 6 : c.kind === 'trim' ? 5 : 14;
      s.v += (s.cmd - s.v) * clamp(k * dt, 0, 1);
    }
    // vertical velocity from depth delta
    const v = dt > 0 ? (this.depth - this.lastDepth) / dt : 0;
    this.vel += (v - this.vel) * clamp(8 * dt, 0, 1);
    this.lastDepth = this.depth;
    // energy budget: thruster use + hotel load
    const thr = ch.VTP.v + ch.VTS.v + ch.HTP.v + ch.HTS.v;
    this.energyUsed += (thr * 0.012 + 0.0006) * dt;
    this.telemetry = this._computeTelemetry(now, dt);
    if (this.telemetry.hullLoad > this.maxHullLoad) this.maxHullLoad = this.telemetry.hullLoad;
  }

  _updateHold(now, dt) {
    // quiet station-keeping: tiny wobble around hold depth, thrusters idle
    const t = now / 1000;
    const wob = this.holdDepth > 0 ? Math.sin(t * 0.9) * 0.12 + Math.sin(t * 2.3) * 0.05 : 0;
    this.depth = this.holdDepth + wob;
    this.pitch += (Math.sin(t * 0.5) * 0.4 - this.pitch) * clamp(2 * dt, 0, 1);
    this.roll += (Math.sin(t * 0.37) * 0.3 - this.roll) * clamp(2 * dt, 0, 1);
    const hk = this.holdDepth > 0 ? 0.04 + 0.03 * Math.abs(Math.sin(t * 0.6)) : 0;
    this.ch.HTP.cmd = hk; this.ch.HTS.cmd = hk * 0.8;
    this.ch.VTP.cmd = this.holdDepth > 0 ? 0.03 : 0; this.ch.VTS.cmd = this.ch.VTP.cmd;
    this.shake += (0 - this.shake) * clamp(3 * dt, 0, 1);
    this.lightDim += (0 - this.lightDim) * clamp(2 * dt, 0, 1);
  }

  _updateLock(now) {
    const L = this.lock;
    const u = clamp((now - L.t0) / L.dur, 0, 1);
    const ch = this.ch;
    const flood = 0.45;
    if (u < flood) {
      // FLOOD stage: tanks take on water, vessel accelerates down, overshoots
      const k = easeInOutCubic(u / flood);
      this.depth = L.from + (L.to - L.from + L.over) * k;
      const f = L.fillFrom + (L.fillTo + 0.05 - L.fillFrom) * k;
      ch.BT1.cmd = f; ch.BT2.cmd = f; ch.BT3.cmd = f * 0.98; ch.BT4.cmd = f * 0.98;
      ch.TRF.cmd = 0.3 * k; ch.TRA.cmd = -0.1 * k;
      ch.VTP.cmd = 0.05; ch.VTS.cmd = 0.05;
      this.pitch = -4.5 * Math.sin(k * Math.PI);   // bow-down on the way in
      this.shake = 0.25 * Math.sin(k * Math.PI);
      if (L.stage !== 'flood') L.stage = 'flood';
      if (!L.groanFired && u > 0.22 && L.to > 1200) {
        L.groanFired = true;
        this.emit('groan', { intensity: clamp(L.to / VESSEL.ratedDepth, 0.2, 1), depth: this.depth });
      }
    } else {
      // SETTLE stage: damped oscillation around the target while thrusters
      // and trim tanks fight for neutral buoyancy
      const s = (u - flood) / (1 - flood);
      const env = Math.exp(-5.2 * s);
      const osc = Math.cos(2 * Math.PI * 1.6 * s);
      this.depth = L.to + L.over * env * osc;
      const thr = env * (0.55 + 0.45 * Math.abs(Math.sin(2 * Math.PI * 1.6 * s)));
      ch.VTP.cmd = thr; ch.VTS.cmd = thr * 0.92;
      ch.HTP.cmd = 0.12 * env; ch.HTS.cmd = 0.1 * env;
      const f = L.fillTo + 0.05 * env * osc;
      ch.BT1.cmd = f; ch.BT2.cmd = f; ch.BT3.cmd = f - 0.01 * env; ch.BT4.cmd = f - 0.01 * env;
      ch.TRF.cmd = 0.3 * env * Math.cos(2 * Math.PI * 1.2 * s); ch.TRA.cmd = -ch.TRF.cmd * 0.7;
      this.pitch = 3.2 * env * Math.sin(2 * Math.PI * 1.2 * s);
      this.roll = 1.1 * env * Math.sin(2 * Math.PI * 0.9 * s);
      this.shake = 0.3 * env;
      if (L.stage !== 'settle') {
        L.stage = 'settle';
        this.emit('lockStage', { stage: 'settle', glyphId: L.glyphId });
      }
      if (!L.thrFired && s > 0.02) { L.thrFired = true; this.emit('thruster', { power: clamp(L.over / 60, 0.45, 1), dur: L.dur * 0.5 }); }
      if (!L.ventFired && s > 0.45) { L.ventFired = true; this.emit('vent', {}); }
    }
    if (u >= 1) {
      this.depth = L.to; this.holdDepth = L.to;
      this.sequence.push(L.glyphId);
      ch.VTP.cmd = 0.03; ch.VTS.cmd = 0.03; ch.TRF.cmd = 0; ch.TRA.cmd = 0;
      const f = L.fillTo; ch.BT1.cmd = f; ch.BT2.cmd = f; ch.BT3.cmd = f; ch.BT4.cmd = f;
      const done = { glyphId: L.glyphId, depth: L.to, index: L.index, auto: L.auto };
      this.lock = null;
      this.phase = this.complete ? 'pending' : 'idle';
      this.emit('lockComplete', done);
      if (this.complete) { this.emit('pending', { sequence: this.sequence.slice() }); if (this.auto) { const p = this.auto.preset; this.auto = null; this.emit('autoDone', { preset: p }); } }
      else if (this.auto) this.auto.nextAt = now + TIMING.autoGap;
    }
  }

  _autoStep(now) {
    const A = this.auto;
    if (!A) return;
    if (A.index >= A.preset.sequence.length) { const p = A.preset; this.auto = null; this.emit('autoDone', { preset: p }); return; }
    const id = A.preset.sequence[A.index];
    A.index++;
    this.emit('autoStep', { preset: A.preset, index: A.index - 1, glyphId: id });
    const ok = this.selectGlyph(id, { auto: true });
    if (!ok) { const p = A.preset; this.auto = null; this.emit('autoAbort', { preset: p, glyphId: id }); }
  }

  _updateAct(now) {
    const A = this.act; const ch = this.ch; const t = now / 1000;
    if (this.phase === 'buildup') {
      const u = clamp((now - A.t0) / TIMING.buildup, 0, 1);
      const k = easeInQuad(u);
      this.depth = A.from + (A.to - A.from) * k;
      const f = A.fillFrom + 0.09 * u;
      ch.BT1.cmd = f; ch.BT2.cmd = f; ch.BT3.cmd = f; ch.BT4.cmd = f;
      ch.TRF.cmd = 0.5 * u; ch.TRA.cmd = -0.3 * u;
      ch.VTP.cmd = 0.15 + 0.55 * u; ch.VTS.cmd = 0.15 + 0.55 * u;
      this.pitch = -7 * u; this.shake = 0.25 + 0.75 * u * u;
      this.lightDim = u * 0.85;
      this.ringGlow = u * 0.35;
      if (u >= 1) {
        this.phase = 'breakthrough'; A.t0 = now; A.stage = 'breakthrough';
        this.depth = A.to; this.holdDepth = A.to;
        this.emit('breakthrough', { depth: A.to });
      }
    } else if (this.phase === 'breakthrough') {
      const u = clamp((now - A.t0) / TIMING.breakthrough, 0, 1);
      this.depth = A.to;
      this.aperture = easeOutCubic(u);
      this.ringGlow = 0.35 + 0.65 * easeOutCubic(u);
      this.shake = 1.2 * (1 - u);
      this.lightDim = 0.85 * (1 - u * 0.4);
      ch.VTP.cmd = 0.7 * (1 - u) + 0.08; ch.VTS.cmd = ch.VTP.cmd;
      ch.TRF.cmd = 0.5 * (1 - u); ch.TRA.cmd = -0.3 * (1 - u);
      this.pitch = -7 * (1 - u);
      if (u >= 1) {
        this.phase = 'active'; A.stage = 'active'; this.activeSince = now;
        this.emit('active', { depth: A.to });
      }
    } else { // active — sustained hold inside the ring
      this.depth = A.to + Math.sin(t * 0.7) * 0.18 + Math.sin(t * 1.9) * 0.06;
      this.aperture = 1; this.ringGlow = 0.9 + 0.1 * Math.sin(t * 1.3);
      this.shake = 0.06 + 0.03 * Math.sin(t * 2.1);
      this.lightDim = 0.5;
      ch.VTP.cmd = 0.1 + 0.04 * Math.sin(t * 1.1); ch.VTS.cmd = 0.1 + 0.04 * Math.cos(t * 1.3);
      ch.HTP.cmd = 0.08 + 0.04 * Math.sin(t * 0.8); ch.HTS.cmd = 0.08 + 0.04 * Math.cos(t * 0.9);
      ch.TRF.cmd = 0.05 * Math.sin(t * 0.6); ch.TRA.cmd = -ch.TRF.cmd;
      this.pitch = 0.6 * Math.sin(t * 0.5); this.roll = 0.4 * Math.sin(t * 0.4);
    }
  }

  _updateAscent(now) {
    const S = this.ascent; const ch = this.ch;
    const u = clamp((now - S.t0) / S.dur, 0, 1);
    const k = easeOutCubic(u);
    this.depth = S.from * (1 - k);
    const blow = clamp(u / 0.25, 0, 1);
    const f = S.fillFrom * (1 - blow);
    ch.BT1.cmd = f; ch.BT2.cmd = f; ch.BT3.cmd = f; ch.BT4.cmd = f;
    ch.TRF.cmd = -0.4 * (1 - u); ch.TRA.cmd = 0.6 * (1 - u);
    ch.VTP.cmd = 0.2 * (1 - u); ch.VTS.cmd = 0.2 * (1 - u);
    this.pitch = 9 * Math.sin(u * Math.PI);
    this.shake = 0.6 * (1 - u);
    this.aperture = S.apertureFrom * (1 - clamp(u / 0.2, 0, 1));
    this.ringGlow = S.glowFrom * (1 - clamp(u / 0.4, 0, 1));
    this.lightDim = S.dimFrom * (1 - u);
    if (u >= 1) {
      this.depth = 0; this.holdDepth = 0; this.ascent = null; this.maxHullLoad = 0;
      this.phase = 'idle';
      this.emit('surfaced', {});
    }
  }

  _computeTelemetry(now, dt) {
    const d = Math.max(0, this.depth);
    const p = pressureBar(d);
    const hullLoad = (p / RATED_BAR) * 100;
    const crushMargin = 100 - (p / CRUSH_BAR) * 100;
    const tw = waterTemp(d);
    const lux = ambientLux(d);
    const ch = this.ch;
    const ballastAvg = (ch.BT1.v + ch.BT2.v + ch.BT3.v + ch.BT4.v) / 4;
    const sessionMin = (now - this.sessionStart) / 60000;
    const scrubFrac = ((now - this.sessionStart) / 1000 % 240) / 240;
    const o2 = 20.9 - sessionMin * 0.011 + (scrubFrac < 0.1 ? 0.05 : 0);
    const co2 = 640 + 520 * scrubFrac;
    const battery = clamp(100 - this.energyUsed * 100, 0, 100);
    const cabinTemp = 21.5 - (21.5 - tw) * 0.42 - (this.phase === 'active' ? -0.3 * this.aperture : 0);
    const strain = hullLoad * 38;        // microstrain at the sphere equator
    const compression = p * 0.0042;      // mm, acrylic sphere radial compression
    const seatLoad = hullLoad * 0.96 + (this.shake * 2);
    const thrTotal = (ch.VTP.v + ch.VTS.v + ch.HTP.v + ch.HTS.v) / 4;
    const density = 1025 + d * 0.0045;   // kg/m³ seawater density
    return {
      depth: d, pressure: p, hullLoad, crushMargin, waterTemp: tw, lux, ballastAvg,
      o2, co2, scrubberCycle: scrubFrac < 0.1, battery, cabinTemp, strain, compression, seatLoad,
      thrTotal, density, vel: this.vel, pitch: this.pitch, roll: this.roll,
      trim: (ch.TRF.v - ch.TRA.v) * 0.5,
      lampPower: d > 300 ? 100 : d > 150 ? (d - 150) / 150 * 100 : 0,
    };
  }
}
