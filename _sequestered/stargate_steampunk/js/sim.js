/* The engine itself. All continuous quantities are CLOSED-FORM
   functions of wall-clock time; user actions only swap the reference
   parameters. Rendering chases this state and can stall or skip
   without ever deadlocking the machine (hard-won project lesson). */

import { now } from './clock.js';
import { matchCorrespondent, ROMANS } from './cards.js';

export const P = {
  AMBIENT: 9,
  OPEN_TARGET: 134,     // damper open, line closed
  WORKING_MIN: 100,
  WORKING_MAX: 148,
  COLLAPSE: 88,         // live line lapses below this
  MAX: 180,
};

const S = {
  damperOpen: false,
  press: { t0: 0, p0: P.AMBIENT, target: P.AMBIENT, tau: 120 },
  reader: null,        // { code, certified, name|null, libIdx|null }
  draw: null,          // { t0, cols: [{feelT, proveT|null, lockT}], certified }
  aperture: null,      // { t0, live, dest|null, openDur, maxOpen, closeT|null, closeDur, collapseT|null, retuned }
  coupling: false,
  punch: { value: 4, col: 0, code: [], lastStrikeT: -10, lastSetT: -10 },
  tray: null,          // finished uncertified card
  lastResetT: -10,     // annunciator flags return from here
  lastResetLocks: 0,   // how many flags were down when they reset
  ventT: -10,          // steam-burst FX reference
  log: [],
  logSeq: 0,
};

function pushLog(text) {
  S.log.push({ t: now(), text, seq: S.logSeq++ });
  if (S.log.length > 80) S.log.shift();
}

/* ---------------- pressure ---------------- */

export function pressureAt(t = now()) {
  const { t0, p0, target, tau } = S.press;
  return target + (p0 - target) * Math.exp(-(t - t0) / tau);
}

function lineDrawing(t) {
  return !!(S.aperture && S.aperture.live && apertureOpenness(t) > 0.05);
}

function retunePressure() {
  const t = now();
  const p0 = pressureAt(t);
  const drawing = lineDrawing(t);
  let target, tau;
  if (S.damperOpen) {
    target = P.OPEN_TARGET - (drawing ? 36 : 0);
    tau = drawing ? 14 : 6.5;
  } else {
    target = P.AMBIENT;
    tau = drawing ? 30 : 110;
  }
  S.press = { t0: t, p0, target, tau };
  scheduleCollapse();
}

/* Predict when a live line loses pressure — analytic, no watcher loop. */
function scheduleCollapse() {
  const a = S.aperture;
  if (!a || !a.live) return;
  const { t0, p0, target, tau } = S.press;
  if (p0 <= P.COLLAPSE) { a.collapseT = t0; return; }
  if (target >= P.COLLAPSE) { a.collapseT = null; return; }
  a.collapseT = t0 + tau * Math.log((p0 - target) / (P.COLLAPSE - target));
}

/* ---------------- aperture ---------------- */

const easeOut = (k) => 1 - Math.pow(1 - Math.min(Math.max(k, 0), 1), 3);
const easeIn  = (k) => Math.pow(Math.min(Math.max(k, 0), 1), 2);

function effectiveCloseT(a) {
  let t = Infinity;
  if (a.closeT != null) t = Math.min(t, a.closeT);
  if (a.collapseT != null) t = Math.min(t, a.collapseT);
  return t;
}

export function apertureOpenness(t = now()) {
  const a = S.aperture;
  if (!a) return 0;
  const end = effectiveCloseT(a);
  const rise = (tt) => a.maxOpen * easeOut((tt - a.t0) / a.openDur);
  if (t <= end) return rise(t);
  const atEnd = rise(end);
  const k = (t - end) / a.closeDur;
  return k >= 1 ? 0 : atEnd * (1 - easeIn(k));
}

/* Lazy finalization of ended events; called from render tick and
   from harness polls, so it also works in throttled hidden tabs. */
export function poll() {
  const t = now();
  const a = S.aperture;
  if (a) {
    if (a.live && !a.retuned && t > a.t0 + 1.0) { a.retuned = true; retunePressure(); }
    const end = effectiveCloseT(a);
    if (t > end + a.closeDur + 0.05) {
      const collapsed = a.collapseT != null && end === a.collapseT && a.closeT == null;
      S.aperture = null;
      S.coupling = false;
      if (S.draw) S.lastResetLocks = 6;
      S.draw = null;
      S.lastResetT = end;
      if (collapsed) {
        pushLog('PRESSURE LOST — THE CORRESPONDENCE LAPSED. RAISE STEAM AND VENT.');
        returnCard('lapse');
      } else if (!a.live) {
        pushLog('THE FAR END DOES NOT ANSWER — CARD RETURNED.');
        returnCard('dead');
      }
      retunePressure();
    }
  }
}

/* ---------------- card movement ---------------- */

function returnCard(_why) {
  const c = S.reader;
  if (!c) return;
  S.reader = null;
  if (c.libIdx == null) {
    if (!S.tray) S.tray = { code: c.code, certified: false, name: null };
    else pushLog('SPENT CARD DROPPED TO THE WASTE — THE TRAY IS FULL.');
  }
  /* library cards simply reappear in the rack (rack renders from state) */
}

/* ---------------- derived status ---------------- */

export function drawingAt(t = now()) {
  return !!(S.draw && t < S.draw.cols[5].lockT);
}
export function alignedAt(t = now()) {
  return !!(S.draw && t >= S.draw.cols[5].lockT);
}
export function locksAt(t = now()) {
  if (!S.draw) return 0;
  let n = 0;
  for (const c of S.draw.cols) if (t >= c.lockT) n++;
  return n;
}
export function provingColAt(t = now()) {
  if (!S.draw) return -1;
  for (let i = 0; i < 6; i++) {
    const c = S.draw.cols[i];
    if (t >= c.feelT && t < c.lockT) return i;
  }
  return -1;
}

/* ---------------- actions ---------------- */

function refuse(reason) { pushLog(reason); return { ok: false, reason }; }

export function toggleDamper() {
  S.damperOpen = !S.damperOpen;
  retunePressure();
  pushLog(S.damperOpen
    ? 'DAMPER OPEN — RAISING STEAM.'
    : 'DAMPER SHUT — BANKING THE FIRE.');
  return { ok: true };
}

export function insertLibrary(i, card) {
  const t = now();
  if (S.reader) return refuse('REFUSED — THE READER ALREADY HOLDS A CARD.');
  if (S.draw) return refuse('REFUSED — REGISTERS ARE ENGAGED. VENT FIRST.');
  if (apertureOpenness(t) > 0.01) return refuse('REFUSED — THE LINE IS OPEN. VENT FIRST.');
  S.reader = { code: [...card.code], certified: true, name: card.name, libIdx: i };
  pushLog(`CARD DRAWN FROM THE RACK — ${card.name} (CERTIFIED).`);
  return { ok: true };
}

export function insertTray() {
  const t = now();
  if (!S.tray) return refuse('REFUSED — THE OUT-TRAY IS EMPTY.');
  if (S.reader) return refuse('REFUSED — THE READER ALREADY HOLDS A CARD.');
  if (S.draw) return refuse('REFUSED — REGISTERS ARE ENGAGED. VENT FIRST.');
  if (apertureOpenness(t) > 0.01) return refuse('REFUSED — THE LINE IS OPEN. VENT FIRST.');
  S.reader = { ...S.tray, libIdx: null };
  S.tray = null;
  pushLog('COMPOSED CARD PRESENTED — UNCERTIFIED. THE PROVING PAWL STANDS.');
  return { ok: true };
}

export function eject() {
  const t = now();
  if (!S.reader) return refuse('REFUSED — NO CARD IN THE READER.');
  if (drawingAt(t)) return refuse('REFUSED — THE READER IS DRAWING.');
  if (apertureOpenness(t) > 0.01) return refuse('REFUSED — THE LINE IS OPEN. VENT FIRST.');
  if (S.reader.libIdx == null && S.tray) return refuse('REFUSED — CLEAR THE OUT-TRAY FIRST.');
  if (alignedAt(t)) { S.lastResetLocks = 6; S.draw = null; S.lastResetT = t; pushLog('REGISTERS STRUCK OFF.'); }
  const name = S.reader.name || 'THE COMPOSED CARD';
  returnCard('eject');
  pushLog(`${name} RETURNED.`);
  return { ok: true };
}

export function throwDraw() {
  const t = now();
  if (!S.reader) return refuse('REFUSED — NO CARD IN THE READER.');
  if (S.draw) return refuse(alignedAt(t)
    ? 'REFUSED — REGISTERS ALREADY IN CORRESPONDENCE.'
    : 'REFUSED — THE READER IS ALREADY DRAWING.');
  if (apertureOpenness(t) > 0.01) return refuse('REFUSED — THE LINE IS OPEN.');
  const p = pressureAt(t);
  if (p < P.WORKING_MIN) return refuse('REFUSED — PRESSURE WANTING. RAISE STEAM.');
  const certified = S.reader.certified;
  const cols = [];
  for (let i = 0; i < 6; i++) {
    if (certified) {
      const feelT = t + 0.5 + i * 0.75;
      cols.push({ feelT, proveT: null, lockT: feelT + 0.28 });
    } else {
      const feelT = t + 0.8 + i * 2.4;
      cols.push({ feelT, proveT: feelT + 0.95, lockT: feelT + 1.7 });
    }
  }
  S.draw = { t0: t, cols, certified };
  pushLog(certified
    ? 'DRAW — CERTIFICATION NOTCH FELT. PAWL LIFTED; RUNNING AT GOVERNOR SPEED.'
    : 'DRAW — NO NOTCH. PROVING PACE: EACH COLUMN STRUCK TWICE.');
  return { ok: true };
}

export function throwCoupling() {
  const t = now();
  if (S.aperture) return refuse('REFUSED — THE COUPLING IS ALREADY THROWN.');
  if (!alignedAt(t)) return refuse('REFUSED — REGISTERS NOT IN CORRESPONDENCE.');
  const p = pressureAt(t);
  if (p < P.WORKING_MIN) return refuse('REFUSED — PRESSURE WANTING. RAISE STEAM.');
  const dest = matchCorrespondent(S.reader.code);
  if (dest) {
    S.aperture = { t0: t, live: true, dest, openDur: 2.4, maxOpen: 1,
                   closeT: null, closeDur: 1.6, collapseT: null, retuned: false };
    S.coupling = true;
    scheduleCollapse();
    pushLog(`COUPLING THROWN — THE LEAVES PART. CORRESPONDENCE ESTABLISHED: ${dest.name}.`);
    pushLog(`ADVISORY — ${dest.advisory}`);
  } else {
    S.aperture = { t0: t, live: false, dest: null, openDur: 1.1, maxOpen: 0.26,
                   closeT: t + 3.2, closeDur: 0.9, collapseT: null, retuned: true };
    S.coupling = true;
    pushLog('COUPLING THROWN — THE LEAVES CRACK… NOTHING ANSWERS ON THE LINE.');
  }
  retunePressure();
  return { ok: true, live: !!dest };
}

export function vent() {
  const t = now();
  const a = S.aperture;
  if (a && effectiveCloseT(a) > t) a.closeT = t;
  if (S.draw) { S.lastResetLocks = locksAt(t); S.draw = null; S.lastResetT = t; }
  S.coupling = false;
  if (S.reader) returnCard('vent');
  S.ventT = t;
  retunePressure();
  pushLog('BLOWN DOWN — REGISTERS CLEARED, LINE SHUT, CARD RETURNED.');
  return { ok: true };
}

/* ---------------- punch ---------------- */

export function punchSetValue(v) {
  S.punch.value = v;
  S.punch.lastSetT = now();
  return { ok: true };
}

export function punchStrike() {
  if (S.tray) return refuse('REFUSED — CLEAR THE OUT-TRAY BEFORE COMPOSING.');
  const t = now();
  S.punch.code.push(S.punch.value);
  S.punch.lastStrikeT = t;
  const colDone = S.punch.code.length;
  pushLog(`STRUCK ${S.punch.value} IN COLUMN ${ROMANS[colDone - 1]}.`);
  if (colDone === 6) {
    S.tray = { code: [...S.punch.code], certified: false, name: null };
    S.punch.code = [];
    S.punch.col = 0;
    pushLog('CARD COMPOSED — SIX COLUMNS STRUCK. TAKE IT FROM THE OUT-TRAY.');
  } else {
    S.punch.col = colDone;
  }
  return { ok: true };
}

export function punchSpoil() {
  if (S.punch.code.length) {
    S.punch.code = []; S.punch.col = 0;
    pushLog('CARD SPOILED — A FRESH BLANK IS DRAWN.');
    return { ok: true };
  }
  if (S.tray) {
    S.tray = null;
    pushLog('TRAY CARD SPOILED.');
    return { ok: true };
  }
  return refuse('NOTHING TO SPOIL.');
}

/* ---------------- inspection ---------------- */

export function getState(t = now()) {
  return {
    t,
    pressure: pressureAt(t),
    damperOpen: S.damperOpen,
    reader: S.reader ? { ...S.reader } : null,
    tray: S.tray ? { ...S.tray } : null,
    drawing: drawingAt(t),
    aligned: alignedAt(t),
    locks: locksAt(t),
    drawCertified: S.draw ? S.draw.certified : null,
    coupling: S.coupling,
    openness: apertureOpenness(t),
    live: !!(S.aperture && S.aperture.live),
    dest: S.aperture && S.aperture.dest ? S.aperture.dest.name : null,
    apertureExists: !!S.aperture,
    punch: { value: S.punch.value, col: S.punch.col, code: [...S.punch.code] },
    logTail: S.log.slice(-5).map(l => l.text),
  };
}

/* raw refs the renderer needs (read-only by convention) */
export const refs = S;

pushLog('SHOP OPEN — BOILER COLD.');
pushLog('SET THE DAMPER TO RAISE STEAM.');
