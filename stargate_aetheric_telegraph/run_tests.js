/**
 * Automated Verification Suite for Imperial Aetheric Telegraph Terminal
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const PORT = 8420;
const ROOT_DIR = __dirname;

// Simple HTTP Server
function createServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    const filePath = path.join(ROOT_DIR, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`[TEST SERVER] Running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

// Real pointer dispatch helper via elementFromPoint
async function clickAtRenderedCenter(page, selector) {
  const box = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const hitEl = document.elementFromPoint(cx, cy);
    return {
      x: cx,
      y: cy,
      hitTag: hitEl ? hitEl.tagName : null,
      hitId: hitEl ? hitEl.id : null,
      matched: el.contains(hitEl) || hitEl === el
    };
  }, selector);

  if (!box) {
    throw new Error(`Element not found for selector: ${selector}`);
  }

  console.log(`[HIT-TEST] Selector: "${selector}" -> Point (${box.x.toFixed(1)}, ${box.y.toFixed(1)}), Hit: <${box.hitTag} id="${box.hitId}"> (Matched: ${box.matched})`);

  // Dispatch real mouse move and click
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await new Promise(r => setTimeout(r, 40));
  await page.mouse.up();
}

async function runTestSuite() {
  const server = await createServer();
  const testResults = [];

  function record(testName, passed, details = '') {
    testResults.push({ testName, passed, details });
    console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: ${testName} ${details ? '- ' + details : ''}`);
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();

    page.on('console', msg => console.log(`[BROWSER LOG: ${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => console.log(`[BROWSER ERROR] ${err.message}`));

    // 1. Test 1080p Resolution & CSS Scale Transform
    console.log('\n--- TEST 1: 1080p Viewport Scaling & Layout ---');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle0' });

    const scale1080 = await page.evaluate(() => {
      const scaler = document.getElementById('app-scaler');
      const style = window.getComputedStyle(scaler);
      const transform = style.transform;
      const rect = scaler.getBoundingClientRect();
      const hasScroll = document.documentElement.scrollHeight > window.innerHeight;
      return { 
        transform, 
        rect: { width: rect.width, height: rect.height }, 
        hasScroll 
      };
    });

    record('1080p Scale Transform Applied', scale1080.transform !== 'none', `Transform: ${scale1080.transform}`);
    record('1080p Zero Document Scroll', !scale1080.hasScroll, `Height: ${scale1080.rect.height}px`);

    await page.screenshot({ path: path.join(ROOT_DIR, 'screenshot_idle_1080p.png') });
    console.log('Saved screenshot_idle_1080p.png');

    // 2. Test 4K Resolution & Scale Factor
    console.log('\n--- TEST 2: 4K Viewport (3840x2160) Scaling ---');
    await page.setViewport({ width: 3840, height: 2160 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await new Promise(r => setTimeout(r, 200));

    const scale4k = await page.evaluate(() => {
      const scaler = document.getElementById('app-scaler');
      const style = window.getComputedStyle(scaler);
      const transform = style.transform;
      const rect = scaler.getBoundingClientRect();
      return { 
        transform, 
        rect: { width: rect.width, height: rect.height } 
      };
    });

    record('4K Scale Transform Applied', scale4k.transform !== 'none' && scale4k.transform.includes('matrix'), `Transform: ${scale4k.transform}`);
    record('4K Canvas Centered & Scaled', scale4k.rect.width > 3000, `Rendered Width: ${scale4k.rect.width.toFixed(1)}px`);

    await page.screenshot({ path: path.join(ROOT_DIR, 'screenshot_4k.png') });
    console.log('Saved screenshot_4k.png');

    // Reset back to 1080p and reload for pristine interactive tests
    console.log('\n--- Resetting to 1080p for Interactive Cycles ---');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 200));

    // 3. Interactive Dial Cycle 1: Manual 7-Glyph Dial -> Safety Hold Lockout -> Cleared Ignition -> Disengage
    console.log('\n--- TEST 3: Cycle 1 - Manual Dial, Safety Hold Lockout, Ignition & Disengage ---');
    
    // Dial 7 glyphs sequentially using hit-testing center clicks
    const glyphSelectors = [
      '#btn-glyph-sol-01',
      '#btn-glyph-hex-02',
      '#btn-glyph-gim-03',
      '#btn-glyph-arc-04',
      '#btn-glyph-mec-05',
      '#btn-glyph-pis-06',
      '#btn-glyph-spk-07'
    ];

    for (let i = 0; i < glyphSelectors.length; i++) {
      await clickAtRenderedCenter(page, glyphSelectors[i]);
      await new Promise(r => setTimeout(r, 150));
    }

    const stateAfterDial = await page.evaluate(() => {
      const inst = window.terminalInstance;
      return {
        state: inst.state,
        stagedCount: inst.stagedGlyphs.length,
        lockedEscapementsCount: inst.lockedEscapements.size,
        isSafetyHoldEngaged: inst.isSafetyHoldEngaged,
        throttleBtnText: document.getElementById('throttle-btn-label').textContent,
        throttleBtnBlocked: document.getElementById('dispatch-throttle-btn').classList.contains('blocked-hold')
      };
    });

    record('7 Glyphs Staged in State Machine', stateAfterDial.state === 'STAGED' && stateAfterDial.stagedCount === 7, `State: ${stateAfterDial.state}, Staged: ${stateAfterDial.stagedCount}, Escapements: ${stateAfterDial.lockedEscapementsCount}`);
    record('Safety Hold Blocks Throttle', stateAfterDial.isSafetyHoldEngaged && stateAfterDial.throttleBtnBlocked, `Throttle Label: "${stateAfterDial.throttleBtnText}"`);

    // Attempt to click blocked throttle - must NOT ignite
    console.log('Attempting to click throttle while Safety Hold is ENGAGED...');
    await clickAtRenderedCenter(page, '#dispatch-throttle-btn');
    await new Promise(r => setTimeout(r, 200));

    const stateAfterBlockedClick = await page.evaluate(() => window.terminalInstance.state);
    record('Ignition Blocked while Safety Hold Active', stateAfterBlockedClick === 'STAGED', `State remains: ${stateAfterBlockedClick}`);

    // Disengage Safety Hold Switch
    console.log('Toggling Safety Hold switch off...');
    await clickAtRenderedCenter(page, '#safety-hold-toggle-btn');
    await new Promise(r => setTimeout(r, 150));

    const stateAfterHoldCleared = await page.evaluate(() => {
      const inst = window.terminalInstance;
      return {
        isSafetyHoldEngaged: inst.isSafetyHoldEngaged,
        throttleBtnText: document.getElementById('throttle-btn-label').textContent,
        throttleBtnBlocked: document.getElementById('dispatch-throttle-btn').classList.contains('blocked-hold')
      };
    });

    record('Safety Hold Cleared', !stateAfterHoldCleared.isSafetyHoldEngaged && !stateAfterHoldCleared.throttleBtnBlocked, `Label: "${stateAfterHoldCleared.throttleBtnText}"`);

    // Click Dispatch Throttle to Ignite
    console.log('Clicking Dispatch Throttle to Ignite Conduit...');
    await clickAtRenderedCenter(page, '#dispatch-throttle-btn');
    await new Promise(r => setTimeout(r, 1400)); // Wait for ignition transition

    const stateAfterIgnition = await page.evaluate(() => {
      const inst = window.terminalInstance;
      return {
        state: inst.state,
        pressure: inst.currentPressure,
        voltage: inst.currentVoltage
      };
    });

    record('Conduit Active / Ignition Successful', stateAfterIgnition.state === 'ACTIVE', `State: ${stateAfterIgnition.state}, Pressure: ${stateAfterIgnition.pressure.toFixed(1)} inHg, Voltage: ${Math.round(stateAfterIgnition.voltage)}V`);

    await page.screenshot({ path: path.join(ROOT_DIR, 'screenshot_active_conduit.png') });
    console.log('Saved screenshot_active_conduit.png');

    // Disengage via Emergency Vent button
    console.log('Triggering Disengage / Emergency Vent...');
    await clickAtRenderedCenter(page, '#emergency-vent-btn');
    await new Promise(r => setTimeout(r, 300));

    const stateAfterDisengage1 = await page.evaluate(() => {
      const inst = window.terminalInstance;
      return {
        state: inst.state,
        stagedCount: inst.stagedGlyphs.length,
        lockedEscapementsCount: inst.lockedEscapements.size
      };
    });

    record('Cycle 1 Disengage Succeeded', stateAfterDisengage1.state === 'IDLE' && stateAfterDisengage1.stagedCount === 0, `State: ${stateAfterDisengage1.state}, Staged: ${stateAfterDisengage1.stagedCount}`);

    // 4. Interactive Dial Cycle 2: Quick-Dial Injection -> Safety Hold -> Ignition -> Disengage
    console.log('\n--- TEST 4: Cycle 2 - Quick-Dial Conduit Injection, Ignition & Disengage ---');
    
    // Filter to Tier 1
    await clickAtRenderedCenter(page, '#tab-filter-tier1');
    await new Promise(r => setTimeout(r, 150));

    // Click inject button on Calcutta Grand Manifold
    console.log('Injecting Calcutta Grand Manifold Quick-Dial...');
    await clickAtRenderedCenter(page, '#qd-card-qd-calcutta .inject-btn');
    await new Promise(r => setTimeout(r, 180 * 8 + 600)); // Wait for all 7 glyphs to stage

    const stateAfterQuickDial = await page.evaluate(() => {
      const inst = window.terminalInstance;
      return {
        state: inst.state,
        stagedCount: inst.stagedGlyphs.length,
        activeConduitName: inst.activeConduit ? inst.activeConduit.name : null
      };
    });

    record('Quick-Dial Injected 7 Glyphs', stateAfterQuickDial.state === 'STAGED' && stateAfterQuickDial.stagedCount === 7, `State: ${stateAfterQuickDial.state}, Staged: ${stateAfterQuickDial.stagedCount}, Conduit: ${stateAfterQuickDial.activeConduitName}`);

    // Toggle Safety Hold off (if engaged)
    const isHoldEngaged = await page.evaluate(() => window.terminalInstance.isSafetyHoldEngaged);
    if (isHoldEngaged) {
      console.log('Disengaging Safety Hold switch...');
      await clickAtRenderedCenter(page, '#safety-hold-toggle-btn');
      await new Promise(r => setTimeout(r, 150));
    }

    // Fire Throttle
    console.log('Firing Dispatch Throttle for Cycle 2...');
    await clickAtRenderedCenter(page, '#dispatch-throttle-btn');
    await new Promise(r => setTimeout(r, 1400));

    const stateAfterIgnition2 = await page.evaluate(() => window.terminalInstance.state);
    record('Cycle 2 Ignition Successful', stateAfterIgnition2 === 'ACTIVE', `State: ${stateAfterIgnition2}`);

    // Disengage again via Emergency Vent
    console.log('Disengaging Cycle 2 via Emergency Vent...');
    await clickAtRenderedCenter(page, '#emergency-vent-btn');
    await new Promise(r => setTimeout(r, 300));

    const stateAfterDisengage2 = await page.evaluate(() => {
      const inst = window.terminalInstance;
      return {
        state: inst.state,
        stagedCount: inst.stagedGlyphs.length
      };
    });

    record('Cycle 2 Disengage Succeeded', stateAfterDisengage2.state === 'IDLE' && stateAfterDisengage2.stagedCount === 0, `State: ${stateAfterDisengage2.state}`);

    // 5. Test Operator Reference Manual Modal
    console.log('\n--- TEST 5: Operator Reference Manual Modal ---');
    await clickAtRenderedCenter(page, '#manual-modal-open-btn');
    await new Promise(r => setTimeout(r, 200));

    const modalOpenState = await page.evaluate(() => {
      const modal = document.getElementById('manual-modal-backdrop');
      return modal.classList.contains('open');
    });
    record('Operator Manual Opens', modalOpenState, 'Modal backdrop has .open class');

    // Switch to Codex Tab
    await page.evaluate(() => {
      const tab = document.querySelector('.modal-tab-btn[data-tab="tab-codex"]');
      if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 200));

    await page.screenshot({ path: path.join(ROOT_DIR, 'screenshot_manual_modal.png') });
    console.log('Saved screenshot_manual_modal.png');

    // Close Modal
    await clickAtRenderedCenter(page, '#manual-modal-close-btn');
    await new Promise(r => setTimeout(r, 150));

    const modalClosedState = await page.evaluate(() => {
      const modal = document.getElementById('manual-modal-backdrop');
      return !modal.classList.contains('open');
    });
    record('Operator Manual Closes', modalClosedState, 'Modal backdrop closed');

    // 6. Test Footer Links & Metadata
    console.log('\n--- TEST 6: Footer Links & Attribution ---');
    const footerMeta = await page.evaluate(() => {
      const link = document.querySelector('footer a.footer-link');
      const versionEl = document.querySelector('footer .footer-version');
      return {
        href: link ? link.getAttribute('href') : null,
        rel: link ? link.getAttribute('rel') : null,
        target: link ? link.getAttribute('target') : null,
        text: link ? link.textContent.trim() : null,
        versionText: versionEl ? versionEl.textContent.trim() : null
      };
    });

    record('StarlightDaemon Footer Link Valid', footerMeta.href === 'https://github.com/StarlightDaemon' && footerMeta.rel === 'noopener noreferrer' && footerMeta.target === '_blank', `Link: ${footerMeta.href}, Rel: ${footerMeta.rel}`);
    record('Version Readout Valid', footerMeta.versionText.includes('v1.0.0'), `Version: ${footerMeta.versionText}`);

    // Summary
    const totalPassed = testResults.filter(r => r.passed).length;
    console.log(`\n========================================`);
    console.log(`VERIFICATION SUMMARY: ${totalPassed} / ${testResults.length} TESTS PASSED`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('[FATAL ERROR IN TEST SUITE]', err);
  } finally {
    if (browser) await browser.close();
    // Leave server running or close if script finishes (we will keep dev server running separately)
    server.close();
  }
}

runTestSuite();
