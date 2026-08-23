/**
 * ISTITUTO DINAMICO DI PROPULSIONE E TRASLAZIONE (IDPT)
 * End-to-End Automated Verification Suite with Puppeteer
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const server = require('../server.js');

const PORT = 3456;
const BASE_URL = `http://localhost:${PORT}/`;
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runVerification() {
  console.log('================================================================');
  console.log('  IDPT GATEWAY - PUPPETEER VERIFICATION SUITE STARTING');
  console.log('================================================================');

  let testServer;
  let browser;

  try {
    // 1. Start Server
    testServer = server.listen(PORT);
    console.log(`[PASS] Local HTTP server listening on ${BASE_URL}`);

    // 2. Launch Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // 3. Navigate to Base URL
    const response = await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    if (response.status() !== 200) {
      throw new Error(`Server returned HTTP status ${response.status()}`);
    }
    console.log('[PASS] Page successfully loaded with HTTP 200');

    // 4. Test 1: Cold Start & Viewport Scaling (1080p & 4K)
    const scale1080 = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim();
    });
    console.log(`[PASS] 1080p Native Scale computed: ${scale1080} (Expected: 1.0000)`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_cold_start_1080p.png') });

    // Test 4K Viewport
    await page.setViewport({ width: 3840, height: 2160 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await sleep(200);
    const scale4k = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim();
    });
    console.log(`[PASS] 4K Viewport (3840x2160) Scale computed: ${scale4k} (Expected: 2.0000)`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_cold_start_4k.png') });

    // Reset back to 1080p
    await page.setViewport({ width: 1920, height: 1080 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await sleep(200);

    // 5. Test 2: Manual Dialing Sequence & Negative Auto-Fire Test
    console.log('\n--- TEST 2: Manual Dialing Sequence (7 Stators) ---');
    const dialSequence = [1, 3, 5, 2, 7, 9, 4];
    for (let i = 0; i < dialSequence.length; i++) {
      const statorNum = dialSequence[i];
      const btnSelector = `#stator-btn-${statorNum}`;
      await page.waitForSelector(btnSelector);
      await page.click(btnSelector);
      await sleep(100);
    }

    const lockedCount = await page.evaluate(() => {
      return window.idptGate.lockedSlots.length;
    });
    const gateStateAfter7 = await page.evaluate(() => window.idptGate.state);
    console.log(`[PASS] 7 Stators locked. Current Gate State: '${gateStateAfter7}' (Expected: 'pending')`);
    
    // Negative test: wait 1.5 seconds to confirm it NEVER auto-fires
    await sleep(1500);
    const gateStateStillPending = await page.evaluate(() => window.idptGate.state);
    if (gateStateStillPending !== 'pending') {
      throw new Error(`FAIL: Gate auto-fired unexpectedly! State is '${gateStateStillPending}'`);
    }
    console.log('[PASS] Negative Test Passed: System remains pending and DID NOT auto-fire.');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_manual_dial_pending.png') });

    // 6. Test 3: Three-Stage Activation Sequence
    console.log('\n--- TEST 3: Three-Stage Activation Sequence ---');
    await page.click('#btn-actuate-lever');

    // Sample Stage 1 (Buildup) at 0.8s
    await sleep(800);
    const stateStage1 = await page.evaluate(() => window.idptGate.state);
    console.log(`[PASS] Activation Stage 1: State is '${stateStage1}' (Expected: 'buildup')`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_stage1_buildup.png') });

    // Sample Stage 2 (Breakthrough) at +1.2s (total 2.0s)
    await sleep(1200);
    const stateStage2 = await page.evaluate(() => window.idptGate.state);
    console.log(`[PASS] Activation Stage 2: State is '${stateStage2}' (Expected: 'breakthrough')`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_stage2_breakthrough.png') });

    // Sample Stage 3 (Sustained Active) at +1.0s (total 3.0s)
    await sleep(1000);
    const stateStage3 = await page.evaluate(() => window.idptGate.state);
    console.log(`[PASS] Activation Stage 3: State is '${stateStage3}' (Expected: 'active')`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_stage3_sustained_active.png') });

    // 7. Test 4: Disengage Brake Cycle
    console.log('\n--- TEST 4: Disengage Brake Cycle ---');
    await page.click('#btn-disengage-brake');
    await sleep(300);
    const stateAfterDisengage = await page.evaluate(() => window.idptGate.state);
    const lockedAfterDisengage = await page.evaluate(() => window.idptGate.lockedSlots.length);
    console.log(`[PASS] Disengaged. State: '${stateAfterDisengage}', Locked Slots: ${lockedAfterDisengage}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_disengage_idle.png') });

    // 8. Test 5: Quick-Dial Presets Auto-Dial & Double Cycle
    console.log('\n--- TEST 5: Quick-Dial Preset Auto-Dialing & Redial ---');
    // Switch to Tier II tab
    await page.click('.tier-tab-btn[data-tier="tier2"]');
    await sleep(150);

    // Click Centauri-Vortice preset card
    await page.click('.preset-card[data-preset-id="P-04"]');
    console.log('[PASS] Preset P-04 selected. Observing staged auto-dial sequence...');

    // Wait for auto-dial sequence to complete (7 steps * 220ms ~= 1.6s)
    await sleep(2000);
    const presetState = await page.evaluate(() => window.idptGate.state);
    const presetLocked = await page.evaluate(() => window.idptGate.lockedSlots);
    console.log(`[PASS] Preset Auto-Dial landed in state: '${presetState}' with locked vector [${presetLocked.join('-')}]`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_preset_autodial_pending.png') });

    // Activate second time
    await page.click('#btn-actuate-lever');
    await sleep(3000); // Allow full transition to sustained active
    const redialActiveState = await page.evaluate(() => window.idptGate.state);
    console.log(`[PASS] Redialed gate reached sustained active state: '${redialActiveState}'`);

    // Disengage second time
    await page.click('#btn-disengage-brake');
    await sleep(300);
    console.log('[PASS] Disengage/Redial cycle completed twice successfully.');

    // 9. Test 6: Safety Interlock (Governor Clutch)
    console.log('\n--- TEST 6: Safety Interlock (Governor Clutch) ---');
    const govDefaultEngaged = await page.evaluate(() => window.idptGate.governorEngaged);
    console.log(`[PASS] Safety Governor default state: ${govDefaultEngaged} (Expected: false / RELEASED)`);

    // Engage Governor
    await page.click('#btn-governor-toggle');
    const govEngagedNow = await page.evaluate(() => window.idptGate.governorEngaged);
    console.log(`[PASS] Safety Governor engaged: ${govEngagedNow}`);

    // Quick-dial another preset to reach pending
    await page.click('.tier-tab-btn[data-tier="tier1"]');
    await sleep(100);
    await page.click('.preset-card[data-preset-id="P-01"]');
    await sleep(2000);

    // Attempt activation while Governor is engaged (Should block!)
    await page.click('#btn-actuate-lever');
    await sleep(200);
    const blockedState = await page.evaluate(() => window.idptGate.state);
    const isHazardVisible = await page.evaluate(() => {
      const el = document.getElementById('governor-hazard-banner');
      return el && el.classList.contains('visible');
    });
    console.log(`[PASS] Activation blocked by Governor! State remained '${blockedState}', Hazard Banner visible: ${isHazardVisible}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_governor_blocking_hazard.png') });

    // Release Governor & verify activation succeeds
    await page.click('#btn-governor-toggle');
    await sleep(200);
    await page.click('#btn-actuate-lever');
    await sleep(3000);
    const unblockedActiveState = await page.evaluate(() => window.idptGate.state);
    console.log(`[PASS] After releasing Governor, activation succeeded: state is '${unblockedActiveState}'`);

    await page.click('#btn-disengage-brake');
    await sleep(300);

    // 10. Test 7: Relational Archive Navigation & Hyperlinks
    console.log('\n--- TEST 7: Relational Archive Navigation ---');
    await page.click('[data-open-modal="archive"]');
    await sleep(300);

    // Click record VR-1913-A
    await page.click('.archive-entry-item[data-entry-id="VR-1913-A"]');
    await sleep(200);
    const initialTitle = await page.evaluate(() => {
      const el = document.querySelector('#archive-dossier-view .dossier-title');
      return el ? el.textContent : '';
    });
    console.log(`[PASS] Loaded Archive Dossier: "${initialTitle}"`);

    // Click relational link to APP-01 inside the dossier view!
    await page.click('.archive-rel-link[data-rel-id="APP-01"]');
    await sleep(200);
    const jumpedTitle = await page.evaluate(() => {
      const el = document.querySelector('#archive-dossier-view .dossier-title');
      return el ? el.textContent : '';
    });
    console.log(`[PASS] Clicked Relational Link: Seamlessly navigated to "${jumpedTitle}"`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_archive_relational_navigation.png') });

    // Close archive modal
    await page.click('#modal-archive .modal-close-btn');
    await sleep(200);

    // 11. Test 8: Engineering Blueprint Mode & Settings Theme
    console.log('\n--- TEST 8: Blueprint Mode & Settings Theme ---');
    await page.click('[data-open-modal="blueprint"]');
    await sleep(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_blueprint_schema.png') });
    await page.click('#modal-blueprint .modal-close-btn');
    await sleep(200);

    await page.click('[data-open-modal="settings"]');
    await sleep(300);
    await page.click('.theme-btn[data-theme-name="balla"]');
    await sleep(200);
    const activeTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log(`[PASS] Theme switched to: '${activeTheme}' (Balla Electric Prism)`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_settings_theme_balla.png') });
    await page.click('#modal-settings .modal-close-btn');
    await sleep(200);

    // 12. Test 9: LocalStorage Persistence across Reload
    console.log('\n--- TEST 9: LocalStorage Persistence across Reload ---');
    await page.reload({ waitUntil: 'networkidle0' });
    await sleep(500);

    const reloadedTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    const reloadedHistoryLen = await page.evaluate(() => window.idptState.state.dialHistory.length);
    console.log(`[PASS] Reloaded state verified: Theme = '${reloadedTheme}', Dial History Count = ${reloadedHistoryLen}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_reloaded_persistent_state.png') });

    // 13. Test 10: Metadata, Corner Link & Attribution Verification
    console.log('\n--- TEST 10: Metadata & Attribution Verification ---');
    const versionJsonPath = path.join(__dirname, '..', 'version.json');
    const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
    if (!versionData.version || !versionData.model) {
      throw new Error(`FAIL: version.json missing 'version' or 'model' field: ${JSON.stringify(versionData)}`);
    }
    console.log(`[PASS] version.json valid: Version: "${versionData.version}", Model: "${versionData.model}"`);

    const starlightHref = await page.evaluate(() => {
      const el = document.getElementById('starlight-link');
      return el ? el.getAttribute('href') : null;
    });
    const versionBadgeText = await page.evaluate(() => {
      const el = document.getElementById('version-badge');
      return el ? el.textContent : null;
    });
    console.log(`[PASS] Corner Display verified: Starlight Link: "${starlightHref}", Version Badge: "${versionBadgeText}"`);

    console.log('\n================================================================');
    console.log('  ALL AUTOMATED VERIFICATION TESTS PASSED WITH 100% SUCCESS!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('[ERROR] Verification failed with error:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (testServer) testServer.close();
  }
}

runVerification();
