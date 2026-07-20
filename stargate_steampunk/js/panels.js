/* Instrument panels: pressure gauge, flyball governor, annunciator
   drops, card rack, composing punch. Build once; every render reads
   the sim's closed-form state. No CSS transitions carry game state. */

import * as sim from './sim.js';
import { CORRESPONDENTS, ROMANS } from './cards.js';
import { now } from './clock.js';

const NS = 'http://www.w3.org/2000/svg';
const $ = (id) => document.getElementById(id);

function el(name, attrs, parent) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const easeOutCubic = (k) => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
function easeOutBack(k) {
  k = clamp(k, 0, 1);
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
}

/* ---------------- pressure gauge ---------------- */

let needle = null;

const rotFor = (p) => -135 + (clamp(p, 0, sim.P.MAX) / sim.P.MAX) * 270;
function polar(cx, cy, r, rotDeg) {
  const a = rotDeg * Math.PI / 180;
  return [cx + Math.sin(a) * r, cy - Math.cos(a) * r];
}
function arcPath(cx, cy, r, rot0, rot1) {
  const [x0, y0] = polar(cx, cy, r, rot0);
  const [x1, y1] = polar(cx, cy, r, rot1);
  const large = rot1 - rot0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

export function buildGauge() {
  const svg = $('gauge');
  el('circle', { cx: 100, cy: 100, r: 96, fill: '#241a0c' }, svg);
  el('circle', { cx: 100, cy: 100, r: 92, fill: '#b6934a' }, svg);
  el('circle', { cx: 100, cy: 100, r: 86, fill: '#ece1c2', stroke: '#6f5524', 'stroke-width': 2 }, svg);

  el('path', { d: arcPath(100, 100, 78, rotFor(sim.P.WORKING_MIN), rotFor(sim.P.WORKING_MAX)),
    fill: 'none', stroke: '#4e7d6d', 'stroke-width': 6, 'stroke-linecap': 'butt' }, svg);
  el('path', { d: arcPath(100, 100, 78, rotFor(160), rotFor(180)),
    fill: 'none', stroke: '#8e2f24', 'stroke-width': 6 }, svg);

  for (let p = 0; p <= 180; p += 10) {
    const major = p % 30 === 0;
    const r0 = major ? 70 : 74, r1 = 82;
    const [x0, y0] = polar(100, 100, r0, rotFor(p));
    const [x1, y1] = polar(100, 100, r1, rotFor(p));
    el('line', { x1: x0, y1: y0, x2: x1, y2: y1,
      stroke: '#4a3a16', 'stroke-width': major ? 2 : 1 }, svg);
    if (major) {
      const [tx, ty] = polar(100, 100, 60, rotFor(p));
      const t = el('text', { x: tx, y: ty + 3, 'text-anchor': 'middle',
        'font-size': 9, fill: '#4a3a16', 'font-family': 'Georgia, serif' }, svg);
      t.textContent = p;
    }
  }
  const t1 = el('text', { x: 100, y: 132, 'text-anchor': 'middle', 'font-size': 10,
    fill: '#6a552a', 'letter-spacing': 2, 'font-family': 'Georgia, serif' }, svg);
  t1.textContent = 'STEAM';
  const t2 = el('text', { x: 100, y: 144, 'text-anchor': 'middle', 'font-size': 6.5,
    fill: '#6a552a', 'font-family': 'Georgia, serif' }, svg);
  t2.textContent = 'LB. PER SQ. INCH';

  needle = el('g', { transform: 'rotate(-135,100,100)' }, svg);
  el('line', { x1: 100, y1: 112, x2: 100, y2: 28, stroke: '#26180a', 'stroke-width': 3.4,
    'stroke-linecap': 'round' }, needle);
  el('circle', { cx: 100, cy: 100, r: 7, fill: '#8a6b2c', stroke: '#26180a', 'stroke-width': 1.5 }, needle);
}

export function renderGauge(t) {
  const p = sim.pressureAt(t);
  const jit = clamp((p - 25) / 40, 0, 1) * (0.7 * Math.sin(t * 13.1) + 0.4 * Math.sin(t * 7.3));
  needle.setAttribute('transform', `rotate(${(rotFor(p) + jit).toFixed(2)},100,100)`);
}

/* ---------------- flyball governor ---------------- */

let gov = { arms: [], balls: [], angle: 0, lastT: 0 };

export function buildGovernor() {
  const svg = $('governor');
  el('rect', { x: 30, y: 138, width: 60, height: 9, rx: 2, fill: '#3a2c10' }, svg);
  el('rect', { x: 56, y: 42, width: 8, height: 98, rx: 3,
    fill: '#8a6b2c', stroke: '#26180a', 'stroke-width': 1 }, svg);
  el('circle', { cx: 60, cy: 38, r: 6, fill: '#b6934a', stroke: '#26180a', 'stroke-width': 1 }, svg);
  for (let i = 0; i < 2; i++) {
    gov.arms.push(el('line', { x1: 60, y1: 38, x2: 60, y2: 84,
      stroke: '#7a5c26', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, svg));
  }
  for (let i = 0; i < 2; i++) {
    gov.balls.push(el('circle', { cx: 60, cy: 84, r: 7,
      fill: '#a8853d', stroke: '#26180a', 'stroke-width': 1.2 }, svg));
  }
  gov.lastT = now();
}

export function renderGovernor(t) {
  const p = sim.pressureAt(t);
  const rpm = clamp((p - 30) * 2.2, 0, 260);
  const dt = clamp(t - gov.lastT, 0, 0.25);
  gov.lastT = t;
  gov.angle += (rpm / 60) * 2 * Math.PI * dt;
  const lift = rpm / 260;
  const droop = (16 + 60 * lift) * Math.PI / 180;   // from vertical
  const armLen = 48;
  const by = 38 + Math.cos(droop) * armLen;
  const spread = Math.sin(droop) * armLen;
  for (let i = 0; i < 2; i++) {
    const ps = i === 0 ? 1 : -1;
    const x = 60 + spread * Math.sin(gov.angle) * ps;
    const z = Math.cos(gov.angle) * ps;   // -1 back … +1 front
    gov.arms[i].setAttribute('x2', x.toFixed(1));
    gov.arms[i].setAttribute('y2', by.toFixed(1));
    gov.balls[i].setAttribute('cx', x.toFixed(1));
    gov.balls[i].setAttribute('cy', by.toFixed(1));
    gov.balls[i].setAttribute('r', (7 + z * 1.1).toFixed(2));
    gov.balls[i].setAttribute('fill', z > 0 ? '#c9a55a' : '#7a5c26');
  }
}

/* ---------------- annunciator drops ---------------- */

let flags = [];

export function buildAnnunciator() {
  const box = $('annunciator');
  flags = [];
  for (let i = 0; i < 6; i++) {
    const d = document.createElement('div');
    d.className = 'drop';
    d.innerHTML = `<div class="drop-window"><div class="drop-flag"></div></div>
                   <div class="drop-numeral">${ROMANS[i]}</div>`;
    box.appendChild(d);
    flags.push(d.querySelector('.drop-flag'));
  }
}

export function renderFlags(t) {
  const S = sim.refs;
  for (let i = 0; i < 6; i++) {
    let ang = -104;
    if (S.draw && t >= S.draw.cols[i].lockT) {
      const k = (t - S.draw.cols[i].lockT) / 0.5;
      ang = -104 + 104 * easeOutBack(k);
    } else if (!S.draw && i < (S.lastResetLocks || 0)) {
      const k = (t - S.lastResetT) / 0.45;
      if (k < 1) ang = 0 - 104 * easeOutCubic(k);
    }
    flags[i].style.transform = `rotate(${ang.toFixed(1)}deg)`;
  }
}

/* ---------------- card faces ---------------- */

export function renderCardFace(elx, code, certified, name) {
  const holes = [];
  for (let r = 0; r < 8; r++) {
    const v = 8 - r;
    for (let c = 0; c < 6; c++) {
      holes.push(`<i class="${code[c] === v ? 'hole' : ''}"></i>`);
    }
  }
  elx.innerHTML =
    `<span class="card-name">${name || 'UNCERTIFIED COMPOSITION'}</span>` +
    `<span class="card-holes">${holes.join('')}</span>` +
    (certified ? `<span class="chop">V&amp;H</span>` : '');
  elx.classList.toggle('certified', !!certified);
}

/* ---------------- rack ---------------- */

let rackBtns = [];

export function buildRack(onPick) {
  const rack = $('rack');
  rackBtns = [];
  CORRESPONDENTS.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'libcard';
    b.title = `${c.name} — insert this certified card`;
    renderCardFace(b, c.code, true, c.name);
    b.addEventListener('click', () => onPick(i));
    rack.appendChild(b);
    rackBtns.push(b);
  });
}

export function renderRack() {
  const inReader = sim.refs.reader && sim.refs.reader.libIdx != null
    ? sim.refs.reader.libIdx : -1;
  rackBtns.forEach((b, i) => { b.disabled = i === inReader; });
}

/* ---------------- composing punch ---------------- */

let punchUI = { notchBtns: [], cols: [], knob: null, head: null, arrow: null };

export function buildPunch(onNotch) {
  const nbox = $('notches');
  for (let v = 8; v >= 1; v--) {
    const b = document.createElement('button');
    b.className = 'notch';
    b.dataset.v = v;
    b.textContent = v;
    b.title = `Set the punch to ${v}`;
    b.addEventListener('click', () => onNotch(v));
    nbox.appendChild(b);
    punchUI.notchBtns.push(b);
  }
  const card = $('punch-card');
  for (let c = 0; c < 6; c++) {
    const col = document.createElement('div');
    col.className = 'pcol';
    for (let r = 0; r < 8; r++) {
      const pos = document.createElement('div');
      pos.className = 'pos';
      pos.dataset.v = 8 - r;
      col.appendChild(pos);
    }
    card.appendChild(col);
    punchUI.cols.push(col);
  }
  const nums = $('col-numerals');
  ROMANS.forEach(rn => {
    const s = document.createElement('span');
    s.textContent = rn;
    nums.appendChild(s);
  });
  punchUI.knob = $('scale-knob');
  punchUI.head = $('punch-head');
  punchUI.arrow = $('col-arrow');
}

export function renderPunch(t) {
  const P = sim.refs.punch;
  /* knob rides the selected notch */
  const btn = punchUI.notchBtns[8 - P.value];
  if (btn) punchUI.knob.style.top = (btn.offsetTop + btn.parentElement.offsetTop + 3) + 'px';
  punchUI.notchBtns.forEach(b => b.classList.toggle('sel', +b.dataset.v === P.value));
  /* head slam */
  const k = t - P.lastStrikeT;
  let dy = 0;
  if (k >= 0 && k < 0.09) dy = (k / 0.09) * 10;
  else if (k < 0.32) dy = 10 * (1 - (k - 0.09) / 0.23);
  punchUI.head.style.transform = `translateY(${dy.toFixed(1)}px)`;
  /* holes + current column */
  punchUI.cols.forEach((col, c) => {
    col.classList.toggle('cur', c === P.col && !sim.refs.tray);
    const punched = P.code[c];
    col.querySelectorAll('.pos').forEach(pos => {
      pos.classList.toggle('hole', punched != null && +pos.dataset.v === punched);
    });
  });
  const curCol = punchUI.cols[Math.min(P.col, 5)];
  punchUI.arrow.style.left = (curCol.offsetLeft + curCol.offsetWidth / 2) + 'px';
}

/* ---------------- levers ---------------- */

const leverAnims = new Map();   // el -> {from, to, t0}

export function leverAngle(elx, t, targetDeg) {
  let a = leverAnims.get(elx);
  if (!a) { a = { from: targetDeg, to: targetDeg, t0: t - 1 }; leverAnims.set(elx, a); }
  if (a.to !== targetDeg) {
    const cur = a.from + (a.to - a.from) * easeOutCubic((t - a.t0) / 0.22);
    a.from = cur; a.to = targetDeg; a.t0 = t;
  }
  return a.from + (a.to - a.from) * easeOutCubic((t - a.t0) / 0.22);
}

export function renderLever(id, t, thrown) {
  const btn = $(id);
  const arm = btn.querySelector('.lever-arm');
  const ang = leverAngle(btn, t, thrown ? 32 : -32);
  arm.style.transform = `rotate(${ang.toFixed(1)}deg)`;
}

/* momentary levers: throw + spring back, closed-form from throwT */
export function renderMomentary(id, t, throwT) {
  const btn = $(id);
  const arm = btn.querySelector('.lever-arm');
  const k = t - throwT;
  let ang = -32;
  if (k >= 0 && k < 0.2) ang = -32 + 64 * easeOutCubic(k / 0.2);
  else if (k < 0.7) ang = 32 - 64 * easeOutCubic((k - 0.2) / 0.5);
  arm.style.transform = `rotate(${ang.toFixed(1)}deg)`;
}
