// PERPETUA verification suite — puppeteer-core against system Chrome.
// Real dispatched pointer events, hit-tested at rendered positions.
import puppeteer from 'puppeteer-core';
import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'http://localhost:8661/';
const results = [];
const narrative = [];
let page;

function pass(name, detail = '') { results.push({ name, ok: true, detail }); console.log(`  PASS  ${name}${detail ? ' — ' + detail : ''}`); }
function fail(name, detail = '') { results.push({ name, ok: false, detail }); console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`); }
function nar(s) { narrative.push(s); console.log(`  · ${s}`); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function shot(name) {
  const p = path.join(SHOTS, name + '.png');
  await page.screenshot({ path: p });
  nar(`screenshot ${name}.png`);
  return p;
}

// hit-tested click: center of the element must actually receive the point
async function click(sel, label) {
  const info = await page.evaluate((sel) => {
    const eln = document.querySelector(sel);
    if (!eln) return { err: 'no element ' + sel };
    const r = eln.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    const ok = hit && (hit === eln || eln.contains(hit) || hit.contains(eln));
    return { x, y, ok, hitTag: hit ? hit.tagName + (hit.id ? '#' + hit.id : '') + (hit.className && typeof hit.className === 'string' ? '.' + hit.className.split(' ')[0] : '') : 'null' };
  }, sel);
  if (info.err) throw new Error(info.err);
  if (!info.ok) throw new Error(`hit-test failed for ${label || sel}: point (${info.x.toFixed(0)},${info.y.toFixed(0)}) hits ${info.hitTag}`);
  await page.mouse.click(info.x, info.y);
  return info;
}

const st = () => page.evaluate(() => window.__perpetua.state);
async function waitState(target, timeout = 8000) {
  await page.waitForFunction((t) => window.__perpetua.state === t, { timeout }, target);
}

// mean luminance of a crop from a PNG file
function cropLuma(file, x, y, w, h) {
  const png = PNG.sync.read(fs.readFileSync(file));
  let sum = 0, n = 0;
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    const i = (yy * png.width + xx) * 4;
    sum += 0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2];
    n++;
  }
  return sum / n;
}
function pearson(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  return sxy / Math.sqrt(sxx * syy);
}

// aperture crop (stage at fit=1: wheel center at 476,578)
const AP = { x: 416, y: 518, w: 120, h: 120 };

const errors = [];
async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--window-size=1940,1140', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--force-device-scale-factor=1']
  });
  page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

  // ---------------------------------------------------------- 1. cold start
  console.log('\n[1] COLD START');
  const resp = await page.goto(URL, { waitUntil: 'networkidle0' });
  resp.status() === 200 ? pass('http 200') : fail('http 200', String(resp.status()));
  await sleep(700);
  nar('Cold start: page loaded at 1920x1080.');
  (await st()) === 'idle' ? pass('boots idle') : fail('boots idle', await st());

  const hold = await page.evaluate(() => ({
    state: window.__perpetua.hold,
    aria: document.querySelector('#btn-hold').getAttribute('aria-checked'),
    text: document.querySelector('#hold-state').textContent
  }));
  (!hold.state && hold.aria === 'false' && hold.text === 'RELEASED')
    ? pass('proving hold defaults RELEASED', JSON.stringify(hold))
    : fail('proving hold defaults RELEASED', JSON.stringify(hold));

  const geom = await page.evaluate(() => ({
    iw: innerWidth, ih: innerHeight,
    sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight,
    fit: document.body.style.getPropertyValue('--fit'),
    tf: getComputedStyle(document.getElementById('stage')).transform,
    engageDisabled: document.getElementById('btn-engage').disabled,
    refOverlayHidden: getComputedStyle(document.getElementById('ref-overlay')).display === 'none',
    modalHidden: document.getElementById('modal-root').hidden
  }));
  (geom.sw <= geom.iw && geom.sh <= geom.ih)
    ? pass('no scroll at 1080p', `viewport ${geom.iw}x${geom.ih}, scroll ${geom.sw}x${geom.sh}`)
    : fail('no scroll at 1080p', JSON.stringify(geom));
  Math.abs(parseFloat(geom.fit) - 1) < 0.001
    ? pass('--fit unitless ratio at 1080p', `--fit=${geom.fit}, transform=${geom.tf}`)
    : fail('--fit at 1080p', JSON.stringify(geom));
  geom.engageDisabled ? pass('engage lever disabled at rest') : fail('engage lever disabled at rest');
  geom.refOverlayHidden ? pass('reference overlay collapsed by default') : fail('reference overlay collapsed by default');
  await shot('01-cold-idle-1080p');

  // idle is ambient only — watch 3s for any state drift / auto-dial
  await sleep(3000);
  const idleCheck = await page.evaluate(() => ({ s: window.__perpetua.state, n: window.__perpetua.locked.length }));
  (idleCheck.s === 'idle' && idleCheck.n === 0)
    ? pass('idle never auto-dials', 'state still idle with 0 locked after 3s observation')
    : fail('idle never auto-dials', JSON.stringify(idleCheck));

  // --------------------------------------------------- 2. manual dial (fast clicks)
  console.log('\n[2] MANUAL DIAL — cycle 1');
  nar('Manual dial begins: eight index cards clicked at 150ms spacing (faster than the 380ms feed animation, to prove the queue).');
  const seq = ['QUOIN', 'LANTERN', 'FUSEE', 'WARD', 'PALLET', 'LIMEN', 'ARBOR', 'VERGE'];
  const lockSamples = [];
  for (const id of seq) {
    await click(`.index-card[data-index="${id}"]`, 'card ' + id);
    lockSamples.push(await page.evaluate(() => window.__perpetua.locked.length));
    await sleep(150);
  }
  await sleep(500);
  await shot('02-mid-manual-dial');
  await page.waitForFunction(() => window.__perpetua.locked.length === 8, { timeout: 8000 });
  const audioReady = await page.evaluate(() => window.PAUDIO.ready);
  audioReady ? pass('audio context armed on first gesture') : fail('audio context armed');
  const monotone = lockSamples.every((v, i) => i === 0 || v >= lockSamples[i - 1]);
  const staged = lockSamples[lockSamples.length - 1] < 8;
  (monotone && staged)
    ? pass('manual locks are staged (queued), not instantaneous', `lock counts at click times: ${lockSamples.join(',')}`)
    : fail('manual locks staged', lockSamples.join(','));
  await waitState('pending');
  pass('8th lock lands in PENDING', 'train complete, mill at ready');
  await shot('03-pending');

  // ------------------------------------------- 3. NEGATIVE: no auto-fire
  console.log('\n[3] NEGATIVE AUTO-FIRE TEST');
  nar('Holding at PENDING for 2.6s with no input — the engine must not fire itself.');
  await sleep(2600);
  const nf = await page.evaluate(() => ({
    s: window.__perpetua.state,
    apIdle: document.getElementById('aperture-idle').getAttribute('display') !== 'none',
    apActive: document.getElementById('aperture-active').getAttribute('display') === 'none'
  }));
  (nf.s === 'pending' && nf.apIdle && nf.apActive)
    ? pass('NEGATIVE: completing the train never auto-fires', 'still pending, aperture closed after 2.6s')
    : fail('NEGATIVE auto-fire', JSON.stringify(nf));

  // ------------------------------------------------- 4. engage: three stages
  console.log('\n[4] STAGED ACTIVATION');
  nar('ENGAGE MILL pulled by hit-tested click. Buildup should run ~2.4s.');
  const t0 = Date.now();
  await click('#btn-engage', 'engage lever');
  await waitState('buildup', 2000);
  await sleep(1100);
  (await st()) === 'buildup' ? pass('buildup has real duration', `still in buildup at +1.1s`) : fail('buildup duration', await st());
  await shot('04-buildup');
  await waitState('breakthrough', 4000);
  const tBreak = Date.now() - t0;
  await shot('05-breakthrough');
  (tBreak > 2000) ? pass('breakthrough arrives after full buildup', `${tBreak}ms after lever`) : fail('breakthrough timing', `${tBreak}ms`);
  await waitState('active', 3000);
  await sleep(1800);
  (await st()) === 'active' ? pass('sustained active state holds') : fail('sustained active', await st());
  await shot('06-active');

  // aperture luminance must differ stage to stage
  const L = {
    pending: cropLuma(path.join(SHOTS, '03-pending.png'), AP.x, AP.y, AP.w, AP.h),
    buildup: cropLuma(path.join(SHOTS, '04-buildup.png'), AP.x, AP.y, AP.w, AP.h),
    breakthrough: cropLuma(path.join(SHOTS, '05-breakthrough.png'), AP.x, AP.y, AP.w, AP.h),
    active: cropLuma(path.join(SHOTS, '06-active.png'), AP.x, AP.y, AP.w, AP.h)
  };
  nar(`aperture crop mean luminance: pending ${L.pending.toFixed(1)}, buildup ${L.buildup.toFixed(1)}, breakthrough ${L.breakthrough.toFixed(1)}, active ${L.active.toFixed(1)}`);
  (L.buildup > L.pending + 3 && L.breakthrough > L.buildup + 8 && L.active > L.pending + 4 && Math.abs(L.active - L.breakthrough) > 2)
    ? pass('stages visibly distinct (numeric luminance proof)', `pend ${L.pending.toFixed(1)} / build ${L.buildup.toFixed(1)} / break ${L.breakthrough.toFixed(1)} / active ${L.active.toFixed(1)}`)
    : fail('stage luminance distinct', JSON.stringify(L));

  // telemetry coupling while we have an active engine + history breadth
  const tele = await page.evaluate(() => {
    const h = window.__perpetua.history.slice(20);
    return { n: h.length, P: h.map(x => x.P), T: h.map(x => x.T), eng: h.map(x => x.eng), C: h.map(x => x.C) };
  });
  const prod = tele.P.map((p, i) => p * tele.eng[i]);
  const rTP = pearson(tele.T, prod);
  const cNow = await page.evaluate(() => window.__perpetua.history[window.__perpetua.history.length - 1].C);
  (rTP > 0.6 && cNow > 75)
    ? pass('telemetry genuinely coupled', `r(torque, pressure*engagement)=${rTP.toFixed(3)} over ${tele.n} samples; confidence ${cNow.toFixed(0)} while open`)
    : fail('telemetry coupling', `r=${rTP.toFixed(3)}, C=${cNow?.toFixed(0)}`);

  // ------------------------------------------------- 5. disengage (cycle 1 done)
  console.log('\n[5] DISENGAGE FROM ACTIVE');
  nar('DISENGAGE thrown while the aperture is open.');
  const disenReachable = await page.evaluate(() => !document.getElementById('btn-disengage').disabled);
  disenReachable ? pass('disengage enabled while active') : fail('disengage enabled while active');
  await click('#btn-disengage', 'disengage');
  await waitState('idle', 3000);
  const cleared = await page.evaluate(() => ({ n: window.__perpetua.locked.length, spent: document.querySelectorAll('.index-card.spent').length }));
  (cleared.n === 0 && cleared.spent === 0)
    ? pass('cycle 1 complete: dial → activate → disengage', 'store cleared, cards returned')
    : fail('disengage clears', JSON.stringify(cleared));
  await shot('07-disengaged-idle');

  // ------------------------------------------------- 6. quick-dial (cycle 2)
  console.log('\n[6] QUICK-DIAL FROM THE FOLIO RACK — cycle 2');
  nar('FOLIO RACK tab opened; attested folio F-224 LANTHORN DEEP replayed at governor speed.');
  await click('#traytab-rack', 'rack tab');
  await shot('08-folio-rack');
  await click('.rack-row[data-folio="F-224"]', 'folio F-224');
  await sleep(900);
  const mid1 = await page.evaluate(() => window.__perpetua.locked.length);
  await shot('09-rack-mid1');
  await sleep(1100);
  const mid2 = await page.evaluate(() => window.__perpetua.locked.length);
  await shot('10-rack-mid2');
  (mid1 > 0 && mid1 < 8 && mid2 > mid1 && mid2 < 8)
    ? pass('quick-dial is genuinely staged', `locked ${mid1} at +0.9s, ${mid2} at +2.0s — never an instant jump`)
    : fail('quick-dial staged', `mid1=${mid1} mid2=${mid2}`);
  await waitState('pending', 8000);
  pass('rack replay lands PENDING');
  await sleep(1500);
  (await st()) === 'pending'
    ? pass('NEGATIVE: rack replay never auto-fires', 'still pending 1.5s after last card')
    : fail('rack no auto-fire', await st());
  const via = await page.evaluate(() => window.__perpetua.dialHistory.at(-1).via);
  via === 'F-224' ? pass('dial history records folio', via) : fail('dial history folio', via);

  // engage again, then disengage again (cycle 2 complete)
  await click('#btn-engage', 'engage (cycle 2)');
  await waitState('active', 6000);
  pass('cycle 2 activation reaches ACTIVE');
  await sleep(600);
  await click('#btn-disengage', 'disengage (cycle 2)');
  await waitState('idle', 3000);
  pass('cycle 2 complete: redial via rack → activate → disengage');
  nar('Second full dial-disengage cycle confirmed.');

  // ------------------------------------------------- 7. proving hold interlock
  console.log('\n[7] PROVING HOLD INTERLOCK');
  nar('Provisional folio F-252 racked, then the Proving Hold is engaged before the lever.');
  await click('.rack-row[data-folio="F-252"]', 'folio F-252');
  await waitState('pending', 9000);
  await click('#btn-hold', 'proving hold toggle');
  const holdOn = await page.evaluate(() => window.__perpetua.hold);
  holdOn ? pass('hold engages on demand') : fail('hold engages', String(holdOn));
  await click('#btn-engage', 'engage against hold');
  await sleep(400);
  const ref = await page.evaluate(() => ({
    s: window.__perpetua.state,
    banner: !document.getElementById('refusal').hidden,
    ann: document.getElementById('annunciator').textContent
  }));
  (ref.s === 'pending' && ref.banner)
    ? pass('hold blocks the mill with unmissable feedback', `banner shown, annunciator “${ref.ann}”`)
    : fail('hold blocks', JSON.stringify(ref));
  await shot('11-hold-refusal');
  await sleep(2200);
  await click('#btn-hold', 'release hold');
  await click('#btn-engage', 'engage after release');
  await waitState('active', 6000);
  pass('released hold lets the mill run', 'same train opened after release');
  await click('#btn-disengage', 'disengage (interlock cycle)');
  await waitState('idle', 3000);

  // ------------------------------------------------- 8. archive
  console.log('\n[8] ARCHIVE');
  await click('#traytab-index', 'index tray tab (restore)');
  await click('.tab-btn[data-modal="archive"]', 'archive tab');
  await sleep(300);
  const archCount = await page.evaluate(() => document.querySelectorAll('.arch-item').length);
  archCount >= 28 ? pass('archive has dozens of folios', `${archCount} entries`) : fail('archive count', String(archCount));
  await click('.arch-item[data-folio="F-044"]', 'folio F-044');
  await sleep(200);
  const hasXref = await page.evaluate(() => !!document.querySelector('.arch-detail .xref[data-xref="F-217"]'));
  hasXref ? pass('folio body renders cross-references') : fail('xref render');
  await click('.arch-detail .xref[data-xref="F-217"]', 'xref to F-217');
  await sleep(200);
  const nowSel = await page.evaluate(() => document.querySelector('.arch-item.sel')?.dataset.folio);
  nowSel === 'F-217' ? pass('cross-reference navigates folio to folio', 'F-044 → F-217') : fail('xref nav', String(nowSel));
  const backrefs = await page.evaluate(() => document.querySelector('.arch-backrefs')?.textContent || '');
  backrefs.includes('F-') ? pass('back-references (CITED BY) computed', backrefs.slice(0, 60)) : fail('backrefs', backrefs);
  await shot('12-archive');
  await click('#modal-close', 'close archive');

  // ------------------------------------------------- 9. section, log, settings
  console.log('\n[9] SECTION / DAY-BOOK / ADJUSTMENTS');
  await click('.tab-btn[data-modal="section"]', 'section tab');
  await sleep(250);
  const hasSection = await page.evaluate(() => !!document.querySelector('#section-svg-wrap svg') && document.querySelectorAll('#section-svg-wrap .xs-label').length >= 6);
  hasSection ? pass('cross-section schematic renders with labels') : fail('cross-section');
  await shot('13-section');
  await click('#modal-close', 'close section');

  await click('.tab-btn[data-modal="log"]', 'day-book tab');
  await sleep(250);
  const logRows = await page.evaluate(() => ({
    rows: document.querySelectorAll('.log-table tr').length,
    sample: document.querySelector('.log-table tr')?.textContent.trim().slice(0, 80)
  }));
  logRows.rows > 15 ? pass('day-book records timestamped session actions', `${logRows.rows} rows, latest: ${logRows.sample}`) : fail('day-book', JSON.stringify(logRows));
  await click('#modal-close', 'close log');

  await click('.tab-btn[data-modal="settings"]', 'settings tab');
  await sleep(250);
  await click('.seg[data-set="theme"] button[data-v="verdigris"]', 'theme verdigris');
  await sleep(150);
  const themed = await page.evaluate(() => document.body.dataset.theme);
  themed === 'verdigris' ? pass('theme variant applies live') : fail('theme apply', themed);
  await shot('14-settings-verdigris');
  await click('#modal-close', 'close settings');

  // ------------------------------------------------- 10. persistence
  console.log('\n[10] PERSISTENCE ACROSS RELOAD');
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(600);
  const persisted = await page.evaluate(() => ({
    theme: document.body.dataset.theme,
    dialHist: window.__perpetua.dialHistory.length,
    viewed: JSON.parse(localStorage.getItem('perpetua.v1')).viewed.length,
    state: window.__perpetua.state,
    hold: window.__perpetua.hold
  }));
  (persisted.theme === 'verdigris' && persisted.dialHist >= 4 && persisted.viewed >= 2)
    ? pass('settings, dial history, viewed folios survive reload', JSON.stringify(persisted))
    : fail('persistence', JSON.stringify(persisted));
  (persisted.state === 'idle' && persisted.hold === false)
    ? pass('reload returns to rest with hold still RELEASED')
    : fail('reload rest state', JSON.stringify(persisted));

  // restore default theme through the UI
  await click('.tab-btn[data-modal="settings"]', 'settings tab');
  await sleep(250);
  await click('.seg[data-set="theme"] button[data-v="draught"]', 'theme draught');
  await click('#modal-close', 'close settings');

  // ------------------------------------------------- 11. reference overlay
  console.log('\n[11] OPERATOR REFERENCE');
  await click('#ref-toggle', 'reference toggle');
  await sleep(200);
  const refOpen = await page.evaluate(() => !document.getElementById('ref-overlay').hidden);
  refOpen ? pass('reference opens from the ? control') : fail('reference open');
  await click('#ref-dismiss', 'reference dismiss');
  const refClosed = await page.evaluate(() => document.getElementById('ref-overlay').hidden);
  refClosed ? pass('reference dismisses') : fail('reference dismiss');

  // ------------------------------------------------- 12. 4K scaling
  console.log('\n[12] 4K VIEWPORT');
  await page.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 1 });
  await sleep(500);
  const geom4k = await page.evaluate(() => ({
    iw: innerWidth, ih: innerHeight,
    fit: document.body.style.getPropertyValue('--fit'),
    tf: getComputedStyle(document.getElementById('stage')).transform,
    sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight
  }));
  (Math.abs(parseFloat(geom4k.fit) - 2) < 0.01 && geom4k.sw <= geom4k.iw)
    ? pass('scales cleanly to 4K', `viewport ${geom4k.iw}x${geom4k.ih}, --fit=${geom4k.fit}, transform=${geom4k.tf}`)
    : fail('4K scaling', JSON.stringify(geom4k));
  await shot('15-4k-idle');
  // quick sanity: a control is still hit-testable at 4K
  await click('.index-card[data-index="QUERN"]', 'card QUERN at 4K');
  await page.waitForFunction(() => window.__perpetua.locked.length === 1, { timeout: 5000 });
  pass('controls hit-test correctly at 4K', 'QUERN locked wheel I');
  await shot('16-4k-dialing');
  await click('#btn-disengage', 'disengage at 4K');
  await waitState('idle', 3000);

  // ------------------------------------------------- errors + summary
  console.log('\n[13] CONSOLE / PAGE ERRORS');
  errors.length === 0 ? pass('zero console or page errors across the whole run') : fail('console errors', errors.join(' | '));

  await browser.close();

  const okCount = results.filter(r => r.ok).length;
  console.log(`\n==== ${okCount}/${results.length} PASSED ====`);
  fs.writeFileSync(path.join(__dirname, 'last-run.json'), JSON.stringify({ when: new Date().toISOString(), results, narrative }, null, 2));
  if (okCount !== results.length) process.exit(1);
}

run().catch(e => { console.error('SUITE ERROR:', e); process.exit(2); });
