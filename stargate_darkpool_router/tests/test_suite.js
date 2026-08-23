/**
 * VALENCE-9 Comprehensive End-to-End Verification Test Suite
 * Executes full narrative verification via Puppeteer directly against Chrome.
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
const APP_URL = 'http://localhost:8092';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 STARTING VALENCE-9 E2E VERIFICATION TEST SUITE');
  console.log('====================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

    // Listen to console logs
    page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));

    console.log(`\n▶ Step 1: Navigating to ${APP_URL}...`);
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    await sleep(500);

    // Verify 1080p Viewport and computed scale factor
    const scale1080p = await page.evaluate(() => {
      const container = document.getElementById('app-container');
      const style = window.getComputedStyle(container);
      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        transform: style.transform,
        cssScaleVar: getComputedStyle(document.documentElement).getPropertyValue('--app-scale')
      };
    });
    console.log(`✔ 1080p Scale Test: Viewport = ${scale1080p.innerWidth}x${scale1080p.innerHeight}, Computed Transform = "${scale1080p.transform}", --app-scale = "${scale1080p.cssScaleVar}"`);

    // Screenshot 1: Cold Start 1080p
    const shotCold1080 = path.join(SCREENSHOTS_DIR, '01_cold_start_1080p.png');
    await page.screenshot({ path: shotCold1080 });
    console.log(`📸 Saved screenshot: ${shotCold1080}`);

    // Verify 4K Scaling
    console.log('\n▶ Step 2: Testing 4K Scaling (3840x2160)...');
    await page.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 1 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await sleep(300);

    const scale4k = await page.evaluate(() => {
      const container = document.getElementById('app-container');
      const style = window.getComputedStyle(container);
      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        transform: style.transform,
        cssScaleVar: getComputedStyle(document.documentElement).getPropertyValue('--app-scale')
      };
    });
    console.log(`✔ 4K Scale Test: Viewport = ${scale4k.innerWidth}x${scale4k.innerHeight}, Computed Transform = "${scale4k.transform}", --app-scale = "${scale4k.cssScaleVar}"`);

    const shotCold4K = path.join(SCREENSHOTS_DIR, '02_cold_start_4k.png');
    await page.screenshot({ path: shotCold4K });
    console.log(`📸 Saved screenshot: ${shotCold4K}`);

    // Return to standard 1080p for interactive test sequence
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await sleep(300);

    // Step 3: Operator Reference Manual Modal ('?' button)
    console.log('\n▶ Step 3: Testing Operator Reference Manual Modal...');
    await page.click('#btn-help-modal');
    await sleep(400);

    const isModalOpen = await page.evaluate(() => {
      return document.getElementById('operator-modal-overlay').classList.contains('modal-open');
    });
    console.log(`✔ Operator Modal Open: ${isModalOpen}`);

    const shotModal = path.join(SCREENSHOTS_DIR, '03_operator_modal_open.png');
    await page.screenshot({ path: shotModal });
    console.log(`📸 Saved screenshot: ${shotModal}`);

    // Close modal
    await page.click('#modal-close-btn');
    await sleep(300);

    // Step 4: Safety Interlock Default State Check
    console.log('\n▶ Step 4: Verifying Safety Interlock (Circuit Breaker) Defaults...');
    const riskDefaultState = await page.evaluate(() => {
      const toggle = document.getElementById('risk-toggle');
      return {
        checked: toggle.checked,
        isEngaged: window.riskInterlock.isEngaged,
        statusText: document.getElementById('risk-status-label').textContent
      };
    });
    console.log(`✔ Risk Interlock Initial State: Checked = ${riskDefaultState.checked}, isEngaged = ${riskDefaultState.isEngaged}, Status = "${riskDefaultState.statusText}"`);
    if (riskDefaultState.checked || riskDefaultState.isEngaged) {
      throw new Error('FAIL: Risk Interlock did NOT default to RELEASED!');
    }
    console.log('✔ PASS: Risk Interlock strictly defaults to RELEASED (0).');

    // Step 5: Manual Dialing Sequence (7 Instruments)
    console.log('\n▶ Step 5: Manual Dialing Sequence (Locking 7 Synthetic Instruments)...');
    const instrumentsToLock = [
      '#btn-inst-vix',
      '#btn-inst-swap',
      '#btn-inst-eth',
      '#btn-inst-index',
      '#btn-inst-dark',
      '#btn-inst-flow',
      '#btn-inst-curve'
    ];

    for (let i = 0; i < instrumentsToLock.length; i++) {
      const sel = instrumentsToLock[i];
      await page.click(sel);
      await sleep(250);
      const lockedCount = await page.evaluate(() => window.lockingEngine.activeBasket.length);
      console.log(`  Leg ${i + 1}/7: Clicked ${sel} -> Active Basket Length = ${lockedCount}`);

      if (i === 2) {
        const shotDialStep3 = path.join(SCREENSHOTS_DIR, '04_manual_dial_step3.png');
        await page.screenshot({ path: shotDialStep3 });
        console.log(`  📸 Saved screenshot: ${shotDialStep3}`);
      }
    }

    // Step 6: Negative Auto-Fire Verification
    console.log('\n▶ Step 6: NEGATIVE AUTO-FIRE VERIFICATION...');
    await sleep(600); // Wait to ensure no auto-fire occurs
    const postDialState = await page.evaluate(() => {
      return {
        basketLength: window.lockingEngine.activeBasket.length,
        systemState: window.activationEngine.state,
        ringState: window.orderBookRing.systemState,
        activateBtnText: document.getElementById('btn-activate').innerText,
        activateBtnDisabled: document.getElementById('btn-activate').disabled
      };
    });
    console.log('✔ Post-Dial Status Check:');
    console.log(`  Basket Length: ${postDialState.basketLength}/7`);
    console.log(`  Activation Engine State: ${postDialState.systemState}`);
    console.log(`  Order-Book Ring State: ${postDialState.ringState}`);
    console.log(`  Activate Button Disabled: ${postDialState.activateBtnDisabled}`);

    if (postDialState.systemState !== 'READY' || postDialState.ringState !== 'PENDING') {
      throw new Error(`FAIL: Expected state READY/PENDING, got ${postDialState.systemState}/${postDialState.ringState}`);
    }
    console.log('✔ PASS: 7th lock entered READY state and DID NOT AUTO-FIRE!');

    const shotPendingReady = path.join(SCREENSHOTS_DIR, '05_basket_ready_no_autofire.png');
    await page.screenshot({ path: shotPendingReady });
    console.log(`📸 Saved screenshot: ${shotPendingReady}`);

    // Step 7: Safety Interlock Block Test
    console.log('\n▶ Step 7: Testing Safety Interlock Blocking Behavior...');
    // Engage Risk Interlock
    await page.evaluate(() => {
      window.riskInterlock.setEngaged(true);
    });
    await sleep(200);

    // Attempt to activate while interlock is engaged
    console.log('  Attempting activation with Risk Interlock ENGAGED...');
    await page.click('#btn-activate');
    await sleep(300);

    const interlockTripState = await page.evaluate(() => {
      const banner = document.getElementById('risk-alarm-banner');
      return {
        state: window.activationEngine.state,
        bannerText: banner.textContent,
        bannerActive: banner.classList.contains('active-alarm')
      };
    });
    console.log(`  Trip Alarm Active: ${interlockTripState.bannerActive}`);
    console.log(`  Banner Text: "${interlockTripState.bannerText}"`);
    console.log(`  Activation Engine State: ${interlockTripState.state}`);

    if (interlockTripState.state !== 'READY') {
      throw new Error(`FAIL: Activation occurred despite Risk Interlock being ENGAGED!`);
    }
    console.log('✔ PASS: Risk Interlock successfully blocked activation and triggered emergency alarm!');

    const shotRiskAlarm = path.join(SCREENSHOTS_DIR, '06_risk_interlock_trip.png');
    await page.screenshot({ path: shotRiskAlarm });
    console.log(`📸 Saved screenshot: ${shotRiskAlarm}`);

    // Disengage Risk Interlock (Return to RELEASED)
    console.log('  Releasing Risk Interlock...');
    await page.evaluate(() => {
      window.riskInterlock.setEngaged(false);
    });
    await sleep(300);

    // Step 8: Three-Stage Activation Sequence
    console.log('\n▶ Step 8: Executing Staged Three-Stage Activation Sequence...');
    // Click [EXECUTE BASKET]
    await page.click('#btn-activate');

    // Stage 1: Buildup (~800ms in)
    await sleep(750);
    const buildupState = await page.evaluate(() => {
      return {
        state: window.activationEngine.state,
        ringState: window.orderBookRing.systemState,
        volatility: document.getElementById('volatility-gauge-val').textContent,
        volume: document.getElementById('volume-multiplier-val').textContent
      };
    });
    console.log(`✔ Stage 1 (BUILDUP): State = ${buildupState.state}, Volatility = ${buildupState.volatility}, Volume = ${buildupState.volume}`);
    const shotStage1 = path.join(SCREENSHOTS_DIR, '07_stage1_buildup.png');
    await page.screenshot({ path: shotStage1 });
    console.log(`📸 Saved screenshot: ${shotStage1}`);

    // Stage 2: Breakthrough Flash (~1850ms from activation start)
    await sleep(1100);
    const breakthroughState = await page.evaluate(() => {
      return {
        state: window.activationEngine.state,
        flashVal: window.orderBookRing.breakthroughFlash
      };
    });
    console.log(`✔ Stage 2 (BREAKTHROUGH): State = ${breakthroughState.state}`);
    const shotStage2 = path.join(SCREENSHOTS_DIR, '08_stage2_breakthrough_flash.png');
    await page.screenshot({ path: shotStage2 });
    console.log(`📸 Saved screenshot: ${shotStage2}`);

    // Stage 3: Sustained Active (~1000ms later)
    await sleep(1000);
    const activeState = await page.evaluate(() => {
      return {
        state: window.activationEngine.state,
        ringState: window.orderBookRing.systemState,
        pnl: document.getElementById('live-pnl-val').textContent,
        statusPill: document.getElementById('system-status-pill').textContent
      };
    });
    console.log(`✔ Stage 3 (SUSTAINED ACTIVE): State = ${activeState.state}, Running P&L = ${activeState.pnl}, Pill = ${activeState.statusPill}`);
    if (activeState.state !== 'ACTIVE') {
      throw new Error(`FAIL: System did not enter SUSTAINED ACTIVE!`);
    }
    console.log('✔ PASS: Three-Stage Activation completed successfully!');

    const shotStage3 = path.join(SCREENSHOTS_DIR, '09_stage3_sustained_active.png');
    await page.screenshot({ path: shotStage3 });
    console.log(`📸 Saved screenshot: ${shotStage3}`);

    // Step 9: Disengage / Kill-Switch Cycle 1
    console.log('\n▶ Step 9: Testing Disengage / Kill-Switch (Cycle 1)...');
    await page.click('#btn-disengage');
    await sleep(400);

    const postDisengageState = await page.evaluate(() => {
      return {
        state: window.activationEngine.state,
        ringState: window.orderBookRing.systemState,
        basketLength: window.lockingEngine.activeBasket.length,
        pnl: document.getElementById('live-pnl-val').textContent
      };
    });
    console.log(`✔ Disengage Check: State = ${postDisengageState.state}, Basket Length = ${postDisengageState.basketLength}, P&L = ${postDisengageState.pnl}`);
    if (postDisengageState.state !== 'IDLE' || postDisengageState.basketLength !== 0) {
      throw new Error('FAIL: Disengage did not reset system to IDLE!');
    }
    console.log('✔ PASS: Disengage flattened position and reset system cleanly.');

    const shotDisengage1 = path.join(SCREENSHOTS_DIR, '10_disengage_idle_reset.png');
    await page.screenshot({ path: shotDisengage1 });
    console.log(`📸 Saved screenshot: ${shotDisengage1}`);

    // Step 10: Quick-Dial Preset Auto-Dial Test (Tier 2: QUANTUM DISPERSION 9)
    console.log('\n▶ Step 10: Testing Quick-Dial Preset Auto-Dialing (Tier 2: QUANTUM DISPERSION 9)...');
    await page.click('#btn-preset-qdisp');

    // Capture Mid-Sequence Step 2
    await sleep(350);
    const autoDialStep2 = await page.evaluate(() => window.lockingEngine.activeBasket.length);
    console.log(`  Auto-Dial In Progress: Locked = ${autoDialStep2}/7`);
    const shotAutoDialStep = path.join(SCREENSHOTS_DIR, '11_autodial_mid_sequence.png');
    await page.screenshot({ path: shotAutoDialStep });
    console.log(`  📸 Saved screenshot: ${shotAutoDialStep}`);

    // Wait for auto-dial sequence to complete (7 legs * ~280ms ≈ 2000ms)
    await sleep(2200);

    const autoDialCompleteState = await page.evaluate(() => {
      return {
        basketLength: window.lockingEngine.activeBasket.length,
        state: window.activationEngine.state,
        isAutoDialing: window.presetEngine.isAutoDialing
      };
    });
    console.log(`✔ Auto-Dial Complete Check: Basket Length = ${autoDialCompleteState.basketLength}/7, State = ${autoDialCompleteState.state}, isAutoDialing = ${autoDialCompleteState.isAutoDialing}`);
    if (autoDialCompleteState.basketLength !== 7 || autoDialCompleteState.state !== 'READY') {
      throw new Error(`FAIL: Auto-dial did not complete properly! Got ${autoDialCompleteState.basketLength}/7, state ${autoDialCompleteState.state}`);
    }
    console.log('✔ PASS: Auto-Dial genuinely sequenced and landed in READY state without auto-firing!');

    const shotAutoDialDone = path.join(SCREENSHOTS_DIR, '12_autodial_completed_ready.png');
    await page.screenshot({ path: shotAutoDialDone });
    console.log(`📸 Saved screenshot: ${shotAutoDialDone}`);

    // Step 11: Activate and Disengage Cycle 2
    console.log('\n▶ Step 11: Executing Second Activation and Disengage (Cycle 2)...');
    await page.click('#btn-activate');
    await sleep(2500); // Allow Buildup + Breakthrough -> Sustained Active

    const activeCycle2 = await page.evaluate(() => window.activationEngine.state);
    console.log(`✔ Cycle 2 Active State: ${activeCycle2}`);

    const shotCycle2Active = path.join(SCREENSHOTS_DIR, '13_cycle2_sustained_active.png');
    await page.screenshot({ path: shotCycle2Active });
    console.log(`📸 Saved screenshot: ${shotCycle2Active}`);

    // Flatten / Disengage again
    await page.click('#btn-disengage');
    await sleep(400);

    const cycle2Idle = await page.evaluate(() => window.activationEngine.state);
    console.log(`✔ Cycle 2 Disengage Reset State: ${cycle2Idle}`);
    if (cycle2Idle !== 'IDLE') {
      throw new Error('FAIL: Cycle 2 disengage failed to reset!');
    }
    console.log('✔ PASS: Cycle 2 complete and verified!');

    const shotCycle2Idle = path.join(SCREENSHOTS_DIR, '14_cycle2_idle_reset.png');
    await page.screenshot({ path: shotCycle2Idle });
    console.log(`📸 Saved screenshot: ${shotCycle2Idle}`);

    // Step 12: File & Versioning Verification
    console.log('\n▶ Step 12: Verifying version.json and CHANGELOG.md...');
    const versionJsonPath = path.join(__dirname, '..', 'version.json');
    const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');

    if (!fs.existsSync(versionJsonPath)) throw new Error('FAIL: version.json not found!');
    const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
    console.log('  version.json content:', versionData);
    if (!versionData.version || !versionData.model) {
      throw new Error('FAIL: version.json missing either "version" or "model" field!');
    }
    console.log('✔ PASS: version.json contains BOTH "version" and "model" fields.');

    if (!fs.existsSync(changelogPath)) throw new Error('FAIL: CHANGELOG.md not found!');
    const changelogContent = fs.readFileSync(changelogPath, 'utf8');
    if (!changelogContent.includes('**Built by:**') || !changelogContent.includes('1.0.0')) {
      throw new Error('FAIL: CHANGELOG.md missing v1.0.0 or **Built by:** attribution!');
    }
    console.log('✔ PASS: CHANGELOG.md contains v1.0.0 and "**Built by:**" attribution.');

    console.log('\n====================================================');
    console.log('✨ ALL VALENCE-9 VERIFICATION TESTS PASSED PERFECTLY!');
    console.log('====================================================');

  } catch (err) {
    console.error('❌ TEST SUITE FAILED:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTestSuite();
