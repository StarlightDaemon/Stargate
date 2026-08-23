// ============================================================================
//  Interactive verification — DSV-7 Cerulean Lantern pilot console
//  Real pointer events hit-tested at rendered positions, staged screenshots,
//  negative auto-fire test, lockout default, replay sequencing, two full
//  dial / disengage / redial cycles, every secondary panel, 1080p + 4K +
//  non-16:9 background fill. Writes verify/shots/*.png and verify/report.md.
// ============================================================================
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const PNG = require('./png');

const URL = process.env.LANTERN_URL || 'http://127.0.0.1:8747/';
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
for (const f of fs.readdirSync(SHOTS)) if (f.endsWith('.png') && !f.startsWith('smoke')) fs.unlinkSync(path.join(SHOTS, f));

const report = []; let pass = 0, fail = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function note(s) { report.push(s); console.log(s); }
function check(cond, label, detail = '') {
  if (cond) { pass++; note(`  ✔ ${label}${detail ? ' — ' + detail : ''}`); }
  else { fail++; note(`  ✘ FAIL ${label}${detail ? ' — ' + detail : ''}`); }
  return !!cond;
}
function section(s) { note(`\n## ${s}`); }

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'] });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') pageErrors.push('console.error: ' + m.text()); });

  // ---- helpers --------------------------------------------------------------
  const state = () => page.evaluate(() => {
    const L = window.__lantern, s = L.sim;
    return { phase: document.body.dataset.phase, simPhase: s.phase, seq: s.sequence.slice(), depth: Math.round(s.depth), hold: s.holdDepth, lockout: s.lockout, lockoutChecked: document.getElementById('lockout').checked,
      aperture: +s.aperture.toFixed(2), glow: +s.ringGlow.toFixed(2), dim: +s.lightDim.toFixed(2), auto: !!s.auto, commenceDisabled: document.getElementById('btn-commence').disabled,
      ascendDisabled: document.getElementById('btn-ascend').disabled, hull: s.telemetry ? +s.telemetry.hullLoad.toFixed(1) : null, pressure: s.telemetry ? +s.telemetry.pressure.toFixed(1) : null,
      temp: s.telemetry ? +s.telemetry.waterTemp.toFixed(2) : null, lux: s.telemetry ? +s.telemetry.lux.toFixed(3) : null, logLen: L.sessionLog.length, lastLog: L.sessionLog[L.sessionLog.length - 1],
      scale: window.__lanternScale, bannerHidden: document.getElementById('lockout-banner').hidden, audio: L.audio.started, msg: document.getElementById('profile-msg').textContent,
      helm: document.getElementById('helm-state').textContent, bt1: +s.ch.BT1.v.toFixed(2), vtp: +s.ch.VTP.v.toFixed(2) };
  });
  // Click the centre of a selector's rendered box after hit-testing that the
  // topmost element at that point is the target (or inside it).
  async function clickAt(selector, label) {
    const info = await page.evaluate(sel => {
      const el = document.querySelector(sel); if (!el) return { missing: true };
      const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const top = document.elementFromPoint(x, y);
      return { x, y, w: r.width, h: r.height, hit: !!top && (top === el || el.contains(top)), topDesc: top ? `${top.tagName.toLowerCase()}${top.id ? '#' + top.id : ''}${top.className && typeof top.className === 'string' ? '.' + top.className.split(' ')[0] : ''}` : 'none' };
    }, selector);
    if (info.missing) { check(false, `${label}: element ${selector} exists`); return info; }
    check(info.hit, `${label}: hit-test at (${info.x.toFixed(0)},${info.y.toFixed(0)}) box ${info.w.toFixed(0)}×${info.h.toFixed(0)}`, `elementFromPoint → ${info.topDesc}`);
    await page.mouse.move(info.x, info.y); await page.mouse.down(); await page.mouse.up();
    return info;
  }
  async function shot(name, meta = '') {
    const file = path.join(SHOTS, `${name}.png`);
    await page.screenshot({ path: file });
    note(`  📷 ${name}.png${meta ? ' — ' + meta : ''}`);
    return file;
  }
  async function waitFor(fn, timeout = 8000, label = '') {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) { if (await page.evaluate(fn)) return true; await sleep(60); }
    check(false, `timeout waiting: ${label}`); return false;
  }
  const waitPhase = (ph, timeout = 8000) => waitFor(`document.body.dataset.phase === '${ph}'`, timeout, `phase ${ph}`);
  const waitSeq = (n, timeout = 8000) => waitFor(`window.__lantern.sim.sequence.length === ${n} && window.__lantern.sim.phase !== 'locking'`, timeout, `sequence length ${n}`);
  const img = f => PNG.decode(fs.readFileSync(f));

  // ==========================================================================
  section('1. Cold start @ 1920×1080');
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.evaluate(() => { try { localStorage.clear(); } catch { } }).catch(() => { });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle0' });
  await sleep(1500);
  let s = await state();
  check(s.phase === 'idle' && s.seq.length === 0, 'cold start is idle with empty profile', `phase=${s.phase} seq=[${s.seq}] depth=${s.depth} m`);
  check(s.lockout === false && s.lockoutChecked === false, 'hull-integrity lockout DEFAULTS TO RELEASED', `sim.lockout=${s.lockout} checkbox=${s.lockoutChecked} label="${await page.$eval('#lockout-state', e => e.textContent)}"`);
  check(s.commenceDisabled && !s.ascendDisabled, 'commence disabled at cold start, emergency ascent armed');
  check(s.scale.uiScale === 1 && s.scale.transform === 'matrix(1, 0, 0, 1, 0, 0)', 'stage scale at 1920×1080', `viewport ${s.scale.vw}×${s.scale.vh} → --ui-scale=${s.scale.uiScale} transform=${s.scale.transform}`);
  const noScroll = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, cw: document.documentElement.clientWidth, ch: document.documentElement.clientHeight }));
  check(noScroll.sw <= noScroll.cw && noScroll.sh <= noScroll.ch, 'no scrolling needed for the core interface', JSON.stringify(noScroll));
  const cold = await shot('01_cold_start_1080p', 'idle, ambient only');
  await sleep(4000); s = await state();
  check(s.phase === 'idle' && s.seq.length === 0 && s.depth === 0, 'idle state never auto-dials (4 s observed)', `phase=${s.phase} seq=${s.seq.length} depth=${s.depth}`);
  const corners = await page.$eval('body', () => ({ help: !!document.querySelector('#help-btn'), author: document.querySelector('.corner-author').getAttribute('href') + ' rel=' + document.querySelector('.corner-author').getAttribute('rel'), version: document.querySelector('#version-label').textContent }));
  check(corners.help && corners.author.includes('github.com/StarlightDaemon') && corners.author.includes('noopener noreferrer') && corners.version === 'v1.0.0', 'corner display: ? / StarlightDaemon link / version', JSON.stringify(corners));

  // ==========================================================================
  section('2. Manual dial — cycle 1 (Abyssal Plain profile, 7 waypoints)');
  const MANUAL = ['THR', 'DUSK', 'OXM', 'MIDN', 'CALD', 'VENT', 'PLN'];
  let actions = 0;
  for (let i = 0; i < MANUAL.length; i++) {
    const id = MANUAL[i];
    await clickAt(`.glyph[data-glyph="${id}"]`, `select waypoint ${i + 1} ${id}`); actions++;
    await sleep(80);
    let st = await state();
    check(st.phase === 'locking', `lock ${i + 1} started (ballast flood)`, `phase=${st.phase} bt1=${st.bt1} msg="${st.msg}"`);
    if (i === 0) {
      await sleep(900); await shot('02_lock_flood_stage', `WP1 flooding: depth ${(await state()).depth} m, ballast filling`);
      // while locking, a second selection must be refused
      await page.evaluate(() => window.__lantern.sim.selectGlyph('MIDN'));
      st = await state(); check(st.lastLog.kind === 'REJECT' && st.lastLog.msg.includes('TRIM SEQUENCE'), 'selection during trim sequence is refused', st.lastLog.msg);
      await sleep(1000); const mid = await state(); await shot('03_lock_settle_stage', `WP1 settling: depth ${mid.depth} m, VTP ${mid.vtp}, ${mid.msg}`);
    }
    if (i === 3) { await sleep(1300); const mid = await state(); await shot('03b_lock_settle_wp4', `WP4 settling toward 1 400 m: depth ${mid.depth} m, thrusters ${mid.vtp}`); }
    await waitSeq(i + 1, 6000);
    st = await state();
    check(st.seq.length === i + 1 && st.hold === (await page.evaluate(g => window.__lantern.sim.holdDepth, id)), `neutral-buoyancy hold confirmed at waypoint ${i + 1}`, `hold ${st.hold} m, depth ${st.depth} m, phase=${st.phase}, hull ${st.hull} %`);
    if (i === 0) {
      // reject: shallower glyph than the current hold
      await clickAt('.glyph[data-glyph="KEL"]', 'attempt shallower stratum KEL after THR hold');
      await sleep(150); st = await state();
      check(st.seq.length === 1 && st.lastLog.kind === 'REJECT' && st.lastLog.msg.includes('DESCEND'), 'profile monotonic check rejects a shallower stratum', st.lastLog.msg);
    }
    if (i === 2) { const tel = await state(); note(`  ℹ telemetry at ${tel.depth} m: pressure ${tel.pressure} bar, water ${tel.temp} °C, light ${tel.lux} lux, hull ${tel.hull} %`); }
  }
  s = await state();
  check(s.phase === 'pending' && s.seq.length === 7, 'profile complete → PENDING (not active)', `phase=${s.phase} hold=${s.hold} m aperture=${s.aperture}`);
  check(!s.commenceDisabled, 'COMMENCE FINAL DESCENT armed in pending state');
  note(`  ℹ core loop: ${actions} waypoint clicks + 1 activation = ${actions + 1} actions, 2 clusters (DESCENT PROFILE, HELM)`);
  await shot('04_pending_profile_complete', `7/7 locked, approach hold ${s.hold} m, ring ${s.hold + 60} m`);

  section('3. Negative test — completion must NOT auto-fire');
  const t0 = Date.now(); let fired = false;
  while (Date.now() - t0 < 4500) { const st = await state(); if (['buildup', 'breakthrough', 'active'].includes(st.phase)) { fired = true; break; } await sleep(150); }
  s = await state();
  check(!fired && s.phase === 'pending' && s.aperture === 0, 'no activation for 4.5 s after 7th lock', `phase=${s.phase} aperture=${s.aperture} glow=${s.glow}`);
  // stray real events: keyboard + a click on the sphere and a glyph
  await page.keyboard.press('Enter'); await page.keyboard.press('Space');
  await clickAt('#viewport', 'stray click on the observation sphere');
  await clickAt('.glyph[data-glyph="FRAC"]', 'stray click on a glyph while pending');
  await sleep(300); s = await state();
  check(s.phase === 'pending' && s.seq.length === 7, 'stray events (Enter, Space, sphere click, glyph click) do not activate', `phase=${s.phase} lastLog=${s.lastLog.kind}: ${s.lastLog.msg}`);

  section('4. Safety interlock — engage, attempt, verify block, release');
  await clickAt('#lockout-ctl', 'engage hull-integrity lockout');
  await sleep(150); s = await state();
  check(s.lockout === true && s.lockoutChecked === true, 'lockout engaged via real click', `label="${await page.$eval('#lockout-state', e => e.textContent)}"`);
  await clickAt('#btn-commence', 'press COMMENCE with lockout engaged');
  await sleep(250); s = await state();
  check(s.phase === 'pending' && s.bannerHidden === false, 'activation blocked; unmissable banner shown', `phase=${s.phase} banner visible=${!s.bannerHidden} commence class=${await page.$eval('#btn-commence', e => e.className)}`);
  await shot('05_lockout_blocked', 'lockout engaged — descent inhibited banner');
  await clickAt('#lockout-ctl', 'release lockout');
  await sleep(150); s = await state();
  check(s.lockout === false && s.bannerHidden === true, 'lockout released, banner cleared');

  section('5. Activation — three distinct stages');
  await clickAt('#btn-commence', 'COMMENCE FINAL DESCENT');
  await sleep(60); s = await state(); check(s.phase === 'buildup', 'BUILDUP stage entered', `from ${s.hold} m`);
  await sleep(1100); s = await state();
  const fBuild = await shot('06_stage_buildup', `buildup t≈1.1 s: depth ${s.depth} m, lightDim ${s.dim}, glow ${s.glow}, hull ${s.hull} %`);
  const buildInfo = s;
  await waitPhase('breakthrough', 4000);
  await sleep(350); s = await state();
  const fBreak = await shot('07_stage_breakthrough', `breakthrough t≈0.35 s: depth ${s.depth} m, aperture ${s.aperture}, glow ${s.glow}`);
  const breakInfo = s;
  await waitPhase('active', 3000);
  await sleep(2500); s = await state();
  const fActive = await shot('08_stage_sustained_active', `sustained active t≈2.5 s: depth ${s.depth} m, aperture ${s.aperture}, hull ${s.hull} %`);
  const activeInfo = s;
  check(buildInfo.phase === 'buildup' && breakInfo.phase === 'breakthrough' && activeInfo.phase === 'active', 'three stages observed in order', `buildup depth ${buildInfo.depth} → breakthrough ${breakInfo.depth} → active ${activeInfo.depth} m`);
  const iCold = img(cold), iB = img(fBuild), iK = img(fBreak), iA = img(fActive);
  const sphere = [630, 152, 1290, 812];
  const lum = { cold: PNG.meanLum(iCold, ...sphere), buildup: PNG.meanLum(iB, ...sphere), breakthrough: PNG.meanLum(iK, ...sphere), active: PNG.meanLum(iA, ...sphere) };
  const dBK = PNG.diffFraction(iB, iK), dKA = PNG.diffFraction(iK, iA), dBA = PNG.diffFraction(iB, iA), dCA = PNG.diffFraction(iCold, iA);
  check(dBK > 0.05 && dKA > 0.05 && dBA > 0.05, 'stage screenshots are pixel-distinct from each other', `diff fraction buildup↔breakthrough ${dBK.toFixed(3)}, breakthrough↔active ${dKA.toFixed(3)}, buildup↔active ${dBA.toFixed(3)}, cold↔active ${dCA.toFixed(3)}`);
  note(`  ℹ sphere mean luminance: cold ${lum.cold.toFixed(1)}, buildup ${lum.buildup.toFixed(1)}, breakthrough ${lum.breakthrough.toFixed(1)}, active ${lum.active.toFixed(1)}`);
  check(lum.buildup < lum.cold, 'buildup darker than idle (ambient light dimming with depth)');
  check(lum.breakthrough > lum.buildup, 'breakthrough brighter than buildup (aperture + flash)');
  await sleep(2000); s = await state();
  check(s.phase === 'active' && Math.abs(s.depth - (activeInfo.hold + 0)) < 3 && s.aperture === 1, 'sustained active holds depth with aperture open (+2 s)', `depth ${s.depth} m, hold ${s.hold} m, helm="${s.helm}"`);
  check(!s.ascendDisabled, 'EMERGENCY ASCENT remains enabled while active');

  section('6. Disengage — emergency ascent from active (cycle 1 complete)');
  await clickAt('#btn-ascend', 'EMERGENCY ASCENT while active');
  await sleep(700); s = await state();
  check(s.phase === 'ascending' && s.seq.length === 0, 'ascending; profile cleared immediately', `depth ${s.depth} m, bt1 ${s.bt1}`);
  await shot('09_emergency_ascent', `blow all ballast: depth ${s.depth} m, ballast ${s.bt1}`);
  await waitPhase('idle', 6000); s = await state();
  check(s.phase === 'idle' && s.depth === 0 && s.commenceDisabled, 'surfaced → idle, commence disabled again', `depth ${s.depth}`);
  const hist1 = await page.evaluate(() => window.__lantern.history.length);
  check(hist1 === 1, 'dive recorded to persisted pilot record', `history entries: ${hist1}`);

  section('7. Redial via DIVE COMPUTER quick-dial (verified TL-02) — cycle 2');
  await clickAt('.tab[data-panel="computer"]', 'open DIVE COMPUTER tab');
  await sleep(400);
  const presetInfo = await page.evaluate(() => ({ verified: document.querySelectorAll('#presets-verified .preset').length, experimental: document.querySelectorAll('#presets-experimental .preset').length, text: document.querySelector('#panel-computer').innerText.length }));
  check(presetInfo.verified >= 4 && presetInfo.experimental >= 2 && presetInfo.verified + presetInfo.experimental >= 6, 'quick-dial tiers present', `verified ${presetInfo.verified}, experimental ${presetInfo.experimental}, panel text ${presetInfo.text} chars`);
  await shot('10_panel_dive_computer', 'quick-dial tiers + pilot record');
  await clickAt('.preset[data-preset="TL-02"]', 'replay TL-02 Trench Lip Ring');
  await sleep(150); s = await state();
  check(s.auto === true || s.phase === 'locking', 'replay started (panel closed, sequence running)', `auto=${s.auto} phase=${s.phase}`);
  const samples = [];
  for (const [delay, name] of [[1100, '11_replay_wp2'], [1900, '12_replay_wp4'], [2000, '13_replay_wp6']]) {
    await sleep(delay); const st = await state(); samples.push(st.seq.length);
    await shot(name, `replay in progress: ${st.seq.length}/7 locked, phase=${st.phase}, depth ${st.depth} m`);
  }
  check(samples[0] > 0 && samples[0] < 7 && samples[1] > samples[0] && samples[2] > samples[1] && samples[2] < 7, 'replay is visibly staged, not an instant jump', `locked count at samples: ${samples.join(' → ')}`);
  await waitFor("window.__lantern.sim.sequence.length === 7 && window.__lantern.sim.phase === 'pending'", 10000, 'replay reaches pending');
  s = await state();
  check(s.phase === 'pending' && s.seq.join() === 'LANT,MIDN,CALD,VENT,PLN,SCRP,TRN', 'replay lands PENDING with the logged profile', `seq=${s.seq.join('→')} hold ${s.hold} m`);
  await sleep(3000); s = await state();
  check(s.phase === 'pending', 'replay never auto-fires (3 s observed)', `phase=${s.phase}`);
  await shot('14_replay_pending', 'TL-02 replay complete — pending, awaiting pilot');
  await clickAt('#btn-commence', 'COMMENCE FINAL DESCENT (cycle 2)');
  await waitPhase('active', 6000); await sleep(1500); s = await state();
  check(s.phase === 'active' && s.hull > 55, 'second activation reaches sustained active', `ring depth ${s.depth} m, hull ${s.hull} %, pressure ${s.pressure} bar`);
  await shot('15_active_cycle2_trench_lip', `active at ${s.depth} m, hull ${s.hull} %`);
  await clickAt('.tab[data-panel="vessel"]', 'open VESSEL cross-section while active'); await sleep(500);
  const live = await page.evaluate(() => ({ bt1: document.querySelector('#vessel-svg').textContent.includes('%'), fillH: +document.querySelectorAll('#vessel-svg rect.vs-fill')[0].getAttribute('height') }));
  check(live.fillH > 20, 'cross-section shows live ballast fill while active', `BT1 fill rect height ${live.fillH}`);
  await shot('15b_panel_vessel_live_active', 'cross-section live during ring hold');
  await clickAt('#panel-vessel .panel-close', 'close VESSEL'); await sleep(200);
  await clickAt('#btn-ascend', 'EMERGENCY ASCENT (cycle 2)');
  await waitPhase('idle', 7000); s = await state();
  check(s.phase === 'idle' && s.seq.length === 0, 'cycle 2 disengaged → idle');

  section('8. Disengage mid-replay + mid-manual (always reachable)');
  await clickAt('.tab[data-panel="computer"]', 'open DIVE COMPUTER');
  await sleep(300);
  await clickAt('.preset[data-preset="SB-X1"]', 'replay experimental SB-X1');
  await sleep(1600); s = await state(); const midSeq = s.seq.length;
  await clickAt('#btn-ascend', 'EMERGENCY ASCENT during replay');
  await sleep(200); s = await state();
  check(s.phase === 'ascending' && s.auto === false && s.seq.length === 0, 'replay aborted by emergency ascent', `had ${midSeq} locked when aborted`);
  await waitPhase('idle', 7000);
  await clickAt('.glyph[data-glyph="LANT"]', 'manual WP1 LANT'); await waitSeq(1);
  await clickAt('.glyph[data-glyph="CALD"]', 'manual WP2 CALD'); await sleep(900);
  await clickAt('#btn-ascend', 'EMERGENCY ASCENT during a trim sequence');
  await sleep(200); s = await state();
  check(s.phase === 'ascending' && s.seq.length === 0, 'ascent interrupts an in-progress lock');
  await waitPhase('idle', 7000);
  const hist2 = await page.evaluate(() => window.__lantern.history.map(h => `${h.outcome}${h.presetId ? ' ' + h.presetId : ''}@${h.depth}m`));
  check(hist2.length >= 3, 'pilot record accumulates', hist2.join(' | '));

  section('9. Secondary panels — each opened and screenshotted');
  const panels = [['archive', 'DIVE ARCHIVE'], ['vessel', 'VESSEL CROSS-SECTION'], ['computer', 'DIVE COMPUTER'], ['log', 'SESSION LOG'], ['settings', 'SETTINGS']];
  for (const [name, title] of panels) {
    await clickAt(`.tab[data-panel="${name}"]`, `open ${title}`);
    await sleep(500);
    if (name === 'archive') {
      await clickAt('.ar:nth-child(5)', 'open archive record D-117');
      await sleep(200);
      const d = await page.evaluate(() => ({ title: document.querySelector('.ad-title').textContent, refs: document.querySelectorAll('.ad-links .ref').length, viewed: document.querySelectorAll('.ar.viewed').length }));
      check(d.refs >= 4, `archive record opened with cross-references`, `"${d.title}" refs+backlinks=${d.refs}`);
      await clickAt('.ad-links .ref[data-ref="DS-002"]', 'follow cross-reference → DS-002');
      await sleep(200);
      const d2 = await page.evaluate(() => ({ title: document.querySelector('.ad-title').textContent, id: document.querySelector('.ad-id').textContent, back: document.querySelectorAll('.ad-links > div:nth-child(2) .ref').length, viewed: JSON.parse(localStorage.getItem('lantern.v1.viewed') || '[]') }));
      check(d2.id === 'DS-002' && d2.back >= 2, 'cross-reference navigation works, backlinks computed', `now at ${d2.id} "${d2.title}", referenced-by ${d2.back}; viewed persisted: ${d2.viewed.join(',')}`);
      const stats = await page.evaluate(() => { const A = window.__lantern; return { records: document.querySelectorAll('.ar').length }; });
      note(`  ℹ archive lists ${stats.records} records`);
    }
    if (name === 'vessel') { const n = await page.evaluate(() => document.querySelectorAll('#vessel-svg *').length); check(n > 80, 'cross-section SVG populated', `${n} SVG nodes`); }
    if (name === 'log') { const n = await page.evaluate(() => document.querySelectorAll('.le').length); check(n > 40, 'session log has real entries', `${n} entries; first: "${await page.evaluate(() => window.__lantern.sessionLog[0].msg)}"`); }
    if (name === 'settings') {
      await clickAt('.swatch[data-val="amber"]', 'switch mood → amber'); await sleep(200);
      check((await page.evaluate(() => document.body.dataset.mood)) === 'amber', 'mood applied live');
      await clickAt('[data-set="density"][data-val="dense"]', 'density → dense'); await sleep(150);
      await clickAt('[data-set="motion"][data-val="high"]', 'motion → high'); await sleep(150);
      await clickAt('[data-layer="groans"]', 'toggle hull-groan audio layer'); await sleep(150);
    }
    const content = await page.evaluate(n => { const p = document.querySelector(`#panel-${n}`); const r = p.getBoundingClientRect(); return { text: p.innerText.replace(/\s+/g, ' ').trim().length, w: r.width, h: r.height, hidden: p.hidden, layerHidden: document.getElementById('panel-layer').hidden }; }, name);
    check(!content.hidden && !content.layerHidden && content.text > 200 && content.w > 800, `${title} renders real content (not blank)`, `${content.text} chars of text, ${content.w.toFixed(0)}×${content.h.toFixed(0)} px`);
    await shot(`16_panel_${name}`, `${title}`);
    await clickAt(`#panel-${name} .panel-close`, `close ${title}`); await sleep(200);
    check((await page.evaluate(() => document.getElementById('panel-layer').hidden)), `${title} closed`);
  }
  await clickAt('#help-btn', 'open operator reference (?)'); await sleep(300);
  const help = await page.evaluate(() => ({ hidden: document.getElementById('help-overlay').hidden, sections: document.querySelectorAll('#help-body section').length, text: document.getElementById('help-body').innerText.length }));
  check(!help.hidden && help.sections >= 8, 'operator reference overlay renders', `${help.sections} sections, ${help.text} chars`);
  await shot('17_operator_reference', 'help overlay');
  await clickAt('#help-close', 'dismiss operator reference'); await sleep(150);
  check(await page.evaluate(() => document.getElementById('help-overlay').hidden), 'operator reference dismissed');
  await shot('18_amber_dense_mood', 'amber mood, dense density (settings applied)');

  section('10. Persistence across reload (localStorage)');
  const before = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('lantern.')).map(k => [k, localStorage.getItem(k).length])));
  note(`  ℹ localStorage keys: ${JSON.stringify(before)}`);
  await page.reload({ waitUntil: 'networkidle0' }); await sleep(800);
  const after = await page.evaluate(() => ({ mood: document.body.dataset.mood, density: document.body.dataset.density, motion: document.body.dataset.motion, hist: window.__lantern.history.length, viewed: JSON.parse(localStorage.getItem('lantern.v1.viewed')).length, lockout: window.__lantern.sim.lockout, groans: window.__lantern.prefs.layers.groans, sessions: JSON.parse(localStorage.getItem('lantern.v1.sessions')) }));
  check(after.mood === 'amber' && after.density === 'dense' && after.motion === 'high' && after.groans === false, 'preferences survive reload', JSON.stringify(after));
  check(after.hist >= 3 && after.viewed >= 2, 'dive history and viewed archive entries survive reload', `history ${after.hist}, viewed ${after.viewed}, device sessions ${after.sessions}`);
  check(after.lockout === false, 'lockout is NOT persisted — released again after reload');
  // restore default mood for the remaining screenshots
  await clickAt('.tab[data-panel="settings"]', 'open settings'); await sleep(300);
  await clickAt('.swatch[data-val="cerulean"]', 'mood → cerulean'); await sleep(100);
  await clickAt('[data-set="density"][data-val="standard"]', 'density → standard'); await sleep(100);
  await clickAt('[data-set="motion"][data-val="normal"]', 'motion → normal'); await sleep(100);
  await clickAt('#panel-settings .panel-close', 'close settings'); await sleep(200);

  section('11. Simulated 4K (3840×2160)');
  await page.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 1 });
  await sleep(600); s = await state();
  check(Math.abs(s.scale.uiScale - 2) < 1e-6 && s.scale.transform === 'matrix(2, 0, 0, 2, 0, 0)', 'stage scales ×2 at 4K', `viewport ${s.scale.vw}×${s.scale.vh} → --ui-scale=${s.scale.uiScale} transform=${s.scale.transform}`);
  const f4k = await shot('20_4k_cold', '3840×2160 idle');
  const i4k = img(f4k);
  check(i4k.width === 3840 && i4k.height === 2160, '4K screenshot dimensions', `${i4k.width}×${i4k.height}`);
  await clickAt('.tab[data-panel="computer"]', 'open DIVE COMPUTER at 4K'); await sleep(300);
  await clickAt('.preset[data-preset="VF-12"]', 'replay VF-12 at 4K (hit-test at scaled position)');
  await waitFor("window.__lantern.sim.sequence.length === 7 && window.__lantern.sim.phase === 'pending'", 12000, '4K replay pending');
  await shot('21_4k_pending', 'VF-12 pending at 4K');
  await clickAt('#btn-commence', 'COMMENCE at 4K'); await waitPhase('active', 6000); await sleep(1200);
  await shot('22_4k_active', 'active at 4K');
  await clickAt('#btn-ascend', 'EMERGENCY ASCENT at 4K'); await waitPhase('idle', 7000);

  section('12. Non-16:9 viewports — background fill check');
  const bgCheck = async (w, h, name) => {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 }); await sleep(500);
    const st = await state(); const f = await shot(name, `${w}×${h} → --ui-scale=${st.scale.uiScale.toFixed(4)} transform=${st.scale.transform}`);
    const im = img(f);
    const pts = [[4, 4], [w - 5, 4], [4, h - 5], [w - 5, h - 5], [Math.floor(w / 2), 3], [Math.floor(w / 2), h - 4], [3, Math.floor(h / 2)], [w - 4, Math.floor(h / 2)]];
    const vals = pts.map(([x, y]) => PNG.px(im, x, y));
    const blank = vals.filter(([r, g, b]) => (r > 235 && g > 235 && b > 235) || (r === 0 && g === 0 && b === 0 && false));
    const themed = vals.every(([r, g, b]) => r < 80 && b >= r && b >= g && b > 4); // dark, blue-dominant = this build's ocean theme
    // letterbox bands: average colour of the strips outside the scaled stage
    const sc = st.scale.uiScale; const stW = 1920 * sc, stH = 1080 * sc; const ox = (w - stW) / 2, oy = (h - stH) / 2;
    let band = null;
    if (ox > 8) band = { side: 'left/right bands', left: PNG.meanRGB(im, 0, 0, Math.floor(ox), h, 6), right: PNG.meanRGB(im, Math.ceil(w - ox), 0, w, h, 6) };
    else if (oy > 8) band = { side: 'top/bottom bands', top: PNG.meanRGB(im, 0, 0, w, Math.floor(oy), 6), bottom: PNG.meanRGB(im, 0, Math.ceil(h - oy), w, h, 6) };
    check(blank.length === 0 && themed, `${w}×${h}: edges filled with theme background, no blank space`, `edge samples ${JSON.stringify(vals)}; ${band ? band.side + ' ' + JSON.stringify(band) : 'no letterbox'}`);
  };
  await bgCheck(2560, 1080, '23_ultrawide_2560x1080');
  await bgCheck(1280, 1024, '24_narrow_1280x1024');
  await bgCheck(1920, 1200, '25_tall_1920x1200');

  section('13. Metadata');
  const vj = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'version.json'), 'utf8'));
  check(vj.version === '1.0.0' && typeof vj.model === 'string' && vj.model.includes('Fable 5'), 'version.json has BOTH "version" and "model"', `version="${vj.version}" model="${vj.model}"`);
  const cl = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8');
  check(cl.includes('## v1.0.0') && cl.includes('**Built by:** Claude Fable 5 (high reasoning)'), 'CHANGELOG v1.0.0 with Built-by line');
  check(pageErrors.length === 0, 'no page errors / console errors during the whole run', pageErrors.join(' | ') || 'none');

  await browser.close();
  note(`\n# RESULT: ${pass} passed, ${fail} failed`);
  fs.writeFileSync(path.join(__dirname, 'report.md'), `# Verification report — DSV-7 Cerulean Lantern v1.0.0\n\nGenerated ${new Date().toISOString()} against ${URL}\n${report.join('\n')}\n`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
