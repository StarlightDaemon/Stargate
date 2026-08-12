/**
 * Vance & Sterling Geodetic Survey Bureau — Verification Suite
 * Real Puppeteer Pointer Events, Hit-Testing, Responsive Scaling & Dual Cycle Tests
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Local Static Web Server Setup
function startStaticServer(port = 8892) {
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
      id: hitEl ? hitEl.id : ''
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
  console.log('=== STARTING CYANOTYPE BLUEPRINT VERIFICATION SUITE ===');
  const { server, port } = await startStaticServer(8892);
  const targetUrl = `http://127.0.0.1:${port}/`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  await page.goto(targetUrl, { waitUntil: 'networkidle0' });

  try {
    // TEST 1: Responsive CSS Transform Scaling Check at 1080p & 4K
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

    // Reset to standard 1080p for functional testing
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(r => setTimeout(r, 200));

    // Capture Screenshot 1: Idle Blueprint State
    await page.screenshot({ path: 'screenshot_01_idle_1080p.png' });
    console.log('Saved screenshot_01_idle_1080p.png');

    // TEST 2: Operator Reference Guide Modal Check
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

    // Helper: Function to dial 7 symbols manually using real hit-tested pointer clicks
    async function dialSevenGlyphs() {
      for (let i = 0; i < 7; i++) {
        // Step forward 2-3 glyphs to pick different symbols
        await dispatchPointerClick(page, '#btn-step-next');
        await dispatchPointerClick(page, '#btn-step-next');
        // Click Scribe & Lock button
        await dispatchPointerClick(page, '#btn-scribe-lock');
      }
    }

    // TEST 3: Dial -> Disengage -> Redial Cycle 1 (Hard Requirement)
    console.log('\n--- TEST 3: Dial-Disengage-Redial Cycle #1 ---');
    await dialSevenGlyphs();
    
    // Check locked count
    const statusCycle1A = await page.evaluate(() => {
      const slots = document.querySelectorAll('.address-slot.locked').length;
      const stampVisible = !document.getElementById('validated-stamp-seal').classList.contains('hidden');
      const titleStatus = document.getElementById('title-block-status').textContent;
      return { slots, stampVisible, titleStatus };
    });
    console.log('[Cycle 1 Dialed State]:', statusCycle1A);
    if (statusCycle1A.slots !== 7 || !statusCycle1A.stampVisible) {
      throw new Error(`Cycle 1 dialing failed: slots=${statusCycle1A.slots}, stampVisible=${statusCycle1A.stampVisible}`);
    }

    // Now Disengage using real pointer click
    console.log('[Cycle 1]: Disengaging via #btn-disengage pointer event...');
    await dispatchPointerClick(page, '#btn-disengage');

    const statusCycle1B = await page.evaluate(() => {
      const slots = document.querySelectorAll('.address-slot.locked').length;
      const stampVisible = !document.getElementById('validated-stamp-seal').classList.contains('hidden');
      const redlines = document.getElementById('redline-scribes-layer').children.length;
      return { slots, stampVisible, redlines };
    });
    console.log('[Cycle 1 Disengaged State]:', statusCycle1B);
    if (statusCycle1B.slots !== 0 || statusCycle1B.stampVisible || statusCycle1B.redlines !== 0) {
      throw new Error(`Cycle 1 disengage failed: slots=${statusCycle1B.slots}, stampVisible=${statusCycle1B.stampVisible}, redlines=${statusCycle1B.redlines}`);
    }

    // Redial Cycle 1
    console.log('[Cycle 1]: Redialing 7 symbols...');
    await dialSevenGlyphs();
    const statusCycle1C = await page.evaluate(() => {
      const slots = document.querySelectorAll('.address-slot.locked').length;
      const stampVisible = !document.getElementById('validated-stamp-seal').classList.contains('hidden');
      return { slots, stampVisible };
    });
    console.log('[Cycle 1 Redialed State]:', statusCycle1C);
    if (statusCycle1C.slots !== 7 || !statusCycle1C.stampVisible) {
      throw new Error(`Cycle 1 redial failed.`);
    }

    // TEST 4: Dial -> Disengage -> Redial Cycle 2 (Hard Requirement 2nd Verification)
    console.log('\n--- TEST 4: Dial-Disengage-Redial Cycle #2 ---');
    console.log('[Cycle 2]: Disengaging...');
    await dispatchPointerClick(page, '#btn-disengage');

    const statusCycle2A = await page.evaluate(() => {
      return document.querySelectorAll('.address-slot.locked').length;
    });
    if (statusCycle2A !== 0) throw new Error('Cycle 2 disengage failed.');

    console.log('[Cycle 2]: Redialing 7 symbols...');
    await dialSevenGlyphs();
    const statusCycle2B = await page.evaluate(() => {
      const slots = document.querySelectorAll('.address-slot.locked').length;
      const stampVisible = !document.getElementById('validated-stamp-seal').classList.contains('hidden');
      return { slots, stampVisible };
    });
    console.log('[Cycle 2 Redialed State]:', statusCycle2B);
    if (statusCycle2B.slots !== 7 || !statusCycle2B.stampVisible) {
      throw new Error('Cycle 2 redial failed.');
    }

    // Capture Screenshot 2: Activated Blueprint State
    await page.screenshot({ path: 'screenshot_02_activated_1080p.png' });
    console.log('Saved screenshot_02_activated_1080p.png');

    // TEST 5: Review / Safety Hold Subsystem Verification
    console.log('\n--- TEST 5: Structural Review / Permit Hold Subsystem ---');
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

    // Capture Screenshot 3: Permit Hold State
    await page.screenshot({ path: 'screenshot_03_permit_hold_1080p.png' });
    console.log('Saved screenshot_03_permit_hold_1080p.png');

    // Dial 7 symbols while Hold is ON -> Activation MUST be inhibited!
    console.log('Dialing 7 symbols with Permit Hold ON...');
    await dialSevenGlyphs();

    const holdDialState = await page.evaluate(() => {
      const slots = document.querySelectorAll('.address-slot.locked').length;
      const valStampVisible = !document.getElementById('validated-stamp-seal').classList.contains('hidden');
      const titleStatus = document.getElementById('title-block-status').textContent;
      return { slots, valStampVisible, titleStatus };
    });
    console.log('[Hold + Fully Dialed State]:', holdDialState);
    if (holdDialState.slots !== 7) throw new Error('Failed to lock 7 slots under hold.');
    if (holdDialState.valStampVisible) throw new Error('CRITICAL: Activation validation stamp landed while Hold was ACTIVE!');
    if (!holdDialState.titleStatus.includes('INHIBITED') && !holdDialState.titleStatus.includes('HOLD')) {
      throw new Error(`Expected inhibited status, got "${holdDialState.titleStatus}"`);
    }

    // Now Toggle Hold OFF -> Should immediately validate and activate!
    console.log('Releasing Permit Hold...');
    await dispatchPointerClick(page, '#btn-permit-hold');
    await new Promise(r => setTimeout(r, 200));

    const holdReleasedState = await page.evaluate(() => {
      const valStampVisible = !document.getElementById('validated-stamp-seal').classList.contains('hidden');
      const holdStampVisible = !document.getElementById('hold-stamp-seal').classList.contains('hidden');
      const titleStatus = document.getElementById('title-block-status').textContent;
      return { valStampVisible, holdStampVisible, titleStatus };
    });
    console.log('[Hold Released -> Activated State]:', holdReleasedState);
    if (!holdReleasedState.valStampVisible || holdReleasedState.holdStampVisible) {
      throw new Error('Activation failed to finalize after releasing Permit Hold.');
    }

    // TEST 6: 4K High-Resolution Screenshot
    console.log('\n--- TEST 6: 4K Resolution Visual Verification ---');
    await page.setViewport({ width: 3840, height: 2160 });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: 'screenshot_04_activated_4k.png' });
    console.log('Saved screenshot_04_activated_4k.png');

    console.log('\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('Verification FAILED with error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    // Do not close server so it remains running for user handoff!
    console.log(`Static server remains running at ${targetUrl}`);
  }
}

runVerification();
