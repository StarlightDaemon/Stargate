/**
 * Comprehensive End-to-End Verification Suite for VXD-9000 Chrono-Celestial Console
 * Uses Puppeteer to test real user interactions, negative auto-fire, three-stage activation,
 * auto-dialing, disengage cycles, and 4K scaling.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runVerification() {
  console.log('=== STARTING VXD-9000 END-TO-END VERIFICATION ===');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const url = 'http://localhost:8092';
  console.log(`[E2E] Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle0' });

  // -------------------------------------------------------------------------
  // STEP 1: Cold Start & Safety Interlock Default Verification
  // -------------------------------------------------------------------------
  console.log('\n[STEP 1] Verifying Cold Start & Safety Interlock defaults...');
  
  const coldState = await page.evaluate(() => {
    const interlock = document.getElementById('interlock-switch');
    const statusPill = document.getElementById('system-status-pill').textContent;
    const ignitionDisabled = document.getElementById('btn-zenith-ignition').disabled;
    const bufferCount = document.getElementById('buffer-count').textContent;
    const scale = getComputedStyle(document.documentElement).getPropertyValue('--app-scale').trim();

    return {
      interlockChecked: interlock.checked,
      statusPill,
      ignitionDisabled,
      bufferCount,
      scale
    };
  });

  console.log('Cold Start State:', coldState);
  if (!coldState.interlockChecked) {
    throw new Error('FAILED: Safety Interlock MUST default to RELEASED (checked = true)!');
  }
  if (coldState.statusPill !== 'STANDBY // READY') {
    throw new Error(`FAILED: Initial status must be STANDBY // READY, got: ${coldState.statusPill}`);
  }
  if (!coldState.ignitionDisabled) {
    throw new Error('FAILED: Ignition button must be disabled on cold start!');
  }
  console.log('✔ Cold Start & Interlock default verified: RELEASED / ARMED.');

  // -------------------------------------------------------------------------
  // STEP 2: Manual Dial Sequence (5 Glyphs with Real Dispatched Pointer Clicks)
  // -------------------------------------------------------------------------
  console.log('\n[STEP 2] Performing Manual Dial of 5 Celestial Sectors...');
  const glyphsToDial = ['apx', 'crn', 'plh', 'lyr', 'cas'];

  for (let i = 0; i < glyphsToDial.length; i++) {
    const code = glyphsToDial[i];
    const selector = `#sector-node-${code}`;
    
    // Wait for element and click at rendered position
    await page.waitForSelector(selector, { visible: true });
    const el = await page.$(selector);
    const box = await el.boundingBox();
    console.log(`[E2E] Clicking Sector ${code.toUpperCase()} at (${box.x + box.width/2}, ${box.y + box.height/2})...`);
    
    await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
    await delay(300);

    const count = await page.evaluate(() => document.getElementById('buffer-count').textContent);
    console.log(`  -> Buffer Count: ${count}/5`);
  }

  // -------------------------------------------------------------------------
  // STEP 3: Negative Auto-Fire Verification
  // -------------------------------------------------------------------------
  console.log('\n[STEP 3] Performing NEGATIVE AUTO-FIRE test...');
  console.log('Waiting 1500ms to ensure completing the 5th lock NEVER auto-triggers activation...');
  await delay(1500);

  const pendingState = await page.evaluate(() => {
    const status = window.vxdApp.state;
    const ignitionDisabled = document.getElementById('btn-zenith-ignition').disabled;
    const statusPill = document.getElementById('system-status-pill').textContent;
    return { status, ignitionDisabled, statusPill };
  });

  console.log('Pending State Check:', pendingState);
  if (pendingState.status !== 'PENDING') {
    throw new Error(`FAILED: Expected state to remain PENDING after 5th lock, got: ${pendingState.status}`);
  }
  if (pendingState.ignitionDisabled !== false) {
    throw new Error('FAILED: Ignition button should now be ENABLED for operator action!');
  }
  console.log('✔ NEGATIVE AUTO-FIRE PASSED: System remains pending without auto-firing.');

  // -------------------------------------------------------------------------
  // STEP 4: Three-Stage Activation Test
  // -------------------------------------------------------------------------
  console.log('\n[STEP 4] Testing Three-Stage Activation Sequence...');
  
  // Click Ignition Button
  const btnIgnition = await page.$('#btn-zenith-ignition');
  const ignBox = await btnIgnition.boundingBox();
  console.log(`[E2E] Clicking Zenith Master Ignition at (${ignBox.x + ignBox.width/2}, ${ignBox.y + ignBox.height/2})...`);
  await page.mouse.click(ignBox.x + ignBox.width/2, ignBox.y + ignBox.height/2);

  // Stage 1: Buildup (~800ms in)
  await delay(800);
  const buildupState = await page.evaluate(() => ({
    state: window.vxdApp.state,
    flux: document.getElementById('tele-flux').textContent,
    stageText: document.getElementById('stage-status-text').textContent
  }));
  console.log('Stage 1 (Buildup):', buildupState);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_01_buildup.png') });
  console.log('  -> Saved test_01_buildup.png');

  // Stage 2: Breakthrough (at ~1850ms from start = right during 400ms breakthrough window)
  await delay(1050);
  const breakthroughState = await page.evaluate(() => ({
    state: window.vxdApp.state,
    flux: document.getElementById('tele-flux').textContent,
    stageText: document.getElementById('stage-status-text').textContent
  }));
  console.log('Stage 2 (Breakthrough):', breakthroughState);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_02_breakthrough.png') });
  console.log('  -> Saved test_02_breakthrough.png');

  // Stage 3: Sustained Active (~500ms later)
  await delay(500);
  const activeState = await page.evaluate(() => ({
    state: window.vxdApp.state,
    stars: document.getElementById('tele-stars').textContent,
    stageText: document.getElementById('stage-status-text').textContent
  }));
  console.log('Stage 3 (Sustained Active):', activeState);
  if (activeState.state !== 'ACTIVE') {
    throw new Error(`FAILED: Expected state to be ACTIVE, got: ${activeState.state}`);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_03_active.png') });
  console.log('  -> Saved test_03_active.png');
  console.log('✔ Three-Stage Activation completed and visibly captured.');

  // -------------------------------------------------------------------------
  // STEP 5: Disengage Verification
  // -------------------------------------------------------------------------
  console.log('\n[STEP 5] Testing Disengage / Emergency Abort...');
  const btnAbort = await page.$('#btn-dome-abort');
  const abortBox = await btnAbort.boundingBox();
  await page.mouse.click(abortBox.x + abortBox.width/2, abortBox.y + abortBox.height/2);
  await delay(400);

  const disengagedState = await page.evaluate(() => ({
    state: window.vxdApp.state,
    bufferCount: document.getElementById('buffer-count').textContent,
    statusPill: document.getElementById('system-status-pill').textContent
  }));
  console.log('Disengaged State:', disengagedState);
  if (disengagedState.state !== 'IDLE' || disengagedState.bufferCount !== '0') {
    throw new Error('FAILED: Disengage must reset state to IDLE and buffer to 0!');
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_04_disengaged.png') });
  console.log('  -> Saved test_04_disengaged.png');
  console.log('✔ Disengage successfully returned projector to IDLE.');

  // -------------------------------------------------------------------------
  // STEP 6: Quick-Dial Auto-Sequence Test (Tier 2 Preset: Galactic Core Sgr-A*)
  // -------------------------------------------------------------------------
  console.log('\n[STEP 6] Testing Quick-Dial Preset Auto-Slew...');
  // Find Preset 4 (Galactic Core Sgr-A*) and scroll it into view
  const presetBtn = await page.$('.btn-preset-slew[data-preset-id="4"]');
  await presetBtn.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await delay(200);

  const presetBox = await presetBtn.boundingBox();
  console.log(`[E2E] Clicking Auto-Slew for Tier 2 Preset (Galactic Core) at (${presetBox.x + presetBox.width/2}, ${presetBox.y + presetBox.height/2})...`);
  await page.mouse.click(presetBox.x + presetBox.width/2, presetBox.y + presetBox.height/2);

  // Observe sequential step ticks
  console.log('Observing real-time auto-dialing sequence across ~2.5 seconds...');
  for (let s = 1; s <= 6; s++) {
    await delay(450);
    const midCount = await page.evaluate(() => document.getElementById('buffer-count').textContent);
    console.log(`  -> Auto-Dial Slew Progress: ${midCount}/5 vectors`);
  }

  await delay(500);
  const autoDialEndState = await page.evaluate(() => ({
    state: window.vxdApp.state,
    bufferCount: document.getElementById('buffer-count').textContent,
    ignitionDisabled: document.getElementById('btn-zenith-ignition').disabled
  }));
  console.log('Auto-Dial Finished State:', autoDialEndState);
  if (autoDialEndState.state !== 'PENDING' || autoDialEndState.bufferCount !== '5') {
    throw new Error(`FAILED: Auto-dial must complete all 5 vectors and land in PENDING, got: ${autoDialEndState.state}`);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_05_autodial_pending.png') });
  console.log('  -> Saved test_05_autodial_pending.png');
  console.log('✔ Quick-Dial Auto-Sequence PASSED: sequenced visibly, landed in PENDING without auto-fire.');

  // -------------------------------------------------------------------------
  // STEP 7: Second Activation Cycle
  // -------------------------------------------------------------------------
  console.log('\n[STEP 7] Performing Second Activation Cycle...');
  await page.mouse.click(ignBox.x + ignBox.width/2, ignBox.y + ignBox.height/2);
  await delay(2500); // Through buildup + breakthrough to sustained active

  const secondActiveState = await page.evaluate(() => window.vxdApp.state);
  console.log('Second Activation State:', secondActiveState);
  if (secondActiveState !== 'ACTIVE') {
    throw new Error('FAILED: Second activation did not reach ACTIVE state!');
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_06_second_active.png') });
  console.log('  -> Saved test_06_second_active.png');

  // -------------------------------------------------------------------------
  // STEP 8: Second Disengage Cycle
  // -------------------------------------------------------------------------
  console.log('\n[STEP 8] Performing Second Disengage Cycle...');
  await page.mouse.click(abortBox.x + abortBox.width/2, abortBox.y + abortBox.height/2);
  await delay(400);

  const finalIdle = await page.evaluate(() => window.vxdApp.state);
  console.log('Final State:', finalIdle);
  if (finalIdle !== 'IDLE') {
    throw new Error('FAILED: Second disengage did not return to IDLE!');
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_07_final_idle.png') });
  console.log('  -> Saved test_07_final_idle.png');
  console.log('✔ Full dial-disengage-redial cycle tested twice with 100% success.');

  // -------------------------------------------------------------------------
  // STEP 9: 4K Resolution & CSS Scaling Verification
  // -------------------------------------------------------------------------
  console.log('\n[STEP 9] Testing 4K Ultra HD Viewport (3840x2160)...');
  await page.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 1 });
  await delay(300);

  const scale4k = await page.evaluate(() => {
    const scale = getComputedStyle(document.documentElement).getPropertyValue('--app-scale').trim();
    const w = window.innerWidth;
    const h = window.innerHeight;
    return { scale, w, h };
  });
  console.log('4K Scaling Metrics:', scale4k);
  if (parseFloat(scale4k.scale) < 1.99 || parseFloat(scale4k.scale) > 2.01) {
    throw new Error(`FAILED: Expected --app-scale to be 2.0 at 3840x2160, got: ${scale4k.scale}`);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_08_4k_scaled.png') });
  console.log('  -> Saved test_08_4k_scaled.png');
  console.log('✔ 4K Scaling validated at 3840x2160 with scale transform = 2.0.');

  // Reset to 1080p for Modal screenshot
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await delay(200);

  // -------------------------------------------------------------------------
  // STEP 10: Operator Reference Modal Verification
  // -------------------------------------------------------------------------
  console.log('\n[STEP 10] Testing Operator Technical Reference Modal (?)...');
  const btnHelp = await page.$('#btn-operator-reference');
  const helpBox = await btnHelp.boundingBox();
  await page.mouse.click(helpBox.x + helpBox.width/2, helpBox.y + helpBox.height/2);
  await delay(300);

  const modalVisible = await page.evaluate(() => !document.getElementById('operator-modal').classList.contains('hidden'));
  console.log('Modal Visible:', modalVisible);
  if (!modalVisible) {
    throw new Error('FAILED: Operator reference modal failed to open!');
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_09_reference_modal.png') });
  console.log('  -> Saved test_09_reference_modal.png');

  // Close modal
  const btnAck = await page.$('#btn-modal-ack');
  const ackBox = await btnAck.boundingBox();
  await page.mouse.click(ackBox.x + ackBox.width/2, ackBox.y + ackBox.height/2);
  await delay(200);

  await browser.close();
  console.log('\n=== ALL VERIFICATION CHECKS PASSED SUCCESSFULLY ===');
}

runVerification().catch(err => {
  console.error('\n❌ VERIFICATION ERROR:', err);
  process.exit(1);
});
