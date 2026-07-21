// sim.js — STENTOR state machine and physics.
//
// Design rule (learned the hard way in this build line): all continuous
// quantities (rpm, oil pressure, bearing) are CLOSED-FORM functions of
// wall-clock time. Rendering chases them; nothing gates on a rendered value.
// tick() only flips booleans whose predicates are pure functions of time,
// so a starved timer still lands every transition correctly, just late.

import { approach, slew, clamp } from './util.js';

// ---------------------------------------------------------------- destinations
// carrier kc/s = rpm / 5  (1,440 pole shoes, in-universe)
export const DESTS = [
  { id: 'vellum',   name: 'PORT VELLUM',        call: 'PV',  kc: 97.0,  brg: 67,  crystal: true,
    note: 'coastal freight terminus · tide traffic' },
  { id: 'karst',    name: 'KARST JUNCTION',     call: 'KJ',  kc: 104.7, brg: 312, crystal: false,
    note: 'cavern interchange · unscheduled' },
  { id: 'anthr',    name: 'ANTHRACITE SHELF',   call: 'AS',  kc: 118.4, brg: 141, crystal: true,
    note: 'colliery head · coal & crews' },
  { id: 'halberd',  name: 'HALBERD BAY YARD',   call: 'HB',  kc: 131.0, brg: 203, crystal: true,
    note: 'naval yard · priority traffic' },
  { id: 'wireless', name: 'WIRELESS HILL RLY',  call: 'WH',  kc: 142.6, brg: 25,  crystal: true,
    note: 'relay platform · Board service' },
  { id: 'semaph',   name: 'SEMAPHORE FLATS',    call: 'SF',  kc: 155.3, brg: 258, crystal: false,
    note: 'abandoned 1927 · signature drifts · hand tune only' },
  // NB: keep dest rpm (kc*5) at least ~3 rpm off the governor notch, or the
  // run-up transits the latch window slowly enough to latch with no hand work
  { id: 'kettle',   name: 'KETTLE RAPIDS',      call: 'KR',  kc: 167.0, brg: 96,  crystal: false,
    note: 'hydro plant · record span 1929' },
];
export const destById = (id) => DESTS.find(d => d.id === id);

// governor quadrant speed bands (notch 0 = idle)
export const NOTCH_RPM = [300, 480, 540, 600, 660, 720, 780, 840];

// tunables
export const IDLE_RPM = 300;
export const CRANK_CATCH_S = 1.4;
export const OIL_MIN_CLUTCH = 25;
export const LATCH_KC = 0.15;      // beat threshold for resonance latch
export const LATCH_BREAK_KC = 0.5;
export const LATCH_DWELL_S = 2.0;
export const XTAL_DWELL_S = 0.8;
export const AIM_TOL_DEG = 4;
export const AIM_DWELL_S = 1.2;
export const KEY_DUR_S = 3.6;      // coder drum run
export const ANSWER_DELAY_S = 1.6;
export const STRIKE_S = 0.9;
export const COLLAPSE_S = 1.3;
export const XTAL_SLEW = 55;       // rpm/s, crystal-bridge servo (dead-beat)
export const SELSYN_RATE = 35;     // deg/s
export const VERNIER_KC = 6;       // ± range

export const now = () => performance.now() / 1000;

// ---------------------------------------------------------------- state
export const S = {
  fuelOpen: false,
  cranking: false, crankT0: 0,
  dieselOn: false,
  clutch: false,
  notch: 0,
  vernierKc: 0,                       // -6..+6
  crystalId: null,
  rpm: { v0: 0, target: 0, t0: 0, mode: 'approach', tau: 3.0, hunt: 0 },
  oil: { v0: 0, target: 0, t0: 0, tau: 3.0 },
  bearing: { v0: 200, t0: 0, target: 200, rate: 0 }, // rate 0 = parked (manual)
  order: null,                        // posted destination id
  latched: false, latchArmedAt: null,
  aimed: false, aimArmedAt: null,
  keying: false, keyT0: 0, keyForOrder: null,
  answered: false, noReplyAt: null,
  contactor: false, contactorT0: 0,
  arc: 'dead',                        // dead | striking | open | collapsing
  arcT0: 0,
  trips: { oil: false, early: false, carrier: false },
  audioOn: true,
};

// event listeners: fn(type, detail)
const listeners = [];
export function onEvent(fn) { listeners.push(fn); }
function emit(type, detail) { for (const fn of listeners) fn(type, detail); }

// ---------------------------------------------------------------- physics
export function rpmAt(t = now()) {
  const r = S.rpm;
  let v;
  if (r.mode === 'slew') v = slew(r.v0, r.target, r.t0, XTAL_SLEW, t);
  else v = approach(r.v0, r.target, r.t0, r.tau, t);
  if (r.hunt > 0 && r.mode === 'approach') {
    const dt = t - r.t0;
    v += r.hunt * Math.exp(-dt / 6) * Math.sin(2 * Math.PI * 0.3 * dt);
  }
  return Math.max(0, v);
}
export function kcAt(t = now()) { return S.clutch && S.dieselOn ? rpmAt(t) / 5 : 0; }
export function oilAt(t = now()) { return Math.max(0, approach(S.oil.v0, S.oil.target, S.oil.t0, S.oil.tau, t)); }
export function bearingAt(t = now()) {
  const b = S.bearing;
  if (b.rate > 0) return slew(b.v0, b.target, b.t0, b.rate, t);
  return b.v0;
}
export function beatAt(t = now()) {
  const d = destById(S.order);
  if (!d) return null;
  const kc = kcAt(t);
  if (kc <= 0) return null;
  return kc - d.kc; // signed, kc/s
}
export function angDiff(a, b) {
  let d = ((a - b) % 360 + 540) % 360 - 180;
  return d;
}

function retarget(struct, target, mode) {
  const t = now();
  struct.v0 = (struct === S.rpm) ? rpmAt(t) : (struct === S.oil ? oilAt(t) : struct.v0);
  struct.t0 = t;
  struct.target = target;
  if (mode) struct.mode = mode;
}

function governorTarget() {
  if (!S.dieselOn) return 0;
  const xd = destById(S.crystalId);
  if (xd) return xd.kc * 5;                       // crystal bridge: grind-exact
  const base = NOTCH_RPM[S.notch];
  return S.notch === 0 ? base : base + S.vernierKc * 5;
}

function applyGovernor(stepCause) {
  const t = now();
  const tgt = governorTarget();
  const cur = rpmAt(t);
  S.rpm.v0 = cur; S.rpm.t0 = t; S.rpm.target = tgt;
  if (S.crystalId && S.dieselOn) {
    S.rpm.mode = 'slew'; S.rpm.hunt = 0;          // dead-beat servo
  } else {
    S.rpm.mode = 'approach';
    S.rpm.tau = S.dieselOn ? 3.2 : 5.0;
    // governor hunting on big manual steps only
    S.rpm.hunt = (stepCause === 'notch') ? Math.min(14, Math.abs(tgt - cur) * 0.06) : 0;
  }
}

// ---------------------------------------------------------------- actions
export function setFuel(open) {
  if (S.fuelOpen === open) return;
  S.fuelOpen = open;
  if (!open && S.dieselOn) {
    S.dieselOn = false;
    applyGovernor();
    retarget(S.oil, 0); S.oil.tau = 4.0;
    emit('diesel-stop');
  }
  emit('fuel', open);
}

export function crankStart() {
  if (S.dieselOn || S.cranking) return;
  S.cranking = true; S.crankT0 = now();
  // air motor spins the engine over
  const t = now();
  S.rpm.v0 = rpmAt(t); S.rpm.t0 = t; S.rpm.target = 85; S.rpm.mode = 'approach';
  S.rpm.tau = 0.9; S.rpm.hunt = 0;
  emit('crank-start');
}

export function crankEnd() {
  if (!S.cranking) return;
  S.cranking = false;
  if (!S.dieselOn) { applyGovernor(); emit('crank-end'); }
}

export function setClutch(on) {
  if (S.clutch === on) return;
  if (on) {
    if (!S.dieselOn || oilAt() < OIL_MIN_CLUTCH) {
      S.trips.oil = true;
      emit('trip', 'oil');
      return;
    }
  }
  S.clutch = on;
  emit('clutch', on);
  if (!on) breakLatch('declutched');
}

export function setNotch(n) {
  n = clamp(Math.round(n), 0, NOTCH_RPM.length - 1);
  if (S.crystalId) return; // quadrant is servo-held under crystal override
  if (S.notch === n) return;
  S.notch = n;
  applyGovernor('notch');
  emit('notch', n);
}

export function nudgeVernier(dKc) {
  if (S.crystalId) return;
  const v = clamp(S.vernierKc + dKc, -VERNIER_KC, VERNIER_KC);
  if (v === S.vernierKc) return;
  S.vernierKc = v;
  applyGovernor('vernier');
}

export function setBearing(deg) {
  const t = now();
  S.bearing.v0 = ((deg % 360) + 360) % 360;
  S.bearing.t0 = t;
  if (!S.crystalId) { S.bearing.rate = 0; S.bearing.target = S.bearing.v0; }
  // under crystal: selsyn will re-slew from the disturbed position (tick)
}

export function postOrder(destId) {
  if (!destById(destId)) return;
  if (S.order === destId) return;
  S.order = destId;
  S.answered = false; S.noReplyAt = null;
  S.latched = false; S.latchArmedAt = null;
  S.aimed = false; S.aimArmedAt = null;
  emit('order', destId);
}

export function insertCrystal(destId) {
  const d = destById(destId);
  if (!d || !d.crystal) return;
  if (S.crystalId === destId) return;
  S.crystalId = destId;
  postOrder(destId);
  applyGovernor();
  // selsyn repeater lays the goniometer on
  const t = now();
  S.bearing.v0 = bearingAt(t); S.bearing.t0 = t;
  S.bearing.target = d.brg; S.bearing.rate = SELSYN_RATE;
  emit('crystal', destId);
}

export function removeCrystal() {
  if (!S.crystalId) return;
  S.crystalId = null;
  S.bearing.v0 = bearingAt(); S.bearing.t0 = now();
  S.bearing.rate = 0; S.bearing.target = S.bearing.v0;
  applyGovernor();
  emit('crystal', null);
}

export function pressKey() {
  if (S.keying) return;
  if (!S.order) { emit('key-refused'); return; }
  S.keying = true; S.keyT0 = now(); S.keyForOrder = S.order;
  S.noReplyAt = null;
  emit('key-down');
}

export function toggleContactor() {
  const t = now();
  if (!S.contactor) {
    if (!S.answered) {
      // overload trip — spring-opens, must reset
      S.trips.early = true;
      S.contactor = false;
      emit('trip', 'early');
      return;
    }
    if (S.trips.early || S.trips.carrier) { emit('contactor-blocked'); return; }
    S.contactor = true; S.contactorT0 = t;
    S.arc = 'striking'; S.arcT0 = t;
    emit('contactor', true);
  } else {
    S.contactor = false; S.contactorT0 = t;
    if (S.arc === 'open' || S.arc === 'striking') { S.arc = 'collapsing'; S.arcT0 = t; }
    emit('contactor', false);
  }
}

export function resetTrips() {
  const had = S.trips.oil || S.trips.early || S.trips.carrier;
  S.trips.oil = S.trips.early = S.trips.carrier = false;
  if (had) emit('reset');
}

function breakLatch(reason) {
  if (S.latched || S.answered) {
    S.latched = false; S.latchArmedAt = null;
    S.answered = false;
    if (S.arc === 'open' || S.arc === 'striking') {
      S.trips.carrier = true;
      S.contactor = false;
      S.arc = 'collapsing'; S.arcT0 = now();
      emit('trip', 'carrier');
    }
    emit('latch-lost', reason);
  }
}

// ---------------------------------------------------------------- tick
export function tick() {
  const t = now();

  // diesel catch
  if (S.cranking && S.fuelOpen && !S.dieselOn && t - S.crankT0 >= CRANK_CATCH_S) {
    S.dieselOn = true;
    S.cranking = false;
    applyGovernor();
    retarget(S.oil, 42); S.oil.tau = 3.0;
    emit('diesel-catch');
  }

  // resonance latch
  const d = destById(S.order);
  const beat = beatAt(t);
  if (d && beat !== null) {
    const settled = Math.abs(rpmAt(t) - S.rpm.target) < 6;
    const inWin = Math.abs(beat) < LATCH_KC && settled && S.clutch && S.dieselOn;
    const dwell = S.crystalId ? XTAL_DWELL_S : LATCH_DWELL_S;
    if (!S.latched) {
      if (inWin) {
        if (S.latchArmedAt === null) S.latchArmedAt = t;
        else if (t - S.latchArmedAt >= dwell) { S.latched = true; emit('latch'); }
      } else S.latchArmedAt = null;
    } else if (Math.abs(beat) > LATCH_BREAK_KC || !S.clutch || !S.dieselOn) {
      breakLatch('beat');
    }
  } else if (S.latched || S.answered) {
    breakLatch('carrier');
  }

  // aim dwell
  if (d) {
    const err = Math.abs(angDiff(bearingAt(t), d.brg));
    if (err <= AIM_TOL_DEG) {
      if (S.aimArmedAt === null) S.aimArmedAt = t;
      if (t - S.aimArmedAt >= AIM_DWELL_S && !S.aimed) { S.aimed = true; emit('aim'); }
    } else {
      S.aimArmedAt = null;
      if (S.aimed) {
        S.aimed = false;
        if (S.answered) breakLatch('aim');
        emit('aim-lost');
      }
    }
  }

  // keying → answer
  if (S.keying && t - S.keyT0 >= KEY_DUR_S) {
    S.keying = false;
    emit('key-up');
  }
  if (!S.keying && S.keyT0 > 0 && !S.answered && S.noReplyAt === null) {
    const done = S.keyT0 + KEY_DUR_S + ANSWER_DELAY_S;
    if (t >= done && S.keyForOrder) {
      if (S.latched && S.aimed && S.keyForOrder === S.order) {
        S.answered = true;
        emit('answer');
      } else {
        S.noReplyAt = t;
        emit('no-reply');
      }
      S.keyForOrder = null;
    }
  }

  // arc lifecycle
  if (S.arc === 'striking' && t - S.arcT0 >= STRIKE_S) { S.arc = 'open'; emit('arc-open'); }
  if (S.arc === 'collapsing' && t - S.arcT0 >= COLLAPSE_S) { S.arc = 'dead'; emit('arc-dead'); }

  // crystal selsyn: re-assert after manual disturbance
  if (S.crystalId) {
    const xd = destById(S.crystalId);
    if (S.bearing.rate === 0 && Math.abs(angDiff(bearingAt(t), xd.brg)) > 0.5) {
      S.bearing.v0 = bearingAt(t); S.bearing.t0 = t;
      S.bearing.target = xd.brg; S.bearing.rate = SELSYN_RATE;
    }
  }

  // arc dies if carrier collapses under it (handled in breakLatch), and the
  // whole answer chain needs the machine alive:
  if ((S.answered || S.latched) && (!S.dieselOn || !S.clutch)) breakLatch('machine');
}

// convenience for lamps/renderers
export function lampState() {
  const t = now();
  return {
    oilOk: oilAt(t) >= OIL_MIN_CLUTCH,
    running: S.dieselOn,
    lock: S.latched,
    aim: S.aimed,
    answer: S.answered,
    arc: S.arc === 'open' || S.arc === 'striking',
    fault: S.trips.oil || S.trips.early || S.trips.carrier,
    xtal: !!S.crystalId,
  };
}
