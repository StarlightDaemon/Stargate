const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
// Verification screenshots go to the gitignored test/ directory next to this
// script, never the build root or the caller's cwd (STARGATE_BUILD_STANDARDS.md section 3).
const OUT_DIR = path.join(__dirname, 'test');
fs.mkdirSync(OUT_DIR, { recursive: true });

const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    let browser;
    try {
        console.log('Launching Puppeteer...');
        browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        // Target baseline 1920x1080 resolution
        await page.setViewport({ width: 1920, height: 1080 });
        
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));

        console.log('Navigating to http://127.0.0.1:8080/index.html');
        await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle0' });
        
        console.log('Taking idle screenshot...');
        await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_idle.png') });
        
        for (let cycle = 1; cycle <= 2; cycle++) {
            console.log(`\n--- Starting Cycle ${cycle} ---`);
            
            // Wait for grid to be available
            await page.waitForSelector('.symbol-btn', { visible: true });
            
            // Select 4 symbols
            console.log('Selecting 4 symbols...');
            const btns = await page.$$('.symbol-btn');
            await btns[0].click();
            await delay(200);
            await btns[1].click();
            await delay(200);
            await btns[2].click();
            await delay(200);
            await btns[3].click();
            
            console.log('Clicking ENGAGE...');
            await page.click('#engage-btn');
            
            // Wait for dial animation (6 seconds)
            console.log('Waiting 6 seconds for dial sequence...');
            await delay(6000);
            
            if (cycle === 1) {
                console.log('Taking engaged screenshot...');
                await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_engaged.png') });
            }
            
            console.log('Checking DISCONNECT button reachability...');
            const disengageBtn = await page.$('#disengage-btn');
            const box = await disengageBtn.boundingBox();
            if (box && box.width > 0 && box.height > 0) {
                console.log('Disengage button is visible and reachable at: ', box);
                console.log('Clicking DISCONNECT...');
                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
            } else {
                console.error('ERROR: Disengage button is NOT reachable or visible.');
                process.exit(1);
            }
            
            console.log('Waiting 2 seconds for reset...');
            await delay(2000);
            
            // Check if dormant
            const status = await page.$eval('#status-readout', el => el.textContent);
            if (status.trim() !== 'DORMANT') {
                console.error(`ERROR: Ring did not return to DORMANT state. Status is: ${status}`);
                process.exit(1);
            }
            
            console.log(`Cycle ${cycle} completed cleanly.`);
        }
        
        console.log('\nSUCCESS: Completed 2 full cycles cleanly.');
        await browser.close();
    } catch (e) {
        console.error('Error during test:', e);
        if (browser) await browser.close();
        process.exit(1);
    }
})();
