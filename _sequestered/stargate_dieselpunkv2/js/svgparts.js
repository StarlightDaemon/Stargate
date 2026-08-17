// Instrument face construction. Everything is drawn once at boot;
// render.js only moves needles/leaves. Seeded jitter gives repeated
// elements (ticks, rays, leaves, guilloché cells) plausible hand-made
// variance instead of machine-perfect repetition.

import { METRES_MIN, METRES_MAX } from './sim.js';

const NS = 'http://www.w3.org/2000/svg';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function el(tag, attrs = {}, parent = null) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}

export const dialAngle = m =>
  -150 + (m - METRES_MIN) / (METRES_MAX - METRES_MIN) * 300;

/* ---------------- main tuning dial ---------------- */
export function buildBigDial(svg) {
  const rnd = mulberry32(19370412);
  const defs = el('defs', {}, svg);
  const face = el('radialGradient', { id: 'dialFace', cx: '38%', cy: '30%', r: '85%' }, defs);
  el('stop', { offset: '0%', 'stop-color': '#23272b' }, face);
  el('stop', { offset: '55%', 'stop-color': '#101316' }, face);
  el('stop', { offset: '100%', 'stop-color': '#05070a' }, face);
  const rim = el('linearGradient', { id: 'dialRim', x1: '0', y1: '0', x2: '1', y2: '1' }, defs);
  el('stop', { offset: '0%', 'stop-color': '#f2f4f6' }, rim);
  el('stop', { offset: '35%', 'stop-color': '#9ba1a6' }, rim);
  el('stop', { offset: '65%', 'stop-color': '#5a6065' }, rim);
  el('stop', { offset: '100%', 'stop-color': '#c9cdd0' }, rim);
  const hub = el('radialGradient', { id: 'dialHub', cx: '36%', cy: '30%', r: '80%' }, defs);
  el('stop', { offset: '0%', 'stop-color': '#f3dfa0' }, hub);
  el('stop', { offset: '55%', 'stop-color': '#c39b48' }, hub);
  el('stop', { offset: '100%', 'stop-color': '#6e5117' }, hub);

  el('circle', { cx: 200, cy: 200, r: 197, fill: 'url(#dialRim)' }, svg);
  el('circle', { cx: 200, cy: 200, r: 188, fill: 'url(#dialFace)',
    stroke: '#000', 'stroke-width': 2 }, svg);

  const ticks = el('g', { stroke: '#e8dcb2', 'stroke-width': 1.4 }, svg);
  const labels = el('g', {
    fill: '#e8dcb2', 'font-family': 'Georgia, serif',
    'font-size': '17', 'text-anchor': 'middle',
  }, svg);
  for (let m = METRES_MIN; m <= METRES_MAX; m += 5) {
    const major = m % 25 === 0;
    const a = (dialAngle(m) + (rnd() - 0.5) * 0.5) * Math.PI / 180;
    const jl = major ? 20 + (rnd() - 0.5) * 2.5 : 10 + (rnd() - 0.5) * 2;
    const r1 = 182, r2 = 182 - jl;
    const sx = 200 + Math.sin(a) * r1, sy = 200 - Math.cos(a) * r1;
    const ex = 200 + Math.sin(a) * r2, ey = 200 - Math.cos(a) * r2;
    el('line', {
      x1: sx.toFixed(1), y1: sy.toFixed(1), x2: ex.toFixed(1), y2: ey.toFixed(1),
      'stroke-width': major ? 2.6 : 1.3,
      opacity: (0.75 + rnd() * 0.25).toFixed(2),
    }, ticks);
    if (major) {
      const rl = 145;
      const lx = 200 + Math.sin(a) * rl, ly = 200 - Math.cos(a) * rl + 6;
      el('text', { x: lx.toFixed(1), y: ly.toFixed(1),
        opacity: (0.82 + rnd() * 0.18).toFixed(2) }, labels)
        .textContent = m;
    }
  }
  // inner decorative fine ring (slightly worn)
  const fine = el('g', { stroke: '#8f8666', 'stroke-width': 1 }, svg);
  for (let i = 0; i < 120; i++) {
    const a = (-150 + i * 2.5 + (rnd() - 0.5) * 0.8) * Math.PI / 180;
    const r1 = 118, r2 = 112 - rnd() * 2;
    el('line', {
      x1: (200 + Math.sin(a) * r1).toFixed(1), y1: (200 - Math.cos(a) * r1).toFixed(1),
      x2: (200 + Math.sin(a) * r2).toFixed(1), y2: (200 - Math.cos(a) * r2).toFixed(1),
      opacity: (0.35 + rnd() * 0.45).toFixed(2),
    }, fine);
  }

  el('text', {
    x: 200, y: 250, fill: '#b3a678', 'font-family': 'Georgia, serif',
    'font-size': '15', 'letter-spacing': '4', 'text-anchor': 'middle',
  }, svg).textContent = 'CONTINENTAL RECEIVER';
  el('text', {
    x: 200, y: 272, fill: '#7d7355', 'font-family': 'Georgia, serif',
    'font-size': '12', 'letter-spacing': '2', 'text-anchor': 'middle',
  }, svg).textContent = 'METRES';

  // needle
  const ng = el('g', { id: 'dial-needle' }, svg);
  el('path', {
    d: 'M 200 34 L 205 70 L 203 212 L 197 212 L 195 70 Z',
    fill: '#efe3b8', stroke: '#3c3624', 'stroke-width': 1,
  }, ng);
  el('path', { d: 'M 200 34 L 205 70 L 200 64 L 195 70 Z', fill: '#c0392b' }, ng);
  el('circle', { cx: 200, cy: 218, r: 13, fill: '#1a1712' }, ng);
  el('circle', { cx: 200, cy: 200, r: 17, fill: 'url(#dialHub)',
    stroke: '#453214', 'stroke-width': 1.5 }, ng);

  // glass glare — static, light from upper-left
  el('ellipse', {
    cx: 148, cy: 130, rx: 120, ry: 78, fill: 'rgba(255,252,240,0.07)',
    transform: 'rotate(-28 148 130)',
  }, svg);
  return ng;
}

/* ---------------- vernier knob ---------------- */
export function buildVernier(svg) {
  const rnd = mulberry32(8811);
  const defs = el('defs', {}, svg);
  const face = el('radialGradient', { id: 'vernFace', cx: '36%', cy: '30%', r: '85%' }, defs);
  el('stop', { offset: '0%', 'stop-color': '#eef1f3' }, face);
  el('stop', { offset: '45%', 'stop-color': '#a9aeb2' }, face);
  el('stop', { offset: '80%', 'stop-color': '#63686d' }, face);
  el('stop', { offset: '100%', 'stop-color': '#3c4146' }, face);

  // knurl — spokes of uneven darkness
  const g = el('g', { id: 'vern-rot' }, svg);
  el('circle', { cx: 70, cy: 70, r: 64, fill: 'url(#vernFace)',
    stroke: '#22262a', 'stroke-width': 2 }, g);
  for (let i = 0; i < 48; i++) {
    const a = (i * 7.5 + (rnd() - 0.5) * 1.4) * Math.PI / 180;
    el('line', {
      x1: (70 + Math.sin(a) * 63).toFixed(1), y1: (70 - Math.cos(a) * 63).toFixed(1),
      x2: (70 + Math.sin(a) * 55).toFixed(1), y2: (70 - Math.cos(a) * 55).toFixed(1),
      stroke: '#2a2e33', 'stroke-width': 2.4,
      opacity: (0.35 + rnd() * 0.5).toFixed(2),
    }, g);
  }
  el('circle', { cx: 70, cy: 70, r: 50, fill: 'url(#vernFace)', opacity: 0.9,
    stroke: '#54595e', 'stroke-width': 1 }, g);
  el('circle', { cx: 70, cy: 26, r: 5, fill: '#c0392b',
    stroke: '#5b120a', 'stroke-width': 1.4 }, g);
  // fixed center cap + glare
  el('circle', { cx: 70, cy: 70, r: 16, fill: 'url(#vernFace)',
    stroke: '#303439', 'stroke-width': 1.5 }, svg);
  el('ellipse', { cx: 52, cy: 48, rx: 30, ry: 18, fill: 'rgba(255,255,255,0.16)',
    transform: 'rotate(-30 52 48)' }, svg);
  return g;
}

/* ---------------- band selector ---------------- */
export const BAND_ANGLES = [-52, 0, 52];
export function buildBandSel(svg) {
  const defs = el('defs', {}, svg);
  const bak = el('radialGradient', { id: 'bakKnob', cx: '35%', cy: '28%', r: '85%' }, defs);
  el('stop', { offset: '0%', 'stop-color': '#4a4038' }, bak);
  el('stop', { offset: '55%', 'stop-color': '#2a221c' }, bak);
  el('stop', { offset: '100%', 'stop-color': '#140f0b' }, bak);

  el('circle', { cx: 60, cy: 62, r: 55, fill: '#15130f', opacity: 0.55 }, svg); // skirt shadow
  const lbl = el('g', {
    fill: '#d9cba0', 'font-family': 'Georgia, serif', 'font-size': '15',
    'text-anchor': 'middle',
  }, svg);
  ['A', 'B', 'C'].forEach((ch, i) => {
    const a = BAND_ANGLES[i] * Math.PI / 180;
    el('text', { x: (60 + Math.sin(a) * 48).toFixed(1), y: (62 - Math.cos(a) * 48 + 5).toFixed(1) }, lbl)
      .textContent = ch;
  });
  const g = el('g', { id: 'band-rot' }, svg);
  el('circle', { cx: 60, cy: 62, r: 34, fill: 'url(#bakKnob)',
    stroke: '#000', 'stroke-width': 1.5 }, g);
  el('path', {
    d: 'M 60 30 L 66 46 L 66 78 L 54 78 L 54 46 Z',
    fill: '#1b1611', stroke: 'rgba(240,230,200,0.35)', 'stroke-width': 1,
  }, g);
  el('circle', { cx: 60, cy: 40, r: 2.6, fill: '#e8dcb2' }, g);
  el('ellipse', { cx: 48, cy: 48, rx: 16, ry: 10, fill: 'rgba(255,250,235,0.14)',
    transform: 'rotate(-30 48 48)' }, svg);
  return g;
}

/* ---------------- shadow meter ---------------- */
export function buildShadowMeter(svg) {
  const defs = el('defs', {}, svg);
  const glow = el('linearGradient', { id: 'shadowGlow', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
  el('stop', { offset: '0%', 'stop-color': '#f5e6b8' }, glow);
  el('stop', { offset: '55%', 'stop-color': '#e7cf90' }, glow);
  el('stop', { offset: '100%', 'stop-color': '#c9a860' }, glow);

  el('rect', { x: 2, y: 2, width: 146, height: 66, rx: 8,
    fill: '#191510', stroke: '#6a6f74', 'stroke-width': 3 }, svg);
  el('rect', { x: 12, y: 10, width: 126, height: 50, rx: 5,
    fill: 'url(#shadowGlow)', id: 'shadow-lamp' }, svg);
  // the moving shadow — a soft-edged band; width set by render
  const sg = el('g', {}, svg);
  const grad = el('linearGradient', { id: 'shadowBand', x1: '0', y1: '0', x2: '1', y2: '0' }, defs);
  el('stop', { offset: '0%', 'stop-color': 'rgba(20,14,8,0)' }, grad);
  el('stop', { offset: '18%', 'stop-color': 'rgba(20,14,8,0.9)' }, grad);
  el('stop', { offset: '82%', 'stop-color': 'rgba(20,14,8,0.9)' }, grad);
  el('stop', { offset: '100%', 'stop-color': 'rgba(20,14,8,0)' }, grad);
  el('rect', { id: 'shadow-band', x: 25, y: 10, width: 100, height: 50,
    fill: 'url(#shadowBand)' }, sg);
  // hairline + scale marks
  el('line', { x1: 75, y1: 10, x2: 75, y2: 60, stroke: '#8c2f22',
    'stroke-width': 1.6, opacity: 0.9 }, svg);
  for (const dx of [-42, -28, -14, 14, 28, 42]) {
    el('line', { x1: 75 + dx, y1: 56, x2: 75 + dx, y2: 60,
      stroke: '#5c4f35', 'stroke-width': 1 }, svg);
  }
  el('rect', { x: 12, y: 10, width: 126, height: 18,
    fill: 'rgba(255,255,255,0.10)' }, svg); // glass
  return svg.querySelector('#shadow-band');
}

/* ---------------- line voltmeter ---------------- */
export function buildVoltmeter(svg) {
  const rnd = mulberry32(4402);
  el('rect', { x: 2, y: 2, width: 166, height: 92, rx: 10,
    fill: '#efe6cd', stroke: '#5f646a', 'stroke-width': 3 }, svg);
  el('rect', { x: 2, y: 2, width: 166, height: 92, rx: 10,
    fill: 'none', stroke: 'rgba(0,0,0,0.25)', 'stroke-width': 1 }, svg);
  // scale arc: 0..150 V over -55..55 deg, pivot (85, 96)
  const ticks = el('g', { stroke: '#3f3a2c' }, svg);
  const labels = el('g', { fill: '#3f3a2c', 'font-family': 'Georgia, serif',
    'font-size': '11', 'text-anchor': 'middle' }, svg);
  for (let v = 0; v <= 150; v += 10) {
    const major = v % 50 === 0;
    const a = (-55 + v / 150 * 110 + (rnd() - 0.5) * 0.6) * Math.PI / 180;
    const r1 = 74, r2 = major ? 63 : 68;
    el('line', {
      x1: (85 + Math.sin(a) * r1).toFixed(1), y1: (96 - Math.cos(a) * r1).toFixed(1),
      x2: (85 + Math.sin(a) * r2).toFixed(1), y2: (96 - Math.cos(a) * r2).toFixed(1),
      'stroke-width': major ? 2 : 1,
    }, ticks);
    if (major) {
      el('text', { x: (85 + Math.sin(a) * 54).toFixed(1),
        y: (96 - Math.cos(a) * 54).toFixed(1) }, labels).textContent = v;
    }
  }
  // red "operate" sector ~105-130 V
  const a1 = (-55 + 105 / 150 * 110) * Math.PI / 180;
  const a2 = (-55 + 130 / 150 * 110) * Math.PI / 180;
  el('path', {
    d: `M ${85 + Math.sin(a1) * 71} ${96 - Math.cos(a1) * 71}
        A 71 71 0 0 1 ${85 + Math.sin(a2) * 71} ${96 - Math.cos(a2) * 71}`,
    stroke: '#b03a26', 'stroke-width': 4, fill: 'none', opacity: 0.85,
  }, svg);
  el('text', { x: 85, y: 40, fill: '#6a6047', 'font-family': 'Georgia, serif',
    'font-size': '10', 'letter-spacing': '2', 'text-anchor': 'middle' }, svg)
    .textContent = 'LINE VOLTS';
  const ng = el('g', { id: 'volt-needle' }, svg);
  el('line', { x1: 85, y1: 96, x2: 85, y2: 30, stroke: '#a1170a', 'stroke-width': 2.4 }, ng);
  el('circle', { cx: 85, cy: 96, r: 7, fill: '#2c2620' }, ng);
  el('rect', { x: 2, y: 2, width: 166, height: 30, rx: 10,
    fill: 'rgba(255,255,255,0.28)' }, svg); // glass
  return ng;
}

/* ---------------- marquee sunburst ---------------- */
export function buildSunburst(svg) {
  const rnd = mulberry32(1929);
  const g = el('g', { 'stroke-linecap': 'round' }, svg);
  for (let i = 0; i < 27; i++) {
    const a = (-90 + i * 180 / 26 + (rnd() - 0.5) * 2) * Math.PI / 180;
    const len = 34 + rnd() * 22 + (i % 2 ? 8 : 0);
    const warm = rnd() > 0.5;
    el('line', {
      x1: 170 + Math.sin(a) * 12, y1: 88 - Math.cos(a) * 6,
      x2: 170 + Math.sin(a) * (12 + len), y2: 88 - Math.cos(a) * (6 + len * 0.52),
      stroke: warm ? '#a68d55' : '#83888c',
      'stroke-width': (1.1 + rnd() * 1.3).toFixed(2),
      opacity: (0.4 + rnd() * 0.45).toFixed(2),
    }, g);
  }
}

/* ---------------- doorway iris ---------------- */
// 12 chrome leaves around centre (320, 470), enough radius to cover the arch.
export const IRIS_CX = 320, IRIS_CY = 470, IRIS_R = 560;
export function buildIris(svg) {
  const rnd = mulberry32(7107);
  const defs = el('defs', {}, svg);
  const leaves = [];
  for (let i = 0; i < 12; i++) {
    const grad = el('linearGradient', {
      id: `leaf${i}`, x1: '0', y1: '0', x2: '1', y2: '1' }, defs);
    const base = 0.82 + rnd() * 0.25;        // per-leaf brightness variance
    el('stop', { offset: '0%', 'stop-color': shade(238, base) }, grad);
    el('stop', { offset: '38%', 'stop-color': shade(158, base) }, grad);
    el('stop', { offset: '70%', 'stop-color': shade(96, base) }, grad);
    el('stop', { offset: '100%', 'stop-color': shade(170, base) }, grad);
  }
  const g = el('g', {}, svg);
  for (let i = 0; i < 12; i++) {
    const leaf = el('g', {}, g);
    // kite-shaped leaf pointing at centre; pivot sits on the rim
    el('path', {
      d: `M 0 0 L ${IRIS_R * 0.30} ${-IRIS_R * 0.115} L ${IRIS_R * 1.02} 0
          L ${IRIS_R * 0.30} ${IRIS_R * 0.34} Z`,
      fill: `url(#leaf${i})`, stroke: '#1c2024',
      'stroke-width': 2.5, 'stroke-linejoin': 'round',
    }, leaf);
    el('path', {
      d: `M ${IRIS_R * 0.08} ${IRIS_R * 0.012} L ${IRIS_R * 0.94} ${IRIS_R * 0.012}`,
      stroke: 'rgba(255,255,255,0.35)', 'stroke-width': 1.5, fill: 'none',
      opacity: (0.4 + rnd() * 0.5).toFixed(2),
    }, leaf);
    leaves.push(leaf);
  }
  return leaves;
}
function shade(v, k) {
  const c = Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${c},${c + 2},${Math.min(255, c + 5)})`;
}

/* ---------------- engine-turned fascia tile ---------------- */
export function engineTurnTile() {
  const rnd = mulberry32(3355);
  const cell = 44, n = 8;
  const c = document.createElement('canvas');
  c.width = c.height = cell * n;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#9a958a';
  ctx.fillRect(0, 0, c.width, c.height);
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const cx = col * cell + cell / 2 + (row % 2 ? cell * 0.5 : 0);
      const cy = row * cell + cell / 2;
      const a0 = rnd() * Math.PI * 2;
      for (let r = cell * 0.46; r > 3; r -= 2.6) {
        const t = r / (cell * 0.46);
        const light = 0.5 + 0.5 * Math.sin(a0 + r * 0.55);
        ctx.beginPath();
        ctx.arc(cx % c.width, cy, r, a0, a0 + Math.PI * (1.15 + rnd() * 0.5));
        ctx.strokeStyle = `rgba(${light > 0.5 ? '250,247,238' : '92,88,76'},${(0.10 + 0.16 * Math.abs(light - 0.5) * 2) * t + 0.03})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }
  return c.toDataURL('image/png');
}
