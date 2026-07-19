import { LEDGER, CARDS, CHECKLIST, findRoute } from './data.js';
import { audio } from './audio.js';
import { makeGauge } from './gauge.js';
import { createPortView } from './portview.js';

/* ============================================================
   Panel state
   ============================================================ */

const S = {
  power: false,
  compressor: false,
  volts: { target: 0 },
  pressure: { target: 0 },
  digits: [0, 0, 0, 0, 0],
  card: null,          // seated route-card number
  seeking: false,
  line: null,          // proved route number
  certs: [false, false, false],
  certByCard: false,
  valve: 0,            // 0 closed .. 1 open
  film: 0,
  open: false,
  moving: false,       // valve travelling
};

const PLENUM_OK = 58;  // kPa needed to line up / hold a conduit

/* ============================================================
   Ticker — rAF when visible; MessageChannel pump as a fallback
   while hidden AND a sequence is running (this environment's
   Browser pane can keep tabs hidden with rAF stalled).
   ============================================================ */

const tickFns = [];
const sleepers = [];   // {until, resolve}
const tweens = [];     // {obj, key, from, to, t0, dur, done}

let lastT = performance.now();

function stepClock() {
  const now = performance.now();
  const dt = Math.min(0.12, (now - lastT) / 1000);
  if (dt < 0.012) return;
  lastT = now;
  const t = now / 1000;

  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    const p = Math.min(1, (now - tw.t0) / tw.dur);
    tw.obj[tw.key] = tw.from + (tw.to - tw.from) * p;
    if (p >= 1) { tweens.splice(i, 1); tw.done && tw.done(); }
  }
  for (let i = sleepers.length - 1; i >= 0; i--) {
    if (now >= sleepers[i].until) { const s = sleepers.splice(i, 1)[0]; s.resolve(); }
  }
  for (const fn of tickFns) fn(dt, t);
}

function rafLoop() { stepClock(); requestAnimationFrame(rafLoop); }
requestAnimationFrame(rafLoop);

// hidden-tab pump: only while something is actually in flight
const mc = new MessageChannel();
let pumping = false;
mc.port1.onmessage = () => {
  if (!pumping) return;
  stepClock();
  if (document.hidden && (sleepers.length || tweens.length)) mc.port2.postMessage(0);
  else pumping = false;
};
function ensurePump() {
  if (document.hidden && !pumping) { pumping = true; mc.port2.postMessage(0); }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) ensurePump(); });

const sleep = ms => new Promise(resolve => {
  sleepers.push({ until: performance.now() + ms, resolve });
  ensurePump();
});

function tween(obj, key, to, dur, done) {
  tweens.push({ obj, key, from: obj[key], to, t0: performance.now(), dur, done });
  ensurePump();
}

/* ============================================================
   DOM scaffolding
   ============================================================ */

const $ = id => document.getElementById(id);

const els = {
  panel: $('panel'),
  key: $('keySwitch'), busLamp: $('busLamp'),
  comp: $('compToggle'), plenumLamp: $('plenumLamp'),
  lampTest: $('lampTest'),
  gaugeRow: $('gaugeRow'),
  twRack: $('twRack'),
  lineBtn: $('lineBtn'), seekLamps: $('seekLamps'),
  lineLamp: $('lineLamp'), noRouteLamp: $('noRouteLamp'),
  cardSlot: $('cardSlot'), seatedCard: $('seatedCard'), ejectBtn: $('ejectBtn'),
  ledgerList: $('ledgerList'), cardRack: $('cardRack'),
  checkList: $('checkList'),
  guard: $('openGuard'), guardCover: $('guardCover'), openBtn: $('openBtn'),
  openLamp: $('openLamp'), interlockLamp: $('interlockLamp'),
  logTape: $('logTape'),
};

// --- gauges ---
const gVolts = makeGauge({
  label: 'BUS VOLTS', unit: 'V ~', min: 0, max: 150,
  zones: [{ from: 100, to: 130, color: '#2f8f4a' }], ticks: 15,
});
const gPress = makeGauge({
  label: 'PLENUM', unit: 'kPa', min: 0, max: 100,
  zones: [{ from: 0, to: PLENUM_OK, color: '#b23a28' }, { from: PLENUM_OK, to: 88, color: '#2f8f4a' }], ticks: 10,
});
const gBias = makeGauge({
  label: 'CARRIER BIAS', unit: 'mV', min: -40, max: 40,
  zones: [{ from: -15, to: 15, color: '#2f8f4a' }], ticks: 8,
});
els.gaugeRow.append(gVolts.el, gPress.el, gBias.el);

// --- thumbwheels ---
const drums = [];
for (let i = 0; i < 5; i++) {
  const tw = document.createElement('div');
  tw.className = 'thumbwheel';
  const up = document.createElement('button');
  up.className = 'tw-btn up'; up.setAttribute('aria-label', `Digit ${i + 1} up`);
  const win = document.createElement('div');
  win.className = 'tw-window';
  const drum = document.createElement('div');
  drum.className = 'tw-drum';
  for (let d = 0; d <= 9; d++) {
    const cell = document.createElement('div');
    cell.className = 'tw-digit';
    cell.textContent = d;
    drum.appendChild(cell);
  }
  win.appendChild(drum);
  const dn = document.createElement('button');
  dn.className = 'tw-btn dn'; dn.setAttribute('aria-label', `Digit ${i + 1} down`);
  tw.append(up, win, dn);
  els.twRack.appendChild(tw);
  drums.push(drum);
  up.addEventListener('click', () => stepDigit(i, +1));
  dn.addEventListener('click', () => stepDigit(i, -1));
}
function showDigit(i, slew = false) {
  drums[i].classList.toggle('slew', slew);
  drums[i].style.transform = `translateY(${-S.digits[i] * 44}px)`;
}

// --- seek lamps ---
const seekLampEls = [];
for (let i = 0; i < 5; i++) {
  const col = document.createElement('div');
  col.className = 'lamp-col';
  const lamp = document.createElement('div');
  lamp.className = 'lamp amber';
  const lab = document.createElement('label');
  lab.textContent = `SEL ${i + 1}`;
  col.append(lamp, lab);
  els.seekLamps.appendChild(col);
  seekLampEls.push(lamp);
}

// --- ledger ---
for (const r of LEDGER) {
  const row = document.createElement('div');
  row.className = 'ledger-row';
  row.innerHTML = `<span class="r-no">${r.route}</span><span class="r-name">${r.name}</span><span class="r-note">${r.note}</span>`;
  row.addEventListener('click', () => {
    document.querySelectorAll('.ledger-row.mark').forEach(x => x !== row && x.classList.remove('mark'));
    row.classList.toggle('mark');   // grease-pencil mark; reading aid only
  });
  els.ledgerList.appendChild(row);
}

// --- route cards ---
const cardEls = new Map();
for (const no of CARDS) {
  const r = findRoute(no);
  const card = document.createElement('div');
  card.className = 'route-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Route card ${no} ${r.name}`);
  const holes = no.split('').map(ch => `<i class="${+ch % 2 ? '' : 'blank'}"></i>`).join('');
  card.innerHTML = `<span class="rc-no">${no}</span><span class="rc-name">${r.name}</span>
    <div class="rc-holes">${holes}</div><span class="rc-stamp">CERT<br>7-C</span>`;
  card.addEventListener('click', () => insertCard(no));
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); insertCard(no); } });
  els.cardRack.appendChild(card);
  cardEls.set(no, card);
}

// --- checklist ---
const certToggles = [];
const certLamps = [];
CHECKLIST.forEach((label, i) => {
  const item = document.createElement('div');
  item.className = 'check-item';
  const tog = document.createElement('div');
  tog.className = 'toggle sm';
  tog.setAttribute('role', 'switch');
  tog.setAttribute('aria-checked', 'false');
  tog.setAttribute('tabindex', '0');
  tog.setAttribute('aria-label', label);
  tog.innerHTML = '<div class="toggle-plate"><div class="bat"></div></div>';
  const lab = document.createElement('label');
  lab.textContent = label;
  const lamp = document.createElement('div');
  lamp.className = 'lamp amber';
  item.append(tog, lab, lamp);
  els.checkList.appendChild(item);
  certToggles.push(tog);
  certLamps.push(lamp);
  const flip = () => toggleCert(i);
  tog.addEventListener('click', flip);
  tog.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
});

const portView = createPortView($('portCanvas'));

/* ============================================================
   Log
   ============================================================ */

function now() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function log(msg, warn = false) {
  const line = document.createElement('div');
  line.className = 'log-line' + (warn ? ' warn' : '');
  line.innerHTML = `<span class="t">${now()}</span>  ${msg}`;
  els.logTape.appendChild(line);
  while (els.logTape.children.length > 60) els.logTape.firstChild.remove();
  els.logTape.scrollTop = els.logTape.scrollHeight;
}

function refuse(msg) {
  audio.buzz();
  els.interlockLamp.classList.add('lit', 'flash');
  setTimeout(() => els.interlockLamp.classList.remove('lit', 'flash'), 900);
  log(`REFUSED — ${msg}`, true);
}

/* ============================================================
   Actions
   ============================================================ */

function routeString() { return S.digits.join(''); }

function dropLine(reason) {
  if (!S.line && !S.seeking) return;
  S.line = null;
  audio.release();
  seekLampEls.forEach(l => l.classList.remove('lit'));
  els.lineLamp.classList.remove('lit');
  if (reason) log(`LINE DROPPED — ${reason}`);
}

function resetCerts(quiet = false) {
  S.certs = [false, false, false];
  S.certByCard = false;
  certToggles.forEach(t => { t.classList.remove('on'); t.setAttribute('aria-checked', 'false'); });
  certLamps.forEach(l => l.classList.remove('lit'));
  if (!quiet) audio.snap();
}

function toggleKey() {
  if (S.moving || S.seeking) return refuse('SELECTOR IN MOTION');
  if (S.power && S.open) return refuse('CONDUIT UNDER LOAD');
  S.power = !S.power;
  audio.keyClunk();
  els.key.classList.toggle('on', S.power);
  els.key.setAttribute('aria-checked', String(S.power));
  if (S.power) {
    S.volts.target = 117;
    audio.setBusHum(true);
    log('PANEL ENERGIZED — BUS 117V');
  } else {
    S.volts.target = 0;
    S.pressure.target = 0;
    S.compressor = false;
    els.comp.classList.remove('on');
    els.comp.setAttribute('aria-checked', 'false');
    audio.setBusHum(false);
    audio.setCompressor(false);
    dropLine(null);
    resetCerts(true);
    els.noRouteLamp.classList.remove('lit');
    if (S.card) ejectCard(true);
    log('PANEL SECURED — KEY OFF');
  }
}
els.key.addEventListener('click', toggleKey);
els.key.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleKey(); } });

function toggleCompressor() {
  if (!S.power) return refuse('PANEL COLD');
  if (S.open && S.compressor) return refuse('CONDUIT UNDER LOAD');
  S.compressor = !S.compressor;
  audio.snap();
  els.comp.classList.toggle('on', S.compressor);
  els.comp.setAttribute('aria-checked', String(S.compressor));
  audio.setCompressor(S.compressor);
  if (S.compressor) {
    S.pressure.target = 76;
    log('COMPRESSOR RUN — PLENUM CHARGING');
  } else {
    S.pressure.target = 0;
    log('COMPRESSOR SECURED');
  }
}
els.comp.addEventListener('click', toggleCompressor);
els.comp.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCompressor(); } });

function stepDigit(i, dir) {
  if (S.open || S.moving) return refuse('CONDUIT UNDER LOAD');
  if (S.seeking) return refuse('SELECTOR IN MOTION');
  if (S.card) return refuse('CARD SEATED — EJECT TO DIAL BY HAND');
  S.digits[i] = (S.digits[i] + dir + 10) % 10;
  audio.tick();
  showDigit(i);
  if (S.line) dropLine('SELECTOR MOVED');
  els.noRouteLamp.classList.remove('lit');
}

async function lineUp() {
  if (S.seeking || S.moving) return;
  if (!S.power) return refuse('PANEL COLD');
  if (S.open) return refuse('CONDUIT UNDER LOAD');
  if (gPress.value < PLENUM_OK) return refuse('PLENUM LOW');
  if (S.line) dropLine('RE-LINE REQUESTED');
  els.noRouteLamp.classList.remove('lit');

  const route = routeString();
  S.seeking = true;
  log(`LINING UP ${route}${S.card ? ' — GANG RELEASE (CARD)' : ''}`);

  if (S.card) {
    // stored-card gang release: one motor throw seats all five banks
    audio.motor(0.72);
    await sleep(160);
    for (let i = 0; i < 5; i++) {
      seekLampEls[i].classList.add('lit');
      audio.seat();
      await sleep(95);
    }
  } else {
    // hand-dialled: each stepping relay walks to its digit, then seats
    for (let i = 0; i < 5; i++) {
      const target = S.digits[i];
      for (let s = 0; s < target; s++) { audio.tick(); await sleep(88); }
      await sleep(120);
      audio.seat();
      seekLampEls[i].classList.add('lit');
      await sleep(140);
    }
  }

  // line proving — far-end continuity check
  await sleep(480);
  const entry = findRoute(route);
  if (entry) {
    S.line = route;
    els.lineLamp.classList.add('lit');
    audio.seat();
    log(`LINE PROVED — ${route} ${entry.name}`);
    if (S.card && !S.certs.every(Boolean)) {
      await sleep(260);
      audio.stamp();
      S.certs = [true, true, true];
      S.certByCard = true;
      certToggles.forEach(t => { t.classList.add('on'); t.setAttribute('aria-checked', 'true'); });
      certLamps.forEach(l => l.classList.add('lit'));
      log('PRE-CERT ACCEPTED FROM CARD — MAINT. ORDER 7-C');
    }
  } else {
    audio.release();
    seekLampEls.forEach(l => l.classList.remove('lit'));
    els.noRouteLamp.classList.add('lit');
    log(`NO SUCH ROUTE ${route} — CHECK LEDGER`, true);
  }
  S.seeking = false;
}
els.lineBtn.addEventListener('click', lineUp);

function insertCard(no) {
  if (!S.power) return refuse('PANEL COLD');
  if (S.open || S.moving) return refuse('CONDUIT UNDER LOAD');
  if (S.seeking) return refuse('SELECTOR IN MOTION');
  if (S.card) return refuse('SLOT OCCUPIED — EJECT FIRST');
  S.card = no;
  cardEls.get(no).classList.add('gone');
  els.seatedCard.hidden = false;
  els.seatedCard.textContent = `CARD ${no}`;
  audio.cardSlide();
  if (S.line) dropLine('CARD SEATED');
  els.noRouteLamp.classList.remove('lit');
  // card mechanically slews the wheels to its punching
  no.split('').forEach((ch, i) => { S.digits[i] = +ch; showDigit(i, true); });
  const r = findRoute(no);
  log(`ROUTE CARD ${no} SEATED — ${r.name}`);
}

function ejectCard(quiet = false) {
  if (!S.card) return;
  if (S.open || S.moving || S.seeking) return refuse('CONDUIT UNDER LOAD');
  cardEls.get(S.card).classList.remove('gone');
  els.seatedCard.hidden = true;
  const was = S.card;
  S.card = null;
  audio.cardSlide();
  if (S.line) dropLine('CARD EJECTED');
  if (S.certByCard) resetCerts(true);
  if (!quiet) log(`CARD ${was} EJECTED`);
}
els.ejectBtn.addEventListener('click', () => ejectCard());

function toggleCert(i) {
  if (!S.power) return refuse('PANEL COLD');
  if (S.open || S.moving) return refuse('CONDUIT UNDER LOAD');
  if (S.certByCard) return refuse('CERT HELD BY CARD');
  S.certs[i] = !S.certs[i];
  audio.snap();
  certToggles[i].classList.toggle('on', S.certs[i]);
  certToggles[i].setAttribute('aria-checked', String(S.certs[i]));
  certLamps[i].classList.toggle('lit', S.certs[i]);
  if (S.certs.every(Boolean)) log('PRE-TRANSIT CHECKLIST COMPLETE');
}

// guard cover
let guardUp = false;
function flipGuard() {
  guardUp = !guardUp;
  els.guard.classList.toggle('up', guardUp);
  audio.snap();
}
els.guardCover.addEventListener('click', flipGuard);
els.guardCover.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipGuard(); } });

async function openConduit() {
  if (S.moving || S.seeking) return;
  if (S.open) return closeConduit();
  if (!S.power) return refuse('PANEL COLD');
  if (!S.line) return refuse('NO LINE PROVED');
  if (!S.certs.every(Boolean)) return refuse('CHECKLIST INCOMPLETE');
  if (gPress.value < PLENUM_OK) return refuse('PLENUM LOW');

  S.moving = true;
  const entry = findRoute(S.line);
  log(`GATE VALVE OPENING — ROUTE ${S.line}`);
  audio.grind(2.1);
  await new Promise(res => tween(S, 'valve', 1, 2100, res));
  log('CARRIER FILM FORMING');
  audio.setCarrier(true);
  await new Promise(res => tween(S, 'film', 1, 1300, res));
  S.open = true;
  S.moving = false;
  els.openLamp.classList.add('lit');
  els.openBtn.classList.add('green-mode');
  els.openBtn.innerHTML = 'CLOSE<br>CONDUIT';
  log(`CONDUIT OPEN — ${S.line} ${entry.name}`, false);
}

async function closeConduit() {
  if (S.moving) return;
  S.moving = true;
  log('CLOSING — CARRIER FILM COLLAPSING');
  audio.setCarrier(false);
  await new Promise(res => tween(S, 'film', 0, 550, res));
  audio.pop();
  audio.grind(2.0);
  await new Promise(res => tween(S, 'valve', 0, 2000, res));
  S.open = false;
  S.moving = false;
  els.openLamp.classList.remove('lit');
  els.openBtn.classList.remove('green-mode');
  els.openBtn.innerHTML = 'OPEN<br>CONDUIT';
  dropLine('TRANSIT COMPLETE');
  resetCerts(true);
  audio.release();
  log('CONDUIT SECURED — RECERTIFY BEFORE NEXT TRANSIT');
}
els.openBtn.addEventListener('click', openConduit);

// lamp test — momentary
const lampTestOn = on => els.panel.classList.toggle('lamp-test', on);
els.lampTest.addEventListener('pointerdown', () => { lampTestOn(true); audio.snap(); });
window.addEventListener('pointerup', () => lampTestOn(false));
els.lampTest.addEventListener('pointerleave', () => lampTestOn(false));

/* ============================================================
   Ambient render loop
   ============================================================ */

let noiseT = 0;
tickFns.push((dt, t) => {
  noiseT = t;
  // gauge physics + ambient needle life
  const jit = S.power ? (Math.sin(t * 13.7) + Math.sin(t * 7.3)) * 0.35 : 0;
  gVolts.jitter = jit * 0.8;
  gVolts.target = S.volts.target;
  gPress.jitter = S.compressor ? jit * 1.2 : 0;
  gPress.target = S.pressure.target;
  if (S.open) {
    gBias.target = 8 * Math.sin(t * 0.31) + 4 * Math.sin(t * 0.83);
    gBias.jitter = jit;
  } else {
    gBias.target = 0; gBias.jitter = 0;
  }
  gVolts.tick(dt); gPress.tick(dt); gBias.tick(dt);

  els.busLamp.classList.toggle('lit', S.power);
  els.plenumLamp.classList.toggle('lit', gPress.value >= PLENUM_OK);

  portView.draw(t, { valve: S.valve, film: S.film, powered: S.power });
});

log('SHIFT START — PANEL K COLD');
log('SEE LEDGER FOR SERVICEABLE JUNCTIONS');

// audio unlock on first gesture
const unlock = () => { audio.init(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);

/* ============================================================
   Bench-test harness (factory use — not reachable by a visitor
   without the ?bench URL parameter or the console hook).
   ============================================================ */

async function bench({ card = false } = {}) {
  log('— BENCH HARNESS ENGAGED —');
  if (!S.power) toggleKey();
  if (!S.compressor) toggleCompressor();
  while (gPress.value < PLENUM_OK) await sleep(200);
  if (card) {
    insertCard('21940');
    await sleep(700);
  } else {
    const target = '40221';
    for (let i = 0; i < 5; i++) {
      while (S.digits[i] !== +target[i]) { stepDigit(i, +1); await sleep(90); }
    }
  }
  await lineUp();
  if (!S.card) for (let i = 0; i < 3; i++) { toggleCert(i); await sleep(180); }
  if (!guardUp) flipGuard();
  await sleep(250);
  await openConduit();
  await sleep(3500);
  await closeConduit();
  if (S.card) { await sleep(300); ejectCard(); }
  if (guardUp) flipGuard();
  log('— BENCH HARNESS COMPLETE —');
  return snapshot();
}

function snapshot() {
  return {
    power: S.power, compressor: S.compressor,
    pressure: +gPress.value.toFixed(1), volts: +gVolts.value.toFixed(1),
    digits: [...S.digits], card: S.card, line: S.line,
    certs: [...S.certs], open: S.open, valve: +S.valve.toFixed(2), film: +S.film.toFixed(2),
    visibility: document.visibilityState,
  };
}

window.__panelK = { bench, snapshot, S, sleep, act: { toggleKey, toggleCompressor, stepDigit, lineUp, insertCard, ejectCard, toggleCert, flipGuard, openConduit, closeConduit } };

if (new URLSearchParams(location.search).has('bench')) {
  setTimeout(() => bench({ card: new URLSearchParams(location.search).get('bench') === 'card' }), 900);
}
