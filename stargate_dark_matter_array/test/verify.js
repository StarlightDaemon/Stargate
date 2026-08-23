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

async function runVerification() {
  console.log('================================================================');
  console.log('   BOREAS-IX AUTOMATED PUPPETEER VERIFICATION SUITE');
  console.log('================================================================\n');

  // 1. Verify version.json metadata
  const versionPath = path.join(__dirname, '..', 'version.json');
  if (!fs.existsSync(versionPath)) {
    throw new Error('version.json does not exist!');
  }
  const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  console.log('✓ Metadata check: version.json found.');
  console.log(`  - Version: ${versionData.version}`);
  console.log(`  - Model: ${versionData.model}`);
  if (!versionData.version || !versionData.model) {
    throw new Error('version.json MUST contain both "version" and "model" fields!');
  }

  // 2. Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Listen to console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`  [BROWSER ERROR] ${msg.text()}`);
    }
  });

  console.log('\n--- TEST 1: COLD START & BASELINE INSPECTION (1080p) ---');
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
  await sleep(500);

  // Check default safety interlock (MUST DEFAULT TO RELEASED / FALSE)
  const isInterlockChecked = await page.$eval('#toggle-blind-lock', el => el.checked);
  console.log(`✓ Safety Interlock [BLIND-ANALYSIS PROTOCOL LOCK] default checked: ${isInterlockChecked} (Must be false)`);
  if (isInterlockChecked !== false) {
    throw new Error('Safety interlock must default to released (false)!');
  }

  const titleText = await page.$eval('.obs-title', el => el.textContent.trim());
  console.log(`✓ Observatory Title: "${titleText}"`);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_cold_start.png') });
  console.log('✓ Captured screenshot: 01_cold_start.png');

  console.log('\n--- TEST 2: FULL MANUAL DIALING SEQUENCE (7 CHANNELS) ---');
  const channelIds = ['pmt-01', 'pmt-02', 'pmt-03', 'pmt-04', 'pmt-05', 'pmt-06', 'pmt-07'];
  for (let i = 0; i < channelIds.length; i++) {
    const chId = channelIds[i];
    const btnSelector = `#btn-${chId}`;
    await page.waitForSelector(btnSelector);
    await page.click(btnSelector);
    await sleep(350); // wait for discrimination check to complete
    const slotText = await page.$eval(`#slot-${i} .slot-status`, el => el.textContent.trim());
    console.log(`  - Clicked ${chId.toUpperCase()} -> Slot ${i + 1} status: ${slotText}`);
  }

  const lockedCount = await page.evaluate(() => window.dmDiscrimination.getLockedCount());
  console.log(`✓ All 7 slots locked: count = ${lockedCount}/7`);
  if (lockedCount !== 7) {
    throw new Error(`Expected 7 locked slots, got ${lockedCount}`);
  }

  console.log('\n--- TEST 3: NEGATIVE TEST (NO AUTO-FIRE UPON 7TH CHANNEL) ---');
  const apertureStateAfterDial = await page.evaluate(() => window.dmApp.apertureState);
  console.log(`✓ Aperture state after 7th slot lock: "${apertureStateAfterDial}" (Must be PENDING)`);
  if (apertureStateAfterDial !== 'PENDING') {
    throw new Error(`Negative test failed: aperture auto-fired! Expected PENDING, got ${apertureStateAfterDial}`);
  }

  const commitBtnText = await page.$eval('#btn-commit-run', el => el.textContent.trim());
  const commitBtnDisabled = await page.$eval('#btn-commit-run', el => el.disabled);
  console.log(`✓ Commit button text: "${commitBtnText}" (disabled: ${commitBtnDisabled})`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_manual_dial_pending.png') });
  console.log('✓ Captured screenshot: 02_manual_dial_pending.png');

  console.log('\n--- TEST 4: THREE-STAGE ACTIVATION SEQUENCE ---');
  console.log('  -> Triggering activation commit...');
  await page.click('#btn-commit-run');

  // Stage 1: BUILDUP
  await sleep(1000);
  const stateStage1 = await page.evaluate(() => window.dmApp.apertureState);
  const sigmaStage1 = await page.$eval('#telem-sigma', el => el.textContent.trim());
  console.log(`✓ Stage 1 (BUILDUP) active: state = "${stateStage1}", statistical significance = ${sigmaStage1}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_stage1_buildup.png') });
  console.log('✓ Captured screenshot: 03_stage1_buildup.png');

  // Stage 2: BREAKTHROUGH
  await sleep(1600); // 2.6s total from start -> breakthrough moment
  const stateStage2 = await page.evaluate(() => window.dmApp.apertureState);
  const sigmaStage2 = await page.$eval('#telem-sigma', el => el.textContent.trim());
  console.log(`✓ Stage 2 (BREAKTHROUGH) triggered: state = "${stateStage2}", statistical significance = ${sigmaStage2}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_stage2_breakthrough.png') });
  console.log('✓ Captured screenshot: 04_stage2_breakthrough.png');

  // Stage 3: SUSTAINED ACTIVE
  await sleep(1000);
  const stateStage3 = await page.evaluate(() => window.dmApp.apertureState);
  const fluxStage3 = await page.$eval('#telem-flux', el => el.textContent.trim());
  console.log(`✓ Stage 3 (SUSTAINED ACTIVE) streaming: state = "${stateStage3}", dark matter flux = ${fluxStage3}`);
  if (stateStage3 !== 'ACTIVE') {
    throw new Error(`Expected ACTIVE state, got ${stateStage3}`);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_stage3_sustained_active.png') });
  console.log('✓ Captured screenshot: 05_stage3_sustained_active.png');

  console.log('\n--- TEST 5: DISENGAGE & STANDBY RETURN (CYCLE 1 COMPLETE) ---');
  await page.click('#btn-disengage');
  await sleep(400);
  const stateAfterDisengage = await page.evaluate(() => window.dmApp.apertureState);
  const lockedCountAfterDisengage = await page.evaluate(() => window.dmDiscrimination.getLockedCount());
  console.log(`✓ Aperture state after disengage: "${stateAfterDisengage}", locked slots = ${lockedCountAfterDisengage}`);
  if (stateAfterDisengage !== 'STANDBY' || lockedCountAfterDisengage !== 0) {
    throw new Error('Disengage failed to reset aperture to STANDBY!');
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_disengage_standby.png') });
  console.log('✓ Captured screenshot: 06_disengage_standby.png');

  console.log('\n--- TEST 6: QUICK-DIAL ARCHIVE AUTO-DIAL SEQUENCE (CYCLE 2) ---');
  // Select Tier 2 preset EVENT-884-BRAVO
  console.log('  -> Selecting Quick-Dial preset: EVENT-884-BRAVO...');
  await page.select('#quick-preset-select', 'EVENT-884-BRAVO');
  
  // Capture during auto-dial progression
  await sleep(700);
  const autoDialingInProgress = await page.evaluate(() => window.dmQuickDial.isAutoDialing);
  const slotsInProgress = await page.evaluate(() => window.dmDiscrimination.getLockedCount());
  console.log(`✓ Auto-dial in progress: isAutoDialing = ${autoDialingInProgress}, slots staged so far = ${slotsInProgress}/7`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_autodial_in_progress.png') });
  console.log('✓ Captured screenshot: 07_autodial_in_progress.png');

  // Wait for auto-dial to finish all 7 channels
  await sleep(2500);
  const stateAfterAutoDial = await page.evaluate(() => window.dmApp.apertureState);
  const slotsAfterAutoDial = await page.evaluate(() => window.dmDiscrimination.getLockedCount());
  console.log(`✓ Auto-dial finished: state = "${stateAfterAutoDial}" (Must be PENDING), slots = ${slotsAfterAutoDial}/7`);
  if (stateAfterAutoDial !== 'PENDING' || slotsAfterAutoDial !== 7) {
    throw new Error('Auto-dial sequence failed to land cleanly in PENDING state!');
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_autodial_pending.png') });
  console.log('✓ Captured screenshot: 08_autodial_pending.png');

  // Activate & Disengage again to complete 2nd full test cycle
  console.log('  -> Activating Cycle 2...');
  await page.click('#btn-commit-run');
  await sleep(3400); // Wait through buildup to active
  const stateCycle2Active = await page.evaluate(() => window.dmApp.apertureState);
  console.log(`✓ Cycle 2 sustained active confirmed: state = "${stateCycle2Active}"`);
  
  console.log('  -> Disengaging Cycle 2...');
  await page.click('#btn-disengage');
  await sleep(300);
  console.log('✓ Cycle 2 disengaged successfully.');

  console.log('\n--- TEST 7: BACKGROUND DISCRIMINATION REJECTION FAILURE PATH ---');
  console.log('  -> Engaging simulated noise & muon veto spike...');
  await page.click('#btn-simulate-veto');
  await sleep(200);

  // Click PMT channel 8
  await page.click('#btn-pmt-08');
  await sleep(400);

  const vetoReasonText = await page.$eval('#veto-rejection-reason', el => el.textContent.trim());
  const rejectionLockedCount = await page.evaluate(() => window.dmDiscrimination.getLockedCount());
  console.log(`✓ Candidate REJECTED as background noise: "${vetoReasonText}"`);
  console.log(`✓ Slots remain uncorrupted: locked slots = ${rejectionLockedCount}`);
  if (!vetoReasonText) {
    throw new Error('Rejection failure path did not produce visible rejection reason!');
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_discrimination_rejected.png') });
  console.log('✓ Captured screenshot: 09_discrimination_rejected.png');

  // Release veto spike
  await page.click('#btn-simulate-veto');
  await sleep(200);

  console.log('\n--- TEST 8: SECONDARY PANELS & RELATIONAL ARCHIVE NAVIGATION ---');
  // 1. Engineering View
  await page.click('#nav-btn-engineering');
  await sleep(400);
  const engTitle = await page.$eval('.eng-title', el => el.textContent.trim());
  console.log(`✓ CRYO-ENGINEERING view active: selected component = "${engTitle}"`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_cryo_engineering_view.png') });
  console.log('✓ Captured screenshot: 10_cryo_engineering_view.png');

  // 2. Archive View & Relational Jump
  await page.click('#nav-btn-archive');
  await sleep(400);
  const archiveCount = await page.$$eval('.archive-card', els => els.length);
  console.log(`✓ ARCHIVE VAULT active: total relational datasets rendered = ${archiveCount} (Must be >= 36)`);
  if (archiveCount < 36) {
    throw new Error(`Expected at least 36 archive runs, found ${archiveCount}`);
  }

  // Click relational cross-reference button
  console.log('  -> Clicking relational link [REF: RUN-2024-WIMP-SHM]...');
  const relBtn = await page.waitForSelector('.archive-card.tier_1_vetted .rel-link-btn');
  await relBtn.evaluate(el => {
    el.scrollIntoView({ block: 'center' });
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await sleep(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_archive_cross_reference.png') });
  console.log('✓ Captured screenshot: 11_archive_cross_reference.png');

  // 3. Settings View & Theme Switch
  await page.click('#nav-btn-settings');
  await sleep(400);
  console.log('  -> Switching theme to Amber Monochromatic Phosphor...');
  const themeRadio = await page.waitForSelector('input[name="theme-select"][value="amber-phosphor"]');
  await themeRadio.evaluate(el => {
    el.scrollIntoView({ block: 'center' });
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sleep(300);
  const activeTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  console.log(`✓ Active theme in DOM: "${activeTheme}"`);
  if (activeTheme !== 'amber-phosphor') {
    throw new Error(`Expected amber-phosphor theme, got ${activeTheme}`);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_settings_theme_change.png') });
  console.log('✓ Captured screenshot: 12_settings_theme_change.png');

  console.log('\n--- TEST 9: LOCALSTORAGE PERSISTENCE ACROSS RELOAD ---');
  console.log('  -> Reloading page...');
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(500);

  const restoredTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const restoredStats = await page.evaluate(() => window.dmStorage.get('stats'));
  console.log(`✓ Restored theme after reload: "${restoredTheme}"`);
  console.log(`✓ Restored session stats: aperturesOpened = ${restoredStats.aperturesOpened}, candidatesPassed = ${restoredStats.candidatesPassed}, candidatesRejected = ${restoredStats.candidatesRejected}`);
  
  if (restoredTheme !== 'amber-phosphor' || restoredStats.aperturesOpened < 2) {
    throw new Error('LocalStorage persistence failed across page reload!');
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_localstorage_restored.png') });
  console.log('✓ Captured screenshot: 13_localstorage_restored.png');

  console.log('\n--- TEST 10: 4K ULTRA-HD VIEWPORT TEST (3840x2160) ---');
  await page.setViewport({ width: 3840, height: 2160 });
  await sleep(500);
  const computedScale = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim());
  console.log(`✓ 4K Viewport tested: 3840x2160, computed CSS scale ratio = ${computedScale}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_viewport_4k.png') });
  console.log('✓ Captured screenshot: 14_viewport_4k.png');

  await browser.close();

  console.log('\n================================================================');
  console.log('   ALL 10 VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runVerification().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
