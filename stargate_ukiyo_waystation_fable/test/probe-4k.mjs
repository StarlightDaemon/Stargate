/* one-off probe: where do SVG text labels land at 1080 vs 4K? */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Browser resolution. No absolute local filesystem path is committed here:
// CHROME_PATH (or PUPPETEER_EXECUTABLE_PATH) wins, otherwise puppeteer's own
// executable path is used. Anything else is an explicit error.
async function resolveChrome() {
  const fromEnv = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv) return fromEnv;
  let why;
  try {
    const p = await puppeteer.executablePath();
    if (p && existsSync(p)) return p;
    why = p ? `puppeteer's executable path does not exist: ${p}` : 'puppeteer reported no executable path';
  } catch (e) {
    why = `puppeteer could not resolve an executable path (${e.message})`;
  }
  throw new Error(`No browser found: ${why}. Set CHROME_PATH to a Chrome/Chromium executable.`);
}

const browser = await puppeteer.launch({ executablePath: await resolveChrome(), headless: 'new', args: ['--mute-audio'] });
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
