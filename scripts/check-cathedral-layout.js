"use strict";
// Diagnosis only: client/suite source remains untouched; isolated CSS experiment is restored.
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const { startPreview, selectExhibit } = require("./preview.js");
const ROOT = path.resolve(__dirname, ".."), NAME = "stargate_cathedral_oculus", OUT = path.join(ROOT, "test/cathedral-layout");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function geometry(page) {
  return page.evaluate(() => {
    const selectors = ['html', 'body', '.cathedral-scaler', '.cathedral-app', '.cathedral-vault-backdrop', '.clerestory-sunbeams', '.cathedral-tympanum', '.header-center', '.cathedral-title', '.cathedral-subtitle', '.cathedral-facade', '.cathedral-plinth'];
    const boxes = selectors.map(selector => {
      const element = document.querySelector(selector), rect = element.getBoundingClientRect(), css = getComputedStyle(element);
      const range = document.createRange(); range.selectNodeContents(element);
      const textRects = selector.includes('title') ? [...range.getClientRects()].map(r => ({ top: r.top, bottom: r.bottom, height: r.height })) : undefined;
      return { selector, top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom,
        scrollTop: element.scrollTop, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight,
        transform: css.transform, flex: css.flex, minHeight: css.minHeight, overflow: css.overflow,
        font: css.font, lineHeight: css.lineHeight, textRects };
    });
    return { viewport: { width: innerWidth, height: innerHeight, scrollX, scrollY, visualTop: visualViewport.offsetTop, visualHeight: visualViewport.height },
      fonts: { status: document.fonts.status, title: document.fonts.check('26px "Cinzel Decorative"'), body: document.fonts.check('12px "Cinzel"') },
      state: document.getElementById('telem-state').textContent.trim(), activeElement: document.activeElement?.id, boxes };
  });
}
async function pointer(page, selector) {
  const box = await page.$eval(selector, element => { const r = element.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const top = document.elementFromPoint(x, y); return { x, y, reachable: top === element || element.contains(top) }; });
  assert.equal(box.reachable, true, selector + ' must be reachable without scrolling'); await page.mouse.click(box.x, box.y);
}
async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const suiteHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, NAME, 'tests/verify.js'), 'utf8').replace(/\r\n/g, '\n')).digest('hex');
  assert.equal(suiteHash, '01c1ef64c61d31c10a3676bd94f81f55207ebd2a769f9afc56d91a70085d4e20', 'Retain exact historical suite source');
  const report = { source: 'Unmodified current client; original tests/verify.js untouched', suiteHash,
    priorEvidence: { job: 128829555716, clipped: ['legacy sustained-active', 'shared cold'], complete: ['legacy cold', 'shared sustained-active'], originalSuite: '32/32 both handlers' },
    runs: [] };
  const server = await startPreview({ ...selectExhibit(NAME), port: 0 });
  const browser = await require(process.env.STARGATE_PUPPETEER_MODULE || 'puppeteer').launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
  try {
    for (let cycle = 0; cycle < 2; cycle++) {
      const context = await browser.createBrowserContext(), page = await context.newPage(), errors = [], samples = [];
      page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      const capture = async (label, captureBeyondViewport) => {
        const filename = `cycle${cycle}-${label}-${captureBeyondViewport ? 'beyond' : 'viewport'}.png`, before = await geometry(page);
        await page.screenshot({ path: path.join(OUT, filename), captureBeyondViewport });
        const after = await geometry(page); samples.push({ filename, captureBeyondViewport, before, after });
      };
      try {
        await page.setViewport({ width: 1920, height: 1080 }); await page.goto(server.url, { waitUntil: 'networkidle0' }); await delay(600);
        // Cold images precede every focus/pointer operation, just as the original suite does.
        await capture('cold-1080', true); await capture('cold-1080', false);
        await page.setViewport({ width: 3840, height: 2160 }); await delay(300); await capture('cold-4k', true);
        await page.setViewport({ width: 1920, height: 1080 }); await delay(300); await capture('returned-1080', true);
        await page.evaluate(() => document.fonts.ready); await capture('fonts-ready-1080', true);
        for (const glyph of [1, 4, 6, 2, 8, 11, 5]) { await pointer(page, '#glyph-btn-' + glyph); await delay(320); }
        await page.waitForFunction(() => document.getElementById('telem-state').textContent.includes('Pending Sanctification'));
        await pointer(page, '#btn-activate-portal');
        await page.waitForFunction(() => document.getElementById('telem-state').textContent.includes('Sustained Active'), { timeout: 10000 });
        await capture('active-1080', true); await capture('active-1080', false); await delay(150); await capture('active-repeat-1080', true);
        // Hold the sunbeam transform at a reproducible nonzero phase. Compare the
        // same client with only its atmospheric backdrop's overflow isolated,
        // then restore it. This is causal diagnosis, not an acceptance adapter.
        await page.evaluate(() => document.querySelector('.clerestory-sunbeams').getAnimations().forEach(animation => {
          animation.pause(); animation.currentTime = 2000;
        }));
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await capture('experiment-sunbeams-paused-baseline-1080', true);
        const previousOverflow = await page.$eval('.cathedral-vault-backdrop', element => {
          const previous = element.style.overflow; element.style.overflow = 'hidden'; return previous;
        });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await capture('experiment-backdrop-clipped-1080', true);
        await page.$eval('.cathedral-vault-backdrop', (element, previous) => { element.style.overflow = previous; }, previousOverflow);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await capture('experiment-backdrop-restored-1080', true);
        await page.evaluate(() => document.querySelector('.clerestory-sunbeams').getAnimations().forEach(animation => animation.play()));
        await page.setViewport({ width: 3840, height: 2160 }); await delay(300); await capture('active-4k', true);
        await pointer(page, '#btn-disengage'); assert.deepEqual(errors, []);
      } finally {
        report.runs.push({ cycle, errors, samples }); await context.close();
      }
    }
    report.geometryClippingObserved = report.runs.some(run => run.samples.some(sample => ['before', 'after'].some(moment => {
      const title = sample[moment].boxes.find(box => box.selector === '.cathedral-title'); return title.top < 0 || title.textRects.some(rect => rect.top < 0);
    })));
    report.status = 'OBSERVATIONS_RECORDED_NOT_ACCEPTANCE';
    if (process.env.STARGATE_LOG_VISUALS === '1') {
      const page = await browser.newPage();
      for (const run of report.runs) for (const sample of run.samples.filter(row => !row.filename.includes('4k'))) {
        const data = await page.evaluate(async base64 => { const image = new Image(); image.src = 'data:image/png;base64,' + base64; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = Math.round(image.height * 1280 / image.width);
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        }, fs.readFileSync(path.join(OUT, sample.filename)).toString('base64'));
        const name = 'cathedral-layout-' + sample.filename.replace(/\.png$/, '.jpg');
        for (let offset = 0; offset < data.length; offset += 16000) console.log('STARGATE_VISUAL ' + name + ' ' + offset + ' ' + data.slice(offset, offset + 16000));
      }
      await page.close();
    }
    for (const run of report.runs) for (const sample of run.samples) console.log('CATHEDRAL_LAYOUT_SAMPLE ' + JSON.stringify({ cycle: run.cycle, ...sample }));
    console.log('CATHEDRAL_LAYOUT ' + JSON.stringify({ status: report.status, source: report.source, suiteHash, priorEvidence: report.priorEvidence,
      geometryClippingObserved: report.geometryClippingObserved, runs: report.runs.map(run => ({ cycle: run.cycle, errors: run.errors, samples: run.samples.map(sample => sample.filename) })) }));
  } finally { fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2)); await browser.close(); await server.close(); }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { geometry, pointer };
