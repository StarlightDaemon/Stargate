// controls.js — wires real DOM events to sim actions. Knobs: pointer drag,
// wheel, and arrow keys. Everything routes through sim.js actions.

import * as sim from './sim.js';

const $ = id => document.getElementById(id);

/* ---------- knob drag/wheel/keys ---------- */
function wireKnob(el, { onStep, onDrag, dragScale }) {
  let dragging = null;
  el.addEventListener('pointerdown', e => {
    dragging = { y0: e.clientY, acc: 0 };
    try { el.setPointerCapture(e.pointerId); } catch { /* synthetic pointers have no capture */ }
    e.preventDefault();
  });
  el.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dy = dragging.y0 - e.clientY;         // up = increase
    dragging.y0 = e.clientY;
    onDrag(dy * dragScale, dragging);
  });
  const end = () => { dragging = null; };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('wheel', e => {
    e.preventDefault();
    onStep(e.deltaY < 0 ? 1 : -1, e.shiftKey);
  }, { passive: false });
  el.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { onStep(1, e.shiftKey); e.preventDefault(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { onStep(-1, e.shiftKey); e.preventDefault(); }
  });
}

// FIGURE knob: detented — a step per ~26px of drag
wireKnob($('knob-ratio'), {
  onStep: d => sim.nudgeRatio(d),
  dragScale: 1,
  onDrag: (dv, drag) => {
    drag.acc += dv;
    while (drag.acc >= 26) { sim.nudgeRatio(1); drag.acc -= 26; }
    while (drag.acc <= -26) { sim.nudgeRatio(-1); drag.acc += 26; }
  },
});

// PHASE vernier: continuous — 0.35°/px, wheel 1° (shift 0.2°)
wireKnob($('knob-phase'), {
  onStep: (d, fine) => sim.nudgePhase(d * (fine ? 0.2 : 1)),
  dragScale: 0.35,
  onDrag: dv => sim.nudgePhase(dv),
});

/* ---------- switches & buttons ---------- */
$('power-toggle').addEventListener('click', () => sim.togglePower());
$('power-toggle').addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') { sim.togglePower(); e.preventDefault(); }
});

$('strike-btn').addEventListener('click', () => sim.strike());

$('energize-cover').addEventListener('click', () => sim.toggleCover());
$('cover-hinge').addEventListener('click', () => sim.toggleCover());
for (const id of ['energize-cover', 'cover-hinge']) {
  $(id).addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { sim.toggleCover(); e.preventDefault(); }
  });
}

$('energize-switch').addEventListener('click', () => sim.setEnergize(!sim.state.energize));
$('energize-switch').addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') { sim.setEnergize(!sim.state.energize); e.preventDefault(); }
});

/* ---------- screen rows (delegated) ---------- */
document.getElementById('dest-rows').addEventListener('click', e => {
  const row = e.target.closest('.dest-row');
  if (row) sim.setRegister(Number(row.dataset.dest));
});
document.getElementById('store-rows').addEventListener('click', e => {
  const row = e.target.closest('.store-row');
  if (row && row.classList.contains('filled')) sim.recall(Number(row.dataset.slot));
});
