// Capture preview.png: a 1920×1080 cold-start idle frame (no interaction), for the gallery card.
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { existsSync } from 'node:fs';

const URL = process.env.URL || 'http://127.0.0.1:8685/';
// Browser resolution. No absolute local filesystem path is committed here:
// CHROME_PATH (or PUPPETEER_EXECUTABLE_PATH) wins, otherwise puppeteer's own
// executable path is used. Anything else is an explicit error.
async function resolveChrome() {
  const fromEnv = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME;
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
const out = process.argv[2] || path.join(process.cwd(), 'preview.png');

const browser = await puppeteer.launch({ executablePath: await resolveChrome(), headless: 'new', args: ['--window-size=1920,1080'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: out });
console.log('wrote', out);
await browser.close();
