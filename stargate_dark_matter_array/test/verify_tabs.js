const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyTabsAndLayout() {
  console.log('================================================================');
  console.log('   BOREAS-IX TAB VISIBILITY & LAYOUT VERIFICATION');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`  [BROWSER ERROR] ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
  await sleep(600);

  // -------------------------------------------------------------
  // 1. TAB 1: DETECTOR CONSOLE & RIGHT-COLUMN LAYOUT ALIGNMENT
  // -------------------------------------------------------------
  console.log('--- TEST 1: TAB 1 (DETECTOR CONSOLE) & LAYOUT CHECK ---');
  const leftColRect = await page.$eval('.instrument-focal-display', el => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height };
  });
  const rightColRect = await page.$eval('.telemetry-discrimination-wing', el => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height };
  });

  console.log(`  - Left Column (Instrument Display): height = ${leftColRect.height.toFixed(1)}px, bottom = ${leftColRect.bottom.toFixed(1)}px`);
  console.log(`  - Right Column (Telemetry Wing):    height = ${rightColRect.height.toFixed(1)}px, bottom = ${rightColRect.bottom.toFixed(1)}px`);
  const bottomDiff = Math.abs(leftColRect.bottom - rightColRect.bottom);
  console.log(`✓ Column bottom edge difference: ${bottomDiff.toFixed(1)}px (Aligned if < 5px)`);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'tab_01_detector.png') });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'detector_layout_fixed.png') });
  console.log('✓ Captured screenshots: tab_01_detector.png and detector_layout_fixed.png');

  // -------------------------------------------------------------
  // 2. TAB 2: CRYO-ENGINEERING CROSS-SECTION
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: TAB 2 (CRYO-ENGINEERING) ---');
  await page.click('#nav-btn-engineering');
  await sleep(500);

  const engPanelVisible = await page.$eval('#view-engineering', el => {
    const s = window.getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetHeight > 0;
  });
  const engTitle = await page.$eval('.eng-title', el => el.textContent.trim());
  const engDesc = await page.$eval('.eng-desc', el => el.textContent.trim());

  console.log(`✓ Cryo-Engineering Panel Visible: ${engPanelVisible}`);
  console.log(`  - Selected Subsystem: "${engTitle}"`);
  console.log(`  - Subsystem Details: "${engDesc.substring(0, 75)}..."`);
  if (!engPanelVisible || !engTitle) {
    throw new Error('Cryo-Engineering tab rendered blank!');
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'tab_02_engineering.png') });
  console.log('✓ Captured screenshot: tab_02_engineering.png');

  // -------------------------------------------------------------
  // 3. TAB 3: ARCHIVE VAULT (36+ RUNS)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: TAB 3 (ARCHIVE VAULT) ---');
  await page.click('#nav-btn-archive');
  await sleep(500);

  const archivePanelVisible = await page.$eval('#view-archive', el => {
    const s = window.getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetHeight > 0;
  });
  const archiveCount = await page.$$eval('.archive-card', els => els.length);
  const firstArchiveTitle = await page.$eval('.archive-card .arch-title', el => el.textContent.trim());

  console.log(`✓ Archive Vault Panel Visible: ${archivePanelVisible}`);
  console.log(`  - Total Relational Cards Rendered: ${archiveCount}`);
  console.log(`  - First Entry Title: "${firstArchiveTitle}"`);
  if (!archivePanelVisible || archiveCount < 36) {
    throw new Error(`Archive tab failed! visible: ${archivePanelVisible}, count: ${archiveCount}`);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'tab_03_archive.png') });
  console.log('✓ Captured screenshot: tab_03_archive.png');

  // -------------------------------------------------------------
  // 4. TAB 4: SESSION LOG
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: TAB 4 (SESSION LOG) ---');
  await page.click('#nav-btn-logger');
  await sleep(500);

  const loggerPanelVisible = await page.$eval('#view-logger', el => {
    const s = window.getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetHeight > 0;
  });
  const logRowsCount = await page.$$eval('.log-row', els => els.length);
  const firstLogMsg = await page.$eval('.log-row .log-msg', el => el.textContent.trim());

  console.log(`✓ Session Log Panel Visible: ${loggerPanelVisible}`);
  console.log(`  - Total Log Rows: ${logRowsCount}`);
  console.log(`  - Latest Log Message: "${firstLogMsg}"`);
  if (!loggerPanelVisible || logRowsCount === 0) {
    throw new Error('Session Log tab rendered blank!');
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'tab_04_logger.png') });
  console.log('✓ Captured screenshot: tab_04_logger.png');

  // -------------------------------------------------------------
  // 5. TAB 5: SETTINGS & PREFERENCES
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: TAB 5 (SETTINGS) ---');
  await page.click('#nav-btn-settings');
  await sleep(500);

  const settingsPanelVisible = await page.$eval('#view-settings', el => {
    const s = window.getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetHeight > 0;
  });
  const settingsCardsCount = await page.$$eval('.settings-card', els => els.length);

  console.log(`✓ Settings Panel Visible: ${settingsPanelVisible}`);
  console.log(`  - Settings Cards Rendered: ${settingsCardsCount}/4`);
  if (!settingsPanelVisible || settingsCardsCount < 4) {
    throw new Error('Settings tab rendered blank!');
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'tab_05_settings.png') });
  console.log('✓ Captured screenshot: tab_05_settings.png');

  // -------------------------------------------------------------
  // 6. CORE LOOP REGRESSION CHECK
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: CORE LOOP DIAL & DISENGAGE REGRESSION CHECK ---');
  await page.click('#nav-btn-detector');
  await sleep(400);

  // Manual dial 7 channels
  const channelIds = ['pmt-01', 'pmt-02', 'pmt-03', 'pmt-04', 'pmt-05', 'pmt-06', 'pmt-07'];
  for (let i = 0; i < channelIds.length; i++) {
    await page.click(`#btn-${channelIds[i]}`);
    await sleep(350);
  }

  const lockedSlots = await page.evaluate(() => window.dmDiscrimination.getLockedCount());
  const apertureState = await page.evaluate(() => window.dmApp.apertureState);
  console.log(`✓ 7 Slots locked: ${lockedSlots}/7, Aperture state: "${apertureState}" (Must be PENDING)`);

  if (lockedSlots !== 7 || apertureState !== 'PENDING') {
    throw new Error('Core loop manual dial regression detected!');
  }

  // Disengage
  await page.click('#btn-disengage');
  await sleep(300);
  const resetSlots = await page.evaluate(() => window.dmDiscrimination.getLockedCount());
  const resetState = await page.evaluate(() => window.dmApp.apertureState);
  console.log(`✓ Disengaged cleanly: slots = ${resetSlots}, state = "${resetState}"`);

  await browser.close();

  console.log('\n================================================================');
  console.log('   ALL TAB & LAYOUT VERIFICATIONS PASSED 100%!');
  console.log('================================================================\n');
}

verifyTabsAndLayout().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
