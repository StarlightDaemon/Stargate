// SPLITTERLICHT - automated verification harness.
// puppeteer-core + the system Chrome, hit-tested real mouse events, screenshots.
// Run: npm test   (serves the build itself on port 8841)
//
// Automated interaction testing is necessary but not sufficient. Operator hands-on
// testing remains the real final check; this harness reports evidence, not proof.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { PNG } from 'pngjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const shots = path.join(here, 'shots');
mkdirSync(shots, { recursive: true });

const PORT = Number(process.env.TEST_PORT) || 8841;
const URL = `http://localhost:${PORT}/`;

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

const results = [];
let passCount = 0, failCount = 0;
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail === undefined ? '' : String(detail) });
  if (ok) passCount++; else failCount++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail !== undefined ? '  -- ' + detail : ''}`);
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---------- server ----------
const server = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
async function waitServer() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(URL); if (r.ok) return true; } catch (e) {}
    await sleep(100);
  }
  return false;
}

// ---------- image stats ----------
function stats(buf) {
  const png = PNG.sync.read(buf);
  let lum = 0, warm = 0; const n = png.width * png.height;
  for (let i = 0; i < n; i++) {
    const r = png.data[i * 4], g = png.data[i * 4 + 1], b = png.data[i * 4 + 2];
    lum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    warm += r - b;
  }
  return { lum: lum / n, warm: warm / n, w: png.width, h: png.height };
}
function diffCount(a, b) {
  const A = PNG.sync.read(a), B = PNG.sync.read(b);
  const n = Math.min(A.width * A.height, B.width * B.height);
  let d = 0;
  for (let i = 0; i < n; i++) {
    if (Math.abs(A.data[i * 4] - B.data[i * 4]) + Math.abs(A.data[i * 4 + 1] - B.data[i * 4 + 1]) + Math.abs(A.data[i * 4 + 2] - B.data[i * 4 + 2]) > 60) d++;
  }
  return d;
}
const RING_CLIP = { x: 1000, y: 100, width: 680, height: 680 };

(async () => {
  const up = await waitServer();
  check('server answers HTTP 200 on the test port', up, URL);
  if (!up) { server.kill(); process.exit(1); }

  for (const f of ['index.html', 'style.css', 'app.js']) {
    const r = await fetch(URL + f);
    check(`GET /${f} -> 200`, r.status === 200, `status ${r.status}, ${(await r.text()).length} bytes`);
  }

  const browser = await puppeteer.launch({
    executablePath: await resolveChrome(),
    headless: true,
    args: ['--window-size=1920,1080', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--no-first-run'],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') { const loc = m.location() || {}; errors.push(`console.error: ${m.text()} @ ${loc.url || '?'}`); } });
  page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
  page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });

  await page.goto(URL, { waitUntil: 'load' });
  await sleep(300);

  const st = () => page.evaluate(() => window.__splitterlicht.state());
  async function waitFor(fn, timeout, label) {
    const t0 = Date.now();
    let polls = 0;
    while (Date.now() - t0 < timeout) {
      const s = await st();
      polls++;
      if (fn(s)) return s;
      await sleep(40);
    }
    const s = await st();
    throw new Error(`timeout waiting for ${label} after ${polls} polls; phase=${s.phase} locked=${s.locked.length}`);
  }
  async function hit(sel) {
    return page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return { ok: false, why: 'no element ' + sel };
      const b = el.getBoundingClientRect();
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const h = document.elementFromPoint(cx, cy);
      const ok = !!h && (h === el || el.contains(h));
      return { ok, cx, cy, hit: h ? (h.tagName + (h.id ? '#' + h.id : '') + (h.className && typeof h.className === 'string' ? '.' + h.className.split(' ').join('.') : '')) : null };
    }, sel);
  }
  async function click(sel, label) {
    const h = await hit(sel);
    check(`hit-test ${label || sel} at (${Math.round(h.cx)},${Math.round(h.cy)})`, h.ok, h.ok ? 'topmost is the control' : `topmost was ${h.hit}`);
    if (!h.ok) throw new Error('occluded: ' + sel);
    await page.mouse.click(h.cx, h.cy);
  }
  async function shot(name, clip) {
    const file = path.join(shots, name + '.png');
    const buf = await page.screenshot({ path: file, clip });
    return buf;
  }
  const glyphs = await page.evaluate(() => window.__splitterlicht.glyphs);
  const routes = await page.evaluate(() => window.__splitterlicht.routes);
  const treadSel = (i) => `#tread-${glyphs[i]}`;

  // ---------- 1. cold start ----------
  {
    const s = await st();
    check('cold start: phase sleep, no locks, no auto', s.phase === 'sleep' && s.locked.length === 0 && s.auto === null, JSON.stringify({ phase: s.phase, locked: s.locked }));
    check('cold start: bolt interlock released by default', s.bolt === false, `bolt=${s.bolt}`);
    check('cold start: alert hidden', await page.$eval('#alert', e => e.hidden), 'alert[hidden]');
    check('cold start: vortex (active iris) hidden', await page.$eval('#vortex', e => getComputedStyle(e).display === 'none'));
    check('cold start: opens=0 fails=0', s.opens === 0 && s.fails === 0);
    await shot('01_cold_start');
    const tf = await page.$eval('#scene', e => getComputedStyle(e).transform);
    check('scale transform applied at 1920x1080 (not "none")', tf !== 'none', tf);
    await page.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 1 });
    await sleep(250);
    const tf4k = await page.$eval('#scene', e => getComputedStyle(e).transform);
    const fit4k = await page.evaluate(() => window.__splitterlicht.state().fit);
    check('scale transform applied at 3840x2160 (fit ~2)', tf4k !== 'none' && Math.abs(fit4k - 2) < 0.01, `${tf4k}, --fit=${fit4k}`);
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await sleep(250);
    check('fit back to 1 at 1920x1080', Math.abs((await st()).fit - 1) < 0.01, `fit=${(await st()).fit}`);
  }

  // ---------- 2. geometry: every control reachable ----------
  {
    let all = true; const bad = [];
    for (let i = 0; i < 12; i++) { const h = await hit(treadSel(i)); if (!h.ok) { all = false; bad.push(glyphs[i] + ':' + h.hit); } }
    check('all 12 stair treads hit-test at their centers', all, bad.join(', ') || '12/12');
    all = true; bad.length = 0;
    for (const r of routes) { const h = await hit('#poster-' + r.id); if (!h.ok) { all = false; bad.push(r.id + ':' + h.hit); } }
    check('all 5 scar posters hit-test at their centers', all, bad.join(', ') || '5/5');
    for (const [sel, nm] of [['#btnTear', 'AUFREISSEN'], ['#btnWall', 'ZUMAUERN'], ['#btnBolt', 'RIEGEL']]) {
      const h = await hit(sel); check(`${nm} lever hit-tests`, h.ok, h.hit);
    }
    const mute = await hit('#btnMute'); check('mute toggle (corner chrome) hit-tests', mute.ok, mute.hit);
  }

  // ---------- 3. manual dial (route turmstadt, so the destination has a name) ----------
  const turm = routes.find(r => r.id === 'turmstadt');
  const shardFill = (i) => page.$eval(`#shard${i} polygon`, e => e.getAttribute('fill'));
  {
    const tilt0 = (await st()).tilt;
    check('shard 0 unfilled before any lock', (await shardFill(0)) === 'none');
    let midCrackSeen = null;
    for (let k = 0; k < 7; k++) {
      const g = turm.seq[k];
      await click(treadSel(g), `tread ${glyphs[g]}`);
      const s1 = await waitFor(s => s.phase === 'cracking' && s.pending === g, 1500, 'cracking');
      if (k === 2) {
        await sleep(350);
        const off = await page.$eval('#cracks path:last-child', e => ({ off: parseFloat(e.getAttribute('stroke-dashoffset')), len: parseFloat(e.getAttribute('stroke-dasharray')) }));
        midCrackSeen = off;
        await shot('02_manual_midcrack');
      }
      const s2 = await waitFor(s => s.locked.length === k + 1 && (s.phase === 'dialing' || s.phase === 'ready'), 3000, `lock ${k + 1}`);
      check(`manual lock ${k + 1}/7 = ${glyphs[g]} (phase ${s2.phase}, cracks ${s2.cracks})`, s2.locked[k] === g && s2.cracks === k + 1);
    }
    check('mid-crack: crack path partially drawn (0 < dashoffset < length)', midCrackSeen && midCrackSeen.off > 0 && midCrackSeen.off < midCrackSeen.len, JSON.stringify(midCrackSeen));
    check('shard 0 filled bone after lock', (await shardFill(0)) === '#efe3c6', await shardFill(0));
    const s = await st();
    check('after 7 locks: phase ready, dest not yet chosen', s.phase === 'ready' && s.locked.length === 7, s.phase);
    check('room keels as the wall fractures (tilt grew)', s.tilt > tilt0 + 3.5, `tilt ${tilt0.toFixed(2)} -> ${s.tilt.toFixed(2)}`);
    check('room transform applied', /rotate\(/.test(s.roomTransform) && /skewX\(/.test(s.roomTransform), s.roomTransform);
    await shot('03_ready');
  }

  // ---------- 4. no auto-fire ----------
  {
    await sleep(3500);
    const s = await st();
    check('NEGATIVE: 3.5 s after 7th lock the gate has NOT fired (still ready, opens=0)', s.phase === 'ready' && s.opens === 0, `phase=${s.phase} opens=${s.opens}`);
    check('AUFREISSEN lever is not "on" while merely ready', !(await page.$eval('#btnTear', e => e.classList.contains('on'))));
  }

  // ---------- 5. tear open: three stages ----------
  const stage = {};
  {
    stage.ready = stats(await shot('04_stage_ready', RING_CLIP));
    const tiltReady = (await st()).tilt;
    await click('#btnTear', 'AUFREISSEN');
    const b = await waitFor(s => s.phase === 'buildup', 1000, 'buildup');
    check('AUFREISSEN -> buildup', b.phase === 'buildup');
    await sleep(1200);
    const sb = await st();
    check('buildup still running at +1.2 s (genuine tension, not a flip)', sb.phase === 'buildup', sb.phase);
    stage.buildup = stats(await shot('05_stage_buildup', RING_CLIP));
    const tiltB = sb.tilt;
    await waitFor(s => s.phase === 'breakthrough', 3000, 'breakthrough');
    stage.breakthrough = stats(await shot('06_stage_breakthrough', RING_CLIP));
    const sbk = await st();
    check('breakthrough reached (a distinct instant)', sbk.phase === 'breakthrough' || sbk.phase === 'active', sbk.phase);
    const a = await waitFor(s => s.phase === 'active', 3000, 'active');
    check('sustained active reached, destination named', a.phase === 'active' && a.dest === 'turmstadt' && a.opens === 1, `dest=${a.dest} opens=${a.opens}`);
    await sleep(600);
    stage.active = stats(await shot('07_stage_active', RING_CLIP));
    await shot('08_active_full');
    check('vortex iris visible while active', await page.$eval('#vortex', e => getComputedStyle(e).display !== 'none'));
    const r1 = await page.$eval('#iris', e => e.getAttribute('transform'));
    await sleep(320);
    const r2 = await page.$eval('#iris', e => e.getAttribute('transform'));
    check('iris judders (rotation attribute changes over 320 ms)', r1 !== r2, `${r1} -> ${r2}`);
    check('buildup tilt exceeds ready tilt (the room lurches)', tiltB > tiltReady + 1.5, `ready ${tiltReady.toFixed(2)} -> buildup ${tiltB.toFixed(2)}`);
    check('active tilt snaps negative (keeled the other way)', a.tilt < 0, `active tilt ${a.tilt.toFixed(2)}`);

    const names = ['ready', 'buildup', 'breakthrough', 'active'];
    let minD = Infinity, pair = '';
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      const A = stage[names[i]], B = stage[names[j]];
      const d = Math.hypot(A.lum - B.lum, A.warm - B.warm);
      if (d < minD) { minD = d; pair = `${names[i]}/${names[j]}`; }
    }
    const desc = names.map(n => `${n}: lum ${stage[n].lum.toFixed(0)} warm ${stage[n].warm.toFixed(0)}`).join('; ');
    check(`all four stages pairwise distinct in (luminance, warmth), min distance ${minD.toFixed(1)} (${pair}) >= 25`, minD >= 25, desc);
    check('breakthrough is the brightest instant', stage.breakthrough.lum > stage.buildup.lum && stage.breakthrough.lum > stage.active.lum && stage.breakthrough.lum > stage.ready.lum);
  }

  // ---------- 6. disengage while active ----------
  {
    await click('#btnWall', 'ZUMAUERN (while active)');
    const w = await waitFor(s => s.phase === 'walling', 1000, 'walling');
    check('ZUMAUERN while active -> walling', w.phase === 'walling');
    const s = await waitFor(s => s.phase === 'sleep', 2000, 'sleep');
    check('walled up: sleep, 0 locks, 0 cracks, vortex hidden', s.locked.length === 0 && s.cracks === 0 && await page.$eval('#vortex', e => getComputedStyle(e).display === 'none'));
    check('shard 0 unfilled again after walling up', (await shardFill(0)) === 'none');
    await shot('09_walled_up');
  }

  // ---------- 7. second full cycle: an unnamed manual address ----------
  {
    const seq = [0, 2, 4, 6, 8, 10, 11];
    for (let k = 0; k < 7; k++) {
      await click(treadSel(seq[k]), `cycle2 tread ${glyphs[seq[k]]}`);
      await waitFor(s => s.locked.length === k + 1, 3000, `cycle2 lock ${k + 1}`);
    }
    const r = await waitFor(s => s.phase === 'ready', 1000, 'ready');
    check('cycle 2: seven manual locks -> ready', r.locked.length === 7);
    await click('#btnTear', 'AUFREISSEN (cycle 2)');
    const a = await waitFor(s => s.phase === 'active', 5000, 'active (cycle 2)');
    check('cycle 2: unnamed address opens (dest null, opens=2)', a.dest === null && a.opens === 2, `dest=${a.dest} opens=${a.opens}`);
    await click('#btnWall', 'ZUMAUERN (cycle 2)');
    const s = await waitFor(s => s.phase === 'sleep', 2000, 'sleep (cycle 2)');
    check('cycle 2: walled up back to sleep', s.locked.length === 0);
  }

  // ---------- 8. rapid clicks queue (faster than the crack animation) ----------
  {
    for (const g of [1, 3, 5]) { const h = await hit(treadSel(g)); await page.mouse.click(h.cx, h.cy); await sleep(30); }
    const s0 = await st();
    check('three clicks in ~90 ms: one pending + two queued (nothing dropped)', (s0.pending !== null ? 1 : 0) + s0.queue.length + s0.locked.length === 3, JSON.stringify({ pending: s0.pending, queue: s0.queue, locked: s0.locked }));
    const s = await waitFor(s => s.locked.length === 3 && s.phase === 'dialing', 6000, 'three locks');
    check('all three rapid clicks locked in order', s.locked.join(',') === '1,3,5', s.locked.join(','));
    // duplicate + rejections
    await click(treadSel(3), 'duplicate tread');
    await sleep(200);
    const d = await st();
    check('duplicate glyph rejected (still 3 locks, message says already cracked)', d.locked.length === 3 && d.queue.length === 0 && /SCHON GERISSEN/.test(d.msg.de), d.msg.de);
    await click('#btnTear', 'AUFREISSEN with only 3 locks');
    await sleep(200);
    const t = await st();
    check('AUFREISSEN with 3 locks refused (still dialing)', t.phase === 'dialing' && t.opens === 2, `${t.phase} ${t.msg.de}`);
    await click('#btnWall', 'ZUMAUERN (after rapid test)');
    await waitFor(s => s.phase === 'sleep', 2000, 'sleep');
  }

  // ---------- 9. bolt interlock blocks dialing ----------
  {
    await click('#btnBolt', 'RIEGEL (engage)');
    await sleep(100);
    const b = await st();
    check('bolt engages on click', b.bolt === true);
    await click(treadSel(4), 'tread while bolted');
    await sleep(150);
    const s = await st();
    check('bolted: tread click refused, big alert raised, nothing queued', s.locked.length === 0 && s.queue.length === 0 && s.pending === null && s.alert === 'RIEGEL VOR!', JSON.stringify({ alert: s.alert, msg: s.msg.de }));
    check('alert banner visible', !(await page.$eval('#alert', e => e.hidden)));
    await shot('10_bolt_alert');
    await click('#poster-gasse', 'poster while bolted');
    await sleep(150);
    const p = await st();
    check('bolted: scar poster refused (no auto)', p.auto === null && p.locked.length === 0);
    await waitFor(s => s.alert === null, 3000, 'alert cleared');
    check('alert clears itself', (await st()).alert === null);
    await click('#btnBolt', 'RIEGEL (release)');
    await sleep(100);
    check('bolt releases on second click', (await st()).bolt === false);
  }

  // ---------- 10. bolt blocks the tear lever when ready ----------
  {
    await click('#poster-gasse', 'poster DIE SCHIEFE GASSE');
    await waitFor(s => s.phase === 'ready', 10000, 'ready via scar');
    await click('#btnBolt', 'RIEGEL (engage while ready)');
    await sleep(80);
    await click('#btnTear', 'AUFREISSEN while bolted');
    await sleep(250);
    const s = await st();
    check('bolted: AUFREISSEN refused, still ready, alert raised', s.phase === 'ready' && s.alert === 'RIEGEL VOR!' && s.opens === 2, `${s.phase} alert=${s.alert}`);
    await click('#btnBolt', 'RIEGEL (release while ready)');
    await sleep(80);
    await click('#btnTear', 'AUFREISSEN after release');
    const a = await waitFor(s => s.phase === 'active', 5000, 'active after bolt release');
    check('after release the same lever opens the gate (dest gasse)', a.dest === 'gasse' && a.opens === 3);
    await click('#btnWall', 'ZUMAUERN');
    await waitFor(s => s.phase === 'sleep', 2000, 'sleep');
  }

  // ---------- 11. quick-dial: an old scar reopens with visible staging ----------
  {
    const opens0 = (await st()).opens;
    await click('#poster-hohlsee', 'poster HOHLSEE');
    const t0 = Date.now();
    const samples = [];
    let midShots = {};
    let s;
    do {
      s = await st();
      samples.push({ t: Date.now() - t0, locked: s.locked.length, phase: s.phase });
      if (s.locked.length === 2 && !midShots.a) midShots.a = await shot('11_scar_mid_2locks', RING_CLIP);
      if (s.locked.length === 5 && !midShots.b) midShots.b = await shot('12_scar_mid_5locks', RING_CLIP);
      if (s.locked.length === 4 && !midShots.full) midShots.full = await shot('13_scar_mid_full');
      await sleep(60);
    } while (s.phase !== 'ready' && Date.now() - t0 < 12000);
    const elapsed = Date.now() - t0;
    check('scar auto-dials to ready', s.phase === 'ready' && s.locked.join(',') === routes.find(r => r.id === 'hohlsee').seq.join(','), s.locked.join(','));
    const counts = [...new Set(samples.map(x => x.locked))];
    const monotone = samples.every((x, i) => i === 0 || x.locked >= samples[i - 1].locked);
    check(`scar dial is staged: ${counts.length} distinct lock counts observed (${counts.join(',')}), monotone`, counts.length >= 6 && monotone);
    check(`scar dial faster than manual but not instant (${elapsed} ms for 7; manual ~9.6 s)`, elapsed > 2500 && elapsed < 8000);
    const dd = midShots.a && midShots.b ? diffCount(midShots.a, midShots.b) : -1;
    check(`mid-sequence screenshots differ (2 locks vs 5 locks: ${dd} px changed)`, dd > 5000);
    await sleep(2500);
    const s2 = await st();
    check('NEGATIVE: scar dial lands ready and does NOT auto-fire', s2.phase === 'ready' && s2.opens === opens0, `phase=${s2.phase} opens=${s2.opens}`);
    await click('#btnTear', 'AUFREISSEN (after scar)');
    const a = await waitFor(s => s.phase === 'active', 5000, 'active after scar');
    check('scar address opens on the lever (dest hohlsee)', a.dest === 'hohlsee');
    await click('#btnWall', 'ZUMAUERN (after scar)');
    await waitFor(s => s.phase === 'sleep', 2000, 'sleep');
  }

  // ---------- 12. disengage mid-scar ----------
  {
    await click('#poster-turmstadt', 'poster TURMSTADT OBEN');
    await waitFor(s => s.locked.length >= 2, 5000, 'two scar locks');
    await click('#btnWall', 'ZUMAUERN mid-scar');
    const s = await waitFor(s => s.phase === 'sleep', 3000, 'sleep after mid-scar wall');
    check('ZUMAUERN mid-scar cancels the scar (auto null, 0 locks)', s.auto === null && s.locked.length === 0 && s.queue.length === 0);
    await sleep(1500);
    check('cancelled scar does not resume', (await st()).locked.length === 0 && (await st()).auto === null);
  }

  // ---------- 13. bolt thrown mid-scar halts it with one alert ----------
  {
    await click('#poster-fabrik', 'poster SCHLAFENDE FABRIK');
    await waitFor(s => s.locked.length >= 2, 5000, 'two scar locks');
    await click('#btnBolt', 'RIEGEL mid-scar');
    await sleep(900);
    const s = await st();
    check('bolt mid-scar: scar halted (auto null, autoHalted), locks frozen at 2-3, alert raised', s.auto === null && s.autoHalted && s.locked.length >= 2 && s.locked.length <= 3 && s.alert === 'RIEGEL VOR!', JSON.stringify({ locked: s.locked.length, alert: s.alert }));
    await sleep(1200);
    check('halted scar stays halted', (await st()).locked.length === s.locked.length);
    await click('#btnBolt', 'RIEGEL release');
    await click('#btnWall', 'ZUMAUERN after halt');
    await waitFor(s => s.phase === 'sleep', 2000, 'sleep');
  }

  // ---------- 14. the dark route: the wall holds ----------
  {
    const fails0 = (await st()).fails, opens0 = (await st()).opens;
    await click('#poster-vermauert', 'poster DAS VERMAUERTE TOR');
    await waitFor(s => s.phase === 'ready', 10000, 'ready (dark)');
    await click('#btnTear', 'AUFREISSEN (dark)');
    await waitFor(s => s.phase === 'buildup', 1000, 'buildup (dark)');
    const f = await waitFor(s => s.phase === 'failing', 4000, 'failing');
    check('dark route: buildup runs, then the wall HOLDS (failing phase)', f.phase === 'failing' && f.dark === true);
    await shot('14_dark_wall_holds', RING_CLIP);
    const s = await waitFor(s => s.phase === 'sleep', 3000, 'sleep after failing');
    check('dark route ends back at sleep with 0 locks, fails+1, opens unchanged', s.locked.length === 0 && s.fails === fails0 + 1 && s.opens === opens0 && /MAUER HÄLT/.test(s.msg.de), s.msg.de);
  }

  // ---------- 15. errors ----------
  check('no page errors / console errors during the run', errors.length === 0, errors.join(' | ') || 'clean');

  await browser.close();
  server.kill();

  const summary = { pass: passCount, fail: failCount, total: passCount + failCount, at: new Date().toISOString(), stages: stage, results };
  writeFileSync(path.join(here, 'results.json'), JSON.stringify(summary, null, 2));
  console.log(`\n${passCount}/${passCount + failCount} checks passed. Screenshots in test/shots/.`);
  console.log('Automated evidence only - operator hands-on testing remains the real final check.');
  process.exit(failCount ? 1 : 0);
})().catch(async (e) => {
  console.error('HARNESS ERROR:', e.message);
  results.push({ name: 'harness completed', ok: false, detail: e.message });
  writeFileSync(path.join(here, 'results.json'), JSON.stringify({ pass: passCount, fail: failCount + 1, aborted: e.message, results }, null, 2));
  server.kill();
  process.exit(1);
});
