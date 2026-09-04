// HELIANTH self-test: drives the console in headless system Chrome with REAL mouse events,
// hit-tested at rendered positions (elementFromPoint before every click), and captures
// evidence screenshots. A pass here is necessary, not sufficient — operator hands-on
// testing is the real final check.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const URL = process.env.URL || 'http://127.0.0.1:8685/';
// Browser resolution. No absolute local filesystem path is committed here:
// CHROME_PATH (or PUPPETEER_EXECUTABLE_PATH) wins, otherwise puppeteer's own
// executable path is used. Anything else is an explicit error.
async function resolveChrome() {
  const fromEnv = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME;
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
const SHOTS = path.join(process.cwd(), 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
let failures = 0;
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: await resolveChrome(), headless: 'new',
  args: ['--window-size=1920,1080', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
await page.goto(URL, { waitUntil: 'load' });
await sleep(600);

const st = () => page.evaluate(() => window.__helianth.state());
async function waitFor(pred, timeout = 8000, every = 40) {
  const t0 = Date.now();
  for (;;) {
    const s = await st();
    if (pred(s)) return s;
    if (Date.now() - t0 > timeout) throw new Error('waitFor timeout: ' + pred.toString().slice(0, 80));
    await sleep(every);
  }
}
async function center(sel) {
  return page.evaluate((sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    return { x, y, w: r.width, h: r.height, hitOk: !!hit && (hit === e || e.contains(hit)), hitTag: hit ? hit.tagName + (hit.id ? '#' + hit.id : '') + '.' + hit.className : 'null', disabled: !!e.disabled };
  }, sel);
}
async function click(sel, expectHit = true) {
  const c = await center(sel);
  if (!c) throw new Error('no element ' + sel);
  if (expectHit && !c.hitOk) throw new Error(`occluded: ${sel} — elementFromPoint gave ${c.hitTag}`);
  await page.mouse.click(c.x, c.y);
  return c;
}
async function shot(name) {
  const p = path.join(SHOTS, name);
  await page.screenshot({ path: p });
  return p;
}
// mean luminance of a disc around the oculus (stage centre of the lantern at fit=1)
function oculusLuminance(file, cx = 490, cy = 460, r = 150) {
  const png = PNG.sync.read(fs.readFileSync(file));
  let sum = 0, n = 0;
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
    if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
    const i = (y * png.width + x) * 4;
    sum += 0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2]; n++;
  }
  return sum / n;
}
function warmth(file, cx = 490, cy = 460, r = 150) { // mean (R - B): daylight cream is low, sunwell is high
  const png = PNG.sync.read(fs.readFileSync(file));
  let sum = 0, n = 0;
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
    if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
    const i = (y * png.width + x) * 4;
    sum += png.data[i] - png.data[i + 2]; n++;
  }
  return sum / n;
}

/* ---------------------------------------------------------------- 1. boot */
{
  const s = await st();
  const dom = await page.evaluate(() => ({
    seeds: document.querySelectorAll('.seed').length, lights: document.querySelectorAll('#lights .light').length,
    pressings: document.querySelectorAll('.pressing').length, cvs: document.querySelectorAll('#seedRing .cv').length,
    fit: getComputedStyle(document.getElementById('stage')).transform, fitVar: getComputedStyle(document.documentElement).getPropertyValue('--fit').trim(),
    veilHidden: getComputedStyle(document.getElementById('frostVeil')).display, flashHidden: getComputedStyle(document.getElementById('flash')).display,
    frostPressed: document.getElementById('btnFrost').getAttribute('aria-pressed'), closeDisabled: document.getElementById('btnClose').disabled,
  }));
  check('boot: idle, 13 cultivars in tray and on the ring, 5 lights, 5 pressings', s.phase === 'idle' && dom.seeds === 13 && dom.cvs === 13 && dom.lights === 5 && dom.pressings === 5, JSON.stringify({ phase: s.phase, ...dom }));
  check('boot: frost shutter defaults to released', s.frost === false && dom.frostPressed === 'false');
  check('boot: [hidden] reset works (frost veil + flash display:none)', dom.veilHidden === 'none' && dom.flashHidden === 'none');
  check('boot: stage transform is a real matrix at 1920×1080', dom.fit !== 'none' && /^matrix/.test(dom.fit), `${dom.fit}, --fit=${dom.fitVar}`);
  check('boot: disengage (CLOSE THE LIGHTS) enabled at idle', dom.closeDisabled === false);
  await shot('01-idle.png');
}

/* ---------------------------------------------------------------- 2. every control reachable (hit-test at centre) */
{
  const sels = [...Array.from({ length: 13 }, (_, i) => `.seed:nth-child(${i + 1})`), '#btnGraft', '#btnOpen', '#btnClose', '#btnFrost', '#btnSound', ...['ashgrove', 'saltmarsh', 'mossbank', 'kestrel', 'hollins'].map((r) => `.pressing[data-route="${r}"]`)];
  const bad = [];
  for (const sel of sels) { const c = await center(sel); if (!c || !c.hitOk) bad.push(`${sel}→${c && c.hitTag}`); }
  check('geometry: all 23 controls hit-test to themselves at 1080p', bad.length === 0, bad.join('; ') || '23/23');
  await page.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 1 });
  await sleep(300);
  const fit4k = await page.evaluate(() => ({ t: getComputedStyle(document.getElementById('stage')).transform, k: window.__helianth.state().fitK }));
  const bad4k = [];
  for (const sel of sels) { const c = await center(sel); if (!c || !c.hitOk) bad4k.push(sel); }
  check('geometry: stage scales at simulated 4K (3840×2160) and controls still hit-test', /^matrix/.test(fit4k.t) && Math.abs(fit4k.k - 2) < 0.01 && bad4k.length === 0, `transform=${fit4k.t}, fitK=${fit4k.k}`);
  await shot('11-4k-idle.png');
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await sleep(300);
}

/* ---------------------------------------------------------------- 3. guards before any graft */
{
  await click('#btnGraft');
  await sleep(120);
  const s = await st();
  const card = await page.evaluate(() => document.getElementById('benchCard').textContent);
  check('guard: TAKE with nothing chosen does not graft', s.grafts.length === 0 && !s.grafting && /choose a cultivar/.test(card), card);
  await click('#btnOpen');
  await sleep(120);
  const s2 = await st();
  check('guard: OPEN with no grafts does nothing', s2.phase === 'idle' && s2.counters.opens === 0);
  check('audio: first gesture unlocked the synth (context created, sound on)', s2.sound === true && s2.audio.ctx === true, JSON.stringify(s2.audio));
}

/* ---------------------------------------------------------------- 4. manual dial, one cultivar at a time */
const manualAddr = ['oakleaf', 'dawn', 'bee', 'root', 'helianth']; // order reflects the fast-click retarget below
let manualStart = Date.now();
{
  // first cultivar: verify the heliotropic slew really turns the ring, then TAKE
  await click('.seed[data-cv="oakleaf"]');
  const s1 = await waitFor((s) => s.sel === 'oakleaf' && s.slewing, 1000);
  await sleep(140);
  const mid = await st();
  await shot('02-slew-mid.png');
  const settled = await waitFor((s) => !s.slewing && s.aligned, 4000);
  const target = await page.evaluate(() => window.__helianth.targetAngleFor('oakleaf', 0));
  const diff = Math.abs((((settled.ringAngle - target) % 360) + 540) % 360 - 180);
  check('manual: choosing a seed slews the seed-ring (angle changed mid-slew) and settles aligned under light 1', s1.phase === 'dialing' && Math.abs(mid.ringAngle - settled.ringAngle) > 1 && diff < 0.5, `mid=${mid.ringAngle.toFixed(1)}° settled=${settled.ringAngle.toFixed(1)}° target=${target.toFixed(1)}° err=${diff.toFixed(3)}°`);
  const armed = await page.evaluate(() => ({ notch: !!document.querySelector('#notches path[data-i="0"].armed'), graft: document.getElementById('btnGraft').classList.contains('armed') }));
  check('manual: aligned notch + TAKE button read as armed', armed.notch && armed.graft, JSON.stringify(armed));
  await click('#btnGraft');
  const g = await waitFor((s) => s.grafting, 800);
  await sleep(420);
  const tend = await page.evaluate(() => { const p = document.querySelector('#tendrils path[stroke-dasharray]'); const L = parseFloat(p.getAttribute('stroke-dasharray')); return { L, off: parseFloat(p.getAttribute('stroke-dashoffset')) }; });
  await shot('03-graft-tendril.png');
  check('manual: TAKE grows a tendril (dashoffset strictly between full and zero mid-growth)', g.grafting && tend.off > 0 && tend.off < tend.L, `L=${tend.L.toFixed(0)} off=${tend.off.toFixed(0)}`);
  const done = await waitFor((s) => s.grafts.length === 1 && !s.grafting, 4000);
  const taken = await page.evaluate(() => ({
    light: document.querySelector('#lights .light[data-i="0"]').classList.contains('taken'),
    seal: document.querySelector('#lights .light[data-i="0"] [data-role="sealGlyph"]').getAttribute('href'),
    bloom: document.querySelector('#blooms .bloom[data-i="0"] > g').getAttribute('transform'),
    node: document.querySelector('#ledgerSvg .node[data-i="0"]').classList.contains('taken'),
    nodeText: document.querySelector('#ledgerList [data-nt="0"]').textContent,
    seedUsed: document.querySelector('.seed[data-cv="oakleaf"]').classList.contains('used'),
    seedDisabled: document.querySelector('.seed[data-cv="oakleaf"]').disabled,
  }));
  check('manual: the graft takes — light 1 taken, seal shows Oakleaf, bloom fully open, ledger node + seed marked', done.grafts[0] === 'oakleaf' && taken.light && taken.seal === '#cv-oakleaf' && /scale\(1\.0|scale\(1\)/.test(taken.bloom) && taken.node && taken.nodeText === 'Oakleaf' && taken.seedUsed && taken.seedDisabled, JSON.stringify(taken));
}
{
  // fast operator: choose bee, immediately switch to dawn mid-slew, press TAKE while still slewing
  await click('.seed[data-cv="bee"]');
  await sleep(60);
  await click('.seed[data-cv="dawn"]');
  await sleep(30);
  await click('#btnGraft');
  const q = await st();
  check('fast clicks: re-choosing mid-slew retargets (sel=dawn) and TAKE mid-slew queues the graft', q.sel === 'dawn' && q.slewing && q.graftQueued, JSON.stringify({ sel: q.sel, slewing: q.slewing, queued: q.graftQueued }));
  const d = await waitFor((s) => s.grafts.length === 2, 6000);
  check('fast clicks: queued graft takes on its own once the ring settles (light 2 = Dawn)', d.grafts[1] === 'dawn');
  // choosing another seed while a graft is in progress queues the next selection
  await click('.seed[data-cv="bee"]');
  await waitFor((s) => s.aligned, 4000);
  await click('#btnGraft');
  await sleep(150);
  await click('.seed[data-cv="root"]');
  const qq = await st();
  check('fast clicks: choosing a seed during a graft queues it for after the take', qq.grafting && qq.queuedSel === 'root', JSON.stringify({ grafting: qq.grafting, queued: qq.queuedSel }));
  const after = await waitFor((s) => s.grafts.length === 3 && s.sel === 'root', 6000);
  await waitFor((s) => s.aligned, 4000);
  await click('#btnGraft');
  await waitFor((s) => s.grafts.length === 4, 6000);
  check('manual: grafts 3 and 4 hold (Bee, Root)', after.grafts[2] === 'bee' && (await st()).grafts[3] === 'root');
  // reuse guard: an already-grafted seed is disabled
  const reuse = await center('.seed[data-cv="bee"]');
  check('guard: a grafted cultivar cannot be chosen again (seed disabled)', reuse.disabled === true);
  await click('.seed[data-cv="helianth"]');
  await waitFor((s) => s.aligned, 4000);
  await click('#btnGraft');
  const pend = await waitFor((s) => s.phase === 'pending', 6000);
  const manualMs = Date.now() - manualStart;
  const ready = await page.evaluate(() => ({ open: document.getElementById('btnOpen').classList.contains('ready'), stem: parseFloat(document.getElementById('ledgerStem').getAttribute('stroke-dashoffset')), nodes: document.querySelectorAll('#ledgerSvg .node.taken').length, seedsDisabled: Array.from(document.querySelectorAll('.seed')).every((b) => b.disabled) }));
  check('manual: five grafts → pending; OPEN reads ready; ledger stem fully grown, 5 nodes taken; tray closed', pend.grafts.join(',') === manualAddr.join(',') && ready.open && ready.stem < 1 && ready.nodes === 5 && ready.seedsDisabled, `address=${pend.grafts.join(',')} manual dial took ${manualMs} ms`);
  await sleep(1600);
  const still = await st();
  check('NEGATIVE: completing the fifth graft never auto-opens (still pending after 1.6 s, opens=0)', still.phase === 'pending' && still.counters.opens === 0 && still.counters.breakthroughs === 0);
  await shot('04-pending.png');
  await click('.seed[data-cv="crozier"]', false);
  await sleep(100);
  check('guard: tray ignores clicks while pending', (await st()).grafts.length === 5);
}

/* ---------------------------------------------------------------- 5. frost interlock blocks OPEN, with unmissable feedback */
{
  await click('#btnFrost');
  await sleep(200);
  const f = await st();
  const dom = await page.evaluate(() => ({ body: document.body.classList.contains('frost'), veil: getComputedStyle(document.getElementById('frostVeil')).display, ink: getComputedStyle(document.getElementById('frostInk')).display, pressed: document.getElementById('btnFrost').getAttribute('aria-pressed'), state: document.getElementById('frostState').textContent }));
  check('frost: engaging draws the shutter (state, veil, crackle, button state)', f.frost && dom.body && dom.veil !== 'none' && dom.ink !== 'none' && dom.pressed === 'true' && dom.state === 'DRAWN', JSON.stringify(dom));
  await click('#btnOpen');
  await sleep(200);
  const b = await st();
  const card = await page.evaluate(() => ({ text: document.getElementById('benchCard').textContent, cls: document.getElementById('benchCard').className }));
  check('frost: OPEN under frost is blocked with cold feedback (phase still pending, blocked=1)', b.phase === 'pending' && b.counters.blocked === 1 && b.counters.opens === 0 && /cold/.test(card.cls), card.text);
  await shot('09-frost-blocked.png');
  await click('#btnFrost');
  await sleep(150);
  check('frost: releasing the shutter restores the ready lantern', (await st()).frost === false && (await page.evaluate(() => document.getElementById('btnOpen').classList.contains('ready'))));
}

/* ---------------------------------------------------------------- 6. activation: three visibly different stages */
let lumIdle, lumBuild, lumBreak, lumActive, warmIdle, warmActive, warmBuild, warmBreak;
{
  lumIdle = oculusLuminance(path.join(SHOTS, '04-pending.png')); warmIdle = warmth(path.join(SHOTS, '04-pending.png'));
  const openDisabledBefore = await center('#btnOpen');
  await click('#btnOpen');
  const bu = await waitFor((s) => s.phase === 'buildup', 800);
  await sleep(1350);
  const mid = await st();
  const sash = await page.evaluate(() => getComputedStyle(document.querySelector('#lights .light[data-i="0"] .sash')).transform);
  const pB = await shot('05-buildup.png');
  lumBuild = oculusLuminance(pB);
  check('activation: OPEN starts BUILDUP (phase buildup, drone audio running, sashes mid-swing)', bu.phase === 'buildup' && mid.phase === 'buildup' && mid.audio.drone === true && sash !== 'none', `t≈${mid.phaseAge.toFixed(0)}ms sash=${sash} drone=${mid.audio.drone}`);
  const br = await waitFor((s) => s.phase === 'breakthrough', 3000);
  const flashOn = await page.evaluate(() => getComputedStyle(document.getElementById('flash')).display !== 'none');
  await sleep(60);
  const pK = await shot('06-breakthrough.png');
  lumBreak = oculusLuminance(pK);
  check('activation: BREAKTHROUGH fires at the end of buildup (flash visible, counter 1)', br.phase === 'breakthrough' && flashOn && br.counters.breakthroughs === 1, `buildup lasted ≈${(br.phaseAge + 2600 - br.phaseAge).toFixed(0)} ms nominal`);
  const ac = await waitFor((s) => s.phase === 'active', 3000);
  await sleep(900);
  const pA = await shot('07-active.png');
  lumActive = oculusLuminance(pA); warmActive = warmth(pA);
  const act = await st();
  const dom = await page.evaluate(() => ({ body: document.body.classList.contains('active'), open: document.getElementById('lanternSvg').classList.contains('open'), sash: getComputedStyle(document.querySelector('#lights .light[data-i="2"] .sash')).transform, closeEnabled: !document.getElementById('btnClose').disabled, openDisabled: document.getElementById('btnOpen').disabled }));
  check('activation: SUSTAINED ACTIVE (body.active, lights open, active drone, OPEN disabled, CLOSE enabled)', ac.phase === 'active' && dom.body && dom.open && act.audio.active === true && dom.closeEnabled && dom.openDisabled, JSON.stringify({ sash: dom.sash, audio: act.audio }));
  warmBuild = warmth(pB); warmBreak = warmth(pK);
  // daylight register: the oculus is bright at rest, so "distinct" is measured in (luminance, warmth=R−B) space
  const V = { pending: [lumIdle, warmIdle], buildup: [lumBuild, warmBuild], breakthrough: [lumBreak, warmBreak], active: [lumActive, warmActive] };
  const names = Object.keys(V); let minPair = Infinity, minName = '';
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) { const d = Math.hypot(V[names[i]][0] - V[names[j]][0], V[names[i]][1] - V[names[j]][1]); if (d < minPair) { minPair = d; minName = names[i] + '/' + names[j]; } }
  check('activation: the four oculus states are pairwise distinct (≥12 apart in luminance/warmth space) and warmth climbs pending → buildup → active', minPair >= 12 && warmIdle < warmBuild && warmBuild < warmActive && lumBreak > lumBuild, `lum/warmth pending=${lumIdle.toFixed(0)}/${warmIdle.toFixed(0)} buildup=${lumBuild.toFixed(0)}/${warmBuild.toFixed(0)} breakthrough=${lumBreak.toFixed(0)}/${warmBreak.toFixed(0)} active=${lumActive.toFixed(0)}/${warmActive.toFixed(0)} · closest pair ${minName}=${minPair.toFixed(1)}`);
  // telemetry couples to the open way
  await sleep(1000);
  const tele = (await st()).telemetry;
  check('telemetry: the open way lifts canopy light and pollinators aloft', tele.light > 70 && tele.aloft > 550, `light=${tele.light.toFixed(0)} klx aloft=${tele.aloft}`);
}

/* ---------------------------------------------------------------- 7. disengage from active, then a second full cycle via a pressing */
{
  await click('#btnClose');
  const cl = await waitFor((s) => s.phase === 'closing', 800);
  const idle = await waitFor((s) => s.phase === 'idle', 3000);
  const dom = await page.evaluate(() => ({ taken: document.querySelectorAll('#lights .light.taken').length, blooms: document.querySelectorAll('#blooms .bloom').length, tendrils: document.querySelectorAll('#tendrils path').length, nodes: document.querySelectorAll('#ledgerSvg .node.taken').length, body: document.body.classList.contains('active') }));
  check('disengage: CLOSE while active → closing → idle with everything cut back', cl.phase === 'closing' && idle.grafts.length === 0 && dom.taken === 0 && dom.blooms === 0 && dom.tendrils === 0 && dom.nodes === 0 && !dom.body && idle.audio.active === false, JSON.stringify(dom));
}
let autoMs;
{
  const t0 = Date.now();
  await click('.pressing[data-route="saltmarsh"]');
  const a0 = await waitFor((s) => s.auto && s.auto.route === 'saltmarsh', 800);
  // sample the staged sequence
  const samples = [];
  let shotTaken = false;
  for (;;) {
    const s = await st();
    samples.push({ t: Date.now() - t0, n: s.grafts.length, slewing: s.slewing, grafting: s.grafting, sel: s.sel });
    if (!shotTaken && s.grafts.length === 2 && s.grafting) { await shot('08-pressing-mid.png'); shotTaken = true; }
    if (s.phase === 'pending') break;
    if (Date.now() - t0 > 12000) break;
    await sleep(35);
  }
  autoMs = Date.now() - t0;
  const counts = [...new Set(samples.map((x) => x.n))];
  const firstAt = {}; for (const x of samples) if (!(x.n in firstAt)) firstAt[x.n] = x.t;
  const gaps = counts.slice(1).map((n, i) => firstAt[n] - firstAt[counts[i]]);
  const sawMotion = samples.some((x) => x.slewing) && samples.some((x) => x.grafting);
  const fin = await st();
  check('pressing: quick-dial strikes the five cuttings one at a time (counts 0→5 seen, real gaps, slew+graft observed)', counts.join('') === '012345' && gaps.every((g) => g >= 200) && sawMotion && fin.phase === 'pending' && fin.grafts.join(',') === 'dew,wheat,vine,crozier,mycel', `graft times ms: ${JSON.stringify(firstAt)} gaps=${gaps.join('/')} mid-shot=${shotTaken}`);
  check('pressing: nursery pace is faster than hand grafting but never instant', autoMs < 9000 && autoMs > 1500, `pressing ${autoMs} ms for 5 grafts`);
  await sleep(1500);
  const still = await st();
  check('NEGATIVE: a struck pressing lands pending and never auto-opens', still.phase === 'pending' && still.counters.opens === 1 && still.routeName === 'Saltmarsh Reedworks');
  // second activation + disengage cycle
  await click('#btnOpen');
  await waitFor((s) => s.phase === 'active', 5000);
  await sleep(300);
  await click('#btnClose');
  const idle2 = await waitFor((s) => s.phase === 'idle', 3000);
  check('cycle: second dial → open → active → close completes (breakthroughs=2, closes=2)', idle2.counters.breakthroughs === 2 && idle2.counters.closes === 2 && idle2.grafts.length === 0);
}

/* ---------------------------------------------------------------- 8. disengage mid-buildup and mid-pressing; frost halts a strike */
{
  await click('.pressing[data-route="kestrel"]');
  await waitFor((s) => s.phase === 'pending', 10000);
  await click('#btnOpen');
  await waitFor((s) => s.phase === 'buildup', 800);
  await sleep(700);
  await click('#btnClose');
  const cl = await waitFor((s) => s.phase === 'closing', 800);
  const idle = await waitFor((s) => s.phase === 'idle', 3000);
  check('disengage: CLOSE mid-buildup aborts before breakthrough', cl.phase === 'closing' && idle.counters.breakthroughs === 2 && idle.audio.drone === false);
  await click('.pressing[data-route="ashgrove"]');
  await waitFor((s) => s.grafts.length === 2, 8000);
  await click('#btnClose');
  const idle2 = await waitFor((s) => s.phase === 'idle', 1500);
  check('disengage: CLOSE mid-pressing cancels the strike and cuts back', idle2.auto === null && idle2.grafts.length === 0);
  await click('.pressing[data-route="mossbank"]');
  await waitFor((s) => s.grafts.length === 1, 8000);
  await click('#btnFrost');
  await sleep(400);
  const fr = await st();
  const n = fr.grafts.length;
  await sleep(1500);
  const later = await st();
  check('frost: drawing the shutter mid-strike halts the pressing with one alert (no further grafts)', fr.frost && fr.auto === null && later.grafts.length === n && later.log.some((l) => /stops striking/.test(l.text)), `grafts held at ${n}`);
  await click('#btnGraft');
  await sleep(150);
  check('frost: TAKE under frost is blocked', (await st()).counters.blocked >= 2);
  await click('#btnFrost');
  await sleep(150);
  await click('#btnClose');
  await waitFor((s) => s.phase === 'idle', 1500);
}

/* ---------------------------------------------------------------- 9. fallow route: buildup, then no breakthrough */
{
  await click('.pressing[data-route="hollins"]');
  await waitFor((s) => s.phase === 'pending', 10000);
  await click('#btnOpen');
  await waitFor((s) => s.phase === 'buildup', 800);
  const before = (await st()).counters.breakthroughs;
  const cl = await waitFor((s) => s.phase === 'closing', 4000);
  await sleep(200);
  await shot('10-fallow.png');
  const idle = await waitFor((s) => s.phase === 'idle', 3000);
  check('fallow: Hollins Cold Frame builds up but no light answers — closes without breakthrough', cl.phase === 'closing' && idle.counters.breakthroughs === before && idle.log.some((l) => /shuttered for the season/.test(l.text)));
}

/* ---------------------------------------------------------------- 10. sound toggle + console hygiene */
{
  await click('#btnSound');
  await sleep(100);
  const off = await st();
  await click('#btnSound');
  await sleep(100);
  const on = await st();
  check('sound: toggle mutes and unmutes', off.sound === false && on.sound === true && on.sfxCount > 20, `sfx calls so far: ${on.sfxCount}`);
  check('hygiene: no console errors or page errors during the run', consoleErrors.length === 0, consoleErrors.join(' | ') || 'clean');
}

await browser.close();
const summary = { passed: results.length - failures, failed: failures, total: results.length, luminance: { pending: lumIdle, buildup: lumBuild, breakthrough: lumBreak, active: lumActive }, warmth: { pending: warmIdle, buildup: warmBuild, breakthrough: warmBreak, active: warmActive }, pressingMs: autoMs, results };
fs.writeFileSync(path.join(SHOTS, 'test-report.json'), JSON.stringify(summary, null, 2));
console.log(`\n${summary.passed}/${summary.total} passed`);
process.exit(failures ? 1 : 0);
