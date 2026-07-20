// Wall-clock + a tick driver that survives hidden-tab throttling.
// Chrome clamps hidden-page timers (1s clamp, then ~1/min intensive throttling);
// dedicated-worker timers are exempt, so a tiny inline worker heartbeats the sim.
// All sim state is closed-form over now() — rendering and tick() just chase it.

export const now = () => performance.now();

const TICK_MS = 120;
const subs = [];

export function onTick(fn) { subs.push(fn); }

function fire() {
  const t = now();
  for (const fn of subs) { try { fn(t); } catch (e) { console.error(e); } }
}

let worker = null;
try {
  const src = `setInterval(() => postMessage(0), ${TICK_MS});`;
  worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
  worker.onmessage = fire;
} catch (e) {
  console.warn('worker ticker unavailable, falling back to setInterval', e);
  setInterval(fire, TICK_MS);
}

// Coarse scheduled callbacks riding the same heartbeat (ambient flavor only —
// the dial state machine never uses these; it derives everything from now()).
const jobs = [];
export function after(ms, fn) { jobs.push({ t: now() + ms, fn }); }
onTick(t => {
  for (let i = jobs.length - 1; i >= 0; i--) {
    if (jobs[i].t <= t) { const j = jobs.splice(i, 1)[0]; try { j.fn(); } catch (e) { console.error(e); } }
  }
});
