/* NIGHTGLASS verification harness.
   Drives the page in headless Chrome with REAL dispatched pointer events,
   hit-tested at actual rendered positions, and captures staged screenshots
   at 1080p and simulated 4K. Run: npm test (server must be up on :8637). */
'use strict';

import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'shots');
const ROOT = path.join(HERE, '..');
const URL_ = 'http://localhost:8637';

const results = [];
const note = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

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

/* mean luminance of a box in a saved screenshot (aperture evidence) */
function lumOf(file, cx, cy, half) {
  const png = PNG.sync.read(fs.readFileSync(file));
  let sum = 0, n = 0;
  for (let y = cy - half; y < cy + half; y++) {
    for (let x = cx - half; x < cx + half; x++) {
      const i = (png.width * y + x) << 2;
      sum += 0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2];
      n++;
    }
  }
  return +(sum / n).toFixed(1);
}

const main = async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: await resolveChrome(),
    headless: true,
    args: ['--window-size=1920,1080', '--hide-scrollbars']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const st = () => page.evaluate(() => window.__nightglass.state);
  const locked = () => page.evaluate(() => window.__nightglass.locked.length);
  const shot = async name => { const f = path.join(SHOTS, name); await page.screenshot({ path: f }); return f; };
  const waitState = async (want, timeout = 6000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) { if (await st() === want) return true; await sleep(40); }
    return false;
  };

  /* Hit-tested real click: verify the element actually owns the pixel at
     its rendered center, then drive the OS-level mouse there. */
  async function click(sel) {
    const pt = await page.evaluate(s => {
      const el = document.querySelector(s);
      if (!el) return { err: 'missing ' + s };
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const hit = document.elementFromPoint(x, y);
      return { x, y, ok: !!hit && (hit === el || el.contains(hit)), hit: hit && (hit.id || hit.className.toString().slice(0, 40)) };
    }, sel);
    if (pt.err) throw new Error(pt.err);
    if (!pt.ok) throw new Error(`hit-test failed for ${sel}: pixel owned by ${pt.hit}`);
    await page.mouse.move(pt.x, pt.y);
    await page.mouse.down(); await page.mouse.up();
    return pt;
  }

  /* ———————— 1. cold start ———————— */
  await page.goto(URL_, { waitUntil: 'networkidle0' });
  await sleep(700);
  note('cold start reaches idle', await st() === 'idle');
  const ward0 = await page.evaluate(() => window.__nightglass.ward);
  note('safety interlock (drift ward) defaults to RELEASED', ward0 === false, `ward=${ward0}`);
  const fitInfo = await page.evaluate(() => ({
    w: innerWidth, h: innerHeight,
    fit: getComputedStyle(document.documentElement).getPropertyValue('--fit').trim(),
    tf: getComputedStyle(document.getElementById('stage')).transform,
    scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth,
    scrollH: document.documentElement.scrollHeight, clientH: document.documentElement.clientHeight
  }));
  note('1080p: no page scroll', fitInfo.scrollW === fitInfo.clientW && fitInfo.scrollH === fitInfo.clientH,
    `viewport ${fitInfo.w}x${fitInfo.h}, --fit=${fitInfo.fit}, transform=${fitInfo.tf}`);
  await shot('01-idle-1080.png');

  /* core-control reachability (hit-test every primary control) */
  const reach = await page.evaluate(() => {
    const sels = ['#btn-open', '#btn-close', '#btn-ward',
      ...Array.from({ length: 10 }, (_, i) => `.gkey[data-glyph="${i}"]`),
      ...Array.from(document.querySelectorAll('.thread-btn')).map(b => `[data-thread="${b.dataset.thread}"]`),
      ...Array.from(document.querySelectorAll('#dock button')).map(b => `#dock button[data-ov="${b.dataset.ov}"]`),
      '#btn-help'];
    const bad = [];
    for (const s of sels) {
      const el = document.querySelector(s);
      if (!el) { bad.push(s + ' missing'); continue; }
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!hit || (hit !== el && !el.contains(hit))) bad.push(s);
    }
    return { total: sels.length, bad };
  });
  note('all primary controls hit-testable at rendered centers', reach.bad.length === 0,
    `${reach.total} controls checked${reach.bad.length ? '; blocked: ' + reach.bad.join(', ') : ''}`);

  /* ———————— 2. manual dial (cycle 1) ———————— */
  const LOOM_ADDR = [3, 0, 9, 4, 1, 8, 6]; /* The Quiet Loom */
  let actions = 0;
  for (let i = 0; i < LOOM_ADDR.length; i++) {
    await click(`.gkey[data-glyph="${LOOM_ADDR[i]}"]`); actions++;
    if (i === 2) { await sleep(350); await shot('02-weave-partial.png'); }
    await sleep(280);
  }
  note('manual dial: 7 glyphs locked', await locked() === 7);
  note('manual dial resolves the saved destination', await page.evaluate(() => window.__nightglass.dest) === 'The Quiet Loom');
  note('completed thread lands PENDING', await st() === 'pending');
  await sleep(400);
  await shot('03-pending.png');

  /* ———————— 3. NEGATIVE: no auto-fire ———————— */
  await sleep(3000);
  const still = await st();
  const wellOpacity = await page.evaluate(() => getComputedStyle(document.getElementById('aperture-well')).opacity);
  note('NEGATIVE auto-fire: 3s after 7th lock, still pending, aperture shut',
    still === 'pending' && parseFloat(wellOpacity) === 0, `state=${still}, well opacity=${wellOpacity}`);
  await shot('04-no-autofire.png');

  /* ———————— 4. ward blocks, unmissably ———————— */
  await click('#btn-ward'); await sleep(150);
  note('ward engages on demand', await page.evaluate(() => window.__nightglass.ward) === true);
  await click('#btn-open'); await sleep(350);
  const banner = await page.evaluate(() => !document.getElementById('ward-banner').hidden);
  note('engaged ward blocks OPEN LINK with visible banner', await st() === 'pending' && banner,
    `state=${await st()}, banner shown=${banner}`);
  await shot('05-ward-blocked.png');
  await click('#btn-ward'); await sleep(150);
  note('ward releases', await page.evaluate(() => window.__nightglass.ward) === false);
  await sleep(3100); /* let the banner clear before stage shots */

  /* ———————— 5. staged activation ———————— */
  await click('#btn-open'); actions++;
  note('OPEN LINK enters BUILDUP immediately', await st() === 'buildup');
  note('core loop: one basic manual dial from cold start', actions === 8, `${actions} clicks (7 glyphs + OPEN LINK)`);
  await sleep(900);
  await shot('06-buildup.png');
  note('buildup has real duration (still building at t+0.9s)', await st() === 'buildup');
  note('breakthrough follows buildup', await waitState('breakthrough', 2000));
  await sleep(380);
  await shot('07-breakthrough.png');
  note('sustained ACTIVE follows breakthrough', await waitState('active', 2500));
  await sleep(900);
  await shot('08-active.png');
  await sleep(1600);
  note('link stays open (sustained active, t+2.5s)', await st() === 'active');
  await shot('09-active-sustain.png');

  /* aperture luminance: numeric proof the stages differ */
  const AP = { cx: 1220, cy: 444, half: 55 };
  const lum = {
    pending: lumOf(path.join(SHOTS, '03-pending.png'), AP.cx, AP.cy, AP.half),
    buildup: lumOf(path.join(SHOTS, '06-buildup.png'), AP.cx, AP.cy, AP.half),
    breakthrough: lumOf(path.join(SHOTS, '07-breakthrough.png'), AP.cx, AP.cy, AP.half),
    active: lumOf(path.join(SHOTS, '08-active.png'), AP.cx, AP.cy, AP.half)
  };
  note('aperture luminance rises across stages',
    lum.buildup > lum.pending && lum.breakthrough > lum.buildup && lum.active > lum.pending + 20,
    `pending=${lum.pending} buildup=${lum.buildup} breakthrough=${lum.breakthrough} active=${lum.active}`);

  /* ———————— 6. disengage #1 ———————— */
  await click('#btn-close');
  note('CLOSE LINK leaves active immediately', await st() === 'cooldown');
  note('cooldown settles to idle', await waitState('idle', 2000));
  await sleep(500);
  await shot('10-closed.png');
  note('after close, weave is cleared', await locked() === 0);

  /* ———————— 7. redial via thread (quick-dial), staged not instant ———————— */
  const t0 = Date.now();
  await click('.thread-btn[data-thread="thread-reef"]');
  note('thread starts an AUTODIAL state', await st() === 'autodial');
  let sawMid = 0, times = [];
  while (await st() === 'autodial' && Date.now() - t0 < 8000) {
    const n = await locked();
    if (n >= 2 && sawMid === 0) { sawMid = 1; times.push(Date.now() - t0); await shot('11-autodial-2of7.png'); }
    if (n >= 5 && sawMid === 1) { sawMid = 2; times.push(Date.now() - t0); await shot('12-autodial-5of7.png'); }
    await sleep(60);
  }
  const dialMs = Date.now() - t0;
  note('auto-dial is a real per-glyph sequence (mid-states captured)', sawMid === 2,
    `2/7 at ${times[0]}ms, 5/7 at ${times[1]}ms, complete ~${dialMs}ms`);
  note('auto-dial total is staged, not instant', dialMs > 2200 && dialMs < 8000, `${dialMs}ms for 7 glyphs`);
  note('thread lands PENDING — never auto-fires', await st() === 'pending');
  await sleep(1500);
  note('thread still pending 1.5s later (no auto-fire)', await st() === 'pending');
  note('thread resolved its destination', await page.evaluate(() => window.__nightglass.dest) === 'Halcyon Reef');
  await shot('13-pending-thread.png');

  /* ———————— 8. activate again, disengage #2 ———————— */
  await click('#btn-open');
  note('second activation enters BUILDUP', await st() === 'buildup');
  note('second activation reaches ACTIVE', await waitState('active', 5000));
  await sleep(700);
  await shot('14-active-2.png');
  await click('#btn-close');
  note('second disengage returns to idle', await waitState('idle', 2000));

  /* disengage also reachable mid-weave and mid-autodial */
  await click('.gkey[data-glyph="2"]'); await sleep(200); await click('.gkey[data-glyph="5"]'); await sleep(200);
  await click('#btn-close');
  note('CLOSE LINK unwinds a part-woven thread', await st() === 'idle' && await locked() === 0);
  await click('.thread-btn[data-thread="thread-vault"]'); await sleep(1000);
  const midN = await locked();
  await click('#btn-close');
  note('CLOSE LINK halts a reweave mid-sequence', await st() === 'idle' && await locked() === 0,
    `halted at ${midN}/7`);

  /* ———————— 9. archive: cross-references ———————— */
  await click('#dock button[data-ov="archive"]'); await sleep(300);
  await page.evaluate(() => {
    const li = Array.from(document.querySelectorAll('#archive-list li')).find(l => l.dataset.id === 'halcyon-reef');
    li.scrollIntoView({ block: 'center' });
  });
  await click('#archive-list li[data-id="halcyon-reef"]'); await sleep(250);
  const detail1 = await page.evaluate(() => document.querySelector('#archive-detail h3').textContent);
  await click('#archive-detail .ref-chip[data-id="tidewright"]'); await sleep(250);
  const detail2 = await page.evaluate(() => ({
    h3: document.querySelector('#archive-detail h3').textContent,
    backrefs: document.querySelectorAll('#archive-detail .backref').length
  }));
  note('archive cross-reference navigation works', detail1 === 'Halcyon Reef' && detail2.h3 === 'The Tidewright' && detail2.backrefs > 0,
    `${detail1} → ${detail2.h3}, ${detail2.backrefs} back-references shown`);
  const archStats = await page.evaluate(() => ({
    entries: ARCHIVE.length,
    refs: ARCHIVE.reduce((a, e) => a + e.refs.length, 0),
    dangling: ARCHIVE.flatMap(e => e.refs).filter(r => !ARCHIVE.find(x => x.id === r)).length
  }));
  note('archive is dense and fully linked', archStats.entries >= 30 && archStats.refs >= 90 && archStats.dangling === 0,
    `${archStats.entries} entries, ${archStats.refs} references, ${archStats.dangling} dangling`);
  await shot('15-archive.png');
  await click('#ov-archive .ov-close'); await sleep(250);

  /* ———————— 10. chart ———————— */
  await click('#dock button[data-ov="chart"]'); await sleep(400);
  await shot('16-chart.png');
  await click('.ch-group[data-id="murmur-vault"]'); await sleep(300);
  const chartNav = await page.evaluate(() => ({
    archOpen: !document.getElementById('ov-archive').hidden,
    h3: document.querySelector('#archive-detail h3') && document.querySelector('#archive-detail h3').textContent
  }));
  note('chart node opens its archive record', chartNav.archOpen && chartNav.h3 === 'The Murmur Vault', chartNav.h3);
  await click('#ov-archive .ov-close'); await sleep(250);

  /* ———————— 11. telemetry coupling ———————— */
  await click('#dock button[data-ov="telemetry"]'); await sleep(1300);
  await shot('17-telemetry.png');
  const coupling = await page.evaluate(() => {
    const h = Tele.history;
    const n = h.coherence.length;
    const pearson = (a, b) => {
      const m = x => x.reduce((s, v) => s + v, 0) / x.length;
      const ma = m(a), mb = m(b);
      let num = 0, da = 0, db = 0;
      for (let i = 0; i < a.length; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
      return num / Math.sqrt(da * db);
    };
    const prod = h.coherence.map((c, i) => c * h.carrier[i]);
    return { n, thruVsProd: +pearson(h.throughput, prod).toFixed(3), driftVsCoh: +pearson(h.drift, h.coherence).toFixed(3) };
  });
  note('telemetry values are genuinely coupled', coupling.thruVsProd > 0.55 && coupling.driftVsCoh < -0.55,
    `n=${coupling.n}; r(throughput, coherence×carrier)=${coupling.thruVsProd}; r(drift, coherence)=${coupling.driftVsCoh}`);
  await click('#ov-telemetry .ov-close'); await sleep(250);

  /* ———————— 12. journal ———————— */
  await click('#dock button[data-ov="journal"]'); await sleep(300);
  const jstats = await page.evaluate(() => ({
    count: window.__nightglass.journalCount,
    listed: document.querySelectorAll('#journal-list li').length,
    hist: document.querySelectorAll('#history-list li').length
  }));
  note('journal records this session\'s actions', jstats.count >= 20 && jstats.listed === jstats.count && jstats.hist >= 2,
    `${jstats.count} entries, ${jstats.hist} weave-history rows`);
  await shot('18-journal.png');
  await click('#ov-journal .ov-close'); await sleep(250);

  /* ———————— 13. settings + persistence ———————— */
  await click('#dock button[data-ov="settings"]'); await sleep(250);
  await click('#set-theme .set-opt[data-v="emberveil"]'); await sleep(150);
  await click('#set-density .set-opt[data-v="compact"]'); await sleep(150);
  await click('#set-motion .set-opt[data-v="soft"]'); await sleep(300);
  const applied = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    den: document.documentElement.dataset.density,
    mot: document.documentElement.dataset.motion
  }));
  note('settings apply live', applied.theme === 'emberveil' && applied.den === 'compact' && applied.mot === 'soft',
    JSON.stringify(applied));
  await shot('19-settings-emberveil.png');

  await page.reload({ waitUntil: 'networkidle0' }); await sleep(700);
  const persisted = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    prefs: window.__nightglass.prefs,
    hist: window.__nightglass.historyCount,
    seen: document.querySelectorAll('#archive-list li.seen').length >= 0
  }));
  const seenCount = await page.evaluate(() => JSON.parse(localStorage.getItem('nightglass.seen') || '[]').length);
  note('persistence: prefs, history, and read-marks survive reload',
    persisted.theme === 'emberveil' && persisted.prefs.density === 'compact' && persisted.hist >= 2 && seenCount >= 3,
    `theme=${persisted.theme}, density=${persisted.prefs.density}, history rows=${persisted.hist}, seen=${seenCount}`);
  await shot('20-reload-persisted.png');

  /* restore defaults for the preview shot */
  await click('#dock button[data-ov="settings"]'); await sleep(250);
  await click('#set-theme .set-opt[data-v="neon-dusk"]'); await sleep(120);
  await click('#set-density .set-opt[data-v="standard"]'); await sleep(120);
  await click('#set-motion .set-opt[data-v="full"]'); await sleep(120);
  await page.reload({ waitUntil: 'networkidle0' }); await sleep(900);
  await page.screenshot({ path: path.join(ROOT, 'preview.png') });

  /* help overlay */
  await click('#btn-help'); await sleep(300);
  await shot('21-help.png');
  const helpOpen = await page.evaluate(() => !document.getElementById('ov-help').hidden);
  note('operator reference opens from the ? control', helpOpen);
  await click('#ov-help .ov-close'); await sleep(200);

  /* ———————— 14. simulated 4K ———————— */
  await page.setViewport({ width: 3840, height: 2160 });
  await page.reload({ waitUntil: 'networkidle0' }); await sleep(800);
  const fit4k = await page.evaluate(() => ({
    w: innerWidth, h: innerHeight,
    fit: getComputedStyle(document.documentElement).getPropertyValue('--fit').trim(),
    tf: getComputedStyle(document.getElementById('stage')).transform,
    noScroll: document.documentElement.scrollWidth === document.documentElement.clientWidth &&
      document.documentElement.scrollHeight === document.documentElement.clientHeight
  }));
  note('4K: stage scales cleanly, no scroll', fit4k.fit === '2' && fit4k.noScroll,
    `viewport ${fit4k.w}x${fit4k.h}, --fit=${fit4k.fit}, transform=${fit4k.tf}`);
  await shot('22-idle-4k.png');
  /* hit-testing still true at 4K: lock one glyph for real */
  await click('.gkey[data-glyph="7"]'); await sleep(300);
  note('4K: controls still hit-testable and live', await locked() === 1 && await st() === 'weaving');
  await click('#btn-close'); await sleep(300);
  await click('.thread-btn[data-thread="thread-orchard"]');
  await waitState('pending', 8000);
  await click('#btn-open');
  await waitState('active', 5000); await sleep(700);
  await shot('23-active-4k.png');
  await click('#btn-close'); await waitState('idle', 2000);

  await browser.close();

  /* ———————— summary ———————— */
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  fs.writeFileSync(path.join(HERE, 'results.json'), JSON.stringify({ when: new Date().toISOString(), results, lum, fitInfo, fit4k, coupling }, null, 2));
  if (failed.length) { console.error('FAILURES:', failed.map(f => f.name).join(' | ')); process.exit(1); }
};

main().catch(e => { console.error(e); process.exit(1); });
