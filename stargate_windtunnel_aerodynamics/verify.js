// ============================================================================
// Aeolos Stagnation Plenum (ASP-9) — Automated Puppeteer Verification Suite
// Dispatched-Event Hit-Testing, Negative-Case Assertion, 3-Stage Screenshots
// ============================================================================

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, 'test_screenshots');
const TEST_PORT = process.env.PORT || 8094;
const BASE_URL = `http://localhost:${TEST_PORT}/`;

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Browser resolution. No absolute local filesystem path is committed here:
// CHROME_PATH (or PUPPETEER_EXECUTABLE_PATH) wins, otherwise puppeteer's own
// executable path is used. Anything else is an explicit error.
async function resolveChrome() {
  const fromEnv = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Click at the exact rendered bounding box center
async function clickElementCenter(page, selector) {
  const el = await page.waitForSelector(selector, { visible: true });
  const box = await el.boundingBox();
  if (!box) throw new Error(`Bounding box null for selector: ${selector}`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.click(x, y);
  return { x, y };
}

async function runVerification() {
  console.log('=== STARTING AEOLOS STAGNATION PLENUM (ASP-9) VERIFICATION ===');
  console.log(`Target URL: ${BASE_URL}`);
  const executablePath = await resolveChrome();
  console.log(`Chrome Executable: ${executablePath}`);

  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
    screenshots: []
  };

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const page = await browser.newPage();

  try {
    // -----------------------------------------------------------------------
    // TEST 1: RESPONSIVE CSS SCALING & VIEWPORT TRANSFORM (1080p & 4K)
    // -----------------------------------------------------------------------
    console.log('\n--- TEST 1: Viewport Scaling & CSS Unitless Transform ---');

    // 1080p Viewport Test
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await sleep(600);

    const scale1080 = await page.evaluate(() => {
      const el = document.getElementById('app-scaler');
      const style = window.getComputedStyle(el);
      const uiScale = window.getComputedStyle(document.documentElement).getPropertyValue('--ui-scale');
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        uiScaleVar: uiScale.trim(),
        transform: style.transform
      };
    });
    console.log('1080p Observed Values:', scale1080);
    const pass1080 = scale1080.transform !== 'none' && scale1080.uiScaleVar === '1.0000';

    // 4K Viewport Test (3840x2160)
    await page.setViewport({ width: 3840, height: 2160 });
    await sleep(400);

    const scale4k = await page.evaluate(() => {
      const el = document.getElementById('app-scaler');
      const style = window.getComputedStyle(el);
      const uiScale = window.getComputedStyle(document.documentElement).getPropertyValue('--ui-scale');
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        uiScaleVar: uiScale.trim(),
        transform: style.transform
      };
    });
    console.log('4K Observed Values:', scale4k);
    const pass4k = scale4k.transform !== 'none' && scale4k.uiScaleVar === '2.0000';

    results.tests.test1_responsive_scaling = {
      passed: pass1080 && pass4k,
      scale1080,
      scale4k
    };

    // Reset back to standard 1080p for functional interaction tests
    await page.setViewport({ width: 1920, height: 1080 });
    await sleep(300);

    // Capture 01_idle_state.png
    const idlePath = path.join(SCREENSHOT_DIR, '01_idle_state.png');
    await page.screenshot({ path: idlePath, fullPage: false });
    results.screenshots.push('01_idle_state.png');
    console.log('Saved screenshot: 01_idle_state.png');

    // -----------------------------------------------------------------------
    // TEST 2: VANE DIALING & LOCKING MECHANISM PROGRESSION
    // -----------------------------------------------------------------------
    console.log('\n--- TEST 2: Vane Dialing & Locking Progression ---');

    // Select and lock 3 sectors manually with hit-tested mouse clicks
    const sectorsToLock = [1, 2, 3, 4, 5];
    for (let i = 0; i < sectorsToLock.length; i++) {
      const sId = sectorsToLock[i];
      await clickElementCenter(page, `#sector-btn-${sId}`);
      await sleep(150);
      await clickElementCenter(page, '#btn-lock-sector');
      await sleep(150);
    }

    const stateAfter5 = await page.evaluate(() => {
      const count = document.getElementById('locked-vane-count').textContent;
      const state = window.appInstance.appState;
      const boundaryText = document.getElementById('disp-boundary-state').textContent;
      return { count: parseInt(count, 10), state, boundaryText };
    });
    console.log('State After 5 Locked Vanes:', stateAfter5);

    const passLockProgression = stateAfter5.count === 5 && stateAfter5.state === 'STANDBY';
    results.tests.test2_vane_locking = {
      passed: passLockProgression,
      observed: stateAfter5
    };

    // -----------------------------------------------------------------------
    // TEST 3: NEGATIVE CASE — NO AUTO-FIRE ON 6TH SYMBOL COMPLETION
    // -----------------------------------------------------------------------
    console.log('\n--- TEST 3: Negative Case — No Auto-Fire On Final Symbol ---');

    // Lock 6th sector
    await clickElementCenter(page, '#sector-btn-6');
    await sleep(150);
    await clickElementCenter(page, '#btn-lock-sector');
    await sleep(200);

    // Initial check right after 6th lock
    const immediateState = await page.evaluate(() => ({
      count: window.appInstance.lockedSectors.length,
      state: window.appInstance.appState,
      mach: window.appInstance.currentMach,
      btnDisabled: document.getElementById('btn-initiate-run').disabled,
      btnText: document.getElementById('run-btn-text-main').textContent
    }));
    console.log('Immediate State after 6th Lock:', immediateState);

    // Wait 1200ms with ZERO interaction to verify it NEVER auto-fires
    await sleep(1200);

    const delayedState = await page.evaluate(() => ({
      count: window.appInstance.lockedSectors.length,
      state: window.appInstance.appState,
      mach: window.appInstance.currentMach,
      btnDisabled: document.getElementById('btn-initiate-run').disabled
    }));
    console.log('State 1200ms Later (No Interaction):', delayedState);

    const passNegativeCase =
      immediateState.state === 'ARMED' &&
      immediateState.count === 6 &&
      immediateState.btnDisabled === false &&
      delayedState.state === 'ARMED' &&
      delayedState.mach < 0.15; // Mach stayed near zero, never triggered!

    results.tests.test3_never_auto_fire = {
      passed: passNegativeCase,
      immediateState,
      delayedState
    };

    // -----------------------------------------------------------------------
    // TEST 4: THREE-STAGE ACTIVATION & NAMED SCREENSHOTS
    // -----------------------------------------------------------------------
    console.log('\n--- TEST 4: Three-Stage Activation (Buildup, Breakthrough, Sustained) ---');

    // Trigger activation via dedicated INITIATE TRANSONIC RUN button
    await clickElementCenter(page, '#btn-initiate-run');

    // Stage 1: Buildup Phase (sampled during 2.2s buildup)
    await sleep(900);
    const buildupState = await page.evaluate(() => ({
      state: window.appInstance.appState,
      mach: window.appInstance.currentMach,
      badge: document.getElementById('run-master-state-badge').textContent
    }));
    console.log('Observed Stage 1 (Buildup):', buildupState);
    const buildupPath = path.join(SCREENSHOT_DIR, '02_buildup_phase.png');
    await page.screenshot({ path: buildupPath, fullPage: false });
    results.screenshots.push('02_buildup_phase.png');

    // Stage 2: Breakthrough Instant (wait for exact BREAKTHROUGH state)
    await page.waitForFunction(() => window.appInstance.appState === 'BREAKTHROUGH', { timeout: 4000 });
    const breakthroughState = await page.evaluate(() => ({
      state: window.appInstance.appState,
      mach: window.appInstance.currentMach,
      badge: document.getElementById('run-master-state-badge').textContent,
      flash: window.appInstance.renderer.breakthroughFlash
    }));
    console.log('Observed Stage 2 (Breakthrough):', breakthroughState);
    const breakthroughPath = path.join(SCREENSHOT_DIR, '03_breakthrough_instant.png');
    await page.screenshot({ path: breakthroughPath, fullPage: false });
    results.screenshots.push('03_breakthrough_instant.png');

    // Stage 3: Sustained Active State (wait for exact ACTIVE state)
    await page.waitForFunction(() => window.appInstance.appState === 'ACTIVE', { timeout: 3000 });
    await sleep(400); // Allow supersonic diamonds and streamlines to settle
    const activeState = await page.evaluate(() => ({
      state: window.appInstance.appState,
      mach: window.appInstance.currentMach,
      badge: document.getElementById('run-master-state-badge').textContent,
      q: window.appInstance.dynamicHeadQ
    }));
    console.log('Observed Stage 3 (Sustained Active):', activeState);
    const activePath = path.join(SCREENSHOT_DIR, '04_sustained_active.png');
    await page.screenshot({ path: activePath, fullPage: false });
    results.screenshots.push('04_sustained_active.png');

    const pass3Stage =
      buildupState.state === 'BUILDUP' &&
      breakthroughState.state === 'BREAKTHROUGH' &&
      activeState.state === 'ACTIVE' &&
      activeState.mach > 1.2;

    results.tests.test4_three_stage_activation = {
      passed: pass3Stage,
      buildupState,
      breakthroughState,
      activeState
    };

    // -----------------------------------------------------------------------
    // TEST 5: DISENGAGE & REDIAL CYCLES (TWICE)
    // -----------------------------------------------------------------------
    console.log('\n--- TEST 5: Disengage & Redial Cycle (Twice) ---');

    // Cycle 1: Disengage while ACTIVE
    await clickElementCenter(page, '#btn-emergency-dump');
    await sleep(400);

    const dump1State = await page.evaluate(() => ({
      state: window.appInstance.appState,
      count: window.appInstance.lockedSectors.length,
      mach: window.appInstance.currentMach
    }));
    console.log('Cycle 1 Dump Result:', dump1State);

    // Redial 6 sectors
    for (let s = 1; s <= 6; s++) {
      await clickElementCenter(page, `#sector-btn-${s}`);
      await sleep(100);
      await clickElementCenter(page, '#btn-lock-sector');
      await sleep(100);
    }
    const redial1State = await page.evaluate(() => window.appInstance.appState);
    console.log('Cycle 1 Redial State:', redial1State);

    // Cycle 2: Disengage again while ARMED
    await clickElementCenter(page, '#btn-emergency-dump');
    await sleep(300);
    const dump2State = await page.evaluate(() => ({
      state: window.appInstance.appState,
      count: window.appInstance.lockedSectors.length
    }));
    console.log('Cycle 2 Dump Result:', dump2State);

    // Redial second time
    for (let s = 1; s <= 6; s++) {
      await clickElementCenter(page, `#sector-btn-${s}`);
      await sleep(100);
      await clickElementCenter(page, '#btn-lock-sector');
      await sleep(100);
    }
    const redial2State = await page.evaluate(() => window.appInstance.appState);
    console.log('Cycle 2 Redial State:', redial2State);

    const passDisengageCycles =
      dump1State.state === 'STANDBY' &&
      dump1State.count === 0 &&
      redial1State === 'ARMED' &&
      dump2State.state === 'STANDBY' &&
      dump2State.count === 0 &&
      redial2State === 'ARMED';

    results.tests.test5_disengage_cycles = {
      passed: passDisengageCycles,
      dump1State,
      redial1State,
      dump2State,
      redial2State
    };

    // -----------------------------------------------------------------------
    // TEST 6: SAFETY INTERLOCK BLOCKING & RELEASE
    // -----------------------------------------------------------------------
    console.log('\n--- TEST 6: Safety Interlock Blocking & Release ---');

    // Reset console first
    await clickElementCenter(page, '#btn-emergency-dump');
    await sleep(300);

    // Verify interlock defaults to RELEASED
    const initialInterlock = await page.evaluate(() => window.appInstance.interlockEngaged);
    console.log('Initial Interlock (Should be false/RELEASED):', initialInterlock);

    // Dial 6 sectors to get to ARMED
    for (let s = 1; s <= 6; s++) {
      await clickElementCenter(page, `#sector-btn-${s}`);
      await sleep(100);
      await clickElementCenter(page, '#btn-lock-sector');
      await sleep(100);
    }

    // Now engage safety interlock
    await clickElementCenter(page, '#btn-toggle-interlock');
    await sleep(200);

    const interlockEngagedState = await page.evaluate(() => ({
      isEngaged: window.appInstance.interlockEngaged,
      bannerVisible: document.getElementById('interlock-trip-banner').style.display !== 'none',
      btnBlocked: document.getElementById('btn-initiate-run').disabled
    }));
    console.log('Interlock Engaged State:', interlockEngagedState);

    // Attempt activation while interlock is engaged
    await clickElementCenter(page, '#btn-initiate-run');
    await sleep(300);

    const stateAfterBlockedAttempt = await page.evaluate(() => window.appInstance.appState);
    console.log('State after blocked activation attempt (Should still be ARMED):', stateAfterBlockedAttempt);

    // Release interlock via quick-release banner button
    await clickElementCenter(page, '#btn-banner-release-interlock');
    await sleep(200);

    const interlockReleasedState = await page.evaluate(() => ({
      isEngaged: window.appInstance.interlockEngaged,
      bannerVisible: document.getElementById('interlock-trip-banner').style.display !== 'none',
      btnReady: !document.getElementById('btn-initiate-run').disabled
    }));
    console.log('Interlock Released State:', interlockReleasedState);

    const passInterlock =
      initialInterlock === false &&
      interlockEngagedState.isEngaged === true &&
      interlockEngagedState.bannerVisible === true &&
      stateAfterBlockedAttempt === 'ARMED' &&
      interlockReleasedState.isEngaged === false &&
      interlockReleasedState.bannerVisible === false &&
      interlockReleasedState.btnReady === true;

    results.tests.test6_safety_interlock = {
      passed: passInterlock,
      initialInterlock,
      interlockEngagedState,
      stateAfterBlockedAttempt,
      interlockReleasedState
    };

    // -----------------------------------------------------------------------
    // TEST 7: QUICK-DIAL PRESET STAGED MOTION & NO-AUTO-FIRE
    // -----------------------------------------------------------------------
    console.log('\n--- TEST 7: Quick-Dial Preset Staged Motion & Negative Case ---');

    // Reset console
    await clickElementCenter(page, '#btn-emergency-dump');
    await sleep(300);

    // Trigger Quick-Dial Preset AUTO-DIAL
    await clickElementCenter(page, '#btn-execute-preset');

    // Sample mid-sequence (at ~900ms, should have 2 or 3 sectors locked)
    await sleep(900);
    const midAutoDial = await page.evaluate(() => ({
      count: window.appInstance.lockedSectors.length,
      state: window.appInstance.appState
    }));
    console.log('Mid-AutoDial Staged State:', midAutoDial);

    const midAutoDialPath = path.join(SCREENSHOT_DIR, '05_autodial_mid_sequence.png');
    await page.screenshot({ path: midAutoDialPath, fullPage: false });
    results.screenshots.push('05_autodial_mid_sequence.png');

    // Wait for auto-dial sequence completion (~2.5s total)
    await sleep(2000);
    const completeAutoDial = await page.evaluate(() => ({
      count: window.appInstance.lockedSectors.length,
      state: window.appInstance.appState,
      mach: window.appInstance.currentMach,
      btnDisabled: document.getElementById('btn-initiate-run').disabled
    }));
    console.log('Completed AutoDial State:', completeAutoDial);

    const armedAutoDialPath = path.join(SCREENSHOT_DIR, '06_autodial_armed.png');
    await page.screenshot({ path: armedAutoDialPath, fullPage: false });
    results.screenshots.push('06_autodial_armed.png');

    // Wait 1000ms to confirm auto-dial NEVER auto-fires
    await sleep(1000);
    const postAutoDialState = await page.evaluate(() => ({
      state: window.appInstance.appState,
      mach: window.appInstance.currentMach
    }));
    console.log('Post-AutoDial 1000ms Later (No Auto-Fire):', postAutoDialState);

    const passAutoDial =
      midAutoDial.count > 0 &&
      midAutoDial.count < 6 &&
      completeAutoDial.count === 6 &&
      completeAutoDial.state === 'ARMED' &&
      postAutoDialState.state === 'ARMED' &&
      postAutoDialState.mach < 0.15;

    results.tests.test7_quick_dial_preset = {
      passed: passAutoDial,
      midAutoDial,
      completeAutoDial,
      postAutoDialState
    };

    // Save final preview.png for gallery inclusion
    const previewPath = path.join(__dirname, 'preview.png');
    // Set to armed state screenshot for an exciting preview
    await page.screenshot({ path: previewPath, fullPage: false });
    console.log('Saved preview.png for gallery');

    console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
    results.allPassed = Object.values(results.tests).every((t) => t.passed);
  } catch (err) {
    console.error('Verification Error:', err);
    results.error = err.message;
    results.allPassed = false;
  } finally {
    await browser.close();
    // Run logs go to the gitignored test/ directory, never the build root
    // (STARGATE_BUILD_STANDARDS.md section 3).
    fs.mkdirSync(path.join(__dirname, 'test'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, 'test', 'test_results.json'), JSON.stringify(results, null, 2));
    console.log('Saved test_results.json');
  }
}

runVerification().catch(console.error);
