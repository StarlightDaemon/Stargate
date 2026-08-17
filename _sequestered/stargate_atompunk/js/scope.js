// PPI scope renderer. Every frame is drawn purely from (state, t) — no
// accumulation buffers — so a single frame in a rAF-starved pane is still
// a correct picture of the model at that instant.

import {
  DESTS, destById, sweepAngle, blipFreshness, paintsOf, PAINTS_NEEDED,
  RANGE_MAX, renderGates,
} from './sim.js';

const TAU = Math.PI * 2;
const toRad = deg => (deg - 90) * Math.PI / 180; // 0° = north, clockwise

// P7 phosphor palette: blue-white flash decaying to warm amber persistence
const FLASH = '215, 235, 255';
const TRAIL = '255, 176, 84';
const ETCH  = '255, 190, 110';

export function drawScope(canvas, state, t) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) / 2 - 10;

  // tube face
  ctx.clearRect(0, 0, w, h);
  const face = ctx.createRadialGradient(cx, cy - R * 0.25, R * 0.1, cx, cy, R);
  face.addColorStop(0, '#191410');
  face.addColorStop(0.75, '#120e0a');
  face.addColorStop(1, '#0a0705');
  ctx.fillStyle = face;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R - 2, 0, TAU); ctx.clip();

  if (state.ht) {
    drawGraticule(ctx, cx, cy, R);
    if (state.open) {
      drawAperture(ctx, state, t, cx, cy, R);
    } else {
      drawSweep(ctx, state, t, cx, cy, R);
      drawBlips(ctx, state, t, cx, cy, R);
      drawGates(ctx, state, t, cx, cy, R);
      drawTrackMark(ctx, state, t, cx, cy, R);
    }
  } else {
    // cold tube: faint graticule etching only
    ctx.globalAlpha = 0.14;
    drawGraticule(ctx, cx, cy, R);
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // glass highlight
  const gl = ctx.createRadialGradient(cx - R * 0.45, cy - R * 0.55, R * 0.05, cx - R * 0.3, cy - R * 0.4, R * 0.9);
  gl.addColorStop(0, 'rgba(255,255,255,0.055)');
  gl.addColorStop(0.4, 'rgba(255,255,255,0.015)');
  gl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
}

function drawGraticule(ctx, cx, cy, R) {
  ctx.strokeStyle = `rgba(${ETCH}, 0.16)`;
  ctx.lineWidth = 1;
  // range rings every 50 mi
  for (let mi = 50; mi <= RANGE_MAX; mi += 50) {
    ctx.beginPath(); ctx.arc(cx, cy, R * mi / RANGE_MAX, 0, TAU); ctx.stroke();
  }
  // bearing ticks
  for (let b = 0; b < 360; b += 15) {
    const major = b % 45 === 0;
    const a = toRad(b);
    const r0 = major ? R * 0.94 : R * 0.965;
    ctx.strokeStyle = `rgba(${ETCH}, ${major ? 0.3 : 0.16})`;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * R * 0.995, cy + Math.sin(a) * R * 0.995);
    ctx.stroke();
  }
  // cardinal bearing numerals
  ctx.fillStyle = `rgba(${ETCH}, 0.4)`;
  ctx.font = `${Math.round(R * 0.05)}px "Lucida Console", monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let b = 0; b < 360; b += 45) {
    const a = toRad(b);
    ctx.fillText(String(b).padStart(3, '0'),
      cx + Math.cos(a) * R * 0.885, cy + Math.sin(a) * R * 0.885);
  }
}

function drawSweep(ctx, state, t, cx, cy, R) {
  const ang = sweepAngle(state, t);
  const a = toRad(ang);
  // trailing persistence: smooth conic-gradient wedge, ~220° of decaying amber
  const WEDGE = 220;
  const grad = ctx.createConicGradient(toRad(ang - WEDGE), cx, cy);
  const span = WEDGE / 360;
  for (let i = 0; i <= 12; i++) {
    const k = i / 12; // 0 stale .. 1 fresh along the gradient
    grad.addColorStop(k * span, `rgba(${TRAIL}, ${0.30 * Math.pow(k, 2.1)})`);
  }
  grad.addColorStop(Math.min(1, span + 0.002), `rgba(${TRAIL}, 0)`);
  grad.addColorStop(1, `rgba(${TRAIL}, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
  // leading edge: pale blue-white line with glow
  ctx.save();
  ctx.shadowColor = `rgba(${FLASH}, 0.9)`;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = `rgba(${FLASH}, 0.95)`;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
  ctx.stroke();
  ctx.restore();
  // center pip
  ctx.fillStyle = `rgba(${TRAIL}, 0.8)`;
  ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, TAU); ctx.fill();
}

function drawBlips(ctx, state, t, cx, cy, R) {
  for (const d of DESTS) {
    const f = blipFreshness(state, t, d.brg);
    if (f <= 0) continue;
    const a = toRad(d.brg);
    const r = R * d.rng / RANGE_MAX;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    const glow = Math.pow(f, 1.6);
    const size = 4 + 3.5 * glow;
    ctx.save();
    if (f > 0.94) {
      // just painted: blue-white flash
      ctx.shadowColor = `rgba(${FLASH}, 0.95)`;
      ctx.shadowBlur = 16;
      ctx.fillStyle = `rgba(${FLASH}, 0.95)`;
    } else {
      ctx.shadowColor = `rgba(${TRAIL}, ${0.7 * glow})`;
      ctx.shadowBlur = 10 * glow;
      ctx.fillStyle = `rgba(${TRAIL}, ${0.15 + 0.75 * glow})`;
    }
    ctx.beginPath();
    ctx.ellipse(x, y, size * 1.5, size * 0.8, a + Math.PI / 2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawGates(ctx, state, t, cx, cy, R) {
  const g = renderGates(state, t);
  const a = toRad(g.brg);
  // bearing cursor: dashed radial
  ctx.save();
  ctx.setLineDash([7, 6]);
  ctx.strokeStyle = `rgba(${ETCH}, 0.75)`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(a) * R * 0.985, cy + Math.sin(a) * R * 0.985);
  ctx.stroke();
  ctx.restore();
  // range gate: bright arc pair straddling the gate radius, centred on cursor
  const r = R * g.rng / RANGE_MAX;
  const halfArc = 0.22; // radians either side
  ctx.strokeStyle = `rgba(${ETCH}, 0.85)`;
  ctx.lineWidth = 2;
  for (const dr of [-7, 7]) {
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(6, r + dr), a - halfArc, a + halfArc);
    ctx.stroke();
  }
}

function drawTrackMark(ctx, state, t, cx, cy, R) {
  if (!state.track) return;
  const d = destById(state.track.destId);
  const a = toRad(d.brg);
  const r = R * d.rng / RANGE_MAX;
  const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
  const paints = paintsOf(state, t);
  const s = 17;
  ctx.save();
  ctx.translate(x, y);
  if (state.locked) {
    // firm track: steady diamond
    ctx.strokeStyle = state.verified ? `rgba(${FLASH}, 0.95)` : `rgba(${ETCH}, 0.9)`;
    ctx.lineWidth = 2;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0);
    ctx.closePath(); ctx.stroke();
  } else {
    // building track: one corner bracket per completed paint
    ctx.strokeStyle = `rgba(${ETCH}, 0.8)`;
    ctx.lineWidth = 2;
    const corners = [[-s, -s, 1, 1], [s, -s, -1, 1], [s, s, -1, -1], [-s, s, 1, -1]];
    for (let i = 0; i < Math.min(paints + 1, 4) && i < PAINTS_NEEDED + 1; i++) {
      if (i >= paints) break;
      const [px, py, dx, dy] = corners[i];
      ctx.beginPath();
      ctx.moveTo(px + dx * 8, py);
      ctx.lineTo(px, py);
      ctx.lineTo(px, py + dy * 8);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawAperture(ctx, state, t, cx, cy, R) {
  // The scope becomes the open threshold: churning concentric phosphor rings
  // pouring outward from the acquired blip's phase, closed-form in t.
  const d = destById(state.verifiedDest) || DESTS[0];
  const dt = (t - state.openedAtT) / 1000;
  const grow = Math.min(1, dt / 1.4); // pool floods the tube over ~1.4 s
  const g0 = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * grow);
  g0.addColorStop(0, `rgba(${FLASH}, ${0.55 * grow})`);
  g0.addColorStop(0.35, `rgba(${TRAIL}, ${0.4 * grow})`);
  g0.addColorStop(1, 'rgba(20, 12, 6, 0)');
  ctx.fillStyle = g0;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();

  // travelling rings
  for (let i = 0; i < 7; i++) {
    const ph = ((dt * 0.55 + i / 7) % 1);
    const rr = R * (0.08 + 0.9 * ph) * grow;
    const alpha = 0.5 * (1 - ph) * grow;
    if (alpha < 0.01) continue;
    ctx.strokeStyle = i % 2 ? `rgba(${TRAIL}, ${alpha})` : `rgba(${FLASH}, ${alpha * 0.8})`;
    ctx.lineWidth = 2 + 6 * (1 - ph);
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.stroke();
  }

  // radial shimmer spokes, slowly precessing
  ctx.save();
  ctx.globalAlpha = 0.22 * grow;
  for (let i = 0; i < 24; i++) {
    const a = toRad(i * 15 + dt * 21 + d.brg);
    const wob = 0.6 + 0.4 * Math.sin(dt * 3.1 + i * 1.7);
    ctx.strokeStyle = `rgba(${FLASH}, ${0.5 * wob})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R * 0.18, cy + Math.sin(a) * R * 0.18);
    ctx.lineTo(cx + Math.cos(a) * R * (0.5 + 0.35 * wob), cy + Math.sin(a) * R * (0.5 + 0.35 * wob));
    ctx.stroke();
  }
  ctx.restore();

  // bright core
  ctx.save();
  ctx.shadowColor = `rgba(${FLASH}, 0.9)`;
  ctx.shadowBlur = 30;
  ctx.fillStyle = `rgba(240, 248, 255, ${0.85 * grow})`;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.13 * (1 + 0.06 * Math.sin(dt * 5.3)), 0, TAU);
  ctx.fill();
  ctx.restore();
}
