// util.js — seeded jitter + small SVG helpers.
// All visual irregularity is deterministic (seeded) so the machine always
// looks like the same machine, not a re-rolled one.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One shared stream for build-time (layout) jitter.
export const rng = mulberry32(0x5EED0388);

// jitter(3) -> value in [-3, 3]
export function jit(amp, r = rng) { return (r() * 2 - 1) * amp; }

export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function lerp(a, b, t) { return a + (b - a) * t; }

// exponential approach: value at time t given a setpoint change at t0
export function approach(v0, target, t0, tau, t) {
  if (t <= t0) return v0;
  return target + (v0 - target) * Math.exp(-(t - t0) / tau);
}

// slew at fixed rate (units/sec) from v0 toward target starting at t0
export function slew(v0, target, t0, rate, t) {
  if (t <= t0) return v0;
  const d = target - v0;
  const travelled = rate * (t - t0);
  if (Math.abs(d) <= travelled) return target;
  return v0 + Math.sign(d) * travelled;
}

export function polar(cx, cy, r, deg) {
  const a = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

// SVG arc path (deg0 -> deg1, clockwise)
export function arcPath(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export function el(id) { return document.getElementById(id); }

export function html(parent, markup) {
  parent.insertAdjacentHTML('beforeend', markup);
}

// deg formatting for bearings
export function fmtDeg(d) {
  d = ((d % 360) + 360) % 360;
  return String(Math.round(d)).padStart(3, '0') + '°';
}

export function fmtKc(kc) { return kc.toFixed(1); }
