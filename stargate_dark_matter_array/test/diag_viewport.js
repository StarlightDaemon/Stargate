const puppeteer = require('puppeteer');
const path = require('path');

async function testAspectRatios() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  const sizes = [
    { name: '16x9_1920x1080', width: 1920, height: 1080 },
    { name: 'ultrawide_2560x1080', width: 2560, height: 1080 },
    { name: 'narrow_1280x1280', width: 1280, height: 1280 }
  ];

  for (const s of sizes) {
    await page.setViewport({ width: s.width, height: s.height });
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
    
    const rect = await page.$eval('#app-container', el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    const bodyBg = await page.$eval('body', el => window.getComputedStyle(el).backgroundColor);
    const scale = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ui-scale'));

    console.log(`Viewport ${s.width}x${s.height}:`);
    console.log(`  - Container Rect: x=${rect.x.toFixed(1)}, y=${rect.y.toFixed(1)}, w=${rect.width.toFixed(1)}, h=${rect.height.toFixed(1)}`);
    console.log(`  - Body BG: ${bodyBg}, Computed Scale: ${scale}`);
    
    await page.screenshot({ path: path.join(__dirname, 'screenshots', `diag_${s.name}.png`) });
  }

  await browser.close();
}

testAspectRatios().catch(console.error);
