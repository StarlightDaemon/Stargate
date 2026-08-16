// ============================================================
// gate.js — canvas renderer + kinematics for the Meridian Ring.
//
// Layer order (back to front): ambient glow, conduit (horizon /
// burst / collapse), iris plates, collar, rotating glyph band,
// outer hull, hold-clamps, burst overshoot plume.
// ============================================================

import { GLYPH_COUNT, drawGlyph } from "./glyphs.js";

const TAU = Math.PI * 2;
export const STEP = TAU / GLYPH_COUNT;
const APEX = -Math.PI / 2;

// Geometry (canvas is 920 x 920).
const CX = 460, CY = 460;
const HULL_OUT = 442, HULL_IN = 398;
const GLYPH_OUT = 398, GLYPH_IN = 306, RG = 352;
const COLLAR_OUT = 306, COLLAR_IN = 276;
export const HORIZON_R = 268;

export const LOCK_COUNT = 8;                 // clamp 0 = apex reader
export const LOCK_ORDER = [1, 7, 2, 6, 3, 5, 4]; // seat order, keystone last (bottom)

const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const easeOut = (p) => 1 - Math.pow(1 - p, 3);
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const norm = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };

export class Gate {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.rot = 0;
    this.anim = null;            // {from, delta, t, dur, resolve}
    this.locks = Array.from({ length: LOCK_COUNT }, () => ({ slide: 0, target: 0, lit: "off" }));
    this.apexAnim = -1;          // -1 idle, else 0..1 press cycle
    this.lockedSymbols = new Set();
    this.glints = [];            // idle sparkles {idx, t}
    this.ripples = [];           // horizon ripples {r, v, a}
    this.mode = "idle";          // idle | burst | active | collapse
    this.burstT = 0;
    this.collapseT = 0;
    this.activeGlow = 0;
    this.irisOpen = 0;           // 0 sealed .. 1 fully open
    this.irisTarget = 0;
    this.irisSpeed = 2;
    this.noiseA = this._makeNoise(0x9e3779b9);
    this.noiseB = this._makeNoise(0x1234abcd);
  }

  // ---------- procedural shimmer texture ----------
  _makeNoise(seed) {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d");
    let s = seed >>> 0;
    const rnd = () => {
      s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 150; i++) {
      const x = rnd() * 512, y = rnd() * 512, r = 10 + rnd() * 42;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const a = 0.04 + rnd() * 0.1;
      g.addColorStop(0, `rgba(190,228,255,${a})`);
      g.addColorStop(1, "rgba(190,228,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    return c;
  }

  // ---------- kinematics ----------
  rotateToSymbol(idx, dir) {
    return new Promise((resolve) => {
      const target = APEX - idx * STEP;
      let delta = norm(target - this.rot);
      if (dir > 0) {
        if (delta <= 0.001) delta += TAU;
        if (delta < Math.PI / 3) delta += TAU;   // short hops get a full extra sweep
      } else {
        if (delta >= -0.001) delta -= TAU;
        if (delta > -Math.PI / 3) delta -= TAU;
      }
      this.anim = { from: this.rot, delta, t: 0, dur: 0.5 + Math.abs(delta) * 0.42, resolve };
    });
  }

  cancelRotation() {
    if (this.anim) { const r = this.anim.resolve; this.anim = null; r(false); }
  }

  pressApex() { this.apexAnim = 0; }

  setLock(k, engaged, lit) {
    const L = this.locks[k];
    L.target = engaged ? 1 : 0;
    if (lit !== undefined) L.lit = lit;
  }

  setAllLockLights(lit) { for (const L of this.locks) if (L.target > 0 || L.lit !== "off") L.lit = lit; }

  markSymbolLocked(idx) { this.lockedSymbols.add(idx); }

  startBurst() { this.mode = "burst"; this.burstT = 0; this.irisTarget = 1; this.irisSpeed = 5; }
  setActive() { this.mode = "active"; }
  startCollapse() { this.mode = "collapse"; this.collapseT = 0; }

  resetToIdle() {
    this.mode = "idle";
    this.lockedSymbols.clear();
    this.ripples.length = 0;
    this.irisTarget = 0;
    this.irisSpeed = 1.4;
  }

  glintRandom() {
    if (this.mode !== "idle" || this.anim) return;
    this.glints.push({ idx: Math.floor(Math.random() * GLYPH_COUNT), t: 0 });
  }

  spawnRipple(x, y) {
    // stored in gate-local px relative to centre
    this.ripples.push({ x, y, r: 6, v: 130, a: 0.5 });
  }

  // ---------- hit testing (client coords -> canvas coords) ----------
  toLocal(evt) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: ((evt.clientX - r.left) / r.width) * this.canvas.width - CX,
      y: ((evt.clientY - r.top) / r.height) * this.canvas.height - CY,
    };
  }

  inHorizon(p) { return Math.hypot(p.x, p.y) < HORIZON_R; }

  symbolAt(p) {
    const d = Math.hypot(p.x, p.y);
    if (d < GLYPH_IN || d > GLYPH_OUT) return -1;
    const th = Math.atan2(p.y, p.x);
    let i = Math.round((th - this.rot) / STEP) % GLYPH_COUNT;
    if (i < 0) i += GLYPH_COUNT;
    return i;
  }

  // ---------- per-frame update ----------
  update(dt) {
    if (this.anim) {
      const a = this.anim;
      a.t += dt;
      const p = clamp01(a.t / a.dur);
      this.rot = a.from + a.delta * easeInOut(p);
      if (p >= 1) { this.anim = null; a.resolve(true); }
    }
    for (const L of this.locks) {
      const sp = 4.5;
      if (L.slide < L.target) L.slide = Math.min(L.target, L.slide + dt * sp);
      else if (L.slide > L.target) L.slide = Math.max(L.target, L.slide - dt * sp);
    }
    if (this.apexAnim >= 0) {
      this.apexAnim += dt * 2.6;
      if (this.apexAnim >= 1) this.apexAnim = -1;
    }
    if (this.irisOpen !== this.irisTarget) {
      const d = Math.sign(this.irisTarget - this.irisOpen) * dt * this.irisSpeed;
      this.irisOpen = clamp01(this.irisOpen + d);
      if (Math.abs(this.irisOpen - this.irisTarget) < 0.01) this.irisOpen = this.irisTarget;
    }
    if (this.mode === "burst") this.burstT += dt;
    if (this.mode === "collapse") this.collapseT += dt;
    this.activeGlow = clamp01(this.activeGlow +
      ((this.mode === "active" || this.mode === "burst") ? dt * 0.8 : -dt * 1.2));
    for (const g of this.glints) g.t += dt;
    this.glints = this.glints.filter((g) => g.t < 1.4);
    for (const r of this.ripples) { r.r += r.v * dt; r.a -= dt * 0.35; }
    this.ripples = this.ripples.filter((r) => r.a > 0 && r.r < HORIZON_R * 1.1);
  }

  // ---------- render ----------
  render(t) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 920, 920);
    ctx.save();
    ctx.translate(CX, CY);

    this._ambientGlow(ctx);
    this._conduit(ctx, t);
    this._iris(ctx);
    this._collar(ctx);
    this._glyphBand(ctx, t);
    this._hull(ctx);
    this._locks(ctx, t);
    if (this.mode === "burst") this._burstPlume(ctx, t);

    ctx.restore();
  }

  _ambientGlow(ctx) {
    if (this.activeGlow <= 0.01) return;
    const g = ctx.createRadialGradient(0, 0, HORIZON_R * 0.4, 0, 0, 460);
    g.addColorStop(0, `rgba(88,200,255,${0.16 * this.activeGlow})`);
    g.addColorStop(1, "rgba(88,200,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-460, -460, 920, 920);
  }

  // ----- the wormhole surface -----
  _conduit(ctx, t) {
    let R = 0;
    let brightness = 1;
    if (this.mode === "burst") {
      R = HORIZON_R * clamp01(this.burstT / 0.5);
      brightness = 1.4;
    } else if (this.mode === "active") {
      R = HORIZON_R;
    } else if (this.mode === "collapse") {
      const p = clamp01(this.collapseT / 1.1);
      R = HORIZON_R * (1 - easeInOut(p));
      brightness = 1 + p * 1.6;
    } else return;
    if (R < 2) return;

    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();

    // base pool
    const base = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    base.addColorStop(0, "#d9f1ff");
    base.addColorStop(0.3, "#79bfe8");
    base.addColorStop(0.68, "#1c5c8c");
    base.addColorStop(1, "#082036");
    ctx.fillStyle = base;
    ctx.fillRect(-R, -R, R * 2, R * 2);

    // counter-rotating shimmer layers
    const s = (HORIZON_R * 2.5) / 512;
    ctx.globalCompositeOperation = "lighter";
    ctx.save();
    ctx.rotate(t * 0.12);
    ctx.globalAlpha = 0.5 * brightness;
    ctx.scale(s, s);
    ctx.drawImage(this.noiseA, -256, -256);
    ctx.restore();
    ctx.save();
    ctx.rotate(-t * 0.19 + 1.7);
    ctx.globalAlpha = 0.38 * brightness;
    ctx.scale(s * 1.6, s * 1.6);
    ctx.drawImage(this.noiseB, -256, -256);
    ctx.restore();

    // slow outward ripple rings
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const rr = ((t * 34 + i * 73) % HORIZON_R);
      if (rr > R) continue;
      ctx.globalAlpha = 0.14 * (1 - rr / HORIZON_R) * brightness;
      ctx.strokeStyle = "#cfeaff";
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke();
    }

    // user probe ripples
    for (const r of this.ripples) {
      ctx.globalAlpha = Math.max(0, r.a);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    // darkened rim for depth
    const rim = ctx.createRadialGradient(0, 0, R * 0.82, 0, 0, R);
    rim.addColorStop(0, "rgba(2,10,20,0)");
    rim.addColorStop(1, "rgba(2,10,20,0.75)");
    ctx.fillStyle = rim;
    ctx.fillRect(-R, -R, R * 2, R * 2);
    ctx.restore();

    // glowing edge ring
    ctx.save();
    ctx.strokeStyle = `rgba(140,225,255,${0.85 * Math.min(brightness, 1.4)})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = "#7fdcff";
    ctx.shadowBlur = 26;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  // ----- sealing iris (12 steel plates) -----
  _iris(ctx) {
    if (this.irisOpen > 0.985) return;
    const ap = this.irisOpen * (HORIZON_R + 2);
    const n = 12, skew = 0.34;
    const twist = (1 - this.irisOpen) * 0.45;
    ctx.save();
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * TAU + twist;
      const a1 = a0 + TAU / n;
      ctx.beginPath();
      ctx.arc(0, 0, HORIZON_R + 4, a0, a1);
      ctx.arc(0, 0, ap, a1 + skew, a0 + skew, true);
      ctx.closePath();
      const g = ctx.createRadialGradient(0, 0, ap, 0, 0, HORIZON_R + 4);
      g.addColorStop(0, "#0c1117");
      g.addColorStop(0.55, "#2b3644");
      g.addColorStop(0.85, "#1c242f");
      g.addColorStop(1, "#2f3a48");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = "#05080d";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // specular edge along each plate's leading side
      ctx.strokeStyle = "rgba(122,146,172,0.28)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a0 + skew * 0.5) * (ap + 4), Math.sin(a0 + skew * 0.5) * (ap + 4));
      ctx.lineTo(Math.cos(a0) * (HORIZON_R + 2), Math.sin(a0) * (HORIZON_R + 2));
      ctx.stroke();
      // rivet at the plate's outer corner
      ctx.fillStyle = "#0b1016";
      ctx.beginPath();
      ctx.arc(Math.cos(a0 + 0.13) * (HORIZON_R - 14), Math.sin(a0 + 0.13) * (HORIZON_R - 14), 3.4, 0, TAU);
      ctx.fill();
    }
    // centre boss when nearly sealed
    if (this.irisOpen < 0.15) {
      ctx.globalAlpha = 1 - this.irisOpen / 0.15;
      ctx.fillStyle = "#1a222d";
      ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#0a0f16"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  _annulus(ctx, rOut, rIn, fill) {
    ctx.beginPath();
    ctx.arc(0, 0, rOut, 0, TAU);
    ctx.arc(0, 0, rIn, 0, TAU, true);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  _collar(ctx) {
    const g = ctx.createRadialGradient(0, 0, COLLAR_IN, 0, 0, COLLAR_OUT);
    g.addColorStop(0, "#0d1117");
    g.addColorStop(0.5, "#222b36");
    g.addColorStop(1, "#12171f");
    this._annulus(ctx, COLLAR_OUT, COLLAR_IN, g);
    ctx.strokeStyle = "#39434f"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, 0, COLLAR_IN + 1, 0, TAU); ctx.stroke();
    // guide lights aligned with clamps
    for (let k = 0; k < LOCK_COUNT; k++) {
      const a = APEX + (k / LOCK_COUNT) * TAU;
      const L = this.locks[k];
      const x = Math.cos(a) * 291, y = Math.sin(a) * 291;
      ctx.save();
      if (L.lit === "amber") { ctx.fillStyle = "#ffb454"; ctx.shadowColor = "#ffb454"; ctx.shadowBlur = 10; }
      else if (L.lit === "cyan") { ctx.fillStyle = "#6fe2ff"; ctx.shadowColor = "#6fe2ff"; ctx.shadowBlur = 10; }
      else ctx.fillStyle = "#1a232e";
      ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  _glyphBand(ctx, t) {
    const g = ctx.createRadialGradient(0, 0, GLYPH_IN, 0, 0, GLYPH_OUT);
    g.addColorStop(0, "#0a0e14");
    g.addColorStop(0.5, "#101720");
    g.addColorStop(1, "#0b1016");
    this._annulus(ctx, GLYPH_OUT, GLYPH_IN, g);

    ctx.save();
    ctx.rotate(this.rot);
    // divider spokes
    ctx.strokeStyle = "#1b2430";
    ctx.lineWidth = 2;
    for (let i = 0; i < GLYPH_COUNT; i++) {
      const a = (i + 0.5) * STEP;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * GLYPH_IN, Math.sin(a) * GLYPH_IN);
      ctx.lineTo(Math.cos(a) * GLYPH_OUT, Math.sin(a) * GLYPH_OUT);
      ctx.stroke();
    }
    // glyphs
    for (let i = 0; i < GLYPH_COUNT; i++) {
      const a = i * STEP;
      ctx.save();
      ctx.rotate(a);
      ctx.translate(RG, 0);
      ctx.rotate(Math.PI / 2);
      const glint = this.glints.find((gl) => gl.idx === i);
      if (this.lockedSymbols.has(i)) {
        drawGlyph(ctx, i, 56, "#ffc46e", 14);
      } else if (glint) {
        const a2 = Math.sin(Math.min(1, glint.t / 1.4) * Math.PI);
        drawGlyph(ctx, i, 56, "#7f93a8");
        ctx.globalAlpha = a2;
        drawGlyph(ctx, i, 56, "#9fe8ff", 12);
        ctx.globalAlpha = 1;
      } else {
        drawGlyph(ctx, i, 56, this.activeGlow > 0.3 ? "#93aabf" : "#7f93a8");
      }
      ctx.restore();
    }
    ctx.restore();
  }

  _hull(ctx) {
    const g = ctx.createRadialGradient(0, 0, HULL_IN, 0, 0, HULL_OUT);
    g.addColorStop(0, "#1a222c");
    g.addColorStop(0.45, "#333e4c");
    g.addColorStop(1, "#171d26");
    this._annulus(ctx, HULL_OUT, HULL_IN, g);
    ctx.strokeStyle = "#465262"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, HULL_OUT - 1, 0, TAU); ctx.stroke();
    ctx.strokeStyle = "#2a3441"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, HULL_IN + 1, 0, TAU); ctx.stroke();
    // tick notches
    ctx.strokeStyle = "#222b36"; ctx.lineWidth = 2;
    for (let i = 0; i < GLYPH_COUNT; i++) {
      const a = i * STEP;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (HULL_OUT - 12), Math.sin(a) * (HULL_OUT - 12));
      ctx.lineTo(Math.cos(a) * (HULL_OUT - 3), Math.sin(a) * (HULL_OUT - 3));
      ctx.stroke();
    }
    // rivets
    ctx.fillStyle = "#0e1319";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + TAU / 24;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 420, Math.sin(a) * 420, 4, 0, TAU);
      ctx.fill();
    }
  }

  _locks(ctx, t) {
    for (let k = 0; k < LOCK_COUNT; k++) {
      const a = APEX + (k / LOCK_COUNT) * TAU;
      const L = this.locks[k];
      let slide = L.slide;
      if (k === 0 && this.apexAnim >= 0) slide = Math.max(slide, Math.sin(this.apexAnim * Math.PI));

      ctx.save();
      ctx.rotate(a);

      // housing (radial +x is outward)
      ctx.beginPath();
      ctx.moveTo(398, -34);
      ctx.lineTo(458, -22);
      ctx.lineTo(458, 22);
      ctx.lineTo(398, 34);
      ctx.closePath();
      const hg = ctx.createLinearGradient(398, 0, 458, 0);
      hg.addColorStop(0, "#1a212b");
      hg.addColorStop(0.5, "#2c3642");
      hg.addColorStop(1, "#171d25");
      ctx.fillStyle = hg;
      ctx.fill();
      ctx.strokeStyle = "#3d4956"; ctx.lineWidth = 1.6; ctx.stroke();

      // sliding tooth
      const dx = -22 * slide;
      ctx.beginPath();
      ctx.moveTo(414 + dx, -14);
      ctx.lineTo(414 + dx, 14);
      ctx.lineTo(398 + dx, 14);
      ctx.lineTo(382 + dx, 0);
      ctx.lineTo(398 + dx, -14);
      ctx.closePath();
      ctx.fillStyle = "#3a4550";
      ctx.fill();
      ctx.strokeStyle = "#4d5a68"; ctx.lineWidth = 1.4; ctx.stroke();

      // indicator core
      let core = "#241d12", glow = 0;
      if (L.lit === "amber") { core = "#ffb454"; glow = 16; }
      else if (L.lit === "cyan") {
        const pulse = 0.75 + 0.25 * Math.sin(t * 3 + k);
        core = `rgba(111,226,255,${pulse})`; glow = 18;
      }
      if (k === 0 && this.apexAnim >= 0) { core = "#ffffff"; glow = 22; }
      ctx.save();
      if (glow) { ctx.shadowColor = typeof core === "string" && core.startsWith("rgba") ? "#6fe2ff" : core; ctx.shadowBlur = glow; }
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.moveTo(438, -8); ctx.lineTo(448, 0); ctx.lineTo(438, 8); ctx.lineTo(428, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }
  }

  // ----- ignition plume (drawn above the ring for overshoot) -----
  _burstPlume(ctx, t) {
    const DUR = 1.7;
    const p = clamp01(this.burstT / DUR);
    let R;
    if (p < 0.5) R = HORIZON_R * (0.15 + 1.55 * easeOut(p / 0.5));
    else R = HORIZON_R * (1.7 - 0.7 * easeInOut((p - 0.5) / 0.5));
    const fade = p < 0.85 ? 1 : 1 - (p - 0.85) / 0.15;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.9 * fade;

    // turbulent blob outline
    ctx.beginPath();
    const N = 72;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * TAU;
      const w = 1 + 0.16 * Math.sin(a * 5 + t * 13) + 0.09 * Math.sin(a * 9 - t * 21);
      const r = R * w;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.15);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.4, "rgba(160,230,255,0.75)");
    g.addColorStop(0.8, "rgba(70,170,230,0.35)");
    g.addColorStop(1, "rgba(40,120,200,0)");
    ctx.fillStyle = g;
    ctx.fill();

    // hot core
    ctx.globalAlpha = 0.8 * fade;
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.45);
    cg.addColorStop(0, "rgba(255,255,255,1)");
    cg.addColorStop(1, "rgba(220,245,255,0)");
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.45, 0, TAU); ctx.fill();

    ctx.restore();
  }
}
