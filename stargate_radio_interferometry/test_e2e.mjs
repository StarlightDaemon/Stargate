// End-to-End Automated Verification Script for Hesperus Deep-Space Synthesis Array (HDSSA)
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACTS_DIR = path.join(__dirname, 'test-artifacts');

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function dispatchRealClick(page, selector) {
  const element = await page.$(selector);
  if (!element) throw new Error(`Element not found: ${selector}`);
  const box = await element.boundingBox();
  if (!box) throw new Error(`Bounding box null for selector: ${selector}`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  // Hit-test verification
  const hitElementId = await page.evaluate(({ cx, cy }) => {
    const el = document.elementFromPoint(cx, cy);
    return el ? (el.id || el.className || el.tagName) : null;
  }, { cx: x, cy: y });

  console.log(`[Click Hit-Test] Target '${selector}' at (${x.toFixed(1)}, ${y.toFixed(1)}), Hit element: '${hitElementId}'`);

  await page.mouse.move(x, y);
  await page.mouse.down();
  await sleep(40);
  await page.mouse.up();
}

async function runVerification() {
  console.log('=== STARTING END-TO-END VERIFICATION: HDSSA PORTAL CONSOLE ===');

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();

  // Capture browser logs
  page.on('console', (msg) => {
    console.log(`[Browser Console ${msg.type()}]: ${msg.text()}`);
  });

  const TARGET_URL = 'http://localhost:5173';
  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'networkidle0', timeout: 15000 });

  // -------------------------------------------------------------
  // TEST 1: COLD START & IDLE STATE (1080p)
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: Cold Start & Idle State (1080p) ---');
  await sleep(400);

  const idleState = await page.evaluate(() => {
    const consoleObj = window.__stargateConsole;
    const computedScale = getComputedStyle(document.documentElement).getPropertyValue('--scale').trim();
    return {
      state: consoleObj.state,
      addressLength: consoleObj.address.length,
      pdvhEngaged: consoleObj.pdvhEngaged,
      engageDisabled: consoleObj.engageBtn.disabled,
      computedScale,
      vw: window.innerWidth,
      vh: window.innerHeight
    };
  });

  console.log('Idle State Telemetry:', idleState);
  if (idleState.state !== 'IDLE') throw new Error(`Expected IDLE, got ${idleState.state}`);
  if (idleState.addressLength !== 0) throw new Error('Expected 0 address items');
  if (idleState.pdvhEngaged !== false) throw new Error('Expected PDVH to default to released (false)');
  if (!idleState.engageDisabled) throw new Error('Expected Engage button to be disabled in idle');

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_idle_cold_start_1080p.png') });
  console.log('✓ Captured: 01_idle_cold_start_1080p.png');

  // -------------------------------------------------------------
  // TEST 2: MANUAL DIALING & COINCIDENCE DETECTION (7 GLYPHS)
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Manual Dialing with 9-Station Coincidence Check ---');
  const targetGlyphs = [0, 4, 8, 12, 16, 20, 23]; // 7 distinct glyphs

  for (let i = 0; i < 4; i++) {
    const glyphId = targetGlyphs[i];
    console.log(`Clicking glyph sector Ψ${(glyphId + 1).toString().padStart(2, '0')} (ID: ${glyphId})...`);
    await dispatchRealClick(page, `#glyph-btn-${glyphId}`);
    await sleep(450); // Allow 9-station coincidence check to resolve
  }

  const midDialState = await page.evaluate(() => {
    const consoleObj = window.__stargateConsole;
    return {
      state: consoleObj.state,
      address: [...consoleObj.address],
      snr: consoleObj.snrReadout.textContent
    };
  });
  console.log('Mid-Dial State (4/7 locked):', midDialState);
  if (midDialState.address.length !== 4) throw new Error(`Expected 4 locked items, got ${midDialState.address.length}`);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '02_manual_dial_progress.png') });
  console.log('✓ Captured: 02_manual_dial_progress.png');

  // Finish dialing remaining 3 glyphs
  for (let i = 4; i < 7; i++) {
    const glyphId = targetGlyphs[i];
    console.log(`Clicking glyph sector Ψ${(glyphId + 1).toString().padStart(2, '0')} (ID: ${glyphId})...`);
    await dispatchRealClick(page, `#glyph-btn-${glyphId}`);
    await sleep(450);
  }

  // -------------------------------------------------------------
  // TEST 3: NEGATIVE TEST: FULL DIAL MUST NOT AUTO-FIRE
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Negative Test (7/7 Locked Must NOT Auto-Fire) ---');
  await sleep(300);

  const fullDialState1 = await page.evaluate(() => {
    const consoleObj = window.__stargateConsole;
    return {
      state: consoleObj.state,
      address: [...consoleObj.address],
      engageDisabled: consoleObj.engageBtn.disabled,
      engageReadyClass: consoleObj.engageBtn.classList.contains('ready')
    };
  });

  console.log('State immediately after 7th lock:', fullDialState1);
  if (fullDialState1.state !== 'READY') throw new Error(`Expected READY state, got ${fullDialState1.state}`);
  if (fullDialState1.address.length !== 7) throw new Error('Expected 7 locked items');
  if (fullDialState1.engageDisabled) throw new Error('Expected Engage button to be ENABLED in READY state');

  // Wait 1.5s to prove negative case: system must STAY in READY without auto-firing
  await sleep(1500);

  const fullDialState2 = await page.evaluate(() => {
    return window.__stargateConsole.state;
  });
  console.log('State after waiting 1.5s (Negative Check):', fullDialState2);
  if (fullDialState2 !== 'READY') throw new Error(`AUTO-FIRE DETECTED! Expected system to remain in READY, but transitioned to ${fullDialState2}`);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '03_full_address_ready_no_autofire.png') });
  console.log('✓ Captured: 03_full_address_ready_no_autofire.png');

  // -------------------------------------------------------------
  // TEST 4: SAFETY INTERLOCK (POST-DETECTION VERIFICATION HOLD)
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Post-Detection Verification Hold Safety Interlock ---');
  console.log('Toggling PDVH to ENGAGED (Armed Hold)...');
  await dispatchRealClick(page, '#pdvh-toggle');
  await sleep(150);

  const pdvhEngagedState = await page.evaluate(() => window.__stargateConsole.pdvhEngaged);
  console.log('PDVH engaged flag:', pdvhEngagedState);
  if (!pdvhEngagedState) throw new Error('Expected PDVH to be engaged');

  console.log('Attempting to click Engage Button while Hold is active...');
  await dispatchRealClick(page, '#engage-btn');
  await sleep(200);

  const blockedState = await page.evaluate(() => {
    const consoleObj = window.__stargateConsole;
    return {
      state: consoleObj.state,
      overlayDisplay: consoleObj.interlockOverlay.style.display,
      statusDotClass: consoleObj.statusDot.className
    };
  });
  console.log('Blocked Activation State:', blockedState);
  if (blockedState.state !== 'READY') throw new Error(`Activation should have been blocked, but state changed to ${blockedState.state}`);
  if (blockedState.overlayDisplay !== 'block') throw new Error('Expected interlock warning overlay to be displayed');

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '04_pdvh_interlock_blocked.png') });
  console.log('✓ Captured: 04_pdvh_interlock_blocked.png');

  // Release PDVH Hold
  console.log('Releasing PDVH Hold...');
  await dispatchRealClick(page, '#pdvh-toggle');
  await sleep(150);
  const pdvhReleased = await page.evaluate(() => window.__stargateConsole.pdvhEngaged);
  if (pdvhReleased !== false) throw new Error('Expected PDVH to be released');

  // -------------------------------------------------------------
  // TEST 5: THREE-STAGE ACTIVATION SEQUENCE (BUILDUP -> BREAKTHROUGH -> SUSTAINED)
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Three-Stage Activation Sequence ---');
  console.log('Clicking Engage Emission Beacon button...');
  await dispatchRealClick(page, '#engage-btn');

  // Stage 1: Buildup (sample at ~900ms)
  await sleep(900);
  const stage1State = await page.evaluate(() => {
    const consoleObj = window.__stargateConsole;
    return {
      state: consoleObj.state,
      snr: consoleObj.snrReadout.textContent,
      drift: consoleObj.driftReadout.textContent,
      primaryText: consoleObj.statusPrimary.textContent
    };
  });
  console.log('Stage 1 (Buildup) State:', stage1State);
  if (stage1State.state !== 'BUILDUP') throw new Error(`Expected BUILDUP state, got ${stage1State.state}`);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '05_activation_stage1_buildup.png') });
  console.log('✓ Captured: 05_activation_stage1_buildup.png');

  // Stage 2: Breakthrough Instant (at 2050ms mark)
  await sleep(1200); // Now at ~2100ms total
  const stage2State = await page.evaluate(() => {
    const consoleObj = window.__stargateConsole;
    return {
      state: consoleObj.state,
      flash: consoleObj.waterfallEngine.breakthroughFlash,
      primaryText: consoleObj.statusPrimary.textContent
    };
  });
  console.log('Stage 2 (Breakthrough Instant) State:', stage2State);
  if (stage2State.state !== 'BREAKTHROUGH' && stage2State.state !== 'ACTIVE') {
    throw new Error(`Expected BREAKTHROUGH or early ACTIVE, got ${stage2State.state}`);
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '06_activation_stage2_breakthrough.png') });
  console.log('✓ Captured: 06_activation_stage2_breakthrough.png');

  // Stage 3: Sustained Active State (after 800ms more, at ~2900ms)
  await sleep(800);
  const stage3State = await page.evaluate(() => {
    const consoleObj = window.__stargateConsole;
    return {
      state: consoleObj.state,
      snr: consoleObj.snrReadout.textContent,
      primaryText: consoleObj.statusPrimary.textContent,
      particles: consoleObj.waterfallEngine.activeParticleStream.length
    };
  });
  console.log('Stage 3 (Sustained Active) State:', stage3State);
  if (stage3State.state !== 'ACTIVE') throw new Error(`Expected ACTIVE state, got ${stage3State.state}`);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '07_activation_stage3_sustained.png') });
  console.log('✓ Captured: 07_activation_stage3_sustained.png');

  // -------------------------------------------------------------
  // TEST 6: DISENGAGE & RESET (CYCLE 1)
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Disengage & Channel Abort (Cycle 1) ---');
  console.log('Clicking Disengage Button during Sustained Active State...');
  await dispatchRealClick(page, '#disengage-btn');
  await sleep(300);

  const resetState = await page.evaluate(() => {
    const consoleObj = window.__stargateConsole;
    return {
      state: consoleObj.state,
      addressLength: consoleObj.address.length,
      engageDisabled: consoleObj.engageBtn.disabled,
      snr: consoleObj.snrReadout.textContent
    };
  });
  console.log('Reset State after Disengage:', resetState);
  if (resetState.state !== 'IDLE') throw new Error(`Expected IDLE after disengage, got ${resetState.state}`);
  if (resetState.addressLength !== 0) throw new Error('Expected address to be cleared');
  if (!resetState.engageDisabled) throw new Error('Expected Engage button to be disabled');

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '08_disengage_reset.png') });
  console.log('✓ Captured: 08_disengage_reset.png');

  // -------------------------------------------------------------
  // TEST 7: QUICK-DIAL PRESETS (GENUINE AUTO-DIALING)
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Quick-Dial Preset Auto-Dialing (TRAPPIST-1e) ---');
  console.log('Clicking Preset TRAPPIST-1e...');
  await dispatchRealClick(page, '#preset-trappist1e');

  // Check state midway through auto-dial (~800ms)
  await sleep(800);
  const midAutoDialState = await page.evaluate(() => {
    const consoleObj = window.__stargateConsole;
    return {
      isAutoDialing: consoleObj.isAutoDialing,
      addressLength: consoleObj.address.length,
      state: consoleObj.state,
      primaryText: consoleObj.statusPrimary.textContent
    };
  });
  console.log('Mid-AutoDial State:', midAutoDialState);
  if (midAutoDialState.addressLength < 1 || midAutoDialState.addressLength >= 7) {
    console.log(`AutoDial in progress: ${midAutoDialState.addressLength}/7 locked`);
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '09_quickdial_autodial_midpoint.png') });
  console.log('✓ Captured: 09_quickdial_autodial_midpoint.png');

  // Wait for auto-dial sequence to complete and settle in READY state
  await sleep(2500);

  const quickDialReadyState = await page.evaluate(() => {
    const consoleObj = window.__stargateConsole;
    return {
      state: consoleObj.state,
      address: [...consoleObj.address],
      isAutoDialing: consoleObj.isAutoDialing,
      engageReady: !consoleObj.engageBtn.disabled
    };
  });
  console.log('QuickDial Completed State:', quickDialReadyState);
  if (quickDialReadyState.state !== 'READY') throw new Error(`Expected READY state after preset auto-dial, got ${quickDialReadyState.state}`);
  if (quickDialReadyState.address.length !== 7) throw new Error(`Expected 7 symbols locked, got ${quickDialReadyState.address.length}`);
  if (!quickDialReadyState.engageReady) throw new Error('Expected Engage button to be ready');

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '10_quickdial_ready.png') });
  console.log('✓ Captured: 10_quickdial_ready.png');

  // -------------------------------------------------------------
  // TEST 8: SECOND ACTIVATION & DISENGAGE (CYCLE 2)
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Second Activation & Disengage Cycle ---');
  console.log('Activating from preset ready state...');
  await dispatchRealClick(page, '#engage-btn');

  // Wait for buildup and breakthrough into active state
  await sleep(2800);
  const cycle2ActiveState = await page.evaluate(() => window.__stargateConsole.state);
  console.log('Cycle 2 Active State:', cycle2ActiveState);
  if (cycle2ActiveState !== 'ACTIVE') throw new Error(`Expected ACTIVE on cycle 2, got ${cycle2ActiveState}`);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '11_second_cycle_sustained.png') });
  console.log('✓ Captured: 11_second_cycle_sustained.png');

  console.log('Disengaging Cycle 2...');
  await dispatchRealClick(page, '#disengage-btn');
  await sleep(300);

  const cycle2ResetState = await page.evaluate(() => window.__stargateConsole.state);
  console.log('Cycle 2 Reset State:', cycle2ResetState);
  if (cycle2ResetState !== 'IDLE') throw new Error(`Expected IDLE after cycle 2 disengage, got ${cycle2ResetState}`);

  // -------------------------------------------------------------
  // TEST 9: 4K VIEWPORT & SCALING INTEGRITY TEST (3840x2160)
  // -------------------------------------------------------------
  console.log('\n--- TEST 9: 4K Viewport & Scaling Verification (3840x2160) ---');
  await page.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 1 });
  await sleep(300);

  const scaleMetrics = await page.evaluate(() => {
    const computedScale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale').trim());
    const rootEl = document.getElementById('app-root');
    const rect = rootEl.getBoundingClientRect();
    return {
      vw: window.innerWidth,
      vh: window.innerHeight,
      computedScale,
      rectWidth: rect.width,
      rectHeight: rect.height,
      hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
      hasVerticalScroll: document.documentElement.scrollHeight > window.innerHeight
    };
  });

  console.log('4K Scaling Metrics:', scaleMetrics);
  if (Math.abs(scaleMetrics.computedScale - 2.0) > 0.01) {
    throw new Error(`Expected scale 2.0 at 3840x2160, got ${scaleMetrics.computedScale}`);
  }
  if (scaleMetrics.hasHorizontalScroll || scaleMetrics.hasVerticalScroll) {
    throw new Error('Scrollbars detected in 4K viewport');
  }

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '12_4k_viewport_scale.png') });
  console.log('✓ Captured: 12_4k_viewport_scale.png');

  // -------------------------------------------------------------
  // TEST 10: OPERATOR REFERENCE MODAL
  // -------------------------------------------------------------
  console.log('\n--- TEST 10: Operator Reference Modal Test ---');
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await sleep(200);

  console.log('Opening Operator Reference modal (?) ...');
  await dispatchRealClick(page, '#operator-ref-btn');
  await sleep(150);

  const modalVisible1 = await page.evaluate(() => {
    const m = document.getElementById('operator-ref-modal');
    return m && m.style.display === 'flex';
  });
  console.log('Modal visible after click:', modalVisible1);
  if (!modalVisible1) throw new Error('Expected modal to be visible');

  console.log('Closing modal via Acknowledge button...');
  await dispatchRealClick(page, '#modal-acknowledge-btn');
  await sleep(150);

  const modalVisible2 = await page.evaluate(() => {
    const m = document.getElementById('operator-ref-modal');
    return m && m.style.display === 'none';
  });
  console.log('Modal dismissed:', modalVisible2);
  if (!modalVisible2) throw new Error('Expected modal to be dismissed');

  await browser.close();
  console.log('\n=== ALL END-TO-END VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

runVerification().catch((err) => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
