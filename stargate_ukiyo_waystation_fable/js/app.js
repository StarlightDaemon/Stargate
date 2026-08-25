/* Kagerō Road Waystation Registry — console logic.
   The dial turns, the blocks stamp, the seal breaks the wave. */

(function () {
'use strict';

const NS = 'http://www.w3.org/2000/svg';
const N_GLYPHS = GLYPHS.length;        // 10 carved travel-glyphs
const ADDR_LEN = 7;                    // seven impressions per passage
const DIAL_C = 440;                    // dial svg center

const S = {
  state: 'idle',      // idle | dialing | pending | buildup | break | active
  locks: [],
  station: null,
  ringAngle: 0,
  rotating: false,
  auto: false,
  autoTimer: null,
  actTimers: [],
  tickTimers: [],
  interlock: false
};

const el = id => document.getElementById(id);
const svgEl = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

/* ============================ the dial ============================ */

function buildDial() {
  const dial = el('dial');

  // glyph symbols, shared by the whole page
  const defs = svgEl('defs');
  GLYPHS.forEach(g => {
    const sym = svgEl('symbol', { id: 'g-' + g.id, viewBox: '0 0 100 100' });
    sym.innerHTML = g.svg;
    defs.appendChild(sym);
  });
  dial.appendChild(defs);

  // the turning wheel: wood annulus, carved ticks, ten cartouches
  const ring = svgEl('g', { id: 'glyph-ring' });
  ring.appendChild(svgEl('circle', {
    cx: DIAL_C, cy: DIAL_C, r: 350,
    fill: '#a97e42', stroke: '#221c16', 'stroke-width': 8
  }));
  for (let i = 0; i < 40; i++) {
    const t = svgEl('line', {
      x1: DIAL_C, y1: 96, x2: DIAL_C, y2: 110,
      stroke: '#7c5a2e', 'stroke-width': 4,
      transform: `rotate(${i * 9} ${DIAL_C} ${DIAL_C})`
    });
    ring.appendChild(t);
  }
  GLYPHS.forEach((g, i) => {
    const holder = svgEl('g', { transform: `rotate(${i * 36} ${DIAL_C} ${DIAL_C})` });
    const c = svgEl('g', { id: 'glyph-' + g.id, 'data-glyph': g.id });
    c.setAttribute('class', 'cartouche');
    c.appendChild(svgEl('rect', {
      class: 'c-bg', x: DIAL_C - 34, y: 94, width: 68, height: 92, rx: 10
    }));
    const gl = svgEl('g', { class: 'c-glyph' });
    gl.appendChild(svgEl('use', { href: '#g-' + g.id, x: DIAL_C - 28, y: 102, width: 56, height: 56 }));
    c.appendChild(gl);
    const nm = svgEl('text', {
      x: DIAL_C, y: 178, 'text-anchor': 'middle',
      'font-size': 15, fill: 'currentColor',
      'text-rendering': 'geometricPrecision'
    });
    nm.textContent = g.name;
    c.appendChild(nm);
    c.appendChild(svgEl('polygon', {
      class: 'c-mark',
      points: `${DIAL_C},58 ${DIAL_C + 13},76 ${DIAL_C},92 ${DIAL_C - 13},76`,
      fill: '#c03a29', stroke: '#221c16', 'stroke-width': 3
    }));
    holder.appendChild(c);
    ring.appendChild(holder);
    c.addEventListener('click', () => selectGlyph(g.id, { auto: false }));
  });
  dial.appendChild(ring);

  // the still aperture over the wheel's mouth
  const ap = svgEl('g', { id: 'aperture' });
  ap.appendChild(svgEl('circle', {
    cx: DIAL_C, cy: DIAL_C, r: 250,
    fill: '#f0e6d2', stroke: '#221c16', 'stroke-width': 7
  }));
  ap.appendChild(buildApIdle());
  ap.appendChild(buildApBuildup());
  ap.appendChild(buildApBreak());
  ap.appendChild(buildApActive());
  dial.appendChild(ap);

  // the pointer notch — where a block comes to rest before it stamps
  const ptr = svgEl('g', { id: 'pointer' });
  ptr.appendChild(svgEl('polygon', {
    points: `${DIAL_C - 24},44 ${DIAL_C + 24},44 ${DIAL_C},92`,
    fill: '#221c16'
  }));
  ptr.appendChild(svgEl('polygon', {
    points: `${DIAL_C},70 ${DIAL_C + 9},82 ${DIAL_C},94 ${DIAL_C - 9},82`,
    fill: '#c03a29'
  }));
  dial.appendChild(ptr);
}

function buildApIdle() {
  const g = svgEl('g', { id: 'ap-idle' });
  g.appendChild(svgEl('circle', {
    class: 'dry-ring', cx: DIAL_C, cy: DIAL_C, r: 176,
    fill: 'none', stroke: '#c9c2b0', 'stroke-width': 6, 'stroke-dasharray': '4 16'
  }));
  g.appendChild(svgEl('circle', {
    cx: DIAL_C, cy: DIAL_C, r: 8, fill: '#c9c2b0'
  }));
  return g;
}

function buildApBuildup() {
  const g = svgEl('g', { id: 'ap-buildup' });
  const pool = svgEl('circle', {
    class: 'ink-pool', cx: DIAL_C, cy: DIAL_C, r: 230, fill: '#1e3350'
  });
  g.appendChild(pool);
  const curls = svgEl('g', { class: 'ink-curls' });
  const curlPath = 'M0 0 q54 -22 74 22 q16 34 -16 50 q-44 22 -60 -12 q-14 -28 2 -60 Z';
  const fills = ['#221c16', '#2b4a6f', '#221c16', '#35597f'];
  for (let k = 0; k < 4; k++) {
    curls.appendChild(svgEl('path', {
      d: curlPath, fill: fills[k],
      transform: `rotate(${k * 90} ${DIAL_C} ${DIAL_C}) translate(${DIAL_C - 30} ${DIAL_C - 140}) rotate(${k * 35})`
    }));
  }
  g.appendChild(curls);
  return g;
}

function buildApBreak() {
  const g = svgEl('g', { id: 'ap-break' });
  g.appendChild(svgEl('circle', { cx: DIAL_C, cy: DIAL_C, r: 236, fill: '#1e3350' }));
  const wave = svgEl('g', { class: 'break-wave' });
  wave.appendChild(svgEl('circle', {
    cx: DIAL_C, cy: DIAL_C, r: 150, fill: '#2b4a6f', stroke: '#f0e6d2', 'stroke-width': 8
  }));
  // eight foam claws cresting inward — the wave breaking open
  for (let k = 0; k < 8; k++) {
    const claw = svgEl('path', {
      d: `M${DIAL_C} 218 Q${DIAL_C + 44} 240 ${DIAL_C + 36} 286 Q${DIAL_C + 30} 316 ${DIAL_C - 2} 320 Q${DIAL_C + 16} 292 ${DIAL_C + 6} 268 Q${DIAL_C - 2} 248 ${DIAL_C} 218 Z`,
      fill: '#f0e6d2', stroke: '#221c16', 'stroke-width': 4,
      transform: `rotate(${k * 45} ${DIAL_C} ${DIAL_C})`
    });
    wave.appendChild(claw);
    wave.appendChild(svgEl('circle', {
      cx: DIAL_C + 52, cy: 268, r: 7, fill: '#f0e6d2',
      transform: `rotate(${k * 45 + 20} ${DIAL_C} ${DIAL_C})`
    }));
  }
  g.appendChild(wave);
  g.appendChild(svgEl('circle', {
    class: 'break-flash', cx: DIAL_C, cy: DIAL_C, r: 240, fill: '#f0e6d2'
  }));
  return g;
}

function buildApActive() {
  const g = svgEl('g', { id: 'ap-active' });
  g.appendChild(svgEl('circle', { cx: DIAL_C, cy: DIAL_C, r: 236, fill: '#2b4a6f' }));
  const spinA = svgEl('g', { class: 'water-spin' });
  [[226, '#f0e6d2', 6, '16 30'], [196, '#1e3350', 24, '90 44'], [118, '#1e3350', 22, '70 46']]
    .forEach(([r, col, w, dash]) => {
      spinA.appendChild(svgEl('circle', {
        cx: DIAL_C, cy: DIAL_C, r, fill: 'none',
        stroke: col, 'stroke-width': w, 'stroke-dasharray': dash,
        'stroke-linecap': 'round'
      }));
    });
  g.appendChild(spinA);
  const spinB = svgEl('g', { class: 'water-spin-b' });
  [[158, '#35597f', 18, '64 52'], [78, '#35597f', 16, '40 44']].forEach(([r, col, w, dash]) => {
    spinB.appendChild(svgEl('circle', {
      cx: DIAL_C, cy: DIAL_C, r, fill: 'none',
      stroke: col, 'stroke-width': w, 'stroke-dasharray': dash,
      'stroke-linecap': 'round'
    }));
  });
  g.appendChild(spinB);
  const foam = svgEl('g', { class: 'foam-bob' });
  [[350, 380], [540, 350], [430, 520], [360, 500], [520, 470]].forEach(([x, y]) => {
    foam.appendChild(svgEl('path', {
      d: `M${x} ${y} q14 -12 28 0 q10 9 -2 14`,
      fill: 'none', stroke: '#f0e6d2', 'stroke-width': 7, 'stroke-linecap': 'round'
    }));
  });
  g.appendChild(foam);
  return g;
}

/* ====================== the destination print ====================== */

const MOUNTAINS = [
  'M18 332 L90 240 L150 300 L225 225 L305 310 L362 270 L362 332 Z',
  'M18 332 L130 190 L190 255 L258 170 L362 320 L362 332 Z',
  'M18 332 L70 285 Q120 240 180 278 L235 305 L362 250 L362 332 Z'
];
const DOT_SPOTS = [[70, 60], [130, 42], [206, 72], [262, 48], [330, 118],
                   [96, 132], [168, 108], [300, 66], [236, 130]];

function buildPrint(st) {
  const p = st.print;
  const print = el('print');
  print.innerHTML = '';
  const mk = (cls, inner) => {
    const g = svgEl('g', { class: 'layer ' + cls });
    g.innerHTML = inner;
    return g;
  };

  // impression 2 — sky block
  print.appendChild(mk('layer-2',
    `<rect x="18" y="18" width="344" height="314" fill="${p.sky}"/>`));

  // impression 3 — water block
  print.appendChild(mk('layer-3',
    `<rect x="18" y="330" width="344" height="172" fill="${p.water}"/>` +
    [368, 410, 452].map((y, i) =>
      `<path d="M${30 + i * 12} ${y} q20 -14 40 0 t40 0 t40 0 t40 0 t40 0 t40 0" ` +
      `fill="none" stroke="#f0e6d2" stroke-width="5" stroke-linecap="round"/>`).join('') +
    `<path d="M64 384 Q92 366 116 384 Q132 396 118 408" fill="none" stroke="#f0e6d2" stroke-width="6" stroke-linecap="round"/>`));

  // impression 4 — earth block
  print.appendChild(mk('layer-4',
    `<path d="${MOUNTAINS[p.mountain]}" fill="${p.land}"/>`));

  // impression 5 — light block: mist, the disk, stars or snow
  let l5 = `<rect x="26" y="196" width="150" height="15" fill="#f0e6d2"/>` +
           `<rect x="120" y="238" width="190" height="13" fill="#f0e6d2"/>`;
  if (p.disk) l5 += `<circle cx="${p.disk.x}" cy="${p.disk.y}" r="${p.disk.r}" fill="${p.disk.fill}"/>`;
  if (p.dots) {
    const spots = p.dots === 'snow' ? DOT_SPOTS.concat([[80, 300], [210, 350], [300, 300], [150, 390]]) : DOT_SPOTS;
    l5 += spots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${p.dots === 'snow' ? 5 : 3.5}" fill="#f0e6d2"/>`).join('');
  }
  print.appendChild(mk('layer-5', l5));

  // impression 6 — accent block (vermillion), deliberately a hair off-register
  print.appendChild(mk('layer-6',
    `<g transform="translate(2.5 2.5)">` +
    `<rect x="24" y="24" width="332" height="472" fill="none" stroke="#c03a29" stroke-width="3"/>` +
    `<g color="#c03a29"><use href="#g-${st.emblem}" x="186" y="176" width="150" height="150" style="stroke:#c03a29"/></g>` +
    `<path d="M40 328 l8 -14 M58 330 l7 -12 M78 329 l8 -14" stroke="#c03a29" stroke-width="4" fill="none" stroke-linecap="round"/>` +
    `</g>`));

  // impression 7 — title cartouche and the printer's seal
  // (stacked per-character: SVG text has no dependable vertical writing-mode)
  const chars = st.name.split('');
  const nameCol = chars.map((ch, i) =>
    `<text x="54" y="${52 + i * 18}" text-anchor="middle" font-size="15" ` +
    `text-rendering="geometricPrecision" font-weight="bold" fill="#221c16">${ch}</text>`).join('');
  print.appendChild(mk('layer-7',
    `<rect x="28" y="26" width="52" height="${chars.length * 18 + 24}" fill="#f0e6d2" stroke="#221c16" stroke-width="5"/>` +
    nameCol +
    `<rect x="314" y="450" width="40" height="40" fill="#c03a29" stroke="#221c16" stroke-width="4"/>` +
    `<path d="M322 462 H346 M334 462 V482 M324 482 H344" stroke="#f0e6d2" stroke-width="4" fill="none"/>`));

  // impression 1 — the sumi key-block, printed first, drawn on top
  const emblemGlyph = GLYPH_BY_ID[st.emblem];
  const key = svgEl('g', { class: 'layer layer-1' });
  key.innerHTML =
    `<rect x="12" y="12" width="356" height="496" fill="none" stroke="#221c16" stroke-width="7"/>` +
    `<path d="M18 332 H362" stroke="#221c16" stroke-width="4" fill="none"/>` +
    `<path d="${MOUNTAINS[p.mountain]}" fill="none" stroke="#221c16" stroke-width="4"/>` +
    (p.disk ? `<circle cx="${p.disk.x}" cy="${p.disk.y}" r="${p.disk.r}" fill="none" stroke="#221c16" stroke-width="4"/>` : '') +
    `<g color="#221c16"><use href="#g-${st.emblem}" x="184" y="174" width="150" height="150"/></g>` +
    `<path d="M64 384 Q92 366 116 384 Q132 396 118 408" fill="none" stroke="#221c16" stroke-width="4" stroke-linecap="round"/>`;
  // key-block glyph strokes
  key.querySelectorAll('use').forEach(u => u.setAttribute('style', 'stroke:#221c16'));
  print.appendChild(key);
}

/* glyph symbols carry no fill/stroke of their own; inside the print, the
   <use> elements supply them by inheritance into the shadow tree */
const printStyle = document.createElement('style');
printStyle.textContent =
  '#print use { fill: none; stroke-width: 8; stroke-linecap: round; stroke-linejoin: round; }';
document.head.appendChild(printStyle);

/* ========================= address track ========================= */

function buildTrack() {
  const track = el('address-track');
  for (let i = 0; i < ADDR_LEN; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.id = 'slot-' + (i + 1);
    slot.innerHTML = `<svg viewBox="0 0 100 100"><use href="#g-nami"/></svg>` +
                     `<span class="slot-n">${i + 1}</span>`;
    track.appendChild(slot);
  }
}

/* ======================= traveler's tokens ======================= */

function buildTokens() {
  const row = el('token-row');
  QUICK_TOKENS.forEach(tk => {
    const st = STATION_BY_ID[tk.station];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'token tier-' + tk.tier;
    b.id = 'token-' + st.id;
    b.setAttribute('aria-label', `Traveler's token — ${st.name}`);
    const label =
      `<text class="t-name" x="46" y="106" text-rendering="geometricPrecision"` +
      (st.name.length > 10 ? ' style="font-size:10.5px"' : '') +
      `>${st.name}</text>`;
    b.innerHTML =
      `<svg viewBox="0 0 92 118">` +
      `<path class="t-body" d="M12 6 H80 Q86 6 86 12 V106 Q86 112 80 112 H12 Q6 112 6 106 V12 Q6 6 12 6 Z"/>` +
      `<circle cx="46" cy="17" r="5" fill="#f0e6d2" stroke="#221c16" stroke-width="4"/>` +
      `<g class="t-glyph"><use href="#g-${st.emblem}" x="24" y="26" width="44" height="44"/></g>` +
      label +
      `</svg>`;
    b.addEventListener('click', () => quickDial(st.id));
    row.appendChild(b);
  });
}

/* ====================== state and status ====================== */

function setState(s) {
  S.state = s;
  document.body.dataset.state = s;
  document.body.dataset.station = S.station ? S.station.id : '';
}

function status(msg) { el('status-text').textContent = msg; }

/* ======================== glyph locking ======================== */

function glyphIndex(gid) { return GLYPHS.findIndex(g => g.id === gid); }

function clearMarks() {
  document.querySelectorAll('.cartouche.marked').forEach(c => c.classList.remove('marked'));
}

function markNext() {
  clearMarks();
  if (S.station && S.locks.length < ADDR_LEN) {
    const next = S.station.address[S.locks.length];
    el('glyph-' + next).classList.add('marked');
  }
}

function selectGlyph(gid, { auto }) {
  if (S.rotating) return;
  if (['pending', 'buildup', 'break', 'active'].includes(S.state)) return;
  if (S.auto && !auto) return;
  if (S.locks.includes(gid)) { Sound.tok(0.06); return; }

  if (S.locks.length > 0) {
    const expected = S.station.address[S.locks.length];
    if (gid !== expected) {
      const c = el('glyph-' + gid);
      c.classList.add('refuse');
      setTimeout(() => c.classList.remove('refuse'), 450);
      Sound.thud(0.22);
      status('The block does not register — follow the warden’s mark.');
      return;
    }
  } else {
    S.station = STATION_BY_EMBLEM[gid];
  }

  // turn the wheel so the chosen block rests under the pointer
  const target = -(glyphIndex(gid) * 36);
  let delta = ((target - S.ringAngle) % 360 + 540) % 360 - 180;
  if (delta === 0 && S.locks.length === 0) delta = 0;
  const dur = auto ? 400 : 720;
  document.documentElement.style.setProperty('--rot-dur', dur + 'ms');
  S.ringAngle = S.ringAngle + delta;
  el('glyph-ring').style.transform = `rotate(${S.ringAngle}deg)`;
  S.rotating = true;
  S.tickTimers.forEach(clearTimeout);
  S.tickTimers = [0.15, 0.5, 0.85].map(f => setTimeout(() => Sound.tok(0.07), dur * f));

  setTimeout(() => { S.rotating = false; stampGlyph(gid, auto); }, dur + 60);
}

function stampGlyph(gid, auto) {
  if (S.state === 'idle' && S.locks.length === 0 && !S.station) return; // released mid-turn
  if (!S.station) return;
  S.locks.push(gid);
  const n = S.locks.length;

  const c = el('glyph-' + gid);
  c.classList.add('locked', 'stamping');
  setTimeout(() => c.classList.remove('stamping'), 320);
  document.body.classList.add('has-locks');

  if (n === 1) buildPrint(S.station);
  const layer = document.querySelector('#print .layer-' + n);
  if (layer) layer.classList.add('stamped');

  const slot = el('slot-' + n);
  slot.querySelector('use').setAttribute('href', '#g-' + gid);
  slot.classList.add('filled');

  Sound.thud(0.45);
  Sound.rustle();

  if (n === ADDR_LEN) {
    clearMarks();
    S.auto = false;
    setState('pending');
    Sound.chime();
    status(`The address is registered — ${S.station.name} awaits the Warden’s Seal.`);
  } else {
    setState('dialing');
    markNext();
    const who = auto ? 'The wardens stamp' : 'You stamp';
    status(`${who} the ${IMPRESSION_NAMES[n - 1]} — impression ${n} of ${ADDR_LEN} toward ${S.station.name}.`);
  }
}

/* ========================= quick dial ========================= */

function quickDial(stationId) {
  if (['buildup', 'break', 'active'].includes(S.state)) {
    Sound.tok(0.06);
    status('The way is already working — draw the Release Cord first.');
    return;
  }
  if (S.auto) return;
  if (S.locks.length > 0) resetDial({ silent: true });

  const st = STATION_BY_ID[stationId];
  S.auto = true;
  S.station = st;
  Sound.rustle(0.4, 0.12);
  status(`The wardens take up the pre-cut blocks for ${st.name}…`);

  const step = i => {
    if (!S.auto) return; // released mid-sequence
    selectGlyph(st.address[i], { auto: true });
    if (i + 1 < ADDR_LEN) {
      S.autoTimer = setTimeout(() => step(i + 1), 700);
    }
  };
  S.autoTimer = setTimeout(() => step(0), 350);
}

/* ==================== activation & release ==================== */

function pressSeal() {
  if (S.interlock) {
    const b = el('seal-btn');
    b.classList.add('refuse');
    setTimeout(() => b.classList.remove('refuse'), 450);
    Sound.refusal();
    status('The Barrier Writ is posted — the pass is closed.');
    return;
  }
  if (S.state !== 'pending') {
    Sound.tok(0.06);
    if (S.state === 'idle' || S.state === 'dialing') {
      status('The seal waits for a full address — seven impressions first.');
    }
    return;
  }
  setState('buildup');
  Sound.thud(0.6);
  Sound.drumRoll(2.0);
  Sound.stopWind();
  status('Ink gathers at the mouth of the way…');
  S.actTimers.push(setTimeout(() => {
    setState('break');
    Sound.crash();
    Sound.bell(150, 0.45, 3.5);
    status('The wave breaks!');
  }, 2050));
  S.actTimers.push(setTimeout(() => {
    setState('active');
    Sound.startWater();
    status(`The way stands open to ${S.station.name}.`);
  }, 2950));
}

function resetDial({ silent }) {
  S.autoTimer && clearTimeout(S.autoTimer);
  S.autoTimer = null;
  S.auto = false;
  S.actTimers.forEach(clearTimeout);
  S.actTimers = [];
  S.locks = [];
  S.station = null;
  clearMarks();
  document.querySelectorAll('.cartouche.locked').forEach(c => c.classList.remove('locked'));
  document.querySelectorAll('.slot.filled').forEach(s => s.classList.remove('filled'));
  document.body.classList.remove('has-locks');
  const print = el('print');
  if (silent) {
    print.innerHTML = '';
  } else {
    print.classList.add('peeling');
    setTimeout(() => { print.innerHTML = ''; print.classList.remove('peeling'); }, 520);
  }
  setState('idle');
}

function pullRelease() {
  const wasActive = S.state === 'active';
  const wasWorking = S.state !== 'idle' || S.locks.length > 0 || S.auto;
  if (!wasWorking) {
    Sound.rustle();
    status('Nothing to furl — the road already sleeps.');
    return;
  }
  Sound.peel();
  if (wasActive || S.state === 'buildup' || S.state === 'break') {
    Sound.stopWater();
    Sound.bell(420, 0.14, 1.6);
  }
  resetDial({ silent: false });
  setState('idle');
  Sound.startWind();
  status('The passage is furled. The road sleeps.');
}

function toggleWrit() {
  S.interlock = !S.interlock;
  const btn = el('writ-btn');
  btn.classList.toggle('engaged', S.interlock);
  btn.setAttribute('aria-pressed', String(S.interlock));
  el('warden-post').classList.toggle('writ-engaged', S.interlock);
  el('writ-state').textContent = S.interlock ? 'PASS CLOSED' : 'pass open';
  el('seal-btn').classList.toggle('blocked', S.interlock);
  if (S.interlock) {
    Sound.thud(0.4);
    status('An unfavorable omen — the Barrier Writ is posted. The Seal will refuse.');
  } else {
    Sound.chime();
    status('The omen passes — the Barrier Writ is lifted. The pass stands open.');
  }
}

/* ===================== operator's reference ===================== */

function buildHelp() {
  const box = el('help-stations');
  STATIONS.forEach(st => {
    const row = document.createElement('div');
    row.className = 'hs-row';
    row.innerHTML = `<b>${st.name}</b><span class="hs-addr">` +
      st.address.map(g => `<svg viewBox="0 0 100 100"><use href="#g-${g}"/></svg>`).join('') +
      `</span>`;
    box.appendChild(row);
  });
  el('help-btn').addEventListener('click', () => {
    el('help-overlay').hidden = false;
    Sound.rustle(0.35, 0.1);
  });
  el('help-close').addEventListener('click', () => {
    el('help-overlay').hidden = true;
    Sound.rustle(0.3, 0.08);
  });
  el('help-overlay').addEventListener('click', e => {
    if (e.target === el('help-overlay')) el('help-overlay').hidden = true;
  });
}

/* ========================= page fitting ========================= */

function fit() {
  const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  document.documentElement.style.setProperty('--s', s);
}

/* ============================ boot ============================ */

buildDial();
buildTrack();
buildTokens();
buildHelp();
fit();
window.addEventListener('resize', fit);

el('seal-btn').addEventListener('click', pressSeal);
el('release-btn').addEventListener('click', pullRelease);
el('writ-btn').addEventListener('click', toggleWrit);

// the road's idle voice begins with the first touch (browser audio policy)
let ambientArmed = false;
document.addEventListener('pointerdown', () => {
  if (ambientArmed) return;
  ambientArmed = true;
  Sound.ensure();
  if (S.state !== 'active') Sound.startWind();
}, { capture: true });

// read-only window for the verification harness
Object.defineProperty(window, '__REGISTRY__', {
  value: {
    get state() { return S.state; },
    get locks() { return S.locks.slice(); },
    get station() { return S.station ? S.station.id : null; },
    get interlock() { return S.interlock; },
    get auto() { return S.auto; },
    get ringAngle() { return S.ringAngle; },
    stations: STATIONS,
    glyphs: GLYPHS
  }
});

})();
