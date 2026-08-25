/* one-off probe: where do SVG text labels land at 1080 vs 4K? */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

function findChrome() {
  for (const base of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]) {
    if (!base) continue;
    for (const p of [join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'),
                     join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe')]) {
      if (existsSync(p)) return p;
    }
  }
  throw new Error('no browser');
}

const browser = await puppeteer.launch({ executablePath: findChrome(), headless: 'new', args: ['--mute-audio'] });
const page = await browser.newPage();

async function probe(w, h) {
  await page.setViewport({ width: w, height: h });
  await page.goto('http://localhost:8613/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  return page.evaluate(() => {
    const out = {};
    const cart = document.getElementById('glyph-nami');
    const rect = cart.querySelector('.c-bg').getBoundingClientRect();
    const txt = cart.querySelector('text').getBoundingClientRect();
    out.cartBg = { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width) };
    out.cartTxt = { x: Math.round(txt.x), y: Math.round(txt.y), w: Math.round(txt.width) };
    const tok = document.querySelector('#token-yanagibashi .t-name').getBoundingClientRect();
    out.tokTxt = { x: Math.round(tok.x), y: Math.round(tok.y), w: Math.round(tok.width) };
    const tokBody = document.querySelector('#token-yanagibashi svg').getBoundingClientRect();
    out.tokSvg = { x: Math.round(tokBody.x), y: Math.round(tokBody.y), w: Math.round(tokBody.width) };
    return out;
  });
}

console.log('1080:', JSON.stringify(await probe(1920, 1080)));
console.log('4K  :', JSON.stringify(await probe(3840, 2160)));
await browser.close();
