/**
 * verify.js - Complete End-to-End Puppeteer Automation & Verification Suite
 * Cascadia Lithospheric Seismo-Acoustic Array (CLSA-9)
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Find Browser Executable
function getBrowserPath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No compatible browser executable (Chrome/Edge) found.');
}

// Helper to wait
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runVerification() {
  console.log('====================================================');
  console.log('CLSA-9 SEISMIC TRIANGULATION VERIFICATION SUITE');
  console.log('====================================================');

  const browserPath = getBrowserPath();
  console.log(`[Browser] Using: ${browserPath}`);

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const targetUrl = 'http://127.0.0.1:8090/index.html';
  console.log(`[Navigation] Opening: ${targetUrl}`);
  await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 15000 });
  await sleep(600);

  const results = {
    tests: [],
    screenshots: []
  };

  function logTest(name, passed, details = '') {
    console.log(`[TEST] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} ${details ? '(' + details + ')' : ''}`);
    results.tests.push({ name, passed, details });
    if (!passed) throw new Error(`Test failed: ${name}`);
  }

  // ============================================================
  // STEP 1: Cold Start & Viewport Verification
  // ============================================================
  console.log('\n--- Step 1: Cold Start & Viewport Check ---');
  const initialData = await page.evaluate(() => {
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      computedScale: window.__computedScale,
      lockedCount: window.controlSystem.lockedStations.length,
      state: window.controlSystem.state,
      interlockEngaged: window.controlSystem.interlockEngaged
    };
  });

  logTest('Viewport Dimensions (1920x1080)', initialData.viewportWidth === 1920 && initialData.viewportHeight === 1080, `${initialData.viewportWidth}x${initialData.viewportHeight}`);
  logTest('Computed Scale Factor (~1.0)', Math.abs(initialData.computedScale - 1.0) < 0.05, `scale=${initialData.computedScale}`);
  logTest('Initial State IDLE', initialData.state === 'IDLE', `state=${initialData.state}`);
  logTest('Initial Locked Count 0', initialData.lockedCount === 0);
  logTest('Safety Interlock Defaults to RELEASED', initialData.interlockEngaged === false);

  const ss01 = path.join(SCREENSHOT_DIR, '01_cold_start.png');
  await page.screenshot({ path: ss01 });
  results.screenshots.push('01_cold_start.png');
  console.log(`[Screenshot] Saved 01_cold_start.png`);

  // ============================================================
  // STEP 2: Manual Dialing & Negative Auto-Fire Guarantee
  // ============================================================
  console.log('\n--- Step 2: Manual Dialing (7 Stations) ---');
  
  // Click first 4 stations via real element dispatch
  for (let i = 0; i < 4; i++) {
    const tileSelector = `#station-tile-${i}`;
    await page.waitForSelector(tileSelector);
    await page.click(tileSelector);
    await sleep(150);
  }

  const partialData = await page.evaluate(() => ({
    lockedCount: window.controlSystem.lockedStations.length,
    state: window.controlSystem.state
  }));
  logTest('Partial Dialing (4 stations locked)', partialData.lockedCount === 4 && partialData.state === 'LOCKING');

  const ss02 = path.join(SCREENSHOT_DIR, '02_manual_dial_partial.png');
  await page.screenshot({ path: ss02 });
  results.screenshots.push('02_manual_dial_partial.png');
  console.log(`[Screenshot] Saved 02_manual_dial_partial.png`);

  // Click 3 more stations (total 7 locked -> reaching requirement)
  for (let i = 4; i < 7; i++) {
    const tileSelector = `#station-tile-${i}`;
    await page.click(tileSelector);
    await sleep(150);
  }

  const pendingData = await page.evaluate(() => ({
    lockedCount: window.controlSystem.lockedStations.length,
    state: window.controlSystem.state,
    armedClass: document.getElementById('establish-link-btn').classList.contains('armed')
  }));
  logTest('Full 7 Stations Locked', pendingData.lockedCount === 7);
  logTest('State Transition to PENDING', pendingData.state === 'PENDING');
  logTest('Activation Button ARMED', pendingData.armedClass === true);

  const ss03 = path.join(SCREENSHOT_DIR, '03_manual_dial_pending.png');
  await page.screenshot({ path: ss03 });
  results.screenshots.push('03_manual_dial_pending.png');
  console.log(`[Screenshot] Saved 03_manual_dial_pending.png`);

  // Negative Auto-Fire Test: Wait 1500ms and confirm state is STILL PENDING
  console.log('[Negative Test] Waiting 1500ms to verify system does NOT auto-fire...');
  await sleep(1500);
  const stillPendingState = await page.evaluate(() => window.controlSystem.state);
  logTest('Negative Auto-Fire Assertion (Still PENDING)', stillPendingState === 'PENDING', `state=${stillPendingState}`);

  // ============================================================
  // STEP 3: Three-Stage Activation Sequence (Distinct Visuals)
  // ============================================================
  console.log('\n--- Step 3: Three-Stage Activation Sequence ---');

  // Trigger Activation via Real Pointer Click
  await page.click('#establish-link-btn');

  // Stage 1: BUILDUP (capture at t=800ms)
  await sleep(800);
  const stage1Data = await page.evaluate(() => ({
    state: window.controlSystem.state,
    btnText: document.getElementById('establish-link-btn').textContent.trim()
  }));
  logTest('Activation Stage 1: BUILDUP active', stage1Data.state === 'BUILDUP', stage1Data.btnText);

  const ss04 = path.join(SCREENSHOT_DIR, '04_activation_stage1_buildup.png');
  await page.screenshot({ path: ss04 });
  results.screenshots.push('04_activation_stage1_buildup.png');
  console.log(`[Screenshot] Saved 04_activation_stage1_buildup.png`);

  // Stage 2: BREAKTHROUGH (t=2000ms to t=3200ms, capture at t=2300ms)
  await sleep(1500);
  const stage2Data = await page.evaluate(() => ({
    state: window.controlSystem.state,
    btnText: document.getElementById('establish-link-btn').textContent.trim()
  }));
  logTest('Activation Stage 2: BREAKTHROUGH active', stage2Data.state === 'BREAKTHROUGH', stage2Data.btnText);

  const ss05 = path.join(SCREENSHOT_DIR, '05_activation_stage2_breakthrough.png');
  await page.screenshot({ path: ss05 });
  results.screenshots.push('05_activation_stage2_breakthrough.png');
  console.log(`[Screenshot] Saved 05_activation_stage2_breakthrough.png`);

  // Stage 3: SUSTAINED ACTIVE (at t=3200ms+, capture at t=3600ms)
  await sleep(1300);
  const stage3Data = await page.evaluate(() => ({
    state: window.controlSystem.state,
    btnText: document.getElementById('establish-link-btn').textContent.trim(),
    headerText: document.getElementById('header-system-status').textContent.trim()
  }));
  logTest('Activation Stage 3: SUSTAINED ACTIVE', stage3Data.state === 'ACTIVE', stage3Data.headerText);

  const ss06 = path.join(SCREENSHOT_DIR, '06_activation_stage3_sustained.png');
  await page.screenshot({ path: ss06 });
  results.screenshots.push('06_activation_stage3_sustained.png');
  console.log(`[Screenshot] Saved 06_activation_stage3_sustained.png`);

  // ============================================================
  // STEP 4: Disengage Network (Cycle 1)
  // ============================================================
  console.log('\n--- Step 4: Disengage Network (Cycle 1) ---');
  await page.click('#disengage-network-btn');
  await sleep(400);

  const disengagedData = await page.evaluate(() => ({
    state: window.controlSystem.state,
    lockedCount: window.controlSystem.lockedStations.length
  }));
  logTest('Disengage Reset to IDLE', disengagedData.state === 'IDLE' && disengagedData.lockedCount === 0);

  const ss07 = path.join(SCREENSHOT_DIR, '07_disengaged_idle.png');
  await page.screenshot({ path: ss07 });
  results.screenshots.push('07_disengaged_idle.png');
  console.log(`[Screenshot] Saved 07_disengaged_idle.png`);

  // ============================================================
  // STEP 5: Quick-Dial Auto-Sequencing & Disengage Cycle 2
  // ============================================================
  console.log('\n--- Step 5: Quick-Dial Preset Auto-Sequencing (Tier 2) ---');

  // Switch to Tier 2 tab
  await page.click('#preset-tab-2');
  await sleep(200);

  // Click Preset: Gorda Plate Slab Tear (#preset-gorda)
  await page.click('#preset-gorda');

  // Capture mid-sequence auto-dialing at t=1000ms (~station 3-4)
  await sleep(1000);
  const midSeqData = await page.evaluate(() => ({
    lockedCount: window.controlSystem.lockedStations.length,
    state: window.controlSystem.state
  }));
  logTest('Auto-Dial Staged Sequencing in Progress', midSeqData.lockedCount > 0 && midSeqData.lockedCount < 7, `${midSeqData.lockedCount} stations locked`);

  const ss08 = path.join(SCREENSHOT_DIR, '08_autodial_mid_sequence.png');
  await page.screenshot({ path: ss08 });
  results.screenshots.push('08_autodial_mid_sequence.png');
  console.log(`[Screenshot] Saved 08_autodial_mid_sequence.png`);

  // Wait for auto-dial to finish (total ~2500ms)
  await sleep(1800);
  const autoDialDoneData = await page.evaluate(() => ({
    lockedCount: window.controlSystem.lockedStations.length,
    state: window.controlSystem.state
  }));
  logTest('Auto-Dial Completed into PENDING', autoDialDoneData.lockedCount === 7 && autoDialDoneData.state === 'PENDING');

  const ss09 = path.join(SCREENSHOT_DIR, '09_autodial_completed_pending.png');
  await page.screenshot({ path: ss09 });
  results.screenshots.push('09_autodial_completed_pending.png');
  console.log(`[Screenshot] Saved 09_autodial_completed_pending.png`);

  // Activate again
  await page.click('#establish-link-btn');
  await sleep(3500); // Wait through buildup (2000ms) & breakthrough (1200ms) to sustained active (3200ms+)

  const secondActiveData = await page.evaluate(() => window.controlSystem.state);
  logTest('Second Activation Reached ACTIVE', secondActiveData === 'ACTIVE');

  const ss10 = path.join(SCREENSHOT_DIR, '10_second_activation_sustained.png');
  await page.screenshot({ path: ss10 });
  results.screenshots.push('10_second_activation_sustained.png');
  console.log(`[Screenshot] Saved 10_second_activation_sustained.png`);

  // Disengage again (completing Cycle 2)
  await page.click('#disengage-network-btn');
  await sleep(400);
  const disengage2Data = await page.evaluate(() => window.controlSystem.state);
  logTest('Disengage Cycle 2 Complete (IDLE)', disengage2Data === 'IDLE');

  // ============================================================
  // STEP 6: Safety Interlock Blocked Test
  // ============================================================
  console.log('\n--- Step 6: Safety Interlock Test ---');

  // Quick-dial preset Cascadia (Tier 1)
  await page.click('#preset-tab-1');
  await sleep(150);
  await page.click('#preset-cascadia');
  await sleep(2500); // Wait for auto-dial to reach PENDING

  // Toggle Safety Interlock to ENGAGED
  await page.click('#interlock-toggle-btn');
  await sleep(150);

  const interlockEngagedState = await page.evaluate(() => ({
    engaged: window.controlSystem.interlockEngaged,
    badgeText: document.getElementById('interlock-status-badge').textContent
  }));
  logTest('Interlock Toggled to ENGAGED', interlockEngagedState.engaged === true && interlockEngagedState.badgeText.includes('ENGAGED'));

  // Attempt Activation while locked
  await page.click('#establish-link-btn');
  await sleep(200);

  const blockedState = await page.evaluate(() => ({
    state: window.controlSystem.state,
    toastShown: document.getElementById('interlock-toast').classList.contains('show')
  }));
  logTest('Activation Blocked by Interlock (State Remains PENDING)', blockedState.state === 'PENDING');
  logTest('Interlock Toast Warning Visible', blockedState.toastShown === true);

  const ss11 = path.join(SCREENSHOT_DIR, '11_interlock_blocked.png');
  await page.screenshot({ path: ss11 });
  results.screenshots.push('11_interlock_blocked.png');
  console.log(`[Screenshot] Saved 11_interlock_blocked.png`);

  // Toggle Interlock back to RELEASED and disengage
  await page.click('#interlock-toggle-btn');
  await sleep(150);
  await page.click('#disengage-network-btn');
  await sleep(300);

  // ============================================================
  // STEP 7: 4K Viewport Scaling Check (3840x2160)
  // ============================================================
  console.log('\n--- Step 7: 4K Viewport Scaling Check (3840x2160) ---');
  await page.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 1 });
  await sleep(400);

  const scale4kData = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    computedScale: window.__computedScale,
    cssVar: document.documentElement.style.getPropertyValue('--viewport-scale')
  }));
  logTest('4K Viewport Resized (3840x2160)', scale4kData.innerWidth === 3840 && scale4kData.innerHeight === 2160);
  logTest('4K Computed Scale Ratio (~2.0)', Math.abs(scale4kData.computedScale - 2.0) < 0.05, `scale=${scale4kData.computedScale}`);

  const ss12 = path.join(SCREENSHOT_DIR, '12_4k_scaled.png');
  await page.screenshot({ path: ss12 });
  results.screenshots.push('12_4k_scaled.png');
  console.log(`[Screenshot] Saved 12_4k_scaled.png`);

  // Return to 1080p
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await sleep(300);

  // ============================================================
  // STEP 8: Operator Reference & Corner Attributions
  // ============================================================
  console.log('\n--- Step 8: Operator Reference & Attributions ---');
  await page.click('#operator-help-btn');
  await sleep(300);

  const modalOpenState = await page.evaluate(() => {
    return document.getElementById('operator-modal-backdrop').classList.contains('open');
  });
  logTest('Operator Help Modal Opened', modalOpenState === true);

  const ss13 = path.join(SCREENSHOT_DIR, '13_operator_reference.png');
  await page.screenshot({ path: ss13 });
  results.screenshots.push('13_operator_reference.png');
  console.log(`[Screenshot] Saved 13_operator_reference.png`);

  // Close modal
  await page.click('#modal-close-btn');
  await sleep(200);

  // Validate Corner Links
  const cornerLinks = await page.evaluate(() => {
    const linkEl = document.querySelector('#corner-footer-left a');
    const versionEl = document.querySelector('#corner-footer-right span');
    return {
      href: linkEl ? linkEl.getAttribute('href') : null,
      target: linkEl ? linkEl.getAttribute('target') : null,
      rel: linkEl ? linkEl.getAttribute('rel') : null,
      versionText: versionEl ? versionEl.textContent : null
    };
  });

  logTest('Corner GitHub Link Href', cornerLinks.href === 'https://github.com/StarlightDaemon');
  logTest('Corner GitHub Link Target _blank', cornerLinks.target === '_blank');
  logTest('Corner GitHub Link Rel noopener noreferrer', cornerLinks.rel.includes('noopener') && cornerLinks.rel.includes('noreferrer'));
  logTest('Corner Version Badge v1.0.0', cornerLinks.versionText === 'v1.0.0');

  // Validate version.json fields
  const versionJsonRaw = fs.readFileSync(path.resolve(__dirname, '..', 'version.json'), 'utf8');
  const versionData = JSON.parse(versionJsonRaw);
  logTest('version.json has "version" field', typeof versionData.version === 'string' && versionData.version === '1.0.0');
  logTest('version.json has "model" field', typeof versionData.model === 'string' && versionData.model.length > 0, versionData.model);

  await browser.close();

  console.log('\n====================================================');
  console.log(`ALL ${results.tests.length} VERIFICATION CHECKS PASSED PERFECTLY!`);
  console.log('====================================================');
}

runVerification().catch(err => {
  console.error('\nVerification failed with error:', err);
  process.exit(1);
});
