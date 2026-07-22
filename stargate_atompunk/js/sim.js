// VANTAGE — Type 9 Aperture Surveillance & Induction Console
// Simulation core. All physics are closed-form functions of wall-clock time;
// rendering and interlocks chase the model, never the other way round.

export const SWEEP_PERIOD = 2400;   // ms per revolution
export const PAINTS_NEEDED = 3;     // sweep passes to build a firm track
export const CHALLENGE_MS = 1600;   // interrogator round-trip
export const RECALL_MS = 1300;      // drum replay / servo slew time
export const BEARING_STEP = 15;     // degrees per knob notch (24 notches)
export const RANGE_STEP = 25;       // miles per knob notch
export const RANGE_MIN = 25;
export const RANGE_MAX = 250;
export const SLOT_COUNT = 4;

export const DESTS = [
  { id: 'able',    name: 'ABLE ORCHARD',  brg: 45,  rng: 100, code: '4172', friendly: true  },
  { id: 'baker',   name: 'BAKER LIGHT',   brg: 120, rng: 175, code: '8035', friendly: true  },
  { id: 'charlie', name: 'CHARLIE GLASS', brg: 255, rng: 200, code: '····', friendly: false },
  { id: 'dog',     name: 'DOG RIVER',     brg: 210, rng: 75,  code: '2691', friendly: true  },
  { id: 'easy',    name: 'EASY VAULT',    brg: 300, rng: 150, code: '7448', friendly: true  },
];

export function destById(id) { return DESTS.find(d => d.id === id) || null; }

export function makeState() {
  return {
    ht: false,          // high tension (scope power)
    htAtT: 0,           // wall-clock when HT came up; sweep phase reference
    bearingIdx: 0,      // cursor bearing = idx * BEARING_STEP
    rangeIdx: 3,        // gate range = RANGE_MIN + idx * RANGE_STEP
    track: null,        // { destId, startUnw } — sweep-paint accumulation anchor
    locked: false,
    challenge: null,    // { destId, untilT }
    verified: false,
    verifiedDest: null, // dest id whose signature is verified
    sig: null,          // signature shown on SIG nixies
    noJoy: false,       // dark station answered the interrogator
    coverOpen: false,
    induct: false,
    open: false,
    openedAtT: 0,
    fault: null,        // transient fault legend text
    faultUntilT: 0,
    slotIdx: 0,
    slots: new Array(SLOT_COUNT).fill(null), // { destId, brgIdx, rngIdx, sig }
    recall: null,       // { untilT, slot, fromBrgIdx, fromRngIdx }
    darkKnown: [],      // dest ids that have answered the interrogator darkly
  };
}

export function seedDrum(state) {
  // The day shift left ABLE ORCHARD's firing solution on the drum, slot 1.
  const d = destById('able');
  state.slots[0] = {
    destId: d.id,
    brgIdx: d.brg / BEARING_STEP,
    rngIdx: (d.rng - RANGE_MIN) / RANGE_STEP,
    sig: d.code,
  };
}

export function bearingOf(state) { return state.bearingIdx * BEARING_STEP; }
export function rangeOf(state) { return RANGE_MIN + state.rangeIdx * RANGE_STEP; }

// --- sweep geometry (closed form) -------------------------------------------
export function sweepUnwrapped(state, t) {
  if (!state.ht) return 0;
  return ((t - state.htAtT) / SWEEP_PERIOD) * 360;
}
export function sweepAngle(state, t) {
  return ((sweepUnwrapped(state, t) % 360) + 360) % 360;
}
// How many times has the sweep crossed bearing b between unwrapped angles u0..u1?
function crossings(u0, u1, b) {
  return Math.floor((u1 - b) / 360) - Math.floor((u0 - b) / 360);
}
export function paintsOf(state, t) {
  if (!state.track) return 0;
  const d = destById(state.track.destId);
  const u = sweepUnwrapped(state, t);
  return Math.max(0, Math.min(PAINTS_NEEDED, crossings(state.track.startUnw, u, d.brg)));
}
// Freshness of a blip's last paint, 1 = just painted, 0 = a full rev stale.
export function blipFreshness(state, t, brg) {
  if (!state.ht) return 0;
  const u = sweepUnwrapped(state, t);
  if (u < brg) return 0; // not yet painted since HT up
  const since = ((u - brg) % 360) / 360;
  return 1 - since;
}

// --- interlock helpers ------------------------------------------------------
function destAtGates(state) {
  const b = bearingOf(state), r = rangeOf(state);
  return DESTS.find(d => d.brg === b && d.rng === r) || null;
}
function clearSolution(state) {
  state.track = null;
  state.locked = false;
  state.verified = false;
  state.verifiedDest = null;
  state.sig = null;
  state.noJoy = false;
  state.challenge = null;
}
function retrack(state, t) {
  const d = destAtGates(state);
  state.track = d ? { destId: d.id, startUnw: sweepUnwrapped(state, t) } : null;
}
function fault(state, t, msg) {
  state.fault = msg;
  state.faultUntilT = t + 2200;
}
function busy(state) {
  return !!(state.challenge || state.recall || state.open);
}

// --- actions ----------------------------------------------------------------
export function setHT(state, t, on) {
  if (on === state.ht) return;
  if (state.open) { fault(state, t, 'APERTURE HOT'); return; } // no HT chop mid-open
  state.ht = on;
  if (on) {
    state.htAtT = t;
    retrack(state, t);
  } else {
    clearSolution(state);
    state.recall = null;
  }
}

export function stepBearing(state, t, dir) {
  if (!state.ht || busy(state)) return;
  state.bearingIdx = (state.bearingIdx + dir + 24) % 24;
  clearSolution(state);
  retrack(state, t);
}

export function stepRange(state, t, dir) {
  if (!state.ht || busy(state)) return;
  const n = (RANGE_MAX - RANGE_MIN) / RANGE_STEP + 1; // 10 positions
  state.rangeIdx = Math.max(0, Math.min(n - 1, state.rangeIdx + dir));
  clearSolution(state);
  retrack(state, t);
}

export function pressChallenge(state, t) {
  if (!state.ht || busy(state)) return;
  if (!state.locked || state.verified || state.noJoy) { fault(state, t, 'NO FIRM TRACK'); return; }
  state.challenge = { destId: state.track.destId, untilT: t + CHALLENGE_MS };
}

export function stepSlot(state, t, dir) {
  if (busy(state)) return;
  state.slotIdx = (state.slotIdx + dir + SLOT_COUNT) % SLOT_COUNT;
}

export function pressRecall(state, t) {
  if (!state.ht || busy(state)) return;
  const s = state.slots[state.slotIdx];
  if (!s) { fault(state, t, 'DRUM SLOT EMPTY'); return; }
  clearSolution(state);
  state.recall = {
    untilT: t + RECALL_MS,
    slot: state.slotIdx,
    fromBrgIdx: state.bearingIdx,
    fromRngIdx: state.rangeIdx,
  };
}

export function toggleCover(state, t) {
  state.coverOpen = !state.coverOpen;
}

export function setInduct(state, t, on) {
  if (on === state.induct) return;
  if (on) {
    if (!state.coverOpen) return; // physically unreachable; bench asserts this via hit-test
    if (!state.verified) { fault(state, t, 'SOLUTION NOT VERIFIED'); return; } // switch springs back
    state.induct = true;
    state.open = true;
    state.openedAtT = t;
  } else {
    state.induct = false;
    state.open = false;
    // solution survives shutdown — still locked & verified for a re-throw
  }
}

// --- time resolution --------------------------------------------------------
export function tick(state, t) {
  // firm track forms from accumulated paints
  if (state.track && !state.locked && paintsOf(state, t) >= PAINTS_NEEDED) {
    state.locked = true;
  }
  // interrogator round-trip resolves
  if (state.challenge && t >= state.challenge.untilT) {
    const d = destById(state.challenge.destId);
    state.challenge = null;
    if (d.friendly) {
      state.verified = true;
      state.verifiedDest = d.id;
      state.sig = d.code;
      autoStore(state, d);
    } else {
      state.noJoy = true;
      state.sig = '····';
      if (!state.darkKnown.includes(d.id)) state.darkKnown.push(d.id);
    }
  }
  // drum replay resolves — servo lays the gates, signature replays from the drum
  if (state.recall && t >= state.recall.untilT) {
    const s = state.slots[state.recall.slot];
    state.recall = null;
    state.bearingIdx = s.brgIdx;
    state.rangeIdx = s.rngIdx;
    const d = destById(s.destId);
    state.track = { destId: d.id, startUnw: sweepUnwrapped(state, t) - PAINTS_NEEDED * 360 };
    state.locked = true;
    state.verified = true;
    state.verifiedDest = d.id;
    state.sig = s.sig;
  }
  if (state.fault && t >= state.faultUntilT) state.fault = null;
}

function autoStore(state, d) {
  if (state.slots.some(s => s && s.destId === d.id)) return; // already on the drum
  let i = state.slots.findIndex(s => !s);
  if (i === -1) i = state.slotIdx; // drum full: overwrite the selected slot
  state.slots[i] = {
    destId: d.id,
    brgIdx: d.brg / BEARING_STEP,
    rngIdx: (d.rng - RANGE_MIN) / RANGE_STEP,
    sig: d.code,
  };
}

// Effective gate positions for rendering (interpolated during drum replay)
export function renderGates(state, t) {
  let brg = bearingOf(state), rng = rangeOf(state);
  if (state.recall) {
    const s = state.slots[state.recall.slot];
    const k = Math.max(0, Math.min(1, 1 - (state.recall.untilT - t) / RECALL_MS));
    const e = k * k * (3 - 2 * k); // smoothstep
    const fromB = state.recall.fromBrgIdx * BEARING_STEP;
    const toB = s.brgIdx * BEARING_STEP;
    let db = ((toB - fromB + 540) % 360) - 180; // shortest way round
    brg = ((fromB + db * e) % 360 + 360) % 360;
    const fromR = RANGE_MIN + state.recall.fromRngIdx * RANGE_STEP;
    const toR = RANGE_MIN + s.rngIdx * RANGE_STEP;
    rng = fromR + (toR - fromR) * e;
  }
  return { brg, rng };
}
