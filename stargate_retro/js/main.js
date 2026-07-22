// main.js — boot: proportional stage scaling, worker heartbeat (immune to
// hidden-tab timer throttling), rAF render loop, ambient log murmur.

import * as sim from './sim.js';
import { render } from './crt.js';
import { update } from './screens.js';
import './controls.js';

/* ---------- proportional scaling: 1920x1080 design up to 4K ---------- */
function rescale() {
  const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  document.getElementById('stage').style.setProperty('--s', s.toFixed(4));
}
window.addEventListener('resize', rescale);
rescale();

/* ---------- heartbeat: inline-Blob worker setInterval (not throttled) ---------- */
const workerSrc = 'setInterval(() => postMessage(0), 100);';
const worker = new Worker(URL.createObjectURL(new Blob([workerSrc], { type: 'text/javascript' })));
worker.onmessage = () => {
  const t = performance.now();
  sim.tick(t);
  update(t);
};

/* ---------- rAF render loop (chases the sim; never load-bearing) ---------- */
function frame(t) {
  sim.tick(performance.now());
  render(performance.now());
  update(performance.now());
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- boot state: night shift left the mains on ---------- */
sim.log('TYPE 61 "AUGUR" — SUPERVISORY CHANNEL OPEN');
sim.togglePower();          // ambient idle = powered free-run wander; never auto-dials

/* ---------- ambient murmur lines (ambience only, no dialing) ---------- */
const MURMUR = [
  'MESH POTENTIAL NOMINAL',
  'DRIFT CHECK — OSC WITHIN BOUNDS',
  'FLOOD GUN HEATERS STEADY',
  'GRATICULE LAMP 62% — REPLACE AT NEXT SERVICE',
  'COLLIMATION HELD — NO ACTION',
  'NIGHT WATCH — NOTHING TO REPORT',
];
let murmurIdx = 0, lastMurmur = performance.now();
setInterval(() => {
  const t = performance.now();
  if (sim.state.power && sim.state.aperture.st === 'closed' && t - lastMurmur > 26_000) {
    lastMurmur = t;
    sim.log(MURMUR[murmurIdx++ % MURMUR.length]);
  }
}, 5_000);

/* ---------- test bench (non-default trigger only) ---------- */
window.__augur = { sim, state: sim.state };
const params = new URLSearchParams(location.search);
if (params.has('trace')) {
  import('./bench.js').then(m => m.bench(params.get('trace') || 'all'));
} else {
  window.__augur.bench = async mode =>
    (await import('./bench.js')).bench(mode || 'all');
}
