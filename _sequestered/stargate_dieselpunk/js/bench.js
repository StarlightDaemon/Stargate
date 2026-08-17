// bench.js — shakedown harness. NEVER runs for a live visitor; only via
// ?shakedown[=crystal|manual|guards|all] or window.__stentor.shakedown().
//
// Verification rules honoured here (hard-learned in this build line):
// - every interaction is a REAL dispatched event train (pointerdown/up/click,
//   or pointermove sequences for wheels) aimed at the production element
// - before any hit-test, render(now()) is called so the DOM is current
// - the click target is validated with document.elementFromPoint: if some
//   other element is sitting on top, that is a FAIL, not a workaround
// - toggle controls are read before clicking (ensure, don't blind-toggle)

import * as sim from './sim.js';
import { S, now, destById } from './sim.js';
import { render } from './main.js';

const results = [];
let chit = null;

function log(msg, cls = '') {
  console.log('[shakedown] ' + msg);
  if (!chit) {
    chit = document.createElement('div');
    chit.id = 'shakedown-chit';
    document.getElementById('viewport').appendChild(chit);
  }
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = msg;
  chit.appendChild(line);
  chit.scrollTop = chit.scrollHeight;
}
function pass(msg) { results.push([true, msg]); log('PASS  ' + msg, 'pass'); }
function fail(msg) { results.push([false, msg]); log('FAIL  ' + msg, 'fail'); }

// MessageChannel-based sleep: hidden-tab setTimeout clamps to 1s (then ~1/min
// under intensive throttling), which would stretch dispatched event trains
// beyond recognition. MessageChannel hops are not throttled. Bench-only.
const sleep = (ms) => new Promise((res) => {
  const target = performance.now() + ms;
  const ch = new MessageChannel();
  ch.port1.onmessage = () => {
    if (performance.now() >= target) { ch.port1.close(); res(); }
    else ch.port2.postMessage(0);
  };
  ch.port2.postMessage(0);
});

async function waitFor(fn, timeoutS, label) {
  // freeze-tolerant: count live polls rather than wall-clock alone, so a
  // renderer freeze (pane hidden/closed mid-run) can't expire a wait while
  // no polling was actually possible
  const maxPolls = Math.ceil(timeoutS * 10);
  for (let i = 0; i < maxPolls; i++) {
    sim.tick();
    if (fn()) return true;
    await sleep(100);
  }
  sim.tick();
  if (fn()) return true;
  fail(`timeout ${timeoutS}s waiting: ${label}`);
  return false;
}

function centerOf(elm) {
  render(now());
  const r = elm.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}

function fire(target, type, x, y) {
  const common = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, button: 0 };
  let ev;
  if (type.startsWith('pointer')) ev = new PointerEvent(type, { ...common, pointerId: 7, pointerType: 'mouse', isPrimary: true });
  else ev = new MouseEvent(type, common);
  target.dispatchEvent(ev);
}

// hit-tested click on the production element
function realClick(elm, label) {
  const [x, y] = centerOf(elm);
  const hit = document.elementFromPoint(x, y);
  if (!hit || !(elm === hit || elm.contains(hit))) {
    fail(`click ${label}: elementFromPoint hit ${hit ? (hit.id || hit.tagName) : 'nothing'} — target occluded`);
    return false;
  }
  fire(hit, 'pointerdown', x, y);
  fire(hit, 'pointerup', x, y);
  fire(hit, 'click', x, y);
  return true;
}

async function holdPointer(elm, ms, label) {
  const [x, y] = centerOf(elm);
  const hit = document.elementFromPoint(x, y);
  if (!hit || !(elm === hit || elm.contains(hit))) {
    fail(`hold ${label}: target occluded by ${hit ? (hit.id || hit.tagName) : 'nothing'}`);
    return false;
  }
  fire(hit, 'pointerdown', x, y);
  await sleep(ms);
  fire(hit, 'pointerup', x, y);
  return true;
}

// drag a rotary control through deltaDeg using real pointermove train
async function dragRotate(elm, deltaDeg, label) {
  const r = elm.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const rad = Math.max(20, r.width * 0.32);
  const pos = (deg) => [cx + rad * Math.cos(deg * Math.PI / 180), cy + rad * Math.sin(deg * Math.PI / 180)];
  render(now());
  let a = -90;
  let [x, y] = pos(a);
  const hit = document.elementFromPoint(x, y);
  if (!hit || !(elm === hit || elm.contains(hit))) {
    fail(`drag ${label}: grip point occluded by ${hit ? (hit.id || hit.tagName) : 'nothing'}`);
    return false;
  }
  fire(hit, 'pointerdown', x, y);
  const steps = Math.max(4, Math.ceil(Math.abs(deltaDeg) / 12));
  for (let i = 1; i <= steps; i++) {
    a = -90 + deltaDeg * (i / steps);
    [x, y] = pos(a);
    fire(elm, 'pointermove', x, y);
    await sleep(16);
  }
  fire(elm, 'pointerup', x, y);
  return true;
}

const $ = (id) => document.getElementById(id);

// ensure a toggle is in the wanted state (read state first, never blind-click)
async function ensure(id, current, want, label) {
  if (current === want) return true;
  const ok = realClick($(id), label);
  await sleep(120);
  return ok;
}

// return the machine to cold & safe, whatever state it is in
async function makeSafe() {
  sim.tick();
  if (S.contactor) { realClick($('contactor-lever'), 'contactor(open)'); }
  await waitFor(() => S.arc === 'dead', 4, 'arc dead');
  if (S.crystalId) { realClick($('xtal-socket'), 'socket(remove)'); await sleep(120); }
  await ensure('clutch-lever', S.clutch, false, 'clutch(out)');
  await ensure('fuel-cock', S.fuelOpen, false, 'fuel(shut)');
  realClick($('reset-button'), 'reset');
  if (S.notch !== 0) realClick($('gov-notch-0'), 'governor idle');
  await waitFor(() => sim.rpmAt() < 25, 25, 'engine stopped');
  S.order = null; S.vernierKc = 0; // bench-only tidy between scenarios
}

async function startEngine() {
  await ensure('fuel-cock', S.fuelOpen, true, 'fuel(open)');
  if (!S.fuelOpen) return false;
  await holdPointer($('air-lever'), 2000, 'air-start');
  const ok = await waitFor(() => S.dieselOn, 5, 'diesel catch');
  if (!ok) return false;
  await waitFor(() => sim.oilAt() >= 26, 12, 'oil pressure up');
  return true;
}

// ---------------------------------------------------------------- scenarios

async function scenCrystal() {
  log('--- CRYSTAL WORKING (fast dial): Halberd Bay ---');
  await makeSafe(); // cold-start isolation, even if a prior scenario aborted
  const t0 = now();
  if (!await startEngine()) return;
  await ensure('clutch-lever', S.clutch, true, 'clutch(in)');
  if (!S.clutch) { fail('clutch refused'); return; }
  realClick($('xtal-halberd'), 'crystal HB');
  await sleep(150);
  if (S.crystalId === 'halberd' && S.order === 'halberd') pass('crystal seated, order auto-posted');
  else { fail('crystal did not seat'); return; }

  if (!await waitFor(() => S.latched, 16, 'crystal latch')) return;
  pass('resonance latch (crystal bridge)');
  if (!await waitFor(() => S.aimed, 14, 'selsyn aim')) return;
  pass('goniometer laid by selsyn');

  realClick($('key-arm'), 'transmit key');
  if (!await waitFor(() => S.answered, 9, 'answer')) return;
  pass('HB answered');

  realClick($('contactor-lever'), 'contactor(close)');
  if (!await waitFor(() => S.arc === 'open', 4, 'arc open')) return;
  const dt = (now() - t0).toFixed(1);
  pass(`traction arc OPEN — crystal working took ${dt}s`);

  // diegetic readout check
  const kcTxt = $('kc-drum').textContent;
  if (kcTxt === '131.0') pass('carrier drum reads 131.0');
  else fail(`carrier drum reads ${kcTxt}, expected 131.0`);

  await sleep(1500);
  await makeSafe();
  pass('shutdown clean (crystal scenario)');
}

async function scenManual() {
  log('--- HAND TUNING (slow dial): Kettle Rapids ---');
  await makeSafe(); // cold-start isolation, even if a prior scenario aborted
  const t0 = now();
  const dest = destById('kettle');
  if (!await startEngine()) return;

  realClick($('ledger-row-kettle'), 'ledger KR');
  await sleep(150);
  if (S.order === 'kettle') pass('traffic order posted from ledger');
  else { fail('order not posted'); return; }

  await ensure('clutch-lever', S.clutch, true, 'clutch(in)');
  realClick($('gov-notch-7'), 'governor notch 7');
  await sleep(150);
  if (S.notch === 7) pass('governor at 840 band');
  else { fail('governor notch not taken'); return; }

  await waitFor(() => Math.abs(sim.rpmAt() - S.rpm.target) < 8, 30, 'run-up settle');

  // closed-loop zero-beat, like an operator watching the eye: after each
  // nudge, WAIT for the governor to settle before judging the beat — reading
  // mid-swing chases transients and overshoots
  let nulled = false;
  for (let i = 0; i < 10; i++) {
    await waitFor(() => Math.abs(sim.rpmAt() - S.rpm.target) < 1.2, 15, `governor settle #${i}`);
    sim.tick();
    const beat = sim.beatAt();
    if (beat === null) { fail('no carrier during hand tune'); return; }
    if (Math.abs(beat) < 0.09) { nulled = true; break; }
    const dDeg = Math.max(-130, Math.min(130, -beat * 90));
    await dragRotate($('vernier-wheel'), dDeg, `vernier ${dDeg.toFixed(0)}°`);
  }
  if (nulled) pass('beat nulled by hand on the vernier');
  else { fail('could not null the beat'); return; }
  // prove the null came from real vernier work, not a run-up transit
  if (Math.abs(S.vernierKc) > 0.4) pass(`vernier genuinely moved (${S.vernierKc.toFixed(2)} kc trim)`);
  else fail(`vernier barely moved (${S.vernierKc.toFixed(2)} kc) — null was not hand work`);

  if (!await waitFor(() => S.latched, 10, 'resonance latch (hand)')) return;
  pass('resonance latch took (hand tune)');

  // swing the goniometer by hand
  for (let i = 0; i < 10; i++) {
    sim.tick();
    const err = sim.angDiff(dest.brg, sim.bearingAt());
    if (Math.abs(err) < 2) break;
    await dragRotate($('gonio-card'), Math.max(-100, Math.min(100, err)), `gonio ${err.toFixed(0)}°`);
    await sleep(250);
  }
  if (!await waitFor(() => S.aimed, 8, 'aim dwell')) return;
  pass('goniometer laid by hand');

  realClick($('key-arm'), 'transmit key');
  if (!await waitFor(() => S.answered, 9, 'answer')) return;
  pass('KR answered');

  realClick($('contactor-lever'), 'contactor(close)');
  if (!await waitFor(() => S.arc === 'open', 4, 'arc open')) return;
  pass(`traction arc OPEN — hand tuning took ${(now() - t0).toFixed(1)}s`);

  await sleep(1500);
  await makeSafe();
  pass('shutdown clean (manual scenario)');
}

async function scenGuards() {
  log('--- INTERLOCKS & GUARDS ---');
  await makeSafe();

  // early contactor close must trip the overload
  realClick($('contactor-lever'), 'contactor early');
  await sleep(250); sim.tick();
  if (S.trips.early && !S.contactor) pass('early close tripped the overload');
  else fail('early close did not trip');

  realClick($('reset-button'), 'reset');
  await sleep(200); sim.tick();
  if (!S.trips.early) pass('overload reset at alarm board');
  else fail('reset did not clear trip');

  // clutch without oil must refuse + lamp
  realClick($('clutch-lever'), 'clutch w/o oil');
  await sleep(250); sim.tick();
  if (!S.clutch && S.trips.oil) pass('clutch refused without oil pressure');
  else fail('clutch interlock failed');
  realClick($('reset-button'), 'reset');

  // key with no order posted: must refuse quietly
  realClick($('key-arm'), 'key w/o order');
  await sleep(200); sim.tick();
  if (!S.keying) pass('key refused with no traffic order');
  else fail('key ran with no order');

  // no-reply path: key while untuned (post order but stay cold)
  realClick($('ledger-row-vellum'), 'ledger PV');
  await sleep(150);
  realClick($('key-arm'), 'key untuned');
  const ok = await waitFor(() => S.noReplyAt !== null, 9, 'no-reply verdict');
  if (ok) pass('untuned call correctly got NO REPLY');
  await makeSafe();
}

export async function shakedown(which = 'all') {
  results.length = 0;
  log(`SHAKEDOWN START (${which}) — visibility=${document.visibilityState}`);
  const t0 = now();
  try {
    if (which === 'crystal' || which === 'all') await scenCrystal();
    if (which === 'manual' || which === 'all') await scenManual();
    if (which === 'guards' || which === 'all') await scenGuards();
  } catch (e) {
    fail('exception: ' + (e && e.message));
    console.error(e);
  }
  const bad = results.filter(r => !r[0]).length;
  log(`SHAKEDOWN DONE in ${(now() - t0).toFixed(1)}s — ${results.length - bad}/${results.length} passed`,
      bad ? 'fail' : 'pass');
  return { passed: results.length - bad, failed: bad, results: results.map(([ok, m]) => (ok ? 'PASS ' : 'FAIL ') + m) };
}
