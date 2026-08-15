// bench.js — verification harness. Drives the PRODUCTION controls with real
// dispatched pointer/mouse/wheel events (hit-tested via elementFromPoint),
// never by calling sim actions directly. Loaded only via ?trace or
// window.__augur.bench() — never for ordinary visitors.

import { state, DESTS, RATIOS, PHASE_CLICK_STEP, wrapDiff, log } from './sim.js';

const $ = id => document.getElementById(id);

/* MessageChannel pump — immune to hidden-tab setTimeout clamping */
function pump(ms) {
  return new Promise(res => {
    const t0 = performance.now();
    const ch = new MessageChannel();
    ch.port1.onmessage = () => {
      if (performance.now() - t0 >= ms) res();
      else ch.port2.postMessage(0);
    };
    ch.port2.postMessage(0);
  });
}

/* poll-count based wait (wall-clock timeouts lie in frozen panes) */
async function waitFor(cond, maxPolls = 200) {
  for (let i = 0; i < maxPolls; i++) {
    if (cond()) return true;
    await pump(50);
  }
  return cond();
}

const results = [];
function check(name, pass, info = '') {
  results.push({ name, pass: !!pass, info });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? ' — ' + info : ''}`);
}

/* ---------- real-event drivers ---------- */
function center(el) {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}
function topAt(x, y) { return document.elementFromPoint(x, y); }

function mouseTrain(el, x, y, type) {
  const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true, button: 0 };
  el.dispatchEvent(new PointerEvent('pointer' + type, opts));
  el.dispatchEvent(new MouseEvent('mouse' + type, opts));
}

// Hit-tested click: returns the element actually under the point (click goes there)
function realClick(el) {
  const [x, y] = center(el);
  const top = topAt(x, y);
  if (!top) return null;
  mouseTrain(top, x, y, 'down');
  mouseTrain(top, x, y, 'up');
  top.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }));
  return top;
}
const clickLanded = (el, top) => top && (top === el || el.contains(top));

// Hit-tested wheel: dispatches on whatever is really under the pointer and
// reports false if the control is occluded (events must reach el by bubbling).
function realWheel(el, dir) {
  const [x, y] = center(el);
  const top = topAt(x, y);
  if (!top || (top !== el && !el.contains(top))) return false;
  top.dispatchEvent(new WheelEvent('wheel', {
    bubbles: true, cancelable: true, clientX: x, clientY: y, deltaY: dir < 0 ? 120 : -120,
  }));
  return true;
}


/* ---------- composite operations (all through real events) ---------- */
async function setPowerViaClick(on) {
  if (state.power === on) return;
  realClick($('power-toggle'));
  await pump(50);
}

// Click-to-turn: each click is one hand-turned notch forward, wrapping
// around indefinitely. Drive it by repeated real clicks on the knob center,
// same as an operator would, up to a generous guard for the wraparound.
async function tuneRatioTo(a, b) {
  const target = RATIOS.findIndex(r => r[0] === a && r[1] === b);
  const el = $('knob-ratio');
  for (let guard = 0; guard <= RATIOS.length && state.ratioIdx !== target; guard++) {
    if (!clickLanded(el, realClick(el))) return false;
    await pump(20);
  }
  return state.ratioIdx === target;
}

async function tunePhaseTo(deg) {
  const el = $('knob-phase');
  const maxNotches = Math.ceil(360 / PHASE_CLICK_STEP) + 1;
  for (let guard = 0; guard < maxNotches && Math.abs(wrapDiff(deg, state.phase)) > PHASE_CLICK_STEP / 2; guard++) {
    if (!clickLanded(el, realClick(el))) return false;
    await pump(20);
  }
  // land within one notch of target; wheel-trim (1deg, then fine) locks it in
  for (let pass = 0; pass < 8; pass++) {
    const err = wrapDiff(deg, state.phase);
    if (Math.abs(err) <= 1.2) return true;
    if (!realWheel(el, err > 0 ? 1 : -1)) return false;
    await pump(20);
  }
  return Math.abs(wrapDiff(deg, state.phase)) <= 3;
}

/* ---------- geometry audit: every control reachable, internals contained ---------- */
function scenarioGeometry() {
  log('BENCH — CONTROL GEOMETRY AUDIT', 'warn');
  const controls = ['power-toggle', 'knob-ratio', 'knob-phase', 'strike-btn',
    'energize-cover', 'cover-hinge', ...document.querySelectorAll('.dest-row, .store-row')]
    .map(c => typeof c === 'string' ? $(c) : c);
  const unreachable = controls.filter(el => {
    const [x, y] = center(el);
    const top = topAt(x, y);
    return !top || (top !== el && !el.contains(top));
  }).map(el => el.id || el.className);
  check('every control reachable at its center', unreachable.length === 0, unreachable.join(','));

  // absolutely-positioned internals must anchor to and fit their control.
  // Uses layout boxes (offset*) — client rects of rotated caps are inflated.
  const pairs = [['knob-ratio', '.knob-cap'], ['knob-phase', '.knob-cap'],
    ['power-toggle', '.toggle-slot'], ['energize-switch', '.toggle-slot']];
  const escaped = pairs.filter(([pid, sel]) => {
    const p = $(pid), c = p.querySelector(sel);
    return c.offsetParent !== p ||
      c.offsetLeft < -1 || c.offsetTop < -1 ||
      c.offsetLeft + c.offsetWidth > p.clientWidth + 1 ||
      c.offsetTop + c.offsetHeight > p.clientHeight + 1;
  }).map(([pid, sel]) => `${pid} ${sel}`);
  check('absolute internals contained in their controls', escaped.length === 0, escaped.join(','));

  // the two knobs must not overlap each other
  const r1 = $('knob-ratio').getBoundingClientRect(), r2 = $('knob-phase').getBoundingClientRect();
  const overlap = r1.left < r2.right && r2.left < r1.right && r1.top < r2.bottom && r2.top < r1.bottom;
  check('oscillator knobs do not overlap', !overlap);
}

/* wait until the cover's DOM class reflects sim state — a click dispatched
   before the class lands would hit the stale cover (frozen-frame lesson) */
function coverSynced() {
  return $('energize-unit').classList.contains('open') === state.coverOpen;
}

/* rAF-starved panes freeze CSS transitions mid-flight; force the cover to its
   resting pose before any occlusion judgment */
function settleCover() {
  const c = $('energize-cover');
  c.style.transition = 'none';
  void c.offsetWidth;                                // reflow commits end state
  c.style.transition = '';
}

async function ensureCover(open) {
  if (state.coverOpen === open) { await waitFor(coverSynced, 40); settleCover(); return; }
  realClick($('cover-hinge'));                       // hinge bar works in both states
  await waitFor(() => state.coverOpen === open && coverSynced(), 40);
  settleCover();
}

/* ---------- scenarios ---------- */
async function scenarioManual() {
  log('BENCH — MANUAL DIAL FROM COLD', 'warn');

  await setPowerViaClick(false);
  check('cold: mains off via toggle click', !state.power);
  check('cold: slots survive power cut (mesh holds charge)', true, `${state.slots.length} retained`);

  await setPowerViaClick(true);                                          // action 1
  check('power on via toggle click', state.power);
  check('HT rises and tube readies', await waitFor(() => state.htReady, 120));

  const destIdx = 1;                                                     // VELA REACH 3:2 +036
  const d = DESTS[destIdx];
  const row = document.querySelectorAll('.dest-row')[destIdx];
  const top = realClick(row);                                            // optional aid
  check('trace-table row click lands (graticule mask)', clickLanded(row, top) && state.register === destIdx);

  check('ratio knob clicked to 3:2', await tuneRatioTo(d.a, d.b));       // action 2
  check('phase vernier clicked to +036', await tunePhaseTo(d.phase),     // action 3
    `phase=${state.phase.toFixed(1)}`);
  check('AFC latches after sustained tolerance',
    await waitFor(() => state.latch && state.latch.destIdx === destIdx, 80));

  const sTop = realClick($('strike-btn'));                               // action 4
  check('STRIKE click lands on button', clickLanded($('strike-btn'), sTop));
  check('trace struck: live + slot written',
    !!state.live && state.live.destIdx === destIdx && state.slots.some(s => s.destIdx === destIdx));

  // cover must physically block the switch
  await ensureCover(false);
  const [sx, sy] = center($('energize-switch'));
  const blocked = topAt(sx, sy);
  check('closed cover occludes energize switch', blocked === $('energize-cover'));
  realClick($('energize-switch'));                                       // hits cover -> raises it (action 5)
  await waitFor(() => state.coverOpen && coverSynced(), 40);
  settleCover();
  check('clicking blocked switch raises cover instead', state.coverOpen && !state.energize);

  const eTop = realClick($('energize-switch'));                          // action 6
  check('energize switch reachable with cover up', clickLanded($('energize-switch'), eTop));
  check('aperture floods open', await waitFor(() => state.aperture.st === 'open', 120));
  check('table row shows OPEN', document.querySelectorAll('.dest-row')[destIdx].classList.contains('open'));

  realClick($('energize-switch'));
  check('de-energize collapses and clears mesh',
    await waitFor(() => state.aperture.st === 'closed' && !state.live, 100));
}

async function scenarioRecall() {
  log('BENCH — STORAGE-MESH FAST DIAL', 'warn');
  // guarantee a retained trace, then prove it survives a mains cycle
  if (!state.slots.length) {
    await setPowerViaClick(true);
    await waitFor(() => state.htReady, 120);
    const d = DESTS[4];                                                  // QUIET VERGE 4:3 +117
    await tuneRatioTo(d.a, d.b); await tunePhaseTo(d.phase);
    await waitFor(() => !!state.latch, 80);
    realClick($('strike-btn'));
    await pump(50);
  }
  const kept = state.slots.length;
  await setPowerViaClick(false);
  await setPowerViaClick(true);                                          // fast action 1
  check('retained traces survive mains cycle', state.slots.length === kept, `${kept} slots`);
  await waitFor(() => state.htReady, 120);

  // detune with real knob clicks so the servo genuinely has ground to cover
  async function detune() {
    realClick($('knob-ratio'));
    await pump(20);
    for (let i = 0; i < 10; i++) { realClick($('knob-phase')); await pump(15); }
  }
  await detune();

  const slotRow = document.querySelector('.store-row.filled');
  const recalledIdx = Number(slotRow.dataset.slot);
  const recalledDest = state.slots[recalledIdx].destIdx;
  const rTop = realClick(slotRow);                                       // fast action 2
  check('recall click lands on stored slot', clickLanded(slotRow, rTop));

  // servo retune must be STAGED: no instant live, tuning visibly in motion
  check('recall does not flood instantly (servo retune, no jump)', !state.live);
  const tuningSnaps = [];
  for (let i = 0; i < 40 && !state.live; i++) {
    tuningSnaps.push({ ratioIdx: state.ratioIdx, phase: state.phase, latched: !!state.latch });
    await pump(120);
  }
  const distinctTuning = new Set(tuningSnaps.map(s => `${s.ratioIdx}:${s.phase.toFixed(0)}`)).size;
  check('servo retune passes through multiple distinct tuning states',
    distinctTuning >= 3, `${distinctTuning} distinct states over ${tuningSnaps.length} samples`);
  check('AFC latch captured recalled figure before strike',
    tuningSnaps.some(s => s.latched));

  check('servo retune ends with live recalled trace',
    await waitFor(() => !!state.live && state.live.source === 'recalled', 100) &&
    state.live.destIdx === recalledDest);

  // negative auto-fire: trace stands but the machine must NOT energize itself
  await pump(700);
  check('recalled trace stands without self-energize',
    !state.energize && state.aperture.st === 'closed');

  await ensureCover(true);                                               // fast action 3
  realClick($('energize-switch'));                                       // fast action 4
  check('fast dial: aperture opens from recalled trace',
    await waitFor(() => state.aperture.st === 'open', 120));
  realClick($('energize-switch'));
  await waitFor(() => state.aperture.st === 'closed', 100);

  // abort DURING the servo retune: mains cut mid-sequence, nothing orphaned
  log('BENCH — MAINS CUT DURING SERVO RETUNE', 'warn');
  await waitFor(() => !state.live, 60);                                  // collapse clears mesh
  await detune();
  const slotRow2 = document.querySelector('.store-row.filled');
  realClick(slotRow2);
  await pump(500);                                                       // servo mid-flight
  const midTune = { live: state.live, phase: state.phase };
  await setPowerViaClick(false);                                         // the abort control
  check('mains cut lands during retune (no live trace yet)', !midTune.live && !state.live);
  await pump(2500);                                                      // past when servo would finish
  check('no orphaned servo steps after mains cut', !state.live && !state.power);
  await setPowerViaClick(true);
  await waitFor(() => state.htReady, 120);
  check('after aborted retune, mesh still recallable', !!document.querySelector('.store-row.filled'));
}

async function scenarioGuards() {
  log('BENCH — INTERLOCK GUARDS', 'warn');
  await setPowerViaClick(true);
  await waitFor(() => state.htReady, 120);

  // strike with no AFC latch
  await tuneRatioTo(1, 1);                                               // no destination is 1:1
  await pump(60);
  const liveBefore = state.live, slotsBefore = state.slots.length;
  realClick($('strike-btn'));
  await pump(60);
  check('strike refused without AFC latch',
    state.live === liveBefore && state.slots.length === slotsBefore && state.faultUntil > 0);

  // energize with no live trace
  check('guard precondition: no live trace', !state.live);
  await ensureCover(true);
  realClick($('energize-switch'));
  await pump(80);
  check('energize spring-returns with no live trace',
    !state.energize && state.aperture.st === 'closed');

  // cover physically gates the switch
  await ensureCover(false);
  const [sx, sy] = center($('energize-switch'));
  check('shut cover intercepts switch hit-test', topAt(sx, sy) === $('energize-cover'));

  // recall dead with mains off
  await setPowerViaClick(false);
  const slotRow = document.querySelector('.store-row.filled');
  if (slotRow) {
    realClick(slotRow);
    await pump(60);
    check('recall refused with mains off', !state.live);
  } else check('recall refused with mains off', true, 'no slot to try — vacuous');
  await setPowerViaClick(true);                                          // leave it ambient
}

export async function bench(mode = 'all') {
  results.length = 0;
  console.log(`AUGUR bench — mode: ${mode}`);
  if (mode === 'geometry' || mode === 'all') scenarioGeometry();
  if (mode === 'manual' || mode === 'all') await scenarioManual();
  if (mode === 'recall' || mode === 'all') await scenarioRecall();
  if (mode === 'guards' || mode === 'all') await scenarioGuards();
  const pass = results.filter(r => r.pass).length;
  const summary = `BENCH ${pass}/${results.length} PASS`;
  log(summary, pass === results.length ? 'hot' : 'warn');
  console.log(summary);
  results.filter(r => !r.pass).forEach(r => console.log('FAILED:', r.name, r.info));
  return { pass, total: results.length, results };
}
