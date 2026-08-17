/* Wall-clock + throttling-proof timers.
   Hidden tabs clamp setTimeout to 1s (then ~1/min under intensive
   throttling). The MessageChannel pump below is exempt from that
   clamping, so the ?works test harness can wait on real durations
   even in a backgrounded pane. It busy-pumps while timers are
   pending, so it is used ONLY by the harness, never by visitor code. */

export const now = () => performance.now() / 1000;

const timers = [];
let pumping = false;
const ch = new MessageChannel();
ch.port1.onmessage = () => {
  const t = performance.now();
  for (let i = timers.length - 1; i >= 0; i--) {
    if (timers[i].at <= t) {
      const { fn } = timers.splice(i, 1)[0];
      try { fn(); } catch (e) { console.error('[clock] timer error', e); }
    }
  }
  if (timers.length) ch.port2.postMessage(0);
  else pumping = false;
};

export function shimTimeout(fn, ms) {
  timers.push({ at: performance.now() + ms, fn });
  if (!pumping) { pumping = true; ch.port2.postMessage(0); }
}

export const shimDelay = (ms) => new Promise((res) => shimTimeout(res, ms));

/* Poll `fn` (roughly every 60 ms of real time) until truthy or timeout.
   Resolves { ok, value | reason }. `onPoll` runs each iteration
   (the harness uses it to drive sim.poll / render in hidden tabs). */
export function shimWaitFor(fn, timeoutMs, desc, onPoll) {
  const deadline = performance.now() + timeoutMs;
  return new Promise((res) => {
    const iter = () => {
      if (onPoll) { try { onPoll(); } catch (e) { /* non-fatal */ } }
      let v = null;
      try { v = fn(); } catch (e) { res({ ok: false, reason: `${desc}: poll threw ${e.message}` }); return; }
      if (v) { res({ ok: true, value: v }); return; }
      if (performance.now() > deadline) { res({ ok: false, reason: `timeout waiting for ${desc}` }); return; }
      shimTimeout(iter, 60);
    };
    iter();
  });
}
