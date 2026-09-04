/* WIDDERSHINS — end-to-end verification with real dispatched pointer events.
 *
 * Runs the static server on a test port, drives headless Chrome through
 * puppeteer-core, hit-tests every control at its rendered position before
 * clicking it, times every ward catch from the outside (so per-ward
 * staging is measured, not assumed), checks the fence really turned
 * widdershins, and measures the aperture from actual screenshots so the
 * three activation stages are proven distinct from each other.
 *
 * Usage:  npm test          (or: node test/run-tests.mjs)
 * Env:    CHROME_PATH=...   to point at a specific Chrome/Chromium binary. */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';
import { PNG } from 'pngjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { startServer } = require('../server.js');

const PORT = 8817;
const SHOTS = path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
for (const f of fs.readdirSync(SHOTS)) if (f.endsWith('.png')) fs.unlinkSync(path.join(SHOTS, f));

// Browser resolution. No absolute local filesystem path is committed here:
// CHROME_PATH (or PUPPETEER_EXECUTABLE_PATH) wins, otherwise puppeteer's own
// executable path is used. Anything else is an explicit error.
async function resolveChrome() {
  const fromEnv = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv) return fromEnv;
  let why;
  try {
    const p = await puppeteer.executablePath();
    if (p && fs.existsSync(p)) return p;
    why = p ? `puppeteer's executable path does not exist: ${p}` : 'puppeteer reported no executable path';
  } catch (e) {
    why = `puppeteer could not resolve an executable path (${e.message})`;
  }
  throw new Error(`No browser found: ${why}. Set CHROME_PATH to a Chrome/Chromium executable.`);
}

const out = [];
const say = (s) => { console.log(s); out.push(s); };
const results = [];
let shotIndex = 0;
function assert(cond, label, detail) {
  results.push({ ok: !!cond, label, detail });
  say((cond ? '  PASS  ' : '  FAIL  ') + label + (detail !== undefined ? '  — ' + detail : ''));
  return !!cond;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (d) => ((d % 360) + 360) % 360;

async function main() {
  const server = startServer(PORT);
  await sleep(300);
  const browser = await puppeteer.launch({
    executablePath: await resolveChrome(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required', '--window-size=1920,1080']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('console: ' + m.text()); });

  const url = `http://localhost:${PORT}/`;
  const st = () => page.evaluate(() => window.__widdershins.state());
  const shot = async (name, opts = {}) => {
    shotIndex++;
    const file = path.join(SHOTS, String(shotIndex).padStart(2, '0') + '_' + name + '.png');
    await page.screenshot({ path: file, ...opts });
    say('        shot -> ' + path.relative(process.cwd(), file));
    return file;
  };
  async function waitFor(fn, timeout) {
    const t0 = Date.now(); let polls = 0;
    while (Date.now() - t0 < timeout) {
      const v = await page.evaluate(fn); polls++;
      if (v) return { ok: true, ms: Date.now() - t0, polls, v };
      await sleep(30);
    }
    return { ok: false, ms: Date.now() - t0, polls };
  }
  async function hitTest(selector) {
    return page.evaluate((sel) => {
      const e = document.querySelector(sel);
      if (!e) return { ok: false, why: 'missing' };
      const r = e.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const top = document.elementFromPoint(x, y);
      const ok = !!top && (top === e || e.contains(top));
      return { ok, x, y, top: top ? (top.id ? '#' + top.id : top.tagName.toLowerCase() + '.' + top.className) : 'none' };
    }, selector);
  }
  async function click(selector, label) {
    const h = await hitTest(selector);
    assert(h.ok, 'hit-test ' + (label || selector) + ' at (' + Math.round(h.x) + ',' + Math.round(h.y) + ')', h.ok ? 'topmost is the control' : 'topmost is ' + h.top);
    if (!h.ok) return false;
    await page.mouse.click(h.x, h.y);
    return true;
  }
  /* Aperture luminance from a real screenshot of the inner 80% of the disc. */
  async function aperture() {
    const r = await page.evaluate(() => { const b = document.querySelector('#aperture').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width }; });
    const rad = r.w / 2;
    const clip = { x: Math.round(r.x - rad), y: Math.round(r.y - rad), width: Math.round(rad * 2), height: Math.round(rad * 2) };
    const buf = await page.screenshot({ clip });
    const png = PNG.sync.read(buf);
    let n = 0, lum = 0, sat = 0;
    const c = png.width / 2, lim = (rad * 0.8) ** 2;
    for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
      if ((x - c) ** 2 + (y - c) ** 2 > lim) continue;
      const i = (y * png.width + x) * 4;
      const R = png.data[i], G = png.data[i + 1], B = png.data[i + 2];
      lum += 0.2126 * R + 0.7152 * G + 0.0722 * B;
      sat += Math.max(R, G, B) - Math.min(R, G, B);
      n++;
    }
    return { lum: +(lum / n).toFixed(1), sat: +(sat / n).toFixed(1) };
  }
  const ward = (id) => `.ward[data-ward="${id}"]`;
  const key = (id) => `.key[data-key="${id}"]`;

  /* ================= A. Cold start ================= */
  say('\n== A. Cold start ==');
  await page.setViewport({ width: 3840, height: 2160 });
  await page.goto(url, { waitUntil: 'load' });
  await sleep(500);
  let s = await st();
  let tf = await page.evaluate(() => getComputedStyle(document.querySelector('#stage')).transform);
  assert(s.fit === '2', 'simulated 4K (3840×2160): --fit is a bare number 2', 'fit=' + s.fit);
  assert(tf && tf !== 'none', '4K: stage transform applied', tf);
  await shot('cold_start_4k');
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(url, { waitUntil: 'load' });
  await sleep(600);
  s = await st();
  tf = await page.evaluate(() => getComputedStyle(document.querySelector('#stage')).transform);
  assert(s.fit === '1', '1080p (1920×1080): --fit is 1', 'fit=' + s.fit);
  assert(tf && tf !== 'none', '1080p: stage transform applied', tf);
  assert(s.stage === 'idle' && s.locked.length === 0 && !s.turning, 'cold start is idle: no ward caught, fence still', JSON.stringify({ stage: s.stage, locked: s.locked }));
  assert(s.salt === false, 'salt line defaults to UNLAID (interlock released)', 'salt=' + s.salt);
  assert(s.warn === '', 'no warning shown on cold start');
  const guideHidden = await page.evaluate(() => document.querySelector('#guide').hidden && getComputedStyle(document.querySelector('#guide')).display === 'none');
  assert(guideHidden, 'gate-book overlay hidden on cold start ([hidden] effective)');
  const idleAp = await aperture();
  assert(idleAp.lum < 40, 'idle gate is dark (leaves shut)', 'lum=' + idleAp.lum);
  const g0 = await page.evaluate(() => document.querySelector('#ghost').getAttribute('cx'));
  const rot0 = s.rot;
  await sleep(500);
  const g1 = await page.evaluate(() => document.querySelector('#ghost').getAttribute('cx'));
  s = await st();
  assert(g0 !== g1, 'idle is ambient: ghost-light moves along the rail', g0 + ' → ' + g1);
  assert(s.locked.length === 0 && s.stage === 'idle' && s.rot === rot0 && !s.turning, 'idle never turns or dials itself', 'after 1.1 s: rot=' + s.rot + ' locked=' + s.locked.length);
  await shot('cold_start_1080p');

  /* ================= B. Geometry ================= */
  say('\n== B. Control geometry ==');
  const wardIds = await page.evaluate(() => Array.from(document.querySelectorAll('.ward')).map((b) => b.dataset.ward));
  const keyIds = await page.evaluate(() => Array.from(document.querySelectorAll('.key')).map((b) => b.dataset.key));
  let geomOk = true; const geomDetail = [];
  for (const sel of ['#bell', '#bar', '#salt', ...wardIds.map(ward), ...keyIds.map(key)]) {
    const h = await hitTest(sel);
    if (!h.ok) { geomOk = false; geomDetail.push(sel + ' → ' + h.top); }
  }
  assert(geomOk && wardIds.length === 13 && keyIds.length === 5, 'all 21 core controls reachable at their rendered centres (elementFromPoint)', geomOk ? '3 threshold controls + 13 wards + 5 keys' : geomDetail.join('; '));
  const inView = await page.evaluate(() => {
    const bad = [];
    for (const e of document.querySelectorAll('.ward, .key, #bell, #bar, #salt, #status, #ledger, #log, #lantern, #wardsWrap, #keysWrap')) {
      const r = e.getBoundingClientRect();
      if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) bad.push(e.id || e.className);
    }
    return bad;
  });
  assert(inView.length === 0, 'every control and readout lies inside the 1080p viewport', inView.join(', ') || 'ok');

  /* ================= C. Manual dial ================= */
  say('\n== C. Manual dial (a living hand) ==');
  const manual = ['Th', 'As', 'Wk', 'Ho', 'Ow', 'Ne'];
  const manualTimes = [];
  let widdershinsOk = true; const dirDetail = [];
  let midShotDone = false;
  for (let i = 0; i < manual.length; i++) {
    const before = await st();
    const t0 = Date.now();
    await click(ward(manual[i]), 'ward ' + manual[i]);
    await sleep(350);
    const mid = await st();
    if (i === 2 && !midShotDone) { await shot('manual_dial_in_progress'); midShotDone = true; }
    const w = await waitFor(`window.__widdershins.state().locked.length >= ${before.locked.length + 1}`, 5000);
    manualTimes.push(Date.now() - t0);
    const after = await st();
    const expect = norm(before.rot - mid.turning?.delta);
    const dirOk = mid.turning && mid.turning.delta > 0 && Math.abs(norm(after.rot - expect + 180) - 180) < 1.5;
    if (!dirOk) widdershinsOk = false;
    dirDetail.push(`${manual[i]}: ${Math.round(before.rot)}° −${mid.turning?.delta}° → ${Math.round(after.rot)}°`);
    const atLantern = await page.evaluate((id) => window.__widdershins.wardAngleAtLantern(id), manual[i]);
    assert(w.ok && mid.turning && mid.turning.ward === manual[i] && !mid.turning.captured && Math.abs(norm(atLantern + 180) - 180) < 1.5,
      'fence turns to ' + manual[i] + ', finial reaches the lantern, takes flame', 'turning observed at 350 ms, caught at ' + (Date.now() - t0) + ' ms, finial at ' + atLantern.toFixed(1) + '° from lantern');
  }
  assert(widdershinsOk, 'every turn went widdershins (rotation decreased by the announced delta)', dirDetail.join(' · '));
  s = await st();
  const wardsUI = await page.evaluate(() => document.querySelectorAll('.ward.caught').length);
  assert(manualTimes.every((t) => t >= 1000 && t <= 3600), 'each hand turn takes a turn plus a take (1.0–3.6 s)', manualTimes.join(', ') + ' ms');
  assert(s.locked.join() === manual.join(), 'six wards caught in press order', s.locked.join(' '));
  assert(s.caughtPickets === 6 && s.chainLinks === 5 && s.stonesLit === 6 && wardsUI === 6, 'ring did real work: 6 finials lit, 5 chain links bound, 6 wardstones, 6 fence buttons lit', JSON.stringify({ pickets: s.caughtPickets, chain: s.chainLinks, stones: s.stonesLit, buttons: wardsUI }));

  /* ================= D. No auto-fire ================= */
  say('\n== D. No auto-fire ==');
  await sleep(2500);
  s = await st();
  assert(s.stage === 'pending', 'sixth ward leaves the gate UNBARRED (pending), not open (2.5 s later)', 'stage=' + s.stage + ' elapsed=' + s.stageElapsed);
  const barGone = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#gatebar')).opacity) < 0.1);
  assert(barGone, 'the bar visibly lifts when unbarred', 'gatebar opacity < 0.1');
  const pendAp = await aperture();
  assert(pendAp.lum < 45, 'unbarred gate still dark', 'lum=' + pendAp.lum);
  await shot('pending_unbarred_no_autofire');
  await click(ward('Th'), 'ward Th while unbarred');
  await sleep(150);
  s = await st();
  assert(s.stage === 'pending' && s.warn.includes('on'), 'turning while unbarred is refused with a visible warning', s.warnText);

  /* ================= E. The bell: three stages ================= */
  say('\n== E. Bell: buildup → breakthrough → open ==');
  const rotPend = (await st()).rot;
  await click('#bell', 'RING THE BELL');
  let w = await waitFor("window.__widdershins.state().stage === 'buildup'", 1000);
  assert(w.ok, 'the bell starts BUILDUP', w.ms + ' ms');
  await waitFor('window.__widdershins.state().stageElapsed > 1300', 2000);
  s = await st();
  const buildAp = await aperture();
  await shot('stage1_buildup');
  assert(s.vel > 60 && s.rot !== rotPend, 'buildup spins the fence widdershins, accelerating', 'vel=' + s.vel + '°/s, rot ' + rotPend + ' → ' + s.rot);
  w = await waitFor("window.__widdershins.state().stage === 'breakthrough'", 3000);
  assert(w.ok, 'BUILDUP lasts ~2.4 s then BREAKTHROUGH', 'reached after ' + w.ms + ' ms of polling');
  const breakAp = await aperture();
  const raysUp = await page.evaluate(() => Array.from(document.querySelectorAll('#rays line')).filter((l) => parseFloat(getComputedStyle(l).opacity) > 0.3).length);
  await shot('stage2_breakthrough');
  await sleep(400);
  const leafOpen = await page.evaluate(() => { const m = getComputedStyle(document.querySelector('#leafL')).transform; const a = m.startsWith('matrix(') ? parseFloat(m.slice(7)) : 1; return a; });
  assert(raysUp >= 12, 'breakthrough throws witch-light rays', raysUp + '/16 visible');
  assert(leafOpen < 0.2, 'the leaves fling open (left leaf scaleX)', 'scaleX=' + leafOpen.toFixed(3));
  w = await waitFor("window.__widdershins.state().stage === 'active'", 2000);
  assert(w.ok, 'BREAKTHROUGH resolves into SUSTAINED OPEN', w.ms + ' ms');
  await sleep(800);
  const activeAp = await aperture();
  await shot('stage3_sustained_open');
  s = await st();
  assert(s.destination === 'THE WAKE AT CORVANE', 'the hand-turned address resolved to its road', s.destination);
  assert(s.vel === 20, 'open gate keeps the fence turning slowly widdershins', 'vel=' + s.vel);
  const d = (a, b) => Math.abs(a.lum - b.lum);
  assert(d(pendAp, buildAp) >= 25 && d(buildAp, breakAp) >= 25 && d(breakAp, activeAp) >= 25 && d(pendAp, activeAp) >= 25 && d(pendAp, breakAp) >= 25 && d(buildAp, activeAp) >= 25,
    'gate luminance distinct at every stage pair (≥25)', `pending ${pendAp.lum} · buildup ${buildAp.lum} · breakthrough ${breakAp.lum} · open ${activeAp.lum}`);
  assert(breakAp.lum > activeAp.lum && activeAp.sat > buildAp.sat, 'sustained open is calmer than breakthrough and more saturated than buildup', `lum ${breakAp.lum} → ${activeAp.lum}, sat ${buildAp.sat} → ${activeAp.sat}`);
  await click('#bell', 'RING THE BELL while open');
  await sleep(100); s = await st();
  assert(s.stage === 'active' && s.warn.includes('on'), 'bell while open is refused, gate stays open', s.warnText);

  /* ================= F. Bar the gate from open ================= */
  say('\n== F. Bar the gate from open ==');
  const barOk = await hitTest('#bar');
  assert(barOk.ok, 'BAR THE GATE reachable while the gate is open');
  await click('#bar', 'BAR THE GATE');
  await sleep(120); s = await st();
  assert(s.stage === 'idle' && s.locked.length === 0 && s.chainLinks === 0 && s.stonesLit === 0 && s.caughtPickets === 0, 'barring drops every ward, chain and stone, returns to idle', JSON.stringify({ stage: s.stage, locked: s.locked.length, chain: s.chainLinks }));
  await sleep(700);
  await shot('barred_cycle1');
  const idleAp2 = await aperture();
  assert(idleAp2.lum < 40, 'gate dark again after barring', 'lum=' + idleAp2.lum);

  /* ================= G. A remembered hand (quick-dial) ================= */
  say('\n== G. Remembered hand: staged auto-dial ==');
  await click(key('2'), 'KEY 2 THE DROWNED ORCHARD');
  const stamps = [];
  const kT0 = Date.now();
  let lastN = 0, midKeyShot = false;
  while (Date.now() - kT0 < 10000) {
    s = await st();
    if (s.locked.length !== lastN) { stamps.push({ n: s.locked.length, t: Date.now() - kT0 }); lastN = s.locked.length; }
    if (!midKeyShot && s.locked.length === 3 && s.turning) { await shot('autodial_sequence_in_progress'); midKeyShot = true; }
    if (s.locked.length >= 6) break;
    await sleep(25);
  }
  const gaps = stamps.map((x, i) => i ? x.t - stamps[i - 1].t : x.t);
  const keyTotal = stamps.length ? stamps[stamps.length - 1].t : 0;
  const handTotal = manualTimes.reduce((a, b) => a + b, 0);
  assert(stamps.length === 6 && stamps.every((x, i) => x.n === i + 1), 'the remembered hand catches all six wards one at a time', stamps.map((x) => x.n + '@' + x.t).join(' '));
  assert(gaps.every((g) => g >= 300), 'every remembered turn is a visible step (≥300 ms apart)', gaps.join(', ') + ' ms');
  assert(keyTotal >= 2500 && keyTotal <= 8000 && keyTotal < handTotal, 'remembered hand is faster than a living hand but never instantaneous', keyTotal + ' ms for 6 vs hand ' + handTotal + ' ms');
  assert(midKeyShot, 'mid-sequence screenshot captured with 3 caught and the fence turning');
  await sleep(2500); s = await st();
  assert(s.stage === 'pending' && s.preset === null, 'remembered hand lands UNBARRED with no auto-fire (2.5 s later)', 'stage=' + s.stage);
  assert(s.locked.join() === 'As,Ne,Ic,Du,Ky,Ho', 'the remembered address was caught in order', s.locked.join(' '));
  await shot('autodial_pending_unbarred');

  /* ================= H. Salt line interlock ================= */
  say('\n== H. Salt line interlock ==');
  await click('#bar', 'BAR THE GATE (clear for interlock test)');
  await sleep(100);
  await click('#salt', 'SALT LINE toggle (lay)');
  await sleep(150); s = await st();
  const saltUI = await page.evaluate(() => document.querySelector('#saltState').textContent + '/' + document.querySelector('#salt').getAttribute('aria-checked'));
  assert(s.salt === true && saltUI === 'LAID/true', 'salt is laid with a visible state change', saltUI);
  await click(ward('Ne'), 'ward Ne with salt laid');
  await sleep(150); s = await st();
  assert(s.locked.length === 0 && !s.turning && s.warn.includes('blink'), 'salt refuses a turn with a blinking warning', s.warnText);
  await shot('salt_refuses_turn');
  await click(key('1'), 'KEY 1 with salt laid');
  await sleep(150); s = await st();
  assert(s.locked.length === 0 && s.preset === null, 'salt refuses a remembered hand', s.warnText);
  await click('#bell', 'RING THE BELL with salt laid');
  await sleep(100); s = await st();
  assert(s.stage === 'idle', 'salt refuses the bell', s.warnText);
  await sleep(1800);
  const holdWarn = await page.evaluate(() => document.querySelector('#warn').className);
  assert(holdWarn.includes('on'), 'salt warning stays visible while the line is laid', holdWarn);
  await click('#salt', 'SALT LINE toggle (sweep away)');
  await sleep(150); s = await st();
  assert(s.salt === false && s.warn === '', 'salt is swept away and the warning clears', 'salt=' + s.salt);

  /* ================= I. Cycle 2: key → bell → open → bar ================= */
  say('\n== I. Full second cycle ==');
  await click(key('4'), 'KEY 4 HOLLOWMAS LANE');
  w = await waitFor("window.__widdershins.state().stage === 'pending'", 10000);
  assert(w.ok, 'cycle 2: remembered hand reaches unbarred', w.ms + ' ms');
  await click('#bell', 'RING THE BELL (cycle 2)');
  w = await waitFor("window.__widdershins.state().stage === 'active'", 5000);
  assert(w.ok, 'cycle 2: the gate opens', w.ms + ' ms');
  await sleep(500);
  s = await st();
  assert(s.destination === 'HOLLOWMAS LANE', 'cycle 2 resolved its road', s.destination);
  await shot('open_cycle2');
  await click('#bar', 'BAR THE GATE (cycle 2)');
  await sleep(150); s = await st();
  assert(s.stage === 'idle' && s.locked.length === 0, 'cycle 2 barred to idle', 'stage=' + s.stage);
  await sleep(600);
  await shot('barred_cycle2');

  /* ================= J. Bar mid-sequence ================= */
  say('\n== J. Bar the gate mid-sequence ==');
  await click(key('5'), "KEY 5 THE WIDOW'S STAIR");
  await waitFor("window.__widdershins.state().locked.length >= 2", 6000);
  await click('#bar', 'BAR THE GATE mid-remembered-hand');
  await sleep(100); s = await st();
  const mid1 = s.locked.length;
  await sleep(1500); s = await st();
  assert(mid1 === 0 && s.locked.length === 0 && s.preset === null && s.stage === 'idle' && !s.turning, 'barring mid-hand cancels the remaining turns', 'locked after 1.5 s = ' + s.locked.length);
  await click(key('1'), 'KEY 1 CANDLEMERE');
  await waitFor("window.__widdershins.state().stage === 'pending'", 10000);
  await click('#bell', 'RING THE BELL');
  await waitFor("window.__widdershins.state().stageElapsed > 800 && window.__widdershins.state().stage === 'buildup'", 2000);
  await click('#bar', 'BAR THE GATE mid-buildup');
  await sleep(100); s = await st();
  const midB = s.stage;
  await sleep(2600); s = await st();
  assert(midB === 'idle' && s.stage === 'idle', 'barring mid-buildup aborts: never reaches breakthrough or open', 'stage now ' + s.stage);

  /* ================= K. The dark road ================= */
  say("\n== K. Nobody's Parish (something knocks back) ==");
  await click(key('3'), "KEY 3 NOBODY'S PARISH");
  w = await waitFor("window.__widdershins.state().stage === 'pending'", 10000);
  assert(w.ok, 'the dark key still catches fully and lands unbarred', w.ms + ' ms');
  await click('#bell', 'RING THE BELL (dark road)');
  w = await waitFor("window.__widdershins.state().stage === 'refused'", 6000);
  assert(w.ok, 'the dark road goes through buildup and breakthrough, then the gate shuts itself', w.ms + ' ms');
  await sleep(300);
  const candleOut = await page.evaluate(() => document.querySelector('#lantern').classList.contains('out'));
  await shot('dark_road_gate_shuts_itself');
  assert(candleOut, 'the candle goes out when the gate shuts itself');
  w = await waitFor("window.__widdershins.state().stage === 'idle'", 2500);
  s = await st();
  assert(w.ok && s.locked.length === 0, 'the refusal clears the gatehouse to idle', 'stage=' + s.stage + ' locked=' + s.locked.length);
  await sleep(1500);
  const candleBack = await page.evaluate(() => !document.querySelector('#lantern').classList.contains('out'));
  assert(candleBack, 'the candle relights');

  /* ================= L. Rapid input queue + misc refusals ================= */
  say('\n== L. Rapid input and refusals ==');
  await click('#bell', 'RING THE BELL from idle');
  await sleep(100); s = await st();
  assert(s.stage === 'idle' && s.warn.includes('on'), 'bell with nothing caught is refused', s.warnText);
  for (const id of ['Ic', 'Ow', 'Th']) {
    const h = await hitTest(ward(id));
    await page.mouse.click(h.x, h.y);
  }
  s = await st();
  const inFlight = s.queue.length + (s.turning ? 1 : 0);
  w = await waitFor("window.__widdershins.state().locked.length >= 3", 9000);
  s = await st();
  assert(inFlight >= 2 && w.ok && s.locked.join() === 'Ic,Ow,Th', 'three presses faster than the turn are queued and all catch in order', 'in flight right after presses: ' + inFlight + ', caught: ' + s.locked.join(' '));
  await click(ward('Ow'), 'duplicate ward Ow');
  await sleep(100); s = await st();
  assert(s.locked.length === 3 && s.warn.includes('on'), 'a duplicate ward is refused', s.warnText);
  await click(key('2'), 'KEY 2 with a partial address');
  await sleep(100); s = await st();
  assert(s.locked.length === 3 && s.preset === null, 'a remembered hand is refused while wards are partly caught', s.warnText);
  await click('#bell', 'RING THE BELL with 3 of 6');
  await sleep(100); s = await st();
  assert(s.stage === 'idle' && s.warn.includes('on'), 'bell with a partial address is refused', s.warnText);
  await click('#bar', 'BAR THE GATE (clean up)');

  /* ================= M. Gate-book and chrome ================= */
  say('\n== M. Gate-book and chrome ==');
  await click('#guideBtn', 'gate-book button');
  await sleep(150);
  const gv = await page.evaluate(() => !document.querySelector('#guide').hidden);
  assert(gv, 'gate-book opens');
  await shot('gatebook_open');
  await click('#guideClose', 'gate-book close');
  await sleep(150);
  assert(await page.evaluate(() => document.querySelector('#guide').hidden), 'gate-book closes');
  await click('#soundBtn', 'sound toggle');
  const sb = await page.evaluate(() => document.querySelector('#soundBtn').textContent);
  assert(sb === 'SOUND OFF', 'sound toggle flips', sb);
  await click('#soundBtn', 'sound toggle back');

  /* ================= N. Console ================= */
  say('\n== N. Console ==');
  assert(consoleErrors.length === 0, 'no page errors or console errors during the run', consoleErrors.join(' | ') || 'clean');

  /* ================= summary ================= */
  const pass = results.filter((r) => r.ok).length, fail = results.length - pass;
  say(`\n${pass}/${results.length} checks passed, ${fail} failed. ${shotIndex} screenshots in test/screenshots/.`);
  fs.writeFileSync(path.join(__dirname, 'last-run.log'), out.join('\n') + '\n');
  await browser.close();
  server.close();
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
