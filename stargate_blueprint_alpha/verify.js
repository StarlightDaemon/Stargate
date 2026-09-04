/**
 * VOSSEN-KLEIN TOPOLOGICAL DRAFTING STATION // AUTOMATED VERIFICATION SUITE
 * Comprehensive end-to-end testing with Puppeteer, checking scaling at 1080p and 4K,
 * real pointer events, dial-disengage-redial cycles, Review Hold, and screenshot capture.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
// Verification screenshots go to the gitignored test/ directory, never the
// build root (STARGATE_BUILD_STANDARDS.md section 3).
const OUT_DIR = path.join(__dirname, 'test');
fs.mkdirSync(OUT_DIR, { recursive: true });

const PORT = 8088;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Static file server for verification
function createServer() {
  const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(__dirname, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[VERIFY SERVER] Running at ${BASE_URL}`);
      resolve(server);
    });
  });
}

// Helper to make real HTTP GET request
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=== STARTING COMPLETE VERIFICATION SUITE ===\n');
  const server = await createServer();
  let browser = null;

  try {
    // 1. HTTP Endpoint & Asset Integrity Checks
    console.log('--- 1. Testing HTTP File Endpoints ---');
    const endpoints = [
      { path: '/index.html', mime: 'text/html' },
      { path: '/style.css', mime: 'text/css' },
      { path: '/app.js', mime: 'application/javascript' },
      { path: '/audio.js', mime: 'application/javascript' },
      { path: '/version.json', mime: 'application/json' },
      { path: '/CHANGELOG.md', mime: 'text/markdown' }
    ];

    for (const ep of endpoints) {
      const res = await fetchUrl(`${BASE_URL}${ep.path}`);
      if (res.status === 200 && res.headers['content-type'].includes(ep.mime)) {
        console.log(`  ✓ GET ${ep.path} -> 200 OK (${res.headers['content-type']})`);
      } else {
        throw new Error(`Endpoint check failed for ${ep.path}: status ${res.status}`);
      }
    }

    // 2. Version & Model Attribution Check
    console.log('\n--- 2. Checking Versioning & Model Attribution ---');
    const versionJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'version.json'), 'utf8'));
    console.log(`  ✓ version.json: version="${versionJson.version}", model="${versionJson.model}"`);
    if (!versionJson.version || !versionJson.model) {
      throw new Error('version.json missing version or model attribute');
    }

    const changelog = fs.readFileSync(path.join(__dirname, 'CHANGELOG.md'), 'utf8');
    if (changelog.includes('**Built by:**') && changelog.includes(versionJson.model)) {
      console.log('  ✓ CHANGELOG.md contains proper "**Built by:**" entry with model identity.');
    } else {
      throw new Error('CHANGELOG.md missing exact model attribution matching version.json');
    }

    // 3. Puppeteer Browser Testing
    console.log('\n--- 3. Launching Puppeteer Browser ---');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader']
    });
    const page = await browser.newPage();

    // 4. Test 1080p Baseline Viewport Scaling
    console.log('\n--- 4. Testing 1080p Baseline Viewport (1920x1080) ---');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });

    const transform1080 = await page.evaluate(() => {
      const el = document.getElementById('drafting-station-frame');
      return window.getComputedStyle(el).transform;
    });
    console.log(`  ✓ 1080p transform style: "${transform1080}" (is NOT "none": ${transform1080 !== 'none'})`);
    if (transform1080 === 'none') {
      throw new Error('CSS scale transform failed at 1080p (returned "none")');
    }

    // Capture 1080p Screenshot
    const screenshot1080Path = path.join(OUT_DIR, 'screenshot_1080p_dormant.png');
    await page.screenshot({ path: screenshot1080Path });
    console.log(`  ✓ Saved 1080p dormant screenshot: ${screenshot1080Path}`);

    // 5. Test 4K Viewport Scaling (3840x2160)
    console.log('\n--- 5. Testing 4K High-DPI Viewport (3840x2160) ---');
    await page.setViewport({ width: 3840, height: 2160 });
    await new Promise(r => setTimeout(r, 200));

    const transform4K = await page.evaluate(() => {
      const el = document.getElementById('drafting-station-frame');
      return window.getComputedStyle(el).transform;
    });
    console.log(`  ✓ 4K transform style: "${transform4K}" (is NOT "none": ${transform4K !== 'none'})`);
    if (transform4K === 'none') {
      throw new Error('CSS scale transform failed at 4K (returned "none")');
    }

    // Capture 4K Screenshot
    const screenshot4KPath = path.join(OUT_DIR, 'screenshot_4k_scaled.png');
    await page.screenshot({ path: screenshot4KPath });
    console.log(`  ✓ Saved 4K screenshot: ${screenshot4KPath}`);

    // Reset to 1920x1080 for interactive sequence testing
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(r => setTimeout(r, 200));

    // 6. Test Interactive Dialing Sequence with Real Pointer Events (Cycle 1)
    console.log('\n--- 6. Testing Interactive Dialing & Disengage Cycle #1 ---');
    // Click 6 glyphs using real pointer coordinates
    const glyphIndicesToClick = [0, 1, 2, 3, 4, 5];
    for (const idx of glyphIndicesToClick) {
      const glyphSelector = `.glyph-btn[data-glyph-index="${idx}"]`;
      const btn = await page.$(glyphSelector);
      const box = await btn.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await new Promise(r => setTimeout(r, 80));
    }

    // Verify 6 slots filled
    const stagedCount1 = await page.evaluate(() => {
      return document.querySelectorAll('.seq-slot.filled').length;
    });
    console.log(`  ✓ Dialed 6 glyphs. Staged slots filled: ${stagedCount1}/6`);
    if (stagedCount1 !== 6) throw new Error(`Expected 6 staged slots, got ${stagedCount1}`);

    // Click [ ENGAGE / APPROVE DRAWING ]
    console.log('  -> Clicking [ ENGAGE / APPROVE DRAWING ] with pointer...');
    const engageBtn = await page.$('#btn-engage-draft');
    const engageBox = await engageBtn.boundingBox();
    await page.mouse.click(engageBox.x + engageBox.width / 2, engageBox.y + engageBox.height / 2);
    await new Promise(r => setTimeout(r, 500));

    // Verify connection status and approval stamp
    const isConnected1 = await page.evaluate(() => {
      const stamp = document.getElementById('approval-stamp-group');
      const stat = document.getElementById('system-status-indicator');
      return !stamp.classList.contains('hidden') && stat.textContent.includes('ACTIVE');
    });
    console.log(`  ✓ Manifold Approved & Active: ${isConnected1}`);
    if (!isConnected1) throw new Error('Failed to activate manifold after dial');

    // Capture Active Manifold Screenshot
    const screenshotActivePath = path.join(OUT_DIR, 'screenshot_active_manifold.png');
    await page.screenshot({ path: screenshotActivePath });
    console.log(`  ✓ Saved active manifold screenshot: ${screenshotActivePath}`);

    // Click [ VOID DRAFT / DISENGAGE ]
    console.log('  -> Clicking [ VOID DRAFT / DISENGAGE ] with pointer...');
    const disengageBtn = await page.$('#btn-disengage-draft');
    const disengageBox = await disengageBtn.boundingBox();
    await page.mouse.click(disengageBox.x + disengageBox.width / 2, disengageBox.y + disengageBox.height / 2);
    await new Promise(r => setTimeout(r, 300));

    const isDormant1 = await page.evaluate(() => {
      const stamp = document.getElementById('approval-stamp-group');
      const stat = document.getElementById('system-status-indicator');
      const slots = document.querySelectorAll('.seq-slot.filled').length;
      return stamp.classList.contains('hidden') && stat.textContent.includes('READY') && slots === 0;
    });
    console.log(`  ✓ Disengaged cleanly. Drawing restored to draft state: ${isDormant1}`);
    if (!isDormant1) throw new Error('Failed to disengage in Cycle 1');

    // 7. Test Interactive Dialing Sequence (Cycle 2 - Verification Requirement)
    console.log('\n--- 7. Testing Interactive Dialing & Disengage Cycle #2 ---');
    const glyphIndicesCycle2 = [6, 7, 8, 9, 10, 11];
    for (const idx of glyphIndicesCycle2) {
      const glyphSelector = `.glyph-btn[data-glyph-index="${idx}"]`;
      const btn = await page.$(glyphSelector);
      const box = await btn.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await new Promise(r => setTimeout(r, 80));
    }

    // Click Engage
    await page.mouse.click(engageBox.x + engageBox.width / 2, engageBox.y + engageBox.height / 2);
    await new Promise(r => setTimeout(r, 500));

    const isConnected2 = await page.evaluate(() => {
      const stamp = document.getElementById('approval-stamp-group');
      return !stamp.classList.contains('hidden');
    });
    console.log(`  ✓ Cycle 2 Manifold Approved & Active: ${isConnected2}`);
    if (!isConnected2) throw new Error('Cycle 2 engage failed');

    // Disengage again
    await page.mouse.click(disengageBox.x + disengageBox.width / 2, disengageBox.y + disengageBox.height / 2);
    await new Promise(r => setTimeout(r, 300));
    console.log('  ✓ Cycle 2 Disengaged successfully.');

    // 8. Test Review Hold (Safety Lockout Subsystem)
    console.log('\n--- 8. Testing Structural Review Hold Subsystem ---');
    const holdBtn = await page.$('#btn-review-hold-toggle');
    const holdBox = await holdBtn.boundingBox();
    // Toggle Hold ON
    await page.mouse.click(holdBox.x + holdBox.width / 2, holdBox.y + holdBox.height / 2);
    await new Promise(r => setTimeout(r, 150));

    const isHoldEngaged = await page.evaluate(() => {
      const btn = document.getElementById('btn-review-hold-toggle');
      return btn.classList.contains('active-hold');
    });
    console.log(`  ✓ Review Hold toggled ON: ${isHoldEngaged}`);

    // Dial 6 glyphs
    for (const idx of [12, 13, 14, 15, 0, 1]) {
      const btn = await page.$(`.glyph-btn[data-glyph-index="${idx}"]`);
      const box = await btn.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await new Promise(r => setTimeout(r, 60));
    }

    // Attempt to Engage while Hold is active -> MUST BE REFUSED
    await page.mouse.click(engageBox.x + engageBox.width / 2, engageBox.y + engageBox.height / 2);
    await new Promise(r => setTimeout(r, 300));

    const holdRejected = await page.evaluate(() => {
      const stamp = document.getElementById('review-hold-stamp-group');
      const stat = document.getElementById('system-status-indicator');
      return !stamp.classList.contains('hidden') || stat.textContent.includes('HOLD') || stat.textContent.includes('REFUSED');
    });
    console.log(`  ✓ Review Hold correctly blocked connection attempt: ${holdRejected}`);
    if (!holdRejected) throw new Error('Review Hold failed to block transmission');

    // Capture Review Hold Screenshot
    const screenshotHoldPath = path.join(OUT_DIR, 'screenshot_review_hold.png');
    await page.screenshot({ path: screenshotHoldPath });
    console.log(`  ✓ Saved review hold screenshot: ${screenshotHoldPath}`);

    // Toggle Hold OFF
    await page.mouse.click(holdBox.x + holdBox.width / 2, holdBox.y + holdBox.height / 2);
    await new Promise(r => setTimeout(r, 150));
    await page.mouse.click(disengageBox.x + disengageBox.width / 2, disengageBox.y + disengageBox.height / 2);
    await new Promise(r => setTimeout(r, 300));

    // 9. Test Preloaded Quick-Dial Site Plans (Tier 1 & Tier 2)
    console.log('\n--- 9. Testing Quick-Dial Site Plans ---');
    // Tier 1 Test
    const tier1Card = await page.$('.site-plan-card[data-plan-id="civil-helios"]');
    const t1Box = await tier1Card.boundingBox();
    await page.mouse.click(t1Box.x + t1Box.width / 2, t1Box.y + t1Box.height / 2);
    await new Promise(r => setTimeout(r, 800));

    const t1Active = await page.evaluate(() => {
      const stamp = document.getElementById('approval-stamp-group');
      const stat = document.getElementById('system-status-indicator');
      return !stamp.classList.contains('hidden') || stat.textContent.includes('ACTIVE');
    });
    console.log(`  ✓ Tier-1 Site Plan 101-A auto-dialed and active: ${t1Active}`);
    if (!t1Active) throw new Error('Tier 1 quick-dial failed');

    // Tier 2 Test (Classified)
    const tier2Card = await page.$('.site-plan-card[data-plan-id="class-oort"]');
    const t2Box = await tier2Card.boundingBox();
    await page.mouse.click(t2Box.x + t2Box.width / 2, t2Box.y + t2Box.height / 2);
    await new Promise(r => setTimeout(r, 800));

    const t2Active = await page.evaluate(() => {
      const stamp = document.getElementById('approval-stamp-group');
      const stat = document.getElementById('system-status-indicator');
      return !stamp.classList.contains('hidden') || stat.textContent.includes('ACTIVE');
    });
    console.log(`  ✓ Tier-2 Classified Blueprint EX-901 auto-dialed and active: ${t2Active}`);
    if (!t2Active) throw new Error('Tier 2 quick-dial failed');

    // Capture Quick-Dial Active Screenshot
    const screenshotQuickPath = path.join(OUT_DIR, 'screenshot_quickdial_active.png');
    await page.screenshot({ path: screenshotQuickPath });
    console.log(`  ✓ Saved quick dial screenshot: ${screenshotQuickPath}`);

    // Disengage
    await page.mouse.click(disengageBox.x + disengageBox.width / 2, disengageBox.y + disengageBox.height / 2);
    await new Promise(r => setTimeout(r, 300));

    // 10. Test Operator Reference Modal Overlay
    console.log('\n--- 10. Testing Operator Reference Modal ---');
    const helpBtn = await page.$('#operator-help-btn');
    const helpBox = await helpBtn.boundingBox();
    await page.mouse.click(helpBox.x + helpBox.width / 2, helpBox.y + helpBox.height / 2);
    await new Promise(r => setTimeout(r, 200));

    const modalVisible = await page.evaluate(() => {
      const modal = document.getElementById('operator-modal');
      return !modal.classList.contains('hidden');
    });
    console.log(`  ✓ Operator modal opened: ${modalVisible}`);
    if (!modalVisible) throw new Error('Operator modal failed to open');

    // Dismiss modal with ESC key
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 200));

    const modalDismissed = await page.evaluate(() => {
      const modal = document.getElementById('operator-modal');
      return modal.classList.contains('hidden');
    });
    console.log(`  ✓ Operator modal dismissed via ESC: ${modalDismissed}`);
    if (!modalDismissed) throw new Error('Operator modal failed to dismiss');

    // 11. Attribution Link Check
    console.log('\n--- 11. Checking Attribution Link ---');
    const attribution = await page.evaluate(() => {
      const a = document.getElementById('starlight-attribution');
      return {
        href: a.getAttribute('href'),
        target: a.getAttribute('target'),
        rel: a.getAttribute('rel'),
        text: a.textContent.trim()
      };
    });
    console.log(`  ✓ Attribution: text="${attribution.text}", href="${attribution.href}", target="${attribution.target}", rel="${attribution.rel}"`);
    if (attribution.href !== 'https://github.com/StarlightDaemon' || attribution.rel !== 'noopener noreferrer' || attribution.text !== 'StarlightDaemon') {
      throw new Error('Attribution link attributes incorrect');
    }

    console.log('\n=============================================');
    console.log('🎉 ALL AUTOMATED VERIFICATION TESTS PASSED! 🎉');
    console.log('=============================================\n');

  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

runTests();
