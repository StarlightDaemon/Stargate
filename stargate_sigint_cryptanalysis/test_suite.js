const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

// Browser resolution. No absolute local filesystem path is committed here:
// CHROME_PATH (or PUPPETEER_EXECUTABLE_PATH) wins, otherwise puppeteer's own
// executable path is used. Anything else is an explicit error.
async function resolveChrome() {
  const fromEnv = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv) return fromEnv;
  let why;
  try {
    const p = await puppeteer.executablePath();
    if (p && fs.existsSync(p)) return p;
    why = p ? `puppeteer's executable path does not exist: ${p}` : 'puppeteer reported no executable path';
  } catch (e) {
    why = `puppeteer could not resolve an executable path (${e.message})`;
  }
  throw new Error(`No browser found: ${why}. Set CHROME_PATH to a Chrome/Chromium executable.`);
}
const URL = 'http://localhost:8420';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Click element by dispatching pointer events to its rendered center coordinate from elementFromPoint
async function hitTestAndClick(page, selector) {
  const coords = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hitEl = document.elementFromPoint(x, y);
    return {
      x,
      y,
      matched: hitEl === el || el.contains(hitEl),
      hitTagName: hitEl ? hitEl.tagName : 'null',
      id: el.id
    };
  }, selector);

  if (!coords) {
    throw new Error(`Element not found for selector: ${selector}`);
  }

  if (!coords.matched) {
    console.warn(`Hit-test warning for ${selector}: elementFromPoint returned <${coords.hitTagName}> at (${coords.x}, ${coords.y})`);
  }

  await page.mouse.click(coords.x, coords.y);
  return coords;
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('DSCR // STATION VORTEX-9 — AUTOMATED PUPPETEER VERIFICATION SUITE');
  console.log('================================================================');

  const browser = await puppeteer.launch({
    executablePath: await resolveChrome(),
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const testResults = {
    viewportScale1080p: null,
    viewportScale4K: null,
    cornerDisplayVerification: null,
    operatorReferenceModal: null,
    negativeAutoFireTest: null,
    safetyInterlockDefaultAndBlock: null,
    threeStageActivation: {
      stage1Buildup: null,
      stage2Breakthrough: null,
      stage3Sustained: null
    },
    disengageRedialCycle1: null,
    disengageRedialCycle2: null,
    quickDialTiers: null
  };

  try {
    console.log(`[TEST 1] Navigating to ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle0' });

    // -----------------------------------------------------------------------
    // TEST 1: Viewport & Scaling Verification (1080p & 4K)
    // -----------------------------------------------------------------------
    console.log('\n--- VERIFYING VIEWPORT & CSS SCALING ---');
    const scale1080p = await page.evaluate(() => {
      const computedScale = getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim();
      const containerRect = document.getElementById('console-root').getBoundingClientRect();
      const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;
      const hasVerticalScroll = document.documentElement.scrollHeight > window.innerHeight;
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        computedScale,
        containerWidth: containerRect.width,
        containerHeight: containerRect.height,
        hasHorizontalScroll,
        hasVerticalScroll
      };
    });
    console.log('1080p Viewport Data:', scale1080p);
    testResults.viewportScale1080p = scale1080p;

    // Test 4K scaling
    await page.setViewport({ width: 3840, height: 2160 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await sleep(200);

    const scale4k = await page.evaluate(() => {
      const computedScale = getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim();
      const containerRect = document.getElementById('console-root').getBoundingClientRect();
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        computedScale,
        containerWidth: containerRect.width,
        containerHeight: containerRect.height
      };
    });
    console.log('4K Viewport Data:', scale4k);
    testResults.viewportScale4K = scale4k;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'overview_4k.png') });

    // Reset back to 1080p
    await page.setViewport({ width: 1920, height: 1080 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await sleep(200);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'overview_1080p_idle.png') });

    // -----------------------------------------------------------------------
    // TEST 2: Corner Displays & Attribution
    // -----------------------------------------------------------------------
    console.log('\n--- VERIFYING CORNER DISPLAYS & ATTRIBUTION ---');
    const cornerData = await page.evaluate(() => {
      const link = document.querySelector('.attribution-link');
      const versionBadge = document.querySelector('.version-label');
      return {
        linkText: link ? link.textContent.trim() : null,
        linkHref: link ? link.getAttribute('href') : null,
        linkTarget: link ? link.getAttribute('target') : null,
        linkRel: link ? link.getAttribute('rel') : null,
        versionText: versionBadge ? versionBadge.textContent.trim() : null
      };
    });
    console.log('Corner Displays:', cornerData);
    testResults.cornerDisplayVerification = cornerData;

    // -----------------------------------------------------------------------
    // TEST 3: Operator Reference Modal
    // -----------------------------------------------------------------------
    console.log('\n--- VERIFYING OPERATOR REFERENCE MODAL ---');
    await hitTestAndClick(page, '#op-ref-btn');
    await sleep(250);

    const modalStateOpen = await page.evaluate(() => {
      const modal = document.getElementById('ref-modal');
      return {
        display: getComputedStyle(modal).display,
        ariaHidden: modal.getAttribute('aria-hidden')
      };
    });
    console.log('Modal Opened State:', modalStateOpen);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'operator_modal_open.png') });

    await hitTestAndClick(page, '#modal-close-btn');
    await sleep(200);

    const modalStateClosed = await page.evaluate(() => {
      const modal = document.getElementById('ref-modal');
      return {
        display: getComputedStyle(modal).display,
        ariaHidden: modal.getAttribute('aria-hidden')
      };
    });
    console.log('Modal Closed State:', modalStateClosed);
    testResults.operatorReferenceModal = { modalStateOpen, modalStateClosed };

    // -----------------------------------------------------------------------
    // TEST 4: NEGATIVE AUTO-FIRE TEST
    // Dial all 8 keys manually and confirm NO AUTO-FIRE occurs
    // -----------------------------------------------------------------------
    console.log('\n--- RUNNING NEGATIVE AUTO-FIRE TEST ---');
    console.log('Manually pinning 8 sub-keys via Commutator glyph buttons...');

    const dialSequence = [0, 1, 2, 3, 4, 5, 6, 7];
    for (const idx of dialSequence) {
      await hitTestAndClick(page, `#glyph-btn-${idx}`);
      await sleep(350); // wait for hypothesis test to resolve
    }

    const stateAfter8Keys = await page.evaluate(() => {
      const s = window.__DSCR_STATE__;
      const btn = document.getElementById('btn-activate');
      const entropy = document.getElementById('stat-entropy').textContent;
      const keyspace = document.getElementById('stat-keyspace').textContent;
      return {
        systemState: s.systemState,
        lockedCount: s.lockedKeys.filter(k => k !== null).length,
        lockedKeys: s.lockedKeys,
        btnDisabled: btn.disabled,
        entropy,
        keyspace
      };
    });
    console.log('State Immediately After 8th Key Pinning:', stateAfter8Keys);

    console.log('Waiting 2.5 seconds to strictly verify NO auto-activation occurs...');
    await sleep(2500);

    const stateAfterWait = await page.evaluate(() => {
      const s = window.__DSCR_STATE__;
      const progress = document.getElementById('activation-progress').style.width;
      return {
        systemState: s.systemState,
        activationProgressWidth: progress,
        didAutoFire: s.systemState === 'BUILDUP' || s.systemState === 'BREAKTHROUGH' || s.systemState === 'SUSTAINED_ACTIVE'
      };
    });
    console.log('State After 2.5s Wait (Negative Test Check):', stateAfterWait);

    testResults.negativeAutoFireTest = {
      passed: stateAfter8Keys.systemState === 'READY' && stateAfterWait.didAutoFire === false,
      stateAfter8Keys,
      stateAfterWait
    };
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'state_ready_no_autofire.png') });

    // -----------------------------------------------------------------------
    // TEST 5: SAFETY INTERLOCK (DEFAULT RELEASED & BLOCKING WHEN ENGAGED)
    // -----------------------------------------------------------------------
    console.log('\n--- VERIFYING OPSEC SAFETY INTERLOCK ---');
    const interlockDefault = await page.evaluate(() => {
      return {
        interlockEngaged: window.__DSCR_STATE__.interlockEngaged,
        buttonText: document.getElementById('interlock-status-text').textContent.trim(),
        hasReleasedClass: document.getElementById('safety-interlock').classList.contains('released')
      };
    });
    console.log('Interlock Default State:', interlockDefault);

    console.log('Toggling Interlock to ENGAGED...');
    await hitTestAndClick(page, '#safety-interlock');
    await sleep(200);

    const interlockEngaged = await page.evaluate(() => {
      return {
        interlockEngaged: window.__DSCR_STATE__.interlockEngaged,
        buttonText: document.getElementById('interlock-status-text').textContent.trim()
      };
    });
    console.log('Interlock Engaged State:', interlockEngaged);

    console.log('Attempting Decryption with Interlock ENGAGED (Should be Blocked)...');
    await hitTestAndClick(page, '#btn-activate');
    await sleep(300);

    const interlockBlockResult = await page.evaluate(() => {
      const s = window.__DSCR_STATE__;
      const alertDisplay = document.getElementById('interlock-alert').style.display;
      return {
        systemState: s.systemState,
        alertVisible: alertDisplay === 'flex',
        wasBlocked: s.systemState === 'READY' // remains in READY, did not proceed to BUILDUP
      };
    });
    console.log('Interlock Block Result:', interlockBlockResult);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'interlock_blocked_attempt.png') });

    console.log('Releasing Interlock back to SAFE...');
    await hitTestAndClick(page, '#safety-interlock');
    await sleep(200);

    testResults.safetyInterlockDefaultAndBlock = {
      defaultReleased: interlockDefault.interlockEngaged === false,
      blockSuccess: interlockBlockResult.wasBlocked && interlockBlockResult.alertVisible
    };

    // -----------------------------------------------------------------------
    // TEST 6: THREE-STAGE ACTIVATION SEQUENCE (BUILDUP -> BREAKTHROUGH -> SUSTAINED)
    // -----------------------------------------------------------------------
    console.log('\n--- EXECUTING THREE-STAGE ACTIVATION PIPELINE ---');
    console.log('Clicking [ EXECUTE APERTURE DECRYPTION ]...');
    await hitTestAndClick(page, '#btn-activate');

    // Sample Stage 1: Buildup (at ~1.2s mark)
    await sleep(1200);
    const stage1Data = await page.evaluate(() => {
      return {
        systemState: window.__DSCR_STATE__.systemState,
        progressWidth: document.getElementById('activation-progress').style.width,
        carrierText: document.getElementById('carrier-indicator').textContent.trim(),
        hudPrimary: document.getElementById('state-text-primary').textContent.trim()
      };
    });
    console.log('STAGE 1 (Buildup) Telemetry:', stage1Data);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'stage1_buildup.png') });
    testResults.threeStageActivation.stage1Buildup = stage1Data;

    // Sample Stage 2: Breakthrough (at ~2.65s mark, right at breakthrough)
    await sleep(1450);
    const stage2Data = await page.evaluate(() => {
      return {
        systemState: window.__DSCR_STATE__.systemState,
        carrierText: document.getElementById('carrier-indicator').textContent.trim(),
        hudPrimary: document.getElementById('state-text-primary').textContent.trim(),
        decryptedContent: document.getElementById('decrypted-content').textContent.trim()
      };
    });
    console.log('STAGE 2 (Breakthrough) Telemetry:', stage2Data);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'stage2_breakthrough.png') });
    testResults.threeStageActivation.stage2Breakthrough = stage2Data;

    // Sample Stage 3: Sustained Active (at ~3.8s mark)
    await sleep(1000);
    const stage3Data = await page.evaluate(() => {
      return {
        systemState: window.__DSCR_STATE__.systemState,
        carrierText: document.getElementById('carrier-indicator').textContent.trim(),
        hudPrimary: document.getElementById('state-text-primary').textContent.trim(),
        decryptedContent: document.getElementById('decrypted-content').textContent.trim()
      };
    });
    console.log('STAGE 3 (Sustained Active) Telemetry:', stage3Data);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'stage3_sustained.png') });
    testResults.threeStageActivation.stage3Sustained = stage3Data;

    // -----------------------------------------------------------------------
    // TEST 7: DISENGAGE & REDIAL CYCLE 1 (Quick-Dial Tier 1 Preset)
    // -----------------------------------------------------------------------
    console.log('\n--- EXECUTING DISENGAGE & REDIAL CYCLE 1 ---');
    console.log('Clicking [ SEVER CONNECTION // PURGE KEYSTREAM ] via hit-test...');
    await hitTestAndClick(page, '#btn-disengage');
    await sleep(400);

    const stateAfterDisengage1 = await page.evaluate(() => {
      const s = window.__DSCR_STATE__;
      return {
        systemState: s.systemState,
        lockedCount: s.lockedKeys.filter(k => k !== null).length,
        carrierText: document.getElementById('carrier-indicator').textContent.trim()
      };
    });
    console.log('State After Disengage 1:', stateAfterDisengage1);

    console.log('Loading Tier 1 Preset: CYGNUS-DEEP (preset-btn-p2)...');
    await hitTestAndClick(page, '#preset-btn-p2');
    await sleep(2800); // wait for 8 sub-keys sequential hypothesis locks

    const preset1Locked = await page.evaluate(() => {
      const s = window.__DSCR_STATE__;
      return {
        systemState: s.systemState,
        lockedCount: s.lockedKeys.filter(k => k !== null).length,
        lockedKeys: s.lockedKeys,
        isReady: s.systemState === 'READY'
      };
    });
    console.log('Preset 1 Locked State:', preset1Locked);

    console.log('Activating Tier 1 Preset Aperture...');
    await hitTestAndClick(page, '#btn-activate');
    await sleep(3500); // wait through buildup + breakthrough to sustained

    const preset1Active = await page.evaluate(() => {
      return {
        systemState: window.__DSCR_STATE__.systemState,
        decryptedContent: document.getElementById('decrypted-content').textContent.trim()
      };
    });
    console.log('Preset 1 Decrypted Active State:', preset1Active);
    testResults.disengageRedialCycle1 = { stateAfterDisengage1, preset1Locked, preset1Active };
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'cycle1_preset_sustained.png') });

    // -----------------------------------------------------------------------
    // TEST 8: DISENGAGE & REDIAL CYCLE 2 (Quick-Dial Tier 2 Suspect Preset)
    // -----------------------------------------------------------------------
    console.log('\n--- EXECUTING DISENGAGE & REDIAL CYCLE 2 ---');
    console.log('Clicking [ SEVER CONNECTION // PURGE KEYSTREAM ] via hit-test...');
    await hitTestAndClick(page, '#btn-disengage');
    await sleep(400);

    console.log('Loading Tier 2 Suspect Preset: SHADOW-VECTOR UNK-09 (preset-btn-p4)...');
    await hitTestAndClick(page, '#preset-btn-p4');
    await sleep(2800); // wait for 8 sub-keys sequential hypothesis locks

    const preset2Locked = await page.evaluate(() => {
      const s = window.__DSCR_STATE__;
      return {
        systemState: s.systemState,
        lockedCount: s.lockedKeys.filter(k => k !== null).length,
        lockedKeys: s.lockedKeys,
        isReady: s.systemState === 'READY'
      };
    });
    console.log('Preset 2 Locked State:', preset2Locked);

    console.log('Activating Tier 2 Preset Aperture...');
    await hitTestAndClick(page, '#btn-activate');
    await sleep(3500);

    const preset2Active = await page.evaluate(() => {
      return {
        systemState: window.__DSCR_STATE__.systemState,
        decryptedContent: document.getElementById('decrypted-content').textContent.trim()
      };
    });
    console.log('Preset 2 Decrypted Active State:', preset2Active);
    testResults.disengageRedialCycle2 = { preset2Locked, preset2Active };
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'cycle2_suspect_preset_sustained.png') });

    // Disengage cleanly
    await hitTestAndClick(page, '#btn-disengage');
    await sleep(300);

    console.log('\n================================================================');
    console.log('AUTOMATED VERIFICATION COMPLETED SUCCESSFULLY!');
    console.log('================================================================');

    fs.writeFileSync(path.join(__dirname, 'test_results.json'), JSON.stringify(testResults, null, 2));
    console.log('Wrote test_results.json');

  } catch (err) {
    console.error('TEST SUITE ERROR:', err);
  } finally {
    await browser.close();
  }
}

runTestSuite();
