// scope.js — round beat scope CRT (green phosphor, persistence).
// Shows: dead trace when no carrier; beat wave whose density/scroll speed
// follow the beat against the posted station; coder-drum pulses while
// keying; the answering signature (double-pulse train) when a station replies.

import { S, kcAt, beatAt, destById, now, KEY_DUR_S, ANSWER_DELAY_S } from './sim.js';
import { clamp } from './util.js';

let cv, ctx, W, H;

export function buildScope(canvas) {
  cv = canvas;
  ctx = cv.getContext('2d');
  W = cv.width; H = cv.height;
  ctx.fillStyle = '#050b06';
  ctx.fillRect(0, 0, W, H);
}

export function renderScope(t) {
  // phosphor decay
  ctx.fillStyle = 'rgba(5,11,6,0.28)';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, W / 2 - 2, 0, Math.PI * 2);
  ctx.clip();

  // graticule
  ctx.strokeStyle = 'rgba(60,110,70,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
  ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H);
  ctx.stroke();

  const kc = kcAt(t);
  const beat = beatAt(t);
  const mid = H / 2;

  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(120,255,150,0.85)';
  ctx.shadowColor = 'rgba(90,230,120,0.8)';
  ctx.shadowBlur = 6;

  ctx.beginPath();
  if (kc <= 0 || beat === null) {
    // dead / no carrier: flat line with mains ripple + noise
    for (let x = 0; x <= W; x += 2) {
      const y = mid + Math.sin(x * 0.3 + t * 4) * 0.8 + (Math.random() - 0.5) * (kc > 0 ? 2.5 : 1.2);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
  } else {
    // beat wave: spatial density and scroll rate follow |beat|
    const b = Math.abs(beat);                       // kc
    const dens = clamp(b * 6, 0.08, 9);             // cycles across screen
    const scroll = beat * 40;                       // drift direction shows high/low side
    const amp = clamp(18 - b * 2, 5, 18);
    for (let x = 0; x <= W; x += 2) {
      const ph = (x / W) * dens * Math.PI * 2 - t * scroll;
      const y = mid + Math.sin(ph) * amp + (Math.random() - 0.5) * 1.4;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // outgoing call: coder-drum pulses marching across the top
  if (S.keying) {
    const p = (t - S.keyT0) / KEY_DUR_S;
    ctx.fillStyle = 'rgba(160,255,180,0.9)';
    for (let i = 0; i < 12; i++) {
      const on = [1,1,0,1,0,0,1,1,1,0,1,0][i];      // arbitrary drum pattern
      if (!on) continue;
      const x = ((i / 12 - p * 1.4) % 1 + 1) % 1 * W;
      ctx.fillRect(x, H * 0.22, 9, 4);
    }
  }

  // answering signature: stacked double-pulse train, unmistakable
  if (S.answered) {
    ctx.fillStyle = 'rgba(190,255,205,0.95)';
    const ph = (t * 0.45) % 1;
    for (let i = 0; i < 6; i++) {
      const x = ((i / 6 + ph) % 1) * W;
      ctx.fillRect(x, H * 0.74, 12, 5);
      ctx.fillRect(x + 18, H * 0.74, 5, 5);
    }
  } else if (S.noReplyAt !== null && t - S.noReplyAt < 4) {
    // brief "nothing came back" — just deeper noise
    ctx.fillStyle = 'rgba(120,255,150,0.25)';
    for (let i = 0; i < 30; i++) {
      ctx.fillRect(Math.random() * W, H * 0.7 + Math.random() * H * 0.12, 2, 2);
    }
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

// magic-eye closure: 1 = fully closed (perfect null), 0 = wide open
export function eyeClosure(t) {
  const beat = beatAt(t);
  if (beat === null || kcAt(t) <= 0) return 0;
  return clamp(1 - Math.abs(beat) / 3, 0, 1);
}
