// arc.js — the traction arc in the stator bore.
// Blue-white arc curtain with sodium-orange rim fringe; drawn only while
// striking / open / collapsing, otherwise the canvas stays transparent
// and the rotor shows through.

import { S } from './sim.js';
import { clamp, el } from './util.js';

let cv, ctx, R;

export function buildArc() {
  cv = el('arc-canvas');
  ctx = cv.getContext('2d');
  R = cv.width / 2;
}

export function arcIntensity(t) {
  const dt = t - S.arcT0;
  if (S.arc === 'striking') return clamp(dt / 0.9, 0, 1) * (0.55 + 0.45 * Math.random());
  if (S.arc === 'open') return 0.88 + Math.sin(t * 8.3) * 0.06 + Math.sin(t * 21.7) * 0.04;
  if (S.arc === 'collapsing') return clamp(1 - dt / 1.3, 0, 1) * (0.5 + 0.5 * Math.random());
  return 0;
}

function filament(a0, a1, rr0, rr1, segs, wobble) {
  ctx.beginPath();
  for (let i = 0; i <= segs; i++) {
    const f = i / segs;
    const a = a0 + (a1 - a0) * f + (Math.random() - 0.5) * wobble * 0.12;
    const rr = rr0 + (rr1 - rr0) * f + (Math.random() - 0.5) * wobble;
    const x = R + rr * Math.cos(a), y = R + rr * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

export function renderArc(t) {
  const k = arcIntensity(t);
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (k <= 0.01) return;

  ctx.save();
  ctx.beginPath();
  ctx.arc(R, R, R - 1, 0, Math.PI * 2);
  ctx.clip();

  // haze body — churn by wandering the gradient centre
  const wx = R + Math.sin(t * 0.7) * R * 0.18, wy = R + Math.cos(t * 0.53) * R * 0.15;
  let g = ctx.createRadialGradient(wx, wy, R * 0.05, R, R, R);
  g.addColorStop(0, `rgba(207,232,255,${0.34 * k})`);
  g.addColorStop(0.45, `rgba(111,176,255,${0.30 * k})`);
  g.addColorStop(0.82, `rgba(38,72,140,${0.38 * k})`);
  g.addColorStop(1, `rgba(255,138,52,${0.30 * k})`); // sodium fringe at the gap
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cv.width, cv.height);

  // slow curtain bands
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const a = t * (0.25 + i * 0.11) + i * 2.1;
    const bx = R + Math.cos(a) * R * 0.45, by = R + Math.sin(a * 0.83) * R * 0.45;
    const bg = ctx.createRadialGradient(bx, by, 0, bx, by, R * 0.55);
    bg.addColorStop(0, `rgba(140,190,255,${0.10 * k})`);
    bg.addColorStop(1, 'rgba(140,190,255,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cv.width, cv.height);
  }

  // arc filaments: rim-to-rim discharges, count scales with intensity
  const n = Math.round(2 + k * 5);
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a0 = Math.random() * Math.PI * 2;
    const a1 = a0 + Math.PI * (0.5 + Math.random() * 0.9);
    const bright = 0.35 + Math.random() * 0.65;
    ctx.strokeStyle = `rgba(214,236,255,${(0.5 * bright * k).toFixed(3)})`;
    ctx.lineWidth = 1.2 + Math.random() * 2.2;
    ctx.shadowColor = 'rgba(120,180,255,0.9)';
    ctx.shadowBlur = 14;
    filament(a0, a1, R * (0.86 + Math.random() * 0.1), R * (0.86 + Math.random() * 0.1), 14, R * 0.34);
  }
  // occasional core flash across the middle
  if (Math.random() < 0.16 * k) {
    ctx.strokeStyle = `rgba(255,255,255,${0.75 * k})`;
    ctx.lineWidth = 2.6;
    ctx.shadowBlur = 22;
    const a0 = Math.random() * Math.PI * 2;
    filament(a0, a0 + Math.PI * (0.9 + Math.random() * 0.2), R * 0.92, R * 0.92, 18, R * 0.5);
  }
  ctx.shadowBlur = 0;

  // sodium sputter at the gap ring
  for (let i = 0; i < 5; i++) {
    if (Math.random() > 0.5 * k) continue;
    const a = Math.random() * Math.PI * 2;
    const x = R + Math.cos(a) * (R - 5), y = R + Math.sin(a) * (R - 5);
    ctx.fillStyle = `rgba(255,154,60,${(0.3 + Math.random() * 0.4) * k})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}
