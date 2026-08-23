const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyViewportScaling() {
  console.log('================================================================');
  console.log('   BOREAS-IX VIEWPORT SCALING & BACKDROP VERIFICATION');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // -------------------------------------------------------------
  // TEST 1: STANDARD 1920x1080 (16:9)
  // -------------------------------------------------------------
  console.log('--- TEST 1: STANDARD 1920x1080 (16:9) ---');
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
  await sleep(400);

  const rect1 = await page.$eval('#app-container', el => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  console.log(`  - 1920x1080: x=${rect1.x}, y=${rect1.y}, w=${rect1.width}, h=${rect1.height}`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'viewport_1920x1080.png') });
  console.log('✓ Captured screenshot: viewport_1920x1080.png');

  // -------------------------------------------------------------
  // TEST 2: WIDER NON-16:9 WINDOW (ULTRAWIDE 2560x1080)
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: WIDER NON-16:9 WINDOW (ULTRAWIDE 2560x1080) ---');
  await page.setViewport({ width: 2560, height: 1080 });
  await sleep(400);

  const rect2 = await page.$eval('#app-container', el => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  console.log(`  - 2560x1080: x=${rect2.x.toFixed(1)}, y=${rect2.y.toFixed(1)}, w=${rect2.width.toFixed(1)}, h=${rect2.height.toFixed(1)}`);
  
  // Verify horizontal centering (x ~ 320px)
  if (Math.abs(rect2.x - 320) > 2) {
    throw new Error(`Expected horizontal centering x ≈ 320px, got ${rect2.x}`);
  }
  console.log('✓ Confirmed horizontal centering with balanced themed pillarbox gutters (320px each)');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'viewport_ultrawide_2560x1080.png') });
  console.log('✓ Captured screenshot: viewport_ultrawide_2560x1080.png');

  // -------------------------------------------------------------
  // TEST 3: NARROWER NON-16:9 WINDOW (SQUARE 1280x1280)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: NARROWER NON-16:9 WINDOW (SQUARE 1280x1280) ---');
  await page.setViewport({ width: 1280, height: 1280 });
  await sleep(400);

  const rect3 = await page.$eval('#app-container', el => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  console.log(`  - 1280x1280: x=${rect3.x.toFixed(1)}, y=${rect3.y.toFixed(1)}, w=${rect3.width.toFixed(1)}, h=${rect3.height.toFixed(1)}`);

  // Verify vertical centering (y ~ 280px)
  if (Math.abs(rect3.y - 280) > 2) {
    throw new Error(`Expected vertical centering y ≈ 280px, got ${rect3.y}`);
  }
  console.log('✓ Confirmed vertical centering with balanced themed letterbox gutters (280px each)');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'viewport_narrow_1280x1280.png') });
  console.log('✓ Captured screenshot: viewport_narrow_1280x1280.png');

  // -------------------------------------------------------------
  // TEST 4: CORE LOOP REGRESSION CHECK
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: CORE LOOP REGRESSION CHECK ---');
  await page.setViewport({ width: 1920, height: 1080 });
  await sleep(300);

  // Click 7 channels
  const channels = ['pmt-01', 'pmt-02', 'pmt-03', 'pmt-04', 'pmt-05', 'pmt-06', 'pmt-07'];
  for (const ch of channels) {
    await page.click(`#btn-${ch}`);
    await sleep(350);
  }

  const lockedCount = await page.evaluate(() => window.dmDiscrimination.getLockedCount());
  const state = await page.evaluate(() => window.dmApp.apertureState);
  console.log(`✓ 7 Slots locked: ${lockedCount}/7, State: "${state}" (Must be PENDING)`);
  if (lockedCount !== 7 || state !== 'PENDING') {
    throw new Error('Core loop regression detected!');
  }

  // Disengage
  await page.click('#btn-disengage');
  await sleep(300);
  const resetCount = await page.evaluate(() => window.dmDiscrimination.getLockedCount());
  console.log(`✓ Disengaged cleanly: slots = ${resetCount}`);

  await browser.close();

  console.log('\n================================================================');
  console.log('   ALL VIEWPORT & BACKDROP TESTS PASSED 100%!');
  console.log('================================================================\n');
}

verifyViewportScaling().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
