const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.goto('http://localhost:8000');
        
        const symbols = await page.$$('.symbol-btn');
        
        // Dial 4 symbols
        for(let i=0; i<4; i++) {
            await symbols[i].click();
            await new Promise(r => setTimeout(r, 1600)); 
        }
        
        const engageBtn = await page.$('#engage-btn');
        const engDisabled = await page.evaluate(el => el.disabled, engageBtn);
        console.log("Engage disabled before click: " + engDisabled); // should be false
        
        // Engage
        await engageBtn.click();
        await new Promise(r => setTimeout(r, 1500));
        
        const isConnected = await page.evaluate(() => isConnected);
        console.log("Connected after engage: " + isConnected); // should be true
        
        const textAfterEngage = await page.evaluate(el => el.textContent, engageBtn);
        const disabledAfterEngage = await page.evaluate(el => el.disabled, engageBtn);
        console.log("Button: " + textAfterEngage + ", disabled: " + disabledAfterEngage);
        
        // Disengage
        await engageBtn.click();
        await new Promise(r => setTimeout(r, 1600));
        
        const connectedAfterDisengage = await page.evaluate(() => isConnected);
        const seqLenAfterDisengage = await page.evaluate(() => sequence.length);
        console.log("Connected after disengage: " + connectedAfterDisengage);
        console.log("Sequence after disengage: " + seqLenAfterDisengage);
        
        // Redial symbol 0
        await symbols[0].click();
        await new Promise(r => setTimeout(r, 1600));
        
        const seqLenRedial = await page.evaluate(() => sequence.length);
        console.log("Sequence after redial 1 symbol: " + seqLenRedial);
        
        await browser.close();
        console.log("DONE");
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
