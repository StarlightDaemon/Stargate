/* Diagnostic probe for the operator-reported issues (pre-fix baseline).
   1. Per-lock ring-region screenshots: what does the ring itself show per lock?
   2. Multi-lock registration: do 2nd+ locks register with real dispatched clicks?
   3. Multiple stations in a row: full dial -> release -> dial another station. */

import puppeteer from 'puppeteer-core';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const URL_ROOT = process.env.REGISTRY_URL || 'http://localhost:8613/';
const HERE = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(HERE, 'shots', 'diagnose');
mkdirSync(SHOTS, { recursive: true });

function findChrome() {
  const cands = [];
  for (const base of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]) {
    if (!base) continue;
    cands.push(join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    cands.push(join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
  }
  for (const c of cands) if (existsSync(c)) return c;
  throw new Error('No Chrome/Edge executable found');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const reg = (page, expr) => page.evaluate(`window.__REGISTRY__.${expr}`);

async function hitClick(page, selector) {
  const box = await page.evaluate(sel => {
    const n = document.querySelector(sel);
    if (!n) return null;
    const r = n.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, hit: (document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) || {}).tagName || null };
  }, selector);
  if (!box || box.w === 0) throw new Error('no rendered box for ' + selector);
  await page.mouse.click(box.x, box.y);
  return box;
}

async function waitLocks(page, n, timeout = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if ((await reg(page, 'locks.length')) >= n) return Date.now() - t0;
    await sleep(40);
  }
  return -1;
}

const DIAL_CLIP = { x: 110, y: 88, width: 880, height: 880 };

const run = async () => {
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: 'new',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(URL_ROOT, { waitUntil: 'networkidle0' });
  await sleep(500);

  /* ---- probe 1+2: manual full dial, ring-region shot after each lock ---- */
  const address = await page.evaluate(() =>
    window.__REGISTRY__.stations.find(s => s.id === 'okuyama').address);
  console.log('# dialing okuyama:', address.join(' '));
  await page.screenshot({ path: join(SHOTS, 'ring_lock0.png'), clip: DIAL_CLIP });

  for (let i = 0; i < address.length; i++) {
    const box = await hitClick(page, '#glyph-' + address[i]);
    const t = await waitLocks(page, i + 1);
    const st = {
      lock: i + 1, registered: t >= 0, ms: t,
      locks: await reg(page, 'locks.length'),
      state: await reg(page, 'state'),
      lockedCartouches: await page.evaluate(() => document.querySelectorAll('.cartouche.locked').length),
      slotsFilled: await page.evaluate(() => document.querySelectorAll('.slot.filled').length),
      panelLayers: await page.evaluate(() => document.querySelectorAll('#print .layer.stamped').length),
      clickTarget: box.hit
    };
    console.log(JSON.stringify(st));
    await sleep(450); // let stamp-pop finish so the shot shows the RESTING ring state
    await page.screenshot({ path: join(SHOTS, `ring_lock${i + 1}.png`), clip: DIAL_CLIP });
  }
  console.log('# after full dial: state=', await reg(page, 'state'), 'locks=', await reg(page, 'locks.length'));

  /* what non-transient visual state does the ring carry mid-dial? */
  const apertureState = await page.evaluate(() => ({
    apIdleDisplayed: getComputedStyle(document.getElementById('ap-idle')).display,
    apertureChildren: [...document.getElementById('aperture') ? document.getElementById('aperture').children : []].map(c => c.id || c.tagName)
  }));
  console.log('# aperture during pending:', JSON.stringify(apertureState));

  /* ---- probe 3: second station in a row (release, then dial again) ---- */
  await hitClick(page, '#release-btn');
  await sleep(800);
  console.log('# released: state=', await reg(page, 'state'), 'locks=', await reg(page, 'locks.length'));

  const addr2 = await page.evaluate(() =>
    window.__REGISTRY__.stations.find(s => s.id === 'yanagibashi').address);
  console.log('# dialing yanagibashi:', addr2.join(' '));
  for (let i = 0; i < addr2.length; i++) {
    await hitClick(page, '#glyph-' + addr2[i]);
    const t = await waitLocks(page, i + 1);
    console.log(JSON.stringify({ station2_lock: i + 1, registered: t >= 0, locks: await reg(page, 'locks.length') }));
  }
  console.log('# station 2 result: state=', await reg(page, 'state'), 'station=', await reg(page, 'station'));

  /* ---- probe 4: rapid clicking (operator-speed) — are clicks swallowed? ---- */
  await hitClick(page, '#release-btn');
  await sleep(800);
  const addr3 = await page.evaluate(() =>
    window.__REGISTRY__.stations.find(s => s.id === 'kumogaeshi').address);
  console.log('# rapid-dialing kumogaeshi (clicks every 250ms, no waiting):', addr3.join(' '));
  for (let i = 0; i < addr3.length; i++) {
    await hitClick(page, '#glyph-' + addr3[i]);
    await sleep(250);
  }
  await sleep(1200);
  console.log('# rapid result: locks=', await reg(page, 'locks.length'), 'state=', await reg(page, 'state'),
              '(7 = all registered; fewer = clicks silently swallowed while wheel turns)');

  console.log('# page errors:', errs.length ? errs.join(' | ') : 'none');
  await browser.close();
};

run().catch(e => { console.error('DIAG ERROR:', e); process.exit(2); });
