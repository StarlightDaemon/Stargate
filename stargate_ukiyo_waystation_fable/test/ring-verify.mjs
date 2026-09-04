/* Ring-feedback evidence run: dials a full manual address with real
   dispatched, hit-tested pointer events and screenshots the DIAL REGION
   after every individual lock, asserting the ring itself shows distinct,
   progressing state at each step (seals + press-bed layers), then seals,
   activates, and releases. Shots land in test/shots/ring/. */

import puppeteer from 'puppeteer-core';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const URL_ROOT = process.env.REGISTRY_URL || 'http://localhost:8613/';
const HERE = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(HERE, 'shots', 'ring');
mkdirSync(SHOTS, { recursive: true });

// Browser resolution. No absolute local filesystem path is committed here:
// CHROME_PATH (or PUPPETEER_EXECUTABLE_PATH) wins, otherwise puppeteer's own
// executable path is used. Anything else is an explicit error.
async function resolveChrome() {
  const fromEnv = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv) return fromEnv;
  let why;
  try {
    const p = await puppeteer.executablePath();
    if (p && existsSync(p)) return p;
    why = p ? `puppeteer's executable path does not exist: ${p}` : 'puppeteer reported no executable path';
  } catch (e) {
    why = `puppeteer could not resolve an executable path (${e.message})`;
  }
  throw new Error(`No browser found: ${why}. Set CHROME_PATH to a Chrome/Chromium executable.`);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const reg = (page, expr) => page.evaluate(`window.__REGISTRY__.${expr}`);
const DIAL_CLIP = { x: 110, y: 88, width: 880, height: 880 };

let failures = 0;
function check(name, ok, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

async function hitClick(page, selector) {
  const box = await page.evaluate(sel => {
    const n = document.querySelector(sel);
    if (!n) return null;
    const r = n.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width };
  }, selector);
  if (!box || box.w === 0) throw new Error('no rendered box for ' + selector);
  await page.mouse.click(box.x, box.y);
}

async function waitLocks(page, n, timeout = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if ((await reg(page, 'locks.length')) >= n) return true;
    await sleep(40);
  }
  return false;
}

const run = async () => {
  const browser = await puppeteer.launch({
    executablePath: await resolveChrome(),
    headless: 'new',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(URL_ROOT, { waitUntil: 'networkidle0' });
  await sleep(500);

  await page.screenshot({ path: join(SHOTS, 'ring_00_idle.png'), clip: DIAL_CLIP });

  /* full manual dial of Hoshiotoshi (Star-Fall Ford — dark night print) */
  const address = await page.evaluate(() =>
    window.__REGISTRY__.stations.find(s => s.id === 'hoshiotoshi').address);
  console.log('# dialing hoshiotoshi:', address.join(' '));

  for (let i = 0; i < address.length; i++) {
    await hitClick(page, '#glyph-' + address[i]);
    check(`lock ${i + 1} registers`, await waitLocks(page, i + 1));
    const rs = await page.evaluate(() => ({
      seals: document.querySelectorAll('.ap-seal.sealed').length,
      bedLayers: document.querySelectorAll('#ap-press-print .layer.stamped').length
    }));
    check(`lock ${i + 1}: ring shows ${i + 1} seal(s) + ${i + 1} bed layer(s)`,
          rs.seals === i + 1 && rs.bedLayers === i + 1, JSON.stringify(rs));
    await sleep(450); // let the strike/stamp animations settle for a resting shot
    await page.screenshot({ path: join(SHOTS, `ring_0${i + 1}_lock.png`), clip: DIAL_CLIP });
  }
  check('full address pending', (await reg(page, 'state')) === 'pending');
  const rim = await page.evaluate(() => getComputedStyle(document.getElementById('press-rim')).display);
  check('pending rim shown on ring', rim === 'block');
  await sleep(400);
  await page.screenshot({ path: join(SHOTS, 'ring_08_pending.png'), clip: DIAL_CLIP });

  /* seal → three stages still play over the bed */
  await hitClick(page, '#seal-btn');
  await sleep(900);
  check('buildup', (await reg(page, 'state')) === 'buildup');
  await page.screenshot({ path: join(SHOTS, 'ring_09_buildup.png'), clip: DIAL_CLIP });
  while ((await reg(page, 'state')) !== 'active') await sleep(100);
  await sleep(400);
  check('active', (await reg(page, 'state')) === 'active');
  await page.screenshot({ path: join(SHOTS, 'ring_10_active.png'), clip: DIAL_CLIP });

  /* release: ring must return to a clean idle */
  await hitClick(page, '#release-btn');
  await sleep(800);
  const cleared = await page.evaluate(() => ({
    seals: document.querySelectorAll('.ap-seal.sealed').length,
    bed: document.getElementById('ap-press-print').children.length
  }));
  check('release clears ring seals & bed', cleared.seals === 0 && cleared.bed === 0, JSON.stringify(cleared));
  check('back to idle', (await reg(page, 'state')) === 'idle');
  await page.screenshot({ path: join(SHOTS, 'ring_11_released.png'), clip: DIAL_CLIP });

  check('no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  await browser.close();
  console.log(`\nring-verify: ${failures} failures`);
  process.exit(failures ? 1 : 0);
};

run().catch(e => { console.error('RING-VERIFY ERROR:', e); process.exit(2); });
