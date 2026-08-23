/**
 * STARGATE: LE NIMBUS FLORIÉ
 * Comprehensive Puppeteer Automated Verification Suite
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const http = require('http');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runVerification() {
  console.log("==================================================================");
  console.log("  STARGATE: LE NIMBUS FLORIÉ — END-TO-END VERIFICATION SUITE  ");
  console.log("==================================================================\n");

  const serverModule = require('../server.js');
  const PORT = 8088;
  serverModule.startServer(PORT);
  await sleep(600);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const results = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    evidence: []
  };

  function assert(condition, message) {
    results.totalTests++;
    if (condition) {
      results.passed++;
      console.log(`  [PASS] ${message}`);
      results.evidence.push({ status: 'PASS', message });
    } else {
      results.failed++;
      console.error(`  [FAIL] ${message}`);
      results.evidence.push({ status: 'FAIL', message });
    }
  }

  try {
    const url = `http://localhost:${PORT}/`;
    console.log(`1. Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0' });

    // --- STEP 1: COLD START VERIFICATION ---
    console.log("\n--- STEP 1: COLD START INSPECTION ---");
    const appScale = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--app-scale').trim();
    });
    console.log(`  Computed --app-scale: ${appScale}`);
    assert(parseFloat(appScale) > 0.9 && parseFloat(appScale) <= 1.0, `Viewport scale computed accurately (${appScale})`);

    const initialState = await page.evaluate(() => {
      return {
        gateState: window.app.state.gateState,
        seqLen: window.app.state.sequence.length,
        safetyEngaged: window.app.state.isSafetyEngaged,
        activateDisabled: document.getElementById('btn-activate').disabled
      };
    });

    assert(initialState.gateState === 'IDLE', `Gate state initialized to IDLE (got: ${initialState.gateState})`);
    assert(initialState.seqLen === 0, `Sequence initialized empty (0/7)`);
    assert(initialState.safetyEngaged === false, `Botanical Safety Interlock DEFAULTS TO RELEASED (got: ${initialState.safetyEngaged})`);
    assert(initialState.activateDisabled === true, `Activation button disabled on cold start`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_cold_start_1080p.png') });
    console.log("  Captured screenshot: 01_cold_start_1080p.png");

    // --- STEP 2: FULL MANUAL DIAL (7 GLYPHS) ---
    console.log("\n--- STEP 2: FULL MANUAL DIAL WITH 2-PASS LITHOGRAPHIC LOCKING ---");
    const glyphsToDial = ['iris', 'peacock', 'ginkgo', 'dragonfly', 'waterlily', 'passiflora', 'ivy'];

    for (let i = 0; i < glyphsToDial.length; i++) {
      const gid = glyphsToDial[i];
      const btnSelector = `#plate-btn-${gid}`;
      await page.waitForSelector(btnSelector);
      
      // Dispatch real pointer click
      await page.click(btnSelector);
      await sleep(220); // wait for 2-pass crayon + color registration wash

      const currentLen = await page.evaluate(() => window.app.state.sequence.length);
      console.log(`  Locked stone #${i + 1}: ${gid} (Registered sequence count: ${currentLen})`);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_manual_dial_in_progress.png') });
    console.log("  Captured screenshot: 02_manual_dial_in_progress.png");

    // --- STEP 3: NEGATIVE AUTO-FIRE TEST ---
    console.log("\n--- STEP 3: NEGATIVE AUTO-FIRE TEST ---");
    await sleep(1000); // Wait 1 full second

    const pendingState = await page.evaluate(() => {
      return {
        gateState: window.app.state.gateState,
        seqLen: window.app.state.sequence.length,
        activateDisabled: document.getElementById('btn-activate').disabled,
        activateHasPulse: document.getElementById('btn-activate').classList.contains('ready-pulse')
      };
    });

    assert(pendingState.gateState === 'PENDING', `Gate MUST remain in PENDING state after 7 glyphs without auto-firing (got: ${pendingState.gateState})`);
    assert(pendingState.seqLen === 7, `All 7 stones registered`);
    assert(pendingState.activateDisabled === false, `Activation button is now ENABLED`);
    assert(pendingState.activateHasPulse === true, `Activation button pulsing with gilded gold leaf ready state`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_pending_ready_no_autofire.png') });
    console.log("  Captured screenshot: 03_pending_ready_no_autofire.png");

    // --- STEP 4: THREE-STAGE STAGED ACTIVATION SEQUENCE ---
    console.log("\n--- STEP 4: THREE-STAGE STAGED ACTIVATION SEQUENCE ---");
    
    // Trigger explicit operator activation
    await page.click('#btn-activate');
    await sleep(400);

    // Stage 1: Buildup
    const stage1State = await page.evaluate(() => {
      return {
        gateState: window.app.state.gateState,
        apertureClass: document.getElementById('aperture-core').className,
        statusText: document.getElementById('aperture-status').textContent
      };
    });

    assert(stage1State.gateState === 'BUILDUP', `Stage 1: Gate state is BUILDUP (got: ${stage1State.gateState})`);
    assert(stage1State.apertureClass.includes('buildup'), `Stage 1: Aperture core has .buildup class`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_stage1_buildup.png') });
    console.log("  Captured screenshot: 04_stage1_buildup.png");

    // Wait for Stage 2: Breakthrough instant (~2.15s mark)
    await sleep(1750);
    const stage2State = await page.evaluate(() => {
      return {
        gateState: window.app.state.gateState,
        apertureClass: document.getElementById('aperture-core').className
      };
    });

    assert(stage2State.gateState === 'BREAKTHROUGH', `Stage 2: Gate state is BREAKTHROUGH (got: ${stage2State.gateState})`);
    assert(stage2State.apertureClass.includes('breakthrough'), `Stage 2: Aperture core has .breakthrough class`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_stage2_breakthrough.png') });
    console.log("  Captured screenshot: 05_stage2_breakthrough.png");

    // Wait for Stage 3: Sustained Active (~3.2s mark)
    await sleep(900);
    const stage3State = await page.evaluate(() => {
      return {
        gateState: window.app.state.gateState,
        apertureClass: document.getElementById('aperture-core').className,
        telem: window.app.state.telemetry
      };
    });

    assert(stage3State.gateState === 'ACTIVE', `Stage 3: Gate state is SUSTAINED ACTIVE (got: ${stage3State.gateState})`);
    assert(stage3State.apertureClass.includes('active'), `Stage 3: Aperture core has .active class`);
    assert(stage3State.telem.aethericViscosity > 2.0, `Telemetry Viscosity elevated during active (${stage3State.telem.aethericViscosity})`);
    assert(stage3State.telem.lithoPressure > 4.5, `Telemetry Pressure elevated during active (${stage3State.telem.lithoPressure})`);
    assert(stage3State.telem.luminanceFlux > 500, `Telemetry Luminance flux elevated during active (${stage3State.telem.luminanceFlux})`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_stage3_sustained_active.png') });
    console.log("  Captured screenshot: 06_stage3_sustained_active.png");

    // --- STEP 5: DISENGAGE (CYCLE 1) ---
    console.log("\n--- STEP 5: DISENGAGE APERTURE (CYCLE 1) ---");
    await page.click('#btn-disengage');
    await sleep(300);

    const disengage1State = await page.evaluate(() => {
      return {
        gateState: window.app.state.gateState,
        seqLen: window.app.state.sequence.length,
        activateDisabled: document.getElementById('btn-activate').disabled
      };
    });

    assert(disengage1State.gateState === 'IDLE', `Gate state returned to IDLE on disengage`);
    assert(disengage1State.seqLen === 0, `Sequence reset to 0`);
    assert(disengage1State.activateDisabled === true, `Activate button disabled`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_disengaged_cycle1.png') });
    console.log("  Captured screenshot: 07_disengaged_cycle1.png");

    // --- STEP 6: QUICK-DIAL PRESET AUTO-DIAL SEQUENCE ---
    console.log("\n--- STEP 6: QUICK-DIAL PRESET AUTO-DIALING ---");
    await page.click('#preset-card-preset-paris-auteuil');
    await sleep(350);

    const midAutoDialLen = await page.evaluate(() => window.app.state.sequence.length);
    assert(midAutoDialLen > 0 && midAutoDialLen < 7, `Auto-dial is visibly progressing step-by-step (current: ${midAutoDialLen}/7)`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_autodial_sequence_in_progress.png') });
    console.log("  Captured screenshot: 08_autodial_sequence_in_progress.png");

    // Wait for auto-dial to finish (7 * 280ms ≈ 2s)
    await sleep(2200);

    const autoDialFinished = await page.evaluate(() => {
      return {
        gateState: window.app.state.gateState,
        seqLen: window.app.state.sequence.length,
        activateDisabled: document.getElementById('btn-activate').disabled
      };
    });

    assert(autoDialFinished.gateState === 'PENDING', `Auto-dial lands strictly in PENDING state, NEVER auto-firing (got: ${autoDialFinished.gateState})`);
    assert(autoDialFinished.seqLen === 7, `Auto-dial completed all 7 glyphs`);
    assert(autoDialFinished.activateDisabled === false, `Activate button enabled`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_autodial_pending_ready.png') });
    console.log("  Captured screenshot: 09_autodial_pending_ready.png");

    // --- STEP 7: SECOND ACTIVATION & SECOND DISENGAGE (CYCLE 2) ---
    console.log("\n--- STEP 7: SECOND ACTIVATION & DISENGAGE (CYCLE 2) ---");
    await page.click('#btn-activate');
    await sleep(3100); // Buildup (2.0s) + Breakthrough (0.8s) -> Active (>2.8s)

    const cycle2Active = await page.evaluate(() => window.app.state.gateState);
    assert(cycle2Active === 'ACTIVE', `Second cycle reached ACTIVE state (got: ${cycle2Active})`);

    await page.click('#btn-disengage');
    await sleep(300);

    const cycle2Disengaged = await page.evaluate(() => window.app.state.gateState);
    assert(cycle2Disengaged === 'IDLE', `Second cycle disengaged cleanly to IDLE (got: ${cycle2Disengaged})`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_disengaged_cycle2.png') });
    console.log("  Captured screenshot: 10_disengaged_cycle2.png");

    // --- STEP 8: BOTANICAL SAFETY INTERLOCK TEST ---
    console.log("\n--- STEP 8: BOTANICAL SAFETY INTERLOCK TEST ---");
    await page.click('#safety-latch-toggle');
    await sleep(200);

    const safetyEngaged = await page.evaluate(() => window.app.state.isSafetyEngaged);
    assert(safetyEngaged === true, `Safety latch is now ENGAGED (locked)`);

    // Dial 7 glyphs quickly to test blocking
    await page.click('#preset-card-preset-laeken');
    await sleep(2200);

    // Attempt activation while safety is engaged
    await page.click('#btn-activate');
    await sleep(200);

    const blockedState = await page.evaluate(() => {
      return {
        gateState: window.app.state.gateState,
        bannerDisplay: document.getElementById('safety-alert-banner').style.display
      };
    });

    assert(blockedState.gateState === 'PENDING', `Activation BLOCKED by safety latch, gate remains PENDING (got: ${blockedState.gateState})`);
    assert(blockedState.bannerDisplay !== 'none', `Unmissable safety alert banner is VISIBLE`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_safety_latch_tested.png') });
    console.log("  Captured screenshot: 11_safety_latch_tested.png");

    // Release safety latch and clear
    await page.click('#safety-latch-toggle');
    await page.click('#btn-disengage');
    await sleep(200);

    // --- STEP 9: CROSS-REFERENCED ARCHIVE LINK NAVIGATION SPOT-CHECK ---
    console.log("\n--- STEP 9: CROSS-REFERENCED ARCHIVE DEEP NAVIGATION SPOT-CHECK ---");
    await page.click('#btn-nav-archive');
    await sleep(350);

    // Confirm initial article is Paris-Auteuil
    let articleTitle = await page.evaluate(() => document.querySelector('.article-title')?.textContent);
    console.log(`  Initial article displayed: "${articleTitle}"`);
    assert(articleTitle.includes('Paris-Auteuil'), `Initial archive article loaded`);

    // Click cross-reference link to Hector Guimard
    await page.click('.codex-link[data-target="figure-guimard-aether"]');
    await sleep(300);

    articleTitle = await page.evaluate(() => document.querySelector('.article-title')?.textContent);
    console.log(`  Navigated to cross-referenced article: "${articleTitle}"`);
    assert(articleTitle.includes('Hector Guimard'), `Cross-reference link clicked & navigated to Hector Guimard folio!`);

    // Click secondary cross-reference link to Alphonse Mucha
    await page.click('.codex-link[data-target="figure-mucha-astral"]');
    await sleep(300);

    articleTitle = await page.evaluate(() => document.querySelector('.article-title')?.textContent);
    console.log(`  Navigated to second cross-referenced article: "${articleTitle}"`);
    assert(articleTitle.includes('Alphonse Mucha'), `Secondary cross-reference link navigated to Alphonse Mucha folio!`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_archive_cross_reference_nav.png') });
    console.log("  Captured screenshot: 12_archive_cross_reference_nav.png");
    await page.click('#modal-close-btn');
    await sleep(200);

    // --- STEP 10: SECONDARY PANELS SPOT-CHECK ---
    console.log("\n--- STEP 10: SECONDARY PANELS SPOT-CHECK ---");
    
    // Legend Modal
    await page.click('#btn-nav-legend');
    await sleep(300);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13_legend_codex_view.png') });
    console.log("  Captured screenshot: 13_legend_codex_view.png");
    await page.click('#modal-close-btn');
    await sleep(200);

    // Telemetry Modal
    await page.click('#btn-nav-telemetry');
    await sleep(300);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14_telemetry_live.png') });
    console.log("  Captured screenshot: 14_telemetry_live.png");
    await page.click('#modal-close-btn');
    await sleep(200);

    // Settings Modal: Switch Palette & Save Note
    await page.click('#btn-nav-settings');
    await sleep(300);
    await page.click('.palette-btn[data-mood="secession-rose"]');
    await page.evaluate(() => {
      const el = document.getElementById('operator-notes-input');
      if (el) {
        el.value = "Station Paris-Auteuil vérifiée. Alignement Mucha à 432 Hz parfait.";
        el.dispatchEvent(new Event('change'));
      }
    });
    await sleep(300);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15_settings_customized.png') });
    console.log("  Captured screenshot: 15_settings_customized.png");
    await page.click('#modal-close-btn');
    await sleep(200);

    // --- STEP 11: LOCALSTORAGE RELOAD PERSISTENCE SPOT-CHECK ---
    console.log("\n--- STEP 11: LOCALSTORAGE PERSISTENCE SURVIVING PAGE RELOAD ---");
    await page.reload({ waitUntil: 'networkidle0' });
    await sleep(400);

    const reloadedMood = await page.evaluate(() => window.app.state.colorMood);
    const reloadedNotes = await page.evaluate(() => window.app.state.sessionData.operatorNotes);
    const reloadedLogsCount = await page.evaluate(() => window.app.state.sessionData.sessionLogs.length);

    console.log(`  Reloaded color mood: ${reloadedMood}`);
    console.log(`  Reloaded operator notes: "${reloadedNotes}"`);
    console.log(`  Reloaded session log items: ${reloadedLogsCount}`);

    assert(reloadedMood === 'secession-rose', `Color mood persisted across reload (${reloadedMood})`);
    assert(reloadedNotes.includes('Paris-Auteuil vérifiée'), `Custom operator journal notes persisted across reload!`);
    assert(reloadedLogsCount > 5, `Real session event logs persisted across reload!`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '16_localstorage_persistence_reloaded.png') });
    console.log("  Captured screenshot: 16_localstorage_persistence_reloaded.png");

    // --- STEP 12: 4K ULTRA-HD (3840x2160) SCALING VERIFICATION ---
    console.log("\n--- STEP 12: 4K ULTRA-HD (3840x2160) SCALING VERIFICATION ---");
    await page.setViewport({ width: 3840, height: 2160 });
    await sleep(300);

    const scale4k = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--app-scale').trim();
    });
    console.log(`  Computed 4K --app-scale: ${scale4k}`);
    assert(parseFloat(scale4k) >= 1.95 && parseFloat(scale4k) <= 2.05, `4K Viewport scale computed to 2.0 (${scale4k}) without CSS scale error`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '17_poster_4k_rendered.png') });
    console.log("  Captured screenshot: 17_poster_4k_rendered.png");

  } catch (err) {
    console.error("Test execution error:", err);
    results.failed++;
  } finally {
    await browser.close();
  }

  console.log("\n==================================================================");
  console.log(`  VERIFICATION RESULTS: ${results.passed} PASSED / ${results.failed} FAILED (TOTAL: ${results.totalTests})`);
  console.log("==================================================================\n");

  if (results.failed > 0) {
    process.exit(1);
  }
}

runVerification();
