const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('DSV-9 ARCHELON PILOT CONSOLE - PUPPETEER VERIFICATION SUITE');
  console.log('================================================================');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();

    // -------------------------------------------------------------------------
    // TEST 1: 1920x1080 STANDARD COLD START & SCALING
    // -------------------------------------------------------------------------
    console.log('\n[TEST 1] Testing 1920x1080 Standard Viewport (Cold Start)...');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });
    await sleep(500);

    const scale1080 = await page.evaluate(() => {
      return {
        customProp: getComputedStyle(document.documentElement).getPropertyValue('--hud-scale').trim(),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        documentScrollHeight: document.documentElement.scrollHeight,
        documentScrollWidth: document.documentElement.scrollWidth,
        safetyInterlockClass: document.getElementById('safety-interlock-toggle').className,
        safetyInterlockChecked: document.getElementById('safety-interlock-toggle').getAttribute('aria-checked')
      };
    });

    console.log(` -> Viewport: ${scale1080.viewportWidth}x${scale1080.viewportHeight}`);
    console.log(` -> JS Computed Scale Transform Ratio: ${scale1080.customProp}`);
    console.log(` -> Safety Interlock Default: ${scale1080.safetyInterlockClass} (aria-checked: ${scale1080.safetyInterlockChecked})`);

    if (scale1080.safetyInterlockChecked !== 'false') {
      throw new Error('FAIL: Safety interlock MUST default to RELEASED (false)!');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_1080p_cold_start.png') });
    console.log(' -> Captured screenshot: 01_1080p_cold_start.png');

    // -------------------------------------------------------------------------
    // TEST 2: NEGATIVE AUTO-FIRE & MANUAL WAYPOINT LOCKING
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] Testing Manual Waypoint Dialing (8 waypoints) & Negative Auto-Fire...');
    
    // Sequentially click all 8 waypoint buttons
    for (let i = 0; i < 8; i++) {
      const btnSelector = `.waypoint-btn[data-wp-index="${i}"]`;
      await page.waitForSelector(btnSelector);
      
      // Dispatch real pointer click
      const btn = await page.$(btnSelector);
      const box = await btn.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      console.log(` -> Clicked Waypoint ${i + 1} at (${Math.round(box.x + box.width / 2)}, ${Math.round(box.y + box.height / 2)})`);
      await sleep(550); // wait for trim stabilization
    }

    // Wait extra 500ms to confirm system stays in PENDING/READY state without auto-firing
    await sleep(600);

    const dialerStatus = await page.evaluate(() => {
      return {
        dialerState: window.Dialer.getDialerState(),
        lockedCount: window.Dialer.getLockedWaypoints().length,
        actBtnDisabled: document.getElementById('btn-commence-descent').disabled,
        actBtnClass: document.getElementById('btn-commence-descent').className,
        actPrimaryText: document.getElementById('act-primary-text').textContent,
        hudApertureState: document.getElementById('hud-aperture-state').textContent
      };
    });

    console.log(` -> Locked Waypoints: ${dialerStatus.lockedCount}/8`);
    console.log(` -> Dialer State: ${dialerStatus.dialerState}`);
    console.log(` -> Actuator Button Class: ${dialerStatus.actBtnClass}`);
    console.log(` -> Actuator Button Disabled: ${dialerStatus.actBtnDisabled}`);
    console.log(` -> HUD Aperture State: "${dialerStatus.hudApertureState}"`);

    if (dialerStatus.dialerState !== 'PENDING_READY') {
      throw new Error(`FAIL: Expected dialer state 'PENDING_READY', got '${dialerStatus.dialerState}'`);
    }
    if (dialerStatus.actBtnDisabled !== false) {
      throw new Error('FAIL: Actuator button should be enabled when 8 waypoints are locked and interlock is released');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_1080p_manual_dial_pending.png') });
    console.log(' -> Negative Auto-Fire PASSED: System is ARMED & PENDING, did NOT auto-fire.');
    console.log(' -> Captured screenshot: 02_1080p_manual_dial_pending.png');

    // -------------------------------------------------------------------------
    // TEST 3: THREE-STAGE STAGED ACTIVATION SEQUENCE
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Triggering Primary Actuator & Capturing 3 Distinct Stages...');
    
    const actBtn = await page.$('#btn-commence-descent');
    const actBox = await actBtn.boundingBox();
    await page.mouse.click(actBox.x + actBox.width / 2, actBox.y + actBox.height / 2);
    console.log(` -> Clicked COMMENCE DESCENT APERTURE at (${Math.round(actBox.x + actBox.width / 2)}, ${Math.round(actBox.y + actBox.height / 2)})`);

    // STAGE 1: BUILDUP (capture at t = 700ms)
    await sleep(700);
    const stage1Info = await page.evaluate(() => ({
      state: window.Dialer.getDialerState(),
      depth: Math.round(window.Physics.getState().depth),
      pressure: window.Physics.getState().pressureBar.toFixed(1),
      hudState: document.getElementById('hud-aperture-state').textContent
    }));
    console.log(` -> Stage 1 (BUILDUP): State='${stage1Info.state}', Depth=${stage1Info.depth}m, Pressure=${stage1Info.pressure} bar`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_1080p_stage1_buildup.png') });
    console.log(' -> Captured screenshot: 03_1080p_stage1_buildup.png');

    // STAGE 2: BREAKTHROUGH (capture at t = 2250ms from start)
    await sleep(1550);
    const stage2Info = await page.evaluate(() => ({
      state: window.Dialer.getDialerState(),
      depth: Math.round(window.Physics.getState().depth),
      pressure: window.Physics.getState().pressureBar.toFixed(1),
      hudState: document.getElementById('hud-aperture-state').textContent,
      fxClass: document.getElementById('aperture-fx-layer').className
    }));
    console.log(` -> Stage 2 (BREAKTHROUGH): State='${stage2Info.state}', Depth=${stage2Info.depth}m, FX='${stage2Info.fxClass}'`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_1080p_stage2_breakthrough.png') });
    console.log(' -> Captured screenshot: 04_1080p_stage2_breakthrough.png');

    // STAGE 3: SUSTAINED ACTIVE (capture at t = 3600ms from start)
    await sleep(1300);
    const stage3Info = await page.evaluate(() => ({
      state: window.Dialer.getDialerState(),
      depth: Math.round(window.Physics.getState().depth),
      pressure: window.Physics.getState().pressureBar.toFixed(1),
      elasticMargin: window.Physics.getState().elasticMarginPct.toFixed(1),
      hudState: document.getElementById('hud-aperture-state').textContent
    }));
    console.log(` -> Stage 3 (SUSTAINED ACTIVE): State='${stage3Info.state}', Depth=${stage3Info.depth}m, Pressure=${stage3Info.pressure} bar`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_1080p_stage3_sustained_active.png') });
    console.log(' -> Captured screenshot: 05_1080p_stage3_sustained_active.png');

    // -------------------------------------------------------------------------
    // TEST 4: EMERGENCY ASCENT (DISENGAGE CYCLE 1)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Testing Emergency Ascent / Blow All Ballast (Disengage 1)...');
    const emergBtn = await page.$('#btn-emergency-blow');
    const emergBox = await emergBtn.boundingBox();
    await page.mouse.click(emergBox.x + emergBox.width / 2, emergBox.y + emergBox.height / 2);
    console.log(` -> Clicked EMERGENCY BLOW at (${Math.round(emergBox.x + emergBox.width / 2)}, ${Math.round(emergBox.y + emergBox.height / 2)})`);

    await sleep(1500);
    const disengage1Info = await page.evaluate(() => ({
      state: window.Dialer.getDialerState(),
      depth: Math.round(window.Physics.getState().depth),
      lockedCount: window.Dialer.getLockedWaypoints().length
    }));
    console.log(` -> Disengage 1 Result: State='${disengage1Info.state}', Depth=${disengage1Info.depth}m, LockedWaypoints=${disengage1Info.lockedCount}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_1080p_disengaged_surface.png') });
    console.log(' -> Captured screenshot: 06_1080p_disengaged_surface.png');

    // -------------------------------------------------------------------------
    // TEST 5: QUICK-DIAL AUTO-DIALING & REDIAL CYCLE
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5] Testing Quick-Dial Preset Auto-Dialing (Re-Dial Cycle 2)...');
    
    // Open Quick-Dial Drawer
    const qdToggleBtn = await page.$('#btn-quickdial-toggle');
    await qdToggleBtn.click();
    await sleep(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_drawer_quickdial.png') });
    console.log(' -> Captured screenshot: 07_drawer_quickdial.png');

    // Trigger Tier 1 Preset: HEARC-Standard Alpha
    const presetBtn = await page.$('.preset-card-btn[data-preset-id="PRESET-VER-01"]');
    await presetBtn.click();
    console.log(' -> Clicked Preset: PRESET-VER-01 (HEARC-Standard Alpha)');

    // Capture screenshot mid-autodialing (at ~550ms, ~3 waypoints locked)
    await sleep(550);
    const midAutoDial = await page.evaluate(() => ({
      locked: window.Dialer.getLockedWaypoints().length,
      dialerState: window.Dialer.getDialerState()
    }));
    console.log(` -> Mid-Autodialing: Locked=${midAutoDial.locked}/8 waypoints, State='${midAutoDial.dialerState}'`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_1080p_quickdial_autodialing.png') });
    console.log(' -> Captured screenshot: 08_1080p_quickdial_autodialing.png');

    // Wait for auto-dial sequence to complete and settle in PENDING_READY
    await sleep(1800);
    const autoDialComplete = await page.evaluate(() => ({
      locked: window.Dialer.getLockedWaypoints().length,
      dialerState: window.Dialer.getDialerState(),
      btnEnabled: !document.getElementById('btn-commence-descent').disabled
    }));
    console.log(` -> Auto-dial Complete: Locked=${autoDialComplete.locked}/8, State='${autoDialComplete.dialerState}', ActuatorEnabled=${autoDialComplete.btnEnabled}`);

    if (autoDialComplete.locked !== 8 || autoDialComplete.dialerState !== 'PENDING_READY') {
      throw new Error(`FAIL: Expected 8 locked and PENDING_READY after auto-dial, got ${autoDialComplete.locked} and ${autoDialComplete.dialerState}`);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_1080p_quickdial_pending.png') });
    console.log(' -> Captured screenshot: 09_1080p_quickdial_pending.png');

    // Activate second descent
    const actBtn2 = await page.$('#btn-commence-descent');
    await actBtn2.click();
    console.log(' -> Clicked COMMENCE DESCENT APERTURE (Cycle 2)');
    await sleep(4000); // let it complete to sustained active

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_1080p_second_active.png') });
    console.log(' -> Captured screenshot: 10_1080p_second_active.png');

    // Disengage second descent (Emergency blow 2)
    const emergBtn2 = await page.$('#btn-emergency-blow');
    await emergBtn2.click();
    console.log(' -> Clicked EMERGENCY BLOW (Cycle 2)');
    await sleep(1500);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_1080p_second_disengaged.png') });
    console.log(' -> Captured screenshot: 11_1080p_second_disengaged.png');

    // -------------------------------------------------------------------------
    // TEST 6: SECONDARY TABS/PANELS VERIFICATION (NONE BLANK)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 6] Testing All Secondary Subsystem Panels Individually...');

    // Panel 2: Vessel Engineering
    await page.click('#tab-engineering');
    await sleep(400);
    const engCheck = await page.evaluate(() => ({
      visible: document.getElementById('panel-engineering').style.display !== 'none',
      svgPresent: !!document.getElementById('vessel-schematic-svg'),
      inspectorTitle: document.getElementById('insp-title').textContent
    }));
    console.log(` -> Panel Engineering: Visible=${engCheck.visible}, Title='${engCheck.inspectorTitle}'`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_panel_engineering.png') });
    console.log(' -> Captured screenshot: 12_panel_engineering.png');

    // Panel 3: Dive Archives & Relational Cross-Links
    await page.click('#tab-archive');
    await sleep(400);
    const archiveCheck = await page.evaluate(() => ({
      visible: document.getElementById('panel-archive').style.display !== 'none',
      recordCount: document.querySelectorAll('.record-card').length,
      currentTitle: document.getElementById('rec-detail-title').textContent
    }));
    console.log(` -> Panel Archive: Visible=${archiveCheck.visible}, RecordCount=${archiveCheck.recordCount}, Title='${archiveCheck.currentTitle}'`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_panel_archive.png') });
    console.log(' -> Captured screenshot: 13_panel_archive.png');

    // Click a relational cross-reference link inside archive
    const refLink = await page.$('.ref-link');
    if (refLink) {
      await refLink.click();
      await sleep(300);
      const afterRefTitle = await page.evaluate(() => document.getElementById('rec-detail-title').textContent);
      console.log(` -> Clicked Relational Link: New Title='${afterRefTitle}'`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_panel_archive_crossref.png') });
      console.log(' -> Captured screenshot: 14_panel_archive_crossref.png');
    }

    // Panel 4: Telemetry Matrix
    await page.click('#tab-telemetry');
    await sleep(400);
    const teleCheck = await page.evaluate(() => ({
      visible: document.getElementById('panel-telemetry').style.display !== 'none',
      pressureLive: document.getElementById('telemetry-pressure-live').textContent,
      tempLive: document.getElementById('telemetry-temp-live').textContent
    }));
    console.log(` -> Panel Telemetry: Visible=${teleCheck.visible}, Pressure='${teleCheck.pressureLive}', Temp='${teleCheck.tempLive}'`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_panel_telemetry.png') });
    console.log(' -> Captured screenshot: 15_panel_telemetry.png');

    // Panel 5: Session Event Log
    await page.click('#tab-events');
    await sleep(400);
    const eventsCheck = await page.evaluate(() => ({
      visible: document.getElementById('panel-events').style.display !== 'none',
      eventCount: document.querySelectorAll('.log-item').length
    }));
    console.log(` -> Panel Events: Visible=${eventsCheck.visible}, EventCount=${eventsCheck.eventCount}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_panel_events.png') });
    console.log(' -> Captured screenshot: 16_panel_events.png');

    // Panel 6: Console Settings
    await page.click('#tab-settings');
    await sleep(400);
    const settingsCheck = await page.evaluate(() => ({
      visible: document.getElementById('panel-settings').style.display !== 'none',
      activeTheme: document.body.getAttribute('data-theme')
    }));
    console.log(` -> Panel Settings: Visible=${settingsCheck.visible}, ActiveTheme='${settingsCheck.activeTheme}'`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17_panel_settings.png') });
    console.log(' -> Captured screenshot: 17_panel_settings.png');

    // Operator Reference Manual Modal
    await page.click('#btn-operator-help');
    await sleep(300);
    const helpCheck = await page.evaluate(() => ({
      visible: document.getElementById('modal-operator-help').style.display === 'flex',
      modalTitle: document.getElementById('help-modal-title').textContent
    }));
    console.log(` -> Operator Reference Help: Visible=${helpCheck.visible}, Title='${helpCheck.modalTitle}'`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18_modal_operator_help.png') });
    console.log(' -> Captured screenshot: 18_modal_operator_help.png');

    // Dismiss Help modal and return to HUD
    await page.click('#btn-dismiss-help');
    await page.click('#tab-hud');
    await sleep(300);

    // -------------------------------------------------------------------------
    // TEST 7: 4K (3840x2160) SCALING VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n[TEST 7] Testing 3840x2160 (4K UHD) Viewport Scaling...');
    await page.setViewport({ width: 3840, height: 2160 });
    await sleep(500);

    const scale4k = await page.evaluate(() => ({
      customProp: getComputedStyle(document.documentElement).getPropertyValue('--hud-scale').trim(),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    }));
    console.log(` -> 4K Viewport: ${scale4k.viewportWidth}x${scale4k.viewportHeight}`);
    console.log(` -> JS Computed Scale Transform Ratio: ${scale4k.customProp}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19_4k_cockpit_view.png') });
    console.log(' -> Captured screenshot: 19_4k_cockpit_view.png');

    // -------------------------------------------------------------------------
    // TEST 8: NON-16:9 VIEWPORTS (ULTRAWIDE 21:9 AND 4:3 NARROW)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 8] Testing Non-16:9 Aspect Ratios (21:9 Ultrawide & 4:3 Narrow)...');
    
    // 21:9 Ultrawide (2560x1080)
    await page.setViewport({ width: 2560, height: 1080 });
    await sleep(400);
    const scale21x9 = await page.evaluate(() => ({
      customProp: getComputedStyle(document.documentElement).getPropertyValue('--hud-scale').trim(),
      bodyBg: getComputedStyle(document.body).backgroundColor
    }));
    console.log(` -> 21:9 Ultrawide Viewport (2560x1080): Scale=${scale21x9.customProp}, BodyBg=${scale21x9.bodyBg}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '20_non16x9_ultrawide_21x9.png') });
    console.log(' -> Captured screenshot: 20_non16x9_ultrawide_21x9.png');

    // 4:3 Narrow (1280x960)
    await page.setViewport({ width: 1280, height: 960 });
    await sleep(400);
    const scale4x3 = await page.evaluate(() => ({
      customProp: getComputedStyle(document.documentElement).getPropertyValue('--hud-scale').trim(),
      bodyBg: getComputedStyle(document.body).backgroundColor
    }));
    console.log(` -> 4:3 Narrow Viewport (1280x960): Scale=${scale4x3.customProp}, BodyBg=${scale4x3.bodyBg}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '21_non16x9_narrow_4x3.png') });
    console.log(' -> Captured screenshot: 21_non16x9_narrow_4x3.png');

    // -------------------------------------------------------------------------
    // TEST 9: VERSION.JSON & CHANGELOG VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n[TEST 9] Verifying version.json and CHANGELOG.md attribution...');
    const versionPath = path.join(__dirname, '..', 'version.json');
    const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');

    const versionJson = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    const changelogContent = fs.readFileSync(changelogPath, 'utf8');

    console.log(` -> version.json version field: "${versionJson.version}"`);
    console.log(` -> version.json model field: "${versionJson.model}"`);

    if (!versionJson.version || !versionJson.model) {
      throw new Error('FAIL: version.json MUST contain BOTH "version" and "model" fields!');
    }

    if (!changelogContent.includes('**Built by:**')) {
      throw new Error('FAIL: CHANGELOG.md must contain "**Built by:**" attribution!');
    }
    console.log(' -> version.json and CHANGELOG.md integrity: PASSED');

    console.log('\n================================================================');
    console.log('ALL 9 VERIFICATION TEST PHASES COMPLETED WITH 100% SUCCESS!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('VERIFICATION SUITE ERROR:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTestSuite();
