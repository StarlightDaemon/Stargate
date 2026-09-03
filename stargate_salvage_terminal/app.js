/* BONEYARD — Halvard Reach Breakers' Yard · Aperture Bench 3
   Plain script. No modules, no build step, no network. Fictional throughout.

   Mechanism ("dog & rail"): the collar carries 16 stencilled berth marks. To
   seat a mark the read head sweeps to it, the scope settles on its trace, then
   one of six clamping dogs leaves the park bay, travels the outer rail to the
   mark and drops. Six dogs down = pending. Nothing fires until the covered
   BREACH switch is thrown. DROP lifts every dog and sends them home.
   Physics are closed-form functions of wall-clock time; rendering chases them. */
(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const now = () => performance.now();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeIO = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const TEST = /[?&]test\b/.test(location.search);
const VERSION = '1.0.0';

/* ---------------- catalogue ---------------- */
const MARKS = [
  ['HOOK',    'M-6,-16 v20 a8,8 0 0 0 16,0 v-4'],
  ['KEEL',    'M-16,10 L0,-14 L16,10 Z'],
  ['SPAR',    'M-16,0 H16 M-10,-8 V8 M10,-8 V8'],
  ['RIVET',   'M0,-11 a11,11 0 1 0 0.01,0 M-4,0 h8'],
  ['CLEAT',   'M-16,-4 h32 M-8,-4 v12 M8,-4 v12 M-12,8 h24'],
  ['BOLLARD', 'M-8,14 v-20 a8,8 0 0 1 16,0 v20 M-12,14 h24'],
  ['DAVIT',   'M-12,14 v-22 q0,-8 8,-8 h6 M2,-16 v10'],
  ['HAWSE',   'M-14,-6 h28 v12 h-28 z M-6,0 h12'],
  ['BILGE',   'M-16,-6 q8,10 16,0 t16,0 M-16,6 q8,10 16,0 t16,0'],
  ['WINCH',   'M0,-12 a12,12 0 1 0 0.01,0 M0,0 L9,-9 M-14,14 h28'],
  ['FLANGE',  'M-16,-10 h32 v6 h-32 z M-12,-4 v18 M12,-4 v18'],
  ['GUSSET',  'M-14,14 h28 v-28 z M-14,14 L14,-14'],
  ['STRUT',   'M-14,-14 h28 v28 h-28 z M-14,14 L14,-14 M-14,-14 L14,14'],
  ['SHACKLE', 'M-10,6 v-10 a10,10 0 0 1 20,0 v10 M-14,6 h8 M6,6 h8'],
  ['TOGGLE',  'M-16,0 h32 M0,-14 v28 M-8,-14 h16'],
  ['SPLICE',  'M-16,-10 L16,10 M-16,10 L16,-10 M-4,-16 h8 M-4,16 h8'],
];
const N = MARKS.length;
const DEAD = 12;                       // segment 13 on the collar is dead — never seatable
const GHOST = [3, 9];                  // an old route burnt faintly into the collar
const LIVE = MARKS.map((_, i) => i).filter(i => i !== DEAD);
const ADDR_LEN = 6;
const PARK = [104, 113, 122, 131, 140, 149];   // dog bay angles (deg, 0 = right, cw)

// Known routes recorded on cassettes. Playback drives the rail servo from the
// tape's timing track, so it never waits on a read confirmation — faster than a
// hand, never instant.
const CASSETTES = [
  { id: 'c1', label: 'MOTHBALL LINE 4',   note: 'ok — checked 3rd shift',   addr: [0, 5, 9, 14, 3, 7],  dead: false },
  { id: 'c2', label: 'VESTA-2 HULK',      note: 'ok — carrier is thin',     addr: [1, 10, 4, 15, 8, 2], dead: false },
  { id: 'c3', label: 'CANNERY ORBIT',     note: 'ok — smells of fish',      addr: [6, 13, 0, 11, 5, 9], dead: false },
  { id: 'c4', label: "RIGGERS' PLATFORM", note: 'ok — bring gloves',        addr: [3, 14, 7, 1, 10, 6], dead: false },
  { id: 'c5', label: 'OLD DRYDOCK',       note: 'SCRAPPED — no carrier',    addr: [2, 8, 13, 4, 15, 11], dead: true },
];

/* ---------------- geometry ---------------- */
const CX = 300, CY = 300, SEC = 360 / N;
const R = { c1: 218, c2: 258, glyph: 238, rail: 284, dogUp: 284, dogDown: 266, h1: 186, h2: 200, ap: 176 };
const angOf = i => -90 + i * SEC;
const rad = a => a * Math.PI / 180;
const P = (r, a, ox = CX, oy = CY) => [ox + r * Math.cos(rad(a)), oy + r * Math.sin(rad(a))];
const f2 = v => Math.round(v * 100) / 100;
function sectorPath(r1, r2, a0, a1, ox = CX, oy = CY) {
  const [x0, y0] = P(r2, a0, ox, oy), [x1, y1] = P(r2, a1, ox, oy), [x2, y2] = P(r1, a1, ox, oy), [x3, y3] = P(r1, a0, ox, oy);
  const L = (a1 - a0) > 180 ? 1 : 0;
  return `M${f2(x0)} ${f2(y0)} A${r2} ${r2} 0 ${L} 1 ${f2(x1)} ${f2(y1)} L${f2(x2)} ${f2(y2)} A${r1} ${r1} 0 ${L} 0 ${f2(x3)} ${f2(y3)} Z`;
}
function arcPath(r, a0, a1) {
  const [x0, y0] = P(r, a0), [x1, y1] = P(r, a1);
  return `M${f2(x0)} ${f2(y0)} A${r} ${r} 0 ${(a1 - a0) > 180 ? 1 : 0} 1 ${f2(x1)} ${f2(y1)}`;
}
const shortest = (from, to) => ((to - from + 540) % 360) - 180;
const norm = a => ((a % 360) + 360) % 360;

/* ---------------- state ---------------- */
const anim = (from, to, t0, dur, step = 0) => ({ from, to, t0, dur, step });
function val(o, t) {
  if (!o) return 0;
  const p = o.dur <= 0 ? 1 : clamp((t - o.t0) / o.dur, 0, 1);
  let v = o.from + (o.to - o.from) * easeIO(p);
  if (o.step && p < 1) v = o.from + Math.round((v - o.from) / o.step) * o.step;
  return v;
}
const done = (o, t) => !o || t >= o.t0 + o.dur;

const S = {
  state: 'idle',        // idle | seating | pending | buildup | breakthrough | active | collapse | dropping
  sel: 0,               // index into LIVE
  seated: [],           // mark indices, in dog order
  queue: [],            // marks waiting to be seated
  job: null,            // { mark, k, stage, t0, dur, src }
  dogs: PARK.map(a => ({ a: anim(a, a, 0, 0), r: anim(R.dogUp, R.dogUp, 0, 0), clamped: false, mark: -1 })),
  head: { a: anim(-90, -90, 0, 0) },
  lockout: false,
  coverOpen: false,
  muted: false,
  breachLever: false,
  counter: 0,
  reel: 0,
  line: 0.05,
  scope: { read: null },
  playback: null,       // { c, i, nextAt }
  route: null,          // cassette being dialed, or null for a hand address
  loaded: null,
  stageT0: 0,
  dropEnd: 0,
  alarmUntil: 0,
  log: [],
  logDirty: true,
  lastT: now(),
  events: [],           // test-facing timeline: { t, ev }
};
const evt = (ev) => { S.events.push({ t: now(), ev }); if (S.events.length > 400) S.events.shift(); };

/* ---------------- DOM refs ---------------- */
const consoleEl = $('#console');
const ringSvg = $('#ring');
const apCanvas = $('#aperture'), apCtx = apCanvas.getContext('2d', { willReadFrequently: true });
const scopeCanvas = $('#scope'), scCtx = scopeCanvas.getContext('2d');
const els = {};
let sectorEls = [], dogEls = [], headEl = null;

/* ---------------- build ring ---------------- */
function mk(n, attrs, parent) {
  const e = document.createElementNS(NS, n);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  (parent || ringSvg).appendChild(e);
  return e;
}
function buildRing() {
  const defs = mk('defs', {});
  const f = mk('filter', { id: 'glow', x: '-40%', y: '-40%', width: '180%', height: '180%' }, defs);
  mk('feGaussianBlur', { stdDeviation: '3', result: 'b' }, f);
  const m = mk('feMerge', {}, f);
  mk('feMergeNode', { in: 'b' }, m); mk('feMergeNode', { in: 'SourceGraphic' }, m);
  const pat = mk('pattern', { id: 'hatch', width: '8', height: '8', patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  mk('rect', { width: '8', height: '8', fill: '#1a1712' }, pat);
  mk('rect', { width: '3', height: '8', fill: '#4a3320' }, pat);

  mk('circle', { cx: CX, cy: CY, r: R.ap, class: 'ap-disc' });
  mk('circle', { cx: CX, cy: CY, r: R.rail, class: 'rail' });
  mk('path', { d: arcPath(R.rail + 8, 98, 155), class: 'bay' });

  const gS = mk('g', { id: 'sectors' });
  for (let i = 0; i < N; i++) {
    const a = angOf(i);
    const cls = 'sector' + (i === DEAD ? ' dead' : '') + (GHOST.includes(i) ? ' ghost' : '');
    const s = mk('g', { class: cls, 'data-i': i }, gS);
    mk('path', { d: sectorPath(R.c1, R.c2, a - SEC / 2 + 0.9, a + SEC / 2 - 0.9), class: 'seg' }, s);
    const [gx, gy] = P(R.glyph, a);
    mk('path', { d: MARKS[i][1], class: 'glyph', transform: `translate(${f2(gx)} ${f2(gy)})` }, s);
    sectorEls.push(s);
  }
  headEl = mk('g', { id: 'head' });
  mk('path', { d: sectorPath(R.h1, R.h2, -8, 8, 0, 0), class: 'head-arc' }, headEl);
  mk('path', { d: 'M202,-5 L216,0 L202,5 Z', class: 'head-ptr' }, headEl);

  const gD = mk('g', { id: 'dogs' });
  for (let k = 0; k < ADDR_LEN; k++) {
    const d = mk('g', { class: 'dog', 'data-k': k }, gD);
    mk('path', { d: 'M0,-11 h18 v22 h-18 z', class: 'dog-body' }, d);
    mk('path', { d: 'M0,-9 h-13 v5 h13 z M0,4 h-13 v5 h13 z', class: 'dog-prong' }, d);
    mk('rect', { x: 5, y: -3, width: 8, height: 6, class: 'dog-lamp' }, d);
    dogEls.push(d);
  }
}

/* ---------------- build controls ---------------- */
function buildControls() {
  const rot = $('#rotary');
  LIVE.forEach((_, i) => {
    const t = document.createElement('div');
    t.className = 'tick' + (i % 7 === 0 ? ' big' : '');
    t.style.transform = `rotate(${selAngle(i)}deg)`;
    rot.appendChild(t);
  });
  const row = $('#seatedRow');
  for (let k = 0; k < ADDR_LEN; k++) {
    const pip = document.createElement('div');
    pip.className = 'pip';
    pip.innerHTML = '<svg viewBox="-24 -24 48 48"><path d=""/></svg>';
    row.appendChild(pip);
  }
  const rack = $('#cassettes');
  CASSETTES.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'cass' + (c.dead ? ' dead' : '');
    b.id = 'cass-' + c.id;
    b.style.top = (58 + i * 114) + 'px';
    b.style.transform = `rotate(${(i % 2 ? .4 : -.5)}deg)`;
    b.setAttribute('aria-label', 'cassette ' + c.label);
    b.innerHTML = `<div class="cass-lab"><span class="t">${c.label}</span><br><small>${c.note}</small></div>
      <div class="hole l"></div><div class="win"></div><div class="hole r"></div>
      <div class="addr">${c.addr.map(i => MARKS[i][0].slice(0, 3)).join(' · ')}</div>`;
    b.addEventListener('click', () => loadCassette(c));
    rack.appendChild(b);
  });
  const vt = $('#vuTicks');
  for (let i = 0; i <= 10; i++) {
    const a = -100 + i * 20;
    const [x0, y0] = P(80, a, 110, 95), [x1, y1] = P(i % 5 === 0 ? 66 : 72, a, 110, 95);
    mk('line', { x1: f2(x0), y1: f2(y0), x2: f2(x1), y2: f2(y1), class: 'vu-tick' }, vt);
  }
  ['readoutGlyph', 'readoutName', 'readoutSub', 'rotaryPtr', 'seatLever', 'breachLever', 'lockLever', 'spkLever',
   'cover', 'readyLamp', 'lockLamp', 'lampRec', 'lampPlay', 'lampRun', 'counter', 'slotLabel', 'paper', 'vuNeedle',
   'reelL', 'reelR', 'seatedRow'].forEach(id => { els[id] = document.getElementById(id); });
  els.reelLsvg = els.reelL.querySelector('svg');
  els.reelRsvg = els.reelR.querySelector('svg');
}
const selAngle = i => -150 + i * (300 / (LIVE.length - 1));

/* ---------------- audio (screen-native, no chimes) ---------------- */
const AU = { ctx: null };
function audioInit() {
  if (AU.ctx) return;
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return;
  const ctx = new C();
  AU.ctx = ctx;
  AU.master = ctx.createGain(); AU.master.gain.value = S.muted ? 0 : 0.55; AU.master.connect(ctx.destination);
  // mains hum: 50 Hz saw + 100 Hz, lowpassed
  AU.humGain = ctx.createGain(); AU.humGain.gain.value = 0;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
  AU.humGain.connect(lp); lp.connect(AU.master);
  [50, 100, 150].forEach((f, i) => {
    const o = ctx.createOscillator(); o.type = i ? 'sine' : 'sawtooth'; o.frequency.value = f;
    const g = ctx.createGain(); g.gain.value = i ? 0.35 : 1; o.connect(g); g.connect(AU.humGain); o.start();
  });
  // static bed
  const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  AU.noiseBuf = buf;
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.6;
  AU.staticGain = ctx.createGain(); AU.staticGain.gain.value = 0;
  src.connect(bp); bp.connect(AU.staticGain); AU.staticGain.connect(AU.master); src.start();
  // servo whine (rail motor)
  AU.servo = ctx.createOscillator(); AU.servo.type = 'triangle'; AU.servo.frequency.value = 140;
  AU.servoGain = ctx.createGain(); AU.servoGain.gain.value = 0;
  AU.servo.connect(AU.servoGain); AU.servoGain.connect(AU.master); AU.servo.start();
}
function burst(dur, type, freq, gain, q) {
  if (!AU.ctx) return;
  const ctx = AU.ctx, src = ctx.createBufferSource(); src.buffer = AU.noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
  const g = ctx.createGain(); g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  src.connect(f); f.connect(g); g.connect(AU.master); src.start(); src.stop(ctx.currentTime + dur + 0.02);
}
function tone(type, f0, f1, dur, gain) {
  if (!AU.ctx) return;
  const ctx = AU.ctx, o = ctx.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f0, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), ctx.currentTime + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(gain, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(g); g.connect(AU.master); o.start(); o.stop(ctx.currentTime + dur + 0.02);
}
const clack = () => burst(0.04, 'highpass', 2200, 0.35);
const clunk = () => { burst(0.13, 'lowpass', 260, 0.7); tone('sine', 80, 40, 0.22, 0.5); };
const thump = () => { tone('sine', 110, 28, 0.7, 1.0); burst(0.5, 'lowpass', 500, 0.9); };
function buzz() {
  if (!AU.ctx) return;
  const ctx = AU.ctx, o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 108;
  const g = ctx.createGain(); g.gain.value = 0;
  for (let i = 0; i < 4; i++) { g.gain.setValueAtTime(0.22, ctx.currentTime + i * 0.09); g.gain.setValueAtTime(0.0, ctx.currentTime + i * 0.09 + 0.06); }
  o.connect(g); g.connect(AU.master); o.start(); o.stop(ctx.currentTime + 0.4);
}
function setHum(v, ramp = 0.3) { if (AU.ctx) AU.humGain.gain.linearRampToValueAtTime(v, AU.ctx.currentTime + ramp); }
function setStatic(v, ramp = 0.3) { if (AU.ctx) AU.staticGain.gain.linearRampToValueAtTime(v, AU.ctx.currentTime + ramp); }
function setServo(v, f) { if (AU.ctx) { AU.servoGain.gain.linearRampToValueAtTime(v, AU.ctx.currentTime + 0.05); if (f) AU.servo.frequency.linearRampToValueAtTime(f, AU.ctx.currentTime + 0.05); } }

/* ---------------- log ---------------- */
function log(txt) {
  const n = String(Math.floor(S.counter) % 10000).padStart(4, '0');
  // the ribbon is going: an occasional dropped character
  const t = txt.replace(/[A-Z]/g, ch => (Math.random() < 0.012 ? '▒' : ch));
  S.log.push({ n, txt: t, raw: txt });
  if (S.log.length > 15) S.log.shift();
  S.logDirty = true;
}
function refuse(msg) { buzz(); log(msg); evt('refuse:' + msg); }
function alarm(msg) { S.alarmUntil = now() + 1400; refuse(msg); }

/* ---------------- core loop: seat / breach / drop ---------------- */
const busyStates = ['buildup', 'breakthrough', 'active', 'collapse', 'dropping'];

function requestSeat(mark, src) {
  const name = MARKS[mark][0];
  if (S.lockout) { alarm('LOCKOUT ENGAGED — SEAT REFUSED'); return false; }
  if (busyStates.includes(S.state)) { refuse('COLLAR BUSY — DROP FIRST'); return false; }
  if (mark === DEAD) { refuse('SEG 13 IS DEAD — NOT SEATABLE'); return false; }
  if (S.seated.includes(mark) || S.queue.includes(mark) || (S.job && S.job.mark === mark)) { refuse(`${name} ALREADY SEATED`); return false; }
  const inflight = S.seated.length + S.queue.length + (S.job ? 1 : 0);
  if (inflight >= ADDR_LEN) { refuse('ALL SIX DOGS DOWN — BREACH OR DROP'); return false; }
  S.queue.push(mark);
  S.state = 'seating';
  log(`SEAT ${name} → DOG ${inflight + 1}${src === 'tape' ? ' (TAPE)' : ''}`);
  evt('seat-request:' + name);
  if (!S.job) startJob();
  return true;
}
function startJob() {
  const mark = S.queue.shift();
  if (mark === undefined) return;
  const t = now();
  const k = S.seated.length;
  const src = S.playback ? 'tape' : 'hand';
  const target = angOf(mark);
  const hc = val(S.head.a, t), hd = shortest(hc, target);
  const dur = src === 'tape' ? 100 : Math.max(180, Math.abs(hd) / 0.45);
  S.head.a = anim(hc, hc + hd, t, dur);
  S.job = { mark, k, stage: 'head', t0: t, dur, src };
  clack();
  evt('job:head:' + MARKS[mark][0]);
}
function advanceJob(t) {
  const j = S.job; if (!j) return;
  if (t < j.t0 + j.dur) return;
  const fast = j.src === 'tape';
  const d = S.dogs[j.k];
  if (j.stage === 'head') {
    j.stage = 'read'; j.t0 = t; j.dur = fast ? 120 : 380;
    S.scope.read = { t0: t, dur: j.dur, mark: j.mark };
    clack(); evt('job:read');
  } else if (j.stage === 'read') {
    j.stage = 'travel'; j.t0 = t;
    const cur = val(d.a, t), target = angOf(j.mark), dd = shortest(cur, target);
    j.dur = Math.max(160, Math.abs(dd) / (fast ? 0.6 : 0.13));
    d.a = anim(cur, cur + dd, t, j.dur, fast ? 0.75 : 1.5);
    setServo(0.09, fast ? 220 : 150); evt('job:travel');
  } else if (j.stage === 'travel') {
    j.stage = 'clamp'; j.t0 = t; j.dur = fast ? 120 : 260;
    d.r = anim(R.dogUp, R.dogDown, t, j.dur);
    setServo(0, 140); evt('job:clamp');
  } else if (j.stage === 'clamp') {
    d.clamped = true; d.mark = j.mark;
    S.seated.push(j.mark);
    const se = sectorEls[j.mark];
    se.classList.add('lit', 'fresh');
    setTimeout(() => se.classList.remove('fresh'), 600);
    clunk();
    log(`DOG ${j.k + 1} DOWN ON ${MARKS[j.mark][0]}  [${S.seated.length}/${ADDR_LEN}]`);
    evt('seated:' + MARKS[j.mark][0]);
    S.job = null;
    if (S.seated.length >= ADDR_LEN) {
      S.state = 'pending';
      S.queue = [];
      if (S.playback) S.playback = null;
      log('ALL SIX DOGS DOWN — READY. LIFT COVER, THROW BREACH.');
      evt('pending');
    } else {
      S.state = 'seating';
      if (S.queue.length) startJob();
      else if (S.playback) S.playback.nextAt = t + 120;
    }
  }
}

function breach() {
  if (S.lockout) { alarm('LOCKOUT ENGAGED — BREACH REFUSED'); return; }
  if (S.state !== 'pending') {
    if (busyStates.includes(S.state)) { refuse('BREACH ALREADY THROWN'); return; }
    refuse(`NOT SEATED — ${S.seated.length}/${ADDR_LEN} DOGS DOWN`);
    return;
  }
  S.state = 'buildup'; S.stageT0 = now(); S.breachLever = true;
  clunk(); setHum(0.35, 2.4); setStatic(0.12, 2.4);
  log('BREACH THROWN — WINDING UP');
  evt('buildup');
}
function drop(auto) {
  const t = now();
  const clear = S.state === 'idle' && !S.seated.length && !S.job && !S.queue.length && !S.playback;
  clack();
  if (clear) { log('DROP — COLLAR ALREADY CLEAR'); evt('drop:clear'); return; }
  const wasHot = ['buildup', 'breakthrough', 'active', 'collapse'].includes(S.state);
  S.job = null; S.queue = []; S.playback = null; S.route = null; S.loaded = null; S.scope.read = null;
  let maxDur = 300;
  S.dogs.forEach((d, k) => {
    const cur = val(d.a, t), dd = shortest(cur, PARK[k]);
    const dur = Math.max(260, Math.abs(dd) / 0.25);
    d.a = anim(cur, cur + dd, t, dur); d.r = anim(val(d.r, t), R.dogUp, t, 200);
    d.clamped = false; d.mark = -1;
    maxDur = Math.max(maxDur, dur);
  });
  const hc = val(S.head.a, t), hd = shortest(hc, -90);
  S.head.a = anim(hc, hc + hd, t, Math.max(200, Math.abs(hd) / 0.45));
  sectorEls.forEach(s => s.classList.remove('lit', 'fresh', 'pulse', 'aim'));
  S.seated = [];
  S.state = 'dropping'; S.dropEnd = t + maxDur; S.breachLever = false;
  setHum(0, 0.5); setServo(0.06, 120);
  if (wasHot) { burst(0.6, 'bandpass', 1200, 0.6, 0.5); setStatic(0, 0.6); }
  log(auto ? 'AUTO-DROP — DOGS UP' : 'DROP — DOGS UP, HEAD HOME');
  evt('drop');
}
function loadCassette(c) {
  if (S.lockout) { alarm('LOCKOUT ENGAGED — TAPE REFUSED'); return; }
  if (S.state !== 'idle' || S.seated.length || S.job || S.queue.length) { refuse('COLLAR NOT CLEAR — DROP FIRST'); return; }
  S.playback = { c, i: 0, nextAt: now() + 520 };
  S.route = c; S.loaded = c;
  clack();
  log(`TAPE IN: ${c.label} — PLAYBACK AT DECK SPEED`);
  evt('tape:' + c.id);
}
function setLockout(on) {
  S.lockout = on; clack();
  log(on ? 'YARD LOCKOUT ENGAGED' : 'YARD LOCKOUT RELEASED');
  evt('lockout:' + on);
  if (on && (S.queue.length || S.playback)) {
    S.queue = []; S.playback = null; S.route = null;
    alarm('LOCKOUT — SEQUENCE HALTED');
  }
}
function stepSel(d) {
  S.sel = (S.sel + d + LIVE.length) % LIVE.length;
  clack(); syncReadout();
}
function seatSelected() {
  els.seatLever.classList.add('flick');
  setTimeout(() => els.seatLever.classList.remove('flick'), 180);
  requestSeat(LIVE[S.sel], 'hand');
}

/* ---------------- sim ---------------- */
function sim(t) {
  const dt = Math.min(200, t - S.lastT); S.lastT = t;
  advanceJob(t);
  if (S.playback && !S.job && t >= S.playback.nextAt) {
    const pb = S.playback;
    if (pb.i < pb.c.addr.length) {
      const ok = requestSeat(pb.c.addr[pb.i], 'tape');
      pb.i++;
      pb.nextAt = Infinity;      // released again when the job lands
      if (!ok) { S.playback = null; S.route = null; }
    } else {
      S.playback = null;
    }
  }
  if (S.state === 'buildup' && t >= S.stageT0 + 2600) {
    S.state = 'breakthrough'; S.stageT0 = t;
    thump(); setStatic(0.5, 0.05); setHum(0.55, 0.1);
    consoleEl.classList.add('break');
    setTimeout(() => consoleEl.classList.remove('break'), 700);
    log('BREAKTHROUGH'); evt('breakthrough');
  } else if (S.state === 'breakthrough' && t >= S.stageT0 + 650) {
    if (S.route && S.route.dead) {
      S.state = 'collapse'; S.stageT0 = t;
      buzz(); setStatic(0.35, 0.1); setHum(0.1, 0.8);
      log('NO CARRIER — ROUTE SCRAPPED. DROPPING.'); evt('collapse');
    } else {
      S.state = 'active'; S.stageT0 = t;
      setStatic(0.16, 0.4); setHum(0.3, 0.4);
      log(`CARRIER — ROUTE OPEN: ${S.route ? S.route.label : 'UNLISTED (HAND ADDRESS)'}`); evt('active');
    }
  } else if (S.state === 'collapse' && t >= S.stageT0 + 900) {
    drop(true);
  } else if (S.state === 'dropping' && t >= S.dropEnd) {
    S.state = 'idle'; setServo(0);
    log('COLLAR CLEAR'); evt('idle');
  }
  // transport
  const transport = !!S.job || !!S.playback || ['buildup', 'breakthrough', 'active'].includes(S.state);
  let reelSpeed = 0;
  if (transport) {
    reelSpeed = S.state === 'buildup' ? lerp(90, 420, clamp((t - S.stageT0) / 2600, 0, 1)) : S.state === 'active' ? 220 : S.playback ? 160 : 90;
    S.counter += dt * (S.playback ? 0.02 : 0.012);
  }
  S.reel += reelSpeed * dt / 1000;
  // line level
  let target = 0.06;
  if (S.job) target = S.job.stage === 'clamp' ? 0.75 : S.job.stage === 'travel' ? 0.42 : 0.25;
  if (S.state === 'buildup') target = lerp(0.3, 0.95, clamp((t - S.stageT0) / 2600, 0, 1));
  if (S.state === 'breakthrough') target = 1;
  if (S.state === 'active') target = 0.72;
  if (S.state === 'collapse') target = 0.2;
  S.line += (target - S.line) * 0.12 + (Math.random() - 0.5) * (S.state === 'active' ? 0.12 : 0.03);
  S.line = clamp(S.line, 0, 1);
}

/* ---------------- render ---------------- */
let lastReadout = -1, lastPips = '';
function syncReadout() {
  const m = LIVE[S.sel];
  els.readoutGlyph.setAttribute('d', MARKS[m][1]);
  els.readoutName.textContent = MARKS[m][0];
  els.readoutSub.textContent = `mark ${S.sel + 1} of ${LIVE.length} · seg ${m + 1}`;
  els.rotaryPtr.style.transform = `rotate(${selAngle(S.sel)}deg)`;
  sectorEls.forEach((s, i) => s.classList.toggle('aim', i === m && !busyStates.includes(S.state)));
}
function render(t) {
  // head + dogs
  headEl.setAttribute('transform', `translate(${CX} ${CY}) rotate(${f2(val(S.head.a, t))})`);
  S.dogs.forEach((d, k) => {
    const a = val(d.a, t), r = val(d.r, t);
    dogEls[k].setAttribute('transform', `rotate(${f2(a)} ${CX} ${CY}) translate(${f2(CX + r)} ${CY})`);
    dogEls[k].classList.toggle('down', d.clamped);
    dogEls[k].classList.toggle('moving', !done(d.a, t));
  });
  // buildup pulse chases around the seated marks
  if (S.state === 'buildup') {
    const p = (t - S.stageT0) / 2600;
    const idx = Math.floor(p * p * 40) % S.seated.length;
    S.seated.forEach((m, i) => sectorEls[m].classList.toggle('pulse', i === idx));
  } else if (S.state === 'active') {
    S.seated.forEach(m => sectorEls[m].classList.toggle('pulse', Math.random() < 0.06));
  } else {
    S.seated.forEach(m => sectorEls[m].classList.remove('pulse'));
  }
  consoleEl.classList.toggle('active', S.state === 'active');
  consoleEl.classList.toggle('alarm', t < S.alarmUntil);

  // pips
  const pk = S.seated.join(',');
  if (pk !== lastPips) {
    lastPips = pk;
    Array.from(els.seatedRow.children).forEach((pip, k) => {
      const m = S.seated[k];
      pip.classList.toggle('on', m !== undefined);
      pip.querySelector('path').setAttribute('d', m !== undefined ? MARKS[m][1] : '');
    });
  }
  // lamps / levers
  els.readyLamp.classList.toggle('on', S.state === 'pending');
  els.lockLamp.classList.toggle('on', S.lockout);
  els.lockLamp.classList.toggle('flash', t < S.alarmUntil);
  els.lockLever.classList.toggle('on', S.lockout);
  els.spkLever.classList.toggle('on', !S.muted);
  els.breachLever.classList.toggle('on', S.breachLever);
  els.cover.classList.toggle('open', S.coverOpen);
  const transport = !!S.job || !!S.playback || ['buildup', 'breakthrough', 'active'].includes(S.state);
  els.lampRec.classList.toggle('on', !!S.job && !S.playback);
  els.lampPlay.classList.toggle('on', !!S.playback || (!!S.job && S.job.src === 'tape'));
  els.lampRun.classList.toggle('on', transport);
  els.counter.textContent = String(Math.floor(S.counter) % 10000).padStart(4, '0');
  els.slotLabel.textContent = S.loaded ? S.loaded.label : '— none —';
  els.reelLsvg.style.transform = `rotate(${f2(S.reel)}deg)`;
  els.reelRsvg.style.transform = `rotate(${f2(S.reel * 0.82 + 40)}deg)`;
  els.vuNeedle.style.transform = `rotate(${f2(-50 + S.line * 100)}deg)`;
  if (S.sel !== lastReadout) { lastReadout = S.sel; syncReadout(); }
  if (S.logDirty) {
    S.logDirty = false;
    els.paper.innerHTML = S.log.map((l, i) => `<div class="ln${i < 3 ? ' fade' : ''}"><span class="n">${l.n}</span> ${l.txt}</div>`).join('');
  }
  drawScope(t);
  drawAperture(t);
}

function drawScope(t) {
  const W = 200, H = 140, c = scCtx;
  c.fillStyle = 'rgba(7,17,8,0.35)'; c.fillRect(0, 0, W, H);      // phosphor persistence
  c.strokeStyle = 'rgba(80,140,80,0.18)'; c.lineWidth = 1;
  c.beginPath();
  for (let x = 0; x <= W; x += 25) { c.moveTo(x, 0); c.lineTo(x, H); }
  for (let y = 0; y <= H; y += 25) { c.moveTo(0, y); c.lineTo(W, y); }
  c.stroke();
  let amp = 6, noise = 0.6, freq = 0.06, phase = t / 150;
  const st = S.state;
  if (S.scope.read) {
    const p = clamp((t - S.scope.read.t0) / S.scope.read.dur, 0, 1);
    noise = 0.9 * (1 - p); amp = 6 + 34 * p; freq = 0.05 + (S.scope.read.mark % 7) * 0.02;
    if (p >= 1 && !S.job) S.scope.read = null;
  } else if (S.job && S.job.stage === 'travel') { amp = 12; noise = 0.35; }
  if (st === 'buildup') { const p = clamp((t - S.stageT0) / 2600, 0, 1); amp = 10 + 55 * p; noise = 0.3 + 0.5 * p; freq = 0.06 + 0.2 * p; }
  if (st === 'breakthrough') { amp = 68; noise = 1.4; }
  if (st === 'active') { amp = 44; noise = 0.9; freq = 0.25; }
  if (st === 'collapse') { amp = 20; noise = 1.2; }
  c.strokeStyle = '#9be36a'; c.lineWidth = 1.6; c.shadowColor = '#9be36a'; c.shadowBlur = 6;
  c.beginPath();
  for (let x = 0; x <= W; x += 2) {
    let y = H / 2 + Math.sin(x * freq + phase) * amp + (Math.random() - 0.5) * amp * noise;
    if (Math.random() < 0.004) y = H / 2 + (Math.random() - 0.5) * H;   // dropout spike
    x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
  }
  c.stroke(); c.shadowBlur = 0;
}

function drawAperture(t) {
  const st = S.state;
  const show = ['buildup', 'breakthrough', 'active', 'collapse'].includes(st);
  apCanvas.hidden = !show;
  if (!show) return;
  const W = 96, img = apCtx.createImageData(W, W), d = img.data;
  const p = clamp((t - S.stageT0) / (st === 'buildup' ? 2600 : st === 'breakthrough' ? 650 : 900), 0, 1);
  const roll = (t / (st === 'active' ? 14 : 8)) % W;
  for (let y = 0; y < W; y++) {
    const dropout = st === 'active' && Math.random() < 0.01;
    const tearRow = st === 'breakthrough' && ((y >> 2) % 6 === 0);
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const dx = x - 47.5, dy = y - 47.5, rr = (dx * dx + dy * dy) / (48 * 48);
      if (rr > 1) { d[i + 3] = 0; continue; }
      const rnd = Math.random();
      let v, r, g, b;
      if (st === 'buildup') {
        const dens = 0.08 + p * p * 0.7;
        v = rnd < dens ? 30 + Math.random() * 150 * (0.3 + p) : 0;
        if (Math.abs(y - roll) < 4) v += 50 * p;
        r = v * 0.95; g = v * 0.8; b = v * 0.55;                 // warm, dirty
      } else if (st === 'breakthrough') {
        v = tearRow ? 255 : 150 + rnd * 105;
        r = g = b = v;                                          // white-out
      } else if (st === 'active') {
        v = 45 + rnd * 150;
        if (Math.abs(y - roll) < 7) v *= 0.5;
        if (dropout) v = 240;
        r = v * 0.70; g = v * 0.86; b = v * 1.0;                // cold carrier
      } else {
        v = (1 - p) * rnd * 170; r = v; g = v * 0.9; b = v * 0.8;
      }
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255 * (1 - rr * rr * 0.45);
    }
  }
  apCtx.putImageData(img, 0, 0);
}

/* ---------------- fit ---------------- */
let fitW = 0, fitH = 0;
function fit() {
  const st = $('#stage');
  const w = st.clientWidth || window.innerWidth, h = st.clientHeight || window.innerHeight;
  if (w <= 0 || h <= 0) { setTimeout(fit, 120); return; }
  fitW = w; fitH = h;
  const k = Math.min((w - 16) / 1920, (h - 16) / 1080);
  document.documentElement.style.setProperty('--fit', String(k));
}

/* ---------------- loop ---------------- */
let lastFitCheck = 0;
function tick() {
  const t = now();
  sim(t);
  render(t);
  if (t - lastFitCheck > 400) {
    lastFitCheck = t;
    const st = $('#stage');
    if (st.clientWidth !== fitW || st.clientHeight !== fitH) fit();
  }
}
function raf() { tick(); requestAnimationFrame(raf); }
function startHeartbeat() {
  try {
    const src = 'setInterval(()=>postMessage(0),50)';
    const w = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    w.onmessage = tick;
  } catch (e) { setInterval(tick, 50); }
}

/* ---------------- wiring ---------------- */
function wire() {
  document.addEventListener('pointerdown', () => { audioInit(); if (AU.ctx && AU.ctx.state === 'suspended') AU.ctx.resume(); }, { capture: true });
  $('#rotary').addEventListener('click', e => {
    const r = e.currentTarget.getBoundingClientRect();
    stepSel(e.clientX < r.left + r.width / 2 ? -1 : 1);
  });
  $('#stepL').addEventListener('click', () => stepSel(-1));
  $('#stepR').addEventListener('click', () => stepSel(1));
  $('#seat').addEventListener('click', seatSelected);
  $('#breach').addEventListener('click', breach);
  $('#cover').addEventListener('click', () => { if (!S.coverOpen) { clack(); log('COVER IS SHUT — LIFT IT FIRST'); evt('cover:blocked'); } });
  $('#hinge').addEventListener('click', () => { S.coverOpen = !S.coverOpen; clack(); log(S.coverOpen ? 'BREACH COVER LIFTED' : 'BREACH COVER SHUT'); evt('cover:' + S.coverOpen); });
  $('#drop').addEventListener('click', () => drop(false));
  $('#lockout').addEventListener('click', () => setLockout(!S.lockout));
  $('#spk').addEventListener('click', () => { S.muted = !S.muted; if (AU.ctx) AU.master.gain.value = S.muted ? 0 : 0.55; log(S.muted ? 'SPEAKER OFF' : 'SPEAKER ON'); });
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') stepSel(-1);
    else if (e.key === 'ArrowRight') stepSel(1);
    else if (e.key === 'Enter') seatSelected();
    else if (e.key === 'Escape') drop(false);
  });
  window.addEventListener('resize', fit);
}

buildRing();
buildControls();
wire();
fit();
syncReadout();
log('BENCH 3 UP. COLLAR CLEAR. LOCKOUT RELEASED.');
log('(seg 13 still dead. someone fix the ribbon.)');
raf();
startHeartbeat();

window.__boneyard = {
  S, MARKS, LIVE, DEAD, PARK, CASSETTES, ADDR_LEN, VERSION, angOf,
  headAngle: () => val(S.head.a, now()),
  dogAngle: k => val(S.dogs[k].a, now()),
  dogRadius: k => val(S.dogs[k].r, now()),
  lit: () => sectorEls.map((s, i) => s.classList.contains('lit') ? i : -1).filter(i => i >= 0),
  fit: () => getComputedStyle(document.documentElement).getPropertyValue('--fit').trim(),
  test: TEST,
};
})();
