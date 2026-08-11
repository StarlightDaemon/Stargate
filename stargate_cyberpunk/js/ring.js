// Chamber scene: wall, water, gantry, and the salvaged ring itself.
// The ring is deliberately NOT a tidy radial icon: 11 unequal segments,
// three wrong-vendor replacements that bulge and glow the wrong colour,
// one scorched corpse segment, and an asymmetric two-chain hang with a
// visible 2.6° tilt. One light source: the cage lamp, upper left.

import { SEG_SPANS, SEG_GAP, FAB_SEGS, DEAD_SEG, STALL_SEG, DESTS } from './data.js';
import { S, energy, actions } from './state.js';
import { now } from './clock.js';

export const GEO = { W: 1031, H: 1000, CX: 505, CY: 455, R_OUT: 310, R_IN: 246, TILT: 2.6, WATER_Y: 830 };
const { W, H, CX, CY, R_OUT, R_IN, TILT, WATER_Y } = GEO;
const NS = 'http://www.w3.org/2000/svg';
const D2R = Math.PI / 180;

// deterministic per-index jitter in [0, k)
const jit = (i, k = 1) => (Math.abs(Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1) * k;

function el(name, attrs = {}, parent = null) {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}
const P = (r, a) => [CX + r * Math.cos(a * D2R), CY + r * Math.sin(a * D2R)];

function annular(a0, a1, r0, r1) {
  const [x0, y0] = P(r1, a0), [x1, y1] = P(r1, a1);
  const [x2, y2] = P(r0, a1), [x3, y3] = P(r0, a0);
  const laf = (a1 - a0) > 180 ? 1 : 0;
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r1} ${r1} 0 ${laf} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} ` +
         `L${x2.toFixed(1)} ${y2.toFixed(1)} A${r0} ${r0} 0 ${laf} 0 ${x3.toFixed(1)} ${y3.toFixed(1)} Z`;
}

// segment angle table (irregular spans, slight per-joint jitter)
const segs = [];
{
  let acc = -78;
  for (let i = 0; i < SEG_SPANS.length; i++) {
    const g = SEG_GAP / 2 + jit(i, 0.5);
    segs.push({ i, a0: acc + g, a1: acc + SEG_SPANS[i] - g, mid: acc + SEG_SPANS[i] / 2 });
    acc += SEG_SPANS[i];
  }
}

const refs = { glows: [], pilots: [], standbys: [], segEls: [] };
let innerGlow, waterGlow, reflGlow, lampFlicker;

// ---------------------------------------------------------------- defs
function makeDefs(svg) {
  const d = el('defs', {}, svg);

  const lg = (id, x1, y1, x2, y2, stops) => {
    const g = el('linearGradient', { id, gradientUnits: 'userSpaceOnUse', x1, y1, x2, y2 }, d);
    for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, ...(op != null ? { 'stop-opacity': op } : {}) }, g);
  };
  const rg = (id, cx, cy, r, stops) => {
    const g = el('radialGradient', { id, gradientUnits: 'userSpaceOnUse', cx, cy, r }, d);
    for (const [o, c, op] of stops) el('stop', { offset: o, 'stop-color': c, ...(op != null ? { 'stop-opacity': op } : {}) }, g);
  };

  lg('gWall', 0, 0, W, H, [[0, '#23262b'], [0.45, '#1b1e22'], [1, '#101215']]);
  lg('gWater', 0, WATER_Y, 0, H, [[0, '#0d1418'], [0.12, '#080d10'], [1, '#04070a']]);
  lg('gCorp', CX - 360, CY - 360, CX + 360, CY + 360, [[0, '#d9d2bc'], [0.5, '#a49d89'], [1, '#5f5a4b']]);
  lg('gFab', CX - 360, CY - 360, CX + 360, CY + 360, [[0, '#3d4147'], [0.5, '#2b2e33'], [1, '#191b1f']]);
  lg('gDead', CX - 360, CY - 360, CX + 360, CY + 360, [[0, '#26221f'], [0.5, '#1a1715'], [1, '#0f0d0c']]);
  lg('gBeam', 0, 40, 0, 84, [[0, '#4a4e54'], [0.5, '#33373d'], [1, '#202329']]);
  lg('gBox', 0, 0, 0, 1, [[0, '#3c4046'], [1, '#22252a']]);

  // torus cross-tube shading: dark at both rims, neutral mid
  rg('gTube', CX, CY, R_OUT + 12, [
    [0.72, '#000', 0.5], [0.775, '#000', 0.32], [0.83, '#000', 0.02],
    [0.9, '#000', 0.1], [0.965, '#000', 0.38], [1, '#000', 0.55],
  ]);
  // sheen band offset toward the lamp
  rg('gSheen', CX - 55, CY - 70, R_OUT + 20, [
    [0.78, '#fff', 0], [0.85, '#ffe9c4', 0.16], [0.9, '#fff', 0.05], [1, '#fff', 0],
  ]);
  rg('gLamp', 150, 120, 640, [[0, '#ffd9a0', 0.34], [0.35, '#ffca86', 0.13], [1, '#000', 0]]);
  rg('gPortalWater', CX, WATER_Y + 34, 300, [[0, '#9ff', 0.5], [1, '#9ff', 0]]);

  const blur = (id, dev) => { const f = el('filter', { id, x: '-60%', y: '-60%', width: '220%', height: '220%' }, d); el('feGaussianBlur', { stdDeviation: dev }, f); };
  blur('fGlow', 7);
  blur('fGlowBig', 16);
  blur('fSoft', 2.5);
  blur('fRefl', 5);

  // reflection fade mask
  const m = el('mask', { id: 'mRefl', maskUnits: 'userSpaceOnUse', x: 0, y: WATER_Y, width: W, height: H - WATER_Y }, d);
  const mg = el('linearGradient', { id: 'gRefl', gradientUnits: 'userSpaceOnUse', x1: 0, y1: WATER_Y, x2: 0, y2: H }, d);
  el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.5 }, mg);
  el('stop', { offset: 0.7, 'stop-color': '#fff', 'stop-opacity': 0.06 }, mg);
  el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 }, mg);
  el('rect', { x: 0, y: WATER_Y, width: W, height: H - WATER_Y, fill: 'url(#gRefl)' }, m);
}

// ---------------------------------------------------------------- back scene
export function buildBack(svg) {
  makeDefs(svg);
  el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#gWall)' }, svg);

  // concrete tie-holes and stains — hand-placed, uneven
  const stains = [[120, 300, 90, 160, .16], [370, 690, 130, 90, .13], [860, 240, 110, 210, .18],
                  [660, 120, 70, 60, .1], [940, 620, 80, 140, .2], [260, 120, 60, 90, .1]];
  for (const [x, y, rx, ry, o] of stains)
    el('ellipse', { cx: x, cy: y, rx, ry, fill: '#0a0c0e', opacity: o, filter: 'url(#fGlowBig)' }, svg);
  for (const [x, y] of [[80, 150], [82, 420], [500, 105], [935, 160], [938, 470], [420, 780]])
    el('circle', { cx: x, cy: y, r: 5, fill: '#0c0e10', opacity: 0.7 }, svg);

  // drip streaks under an old pipe run
  const pipeY = 96;
  el('rect', { x: 0, y: pipeY, width: W, height: 13, fill: '#2c3036' }, svg);
  el('rect', { x: 0, y: pipeY, width: W, height: 4, fill: '#41464d' }, svg);
  for (const x of [88, 305, 306.5, 702, 918]) {
    el('rect', { x, y: pipeY + 13, width: 2.5, height: 120 + jit(x, 90), fill: '#15181b', opacity: 0.5 }, svg);
  }
  // conduit dropping to the junction box
  el('path', { d: 'M872 109 L872 470 Q872 492 860 505 L846 522', stroke: '#33373d', 'stroke-width': 9, fill: 'none' }, svg);
  el('path', { d: 'M872 109 L872 470', stroke: '#4a4f56', 'stroke-width': 3, fill: 'none' }, svg);

  // junction box (feeds the ring)
  const jb = el('g', { transform: 'translate(806 522) rotate(-1.2)' }, svg);
  el('rect', { x: 0, y: 0, width: 92, height: 128, rx: 5, fill: 'url(#gBox)', stroke: '#14161a', 'stroke-width': 2 }, jb);
  el('rect', { x: 8, y: 10, width: 76, height: 30, rx: 3, fill: '#1a1d21' }, jb);
  el('text', { x: 46, y: 30, 'text-anchor': 'middle', fill: '#8d9299', 'font-size': 13, 'font-family': 'Consolas,monospace' }, jb).textContent = 'KV-DST 3';
  el('circle', { cx: 20, cy: 60, r: 5, fill: '#5c2e2b' }, jb);
  el('circle', { cx: 40, cy: 60, r: 5, fill: '#2b4a33' }, jb);
  el('rect', { x: 60, y: 52, width: 18, height: 40, rx: 3, fill: '#101215' }, jb);
  // scorch above box vent
  el('ellipse', { cx: 46, cy: -8, rx: 30, ry: 12, fill: '#000', opacity: 0.35, filter: 'url(#fSoft)' }, jb);

  // floodwater
  el('rect', { x: 0, y: WATER_Y, width: W, height: H - WATER_Y, fill: 'url(#gWater)' }, svg);
  el('rect', { x: 0, y: WATER_Y - 2, width: W, height: 3.5, fill: '#39424a', opacity: 0.5 }, svg);
  // scum line and junk breaking the surface
  el('path', { d: `M0 ${WATER_Y + 26} q 90 -7 210 -2 t 260 5 t 300 -6 t 261 4`, stroke: '#1d2429', 'stroke-width': 3, fill: 'none', opacity: 0.6 }, svg);
  el('path', { d: `M118 ${WATER_Y + 1} l 26 -34 l 7 3 l -22 32 Z`, fill: '#23262b' }, svg); // drowned rebar
  el('ellipse', { cx: 131, cy: WATER_Y + 3, rx: 24, ry: 3.5, fill: '#060a0c' }, svg);
  el('path', { d: `M905 ${WATER_Y + 2} l 15 -20 l 9 1 l -12 20 Z`, fill: '#1f2226' }, svg);
}

// ---------------------------------------------------------------- ring
function buildSegment(g, s) {
  const fab = FAB_SEGS.has(s.i), dead = s.i === DEAD_SEG;
  const r0 = fab ? R_IN - 5 : R_IN + jit(s.i, 2);
  const r1 = fab ? R_OUT + 9 : R_OUT + jit(s.i + 5, 3);
  const grp = el('g', { class: `seg seg-${s.i}${fab ? ' fab' : ''}${dead ? ' dead' : ''}` }, g);
  refs.segEls[s.i] = grp;

  const body = annular(s.a0, s.a1, r0, r1);
  el('path', { d: body, fill: dead ? 'url(#gDead)' : fab ? 'url(#gFab)' : 'url(#gCorp)' }, grp);
  el('path', { d: body, fill: 'url(#gTube)' }, grp);
  el('path', { d: body, fill: 'url(#gSheen)' }, grp);
  // angular shade away from the lamp
  const br = Math.max(0, Math.cos((s.mid + 135) * D2R));
  el('path', { d: body, fill: '#000', opacity: (0.42 * (1 - br) * (dead ? 1.2 : 1)).toFixed(3) }, grp);

  if (!fab && !dead) {
    // corporate shell: panel seams + a faded unit glyph
    const seam = (s.a0 + (s.a1 - s.a0) * (0.33 + jit(s.i, 0.2)));
    const [sx0, sy0] = P(r0 + 6, seam), [sx1, sy1] = P(r1 - 6, seam);
    el('line', { x1: sx0, y1: sy0, x2: sx1, y2: sy1, stroke: '#4d4839', 'stroke-width': 1.6, opacity: 0.7 }, grp);
    const [tx, ty] = P((r0 + r1) / 2, s.mid);
    el('text', { x: tx, y: ty + 4, 'text-anchor': 'middle', fill: '#4f4a3c', 'font-size': 15, opacity: 0.75,
                 'font-family': 'Consolas,monospace', transform: `rotate(${s.mid + 90} ${tx} ${ty})` }, grp)
      .textContent = 'A7·' + (11 + s.i);
    // grime arc on the weathered ones
    if (jit(s.i, 1) > 0.3)
      el('path', { d: annular(s.a0 + 2, s.a1 - 4, r1 - 14, r1 - 2), fill: '#0d0c0a', opacity: 0.22, filter: 'url(#fSoft)' }, grp);
    // standby pip
    const [px, py] = P(r1 - 20, s.a1 - 5);
    refs.standbys[s.i] = el('circle', { cx: px, cy: py, r: 2.6, fill: '#37503c' }, grp);
  }

  if (fab) {
    // heatsink fins on the outer face
    const n = 7 + Math.round(jit(s.i, 3));
    for (let k = 0; k <= n; k++) {
      const a = s.a0 + 3 + (k / n) * (s.a1 - s.a0 - 6);
      const [fx0, fy0] = P(r1 - 2, a), [fx1, fy1] = P(r1 + 11 + jit(k, 3), a);
      el('line', { x1: fx0, y1: fy0, x2: fx1, y2: fy1, stroke: '#43474e', 'stroke-width': 3.4, 'stroke-linecap': 'round' }, grp);
    }
    // vendor pilot LED (wrong colour, of course)
    const [px, py] = P((r0 + r1) / 2 + 8, s.mid + 4);
    refs.pilots[s.i] = el('circle', { cx: px, cy: py, r: 4, fill: '#ff4fd8', opacity: 0.25 }, grp);
    el('circle', { cx: px, cy: py, r: 8, fill: '#ff4fd8', opacity: 0.12, filter: 'url(#fSoft)' }, grp);
    // zip-tied pigtail flopping off the segment
    const [cx0, cy0] = P(r1 + 4, s.mid - 6);
    el('path', { d: `M${cx0} ${cy0} q ${18 + jit(s.i, 14)} ${30} ${6} ${58 + jit(s.i, 20)}`,
                 stroke: '#101215', 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round' }, grp);
  }

  if (dead) {
    // carbon scorch fanning out of the joint that killed it
    for (let k = 0; k < 4; k++) {
      const a = s.a0 + 4 + k * ((s.a1 - s.a0 - 8) / 3) + jit(k, 3);
      const [qx0, qy0] = P(r0 + 4, a), [qx1, qy1] = P(r1 + 6 + jit(k, 10), a + jit(k + 2, 4));
      el('line', { x1: qx0, y1: qy0, x2: qx1, y2: qy1, stroke: '#060505', 'stroke-width': 9 - k, opacity: 0.55, 'stroke-linecap': 'round', filter: 'url(#fSoft)' }, grp);
    }
    const [bx, by] = P((R_IN + R_OUT) / 2, s.mid);
    el('text', { x: bx, y: by, 'text-anchor': 'middle', fill: '#6b6257', 'font-size': 13, opacity: 0.8,
                 'font-family': 'Consolas,monospace', transform: `rotate(${s.mid + 90} ${bx} ${by})` }, grp)
      .textContent = 'R.I.P.';
  }

  // emitter strip on the inner rim (dark until energised)
  const strip = annular(s.a0 + 1.5, s.a1 - 1.5, R_IN + 3, R_IN + 15);
  el('path', { d: strip, fill: dead ? '#0c0b0a' : '#161b1f' }, grp);
  if (!dead) {
    const col = fab ? '#ff5fd0' : '#aef2ff';
    const glow = el('g', { opacity: 0 }, grp);
    el('path', { d: strip, fill: col, filter: 'url(#fGlow)' }, glow);
    el('path', { d: strip, fill: col }, glow);
    el('path', { d: annular(s.a0 + 3, s.a1 - 3, R_IN + 6, R_IN + 9), fill: '#fff', opacity: 0.85 }, glow);
    refs.glows[s.i] = glow;
  }
}

// A chain is links, not a dashed line: alternate face-on ovals and edge-on
// bars along the run, each sitting a little loose on its neighbour, upper
// edges catching the cage lamp.
function chainRun(parent, f, { pitch = 13, seed = 0, dim = false } = {}) {
  const N = 32;
  const pts = [];
  for (let i = 0; i <= N; i++) pts.push(f(i / N));
  const seg = [0];
  let len = 0;
  for (let i = 1; i <= N; i++) {
    len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(len);
  }
  const at = (s) => {
    let i = 1;
    while (i < N && seg[i] < s) i++;
    const u = (s - seg[i - 1]) / Math.max(1e-6, seg[i] - seg[i - 1]);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u,
            pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u,
            Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) / D2R];
  };
  const g = el('g', dim ? { opacity: 0.85 } : {}, parent);
  const n = Math.max(2, Math.round(len / pitch));
  for (let k = 0; k < n; k++) {
    const s = Math.min(len - 2, Math.max(2, (k + 0.5) * (len / n) + jit(k * 7 + seed, 2.4) - 1.2));
    const [x, y, ang] = at(s);
    const a = ang + jit(k * 3 + seed, 12) - 6;
    const lg = el('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)})` }, g);
    if (k % 2 === 0) {
      // face-on link: open oval, lamp on its upper rim
      el('ellipse', { cx: 0, cy: 0, rx: 7.6, ry: 4.4, fill: 'none', stroke: '#31353b', 'stroke-width': 2.7 }, lg);
      el('path', { d: 'M-5.4 -3.4 Q 0 -5.9 5.4 -3.4', fill: 'none', stroke: '#5a6067', 'stroke-width': 1.1, opacity: 0.75 }, lg);
    } else {
      // edge-on link: a stubby bar threading the ovals
      el('line', { x1: -4.4, y1: 0, x2: 4.4, y2: 0, stroke: '#1e2126', 'stroke-width': 4, 'stroke-linecap': 'round' }, lg);
      el('line', { x1: -3.4, y1: -1.1, x2: 3.4, y2: -1.1, stroke: '#484d54', 'stroke-width': 1, 'stroke-linecap': 'round', opacity: 0.6 }, lg);
    }
  }
}

export function buildFront(svg) {
  // gantry beam
  el('rect', { x: 228, y: 40, width: 600, height: 42, fill: 'url(#gBeam)' }, svg);
  el('rect', { x: 228, y: 40, width: 600, height: 7, fill: '#565b62' }, svg);
  el('rect', { x: 228, y: 75, width: 600, height: 7, fill: '#17191d' }, svg);
  for (const x of [258, 430, 620, 790]) el('circle', { cx: x, cy: 61, r: 4, fill: '#1c1f24' }, svg);
  // rust bleeding off the beam
  el('rect', { x: 300, y: 82, width: 5, height: 60, fill: '#4a2f22', opacity: 0.35 }, svg);
  el('rect', { x: 705, y: 82, width: 3, height: 92, fill: '#4a2f22', opacity: 0.3 }, svg);

  // hoist chains to two lugs — different lengths, hence the tilt.
  // lug points live on the tilted ring, so rotate them by hand:
  const rp = ([x, y]) => {
    const dx = x - CX, dy = y - CY, c = Math.cos(TILT * D2R), s = Math.sin(TILT * D2R);
    return [CX + dx * c - dy * s, CY + dx * s + dy * c];
  };
  const [ax, ay] = rp(P(R_OUT + 14, -112)), [bx, by] = rp(P(R_OUT + 14, -57));
  for (const [x, y] of [[ax, ay], [bx, by]]) {
    // taut hoist run: near-straight under load, one lazy bow
    chainRun(svg, t => [x + Math.sin(t * Math.PI) * 1.4, 82 + (y - 82) * t], { pitch: 12.5, seed: Math.round(x) });
    el('circle', { cx: x, cy: y, r: 7, fill: 'none', stroke: '#454a51', 'stroke-width': 4 }, svg);
  }
  // slack chain looped over the beam — insurance after the second drop
  {
    const q0 = [ax + 14, 82], qc = [ax + 54, 202], q1 = [bx - 26, by - 14];
    chainRun(svg, t => {
      const u = 1 - t;
      return [u * u * q0[0] + 2 * u * t * qc[0] + t * t * q1[0],
              u * u * q0[1] + 2 * u * t * qc[1] + t * t * q1[1]];
    }, { pitch: 12, seed: 9, dim: true });
  }

  // inner rim ignition glow (behind segments, over the portal canvas edge)
  innerGlow = el('circle', { cx: CX, cy: CY, r: R_IN - 4, fill: 'none', stroke: '#7de9ff', 'stroke-width': 30, filter: 'url(#fGlowBig)', opacity: 0 }, svg);

  // the ring, tilted about its own centre
  const ringG = el('g', { id: 'ringG', transform: `rotate(${TILT} ${CX} ${CY})` }, svg);
  for (const s of segs) buildSegment(ringG, s);

  // joint clamps between segments
  for (const s of segs) {
    const a = s.a1 + SEG_GAP / 2;
    const [jx, jy] = P((R_IN + R_OUT) / 2, a);
    const clamp = el('g', { transform: `rotate(${a + 90 + jit(s.i, 4)} ${jx} ${jy})` }, ringG);
    el('rect', { x: jx - 7, y: jy - (R_OUT - R_IN) / 2 - 8, width: 14, height: R_OUT - R_IN + 16, rx: 3, fill: '#2a2d32', stroke: '#101214', 'stroke-width': 1.5 }, clamp);
    el('circle', { cx: jx, cy: jy - (R_OUT - R_IN) / 2 + 2, r: 3, fill: '#484d54' }, clamp);
    el('circle', { cx: jx, cy: jy + (R_OUT - R_IN) / 2 - 2, r: 3, fill: '#484d54' }, clamp);
  }

  // lug hardware on top of the ring
  for (const [x, y] of [[ax, ay], [bx, by]])
    el('rect', { x: x - 10, y: y - 6, width: 20, height: 24, rx: 4, fill: '#33373d', stroke: '#14161a', 'stroke-width': 1.5 }, svg);

  // power feed drooping from the bottom segment to the junction box
  const [fx, fy] = rp(P(R_OUT + 2, 96));
  for (const [w, c, off] of [[9, '#0e1013', 0], [5, '#1d2126', 2], [3.5, '#3d2b1e', -3]])
    el('path', { d: `M${fx + off} ${fy} C ${fx + 30} ${fy + 130}, ${700} ${760}, ${824} ${618}`, stroke: c, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round' }, svg);

  // reflection in the floodwater
  const refl = el('g', { mask: 'url(#mRefl)' }, svg);
  el('use', { href: '#ringG', transform: `translate(0 ${2 * WATER_Y}) scale(1 -1)`, opacity: 0.55, filter: 'url(#fRefl)' }, refl);
  reflGlow = el('ellipse', { cx: CX, cy: WATER_Y + 40, rx: 250, ry: 30, fill: '#7de9ff', opacity: 0, filter: 'url(#fGlowBig)' }, svg);

  // cage lamp + its light, on top of everything
  el('line', { x1: 150, y1: 0, x2: 150, y2: 96, stroke: '#17191c', 'stroke-width': 4 }, svg);
  const lamp = el('g', { transform: 'translate(150 100) rotate(-4)' }, svg);
  el('path', { d: 'M-13 -6 h26 l-4 10 h-18 Z', fill: '#3a3e44' }, lamp);
  el('ellipse', { cx: 0, cy: 14, rx: 11, ry: 13, fill: '#ffe2ae' }, lamp);
  el('path', { d: 'M-11 4 q 0 26 11 26 q 11 0 11 -26', fill: 'none', stroke: '#2c3036', 'stroke-width': 2.5 }, lamp);
  el('ellipse', { cx: 0, cy: 14, rx: 20, ry: 22, fill: '#ffd9a0', opacity: 0.3, filter: 'url(#fGlow)' }, lamp);
  lampFlicker = el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#gLamp)', style: 'mix-blend-mode:screen', 'pointer-events': 'none' }, svg);

  // vignette
  const vg = el('radialGradient', { id: 'gVig', cx: 0.45, cy: 0.42, r: 0.85 }, svg.querySelector('defs') ?? el('defs', {}, svg));
  el('stop', { offset: 0.55, 'stop-color': '#000', 'stop-opacity': 0 }, vg);
  el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.5 }, vg);
  el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#gVig)', 'pointer-events': 'none' }, svg);

  // whack target: the whole ring listens, only a stalled driver cares
  svg.querySelectorAll('.seg').forEach(n => {
    n.style.cursor = 'pointer';
    n.addEventListener('click', () => actions.whack());
  });
}

// ---------------------------------------------------------------- render
export function renderRing(t = now()) {
  const e = energy(t);
  const winding = ['sever', 'abort', 'cooldown'].includes(S.phase);
  const dim = winding ? Math.min(1, e * 1.6) : 1;

  for (let i = 0; i < SEG_SPANS.length; i++) {
    const g = refs.glows[i];
    if (!g) continue;
    const at = S.segAt[i];
    let p = at && at <= t ? Math.min(1, (t - at) / 320) : 0;
    // per-segment flutter so the strips never read as one uniform LED
    const flut = 0.9 + 0.1 * Math.sin(t / (170 + i * 23) + i * 2.1);
    g.setAttribute('opacity', (p * dim * flut).toFixed(3));
    if (refs.pilots[i]) refs.pilots[i].setAttribute('opacity', (0.25 + 0.75 * p * dim).toFixed(3));
    if (refs.standbys[i]) refs.standbys[i].setAttribute('fill', p > 0 ? '#77ffb0' : (S.phase === 'idle' && Math.sin(t / 1400 + i * 1.7) > 0.86 ? '#4d7a56' : '#37503c'));
  }

  // stall blink on segment C
  const stalled = S.phase === 'spool' && S.spool?.stall && !S.spool.stallDone;
  refs.segEls[STALL_SEG]?.classList.toggle('stalled', !!stalled);

  // inner ignition + water glow follow the lattice
  const hue = S.dest ? DESTS[S.dest].hue : 190;
  const hot = ['lock', 'ready', 'open'].includes(S.phase) ? e : (winding ? e * 0.7 : 0);
  innerGlow.setAttribute('stroke', `hsl(${hue} 90% 70%)`);
  innerGlow.setAttribute('opacity', (hot * 0.75).toFixed(3));
  const rgo = S.phase === 'open' ? 0.32 + 0.1 * Math.sin(t / 300) : hot * 0.15;
  reflGlow.setAttribute('fill', `hsl(${hue} 85% 70%)`);
  reflGlow.setAttribute('opacity', rgo.toFixed(3));

  // lamp never sits entirely still
  const lf = 0.92 + 0.08 * Math.max(0, Math.sin(t / 90) * Math.sin(t / 530) + 0.6) / 1.6;
  lampFlicker.setAttribute('opacity', lf.toFixed(3));
}
