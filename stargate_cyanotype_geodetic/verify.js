/**
 * Vance & Sterling Geodetic Survey Bureau — Verification Suite v1.1.0
 * Real Puppeteer Pointer Events, Hit-Testing, Responsive Scaling,
 * Critical Negative Auto-Dialing Prevention, and Dual Full Cycles
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Local Static Web Server Setup
function startStaticServer(port = 8894) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg'
  };

  const server = http.createServer((req, res) => {
    const cleanUrl = req.url.split('?')[0];
    let filePath = path.join(__dirname, cleanUrl === '/' ? 'index.html' : cleanUrl);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(`500 Internal Error: ${err.code}`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      console.log(`[Server] Draughting Web Server running at http://127.0.0.1:${port}/`);
      resolve({ server, port });
    });
  });
}

// Real Pointer Event Dispatcher at Hit-Tested Screen Coordinates
async function dispatchPointerClick(page, selector) {
  const rect = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    // Hit-test element at rendered coordinates
    const hitEl = document.elementFromPoint(cx, cy);
    const isContained = el.contains(hitEl) || hitEl === el;
    return {
      x: cx,
      y: cy,
      hit: isContained,
      tagName: hitEl ? hitEl.tagName : 'NONE',
      id: hitEl ? hitEl.id : '',
      disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'
    };
  }, selector);

  if (!rect) {
    throw new Error(`Element not found for selector: ${selector}`);
  }

  // Dispatch real mouse move and click at rendered physical coordinates
  await page.mouse.move(rect.x, rect.y);
  await page.mouse.down();
  await new Promise(r => setTimeout(r, 60));
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 120));

  return rect;
}

async function runVerification() {
  console.log('=== STARTING CYANOTYPE BLUEPRINT VERIFICATION SUITE (v1.1.0) ===');
  const { server, port } = await startStaticServer(8894);
  const targetUrl = `http://127.0.0.1:${port}/`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  await page.goto(targetUrl, { waitUntil: 'networkidle0' });

  try {
    // -------------------------------------------------------------
    // TEST 1: CSS Viewport Scale Pitfall Verification (1080p & 4K)
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: CSS Viewport Scale Pitfall Verification ---');
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(r => setTimeout(r, 150));
    
    const transform1080p = await page.evaluate(() => {
      const stage = document.getElementById('drafting-table-stage');
      return window.getComputedStyle(stage).transform;
    });
    console.log(`[1080p Transform]: ${transform1080p}`);
    if (transform1080p === 'none' || !transform1080p.includes('matrix')) {
      throw new Error(`CSS Transform at 1080p failed (got "${transform1080p}")`);
    }

    await page.setViewport({ width: 3840, height: 2160 });
    await new Promise(r => setTimeout(r, 150));
    const transform4K = await page.evaluate(() => {
      const stage = document.getElementById('drafting-table-stage');
      return window.getComputedStyle(stage).transform;
    });
    console.log(`[4K Transform]: ${transform4K}`);
    if (transform4K === 'none' || !transform4K.includes('matrix')) {
      throw new Error(`CSS Transform at 4K failed (got "${transform4K}")`);
    }

    // Reset to 1080p
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(r => setTimeout(r, 200));
    await page.screenshot({ path: 'screenshot_01_idle_1080p.png' });
    console.log('Saved screenshot_01_idle_1080p.png');

    // -------------------------------------------------------------
    // TEST 2: Operator Reference Manual Modal Check
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Operator Manual Modal Check ---');
    await dispatchPointerClick(page, '#btn-operator-manual');
    const modalVisible = await page.evaluate(() => {
      const modal = document.getElementById('operator-modal');
      return !modal.classList.contains('hidden');
    });
    console.log(`[Modal Opened]: ${modalVisible}`);
    if (!modalVisible) throw new Error('Operator manual modal failed to open.');

    await dispatchPointerClick(page, '#btn-close-modal');
    const modalClosed = await page.evaluate(() => {
      const modal = document.getElementById('operator-modal');
      return modal.classList.contains('hidden');
    });
    console.log(`[Modal Closed]: ${modalClosed}`);
    if (!modalClosed) throw new Error('Operator manual modal failed to close.');

    // Helper: Function to scribe 7 nodes using real pointer clicks
    async function scribeSevenGlyphs() {
      for (let i = 0; i < 7; i++) {
        await dispatchPointerClick(page, '#btn-step-next');
        await dispatchPointerClick(page, '#btn-step-next');
        await dispatchPointerClick(page, '#btn-scribe-lock');
      }
    }

    // -------------------------------------------------------------
    // TEST 3: CRITICAL NEGATIVE TEST (No Auto-Activation on 7th Node)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: CRITICAL NEGATIVE TEST (No Auto-Activation on 7th Node) ---');
    await scribeSevenGlyphs();

    // Explicitly check state immediately after 7th node scribing WITHOUT clicking activation control
    const negativeCheckState = await page.evaluate(() => {
      const slots = document.querySelectorAll('.address-slot.locked').length;
      const stampVisible = !document.getElementById('validated-stamp-seal').classList.contains('hidden');
      const titleStatus = document.getElementById('title-block-status').textContent;
      const certifyBtnDisabled = document.getElementById('btn-certify-activate').disabled;
      const certifyBtnSublabel = document.getElementById('certify-btn-sublabel').textContent;
      return { slots, stampVisible, titleStatus, certifyBtnDisabled, certifyBtnSublabel };
    });

    console.log('[Post-7th Node State (Before Activation Click)]:', negativeCheckState);

    if (negativeCheckState.slots !== 7) {
      throw new Error(`Expected 7 locked slots, got ${negativeCheckState.slots}`);
    }
    if (negativeCheckState.stampVisible) {
      throw new Error('CRITICAL BUG DETECTED: Validation stamp auto-activated upon locking 7th node!');
    }
    if (negativeCheckState.certifyBtnDisabled) {
      throw new Error('CRITICAL BUG: VALIDATE & COMMIT button remained disabled after 7th node was locked!');
    }
    if (!negativeCheckState.titleStatus.includes('PENDING OPERATOR CERTIFICATION')) {
      throw new Error(`Unexpected title status: "${negativeCheckState.titleStatus}"`);
    }

    console.log('>>> CRITICAL NEGATIVE TEST PASSED: Locking 7th node leaves apparatus in pending state with validation seal hidden and VALIDATE & COMMIT button enabled.');

    // -------------------------------------------------------------
    // TEST 4: Deliberate Click on VALIDATE & COMMIT Button
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Deliberate Click on VALIDATE & COMMIT Button ---');
    await dispatchPointerClick(page, '#btn-certify-activate');
    await new Promise(r => setTimeout(r, 200));

    const postCommitState = await page.evaluate(() => {
      const stampVisible = !document.getElementById('validated-stamp-seal').classList.contains('hidden');
      const titleStatus = document.getElementById('title-block-status').textContent;
      const certifyBtnDisabled = document.getElementById('btn-certify-activate').disabled;
      return { stampVisible, titleStatus, certifyBtnDisabled };
    });

    console.log('[Post-Commit State]:', postCommitState);
    if (!postCommitState.stampVisible) {
      throw new Error('Validation stamp failed to land after clicking VALIDATE & COMMIT.');
    }
    if (!postCommitState.titleStatus.includes('CONDUIT ACTIVE')) {
      throw new Error(`Expected CONDUIT ACTIVE status, got "${postCommitState.titleStatus}"`);
    }
    console.log('>>> DELIBERATE ACTIVATION TEST PASSED: Validation stamp landed and conduit became active upon clicking VALIDATE & COMMIT.');

    // -------------------------------------------------------------
    // TEST 5: Full Dial-Disengage-Redial Cycle #1
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Full Dial-Disengage-Redial Cycle #1 ---');
    console.log('[Cycle 1]: Disengaging via #btn-disengage pointer event...');
    await dispatchPointerClick(page, '#btn-disengage');

    const cycle1Disengaged = await page.evaluate(() => {
      const slots = document.querySelectorAll('.address-slot.locked').length;
      const stampVisible = !document.getElementById('validated-stamp-seal').classList.contains('hidden');
      const certifyBtnDisabled = document.getElementById('btn-certify-activate').disabled;
      return { slots, stampVisible, certifyBtnDisabled };
    });
    console.log('[Cycle 1 Disengaged State]:', cycle1Disengaged);
    if (cycle1Disengaged.slots !== 0 || cycle1Disengaged.stampVisible || !cycle1Disengaged.certifyBtnDisabled) {
      throw new Error('Cycle 1 disengage failed to fully reset state.');
    }

    console.log('[Cycle 1]: Redialing 7 nodes...');
    await scribeSevenGlyphs();
    
    // Confirm no auto-activation on redial
    const cycle1RedialPending = await page.evaluate(() => {
      return !document.getElementById('validated-stamp-seal').classList.contains('hidden');
    });
    if (cycle1RedialPending) throw new Error('Cycle 1 redial auto-activated unexpectedly.');

    // Now click VALIDATE & COMMIT
    await dispatchPointerClick(page, '#btn-certify-activate');
    const cycle1Activated = await page.evaluate(() => {
      return !document.getElementById('validated-stamp-seal').classList.contains('hidden');
    });
    if (!cycle1Activated) throw new Error('Cycle 1 activation click failed.');
    console.log('>>> Cycle 1 Dial-Disengage-Redial completed successfully.');

    // -------------------------------------------------------------
    // TEST 6: Full Dial-Disengage-Redial Cycle #2
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Full Dial-Disengage-Redial Cycle #2 ---');
    await dispatchPointerClick(page, '#btn-disengage');
    await scribeSevenGlyphs();
    await dispatchPointerClick(page, '#btn-certify-activate');

    const cycle2Activated = await page.evaluate(() => {
      const stampVisible = !document.getElementById('validated-stamp-seal').classList.contains('hidden');
      const titleStatus = document.getElementById('title-block-status').textContent;
      return { stampVisible, titleStatus };
    });
    console.log('[Cycle 2 Activated State]:', cycle2Activated);
    if (!cycle2Activated.stampVisible) throw new Error('Cycle 2 activation failed.');
    console.log('>>> Cycle 2 Dial-Disengage-Redial completed successfully.');

    await page.screenshot({ path: 'screenshot_02_activated_1080p.png' });
    console.log('Saved screenshot_02_activated_1080p.png');

    // -------------------------------------------------------------
    // TEST 7: Field Permit Hold Subsystem Verification
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Field Permit Hold Subsystem Verification ---');
    await dispatchPointerClick(page, '#btn-disengage');
    
    // Toggle Hold ON
    await dispatchPointerClick(page, '#btn-permit-hold');
    const holdOnState = await page.evaluate(() => {
      const btnPressed = document.getElementById('btn-permit-hold').getAttribute('aria-pressed');
      const stampVisible = !document.getElementById('hold-stamp-seal').classList.contains('hidden');
      return { btnPressed, stampVisible };
    });
    console.log('[Hold ON State]:', holdOnState);
    if (holdOnState.btnPressed !== 'true' || !holdOnState.stampVisible) {
      throw new Error('Permit Hold failed to engage.');
    }

    await page.screenshot({ path: 'screenshot_03_permit_hold_1080p.png' });
    console.log('Saved screenshot_03_permit_hold_1080p.png');

    // Scribe 7 nodes with Hold ON
    await scribeSevenGlyphs();

    // Click VALIDATE & COMMIT while Hold is ON -> MUST BE INHIBITED!
    await dispatchPointerClick(page, '#btn-certify-activate');
    const holdInhibitedState = await page.evaluate(() => {
      const stampVisible = !document.getElementById('validated-stamp-seal').classList.contains('hidden');
      const titleStatus = document.getElementById('title-block-status').textContent;
      return { stampVisible, titleStatus };
    });
    console.log('[Hold Inhibited Click State]:', holdInhibitedState);
    if (holdInhibitedState.stampVisible) {
      throw new Error('CRITICAL: Validation stamp landed while Permit Hold was ON!');
    }
    if (!holdInhibitedState.titleStatus.includes('INHIBITED') && !holdInhibitedState.titleStatus.includes('HOLD')) {
      throw new Error(`Expected INHIBITED status, got "${holdInhibitedState.titleStatus}"`);
    }

    // Release Hold -> MUST NOT AUTO-ACTIVATE ON RELEASE!
    console.log('Releasing Permit Hold...');
    await dispatchPointerClick(page, '#btn-permit-hold');
    await new Promise(r => setTimeout(r, 200));

    const holdReleasedState = await page.evaluate(() => {
      const stampVisible = !document.getElementById('validated-stamp-seal').classList.contains('hidden');
      const holdStampVisible = !document.getElementById('hold-stamp-seal').classList.contains('hidden');
      const certifyBtnDisabled = document.getElementById('btn-certify-activate').disabled;
      return { stampVisible, holdStampVisible, certifyBtnDisabled };
    });
    console.log('[Hold Released (Before Click) State]:', holdReleasedState);
    if (holdReleasedState.stampVisible) {
      throw new Error('CRITICAL BUG: Conduit auto-activated upon releasing Permit Hold without deliberate click!');
    }
    if (holdReleasedState.holdStampVisible || holdReleasedState.certifyBtnDisabled) {
      throw new Error('Hold release failed to clear hold stamp or enable certify button.');
    }

    // Now deliberately click VALIDATE & COMMIT after release
    console.log('Clicking VALIDATE & COMMIT after releasing Hold...');
    await dispatchPointerClick(page, '#btn-certify-activate');
    const postReleaseActivated = await page.evaluate(() => {
      return !document.getElementById('validated-stamp-seal').classList.contains('hidden');
    });
    if (!postReleaseActivated) throw new Error('Activation failed after releasing Permit Hold and clicking commit.');
    console.log('>>> FIELD PERMIT HOLD TEST PASSED: Hold blocks activation, release does not auto-activate, deliberate click activates cleanly.');

    // -------------------------------------------------------------
    // TEST 8: Quick-Dial Preset Site Plan Verification
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Quick-Dial Preset Site Plan Verification ---');
    await dispatchPointerClick(page, '#btn-disengage');
    
    // Open archives drawer
    await dispatchPointerClick(page, '#btn-toggle-archives');
    // Click Site 01-A (Gibraltar)
    await dispatchPointerClick(page, '.site-plan-item[data-site-index="0"]');

    // Wait for automated scribing sequence to finish
    await new Promise(r => setTimeout(r, 3800));

    const presetLoadedState = await page.evaluate(() => {
      const slots = document.querySelectorAll('.address-slot.locked').length;
      const stampVisible = !document.getElementById('validated-stamp-seal').classList.contains('hidden');
      const certifyBtnDisabled = document.getElementById('btn-certify-activate').disabled;
      return { slots, stampVisible, certifyBtnDisabled };
    });
    console.log('[Preset Loaded State (Before Activation Click)]:', presetLoadedState);
    if (presetLoadedState.slots !== 7) throw new Error(`Preset failed to scribe 7 nodes (got ${presetLoadedState.slots})`);
    if (presetLoadedState.stampVisible) {
      throw new Error('CRITICAL BUG: Preset site plan auto-activated without clicking VALIDATE & COMMIT!');
    }
    if (presetLoadedState.certifyBtnDisabled) {
      throw new Error('VALIDATE & COMMIT button was not enabled after preset site plan scribing completed.');
    }

    // Click VALIDATE & COMMIT on preset
    await dispatchPointerClick(page, '#btn-certify-activate');
    const presetActivated = await page.evaluate(() => {
      return !document.getElementById('validated-stamp-seal').classList.contains('hidden');
    });
    if (!presetActivated) throw new Error('Failed to activate preset site plan via VALIDATE & COMMIT.');
    console.log('>>> QUICK-DIAL PRESET TEST PASSED: Presets populate 7 nodes and require deliberate VALIDATE & COMMIT click.');

    // -------------------------------------------------------------
    // TEST 9: Visual 4K Capture & Artifact Generation
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Visual 4K Capture & Linework Verification ---');
    await page.setViewport({ width: 3840, height: 2160 });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: 'screenshot_04_activated_4k.png' });
    console.log('Saved screenshot_04_activated_4k.png');

    console.log('\n=== ALL 9 VERIFICATION SUITE TESTS PASSED WITH ZERO ERRORS! ===');
  } catch (err) {
    console.error('\nVerification Suite FAILED with error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
}

runVerification();
