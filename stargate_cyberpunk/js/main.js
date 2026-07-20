// Bootstrap + render loop + test bench.
// Idle is ambient-only: nothing dials unless a human (or the explicit ?rig
// test trigger) pushes real controls.

import { now, onTick } from './clock.js';
import { DESTS, CHIPS } from './data.js';
import { S, actions, tick } from './state.js';
import { buildBack, buildFront, renderRing } from './ring.js';
import { initPortal, layoutPortal, renderPortal } from './portal.js';
import { initTerminal } from './terminal.js';
import { initRig, renderRig } from './rig.js';
import { initAudio, renderAudio } from './audio.js';

const chamber = document.getElementById('chamber');
buildBack(document.getElementById('sceneBack'));
buildFront(document.getElementById('sceneFront'));
initPortal(document.getElementById('portal'));
initTerminal();
initRig();
initAudio();

let lastCW = -1, lastCH = -1;
function layout() {
  layoutPortal(chamber);
  lastCW = chamber.clientWidth; lastCH = chamber.clientHeight;
}
window.addEventListener('resize', layout);
window.addEventListener('load', layout);
layout();
// stylesheet may land after module execution — re-layout when the chamber's box changes
onTick(() => { if (chamber.clientWidth !== lastCW || chamber.clientHeight !== lastCH) layout(); });

// rAF when visible; worker heartbeat keeps the sim honest when throttled
let lastDraw = 0;
function frame(t) {
  lastDraw = t;
  tick(t);
  renderRing(t);
  renderPortal(t);
  renderRig(t);
  renderAudio(t);
}
function loop() { frame(now()); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
onTick(t => { tick(t); if (t - lastDraw > 300) frame(t); });

// ---------------------------------------------------------------- test bench
// Drives the page through REAL dispatched events against production DOM nodes
// (hit-tested at element centre), never by calling actions.* directly.

function realClick(el) {
  if (!el) return { ok: false, why: 'no element' };
  el.scrollIntoView?.({ block: 'nearest' });
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const hit = document.elementFromPoint(x, y);
  const reachable = hit && (el === hit || el.contains(hit) || hit.contains(el));
  const target = reachable ? hit : el;
  for (const [type, Ctor] of [['pointerdown', PointerEvent], ['mousedown', MouseEvent],
                              ['pointerup', PointerEvent], ['mouseup', MouseEvent], ['click', MouseEvent]]) {
    target.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1 }));
  }
  return { ok: true, reachable, hit: hit?.tagName + '.' + (hit?.className?.baseVal ?? hit?.className ?? '') };
}

const sleep = ms => new Promise(res => { const t0 = now(); const id = setInterval(() => { if (now() - t0 >= ms) { clearInterval(id); res(); } }, 50); });
const waitPhase = (p, timeout = 60000) => new Promise((res, rej) => {
  if (S.phase === p) return res();
  const t0 = now();
  const id = setInterval(() => {
    tick(now());
    if (S.phase === p) { clearInterval(id); res(); }
    else if (now() - t0 > timeout) { clearInterval(id); rej(new Error(`timeout waiting for ${p} (at ${S.phase})`)); }
  }, 80);
});

function tagFor(destId) {
  const name = DESTS[destId].name;
  return [...document.querySelectorAll('.dtag')].find(b => b.querySelector('.dtag-name')?.textContent === name);
}

async function bench(destId = 'saltcath', { resume = false, chip = null } = {}) {
  const log = [];
  const step = (name, r = {}) => log.push({ name, phase: S.phase, ...r });

  if (chip) {
    const idx = CHIPS.findIndex(c => c.id === chip);
    step('seatChip', realClick(document.querySelectorAll('.chip')[idx]));
  }
  step('selectDest', realClick(tagFor(destId)));
  await sleep(150);
  step('dialKey', realClick(document.getElementById(resume ? 'resKey' : 'negKey')));

  if (!resume) {
    // ride out the stall with a real whack on segment C
    const t0 = now();
    while (S.phase === 'spool' && now() - t0 < 20000) {
      if (S.spool?.stall && !S.spool.stallDone) { step('whackSegC', realClick(document.querySelector('.seg-2'))); }
      await sleep(120);
    }
    await waitPhase('negotiate', 15000).catch(e => step('negotiateWait', { error: e.message }));
  }
  await waitPhase('ready', resume ? 15000 : 45000);
  step('reachedReady');
  // the cover is a toggle — a prior dial may have left it up; only flip it if shut
  if (S.coverOpen) step('openCover', { skipped: 'already up' });
  else step('openCover', realClick(document.getElementById('guardCover')));
  await sleep(150);
  step('pullLever', realClick(document.getElementById('lever')));
  await waitPhase('open', 3000);
  step('apertureOpen');
  await sleep(1500);
  step('cut', realClick(document.getElementById('cutBtn')));
  await waitPhase('idle', 8000);
  step('backToIdle');
  return log;
}

window.__deadringer = { S, actions, tick, realClick, bench, tagFor };

// ?rig test trigger (explicitly non-default; a live visitor never sees this)
const rig = new URLSearchParams(location.search).get('rig');
if (rig != null) {
  (async () => {
    const out = {};
    const run = async (key, ...args) => {
      try { out[key] = await bench(...args); }
      catch (e) { out[key] = { error: e.message }; }
      window.__benchResult = out; // partial results survive later failures
    };
    if (rig === 'resume') await run('resume', 'pearl', { resume: true, chip: 'chipA' });
    else if (rig === 'all') {
      await run('full', 'saltcath');
      await run('ticketResume', 'saltcath', { resume: true }); // session ticket from the full run
      await run('chipResume', 'pearl', { resume: true, chip: 'chipA' });
    } else await run('full', 'saltcath');
    console.log('BENCH', JSON.stringify(window.__benchResult));
  })();
}
