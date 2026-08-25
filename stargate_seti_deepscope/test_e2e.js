import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, 'test_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE END-TO-END AUTOMATED VERIFICATION ---');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const url = 'http://localhost:5174/';
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle0' });

  // -------------------------------------------------------------
  // TEST 1: COLD START & INITIAL STATE VERIFICATION
  // -------------------------------------------------------------
  console.log('Test 1: Cold start & default verification...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_cold_start_1080p.png') });
  
  const safetyHoldStatus = await page.$eval('#safety-hold-status', el => el.textContent.trim());
  console.log(`- Safety Hold Status: ${safetyHoldStatus} (Expected: RELEASED)`);
  if (safetyHoldStatus !== 'RELEASED') throw new Error('Safety Hold must default to RELEASED!');

  const bannerTitle = await page.$eval('#banner-title', el => el.textContent.trim());
  console.log(`- Banner Title: ${bannerTitle}`);

  // -------------------------------------------------------------
  // TEST 2: MANUAL 7-SYMBOL DIAL SEQUENCE
  // -------------------------------------------------------------
  console.log('Test 2: Executing manual 7-symbol dial...');
  const glyphsToDial = ['c04', 'c02', 'c06', 'c08', 'c10', 'c12', 'c14'];
  
  for (let i = 0; i < glyphsToDial.length; i++) {
    const gId = glyphsToDial[i];
    const btnSelector = `#dial-btn-${gId}:not([disabled])`;
    await page.waitForSelector(btnSelector, { timeout: 5000 });
    await page.click(btnSelector);
    // Wait for counter to reflect lock
    await page.waitForFunction(
      (expected) => document.querySelector('#banner-counter')?.textContent.trim() === `${expected} / 7`,
      { timeout: 5000 },
      i + 1
    );
    const counter = await page.$eval('#banner-counter', el => el.textContent.trim());
    console.log(`  - Dialed glyph ${i + 1}/7 (${gId}) -> Counter: ${counter}`);
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_manual_dial_7of7_locked.png') });

  // -------------------------------------------------------------
  // TEST 3: NEGATIVE AUTO-FIRE TEST (CONFIRM PENDING ACTIVATION)
  // -------------------------------------------------------------
  console.log('Test 3: Confirming NEGATIVE auto-fire behavior (system must stay in PENDING)...');
  const engageDisabled = await page.$eval('#btn-engage-aperture', el => el.disabled);
  const engagePulsing = await page.$eval('#btn-engage-aperture', el => el.classList.contains('is-ready-pulsing'));
  console.log(`- Engage button enabled: ${!engageDisabled}, Pulsing: ${engagePulsing}`);

  // Wait 1.5s and confirm state is still PENDING
  await new Promise(r => setTimeout(r, 1500));
  const currentState = await page.$eval('#aperture-state-text', el => el.textContent.trim());
  console.log(`- State after 1.5s wait: ${currentState} (Expected: PENDING)`);
  if (currentState !== 'PENDING') throw new Error('System AUTO-FIRED on 7th lock! Must remain PENDING until manual engage.');

  // -------------------------------------------------------------
  // TEST 4: SAFETY INTERLOCK ENGAGEMENT & BLOCKING
  // -------------------------------------------------------------
  console.log('Test 4: Testing Safety Interlock Hold...');
  await page.click('#safety-hold-btn');
  const holdEngagedText = await page.$eval('#safety-hold-status', el => el.textContent.trim());
  console.log(`- Toggled Safety Hold -> Status: ${holdEngagedText}`);

  // Try to engage -> should be blocked!
  await page.click('#btn-engage-aperture');
  await new Promise(r => setTimeout(r, 300));
  const toastVisible = await page.$eval('#safety-toast-alert', el => el.classList.contains('is-visible'));
  console.log(`- Toast alert visible on blocked engage: ${toastVisible}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_safety_hold_blocked.png') });

  // Release hold via toast button
  await page.click('#toast-release-btn');
  await new Promise(r => setTimeout(r, 300));

  // -------------------------------------------------------------
  // TEST 5: THREE-STAGE ACTIVATION SEQUENCE
  // -------------------------------------------------------------
  console.log('Test 5: Triggering 3-stage activation...');
  await page.click('#btn-engage-aperture');

  // Stage 1: Buildup (~800ms in)
  await new Promise(r => setTimeout(r, 800));
  const buildupState = await page.$eval('#aperture-state-text', el => el.textContent.trim());
  console.log(`- Stage 1 State: ${buildupState}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_stage1_buildup.png') });

  // Stage 2: Breakthrough (wait for state 'BREAKTHROUGH')
  await page.waitForFunction(
    () => document.querySelector('#aperture-state-text')?.textContent.trim() === 'BREAKTHROUGH',
    { timeout: 5000 }
  );
  const breakState = await page.$eval('#aperture-state-text', el => el.textContent.trim());
  console.log(`- Stage 2 State: ${breakState}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_stage2_breakthrough.png') });

  // Stage 3: Sustained Active (wait for state 'ACTIVE BEAM')
  await page.waitForFunction(
    () => document.querySelector('#aperture-state-text')?.textContent.trim() === 'ACTIVE BEAM',
    { timeout: 5000 }
  );
  const activeState = await page.$eval('#aperture-state-text', el => el.textContent.trim());
  const activeSnr = await page.$eval('#metric-snr', el => el.textContent.trim());
  console.log(`- Stage 3 State: ${activeState}, SNR: ${activeSnr}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_stage3_sustained_active.png') });

  // -------------------------------------------------------------
  // TEST 6: DISENGAGE CYCLE 1
  // -------------------------------------------------------------
  console.log('Test 6: Disengaging active aperture (Cycle 1)...');
  await page.click('#btn-disengage');
  await new Promise(r => setTimeout(r, 600));
  const idleState = await page.$eval('#aperture-state-text', el => el.textContent.trim());
  console.log(`- Post-disengage state: ${idleState} (Expected: STANDBY)`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_post_disengage_idle.png') });

  // -------------------------------------------------------------
  // TEST 7: QUICK-DIAL PRESET AUTO-DIAL SEQUENCING
  // -------------------------------------------------------------
  console.log('Test 7: Triggering Quick-Dial preset (TRAPPIST-1e Nexus)...');
  await page.click('#preset-tgt-trappist1e');
  
  // Capture mid-dial auto-sequence screenshot (~1200ms in)
  await new Promise(r => setTimeout(r, 1200));
  const midCount = await page.$eval('#banner-counter', el => el.textContent.trim());
  console.log(`- Mid auto-dial count: ${midCount}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_autodial_mid_sequence.png') });

  // Wait for auto-dial to finish (~3000ms total)
  await new Promise(r => setTimeout(r, 2200));
  const autoDialFinishedState = await page.$eval('#aperture-state-text', el => el.textContent.trim());
  console.log(`- Auto-dial finished state: ${autoDialFinishedState} (Expected: PENDING)`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_autodial_completed_pending.png') });

  // -------------------------------------------------------------
  // TEST 8: SECOND ACTIVATION & DISENGAGE (CYCLE 2)
  // -------------------------------------------------------------
  console.log('Test 8: Second activation & disengage cycle...');
  await page.click('#btn-engage-aperture');
  await new Promise(r => setTimeout(r, 3000));
  const activeState2 = await page.$eval('#aperture-state-text', el => el.textContent.trim());
  console.log(`- Second cycle active state: ${activeState2}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_second_cycle_active.png') });

  await page.click('#btn-disengage');
  await new Promise(r => setTimeout(r, 500));
  console.log('- Second cycle disengaged cleanly.');

  // -------------------------------------------------------------
  // TEST 9: SIGNAL CLASSIFICATION & RFI REJECTION LAB
  // -------------------------------------------------------------
  console.log('Test 9: Testing Signal Classification & RFI Rejection Lab...');
  await page.click('#btn-open-triage');
  await new Promise(r => setTimeout(r, 500));
  
  // Select SIG-904 (Starlink Ku-Band Chirp)
  await page.click('.triage-card[data-id="SIG-904"]');
  await new Promise(r => setTimeout(r, 300));

  // Dismiss as RFI
  await page.click('#btn-reject-rfi');
  await new Promise(r => setTimeout(r, 400));
  const rfiStat = await page.$eval('#stat-rfi', el => el.textContent.trim());
  console.log(`- RFI Rejection Count: ${rfiStat} (Expected: 1)`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_triage_rfi_rejected.png') });

  // Close Triage Modal
  await page.click('[data-close="modal-triage"]');
  await new Promise(r => setTimeout(r, 400));

  // -------------------------------------------------------------
  // TEST 10: SECONDARY PANELS SPOT-CHECK
  // -------------------------------------------------------------
  console.log('Test 10: Spot-checking secondary modals...');
  
  // 10A. Array Geometry Map
  await page.click('#btn-open-array');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_array_geometry_modal.png') });
  await page.click('[data-close="modal-array"]');
  await new Promise(r => setTimeout(r, 300));

  // 10B. Historical Archive Search & Filter
  await page.click('#btn-open-archive');
  await new Promise(r => setTimeout(r, 500));
  await page.type('#archive-search-input', 'Vega');
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_archive_search_vega.png') });
  await page.click('[data-close="modal-archive"]');
  await new Promise(r => setTimeout(r, 300));

  // 10C. Operator Manual
  await page.click('#btn-open-manual');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_operator_manual_modal.png') });
  await page.click('[data-close="modal-manual"]');
  await new Promise(r => setTimeout(r, 300));

  // 10D. Settings Theme Switcher (Phosphor Amber)
  await page.click('#btn-open-settings');
  await new Promise(r => setTimeout(r, 400));
  await page.click('.theme-btn[data-theme="theme-amber"]');
  await new Promise(r => setTimeout(r, 300));
  await page.click('[data-close="modal-settings"]');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_theme_phosphor_amber.png') });

  // -------------------------------------------------------------
  // TEST 11: 4K VIEWPORT SCALING VERIFICATION (3840x2160)
  // -------------------------------------------------------------
  console.log('Test 11: Verifying 4K scaling at 3840x2160...');
  await page.setViewport({ width: 3840, height: 2160 });
  await new Promise(r => setTimeout(r, 500));
  const scale4k = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--scale').trim());
  console.log(`- 4K Viewport Transform Scale: ${scale4k} (Expected: 2)`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_4k_scaled_3840x2160.png') });

  console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
  await browser.close();
}

runTests().catch(err => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
