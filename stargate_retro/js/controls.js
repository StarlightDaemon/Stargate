// controls.js — wires real DOM events to sim actions. Knobs are click-to-turn:
// each click advances the knob exactly one hand-turned notch, the way an
// operator would turn a physical dial — not a drag, and not a click-to-position
// (a mouse can't hold pixel precision against a small control). Repeated
// clicks keep advancing and wrap around indefinitely. Wheel and arrow keys
// remain for fine trim. Everything routes through sim.js actions.

import * as sim from './sim.js';

const $ = id => document.getElementById(id);

function wireKnob(el, { onClick, onStep }) {
  el.addEventListener('click', onClick);
  el.addEventListener('wheel', e => {
    e.preventDefault();
    onStep(e.deltaY < 0 ? 1 : -1, e.shiftKey);
  }, { passive: false });
  el.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { onStep(1, e.shiftKey); e.preventDefault(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { onStep(-1, e.shiftKey); e.preventDefault(); }
  });
}

// FIGURE knob: detented rotary selector — one click, one detent forward,
// wrapping past the last position back to the first
wireKnob($('knob-ratio'), {
  onClick: () => sim.nudgeRatio(1),
  onStep: d => sim.nudgeRatio(d),
});

// PHASE vernier: one click advances PHASE_CLICK_STEP degrees, wrapping past
// 360; wheel/arrows trim by 1deg (shift: 0.2deg fine) for the final lock-in
wireKnob($('knob-phase'), {
  onClick: () => sim.nudgePhase(sim.PHASE_CLICK_STEP),
  onStep: (d, fine) => sim.nudgePhase(d * (fine ? 0.2 : 1)),
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
