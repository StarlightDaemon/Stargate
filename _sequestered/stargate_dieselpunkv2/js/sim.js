// CARAVELLE simulation core.
// All continuous quantities are closed-form functions of wall-clock time;
// rendering chases them and a coarse setInterval backstop drives discrete
// transitions, so nothing dead-locks in a rAF-starved viewer.

import { DESTS } from './directory.js';

export const METRES_MIN = 150;
export const METRES_MAX = 350;
export const VERNIER_RANGE = 4;      // metres, full throw each way
export const LOCK_TOL = 0.35;        // metres — carrier capture window
export const WARM_MS = 4500;         // tube warm-up from cold
export const LINE_VOLTS = 117;
export const WARM_VOLTS = 105;       // lever refuses below this
export const SLEW_MS = 1250;         // presel cam slew duration
export const IRIS_MS = 1500;         // doorway bloom / shut

export const now = () => performance.now();

const easeInOut = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);

export const state = {
  lineOn: false, lineT: -1e9,        // last toggle time
  lineOffT: -1e9,
  band: 1,
  coarse: 251.3,                     // metres as left by the last porter
  slew: null,                        // {from,to,t0} presel cam slew
  slewBandFrom: null,
  vernier: 0.85,                     // metres offset, [-4, 4]
  engaged: false,
  engageT: -1e9, disengageT: -1e9,
  flash: null,                       // {text, cls, until} transient annunciator
  listeners: new Set(),
};

export function onEvent(fn) { state.listeners.add(fn); }
function emit(type, detail) { for (const fn of state.listeners) fn(type, detail); }

/* ---------- closed-form reads ---------- */

export function volts(t = now()) {
  const rise = easeInOut((t - state.lineT) / WARM_MS);
  const fall = easeInOut((t - state.lineOffT) / 2200);
  const base = state.lineOn ? rise : Math.max(0, 1 - fall);
  // gentle mains wander once warm
  const wander = base > 0.9
    ? Math.sin(t / 830) * 0.9 + Math.sin(t / 211 + 2) * 0.45 : 0;
  return base * LINE_VOLTS + wander;
}
export const warmed = (t = now()) => state.lineOn && volts(t) >= WARM_VOLTS;

export function coarseAt(t = now()) {
  if (!state.slew) return state.coarse;
  const k = easeInOut((t - state.slew.t0) / SLEW_MS);
  return state.slew.from + (state.slew.to - state.slew.from) * k;
}
export const tuned = (t = now()) => coarseAt(t) + state.vernier;

export function activeBeacon(t = now()) {
  let best = null, bestErr = Infinity;
  for (const d of DESTS) {
    if (d.band !== state.band) continue;
    const e = Math.abs(tuned(t) - d.metres);
    if (e < bestErr) { bestErr = e; best = d; }
  }
  return best ? { dest: best, err: bestErr } : null;
}

export function latched(t = now()) {
  if (!warmed(t) || state.slew) return null;
  const b = activeBeacon(t);
  return (b && b.err <= LOCK_TOL) ? b.dest : null;
}

// 0 = shut, 1 = full bloom
export function portalPhase(t = now()) {
  if (state.engaged) return easeInOut((t - state.engageT) / IRIS_MS);
  return 1 - easeInOut((t - state.disengageT) / IRIS_MS);
}

export function status(t = now()) {
  const f = state.flash;
  if (f && t < f.until) return { text: f.text, cls: f.cls };
  if (!state.lineOn) return { text: 'SALON CLOSED', cls: '' };
  if (!warmed(t)) return { text: 'TUBES WARMING…', cls: '' };
  if (state.engaged) {
    const d = state.engagedDest;
    return { text: `TRAVEL ESTABLISHED · ${d ? d.name.toUpperCase() : ''}`, cls: 'good' };
  }
  if (state.slew) return { text: 'PRESEL SLEWING…', cls: '' };
  const l = latched(t);
  if (l) return { text: `IN RESONANCE · ${l.name.toUpperCase()}`, cls: 'good' };
  return { text: 'READY — TUNE FOR CARRIER', cls: '' };
}

/* ---------- discrete actions (called by real input handlers) ---------- */

export function flash(text, cls = 'alert', ms = 1600) {
  state.flash = { text, cls, until: now() + ms };
  emit('flash');
}

export function toggleLine() {
  const t = now();
  if (state.lineOn) {
    state.lineOn = false; state.lineOffT = t;
    if (state.engaged) disengage();      // pulling the plug drops the doorway
    emit('lineoff');
  } else {
    state.lineOn = true; state.lineT = t;
    emit('lineon');
  }
}

function tuningLocked() {
  if (state.engaged) { flash('CONDENSER LOCKED — DOORWAY OPEN'); return true; }
  return false;
}

export function setBand(b) {
  if (tuningLocked()) return;
  const nb = ((b % 3) + 3) % 3;
  if (nb === state.band) return;
  state.band = nb;
  emit('band');
}

export function setCoarse(m) {
  if (tuningLocked()) return;
  state.slew = null;                     // hand on the dial overrides the cams
  state.coarse = Math.min(METRES_MAX, Math.max(METRES_MIN, m));
  emit('tune');
}

export function setVernier(v) {
  if (tuningLocked()) return;
  state.vernier = Math.min(VERNIER_RANGE, Math.max(-VERNIER_RANGE, v));
  emit('tune');
}

export function pressPresel(dest) {
  if (!state.lineOn) { flash('LINE OFF'); return false; }
  if (tuningLocked()) return false;
  const t = now();
  state.coarse = coarseAt(t);            // freeze any prior slew at its position
  state.band = dest.band;
  state.vernier = 0;                     // cam bar zeroes the vernier gang
  state.slew = { from: state.coarse, to: dest.metres, t0: t };
  emit('presel', dest);
  return true;
}

export function pullLever() {
  const t = now();
  if (state.engaged) {                   // raise lever → close doorway
    disengage();
    return { ok: true, closed: true };
  }
  if (!state.lineOn) { flash('LINE OFF'); return { ok: false, why: 'LINE OFF' }; }
  if (!warmed(t))   { flash('TUBES WARMING…'); return { ok: false, why: 'WARMING' }; }
  const dest = latched(t);
  if (!dest) { flash('NO CARRIER'); return { ok: false, why: 'NO CARRIER' }; }
  state.engaged = true;
  state.engageT = t;
  state.engagedDest = dest;
  emit('engage', dest);
  return { ok: true, dest };
}

function disengage() {
  if (!state.engaged) return;
  state.engaged = false;
  state.disengageT = now();
  emit('disengage');
}

/* ---------- backstop tick: settle finished slews ---------- */
export function tick(t = now()) {
  if (state.slew && t - state.slew.t0 >= SLEW_MS) {
    state.coarse = state.slew.to;
    state.slew = null;
    emit('slewdone');
  }
}
setInterval(() => tick(), 250);
