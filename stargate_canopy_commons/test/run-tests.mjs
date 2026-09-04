/* TRELLIS — end-to-end verification with real dispatched pointer events.
 *
 * Runs the static server on a test port, drives a headless Chrome through
 * puppeteer-core, hit-tests every control at its rendered position before
 * clicking it, and measures the aperture from actual screenshots so the three
 * activation stages are proven distinct from each other, not just from idle.
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

const PORT = 8729;
const SHOTS = path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

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

const results = [];
let shotIndex = 0;
function assert(cond, label, detail) {
  results.push({ ok: !!cond, label, detail });
  console.log((cond ? '  PASS  ' : '  FAIL  ') + label + (detail !== undefined ? '  — ' + detail : ''));
  return !!cond;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  const st = () => page.evaluate(() => window.__trellis.state());
  const shot = async (name, opts = {}) => {
    shotIndex++;
    const file = path.join(SHOTS, String(shotIndex).padStart(2, '0') + '_' + name + '.png');
    await page.screenshot({ path: file, ...opts });
    console.log('        shot -> ' + path.relative(process.cwd(), file));
    return file;
  };
  async function waitFor(fn, timeout, label) {
    const t0 = Date.now();
    let polls = 0;
    while (Date.now() - t0 < timeout) {
      const v = await page.evaluate(fn);
      polls++;
      if (v) return { ok: true, ms: Date.now() - t0, polls };
      await sleep(40);
    }
    return { ok: false, ms: Date.now() - t0, polls, label };
  }
  async function rect(selector) {
    return page.evaluate((sel) => {
      const e = document.querySelector(sel);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
    }, selector);
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
  /* Measure the aperture from a real screenshot: mean luminance and warmth (R-B)
   * over the inner 80% of the disc. Two stages are "distinct" by their distance
   * in that plane, which is the right metric for a daylight aperture where
   * luminance alone cannot separate cream from white-gold. */
  async function aperture() {
    const r = await rect('#aperture');
    const rad = r.w / 2;
    const clip = { x: Math.round(r.x - rad), y: Math.round(r.y - rad), width: Math.round(rad * 2), height: Math.round(rad * 2) };
    const buf = await page.screenshot({ clip });
    const png = PNG.sync.read(buf);
    let n = 0, lum = 0, warm = 0, sat = 0;
    const c = png.width / 2, lim = (rad * 0.8) ** 2;
    for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
      if ((x - c) ** 2 + (y - c) ** 2 > lim) continue;
      const i = (y * png.width + x) * 4;
      const R = png.data[i], G = png.data[i + 1], B = png.data[i + 2];
      lum += 0.2126 * R + 0.7152 * G + 0.0722 * B;
      warm += R - B;
      sat += Math.max(R, G, B) - Math.min(R, G, B);
      n++;
    }
    return { lum: +(lum / n).toFixed(1), warm: +(warm / n).toFixed(1), sat: +(sat / n).toFixed(1) };
  }
  const dist = (a, b) => Math.hypot(a.lum - b.lum, a.warm - b.warm);

  try {
    console.log('\n== TRELLIS end-to-end ==\n' + url + '\n');

    /* ---- 1. load ---- */
    console.log('[1] load and identity');
    await page.goto(url, { waitUntil: 'load' });
    await sleep(600);
    assert(await page.title() === 'TRELLIS — Hollin Reach Canopy Commons · Sunspan Ring', 'title', await page.title());
    const ver = await page.evaluate(async () => (await fetch('version.json')).json());
    assert(ver.version === '1.0.0' && ver.model === 'Claude Fable 5.1', 'version.json version and model', JSON.stringify(ver));
    assert(await page.evaluate(() => document.getElementById('corner-version').textContent) === 'v1.0.0', 'corner version readout');
    let s = await st();
    assert(s.phase === 'idle', 'cold start phase is idle', s.phase);
    assert(s.latch === false, 'quiet-hours latch defaults to released', String(s.latch));
    assert(s.route.length === 0 && s.pool === 0 && s.bays.every((b) => b.open === 0 && b.conduit === 0), 'cold start: no shares, bays closed, pool empty');
    assert(await page.evaluate(() => document.getElementById('guide').hidden && document.getElementById('banner').hidden), 'guide and banner hidden on cold start');

    /* ---- 2. viewport fit ---- */
    console.log('[2] viewport fit');
    const tf1 = await page.evaluate(() => getComputedStyle(document.getElementById('stage')).transform);
    assert(tf1 && tf1 !== 'none', 'stage transform applied at 1920x1080', tf1);
    assert(Math.abs(parseFloat(s.fit) - 1) < 0.001, '--fit is 1 at 1920x1080', s.fit);
    await page.setViewport({ width: 3840, height: 2160 });
    await sleep(300);
    const tf2 = await page.evaluate(() => getComputedStyle(document.getElementById('stage')).transform);
    const fit2 = await page.evaluate(() => getComputedStyle(document.getElementById('stage')).getPropertyValue('--fit').trim());
    assert(tf2 && tf2 !== 'none' && Math.abs(parseFloat(fit2) - 2) < 0.001, 'stage scales to 4K (3840x2160)', 'transform=' + tf2 + ' --fit=' + fit2);
    const stageBox = await rect('#stage');
    assert(Math.abs(stageBox.w - 3840) < 2 && Math.abs(stageBox.h - 2160) < 2, 'stage fills the 4K viewport', JSON.stringify(stageBox));
    await shot('cold_start_4k');
    await page.setViewport({ width: 1920, height: 1080 });
    await sleep(300);
    await shot('cold_start_1080p');

    /* ---- 3. control reachability ---- */
    console.log('[3] every core control is reachable at its rendered position');
    const wmIds = await page.evaluate(() => window.__trellis.waymarks);
    let reach = 0;
    for (const id of wmIds) { const h = await hitTest('.wm[data-wid="' + id + '"]'); if (h.ok) reach++; }
    assert(reach === wmIds.length, 'all ' + wmIds.length + ' waymark tiles hit-test clean', reach + '/' + wmIds.length);
    for (const sel of ['#btn-open', '#btn-fold', '#btn-latch', '#btn-guide', '#btn-sound']) {
      const h = await hitTest(sel); assert(h.ok, 'reachable ' + sel, h.ok ? '' : 'topmost ' + h.top);
    }
    const routeIds = (await page.evaluate(() => window.__trellis.routes)).map((r) => r.id);
    let rreach = 0;
    for (const id of routeIds) { const h = await hitTest('.route[data-route="' + id + '"]'); if (h.ok) rreach++; }
    assert(rreach === routeIds.length, 'all ' + routeIds.length + ' ledger routes hit-test clean', rreach + '/' + routeIds.length);

    /* ---- 4. manual dial, clicks faster than the animation ---- */
    console.log('[4] manual dial — seven rapid clicks must all register and lock in order');
    const manual = ['rainbreak', 'stargap', 'meridian', 'wellspring', 'beeway', 'duskfold', 'mossline'];
    const tManual0 = Date.now();
    const hoopSamples = [];
    for (const id of manual) { await click('.wm[data-wid="' + id + '"]', 'waymark ' + id); await sleep(90); }
    s = await st();
    const registered = s.route.length + s.queue.length + (s.pledging ? 1 : 0);
    assert(registered === 7, 'all seven rapid clicks registered (held + in flight + queued)', 'held ' + s.route.length + ', in flight ' + (s.pledging || 'none') + ', queued ' + s.queue.length);
    let mid = await waitFor(() => { const s = window.__trellis.state(); return s.route.length >= 3 && s.bays[2].open > 0.2; }, 12000);
    assert(mid.ok, 'third share locks within 12s', mid.ms + 'ms');
    s = await st();
    hoopSamples.push(s.hoop);
    await shot('manual_dial_in_progress');
    assert(s.phase === 'dialing' && s.bays[2].open > 0 && s.bays[3].open === 0, 'mid-dial: bay 3 open, bay 4 still closed', 'bay3 open=' + s.bays[2].open.toFixed(2) + ' bay4 open=' + s.bays[3].open);
    const conduitMid = s.bays.map((b) => +b.conduit.toFixed(2));
    let full = await waitFor(() => window.__trellis.state().phase === 'pending', 20000);
    const tManual = Date.now() - tManual0;
    assert(full.ok, 'all seven shares held → pending', tManual + 'ms total');
    s = await st();
    assert(JSON.stringify(s.route) === JSON.stringify(manual), 'route holds the seven waymarks in click order', s.route.join(','));
    assert(s.bays.every((b) => b.open === 1 && b.conduit === 1 && b.wid), 'all seven bays open with conduits full', s.bays.map((b) => b.wid).join(','));
    assert(Math.abs(s.pool - 1) < 0.001, 'pool rim full', s.pool.toFixed(3));
    assert(tManual > 7 * 1100, 'manual pace is genuinely staged (over 7.7s for seven)', tManual + 'ms');
    hoopSamples.push(s.hoop);
    assert(Math.abs(hoopSamples[0] - hoopSamples[1]) > 5, 'the hoop slewed between the third and the seventh share', hoopSamples.map((h) => h.toFixed(1)).join(' → '));
    // geometric check: every held waymark sits under its bay
    const geom = await page.evaluate(() => {
      const s = window.__trellis.state();
      const N = window.__trellis.waymarks;
      const step = 360 / N.length;
      const bayAngle = (i) => -90 + i * (360 / 7);
      const wrap = (d) => ((d + 180) % 360 + 360) % 360 - 180;
      const k = N.indexOf(s.route[6]);
      return { err: Math.abs(wrap(k * step + s.hoop - bayAngle(6))), hoop: s.hoop };
    });
    assert(geom.err < 0.5, 'seventh waymark is geometrically aligned under bay 7', 'error ' + geom.err.toFixed(3) + '° at hoop ' + geom.hoop.toFixed(1) + '°');
    assert(conduitMid.some((c) => c > 0 && c < 1) || conduitMid.filter((c) => c === 1).length >= 2, 'conduits were filling progressively mid-dial', conduitMid.join(','));

    /* ---- 5. negative: no auto-fire ---- */
    console.log('[5] no auto-fire: the held route must wait for the hearth');
    await sleep(2500);
    s = await st();
    assert(s.phase === 'pending', 'still pending 2.5s after the seventh share', s.phase);
    const mPending = await aperture();
    await shot('pending_ready_no_autofire');
    const btnFoldText = await page.evaluate(() => document.getElementById('btn-fold').textContent);
    assert(btnFoldText === 'Fold the Span', 'fold control is offered while pending', btnFoldText);

    /* ---- 6. open the span: three stages ---- */
    console.log('[6] open the span — buildup, sunburst, open');
    await click('#btn-open', 'Open the Span');
    await sleep(60);
    s = await st();
    assert(s.phase === 'buildup', 'hearth starts the buildup', s.phase);
    await sleep(1500);
    s = await st();
    assert(s.phase === 'buildup', 'still building 1.5s in (real rising tension, not a state flip)', s.phase);
    const mBuild = await aperture();
    await shot('stage1_buildup');
    const brk = await waitFor(() => window.__trellis.state().phase === 'breakthrough', 3000);
    assert(brk.ok, 'breakthrough follows buildup', brk.ms + 'ms after sample');
    await sleep(180);
    const mBreak = await aperture();
    await shot('stage2_breakthrough');
    const act = await waitFor(() => window.__trellis.state().phase === 'active', 2500);
    assert(act.ok, 'sustained active follows breakthrough', act.ms + 'ms');
    await sleep(1200);
    const mActive = await aperture();
    await shot('stage3_sustained_active');
    s = await st();
    assert(s.phase === 'active', 'span stays open (sustained)', s.phase);
    assert(s.draw > 3, 'draw gauge shows neighbours drawing on the pool while open', s.draw.toFixed(2) + ' sun/min');
    console.log('        aperture metrics (lum, warm, sat): pending ' + JSON.stringify(mPending) + ' buildup ' + JSON.stringify(mBuild) + ' breakthrough ' + JSON.stringify(mBreak) + ' active ' + JSON.stringify(mActive));
    const pairs = [['pending', mPending, 'buildup', mBuild], ['pending', mPending, 'breakthrough', mBreak], ['pending', mPending, 'active', mActive], ['buildup', mBuild, 'breakthrough', mBreak], ['buildup', mBuild, 'active', mActive], ['breakthrough', mBreak, 'active', mActive]];
    for (const [an, a, bn, b] of pairs) assert(dist(a, b) > 30, 'aperture ' + an + ' vs ' + bn + ' visibly distinct', 'distance ' + dist(a, b).toFixed(1));
    const sunBefore = s.sun;
    await sleep(1500);
    s = await st();
    assert(s.sun < sunBefore, 'stored sun is drawn down while the span is open', sunBefore.toFixed(2) + ' → ' + s.sun.toFixed(2));

    /* ---- 7. fold ---- */
    console.log('[7] fold the span (cycle 1)');
    await click('#btn-fold', 'Fold the Span');
    await sleep(60);
    s = await st();
    assert(s.phase === 'folding', 'folding begins', s.phase);
    const idle1 = await waitFor(() => window.__trellis.state().phase === 'idle', 3000);
    assert(idle1.ok, 'ring returns to rest', idle1.ms + 'ms');
    await sleep(200);
    s = await st();
    assert(s.route.length === 0 && s.bays.every((b) => b.open < 0.01 && b.conduit < 0.01 && !b.wid) && s.pool < 0.01, 'shares flowed home: bays closed, conduits drained, pool empty');
    await shot('disengaged_cycle1');

    /* ---- 8. ledger route: staged auto-dial ---- */
    console.log('[8] ledger route — re-pledged at ledger pace, still staged');
    const routes = await page.evaluate(() => window.__trellis.routes);
    const kestrel = routes.find((r) => r.id === 'kestrel');
    const tLedger0 = Date.now();
    await click('.route[data-route="kestrel"]', 'route Kestrel Terrace Growers');
    const two = await waitFor(() => window.__trellis.state().route.length === 2, 6000);
    assert(two.ok, 'second share re-pledged', two.ms + 'ms');
    const sA = await st();
    await sleep(120);
    const sB = await st();
    await shot('autodial_sequence_in_progress');
    const moving = Math.abs(sA.hoop - sB.hoop) > 0.2 || sA.bays.some((b, i) => Math.abs(b.conduit - sB.bays[i].conduit) > 0.01 || Math.abs(b.open - sB.bays[i].open) > 0.01);
    assert(moving, 'real staged motion mid-sequence (hoop/conduit/petals changed over 120ms)', 'hoop ' + sA.hoop.toFixed(1) + '→' + sB.hoop.toFixed(1));
    assert(sA.walking === 'kestrel' && sA.phase === 'dialing' && sA.route.length >= 2 && sA.route.length < 7, 'ledger is walking, route partially held', sA.route.length + ' held');
    const pend2 = await waitFor(() => window.__trellis.state().phase === 'pending', 12000);
    const tLedger = Date.now() - tLedger0;
    assert(pend2.ok, 'ledger route ends held (pending)', tLedger + 'ms total');
    s = await st();
    assert(JSON.stringify(s.route) === JSON.stringify(kestrel.marks), 'ledger route holds exactly its seven marks in order', s.route.join(','));
    assert(tLedger < tManual && tLedger > 2500, 'ledger pace is faster than by hand but never instantaneous', 'ledger ' + tLedger + 'ms vs hand ' + tManual + 'ms');
    await sleep(2000);
    s = await st();
    assert(s.phase === 'pending', 'no auto-fire after a ledger route either', s.phase);
    await shot('autodial_pending_ready');

    /* ---- 9. quiet-hours latch blocks, then releases ---- */
    console.log('[9] quiet-hours latch');
    await click('#btn-latch', 'Quiet-hours latch');
    await sleep(80);
    s = await st();
    assert(s.latch === true, 'latch engaged', await page.evaluate(() => document.getElementById('latch-state').textContent));
    await click('#btn-open', 'Open the Span (should be refused)');
    await sleep(250);
    s = await st();
    const bannerState = await page.evaluate(() => { const b = document.getElementById('banner'); return { hidden: b.hidden, text: b.textContent, shaking: b.classList.contains('is-shaking') }; });
    assert(s.phase === 'pending', 'latch refuses the opening: still pending', s.phase);
    assert(!bannerState.hidden && bannerState.text.length > 10, 'refusal banner is shown', bannerState.text);
    const warmLog = await page.evaluate(() => !!document.querySelector('#log li.is-warm'));
    assert(warmLog, 'tending log records the refusal in warm colour');
    await shot('latch_refuses_opening');
    await click('#btn-latch', 'Quiet-hours latch (release)');
    await sleep(80);
    s = await st();
    assert(s.latch === false, 'latch released again');
    await click('#btn-open', 'Open the Span (cycle 2)');
    const act2 = await waitFor(() => window.__trellis.state().phase === 'active', 5000);
    assert(act2.ok, 'cycle 2 opens after release', act2.ms + 'ms');
    await sleep(800);
    await shot('active_cycle2');
    await click('#btn-fold', 'Fold the Span (cycle 2)');
    const idle2 = await waitFor(() => window.__trellis.state().phase === 'idle', 3000);
    assert(idle2.ok, 'cycle 2 folds back to rest', idle2.ms + 'ms');
    await sleep(150);
    await shot('disengaged_cycle2');

    /* ---- 10. fold during buildup ---- */
    console.log('[10] fold is reachable during buildup');
    await click('.route[data-route="alder-ferry"]', 'route Alder Ferry Landing');
    const pend3 = await waitFor(() => window.__trellis.state().phase === 'pending', 12000);
    assert(pend3.ok, 'third route held', pend3.ms + 'ms');
    await click('#btn-open', 'Open the Span (cycle 3)');
    await sleep(800);
    let sawActive = false;
    await click('#btn-fold', 'Fold during buildup');
    for (let i = 0; i < 30; i++) { const p = (await st()).phase; if (p === 'active' || p === 'breakthrough') sawActive = true; if (p === 'idle') break; await sleep(100); }
    s = await st();
    assert(s.phase === 'idle' && !sawActive, 'folding mid-buildup returns to rest without ever opening', s.phase + (sawActive ? ' (saw active!)' : ''));
    await sleep(3200);
    s = await st();
    assert(s.phase === 'idle', 'no late timer reopens the span after the fold', s.phase);

    /* ---- 11. fold during a ledger walk ---- */
    console.log('[11] fold mid-walk cancels the ledger');
    await click('.route[data-route="long-orchard"]', 'route The Long Orchard');
    await waitFor(() => window.__trellis.state().route.length === 2, 6000);
    await click('#btn-fold', 'Fold mid-walk');
    const idle4 = await waitFor(() => window.__trellis.state().phase === 'idle', 3000);
    await sleep(900);
    s = await st();
    assert(idle4.ok && s.route.length === 0 && s.queue.length === 0 && s.walking === null, 'walk cancelled: nothing held, nothing queued', 'held ' + s.route.length + ' queued ' + s.queue.length);

    /* ---- 12. guards ---- */
    console.log('[12] gentle guards');
    await click('.wm[data-wid="leafturn"]', 'waymark leafturn');
    await sleep(50);
    await click('.wm[data-wid="leafturn"]', 'waymark leafturn again');
    await waitFor(() => window.__trellis.state().phase === 'dialing' && window.__trellis.state().queue.length === 0 && window.__trellis.state().route.length === 1, 4000);
    await sleep(1800);
    s = await st();
    assert(s.route.length === 1 && s.route[0] === 'leafturn', 'a waymark cannot be pledged twice', s.route.join(','));
    await click('.route[data-route="kestrel"]', 'route while a hand route is held');
    await sleep(300);
    s = await st();
    assert(s.walking === null && s.route.length === 1, 'ledger declines while a hand-pledged route is being held');
    await click('#btn-fold', 'Fold (guards cleanup)');
    await waitFor(() => window.__trellis.state().phase === 'idle', 3000);
    await sleep(200);
    await click('#btn-fold', 'Let the ring rest (already idle)');
    await sleep(100);
    s = await st();
    assert(s.phase === 'idle', 'folding an idle ring is harmless', s.phase);

    /* ---- 13. guide and sound ---- */
    console.log('[13] guide overlay and sound toggle');
    await click('#btn-guide', 'guide button');
    await sleep(100);
    assert(await page.evaluate(() => !document.getElementById('guide').hidden), 'guide opens');
    await shot('guide_open');
    await click('#btn-guide-close', 'guide close');
    await sleep(100);
    assert(await page.evaluate(() => document.getElementById('guide').hidden), 'guide closes');
    await click('#btn-sound', 'sound toggle');
    await sleep(50);
    assert((await page.evaluate(() => document.getElementById('btn-sound').getAttribute('aria-pressed'))) === 'false', 'sound toggles off');
    await click('#btn-sound', 'sound toggle back');
    s = await st();
    assert(s.audio === 'running' || s.audio === 'suspended', 'audio context exists after gestures', s.audio);

    /* ---- 14. console ---- */
    assert(consoleErrors.length === 0, 'no console or page errors across the run', consoleErrors.join(' | ') || 'clean');

    /* ---- preview.png: a fresh cold start ---- */
    const p2 = await browser.newPage();
    await p2.setViewport({ width: 1920, height: 1080 });
    await p2.goto(url, { waitUntil: 'load' });
    await sleep(700);
    await p2.screenshot({ path: path.join(__dirname, '..', 'preview.png') });
    console.log('        preview.png captured (1920x1080 cold start)');
    await p2.close();
  } catch (e) {
    console.error('HARNESS ERROR:', e);
    results.push({ ok: false, label: 'harness error', detail: String(e && e.stack || e) });
  } finally {
    await browser.close();
    server.close();
  }

  const passed = results.filter((r) => r.ok).length;
  console.log('\n== ' + passed + '/' + results.length + ' checks passed ==');
  if (passed !== results.length) {
    console.log('Failed:');
    results.filter((r) => !r.ok).forEach((r) => console.log('  - ' + r.label + (r.detail ? ' — ' + r.detail : '')));
  }
  console.log('\nAutomated passes are evidence, not proof: direct operator hands-on testing is the real final check.');
  process.exit(passed === results.length ? 0 : 1);
}

main();
