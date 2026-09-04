/**
 * KONSTRUKT TRANSIT BUREAU
 * Automated End-to-End Test Suite (Puppeteer)
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

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

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  const browserPath = await resolveChrome();
  console.log(`[TEST] Using browser: ${browserPath}`);

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const url = 'http://127.0.0.1:8088/index.html';
  console.log(`[TEST] Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle0' });

  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // --------------------------------------------------------------------------
  // TEST 1: Viewport Scaling (1080p & 4K) & Cold Start State
  // --------------------------------------------------------------------------
  console.log('[TEST 1] Verifying Viewport Scaling & Cold Start...');
  let scaleFactor = await page.evaluate(() => {
    return getComputedStyle(document.documentElement).getPropertyValue('--scale-factor').trim();
  });
  console.log(`  -> 1080p viewport --scale-factor: ${scaleFactor}`);

  let appState = await page.evaluate(() => {
    const el = document.getElementById('app-canvas');
    return el.className;
  });
  console.log(`  -> Initial app state: ${appState}`);
  if (appState !== 'state-idle') throw new Error(`Expected state-idle, got ${appState}`);

  let isEngageDisabled = await page.evaluate(() => {
    return document.getElementById('btn-engage-vector').disabled;
  });
  console.log(`  -> Engage button initially disabled: ${isEngageDisabled}`);
  if (!isEngageDisabled) throw new Error('Engage button should be disabled initially');

  let interlockState = await page.evaluate(() => {
    const btn = document.getElementById('btn-toggle-interlock');
    return {
      className: btn.className,
      ariaChecked: btn.getAttribute('aria-checked'),
      label: document.getElementById('interlock-toggle-label').textContent.trim()
    };
  });
  console.log(`  -> Interlock default state:`, interlockState);
  if (!interlockState.className.includes('released') || interlockState.ariaChecked !== 'false') {
    throw new Error('Interlock must default to RELEASED!');
  }

  await page.screenshot({ path: path.join(screenshotsDir, '01_cold_start_1080p.png') });

  // 4K Viewport test
  await page.setViewport({ width: 3840, height: 2160 });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await sleep(100);
  let scale4k = await page.evaluate(() => {
    return getComputedStyle(document.documentElement).getPropertyValue('--scale-factor').trim();
  });
  console.log(`  -> 4K viewport --scale-factor: ${scale4k}`);
  await page.screenshot({ path: path.join(screenshotsDir, '01_cold_start_4k.png') });

  // Restore 1080p
  await page.setViewport({ width: 1920, height: 1080 });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await sleep(100);

  // --------------------------------------------------------------------------
  // TEST 2: Manual Dial Sequence (6 Glyphs)
  // --------------------------------------------------------------------------
  console.log('[TEST 2] Manual Dialing 6 Glyphs via matrix buttons...');
  const dialSequence = ['V-01', 'V-03', 'V-05', 'V-02', 'V-07', 'V-04'];

  for (let i = 0; i < dialSequence.length; i++) {
    const gid = dialSequence[i];
    const btnSelector = `#btn-glyph-${gid}`;
    await page.waitForSelector(btnSelector);
    await page.click(btnSelector);
    await sleep(250); // allow squeegee swipe animation

    const count = await page.evaluate(() => {
      return document.getElementById('reg-count-current').textContent;
    });
    console.log(`  -> Entered glyph ${i + 1}/6 (${gid}), current count: ${count}`);
  }

  const postDialState = await page.evaluate(() => {
    return {
      appState: document.getElementById('app-canvas').className,
      engageDisabled: document.getElementById('btn-engage-vector').disabled,
      statusPill: document.getElementById('cluster2-status-pill').textContent.trim()
    };
  });
  console.log(`  -> Post-dial state:`, postDialState);
  if (postDialState.appState !== 'state-pending') throw new Error(`Expected state-pending, got ${postDialState.appState}`);
  if (postDialState.engageDisabled) throw new Error('Engage button should be enabled in state-pending!');

  await page.screenshot({ path: path.join(screenshotsDir, '02_manual_dial_pending.png') });

  // --------------------------------------------------------------------------
  // TEST 3: Negative Auto-Fire Verification
  // --------------------------------------------------------------------------
  console.log('[TEST 3] Testing Negative Auto-Fire (waiting in PENDING state)...');
  await sleep(1500);

  const autoFireCheck = await page.evaluate(() => {
    return {
      appState: document.getElementById('app-canvas').className,
      engageDisabled: document.getElementById('btn-engage-vector').disabled
    };
  });
  console.log(`  -> State after 1.5s idle wait:`, autoFireCheck);
  if (autoFireCheck.appState !== 'state-pending') {
    throw new Error(`CRITICAL FAILURE: Auto-fired without manual activation! State is ${autoFireCheck.appState}`);
  }
  console.log('  -> PASS: System remained in PENDING state without auto-firing.');

  // --------------------------------------------------------------------------
  // TEST 4: Safety Interlock Blocked Test
  // --------------------------------------------------------------------------
  console.log('[TEST 4] Testing Safety Interlock Detent Blocking...');
  await page.click('#btn-toggle-interlock');
  await sleep(150);

  const interlockEngaged = await page.evaluate(() => {
    return document.getElementById('btn-toggle-interlock').className;
  });
  console.log(`  -> Interlock class after toggle: ${interlockEngaged}`);
  if (!interlockEngaged.includes('engaged')) throw new Error('Interlock failed to engage');

  // Attempt to activate with interlock engaged
  console.log('  -> Attempting activation with interlock engaged...');
  await page.click('#btn-engage-vector');
  await sleep(200);

  const hazardCheck = await page.evaluate(() => {
    const overlay = document.getElementById('hazard-warning-overlay');
    return {
      hasVisibleClass: overlay.classList.contains('visible'),
      appState: document.getElementById('app-canvas').className
    };
  });
  console.log(`  -> Hazard check result:`, hazardCheck);
  if (!hazardCheck.hasVisibleClass) throw new Error('Hazard overlay was not displayed upon blocked activation!');
  if (hazardCheck.appState !== 'state-pending') throw new Error('State should remain state-pending');

  await page.screenshot({ path: path.join(screenshotsDir, '03_interlock_hazard_blocked.png') });

  // Dismiss hazard and release interlock
  await page.click('#btn-dismiss-hazard');
  await sleep(150);
  await page.click('#btn-toggle-interlock'); // release
  await sleep(150);
  console.log('  -> Safety interlock released back to normal operation.');

  // --------------------------------------------------------------------------
  // TEST 5: Three-Stage Activation (Buildup -> Breakthrough -> Sustained Active)
  // --------------------------------------------------------------------------
  console.log('[TEST 5] Testing Three-Stage Staged Activation...');
  await page.click('#btn-engage-vector');

  // Stage 1: Buildup (~1.8s)
  await sleep(300);
  let stage1 = await page.evaluate(() => document.getElementById('app-canvas').className);
  console.log(`  -> Stage 1 state (at 300ms): ${stage1}`);
  if (stage1 !== 'state-buildup') throw new Error(`Expected state-buildup, got ${stage1}`);
  await page.screenshot({ path: path.join(screenshotsDir, '04_stage1_buildup.png') });

  // Stage 2: Breakthrough (~0.6s after 1800ms)
  await sleep(1600); // 300 + 1600 = 1900ms
  let stage2 = await page.evaluate(() => document.getElementById('app-canvas').className);
  console.log(`  -> Stage 2 state (at 1900ms): ${stage2}`);
  if (stage2 !== 'state-breakthrough') throw new Error(`Expected state-breakthrough, got ${stage2}`);
  await page.screenshot({ path: path.join(screenshotsDir, '05_stage2_breakthrough.png') });

  // Stage 3: Sustained Active
  await sleep(700); // 1900 + 700 = 2600ms
  let stage3 = await page.evaluate(() => document.getElementById('app-canvas').className);
  console.log(`  -> Stage 3 state (at 2600ms): ${stage3}`);
  if (stage3 !== 'state-active') throw new Error(`Expected state-active, got ${stage3}`);
  await page.screenshot({ path: path.join(screenshotsDir, '06_stage3_sustained_active.png') });

  // --------------------------------------------------------------------------
  // TEST 6: Disengage & Reset (Cycle 1 Complete)
  // --------------------------------------------------------------------------
  console.log('[TEST 6] Testing Disengage & Reset (Cycle 1)...');
  await page.click('#btn-disengage-vector');
  await sleep(550);

  const resetState = await page.evaluate(() => {
    return {
      appState: document.getElementById('app-canvas').className,
      regCount: document.getElementById('reg-count-current').textContent,
      statusText: document.getElementById('aperture-status-text').textContent
    };
  });
  console.log(`  -> Post-disengage reset state:`, resetState);
  if (resetState.appState !== 'state-idle') throw new Error(`Expected state-idle, got ${resetState.appState}`);
  if (resetState.regCount !== '0') throw new Error(`Expected 0 locked glyphs, got ${resetState.regCount}`);
  await page.screenshot({ path: path.join(screenshotsDir, '07_disengaged_reset.png') });

  // --------------------------------------------------------------------------
  // TEST 7: Quick-Dial Auto-Sequence & Second Activation/Disengage Cycle
  // --------------------------------------------------------------------------
  console.log('[TEST 7] Testing Quick-Dial Preset Auto-Sequence (Tier 2: AERODROME-VECTOR)...');
  await page.click('#btn-preset-P-04');

  // Capture in-flight sequence screenshot
  await sleep(700);
  const inFlightCount = await page.evaluate(() => document.getElementById('reg-count-current').textContent);
  console.log(`  -> In-flight auto-dialing count at 700ms: ${inFlightCount}/6`);
  await page.screenshot({ path: path.join(screenshotsDir, '08_quick_dial_sequencing.png') });

  // Wait for auto-dial to complete
  await sleep(1500);
  const quickDialCompleted = await page.evaluate(() => {
    return {
      appState: document.getElementById('app-canvas').className,
      regCount: document.getElementById('reg-count-current').textContent,
      engageDisabled: document.getElementById('btn-engage-vector').disabled
    };
  });
  console.log(`  -> Quick-dial completed state:`, quickDialCompleted);
  if (quickDialCompleted.appState !== 'state-pending') throw new Error(`Expected state-pending, got ${quickDialCompleted.appState}`);
  if (quickDialCompleted.regCount !== '6') throw new Error(`Expected 6 glyphs locked, got ${quickDialCompleted.regCount}`);
  if (quickDialCompleted.engageDisabled) throw new Error('Engage button should be enabled!');

  await page.screenshot({ path: path.join(screenshotsDir, '09_quick_dial_pending.png') });

  // Cycle 2: Activate via preset
  console.log('  -> Activating gateway for Cycle 2...');
  await page.click('#btn-engage-vector');
  await sleep(2600); // Wait through buildup + breakthrough to active

  const cycle2Active = await page.evaluate(() => document.getElementById('app-canvas').className);
  console.log(`  -> Cycle 2 active state: ${cycle2Active}`);
  if (cycle2Active !== 'state-active') throw new Error(`Expected state-active in Cycle 2, got ${cycle2Active}`);
  await page.screenshot({ path: path.join(screenshotsDir, '10_cycle2_active.png') });

  // Cycle 2: Disengage
  console.log('  -> Disengaging gateway for Cycle 2...');
  await page.click('#btn-disengage-vector');
  await sleep(550);

  const cycle2Disengaged = await page.evaluate(() => document.getElementById('app-canvas').className);
  console.log(`  -> Cycle 2 reset state: ${cycle2Disengaged}`);
  if (cycle2Disengaged !== 'state-idle') throw new Error(`Expected state-idle after Cycle 2 disengage, got ${cycle2Disengaged}`);
  await page.screenshot({ path: path.join(screenshotsDir, '11_cycle2_disengaged.png') });

  // --------------------------------------------------------------------------
  // TEST 8: Operator Reference Modal
  // --------------------------------------------------------------------------
  console.log('[TEST 8] Testing Operator Reference Manual Modal...');
  await page.click('#btn-operator-help');
  await sleep(200);

  const modalOpen = await page.evaluate(() => {
    return document.getElementById('operator-modal').classList.contains('visible');
  });
  console.log(`  -> Modal visible: ${modalOpen}`);
  if (!modalOpen) throw new Error('Operator modal did not open');
  await page.screenshot({ path: path.join(screenshotsDir, '12_operator_manual_modal.png') });

  await page.click('#btn-modal-got-it');
  await sleep(200);

  const modalClosed = await page.evaluate(() => {
    return document.getElementById('operator-modal').classList.contains('visible');
  });
  console.log(`  -> Modal closed: ${!modalClosed}`);
  if (modalClosed) throw new Error('Operator modal failed to close');

  console.log('------------------------------------------------------------');
  console.log('ALL PUPPETEER VERIFICATION TESTS PASSED PERFECTLY!');
  console.log('------------------------------------------------------------');

  await browser.close();
}

runTests().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
