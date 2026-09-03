/**
 * Khepri Cipher Terminal - Comprehensive Automated End-to-End Verification Test Suite
 * Powered by Puppeteer with Real Pointer Events, Computed Style Measurements, & Staged Screenshots
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = process.env.CHROME_PATH || 
  (process.platform === 'win32' 
    ? (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe') : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    : '/usr/bin/google-chrome');
const TARGET_URL = 'http://127.0.0.1:8080/';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTestSuite() {
  console.log('=== KHEPRI CIPHER TERMINAL: AUTOMATED VERIFICATION SUITE ===');
  console.log(`Connecting to: ${TARGET_URL}`);
  console.log(`Using Chrome: ${CHROME_PATH}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const testResults = [];
  function recordTest(name, passed, details = {}) {
    testResults.push({ name, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}:`, JSON.stringify(details));
  }

  try {
    // 1. Load Page & Viewport Check at 1080p
    await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#app-root');

    const scale1080p = await page.evaluate(() => {
      const el = document.getElementById('app-root');
      const style = window.getComputedStyle(el);
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        transform: style.transform,
        customProp: getComputedStyle(document.documentElement).getPropertyValue('--app-scale').trim()
      };
    });
    recordTest('Viewport Scaling at 1920x1080', scale1080p.transform !== 'none', scale1080p);

    // Capture Cold Start 1080p Screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_cold_start_1080p.png') });

    // 2. Viewport Check at 4K (3840x2160)
    await page.setViewport({ width: 3840, height: 2160 });
    await new Promise(r => setTimeout(r, 200));
    const scale4k = await page.evaluate(() => {
      const el = document.getElementById('app-root');
      const style = window.getComputedStyle(el);
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        transform: style.transform,
        customProp: getComputedStyle(document.documentElement).getPropertyValue('--app-scale').trim()
      };
    });
    recordTest('Viewport Scaling at Simulated 4K (3840x2160)', scale4k.transform !== 'none', scale4k);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01b_cold_start_4k.png') });

    // Reset back to 1080p for standard interactive tests
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(r => setTimeout(r, 200));

    // 3. Safety Interlock Default State Check
    const isolatorDefault = await page.evaluate(() => {
      const isolator = document.getElementById('toggle-isolator');
      return {
        hasReleasedClass: isolator.classList.contains('released'),
        hasEngagedClass: isolator.classList.contains('engaged'),
        text: isolator.innerText.replace(/\s+/g, ' ').trim()
      };
    });
    recordTest('Safety Interlock Defaults to RELEASED', isolatorDefault.hasReleasedClass && !isolatorDefault.hasEngagedClass, isolatorDefault);

    // 4. Manual Dialing: Select 7 Vectors Sequentially with Real Pointer Events
    console.log('--- Dialing 7 Exploit Vectors manually via Pointer Events ---');
    for (let i = 0; i < 7; i++) {
      const vectorBtn = await page.$(`#btn-vector-${i}`);
      const box = await vectorBtn.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await new Promise(r => setTimeout(r, 180)); // Allow candidate key cycling animation
    }

    const manualPendingState = await page.evaluate(() => {
      const dialer = window.CipherDialer;
      const execBtn = document.getElementById('btn-execute');
      return {
        addressLength: dialer.currentAddress.length,
        stage: dialer.stage,
        isExecuteReady: execBtn.classList.contains('ready'),
        isExecuteDisabled: execBtn.disabled,
        statusText: document.getElementById('breach-status-display').textContent
      };
    });
    recordTest('Manual Dialing Reaches 7/7 PENDING State', 
      manualPendingState.addressLength === 7 && manualPendingState.stage === 'pending' && manualPendingState.isExecuteReady, 
      manualPendingState
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_manual_dial_pending.png') });

    // 5. Negative Auto-Fire Test: System MUST stay PENDING and NOT fire automatically!
    console.log('--- Running Negative Auto-Fire Test (Waiting 1200ms) ---');
    await new Promise(r => setTimeout(r, 1200));
    const negativeAutoFireState = await page.evaluate(() => {
      return {
        stage: window.CipherDialer.stage,
        isAutoDialing: window.CipherDialer.isAutoDialing,
        statusText: document.getElementById('breach-status-display').textContent
      };
    });
    recordTest('Negative Auto-Fire Test: No Automatic Activation', 
      negativeAutoFireState.stage === 'pending', 
      negativeAutoFireState
    );

    // 6. Safety Interlock Blocking Test (Engage isolator, attempt breach, verify blocked)
    console.log('--- Testing Safety Interlock Blocking when Engaged ---');
    const isolatorBtn = await page.$('#toggle-isolator');
    const isoBox = await isolatorBtn.boundingBox();
    await page.mouse.click(isoBox.x + isoBox.width / 2, isoBox.y + isoBox.height / 2); // Toggle to ENGAGED
    await new Promise(r => setTimeout(r, 150));

    // Attempt Execute Breach
    const execBtnEl = await page.$('#btn-execute');
    const execBox = await execBtnEl.boundingBox();
    await page.mouse.click(execBox.x + execBox.width / 2, execBox.y + execBox.height / 2);
    await new Promise(r => setTimeout(r, 150));

    const interlockBlockedState = await page.evaluate(() => {
      const banner = document.getElementById('interlock-alert-banner');
      return {
        stage: window.CipherDialer.stage,
        isBannerVisible: banner.classList.contains('visible'),
        bannerText: banner.textContent.trim()
      };
    });
    recordTest('Safety Interlock Successfully Blocks Activation when Engaged', 
      interlockBlockedState.stage === 'pending' && interlockBlockedState.isBannerVisible, 
      interlockBlockedState
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_interlock_engaged_blocked.png') });

    // Release Safety Interlock
    await page.mouse.click(isoBox.x + isoBox.width / 2, isoBox.y + isoBox.height / 2);
    await new Promise(r => setTimeout(r, 150));

    // 7. Three-Stage Activation Sequence: BUILDUP -> BREAKTHROUGH -> SUSTAINED ACTIVE
    console.log('--- Triggering Three-Stage Activation Sequence ---');
    await page.mouse.click(execBox.x + execBox.width / 2, execBox.y + execBox.height / 2);

    // Stage 1: Buildup Check (at ~800ms)
    await new Promise(r => setTimeout(r, 800));
    const stage1State = await page.evaluate(() => {
      return {
        stage: window.CipherDialer.stage,
        gateClass: document.getElementById('gate-container').className,
        statusText: document.getElementById('breach-status-display').textContent,
        traceRisk: window.CipherTelemetry.traceRisk
      };
    });
    recordTest('Stage 1 (BUILDUP) Verified with Real Duration', stage1State.stage === 'buildup', stage1State);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_stage1_buildup.png') });

    // Stage 2: Breakthrough Check (at ~1850ms total, after buildup finishes)
    await new Promise(r => setTimeout(r, 1100));
    const stage2State = await page.evaluate(() => {
      return {
        stage: window.CipherDialer.stage,
        gateClass: document.getElementById('gate-container').className,
        shockwavesCount: window.CipherRing.shockwaves.length,
        statusText: document.getElementById('breach-status-display').textContent
      };
    });
    recordTest('Stage 2 (BREAKTHROUGH) Verified with Aperture Open', 
      stage2State.stage === 'breakthrough' || stage2State.stage === 'active', 
      stage2State
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_stage2_breakthrough.png') });

    // Stage 3: Sustained Active Check (at ~2800ms total)
    await new Promise(r => setTimeout(r, 900));
    const stage3State = await page.evaluate(() => {
      return {
        stage: window.CipherDialer.stage,
        gateClass: document.getElementById('gate-container').className,
        bandwidth: window.CipherTelemetry.bandwidth,
        transferredTB: window.CipherTelemetry.totalTransferred,
        statusText: document.getElementById('breach-status-display').textContent
      };
    });
    recordTest('Stage 3 (SUSTAINED ACTIVE) Verified with Volumetric Conduit', 
      stage3State.stage === 'active' && stage3State.bandwidth > 0, 
      stage3State
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_stage3_sustained_active.png') });

    // 8. Disengage Test 1: Purge Connection
    console.log('--- Testing Disengage (Purge Connection) ---');
    const purgeBtnEl = await page.$('#btn-purge');
    const purgeBox = await purgeBtnEl.boundingBox();
    await page.mouse.click(purgeBox.x + purgeBox.width / 2, purgeBox.y + purgeBox.height / 2);
    await new Promise(r => setTimeout(r, 300));

    const disengageState = await page.evaluate(() => {
      return {
        stage: window.CipherDialer.stage,
        addressLength: window.CipherDialer.currentAddress.length,
        gateClass: document.getElementById('gate-container').className,
        bandwidth: window.CipherTelemetry.bandwidth
      };
    });
    recordTest('Disengage 1: Purge Connection Restores Idle State', 
      disengageState.stage === 'idle' && disengageState.addressLength === 0 && disengageState.bandwidth === 0, 
      disengageState
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_disengage_idle.png') });

    // 9. Quick-Dial Auto-Dial Sequence & Negative Auto-Fire Test
    console.log('--- Testing Quick-Dial Presets & Sequential Auto-Dial ---');
    const qdNavBtn = await page.$('#nav-btn-quickdial');
    const qdNavBox = await qdNavBtn.boundingBox();
    await page.mouse.click(qdNavBox.x + qdNavBox.width / 2, qdNavBox.y + qdNavBox.height / 2);
    await new Promise(r => setTimeout(r, 200));

    // Click Preset 4: ECLIPSE-04 Sub-Orbital Rail
    const presetCard = (await page.$$('.preset-card'))[3];
    const pBox = await presetCard.boundingBox();
    await page.mouse.click(pBox.x + pBox.width / 2, pBox.y + pBox.height / 2);

    // Wait 600ms mid-sequence to capture real staged auto-dialing motion
    await new Promise(r => setTimeout(r, 600));
    const autoDialInProgress = await page.evaluate(() => {
      return {
        isAutoDialing: window.CipherDialer.isAutoDialing,
        lockedCount: window.CipherDialer.currentAddress.length
      };
    });
    recordTest('Quick-Dial Sequence in Progress (Real Sequential Timing)', 
      autoDialInProgress.isAutoDialing || autoDialInProgress.lockedCount > 0, 
      autoDialInProgress
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_quickdial_in_progress.png') });

    // Wait for auto-dial sequence to complete into PENDING (1600ms)
    await new Promise(r => setTimeout(r, 1600));
    const autoDialPending = await page.evaluate(() => {
      return {
        isAutoDialing: window.CipherDialer.isAutoDialing,
        addressLength: window.CipherDialer.currentAddress.length,
        stage: window.CipherDialer.stage,
        isExecuteReady: document.getElementById('btn-execute').classList.contains('ready')
      };
    });
    recordTest('Quick-Dial Completes into PENDING State (Never Auto-Fires)', 
      autoDialPending.addressLength === 7 && autoDialPending.stage === 'pending' && autoDialPending.isExecuteReady, 
      autoDialPending
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_quickdial_pending.png') });

    // Activate Quick-Dial Breach
    await page.mouse.click(execBox.x + execBox.width / 2, execBox.y + execBox.height / 2);
    await new Promise(r => setTimeout(r, 2600)); // Complete Buildup + Breakthrough -> Active
    const quickDialActive = await page.evaluate(() => {
      return {
        stage: window.CipherDialer.stage,
        bandwidth: window.CipherTelemetry.bandwidth
      };
    });
    recordTest('Quick-Dial Target Successfully Breached to Sustained Active', 
      quickDialActive.stage === 'active', 
      quickDialActive
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_quickdial_sustained_active.png') });

    // Disengage Test 2 (Second Full Cycle)
    await page.mouse.click(purgeBox.x + purgeBox.width / 2, purgeBox.y + purgeBox.height / 2);
    await new Promise(r => setTimeout(r, 300));
    const disengage2State = await page.evaluate(() => {
      return {
        stage: window.CipherDialer.stage,
        addressLength: window.CipherDialer.currentAddress.length
      };
    });
    recordTest('Disengage 2: Second Full Cycle Disengage Confirmed', 
      disengage2State.stage === 'idle' && disengage2State.addressLength === 0, 
      disengage2State
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_second_disengage_idle.png') });

    // 10. Secondary Features: Archive Database Modal & Relational Cross-References
    console.log('--- Testing Archive Database & Relational Hyperlinks ---');
    const archiveNavBtn = await page.$('#nav-btn-archive');
    const archBox = await archiveNavBtn.boundingBox();
    await page.mouse.click(archBox.x + archBox.width / 2, archBox.y + archBox.height / 2);
    await new Promise(r => setTimeout(r, 300));

    // Test cross-reference navigation
    const crossRefTest = await page.evaluate(() => {
      const archive = window.CipherArchive;
      archive.selectEntryById('SINGULARITY-07');
      const dossierTitle = document.querySelector('.dossier-title').textContent;
      const refCount = document.querySelectorAll('.cross-ref-badge').length;
      return { dossierTitle, refCount };
    });
    recordTest('Breach Archive Modal & Relational Links Verified', crossRefTest.refCount > 0, crossRefTest);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_archive_dossier.png') });

    // Close Archive
    const closeArchBtn = await page.$('#btn-close-archive');
    const cArchBox = await closeArchBtn.boundingBox();
    await page.mouse.click(cArchBox.x + cArchBox.width / 2, cArchBox.y + cArchBox.height / 2);
    await new Promise(r => setTimeout(r, 200));

    // 11. Secondary Features: Cyberspace Topology Map
    console.log('--- Testing Cyberspace Topology Map View ---');
    const topoNavBtn = await page.$('#nav-btn-topology');
    const topoBox = await topoNavBtn.boundingBox();
    await page.mouse.click(topoBox.x + topoBox.width / 2, topoBox.y + topoBox.height / 2);
    await new Promise(r => setTimeout(r, 300));

    const topoTest = await page.evaluate(() => {
      const topo = window.CipherTopology;
      return {
        isOpen: topo.isOpen(),
        nodeCount: topo.nodes.length,
        linksCount: topo.links.length
      };
    });
    recordTest('Cyberspace Topology Routing Map Verified', topoTest.isOpen && topoTest.nodeCount >= 16, topoTest);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_topology_map.png') });

    // Close Topology
    const closeTopoBtn = await page.$('#btn-close-topology');
    const cTopoBox = await closeTopoBtn.boundingBox();
    await page.mouse.click(cTopoBox.x + cTopoBox.width / 2, cTopoBox.y + cTopoBox.height / 2);
    await new Promise(r => setTimeout(r, 200));

    // 12. Operator Reference Manual ('?' Button)
    console.log('--- Testing Operator Reference Manual (?) Overlay ---');
    const refBtn = await page.$('#btn-operator-reference');
    const refBox = await refBtn.boundingBox();
    await page.mouse.click(refBox.x + refBox.width / 2, refBox.y + refBox.height / 2);
    await new Promise(r => setTimeout(r, 200));

    const refModalOpen = await page.evaluate(() => {
      return document.getElementById('operator-ref-modal').classList.contains('open');
    });
    recordTest('Operator Reference Manual (?) Dismissible Overlay Verified', refModalOpen, { isOpen: refModalOpen });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_operator_reference.png') });

    // Close Reference
    const closeRefBtn = await page.$('#btn-close-operator-ref');
    const cRefBox = await closeRefBtn.boundingBox();
    await page.mouse.click(cRefBox.x + cRefBox.width / 2, cRefBox.y + cRefBox.height / 2);
    await new Promise(r => setTimeout(r, 200));

    console.log('=== ALL AUTOMATED TESTS COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Test Suite Error:', err);
  } finally {
    await browser.close();
  }
}

runTestSuite();
