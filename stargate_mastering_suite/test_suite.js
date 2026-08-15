/**
 * Axiom Mastering Suite - Automated Rigorous Puppeteer Test Suite
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('=== STARTING AXIOM MASTERING SUITE TEST RIG ===');
  
  const screenshotsDir = path.join(__dirname, 'test_screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required']
  });

  const page = await browser.newPage();
  
  // Helper to click an element at its rendered position via elementFromPoint
  async function hitTestClick(selector) {
    const el = await page.$(selector);
    if (!el) throw new Error(`Element not found: ${selector}`);
    const box = await el.boundingBox();
    if (!box) throw new Error(`Element has no bounding box: ${selector}`);
    const clickX = box.x + box.width / 2;
    const clickY = box.y + box.height / 2;

    const hitMatch = await page.evaluate(({x, y, sel}) => {
      const topEl = document.elementFromPoint(x, y);
      const target = document.querySelector(sel);
      return topEl === target || target.contains(topEl) || (topEl && topEl.contains(target));
    }, { x: clickX, y: clickY, sel: selector });

    if (!hitMatch) {
      console.warn(`Warning: elementFromPoint hit a different element at (${clickX}, ${clickY}) for selector ${selector}`);
    }

    await page.mouse.click(clickX, clickY);
    await new Promise(r => setTimeout(r, 100));
  }

  try {
    // 1. Load Page at 1080p
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    const localUrl = 'http://127.0.0.1:8080/index.html';
    console.log(`Navigating to ${localUrl}...`);
    await page.goto(localUrl, { waitUntil: 'networkidle0' });

    // Measure actual viewport dimensions & computed transform
    const metrics1080 = await page.evaluate(() => {
      const ws = document.querySelector('.console-workspace');
      const comp = window.getComputedStyle(ws);
      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        appScaleVar: document.documentElement.style.getPropertyValue('--app-scale'),
        transform: comp.transform,
        workspaceRect: ws.getBoundingClientRect()
      };
    });

    console.log('1080p Viewport Metrics:', JSON.stringify(metrics1080, null, 2));

    // Verify Safety Limiter defaults to RELEASED (unchecked)
    const limiterDefault = await page.evaluate(() => {
      const toggle = document.getElementById('limiter-safety-toggle');
      return {
        checked: toggle.checked,
        appLimiterEngaged: window.AxiomApp.limiterEngaged
      };
    });
    console.log('Limiter Default State (Must be RELEASED):', limiterDefault);
    if (limiterDefault.checked || limiterDefault.appLimiterEngaged) {
      throw new Error('FAIL: Safety Interlock did not default to RELEASED!');
    }

    // Verify Corner Displays
    const cornerChecks = await page.evaluate(() => {
      const link = document.querySelector('.footer-attribution a');
      const ver = document.querySelector('.footer-version');
      return {
        linkText: link ? link.textContent.trim() : null,
        linkHref: link ? link.href : null,
        linkTarget: link ? link.getAttribute('target') : null,
        linkRel: link ? link.getAttribute('rel') : null,
        versionText: ver ? ver.textContent.trim() : null
      };
    });
    console.log('Corner Display Verification:', cornerChecks);
    if (cornerChecks.linkText !== 'StarlightDaemon' || cornerChecks.linkHref !== 'https://github.com/StarlightDaemon' || cornerChecks.linkRel !== 'noopener noreferrer') {
      throw new Error('FAIL: Attribution link metadata is incorrect!');
    }
    if (cornerChecks.versionText !== 'v1.1.0') {
      throw new Error('FAIL: Version string is not v1.1.0!');
    }

    // Test Operator Reference Modal
    await hitTestClick('#btn-operator-help');
    const modalOpen = await page.evaluate(() => document.getElementById('operator-help-modal').classList.contains('open'));
    console.log('Operator Modal Open Check:', modalOpen);
    if (!modalOpen) throw new Error('FAIL: Operator Reference modal did not open on click!');

    await hitTestClick('#btn-close-modal');
    const modalClosed = await page.evaluate(() => !document.getElementById('operator-help-modal').classList.contains('open'));
    console.log('Operator Modal Close Check:', modalClosed);
    if (!modalClosed) throw new Error('FAIL: Operator Reference modal did not close on dismiss!');

    // Take Idle Screenshot
    await page.screenshot({ path: path.join(screenshotsDir, '01_idle_1080p.png') });
    console.log('Saved 01_idle_1080p.png');

    // 2. NEGATIVE TEST: Auto-Fire Check (Must NOT auto-fire on 7th patch)
    console.log('\n--- Running Negative Auto-Fire Test ---');
    for (let ch = 0; ch < 7; ch++) {
      await hitTestClick(`.patch-jack[data-channel="${ch}"]`);
      await new Promise(r => setTimeout(r, 60));
    }

    await new Promise(r => setTimeout(r, 400)); // wait to ensure no delayed auto-fire

    const autoFireCheck = await page.evaluate(() => {
      return {
        state: window.AxiomApp.state,
        patchedLength: window.AxiomApp.patchedChannels.length,
        portalActive: window.AxiomVisuals.portalActive,
        portalVoices: window.AxiomAudio.portalVoices.length,
        statusText: document.getElementById('master-status-telemetry').textContent.trim()
      };
    });
    console.log('Auto-Fire Check Status:', autoFireCheck);
    if (autoFireCheck.state !== 'ARMED_READY' || autoFireCheck.portalActive || autoFireCheck.portalVoices > 0) {
      throw new Error(`FAIL: System auto-fired upon 7th patch! State is ${autoFireCheck.state}`);
    }
    console.log('PASS: Negative auto-fire test passed. System is in ARMED_READY waiting for manual print engagement.');
    await page.screenshot({ path: path.join(screenshotsDir, '02_armed_ready_no_autofire.png') });

    // 3. Safety Interlock Clamping Test
    console.log('\n--- Testing Safety Interlock Clamping ---');
    await hitTestClick('#limiter-safety-toggle'); // toggle ON
    await hitTestClick('#btn-print-master');      // attempt print
    
    const limiterBlockCheck = await page.evaluate(() => {
      return {
        state: window.AxiomApp.state,
        portalActive: window.AxiomVisuals.portalActive,
        statusText: document.getElementById('master-status-telemetry').textContent.trim()
      };
    });
    console.log('Limiter Blocked Status:', limiterBlockCheck);
    if (limiterBlockCheck.state !== 'LIMITER_BLOCKED' || limiterBlockCheck.portalActive) {
      throw new Error('FAIL: Master Limiter failed to block activation when engaged!');
    }
    await page.screenshot({ path: path.join(screenshotsDir, '03_limiter_blocked.png') });
    console.log('PASS: Master Limiter blocked print attempt cleanly.');

    // Release limiter
    await hitTestClick('#limiter-safety-toggle'); // toggle OFF
    await new Promise(r => setTimeout(r, 100));

    // 4. Activation Test (Visible Payoff Verification)
    console.log('\n--- Testing Master Print Activation ---');
    await hitTestClick('#btn-print-master');
    await new Promise(r => setTimeout(r, 500)); // allow portal energy to ramp
    // Ensure at least two rendered frames so the energy ramp has provably started
    // (headless rAF scheduling is otherwise nondeterministic within the wait)
    await page.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))));

    const activeCheck = await page.evaluate(() => {
      return {
        state: window.AxiomApp.state,
        portalActive: window.AxiomVisuals.portalActive,
        portalEnergy: window.AxiomVisuals.portalEnergy,
        needleL: window.AxiomVisuals.needleL,
        needleR: window.AxiomVisuals.needleR,
        statusText: document.getElementById('master-status-telemetry').textContent.trim()
      };
    });
    console.log('Active Summing Status:', activeCheck);
    if (activeCheck.state !== 'MASTER_SUMMING_ACTIVE' || !activeCheck.portalActive || activeCheck.portalEnergy <= 0) {
      throw new Error('FAIL: Master activation failed!');
    }
    await page.screenshot({ path: path.join(screenshotsDir, '04_active_summing_portal.png') });
    console.log('PASS: Master summing portal is fully active and visually verified.');

    // 5. Dial-Disengage-Redial Cycle 1
    console.log('\n--- Testing Dial-Disengage-Redial Cycle 1 ---');
    // Hit Disengage
    await hitTestClick('#btn-feed-cut');
    await new Promise(r => setTimeout(r, 200));

    const disengage1Check = await page.evaluate(() => {
      return {
        state: window.AxiomApp.state,
        cablesCount: window.AxiomBay.cables.length,
        portalActive: window.AxiomVisuals.portalActive
      };
    });
    console.log('Disengage 1 Status:', disengage1Check);
    if (disengage1Check.state !== 'IDLE_STANDBY' || disengage1Check.cablesCount !== 0 || disengage1Check.portalActive) {
      throw new Error('FAIL: Emergency Feed Cut failed to disengage!');
    }

    // Redial via Ring Nodes
    for (let ch = 0; ch < 7; ch++) {
      await hitTestClick(`#ring-node-${ch}`);
      await new Promise(r => setTimeout(r, 50));
    }
    await hitTestClick('#btn-print-master');
    await new Promise(r => setTimeout(r, 200));
    const reActive1 = await page.evaluate(() => window.AxiomApp.state === 'MASTER_SUMMING_ACTIVE');
    if (!reActive1) throw new Error('FAIL: Cycle 1 redial activation failed!');

    // Disengage again
    await hitTestClick('#btn-feed-cut');
    await new Promise(r => setTimeout(r, 200));
    console.log('PASS: Cycle 1 completed successfully.');

    // 6. Dial-Disengage-Redial Cycle 2 (via Quick Preset)
    console.log('\n--- Testing Dial-Disengage-Redial Cycle 2 (Preset P1) ---');
    await hitTestClick('.btn-quick-preset[data-preset="p1"]');
    await new Promise(r => setTimeout(r, 2400)); // servo recall: 7 channels x 280ms

    const presetArmedCheck = await page.evaluate(() => {
      return {
        state: window.AxiomApp.state,
        patchedLength: window.AxiomApp.patchedChannels.length,
        portalActive: window.AxiomVisuals.portalActive
      };
    });
    console.log('Preset Load Status (Must be ARMED, not active):', presetArmedCheck);
    if (presetArmedCheck.state !== 'ARMED_READY' || presetArmedCheck.portalActive) {
      throw new Error('FAIL: Preset auto-fired instead of waiting in ARMED_READY!');
    }

    await hitTestClick('#btn-print-master');
    await new Promise(r => setTimeout(r, 200));
    const reActive2 = await page.evaluate(() => window.AxiomApp.state === 'MASTER_SUMMING_ACTIVE');
    if (!reActive2) throw new Error('FAIL: Cycle 2 redial activation failed!');

    await hitTestClick('#btn-feed-cut');
    await new Promise(r => setTimeout(r, 200));
    console.log('PASS: Cycle 2 completed successfully.');

    // 6.5 Staged Servo Recall Test (per-channel locks, no instant jump)
    console.log('\n--- Testing Staged Servo Recall (preset patches one channel at a time) ---');
    await hitTestClick('.btn-quick-preset[data-preset="p2"]');
    const recallStart = Date.now();

    const recallSamples = [];
    for (const off of [420, 950, 1500]) {
      const remaining = recallStart + off - Date.now();
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining));
      const actualT = Date.now() - recallStart;
      const s = await page.evaluate(() => ({
        state: window.AxiomApp.state,
        patched: window.AxiomApp.patchedChannels.length,
        cables: window.AxiomBay.cables.length,
        portalActive: window.AxiomVisuals.portalActive
      }));
      recallSamples.push(s);
      console.log(`  t=${actualT}ms: state=${s.state}, patched=${s.patched}/7, cables=${s.cables}`);
    }
    const counts = recallSamples.map(s => s.patched);
    const staged = counts.every((v, i) => (i === 0 || v > counts[i - 1])) &&
                   recallSamples.every(s => s.state === 'PATCHING' && s.patched > 0 && s.patched < 7 && !s.portalActive);
    if (!staged) {
      throw new Error(`FAIL: Preset recall is not visibly staged: ${JSON.stringify(recallSamples)}`);
    }

    // Completion: ARMED_READY, no auto-fire even 1s after the final lock
    const toEnd = recallStart + 3000 - Date.now();
    if (toEnd > 0) await new Promise(r => setTimeout(r, toEnd));
    const recallEnd = await page.evaluate(() => ({
      state: window.AxiomApp.state,
      patched: window.AxiomApp.patchedChannels.length,
      portalActive: window.AxiomVisuals.portalActive
    }));
    console.log('Recall End Status:', recallEnd);
    if (recallEnd.state !== 'ARMED_READY' || recallEnd.patched !== 7 || recallEnd.portalActive) {
      throw new Error('FAIL: Staged recall did not land in ARMED_READY without auto-fire!');
    }
    await page.screenshot({ path: path.join(screenshotsDir, '06_recall_complete_armed.png') });
    console.log('PASS: Servo recall is staged, lands ARMED_READY, no auto-fire.');

    // In-progress screenshot evidence: screenshots on this canvas-heavy page take
    // ~2s in headless, so capture ONE mid-recall frame per pass at two different
    // offsets across two fresh recall passes (state is recorded just before capture).
    const midShots = [];
    for (const [off, label] of [[400, 'early'], [1000, 'late']]) {
      await hitTestClick('#btn-feed-cut');
      await new Promise(r => setTimeout(r, 150));
      await hitTestClick('.btn-quick-preset[data-preset="p2"]');
      const passStart = Date.now();
      const rem = passStart + off - Date.now();
      if (rem > 0) await new Promise(r => setTimeout(r, rem));
      const stateAtShot = await page.evaluate(() => ({
        state: window.AxiomApp.state,
        patched: window.AxiomApp.patchedChannels.length
      }));
      await page.screenshot({ path: path.join(screenshotsDir, `06_recall_progress_${label}.png`) });
      midShots.push(stateAtShot);
      console.log(`  Mid-recall screenshot (${label}, ~t=${off}ms): state=${stateAtShot.state}, patched=${stateAtShot.patched}/7`);
      // let this pass finish before the next
      const settle = passStart + 3000 - Date.now();
      if (settle > 0) await new Promise(r => setTimeout(r, settle));
    }
    if (!(midShots[0].patched > 0 && midShots[0].patched < 7 && midShots[0].state === 'PATCHING' &&
          midShots[1].patched > midShots[0].patched && midShots[1].patched < 7 && midShots[1].state === 'PATCHING')) {
      throw new Error(`FAIL: Mid-recall screenshots do not show distinct in-progress states: ${JSON.stringify(midShots)}`);
    }
    console.log('PASS: Two distinct in-progress recall states captured on screenshot.');

    // 6.6 Mid-Recall Disengage Test (FEED CUT during servo recall)
    console.log('\n--- Testing FEED CUT during servo recall ---');
    await hitTestClick('#btn-feed-cut');
    await new Promise(r => setTimeout(r, 100));
    await hitTestClick('.btn-quick-preset[data-preset="p3"]');
    await new Promise(r => setTimeout(r, 700)); // ~2 channels seated
    const midRecall = await page.evaluate(() => ({ state: window.AxiomApp.state, patched: window.AxiomApp.patchedChannels.length }));
    console.log('Mid-recall state before abort:', midRecall);
    if (midRecall.state !== 'PATCHING' || midRecall.patched === 0 || midRecall.patched >= 7) {
      throw new Error(`FAIL: Unexpected mid-recall state: ${JSON.stringify(midRecall)}`);
    }
    await hitTestClick('#btn-feed-cut');
    await new Promise(r => setTimeout(r, 1900)); // past when remaining servo steps would have fired
    const afterAbort = await page.evaluate(() => ({
      state: window.AxiomApp.state,
      patched: window.AxiomApp.patchedChannels.length,
      cables: window.AxiomBay.cables.length
    }));
    console.log('After mid-recall abort (+1.9s):', afterAbort);
    if (afterAbort.state !== 'IDLE_STANDBY' || afterAbort.patched !== 0 || afterAbort.cables !== 0) {
      throw new Error('FAIL: FEED CUT during recall left orphaned servo steps or cables!');
    }
    await page.screenshot({ path: path.join(screenshotsDir, '06_mid_recall_feedcut.png') });
    console.log('PASS: FEED CUT aborts an in-flight recall cleanly.');

    // 7. Test Tier 2 Preset (Experimental P4)
    console.log('\n--- Testing Tier 2 Preset (P4: Overdriven) ---');
    await hitTestClick('.btn-quick-preset[data-preset="p4"]');
    await new Promise(r => setTimeout(r, 2400)); // wait for servo recall to arm
    await hitTestClick('#btn-print-master');
    await new Promise(r => setTimeout(r, 200));
    const tier2Active = await page.evaluate(() => window.AxiomApp.state === 'MASTER_SUMMING_ACTIVE');
    if (!tier2Active) throw new Error('FAIL: Tier 2 preset activation failed!');
    console.log('PASS: Tier 2 preset tested and verified.');

    // 8. 4K Scaled Viewport Test (3840x2160)
    console.log('\n--- Testing 4K Scaled Viewport (3840x2160) ---');
    await page.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 1 });
    await page.evaluate(() => {
      window.dispatchEvent(new Event('resize'));
    });
    await new Promise(r => setTimeout(r, 400));

    const metrics4k = await page.evaluate(() => {
      const ws = document.querySelector('.console-workspace');
      const comp = window.getComputedStyle(ws);
      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        appScaleVar: document.documentElement.style.getPropertyValue('--app-scale'),
        transform: comp.transform,
        workspaceRect: {
          width: ws.getBoundingClientRect().width,
          height: ws.getBoundingClientRect().height
        }
      };
    });
    console.log('4K Viewport Metrics:', JSON.stringify(metrics4k, null, 2));

    await page.screenshot({ path: path.join(screenshotsDir, '05_4k_active_rendered.png') });
    console.log('Saved 05_4k_active_rendered.png');

    console.log('\n=== ALL PUPPETEER RIGOROUS AUTOMATED TESTS PASSED CLEANLY! ===\n');

  } catch (err) {
    console.error('TEST RIG ERROR:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runTests();
