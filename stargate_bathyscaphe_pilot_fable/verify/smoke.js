const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://127.0.0.1:8747/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  const info = await page.evaluate(() => ({ phase: document.body.dataset.phase, scale: window.__lanternScale, glyphs: document.querySelectorAll('.glyph').length, lockout: document.getElementById('lockout').checked, msg: document.getElementById('profile-msg').textContent }));
  console.log(JSON.stringify(info, null, 1));
  await page.screenshot({ path: 'verify/shots/smoke_cold.png' });
  console.log('errors:', errors);
  await browser.close();
})();
