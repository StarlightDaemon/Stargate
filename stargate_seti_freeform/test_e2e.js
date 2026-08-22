import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('test_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runE2ETests() {
  console.log('====================================================');
  console.log('STARTING E2E TEST SUITE FOR VDATC TECHNOSIGNATURE CONSOLE');
  console.log('====================================================');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  // Listen to browser console messages
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));

  const targetUrl = 'http://localhost:5173/';
  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 15000 });

  // 1. Check Viewport Scaling at 1080p
  const scale1080 = await page.evaluate(() => {
    return {
      scale: window.__APP_SCALE__,
      viewport: window.__VIEWPORT__,
      computedTransform: window.getComputedStyle(document.getElementById('app-scaler')).transform,
      state: document.getElementById('appRoot').dataset.state,
      holdChecked: document.getElementById('verificationHoldToggle').checked
    };
  });

  console.log('\n[TEST 1] Cold Start Verification (1080p):', scale1080);
  if (scale1080.holdChecked !== false) {
    throw new Error('FAIL: Post-Detection Verification Hold MUST default to released (false)!');
  }
  if (scale1080.state !== 'IDLE') {
    throw new Error(`FAIL: Initial state must be IDLE, got ${scale1080.state}`);
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_cold_start_1080p.png') });
  console.log('Saved screenshot: 01_cold_start_1080p.png');

  // Check 4K Scaling
  await page.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 1 });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await new Promise(r => setTimeout(r, 200));

  const scale4K = await page.evaluate(() => {
    return {
      scale: window.__APP_SCALE__,
      viewport: window.__VIEWPORT__,
      computedTransform: window.getComputedStyle(document.getElementById('app-scaler')).transform
    };
  });
  console.log('[TEST 1b] 4K Viewport Scaling Check:', scale4K);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_cold_start_4k.png') });
  console.log('Saved screenshot: 01_cold_start_4k.png');

  // Reset back to 1080p for standard run
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await new Promise(r => setTimeout(r, 200));

  // 2. Operator Reference Modal Test
  console.log('\n[TEST 2] Testing Operator Reference Modal...');
  const helpBtn = await page.$('#helpBtn');
  const helpBox = await helpBtn.boundingBox();
  await page.mouse.click(helpBox.x + helpBox.width / 2, helpBox.y + helpBox.height / 2);
  await new Promise(r => setTimeout(r, 300));

  const modalOpen = await page.evaluate(() => document.getElementById('helpModal').classList.contains('open'));
  console.log('Modal open state:', modalOpen);
  if (!modalOpen) throw new Error('FAIL: Help modal failed to open on click!');

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_operator_manual_modal.png') });
  console.log('Saved screenshot: 02_operator_manual_modal.png');

  // Close modal via close button
  const closeHelpBtn = await page.$('#closeHelpBtn');
  const closeBox = await closeHelpBtn.boundingBox();
  await page.mouse.click(closeBox.x + closeBox.width / 2, closeBox.y + closeBox.height / 2);
  await new Promise(r => setTimeout(r, 200));

  // 3. Manual Candidate Dialing (7 Candidates)
  console.log('\n[TEST 3] Manual Candidate Dialing with Coincidence-Lock...');
  const candidateIdsToDial = [1, 2, 3, 4, 5, 6, 7];

  for (let i = 0; i < candidateIdsToDial.length; i++) {
    const candId = candidateIdsToDial[i];
    const btn = await page.$(`#candidate-btn-${candId}`);
    const box = await btn.boundingBox();
    
    // Dispatch real pointer click
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    // Wait for coincidence check animation (10 dishes x 28ms + buffer)
    await new Promise(r => setTimeout(r, 350));

    const currentLen = await page.evaluate(() => window.__APP__.currentAddress.length);
    console.log(`Dialed candidate ${candId} -> Address Length: ${currentLen}/7`);

    if (i === 2) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_partial_dial_3_of_7.png') });
      console.log('Saved screenshot: 03_partial_dial_3_of_7.png');
    }
  }

  // Confirm state after 7 candidates dialed
  const dialCompleteState = await page.evaluate(() => {
    return {
      state: window.__APP__.systemState,
      address: window.__APP__.currentAddress,
      activateDisabled: document.getElementById('activateBtn').disabled,
      activateClass: document.getElementById('activateBtn').className
    };
  });

  console.log('Dial Complete State:', dialCompleteState);
  if (dialCompleteState.state !== 'READY') {
    throw new Error(`FAIL: Expected state READY after 7 candidates, got ${dialCompleteState.state}`);
  }
  if (dialCompleteState.activateDisabled !== false) {
    throw new Error('FAIL: Activate button should be enabled in READY state!');
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_candidate_dial_complete_ready_state.png') });
  console.log('Saved screenshot: 04_candidate_dial_complete_ready_state.png');

  // 4. Negative Auto-Fire Test
  console.log('\n[TEST 4] Negative Auto-Fire Verification...');
  console.log('Waiting 1.5 seconds to confirm system remains in READY state without auto-firing...');
  await new Promise(r => setTimeout(r, 1500));

  const afterWaitState = await page.evaluate(() => window.__APP__.systemState);
  console.log('State after 1.5s idle wait:', afterWaitState);
  if (afterWaitState !== 'READY') {
    throw new Error(`FAIL: System auto-fired! Expected READY, got ${afterWaitState}`);
  }
  console.log('PASS: Negative Auto-Fire test confirmed. System remains strictly pending.');

  // 5. Safety Interlock (Post-Detection Verification Hold) Blocking Test
  console.log('\n[TEST 5] Safety Interlock Verification Hold Blocking Test...');
  
  // Toggle the Verification Hold switch to ON
  const holdToggle = await page.$('#verificationHoldToggle');
  await holdToggle.evaluate(el => {
    el.checked = true;
    el.dispatchEvent(new Event('change'));
  });
  await new Promise(r => setTimeout(r, 200));

  const holdEngaged = await page.evaluate(() => window.__APP__.verificationHoldEngaged);
  console.log('Hold Engaged Status:', holdEngaged);

  // Attempt Activation while Hold is active
  const actBtn = await page.$('#activateBtn');
  const actBox = await actBtn.boundingBox();
  await page.mouse.click(actBox.x + actBox.width / 2, actBox.y + actBox.height / 2);
  await new Promise(r => setTimeout(r, 300));

  const stateDuringHoldBlock = await page.evaluate(() => {
    return {
      state: window.__APP__.systemState,
      bannerActive: document.getElementById('holdWarningBanner').classList.contains('active')
    };
  });
  console.log('State during hold blocking attempt:', stateDuringHoldBlock);
  if (stateDuringHoldBlock.state !== 'READY') {
    throw new Error(`FAIL: Activation occurred despite Verification Hold! State: ${stateDuringHoldBlock.state}`);
  }
  if (!stateDuringHoldBlock.bannerActive) {
    throw new Error('FAIL: Warning banner did not activate when blocked by Hold!');
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_verification_hold_blocking_alert.png') });
  console.log('Saved screenshot: 05_verification_hold_blocking_alert.png');

  // Release the Hold switch
  await holdToggle.evaluate(el => {
    el.checked = false;
    el.dispatchEvent(new Event('change'));
  });
  await new Promise(r => setTimeout(r, 200));

  // 6. Three-Stage Activation Sequence
  console.log('\n[TEST 6] Executing Three-Stage Activation Sequence...');
  // Click Activate button
  await page.mouse.click(actBox.x + actBox.width / 2, actBox.y + actBox.height / 2);

  // Stage 1: Buildup (capture at ~1.2s)
  await new Promise(r => setTimeout(r, 1200));
  const stage1State = await page.evaluate(() => {
    return {
      state: window.__APP__.systemState,
      snr: window.__APP__.snrValue,
      badge: document.getElementById('systemStatusBadge').innerText
    };
  });
  console.log('Stage 1 (Buildup) State:', stage1State);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_activation_stage1_buildup.png') });
  console.log('Saved screenshot: 06_activation_stage1_buildup.png');

  // Stage 2: Breakthrough (capture right at transition t = 2.62s, so +1420ms after stage 1)
  await new Promise(r => setTimeout(r, 1420));
  const stage2State = await page.evaluate(() => {
    return {
      state: window.__APP__.systemState,
      flashOpacity: window.__APP__.spectrogram.flashOpacity
    };
  });
  console.log('Stage 2 (Breakthrough) State:', stage2State);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_activation_stage2_breakthrough.png') });
  console.log('Saved screenshot: 07_activation_stage2_breakthrough.png');

  // Stage 3: Sustained Active State (+1000ms after breakthrough)
  await new Promise(r => setTimeout(r, 1000));
  const stage3State = await page.evaluate(() => {
    return {
      state: window.__APP__.systemState,
      snr: window.__APP__.snrValue,
      coincidence: window.__APP__.coincidenceScore,
      badge: document.getElementById('systemStatusBadge').innerText
    };
  });
  console.log('Stage 3 (Sustained Active) State:', stage3State);
  if (stage3State.state !== 'ACTIVE') {
    throw new Error(`FAIL: Expected sustained state ACTIVE, got ${stage3State.state}`);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_activation_stage3_sustained_active.png') });
  console.log('Saved screenshot: 08_activation_stage3_sustained_active.png');

  // 7. Disengage / Reset (Cycle 1)
  console.log('\n[TEST 7] Disengaging Link (Cycle 1)...');
  const disengageBtn = await page.$('#disengageBtn');
  const disBox = await disengageBtn.boundingBox();
  await page.mouse.click(disBox.x + disBox.width / 2, disBox.y + disBox.height / 2);
  await new Promise(r => setTimeout(r, 300));

  const resetState = await page.evaluate(() => {
    return {
      state: window.__APP__.systemState,
      addressLen: window.__APP__.currentAddress.length,
      snr: window.__APP__.snrValue
    };
  });
  console.log('Post-Disengage State:', resetState);
  if (resetState.state !== 'IDLE' || resetState.addressLen !== 0) {
    throw new Error('FAIL: Disengage did not reset system to IDLE with 0 locked channels!');
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_disengage_full_reset.png') });
  console.log('Saved screenshot: 09_disengage_full_reset.png');

  // 8. Quick-Dial Preset Auto-Dialing Test
  console.log('\n[TEST 8] Quick-Dial Preset Auto-Dialing Test...');
  const presetBtn = await page.$('.preset-load-btn[data-id="pc-b04"]');
  const pBox = await presetBtn.boundingBox();
  await page.mouse.click(pBox.x + pBox.width / 2, pBox.y + pBox.height / 2);

  // Capture midway through auto-dialing (~1.2s in, ~3-4 channels locked)
  await new Promise(r => setTimeout(r, 1200));
  const autoDialMidState = await page.evaluate(() => {
    return {
      isAutoDialing: window.__APP__.isAutoDialing,
      addressLen: window.__APP__.currentAddress.length,
      state: window.__APP__.systemState
    };
  });
  console.log('Mid-AutoDial State:', autoDialMidState);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_quickdial_autodial_in_progress.png') });
  console.log('Saved screenshot: 10_quickdial_autodial_in_progress.png');

  // Wait for auto-dial to complete (7 x 380ms + buffer = ~3000ms total)
  await new Promise(r => setTimeout(r, 2200));
  const autoDialCompleteState = await page.evaluate(() => {
    return {
      isAutoDialing: window.__APP__.isAutoDialing,
      addressLen: window.__APP__.currentAddress.length,
      state: window.__APP__.systemState
    };
  });
  console.log('AutoDial Complete State:', autoDialCompleteState);
  if (autoDialCompleteState.addressLen !== 7 || autoDialCompleteState.state !== 'READY') {
    throw new Error(`FAIL: Quick dial failed to complete 7 channels and land in READY! Got: ${JSON.stringify(autoDialCompleteState)}`);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_quickdial_ready_state.png') });
  console.log('Saved screenshot: 11_quickdial_ready_state.png');

  // 9. Second Activation & Disengage (Cycle 2)
  console.log('\n[TEST 9] Second Activation & Disengage Cycle (Cycle 2)...');
  const actBtn2 = await page.$('#activateBtn');
  const actBox2 = await actBtn2.boundingBox();
  await page.mouse.click(actBox2.x + actBox2.width / 2, actBox2.y + actBox2.height / 2);
  
  // Wait through buildup & breakthrough to active
  await new Promise(r => setTimeout(r, 3400));
  const cycle2ActiveState = await page.evaluate(() => window.__APP__.systemState);
  console.log('Cycle 2 Active State:', cycle2ActiveState);
  if (cycle2ActiveState !== 'ACTIVE') {
    throw new Error(`FAIL: Cycle 2 activation failed to reach ACTIVE, got ${cycle2ActiveState}`);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_second_activation_active.png') });
  console.log('Saved screenshot: 12_second_activation_active.png');

  // Disengage Cycle 2
  const disBtn2 = await page.$('#disengageBtn');
  const disBox2 = await disBtn2.boundingBox();
  await page.mouse.click(disBox2.x + disBox2.width / 2, disBox2.y + disBox2.height / 2);
  await new Promise(r => setTimeout(r, 300));

  const cycle2ResetState = await page.evaluate(() => ({
    state: window.__APP__.systemState,
    addressLen: window.__APP__.currentAddress.length
  }));
  console.log('Cycle 2 Post-Disengage Reset:', cycle2ResetState);
  if (cycle2ResetState.state !== 'IDLE' || cycle2ResetState.addressLen !== 0) {
    throw new Error('FAIL: Cycle 2 disengage failed to fully reset!');
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_second_disengage_reset.png') });
  console.log('Saved screenshot: 13_second_disengage_reset.png');

  // 10. Corner Elements Verification
  console.log('\n[TEST 10] Verifying Corner Elements...');
  const cornerData = await page.evaluate(() => {
    const link = document.querySelector('.starlight-link');
    const version = document.querySelector('.version-label');
    return {
      linkHref: link?.href,
      linkTarget: link?.target,
      linkRel: link?.rel,
      linkText: link?.innerText,
      versionText: version?.innerText
    };
  });
  console.log('Corner Displays:', cornerData);
  if (cornerData.linkHref !== 'https://github.com/StarlightDaemon' || cornerData.linkTarget !== '_blank' || cornerData.linkRel !== 'noopener noreferrer') {
    throw new Error('FAIL: Corner link attributes invalid!');
  }
  if (cornerData.versionText !== 'v1.0.0') {
    throw new Error('FAIL: Version label must be v1.0.0!');
  }

  console.log('\n====================================================');
  console.log('ALL E2E TESTS COMPLETED WITH 100% SUCCESS!');
  console.log('====================================================');

  await browser.close();
}

runE2ETests().catch(err => {
  console.error('TEST RUNNER FAILED:', err);
  process.exit(1);
});
