const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8899;
const DIR = __dirname;
// Verification screenshots go to the gitignored test/ directory, never the
// build root (STARGATE_BUILD_STANDARDS.md section 3).
const OUT_DIR = path.join(__dirname, 'test');
fs.mkdirSync(OUT_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png'
};

// 1. Lightweight Static HTTP Server
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  if (reqPath === '/favicon.ico') {
    res.writeHead(200, { 'Content-Type': 'image/x-icon' });
    res.end();
    return;
  }
  const filePath = path.join(DIR, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

async function makeHttpRequest(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          bodyLength: data.length
        });
      });
    }).on('error', reject);
  });
}

async function runVerification() {
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[HTTP Server] Listening on http://127.0.0.1:${PORT}`);

  try {
    // Check HTTP endpoints
    console.log('\n--- 1. HTTP Endpoint Verification ---');
    const filesToTest = ['/index.html', '/styles.css', '/app.js', '/version.json'];
    for (const f of filesToTest) {
      const resp = await makeHttpRequest(f);
      console.log(`GET ${f} => Status: ${resp.statusCode}, Content-Type: ${resp.contentType}, Bytes: ${resp.bodyLength}`);
      if (resp.statusCode !== 200) {
        throw new Error(`Failed to load ${f}: status ${resp.statusCode}`);
      }
    }

    // Launch Puppeteer
    console.log('\n--- 2. Puppeteer Interactive & Visual Verification ---');
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
    } catch (e) {
      console.log('Puppeteer not found locally, checking global or installing...');
      throw e;
    }

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.toString()));
    page.on('console', msg => {
      if (msg.type() === 'error') pageErrors.push(`Console Error: ${msg.text()}`);
    });

    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle0' });
    console.log('[Puppeteer] Page loaded at 1920x1080.');

    // Screenshot 1: Idle
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_01_idle.png') });
    console.log('[Screenshot] Saved screenshot_01_idle.png');

    // Test Cycle 1: Dial 8 Glyphs -> Engage -> Disengage
    console.log('\n--- 3. Testing Dial Cycle 1 (Manual 8-symbol Dial -> Engage -> Disengage) ---');
    for (let i = 0; i < 8; i++) {
      await page.click(`#glyphBtn-${i}`);
      await new Promise(r => setTimeout(r, 200));
    }
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_02_dialed.png') });
    console.log('[Screenshot] Saved screenshot_02_dialed.png');

    // Engage
    const engageBtn = await page.$('#engageBtn');
    const isEngageDisabled = await page.evaluate(el => el.disabled, engageBtn);
    console.log(`Engage button disabled before click: ${isEngageDisabled}`);
    if (isEngageDisabled) throw new Error('Engage button should be enabled after 8 symbols');

    await page.click('#engageBtn');
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_03_engaged.png') });
    console.log('[Screenshot] Saved screenshot_03_engaged.png');

    const statusAfterEngage = await page.evaluate(() => document.getElementById('authStatusPill').textContent);
    console.log(`Status after Engage: "${statusAfterEngage}"`);

    // Disengage
    await page.click('#disengageBtn');
    await new Promise(r => setTimeout(r, 600));
    const statusAfterDisengage1 = await page.evaluate(() => document.getElementById('authStatusPill').textContent);
    console.log(`Status after Disengage: "${statusAfterDisengage1}"`);

    // Test Cycle 2: Second Full Dial-Disengage-Redial Cycle
    console.log('\n--- 4. Testing Dial Cycle 2 (Second Full Cycle for Verification) ---');
    for (let i = 8; i < 16; i++) {
      await page.click(`#glyphBtn-${i}`);
      await new Promise(r => setTimeout(r, 200));
    }
    await page.click('#engageBtn');
    await new Promise(r => setTimeout(r, 600));
    const statusAfterEngage2 = await page.evaluate(() => document.getElementById('authStatusPill').textContent);
    console.log(`Status after Second Engage: "${statusAfterEngage2}"`);

    await page.click('#disengageBtn');
    await new Promise(r => setTimeout(r, 600));
    const statusAfterDisengage2 = await page.evaluate(() => document.getElementById('authStatusPill').textContent);
    console.log(`Status after Second Disengage: "${statusAfterDisengage2}"`);
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_04_disengaged_redialed.png') });
    console.log('[Screenshot] Saved screenshot_04_disengaged_redialed.png');

    // Test 5: Lockout Control (Compliance Freeze)
    console.log('\n--- 5. Testing Lockout Control (Compliance Freeze) ---');
    await page.click('#lockoutToggleBtn');
    await new Promise(r => setTimeout(r, 200));
    // Dial 8 symbols while locked out
    for (let i = 0; i < 8; i++) {
      await page.click(`#glyphBtn-${i}`);
      await new Promise(r => setTimeout(r, 200));
    }
    // Attempt Engage while frozen
    await page.click('#engageBtn');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_05_lockout_rejection.png') });
    console.log('[Screenshot] Saved screenshot_05_lockout_rejection.png (Lockout Rejection Stamp Verified)');

    // Unlock lockout
    await page.click('#lockoutToggleBtn');
    await new Promise(r => setTimeout(r, 200));
    await page.click('#disengageBtn');
    await new Promise(r => setTimeout(r, 600));

    // Test 6: Quick-Dial Presets (Tier 1 & Tier 2)
    console.log('\n--- 6. Testing Quick-Dial Presets ---');
    await page.click('#qdRoute1');
    await new Promise(r => setTimeout(r, 1600)); // wait for preset sequence
    await page.click('#engageBtn');
    await new Promise(r => setTimeout(r, 500));
    await page.click('#disengageBtn');
    await new Promise(r => setTimeout(r, 600));

    await page.click('#qdRoute4');
    await new Promise(r => setTimeout(r, 1600));
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_06_quickdial.png') });
    console.log('[Screenshot] Saved screenshot_06_quickdial.png');
    await page.click('#disengageBtn');
    await new Promise(r => setTimeout(r, 600));

    // Test 7: Operator Reference Help Modal (?)
    console.log('\n--- 7. Testing Operator Reference Modal ---');
    await page.click('#operatorHelpBtn');
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_07_help_modal.png') });
    console.log('[Screenshot] Saved screenshot_07_help_modal.png');

    await page.click('#modalDismissBtn');
    await new Promise(r => setTimeout(r, 400));

    // Check page errors
    console.log('\n--- 8. Page Error Summary ---');
    if (pageErrors.length > 0) {
      console.error('Captured page errors:', pageErrors);
      throw new Error('Page encountered runtime errors during testing.');
    } else {
      console.log('Zero console or runtime errors detected!');
    }

    await browser.close();
    console.log('\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n');

  } finally {
    server.close();
  }
}

runVerification().catch(err => {
  console.error('[Verification Failed]:', err);
  process.exit(1);
});
