import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

async function run() {
    console.log('Starting Python server...');
    const serverProcess = spawn('python', ['-m', 'http.server', '5174', '--bind', '0.0.0.0'], {
        cwd: process.cwd()
    });
    
    // Wait for server to be ready
    await new Promise(r => setTimeout(r, 2000));

    console.log('Python server ready. Launching Puppeteer...');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--proxy-server="direct://"', '--proxy-bypass-list=*']
        });
        const page = await browser.newPage();
        
        page.on('response', response => {
            console.log(`[HTTP] ${response.status()} ${response.url()}`);
        });
        page.on('console', msg => console.log(`[PAGE LOG] ${msg.type()}: ${msg.text()}`));
        page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message}`));

        // Simulating 1080p
        await page.setViewport({ width: 1920, height: 1080 });
        console.log('Navigating to page...');
        
        // Add explicit retry/wait for connection
        let connected = false;
        const fileUrl = 'http://localhost:5174/';
        for (let i = 0; i < 5; i++) {
            try {
                await page.goto(fileUrl, { waitUntil: 'load', timeout: 5000 });
                connected = true;
                break;
            } catch (e) {
                console.log(`Navigation attempt ${i+1} failed: ${e.message}. Retrying...`);
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        if (!connected) {
            throw new Error('Failed to load file:// url after multiple attempts.');
        }
        
        // Test Manual Dialing
        console.log('Testing manual dialing...');
        const symbols = await page.$$('.symbol-btn');
        for (let i = 0; i < 8; i++) {
            if (symbols[i]) {
                const box = await symbols[i].boundingBox();
                if (box) {
                    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                }
                await new Promise(r => setTimeout(r, 200));
            }
        }
        
        await new Promise(r => setTimeout(r, 500));
        console.log('Clicking ENGAGE button...');
        await page.click('#btn-engage');
        await new Promise(r => setTimeout(r, 500));
        
        let statusText = await page.evaluate(() => document.getElementById('drawing-status').textContent);
        console.log(`Status after manual dial engage: ${statusText}`);
        if (statusText !== 'APPROVED') throw new Error('Manual dialing failed to activate gate');

        console.log('Disengaging from manual dial...');
        await page.click('#btn-disengage');
        await new Promise(r => setTimeout(r, 500));

        // Test Quick Dial
        console.log('Testing quick dialing...');
        const qd1 = await page.$('.qd-btn');
        await qd1.click();
        
        await new Promise(r => setTimeout(r, 4000));
        console.log('Clicking ENGAGE button...');
        await page.click('#btn-engage');
        await new Promise(r => setTimeout(r, 500));
        
        statusText = await page.evaluate(() => document.getElementById('drawing-status').textContent);
        console.log(`Status after quick dial engage: ${statusText}`);
        if (statusText !== 'APPROVED') throw new Error('Quick dialing failed to activate gate');

        console.log('Disengaging from quick dial...');
        await page.click('#btn-disengage');
        await new Promise(r => setTimeout(r, 500));
        
        console.log('All interactive tests passed successfully!');

    } catch (e) {
        console.error('Test script failed:', e);
    } finally {
        if (browser) await browser.close();
        serverProcess.kill('SIGINT');
        console.log('Python server killed.');
    }
}

run();
