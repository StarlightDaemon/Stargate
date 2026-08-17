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
  /* primary blade-body gradient: a curved, beveled brass vane — lit
     ridge along the outer curve, mid-tone body, AO shadow along the
     inner curve where the next blade overlaps it. userSpaceOnUse
     with coordinates matching the path's own d values (not
     objectBoundingBox, which would squash unevenly against this
     shape's aspect ratio) so every blade — identical path, identical
     local transform — reads under the same implied light source. */
  const grad = el('linearGradient', {
    id: 'bladeBrass', gradientUnits: 'userSpaceOnUse', x1: 0, y1: -34, x2: 0, y2: 34,
  }, defs);
  el('stop', { offset: '0%',  'stop-color': '#2a1e0a' }, grad);
  el('stop', { offset: '9%',  'stop-color': '#caa257' }, grad);
  el('stop', { offset: '22%', 'stop-color': '#ecd692' }, grad);
  el('stop', { offset: '44%', 'stop-color': '#a3874a' }, grad);
  el('stop', { offset: '68%', 'stop-color': '#6b5220' }, grad);
  el('stop', { offset: '88%', 'stop-color': '#2e2109' }, grad);
  el('stop', { offset: '100%','stop-color': '#120d04' }, grad);
  /* specular streak along the lit outer curve — a tight bright run,
     not a uniform line, as a curved polished edge actually catches
     light in one place rather than along its whole length */
  const hi = el('linearGradient', {
    id: 'bladeHighlight', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 206, y2: 0,
  }, defs);
  el('stop', { offset: '0%',  'stop-color': '#fff3d2', 'stop-opacity': '0' }, hi);
  el('stop', { offset: '28%', 'stop-color': '#fff3d2', 'stop-opacity': '0' }, hi);
  el('stop', { offset: '42%', 'stop-color': '#fff6de', 'stop-opacity': '0.85' }, hi);
  el('stop', { offset: '58%', 'stop-color': '#fff6de', 'stop-opacity': '0.4' }, hi);
  el('stop', { offset: '78%', 'stop-color': '#fff3d2', 'stop-opacity': '0' }, hi);
  el('stop', { offset: '100%','stop-color': '#fff3d2', 'stop-opacity': '0' }, hi);
  /* ambient-occlusion band along the inner curve, where the
     following blade's edge overlaps and casts shadow onto this one */
  const ao = el('linearGradient', {
    id: 'bladeAO', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 206, y2: 0,
  }, defs);
  el('stop', { offset: '0%',  'stop-color': '#000', 'stop-opacity': '0' }, ao);
  el('stop', { offset: '52%', 'stop-color': '#000', 'stop-opacity': '0' }, ao);
  el('stop', { offset: '74%', 'stop-color': '#0a0602', 'stop-opacity': '0.5' }, ao);
  el('stop', { offset: '93%', 'stop-color': '#0a0602', 'stop-opacity': '0.68' }, ao);
  el('stop', { offset: '100%','stop-color': '#0a0602', 'stop-opacity': '0.3' }, ao);
  const ringGrad = el('linearGradient', { id: 'ringBrass', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: '0%',  'stop-color': '#a08343' }, ringGrad);
  el('stop', { offset: '50%', 'stop-color': '#6e5624' }, ringGrad);
  el('stop', { offset: '100%','stop-color': '#8a6f35' }, ringGrad);
  /* soot/patina shading toward the chamber rim */
  const shade = el('radialGradient', { id: 'chamberShade', cx: '50%', cy: '50%', r: '50%' }, defs);
  el('stop', { offset: '58%', 'stop-color': '#000', 'stop-opacity': '0' }, shade);
  el('stop', { offset: '88%', 'stop-color': '#0a0602', 'stop-opacity': '0.3' }, shade);
  el('stop', { offset: '100%','stop-color': '#0a0602', 'stop-opacity': '0.55' }, shade);

  const bladeGroup = el('g', {}, svg);
  const d = [
    'M 0,-10',
    'C 52,-30 128,-34 178,-22',
    'C 196,-17 206,-6 206,2',
    'C 206,10 190,20 168,24',
    'C 110,34 44,26 0,10',
    'Z',
  ].join(' ');
  /* the same two edges, open (unfilled) paths for the highlight/AO strokes */
  const topEdge = 'M 0,-10 C 52,-30 128,-34 178,-22 C 196,-17 206,-6 206,2';
  const bottomEdge = 'M 206,2 C 206,10 190,20 168,24 C 110,34 44,26 0,10';
  blades = [];
  for (let i = 0; i < N_BLADES; i++) {
    const wing = el('g', { transform: `rotate(${i * (360 / N_BLADES)},220,220)` }, bladeGroup);
    /* one group per blade carries the opening rotation, so the fill,
       AO band and specular streak stay locked together as it moves */
    const art = el('g', { transform: 'translate(34 220) rotate(0)' }, wing);
    el('path', { d, fill: 'url(#bladeBrass)', stroke: '#1a1208', 'stroke-width': '1.6' }, art);
    el('path', {
      d: bottomEdge, fill: 'none', stroke: 'url(#bladeAO)', 'stroke-width': 6,
      'stroke-linecap': 'round', 'pointer-events': 'none',
    }, art);
    el('path', {
      d: topEdge, fill: 'none', stroke: 'url(#bladeHighlight)', 'stroke-width': 2.2,
      'stroke-linecap': 'round', 'pointer-events': 'none',
    }, art);
    blades.push(art);
  }

  /* patina shadow over blades + aether, under the ring: depth, not gloss */
  el('circle', { cx: 220, cy: 220, r: 176, fill: 'url(#chamberShade)' }, svg);

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
      fill: '#5f4b1f', stroke: '#241a0c', 'stroke-width': 1,
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

const LIVE_COLORS = ['#c9a355', '#8fa276', '#e0d3ae', '#b5813a', '#7e9271'];
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

  /* base wash — dimmer, ambered */
  const wash = c.createRadialGradient(220, 220, 10, 220, 220, 175);
  wash.addColorStop(0, live ? 'rgba(222,208,172,0.75)' : 'rgba(120,118,110,0.55)');
  wash.addColorStop(0.55, live ? 'rgba(172,138,74,0.4)' : 'rgba(90,88,82,0.3)');
  wash.addColorStop(1, 'rgba(20,16,8,0)');
  c.globalAlpha = 0.55 * openness;
  c.fillStyle = wash;
  c.fillRect(45, 45, 350, 350);

  /* slow vapour drift — large, dim, near-static; fill only each
     gradient's bounding box (perf lesson) */
  for (let i = 0; i < 7; i++) {
    const w = 0.07 + i * 0.02;
    const ang = t * w * (i % 2 ? 1 : -1) + i * 0.9;
    const orb = 60 + 34 * Math.sin(t * 0.12 + i * 1.7);
    const x = 220 + Math.cos(ang) * orb;
    const y = 220 + Math.sin(ang) * orb * 0.92;
    const rad = 64 + 16 * Math.sin(t * 0.33 + i * 2.1);
    const g = c.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, colors[i % colors.length]);
    g.addColorStop(1, 'rgba(20,16,8,0)');
    c.globalAlpha = 0.11 * openness * (live ? 1 : 0.7);
    c.fillStyle = g;
    c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  /* slow ripples travelling outward — faint surface disturbance */
  for (let i = 0; i < 3; i++) {
    const k = ((t * 0.16 + i / 3) % 1);
    const r = 12 + k * 160;
    c.globalAlpha = (1 - k) * 0.14 * openness * (live ? 1 : 0.4);
    c.strokeStyle = live ? '#d8cba4' : '#8a887f';
    c.lineWidth = 1.6 * (1 - k) + 0.4;
    c.beginPath(); c.arc(220, 220, r, 0, Math.PI * 2); c.stroke();
  }

  /* core glow — slow furnace breathing, not a heartbeat */
  const pulse = 0.5 + 0.5 * Math.sin(t * 0.55);
  const cg = c.createRadialGradient(220, 220, 0, 220, 220, 64 + pulse * 8);
  cg.addColorStop(0, live ? 'rgba(232,220,192,0.8)' : 'rgba(150,148,140,0.5)');
  cg.addColorStop(1, 'rgba(20,16,8,0)');
  c.globalAlpha = (0.42 + 0.18 * pulse) * openness;
  c.fillStyle = cg;
  c.fillRect(220 - 78, 220 - 78, 156, 156);

  c.restore();
  c.globalAlpha = 1;
}
