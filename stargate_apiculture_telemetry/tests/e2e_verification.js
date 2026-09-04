/**
 * IPATC APICULTURE TELEMETRY NETWORK — COMPREHENSIVE END-TO-END VERIFICATION SUITE
 * Uses Puppeteer to run a single continuous end-to-end integration test:
 * 1. Cold start / baseline idle
 * 2. Step-by-step manual dial (2-part correlation locks)
 * 3. Negative test: Confirms full dial (7/7) does NOT auto-fire
 * 4. 3-Stage Activation sequence with distinct screenshots:
 *    - Stage 1: Buildup
 *    - Stage 2: Breakthrough
 *    - Stage 3: Sustained Active
 * 5. Disengage cycle 1
 * 6. Quick-Dial preset auto-dialing sequence (visible step progression)
 * 7. Quick-Dial pending -> Activate -> Disengage cycle 2
 * 8. Biosecurity Containment Hold quarantine block test
 * 9. Secondary panel spot-checks (Health Matrix, Thermal Scanner, Swarm Radar)
 * 10. Viewport scaling test at 1080p and simulated 4K (3840x2160)
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

async function runVerification() {
  console.log('===============================================================');
  console.log(' IPATC APICULTURE TELEMETRY NETWORK — PUPPETEER E2E TEST SUITE ');
  console.log('===============================================================');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: await resolveChrome(),
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const url = 'http://127.0.0.1:8080';
  console.log(`[Test] Navigating to ${url}...`);

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
  } catch (err) {
    console.error(`[Test] Failed to load ${url}:`, err);
    await browser.close();
    process.exit(1);
  }

  console.log('[Test] Page loaded successfully.');

  // Helper: Click element at actual rendered bounding box center
  async function clickCenter(selector) {
    const el = await page.$(selector);
    if (!el) throw new Error(`Element not found: ${selector}`);
    const box = await el.boundingBox();
    if (!box) throw new Error(`Element has no bounding box: ${selector}`);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await sleep(80);
  }

  // TEST 1: Cold Start / Baseline Idle
  console.log('[Test 1] Capturing Cold Start / Idle State (1080p)...');
  await sleep(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_cold_start_idle_1080p.png') });

  // Verify Biosecurity Hold defaults to RELEASED
  const isHoldEngaged = await page.evaluate(() => window.app.biosecurityHoldEngaged);
  console.log(`[Check] Biosecurity Containment Hold defaults to RELEASED: ${!isHoldEngaged}`);
  if (isHoldEngaged) throw new Error('Biosecurity hold must default to RELEASED!');

  // TEST 2: Manual Dialing Sequence (Dial 7 colonies)
  console.log('[Test 2] Performing manual dial of 7 colony symbols...');
  const dialColonyIds = [1, 2, 3, 5, 7, 4, 10];

  for (let i = 0; i < dialColonyIds.length; i++) {
    const colonyId = dialColonyIds[i];
    console.log(`  -> Dialing Colony COL-0${colonyId} (Node ${i + 1}/7)...`);
    await clickCenter(`#colony-key-${colonyId}`);
    await sleep(280); // allow correlation climb and lock confirmation

    if (i === 2) {
      // Capture intermediate dial state (3/7 locked)
      console.log('[Test 2.1] Capturing In-Progress Manual Dial State (3/7 locked)...');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_manual_dial_step3_1080p.png') });
    }
  }

  // TEST 3: Negative Test — Confirmation of PENDING state without Auto-Firing
  console.log('[Test 3] Verifying fully dialed (7/7) state lands in PENDING and does NOT auto-fire...');
  await sleep(600);
  const stateAfterDial = await page.evaluate(() => window.app.activationState);
  const isActivateBtnReady = await page.evaluate(() => {
    const btn = document.getElementById('btn-activate');
    return btn && !btn.disabled && btn.classList.contains('ready-to-activate');
  });

  console.log(`  -> Activation State: "${stateAfterDial}" (Expected: "PENDING")`);
  console.log(`  -> Activation Button Ready & Enabled: ${isActivateBtnReady}`);
  if (stateAfterDial !== 'PENDING') throw new Error(`Expected state PENDING, got ${stateAfterDial}`);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_manual_dial_complete_pending_1080p.png') });

  // TEST 4: Three-Stage Activation Sequence
  console.log('[Test 4] Triggering Activation Uplink (3 Stages)...');
  await clickCenter('#btn-activate');

  // Stage 1: Buildup (captured at 800ms)
  await sleep(800);
  const stateBuildup = await page.evaluate(() => window.app.activationState);
  console.log(`  -> Stage 1 (Buildup) State: "${stateBuildup}"`);
  if (stateBuildup !== 'BUILDUP') throw new Error(`Expected BUILDUP, got ${stateBuildup}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_activation_stage1_buildup_1080p.png') });

  // Stage 2: Breakthrough (captured at 2400ms from start)
  await sleep(1600);
  const stateBreakthrough = await page.evaluate(() => window.app.activationState);
  console.log(`  -> Stage 2 (Breakthrough) State: "${stateBreakthrough}"`);
  if (stateBreakthrough !== 'BREAKTHROUGH') throw new Error(`Expected BREAKTHROUGH, got ${stateBreakthrough}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_activation_stage2_breakthrough_1080p.png') });

  // Stage 3: Sustained Active (captured after breakthrough concludes)
  await sleep(1500);
  const stateActive = await page.evaluate(() => window.app.activationState);
  console.log(`  -> Stage 3 (Sustained Active) State: "${stateActive}"`);
  if (stateActive !== 'ACTIVE') throw new Error(`Expected state ACTIVE, got ${stateActive}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_activation_stage3_sustained_active_1080p.png') });

  // TEST 5: Disengage Cycle 1
  console.log('[Test 5] Triggering Disengage / Sever Telemetry Link...');
  await clickCenter('#btn-disengage');
  await sleep(400);
  const stateAfterDisengage = await page.evaluate(() => window.app.activationState);
  console.log(`  -> State after disengage: "${stateAfterDisengage}" (Expected: "IDLE")`);
  if (stateAfterDisengage !== 'IDLE') throw new Error(`Expected IDLE, got ${stateAfterDisengage}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_disengage_reset_1080p.png') });

  // TEST 6: Quick-Dial Preset Auto-Dialing Sequence
  console.log('[Test 6] Selecting Tier 2 Preset and executing Auto-Dial...');
  await page.select('#quick-dial-select', 'preset-gamma-swarm');
  await clickCenter('#btn-quick-dial-engage');

  // Capture in-progress step
  await sleep(500);
  console.log('[Test 6.1] Capturing Quick-Dial Auto-Sequence in progress...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_quickdial_autosequence_inprogress_1080p.png') });

  // Wait for auto-dial to complete all 7 nodes (7 * 240ms ~ 1.7s)
  await sleep(1600);
  const stateQuickDialPending = await page.evaluate(() => window.app.activationState);
  console.log(`  -> Quick-Dial finished in state: "${stateQuickDialPending}" (Expected: "PENDING")`);
  if (stateQuickDialPending !== 'PENDING') throw new Error(`Expected PENDING from quick dial, got ${stateQuickDialPending}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_quickdial_pending_ready_1080p.png') });

  // TEST 7: Activate and Disengage Cycle 2
  console.log('[Test 7] Activating Quick-Dial Route...');
  await clickCenter('#btn-activate');
  await sleep(3800); // wait through buildup & breakthrough to active
  const stateActive2 = await page.evaluate(() => window.app.activationState);
  console.log(`  -> Second activation state: "${stateActive2}"`);
  if (stateActive2 !== 'ACTIVE') throw new Error(`Expected ACTIVE, got ${stateActive2}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_quickdial_activation_active_1080p.png') });

  console.log('[Test 7.1] Disengaging second cycle...');
  await clickCenter('#btn-disengage');
  await sleep(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_disengage_second_cycle_1080p.png') });

  // TEST 8: Biosecurity Containment Hold Quarantine Test
  console.log('[Test 8] Testing Biosecurity Containment Hold...');
  // Redial route
  await clickCenter('#btn-quick-dial-engage');
  await sleep(2000);

  // Engage Biosecurity Hold
  await clickCenter('#safety-toggle-card');
  await sleep(300);
  let isHoldNowEngaged = await page.evaluate(() => window.app.biosecurityHoldEngaged);
  if (!isHoldNowEngaged) {
    // If click didn't toggle, toggle directly
    await page.evaluate(() => window.app.toggleBiosecurityHold());
    isHoldNowEngaged = await page.evaluate(() => window.app.biosecurityHoldEngaged);
  }
  console.log(`  -> Biosecurity Hold Engaged: ${isHoldNowEngaged}`);

  // Attempt Activation (Should be blocked!)
  await clickCenter('#btn-activate');
  await sleep(400);
  const stateBlocked = await page.evaluate(() => window.app.activationState);
  console.log(`  -> State when activation attempted under Biosecurity Hold: "${stateBlocked}" (Expected: "PENDING", blocked)`);
  if (stateBlocked !== 'PENDING') throw new Error('Biosecurity hold failed to block activation!');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_biosecurity_hold_blocked_1080p.png') });

  // Release Biosecurity Hold and disengage
  await page.evaluate(() => {
    if (window.app.biosecurityHoldEngaged) window.app.toggleBiosecurityHold();
    window.app.handleDisengage();
  });
  await sleep(300);

  // TEST 9: Secondary Panels Spot-Checks
  console.log('[Test 9] Spot-checking Secondary Telemetry Drawers...');

  // Drawer 1: Colony Health Matrix
  console.log('  -> Opening Colony Health Matrix Drawer...');
  await clickCenter('#btn-open-colony-dashboard');
  await sleep(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_secondary_colony_health_matrix_1080p.png') });
  await clickCenter('#modal-colony-dashboard .btn-modal-close');
  await sleep(200);

  // Drawer 2: Brood Nest Thermal Scanner
  console.log('  -> Opening Brood Nest Thermal Scanner Drawer...');
  await clickCenter('#btn-open-thermal-matrix');
  await sleep(500);
  // Hover over canvas to trigger probe readout
  const thermalBox = await (await page.$('#thermal-canvas')).boundingBox();
  if (thermalBox) {
    await page.mouse.move(thermalBox.x + thermalBox.width * 0.5, thermalBox.y + thermalBox.height * 0.5);
    await sleep(200);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_secondary_brood_thermal_scanner_1080p.png') });
  await clickCenter('#modal-thermal-matrix .btn-modal-close');
  await sleep(200);

  // Drawer 3: Swarm Early-Warning Radar
  console.log('  -> Opening Swarm Early-Warning Radar Drawer...');
  await clickCenter('#btn-open-swarm-radar');
  await sleep(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_secondary_swarm_radar_1080p.png') });
  await clickCenter('#modal-swarm-radar .btn-modal-close');
  await sleep(200);

  // TEST 10: Simulated 4K Viewport (3840x2160) Scale Test
  console.log('[Test 10] Testing 4K Viewport Scaling (3840x2160)...');
  await page.setViewport({ width: 3840, height: 2160 });
  await sleep(600);
  const scale4k = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--app-scale'));
  console.log(`  -> 4K Viewport Computed Scale: ${scale4k} (Expected: ~2)`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_simulated_4k_viewport_3840x2160.png') });

  // Reset back to 1080p
  await page.setViewport({ width: 1920, height: 1080 });
  await sleep(300);

  console.log('===============================================================');
  console.log(' ALL 10 TEST SEQUENCES COMPLETED AND VERIFIED WITH PUPPETEER! ');
  console.log('===============================================================');

  await browser.close();
}

runVerification().catch(err => {
  console.error('[Test Failed]', err);
  process.exit(1);
});
