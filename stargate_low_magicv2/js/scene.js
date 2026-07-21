// The ringing chamber of the Hollowbeck Six, painted into one 1920x1080 SVG.
// Everything irregular is jittered from a fixed seed so the chamber is
// hand-worn, not tiled — but identical on every visit.
//
// The scene is cosmetic only: game state lives in main.js and never reads
// anything rendered here.

import { BELLS, ROADS, PINNED } from './roads.js';

const NS = 'http://www.w3.org/2000/svg';
const W = 1920, H = 1080;

// ---- seeded jitter -------------------------------------------------------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = mulberry32(0xB3117);
const rnd = (a, b) => a + (b - a) * R();
const pick = arr => arr[Math.floor(R() * arr.length)];

function el(name, attrs = {}, parent) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function txt(parent, s, attrs = {}) {
  const t = el('text', attrs, parent);
  t.textContent = s;
  return t;
}
// A line that wanders like a hand drew it.
function wobble(x1, y1, x2, y2, seg = 7, amp = 2.2) {
  let d = `M${x1.toFixed(1)},${y1.toFixed(1)}`;
  for (let i = 1; i <= seg; i++) {
    const t = i / seg;
    d += ` L${(x1 + (x2 - x1) * t + rnd(-amp, amp)).toFixed(1)},${(y1 + (y2 - y1) * t + rnd(-amp, amp)).toFixed(1)}`;
  }
  return d;
}
// Closed blob with wandering edges (stones, patches, wear).
function blob(cx, cy, rx, ry, seg = 9, amp = 0.16) {
  let d = '';
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const rr = 1 + rnd(-amp, amp);
    const x = cx + Math.cos(a) * rx * rr, y = cy + Math.sin(a) * ry * rr;
    d += (i ? ' L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
  }
  return d + ' Z';
}

// Lantern position — the one light everything answers to.
const LX = 705, LY = 235;

// Rope geometry: hole in the ceiling, sally partway down, tail below.
const ROPE = BELLS.map((b, i) => ({
  hx: [660, 788, 916, 1042, 1160, 1288][i],
  hy: [118, 134, 120, 136, 122, 140][i],
  sallyY: [500, 568, 528, 596, 548, 628][i],
  sallyH: [150, 158, 146, 162, 152, 176][i],
  tail: [128, 116, 134, 110, 126, 148][i],
  w: b.w * 0.62,
  back: i % 2 === 1,           // alternate ropes hang a hand deeper
  swayA: rnd(3.5, 7),
  swayW: rnd(0.35, 0.62),
  swayP: rnd(0, 6.28),
}));

const DOOR = { x0: 1482, x1: 1818, top: 268, spring: 500, floor: 948, hinge: 1487 };

// ==========================================================================
export function build(svg) {
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  const defs = el('defs', {}, svg);
  buildDefs(defs);

  const root = el('g', {}, svg);
  buildWall(root);
  buildFloor(root);
  const door = buildDoor(root);
  const latch = buildLatch(root);
  const wires = buildWires(root);
  buildBoard(root);
  const slate = buildSlate(root);
  const barrel = buildBarrelFrame(root);
  const ropes = buildRopes(root);
  const lantern = buildLantern(root);
  const light = buildLight(root);

  // ---- animation state (cosmetic only) ----
  const anim = {
    pulls: ROPE.map(() => -1e9),     // pull start times, ms
    hammers: ROPE.map(() => -1e9),
    door01: 0, doorTarget: 0, doorKind: null,
    latchDrawn: false, latchT: -1e9,
    crankT: -1e9, engageT: -1e9, engaged: false,
    dim: 1, dimTarget: 1,
    last: 0,
  };

  function tick(t) {
    if (!t) t = performance.now();
    const dt = Math.min(0.1, (t - anim.last) / 1000 || 0.016);
    anim.last = t;
    const s = t / 1000;

    // ropes: sway plus a pull stroke that draws the sally down and back
    for (let i = 0; i < 6; i++) {
      const r = ROPE[i];
      const age = (t - anim.pulls[i]) / 1000;
      let pull = 0;
      if (age >= 0 && age < 1.1) {
        pull = age < 0.22 ? age / 0.22
             : age < 0.42 ? 1
             : 1 - (age - 0.42) / 0.68;
        pull = Math.max(0, pull);
        if (age >= 0.42) pull += Math.sin((age - 0.42) * 9) * 0.06 * (1 - age);
      }
      const sway = Math.sin(s * r.swayW * 2 * Math.PI + r.swayP) * r.swayA * (pull > 0 ? 0.3 : 1);
      const drop = pull * 128;
      const sy = r.sallyY + drop;
      const bow = sway * ((sy - r.hy) / 640);
      // hole -> sally top, one gentle bend
      const dRope = `M${r.hx},${r.hy} Q${r.hx + bow * 0.6},${(r.hy + sy) / 2} ${r.hx + sway},${sy}`;
      ropes[i].line.setAttribute('d', dRope);
      ropes[i].twist.setAttribute('d', dRope);
      ropes[i].sally.setAttribute('transform',
        `translate(${r.hx + sway},${sy}) rotate(${sway * 0.35})`);
    }

    // hammers snap forward and spring back
    for (let i = 0; i < 6; i++) {
      const age = (t - anim.hammers[i]) / 1000;
      let a = 0;
      if (age >= 0 && age < 0.5) a = age < 0.08 ? age / 0.08 : Math.max(0, 1 - (age - 0.08) / 0.42);
      barrel.hammerEls[i].setAttribute('transform', `rotate(${-26 * a} ${barrel.hammerPivots[i][0]} ${barrel.hammerPivots[i][1]})`);
    }

    // barrel turns briefly after each crank click; spins while chiming
    const crankAge = (t - anim.crankT) / 1000;
    if (crankAge >= 0 && crankAge < 0.4) {
      barrel.pinsEl.setAttribute('transform', `translate(0,${(crankAge / 0.4) * 18})`);
      barrel.crankArm.setAttribute('transform', `rotate(${crankAge / 0.4 * 120} 601 972)`);
    } else {
      barrel.pinsEl.setAttribute('transform', 'translate(0,0)');
      barrel.crankArm.setAttribute('transform', 'rotate(0 601 972)');
    }
    const engAge = (t - anim.engageT) / 1000;
    const engA = anim.engaged ? Math.min(1, engAge / 0.25) : Math.max(0, 1 - engAge / 0.4);
    barrel.engageEl.setAttribute('transform', `rotate(${52 * engA} 418 933)`);

    // stay-bolt slides in its keeps
    const la = Math.min(1, (t - anim.latchT) / 300);
    const knobY = anim.latchDrawn ? la : 1 - la;
    latch.rod.setAttribute('transform', `translate(0,${knobY * 62})`);
    latch.chain.setAttribute('d',
      `M1381,148 C ${1381 + 14 + knobY * 10},300 ${1370 - knobY * 16},380 1381,${418 + knobY * 62}`);

    // door swings on its hinge — faked with a shrink toward the hinge line
    anim.door01 += (anim.doorTarget - anim.door01) * Math.min(1, dt * (anim.doorTarget ? 1.1 : 2.2));
    if (Math.abs(anim.door01 - anim.doorTarget) < 0.002) anim.door01 = anim.doorTarget;
    const o = anim.door01;
    door.slab.setAttribute('transform',
      `translate(${DOOR.hinge},0) scale(${1 - 0.8 * o},1) skewY(${-7 * o}) translate(${-DOOR.hinge},0)`);
    door.slabShade.setAttribute('opacity', (0.55 * o).toFixed(3));
    door.wayGroup.setAttribute('opacity', o.toFixed(3));
    if (anim.doorKind === 'dark') {
      door.wayFair.setAttribute('opacity', 0);
      door.wayDark.setAttribute('opacity', 1);
    } else {
      door.wayFair.setAttribute('opacity', 1);
      door.wayDark.setAttribute('opacity', 0);
    }
    // mist stirs in the opening
    if (o > 0.02 && anim.doorKind !== 'dark') {
      door.mists.forEach((m, i) => {
        const mx = Math.sin(s * 0.31 + i * 2.1) * 26;
        const my = Math.cos(s * 0.23 + i * 1.3) * 14;
        m.setAttribute('transform', `translate(${mx},${my})`);
      });
    }
    light.wayGlow.setAttribute('opacity', (anim.doorKind === 'dark' ? 0 : 0.85 * o).toFixed(3));

    // lantern breathes; dims when Wrycross answers
    anim.dim += (anim.dimTarget - anim.dim) * Math.min(1, dt * 2);
    const fl = 0.86 + Math.sin(s * 7.3) * 0.05 + Math.sin(s * 13.7 + 1.7) * 0.045 + Math.sin(s * 2.1) * 0.03;
    const flick = fl * anim.dim;
    lantern.flameCore.setAttribute('transform', `translate(705,244) scale(${0.92 + flick * 0.12},${0.85 + flick * 0.2}) translate(-705,-244)`);
    lantern.halo.setAttribute('opacity', (0.5 + 0.45 * flick).toFixed(3));
    light.warm.setAttribute('opacity', (0.55 + 0.4 * flick * anim.dim).toFixed(3));
    light.shade.setAttribute('opacity', (anim.dim * 0.94 + 0.02).toFixed(3));

    // dust drifts through the lantern's reach
    light.motes.forEach(m => {
      const p = m._p;
      const y = ((p.y0 + s * p.vy) % 520);
      const x = p.x0 + Math.sin(s * p.wx + p.ph) * p.ax;
      m.setAttribute('cx', x.toFixed(1));
      m.setAttribute('cy', (140 + y).toFixed(1));
      const d2 = Math.hypot(x - LX, 140 + y - LY);
      m.setAttribute('opacity', (Math.max(0, 1 - d2 / 620) * 0.5 * flick).toFixed(3));
    });
  }

  return {
    tick,
    hits: collectHits(svg),
    pullRope: i => { anim.pulls[i] = performance.now(); },
    snapHammer: i => { anim.hammers[i] = performance.now(); },
    setLatch: d => { anim.latchDrawn = d; anim.latchT = performance.now(); },
    crankClick: () => { anim.crankT = performance.now(); },
    setEngaged: e => { anim.engaged = e; anim.engageT = performance.now(); },
    setWay: kind => {           // 'fair' | 'dark' | null
      anim.doorKind = kind || anim.doorKind;
      anim.doorTarget = kind ? 1 : 0;
      anim.dimTarget = kind === 'dark' ? 0.35 : 1;
    },
    setCard: name => { barrel.cardText.textContent = name; },
    slate,
  };

  // ======================= builders =======================

  function buildDefs(defs) {
    const rough = el('filter', { id: 'fRough', x: '-8%', y: '-8%', width: '116%', height: '116%' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.045', numOctaves: 2, seed: 11, result: 'n' }, rough);
    el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 5 }, rough);

    const rough2 = el('filter', { id: 'fRough2', x: '-12%', y: '-12%', width: '124%', height: '124%' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.02', numOctaves: 3, seed: 4, result: 'n' }, rough2);
    el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 11 }, rough2);

    for (const [id, sd] of [['fBlur4', 4], ['fBlur9', 9], ['fBlur18', 18]]) {
      const f = el('filter', { id, x: '-60%', y: '-60%', width: '220%', height: '220%' }, defs);
      el('feGaussianBlur', { stdDeviation: sd }, f);
    }

    // plaster / grime noise, tinted in place with mix-blend-mode
    const noise = el('filter', { id: 'fNoise' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.012 0.019', numOctaves: 4, seed: 7 }, noise);
    el('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.42  0 0 0 0 0.38  0 0 0 0 0.33  0.6 0.2 0 0 0' }, noise);
    const noiseFine = el('filter', { id: 'fNoiseFine' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.09 0.11', numOctaves: 2, seed: 19 }, noiseFine);
    el('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.3  0 0 0 0 0.27  0 0 0 0 0.23  0.5 0 0 0 0' }, noiseFine);
    // wood grain: noise stretched hard along one axis
    const grainV = el('filter', { id: 'fGrainV' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.11 0.006', numOctaves: 3, seed: 23 }, grainV);
    el('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.16  0 0 0 0 0.11  0 0 0 0 0.07  0.9 0 0 0 0' }, grainV);
    const grainH = el('filter', { id: 'fGrainH' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.006 0.11', numOctaves: 3, seed: 29 }, grainH);
    el('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.16  0 0 0 0 0.11  0 0 0 0 0.07  0.9 0 0 0 0' }, grainH);

    grad(defs, 'gWall', [[0, '#6b5f4e'], [0.5, '#5d5142'], [1, '#4a3f33']], { x1: 0, y1: 0, x2: 0.3, y2: 1 });
    grad(defs, 'gFloor', [[0, '#4a3826'], [1, '#2c2013']], { x1: 0, y1: 0, x2: 0, y2: 1 });
    grad(defs, 'gDoorWood', [[0, '#4d3a26'], [0.5, '#42311e'], [1, '#332514']], { x1: 0, y1: 0, x2: 1, y2: 0.2 });
    grad(defs, 'gOak', [[0, '#5a452c'], [1, '#3b2c19']], { x1: 0, y1: 0, x2: 0, y2: 1 });
    grad(defs, 'gIron', [[0, '#4e4e52'], [0.45, '#2e2e33'], [1, '#1b1b1f']], { x1: 0, y1: 0, x2: 1, y2: 1 });
    grad(defs, 'gBrass', [[0, '#c9a24f'], [0.5, '#8a6a2c'], [1, '#5c4517']], { x1: 0, y1: 0, x2: 1, y2: 1 });
    grad(defs, 'gSlate', [[0, '#3a3f42'], [1, '#24282b']], { x1: 0, y1: 0, x2: 1, y2: 1 });
    grad(defs, 'gBarrel', [[0, '#241a0e'], [0.28, '#6a5232'], [0.5, '#8a6c42'], [0.72, '#5b4527'], [1, '#1d1409']], { x1: 0, y1: 0, x2: 0, y2: 1 });

    rgrad(defs, 'gWarm', LX / W, LY / H, 0.62, [[0, 'rgba(255,206,130,0.55)'], [0.35, 'rgba(255,170,90,0.22)'], [1, 'rgba(255,150,70,0)']]);
    rgrad(defs, 'gShadeR', LX / W, LY / H, 1.05, [[0, '#ffffff'], [0.38, '#e0d6c6'], [0.7, '#96897a'], [1, '#463d33']]);
    rgrad(defs, 'gWay', 0.5, 0.55, 0.75, [[0, '#d9f5df'], [0.4, '#8ec9a0'], [0.75, '#3f7a5c'], [1, '#132d22']]);
    rgrad(defs, 'gWayDark', 0.5, 0.5, 0.75, [[0, '#0c0a0d'], [0.8, '#050406'], [1, '#000000']]);
    rgrad(defs, 'gWayGlow', 0.5, 0.5, 0.5, [[0, 'rgba(150,235,175,0.5)'], [0.5, 'rgba(110,200,150,0.18)'], [1, 'rgba(90,180,130,0)']]);
    rgrad(defs, 'gFlame', 0.5, 0.62, 0.5, [[0, '#fffbe8'], [0.35, '#ffd982'], [0.7, '#e8862f'], [1, 'rgba(190,80,20,0)']]);
    rgrad(defs, 'gHalo', 0.5, 0.5, 0.5, [[0, 'rgba(255,210,130,0.5)'], [1, 'rgba(255,180,90,0)']]);
  }

  function grad(defs, id, stops, o) {
    const g = el('linearGradient', { id, x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2 }, defs);
    for (const [off, c] of stops) el('stop', { offset: off, 'stop-color': c }, g);
  }
  function rgrad(defs, id, cx, cy, r, stops) {
    const g = el('radialGradient', { id, cx, cy, r }, defs);
    for (const [off, c] of stops) el('stop', { offset: off, 'stop-color': c }, g);
  }

  // ---- wall, ceiling, floor ----
  function buildWall(root) {
    el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#gWall)' }, root);
    el('rect', { x: 0, y: 0, width: W, height: H, filter: 'url(#fNoise)', opacity: 0.55, style: 'mix-blend-mode:multiply' }, root);

    // limewash worn through to stone in patches — heavier away from the lantern
    const g = el('g', {}, root);
    const patches = [
      [180, 850, 150, 90], [1240, 300, 120, 80], [1420, 860, 160, 100],
      [960, 260, 100, 60], [90, 330, 90, 110], [1700, 180, 130, 70],
      [620, 930, 110, 60], [1330, 620, 80, 90],
    ];
    for (const [px, py, prx, pry] of patches) {
      const p = el('g', { filter: 'url(#fRough2)' }, g);
      el('path', { d: blob(px, py, prx, pry, 10, 0.28), fill: '#7a6c58', opacity: 0.5 }, p);
      // a few stones showing through the wear
      let sy = py - pry * 0.6;
      while (sy < py + pry * 0.5) {
        let sx = px - prx * 0.7;
        while (sx < px + prx * 0.6) {
          const sw = rnd(34, 70), sh = rnd(20, 34);
          if (R() > 0.42) {
            el('path', { d: blob(sx + sw / 2, sy + sh / 2, sw / 2, sh / 2, 7, 0.2),
              fill: pick(['#6e6151', '#665a48', '#75685a', '#5f5340']),
              stroke: '#3b332a', 'stroke-width': 1.4, opacity: 0.75 }, p);
          }
          sx += sw + rnd(4, 14);
        }
        sy += rnd(24, 40);
      }
    }
    // damp stain creeping from the floor by the door
    el('path', { d: blob(1500, 990, 260, 90, 12, 0.3), fill: '#31291e', opacity: 0.4, filter: 'url(#fBlur18)' }, root);
    // old chalk tally scratched by the ropes, half rubbed out
    const tally = el('g', { filter: 'url(#fRough)', opacity: 0.32 }, root);
    for (let i = 0; i < 9; i++)
      el('path', { d: wobble(560 + i * 9 + (i % 5 === 4 ? -40 : 0), 300, 552 + i * 9 + (i % 5 === 4 ? 4 : 0), 336, 3, 1.5),
        stroke: '#d8d2c4', 'stroke-width': 2, fill: 'none' }, tally);

    // ceiling: heavy joists the ropes fall from
    const ceil = el('g', {}, root);
    el('rect', { x: 0, y: 0, width: W, height: 96, fill: '#241b10' }, ceil);
    el('rect', { x: 0, y: 0, width: W, height: 96, filter: 'url(#fGrainH)', opacity: 0.5 }, ceil);
    for (const [jy, jh] of [[96, 34], [58, 22]]) {
      const j = el('g', {}, ceil);
      el('path', { d: `M0,${jy} L${W},${jy - rnd(2, 7)} L${W},${jy + jh} L0,${jy + jh + rnd(2, 6)} Z`, fill: 'url(#gOak)' }, j);
      el('rect', { x: 0, y: jy - 4, width: W, height: jh + 8, filter: 'url(#fGrainH)', opacity: 0.65 }, j);
      el('path', { d: wobble(0, jy + jh - 2, W, jy + jh - 4, 24, 1.5), stroke: '#1a1208', 'stroke-width': 2.5, fill: 'none', opacity: 0.8 }, j);
    }
    el('rect', { x: 0, y: 0, width: W, height: 150, fill: '#100a05', opacity: 0.42 }, ceil);

    // garter-hole bosses where each rope passes up to its bell
    for (const r of ROPE) {
      const b = el('g', {}, ceil);
      el('ellipse', { cx: r.hx + 5, cy: r.hy + 3, rx: 30, ry: 12, fill: '#0d0904', opacity: 0.6 }, b);
      el('ellipse', { cx: r.hx, cy: r.hy, rx: 27 + rnd(-3, 3), ry: 11, fill: 'url(#gOak)', stroke: '#20150a', 'stroke-width': 2 }, b);
      el('ellipse', { cx: r.hx, cy: r.hy, rx: 9, ry: 4.5, fill: '#0a0603' }, b);
      // two of the bosses have split and been strapped with iron
      if (r.hx === 916 || r.hx === 1288) {
        el('path', { d: wobble(r.hx - 24, r.hy - 6, r.hx + 22, r.hy + 7, 4, 1.2), stroke: '#191106', 'stroke-width': 2, fill: 'none' }, b);
        el('rect', { x: r.hx - 20, y: r.hy - 3, width: 40, height: 6, fill: 'url(#gIron)', transform: `rotate(${rnd(-4, 4)} ${r.hx} ${r.hy})` }, b);
        el('circle', { cx: r.hx - 15, cy: r.hy, r: 2, fill: '#555' }, b);
        el('circle', { cx: r.hx + 15, cy: r.hy, r: 2, fill: '#555' }, b);
      }
    }
  }

  function buildFloor(root) {
    const g = el('g', {}, root);
    el('rect', { x: 0, y: 940, width: W, height: 140, fill: 'url(#gFloor)' }, g);
    // boards laid toward the door, widths uneven, a few proud nails
    let y = 944;
    while (y < 1080) {
      const bh = rnd(22, 40);
      el('path', { d: wobble(0, y, W, y + rnd(-3, 3), 18, 1.6), stroke: '#1d1409', 'stroke-width': 2.2, fill: 'none', opacity: 0.85 }, g);
      const joint = rnd(300, 1650);
      el('path', { d: wobble(joint, y + 2, joint + rnd(-4, 4), Math.min(1078, y + bh), 3, 1), stroke: '#1d1409', 'stroke-width': 2, fill: 'none', opacity: 0.7 }, g);
      if (R() > 0.5) el('circle', { cx: joint + rnd(-60, 60), cy: y + bh / 2, r: 2.2, fill: '#100b06' }, g);
      y += bh;
    }
    el('rect', { x: 0, y: 940, width: W, height: 140, filter: 'url(#fGrainH)', opacity: 0.55 }, g);
    // the walked path: boards scrubbed pale between the ropes and the door
    el('path', { d: blob(1250, 1000, 500, 55, 14, 0.25), fill: '#8a7457', opacity: 0.16, filter: 'url(#fBlur18)' }, g);
    el('path', { d: blob(950, 1010, 260, 45, 12, 0.3), fill: '#8a7457', opacity: 0.12, filter: 'url(#fBlur18)' }, g);
    // clutter: an oil can and a dropped rope end by the frame
    const can = el('g', {}, g);
    el('ellipse', { cx: 668, cy: 1046, rx: 26, ry: 7, fill: '#0d0904', opacity: 0.55 }, can);
    el('path', { d: 'M648,1042 L652,996 Q668,988 684,996 L688,1042 Q668,1052 648,1042 Z', fill: 'url(#gIron)' }, can);
    el('path', { d: 'M664,996 L660,978 L666,976 L672,994', fill: '#2c2c31' }, can);
    el('ellipse', { cx: 655, cy: 1010, rx: 4, ry: 10, fill: '#6a6a70', opacity: 0.5 }, can);
    const coil = el('g', {}, g);
    el('ellipse', { cx: 760, cy: 1052, rx: 40, ry: 11, fill: '#0d0904', opacity: 0.5 }, coil);
    for (let i = 0; i < 4; i++)
      el('ellipse', { cx: 760 + rnd(-6, 6), cy: 1046 - i * 5, rx: 34 - i * 4, ry: 10 - i * 1.5,
        fill: 'none', stroke: i % 2 ? '#7d6a4c' : '#6d5b40', 'stroke-width': 7 - i }, coil);
  }

  // ---- the door the changes open ----
  function buildDoor(root) {
    const g = el('g', {}, root);
    const { x0, x1, top, spring, floor } = DOOR;
    const mid = (x0 + x1) / 2;

    // the space beyond: fair (a far lych-gate in green mist) or dark
    const wayGroup = el('g', { opacity: 0 }, g);
    const wayFair = el('g', {}, wayGroup);
    el('path', { d: doorOutline(6), fill: 'url(#gWay)' }, wayFair);
    const lych = el('g', { opacity: 0.8 }, wayFair);
    el('path', { d: `M${mid - 70},870 L${mid - 62},700 L${mid + 58},700 L${mid + 66},870`, fill: 'none', stroke: '#0e2018', 'stroke-width': 13 }, lych);
    el('path', { d: `M${mid - 95},706 L${mid},660 L${mid + 95},706 Z`, fill: '#0e2018' }, lych);
    el('path', { d: `M${mid - 40},870 L${mid - 40},760 L${mid + 36},760 L${mid + 36},870`, fill: 'none', stroke: '#0e2018', 'stroke-width': 6 }, lych);
    const mists = [];
    for (let i = 0; i < 3; i++)
      mists.push(el('ellipse', { cx: mid + rnd(-60, 60), cy: 780 + i * 40, rx: rnd(90, 150), ry: rnd(18, 30),
        fill: '#cfeeda', opacity: 0.16 + i * 0.04, filter: 'url(#fBlur18)' }, wayFair));
    const wayDark = el('g', { opacity: 0 }, wayGroup);
    el('path', { d: doorOutline(6), fill: 'url(#gWayDark)' }, wayDark);
    el('ellipse', { cx: mid, cy: 640, rx: 90, ry: 130, fill: '#1a0508', opacity: 0.5, filter: 'url(#fBlur18)' }, wayDark);

    // stone surround: uneven voussoirs and jambs, no two alike
    const stones = el('g', { filter: 'url(#fRough2)' }, g);
    const jamb = (jx, side) => {
      let y = floor;
      while (y > spring) {
        const sh = rnd(52, 86);
        const sw = rnd(46, 62);
        el('path', { d: blob(jx + side * sw * 0.4, y - sh / 2, sw / 2 + 6, sh / 2, 8, 0.14),
          fill: pick(['#7b6f5d', '#716552', '#847761']),
          stroke: '#3a3226', 'stroke-width': 2 }, stones);
        y -= sh + rnd(2, 8);
      }
    };
    jamb(x0 - 26, -1); jamb(x1 + 26, 1);
    const cx = mid, cy = spring, rr = (x1 - x0) / 2 + 26;
    let a0 = Math.PI;
    while (a0 > 0.08) {
      const da = rnd(0.3, 0.5);
      const a1 = Math.max(0.02, a0 - da);
      const am = (a0 + a1) / 2;
      el('path', { d: blob(cx + Math.cos(am) * (rr + 8), cy - Math.sin(am) * ((top ? rr : rr)) * ((spring - top) / rr) - 0,
        34, 30, 8, 0.16), fill: pick(['#7b6f5d', '#6d6150', '#80735f']), stroke: '#3a3226', 'stroke-width': 2,
        transform: `rotate(${(Math.PI / 2 - am) * 57.3} ${cx + Math.cos(am) * (rr + 8)} ${cy - Math.sin(am) * (rr * ((spring - top) / rr))})` }, stones);
      a0 = a1;
    }
    // keystone sits proud, with a mason's mark
    el('path', { d: blob(mid, top - 6, 42, 36, 8, 0.12), fill: '#87796a', stroke: '#3a3226', 'stroke-width': 2.5 }, stones);
    el('path', { d: `M${mid - 10},${top - 16} L${mid + 10},${top + 4} M${mid + 10},${top - 16} L${mid - 10},${top + 4}`, stroke: '#4a4234', 'stroke-width': 2.5 }, stones);

    // shadow the arch throws away from the lantern
    el('path', { d: doorOutline(-14), fill: 'none', stroke: '#140e08', 'stroke-width': 26, opacity: 0.5, filter: 'url(#fBlur9)', transform: 'translate(16,10)' }, g);

    // the door itself: five planks, two strap hinges, a sneck and ring
    const slab = el('g', {}, g);
    const slabClip = el('clipPath', { id: 'clipSlab' }, slab);
    el('path', { d: doorOutline(4) }, slabClip);
    el('path', { d: doorOutline(4), fill: 'url(#gDoorWood)' }, slab);
    const planks = el('g', { 'clip-path': 'url(#clipSlab)' }, slab);
    let px = x0 + 4;
    const widths = [70, 78, 62, 74, 66].map(w => w * (x1 - x0 - 8) / 350);
    for (const w of widths) {
      el('path', { d: wobble(px + w, top - 10, px + w, floor - 4, 10, 1.8), stroke: '#20150a', 'stroke-width': 3, fill: 'none', opacity: 0.9 }, planks);
      for (let k = 0; k < 3; k++)
        el('path', { d: wobble(px + rnd(6, w - 8), spring - rnd(-60, 160), px + rnd(6, w - 8), floor - rnd(30, 260), 8, 3), stroke: '#2b1d0f', 'stroke-width': 1.2, fill: 'none', opacity: 0.6 }, planks);
      if (R() > 0.55) el('ellipse', { cx: px + rnd(10, w - 10), cy: rnd(spring, floor - 80), rx: rnd(4, 7), ry: rnd(6, 10), fill: '#241609', stroke: '#1a0f06', 'stroke-width': 1.5 }, planks);
      px += w;
    }
    el('rect', { x: x0, y: top, width: x1 - x0, height: floor - top, filter: 'url(#fGrainV)', opacity: 0.5 }, planks);
    // hinges: long iron straps with clout nails, the lower one dripping rust
    for (const hy of [560, 846]) {
      const strap = el('g', {}, slab);
      el('path', { d: `M${x0 + 2},${hy - 13} L${x0 + 218},${hy - 9 + rnd(-3, 3)} L${x0 + 252},${hy} L${x0 + 218},${hy + 9} L${x0 + 2},${hy + 13} Z`, fill: 'url(#gIron)', stroke: '#0e0e11', 'stroke-width': 1.5 }, strap);
      for (let nx = x0 + 26; nx < x0 + 210; nx += rnd(34, 48))
        el('circle', { cx: nx, cy: hy + rnd(-4, 4), r: 3.4, fill: '#494950', stroke: '#101013', 'stroke-width': 1 }, strap);
      el('path', { d: `M${x0 + 2},${hy - 16} L${x0 + 2},${hy + 16}`, stroke: '#55555c', 'stroke-width': 5 }, strap);
      if (hy > 800) el('path', { d: wobble(x0 + 90, hy + 12, x0 + 96, hy + 60, 4, 2), stroke: '#5a3b22', 'stroke-width': 4, opacity: 0.55, fill: 'none' }, strap);
    }
    // ring handle and sneck on the far side from the hinges
    el('circle', { cx: x1 - 52, cy: 700, r: 6, fill: '#3a3a40', stroke: '#101013', 'stroke-width': 2 }, slab);
    el('circle', { cx: x1 - 52, cy: 722, r: 20, fill: 'none', stroke: 'url(#gIron)', 'stroke-width': 6 }, slab);
    el('path', { d: `M${x1 - 96},742 L${x1 - 20},738`, stroke: 'url(#gIron)', 'stroke-width': 8, 'stroke-linecap': 'round' }, slab);
    // lantern-side edges catch the light
    el('path', { d: `M${x0 + 6},${top + 60} Q${x0 + 6},${floor - 40} ${x0 + 8},${floor - 4}`, stroke: '#a08454', 'stroke-width': 3, opacity: 0.5, fill: 'none' }, slab);
    const slabShade = el('path', { d: doorOutline(4), fill: '#0a0703', opacity: 0 }, slab);

    return { slab, slabShade, wayGroup, wayFair, wayDark, mists };

    function doorOutline(inset) {
      const ix0 = x0 + inset, ix1 = x1 - inset, itop = top + inset * 1.4;
      return `M${ix0},${floor} L${ix0},${spring} Q${ix0},${itop} ${mid},${itop} Q${ix1},${itop} ${ix1},${spring} L${ix1},${floor} Z`;
    }
  }

  // ---- the stay-bolt on the pier ----
  function buildLatch(root) {
    const g = el('g', {}, root);
    // chain up to the stays, drawn first so the bolt sits over it
    const chain = el('path', { d: 'M1381,148 C1395,300 1370,380 1381,418', fill: 'none', stroke: '#26262b', 'stroke-width': 5, 'stroke-dasharray': '7 4' }, g);
    // spare coil on a peg, half over the chain — nobody tidies a tower
    const peg = el('g', {}, g);
    el('ellipse', { cx: 1394, cy: 302, rx: 34, ry: 40, fill: '#0d0904', opacity: 0.45, filter: 'url(#fBlur9)' }, peg);
    el('path', { d: 'M1378,258 L1390,244 L1398,250 L1388,266', fill: '#4c3a24' }, peg);
    for (let i = 0; i < 5; i++)
      el('ellipse', { cx: 1386 + rnd(-4, 4), cy: 296 + rnd(-4, 4), rx: 26 - i * 2.5, ry: 34 - i * 3,
        fill: 'none', stroke: i % 2 ? '#7d6a4c' : '#69573c', 'stroke-width': 6 - i * 0.5, transform: `rotate(${rnd(-7, 7)} 1386 296)` }, peg);

    const shadow = el('path', { d: blob(1398, 505, 52, 110, 10, 0.2), fill: '#120c06', opacity: 0.45, filter: 'url(#fBlur9)' }, g);
    shadow.setAttribute('transform', 'translate(14,8)');
    const back = el('g', {}, g);
    el('path', { d: `M1342,408 L1420,404 L1424,596 L1338,600 Z`, fill: 'url(#gOak)', stroke: '#241708', 'stroke-width': 3 }, back);
    el('rect', { x: 1340, y: 406, width: 82, height: 192, filter: 'url(#fGrainV)', opacity: 0.6 }, back);
    // iron keeps top and bottom, worn bright where the rod runs
    for (const ky of [428, 566]) {
      el('path', { d: `M1352,${ky} L1410,${ky - 2} L1410,${ky + 16} L1352,${ky + 18} Z`, fill: 'url(#gIron)', stroke: '#0e0e11', 'stroke-width': 1.5 }, back);
      el('circle', { cx: 1358, cy: ky + 8, r: 2.4, fill: '#55555c' }, back);
      el('circle', { cx: 1404, cy: ky + 7, r: 2.4, fill: '#55555c' }, back);
    }
    const rod = el('g', {}, g);
    el('rect', { x: 1374, y: 418, width: 14, height: 132, rx: 4, fill: 'url(#gIron)', stroke: '#0c0c0f', 'stroke-width': 1.5 }, rod);
    el('rect', { x: 1376, y: 420, width: 4, height: 128, fill: '#75757d', opacity: 0.6 }, rod);
    el('ellipse', { cx: 1381, cy: 556, rx: 17, ry: 14, fill: 'url(#gIron)', stroke: '#0c0c0f', 'stroke-width': 2 }, rod);
    el('ellipse', { cx: 1377, cy: 551, rx: 5, ry: 4, fill: '#8b8b94', opacity: 0.7 }, rod);
    // the carved plate
    const plate = el('g', { transform: 'rotate(-2 1381 622)' }, g);
    el('path', { d: 'M1344,610 L1420,606 L1422,636 L1342,640 Z', fill: '#553f26', stroke: '#241708', 'stroke-width': 2 }, plate);
    txt(plate, 'STAYS', { x: 1381, y: 630, 'text-anchor': 'middle', class: 'carved' });
    // wide invisible catch for the hand
    el('rect', { x: 1330, y: 396, width: 104, height: 250, class: 'hit', 'data-act': 'latch' }, g);
    return { rod, chain };
  }

  // ---- chiming wires up the wall ----
  function buildWires(root) {
    const g = el('g', {}, root);
    for (let i = 0; i < 6; i++) {
      const fx = 136 + i * 50, fy = 872 + i * 4;      // lever end (drawn again later, above)
      const cxx = 120 + i * 26;                        // ceiling eyelet
      el('path', { d: `M${fx},${fy} C${fx - rnd(4, 18)},${fy - 300} ${cxx + rnd(-6, 6)},420 ${cxx},128`, fill: 'none', stroke: '#1f1c16', 'stroke-width': 2, opacity: 0.85 }, g);
      el('circle', { cx: cxx, cy: 128, r: 4, fill: '#2c2c31' }, g);
      // a cleat where each wire is stapled to the wall
      el('rect', { x: cxx - 5, y: 300 + i * 30, width: 10, height: 6, fill: '#33332a', transform: `rotate(${rnd(-8, 8)} ${cxx} ${300 + i * 30})` }, g);
    }
    return g;
  }

  // ---- the peal board ----
  function buildBoard(root) {
    const g = el('g', { transform: 'rotate(-1.6 300 400)' }, root);
    el('rect', { x: 116, y: 202, width: 402, height: 420, fill: '#0d0904', opacity: 0.5, filter: 'url(#fBlur9)', transform: 'translate(-14,10)' }, g);
    el('path', { d: `M104,196 L508,190 L512,612 L100,618 Z`, fill: '#2e2317', stroke: '#17100a', 'stroke-width': 4 }, g);
    el('rect', { x: 104, y: 192, width: 406, height: 424, filter: 'url(#fGrainV)', opacity: 0.5 }, g);
    el('path', { d: `M116,206 L497,201 L500,601 L112,606 Z`, fill: 'none', stroke: '#6d5a3a', 'stroke-width': 2.5, opacity: 0.7 }, g);
    // hung from two forged nails, one bent
    el('circle', { cx: 150, cy: 186, r: 4, fill: '#3c3c42' }, g);
    el('path', { d: 'M462,182 L470,190 L464,196', fill: 'none', stroke: '#3c3c42', 'stroke-width': 5 }, g);

    const t = el('g', { filter: 'url(#fRough)' }, g);
    txt(t, 'THE HOLLOWBECK SIX', { x: 306, y: 248, 'text-anchor': 'middle', class: 'boardTitle' });
    txt(t, 'ring the road, close on GRIEF', { x: 306, y: 280, 'text-anchor': 'middle', class: 'boardSub' });
    let y = 330;
    for (const r of ROADS) {
      const row = el('g', { transform: `rotate(${rnd(-0.7, 0.7)} 300 ${y})` }, t);
      if (r.pinned) el('circle', { cx: 142, cy: y - 7, r: 4.5, fill: '#b9a15c' }, row);
      txt(row, r.name, { x: 158, y, class: 'boardRoad' + (r.struck ? ' struck' : '') });
      txt(row, r.change.join(' '), { x: 470, y, 'text-anchor': 'end', class: 'boardChange' + (r.struck ? ' struck' : '') });
      if (r.struck) {
        el('path', { d: wobble(150, y - 7, 478, y - 9, 8, 2.5), stroke: '#d8d2c4', 'stroke-width': 3, fill: 'none', opacity: 0.85 }, row);
        txt(row, 'let it lie', { x: 366, y: y + 21, class: 'boardScrawl' });
        y += 16;
      }
      y += 40;
    }
    txt(t, '● pinned on the barrel — chime what’s pinned, ring what isn’t', { x: 306, y: 592, 'text-anchor': 'middle', class: 'boardFoot' });
  }

  // ---- the ringing slate ----
  function buildSlate(root) {
    const g = el('g', { transform: 'rotate(1.2 300 700)' }, root);
    el('path', { d: 'M232,626 L238,652 M368,624 L362,650', stroke: '#4a3a24', 'stroke-width': 4, fill: 'none' }, g);
    el('rect', { x: 212, y: 654, width: 186, height: 136, fill: '#0d0904', opacity: 0.5, filter: 'url(#fBlur9)', transform: 'translate(-10,8)' }, g);
    el('path', { d: 'M208,650 L400,646 L404,788 L204,792 Z', fill: 'url(#gSlate)', stroke: '#15171a', 'stroke-width': 4 }, g);
    el('rect', { x: 208, y: 648, width: 196, height: 142, filter: 'url(#fNoiseFine)', opacity: 0.35 }, g);
    el('path', { d: wobble(216, 660, 250, 700, 4, 3), stroke: '#0f1113', 'stroke-width': 2, fill: 'none', opacity: 0.7 }, g);
    const nums = txt(g, '', { x: 306, y: 712, 'text-anchor': 'middle', class: 'slateNums', filter: 'url(#fRough)' });
    const chalkStub = el('g', {}, g);
    el('rect', { x: 356, y: 766, width: 26, height: 8, rx: 4, fill: '#ddd8cb', transform: 'rotate(-14 369 770)' }, chalkStub);

    // the sexton's chalk line lives on the wall under the ropes
    const msg = txt(root, '', { x: 960, y: 926, 'text-anchor': 'middle', class: 'chalkMsg', filter: 'url(#fRough)' });
    return {
      chalk(arr) { nums.textContent = arr.join('  '); },
      msg(s) { msg.textContent = s; },
    };
  }

  // ---- the Ellacombe frame and the sexton's barrel ----
  function buildBarrelFrame(root) {
    const g = el('g', {}, root);
    el('path', { d: blob(330, 1010, 300, 60, 14, 0.2), fill: '#0d0904', opacity: 0.5, filter: 'url(#fBlur18)' }, g);

    // leaning oak frame carrying the tap levers
    const frame = el('g', {}, g);
    el('path', { d: 'M84,1052 L102,838 L128,840 L118,1052 Z', fill: 'url(#gOak)', stroke: '#1d1206', 'stroke-width': 3 }, frame);
    el('path', { d: 'M560,1052 L570,872 L596,876 L588,1052 Z', fill: 'url(#gOak)', stroke: '#1d1206', 'stroke-width': 3 }, frame);
    el('path', { d: 'M96,858 L590,894 L588,930 L94,894 Z', fill: 'url(#gOak)', stroke: '#1d1206', 'stroke-width': 3 }, frame);
    el('rect', { x: 84, y: 840, width: 512, height: 214, filter: 'url(#fGrainV)', opacity: 0.4 }, frame);
    // the keeper batten: hand-taps pinned down, sexton chimes by barrel only
    el('path', { d: 'M110,846 L470,872 L468,884 L108,858 Z', fill: '#553f26', stroke: '#1d1206', 'stroke-width': 2 }, frame);
    txt(frame, 'hands off — the barrel knows', { x: 288, y: 922, class: 'carvedSmall', transform: 'rotate(4 288 916)' });

    const hammerEls = [], hammerPivots = [];
    for (let i = 0; i < 6; i++) {
      const hx = 136 + i * 50, hy = 872 + i * 4;
      const lever = el('g', {}, g);
      el('circle', { cx: hx, cy: hy, r: 5, fill: '#2c2c31', stroke: '#0e0e11', 'stroke-width': 1.5 }, lever);
      const arm = el('g', {}, lever);
      el('path', { d: `M${hx},${hy} L${hx - 6},${hy - 44}`, stroke: 'url(#gBrass)', 'stroke-width': 7, 'stroke-linecap': 'round' }, arm);
      el('circle', { cx: hx - 6, cy: hy - 46, r: 7, fill: 'url(#gBrass)', stroke: '#3a2c10', 'stroke-width': 1.5 }, arm);
      hammerEls.push(arm); hammerPivots.push([hx, hy]);
    }

    // the barrel box, set in front of the frame's right leg
    const box = el('g', {}, g);
    el('path', { d: 'M392,902 L618,912 L614,1054 L388,1050 Z', fill: '#241708', stroke: '#120a04', 'stroke-width': 3 }, box);
    el('path', { d: 'M400,910 L610,919 L607,1046 L397,1042 Z', fill: '#171006', stroke: '#0d0803', 'stroke-width': 2 }, box);
    // the barrel itself, pins scattered as the roads demand — not in rows
    const barrelG = el('g', {}, box);
    el('rect', { x: 404, y: 930, width: 200, height: 92, rx: 46, fill: 'url(#gBarrel)' }, barrelG);
    const pinsClip = el('clipPath', { id: 'clipBarrel' }, barrelG);
    el('rect', { x: 404, y: 930, width: 200, height: 92, rx: 46 }, pinsClip);
    const pinsEl = el('g', { 'clip-path': 'url(#clipBarrel)' }, barrelG);
    for (let i = 0; i < 46; i++) {
      const bx = rnd(410, 598), by = rnd(918, 1036);
      el('rect', { x: bx, y: by, width: rnd(2.5, 4), height: rnd(5, 8), fill: '#c9b489', opacity: rnd(0.5, 0.95), transform: `rotate(${rnd(-10, 10)} ${bx} ${by})` }, pinsEl);
    }
    el('ellipse', { cx: 504, cy: 944, rx: 98, ry: 9, fill: '#ffedc2', opacity: 0.13 }, barrelG);
    // gudgeon and crank on the right cheek
    el('circle', { cx: 601, cy: 972, r: 10, fill: 'url(#gIron)', stroke: '#0c0c0f', 'stroke-width': 2 }, box);
    const crankArm = el('g', {}, box);
    el('path', { d: 'M601,972 L634,948', stroke: 'url(#gIron)', 'stroke-width': 8, 'stroke-linecap': 'round' }, crankArm);
    el('rect', { x: 628, y: 922, width: 12, height: 30, rx: 5, fill: '#5b4426', stroke: '#20150a', 'stroke-width': 2 }, crankArm);
    // engage lever on the left cheek, springs home when the run is done
    const engageEl = el('g', {}, box);
    el('path', { d: 'M418,933 L382,872', stroke: 'url(#gIron)', 'stroke-width': 9, 'stroke-linecap': 'round' }, engageEl);
    el('circle', { cx: 382, cy: 868, r: 9, fill: '#5b4426', stroke: '#20150a', 'stroke-width': 2 }, engageEl);
    el('circle', { cx: 418, cy: 933, r: 7, fill: '#2c2c31', stroke: '#0e0e11', 'stroke-width': 2 }, box);

    // the card window naming what the pins will ring
    const card = el('g', { transform: 'rotate(-1 505 890)' }, g);
    el('rect', { x: 432, y: 874, width: 150, height: 34, rx: 3, fill: '#d9cfb4', stroke: '#8a6a2c', 'stroke-width': 3 }, card);
    el('rect', { x: 432, y: 874, width: 150, height: 34, filter: 'url(#fNoiseFine)', opacity: 0.25 }, card);
    const cardText = txt(card, PINNED[0].name, { x: 507, y: 897, 'text-anchor': 'middle', class: 'cardName' });

    txt(g, "the sexton’s barrel", { x: 500, y: 1074, 'text-anchor': 'middle', class: 'carvedSmall' });

    el('rect', { x: 588, y: 918, width: 70, height: 110, class: 'hit', 'data-act': 'crank' }, g);
    el('rect', { x: 358, y: 846, width: 66, height: 100, class: 'hit', 'data-act': 'engage' }, g);
    return { hammerEls, hammerPivots, pinsEl, crankArm, engageEl, cardText };
  }

  // ---- six ropes, no two hanging alike ----
  function buildRopes(root) {
    const out = [];
    for (let i = 0; i < 6; i++) {
      const r = ROPE[i];
      const g = el('g', { opacity: r.back ? 0.88 : 1 }, root);
      // faint shadow the rope throws on the wall, away from the lantern
      const shDir = r.hx > LX ? 1 : -1;
      el('path', { d: `M${r.hx + shDir * 26},${r.hy + 30} L${r.hx + shDir * 40},${r.sallyY + 160}`, stroke: '#171008', 'stroke-width': 10, opacity: 0.22, filter: 'url(#fBlur9)', fill: 'none' }, g);
      const line = el('path', { d: '', fill: 'none', stroke: r.back ? '#8a7452' : '#9c8560', 'stroke-width': r.w, 'stroke-linecap': 'round' }, g);
      // twist marks: irregular dashes overlaid on the fall
      const twist = el('path', { d: '', fill: 'none', stroke: '#6b5637', 'stroke-width': r.w * 0.5, 'stroke-dasharray': `${rnd(4, 6)} ${rnd(6, 10)}`, opacity: 0.5 }, g);

      // sally + tail travel together
      const sally = el('g', {}, g);
      const sh = r.sallyH;
      const bands = [];
      let sy = 0;
      const cols = ['#8c2f2a', '#d8cfbb', '#2e3f63'];
      let ci = Math.floor(R() * 3);
      while (sy < sh) {
        const bh = rnd(15, 24);
        bands.push([sy, Math.min(bh, sh - sy), cols[ci % 3]]);
        ci++; sy += bh;
      }
      const sw = r.w * 2.5;
      const sallyBody = el('g', { filter: 'url(#fRough)' }, sally);
      for (const [by, bh, c] of bands) {
        const worn = R() < 0.25;
        el('path', { d: `M${-sw / 2 + rnd(-1.5, 1.5)},${by} Q0,${by - 2} ${sw / 2 + rnd(-1.5, 1.5)},${by + rnd(-2, 2)} L${sw / 2 + rnd(-2, 2)},${by + bh} Q0,${by + bh + 2} ${-sw / 2 + rnd(-2, 2)},${by + bh + rnd(-2, 2)} Z`,
          fill: c, opacity: worn ? 0.72 : 0.95 }, sallyBody);
      }
      // rounded ends of the sally
      el('ellipse', { cx: 0, cy: 2, rx: sw / 2 - 1, ry: 7, fill: bands[0][2] }, sallyBody);
      el('ellipse', { cx: 0, cy: sh - 2, rx: sw / 2 - 1, ry: 7, fill: bands[bands.length - 1][2] }, sallyBody);
      // lantern-side sheen and off-side shade down the whole grip
      el('path', { d: `M${-sw * 0.28},4 Q${-sw * 0.34},${sh / 2} ${-sw * 0.26},${sh - 6}`, stroke: '#ffe9bd', 'stroke-width': 4, opacity: 0.35, fill: 'none' }, sally);
      el('path', { d: `M${sw * 0.3},6 Q${sw * 0.38},${sh / 2} ${sw * 0.3},${sh - 8}`, stroke: '#241708', 'stroke-width': 6, opacity: 0.3, fill: 'none' }, sally);
      // tail below: doubled back and whipped
      const tl = r.tail;
      el('path', { d: `M0,${sh} C${rnd(-8, 8)},${sh + tl * 0.5} ${rnd(-10, 10)},${sh + tl * 0.8} ${rnd(-4, 4)},${sh + tl}`, stroke: r.back ? '#8a7452' : '#9c8560', 'stroke-width': r.w * 0.8, fill: 'none', 'stroke-linecap': 'round' }, sally);
      el('path', { d: `M${rnd(-4, 4)},${sh + tl} C10,${sh + tl + 26} -14,${sh + tl + 30} ${rnd(-2, 6)},${sh + tl + rnd(30, 44)}`, stroke: r.back ? '#8a7452' : '#9c8560', 'stroke-width': r.w * 0.7, fill: 'none', 'stroke-linecap': 'round' }, sally);
      el('rect', { x: -r.w * 0.55, y: sh + tl - 8, width: r.w * 1.1, height: 9, rx: 3, fill: '#54432a' }, sally);

      // the tenor is told apart: heavier rope, leather chafe guard above the sally
      if (i === 5) {
        el('rect', { x: -r.w * 0.9, y: -46, width: r.w * 1.8, height: 34, rx: 6, fill: '#4a2e18', stroke: '#241102', 'stroke-width': 2 }, sally);
        el('path', { d: `M${-r.w * 0.9},-38 L${r.w * 0.9},-40 M${-r.w * 0.9},-22 L${r.w * 0.9},-24`, stroke: '#241102', 'stroke-width': 1.5 }, sally);
      }

      const hit = el('rect', { x: r.hx - 34, y: r.hy + 120, width: 68, height: 720, class: 'hit', 'data-act': 'rope', 'data-bell': i + 1 }, root);
      out.push({ line, twist, sally, hit });
    }
    return out;
  }

  // ---- the lantern: one flame, really lit ----
  function buildLantern(root) {
    const g = el('g', {}, root);
    el('path', { d: 'M705,62 L705,168', stroke: '#26262b', 'stroke-width': 4, 'stroke-dasharray': '8 5' }, g);
    el('path', { d: 'M705,96 m-4,0 a4,6 0 1,0 8,0 a4,6 0 1,0 -8,0', fill: 'none', stroke: '#3a3a40', 'stroke-width': 2 }, g);
    const halo = el('circle', { cx: 705, cy: 244, r: 150, fill: 'url(#gHalo)', opacity: 0.8 }, g);
    // body: soot-dark tin, one pane cracked
    el('path', { d: 'M676,180 L734,180 L742,300 L668,300 Z', fill: '#1c1c20', stroke: '#0d0d10', 'stroke-width': 3 }, g);
    el('path', { d: 'M672,180 Q705,158 738,180', fill: 'none', stroke: '#1c1c20', 'stroke-width': 8 }, g);
    el('ellipse', { cx: 705, cy: 302, rx: 39, ry: 8, fill: '#141417', stroke: '#0d0d10', 'stroke-width': 2 }, g);
    // glass, flame behind it in three layers, then the glazing bars
    el('path', { d: 'M682,192 L728,192 L734,292 L676,292 Z', fill: '#33241263' }, g);
    const flameGlow = el('ellipse', { cx: 705, cy: 244, rx: 26, ry: 34, fill: 'url(#gFlame)', opacity: 0.55, filter: 'url(#fBlur9)' }, g);
    const flameCore = el('g', {}, g);
    el('path', { d: 'M705,268 C688,252 694,230 705,212 C716,230 722,252 705,268 Z', fill: 'url(#gFlame)' }, flameCore);
    el('path', { d: 'M705,262 C697,252 700,238 705,228 C710,238 713,252 705,262 Z', fill: '#fff6d8', opacity: 0.9 }, flameCore);
    el('path', { d: 'M705,258 C701,252 702,244 705,238 C708,244 709,252 705,258 Z', fill: '#ffffff' }, flameCore);
    el('rect', { x: 701, y: 264, width: 8, height: 10, fill: '#3a2c14' }, flameCore);
    el('path', { d: 'M705,192 L705,292 M682,240 L730,240', stroke: '#141417', 'stroke-width': 4 }, g);
    el('path', { d: wobble(712, 200, 726, 236, 4, 2), stroke: '#d8d2c4', 'stroke-width': 1.2, opacity: 0.4, fill: 'none' }, g);
    // soot streak up the near side
    el('path', { d: 'M728,186 Q736,240 740,296', stroke: '#000', 'stroke-width': 9, opacity: 0.35, fill: 'none', filter: 'url(#fBlur4)' }, g);
    return { flameCore, halo, flameGlow };
  }

  // ---- light over everything ----
  function buildLight(root) {
    const wayGlow = el('ellipse', { cx: 1650, cy: 660, rx: 420, ry: 380, fill: 'url(#gWayGlow)', opacity: 0, style: 'mix-blend-mode:screen' }, root);
    const warm = el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#gWarm)', style: 'mix-blend-mode:screen', opacity: 0.8 }, root);
    const shade = el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#gShadeR)', style: 'mix-blend-mode:multiply', opacity: 0.94 }, root);
    const motesG = el('g', {}, root);
    const motes = [];
    for (let i = 0; i < 42; i++) {
      const m = el('circle', { r: rnd(1, 2.6), fill: '#ffe9bd', opacity: 0 }, motesG);
      m._p = { x0: rnd(380, 1100), y0: rnd(0, 520), vy: rnd(6, 17), wx: rnd(0.2, 0.7), ax: rnd(8, 30), ph: rnd(0, 6.28) };
      motes.push(m);
    }
    return { warm, shade, motes, wayGlow };
  }

  function collectHits(svg) {
    const hits = {};
    svg.querySelectorAll('.hit').forEach(h => {
      const act = h.getAttribute('data-act');
      if (act === 'rope') (hits.ropes = hits.ropes || [])[+h.getAttribute('data-bell') - 1] = h;
      else hits[act] = h;
    });
    return hits;
  }
}
