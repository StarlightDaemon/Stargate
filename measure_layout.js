const puppeteer = require('puppeteer');

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle0' });

        const metrics = await page.evaluate(() => {
            const getBox = (selector) => {
                const el = document.querySelector(selector);
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                return {
                    x: rect.x, y: rect.y,
                    width: rect.width, height: rect.height,
                    padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
                    margin: `${style.marginTop} ${style.marginRight} ${style.marginBottom} ${style.marginLeft}`,
                    gap: style.gap
                };
            };

            return {
                mainLayout: getBox('.main-layout'),
                ringContainer: getBox('.ring-container'),
                controlsPanel: getBox('.controls-panel'),
                wardControl: getBox('.ward-control'),
                panelSections: Array.from(document.querySelectorAll('.panel-section')).map(el => {
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    return {
                        y: rect.y, height: rect.height,
                        padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
                    }
                }),
                symbolGrid: getBox('.symbol-grid'),
                quickDialList: getBox('.quick-dial-list'),
                operatorBtn: getBox('#operator-ref-btn'),
                cornerBL: getBox('#corner-bl'),
                cornerBR: getBox('#corner-br'),
                windowInnerHeight: window.innerHeight,
                windowInnerWidth: window.innerWidth
            };
        });

        console.log(JSON.stringify(metrics, null, 2));
        await browser.close();
    } catch (e) {
        console.error(e);
        if (browser) await browser.close();
        process.exit(1);
    }
})();
