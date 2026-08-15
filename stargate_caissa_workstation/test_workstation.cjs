const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function hitTestClick(page, selector) {
  const elem = await page.$(selector);
  if (!elem) throw new Error(`Element not found: ${selector}`);

  const box = await elem.boundingBox();
  if (!box) throw new Error(`Bounding box not found for: ${selector}`);

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Hit-test verification with elementFromPoint
  const hitMatches = await page.evaluate(({ cx, cy, sel }) => {
    const el = document.elementFromPoint(cx, cy);
    const target = document.querySelector(sel);
    return el && (el === target || target.contains(el) || el.contains(target));
  }, { cx: centerX, cy: centerY, sel: selector });

  if (!hitMatches) {
    console.warn(`Warning: elementFromPoint at (${centerX}, ${centerY}) did not match selector: ${selector}`);
  }

  // Dispatch real pointer events
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await sleep(40);
  await page.mouse.up();
  await sleep(60);
}

async function runTests() {
  console.log('=== STARTING CAÏSSA WORKSTATION AUTOMATED VERIFICATION ===\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  const testLogs = [];

  try {
    // -------------------------------------------------------------
    // TEST 1: VIEWPORT & SCALING (1080p and 4K)
    // -------------------------------------------------------------
    console.log('[TEST 1] Testing Viewport Scaling at 1920x1080 (1080p) & 3840x2160 (4K)...');
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page.goto('http://127.0.0.1:8085/', { waitUntil: 'networkidle0' });
    await sleep(300);

    const scale1080 = await page.evaluate(() => {
      return {
        scale: window.__CAISSA_COMPUTED_SCALE__,
        viewport: window.__CAISSA_VIEWPORT_DIMS__,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        hasScroll: document.documentElement.scrollHeight > document.documentElement.clientHeight ||
                   document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });

    console.log(`  1080p Actual Viewport: ${scale1080.viewport.width}x${scale1080.viewport.height}`);
    console.log(`  1080p Computed Scale: ${scale1080.scale}`);
    console.log(`  1080p Scroll Overflow: ${scale1080.hasScroll ? 'FAILED (Has Scroll)' : 'PASSED (Zero Scroll)'}`);

    if (scale1080.hasScroll || Math.abs(scale1080.scale - 1.0) > 0.01) {
      throw new Error(`1080p scale or overflow verification failed: scale=${scale1080.scale}`);
    }

    const snap1080 = path.join(SCREENSHOT_DIR, '01_render_1080p.png');
    await page.screenshot({ path: snap1080 });
    testLogs.push({ test: '1080p Rendering', screenshot: snap1080, status: 'PASSED' });

    // 4K Viewport test
    await page.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 1 });
    await sleep(300);

    const scale4k = await page.evaluate(() => {
      return {
        scale: window.__CAISSA_COMPUTED_SCALE__,
        viewport: window.__CAISSA_VIEWPORT_DIMS__,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        hasScroll: document.documentElement.scrollHeight > document.documentElement.clientHeight ||
                   document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });

    console.log(`  4K Actual Viewport: ${scale4k.viewport.width}x${scale4k.viewport.height}`);
    console.log(`  4K Computed Scale: ${scale4k.scale}`);
    console.log(`  4K Scroll Overflow: ${scale4k.hasScroll ? 'FAILED (Has Scroll)' : 'PASSED (Zero Scroll)'}`);

    if (scale4k.hasScroll || Math.abs(scale4k.scale - 2.0) > 0.01) {
      throw new Error(`4K scale or overflow verification failed: scale=${scale4k.scale}`);
    }

    const snap4k = path.join(SCREENSHOT_DIR, '02_render_4k.png');
    await page.screenshot({ path: snap4k });
    testLogs.push({ test: '4K Scaling', screenshot: snap4k, status: 'PASSED' });

    // Reset viewport to 1080p for subsequent interaction tests
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await sleep(200);

    // -------------------------------------------------------------
    // TEST 2: NEGATIVE AUTO-FIRE TEST (HARD REQUIREMENT)
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Testing Negative Auto-Fire Guarantee (Dialing 7 Moves)...');
    // Ensure state is idle
    await page.evaluate(() => window.CaissaState.reset());
    await sleep(100);

    const movesToDial = ['e4', 'd4', 'Nf3', 'Bc4', 'Qh5', 'Rxd5', 'Qxf7'];
    for (let i = 0; i < movesToDial.length; i++) {
      const moveId = movesToDial[i];
      await hitTestClick(page, `#move-btn-${moveId}`);
      await sleep(120);
    }

    // Wait 1.2 seconds after completing final move to ensure NO auto-activation fires
    await sleep(1200);

    const afterDialState = await page.evaluate(() => {
      return {
        status: window.CaissaState.status,
        historyLength: window.CaissaState.history.length,
        isAutoFired: window.CaissaState.status === 'STAGE_BUILDUP' ||
                     window.CaissaState.status === 'STAGE_BREAKTHROUGH' ||
                     window.CaissaState.status === 'STAGE_SUSTAINED'
      };
    });

    console.log(`  State after 7th move completion: ${afterDialState.status}`);
    console.log(`  History length: ${afterDialState.historyLength}/7`);
    console.log(`  Auto-Fired?: ${afterDialState.isAutoFired ? 'FAILED (Auto-fired!)' : 'PASSED (Negative test confirmed)'}`);

    if (afterDialState.status !== 'LINE_PENDING_COMMIT' || afterDialState.isAutoFired) {
      throw new Error(`CRITICAL NEGATIVE AUTO-FIRE FAILURE: State is ${afterDialState.status}, expected LINE_PENDING_COMMIT`);
    }

    const snapPending = path.join(SCREENSHOT_DIR, '03_dial_full_pending_commit.png');
    await page.screenshot({ path: snapPending });
    testLogs.push({ test: 'Negative Auto-Fire Guarantee', screenshot: snapPending, status: 'PASSED' });

    // -------------------------------------------------------------
    // TEST 3: SAFETY INTERLOCK SUBSYSTEM (DEFAULT RELEASED + BLOCKED COMMIT)
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Testing Safety Interlock Subsystem (Default Released, Hold Block)...');
    
    // Check initial default state
    const defaultInterlock = await page.evaluate(() => window.CaissaState.blunderCheckHold);
    console.log(`  Interlock Default State: ${defaultInterlock ? 'ENGAGED (FAIL)' : 'RELEASED (PASSED)'}`);
    if (defaultInterlock !== false) {
      throw new Error('Safety interlock must default to RELEASED (false)');
    }

    // Engage Interlock via hit-tested click
    await hitTestClick(page, '#interlock-control');
    await sleep(150);

    const interlockEngaged = await page.evaluate(() => window.CaissaState.blunderCheckHold);
    console.log(`  Interlock After Click: ${interlockEngaged ? 'ENGAGED (PASSED)' : 'RELEASED (FAIL)'}`);
    if (!interlockEngaged) {
      throw new Error('Failed to engage safety interlock on click');
    }

    // Attempt Commit while Interlock is Engaged -> Must be Blocked
    await hitTestClick(page, '#commit-line-btn');
    await sleep(300);

    const blockResult = await page.evaluate(() => {
      const banner = document.getElementById('blunder-warning-banner');
      return {
        status: window.CaissaState.status,
        bannerShown: banner && banner.classList.contains('show')
      };
    });

    console.log(`  Status after blocked commit attempt: ${blockResult.status}`);
    console.log(`  Blunder warning banner shown: ${blockResult.bannerShown ? 'PASSED (Shown)' : 'FAIL'}`);

    if (blockResult.status !== 'LINE_PENDING_COMMIT' || !blockResult.bannerShown) {
      throw new Error('Safety interlock failed to block commit');
    }

    const snapBlocked = path.join(SCREENSHOT_DIR, '04_interlock_blocked_commit.png');
    await page.screenshot({ path: snapBlocked });
    testLogs.push({ test: 'Safety Interlock Hold Block', screenshot: snapBlocked, status: 'PASSED' });

    // Release Interlock
    await hitTestClick(page, '#interlock-control');
    await sleep(150);

    // -------------------------------------------------------------
    // TEST 4: THREE-STAGE STAGED ACTIVATION SEQUENCE
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Testing Three-Stage Activation (Buildup -> Breakthrough -> Sustained)...');

    // Click Commit Line with interlock released
    await hitTestClick(page, '#commit-line-btn');

    // Sample Stage 1: Buildup (at t = 1.2s)
    await sleep(1200);
    const stage1State = await page.evaluate(() => {
      return {
        status: window.CaissaState.status,
        depth: document.getElementById('tele-depth-val').textContent,
        statusText: document.getElementById('engine-status-text').textContent
      };
    });
    console.log(`  Stage 1 (t=1.2s) State: ${stage1State.status} [${stage1State.statusText}]`);
    const snapStage1 = path.join(SCREENSHOT_DIR, '05_stage1_buildup.png');
    await page.screenshot({ path: snapStage1 });

    if (stage1State.status !== 'STAGE_BUILDUP') {
      throw new Error(`Expected STAGE_BUILDUP, got: ${stage1State.status}`);
    }

    // Sample Stage 2: Breakthrough Instant (at t = 2.8s total, +1.6s from buildup sample)
    await sleep(1600);
    const stage2State = await page.evaluate(() => {
      return {
        status: window.CaissaState.status,
        score: document.getElementById('eval-score-num').textContent,
        statusText: document.getElementById('engine-status-text').textContent
      };
    });
    console.log(`  Stage 2 (t=2.8s) State: ${stage2State.status} [${stage2State.statusText}] (Eval: ${stage2State.score})`);
    const snapStage2 = path.join(SCREENSHOT_DIR, '06_stage2_breakthrough.png');
    await page.screenshot({ path: snapStage2 });

    if (stage2State.status !== 'STAGE_BREAKTHROUGH') {
      throw new Error(`Expected STAGE_BREAKTHROUGH, got: ${stage2State.status}`);
    }

    // Sample Stage 3: Sustained Active (at t = 4.2s total, +1.4s from breakthrough)
    await sleep(1400);
    const stage3State = await page.evaluate(() => {
      return {
        status: window.CaissaState.status,
        statusText: document.getElementById('engine-status-text').textContent
      };
    });
    console.log(`  Stage 3 (t=4.2s) State: ${stage3State.status} [${stage3State.statusText}]`);
    const snapStage3 = path.join(SCREENSHOT_DIR, '07_stage3_sustained_active.png');
    await page.screenshot({ path: snapStage3 });

    if (stage3State.status !== 'STAGE_SUSTAINED') {
      throw new Error(`Expected STAGE_SUSTAINED, got: ${stage3State.status}`);
    }

    testLogs.push({ test: '3-Stage Activation Buildup', screenshot: snapStage1, status: 'PASSED' });
    testLogs.push({ test: '3-Stage Activation Breakthrough', screenshot: snapStage2, status: 'PASSED' });
    testLogs.push({ test: '3-Stage Activation Sustained', screenshot: snapStage3, status: 'PASSED' });

    // -------------------------------------------------------------
    // TEST 5: DISENGAGE & REDIAL CYCLES (TESTED TWICE)
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Testing Disengage / Redial Cycles Twice with Real Pointer Events...');

    // Cycle 1: Disengage from active state -> Redial -> Commit -> Disengage
    console.log('  Executing Disengage Cycle 1...');
    await hitTestClick(page, '#resign-line-btn');
    await sleep(200);

    let resetState = await page.evaluate(() => ({ status: window.CaissaState.status, count: window.CaissaState.history.length }));
    if (resetState.status !== 'IDLE' || resetState.count !== 0) {
      throw new Error(`Disengage Cycle 1 reset failed: status=${resetState.status}`);
    }

    // Redial via Preset Tier 1 (Opera House)
    await hitTestClick(page, '#preset-btn-preset_opera');
    await sleep(200);
    let presetLoaded = await page.evaluate(() => window.CaissaState.status);
    if (presetLoaded !== 'LINE_PENDING_COMMIT') {
      throw new Error(`Preset load failed in cycle 1: ${presetLoaded}`);
    }

    // Commit Line
    await hitTestClick(page, '#commit-line-btn');
    await sleep(3800); // reach sustained active
    let cycle1Active = await page.evaluate(() => window.CaissaState.status);
    if (cycle1Active !== 'STAGE_SUSTAINED') {
      throw new Error(`Cycle 1 commit failed to reach sustained: ${cycle1Active}`);
    }

    // Cycle 2: Disengage -> Load Preset Tier 2 (Quantum King Clearance) -> Commit -> Disengage
    console.log('  Executing Disengage Cycle 2...');
    await hitTestClick(page, '#resign-line-btn');
    await sleep(200);

    resetState = await page.evaluate(() => ({ status: window.CaissaState.status, count: window.CaissaState.history.length }));
    if (resetState.status !== 'IDLE' || resetState.count !== 0) {
      throw new Error(`Disengage Cycle 2 reset failed: status=${resetState.status}`);
    }

    await hitTestClick(page, '#preset-btn-preset_king_walk');
    await sleep(200);
    let preset2Loaded = await page.evaluate(() => window.CaissaState.status);
    if (preset2Loaded !== 'LINE_PENDING_COMMIT') {
      throw new Error(`Preset load failed in cycle 2: ${preset2Loaded}`);
    }

    // Disengage before commit
    await hitTestClick(page, '#resign-line-btn');
    await sleep(200);
    resetState = await page.evaluate(() => ({ status: window.CaissaState.status, count: window.CaissaState.history.length }));
    if (resetState.status !== 'IDLE') {
      throw new Error(`Disengage reset failed: status=${resetState.status}`);
    }

    const snapDisengage = path.join(SCREENSHOT_DIR, '08_disengage_cycle.png');
    await page.screenshot({ path: snapDisengage });
    testLogs.push({ test: 'Dual Disengage/Redial Cycles', screenshot: snapDisengage, status: 'PASSED' });

    // -------------------------------------------------------------
    // TEST 6: QUICK-DIAL PRESET TIERS
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Testing Quick-Dial Preset Tiers (Tier 1 vs Tier 2)...');
    await hitTestClick(page, '#preset-btn-preset_greek_gift');
    await sleep(150);

    const tier1Data = await page.evaluate(() => ({
      status: window.CaissaState.status,
      historyLength: window.CaissaState.history.length,
      eval: document.getElementById('eval-score-num').textContent
    }));
    console.log(`  Tier 1 Preset (Greek Gift): status=${tier1Data.status}, plies=${tier1Data.historyLength}, eval=${tier1Data.eval}`);
    if (tier1Data.status !== 'LINE_PENDING_COMMIT' || tier1Data.historyLength !== 7) {
      throw new Error('Tier 1 preset verification failed');
    }

    await hitTestClick(page, '#preset-btn-preset_pawn_storm');
    await sleep(150);

    const tier2Data = await page.evaluate(() => ({
      status: window.CaissaState.status,
      historyLength: window.CaissaState.history.length,
      eval: document.getElementById('eval-score-num').textContent
    }));
    console.log(`  Tier 2 Preset (Pawn Storm): status=${tier2Data.status}, plies=${tier2Data.historyLength}, eval=${tier2Data.eval}`);
    if (tier2Data.status !== 'LINE_PENDING_COMMIT' || tier2Data.historyLength !== 7) {
      throw new Error('Tier 2 preset verification failed');
    }

    const snapPresets = path.join(SCREENSHOT_DIR, '09_quick_dial_preset.png');
    await page.screenshot({ path: snapPresets });
    testLogs.push({ test: 'Quick-Dial Preset Tiers', screenshot: snapPresets, status: 'PASSED' });

    // -------------------------------------------------------------
    // TEST 7: OPERATOR REFERENCE MODAL (? HELP OVERLAY)
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Testing Operator Reference Modal (? Button)...');
    await hitTestClick(page, '#help-operator-btn');
    await sleep(200);

    const modalOpen = await page.evaluate(() => {
      const m = document.getElementById('operator-modal');
      return m && m.classList.contains('open');
    });
    console.log(`  Operator Modal Open: ${modalOpen ? 'PASSED (Open)' : 'FAIL'}`);
    if (!modalOpen) {
      throw new Error('Operator modal did not open on ? button click');
    }

    const snapModal = path.join(SCREENSHOT_DIR, '10_operator_help_modal.png');
    await page.screenshot({ path: snapModal });
    testLogs.push({ test: 'Operator Reference Modal', screenshot: snapModal, status: 'PASSED' });

    // Close modal
    await hitTestClick(page, '#close-modal-btn');
    await sleep(200);
    const modalClosed = await page.evaluate(() => {
      const m = document.getElementById('operator-modal');
      return m && !m.classList.contains('open');
    });
    if (!modalClosed) {
      throw new Error('Operator modal failed to close');
    }

    console.log('\n=== ALL AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n');
    console.log(JSON.stringify(testLogs, null, 2));

  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();
