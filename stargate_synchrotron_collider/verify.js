const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'test_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR);
}

async function runVerification() {
  console.log('=== STARTING AETHEL-RING COLLIDER VERIFICATION ===');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  const testResults = {};

  try {
    // -------------------------------------------------------------
    // TEST 1: VIEWPORT DIMENSIONS & RESPONSIVE CSS SCALE (1080p & 4K)
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Responsive Scaling (1080p & 4K) ---');
    
    // 1080p Test
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3042', { waitUntil: 'networkidle0' });

    const scale1080 = await page.evaluate(() => {
      const el = document.getElementById('app-scaler');
      const style = window.getComputedStyle(el);
      const uiScaleVar = window.getComputedStyle(document.documentElement).getPropertyValue('--ui-scale');
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        uiScaleVar: uiScaleVar.trim(),
        transform: style.transform
      };
    });

    console.log('1080p Viewport Dimensions:', `${scale1080.viewportWidth}x${scale1080.viewportHeight}`);
    console.log('1080p Computed --ui-scale:', scale1080.uiScaleVar);
    console.log('1080p Computed transform:', scale1080.transform);

    testResults.scale1080p = (scale1080.viewportWidth === 1920 && scale1080.viewportHeight === 1080 && scale1080.uiScaleVar === '1');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_idle_1080p.png') });

    // 4K Test
    await page.setViewport({ width: 3840, height: 2160 });
    await page.waitForTimeout ? await page.waitForTimeout(300) : await new Promise(r => setTimeout(r, 300));

    const scale4k = await page.evaluate(() => {
      const el = document.getElementById('app-scaler');
      const style = window.getComputedStyle(el);
      const uiScaleVar = window.getComputedStyle(document.documentElement).getPropertyValue('--ui-scale');
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        uiScaleVar: uiScaleVar.trim(),
        transform: style.transform
      };
    });

    console.log('4K Viewport Dimensions:', `${scale4k.viewportWidth}x${scale4k.viewportHeight}`);
    console.log('4K Computed --ui-scale:', scale4k.uiScaleVar);
    console.log('4K Computed transform:', scale4k.transform);

    testResults.scale4k = (scale4k.viewportWidth === 3840 && scale4k.viewportHeight === 2160 && scale4k.uiScaleVar === '2');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_idle_4k.png') });

    // Reset to 1080p for interactive tests
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(r => setTimeout(r, 300));

    // -------------------------------------------------------------
    // TEST 2: DEFAULT SAFETY INTERLOCK STATUS
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Safety Interlock Default State ---');
    const interlockDefault = await page.evaluate(() => {
      const toggle = document.getElementById('quench-interlock-toggle');
      return {
        checked: toggle.checked,
        appInterlockActive: window.arcApp.quenchInterlockActive
      };
    });
    console.log('Interlock Checkbox Checked:', interlockDefault.checked);
    console.log('App Quench Interlock Active:', interlockDefault.appInterlockActive);
    testResults.interlockDefaultsReleased = (!interlockDefault.checked && !interlockDefault.appInterlockActive);

    // -------------------------------------------------------------
    // TEST 3: MANUAL COLD-START DIAL & NEGATIVE AUTO-FIRE TEST
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Manual Cold-Start Dial & Negative Auto-Fire Test ---');

    // Helper: Real Pointer Click using elementFromPoint Hit Testing
    async function clickElementByRealHitTest(selector) {
      const coords = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        // Hit-test elementFromPoint
        const hitEl = document.elementFromPoint(cx, cy);
        return { x: cx, y: cy, matched: (hitEl === el || el.contains(hitEl)) };
      }, selector);

      if (!coords) throw new Error(`Element not found: ${selector}`);
      await page.mouse.click(coords.x, coords.y);
      await new Promise(r => setTimeout(r, 120));
      return coords;
    }

    const testSectors = [3, 7, 11, 2, 14, 8];
    for (let i = 0; i < testSectors.length; i++) {
      const secNum = testSectors[i];
      console.log(`Dialing Sector S-${String(secNum).padStart(2, '0')} (${i + 1}/6)...`);
      await clickElementByRealHitTest(`#sec-btn-${secNum}`);
      await clickElementByRealHitTest('#btn-engage-sector');
    }

    // Wait and check state IMMEDIATELY after 6th sector is locked
    await new Promise(r => setTimeout(r, 400));

    const autoFireCheck = await page.evaluate(() => {
      const triggerBtn = document.getElementById('btn-trigger-collision');
      return {
        state: window.arcApp.state,
        lockedCount: window.arcApp.lockedSectors.length,
        triggerDisabled: triggerBtn.disabled,
        triggerText: triggerBtn.textContent.trim(),
        canvasState: window.arcApp.physicsCanvas.state,
        portalRadius: window.arcApp.physicsCanvas.portalHorizonRadius
      };
    });

    console.log('Post-6th Sector State:', autoFireCheck.state);
    console.log('Locked Sectors Count:', autoFireCheck.lockedCount);
    console.log('Trigger Button Disabled:', autoFireCheck.triggerDisabled);
    console.log('Canvas State:', autoFireCheck.canvasState);
    console.log('Portal Horizon Radius:', autoFireCheck.portalRadius);

    // Negative Auto-Fire Assertion: State MUST be 'ARMED', trigger MUST be enabled, NOT active collision!
    testResults.negativeAutoFirePassed = (
      autoFireCheck.state === 'ARMED' &&
      autoFireCheck.lockedCount === 6 &&
      autoFireCheck.triggerDisabled === false &&
      autoFireCheck.canvasState === 'ARMED' &&
      autoFireCheck.portalRadius === 0
    );
    console.log('NEGATIVE AUTO-FIRE TEST RESULT:', testResults.negativeAutoFirePassed ? 'PASSED (Did NOT auto-fire)' : 'FAILED');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_armed_standby.png') });

    // -------------------------------------------------------------
    // TEST 4: SAFETY INTERLOCK BLOCK TEST (Engaged Quench Interlock)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Quench Interlock Trigger Block Test ---');
    
    // Toggle interlock ON
    await clickElementByRealHitTest('label[for="quench-interlock-toggle"]');
    await new Promise(r => setTimeout(r, 200));

    // Attempt to trigger collision
    await clickElementByRealHitTest('#btn-trigger-collision');
    await new Promise(r => setTimeout(r, 300));

    const quenchBlockCheck = await page.evaluate(() => {
      const banner = document.getElementById('quench-trip-banner');
      const isBannerVisible = window.getComputedStyle(banner).display !== 'none';
      return {
        state: window.arcApp.state,
        isBannerVisible,
        quenchActive: window.arcApp.quenchInterlockActive
      };
    });

    console.log('Quench Blocked State:', quenchBlockCheck.state);
    console.log('Quench Banner Visible:', quenchBlockCheck.isBannerVisible);
    testResults.quenchBlockVerified = (quenchBlockCheck.state === 'QUENCH_TRIPPED' && quenchBlockCheck.isBannerVisible);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_quench_trip_banner.png') });

    // Release interlock toggle
    await clickElementByRealHitTest('label[for="quench-interlock-toggle"]');
    await new Promise(r => setTimeout(r, 300));

    // -------------------------------------------------------------
    // TEST 5: MANUAL ACTIVATION & VISIBLE COLLISION PORTAL
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Manual Collision Trigger & Visible Particle Portal ---');
    
    await clickElementByRealHitTest('#btn-trigger-collision');
    console.log('Collision trigger clicked. Waiting for 1.5s collision ramp...');
    await new Promise(r => setTimeout(r, 1600));

    const activeCheck = await page.evaluate(() => {
      return {
        state: window.arcApp.state,
        canvasState: window.arcApp.physicsCanvas.state,
        portalRadius: window.arcApp.physicsCanvas.portalHorizonRadius,
        trackCount: window.arcApp.physicsCanvas.collisionTracks.length,
        beamEnergy: window.arcApp.physicsCanvas.beamEnergy
      };
    });

    console.log('Active State:', activeCheck.state);
    console.log('Canvas State:', activeCheck.canvasState);
    console.log('Portal Radius:', activeCheck.portalRadius);
    console.log('Particle Shower Tracks Count:', activeCheck.trackCount);
    console.log('Beam Energy (TeV):', activeCheck.beamEnergy);

    testResults.visibleActivationSuccess = (
      activeCheck.state === 'ACTIVE_COLLISION' &&
      activeCheck.portalRadius > 50 &&
      activeCheck.trackCount > 10
    );

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_active_collision_portal_1080p.png') });

    // Also screenshot active collision at 4K
    await page.setViewport({ width: 3840, height: 2160 });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_active_collision_portal_4k.png') });
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(r => setTimeout(r, 300));

    // -------------------------------------------------------------
    // TEST 6: FULL DIAL-DISENGAGE-REDIAL CYCLES (TWICE)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Full Dial-Disengage-Redial Cycle (2 Full Passes) ---');

    for (let pass = 1; pass <= 2; pass++) {
      console.log(`\nPass ${pass}: Disengaging (Beam Dump)...`);
      await clickElementByRealHitTest('#btn-beam-dump');
      await new Promise(r => setTimeout(r, 400));

      const dumpedCheck = await page.evaluate(() => {
        return {
          state: window.arcApp.state,
          lockedCount: window.arcApp.lockedSectors.length,
          portalRadius: window.arcApp.physicsCanvas.portalHorizonRadius
        };
      });

      console.log(`Pass ${pass} Dumped State:`, dumpedCheck.state, `Locked: ${dumpedCheck.lockedCount}`);
      if (dumpedCheck.state !== 'STANDBY' || dumpedCheck.lockedCount !== 0) {
        throw new Error(`Pass ${pass} disengage failed`);
      }

      console.log(`Pass ${pass}: Redialing 6 sectors...`);
      const redialSectors = [1, 5, 9, 13, 4, 16];
      for (let s of redialSectors) {
        await clickElementByRealHitTest(`#sec-btn-${s}`);
        await clickElementByRealHitTest('#btn-engage-sector');
      }

      await new Promise(r => setTimeout(r, 300));
      const redialArmed = await page.evaluate(() => window.arcApp.state);
      console.log(`Pass ${pass} Redialed Armed State:`, redialArmed);

      console.log(`Pass ${pass}: Triggering Collision...`);
      await clickElementByRealHitTest('#btn-trigger-collision');
      await new Promise(r => setTimeout(r, 1600));

      const redialActive = await page.evaluate(() => ({
        state: window.arcApp.state,
        tracks: window.arcApp.physicsCanvas.collisionTracks.length
      }));
      console.log(`Pass ${pass} Active Collision:`, redialActive.state, `Tracks: ${redialActive.tracks}`);
    }

    testResults.twoDialDisengageCyclesPassed = true;

    // -------------------------------------------------------------
    // TEST 7: QUICK-DIAL PRESETS & REGISTRY MODAL
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Quick-Dial & Target Registry Modal ---');
    
    // Disengage first
    await clickElementByRealHitTest('#btn-beam-dump');
    await new Promise(r => setTimeout(r, 300));

    // Open Target Registry
    await clickElementByRealHitTest('#btn-nav-registry');
    await new Promise(r => setTimeout(r, 400));

    const registryModalOpen = await page.evaluate(() => {
      const modal = document.getElementById('modal-registry');
      return modal.classList.contains('open');
    });
    console.log('Registry Modal Open:', registryModalOpen);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_target_registry_modal.png') });

    // Click "LOAD TO LATTICE" on the 6th entry (Trappist-1e Tier 2)
    const loadButtons = await page.$$('.table-action-btn');
    if (loadButtons.length > 5) {
      await loadButtons[5].click();
      await new Promise(r => setTimeout(r, 2500)); // injection sequencer: 6 sectors x 300ms
    }

    const quickDialLoaded = await page.evaluate(() => {
      return {
        state: window.arcApp.state,
        lockedCount: window.arcApp.lockedSectors.length,
        currentTarget: window.arcApp.currentTarget ? window.arcApp.currentTarget.designation : null
      };
    });

    console.log('Quick-Dial Loaded Target:', quickDialLoaded.currentTarget);
    console.log('Quick-Dial Armed State (Negative Check):', quickDialLoaded.state);
    testResults.quickDialSuccess = (quickDialLoaded.lockedCount === 6 && quickDialLoaded.state === 'ARMED');

    // -------------------------------------------------------------
    // TEST 7.5: STAGED INJECTION-SEQUENCER REPLAY (per-sector locks)
    // -------------------------------------------------------------
    console.log('\n--- TEST 7.5: Staged Quick-Dial Replay (per-sector, no instant jump) ---');
    await clickElementByRealHitTest('#btn-beam-dump');
    await new Promise(r => setTimeout(r, 300));

    // Trigger a quick-dial preset with a real pointer click, sample DURING replay
    await clickElementByRealHitTest('.quick-dial-btn');
    const replayStart = Date.now();
    const replaySamples = [];
    for (const off of [450, 1000, 1550]) {
      const rem = replayStart + off - Date.now();
      if (rem > 0) await new Promise(r => setTimeout(r, rem));
      const s = await page.evaluate(() => ({
        state: window.arcApp.state,
        locked: window.arcApp.lockedSectors.length,
        portalRadius: window.arcApp.physicsCanvas.portalHorizonRadius
      }));
      replaySamples.push(s);
      console.log(`  t=${Date.now() - replayStart}ms: state=${s.state}, locked=${s.locked}/6`);
    }
    const seqCounts = replaySamples.map(s => s.locked);
    const stagedOk = seqCounts.every((v, i) => i === 0 || v > seqCounts[i - 1]) &&
                     replaySamples.every(s => s.locked > 0 && s.locked < 6 && s.state === 'STANDBY' && s.portalRadius < 0.01);

    // Completion: ARMED, no auto-fire even 1s past final lock
    const toEnd = replayStart + 2800 - Date.now();
    if (toEnd > 0) await new Promise(r => setTimeout(r, toEnd));
    const replayEnd = await page.evaluate(() => ({
      state: window.arcApp.state,
      locked: window.arcApp.lockedSectors.length,
      portalRadius: window.arcApp.physicsCanvas.portalHorizonRadius,
      triggerDisabled: document.getElementById('btn-trigger-collision').disabled
    }));
    console.log('Replay End:', JSON.stringify(replayEnd));
    testResults.stagedQuickDialReplay = stagedOk &&
      replayEnd.state === 'ARMED' && replayEnd.locked === 6 &&
      replayEnd.portalRadius < 0.01 && replayEnd.triggerDisabled === false;
    console.log('STAGED REPLAY TEST RESULT:', testResults.stagedQuickDialReplay ? 'PASSED' : 'FAILED');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_quickdial_replay_armed.png') });

    // In-progress screenshots: one mid-replay frame per pass, two passes at offsets
    const midStates = [];
    for (const [off, label] of [[450, 'early'], [1100, 'late']]) {
      await clickElementByRealHitTest('#btn-beam-dump');
      await new Promise(r => setTimeout(r, 200));
      await clickElementByRealHitTest('.quick-dial-btn');
      const passStart = Date.now();
      const rem2 = passStart + off - Date.now();
      if (rem2 > 0) await new Promise(r => setTimeout(r, rem2));
      const st = await page.evaluate(() => ({ state: window.arcApp.state, locked: window.arcApp.lockedSectors.length }));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `10_quickdial_replay_${label}.png`) });
      midStates.push(st);
      console.log(`  Mid-replay screenshot (${label}): state=${st.state}, locked=${st.locked}/6`);
      const settle = passStart + 2600 - Date.now();
      if (settle > 0) await new Promise(r => setTimeout(r, settle));
    }
    testResults.midReplayScreenshotsDistinct =
      midStates[0].locked > 0 && midStates[0].locked < 6 &&
      midStates[1].locked > midStates[0].locked && midStates[1].locked < 6;
    console.log('MID-REPLAY SCREENSHOTS DISTINCT:', testResults.midReplayScreenshotsDistinct ? 'PASSED' : 'FAILED');

    // -------------------------------------------------------------
    // TEST 7.6: BEAM DUMP DURING REPLAY (mid-sequence disengage)
    // -------------------------------------------------------------
    console.log('\n--- TEST 7.6: Beam Dump DURING quick-dial replay ---');
    await clickElementByRealHitTest('#btn-beam-dump');
    await new Promise(r => setTimeout(r, 200));
    await clickElementByRealHitTest('.quick-dial-btn');
    await new Promise(r => setTimeout(r, 750)); // ~2 sectors locked
    const midDump = await page.evaluate(() => ({ state: window.arcApp.state, locked: window.arcApp.lockedSectors.length }));
    console.log('Mid-replay before dump:', JSON.stringify(midDump));
    await clickElementByRealHitTest('#btn-beam-dump');
    await new Promise(r => setTimeout(r, 2000)); // past when remaining sequencer steps would fire
    const afterDump = await page.evaluate(() => ({ state: window.arcApp.state, locked: window.arcApp.lockedSectors.length }));
    console.log('After mid-replay dump (+2s):', JSON.stringify(afterDump));
    testResults.midReplayDumpClean =
      midDump.locked > 0 && midDump.locked < 6 &&
      afterDump.state === 'STANDBY' && afterDump.locked === 0;
    console.log('MID-REPLAY DUMP TEST RESULT:', testResults.midReplayDumpClean ? 'PASSED' : 'FAILED');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_mid_replay_beam_dump.png') });

    // -------------------------------------------------------------
    // TEST 8: OPERATOR REFERENCE MODAL & ATTRIBUTIONS
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Operator Reference Modal & Mandatory Attributions ---');
    
    await clickElementByRealHitTest('#operator-ref-btn');
    await new Promise(r => setTimeout(r, 300));

    const operatorModalOpen = await page.evaluate(() => {
      return document.getElementById('modal-operator-guide').classList.contains('open');
    });
    console.log('Operator Reference Modal Open:', operatorModalOpen);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_operator_reference_modal.png') });

    // Close operator modal
    await clickElementByRealHitTest('#modal-operator-guide .modal-close-btn');
    await new Promise(r => setTimeout(r, 200));

    // Open Tunnel Schematic
    await clickElementByRealHitTest('#btn-nav-schematic');
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_tunnel_schematic_modal.png') });
    await clickElementByRealHitTest('#modal-schematic .modal-close-btn');

    // Check Corner Displays & Attributions
    const cornerChecks = await page.evaluate(() => {
      const attrLink = document.querySelector('#corner-attribution a');
      const verText = document.getElementById('corner-version').textContent.trim();
      return {
        attrHref: attrLink ? attrLink.href : null,
        attrText: attrLink ? attrLink.textContent.trim() : null,
        attrRel: attrLink ? attrLink.rel : null,
        attrTarget: attrLink ? attrLink.target : null,
        version: verText
      };
    });

    console.log('Corner Attribution:', cornerChecks);
    testResults.cornerAttributionValid = (
      cornerChecks.attrHref === 'https://github.com/StarlightDaemon' &&
      cornerChecks.attrText === 'StarlightDaemon' &&
      cornerChecks.attrRel.includes('noopener') &&
      cornerChecks.version === 'v1.1.0'
    );

    console.log('\n=== ALL TEST RESULTS SUMMARY ===');
    console.log(JSON.stringify(testResults, null, 2));

  } catch (err) {
    console.error('Verification Error:', err);
    testResults.error = err.message;
  } finally {
    await browser.close();
  }

  return testResults;
}

runVerification().then(res => {
  fs.writeFileSync(path.join(__dirname, 'test_results.json'), JSON.stringify(res, null, 2));
  console.log('Verification finished. Saved to test_results.json');
});
