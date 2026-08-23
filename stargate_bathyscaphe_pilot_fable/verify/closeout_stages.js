// Focused re-capture of check (b): three-stage activation with page-clock
// bracketing, so each screenshot is provably taken inside its stage window.
// Same real-pointer approach as closeout.js. Writes 03b/04b/05b_*.png.
const REPO = process.env.LANTERN_REPO || require('path').resolve(__dirname, '..');
const puppeteer = require(REPO + '/node_modules/puppeteer');
const fs = require('fs'); const path = require('path');
const PNG = require(REPO + '/verify/png.js');
const URL = process.env.LANTERN_URL || 'http://127.0.0.1:8747/';
const SHOTS = process.env.LANTERN_SHOTS || path.join(REPO, 'verify', 'shots', 'closeout');
const report = []; let pass = 0, fail = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const note = s => { report.push(s); console.log(s); };
const check = (c, l, d = '') => { if (c) { pass++; note(`  PASS ${l}${d ? ' — ' + d : ''}`); } else { fail++; note(`  FAIL ${l}${d ? ' — ' + d : ''}`); } return !!c; };
const img = f => PNG.decode(fs.readFileSync(f));

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'] });
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle0' }); await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle0' });
  await page.evaluate(() => { window.__phaseLog = [{ t: performance.now(), phase: document.body.dataset.phase }]; new MutationObserver(() => { const ph = document.body.dataset.phase; const l = window.__phaseLog[window.__phaseLog.length - 1]; if (l.phase !== ph) window.__phaseLog.push({ t: performance.now(), phase: ph }); }).observe(document.body, { attributes: true, attributeFilter: ['data-phase'] }); });
  await sleep(1000);
  async function clickAt(sel, label) {
    const i = await page.evaluate(s => { const el = document.querySelector(s); const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const top = document.elementFromPoint(x, y); return { x, y, hit: top === el || el.contains(top) }; }, sel);
    check(i.hit, `${label}: hit-test at (${i.x.toFixed(0)},${i.y.toFixed(0)})`);
    await page.mouse.move(i.x, i.y); await page.mouse.down(); await page.mouse.up();
  }
  const seqLen = () => page.evaluate(() => window.__lantern.sim.sequence.length);
  const phase = () => page.evaluate(() => document.body.dataset.phase);
  note('## (b) tightened: manual dial then bracketed stage captures');
  const SEQ = ['KEL', 'THR', 'DUSK', 'LANT', 'MIDN', 'CALD', 'VENT'];
  for (let i = 0; i < SEQ.length; i++) {
    await clickAt(`.glyph[data-glyph="${SEQ[i]}"]`, `click ${SEQ[i]}`);
    const t0 = Date.now(); while (Date.now() - t0 < 6000 && !(await seqLen() === i + 1 && await phase() !== 'locking')) await sleep(40);
    check(await seqLen() === i + 1, `${SEQ[i]} locked as waypoint ${i + 1}`);
  }
  check(await phase() === 'pending', 'pending after 7th lock (no auto-fire)', await phase());
  await sleep(1500);
  check(await phase() === 'pending', 'still pending 1.5 s later', await phase());
  await clickAt('#btn-commence', 'COMMENCE FINAL DESCENT');
  // --- buildup: capture ~1.0 s in
  await sleep(900);
  const pre1 = await page.evaluate(() => performance.now());
  const f1 = path.join(SHOTS, '03b_stage1_buildup_bracketed.png'); await page.screenshot({ path: f1, optimizeForSpeed: true });
  const post1 = await page.evaluate(() => performance.now());
  // --- breakthrough: poll tightly, then screenshot with no extra round-trips
  const tb0 = Date.now(); while (Date.now() - tb0 < 4000 && (await phase()) !== 'breakthrough') await sleep(8);
  const pre2 = await page.evaluate(() => performance.now());
  const f2 = path.join(SHOTS, '04b_stage2_breakthrough_bracketed.png'); await page.screenshot({ path: f2, optimizeForSpeed: true });
  const post2 = await page.evaluate(() => performance.now());
  // --- active: wait, then capture
  const ta0 = Date.now(); while (Date.now() - ta0 < 4000 && (await phase()) !== 'active') await sleep(8);
  await sleep(1500);
  const pre3 = await page.evaluate(() => performance.now());
  const f3 = path.join(SHOTS, '05b_stage3_sustained_active_bracketed.png'); await page.screenshot({ path: f3, optimizeForSpeed: true });
  const post3 = await page.evaluate(() => performance.now());
  const log = await page.evaluate(() => window.__phaseLog);
  const tOf = p => { const e = log.find(x => x.phase === p); return e ? e.t : null; };
  const tBuild = tOf('buildup'), tBreak = tOf('breakthrough'), tActive = tOf('active');
  note(`  INFO page-clock phase starts: buildup ${tBuild.toFixed(0)}, breakthrough ${tBreak.toFixed(0)} (+${(tBreak - tBuild).toFixed(0)} ms), active ${tActive.toFixed(0)} (+${(tActive - tBreak).toFixed(0)} ms)`);
  note(`  INFO shot1 window [${(pre1 - tBuild).toFixed(0)}..${(post1 - tBuild).toFixed(0)}] ms after buildup start; shot2 window [${(pre2 - tBreak).toFixed(0)}..${(post2 - tBreak).toFixed(0)}] ms after breakthrough start (stage length ${(tActive - tBreak).toFixed(0)} ms); shot3 window [${(pre3 - tActive).toFixed(0)}..${(post3 - tActive).toFixed(0)}] ms after active start`);
  check(pre1 >= tBuild && post1 <= tBreak, 'shot 1 captured entirely inside BUILDUP window');
  // Image-content proof of stage: breakthrough paints a pure-white 3px ring around #sphere-wrap; active paints it cyan.
  const wrap = await page.evaluate(() => { const r = document.getElementById('sphere-wrap').getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, r: r.width / 2 }; });
  const ringStats = im => { let white = 0, n = 0, rs = 0; for (let a = 0; a < 360; a += 5) { const x = Math.round(wrap.cx + (wrap.r + 1.5) * Math.cos(a * Math.PI / 180)), y = Math.round(wrap.cy + (wrap.r + 1.5) * Math.sin(a * Math.PI / 180)); const [R, G, B] = PNG.px(im, x, y); n++; rs += R; if (R > 225 && G > 225 && B > 225) white++; } return { whiteFrac: white / n, meanR: rs / n }; };
  const [q1, q2, q3] = [f1, f2, f3].map(f => ringStats(img(f)));
  note(`  INFO sphere-rim ring samples (72 pts): buildup white=${(q1.whiteFrac * 100).toFixed(0)} % meanR=${q1.meanR.toFixed(0)}; breakthrough white=${(q2.whiteFrac * 100).toFixed(0)} % meanR=${q2.meanR.toFixed(0)}; active white=${(q3.whiteFrac * 100).toFixed(0)} % meanR=${q3.meanR.toFixed(0)}`);
  check(q2.whiteFrac > 0.6, 'shot 2 image content shows the BREAKTHROUGH-only white rim ring', `${(q2.whiteFrac * 100).toFixed(0)} % of rim samples near-white`);
  check(q3.whiteFrac < 0.2 && q1.whiteFrac < 0.2, 'buildup and active shots do NOT show the white rim ring', `${(q1.whiteFrac * 100).toFixed(0)} % / ${(q3.whiteFrac * 100).toFixed(0)} %`);
  check(pre2 >= tBreak && pre2 < tActive, 'shot 2 capture call began inside the BREAKTHROUGH window', `began +${(pre2 - tBreak).toFixed(0)} ms, returned +${(post2 - tBreak).toFixed(0)} ms, stage ${(tActive - tBreak).toFixed(0)} ms`);
  check(pre3 >= tActive, 'shot 3 captured after ACTIVE began');
  const [i1, i2, i3] = [f1, f2, f3].map(img);
  const d12 = PNG.diffFraction(i1, i2), d23 = PNG.diffFraction(i2, i3), d13 = PNG.diffFraction(i1, i3);
  note(`  INFO pixel diff fractions: buildup/breakthrough ${(d12 * 100).toFixed(1)} %, breakthrough/active ${(d23 * 100).toFixed(1)} %, buildup/active ${(d13 * 100).toFixed(1)} %`);
  const L = im => PNG.meanLum(im, 0, 0, 1920, 1080, 8).toFixed(1), S = im => PNG.meanLum(im, 780, 360, 1140, 720, 4).toFixed(1);
  note(`  INFO frame luminance buildup/breakthrough/active = ${L(i1)}/${L(i2)}/${L(i3)}; sphere region = ${S(i1)}/${S(i2)}/${S(i3)}`);
  check(d12 > 0.05 && d23 > 0.05 && d13 > 0.05, 'all three bracketed stage shots differ by >5 % of sampled pixels');
  const texts = await page.evaluate(() => ({ helm: document.getElementById('helm-state').textContent, cs: document.getElementById('commence-state').textContent }));
  note(`  INFO final helm text: ${texts.helm} / ${texts.cs}`);
  check(errors.length === 0, 'no console/page errors', errors.join(' || ') || 'none');
  await browser.close();
  note(`\n## RESULT (stages re-capture): ${pass} passed, ${fail} failed`);
  fs.writeFileSync(path.join(REPO, 'verify', 'closeout_stages.log'), report.join('\n') + '\n');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS CRASH', e); process.exit(2); });
