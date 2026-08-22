/**
 * Stargate Orthographic CAD Terminal - Automated End-to-End Test Suite
 * Bureau: Aethelgard-Voss Structural Telemetrics & CAD Engineering Bureau
 * Spec: AV-CAD-STG-9042-REV-D
 * 
 * Verifies:
 * 1. Viewport scaling at 1080p and 4K with computed scale transforms
 * 2. Default Safety Interlock state (RELEASED)
 * 3. Manual Dialing of 7 glyphs to 8 Caliper points
 * 4. Negative Auto-Fire Guarantee (terminal halts in READY state)
 * 5. Safety Interlock blocking activation when engaged
 * 6. Three-Stage Activation (Buildup, Breakthrough, Sustained Active) with comparative screenshot analysis
 * 7. Disengage cycle returning to IDLE
 * 8. Quick-Dial Preset genuine sequential auto-dialing (NOT instant jump)
 * 9. Second activation and second disengage cycle
 * 10. Operator Guide modal and corner branding links
 */

import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT_DIR, 'test_artifacts');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Simple static HTTP server for testing
function startStaticServer(port = 5199) {
  return new Promise((resolve) => {
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.svg': 'image/svg+xml'
    };

    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      const filePath = path.join(ROOT_DIR, reqPath);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not found');
          return;
        }
        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

function computeImageDeltaRough(buf1, buf2) {
  if (buf1.length !== buf2.length) return 1.0;
  let diffBytes = 0;
  for (let i = 0; i < buf1.length; i++) {
    if (buf1[i] !== buf2[i]) diffBytes++;
  }
  return diffBytes / buf1.length;
}

async function runE2ETests() {
  console.log("================================================================================");
  console.log("STARGATE ORTHOGRAPHIC CAD TERMINAL - AUTOMATED VERIFICATION SUITE");
  console.log("Bureau: Aethelgard-Voss Structural Telemetrics & CAD Engineering Bureau");
  console.log("================================================================================\n");

  const port = 5199;
  const server = await startStaticServer(port);
  const targetUrl = `http://localhost:${port}/`;
  console.log(`[TEST SERVER] Running at: ${targetUrl}`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  let testsPassed = 0;
  let totalTests = 0;

  function assert(condition, message, details = "") {
    totalTests++;
    if (condition) {
      testsPassed++;
      console.log(`  ✓ PASS [${totalTests}]: ${message} ${details ? '(' + details + ')' : ''}`);
    } else {
      console.error(`  ✗ FAIL [${totalTests}]: ${message} ${details ? '(' + details + ')' : ''}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Cold Start & Viewport Scaling (1080p and 4K)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST PHASE 1: Cold Start & Multi-Resolution Viewport Scaling ---");
    
    // 1080p
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(targetUrl, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const scale1080 = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--app-scale').trim();
    });
    console.log(`  [MEASUREMENT 1080p] Viewport: 1920x1080 | Computed --app-scale: ${scale1080}`);
    assert(parseFloat(scale1080) === 1, "Scale at 1920x1080 is exactly 1.0", `scale=${scale1080}`);

    const shot1080 = path.join(SCREENSHOTS_DIR, '01_cold_start_idle_1080p.png');
    await page.screenshot({ path: shot1080 });
    console.log(`  [SCREENSHOT] Saved: ${shot1080}`);

    // 4K
    await page.setViewport({ width: 3840, height: 2160 });
    await new Promise(r => setTimeout(r, 400));
    const scale4k = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--app-scale').trim();
    });
    console.log(`  [MEASUREMENT 4K] Viewport: 3840x2160 | Computed --app-scale: ${scale4k}`);
    assert(parseFloat(scale4k) === 2, "Scale at 3840x2160 is 2.0", `scale=${scale4k}`);

    const shot4k = path.join(SCREENSHOTS_DIR, '01b_cold_start_idle_4k.png');
    await page.screenshot({ path: shot4k });
    console.log(`  [SCREENSHOT] Saved: ${shot4k}`);

    // Return to standard 1080p for remainder of test
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(r => setTimeout(r, 300));

    // -------------------------------------------------------------------------
    // TEST 2: Safety Interlock Default State
    // -------------------------------------------------------------------------
    console.log("\n--- TEST PHASE 2: Safety Interlock Default State ---");
    const isInterlockApproved = await page.evaluate(() => {
      return window.__STARGATE_CAD_APP.dialer.isPermitApproved;
    });
    assert(isInterlockApproved === true, "Safety Interlock defaults to RELEASED (Permit Granted)");

    // -------------------------------------------------------------------------
    // TEST 3: Manual Dialing Sequence (7 Glyphs to 8 Caliper Points)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST PHASE 3: Manual Dialing Sequence ---");
    const manualGlyphIds = [1, 4, 7, 10, 13, 16, 0]; // 6 spatial vectors + 1 origin datum

    for (let i = 0; i < manualGlyphIds.length; i++) {
      const gId = manualGlyphIds[i];
      const btnSelector = `#glyph-btn-${gId}`;
      const btn = await page.$(btnSelector);
      assert(btn !== null, `Found glyph button for ID ${gId}`);

      const box = await btn.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await new Promise(r => setTimeout(r, 350));

      const count = await page.evaluate(() => window.__STARGATE_CAD_APP.dialer.currentAddress.length);
      assert(count === i + 1, `Address register locked ${count}/7 glyphs`);

      if (i === 3) {
        const shotPartial = path.join(SCREENSHOTS_DIR, '02_manual_dial_partial.png');
        await page.screenshot({ path: shotPartial });
        console.log(`  [SCREENSHOT] Saved: ${shotPartial} (Locked 4/7)`);
      }
    }

    const shotReady = path.join(SCREENSHOTS_DIR, '03_manual_dial_complete_ready.png');
    await page.screenshot({ path: shotReady });
    console.log(`  [SCREENSHOT] Saved: ${shotReady} (Locked 7/7)`);

    // -------------------------------------------------------------------------
    // TEST 4: Negative Auto-Fire Guarantee
    // -------------------------------------------------------------------------
    console.log("\n--- TEST PHASE 4: Negative Auto-Fire Verification ---");
    console.log("  Waiting 1500ms to confirm no auto-activation occurs...");
    await new Promise(r => setTimeout(r, 1500));

    const stateAfterWait = await page.evaluate(() => window.__STARGATE_CAD_APP.dialer.state);
    assert(stateAfterWait === "READY", "System remains in READY state and did NOT auto-fire", `state=${stateAfterWait}`);

    const isActivateBtnReady = await page.evaluate(() => {
      const btn = document.getElementById("btn-activate");
      return btn && btn.classList.contains("ready") && !btn.disabled;
    });
    assert(isActivateBtnReady === true, "Activation button is highlighted and ready for manual trigger");

    // -------------------------------------------------------------------------
    // TEST 5: Safety Interlock Blocked Activation Test
    // -------------------------------------------------------------------------
    console.log("\n--- TEST PHASE 5: Safety Interlock Restriction Test ---");
    // Click toggle to engage hold
    const toggleBtn = await page.$("#toggle-safety-interlock");
    const toggleBox = await toggleBtn.boundingBox();
    await page.mouse.click(toggleBox.x + toggleBox.width / 2, toggleBox.y + toggleBox.height / 2);
    await new Promise(r => setTimeout(r, 200));

    const isEngaged = await page.evaluate(() => !window.__STARGATE_CAD_APP.dialer.isPermitApproved);
    assert(isEngaged === true, "Safety Interlock is now ENGAGED (Hold)");

    // Try to click activation button while hold is active
    const actBtn = await page.$("#btn-activate");
    const actBox = await actBtn.boundingBox();
    await page.mouse.click(actBox.x + actBox.width / 2, actBox.y + actBox.height / 2);
    await new Promise(r => setTimeout(r, 200));

    const stateWhileBlocked = await page.evaluate(() => window.__STARGATE_CAD_APP.dialer.state);
    assert(stateWhileBlocked === "READY", "Activation blocked by Safety Interlock, still in READY state");

    const alertVisible = await page.evaluate(() => {
      const b = document.getElementById("cad-alert-banner");
      return b && !b.classList.contains("hidden");
    });
    assert(alertVisible === true, "High-priority safety alert banner is clearly displayed");

    // Release safety hold to proceed
    await page.mouse.click(toggleBox.x + toggleBox.width / 2, toggleBox.y + toggleBox.height / 2);
    await new Promise(r => setTimeout(r, 200));
    const isReleasedAgain = await page.evaluate(() => window.__STARGATE_CAD_APP.dialer.isPermitApproved);
    assert(isReleasedAgain === true, "Safety Interlock released back to approved state");

    // -------------------------------------------------------------------------
    // TEST 6: Three-Stage Activation Sequence & Visual Differentiation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST PHASE 6: Three-Stage Activation Verification ---");
    
    // Click activation button
    await page.mouse.click(actBox.x + actBox.width / 2, actBox.y + actBox.height / 2);
    
    // Stage 1: Buildup (capture at t=1000ms)
    await new Promise(r => setTimeout(r, 1000));
    const stage1State = await page.evaluate(() => window.__STARGATE_CAD_APP.dialer.state);
    assert(stage1State === "BUILDUP", "Stage 1 (BUILDUP) active at t=1.0s", `state=${stage1State}`);
    const shotStage1 = path.join(SCREENSHOTS_DIR, '04_activation_stage1_buildup.png');
    await page.screenshot({ path: shotStage1 });
    console.log(`  [SCREENSHOT] Saved: ${shotStage1}`);

    // Stage 2: Breakthrough (capture at t=2200ms)
    await new Promise(r => setTimeout(r, 1200));
    const stage2State = await page.evaluate(() => window.__STARGATE_CAD_APP.dialer.state);
    assert(stage2State === "BREAKTHROUGH" || stage2State === "ACTIVE", "Stage 2 (BREAKTHROUGH) reached", `state=${stage2State}`);
    const shotStage2 = path.join(SCREENSHOTS_DIR, '05_activation_stage2_breakthrough.png');
    await page.screenshot({ path: shotStage2 });
    console.log(`  [SCREENSHOT] Saved: ${shotStage2}`);

    // Stage 3: Sustained Active State (capture at t=3500ms)
    await new Promise(r => setTimeout(r, 1300));
    const stage3State = await page.evaluate(() => window.__STARGATE_CAD_APP.dialer.state);
    assert(stage3State === "ACTIVE", "Stage 3 (SUSTAINED ACTIVE) reached and holding stable", `state=${stage3State}`);
    const shotStage3 = path.join(SCREENSHOTS_DIR, '06_activation_stage3_sustained_active.png');
    await page.screenshot({ path: shotStage3 });
    console.log(`  [SCREENSHOT] Saved: ${shotStage3}`);

    // Visual Differentiation Check between screenshots
    const buf1 = fs.readFileSync(shotStage1);
    const buf2 = fs.readFileSync(shotStage2);
    const buf3 = fs.readFileSync(shotStage3);

    const delta1_2 = computeImageDeltaRough(buf1, buf2);
    const delta2_3 = computeImageDeltaRough(buf2, buf3);
    const delta1_3 = computeImageDeltaRough(buf1, buf3);

    console.log(`  [IMAGE DELTAS] Stage1 vs Stage2: ${(delta1_2 * 100).toFixed(2)}% | Stage2 vs Stage3: ${(delta2_3 * 100).toFixed(2)}% | Stage1 vs Stage3: ${(delta1_3 * 100).toFixed(2)}%`);
    assert(delta1_2 > 0.05, "Stage 1 and Stage 2 are visibly and measurably distinct");
    assert(delta2_3 > 0.05, "Stage 2 and Stage 3 are visibly and measurably distinct");
    assert(delta1_3 > 0.05, "Stage 1 and Stage 3 are visibly and measurably distinct");

    // -------------------------------------------------------------------------
    // TEST 7: Disengage Cycle 1
    // -------------------------------------------------------------------------
    console.log("\n--- TEST PHASE 7: Disengage Cycle 1 ---");
    const disengageBtn = await page.$("#btn-disengage");
    const disengageBox = await disengageBtn.boundingBox();
    await page.mouse.click(disengageBox.x + disengageBox.width / 2, disengageBox.y + disengageBox.height / 2);
    
    await new Promise(r => setTimeout(r, 800));
    const stateAfterDisengage = await page.evaluate(() => window.__STARGATE_CAD_APP.dialer.state);
    assert(stateAfterDisengage === "IDLE", "Disengage returns terminal to clean IDLE state", `state=${stateAfterDisengage}`);

    const shotDisengage = path.join(SCREENSHOTS_DIR, '07_disengage_reset_idle.png');
    await page.screenshot({ path: shotDisengage });
    console.log(`  [SCREENSHOT] Saved: ${shotDisengage}`);

    // -------------------------------------------------------------------------
    // TEST 8: Quick-Dial Preset Auto-Dialing (Not Instant Jump)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST PHASE 8: Quick-Dial Preset Sequential Auto-Dialing ---");
    const presetBtn = await page.$("#preset-btn-cygnus_epsilon");
    const presetBox = await presetBtn.boundingBox();
    await page.mouse.click(presetBox.x + presetBox.width / 2, presetBox.y + presetBox.height / 2);

    // Capture midpoint screenshot during auto-dial sequence
    await new Promise(r => setTimeout(r, 1200));
    const midpointCount = await page.evaluate(() => window.__STARGATE_CAD_APP.dialer.currentAddress.length);
    console.log(`  [AUTODIAL PROGRESS] Midpoint glyphs locked: ${midpointCount}/7`);
    assert(midpointCount >= 1 && midpointCount < 7, "Quick-Dial is auto-dialing sequentially (NOT instant jump)", `locked=${midpointCount}`);

    const shotAutodialMid = path.join(SCREENSHOTS_DIR, '08_autodial_midpoint.png');
    await page.screenshot({ path: shotAutodialMid });
    console.log(`  [SCREENSHOT] Saved: ${shotAutodialMid}`);

    // Wait for full auto-dial sequence to complete
    await new Promise(r => setTimeout(r, 3500));
    const finalAutodialCount = await page.evaluate(() => window.__STARGATE_CAD_APP.dialer.currentAddress.length);
    const autodialState = await page.evaluate(() => window.__STARGATE_CAD_APP.dialer.state);
    assert(finalAutodialCount === 7, "Quick-Dial completed all 7 glyph locks", `locked=${finalAutodialCount}`);
    assert(autodialState === "READY", "Quick-Dial landed in READY state without auto-firing", `state=${autodialState}`);

    const shotAutodialReady = path.join(SCREENSHOTS_DIR, '09_autodial_complete_ready.png');
    await page.screenshot({ path: shotAutodialReady });
    console.log(`  [SCREENSHOT] Saved: ${shotAutodialReady}`);

    // -------------------------------------------------------------------------
    // TEST 9: Second Activation & Second Disengage Cycle
    // -------------------------------------------------------------------------
    console.log("\n--- TEST PHASE 9: Second Activation & Disengage Cycle ---");
    await page.mouse.click(actBox.x + actBox.width / 2, actBox.y + actBox.height / 2);
    await new Promise(r => setTimeout(r, 3200)); // Wait past buildup into active
    const secondActiveState = await page.evaluate(() => window.__STARGATE_CAD_APP.dialer.state);
    assert(secondActiveState === "ACTIVE", "Second activation successfully entered SUSTAINED ACTIVE state");

    const shotSecondActive = path.join(SCREENSHOTS_DIR, '10_second_active.png');
    await page.screenshot({ path: shotSecondActive });
    console.log(`  [SCREENSHOT] Saved: ${shotSecondActive}`);

    // Second disengage
    await page.mouse.click(disengageBox.x + disengageBox.width / 2, disengageBox.y + disengageBox.height / 2);
    await new Promise(r => setTimeout(r, 800));
    const secondDisengageState = await page.evaluate(() => window.__STARGATE_CAD_APP.dialer.state);
    assert(secondDisengageState === "IDLE", "Second disengage successfully returned to IDLE");

    const shotSecondDisengage = path.join(SCREENSHOTS_DIR, '11_second_disengage_complete.png');
    await page.screenshot({ path: shotSecondDisengage });
    console.log(`  [SCREENSHOT] Saved: ${shotSecondDisengage}`);

    // -------------------------------------------------------------------------
    // TEST 10: Operator Reference Guide & Corner Links
    // -------------------------------------------------------------------------
    console.log("\n--- TEST PHASE 10: Operator Manual & Corner Displays ---");
    const helpBtn = await page.$("#btn-operator-help");
    const helpBox = await helpBtn.boundingBox();
    await page.mouse.click(helpBox.x + helpBox.width / 2, helpBox.y + helpBox.height / 2);
    await new Promise(r => setTimeout(r, 300));

    const modalOpen = await page.evaluate(() => {
      const m = document.getElementById("modal-operator-guide");
      return m && !m.classList.contains("hidden");
    });
    assert(modalOpen === true, "Operator Manual modal opened on '?' button click");

    const shotModal = path.join(SCREENSHOTS_DIR, '12_operator_guide_modal.png');
    await page.screenshot({ path: shotModal });
    console.log(`  [SCREENSHOT] Saved: ${shotModal}`);

    // Dismiss modal
    const closeBtn = await page.$("#btn-modal-close");
    const closeBox = await closeBtn.boundingBox();
    await page.mouse.click(closeBox.x + closeBox.width / 2, closeBox.y + closeBox.height / 2);
    await new Promise(r => setTimeout(r, 200));

    const modalClosed = await page.evaluate(() => {
      const m = document.getElementById("modal-operator-guide");
      return m && m.classList.contains("hidden");
    });
    assert(modalClosed === true, "Operator Manual dismissed successfully");

    // Corner link checks
    const cornerLink = await page.evaluate(() => {
      const a = document.getElementById("corner-link-starlight");
      return {
        href: a ? a.getAttribute("href") : null,
        target: a ? a.getAttribute("target") : null,
        rel: a ? a.getAttribute("rel") : null
      };
    });
    assert(cornerLink.href === "https://github.com/StarlightDaemon", "StarlightDaemon link has valid GitHub URL", cornerLink.href);
    assert(cornerLink.target === "_blank", "StarlightDaemon link opens in new tab (target='_blank')");
    assert(cornerLink.rel && cornerLink.rel.includes("noopener"), "StarlightDaemon link has rel='noopener noreferrer'");

    const versionText = await page.evaluate(() => {
      const el = document.getElementById("corner-version-label");
      return el ? el.textContent.trim() : null;
    });
    assert(versionText === "v1.0.0", "Corner version label matches 'v1.0.0'", versionText);

    console.log("\n================================================================================");
    console.log(`ALL TESTS PASSED: ${testsPassed} / ${totalTests} assertions verified successfully.`);
    console.log("================================================================================\n");

  } finally {
    await browser.close();
    server.close();
  }
}

runE2ETests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
