/* Works trials — loaded ONLY with ?works in the URL. Never part of a
   visitor's experience.

   Every control interaction here is a REAL dispatched event train
   (pointerdown/mousedown/pointerup/mouseup/click) aimed at whatever
   element actually sits at the control's centre per elementFromPoint,
   so occlusion or missing listeners fail the trial instead of being
   masked by internal function calls. Waits use the MessageChannel
   timer shim so trials run even in a throttled hidden pane. */

import { now, shimDelay, shimWaitFor } from './clock.js';
import * as sim from './sim.js';
import { render } from './main.js';
import { CORRESPONDENTS } from './cards.js';

const $ = (sel) => document.querySelector(sel);

function realClick(sel) {
  /* sync the presentation layer first — in a throttled hidden tab the
     render loop lags the sim, and a visitor at 60fps never sees that
     lag. The control path below is still real dispatched events. */
  render(now());
  const el = typeof sel === 'string' ? $(sel) : sel;
  if (!el) return { ok: false, note: `no element ${sel}` };
  if (el.hidden) return { ok: false, note: `${sel} is hidden` };
  el.scrollIntoView({ block: 'center', inline: 'center' });
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const hit = document.elementFromPoint(x, y);
  if (!hit) return { ok: false, note: `nothing at point for ${sel}` };
  if (!(hit === el || el.contains(hit))) {
    return { ok: false, note: `${sel} occluded by <${hit.tagName.toLowerCase()} class="${hit.className}">` };
  }
  const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window, pointerId: 1 };
  hit.dispatchEvent(new PointerEvent('pointerdown', opts));
  hit.dispatchEvent(new MouseEvent('mousedown', opts));
  hit.dispatchEvent(new PointerEvent('pointerup', opts));
  hit.dispatchEvent(new MouseEvent('mouseup', opts));
  hit.dispatchEvent(new MouseEvent('click', opts));
  return { ok: true, note: `clicked ${sel} at ${Math.round(x)},${Math.round(y)} (hit ${hit.tagName.toLowerCase()})` };
}

const st = () => sim.getState();
const waitState = (pred, ms, desc) =>
  shimWaitFor(() => pred(st()), ms, desc, () => sim.poll());

/* ---------------- trial machinery ---------------- */

function makeTrial(name) {
  const steps = [];
  const t0 = now();
  const step = (label, pass, note = '') => {
    steps.push({ label, pass: !!pass, note });
    console.log(`[works:${name}] ${pass ? 'PASS' : 'FAIL'} — ${label}${note ? ' — ' + note : ''}`);
    return !!pass;
  };
  const finish = () => {
    const pass = steps.every(s => s.pass);
    const report = { name, pass, seconds: +(now() - t0).toFixed(1), steps };
    console.log(`[works:${name}] ${pass ? 'ALL PASS' : 'FAILURES PRESENT'} (${report.seconds}s)`);
    window.__punctual.reports.push(report);
    return report;
  };
  return { step, finish };
}

async function ensureIdle(step) {
  let s = st();
  if (s.reader || s.drawing || s.aligned || s.apertureExists || s.openness > 0) {
    realClick('#vent-lever');
    const w = await waitState(x => !x.apertureExists && !x.reader && !x.drawing && !x.aligned, 8000, 'idle after vent');
    step('engine idles after vent', w.ok, w.ok ? '' : w.reason);
  }
  s = st();
  if (s.tray) { realClick('#spoil'); step('tray cleared', !st().tray); }
}

async function steamUp(step) {
  let s = st();
  if (!s.damperOpen) {
    const c = realClick('#damper');
    step('damper lever answers a real click', c.ok && st().damperOpen, c.note);
  }
  const w = await waitState(x => x.pressure >= sim.P.WORKING_MIN, 30000, 'working pressure');
  step(`pressure enters working band (now ${Math.round(st().pressure)} lb)`, w.ok, w.ok ? '' : w.reason);
}

/* ---------------- trials ---------------- */

async function trialInterlocks() {
  const { step, finish } = makeTrial('interlocks');
  await ensureIdle(step);
  /* must run on a cold boiler */
  if (st().damperOpen) { realClick('#damper'); }
  step('boiler cold for interlock test', st().pressure < sim.P.WORKING_MIN,
    `pressure ${Math.round(st().pressure)}`);

  let c = realClick('#draw-lever');
  step('DRAW refused with no card', c.ok && !st().drawing &&
    st().logTail.some(l => l.includes('NO CARD')), c.note);

  c = realClick('#rack .libcard:nth-child(1)');
  step('card inserts from rack', c.ok && !!st().reader, c.note);

  c = realClick('#draw-lever');
  step('DRAW refused while pressure wanting', c.ok && !st().drawing &&
    st().logTail.some(l => l.includes('PRESSURE WANTING')), c.note);

  c = realClick('#coupling-lever');
  step('COUPLING refused before alignment', c.ok && !st().apertureExists &&
    st().logTail.some(l => l.includes('NOT IN CORRESPONDENCE')), c.note);

  c = realClick('#reader-card');
  step('card ejects by real click', c.ok && !st().reader, c.note);
  return finish();
}

async function trialCard(idx = 0) {
  const { step, finish } = makeTrial('card');
  const dest = CORRESPONDENTS[idx];
  await ensureIdle(step);
  await steamUp(step);

  let c = realClick(`#rack .libcard:nth-child(${idx + 1})`);
  let s = st();
  step('certified card inserts from rack', c.ok && s.reader && s.reader.certified &&
    s.reader.name === dest.name, c.note);

  const tDraw = now();
  c = realClick('#draw-lever');
  s = st();
  step('DRAW starts a certified draw', c.ok && s.drawing && s.drawCertified === true, c.note);

  let w = await waitState(x => x.aligned, 10000, 'six registers locked');
  const drawSecs = now() - tDraw;
  step(`all six registers lock (${drawSecs.toFixed(1)}s)`, w.ok && st().locks === 6, w.ok ? '' : w.reason);
  step('certified draw ran at governor speed (< 7s)', drawSecs < 7, `${drawSecs.toFixed(1)}s`);

  c = realClick('#coupling-lever');
  w = await waitState(x => x.openness > 0.5, 8000, 'aperture open');
  s = st();
  step('coupling opens a live line', c.ok && w.ok && s.live && s.dest === dest.name,
    c.note + (w.ok ? '' : ' / ' + w.reason));

  render(now());
  step('placard names the correspondent (DOM)',
    document.getElementById('placard-text').textContent.includes(dest.name),
    document.getElementById('placard-text').textContent);

  await shimDelay(2000);
  c = realClick('#vent-lever');
  w = await waitState(x => !x.apertureExists && !x.reader && x.locks === 0, 9000, 'engine cleared');
  step('VENT clears the engine', c.ok && w.ok, c.note + (w.ok ? '' : ' / ' + w.reason));
  render(now());
  step('library card returned to rack (DOM)',
    !document.querySelector(`#rack .libcard:nth-child(${idx + 1})`).disabled);
  return finish();
}

async function composeCode(step, code) {
  for (let i = 0; i < 6; i++) {
    const v = code[i];
    let c = realClick(`#notches .notch[data-v="${v}"]`);
    if (!step(`notch sets value ${v} for column ${i + 1}`, c.ok && st().punch.value === v, c.note)) return false;
    c = realClick('#strike');
    const s = st();
    const advanced = (i < 5) ? s.punch.col === i + 1 : !!s.tray;
    if (!step(`STRIKE cuts column ${i + 1}`, c.ok && advanced, c.note)) return false;
    render(now());
    if (i < 5) {
      const hole = document.querySelector(`#punch-card .pcol:nth-child(${i + 1}) .pos[data-v="${v}"]`);
      step(`hole visible in column ${i + 1} (DOM)`, hole && hole.classList.contains('hole'));
    }
  }
  return true;
}

async function trialManual() {
  const { step, finish } = makeTrial('manual');
  const dest = CORRESPONDENTS[2];   // CANDLEWICK TERMINUS
  await ensureIdle(step);
  await steamUp(step);

  if (!await composeCode(step, dest.code)) return finish();
  render(now());
  step('composed card sits in the out-tray', !!st().tray);

  let c = realClick('#tray-card');
  let s = st();
  step('tray card presents to the reader (uncertified)', c.ok && s.reader && !s.reader.certified, c.note);

  const tDraw = now();
  c = realClick('#draw-lever');
  s = st();
  step('DRAW starts a proving-pace draw', c.ok && s.drawing && s.drawCertified === false, c.note);

  let w = await waitState(x => x.aligned, 25000, 'six registers proved');
  const drawSecs = now() - tDraw;
  step(`all six registers prove and lock (${drawSecs.toFixed(1)}s)`, w.ok && st().locks === 6,
    w.ok ? '' : w.reason);
  step('uncertified draw ran at proving pace (> 11s)', drawSecs > 11, `${drawSecs.toFixed(1)}s`);

  c = realClick('#coupling-lever');
  w = await waitState(x => x.openness > 0.5, 8000, 'aperture open');
  s = st();
  step('hand-composed known code opens a live line', c.ok && w.ok && s.live && s.dest === dest.name,
    c.note + (w.ok ? '' : ' / ' + w.reason));

  await shimDelay(1500);
  realClick('#vent-lever');
  w = await waitState(x => !x.apertureExists && !x.reader, 9000, 'engine cleared');
  step('VENT clears the engine; card back in tray', w.ok && !!st().tray, w.ok ? '' : w.reason);
  realClick('#spoil');
  step('tray card spoiled (cleanup)', !st().tray);
  return finish();
}

async function trialDead() {
  const { step, finish } = makeTrial('deadline');
  await ensureIdle(step);
  await steamUp(step);

  if (!await composeCode(step, [1, 1, 1, 1, 1, 1])) return finish();
  let c = realClick('#tray-card');
  step('unknown composition presents to reader', c.ok && !!st().reader, c.note);

  c = realClick('#draw-lever');
  step('DRAW accepted', c.ok && st().drawing, c.note);
  let w = await waitState(x => x.aligned, 25000, 'registers locked');
  step('registers lock on the unknown code', w.ok, w.ok ? '' : w.reason);

  c = realClick('#coupling-lever');
  w = await waitState(x => x.apertureExists && !x.live, 4000, 'dead-line attempt');
  step('coupling produces a dead line, not a live one', c.ok && w.ok && !st().live, c.note);

  w = await waitState(x => !x.apertureExists && !!x.tray, 10000, 'dead line self-clears');
  step('dead line self-clears and returns the card', w.ok, w.ok ? '' : w.reason);
  step('tape reports no answer',
    st().logTail.some(l => l.includes('DOES NOT ANSWER')), st().logTail.join(' | '));

  realClick('#spoil');
  step('tray card spoiled (cleanup)', !st().tray);
  return finish();
}

async function trialAll() {
  const a = await trialInterlocks();
  const b = await trialCard(0);
  const cR = await trialManual();
  const d = await trialDead();
  const pass = [a, b, cR, d].every(r => r.pass);
  console.log(`[works:ALL] ${pass ? 'ALL TRIALS PASS' : 'TRIAL FAILURES PRESENT'}`);
  return { pass, trials: [a, b, cR, d] };
}

/* honest rendering check: are frames genuinely firing? */
async function rafCheck(durationMs = 1200) {
  let frames = 0, done = false;
  const cb = () => { frames++; if (!done) requestAnimationFrame(cb); };
  requestAnimationFrame(cb);
  await shimDelay(durationMs);
  done = true;
  return {
    visibility: document.visibilityState,
    hasFocus: document.hasFocus(),
    rafPerSec: +(frames * 1000 / durationMs).toFixed(1),
  };
}

export function init() {
  window.__punctual = {
    state: st,
    reports: [],
    trial: (which, arg) => ({
      interlocks: trialInterlocks, card: () => trialCard(arg || 0),
      manual: trialManual, dead: trialDead, all: trialAll,
    }[which] || trialAll)(),
    rafCheck,
    render: () => render(now()),
  };
  console.log('[works] harness armed — window.__punctual.trial("interlocks"|"card"|"manual"|"dead"|"all")');
  const which = new URLSearchParams(location.search).get('works');
  if (which) {
    shimDelay(700).then(() => window.__punctual.trial(which));
  }
}
