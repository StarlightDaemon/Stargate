// Capture preview.png: a 1920×1080 cold-start idle frame (no interaction), for the gallery card.
import puppeteer from 'puppeteer-core';
import path from 'node:path';

const URL = process.env.URL || 'http://127.0.0.1:8685/';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const out = process.argv[2] || path.join(process.cwd(), 'preview.png');

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--window-size=1920,1080'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: out });
console.log('wrote', out);
await browser.close();
