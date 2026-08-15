// sim.js — AUGUR state machine. All physics/state are closed-form functions of
// wall-clock time; rendering chases this and is never load-bearing.

export const RATIOS = [[1,1],[3,2],[4,3],[5,3],[5,4],[7,4],[8,5]];

export const DESTS = [
  { id: 'TR-02', name: 'CANDLE WAKE',  a: 5, b: 4, phase: 81  },
  { id: 'TR-03', name: 'VELA REACH',   a: 3, b: 2, phase: 36  },
  { id: 'TR-05', name: 'MIRROR SOUND', a: 8, b: 5, phase: 291 },
  { id: 'TR-06', name: 'ANVIL DEEP',   a: 7, b: 4, phase: 156 },
  { id: 'TR-07', name: 'QUIET VERGE',  a: 4, b: 3, phase: 117 },
  { id: 'TR-09', name: 'HIGH TARN',    a: 5, b: 3, phase: 204 },
];

export const PHASE_CLICK_STEP = 6; // degrees advanced per knob click (a hand-turned notch)
export const PHASE_TOL = 3;        // degrees either side to begin latch
export const PHASE_HOLD = 8;       // AFC holds latch within this
export const LATCH_MS = 900;       // sustained in-tolerance time to latch
export const WARMUP_MS = 2500;     // HT rise time
export const OPEN_MS = 2200;       // figure -> ring morph
export const COLLAPSE_MS = 1400;
export const BLEED_MS = 90_000;    // aperture stands this long before mesh bleed
export const BLEED_WARN_MS = 75_000;
export const STORE_MAX = 4;

const now = () => performance.now();

export const state = {
  power: false, powerAt: 0, htReady: false,
  ratioIdx: 0,
  phase: 210,                       // knob value, degrees 0..360
  register: null,                   // destIdx shown as graticule mask, or null
  latch: null,                      // { destIdx, at } once AFC captures
  latchPendingAt: null,
  live: null,                       // { destIdx, at, source: 'struck'|'recalled' }
  slots: [],                        // storage mesh: [{ destIdx, at }]
  coverOpen: false,
  energize: false,
  aperture: { st: 'closed', t0: 0, destIdx: null },   // closed|opening|open|collapsing
  faultUntil: 0,
  bleedWarned: false,
  log: [],
};

const listeners = new Set();
export function onLog(fn) { listeners.add(fn); }

export function log(msg, cls = '') {
  const t = state.power ? (now() - state.powerAt) / 1000 : null;
  const stamp = t == null ? 'T ---:--' :
    `T+${String(Math.floor(t / 60)).padStart(3, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const entry = { stamp, msg, cls };
  state.log.push(entry);
  if (state.log.length > 80) state.log.splice(0, state.log.length - 80);
  listeners.forEach(fn => fn(entry));
}

function fault(msg) {
  state.faultUntil = now() + 2400;
  log(msg, 'warn');
}

const wrapDiff = (a, b) => {
  let d = (a - b) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
};

export function ratioMatchesDest(i) {
  const [a, b] = RATIOS[state.ratioIdx];
  const d = DESTS[i];
  return d.a === a && d.b === b;
}

function findTunedDest() {
  for (let i = 0; i < DESTS.length; i++) {
    if (ratioMatchesDest(i) && Math.abs(wrapDiff(state.phase, DESTS[i].phase)) <= PHASE_TOL) return i;
  }
  return null;
}

/* ------------------------------------------------ actions */

export function togglePower() {
  if (state.power) {
    cancelRecall('MAINS CUT');
    state.power = false; state.htReady = false;
    state.latch = null; state.latchPendingAt = null;
    state.live = null; state.register = null;
    state.energize = false; state.coverOpen = false;
    if (state.aperture.st !== 'closed') {
      state.aperture = { st: 'closed', t0: 0, destIdx: null };
    }
    // slots survive: the storage mesh holds its charge
    log('MAINS OFF — MESH RETAINS CHARGE');
  } else {
    state.power = true; state.powerAt = now(); state.htReady = false;
    state.bleedWarned = false;
    log('MAINS ON — HT RISING');
  }
}

// the FIGURE selector is a continuously-turning rotary switch: each click
// advances one detent and it wraps around indefinitely, like turning a real
// knob by hand — no end stop.
export function setRatioIdx(i) {
  if (!state.power) return;
  if (!servoActing) cancelRecall('MANUAL OVERRIDE');   // operator grabs the knob back
  i = ((i % RATIOS.length) + RATIOS.length) % RATIOS.length;
  if (i === state.ratioIdx) return;
  state.ratioIdx = i;
  breakLatch('FIGURE CHANGED');
}
export const nudgeRatio = d => setRatioIdx(state.ratioIdx + d);

export function setPhase(v) {
  if (!state.power) return;
  if (!servoActing) cancelRecall('MANUAL OVERRIDE');   // operator grabs the knob back
  state.phase = ((v % 360) + 360) % 360;
  if (state.latch && Math.abs(wrapDiff(state.phase, DESTS[state.latch.destIdx].phase)) > PHASE_HOLD) {
    breakLatch('PHASE PULLED OFF');
  }
}
export const nudgePhase = d => setPhase(state.phase + d);

function breakLatch(why) {
  state.latchPendingAt = null;
  if (state.latch) {
    log(`AFC RELEASED — ${why}`, 'warn');
    state.latch = null;
  }
}

export function setRegister(destIdx) {
  if (!state.power) return;
  state.register = state.register === destIdx ? null : destIdx;
  if (state.register != null) {
    const d = DESTS[destIdx];
    log(`GRATICULE MASK — ${d.id} ${d.name} (${d.a}:${d.b} +${String(d.phase).padStart(3, '0')})`);
  } else log('GRATICULE MASK CLEARED');
}

export function strike() {
  if (!state.power || !state.htReady) { fault('STRIKE REFUSED — HT NOT UP'); return false; }
  if (state.aperture.st !== 'closed') { fault('STRIKE REFUSED — MESH ENGAGED'); return false; }
  if (!state.latch) { fault('STRIKE REFUSED — NO AFC LATCH'); return false; }
  const destIdx = state.latch.destIdx;
  const existing = state.slots.findIndex(s => s.destIdx === destIdx);
  if (existing >= 0) {
    state.slots[existing].at = now();
    log(`TRACE RE-STRUCK — ${DESTS[destIdx].id} ${DESTS[destIdx].name}`, 'hot');
  } else {
    if (state.slots.length >= STORE_MAX) {
      const old = state.slots.shift();
      log(`MESH SATURATED — ${DESTS[old.destIdx].id} TRACE SHED`, 'warn');
    }
    state.slots.push({ destIdx, at: now() });
    log(`TRACE STRUCK INTO MESH — ${DESTS[destIdx].id} ${DESTS[destIdx].name}`, 'hot');
  }
  state.live = { destIdx, at: now(), source: 'struck' };
  return true;
}

// RECALL — the retained trace drives the AFC servo. The mesh can't repaint the
// deflection state wholesale: it feeds the stored figure to the oscillator's
// servo motors, which re-turn the FIGURE and PHASE controls at servo speed —
// far faster than hand-tuning, one detent/notch at a time — through the exact
// same setRatioIdx/setPhase path, the same tick() AFC latch (sustained-
// tolerance capture), and the same strike() commit a manual dial uses. It ends
// in the same struck-live state, and it NEVER throws ENERGIZE by itself.
export const RECALL_RATIO_STEP_MS = 150;  // servo detent cadence
export const RECALL_PHASE_STEP_MS = 45;   // servo notch cadence (6 deg per notch)

let recallRun = null;    // { timer } while the servo retune is driving
let servoActing = false; // true only while the servo itself turns a knob

export function recallActive() { return recallRun != null; }

export function cancelRecall(why) {
  if (!recallRun) return;
  clearTimeout(recallRun.timer);
  recallRun = null;
  if (why) log(`SERVO RETUNE ABANDONED — ${why}`, 'warn');
}

function servoTurn(fn) { servoActing = true; try { fn(); } finally { servoActing = false; } }

export function recall(slotIdx) {
  if (!state.power || !state.htReady) { fault('RECALL REFUSED — HT NOT UP'); return false; }
  if (state.aperture.st !== 'closed') { fault('RECALL REFUSED — MESH ENGAGED'); return false; }
  const slot = state.slots[slotIdx];
  if (!slot) return false;

  cancelRecall();
  const destIdx = slot.destIdx;
  const d = DESTS[destIdx];
  const targetRatioIdx = RATIOS.findIndex(([a, b]) => a === d.a && b === d.b);
  log(`MESH RECALL — ${d.id} ${d.name} — TRACE DRIVES AFC SERVO`, 'hot');

  const interlocked = () => {
    if (!state.power || !state.htReady || state.aperture.st !== 'closed') {
      recallRun = null;
      log('SERVO RETUNE ABANDONED — INTERLOCK', 'warn');
      return true;
    }
    return false;
  };

  const stepRatio = () => {
    if (!recallRun || interlocked()) return;
    if (state.ratioIdx !== targetRatioIdx) {
      const n = RATIOS.length;
      const fwd = (targetRatioIdx - state.ratioIdx + n) % n;
      servoTurn(() => nudgeRatio(fwd <= n - fwd ? 1 : -1));
      recallRun = { timer: setTimeout(stepRatio, RECALL_RATIO_STEP_MS) };
    } else {
      recallRun = { timer: setTimeout(stepPhase, RECALL_PHASE_STEP_MS) };
    }
  };

  const stepPhase = () => {
    if (!recallRun || interlocked()) return;
    const diff = wrapDiff(d.phase, state.phase);
    if (Math.abs(diff) > 0.01) {
      servoTurn(() => nudgePhase(Math.sign(diff) * Math.min(PHASE_CLICK_STEP, Math.abs(diff))));
      recallRun = { timer: setTimeout(stepPhase, RECALL_PHASE_STEP_MS) };
    } else {
      // in tolerance — the ordinary tick() AFC latch takes it from here
      recallRun = { timer: setTimeout(waitLatch, 100) };
    }
  };

  const waitLatch = () => {
    if (!recallRun || interlocked()) return;
    if (state.latch && state.latch.destIdx === destIdx) {
      recallRun = null;
      if (strike()) {
        state.live = { ...state.live, source: 'recalled' };
        log(`SERVO RETUNE COMPLETE — ${d.id} STANDING — AWAITING ENERGIZE`, 'hot');
      }
      return;
    }
    recallRun = { timer: setTimeout(waitLatch, 100) };
  };

  recallRun = { timer: setTimeout(stepRatio, RECALL_RATIO_STEP_MS) };
  return true;
}

export function toggleCover() {
  if (state.coverOpen && state.energize) { fault('COVER BLOCKED — SWITCH THROWN'); return; }
  state.coverOpen = !state.coverOpen;
  log(state.coverOpen ? 'ENERGIZE COVER RAISED' : 'ENERGIZE COVER SHUT');
}

export function setEnergize(on) {
  if (!state.coverOpen) return false;               // physically unreachable
  if (on) {
    if (!state.power || !state.htReady || !state.live || state.aperture.st !== 'closed') {
      fault('INTERLOCK — NO LIVE TRACE IN MESH');
      state.energize = false;                        // spring return
      return false;
    }
    state.energize = true;
    state.aperture = { st: 'opening', t0: now(), destIdx: state.live.destIdx };
    state.bleedWarned = false;
    log(`ENERGIZE — MESH FLOOD AT 2.4kV — ${DESTS[state.live.destIdx].id}`, 'hot');
  } else {
    state.energize = false;
    if (state.aperture.st === 'opening' || state.aperture.st === 'open') {
      state.aperture = { st: 'collapsing', t0: now(), destIdx: state.aperture.destIdx };
      log('DE-ENERGIZED — APERTURE COLLAPSING');
    }
  }
  return true;
}

/* ------------------------------------------------ tick */

export function tick(t = now()) {
  if (!state.power) return;

  if (!state.htReady && t - state.powerAt >= WARMUP_MS) {
    state.htReady = true;
    log('HT UP — MESH AT 2.4kV — TUBE READY');
  }

  // AFC latch detection (oscillator side)
  if (state.htReady && !state.latch && state.aperture.st === 'closed') {
    const i = findTunedDest();
    if (i == null) state.latchPendingAt = null;
    else if (state.latchPendingAt == null) state.latchPendingAt = t;
    else if (t - state.latchPendingAt >= LATCH_MS) {
      state.latch = { destIdx: i, at: t };
      state.latchPendingAt = null;
      const d = DESTS[i];
      log(`AFC LATCH — FIGURE STANDING — ${d.id} ${d.name}`, 'hot');
    }
  }

  // aperture lifecycle
  const ap = state.aperture;
  if (ap.st === 'opening' && t - ap.t0 >= OPEN_MS) {
    ap.st = 'open'; ap.t0 = t;
    log(`APERTURE STANDING — ${DESTS[ap.destIdx].id} ${DESTS[ap.destIdx].name}`, 'hot');
  } else if (ap.st === 'open') {
    if (!state.bleedWarned && t - ap.t0 >= BLEED_WARN_MS) {
      state.bleedWarned = true;
      log('MESH BLEED — TRACE DECAYING', 'warn');
    }
    if (t - ap.t0 >= BLEED_MS) {
      state.energize = false;                        // breaker drops
      ap.st = 'collapsing'; ap.t0 = t;
      log('BREAKER DROPPED — MESH BLED — APERTURE COLLAPSING', 'warn');
    }
  } else if (ap.st === 'collapsing' && t - ap.t0 >= COLLAPSE_MS) {
    state.aperture = { st: 'closed', t0: t, destIdx: null };
    state.live = null;
    log('TRACE SPENT — MESH CLEARED');
  }
}

/* ------------------------------------------------ derived helpers for render */

export function meshKv(t = now()) {
  if (!state.power) return 0;
  const u = Math.min(1, (t - state.powerAt) / WARMUP_MS);
  return 2.4 * (u * u * (3 - 2 * u));
}

export function currentRatio() { return RATIOS[state.ratioIdx]; }

export { wrapDiff };
