// "Salon shakedown" bench. Loaded ONLY via ?salon — never for visitors.
// Every action goes through real dispatched pointer/click events against
// the production DOM, verified by elementFromPoint hit-tests first.
// Waits count live polls, not wall-clock (frozen-pane lesson).

const R = () => window.__caravelle.reads();

let logEl = null, passes = 0, fails = 0;
function log(msg, bad = false) {
  if (!logEl) {
    logEl = document.createElement('div');
    logEl.id = 'bench-log';
    document.body.appendChild(logEl);
  }
  const line = document.createElement('div');
  if (bad) line.className = 'fail';
  line.textContent = msg;
  logEl.appendChild(line);
  while (logEl.childNodes.length > 34) logEl.removeChild(logEl.firstChild);
  console.log(`[salon] ${msg}`);
}
function check(name, cond, detail = '') {
  if (cond) { passes++; log(`PASS ${name}`); }
  else { fails++; log(`FAIL ${name} ${detail}`, true); }
  return cond;
}

// Hidden-tab timers clamp to 1 s (then ~1/min under intensive throttling),
// which would stall the bench. MessageChannel tasks are not throttled, so
// when hidden we sleep by yielding macrotasks until the wall clock agrees.
const msgYield = () => new Promise(r => {
  const c = new MessageChannel();
  c.port1.onmessage = () => r();
  c.port2.postMessage(0);
});
async function sleep(ms) {
  if (!document.hidden) return new Promise(r => setTimeout(r, ms));
  const t0 = performance.now();
  while (performance.now() - t0 < ms) await msgYield();
}
async function pollUntil(fn, maxPolls = 60, interval = 120) {
  for (let i = 1; i <= maxPolls; i++) {
    await sleep(interval);
    if (fn()) return { ok: true, polls: i };
  }
  return { ok: false, polls: maxPolls };
}

/* ---------- real-event actuation ---------- */
function center(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
function hitOK(el, x, y) {
  const h = document.elementFromPoint(x, y);
  return !!h && (h === el || el.contains(h) || h.contains(el));
}
function pev(type, x, y) {
  return new PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true,
    clientX: x, clientY: y, pointerId: 7, isPrimary: true, button: 0, buttons: 1,
    view: window,
  });
}
function realClick(el, name) {
  const { x, y } = center(el);
  if (!hitOK(el, x, y)) {
    check(`${name} hit-test`, false, `occluded by ${document.elementFromPoint(x, y)?.id || document.elementFromPoint(x, y)?.tagName}`);
    return false;
  }
  el.dispatchEvent(pev('pointerdown', x, y));
  el.dispatchEvent(pev('pointerup', x, y));
  el.dispatchEvent(new MouseEvent('click', {
    bubbles: true, cancelable: true, clientX: x, clientY: y, view: window,
  }));
  return true;
}
// drag a rotary control by degrees using a stream of real pointer events
async function realRotate(el, deltaDeg, name) {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const rad = Math.min(r.width, r.height) * 0.4;
  const pt = a => ({
    x: cx + Math.sin(a * Math.PI / 180) * rad,
    y: cy - Math.cos(a * Math.PI / 180) * rad,
  });
  let a = -30;                                  // grab off-apex
  const p0 = pt(a);
  if (!hitOK(el, p0.x, p0.y)) {
    check(`${name} hit-test`, false, `occluded at grab point`);
    return false;
  }
  el.dispatchEvent(pev('pointerdown', p0.x, p0.y));
  const steps = Math.max(4, Math.ceil(Math.abs(deltaDeg) / 6));
  for (let i = 1; i <= steps; i++) {
    a = -30 + deltaDeg * (i / steps);
    const p = pt(a);
    el.dispatchEvent(pev('pointermove', p.x, p.y));
    if (i % 5 === 0) await sleep(15);
  }
  const pe = pt(a);
  el.dispatchEvent(pev('pointerup', pe.x, pe.y));
  return true;
}

const el = id => document.getElementById(id);

/* ---------- closed-loop tuning helpers ---------- */
async function tuneCoarseTo(metres, name) {
  for (let round = 0; round < 8; round++) {
    const dm = metres - R().tuned;
    if (Math.abs(dm) < 2.5) return true;
    // dial: 300° of rotation spans 200 m → 1.5°/m
    await realRotate(el('bigdial'), dm * 1.5, name);
    await sleep(40);
  }
  return Math.abs(metres - R().tuned) < 2.5;
}
async function tuneVernierToLock(destId, name) {
  for (let round = 0; round < 10; round++) {
    if (R().latched?.id === destId) return true;
    const dm = -(R().tuned - R().beacon.dest.metres);
    // vernier: 300° spans 8 m → 37.5°/m
    await realRotate(el('vernier'), dm * 37.5, name);
    await sleep(40);
  }
  return R().latched?.id === destId;
}
async function setBandTo(b, name) {
  for (let i = 0; i < 4 && R().band !== b; i++) {
    realClick(el('bandsel'), name);
    await sleep(60);
  }
  return R().band === b;
}

/* ---------- environment evidence ---------- */
function measureRAF(ms = 900) {
  return new Promise(res => {
    let frames = 0;
    const t0 = performance.now();
    const step = () => {
      frames++;
      if (performance.now() - t0 < ms) requestAnimationFrame(step);
      else res(frames);
    };
    requestAnimationFrame(step);
    setTimeout(() => res(frames), ms + 400);   // in case rAF never fires
  });
}

/* ---------- test phases ---------- */
async function tGuardsCold() {
  log('— T1 cold guards —');
  const lever = el('travel-lever');
  realClick(lever, 'lever(cold)');
  await sleep(150);
  check('cold lever refused', !R().engaged);
  check('cold lever says LINE OFF', R().status.text === 'LINE OFF', `got "${R().status.text}"`);
}

async function tPower() {
  log('— T2 line power —');
  realClick(el('linesw'), 'line switch');
  await sleep(120);
  check('line on', R().lineOn);
  const warm = await pollUntil(() => R().warmed, 80);
  check(`tubes warmed (${warm.polls} polls)`, warm.ok, `volts=${R().volts.toFixed(1)}`);
  check('status READY', /READY|RESONANCE/.test(R().status.text), `got "${R().status.text}"`);
}

async function tManual() {
  log('— T3 manual dial → The Palisades (C · 292 m) —');
  check('band set C', await setBandTo(2, 'band selector'));
  check('coarse near 292', await tuneCoarseTo(292, 'big dial'), `tuned=${R().tuned.toFixed(2)}`);
  check('vernier lock', await tuneVernierToLock('palisades', 'vernier'), `tuned=${R().tuned.toFixed(2)}`);
  check('jewel latched', document.querySelector('#salon').classList.contains('latched'));
  realClick(el('travel-lever'), 'lever(engage)');
  const open = await pollUntil(() => R().engaged && R().portalPhase > 0.5, 40);
  check(`doorway open (${open.polls} polls)`, open.ok, `phase=${R().portalPhase.toFixed(2)}`);
  check('status TRAVEL', /TRAVEL ESTABLISHED/.test(R().status.text), `got "${R().status.text}"`);
  realClick(el('travel-lever'), 'lever(close)');
  const shut = await pollUntil(() => !R().engaged && R().portalPhase < 0.05, 40);
  check(`doorway shut (${shut.polls} polls)`, shut.ok);
}

async function tPresel() {
  log('— T4 presel fast dial → Caldera Vista (key 4) —');
  realClick(el('presel-4'), 'presel key 4');
  await sleep(100);
  check('slew started', R().slewing || R().latched?.id === 'caldera');
  const lock = await pollUntil(() => !R().slewing && R().latched?.id === 'caldera', 40);
  check(`cam slew locked (${lock.polls} polls)`, lock.ok,
    `tuned=${R().tuned.toFixed(2)} band=${R().band}`);
  realClick(el('travel-lever'), 'lever(engage)');
  const open = await pollUntil(() => R().engaged && R().portalPhase > 0.5, 40);
  check(`doorway open (${open.polls} polls)`, open.ok);
  // guard: tuning is cam-locked while doorway open
  const bandBefore = R().band;
  realClick(el('presel-2'), 'presel key 2 (while open)');
  await sleep(150);
  check('condenser locked while open',
    R().band === bandBefore && !R().slewing && /CONDENSER LOCKED/.test(R().status.text),
    `got "${R().status.text}"`);
  realClick(el('travel-lever'), 'lever(close)');
  const shut = await pollUntil(() => !R().engaged && R().portalPhase < 0.05, 40);
  check(`doorway shut (${shut.polls} polls)`, shut.ok);
}

async function tNoCarrier() {
  log('— T5 no-carrier guard —');
  await setBandTo(2, 'band selector');
  // park in an empty stretch of band C (~205 m, nearest beacon 49 m away)
  for (let round = 0; round < 8 && Math.abs(R().tuned - 205) > 4; round++) {
    await realRotate(el('bigdial'), (205 - R().tuned) * 1.5, 'big dial');
    await sleep(40);
  }
  check('parked off-carrier', Math.abs(R().tuned - 205) <= 4, `tuned=${R().tuned.toFixed(1)}`);
  realClick(el('travel-lever'), 'lever(no carrier)');
  await sleep(150);
  check('lever refused', !R().engaged);
  check('says NO CARRIER', R().status.text === 'NO CARRIER', `got "${R().status.text}"`);
}

/* ---------- runner ---------- */
export async function runBench(mode = 'all') {
  log(`SALON SHAKEDOWN — mode=${mode}`);
  log(`visibility=${document.visibilityState}`);
  const frames = await measureRAF();
  log(`rAF frames in 900ms: ${frames} ${frames < 5 ? '(rAF-starved viewer)' : '(live)'}`);

  const phases = {
    guards: [tGuardsCold, tPower, tNoCarrier],
    manual: [tGuardsCold, tPower, tManual],
    presel: [tGuardsCold, tPower, tPresel],
    all: [tGuardsCold, tPower, tManual, tPresel, tNoCarrier],
  };
  for (const phase of (phases[mode] || phases.all)) {
    try { await phase(); }
    catch (err) { fails++; log(`FAIL ${phase.name} threw: ${err.message}`, true); }
  }
  log(`===== ${passes}/${passes + fails} PASS${fails ? ` — ${fails} FAIL` : ''} =====`, fails > 0);
  window.__caravelle.benchResult = { passes, fails };
  return { passes, fails };
}

// manual re-run hook
window.__caravelle.salon = runBench;
