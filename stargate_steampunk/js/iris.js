/* The brass iris and the æther chamber behind it.
   Blade angles and the æther field are pure functions of (t, openness). */

const NS = 'http://www.w3.org/2000/svg';
const N_BLADES = 12;
const MAX_ROT = 66;              // degrees at openness 1

let blades = [];
let actx = null;

function el(name, attrs, parent) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

export function buildIris() {
  const svg = document.getElementById('iris');
  const defs = el('defs', {}, svg);
  const grad = el('linearGradient', { id: 'bladeBrass', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
  el('stop', { offset: '0%',  'stop-color': '#93712f' }, grad);
  el('stop', { offset: '45%', 'stop-color': '#c9a55a' }, grad);
  el('stop', { offset: '100%','stop-color': '#6b5222' }, grad);
  const ringGrad = el('linearGradient', { id: 'ringBrass', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: '0%',  'stop-color': '#d3b262' }, ringGrad);
  el('stop', { offset: '50%', 'stop-color': '#8f6f2c' }, ringGrad);
  el('stop', { offset: '100%','stop-color': '#b6934a' }, ringGrad);

  const bladeGroup = el('g', {}, svg);
  const d = [
    'M 0,-10',
    'C 52,-30 128,-34 178,-22',
    'C 196,-17 206,-6 206,2',
    'C 206,10 190,20 168,24',
    'C 110,34 44,26 0,10',
    'Z',
  ].join(' ');
  blades = [];
  for (let i = 0; i < N_BLADES; i++) {
    const wing = el('g', { transform: `rotate(${i * (360 / N_BLADES)},220,220)` }, bladeGroup);
    const p = el('path', {
      d, fill: 'url(#bladeBrass)', stroke: '#241a0c', 'stroke-width': '1.2',
      transform: 'translate(34 220) rotate(0)',
    }, wing);
    blades.push(p);
  }

  /* bezel ring drawn over the blades so retracted leaves vanish behind it */
  el('path', {
    d: 'M220,0 A220,220 0 1,0 220,440 A220,220 0 1,0 220,0 Z ' +
       'M220,44 A176,176 0 1,1 219.9,44 Z',
    'fill-rule': 'evenodd', fill: 'url(#ringBrass)',
    stroke: '#3a2b0c', 'stroke-width': '2',
  }, svg);
  el('circle', { cx: 220, cy: 220, r: 176, fill: 'none', stroke: '#241a0c', 'stroke-width': 3 }, svg);
  el('circle', { cx: 220, cy: 220, r: 217, fill: 'none', stroke: '#241a0c', 'stroke-width': 3 }, svg);
  for (let i = 0; i < N_BLADES; i++) {
    const a = (i * 30 + 15) * Math.PI / 180;
    el('circle', {
      cx: 220 + Math.cos(a) * 197, cy: 220 + Math.sin(a) * 197, r: 5.5,
      fill: '#7a5c26', stroke: '#241a0c', 'stroke-width': 1,
    }, svg);
  }

  actx = document.getElementById('aether').getContext('2d');
}

export function renderIris(t, openness, live) {
  const rot = openness * MAX_ROT;
  for (const b of blades) {
    b.setAttribute('transform', `translate(34 220) rotate(${rot.toFixed(2)})`);
  }
  drawAether(t, openness, live);
}

const LIVE_COLORS = ['#e8c874', '#b8d4a0', '#f4ead0', '#d9a648', '#9fc9a6'];
const DEAD_COLORS = ['#5a5a55', '#6b6862', '#4c4a44', '#5f5d57', '#565550'];

function drawAether(t, openness, live) {
  const c = actx;
  c.clearRect(0, 0, 440, 440);
  /* chamber */
  c.fillStyle = '#080604';
  c.beginPath(); c.arc(220, 220, 176, 0, Math.PI * 2); c.fill();
  if (openness <= 0.01) return;

  const colors = live ? LIVE_COLORS : DEAD_COLORS;
  c.save();
  c.beginPath(); c.arc(220, 220, 173, 0, Math.PI * 2); c.clip();

  /* base wash */
  const wash = c.createRadialGradient(220, 220, 10, 220, 220, 175);
  wash.addColorStop(0, live ? 'rgba(244,234,208,0.9)' : 'rgba(120,118,110,0.55)');
  wash.addColorStop(0.55, live ? 'rgba(216,178,92,0.45)' : 'rgba(90,88,82,0.3)');
  wash.addColorStop(1, 'rgba(20,16,8,0)');
  c.globalAlpha = 0.6 * openness;
  c.fillStyle = wash;
  c.fillRect(45, 45, 350, 350);

  /* drifting blobs — fill only each gradient's bounding box (perf lesson) */
  for (let i = 0; i < 7; i++) {
    const w = 0.13 + i * 0.037;
    const ang = t * w * (i % 2 ? 1 : -1) + i * 0.9;
    const orb = 52 + 46 * Math.sin(t * 0.21 + i * 1.7);
    const x = 220 + Math.cos(ang) * orb;
    const y = 220 + Math.sin(ang) * orb * 0.92;
    const rad = 58 + 30 * Math.sin(t * 0.6 + i * 2.1);
    const g = c.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, colors[i % colors.length]);
    g.addColorStop(1, 'rgba(20,16,8,0)');
    c.globalAlpha = 0.15 * openness * (live ? 1 : 0.7);
    c.fillStyle = g;
    c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  /* slow ripples travelling outward */
  for (let i = 0; i < 3; i++) {
    const k = ((t * 0.22 + i / 3) % 1);
    const r = 12 + k * 160;
    c.globalAlpha = (1 - k) * 0.22 * openness * (live ? 1 : 0.4);
    c.strokeStyle = live ? '#f4ead0' : '#8a887f';
    c.lineWidth = 2.2 * (1 - k) + 0.4;
    c.beginPath(); c.arc(220, 220, r, 0, Math.PI * 2); c.stroke();
  }

  /* breathing core */
  const pulse = 0.5 + 0.5 * Math.sin(t * 1.4);
  const cg = c.createRadialGradient(220, 220, 0, 220, 220, 60 + pulse * 14);
  cg.addColorStop(0, live ? 'rgba(255,250,232,0.95)' : 'rgba(150,148,140,0.5)');
  cg.addColorStop(1, 'rgba(20,16,8,0)');
  c.globalAlpha = (0.5 + 0.25 * pulse) * openness;
  c.fillStyle = cg;
  c.fillRect(220 - 78, 220 - 78, 156, 156);

  c.restore();
  c.globalAlpha = 1;
}
