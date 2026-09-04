import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// Verification screenshots go to the gitignored test/ directory next to this
// script, never the build root or the caller's cwd (STARGATE_BUILD_STANDARDS.md section 3).
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'test');
fs.mkdirSync(OUT_DIR, { recursive: true });

const PORT = 5174;

async function run() {
    let browser;
    try {
        console.log('Launching Puppeteer...');
        browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        // 1. Verify HTTP Requests and Content Types
        page.on('response', response => {
            const status = response.status();
            const url = response.url();
            const ct = response.headers()['content-type'];
            if (url.startsWith(`http://127.0.0.1:${PORT}`) || url.startsWith(`http://localhost:${PORT}`)) {
                console.log(`[HTTP] ${status} ${url} (${ct})`);
                if (status !== 200 && status !== 304) {
                    throw new Error(`Failed to load ${url} with status ${status}`);
                }
            }
        });

        // Simulating 1080p
        await page.setViewport({ width: 1920, height: 1080 });
        console.log('Navigating to page...');
        await page.goto(`http://localhost:${PORT}/`);
        
        // Wait for js to run
        await new Promise(r => setTimeout(r, 1000));
        
        // 2. Check CSS Scale pitfall at 1080p
        let scaleFactor = await page.evaluate(() => {
            return getComputedStyle(document.querySelector('.viewport-scaler')).transform;
        });
        console.log(`Scale transform at 1080p: ${scaleFactor}`);
        
        // Simulating 4K
        await page.setViewport({ width: 3840, height: 2160 });
        await new Promise(r => setTimeout(r, 1000));
        let scaleFactor4k = await page.evaluate(() => {
            return getComputedStyle(document.querySelector('.viewport-scaler')).transform;
        });
        console.log(`Scale transform at 4K: ${scaleFactor4k}`);
        
        // Back to 1080p for tests
        await page.setViewport({ width: 1920, height: 1080 });
        await new Promise(r => setTimeout(r, 500));

        // 3. Dialing Test Cycle 1
        console.log('--- Dialing Cycle 1 (Quick Dial Tier 1) ---');
        const qd1 = await page.$('.qd-btn');
        if (qd1) {
            await qd1.click();
            console.log('Clicked Quick Dial.');
        } else {
            throw new Error('Quick dial button not found');
        }
        
        await new Promise(r => setTimeout(r, 4000));
        
        let statusText = await page.evaluate(() => document.getElementById('drawing-status').textContent);
        console.log(`Status after dialing: ${statusText}`);
        if (statusText !== 'APPROVED') throw new Error('Failed to reach APPROVED status');
        
        console.log('Disengaging...');
        await page.click('#btn-disengage');
        await new Promise(r => setTimeout(r, 500));
        
        statusText = await page.evaluate(() => document.getElementById('drawing-status').textContent);
        console.log(`Status after disengage: ${statusText}`);
        if (statusText !== 'DRAFT') throw new Error('Failed to return to DRAFT status after disengage');

        // 4. Dialing Test Cycle 2 (Review Hold)
        console.log('--- Dialing Cycle 2 (Review Hold) ---');
        await page.click('.slider'); // Toggle Review Hold
        console.log('Toggled Review Hold ON');
        
        const qd2 = await page.$$('.qd-btn');
        if (qd2.length > 1) {
            await qd2[1].click();
            console.log('Clicked Quick Dial 2.');
        }
        
        await new Promise(r => setTimeout(r, 4000));
        
        statusText = await page.evaluate(() => document.getElementById('drawing-status').textContent);
        console.log(`Status with Review Hold: ${statusText}`);
        if (statusText !== 'REVIEW HOLD') throw new Error('Failed to hit REVIEW HOLD status');
        
        await page.click('.slider');
        console.log('Toggled Review Hold OFF');
        await new Promise(r => setTimeout(r, 500));
        
        statusText = await page.evaluate(() => document.getElementById('drawing-status').textContent);
        console.log(`Status after removing Review Hold: ${statusText}`);
        if (statusText !== 'APPROVED') throw new Error('Failed to finalize after removing Review Hold');
        
        console.log('Final Disengage...');
        await page.click('#btn-disengage');
        await new Promise(r => setTimeout(r, 500));
        
        await page.screenshot({ path: path.join(OUT_DIR, 'test_idle_screenshot.png') });
        console.log('Saved idle screenshot to test_idle_screenshot.png');
        
        console.log('All tests passed successfully.');
    } catch (e) {
        console.error('Test failed:', e);
    } finally {
        if (browser) await browser.close();
    }
}

run();
