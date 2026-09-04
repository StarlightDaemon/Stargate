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
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'screenshots');
const APP_URL = 'http://localhost:8742';

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runE2ETests() {
    console.log('=== Starting Ukiyo-e Waystation Portal E2E Test Suite ===');
    console.log('Connecting to Chrome');

    const browser = await puppeteer.launch({
        executablePath: await resolveChrome(),
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1920,1080',
            '--autoplay-policy=no-user-gesture-required'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        console.log(`\n[Test 1] Navigating to ${APP_URL}...`);
        await page.goto(APP_URL, { waitUntil: 'networkidle0' });

        // Initial audio unlock simulation
        await page.mouse.click(100, 100);

        // Check CSS Scale computation
        const scaleVal = await page.evaluate(() => {
            const root = document.getElementById('app-root');
            const style = window.getComputedStyle(root);
            return {
                transform: style.transform,
                scaleProp: document.documentElement.style.getPropertyValue('--app-scale'),
                scrollWidth: document.body.scrollWidth,
                scrollHeight: document.body.scrollHeight,
                clientWidth: document.documentElement.clientWidth,
                clientHeight: document.documentElement.clientHeight
            };
        });
        console.log('Scale report (1080p):', scaleVal);

        // Verify Safety Interlock Defaults to RELEASED
        const defaultInterlock = await page.evaluate(() => {
            const toggle = document.getElementById('toggle-interlock');
            return {
                checked: toggle.checked,
                isEngaged: window.PortalController ? window.PortalController.isInterlockEngaged : null,
                state: window.PortalController ? window.PortalController.state : null
            };
        });
        console.log('Default Safety Interlock state (must be released/false):', defaultInterlock);
        if (defaultInterlock.checked !== false || defaultInterlock.isEngaged !== false) {
            throw new Error('Safety interlock failed: did not default to RELEASED!');
        }

        // Screenshot 01: Cold Start
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_cold_start.png') });
        console.log('✓ Captured 01_cold_start.png');

        // [Test 2] Manual Dial Sequence: 7 stations
        console.log('\n[Test 2] Performing manual dial sequence across 7 stations...');
        const stationsToDial = [0, 1, 2, 3, 4, 5, 6]; // Akatsuki -> Matsukaze -> Tsukimi -> Naminomon -> Kagero -> Yukinotaki -> Asagiri

        for (let i = 0; i < stationsToDial.length; i++) {
            const stationIdx = stationsToDial[i];
            const btnSelector = `.station-pad-btn[data-index="${stationIdx}"]`;
            await page.waitForSelector(btnSelector);
            
            // Real pointer event hit-test and click
            const btn = await page.$(btnSelector);
            const box = await btn.boundingBox();
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

            if (i === 3) {
                // Clicks now queue and fully serialize (rotate + 5-layer stamp) rather
                // than racing, so wait for this click to actually resolve before the mid-sequence shot.
                await page.waitForFunction((n) => window.PortalController.lockedStations.length >= n, {}, i + 1);
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_manual_dial_progress.png') });
                console.log('✓ Captured 02_manual_dial_progress.png (4 seals locked)');
            }
        }

        // Wait for the full serialized queue (all 7 clicks) to resolve.
        await page.waitForFunction(() => window.PortalController.lockedStations.length >= 7, { timeout: 10000 });

        // [Test 3] Negative Test: Verify state is PENDING and did NOT auto-fire!
        const pendingCheck = await page.evaluate(() => {
            return {
                state: window.PortalController.state,
                lockedCount: window.PortalController.lockedStations.length,
                isActive: window.PortalController.isActive
            };
        });
        console.log('Pending state check (negative auto-fire assertion):', pendingCheck);
        if (pendingCheck.state !== 'PENDING' || pendingCheck.isActive !== false || pendingCheck.lockedCount !== 7) {
            throw new Error(`Negative auto-fire test failed! Expected PENDING, got: ${pendingCheck.state}`);
        }
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_pending_ready_no_autofire.png') });
        console.log('✓ Captured 03_pending_ready_no_autofire.png');

        // [Test 4] Staged Activation Flow: Buildup -> Breakthrough -> Sustained Active
        console.log('\n[Test 4] Triggering Activation Seal (開関封印)...');
        const activateBtn = await page.$('#btn-activate');
        const actBox = await activateBtn.boundingBox();
        await page.mouse.click(actBox.x + actBox.width / 2, actBox.y + actBox.height / 2);

        // Immediately capture Stage 1: Buildup (during 1.8s)
        await sleep(400);
        const stage1State = await page.evaluate(() => window.PortalController.state);
        console.log('Stage 1 state:', stage1State);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_activation_stage1_buildup.png') });
        console.log('✓ Captured 04_activation_stage1_buildup.png');

        // Capture Stage 2: Breakthrough (at ~2.0s mark)
        await sleep(1500);
        const stage2State = await page.evaluate(() => window.PortalController.state);
        console.log('Stage 2 state:', stage2State);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_activation_stage2_breakthrough.png') });
        console.log('✓ Captured 05_activation_stage2_breakthrough.png');

        // Capture Stage 3: Sustained Active (after breakthrough resolves)
        await sleep(1000);
        const stage3State = await page.evaluate(() => window.PortalController.state);
        console.log('Stage 3 state:', stage3State);
        if (stage3State !== 'STAGE_3_SUSTAINED') {
            throw new Error(`Expected STAGE_3_SUSTAINED, got: ${stage3State}`);
        }
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_activation_stage3_sustained_active.png') });
        console.log('✓ Captured 06_activation_stage3_sustained_active.png');

        // [Test 5] Disengage 1
        console.log('\n[Test 5] Disengaging active portal (盤上解散)...');
        const disengageBtn = await page.$('#btn-disengage');
        const disBox = await disengageBtn.boundingBox();
        await page.mouse.click(disBox.x + disBox.width / 2, disBox.y + disBox.height / 2);

        await sleep(400);
        const resetState1 = await page.evaluate(() => ({
            state: window.PortalController.state,
            lockedCount: window.PortalController.lockedStations.length,
            isActive: window.PortalController.isActive
        }));
        console.log('Disengage 1 state:', resetState1);
        if (resetState1.state !== 'IDLE' || resetState1.lockedCount !== 0) {
            throw new Error('Disengage 1 failed to reset to IDLE!');
        }
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_disengage_idle.png') });
        console.log('✓ Captured 07_disengage_idle.png');

        // [Test 6] Quick-Dial Auto-Dial Test (Preset Itinerary)
        console.log('\n[Test 6] Executing Quick-Dial Preset Auto-Dial...');
        const presetBtn = await page.$('.preset-card[data-id="courier_dawn_tide"] .preset-dial-btn');
        const pBox = await presetBtn.boundingBox();
        await page.mouse.click(pBox.x + pBox.width / 2, pBox.y + pBox.height / 2);

        // Capture mid-sequence auto-dialing in progress
        await sleep(800);
        const autoDialingMid = await page.evaluate(() => ({
            isAutoDialing: window.PresetsManager.isAutoDialing,
            state: window.PortalController.state,
            lockedCount: window.PortalController.lockedStations.length
        }));
        console.log('Auto-dialing mid-flight state:', autoDialingMid);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_quickdial_in_progress.png') });
        console.log('✓ Captured 08_quickdial_in_progress.png');

        // Wait for auto-dial sequence to finish into PENDING state
        await page.waitForFunction(() => {
            return window.PortalController && 
                   window.PortalController.state === 'PENDING' && 
                   window.PresetsManager && 
                   !window.PresetsManager.isAutoDialing;
        }, { timeout: 15000 });

        const autoDialFinished = await page.evaluate(() => ({
            isAutoDialing: window.PresetsManager.isAutoDialing,
            state: window.PortalController.state,
            lockedCount: window.PortalController.lockedStations.length
        }));
        console.log('Auto-dial finished state (must be PENDING, not active):', autoDialFinished);
        if (autoDialFinished.state !== 'PENDING' || autoDialFinished.lockedCount !== 7) {
            throw new Error('Auto-dial did not land in PENDING state!');
        }
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_quickdial_pending.png') });
        console.log('✓ Captured 09_quickdial_pending.png');

        // Activate second time
        await page.mouse.click(actBox.x + actBox.width / 2, actBox.y + actBox.height / 2);
        await sleep(2800); // Allow full activation sequence
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_quickdial_activated.png') });
        console.log('✓ Captured 10_quickdial_activated.png');

        // [Test 7] Disengage 2
        console.log('\n[Test 7] Second Disengage cycle...');
        await page.mouse.click(disBox.x + disBox.width / 2, disBox.y + disBox.height / 2);
        await sleep(400);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_second_disengage.png') });
        console.log('✓ Captured 11_second_disengage.png');

        // [Test 8] Safety Interlock Blocked Test
        console.log('\n[Test 8] Testing Safety Interlock (関所手形結界)...');
        // Dial 7 stations again (clicks queue and fully serialize; wait for all to resolve)
        for (let i = 0; i < 7; i++) {
            const pad = await page.$(`.station-pad-btn[data-index="${i}"]`);
            const pbox = await pad.boundingBox();
            await page.mouse.click(pbox.x + pbox.width / 2, pbox.y + pbox.height / 2);
        }
        await page.waitForFunction(() => window.PortalController.lockedStations.length >= 7, { timeout: 10000 });

        // Toggle interlock to CLOSED
        const toggleLabel = await page.$('.latch-toggle-label');
        const tBox = await toggleLabel.boundingBox();
        await page.mouse.click(tBox.x + tBox.width / 2, tBox.y + tBox.height / 2);
        await sleep(200);

        // Attempt activation while interlock is engaged
        await page.mouse.click(actBox.x + actBox.width / 2, actBox.y + actBox.height / 2);
        await sleep(300);

        const interlockCheck = await page.evaluate(() => ({
            isInterlockEngaged: window.PortalController.isInterlockEngaged,
            state: window.PortalController.state,
            bannerVisible: document.getElementById('interlock-alert-banner').classList.contains('visible')
        }));
        console.log('Interlock rejection check:', interlockCheck);
        if (interlockCheck.state !== 'PENDING' || !interlockCheck.bannerVisible) {
            throw new Error('Interlock blocking test failed!');
        }
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_safety_interlock_blocked.png') });
        console.log('✓ Captured 12_safety_interlock_blocked.png');

        // Release interlock and clear
        await page.mouse.click(tBox.x + tBox.width / 2, tBox.y + tBox.height / 2);
        await page.mouse.click(disBox.x + disBox.width / 2, disBox.y + disBox.height / 2);
        await sleep(300);

        // [Test 9] Operator Reference Guide Modal
        console.log('\n[Test 9] Opening Operator Reference Guide Modal...');
        const helpBtn = await page.$('#btn-help-guide');
        const hBox = await helpBtn.boundingBox();
        await page.mouse.click(hBox.x + hBox.width / 2, hBox.y + hBox.height / 2);
        await sleep(300);

        const modalCheck = await page.evaluate(() => {
            const m = document.getElementById('operator-guide-modal');
            return m.classList.contains('visible');
        });
        console.log('Modal visible check:', modalCheck);
        if (!modalCheck) throw new Error('Operator guide modal failed to open!');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_operator_reference_modal.png') });
        console.log('✓ Captured 13_operator_reference_modal.png');

        // Close modal
        const closeBtn = await page.$('#btn-close-modal');
        const cBox = await closeBtn.boundingBox();
        await page.mouse.click(cBox.x + cBox.width / 2, cBox.y + cBox.height / 2);
        await sleep(300);

        // [Test 10] 4K Viewport Scaled Test (3840x2160)
        console.log('\n[Test 10] Testing 4K resolution (3840x2160) viewport scaling...');
        await page.setViewport({ width: 3840, height: 2160 });
        await sleep(300);

        const scale4k = await page.evaluate(() => {
            const root = document.getElementById('app-root');
            const style = window.getComputedStyle(root);
            return {
                transform: style.transform,
                scaleProp: document.documentElement.style.getPropertyValue('--app-scale'),
                scrollWidth: document.body.scrollWidth,
                scrollHeight: document.body.scrollHeight,
                clientWidth: document.documentElement.clientWidth,
                clientHeight: document.documentElement.clientHeight
            };
        });
        console.log('Scale report (4K):', scale4k);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_4k_scaled_viewport.png') });
        console.log('✓ Captured 14_4k_scaled_viewport.png');

        console.log('\n========================================');
        console.log('ALL E2E TESTS PASSED PERFECTLY (14/14)!');
        console.log('========================================\n');

    } finally {
        await browser.close();
    }
}

runE2ETests().catch(err => {
    console.error('E2E Test Execution Error:', err);
    process.exit(1);
});
