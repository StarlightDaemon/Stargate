/* Interactive verification for the Kagerō Road Waystation Registry.
   Drives the real page in Chrome via puppeteer-core with genuine dispatched
   pointer events, hit-testing every control at its actual rendered position.
   Screenshots land in test/shots/ (not committed). */

import puppeteer from 'puppeteer-core';
import { mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const URL_ROOT = process.env.REGISTRY_URL || 'http://localhost:8613/';
const HERE = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(HERE, 'shots');
mkdirSync(SHOTS, { recursive: true });

function findChrome() {
  const cands = [];
  for (const base of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]) {
    if (!base) continue;
    cands.push(join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    cands.push(join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
  }
  cands.push('/usr/bin/google-chrome', '/usr/bin/chromium');
  for (const c of cands) if (existsSync(c)) return c;
  throw new Error('No Chrome/Edge executable found');
}

const results = [];
let failures = 0;
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function reg(page, expr) {
  return page.evaluate(`window.__REGISTRY__.${expr}`);
}

/* click an element with a real mouse event at its actual rendered center */
async function hitClick(page, selector) {
  const box = await page.evaluate(sel => {
    const n = document.querySelector(sel);
    if (!n) return null;
    const r = n.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
  }, selector);
  if (!box || box.w === 0) throw new Error('no rendered box for ' + selector);
  await page.mouse.click(box.x, box.y);
  return box;
}

async function shot(page, name, clip = null) {
  const path = join(SHOTS, name);
  await page.screenshot({ path, ...(clip ? { clip } : {}) });
  return path;
}

async function waitState(page, state, timeout = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if ((await reg(page, 'state')) === state) return Date.now() - t0;
    await sleep(40);
  }
  throw new Error(`state never became ${state}`);
}

async function waitLocks(page, n, timeout = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if ((await reg(page, 'locks.length')) >= n) return Date.now() - t0;
    await sleep(40);
  }
  throw new Error(`locks never reached ${n}`);
}

/* dial one full manual address, clicking each cartouche at its live position */
async function manualDial(page, stationId) {
  const address = await page.evaluate(id =>
    window.__REGISTRY__.stations.find(s => s.id === id).address, stationId);
  const stamps = [];
  for (let i = 0; i < address.length; i++) {
    await hitClick(page, '#glyph-' + address[i]);
    const t0 = Date.now();
    await waitLocks(page, i + 1);
    stamps.push(Date.now() - t0);
    if (i === 2) await shot(page, '02_manual_dial_partial_1080.png');
  }
  return stamps;
}

const run = async () => {
  const exe = findChrome();
  console.log('# browser:', exe);
  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: 'new',
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') pageErrors.push(m.text()); });

  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(URL_ROOT, { waitUntil: 'networkidle0' });
  await sleep(600);

  /* ---- cold start ---- */
  const vp1 = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
  const tf1 = await page.evaluate(() => getComputedStyle(document.getElementById('stage')).transform);
  const s1 = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--s').trim());
  console.log(`# viewport ${vp1.w}x${vp1.h}  --s=${s1}  transform=${tf1}`);
  check('cold start: state idle', (await reg(page, 'state')) === 'idle');
  check('cold start: interlock defaults RELEASED', (await reg(page, 'interlock')) === false);
  check('cold start: no locks', (await reg(page, 'locks.length')) === 0);
  check('1080p scale ratio is 1', s1 === '1', `--s=${s1}, transform=${tf1}`);
  await shot(page, '01_cold_idle_1080.png');

  // idle must not auto-dial: watch for 5s
  await sleep(5000);
  check('idle never auto-dials (5s watch)', (await reg(page, 'locks.length')) === 0 &&
        (await reg(page, 'state')) === 'idle');

  /* ---- CYCLE 1: full manual dial (Okuyama Pass — not on any token) ---- */
  // wrong-block refusal: first lock names the province, then a wrong glyph must refuse
  await hitClick(page, '#glyph-mine');
  await waitLocks(page, 1);
  await hitClick(page, '#glyph-tsuki'); // not next in okuyama's address
  await sleep(900);
  check('wrong block refuses to register', (await reg(page, 'locks.length')) === 1);

  const restAddress = await page.evaluate(() =>
    window.__REGISTRY__.stations.find(s => s.id === 'okuyama').address.slice(1));
  const manualStamps = [];
  for (let i = 0; i < restAddress.length; i++) {
    await hitClick(page, '#glyph-' + restAddress[i]);
    await waitLocks(page, i + 2);
    if (i === 1) await shot(page, '02_manual_dial_partial_1080.png');
  }
  check('manual dial: 7 impressions locked', (await reg(page, 'locks.length')) === 7);
  check('manual dial: destination resolved', (await reg(page, 'station')) === 'okuyama');
  check('manual dial: state pending, NOT active', (await reg(page, 'state')) === 'pending');
  const stampedLayers = await page.evaluate(() => document.querySelectorAll('#print .layer.stamped').length);
  check('print carries all 7 stamped layers', stampedLayers === 7, `${stampedLayers} layers`);
  await shot(page, '03_manual_dial_pending_1080.png');

  /* ---- NEGATIVE: a full address must never auto-fire ---- */
  await sleep(2600);
  const apShown = await page.evaluate(() => ({
    active: getComputedStyle(document.getElementById('ap-active')).display,
    idle: getComputedStyle(document.getElementById('ap-idle')).display
  }));
  check('NEGATIVE: still pending 2.6s after 7th lock', (await reg(page, 'state')) === 'pending');
  check('NEGATIVE: aperture not open (ap-active hidden)', apShown.active === 'none' && apShown.idle === 'block',
        JSON.stringify(apShown));
  await shot(page, '04_negative_still_pending_1080.png');

  /* ---- activation: three real stages ---- */
  const tSeal = Date.now();
  await hitClick(page, '#seal-btn');
  await waitState(page, 'buildup', 2000);
  await sleep(700);
  check('stage 1: buildup engaged', (await reg(page, 'state')) === 'buildup');
  await shot(page, '05_buildup_1080.png');
  const dBreak = await waitState(page, 'break', 4000);
  await sleep(220);
  await shot(page, '06_breakthrough_1080.png');
  check('stage 2: breakthrough after real buildup',
        Date.now() - tSeal > 2000, `break began ~${Date.now() - tSeal - 220}ms after seal`);
  const dActive = await waitState(page, 'active', 3000);
  await sleep(300);
  await shot(page, '07_active_1080.png');
  check('stage 3: sustained active reached', (await reg(page, 'state')) === 'active');
  await sleep(2000);
  check('active is sustained (2s later)', (await reg(page, 'state')) === 'active');
  await shot(page, '08_sustained_active_1080.png');

  /* ---- disengage from active ---- */
  await hitClick(page, '#release-btn');
  await sleep(700);
  check('disengage 1: back to idle', (await reg(page, 'state')) === 'idle');
  check('disengage 1: locks cleared', (await reg(page, 'locks.length')) === 0);
  await shot(page, '09_disengaged_idle_1080.png');

  /* ---- CYCLE 2: quick-dial token (Tsukinoto) must auto-dial visibly ---- */
  const lockTimes = [];
  const tToken = Date.now();
  await hitClick(page, '#token-tsukinoto');
  for (let n = 1; n <= 7; n++) {
    await waitLocks(page, n, 4000);
    lockTimes.push(Date.now() - tToken);
    if (n === 2) await shot(page, '10_autodial_mid_a_1080.png');
    if (n === 5) await shot(page, '11_autodial_mid_b_1080.png');
  }
  const total = lockTimes[6];
  const gaps = lockTimes.map((t, i) => i ? t - lockTimes[i - 1] : t);
  check('auto-dial: staged, not instantaneous', total > 3000 && gaps.slice(1).every(g => g > 300),
        `locks at [${lockTimes.join(', ')}]ms`);
  check('auto-dial: lands pending, does NOT auto-fire', (await reg(page, 'state')) === 'pending');
  await sleep(1500);
  check('auto-dial NEGATIVE: still pending 1.5s later', (await reg(page, 'state')) === 'pending');
  await shot(page, '12_autodial_pending_1080.png');

  /* ---- safety interlock: engage writ, seal must refuse ---- */
  await hitClick(page, '#writ-btn');
  check('writ engages', (await reg(page, 'interlock')) === true);
  await shot(page, '15_writ_banner_1080.png');
  await hitClick(page, '#seal-btn');
  await sleep(1200);
  check('interlock blocks the seal (still pending)', (await reg(page, 'state')) === 'pending');
  await shot(page, '14_interlock_refusal_1080.png');
  await hitClick(page, '#writ-btn');
  check('writ releases', (await reg(page, 'interlock')) === false);

  /* ---- activate again, then disengage again (cycle 2 complete) ---- */
  await hitClick(page, '#seal-btn');
  await waitState(page, 'buildup', 2000);
  await waitState(page, 'break', 4000);
  await waitState(page, 'active', 3000);
  await sleep(400);
  check('second activation reaches active', (await reg(page, 'state')) === 'active');
  await shot(page, '13_second_active_1080.png');

  // disengage must stay reachable while active — hit-test its live box
  const relBox = await hitClick(page, '#release-btn');
  await sleep(700);
  check('disengage 2: reachable while active & returns to idle',
        (await reg(page, 'state')) === 'idle', `release box ${Math.round(relBox.w)}x${Math.round(relBox.h)}`);

  /* ---- disengage mid-auto-dial ---- */
  await hitClick(page, '#token-kawabue');
  await waitLocks(page, 2, 4000);
  await hitClick(page, '#release-btn');
  await sleep(900);
  const afterAbort = await reg(page, 'locks.length');
  await sleep(1200);
  check('release mid-auto-dial aborts the sequence',
        afterAbort === 0 && (await reg(page, 'locks.length')) === 0 && (await reg(page, 'state')) === 'idle');

  /* ---- help overlay ---- */
  await hitClick(page, '#help-btn');
  await sleep(300);
  const helpOpen = await page.evaluate(() => !document.getElementById('help-overlay').hidden);
  check('operator reference opens', helpOpen);
  await shot(page, '18_help_overlay_1080.png');
  await hitClick(page, '#help-close');
  await sleep(300);
  check('operator reference dismisses', await page.evaluate(() => document.getElementById('help-overlay').hidden));

  /* ---- 4K scaling ---- */
  await page.setViewport({ width: 3840, height: 2160 });
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(600);
  const vp2 = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
  const s2 = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--s').trim());
  const tf2 = await page.evaluate(() => getComputedStyle(document.getElementById('stage')).transform);
  console.log(`# viewport ${vp2.w}x${vp2.h}  --s=${s2}  transform=${tf2}`);
  check('4K: scale ratio is 2', s2 === '2', `--s=${s2}, transform=${tf2}`);
  await shot(page, '16_4k_idle.png');
  await hitClick(page, '#token-yukishiro');
  await waitLocks(page, 7, 8000);
  check('4K: quick-dial works at rendered 4K positions', (await reg(page, 'state')) === 'pending');
  await shot(page, '17_4k_pending.png');

  /* ---- wrap up ---- */
  check('no page errors during entire run', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 400));

  await browser.close();

  console.log('\n# screenshot sizes (bytes):');
  for (const f of ['05_buildup_1080.png', '06_breakthrough_1080.png', '07_active_1080.png']) {
    console.log(`#   ${f}: ${statSync(join(SHOTS, f)).size}`);
  }
  console.log(`\n${results.length} checks, ${failures} failures`);
  process.exit(failures ? 1 : 0);
};

run().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
