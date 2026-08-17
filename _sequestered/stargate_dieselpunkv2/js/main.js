// Boot + input wiring. All controls act through real DOM events so the
// same paths serve visitors, keyboards, and the ?salon test bench.

import * as sim from './sim.js';
import { destByPresel } from './directory.js';
import { setupScene, startLoops } from './render.js';
import * as audio from './audio.js';

const $ = id => document.getElementById(id);

setupScene();
startLoops();

/* ---------- audio unlock + discrete sound hooks ---------- */
const unlock = () => audio.ensureAudio();
window.addEventListener('pointerdown', unlock, { capture: true });
window.addEventListener('keydown', unlock, { capture: true });

sim.onEvent((type) => {
  switch (type) {
    case 'lineon': case 'lineoff': audio.clunk(); break;
    case 'band': audio.clickSmall(); break;
    case 'presel': audio.clickKey(); break;
    case 'slewdone': audio.clickSmall(); break;
    case 'engage': audio.clunk(); audio.bloom(true); break;
    case 'disengage': audio.clunk(); audio.bloom(false); break;
  }
});

/* ---------- rotary drag helper ---------- */
function pointerAngle(e, el) {
  const r = el.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height / 2);
  return Math.atan2(dx, -dy) * 180 / Math.PI;   // 0 = up, clockwise +
}
const angNorm = a => ((a % 360) + 540) % 360 - 180;

// Generic drag-to-rotate: window-level move/up listeners so both real
// pointers and dispatched synthetic events work identically.
function rotaryDrag(el, { onStart, onDelta }) {
  let dragging = false, a0 = 0, acc = 0, aPrev = 0;
  el.addEventListener('pointerdown', e => {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true;
    a0 = aPrev = pointerAngle(e, el);
    acc = 0;
    onStart();
    e.preventDefault();
  });
  window.addEventListener('pointermove', e => {
    if (!dragging) return;
    const a = pointerAngle(e, el);
    acc += angNorm(a - aPrev);
    aPrev = a;
    onDelta(acc);
  });
  window.addEventListener('pointerup', () => { dragging = false; });
  window.addEventListener('pointercancel', () => { dragging = false; });
}

/* ---------- main tuning dial ---------- */
{
  const el = $('bigdial');
  let grab = 0;
  rotaryDrag(el, {
    onStart: () => { grab = sim.coarseAt(); },
    onDelta: d => sim.setCoarse(grab + d / 300 * (sim.METRES_MAX - sim.METRES_MIN)),
  });
  el.addEventListener('keydown', e => {
    const step = e.shiftKey ? 0.2 : 1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { sim.setCoarse(sim.coarseAt() + step); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { sim.setCoarse(sim.coarseAt() - step); e.preventDefault(); }
  });
}

/* ---------- vernier ---------- */
{
  const el = $('vernier');
  let grab = 0;
  rotaryDrag(el, {
    onStart: () => { grab = sim.state.vernier; },
    onDelta: d => sim.setVernier(grab + d / 300 * (sim.VERNIER_RANGE * 2)),
  });
  el.addEventListener('keydown', e => {
    const step = e.shiftKey ? 0.02 : 0.1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { sim.setVernier(sim.state.vernier + step); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { sim.setVernier(sim.state.vernier - step); e.preventDefault(); }
  });
}

/* ---------- band selector ---------- */
{
  const el = $('bandsel');
  el.addEventListener('click', () => sim.setBand(sim.state.band + 1));
  el.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      sim.setBand(sim.state.band + 1); e.preventDefault();
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { sim.setBand(sim.state.band - 1); e.preventDefault(); }
  });
}

/* ---------- line switch ---------- */
$('linesw').addEventListener('click', () => sim.toggleLine());

/* ---------- presel keys ---------- */
$('presel-keys').addEventListener('click', e => {
  const key = e.target.closest('.presel-key');
  if (!key) return;
  const dest = destByPresel(+key.dataset.presel);
  if (dest) sim.pressPresel(dest);
});

/* ---------- travel lever ---------- */
$('travel-lever').addEventListener('click', e => {
  const res = sim.pullLever();
  if (!res.ok) {
    audio.balkThud();
    const lever = e.currentTarget;
    lever.classList.remove('balk');
    void lever.offsetWidth;            // restart animation
    lever.classList.add('balk');
  }
});

/* ---------- debug / bench surface (read-only reads + version) ---------- */
window.__caravelle = {
  version: 'Caravelle Cabinet No.9 — 1937',
  sim,
  reads: () => {
    const t = sim.now();
    return {
      lineOn: sim.state.lineOn,
      volts: sim.volts(t),
      warmed: sim.warmed(t),
      band: sim.state.band,
      tuned: sim.tuned(t),
      beacon: sim.activeBeacon(t),
      latched: sim.latched(t),
      engaged: sim.state.engaged,
      portalPhase: sim.portalPhase(t),
      status: sim.status(t),
      slewing: !!sim.state.slew,
    };
  },
};

/* ---------- test bench: ONLY via explicit ?salon trigger ---------- */
const params = new URLSearchParams(location.search);
if (params.has('salon')) {
  import('./bench.js').then(m => m.runBench(params.get('salon') || 'all'));
}
