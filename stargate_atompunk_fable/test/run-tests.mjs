/* AUREOLE — end-to-end verification with real dispatched pointer events.
 *
 * Runs the static server on a test port, drives headless Chrome through
 * puppeteer-core, hit-tests every control at its rendered position before
 * clicking it, times every shell capture from the outside (so per-shell
 * staging is measured, not assumed), and measures the aperture from actual
 * screenshots so the three activation stages are proven distinct from each
 * other, not just from idle.
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

const PORT = 8753;
const SHOTS = path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
for (const f of fs.readdirSync(SHOTS)) if (f.endsWith('.png')) fs.unlinkSync(path.join(SHOTS, f));

function findChrome() {
  const cands = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ].filter(Boolean);
  for (const c of cands) if (fs.existsSync(c)) return c;
  throw new Error('No Chrome found. Set CHROME_PATH.');
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

async function main() {
  const server = startServer(PORT);
  await sleep(300);
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required', '--window-size=1920,1080']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('console: ' + m.text()); });

  const url = `http://localhost:${PORT}/`;
  const st = () => page.evaluate(() => window.__aureole.state());
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
  /* Click an isotope and time the capture from outside the page. */
  async function seat(id, label) {
    const before = (await st()).locked.length;
    const t0 = Date.now();
    if (!(await click('.iso[data-iso="' + id + '"]', 'isotope ' + id))) return null;
    let sawHunt = false;
    const w = await waitFor(`window.__aureole.state().locked.length >= ${before + 1}`, 4000);
    // hunting is observed by a separate quick poll right after the click
    sawHunt = !!(await page.evaluate(() => window.__aureole.state().hunting)) || w.ms > 600;
    return { ms: Date.now() - t0, ok: w.ok, sawHunt };
  }
  /* Poll lock-count increments during an automatic sequence. */
  async function timeSequence(target, timeout) {
    const t0 = Date.now(); const stamps = []; let last = (await st()).locked.length;
    while (Date.now() - t0 < timeout) {
      const s = await st();
      if (s.locked.length !== last) { stamps.push({ n: s.locked.length, t: Date.now() - t0 }); last = s.locked.length; }
      if (s.locked.length >= target) break;
      await sleep(25);
    }
    return stamps;
  }

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
  assert(s.stage === 'idle' && s.locked.length === 0, 'cold start is idle with no shells seated', JSON.stringify({ stage: s.stage, locked: s.locked }));
  assert(s.shutter === false, 'lead shutter defaults to RELEASED', 'shutter=' + s.shutter);
  assert(s.warn === '', 'no warning shown on cold start');
  const guideHidden = await page.evaluate(() => document.querySelector('#guide').hidden && getComputedStyle(document.querySelector('#guide')).display === 'none');
  assert(guideHidden, 'guide overlay hidden on cold start ([hidden] reset effective)');
  const idleAp = await aperture();
  assert(idleAp.lum < 40, 'idle aperture is dark', 'lum=' + idleAp.lum);
  // idle ambient: electrons move but nothing dials itself
  const a0 = await page.evaluate(() => document.querySelectorAll('#electrons circle')[0].getAttribute('cx'));
  await sleep(400);
  const a1 = await page.evaluate(() => document.querySelectorAll('#electrons circle')[0].getAttribute('cx'));
  assert(a0 !== a1, 'idle ring is ambient (electron K moved)', a0 + ' → ' + a1);
  s = await st();
  assert(s.locked.length === 0 && s.stage === 'idle', 'idle never dials itself', 'after 1s: locked=' + s.locked.length);
  await shot('cold_start_1080p');

  /* ================= B. Geometry ================= */
  say('\n== B. Control geometry ==');
  const controls = ['#excite', '#discharge', '#shutter', ...Array.from({ length: 12 }, (_, i) => `.iso:nth-of-type(${i + 1})`).map(() => null).filter(Boolean)];
  const isoIds = await page.evaluate(() => Array.from(document.querySelectorAll('.iso')).map((b) => b.dataset.iso));
  const presetIds = await page.evaluate(() => Array.from(document.querySelectorAll('.preset')).map((b) => b.dataset.preset));
  let geomOk = true; const geomDetail = [];
  for (const sel of ['#excite', '#discharge', '#shutter', ...isoIds.map((i) => `.iso[data-iso="${i}"]`), ...presetIds.map((p) => `.preset[data-preset="${p}"]`)]) {
    const h = await hitTest(sel);
    if (!h.ok) { geomOk = false; geomDetail.push(sel + ' → ' + h.top); }
  }
  assert(geomOk, 'all 20 core controls reachable at their rendered centres (elementFromPoint)', geomOk ? '3 cluster controls + 12 isotopes + 5 cams' : geomDetail.join('; '));
  const inView = await page.evaluate(() => {
    const bad = [];
    for (const e of document.querySelectorAll('.iso, .preset, #excite, #discharge, #shutter, #status, #manifest, #spectrum, #telemetry, #log')) {
      const r = e.getBoundingClientRect();
      if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) bad.push(e.id || e.className);
    }
    return bad;
  });
  assert(inView.length === 0, 'every control and readout lies inside the 1080p viewport', inView.join(', ') || 'ok');

  /* ================= C. Manual dial ================= */
  say('\n== C. Manual dial (hand tuning) ==');
  const manual = ['Vx', 'Kw', 'Gv', 'Qo', 'Py', 'Xa', 'Jr'];
  const manualTimes = [];
  let midShotDone = false;
  for (let i = 0; i < manual.length; i++) {
    const before = (await st()).locked.length;
    const t0 = Date.now();
    await click('.iso[data-iso="' + manual[i] + '"]', 'isotope ' + manual[i]);
    await sleep(350);
    const mid = await st();
    if (i === 3 && !midShotDone) { await shot('manual_dial_in_progress'); midShotDone = true; }
    const w = await waitFor(`window.__aureole.state().locked.length >= ${before + 1}`, 4000);
    manualTimes.push(Date.now() - t0);
    assert(w.ok && mid.hunting && mid.hunting.iso === manual[i] && !mid.hunting.captured, 'shell ' + mid.hunting?.shell + ' hunts then seats ' + manual[i], 'hunting observed at 350 ms, seated at ' + (Date.now() - t0) + ' ms');
  }
  const shellsDidWork = await page.evaluate(() => ({
    lockedShells: document.querySelectorAll('#shells .shell.locked').length,
    lockedSeats: document.querySelectorAll('.seat.locked').length,
    nucleus: Array.from(document.querySelectorAll('#nucleus circle')).filter((c) => !c.classList.contains('hidden')).length
  }));
  s = await st();
  assert(manualTimes.every((t) => t >= 1100 && t <= 2200), 'each hand-tuned shell takes a hunt plus a capture (1.1–2.2 s)', manualTimes.join(', ') + ' ms');
  assert(s.locked.join() === manual.join(), 'seven isotopes seated in click order', s.locked.join(' '));
  assert(shellsDidWork.lockedShells === 7 && shellsDidWork.lockedSeats === 7 && shellsDidWork.nucleus === 7, 'ring did real work: 7 shells lit, 7 seats filled, 7 nucleus dots', JSON.stringify(shellsDidWork));
  assert(s.lampsLit === 7 && s.specLines === 7, 'manifest lamps and spectrograph lines follow the shells', 'lamps=' + s.lampsLit + ' lines=' + s.specLines);
  const shellRadiusPending = await page.evaluate(() => window.__aureole.shellRadius(6));

  /* ================= D. No auto-fire ================= */
  say('\n== D. No auto-fire ==');
  await sleep(2500);
  s = await st();
  assert(s.stage === 'pending', 'seventh shell leaves the console PENDING, not open (2.5 s later)', 'stage=' + s.stage + ' elapsed=' + s.stageElapsed);
  const pendAp = await aperture();
  assert(pendAp.lum < 45, 'pending aperture still dark', 'lum=' + pendAp.lum);
  await shot('pending_ready_no_autofire');
  await click('.iso[data-iso="Vx"]', 'used isotope Vx while pending');
  await sleep(150);
  s = await st();
  assert(s.stage === 'pending' && s.warn.includes('on'), 'reseating while pending is refused with a visible warning', s.warnText);

  /* ================= E. Three-stage excitation ================= */
  say('\n== E. Excitation: buildup → breakthrough → active ==');
  await click('#excite', 'EXCITE');
  let w = await waitFor("window.__aureole.state().stage === 'buildup'", 1000);
  assert(w.ok, 'EXCITE starts BUILDUP', w.ms + ' ms');
  await waitFor('window.__aureole.state().stageElapsed > 1300', 2000);
  const shellRadiusBuild = await page.evaluate(() => window.__aureole.shellRadius(6));
  const buildAp = await aperture();
  await shot('stage1_buildup');
  assert(shellRadiusBuild < shellRadiusPending * 0.85, 'buildup contracts the shells (outer shell Q radius)', shellRadiusPending + ' → ' + shellRadiusBuild);
  w = await waitFor("window.__aureole.state().stage === 'breakthrough'", 3000);
  assert(w.ok, 'BUILDUP lasts ~2.3 s then BREAKTHROUGH', 'reached after ' + w.ms + ' ms of polling');
  const breakAp = await aperture();
  const spikesUp = await page.evaluate(() => Array.from(document.querySelectorAll('#spikes line')).filter((l) => parseFloat(l.getAttribute('opacity')) > 0.3).length);
  await shot('stage2_breakthrough');
  assert(spikesUp >= 12, 'breakthrough shoots the starburst spikes', spikesUp + '/16 visible');
  w = await waitFor("window.__aureole.state().stage === 'active'", 2000);
  assert(w.ok, 'BREAKTHROUGH resolves into SUSTAINED ACTIVE', w.ms + ' ms');
  await sleep(700);
  const activeAp = await aperture();
  await shot('stage3_sustained_active');
  s = await st();
  assert(s.destination === 'PALOMAR SPRINGS', 'hand-tuned address resolved to its destination', s.status);
  const d = (a, b) => Math.abs(a.lum - b.lum);
  assert(d(pendAp, buildAp) >= 25 && d(buildAp, breakAp) >= 25 && d(breakAp, activeAp) >= 25 && d(pendAp, activeAp) >= 25 && d(pendAp, breakAp) >= 25 && d(buildAp, activeAp) >= 25,
    'aperture luminance distinct at every stage pair (≥25)', `pending ${pendAp.lum} · buildup ${buildAp.lum} · breakthrough ${breakAp.lum} · active ${activeAp.lum}`);
  const halo = await page.evaluate(() => Array.from(document.querySelectorAll('#spikes line')).filter((l) => parseFloat(l.getAttribute('opacity')) > 0.3).length);
  assert(halo >= 12 && breakAp.lum > activeAp.lum, 'sustained state keeps a starburst halo but is visibly calmer than breakthrough', 'halo ' + halo + '/16, lum ' + breakAp.lum + ' → ' + activeAp.lum);
  await click('#excite', 'EXCITE while open');
  await sleep(100); s = await st();
  assert(s.stage === 'active' && s.warn.includes('on'), 'EXCITE while open is refused, threshold stays open', s.warnText);

  /* ================= F. Discharge cycle 1 ================= */
  say('\n== F. Discharge from open ==');
  const disOk = await hitTest('#discharge');
  assert(disOk.ok, 'DISCHARGE reachable while threshold is open');
  await click('#discharge', 'DISCHARGE');
  await sleep(120); s = await st();
  assert(s.stage === 'idle' && s.locked.length === 0 && s.lampsLit === 0 && s.specLines === 0, 'discharge drops every shell and returns to idle', JSON.stringify({ stage: s.stage, locked: s.locked.length, lamps: s.lampsLit }));
  await sleep(600);
  await shot('disengaged_cycle1');
  const idleAp2 = await aperture();
  assert(idleAp2.lum < 40, 'aperture dark again after discharge', 'lum=' + idleAp2.lum);

  /* ================= G. Preset cam (auto-dial) ================= */
  say('\n== G. Preset cam: staged auto-dial ==');
  await click('.preset[data-preset="2"]', 'CAM 2 SKYLINE MESA');
  const camStamps = [];
  const camT0 = Date.now();
  let lastN = 0, midCamShot = false;
  while (Date.now() - camT0 < 9000) {
    s = await st();
    if (s.locked.length !== lastN) { camStamps.push({ n: s.locked.length, t: Date.now() - camT0 }); lastN = s.locked.length; }
    if (!midCamShot && s.locked.length === 3 && s.hunting) { await shot('autodial_sequence_in_progress'); midCamShot = true; }
    if (s.locked.length >= 7) break;
    await sleep(25);
  }
  const gaps = camStamps.map((x, i) => i ? x.t - camStamps[i - 1].t : x.t);
  const camTotal = camStamps.length ? camStamps[camStamps.length - 1].t : 0;
  assert(camStamps.length === 7 && camStamps.every((x, i) => x.n === i + 1), 'cam seats all seven shells one at a time', camStamps.map((x) => x.n + '@' + x.t).join(' '));
  assert(gaps.every((g) => g >= 300), 'every cam stop is a visible step (≥300 ms apart)', gaps.join(', ') + ' ms');
  assert(camTotal >= 2500 && camTotal <= 6000, 'cam is faster than hand tuning but never instantaneous', camTotal + ' ms for 7 vs hand ' + manualTimes.reduce((a, b) => a + b, 0) + ' ms');
  assert(midCamShot, 'mid-sequence screenshot captured with 3 seated and shell N hunting');
  await sleep(2500); s = await st();
  assert(s.stage === 'pending' && s.preset === null, 'cam landing state is PENDING with no auto-fire (2.5 s later)', 'stage=' + s.stage);
  assert(s.locked.join() === 'Yx,Ux,Fz,Wq,Vx,Zq,Kw', 'cam seated the stored address', s.locked.join(' '));
  await shot('autodial_pending_ready');

  /* ================= H. Lead shutter interlock ================= */
  say('\n== H. Lead shutter interlock ==');
  await click('#discharge', 'DISCHARGE (clear for interlock test)');
  await sleep(100);
  await click('#shutter', 'LEAD SHUTTER toggle (engage)');
  await sleep(150); s = await st();
  const shState = await page.evaluate(() => document.querySelector('#shutterState').textContent + '/' + document.querySelector('#shutter').getAttribute('aria-checked'));
  assert(s.shutter === true && shState === 'ENGAGED/true', 'shutter engages with a visible state change', shState);
  await click('.iso[data-iso="Jr"]', 'isotope Jr with shutter engaged');
  await sleep(150); s = await st();
  assert(s.locked.length === 0 && !s.hunting && s.warn.includes('blink'), 'engaged shutter refuses capture with a blinking warning', s.warnText);
  await shot('shutter_refuses_capture');
  await click('.preset[data-preset="1"]', 'CAM 1 with shutter engaged');
  await sleep(150); s = await st();
  assert(s.locked.length === 0 && s.preset === null, 'engaged shutter refuses a cam', s.warnText);
  await click('#excite', 'EXCITE with shutter engaged');
  await sleep(100); s = await st();
  assert(s.stage === 'idle', 'engaged shutter refuses excitation', s.warnText);
  await sleep(1800);
  const holdWarn = await page.evaluate(() => document.querySelector('#warn').className);
  assert(holdWarn.includes('on'), 'shutter warning stays visible while engaged', holdWarn);
  await click('#shutter', 'LEAD SHUTTER toggle (release)');
  await sleep(150); s = await st();
  assert(s.shutter === false && s.warn === '', 'shutter releases and the warning clears', 'shutter=' + s.shutter);

  /* ================= I. Cycle 2: cam → excite → open → discharge ================= */
  say('\n== I. Full second cycle ==');
  await click('.preset[data-preset="4"]', 'CAM 4 CORAL TERRACE');
  w = await waitFor("window.__aureole.state().stage === 'pending'", 9000);
  assert(w.ok, 'cycle 2: cam reaches pending', w.ms + ' ms');
  await click('#excite', 'EXCITE (cycle 2)');
  w = await waitFor("window.__aureole.state().stage === 'active'", 5000);
  assert(w.ok, 'cycle 2: threshold opens', w.ms + ' ms');
  await sleep(500);
  s = await st();
  assert(s.destination === 'CORAL TERRACE', 'cycle 2 resolved its destination', s.status);
  await shot('active_cycle2');
  await click('#discharge', 'DISCHARGE (cycle 2)');
  await sleep(150); s = await st();
  assert(s.stage === 'idle' && s.locked.length === 0, 'cycle 2 discharged to idle', 'stage=' + s.stage);
  await sleep(500);
  await shot('disengaged_cycle2');

  /* ================= J. Discharge mid-buildup and mid-cam ================= */
  say('\n== J. Discharge mid-sequence ==');
  await click('.preset[data-preset="5"]', 'CAM 5 TWILITE JUNCTION');
  await waitFor("window.__aureole.state().locked.length >= 2", 5000);
  await click('#discharge', 'DISCHARGE mid-cam');
  await sleep(100); s = await st();
  const mid1 = s.locked.length;
  await sleep(1500); s = await st();
  assert(mid1 === 0 && s.locked.length === 0 && s.preset === null && s.stage === 'idle', 'discharge mid-cam cancels the remaining stops', 'locked after 1.5 s = ' + s.locked.length);
  await click('.preset[data-preset="1"]', 'CAM 1 PALOMAR SPRINGS');
  await waitFor("window.__aureole.state().stage === 'pending'", 9000);
  await click('#excite', 'EXCITE');
  await waitFor("window.__aureole.state().stageElapsed > 800 && window.__aureole.state().stage === 'buildup'", 2000);
  await click('#discharge', 'DISCHARGE mid-buildup');
  await sleep(100); s = await st();
  const midB = s.stage;
  await sleep(2600); s = await st();
  assert(midB === 'idle' && s.stage === 'idle', 'discharge mid-buildup aborts: never reaches breakthrough or open', 'stage now ' + s.stage);

  /* ================= K. Dark route ================= */
  say('\n== K. Dark route (no answering resonance) ==');
  await click('.preset[data-preset="3"]', 'CAM 3 MOONGLOW COURT');
  w = await waitFor("window.__aureole.state().stage === 'pending'", 9000);
  assert(w.ok, 'dark cam still seats fully and lands pending', w.ms + ' ms');
  await click('#excite', 'EXCITE (dark route)');
  w = await waitFor("window.__aureole.state().stage === 'collapse'", 5000);
  assert(w.ok, 'dark route goes through buildup and breakthrough, then collapses', w.ms + ' ms');
  await sleep(300);
  await shot('dark_route_collapse');
  w = await waitFor("window.__aureole.state().stage === 'idle'", 2000);
  s = await st();
  assert(w.ok && s.locked.length === 0, 'collapse clears the console to idle', 'stage=' + s.stage + ' locked=' + s.locked.length);

  /* ================= L. Rapid input queue + misc refusals ================= */
  say('\n== L. Rapid input and refusals ==');
  await click('#excite', 'EXCITE from idle');
  await sleep(100); s = await st();
  assert(s.stage === 'idle' && s.warn.includes('on'), 'EXCITE with nothing seated is refused', s.warnText);
  for (const id of ['Fz', 'Zq', 'Ux']) {
    const h = await hitTest('.iso[data-iso="' + id + '"]');
    await page.mouse.click(h.x, h.y);
  }
  s = await st();
  const queuedNow = s.queue.length + (s.hunting ? 1 : 0);
  w = await waitFor("window.__aureole.state().locked.length >= 3", 6000);
  s = await st();
  assert(queuedNow >= 2 && w.ok && s.locked.join() === 'Fz,Zq,Ux', 'three clicks faster than the hunt are queued and all seat in order', 'in flight right after clicks: ' + queuedNow + ', seated: ' + s.locked.join(' '));
  await click('.iso[data-iso="Zq"]', 'duplicate isotope Zq');
  await sleep(100); s = await st();
  assert(s.locked.length === 3 && s.warn.includes('on'), 'a duplicate isotope is refused', s.warnText);
  await click('.preset[data-preset="2"]', 'CAM 2 with a partial address');
  await sleep(100); s = await st();
  assert(s.locked.length === 3 && s.preset === null, 'a cam is refused while shells are partly seated', s.warnText);
  await click('#discharge', 'DISCHARGE (clean up)');

  /* ================= M. Guide ================= */
  say('\n== M. Guide and chrome ==');
  await click('#guideBtn', 'guide button');
  await sleep(150);
  const gv = await page.evaluate(() => !document.querySelector('#guide').hidden);
  assert(gv, 'guide opens');
  await shot('guide_open');
  await click('#guideClose', 'guide close');
  await sleep(150);
  assert(await page.evaluate(() => document.querySelector('#guide').hidden), 'guide closes');
  await click('#soundBtn', 'sound toggle');
  const sb = await page.evaluate(() => document.querySelector('#soundBtn').textContent);
  assert(sb === 'SOUND OFF', 'sound toggle flips', sb);
  await click('#soundBtn', 'sound toggle back');

  /* ================= N. Errors ================= */
  say('\n== N. Console ==');
  assert(consoleErrors.length === 0, 'no page errors or console errors during the run', consoleErrors.join(' | ') || 'clean');

  const pass = results.filter((r) => r.ok).length;
  say(`\n${pass}/${results.length} checks passed`);
  fs.writeFileSync(path.join(__dirname, 'last-run.log'), out.join('\n') + '\n');
  await browser.close();
  server.close();
  process.exit(pass === results.length ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
