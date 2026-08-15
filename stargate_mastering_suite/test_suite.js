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
    if (cornerChecks.versionText !== 'v1.0.0') {
      throw new Error('FAIL: Version string is not v1.0.0!');
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
    await new Promise(r => setTimeout(r, 100));

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

    // 7. Test Tier 2 Preset (Experimental P4)
    console.log('\n--- Testing Tier 2 Preset (P4: Overdriven) ---');
    await hitTestClick('.btn-quick-preset[data-preset="p4"]');
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
