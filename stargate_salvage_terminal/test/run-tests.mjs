// BONEYARD automated bench. puppeteer-core + system Chrome, real mouse events
// hit-tested at rendered positions. Spawns its own copy of server.js on a test
// port so the dev server (8733) is never touched.
//
// Automated passes here are evidence, not proof — operator hands-on use is the
// real final check. Screenshots land in test/screenshots/, a JSON summary in
// test/results.json.
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PNG } from 'pngjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..');
const SHOTS = path.join(here, 'screenshots');
const PORT = Number(process.env.TEST_PORT) || 8734;
const URL = `http://127.0.0.1:${PORT}/?test`;
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
mkdirSync(SHOTS, { recursive: true });

const results = [];
let pass = 0, fail = 0;
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail: String(detail) });
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- server ----------
const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
async function waitServer() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(URL); if (r.ok) return; } catch {}
    await sleep(100);
  }
  throw new Error('test server did not come up');
}

// ---------- helpers ----------
let page;
const B = () => page.evaluate(() => {
  const b = window.__boneyard, S = b.S;
  return { state: S.state, seated: S.seated.slice(), queue: S.queue.slice(), job: S.job ? S.job.stage : null,
    lockout: S.lockout, cover: S.coverOpen, lever: S.breachLever, playback: !!S.playback, route: S.route ? S.route.id : null,
    lit: b.lit(), head: b.headAngle(), dogs: [0,1,2,3,4,5].map(k => ({ a: b.dogAngle(k), r: b.dogRadius(k) })),
    sel: S.sel, fit: b.fit(), log: S.log.map(l => l.raw || l.txt), events: S.events.length };
});
async function center(sel) {
  return page.evaluate(sel => {
    const el = document.querySelector(sel); if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  }, sel);
}
async function hitTop(x, y) {
  return page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? (e.id || e.className.baseVal || e.className || e.tagName) : null; }, [x, y]);
}
async function hitIs(sel, x, y) {
  return page.evaluate(([sel, x, y]) => { const t = document.querySelector(sel); const e = document.elementFromPoint(x, y); return !!(t && e && (e === t || t.contains(e))); }, [sel, x, y]);
}
// real click at the rendered center, only if that point actually hits the control
async function click(sel, expectHit = true) {
  const c = await center(sel);
  if (!c) throw new Error('no element ' + sel);
  const hit = await hitIs(sel, c.x, c.y);
  if (expectHit && !hit) throw new Error(`${sel} not on top at its own center (top is ${await hitTop(c.x, c.y)})`);
  await page.mouse.click(c.x, c.y);
  return hit;
}
async function waitFor(fn, ms = 8000, step = 40) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { const v = await fn(); if (v) return v; await sleep(step); }
  return null;
}
async function shot(name) {
  const f = path.join(SHOTS, name + '.png');
  await page.screenshot({ path: f });
  return f;
}
// average luminance inside the aperture (page-space crop) of a saved screenshot
async function apertureLum(file) {
  const box = await page.evaluate(() => {
    // derive from the ring svg (always laid out) rather than the canvas (hidden when idle)
    const r = document.getElementById('ring').getBoundingClientRect();
    const w = r.width * (2 * 176 / 600);
    return { x: r.left + r.width / 2 - w / 2, y: r.top + r.height / 2 - w / 2, w, h: w };
  });
  const png = PNG.sync.read(readFileSync(file));
  let sum = 0, n = 0, warm = 0;
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2, rad = box.w * 0.4;
  for (let y = Math.floor(cy - rad); y < cy + rad; y += 2) for (let x = Math.floor(cx - rad); x < cx + rad; x += 2) {
    if ((x - cx) ** 2 + (y - cy) ** 2 > rad * rad) continue;
    const i = (y * png.width + x) * 4;
    const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
    sum += 0.2126 * r + 0.7152 * g + 0.0722 * b; warm += r - b; n++;
  }
  return { lum: sum / n, warm: warm / n };
}
async function stepTo(mark) {
  // step the selector with real clicks on the arrow buttons until the readout shows `mark`
  const live = await page.evaluate(() => window.__boneyard.LIVE);
  const target = live.indexOf(mark);
  for (let i = 0; i < 20; i++) {
    const s = await B();
    if (s.sel === target) return true;
    const d = ((target - s.sel + live.length) % live.length) <= live.length / 2 ? 1 : -1;
    await click(d > 0 ? '#stepR' : '#stepL');
    await sleep(30);
  }
  return false;
}

// ---------- scenarios ----------
async function main() {
  await waitServer();
  const browser = await puppeteer.launch({ executablePath: await resolveChrome(), headless: 'new', args: ['--window-size=1920,1080', '--autoplay-policy=no-user-gesture-required'], defaultViewport: { width: 1920, height: 1080 } });
  page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL, { waitUntil: 'load' });
  await sleep(500);

  // --- cold start ---
  let s = await B();
  check('cold start: state idle', s.state === 'idle', s.state);
  check('cold start: no dogs seated, none lit', s.seated.length === 0 && s.lit.length === 0);
  check('cold start: lockout released', s.lockout === false);
  check('cold start: breach cover shut', s.cover === false);
  check('cold start: aperture canvas hidden', await page.evaluate(() => document.getElementById('aperture').hidden));
  check('cold start: dogs parked in bay', s.dogs.every((d, k) => Math.abs(d.a - [104,113,122,131,140,149][k]) < 0.01 && d.r === 284), JSON.stringify(s.dogs.map(d => Math.round(d.a))));
  check('[hidden] reset present', await page.evaluate(() => { const d = document.createElement('div'); d.style.display = 'flex'; d.hidden = true; document.body.appendChild(d); const ok = getComputedStyle(d).display === 'none'; d.remove(); return ok; }));
  const fit1080 = await page.evaluate(() => getComputedStyle(document.getElementById('console')).transform);
  check('fit: console transform is not "none" at 1920x1080', fit1080 !== 'none', fit1080);
  await shot('01-idle');

  // --- geometry audit: every core control is on top at its own center ---
  for (const sel of ['#rotary', '#stepL', '#stepR', '#seat', '#hinge', '#drop', '#lockout', '#spk', '#cass-c1', '#cass-c5']) {
    const c = await center(sel);
    check(`hit-test: ${sel} reachable at center`, await hitIs(sel, c.x, c.y), `top=${await hitTop(c.x, c.y)}`);
  }
  {
    const c = await center('#breach');
    check('hit-test: cover occludes BREACH while shut', (await hitTop(c.x, c.y)) === 'cover', await hitTop(c.x, c.y));
  }

  // --- manual dial: 6 marks by hand, real clicks ---
  const hand = [0, 5, 9, 14, 3, 7];
  let midShotTaken = false, sawTravel = false;
  const seatT = [];
  for (let i = 0; i < hand.length; i++) {
    check(`manual: step selector to ${hand[i]}`, await stepTo(hand[i]));
    await click('#seat');
    const t0 = Date.now();
    // watch the dog actually move along the rail (staged, not instantaneous)
    const trav = await waitFor(async () => { const b = await B(); return b.job === 'travel' ? b : null; }, 3000, 20);
    if (trav) {
      sawTravel = true;
      await sleep(120);
      const mid = await B();
      const parked = [104,113,122,131,140,149][i];
      const target = await page.evaluate(m => window.__boneyard.angOf(m), hand[i]);
      const a = ((mid.dogs[i].a % 360) + 360) % 360, tg = ((target % 360) + 360) % 360;
      const moving = Math.abs(a - parked) > 2 && Math.abs(a - tg) > 2;
      if (!midShotTaken && moving) { await shot('02-manual-dog-travelling'); midShotTaken = true; }
      if (i === 0) check('manual: dog 1 caught mid-rail between bay and mark', moving, `angle=${a.toFixed(1)} bay=${parked} mark=${tg}`);
    }
    const ok = await waitFor(async () => { const b = await B(); return b.seated.length === i + 1 && b.job === null ? b : null; }, 6000);
    seatT.push(Date.now() - t0);
    check(`manual: mark ${hand[i]} seated by dog ${i + 1}`, !!ok && ok.seated[i] === hand[i], ok ? `seated=${ok.seated} ${Date.now() - t0}ms` : 'timeout');
  }
  check('manual: travel stage observed', sawTravel);
  s = await B();
  check('manual: all six lit on the collar', s.lit.length === 6 && hand.every(m => s.lit.includes(m)), s.lit.join(','));
  check('manual: dogs clamped at mark angles', s.dogs.every((d, k) => Math.abs(d.r - 266) < 0.01), s.dogs.map(d => d.r).join(','));
  await shot('03-pending');
  const pendLum = await apertureLum(path.join(SHOTS, '03-pending.png'));

  // --- no auto-fire ---
  await sleep(1500);
  s = await B();
  check('no auto-fire: still pending 1.5s after 6th seat', s.state === 'pending', s.state);
  check('no auto-fire: aperture still hidden', await page.evaluate(() => document.getElementById('aperture').hidden));
  check('ready lamp lit', await page.evaluate(() => document.getElementById('readyLamp').classList.contains('on')));

  // --- covered breach ---
  {
    const c = await center('#breach');
    await page.mouse.click(c.x, c.y);
    await sleep(200);
    s = await B();
    check('cover: clicking switch through shut cover does nothing', s.state === 'pending' && s.log.some(l => /COVER IS SHUT/.test(l)), s.state);
  }
  // --- 7th seat refused while pending ---
  await stepTo(1); await click('#seat'); await sleep(150);
  s = await B();
  check('pending: extra SEAT refused', s.state === 'pending' && s.seated.length === 6 && s.log.some(l => /ALL SIX DOGS DOWN/.test(l)));

  // --- lockout blocks breach, releases, then breach fires ---
  await click('#lockout'); await sleep(100);
  await click('#hinge'); await sleep(320);
  check('cover lifted via hinge', (await B()).cover === true);
  {
    const c = await center('#breach');
    check('hit-test: BREACH on top once cover open', await hitIs('#breach', c.x, c.y), await hitTop(c.x, c.y));
  }
  await click('#breach'); await sleep(200);
  s = await B();
  check('lockout: BREACH refused while engaged', s.state === 'pending' && s.lockout === true && s.log.some(l => /BREACH REFUSED/.test(l)), s.state);
  check('lockout: lamp flashing + alarm class', await page.evaluate(() => document.getElementById('lockLamp').classList.contains('flash') && document.getElementById('console').classList.contains('alarm')));
  await shot('04-lockout-alarm');
  await click('#lockout'); await sleep(100);
  check('lockout released', (await B()).lockout === false);

  await click('#breach');
  const tB = Date.now();
  await sleep(200);
  s = await B();
  check('breach: buildup begins', s.state === 'buildup', s.state);
  await sleep(1100);
  s = await B();
  check('breach: still in buildup at +1.3s (real tension, not a flip)', s.state === 'buildup', s.state);
  await shot('05-buildup');
  const buildLum = await apertureLum(path.join(SHOTS, '05-buildup.png'));
  const bt = await waitFor(async () => { const b = await B(); return b.state === 'breakthrough' ? b : null; }, 3000, 15);
  check('breach: breakthrough instant reached', !!bt, bt ? `${Date.now() - tB}ms after throw` : 'never');
  await shot('06-breakthrough');
  const breakLum = await apertureLum(path.join(SHOTS, '06-breakthrough.png'));
  const act = await waitFor(async () => { const b = await B(); return b.state === 'active' ? b : null; }, 3000, 15);
  check('breach: sustained active reached', !!act);
  await sleep(600);
  await shot('07-active');
  const actLum = await apertureLum(path.join(SHOTS, '07-active.png'));
  const lums = { pending: pendLum, buildup: buildLum, breakthrough: breakLum, active: actLum };
  console.log('aperture luminance/warmth:', JSON.stringify(lums, (k, v) => typeof v === 'number' ? +v.toFixed(1) : v));
  const dist = (a, b) => Math.hypot(a.lum - b.lum, (a.warm - b.warm) * 0.6);
  check('three stages visibly distinct (pending/buildup/breakthrough/active pairwise)',
    dist(pendLum, buildLum) > 8 && dist(buildLum, breakLum) > 25 && dist(breakLum, actLum) > 25 && dist(buildLum, actLum) > 15 && dist(pendLum, actLum) > 25,
    `pend ${pendLum.lum.toFixed(0)} build ${buildLum.lum.toFixed(0)} break ${breakLum.lum.toFixed(0)} active ${actLum.lum.toFixed(0)}`);
  check('active: aperture canvas visible', !(await page.evaluate(() => document.getElementById('aperture').hidden)));

  // --- disengage while active ---
  check('active: DROP is enabled', !(await page.evaluate(() => document.getElementById('drop').disabled)));
  await click('#drop');
  const idle = await waitFor(async () => { const b = await B(); return b.state === 'idle' ? b : null; }, 6000);
  check('drop: returns to idle', !!idle);
  s = await B();
  check('drop: dogs back in bay, nothing lit', s.seated.length === 0 && s.lit.length === 0 && s.dogs.every((d, k) => Math.abs(((d.a % 360) + 360) % 360 - [104,113,122,131,140,149][k]) < 0.5 && Math.abs(d.r - 284) < 0.01), s.dogs.map(d => Math.round(d.a)).join(','));
  check('drop: breach lever reset', s.lever === false);
  await shot('08-after-drop');

  // --- cycle 2: cassette auto-dial (tape pace, per-mark, no auto-fire) ---
  await click('#cass-c2');
  const tT = Date.now();
  const seatStamps = [];
  let midTape = false;
  let last = 0;
  const pend2 = await waitFor(async () => {
    const b = await B();
    if (b.seated.length > last) { last = b.seated.length; seatStamps.push(Date.now() - tT); }
    if (!midTape && b.job === 'travel') { midTape = true; await shot('09-tape-dog-travelling'); }
    return b.state === 'pending' ? b : null;
  }, 15000, 15);
  check('tape: reaches pending', !!pend2, `${Date.now() - tT}ms total`);
  const gaps = seatStamps.slice(1).map((v, i) => v - seatStamps[i]);
  check('tape: six seats landed one at a time', seatStamps.length === 6, seatStamps.join(','));
  check('tape: per-mark gaps are visible (>250ms) not instantaneous', gaps.length === 5 && gaps.every(g => g > 250), gaps.join(','));
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  check('tape: faster than hand pace (mean per mark) but never instant', gaps.length && mean(gaps) < mean(seatT) * 0.75 && Math.max(...gaps) < 1000 && Math.min(...gaps) > 250, `tape mean ${mean(gaps).toFixed(0)}ms max ${Math.max(...gaps)}ms vs hand mean ${mean(seatT).toFixed(0)}ms`);
  check('tape: mid-sequence screenshot captured with a dog on the rail', midTape);
  s = await B();
  check('tape: address matches cassette', JSON.stringify(s.seated) === JSON.stringify([1, 10, 4, 15, 8, 2]), s.seated.join(','));
  await sleep(1200);
  check('tape: no auto-fire after last seat', (await B()).state === 'pending');
  await shot('10-tape-pending');
  check('tape: cover still open from cycle 1', (await B()).cover === true);
  await click('#breach');
  const act2 = await waitFor(async () => { const b = await B(); return b.state === 'active' ? b : null; }, 6000, 20);
  check('tape: breach → active on cycle 2', !!act2);
  await click('#drop');
  check('cycle 2: drop → idle', !!(await waitFor(async () => (await B()).state === 'idle', 6000)));

  // --- cycle 3: hand dial again after two drops (redial works) ---
  await stepTo(2); await click('#seat');
  check('cycle 3: seat after two drops', !!(await waitFor(async () => (await B()).seated.length === 1, 6000)));
  await click('#drop');
  check('cycle 3: drop from partial', !!(await waitFor(async () => (await B()).state === 'idle', 6000)));

  // --- rapid input: three fast step+seat presses all land ---
  {
    await stepTo(4);
    await click('#seat'); await click('#stepR'); await click('#seat'); await click('#stepR'); await click('#seat');
    const r = await waitFor(async () => { const b = await B(); return b.seated.length === 3 && b.job === null ? b : null; }, 12000);
    check('rapid: three fast SEAT flicks all queue and land', !!r && JSON.stringify(r.seated) === JSON.stringify([4, 5, 6]), r ? r.seated.join(',') : 'timeout');
    await click('#drop');
    await waitFor(async () => (await B()).state === 'idle', 6000);
  }

  // --- lockout mid-tape halts with one alarm; SEAT refused while locked ---
  await click('#cass-c1');
  await waitFor(async () => (await B()).seated.length === 2, 8000);
  await click('#lockout');
  await sleep(50);
  const halted = await waitFor(async () => { const b = await B(); return b.job === null && !b.playback ? b : null; }, 5000);
  check('lockout mid-tape: playback halted', !!halted && halted.seated.length <= 3 && halted.log.some(l => /SEQUENCE HALTED/.test(l)), halted ? `seated=${halted.seated.length}` : 'timeout');
  await stepTo(11); await click('#seat'); await sleep(150);
  s = await B();
  check('lockout: SEAT refused while engaged', s.log.some(l => /SEAT REFUSED/.test(l)) && !s.seated.includes(11));
  await click('#lockout');
  await click('#drop');
  await waitFor(async () => (await B()).state === 'idle', 6000);

  // --- dead route: buildup, breakthrough, then no carrier ---
  await click('#cass-c5');
  check('dead route: tape reaches pending', !!(await waitFor(async () => (await B()).state === 'pending', 15000)));
  await click('#breach');
  const col = await waitFor(async () => { const b = await B(); return b.state === 'collapse' ? b : null; }, 6000, 15);
  check('dead route: collapses after breakthrough', !!col);
  await shot('11-collapse');
  const idle3 = await waitFor(async () => { const b = await B(); return b.state === 'idle' ? b : null; }, 8000);
  check('dead route: auto-drop to idle with NO CARRIER logged', !!idle3 && idle3.log.some(l => /NO CARRIER/.test(l)) && idle3.seated.length === 0);

  // --- dead segment never seatable; readout skips it ---
  check('dead seg 13 absent from selector', !(await page.evaluate(() => window.__boneyard.LIVE.includes(12))));

  // --- control-type audit ---
  check('core loop uses 2 control clusters', (await page.evaluate(() => document.querySelectorAll('.cluster').length)) === 2);

  // --- fit at 4K ---
  await page.setViewport({ width: 3840, height: 2160 });
  await sleep(600);
  const fit4k = await page.evaluate(() => ({ tf: getComputedStyle(document.getElementById('console')).transform, fit: window.__boneyard.fit(), w: innerWidth, h: innerHeight }));
  check('fit: transform not "none" at 3840x2160', fit4k.tf !== 'none' && Number(fit4k.fit) > 1.5, JSON.stringify(fit4k));
  await shot('12-4k-idle');
  await page.setViewport({ width: 1920, height: 1080 });

  check('no page errors during bench', errors.length === 0, errors.slice(0, 3).join(' | '));

  await browser.close();
}

main().catch(e => { console.error('BENCH CRASH', e); fail++; results.push({ name: 'bench crashed', ok: false, detail: String(e) }); })
  .finally(() => {
    server.kill();
    writeFileSync(path.join(here, 'results.json'), JSON.stringify({ when: new Date().toISOString(), pass, fail, results }, null, 2));
    console.log(`\n${pass} passed, ${fail} failed. Automated evidence only — operator hands-on testing is the real final check.`);
    process.exit(fail ? 1 : 0);
  });
