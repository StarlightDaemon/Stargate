/* HELIANTH — Wrenfield Commons Conservatory · Lantern Gate
   A solarpunk portal-dialing console. Plain script, no build step, no networking.

   The instrument: a five-light lantern (the glazed cupola of a conservatory dome).
   An address is five cultivars. To graft one: pick it from the seed tray, the heliotropic
   seed-ring slews to bring it under the next light, TAKE grows a tendril from the sill notch
   up into the light and a bloom opens — the graft has taken. Five grafts leave the lantern
   pending. OPEN THE LIGHTS is the only activation: the sashes swing open (buildup), the
   oculus blooms (breakthrough), and the sunwell stays open (active) until CLOSE THE LIGHTS.

   All motion is a closed-form function of wall-clock time; rendering chases the sim. */
(() => {
'use strict';

const VERSION = '1.0.0';
const SVGNS = 'http://www.w3.org/2000/svg';
const $ = (id) => document.getElementById(id);
const now = () => performance.now();
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeInOut = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
const easeOut = (p) => 1 - Math.pow(1 - p, 3);
const rad = (d) => (d * Math.PI) / 180;
// angle convention: degrees clockwise from straight up; x = r·sin a, y = −r·cos a
const px = (r, a) => r * Math.sin(rad(a));
const py = (r, a) => -r * Math.cos(rad(a));

/* ------------------------------------------------------------------ data */
const CULTIVARS = [
  { id: 'helianth', name: 'Helianth' },
  { id: 'crozier',  name: 'Crozier' },
  { id: 'oakleaf',  name: 'Oakleaf' },
  { id: 'dew',      name: 'Dew' },
  { id: 'bee',      name: 'Bee' },
  { id: 'root',     name: 'Root' },
  { id: 'bud',      name: 'Bud' },
  { id: 'trefoil',  name: 'Trefoil' },
  { id: 'wheat',    name: 'Wheat' },
  { id: 'dawn',     name: 'Dawn' },
  { id: 'vine',     name: 'Vine' },
  { id: 'lily',     name: 'Lily' },
  { id: 'mycel',    name: 'Mycel' },
];
const CV_INDEX = Object.fromEntries(CULTIVARS.map((c, i) => [c.id, i]));
const CV_NAME = Object.fromEntries(CULTIVARS.map((c) => [c.id, c.name]));

const ROUTES = [
  { id: 'ashgrove',  name: 'Ashgrove Orchard Commons',   sub: 'pressed 14 Thermidor · rooted', addr: ['oakleaf', 'bee', 'dawn', 'root', 'helianth'], fallow: false, art: 'M8 40c8-14 14-24 20-30M28 10c-6 6-8 12-8 18M28 10c6 2 10 8 10 16M20 28c-8-2-14 2-16 8M20 28c8 0 14 6 14 12' },
  { id: 'saltmarsh', name: 'Saltmarsh Reedworks',        sub: 'pressed 2 Fructidor · rooted',  addr: ['dew', 'wheat', 'vine', 'crozier', 'mycel'], fallow: false, art: 'M10 42V14M18 42V8M26 42V12M34 42V6M42 42V16M6 42h42M18 8c4 0 6 3 6 6M34 6c-4 0-6 3-6 7' },
  { id: 'mossbank',  name: 'Mossbank Library Glasshouse', sub: 'pressed 30 Prairial · rooted',   addr: ['crozier', 'lily', 'trefoil', 'dew', 'bud'], fallow: false, art: 'M6 40h42M10 40V18l17-12 17 12v22M17 40V26h20v14M27 6v8M13 22h28' },
  { id: 'kestrel',   name: 'Kestrel Terrace Apiary',      sub: 'pressed 9 Messidor · rooted',    addr: ['bee', 'helianth', 'trefoil', 'wheat', 'vine'], fallow: false, art: 'M27 8l14 8v16l-14 8-14-8V16zM27 8v32M13 16l28 16M41 16L13 32' },
  { id: 'hollins',   name: 'Hollins Cold Frame',          sub: 'pressed last winter · gone fallow', addr: ['root', 'mycel', 'bud', 'oakleaf', 'dawn'], fallow: true, art: 'M6 40h42M10 40V22h34v18M10 22l8-12h18l8 12M18 30h18M27 10v-4' },
];

const N_LIGHTS = 5;
const N_CV = CULTIVARS.length;            // 13
const LIGHT_STEP = 360 / N_LIGHTS;        // 72°
const CV_STEP = 360 / N_CV;               // 27.69°
const R_OUT = 440, R_SILL = 330, R_OC = 280, R_SEED = 305;
const BLOOM_R = 392;

const PACE = {
  manual:  { slewDegPerSec: 95,  slewMin: 320, tendril: 1100, bloom: 520 },
  nursery: { slewDegPerSec: 300, slewMin: 140, tendril: 420,  bloom: 260 },
};
const BUILDUP_MS = 2600;
const BREAK_MS = 750;
const CLOSE_MS = 1200;

/* ------------------------------------------------------------------ state */
const S = {
  phase: 'idle',           // idle | dialing | pending | buildup | breakthrough | active | closing
  phaseT0: 0,
  grafts: [],              // cultivar ids, in light order
  sel: null,               // selected cultivar id (target of the seed-ring)
  queuedSel: null,         // chosen while a graft was in progress
  ringAngle: 0,
  slew: null,              // {from,to,t0,dur}
  graft: null,             // {light, cv, t0, pace}
  graftQueued: false,
  frost: false,
  auto: null,              // {route, idx}
  routeName: null,
  fallow: false,
  sound: false,
  fitK: 1,
  counters: { takes: 0, opens: 0, closes: 0, blocked: 0, breakthroughs: 0 },
  telemetry: { light: 58, cistern: 0.66, aloft: 412, hives: 3, sap: 0.31 },
  log: [],
};

/* ------------------------------------------------------------------ dom */
const el = {
  stage: $('stage'), glazing: $('glazing'), lanternSvg: $('lanternSvg'),
  frame: $('lanternFrame'), lights: $('lights'), seedRing: $('seedRing'), notches: $('notches'),
  tendrils: $('tendrils'), blooms: $('blooms'), oculusInk: $('oculusInk'), frostInk: $('frostInk'),
  indexMark: $('indexMark'), oculus: $('oculus'), lanternWord: $('lanternWord'),
  tags: $('tags'), ledgerSvg: $('ledgerSvg'), ledgerList: $('ledgerList'), pressings: $('pressings'),
  daybook: $('daybookList'), trayRow: $('trayRow'), benchCard: $('benchCard'),
  btnGraft: $('btnGraft'), btnOpen: $('btnOpen'), btnClose: $('btnClose'), btnFrost: $('btnFrost'),
  frostState: $('frostState'), btnSound: $('btnSound'), soundWord: $('soundWord'),
  frostVeil: $('frostVeil'), flash: $('flash'),
};
const ctx = el.oculus.getContext('2d');

function svg(tag, attrs, parent) {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
function useGlyph(id, size, parent, cls) {
  const u = svg('use', { x: -size / 2, y: -size / 2, width: size, height: size }, parent);
  u.setAttribute('href', '#cv-' + id);
  u.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#cv-' + id);
  if (cls) u.setAttribute('class', cls);
  return u;
}
function sectorPath(r1, r2, halfDeg) {
  const a0 = -halfDeg, a1 = halfDeg;
  return `M${px(r1, a0).toFixed(1)},${py(r1, a0).toFixed(1)} A${r1},${r1} 0 0 1 ${px(r1, a1).toFixed(1)},${py(r1, a1).toFixed(1)} L${px(r2, a1).toFixed(1)},${py(r2, a1).toFixed(1)} A${r2},${r2} 0 0 0 ${px(r2, a0).toFixed(1)},${py(r2, a0).toFixed(1)} Z`;
}

/* ------------------------------------------------------------------ build: glazing backdrop */
function buildGlazing() {
  const g = el.glazing;
  // vertical glazing bars + purlins: the conservatory wall behind everything
  for (let x = 60; x <= 1860; x += 120) svg('line', { x1: x, y1: 0, x2: x, y2: 896, class: 'rib-fine' }, g);
  for (const y of [150, 330, 510, 690]) svg('line', { x1: 0, y1: y, x2: 1920, y2: y, class: 'rib-fine' }, g);
  // the arched roof ribs
  svg('path', { d: 'M-120,520 C380,60 1540,60 2040,520', class: 'rib' }, g);
  svg('path', { d: 'M-120,600 C380,140 1540,140 2040,600', class: 'rib-fine' }, g);
  svg('path', { d: 'M-120,680 C380,220 1540,220 2040,680', class: 'rib-fine' }, g);
  // trained vines: left edge and the gap between lantern and ledger
  const vineL = 'M28,890 C60,820 10,760 40,700 S70,600 30,540 S10,440 44,390 S70,300 34,240 S18,150 52,100';
  const vineM = 'M985,890 C1010,830 960,780 992,720 S1020,620 978,570 S955,470 996,420 S1018,320 976,270 S960,190 1000,150';
  for (const d of [vineL, vineM]) {
    svg('path', { d, class: 'tendril-halo' }, g);
    svg('path', { d, class: 'tendril' }, g);
  }
  // leaves along the vines (schematic, stroke only)
  const leaves = [
    [40, 700, 20], [30, 540, -160], [44, 390, 30], [34, 240, -150], [52, 100, 25],
    [992, 720, -30], [978, 570, 150], [996, 420, -25], [976, 270, 160], [1000, 150, -30],
  ];
  for (const [x, y, a] of leaves) {
    svg('path', { d: 'M0,0 c-14,-4 -26,-18 -22,-34 c16,2 26,16 22,34z M0,0 l-16,-24', class: 'tendril-leaf', transform: `translate(${x},${y}) rotate(${a})` }, g);
  }
  // hang-lines from the notice tags to the lantern rim
  const cx = 490, cy = 460, rr = R_OUT * 0.86;
  const tl = svg('g', { class: 'taglines' }, g);
  for (const t of TAGS) {
    const tx = t.x + 95, ty = t.y + 30;
    const dx = cx - tx, dy = cy - ty, d = Math.hypot(dx, dy);
    const ex = cx - (dx / d) * rr, ey = cy - (dy / d) * rr;
    svg('line', { x1: tx, y1: ty, x2: ex.toFixed(1), y2: ey.toFixed(1) }, tl);
    svg('circle', { cx: ex.toFixed(1), cy: ey.toFixed(1), r: 3 }, tl);
  }
}

/* ------------------------------------------------------------------ build: the lantern */
function buildLantern() {
  const f = el.frame;
  svg('circle', { r: 452, class: 'rim-fine' }, f);
  svg('circle', { r: R_OUT, class: 'rim' }, f);
  svg('circle', { r: R_SILL, class: 'rim' }, f);
  svg('circle', { r: R_OC, class: 'rim' }, f);
  svg('circle', { r: 270, class: 'rim-fine' }, f);
  for (let i = 0; i < N_LIGHTS; i++) {
    const a = i * LIGHT_STEP + LIGHT_STEP / 2; // ribs sit between the lights
    svg('line', { x1: px(R_OC, a), y1: py(R_OC, a), x2: px(468, a), y2: py(468, a), class: 'rib' }, f);
    // rib-foot whiplash ornament at the sill, and a finial at the crown
    const orn = svg('g', { transform: `rotate(${a})`, class: 'orn' }, f);
    svg('path', { d: 'M0,-332 c-10,-16 -34,-10 -30,-32 c3,-14 20,-16 26,-6 M0,-332 c10,-16 34,-10 30,-32 c-3,-14 -20,-16 -26,-6' }, orn);
    svg('path', { d: 'M0,-468 c-8,-10 -6,-22 0,-28 c6,6 8,18 0,28z M-12,-458 c-8,-6 -14,-16 -12,-24 c8,2 14,10 12,24z M12,-458 c8,-6 14,-16 12,-24 c-8,2 -14,10 -12,24z' }, orn);
  }
  // lights
  for (let i = 0; i < N_LIGHTS; i++) {
    const g = svg('g', { class: 'light', 'data-i': i, transform: `rotate(${i * LIGHT_STEP})` }, el.lights);
    svg('path', { class: 'openGlow', d: sectorPath(338, 432, 33) }, g);
    const sash = svg('g', { class: 'sash' }, g);
    svg('path', { class: 'pane', d: sectorPath(338, 432, 33) }, sash);
    svg('path', { class: 'pane-orn', d: 'M-170,-346 C-140,-410 -80,-426 -30,-372 M170,-346 C140,-410 80,-426 30,-372 M-30,-372 c-4,-10 -16,-12 -20,-4 M30,-372 c4,-10 16,-12 20,-4 M-150,-424 c10,8 26,10 40,2 M150,-424 c-10,8 -26,10 -40,2' }, sash);
    const seal = svg('g', { class: 'seal', transform: `translate(120,-386) rotate(${-i * LIGHT_STEP})` }, g);
    svg('circle', { r: 27, class: 'seal-ring' }, seal);
    const u = useGlyph('helianth', 38, seal, 'glyph');
    u.dataset.role = 'sealGlyph';
  }
  // seed ring
  const sr = el.seedRing;
  svg('circle', { r: 325, class: 'sr-rim' }, sr);
  svg('circle', { r: 286, class: 'sr-rim' }, sr);
  for (let k = 0; k < N_CV; k++) {
    const a = k * CV_STEP;
    svg('line', { x1: px(286, a), y1: py(286, a), x2: px(292, a), y2: py(292, a), class: 'tick' }, sr);
    svg('line', { x1: px(319, a), y1: py(319, a), x2: px(325, a), y2: py(325, a), class: 'tick' }, sr);
    const g = svg('g', { transform: `rotate(${a}) translate(0,${-R_SEED})`, class: 'cv', 'data-cv': CULTIVARS[k].id }, sr);
    useGlyph(CULTIVARS[k].id, 38, g);
  }
  // notches
  for (let i = 0; i < N_LIGHTS; i++) {
    svg('path', { d: 'M-11,-321 L0,-335 L11,-321', transform: `rotate(${i * LIGHT_STEP})`, 'data-i': i }, el.notches);
  }
  // oculus ink: hour ticks + sun-path arc
  const oi = el.oculusInk;
  for (let h = 0; h < 24; h++) {
    const a = h * 15, r1 = h % 6 === 0 ? 246 : 254;
    svg('line', { x1: px(r1, a), y1: py(r1, a), x2: px(262, a), y2: py(262, a) }, oi);
  }
  svg('path', { d: `M${px(200, -105)},${py(200, -105)} A200,200 0 0 1 ${px(200, 105)},${py(200, 105)}`, class: 'sun-arc' }, oi);
  svg('path', { d: 'M0,-150 c-14,-20 -14,-46 0,-52 c14,6 14,32 0,52z M0,-150 c-8,10 -8,24 0,30 c8,-6 8,-20 0,-30z', class: 'sun-arc' }, oi); // a small analemma
  // index mark at the crown of light 0
  svg('path', { d: 'M0,-482 l9,16 h-18z' }, el.indexMark);
  // frost crackle (hidden until the shutter is drawn)
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let n = 0; n < 16; n++) {
    let a = rnd() * 360, r = 452;
    let d = `M${px(r, a).toFixed(1)},${py(r, a).toFixed(1)}`;
    for (let s = 0; s < 6; s++) {
      r -= 22 + rnd() * 26; a += (rnd() - 0.5) * 14;
      d += ` L${px(r, a).toFixed(1)},${py(r, a).toFixed(1)}`;
      if (rnd() < 0.5) { const b = a + (rnd() - 0.5) * 40; d += ` M${px(r, a).toFixed(1)},${py(r, a).toFixed(1)} L${px(r - 18, b).toFixed(1)},${py(r - 18, b).toFixed(1)} M${px(r, a).toFixed(1)},${py(r, a).toFixed(1)}`; }
    }
    svg('path', { d }, el.frostInk);
  }
}

/* ------------------------------------------------------------------ build: tags, tray, herbarium, ledger */
const TAGS = [
  { id: 'light',   x: 44,  y: 44,  k: 'canopy light',   bar: true },
  { id: 'cistern', x: 706, y: 44,  k: 'rain cistern',   bar: true },
  { id: 'aloft',   x: 44,  y: 796, k: 'pollinators aloft', bar: false },
  { id: 'rota',    x: 706, y: 796, k: 'tending rota',   bar: false },
];
function buildTags() {
  for (const t of TAGS) {
    const d = document.createElement('div');
    d.className = 'tag'; d.id = 'tag-' + t.id;
    d.style.left = t.x + 'px'; d.style.top = t.y + 'px';
    d.innerHTML = `<div class="t-k">${t.k}</div><div class="t-v" data-v></div>${t.bar ? '<div class="t-bar"><i></i></div>' : ''}`;
    el.tags.appendChild(d);
  }
}
function buildTray() {
  for (const c of CULTIVARS) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'seed'; b.dataset.cv = c.id; b.title = c.name;
    b.innerHTML = `<svg viewBox="-20 -20 40 40" aria-hidden="true"><use href="#cv-${c.id}" x="-20" y="-20" width="40" height="40"/></svg><span class="s-name">${c.name}</span>`;
    b.addEventListener('click', () => onSeed(c.id));
    el.trayRow.appendChild(b);
  }
}
function buildHerbarium() {
  for (const r of ROUTES) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pressing' + (r.fallow ? ' fallow' : ''); b.dataset.route = r.id;
    b.innerHTML = `<svg class="p-art" viewBox="0 0 54 48" aria-hidden="true"><path d="${r.art}"/></svg>` +
      `<span><span class="p-name">${r.name}</span><br><span class="p-sub">${r.sub}</span></span>` +
      `<span class="p-addr" aria-label="${r.addr.map((a) => CV_NAME[a]).join(', ')}">${r.addr.map((a) => `<svg viewBox="-20 -20 40 40"><use href="#cv-${a}" x="-20" y="-20" width="40" height="40"/></svg>`).join('')}</span>`;
    b.addEventListener('click', () => onPressing(r.id));
    el.pressings.appendChild(b);
  }
}
const LEDGER_Y = [548, 438, 328, 218, 108];
function buildLedger() {
  const g = el.ledgerSvg;
  const stem = 'M60,606 C40,560 84,556 60,548 C30,520 90,470 60,438 C30,400 90,360 60,328 C30,290 90,250 60,218 C30,180 90,140 60,108 C46,86 60,70 60,56';
  svg('path', { d: stem, class: 'stem-ghost' }, g);
  const halo = svg('path', { d: stem, class: 'stem-halo', id: 'ledgerStemHalo' }, g);
  const live = svg('path', { d: stem, class: 'stem', id: 'ledgerStem' }, g);
  const L = live.getTotalLength();
  live.dataset.len = L;
  for (const pth of [live, halo]) { pth.setAttribute('stroke-dasharray', `${L} ${L}`); pth.setAttribute('stroke-dashoffset', L); }
  for (let i = 0; i < N_LIGHTS; i++) {
    const y = LEDGER_Y[i];
    const side = i % 2 === 0 ? -1 : 1;
    svg('path', { d: `M60,${y} c${side * 12},-6 ${side * 30},-18 ${side * 26},-34 c${-side * 14},4 ${-side * 24},18 ${-side * 26},34z`, class: 'leaf', 'data-i': i }, g);
    svg('circle', { cx: 60, cy: y, r: 34, class: 'node-halo', 'data-i': i }, g);
    svg('circle', { cx: 60, cy: y, r: 24, class: 'node', 'data-i': i }, g);
    const gg = svg('g', { transform: `translate(60,${y})`, 'data-nodeglyph': i }, g);
    useGlyph('helianth', 30, gg, 'node-glyph');
    gg.style.opacity = 0;
    // labels are HTML, not SVG <text>: SVG text inside a CSS-scaled ancestor mis-renders in at least one Chromium build
    const li = document.createElement('li');
    li.className = 'ledgerLabel'; li.style.top = (34 + y - 13) + 'px';
    li.innerHTML = `<span class="ntext" data-nt="${i}">light ${i + 1}</span><span class="ntext-soft" data-ns="${i}">ungrafted</span>`;
    el.ledgerList.appendChild(li);
  }
  const crown = document.createElement('li');
  crown.className = 'ledgerLabel'; crown.style.top = (34 + 60 - 14) + 'px';
  crown.innerHTML = '<span class="ntext-soft">the lantern</span>';
  el.ledgerList.appendChild(crown);
}

/* ------------------------------------------------------------------ audio (all synthesised) */
const A = { ctx: null, master: null, ambient: null, drone: null, active: null, timers: [], count: 0, unlocked: false };
function audioEnsure() {
  if (A.ctx) return A.ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  A.ctx = new AC();
  A.master = A.ctx.createGain(); A.master.gain.value = 0; A.master.connect(A.ctx.destination);
  return A.ctx;
}
function audioSet(on) {
  S.sound = on;
  el.btnSound.classList.toggle('on', on);
  el.btnSound.setAttribute('aria-pressed', on ? 'true' : 'false');
  el.soundWord.textContent = on ? 'sounding' : 'quiet';
  const c = audioEnsure();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  A.master.gain.cancelScheduledValues(c.currentTime);
  A.master.gain.setTargetAtTime(on ? 0.8 : 0, c.currentTime, 0.08);
  if (on && !A.ambient) startAmbient();
}
function noiseBuffer(c, secs = 1.5) {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * secs), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function tone(c, { type = 'sine', f0 = 440, f1 = f0, dur = 0.3, gain = 0.2, attack = 0.01, out = A.master, detune = 0, vib = 0 }) {
  const o = c.createOscillator(); o.type = type; o.detune.value = detune;
  const g = c.createGain();
  const t = c.currentTime;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  if (vib) { const l = c.createOscillator(); const lg = c.createGain(); l.frequency.value = 5.5; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.1); }
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  return o;
}
function noise(c, { dur = 0.1, gain = 0.2, type = 'bandpass', f0 = 1000, f1 = f0, q = 1, out = A.master, attack = 0.005 }) {
  const s = c.createBufferSource(); s.buffer = noiseBuffer(c, Math.max(0.2, dur + 0.1));
  const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
  const t = c.currentTime;
  f.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.1);
}
function sfx(name, arg) {
  A.count++;
  const c = A.ctx; if (!c || !S.sound) return;
  switch (name) {
    case 'tick': // choosing a seed: a small wooden tick
      noise(c, { dur: 0.05, gain: 0.25, f0: 1800, q: 6 }); tone(c, { f0: 660, f1: 520, dur: 0.07, gain: 0.08 }); break;
    case 'slew': { // the seed-ring turning: a soft rustle the length of the slew
      const d = Math.max(0.15, (arg || 400) / 1000);
      noise(c, { dur: d, gain: 0.07, type: 'bandpass', f0: 900, f1: 1400, q: 1.2, attack: 0.05 }); break; }
    case 'snip': // the graft cut
      noise(c, { dur: 0.04, gain: 0.3, type: 'highpass', f0: 2500 }); break;
    case 'take': { // the graft taking: a breathy flute rising, then a drop of water
      const d = Math.max(0.35, (arg || 1100) / 1000);
      tone(c, { type: 'sine', f0: 392, f1: 523, dur: d, gain: 0.16, attack: 0.08, vib: 4 });
      tone(c, { type: 'triangle', f0: 784, f1: 1046, dur: d * 0.8, gain: 0.03, attack: 0.15 });
      noise(c, { dur: d, gain: 0.05, type: 'bandpass', f0: 1500, f1: 2600, q: 2, attack: 0.1 });
      A.timers.push(setTimeout(() => { if (A.ctx && S.sound) { tone(c, { f0: 1760, f1: 1320, dur: 0.28, gain: 0.12 }); tone(c, { f0: 2637, f1: 2200, dur: 0.12, gain: 0.04 }); } }, d * 1000 - 40));
      break; }
    case 'pending': // five taken: a warm four-note rise
      [523, 659, 784, 1046].forEach((f, i) => A.timers.push(setTimeout(() => S.sound && tone(c, { f0: f, dur: 0.5, gain: 0.1, attack: 0.02 }), i * 110)));
      break;
    case 'frost': // the shutter drawing: a cold descending shiver
      tone(c, { f0: 2200, f1: 1500, dur: 0.6, gain: 0.08, vib: 30 }); tone(c, { f0: 2215, f1: 1490, dur: 0.6, gain: 0.08, vib: 30 });
      noise(c, { dur: 0.5, gain: 0.08, type: 'highpass', f0: 4000 }); break;
    case 'thaw': // the shutter drawn back
      tone(c, { f0: 1200, f1: 1800, dur: 0.35, gain: 0.07 }); noise(c, { dur: 0.25, gain: 0.05, f0: 2400, q: 3 }); break;
    case 'blocked':
      tone(c, { f0: 1800, f1: 1400, dur: 0.22, gain: 0.1, vib: 40 }); tone(c, { f0: 1812, f1: 1395, dur: 0.22, gain: 0.1, vib: 40 }); break;
    case 'nudge':
      tone(c, { f0: 440, f1: 400, dur: 0.12, gain: 0.05 }); break;
    case 'buildup': startBuildupAudio(); break;
    case 'breakthrough': breakthroughAudio(); break;
    case 'active': startActiveAudio(); break;
    case 'close': stopActiveAudio(); stopBuildupAudio();
      tone(c, { type: 'sine', f0: 523, f1: 330, dur: 0.9, gain: 0.12, attack: 0.05, vib: 3 });
      noise(c, { dur: 0.9, gain: 0.05, type: 'lowpass', f0: 1800, f1: 400 });
      A.timers.push(setTimeout(() => S.sound && noise(c, { dur: 0.08, gain: 0.3, f0: 320, q: 4 }), 900));
      break;
    case 'fallow':
      stopBuildupAudio();
      tone(c, { type: 'sine', f0: 392, f1: 262, dur: 1.4, gain: 0.1, attack: 0.05, vib: 2 });
      tone(c, { type: 'sine', f0: 466, f1: 311, dur: 1.4, gain: 0.06, attack: 0.05, vib: 2 });
      break;
  }
}
function startAmbient() {
  const c = A.ctx; if (!c) return;
  const g = c.createGain(); g.gain.value = 0.05; g.connect(A.master);
  const s = c.createBufferSource(); s.buffer = noiseBuffer(c, 4); s.loop = true;
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; f.Q.value = 0.6;
  const lfo = c.createOscillator(); lfo.frequency.value = 0.08; const lg = c.createGain(); lg.gain.value = 250; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
  s.connect(f); f.connect(g); s.start();
  A.ambient = { g, s, lfo };
  const bird = () => {
    if (!A.ctx) return;
    if (S.sound && S.phase !== 'buildup') {
      const f0 = 2200 + Math.random() * 1200;
      for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) A.timers.push(setTimeout(() => S.sound && tone(c, { f0, f1: f0 * 1.35, dur: 0.09, gain: 0.02 + (S.phase === 'active' ? 0.03 : 0) }), i * 130));
    }
    A.timers.push(setTimeout(bird, 5000 + Math.random() * 9000));
  };
  A.timers.push(setTimeout(bird, 2500));
  const drip = () => {
    if (!A.ctx) return;
    if (S.sound && (S.phase === 'idle' || S.phase === 'active')) tone(c, { f0: 1900 + Math.random() * 600, f1: 1100, dur: 0.2, gain: 0.03 });
    A.timers.push(setTimeout(drip, 4000 + Math.random() * 6000));
  };
  A.timers.push(setTimeout(drip, 4000));
}
function startBuildupAudio() {
  const c = A.ctx; if (!c || A.drone) return;
  const t = c.currentTime, d = BUILDUP_MS / 1000;
  const out = c.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.5, t + d); out.connect(A.master);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(180, t); lp.frequency.exponentialRampToValueAtTime(2600, t + d); lp.Q.value = 2; lp.connect(out);
  const oscs = [];
  for (const [f, dt, type] of [[98, 0, 'sawtooth'], [98, 9, 'sawtooth'], [147, -6, 'sawtooth'], [220, 0, 'triangle']]) {
    const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = dt; o.connect(lp); o.start(t); oscs.push(o);
  }
  // bee hum: an AM'd triangle that swells late
  const bee = c.createOscillator(); bee.type = 'triangle'; bee.frequency.setValueAtTime(190, t); bee.frequency.linearRampToValueAtTime(260, t + d);
  const am = c.createOscillator(); am.frequency.value = 28; const amg = c.createGain(); amg.gain.value = 0.5; am.connect(amg);
  const beeG = c.createGain(); beeG.gain.setValueAtTime(0.0001, t); beeG.gain.exponentialRampToValueAtTime(0.35, t + d); amg.connect(beeG.gain);
  bee.connect(beeG); beeG.connect(lp); bee.start(t); am.start(t); oscs.push(bee, am);
  // rising wind
  const s = c.createBufferSource(); s.buffer = noiseBuffer(c, 4); s.loop = true;
  const wf = c.createBiquadFilter(); wf.type = 'bandpass'; wf.Q.value = 0.8; wf.frequency.setValueAtTime(300, t); wf.frequency.exponentialRampToValueAtTime(3000, t + d);
  const wg = c.createGain(); wg.gain.setValueAtTime(0.0001, t); wg.gain.exponentialRampToValueAtTime(0.25, t + d);
  s.connect(wf); wf.connect(wg); wg.connect(out); s.start(t);
  A.drone = { out, oscs, s };
}
function stopBuildupAudio(fast) {
  const c = A.ctx; if (!c || !A.drone) return;
  const d = A.drone; A.drone = null;
  const t = c.currentTime;
  d.out.gain.cancelScheduledValues(t); d.out.gain.setValueAtTime(d.out.gain.value, t); d.out.gain.exponentialRampToValueAtTime(0.0001, t + (fast ? 0.08 : 0.6));
  setTimeout(() => { d.oscs.forEach((o) => { try { o.stop(); } catch (e) {} }); try { d.s.stop(); } catch (e) {} }, fast ? 150 : 700);
}
function breakthroughAudio() {
  const c = A.ctx; if (!c) return;
  stopBuildupAudio(true);
  const t = c.currentTime;
  // a bright chord of flute harmonics: C E G D' G'
  [[261.6, 0.22], [329.6, 0.18], [392, 0.18], [587.3, 0.14], [784, 0.12], [1174.7, 0.06]].forEach(([f, g]) => {
    tone(c, { type: 'sine', f0: f, dur: 2.6, gain: g, attack: 0.03, vib: 3 });
    tone(c, { type: 'triangle', f0: f * 2, dur: 1.4, gain: g * 0.25, attack: 0.02 });
  });
  noise(c, { dur: 1.2, gain: 0.35, type: 'highpass', f0: 600, f1: 6000, attack: 0.02 });
  noise(c, { dur: 0.35, gain: 0.5, type: 'bandpass', f0: 1200, q: 0.7, attack: 0.005 });
}
function startActiveAudio() {
  const c = A.ctx; if (!c || A.active) return;
  const t = c.currentTime;
  const out = c.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.3, t + 1.5); out.connect(A.master);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(out);
  const lfo = c.createOscillator(); lfo.frequency.value = 0.15; const lg = c.createGain(); lg.gain.value = 350; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
  const oscs = [lfo];
  for (const [f, dt] of [[130.8, 0], [164.8, 5], [196, -4], [293.7, 3], [392, -3]]) {
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = dt; o.connect(lp); o.start(t); oscs.push(o);
  }
  // a slow shimmer on top: two sines beating
  for (const f of [1046.5, 1049.5]) { const o = c.createOscillator(); o.frequency.value = f; const g = c.createGain(); g.gain.value = 0.05; o.connect(g); g.connect(out); o.start(t); oscs.push(o); }
  A.active = { out, oscs };
}
function stopActiveAudio() {
  const c = A.ctx; if (!c || !A.active) return;
  const a = A.active; A.active = null;
  const t = c.currentTime;
  a.out.gain.cancelScheduledValues(t); a.out.gain.setValueAtTime(a.out.gain.value, t); a.out.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
  setTimeout(() => a.oscs.forEach((o) => { try { o.stop(); } catch (e) {} }), 1100);
}

/* ------------------------------------------------------------------ day-book + bench card */
function clock() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function log(text, cls) {
  S.log.push({ t: clock(), text, cls: cls || '' });
  if (S.log.length > 60) S.log.shift();
  const li = document.createElement('li');
  if (cls) li.className = cls;
  li.innerHTML = `<span class="d-t">${clock()}</span><span>${text}</span>`;
  el.daybook.appendChild(li);
  while (el.daybook.children.length > 7) el.daybook.removeChild(el.daybook.firstChild);
}
function card(text, cls) {
  el.benchCard.textContent = text;
  el.benchCard.className = 'benchCard' + (cls ? ' ' + cls : '');
}
function word(text) {
  if (!text) { el.lanternWord.classList.add('dim'); return; }
  el.lanternWord.textContent = text; el.lanternWord.classList.remove('dim');
}

/* ------------------------------------------------------------------ sim helpers */
function setPhase(p) {
  S.phase = p; S.phaseT0 = now();
  document.body.classList.toggle('active', p === 'active');
  el.lanternSvg.classList.toggle('opening', p === 'buildup');
  el.lanternSvg.classList.toggle('open', p === 'breakthrough' || p === 'active');
  el.lanternSvg.classList.toggle('closing', p === 'closing');
}
function nextLight() { return S.grafts.length; }
function ringAngleNow(t) {
  if (!S.slew) return S.ringAngle;
  const p = clamp((t - S.slew.t0) / S.slew.dur, 0, 1);
  return S.slew.from + (S.slew.to - S.slew.from) * easeInOut(p);
}
function targetAngleFor(cv, light) {
  return light * LIGHT_STEP - CV_INDEX[cv] * CV_STEP;
}
function beginSlew(cv, pace) {
  const t = now();
  const cur = ringAngleNow(t);
  const want = targetAngleFor(cv, nextLight());
  let delta = ((want - cur) % 360 + 540) % 360 - 180; // shortest signed turn
  const P = PACE[pace];
  const dur = Math.max(P.slewMin, (Math.abs(delta) / P.slewDegPerSec) * 1000);
  S.ringAngle = cur;
  S.slew = { from: cur, to: cur + delta, t0: t, dur };
  sfx('slew', dur);
  return dur;
}
function isAligned() {
  return !!S.sel && !S.slew && Math.abs((((S.ringAngle - targetAngleFor(S.sel, nextLight())) % 360) + 540) % 360 - 180) < 0.5;
}
function beginGraft(pace) {
  const light = nextLight();
  const cv = S.sel;
  const t = now();
  S.graft = { light, cv, t0: t, pace, len: 0 };
  S.graftQueued = false;
  // tendril path for this light
  const g = svg('g', { transform: `rotate(${light * LIGHT_STEP})`, 'data-i': light }, el.tendrils);
  const p = svg('path', { d: 'M0,-334 C-8,-348 -26,-350 -24,-366 C-22,-380 8,-374 6,-386 C4,-392 -2,-392 0,-392' }, g);
  const L = p.getTotalLength();
  p.setAttribute('stroke-dasharray', `${L} ${L}`); p.setAttribute('stroke-dashoffset', L);
  S.graft.len = L; S.graft.path = p;
  const l1 = svg('path', { d: 'M-14,-356 c-14,-2 -22,-14 -16,-24 c8,4 14,14 16,24z', class: 'leaf' }, g);
  const l2 = svg('path', { d: 'M8,-378 c14,-2 22,-14 16,-24 c-8,4 -14,14 -16,24z', class: 'leaf' }, g);
  l1.style.opacity = 0; l2.style.opacity = 0;
  S.graft.leaves = [l1, l2];
  // bloom (scaled from 0)
  const b = svg('g', { class: 'bloom', 'data-i': light, transform: `rotate(${light * LIGHT_STEP}) translate(0,${-BLOOM_R})` }, el.blooms);
  const inner = svg('g', { transform: 'scale(0.001)' }, b);
  for (let k = 0; k < 5; k++) svg('path', { d: 'M0,0 C-9,-10 -9,-26 0,-34 C9,-26 9,-10 0,0z', transform: `rotate(${k * 72})` }, inner);
  svg('circle', { r: 5 }, inner);
  S.graft.bloom = inner;
  sfx('snip');
  A.timers.push(setTimeout(() => sfx('take', PACE[pace].tendril), 60));
  card(`grafting ${CV_NAME[cv]} into light ${light + 1}…`);
}
function finishGraft() {
  const g = S.graft; S.graft = null;
  S.grafts.push(g.cv);
  S.counters.takes++;
  // the light takes: seal glyph + pane tint
  const lightEl = el.lights.querySelector(`.light[data-i="${g.light}"]`);
  lightEl.classList.add('taken');
  const u = lightEl.querySelector('[data-role="sealGlyph"]');
  u.setAttribute('href', '#cv-' + g.cv); u.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#cv-' + g.cv);
  // ledger node
  const node = el.ledgerSvg.querySelector(`.node[data-i="${g.light}"]`); node.classList.add('taken');
  el.ledgerSvg.querySelector(`.node-halo[data-i="${g.light}"]`).classList.add('taken');
  const ng = el.ledgerSvg.querySelector(`[data-nodeglyph="${g.light}"]`); ng.style.opacity = 1;
  const nu = ng.querySelector('use'); nu.setAttribute('href', '#cv-' + g.cv); nu.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#cv-' + g.cv);
  el.ledgerList.querySelector(`[data-nt="${g.light}"]`).textContent = `${CV_NAME[g.cv]}`;
  el.ledgerList.querySelector(`[data-ns="${g.light}"]`).textContent = `taken · light ${g.light + 1}`;
  el.ledgerSvg.querySelector(`.leaf[data-i="${g.light}"]`).classList.add('on');
  const stem = $('ledgerStem'); const L = Number(stem.dataset.len);
  const off = (L * (1 - (g.light + 1) / N_LIGHTS)).toFixed(1);
  stem.setAttribute('stroke-dashoffset', off); $('ledgerStemHalo').setAttribute('stroke-dashoffset', off);
  log(`${CV_NAME[g.cv]} grafted into light ${g.light + 1} — the graft has taken.`);
  // selection bookkeeping
  S.sel = null;
  if (S.grafts.length >= N_LIGHTS) {
    setPhase('pending');
    S.auto = null;
    sfx('pending');
    card('five grafts have taken — the lantern is ready. Open the lights when you choose.', 'sun');
    word('the lantern is ready');
    log(`Five grafts hold${S.routeName ? ` (${S.routeName})` : ''}. The lantern waits to be opened.`, 'sun');
    el.pressings.querySelectorAll('.pressing').forEach((b) => b.classList.remove('striking'));
  } else {
    setPhase('dialing');
    card(S.auto ? `graft ${S.grafts.length} of ${N_LIGHTS} holds — the next cutting strikes…` : `graft ${S.grafts.length} of ${N_LIGHTS} holds — choose the next cultivar`);
    if (S.queuedSel && !S.grafts.includes(S.queuedSel)) { const q = S.queuedSel; S.queuedSel = null; selectCultivar(q, 'manual'); }
    else S.queuedSel = null;
  }
  syncUI();
}
function selectCultivar(cv, pace) {
  if (S.grafts.includes(cv)) { card(`${CV_NAME[cv]} is already grafted`, 'warn'); sfx('nudge'); return false; }
  S.sel = cv;
  if (pace === 'manual' && !S.auto) { S.routeName = null; S.fallow = false; }
  const dur = beginSlew(cv, pace);
  sfx('tick');
  card(`the seed-ring turns ${CV_NAME[cv]} toward light ${nextLight() + 1}…`);
  if (S.phase === 'idle') setPhase('dialing');
  syncUI();
  return dur;
}
function resetAll(reason) {
  S.grafts = []; S.sel = null; S.queuedSel = null; S.slew = null; S.graft = null; S.graftQueued = false;
  S.auto = null; S.routeName = null; S.fallow = false;
  el.tendrils.innerHTML = ''; el.blooms.innerHTML = '';
  el.lights.querySelectorAll('.light').forEach((l) => l.classList.remove('taken'));
  el.ledgerSvg.querySelectorAll('.node, .node-halo').forEach((n) => n.classList.remove('taken'));
  el.ledgerSvg.querySelectorAll('[data-nodeglyph]').forEach((n) => { n.style.opacity = 0; });
  el.ledgerSvg.querySelectorAll('.leaf').forEach((n) => n.classList.remove('on'));
  for (let i = 0; i < N_LIGHTS; i++) {
    el.ledgerList.querySelector(`[data-nt="${i}"]`).textContent = `light ${i + 1}`;
    el.ledgerList.querySelector(`[data-ns="${i}"]`).textContent = 'ungrafted';
  }
  const stem = $('ledgerStem'); stem.setAttribute('stroke-dashoffset', stem.dataset.len); $('ledgerStemHalo').setAttribute('stroke-dashoffset', stem.dataset.len);
  el.pressings.querySelectorAll('.pressing').forEach((b) => b.classList.remove('striking'));
  setPhase('idle');
  word('');
  card(reason || 'choose a cultivar from the tray');
  syncUI();
}

/* ------------------------------------------------------------------ handlers */
function onSeed(cv) {
  audioEnsure(); if (!A.unlocked) { A.unlocked = true; audioSet(true); }
  if (S.phase === 'pending' || S.phase === 'buildup' || S.phase === 'breakthrough' || S.phase === 'active' || S.phase === 'closing') { sfx('nudge'); return; }
  if (S.auto) { card('a pressing is striking — close the lights to take over by hand', 'warn'); sfx('nudge'); return; }
  if (S.graft) { // a graft is in progress: queue this choice
    if (S.grafts.includes(cv) || S.graft.cv === cv) { sfx('nudge'); return; }
    S.queuedSel = cv; sfx('tick');
    card(`${CV_NAME[cv]} will follow once this graft takes`);
    syncUI(); return;
  }
  selectCultivar(cv, 'manual');
}
function onGraft() {
  audioEnsure(); if (!A.unlocked) { A.unlocked = true; audioSet(true); }
  if (S.frost) { S.counters.blocked++; sfx('blocked'); card('the Frost Shutter is drawn — nothing can be grafted until it is drawn back', 'cold'); flashFrost(); return; }
  if (S.phase !== 'idle' && S.phase !== 'dialing') { sfx('nudge'); return; }
  if (S.auto) { sfx('nudge'); return; }
  if (!S.sel) { sfx('nudge'); card('choose a cultivar from the seed tray first', 'warn'); return; }
  if (S.graft) { sfx('nudge'); return; }
  if (S.slew) { S.graftQueued = true; card('the graft will take as soon as the ring settles'); syncUI(); return; }
  if (!isAligned()) { sfx('nudge'); return; }
  beginGraft('manual');
  syncUI();
}
function onOpen() {
  audioEnsure(); if (!A.unlocked) { A.unlocked = true; audioSet(true); }
  if (S.frost) { S.counters.blocked++; sfx('blocked'); card('the Frost Shutter is drawn — the lights cannot open', 'cold'); flashFrost(); return; }
  if (S.phase !== 'pending') {
    sfx('nudge');
    card(S.grafts.length < N_LIGHTS ? `${N_LIGHTS - S.grafts.length} more graft${N_LIGHTS - S.grafts.length === 1 ? '' : 's'} must take before the lights can open` : 'the lights are already open', 'warn');
    return;
  }
  S.counters.opens++;
  setPhase('buildup');
  sfx('buildup');
  word('the lights swing open');
  card('the lights swing open — sap rises, the oculus warms…', 'sun');
  log('The five lights swing open. The oculus begins to warm.', 'sun');
  syncUI();
}
function onClose() {
  audioEnsure(); if (!A.unlocked) { A.unlocked = true; audioSet(true); }
  const p = S.phase;
  if (p === 'idle' && !S.sel && !S.slew) { sfx('nudge'); card('the lights are already closed'); return; }
  S.counters.closes++;
  const wasAuto = !!S.auto;
  if (p === 'buildup' || p === 'breakthrough' || p === 'active') {
    sfx('close');
    setPhase('closing');
    word('the lights close');
    card('the lights close; the lantern settles', 'warn');
    log(`The lights close${p === 'active' ? ' — the way is folded shut' : ' before the way opened'}.`, 'warn');
    S.auto = null;
    syncUI();
    return;
  }
  sfx('close');
  log(wasAuto ? 'The pressing is put down; the grafts are cut back.' : 'The grafts are cut back; the seed-ring rests.', 'warn');
  resetAll('the grafts are cut back — choose a cultivar to begin again');
}
function onFrost() {
  audioEnsure(); if (!A.unlocked) { A.unlocked = true; audioSet(true); }
  S.frost = !S.frost;
  document.body.classList.toggle('frost', S.frost);
  el.btnFrost.classList.toggle('engaged', S.frost);
  el.btnFrost.setAttribute('aria-pressed', S.frost ? 'true' : 'false');
  el.frostState.textContent = S.frost ? 'DRAWN' : 'drawn back';
  el.frostVeil.hidden = !S.frost;
  if (S.frost) el.frostInk.removeAttribute('hidden'); else el.frostInk.setAttribute('hidden', ''); // SVG elements have no .hidden property
  if (S.frost) {
    sfx('frost');
    log('The Frost Shutter is drawn across the lantern. Grafting and opening are held.', 'cold');
    card('Frost Shutter drawn — the lantern is held. Draw it back to continue.', 'cold');
    if (S.auto) { S.auto = null; el.pressings.querySelectorAll('.pressing').forEach((b) => b.classList.remove('striking')); log('The pressing stops striking under frost.', 'cold'); }
    if (S.phase === 'buildup' || S.phase === 'breakthrough' || S.phase === 'active') {
      S.counters.closes++;
      sfx('close'); setPhase('closing'); word('the shutter falls');
      log('The shutter falls across the open lights; they close.', 'cold');
    }
    if (S.graftQueued) S.graftQueued = false;
  } else {
    sfx('thaw');
    log('The Frost Shutter is drawn back. The lantern is free again.');
    card(S.phase === 'pending' ? 'shutter drawn back — the lantern is ready to open' : 'shutter drawn back — carry on');
  }
  syncUI();
}
function flashFrost() {
  el.frostVeil.style.animationDuration = '0.4s';
  setTimeout(() => { el.frostVeil.style.animationDuration = ''; }, 900);
}
function onSound() {
  audioEnsure(); A.unlocked = true;
  audioSet(!S.sound);
}
function onPressing(id) {
  audioEnsure(); if (!A.unlocked) { A.unlocked = true; audioSet(true); }
  const r = ROUTES.find((x) => x.id === id);
  if (S.frost) { S.counters.blocked++; sfx('blocked'); card('the Frost Shutter is drawn — nothing strikes under frost', 'cold'); flashFrost(); return; }
  if (S.phase === 'buildup' || S.phase === 'breakthrough' || S.phase === 'active' || S.phase === 'closing') { sfx('nudge'); card('close the lights before striking a pressing', 'warn'); return; }
  if (S.phase === 'pending') { sfx('nudge'); card('the lantern is already ready — open it, or close the lights first', 'warn'); return; }
  if (S.auto) { sfx('nudge'); return; }
  // striking a pressing: clear anything hand-grafted so far, then strike at nursery pace
  if (S.grafts.length || S.sel || S.slew || S.graft) {
    S.grafts = []; S.sel = null; S.queuedSel = null; S.slew = null; S.graft = null; S.graftQueued = false;
    el.tendrils.innerHTML = ''; el.blooms.innerHTML = '';
    el.lights.querySelectorAll('.light').forEach((l) => l.classList.remove('taken'));
    el.ledgerSvg.querySelectorAll('.node, .node-halo').forEach((n) => n.classList.remove('taken'));
    el.ledgerSvg.querySelectorAll('[data-nodeglyph]').forEach((n) => { n.style.opacity = 0; });
    el.ledgerSvg.querySelectorAll('.leaf').forEach((n) => n.classList.remove('on'));
    for (let i = 0; i < N_LIGHTS; i++) { el.ledgerList.querySelector(`[data-nt="${i}"]`).textContent = `light ${i + 1}`; el.ledgerList.querySelector(`[data-ns="${i}"]`).textContent = 'ungrafted'; }
    const stem = $('ledgerStem'); stem.setAttribute('stroke-dashoffset', stem.dataset.len); $('ledgerStemHalo').setAttribute('stroke-dashoffset', stem.dataset.len);
  }
  S.auto = { route: r, idx: 0 };
  S.routeName = r.name; S.fallow = r.fallow;
  el.pressings.querySelectorAll('.pressing').forEach((b) => b.classList.toggle('striking', b.dataset.route === id));
  setPhase('dialing');
  sfx('tick');
  word('a pressing strikes');
  card(`${r.name}: rooted cuttings strike at nursery pace…`, 'sun');
  log(`${r.name} taken from the herbarium; its cuttings strike.`);
  syncUI();
}

/* ------------------------------------------------------------------ tick: advance the sim (closed-form, wall-clock) */
function tick() {
  const t = now();
  // slew settle
  if (S.slew && t >= S.slew.t0 + S.slew.dur) {
    S.ringAngle = S.slew.to; S.slew = null;
    if (S.sel && !S.graft) {
      if (!S.auto) card(`${CV_NAME[S.sel]} sits under light ${nextLight() + 1} — TAKE to graft it`);
      if (S.graftQueued) beginGraft('manual');
    }
    syncUI();
  }
  // graft completion
  if (S.graft) {
    const P = PACE[S.graft.pace];
    if (t >= S.graft.t0 + P.tendril + P.bloom) finishGraft();
  }
  // autodial: the pressing strikes
  if (S.auto && (S.phase === 'dialing') && !S.slew && !S.graft) {
    const { route, idx } = S.auto;
    if (!S.sel) {
      if (idx < N_LIGHTS) { // the next cutting
        selectCultivar(route.addr[idx], 'nursery');
        S.auto.idx = idx + 1;
      }
    } else if (isAligned()) {
      beginGraft('nursery');
    }
  }
  // activation stages
  if (S.phase === 'buildup' && t >= S.phaseT0 + BUILDUP_MS) {
    if (S.fallow) {
      setPhase('closing');
      sfx('fallow');
      word('no light answers');
      card('no light answers from the far lantern — it is shuttered for the season', 'warn');
      log(`${S.routeName}: the far lantern is shuttered for the season. The lights fall closed.`, 'warn');
    } else {
      setPhase('breakthrough');
      S.counters.breakthroughs++;
      sfx('breakthrough');
      el.flash.hidden = false;
      word('');
      card(`the oculus blooms — the way to ${S.routeName || 'the grafted lantern'} stands open`, 'sun');
      log(`Breakthrough: the oculus blooms. The way to ${S.routeName || 'the grafted lantern'} is open.`, 'sun');
    }
    syncUI();
  }
  if (S.phase === 'breakthrough' && t >= S.phaseT0 + BREAK_MS) {
    setPhase('active');
    sfx('active');
    el.flash.hidden = true;
    word('');
    card(`the sunwell holds — close the lights when the crossing is done`, 'sun');
    syncUI();
  }
  if (S.phase === 'closing' && t >= S.phaseT0 + CLOSE_MS) {
    resetAll('the lights are closed — the grafts are cut back; choose a cultivar to begin again');
  }
  // gentle telemetry drift
  tickTelemetry(t);
}

/* ------------------------------------------------------------------ telemetry (communal, not industrial) */
let lastTele = 0;
const ROTA = ['Ines & Tam — afternoon', 'Oriel — dusk watering', 'Saturday seed swap', 'Wren — hive check, dawn'];
function tickTelemetry(t) {
  if (t - lastTele < 900) return;
  lastTele = t;
  const T = S.telemetry;
  const active = S.phase === 'active';
  const s = t / 1000;
  T.light = 52 + 8 * Math.sin(s / 41) + 3 * Math.sin(s / 7.3) + (active ? 26 : 0) + (S.frost ? -18 : 0);
  T.cistern = clamp(T.cistern - 0.00025 + (Math.random() < 0.01 ? 0.03 : 0), 0.2, 0.98);
  T.aloft = Math.round(400 + 40 * Math.sin(s / 23) + 18 * Math.sin(s / 3.1) + (active ? 210 : 0) + (S.frost ? -300 : 0));
  T.sap = 0.31 + 0.02 * Math.sin(s / 17) + (S.phase === 'buildup' ? 0.4 : 0) + (active ? 0.22 : 0);
  const set = (id, v, bar) => {
    const tag = $('tag-' + id); if (!tag) return;
    tag.querySelector('[data-v]').textContent = v;
    if (bar != null) tag.querySelector('.t-bar i').style.width = (clamp(bar, 0, 1) * 100).toFixed(0) + '%';
  };
  set('light', `${T.light.toFixed(0)} klx · sap ${T.sap.toFixed(2)} MPa`, T.light / 100);
  set('cistern', `${(T.cistern * 100).toFixed(0)}% · ${(T.cistern * 4200).toFixed(0)} L`, T.cistern);
  set('aloft', `${Math.max(0, T.aloft)} · ${T.hives} hives`);
  set('rota', ROTA[Math.floor(s / 45) % ROTA.length]);
}

/* ------------------------------------------------------------------ render: DOM chases the sim */
function render() {
  const t = now();
  // seed-ring rotation
  const a = ringAngleNow(t);
  el.seedRing.setAttribute('transform', `rotate(${a.toFixed(3)})`);
  // tendril growth + bloom
  if (S.graft) {
    const P = PACE[S.graft.pace];
    const p = clamp((t - S.graft.t0) / P.tendril, 0, 1);
    S.graft.path.setAttribute('stroke-dashoffset', (S.graft.len * (1 - easeOut(p))).toFixed(2));
    S.graft.leaves[0].style.opacity = p > 0.45 ? 1 : 0;
    S.graft.leaves[1].style.opacity = p > 0.8 ? 1 : 0;
    const q = clamp((t - S.graft.t0 - P.tendril) / P.bloom, 0, 1);
    const s = q <= 0 ? 0.001 : 0.001 + easeOut(q) * (1 + 0.15 * Math.sin(q * Math.PI));
    S.graft.bloom.setAttribute('transform', `scale(${s.toFixed(3)})`);
  }
  // closing: blooms fold, tendrils retract
  if (S.phase === 'closing') {
    const p = clamp((t - S.phaseT0) / CLOSE_MS, 0, 1);
    el.blooms.querySelectorAll('.bloom > g').forEach((g) => g.setAttribute('transform', `scale(${Math.max(0.001, 1 - p).toFixed(3)})`));
    el.tendrils.querySelectorAll('path[stroke-dasharray]').forEach((pth) => { const L = parseFloat(pth.getAttribute('stroke-dasharray')); pth.setAttribute('stroke-dashoffset', (L * p).toFixed(2)); });
  }
  drawOculus(t);
}

/* ------------------------------------------------------------------ the oculus: stateless closed-form canvas */
const MOTES = [];
{ let seed = 31; const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 46; i++) MOTES.push({ x: rnd(), y: rnd(), r: 1 + rnd() * 2.2, w: 0.2 + rnd() * 0.5, ph: rnd() * 6.28, v: 6 + rnd() * 10, amp: 8 + rnd() * 18 }); }
function drawOculus(t) {
  const W = el.oculus.width, H = el.oculus.height, cx = W / 2, cy = H / 2, R = W / 2;
  const s = t / 1000;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.955, 0, Math.PI * 2); ctx.clip();
  const ph = S.phase;
  const e = (t - S.phaseT0) / 1000;
  // base daylight
  let warmth = 0; // 0 idle → 1 full sun
  if (ph === 'buildup') warmth = clamp(e / (BUILDUP_MS / 1000), 0, 1) * 0.85;
  else if (ph === 'breakthrough') warmth = 1;
  else if (ph === 'active') warmth = 0.92 + 0.06 * Math.sin(s * 1.3);
  else if (ph === 'closing') warmth = Math.max(0, 0.9 * (1 - e / (CLOSE_MS / 1000)));
  const base = ctx.createRadialGradient(cx, cy * 0.94, 10, cx, cy, R);
  const mix = (a, b, k) => Math.round(a + (b - a) * k);
  const c0 = `rgb(${mix(251, 255, warmth)},${mix(245, 240, warmth)},${mix(227, 170, warmth)})`;
  const c1 = `rgb(${mix(238, 255, warmth)},${mix(241, 216, warmth)},${mix(220, 110, warmth)})`;
  const c2 = `rgb(${mix(223, 245, warmth)},${mix(232, 178, warmth)},${mix(210, 70, warmth)})`;
  base.addColorStop(0, c0); base.addColorStop(0.65, c1); base.addColorStop(1, c2);
  ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);

  if (ph === 'idle' || ph === 'dialing' || ph === 'pending') {
    // drifting pollen motes — quiet, ambient, never a dial
    ctx.fillStyle = 'rgba(184, 116, 26, 0.55)';
    const glow = S.grafts.length / N_LIGHTS;
    for (const m of MOTES) {
      const y = ((m.y * H - s * m.v) % H + H) % H;
      const x = m.x * W + Math.sin(s * m.w + m.ph) * m.amp;
      ctx.globalAlpha = 0.35 + 0.4 * glow;
      ctx.beginPath(); ctx.arc(x, y, m.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (ph === 'pending') {
      // the ready lantern breathes: a slow warm pulse in the centre
      const k = 0.5 + 0.5 * Math.sin(s * 2.2);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * (0.35 + 0.15 * k));
      g.addColorStop(0, `rgba(255, 222, 130, ${0.25 + 0.3 * k})`); g.addColorStop(1, 'rgba(255, 222, 130, 0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }
  if (ph === 'buildup') {
    const p = clamp(e / (BUILDUP_MS / 1000), 0, 1);
    // ripples travelling inward, tightening as the sap rises
    const spacing = 70 - 42 * p;
    const speed = 40 + 160 * p;
    ctx.lineWidth = 1.5 + 2 * p;
    for (let k = 0; k < 14; k++) {
      const r = R - ((k * spacing + s * speed) % (R + spacing));
      if (r <= 0) continue;
      ctx.strokeStyle = `rgba(184, 116, 26, ${(0.08 + 0.35 * p) * (1 - r / R)})`;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    }
    // the gathering sun
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * (0.15 + 0.6 * p * p));
    g.addColorStop(0, `rgba(255, 246, 200, ${0.4 + 0.6 * p})`); g.addColorStop(0.6, `rgba(255, 210, 100, ${0.3 * p})`); g.addColorStop(1, 'rgba(255, 210, 100, 0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // sap rising up the five rib lines
    ctx.strokeStyle = `rgba(79, 122, 74, ${0.5 * p})`; ctx.lineWidth = 3;
    for (let i = 0; i < N_LIGHTS; i++) {
      const a = rad(i * LIGHT_STEP + LIGHT_STEP / 2);
      const len = R * p;
      ctx.beginPath(); ctx.moveTo(cx + Math.sin(a) * R, cy - Math.cos(a) * R); ctx.lineTo(cx + Math.sin(a) * (R - len), cy - Math.cos(a) * (R - len)); ctx.stroke();
    }
  }
  if (ph === 'breakthrough') {
    const p = clamp(e / (BREAK_MS / 1000), 0, 1);
    // petal burst: ten radial petals opening outward
    ctx.save(); ctx.translate(cx, cy);
    for (let k = 0; k < 10; k++) {
      ctx.save(); ctx.rotate((k * Math.PI * 2) / 10 + p * 0.6);
      const L = R * (0.2 + 0.85 * easeOut(p)), w = R * 0.16 * (1 - 0.4 * p);
      ctx.fillStyle = `rgba(255, 236, 160, ${0.85 * (1 - p * 0.5)})`; ctx.strokeStyle = `rgba(184, 116, 26, ${0.8 * (1 - p)})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-w, -L * 0.35, -w, -L * 0.8, 0, -L); ctx.bezierCurveTo(w, -L * 0.8, w, -L * 0.35, 0, 0); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = `rgba(255, 255, 240, ${1 - p})`; ctx.fillRect(0, 0, W, H);
  }
  if (ph === 'active') {
    // the sunwell: slow caustic shimmer — a rotating conic weave over travelling rings
    const cg = ctx.createConicGradient(s * 0.35, cx, cy);
    for (let i = 0; i <= 24; i++) { const k = i / 24; cg.addColorStop(k, i % 2 ? 'rgba(255, 230, 150, 0.0)' : 'rgba(184, 116, 26, 0.16)'); }
    ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
    const cg2 = ctx.createConicGradient(-s * 0.22, cx, cy);
    for (let i = 0; i <= 14; i++) { const k = i / 14; cg2.addColorStop(k, i % 2 ? 'rgba(143, 207, 126, 0.0)' : 'rgba(143, 207, 126, 0.18)'); }
    ctx.fillStyle = cg2; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 2;
    for (let k = 0; k < 9; k++) {
      const r = ((k * 34 + s * 26) % (R + 34));
      ctx.strokeStyle = `rgba(255, 250, 220, ${0.55 * (1 - r / R)})`;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    }
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.55);
    g.addColorStop(0, 'rgba(255, 252, 230, 0.95)'); g.addColorStop(0.5, 'rgba(255, 232, 150, 0.45)'); g.addColorStop(1, 'rgba(255, 232, 150, 0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // seeds drifting through the way
    ctx.fillStyle = 'rgba(79, 122, 74, 0.7)';
    for (const m of MOTES) {
      const rr = ((m.x * R + s * m.v * 4) % R);
      const aa = m.ph + s * m.w * 0.6;
      ctx.beginPath(); ctx.arc(cx + Math.sin(aa) * rr, cy - Math.cos(aa) * rr, m.r * 0.9, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (S.frost) {
    ctx.fillStyle = 'rgba(200, 228, 244, 0.35)'; ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ UI sync (enabled/disabled, classes) */
function syncUI() {
  const ph = S.phase;
  const dialingPhase = ph === 'idle' || ph === 'dialing';
  el.trayRow.querySelectorAll('.seed').forEach((b) => {
    const cv = b.dataset.cv;
    b.classList.toggle('sel', cv === S.sel || cv === S.queuedSel);
    b.classList.toggle('used', S.grafts.includes(cv));
    b.disabled = !dialingPhase || S.grafts.includes(cv) || !!S.auto;
  });
  el.seedRing.querySelectorAll('.cv').forEach((g) => {
    const cv = g.dataset.cv;
    g.classList.toggle('sel', cv === S.sel);
    g.classList.toggle('used', S.grafts.includes(cv));
  });
  el.notches.querySelectorAll('path').forEach((p) => {
    p.classList.toggle('armed', Number(p.dataset.i) === nextLight() && isAligned());
  });
  const canGraft = dialingPhase && !!S.sel && !S.graft && !S.auto;
  el.btnGraft.disabled = !dialingPhase || !!S.auto;
  el.btnGraft.classList.toggle('armed', canGraft && isAligned() && !S.frost);
  el.btnOpen.classList.toggle('ready', ph === 'pending' && !S.frost);
  el.btnOpen.disabled = ph === 'buildup' || ph === 'breakthrough' || ph === 'active' || ph === 'closing';
  el.btnClose.disabled = false; // disengage is always reachable
  el.pressings.querySelectorAll('.pressing').forEach((b) => { b.disabled = !dialingPhase || !!S.auto; });
}

/* ------------------------------------------------------------------ fit the 1920×1080 stage */
function fit() {
  const w = window.innerWidth, h = window.innerHeight;
  if (!(w > 0 && h > 0)) { setTimeout(fit, 120); return; }
  const k = Math.min(w / 1920, h / 1080);
  S.fitK = k;
  document.documentElement.style.setProperty('--fit', String(k));
}

/* ------------------------------------------------------------------ boot */
function boot() {
  buildTags(); buildGlazing(); buildLantern(); buildTray(); buildHerbarium(); buildLedger();
  el.btnGraft.addEventListener('click', onGraft);
  el.btnOpen.addEventListener('click', onOpen);
  el.btnClose.addEventListener('click', onClose);
  el.btnFrost.addEventListener('click', onFrost);
  el.btnSound.addEventListener('click', onSound);
  window.addEventListener('resize', fit);
  fit();
  setPhase('idle');
  word('');
  log('The lantern rests. Daylight on the sill; the seed-ring at ease.');
  syncUI();
  tickTelemetry(now() - 1000);
  setInterval(tick, 50);
  const frame = () => { render(); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
  render();
}

/* ------------------------------------------------------------------ test API (read-mostly) */
window.__helianth = {
  version: VERSION,
  cultivars: CULTIVARS.map((c) => c.id),
  routes: ROUTES.map((r) => ({ id: r.id, name: r.name, addr: r.addr.slice(), fallow: r.fallow })),
  pace: PACE, timings: { BUILDUP_MS, BREAK_MS, CLOSE_MS },
  state() {
    return {
      phase: S.phase, phaseAge: now() - S.phaseT0, grafts: S.grafts.slice(), sel: S.sel, queuedSel: S.queuedSel,
      ringAngle: ringAngleNow(now()), slewing: !!S.slew, grafting: !!S.graft, graftQueued: S.graftQueued,
      aligned: isAligned(), frost: S.frost, auto: S.auto ? { route: S.auto.route.id, idx: S.auto.idx } : null,
      routeName: S.routeName, fallow: S.fallow, sound: S.sound, sfxCount: A.count, fitK: S.fitK,
      counters: { ...S.counters }, telemetry: { ...S.telemetry }, log: S.log.slice(-8),
      audio: { ctx: !!A.ctx, drone: !!A.drone, active: !!A.active, ambient: !!A.ambient },
    };
  },
  targetAngleFor, render, tick,
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
