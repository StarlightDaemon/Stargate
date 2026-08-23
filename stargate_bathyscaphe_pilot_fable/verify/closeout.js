// ============================================================================
//  Close-out re-verification — DSV-7 Cerulean Lantern pilot console
//  (stargate_bathyscaphe_pilot_fable). Independent harness written for the
//  2026-08-23 close-out pass. Uses only real dispatched pointer events
//  (page.mouse at hit-tested rendered bounding-box centres) for every
//  interaction; internal state is read only to *corroborate* what the
//  screenshots show, never as the sole evidence.
//
//  Checks: (a) no auto-fire after 7th lock  (b) three visually distinct stages
//          (c) preset replay is progressive   (d) two disengage/redial cycles
//          (e) lockout released on fresh load (f) every tab/panel has content
//          (g) background fills non-16:9 viewports     + console error capture
// ============================================================================
const REPO = process.env.LANTERN_REPO || require('path').resolve(__dirname, '..');
const puppeteer = require(REPO + '/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');
const PNG = require(REPO + '/verify/png.js');

const URL = process.env.LANTERN_URL || 'http://127.0.0.1:8747/';
const SHOTS = process.env.LANTERN_SHOTS || path.join(REPO, 'verify', 'shots', 'closeout');
fs.mkdirSync(SHOTS, { recursive: true });
for (const f of fs.readdirSync(SHOTS)) if (f.endsWith('.png')) fs.unlinkSync(path.join(SHOTS, f));

const report = []; let pass = 0, fail = 0; const failures = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
function note(s) { report.push(s); console.log(s); }
function check(cond, label, detail = '') {
  if (cond) { pass++; note(`  PASS ${label}${detail ? ' — ' + detail : ''}`); }
  else { fail++; failures.push(label + (detail ? ' — ' + detail : '')); note(`  FAIL ${label}${detail ? ' — ' + detail : ''}`); }
  return !!cond;
}
function section(s) { note(`\n## ${s}`); }
const img = f => PNG.decode(fs.readFileSync(f));
const sha = f => require('crypto').createHash('sha1').update(fs.readFileSync(f)).digest('hex').slice(0, 12);

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'] });
  const page = await browser.newPage();
  const consoleErrors = [], consoleWarnings = [], requestFailures = [];
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push('console.error: ' + m.text()); else if (m.type() === 'warning') consoleWarnings.push('console.warn: ' + m.text()); });
  page.on('requestfailed', r => requestFailures.push(`${r.failure() && r.failure().errorText} ${r.url()}`));

  // ---- helpers --------------------------------------------------------------
  const state = () => page.evaluate(() => {
    const L = window.__lantern, s = L.sim;
    return { phase: document.body.dataset.phase, simPhase: s.phase, seq: s.sequence.slice(), depth: Math.round(s.depth), hold: s.holdDepth,
      lockout: s.lockout, lockoutChecked: document.getElementById('lockout').checked, lockoutText: document.getElementById('lockout-state').textContent,
      aperture: +s.aperture.toFixed(2), glow: +s.ringGlow.toFixed(2), dim: +s.lightDim.toFixed(2), auto: !!s.auto,
      commenceDisabled: document.getElementById('btn-commence').disabled, commenceState: document.getElementById('commence-state').textContent,
      helm: document.getElementById('helm-state').textContent, msg: document.getElementById('profile-msg').textContent,
      phaseLog: (window.__phaseLog || []).slice(), now: performance.now() };
  });
  async function installPhaseObserver() {
    await page.evaluate(() => {
      window.__phaseLog = [{ t: performance.now(), phase: document.body.dataset.phase }];
      new MutationObserver(() => { const ph = document.body.dataset.phase; const last = window.__phaseLog[window.__phaseLog.length - 1]; if (!last || last.phase !== ph) window.__phaseLog.push({ t: performance.now(), phase: ph }); })
        .observe(document.body, { attributes: true, attributeFilter: ['data-phase'] });
    });
  }
  // Real pointer click at the centre of the rendered box, after hit-testing
  // that elementFromPoint resolves to the target (or a descendant of it).
  async function clickAt(selector, label) {
    const info = await page.evaluate(sel => {
      const el = document.querySelector(sel); if (!el) return { missing: true };
      const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const top = document.elementFromPoint(x, y);
      const d = e => e ? `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : ''}` : 'none';
      return { x, y, w: r.width, h: r.height, hit: !!top && (top === el || el.contains(top)), topDesc: d(top) };
    }, selector);
    if (info.missing) { check(false, `${label}: element ${selector} exists`); return info; }
    check(info.hit, `${label}: pointer hit-test at (${info.x.toFixed(0)},${info.y.toFixed(0)}) box ${info.w.toFixed(0)}x${info.h.toFixed(0)}`, `elementFromPoint -> ${info.topDesc}`);
    await page.mouse.move(info.x, info.y); await page.mouse.down(); await page.mouse.up();
    return info;
  }
  async function shot(name, meta = '') {
    const file = path.join(SHOTS, `${name}.png`);
    await page.screenshot({ path: file });
    note(`  SHOT ${name}.png${meta ? ' — ' + meta : ''}`);
    return file;
  }
  async function waitFor(fn, timeout = 8000, label = '') {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) { if (await page.evaluate(fn)) return true; await sleep(40); }
    check(false, `timeout waiting: ${label}`); return false;
  }
  const waitPhase = (ph, timeout = 8000) => waitFor(`document.body.dataset.phase === '${ph}'`, timeout, `phase ${ph}`);
  const waitSeq = (n, timeout = 8000) => waitFor(`window.__lantern.sim.sequence.length === ${n} && window.__lantern.sim.phase !== 'locking'`, timeout, `sequence length ${n}`);

  // Manual dial: real clicks on 7 glyph buttons, one at a time, waiting for each lock.
  async function manualDial(seq, tag, opts = {}) {
    for (let i = 0; i < seq.length; i++) {
      const id = seq[i];
      const before = await state();
      await clickAt(`.glyph[data-glyph="${id}"]`, `${tag} click glyph ${id} (#${i + 1})`);
      await sleep(120);
      const during = await state();
      check(during.phase === 'locking' && during.simPhase === 'locking', `${tag} ${id}: lock sequence started after click`, `phase ${before.phase} -> ${during.phase}`);
      if (opts.shotDuring && i === opts.shotDuring.index) { await sleep(opts.shotDuring.delay); await shot(opts.shotDuring.name, `mid-lock of ${id}`); }
      const ok = await waitSeq(i + 1, 6000);
      const after = await state();
      check(ok && after.seq[i] === id, `${tag} ${id}: locked as waypoint ${i + 1}`, `seq=[${after.seq.join(',')}] hold=${after.hold} m phase=${after.phase}`);
      if (i < seq.length - 1) check(after.phase === 'idle', `${tag} ${id}: phase returns to idle between locks`, after.phase);
    }
  }

  // ==========================================================================
  section('0. Cold start @ 1920x1080 (fresh localStorage)');
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await installPhaseObserver();
  await sleep(1500);
  let s = await state();
  const shot00 = await shot('00_cold_start_1080p', `phase=${s.phase}`);
  check(s.phase === 'idle' && s.seq.length === 0, 'cold start is idle with empty profile', `phase=${s.phase} seq=${s.seq.length}`);
  check(await page.evaluate(() => document.querySelectorAll('.glyph').length) === 16, '16 strata glyph buttons rendered');
  check(s.commenceDisabled === true && s.commenceState === 'AWAITING PROFILE', 'COMMENCE disabled at cold start', s.commenceState);

  section('(e) Safety interlock (hull-integrity lockout) defaults to RELEASED on fresh load');
  check(s.lockoutChecked === false, 'lockout checkbox unchecked on fresh load', `checked=${s.lockoutChecked}`);
  check(s.lockout === false, 'sim.lockout === false on fresh load');
  check(s.lockoutText === 'RELEASED', 'lockout label reads RELEASED', s.lockoutText);
  const lkCls = await page.evaluate(() => document.getElementById('lockout-ctl').className);
  check(!/engaged/.test(lkCls), 'lockout control has no "engaged" class', lkCls);
  // Also after a second reload (persisted prefs must not re-arm it)
  await page.reload({ waitUntil: 'networkidle0' }); await installPhaseObserver(); await sleep(800);
  s = await state();
  check(s.lockoutChecked === false && s.lockout === false && s.lockoutText === 'RELEASED', 'lockout still RELEASED after a second reload', s.lockoutText);

  // ==========================================================================
  section('(a) Full manual dial — 7 real glyph clicks — must NOT auto-fire on the 7th lock');
  const SEQ1 = ['KEL', 'THR', 'DUSK', 'LANT', 'MIDN', 'CALD', 'VENT'];
  await manualDial(SEQ1, 'dial#1', { shotDuring: { index: 0, delay: 600, name: '01_manual_lock_in_progress_wp1' } });
  const tLock7 = Date.now();
  s = await state();
  const shotA1 = await shot('02a_after_7th_lock_immediate', `phase=${s.phase} aperture=${s.aperture} glow=${s.glow}`);
  check(s.phase === 'pending' && s.simPhase === 'pending', 'immediately after 7th lock: phase is PENDING (not buildup/active)', `phase=${s.phase}`);
  check(s.aperture === 0 && s.glow === 0, 'immediately after 7th lock: aperture closed, ring glow 0', `aperture=${s.aperture} glow=${s.glow}`);
  check(s.commenceDisabled === false && /PILOT ACTION REQUIRED/.test(s.commenceState), 'COMMENCE is enabled and demands pilot action', s.commenceState);
  await sleep(3000);
  s = await state();
  const shotA2 = await shot('02b_after_7th_lock_plus_3s_still_unfired', `phase=${s.phase} aperture=${s.aperture} glow=${s.glow} +${Date.now() - tLock7}ms`);
  check(s.phase === 'pending' && s.simPhase === 'pending', '3 s after 7th lock: STILL pending — no auto-fire', `phase=${s.phase}`);
  check(s.aperture === 0 && s.glow === 0, '3 s after 7th lock: aperture still 0, glow still 0', `aperture=${s.aperture} glow=${s.glow}`);
  const phasesSeen = s.phaseLog.map(p => p.phase);
  check(!phasesSeen.some(p => ['buildup', 'breakthrough', 'active'].includes(p)), 'phase observer never saw buildup/breakthrough/active before explicit engage', `observed: ${[...new Set(phasesSeen)].join(' > ')}`);
  const a12 = PNG.diffFraction(img(shotA1), img(shotA2), 40, 4);
  note(`  INFO pixel diff (thr 40) between immediate and +3s screenshots: ${(a12 * 100).toFixed(2)} % (ambient animation only is expected to be small)`);
  check(a12 < 0.15, 'no large-scale visual change between immediate and +3 s shots (nothing fired)', `${(a12 * 100).toFixed(2)} % differing`);

  // ==========================================================================
  section('(b) Explicit engage — three-stage activation, one screenshot per stage');
  const tEngage = Date.now();
  await clickAt('#btn-commence', 'COMMENCE FINAL DESCENT real click');
  await sleep(60); s = await state();
  check(s.phase === 'buildup', 'buildup starts only after explicit COMMENCE click', `phase=${s.phase} (${Date.now() - tEngage} ms after click)`);
  await sleep(1100); s = await state();
  const shotB1 = await shot('03_stage1_buildup', `phase=${s.phase} depth=${s.depth} dim=${s.dim} glow=${s.glow} aperture=${s.aperture}`);
  const b1phase = s.phase;
  check(b1phase === 'buildup', 'screenshot 1 taken during BUILDUP', `phase=${b1phase}`);
  await waitPhase('breakthrough', 4000);
  s = await state();
  const shotB2 = await shot('04_stage2_breakthrough', `phase=${s.phase} depth=${s.depth} dim=${s.dim} glow=${s.glow} aperture=${s.aperture}`);
  check(s.phase === 'breakthrough', 'screenshot 2 capture began during BREAKTHROUGH (900 ms stage; see closeout_stages.log for page-clock bracketing + rim-ring image proof)', `phase=${s.phase}`);
  await waitPhase('active', 4000);
  await sleep(1500); s = await state();
  const shotB3 = await shot('05_stage3_sustained_active', `phase=${s.phase} depth=${s.depth} dim=${s.dim} glow=${s.glow} aperture=${s.aperture}`);
  check(s.phase === 'active' && s.aperture === 1, 'screenshot 3 taken during SUSTAINED ACTIVE (aperture fully open)', `phase=${s.phase} aperture=${s.aperture}`);
  check(/RING HOLD ACTIVE/.test(s.commenceState), 'helm reports RING HOLD ACTIVE', s.commenceState);
  // Visual distinctness: byte identity, pixel diff, sphere-region + background luminance
  const [h1, h2, h3] = [shotB1, shotB2, shotB3].map(sha);
  check(h1 !== h2 && h2 !== h3 && h1 !== h3, 'stage screenshots are not byte-identical', `sha1 ${h1} / ${h2} / ${h3}`);
  const [i1, i2, i3, iP] = [shotB1, shotB2, shotB3, shotA2].map(img);
  const d12 = PNG.diffFraction(i1, i2), d23 = PNG.diffFraction(i2, i3), d13 = PNG.diffFraction(i1, i3), dP1 = PNG.diffFraction(iP, i1);
  note(`  INFO pixel diff fraction (>24 in any channel, 3px grid): pending->buildup ${(dP1 * 100).toFixed(1)} %, buildup->breakthrough ${(d12 * 100).toFixed(1)} %, breakthrough->active ${(d23 * 100).toFixed(1)} %, buildup->active ${(d13 * 100).toFixed(1)} %`);
  check(d12 > 0.05 && d23 > 0.05 && d13 > 0.05, 'each stage differs from the others by >5 % of sampled pixels');
  // sphere centre region (stage 1920x1080 @ scale 1: sphere roughly centred)
  const sph = im => PNG.meanLum(im, 780, 360, 1140, 720, 4);
  const bgL = im => PNG.meanLum(im, 0, 0, 1920, 1080, 8);
  const sphL = [iP, i1, i2, i3].map(sph).map(v => +v.toFixed(1)); const bgLs = [iP, i1, i2, i3].map(bgL).map(v => +v.toFixed(1));
  note(`  INFO mean luminance sphere region [pending, buildup, breakthrough, active] = ${sphL.join(' / ')}; whole frame = ${bgLs.join(' / ')}`);
  check(bgLs[1] < bgLs[0], 'BUILDUP frame is darker than the pending frame (light fading)', `${bgLs[1]} < ${bgLs[0]}`);
  check(bgLs[2] > bgLs[1], 'BREAKTHROUGH frame is brighter than buildup (flash)', `${bgLs[2]} > ${bgLs[1]}`);
  check(sphL[3] !== sphL[1] && sphL[3] !== sphL[2], 'ACTIVE sphere luminance differs from both earlier stages', sphL.join('/'));
  const sphereRGB = [iP, i1, i2, i3].map(im => PNG.meanRGB(im, 780, 360, 1140, 720, 4).join(','));
  note(`  INFO mean RGB sphere region [pending, buildup, breakthrough, active] = ${sphereRGB.join(' | ')}`);
  const phaseSeq = (await state()).phaseLog.map(p => p.phase).join(' > ');
  note(`  INFO observed phase sequence so far: ${phaseSeq}`);
  check(/pending > buildup > breakthrough > active/.test(phaseSeq), 'observed phase order pending > buildup > breakthrough > active');

  // ==========================================================================
  section('(d) Disengage / redial cycles x2 (engage -> disengage -> redial -> engage -> disengage -> redial)');
  // cycle 1 disengage
  await clickAt('#btn-ascend', 'cycle1 EMERGENCY ASCENT real click (disengage)');
  await sleep(80); s = await state();
  check(s.phase === 'ascending', 'cycle1: ascending after disengage', s.phase);
  await sleep(700); await shot('06_cycle1_disengage_ascending', `phase=${s.phase}`);
  await waitPhase('idle', 6000); await sleep(300); s = await state();
  check(s.phase === 'idle' && s.seq.length === 0 && s.hold === 0 && s.aperture === 0, 'cycle1: surfaced — idle, profile cleared, aperture closed', `phase=${s.phase} seq=${s.seq.length} hold=${s.hold}`);
  // redial 1 (different profile)
  const SEQ2 = ['THR', 'DUSK', 'OXM', 'MIDN', 'CALD', 'VENT', 'PLN'];
  await manualDial(SEQ2, 'redial#1');
  s = await state();
  check(s.phase === 'pending', 'redial#1 complete -> pending (not auto-fired)', s.phase);
  await sleep(1500); s = await state();
  check(s.phase === 'pending' && s.aperture === 0, 'redial#1: still pending 1.5 s later', `phase=${s.phase}`);
  await shot('07_redial1_pending', `phase=${s.phase} hold=${s.hold}`);
  await clickAt('#btn-commence', 'cycle2 COMMENCE real click');
  await waitPhase('active', 6000); await sleep(1200); s = await state();
  check(s.phase === 'active' && s.aperture === 1, 'cycle2: reached sustained active', `phase=${s.phase} depth=${s.depth}`);
  await shot('08_cycle2_active_abyssal_plain', `phase=${s.phase} depth=${s.depth}`);
  await clickAt('#btn-ascend', 'cycle2 EMERGENCY ASCENT real click (disengage)');
  await sleep(80); s = await state();
  check(s.phase === 'ascending', 'cycle2: ascending after disengage', s.phase);
  await waitPhase('idle', 6000); await sleep(300); s = await state();
  check(s.phase === 'idle' && s.seq.length === 0 && s.hold === 0, 'cycle2: surfaced — idle, profile cleared', `phase=${s.phase} seq=${s.seq.length}`);
  const SEQ3 = ['DUSK', 'LANT', 'MIDN', 'CALD', 'VENT', 'PLN', 'FRAC'];
  await manualDial(SEQ3, 'redial#2');
  s = await state();
  check(s.phase === 'pending', 'redial#2 complete -> pending (not auto-fired)', s.phase);
  await shot('09_redial2_pending', `phase=${s.phase} hold=${s.hold}`);
  await clickAt('#btn-commence', 'cycle3 COMMENCE real click (confirms redial#2 is engageable)');
  await waitPhase('active', 6000); await sleep(600); s = await state();
  check(s.phase === 'active', 'cycle3: redial#2 engages to active', s.phase);
  await shot('10_cycle3_active_fracture_terrace', `phase=${s.phase} depth=${s.depth}`);
  await clickAt('#btn-ascend', 'cycle3 EMERGENCY ASCENT (return to surface for replay test)');
  await waitPhase('idle', 6000); await sleep(300);

  // ==========================================================================
  section('(c) Quick-dial preset replays progressively (not an instant jump)');
  await clickAt('.tab[data-panel="computer"]', 'open DIVE COMPUTER tab');
  await sleep(300);
  const presetCount = await page.evaluate(() => document.querySelectorAll('.preset').length);
  check(presetCount === 7, 'dive computer lists 7 presets', `${presetCount}`);
  await shot('11_dive_computer_panel', `${presetCount} presets`);
  const tAuto = Date.now();
  await clickAt('.preset[data-preset="TL-02"]', 'click preset TL-02 Trench Lip Ring');
  const samples = [];
  const sampleAt = async (ms, name) => {
    const wait = ms - (Date.now() - tAuto); if (wait > 0) await sleep(wait);
    const st = await state(); const tAt = Date.now() - tAuto; const f = await shot(name, `t+${tAt}ms phase=${st.phase} seq=${st.seq.length} depth=${st.depth} auto=${st.auto}`);
    samples.push({ t: tAt, seq: st.seq.length, depth: st.depth, phase: st.phase, file: f });
  };
  await sampleAt(400, '12_replay_t0400ms');
  await sampleAt(1500, '13_replay_t1500ms');
  await sampleAt(3000, '14_replay_t3000ms');
  await sampleAt(4500, '15_replay_t4500ms');
  await sampleAt(6000, '16_replay_t6000ms');
  await waitFor(`document.body.dataset.phase === 'pending'`, 12000, 'replay reaches pending');
  const tPending = Date.now() - tAuto;
  s = await state();
  await shot('17_replay_pending', `t+${tPending}ms phase=${s.phase} seq=[${s.seq.join(',')}]`);
  const seqs = samples.map(x => x.seq), depths = samples.map(x => x.depth);
  note(`  INFO replay timeline: ${samples.map(x => `t+${x.t}ms seq=${x.seq} depth=${x.depth} ${x.phase}`).join(' | ')} | pending at t+${tPending}ms`);
  check(new Set(seqs).size >= 3, 'at least 3 distinct intermediate waypoint counts observed during replay', seqs.join(','));
  check(seqs.every((v, i) => i === 0 || v >= seqs[i - 1]) && depths.every((v, i) => i === 0 || v >= depths[i - 1] - 50), 'replay progresses monotonically (waypoints and depth)', `seq ${seqs.join('->')}, depth ${depths.join('->')}`);
  check(seqs[0] < 7 && seqs[1] < 7, 'replay is NOT instant: fewer than 7 waypoints at 0.4 s and 1.5 s', `seq@0.4s=${seqs[0]} seq@1.5s=${seqs[1]}`);
  check(tPending > 4000, 'replay took more than 4 s to reach pending', `${tPending} ms`);
  check(s.phase === 'pending' && s.seq.join(',') === 'LANT,MIDN,CALD,VENT,PLN,SCRP,TRN', 'replay ends PENDING with the TL-02 sequence', s.seq.join(','));
  const rs = samples.map(x => sha(x.file));
  check(new Set(rs).size === samples.length, 'replay screenshots are all distinct files', rs.join('/'));
  await sleep(3000); s = await state();
  check(s.phase === 'pending' && s.aperture === 0, 'replay does NOT auto-fire: still pending 3 s after completion', `phase=${s.phase}`);
  await clickAt('#btn-ascend', 'EMERGENCY ASCENT after replay (return to surface)');
  await waitPhase('idle', 6000); await sleep(300);

  // ==========================================================================
  section('(f) Every secondary tab / panel shows real content when clicked');
  const TABS = ['archive', 'vessel', 'computer', 'log', 'settings'];
  for (const name of TABS) {
    await clickAt(`.tab[data-panel="${name}"]`, `click tab ${name.toUpperCase()}`);
    await sleep(350);
    const info = await page.evaluate(n => {
      const layer = document.getElementById('panel-layer'); const p = document.getElementById('panel-' + n);
      const body = p && p.querySelector('.panel-body');
      const r = p ? p.getBoundingClientRect() : null;
      const visibleKids = body ? Array.from(body.querySelectorAll('*')).filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; }).length : 0;
      const text = body ? body.innerText.replace(/\s+/g, ' ').trim() : '';
      const svgEls = body ? body.querySelectorAll('svg *').length : 0;
      const others = Array.from(document.querySelectorAll('.panel')).filter(q => q !== p && !q.hidden).map(q => q.id);
      return { layerHidden: layer.hidden, panelHidden: p ? p.hidden : null, w: r ? r.width : 0, h: r ? r.height : 0, visibleKids, textLen: text.length, textHead: text.slice(0, 160), svgEls, others, active: document.querySelector(`.tab[data-panel="${n}"]`).classList.contains('active') };
    }, name);
    await shot(`18_panel_${name}`, `${info.w.toFixed(0)}x${info.h.toFixed(0)} text=${info.textLen} chars visibleEls=${info.visibleKids} svgEls=${info.svgEls}`);
    check(!info.layerHidden && info.panelHidden === false, `${name}: panel visible after click`, `layerHidden=${info.layerHidden} panelHidden=${info.panelHidden} othersVisible=[${info.others}]`);
    check(info.w > 600 && info.h > 300, `${name}: panel has rendered size`, `${info.w.toFixed(0)}x${info.h.toFixed(0)}`);
    const hasContent = name === 'vessel' ? (info.svgEls > 20 && info.visibleKids > 20) : (info.textLen > 200 && info.visibleKids > 10);
    check(hasContent, `${name}: panel body has real content`, name === 'vessel' ? `svg elements=${info.svgEls} visible elements=${info.visibleKids} text="${info.textHead}"` : `${info.textLen} chars, ${info.visibleKids} visible elements: "${info.textHead}..."`);
    if (name === 'archive') {
      // click a record with a real pointer event and confirm detail populates
      await clickAt('#archive-list button', 'archive: click first record');
      await sleep(200);
      const det = await page.evaluate(() => document.getElementById('archive-detail').innerText.replace(/\s+/g, ' ').trim());
      check(det.length > 100, 'archive: record detail populates on click', `"${det.slice(0, 120)}..."`);
      await shot('18_panel_archive_detail', `${det.length} chars`);
    }
    // close via the panel's own close button (real click)
    await clickAt(`#panel-${name} [data-close]`, `${name}: close button`);
    await sleep(150);
    const closed = await page.evaluate(() => document.getElementById('panel-layer').hidden);
    check(closed, `${name}: panel closes via its close button`);
  }
  // help overlay
  await clickAt('#help-btn', 'click ? operator reference button');
  await sleep(300);
  const help = await page.evaluate(() => { const h = document.getElementById('help-overlay'); const b = document.getElementById('help-body'); return { hidden: h.hidden, textLen: b.innerText.replace(/\s+/g, ' ').trim().length, head: b.innerText.replace(/\s+/g, ' ').trim().slice(0, 120) }; });
  await shot('19_operator_reference', `text=${help.textLen} chars`);
  check(!help.hidden && help.textLen > 300, 'operator reference overlay shows real content', `${help.textLen} chars: "${help.head}..."`);
  await clickAt('#help-close', 'close operator reference');
  await sleep(150);
  check(await page.evaluate(() => document.getElementById('help-overlay').hidden), 'operator reference closes');

  // ==========================================================================
  section('(g) Background fill at non-16:9 viewports (no unstyled gaps)');
  async function edgeCheck(w, h, name) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.reload({ waitUntil: 'networkidle0' }); await sleep(1200);
    const geo = await page.evaluate(() => { const st = document.getElementById('stage').getBoundingClientRect(); const bg = document.getElementById('ocean-bg').getBoundingClientRect(); return { stage: [st.left, st.top, st.width, st.height].map(Math.round), bg: [bg.left, bg.top, bg.width, bg.height].map(Math.round), scale: window.__lanternScale.uiScale.toFixed(3), bodyBg: getComputedStyle(document.body).backgroundColor, htmlBg: getComputedStyle(document.documentElement).backgroundColor, scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight }; });
    const f = await shot(name, `stage ${geo.stage.join(',')} scale ${geo.scale} bg ${geo.bg.join(',')}`);
    const im = img(f);
    check(im.width === w && im.height === h, `${w}x${h}: screenshot dimensions`, `${im.width}x${im.height}`);
    check(geo.bg[0] <= 0 && geo.bg[1] <= 0 && geo.bg[2] >= w && geo.bg[3] >= h, `${w}x${h}: #ocean-bg covers the whole viewport`, `bg rect ${geo.bg.join(',')}`);
    // sample a border band (8 px in) all the way around + corners + the gap region outside the stage
    const pts = []; const step = 16;
    for (let x = 2; x < w; x += step) { pts.push([x, 3]); pts.push([x, h - 4]); }
    for (let y = 2; y < h; y += step) { pts.push([3, y]); pts.push([w - 4, y]); }
    // band just outside the stage box (letterbox / pillarbox region)
    const [sx, sy, sw, sh] = geo.stage;
    for (let x = 2; x < w; x += step) { if (sy > 12) pts.push([x, Math.floor(sy / 2)]); if (h - (sy + sh) > 12) pts.push([x, Math.floor(sy + sh + (h - sy - sh) / 2)]); }
    for (let y = 2; y < h; y += step) { if (sx > 12) pts.push([Math.floor(sx / 2), y]); if (w - (sx + sw) > 12) pts.push([Math.floor(sx + sw + (w - sx - sw) / 2), y]); }
    let bright = 0, white = 0, worst = 0, worstPt = null;
    for (const [x, y] of pts) { const [r, g, b] = PNG.px(im, x, y); const L = 0.2126 * r + 0.7152 * g + 0.0722 * b; if (r > 240 && g > 240 && b > 240) white++; if (L > 120) bright++; if (L > worst) { worst = L; worstPt = [x, y, r, g, b]; } }
    note(`  INFO ${w}x${h}: sampled ${pts.length} edge/gap pixels; white=${white} bright(L>120)=${bright}; brightest L=${worst.toFixed(0)} at (${worstPt.join(',')}); body bg ${geo.bodyBg}; scroll ${geo.scrollW}x${geo.scrollH}`);
    check(white === 0, `${w}x${h}: no white/default pixels along edges or in letterbox gaps`, `${white} white of ${pts.length}`);
    check(bright === 0, `${w}x${h}: no bright (unstyled) pixels along edges or in letterbox gaps`, `${bright} bright of ${pts.length}`);
    check(geo.scrollW <= w && geo.scrollH <= h, `${w}x${h}: no scroll overflow`, `${geo.scrollW}x${geo.scrollH}`);
    // corner zoom for the report
    const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].map(([x, y]) => PNG.px(im, x, y).join(','));
    note(`  INFO ${w}x${h}: corner pixels TL/TR/BL/BR = ${corners.join(' | ')}`);
    return geo;
  }
  await edgeCheck(800, 1200, '20_viewport_800x1200_tall');
  await edgeCheck(1600, 600, '21_viewport_1600x600_wide');
  await edgeCheck(1280, 1024, '22_viewport_1280x1024');

  // ==========================================================================
  section('Console / page errors captured during the whole run');
  note(`  INFO console.error + pageerror count: ${consoleErrors.length}`);
  for (const e of consoleErrors) note(`    ERR ${e}`);
  note(`  INFO console.warn count: ${consoleWarnings.length}`);
  for (const e of consoleWarnings.slice(0, 10)) note(`    WARN ${e}`);
  note(`  INFO failed network requests: ${requestFailures.length}`);
  for (const e of requestFailures.slice(0, 10)) note(`    NET ${e}`);
  const appErrors = consoleErrors.filter(e => !/fonts\.g(oogleapis|static)\.com/.test(e));
  check(appErrors.length === 0, 'no application console errors / page errors (font CDN failures excluded)', appErrors.length ? appErrors.join(' || ') : 'none');

  await browser.close();
  note(`\n## RESULT: ${pass} passed, ${fail} failed`);
  if (failures.length) { note('Failures:'); failures.forEach(f => note('  - ' + f)); }
  fs.writeFileSync(path.join(SHOTS, '..', '..', 'closeout.log'), report.join('\n') + '\n');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS CRASH', e); process.exit(2); });
