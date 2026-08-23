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

async function closeoutVerification() {
  console.log('================================================================');
  console.log('   FINAL CLOSE-OUT RE-VERIFICATION ACROSS 3 VIEWPORTS');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const testViewports = [
    { name: 'closeout_1920x1080_16x9', width: 1920, height: 1080, desc: 'Standard 16:9' },
    { name: 'closeout_2560x1080_ultrawide', width: 2560, height: 1080, desc: 'Wider Non-16:9 (Ultrawide 21:9)' },
    { name: 'closeout_1280x1280_square', width: 1280, height: 1280, desc: 'Narrower Non-16:9 (Square 1:1)' }
  ];

  const results = [];

  for (const vp of testViewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
    await sleep(400);

    const data = await page.evaluate(() => {
      const container = document.getElementById('app-container');
      const rect = container.getBoundingClientRect();
      const bodyStyle = window.getComputedStyle(document.body);
      const htmlStyle = window.getComputedStyle(document.documentElement);
      const beforeStyle = window.getComputedStyle(document.body, '::before');
      const scale = getComputedStyle(document.documentElement).getPropertyValue('--ui-scale');

      return {
        scale: scale.trim(),
        containerRect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        bodyBg: bodyStyle.backgroundColor,
        htmlBg: htmlStyle.backgroundColor,
        beforePosition: beforeStyle.position,
        beforeWidth: beforeStyle.width,
        beforeHeight: beforeStyle.height
      };
    });

    const screenshotPath = path.join(SCREENSHOT_DIR, `${vp.name}.png`);
    await page.screenshot({ path: screenshotPath });

    console.log(`[${vp.desc}] Viewport ${vp.width}x${vp.height}:`);
    console.log(`  - Container Rect: x=${data.containerRect.x}px, y=${data.containerRect.y}px, w=${data.containerRect.width}px, h=${data.containerRect.height}px`);
    console.log(`  - Scale Factor: ${data.scale}`);
    console.log(`  - Body Background: ${data.bodyBg}`);
    console.log(`  - Backdrop ::before Position: ${data.beforePosition}, Dimensions: ${data.beforeWidth} x ${data.beforeHeight}`);
    console.log(`  - Screenshot captured: ${vp.name}.png\n`);

    results.push({
      viewport: vp,
      data
    });
  }

  await browser.close();
  return results;
}

closeoutVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
