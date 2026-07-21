// main.js — boot & orchestration for STENTOR.
// - 1920x1080 design stage scaled uniformly to the viewport (up and down)
// - Web Worker heartbeat drives sim.tick() (immune to hidden-tab throttling)
// - rAF paints; a coarse setInterval backstop keeps visuals honest if rAF starves
// - idle state is ambient only; the test bench runs ONLY via ?shakedown or
//   an explicit window.__stentor.shakedown() call.

import * as sim from './sim.js';
import { S, now } from './sim.js';
import { buildHall, renderHall, setTannoyLamp } from './hall.js';
import { buildMachine, renderMachine } from './machine.js';
import { buildArc, renderArc } from './arc.js';
import { buildPanels, renderPanels } from './panels.js';
import { buildDesk, renderDesk } from './desk.js';
import { buildTuning, renderTuning } from './tuning.js';
import * as audio from './audio.js';

// ---------------------------------------------------------------- stage scale
let fittedW = -1, fittedH = -1;
function fitStage() {
  // guard: headless/hidden panes can report 0x0 at load; refit when real
  // dimensions appear (render loop calls this whenever the size changes)
  const w = window.innerWidth, h = window.innerHeight;
  if (w < 10 || h < 10) return;
  if (w === fittedW && h === fittedH) return;
  fittedW = w; fittedH = h;
  const st = document.getElementById('stage');
  const s = Math.min(w / 1920, h / 1080);
  st.style.transform = `translate(-50%, -50%) scale(${s.toFixed(4)})`;
}
window.addEventListener('resize', fitStage);

// ---------------------------------------------------------------- build
buildHall(() => {
  audio.unlock();
  audio.setMuted(!audio.isMuted());
  setTannoyLamp(!audio.isMuted());
});
buildMachine();
buildArc();
buildPanels();
buildDesk();
buildTuning();
fitStage();

// audio unlock on first gesture anywhere
window.addEventListener('pointerdown', () => audio.unlock(), { once: true });

// lever/switch sounds
sim.onEvent((type) => {
  if (type === 'contactor' || type === 'clutch' || type === 'fuel' || type === 'notch') audio.thunk('lever');
  if (type === 'trip') audio.thunk('trip');
  if (type === 'key-down') audio.keySidetone();
});

// ---------------------------------------------------------------- heartbeat
// Inline-Blob worker: setInterval in a Worker is NOT throttled when the tab
// is hidden, so the state machine keeps landing its transitions on time.
const workerSrc = `setInterval(() => postMessage(0), 250);`;
const worker = new Worker(URL.createObjectURL(new Blob([workerSrc], { type: 'text/javascript' })));
worker.onmessage = () => sim.tick();

// ---------------------------------------------------------------- render
let lastT = null;
export function render(t = now()) {
  if (lastT === null) lastT = t;
  const dt = Math.min(Math.max(t - lastT, 0.0001), 0.1);
  lastT = t;
  fitStage();
  sim.tick();
  renderHall(t);
  renderMachine(t);
  renderArc(t);
  renderPanels(t, dt);
  renderDesk(t);
  renderTuning(t, dt);
  audio.updateAudio(t);
}

let rafSeen = 0;
function loop() {
  rafSeen++;
  render(now());
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// backstop: if rAF starves (hidden/backgrounded pane), paint coarsely anyway
setInterval(() => {
  const seen = rafSeen;
  setTimeout(() => { if (rafSeen === seen) render(now()); }, 0);
}, 400);

// ---------------------------------------------------------------- debug/bench
window.__stentor = {
  S, sim, render,
  rafCount: () => rafSeen,
  shakedown: async (which = 'all') => {
    const m = await import('./bench.js');
    return m.shakedown(which);
  },
};

const params = new URLSearchParams(location.search);
if (params.has('shakedown')) {
  const which = params.get('shakedown') || 'all';
  import('./bench.js').then(m => m.shakedown(which === '' ? 'all' : which));
}
