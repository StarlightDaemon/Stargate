// Portal field: an unstable projected lattice, not a liquid.
// lock/ready = thin lattice threads pinning into place; open = full field with
// interference drift and scan tears; sever = vertical collapse like a dying CRT.

import { GEO } from './ring.js';
import { S, energy } from './state.js';
import { DESTS } from './data.js';
import { now } from './clock.js';

let cv, ctx, cssR = 0, dpr = 1;

export function initPortal(canvas) { cv = canvas; ctx = cv.getContext('2d'); }

// place the canvas square over the ring interior, matching the SVG "meet" transform
export function layoutPortal(chamber) {
  const { W, H, CX, CY, R_IN } = GEO;
  const cw = chamber.clientWidth, chh = chamber.clientHeight;
  if (!cw || !chh) return;
  const sc = Math.min(cw / W, chh / H);
  const ox = (cw - W * sc) / 2, oy = (chh - H * sc) / 2;
  const r = (R_IN - 2) * sc;
  cv.style.left = (ox + CX * sc - r) + 'px';
  cv.style.top = (oy + CY * sc - r) + 'px';
  cv.style.width = cv.style.height = (2 * r) + 'px';
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = cv.height = Math.max(2, Math.round(2 * r * dpr));
  cssR = r;
}

const TAU = Math.PI * 2;

export function renderPortal(t = now()) {
  if (!ctx || !cv.width) return;
  const R = cv.width / 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);

  const ph = S.phase;
  const show = ph === 'lock' || ph === 'ready' || ph === 'open' || ph === 'sever';
  if (!show) return;

  const hue = S.dest ? DESTS[S.dest].hue : 190;
  const e = energy(t);
  ctx.save();
  ctx.translate(R, R);

  // clip to the aperture
  ctx.beginPath(); ctx.arc(0, 0, R * 0.985, 0, TAU); ctx.clip();

  if (ph === 'lock' || ph === 'ready') {
    latticeThreads(t, hue, ph === 'lock' ? Math.min(1, (t - S.phaseAt) / 1800) : 1, R);
  } else if (ph === 'open') {
    const bloomMs = S.mode === 'resume' ? 550 : 1150;
    const k = Math.min(1, (t - S.openAt) / bloomMs);
    fieldBody(t, hue, k, e, R);
  } else if (ph === 'sever') {
    collapse(t, hue, R);
  }
  ctx.restore();
}

function latticeThreads(t, hue, k, R) {
  ctx.globalCompositeOperation = 'lighter';
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + t / (5200 + i * 340) + i * 1.7;
    const wob = Math.sin(t / (600 + i * 90) + i) * R * 0.06;
    ctx.strokeStyle = `hsla(${hue}, 85%, 70%, ${(0.10 + 0.05 * Math.sin(t / 240 + i * 2)) * k})`;
    ctx.lineWidth = 1.5 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R);
    ctx.quadraticCurveTo(wob, -wob, Math.cos(a + Math.PI * 0.92) * R, Math.sin(a + Math.PI * 0.92) * R);
    ctx.stroke();
  }
  // dim core mist
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.8);
  g.addColorStop(0, `hsla(${hue}, 70%, 55%, ${0.10 * k})`);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(-R * 0.8, -R * 0.8, R * 1.6, R * 1.6);
  ctx.globalCompositeOperation = 'source-over';
}

function fieldBody(t, hue, k, e, R) {
  const flick = 0.92 + 0.08 * Math.sin(t / 47) * Math.sin(t / 131);
  const a = k * flick;

  // base field: bright rim, deep core — a projected volume, not paint
  let g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, `hsla(${hue}, 60%, 12%, ${0.88 * a})`);
  g.addColorStop(0.55, `hsla(${hue}, 80%, 30%, ${0.8 * a})`);
  g.addColorStop(0.85, `hsla(${hue}, 90%, 55%, ${0.75 * a})`);
  g.addColorStop(1, `hsla(${hue}, 95%, 78%, ${0.9 * a})`);
  ctx.fillStyle = g;
  ctx.fillRect(-R, -R, 2 * R, 2 * R);

  ctx.globalCompositeOperation = 'lighter';

  // interference rings drifting inward (something on the far side breathing)
  for (let i = 0; i < 5; i++) {
    const rr = R * (((t / (2400 + i * 300) + i * 0.21) % 1));
    ctx.strokeStyle = `hsla(${hue}, 90%, 75%, ${0.10 * a * (1 - rr / R)})`;
    ctx.lineWidth = 2 + 5 * (1 - rr / R);
    ctx.beginPath(); ctx.arc(0, 0, R - rr, 0, TAU); ctx.stroke();
  }

  // scan tears: two horizontal shear bands crawling upward
  for (let i = 0; i < 2; i++) {
    const y = ((1 - ((t / (3100 + i * 900) + i * 0.5) % 1)) * 2 - 1) * R;
    const hgt = R * (0.045 + 0.02 * i);
    const shear = Math.sin(t / 210 + i * 3) * R * 0.05;
    ctx.fillStyle = `hsla(${hue}, 95%, 82%, ${0.13 * a})`;
    ctx.fillRect(-R + shear, y, 2 * R, hgt);
    ctx.fillStyle = `hsla(${(hue + 40) % 360}, 90%, 70%, ${0.05 * a})`;
    ctx.fillRect(-R - shear, y + hgt, 2 * R, 2);
  }

  // unstable rim: short bright arcs that never sit still
  for (let i = 0; i < 6; i++) {
    const a0 = t / (900 + i * 170) + i * 1.9;
    ctx.strokeStyle = `hsla(${hue}, 95%, 85%, ${(0.22 + 0.12 * Math.sin(t / 90 + i)) * a})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.965, a0, a0 + 0.5 + 0.3 * Math.sin(t / 400 + i)); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}

function collapse(t, hue, R) {
  const k = Math.min(1, (t - S.phaseAt) / 700); // 0..1 over the sever
  const squash = Math.max(0.004, 1 - k * 1.35);
  ctx.save();
  ctx.scale(1, Math.max(0.004, squash));
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
  const a = 1 - k * 0.55;
  g.addColorStop(0, `hsla(${hue}, 90%, 70%, ${0.9 * a})`);
  g.addColorStop(1, `hsla(${hue}, 95%, 85%, ${0.5 * a})`);
  ctx.fillStyle = g;
  ctx.fillRect(-R, -R, 2 * R, 2 * R);
  ctx.restore();
  // dying bright line
  if (squash <= 0.06) {
    ctx.fillStyle = `hsla(${hue}, 100%, 90%, ${(1 - k)})`;
    ctx.fillRect(-R * (1 - k * 0.6), -1.5, 2 * R * (1 - k * 0.6), 3);
  }
}
