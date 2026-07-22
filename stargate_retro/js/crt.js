// crt.js — canvas renderer for the round storage tube. Pure function of
// (state, wall-clock); never authoritative for sim logic.

import { state, DESTS, RATIOS, meshKv, WARMUP_MS, OPEN_MS, COLLAPSE_MS } from './sim.js';

const cv = document.getElementById('scope');
const ctx = cv.getContext('2d');
const W = cv.width, H = cv.height;
const CX = W / 2, CY = H / 2;
const R_RING = W * 0.335;          // final aperture ring radius
const A_FIG = W * 0.30;            // figure amplitude

/* ---------- tiny deterministic value noise ---------- */
const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}
const ease = u => u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;

/* ---------- stroke helpers ---------- */
function strokePath(pts, close, width, alpha, color) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (close) ctx.closePath();
  ctx.lineWidth = width;
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.stroke();
}

// core pass with per-chunk brightness variation (organic beam, not uniform stroke)
function strokeCore(pts, close, width, baseAlpha, color, nSeed, t) {
  const CH = 10;
  for (let i = 0; i < pts.length - 1; i += CH) {
    const end = Math.min(i + CH, pts.length - 1);
    ctx.beginPath();
    ctx.moveTo(pts[i][0], pts[i][1]);
    for (let j = i + 1; j <= end; j++) ctx.lineTo(pts[j][0], pts[j][1]);
    const n = vnoise(nSeed + i * 0.13 + t * 0.0006);
    ctx.globalAlpha = baseAlpha * (0.55 + 0.45 * n);
    ctx.lineWidth = width * (0.8 + 0.5 * n);
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  if (close && pts.length > 2) {
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    ctx.lineTo(pts[0][0], pts[0][1]);
    ctx.globalAlpha = baseAlpha * 0.8;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function glowLayers(pts, close, brightness, nSeed, t) {
  ctx.globalCompositeOperation = 'lighter';
  strokePath(pts, close, 26, 0.045 * brightness, 'rgb(46,220,132)');
  strokePath(pts, close, 10, 0.11 * brightness, 'rgb(82,255,158)');
  strokeCore(pts, close, 3.2, 0.85 * brightness, 'rgb(201,255,223)', nSeed, t);
  ctx.globalAlpha = 1;
}

/* ---------- figure sampling ---------- */
function figurePts(a, b, phiDeg, amp, loops = 1, N = 520) {
  const phi = phiDeg * Math.PI / 180;
  const pts = [];
  const span = Math.PI * 2 * loops;
  for (let i = 0; i <= N; i++) {
    const th = span * i / N;
    pts.push([CX + amp * Math.sin(a * th + phi), CY + amp * Math.sin(b * th)]);
  }
  return pts;
}

/* ---------- organic aperture ring ---------- */
function ringPts(t, amp, rough) {
  const N = 220, pts = [];
  for (let i = 0; i <= N; i++) {
    const th = Math.PI * 2 * i / N;
    const n = vnoise(th * 3.1 + t * 0.00042) - 0.5;
    const n2 = vnoise(th * 7.7 + 40 + t * 0.0007) - 0.5;
    const r = amp * (1 + rough * (0.045 * n + 0.018 * n2));
    pts.push([CX + r * Math.cos(th), CY + r * Math.sin(th)]);
  }
  return pts;
}

function drawWisps(t, brightness) {
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgb(82,255,158)';
  for (let k = 0; k < 14; k++) {
    const th0 = (k / 14) * Math.PI * 2 + 2.4 * vnoise(k * 9.7 + t * 0.00013);
    const dir = (k % 2 === 0) ? 1 : -1;                       // outward and inward
    const len = R_RING * (0.10 + 0.16 * vnoise(k * 3.3 + t * 0.0004));
    const alpha = 0.05 + 0.09 * vnoise(k * 5.1 + 7 + t * 0.0009);
    ctx.beginPath();
    let r = R_RING, th = th0;
    ctx.moveTo(CX + r * Math.cos(th), CY + r * Math.sin(th));
    for (let s = 1; s <= 7; s++) {
      r += dir * len / 7;
      th += 0.05 * (vnoise(k * 13.7 + s * 1.9 + t * 0.0006) - 0.5);
      ctx.lineTo(CX + r * Math.cos(th), CY + r * Math.sin(th));
    }
    ctx.globalAlpha = alpha * brightness;
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawHalo(brightness, radius) {
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(CX, CY, radius * 0.55, CX, CY, radius * 1.5);
  g.addColorStop(0, 'rgba(82,255,158,0)');
  g.addColorStop(0.28, `rgba(82,255,158,${0.10 * brightness})`);
  g.addColorStop(0.32, `rgba(120,255,180,${0.13 * brightness})`);
  g.addColorStop(0.4, `rgba(82,255,158,${0.05 * brightness})`);
  g.addColorStop(1, 'rgba(82,255,158,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // faint inner shimmer — the far side
  const g2 = ctx.createRadialGradient(CX, CY, 0, CX, CY, radius * 0.9);
  g2.addColorStop(0, `rgba(160,255,205,${0.045 * brightness})`);
  g2.addColorStop(0.7, `rgba(82,255,158,${0.02 * brightness})`);
  g2.addColorStop(1, 'rgba(82,255,158,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);
}

/* ---------- sparse vector HUD ---------- */
function drawHUD(warm) {
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgb(30,158,95)';
  ctx.globalAlpha = 0.20 * warm;
  ctx.lineWidth = 1.5;
  const Rt = W * 0.44;
  // crosshair ticks N/E/S/W
  for (let k = 0; k < 4; k++) {
    const th = k * Math.PI / 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(CX + (Rt - 16) * Math.cos(th), CY + (Rt - 16) * Math.sin(th));
    ctx.lineTo(CX + (Rt + 10) * Math.cos(th), CY + (Rt + 10) * Math.sin(th));
    ctx.stroke();
  }
  // partial bracket corners
  const b = W * 0.315, L = 34;
  ctx.beginPath();
  ctx.moveTo(CX - b, CY - b + L); ctx.lineTo(CX - b, CY - b); ctx.lineTo(CX - b + L, CY - b);
  ctx.moveTo(CX + b, CY + b - L); ctx.lineTo(CX + b, CY + b); ctx.lineTo(CX + b - L, CY + b);
  ctx.stroke();
  // faint arc guide with degree ticks, lower-left
  ctx.globalAlpha = 0.13 * warm;
  ctx.beginPath();
  ctx.arc(CX, CY, W * 0.40, Math.PI * 0.62, Math.PI * 0.92);
  ctx.stroke();
  for (let k = 0; k <= 6; k++) {
    const th = Math.PI * (0.62 + 0.05 * k);
    ctx.beginPath();
    ctx.moveTo(CX + W * 0.395 * Math.cos(th), CY + W * 0.395 * Math.sin(th));
    ctx.lineTo(CX + W * 0.408 * Math.cos(th), CY + W * 0.408 * Math.sin(th));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/* ---------- master render ---------- */
export function render(t) {
  // phosphor persistence: fade what's there
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  if (!state.power) { ctx.globalCompositeOperation = 'source-over'; return; }

  const warm = ease(Math.min(1, (t - state.powerAt) / WARMUP_MS));
  if (warm <= 0.02) return;

  drawHUD(warm);

  const ap = state.aperture;
  const flick = 0.94 + 0.06 * vnoise(t * 0.004);      // gentle supply flicker

  if (ap.st === 'opening' || ap.st === 'open' || ap.st === 'collapsing') {
    const d = DESTS[ap.destIdx];
    if (ap.st === 'opening') {
      // figure unwinds into the ring: a,b -> 1, phase -> 90deg
      const u = ease(Math.min(1, (t - ap.t0) / OPEN_MS));
      const a = lerp(d.a, 1, u), b = lerp(d.b, 1, u);
      const phi = lerp(d.phase, 90, u);
      const amp = lerp(A_FIG, R_RING, u);
      const loops = Number.isInteger(a) && Number.isInteger(b) ? 1 : 5;
      const pts = figurePts(a, b, phi, amp, loops, loops > 1 ? 900 : 520);
      glowLayers(pts, loops === 1, warm * flick * (0.8 + 0.5 * u), 3, t);
      drawHalo(u * 0.7 * flick, R_RING);
      if (u > 0.6) drawWisps(t, (u - 0.6) / 0.4 * 0.8);
    } else if (ap.st === 'open') {
      const pts = ringPts(t, R_RING, 1);
      glowLayers(pts, true, 1.25 * flick * warm, 17, t);
      drawHalo(1 * flick, R_RING);
      drawWisps(t, 1);
    } else {
      const u = 1 - Math.min(1, (t - ap.t0) / COLLAPSE_MS);
      const pts = ringPts(t, R_RING * (0.25 + 0.75 * u), 1 + 2 * (1 - u));
      glowLayers(pts, true, 1.1 * u * u * flick, 17, t);
      drawHalo(u * u, R_RING * (0.25 + 0.75 * u));
      drawWisps(t, u * 0.6);
    }
    ctx.globalCompositeOperation = 'source-over';
    return;
  }

  // graticule mask: registered destination as faint steady ghost
  if (state.register != null) {
    const d = DESTS[state.register];
    const pts = figurePts(d.a, d.b, d.phase, A_FIG, 1, 360);
    ctx.globalCompositeOperation = 'lighter';
    ctx.setLineDash([5, 9]);
    strokePath(pts, true, 1.6, 0.16 * warm, 'rgb(30,158,95)');
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  if (state.live) {
    // a struck/recalled trace stands in the mesh: steady, bright, immune to knobs
    const d = DESTS[state.live.destIdx];
    const flood = state.live.source === 'recalled'
      ? 1 + 1.6 * Math.max(0, 1 - (t - state.live.at) / 600)   // recall flood flash
      : 1;
    const pts = figurePts(d.a, d.b, d.phase, A_FIG, 1, 520);
    glowLayers(pts, true, 1.05 * flood * flick * warm, 11, t);
  } else {
    // live oscillator figure
    const [a, b] = RATIOS[state.ratioIdx];
    let phi = state.phase, jit = 0, bright = 0.75;
    if (state.latch) {
      phi = DESTS[state.latch.destIdx].phase;                  // AFC holds it dead
      bright = 1.0;
    } else {
      // free-run wander: slow drift + small jitter, stronger at 1:1 rest
      const drift = state.ratioIdx === 0 ? 26 : 7;
      phi += drift * (vnoise(t * 0.00012) - 0.5) * 2;
      jit = 1.6 * (vnoise(t * 0.003 + 50) - 0.5);
      // near-tolerance: figure steadies and brightens as you close in
      const pend = state.latchPendingAt != null;
      if (pend) { bright = 0.95; phi = state.phase + jit * 0.3; }
    }
    const pts = figurePts(a, b, phi + jit, A_FIG * (1 + 0.004 * (vnoise(t * 0.002) - 0.5)), 1, 520);
    glowLayers(pts, true, bright * flick * warm, 7, t);
  }

  ctx.globalCompositeOperation = 'source-over';
}
