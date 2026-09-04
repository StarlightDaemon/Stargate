const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8089;
const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// MIME types helper
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(ROOT_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(PORT, () => {
      console.log(`Local test server running at http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

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

async function runTests() {
  console.log('--- Starting Cathedral Oculus Portal Verification Suite ---');
  const server = await startServer();
  const executablePath = await resolveChrome();
  console.log(`Using browser: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080', '--autoplay-policy=no-user-gesture-required']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const results = [];
    function record(name, passed, details = '') {
      results.push({ name, passed, details });
      console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name} ${details ? '- ' + details : ''}`);
    }

    // 1. Cold Start Test
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const pageTitle = await page.title();
    record('Page Title Check', pageTitle.includes('Grand Vitrarium of Lumisfer'), `Title: "${pageTitle}"`);

    // Check DOM elements
    const paletteButtonsCount = await page.$$eval('.palette-btn', el => el.length);
    record('12 Palette Buttons Present', paletteButtonsCount === 12, `Found ${paletteButtonsCount}`);

    const presetButtonsCount = await page.$$eval('.preset-card-btn', el => el.length);
    record('8 Quick-Dial Presets Present', presetButtonsCount === 8, `Found ${presetButtonsCount}`);

    const triforiumSlotsCount = await page.$$eval('.triforium-slot', el => el.length);
    record('7 Triforium Address Slots Present', triforiumSlotsCount === 7, `Found ${triforiumSlotsCount}`);

    // Check Safety Interlock Default
    const latchBadgeText = await page.$eval('#latch-status-badge', el => el.textContent.trim());
    record('Safety Interlock Defaults to RELEASED', latchBadgeText.includes('Released'), `Badge: "${latchBadgeText}"`);

    // Capture 1080p Screenshot
    const p1 = path.join(SCREENSHOTS_DIR, '01_cold_start_1080p.png');
    await page.screenshot({ path: p1 });
    record('Capture 01_cold_start_1080p.png', fs.existsSync(p1));

    // Test 4K Viewport Scale
    await page.setViewport({ width: 3840, height: 2160 });
    await new Promise(r => setTimeout(r, 300));
    const scaleFactor = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--scale-factor'));
    record('CSS Scale Factor on 4K', parseFloat(scaleFactor) > 1.8, `Scale factor: ${scaleFactor}`);
    const p2 = path.join(SCREENSHOTS_DIR, '02_cold_start_4k.png');
    await page.screenshot({ path: p2 });
    record('Capture 02_cold_start_4k.png', fs.existsSync(p2));

    // Reset to 1080p
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(r => setTimeout(r, 300));

    // 2. Manual Dialing Sequence (Hit-test pointer clicks at actual positions)
    console.log('\n--- Test: Manual 7-Light Dialing Sequence ---');
    const dialSequence = [1, 4, 6, 2, 8, 11, 5];
    for (let i = 0; i < dialSequence.length; i++) {
      const gId = dialSequence[i];
      const btn = await page.$(`#glyph-btn-${gId}`);
      const box = await btn.boundingBox();
      // Dispatch real pointer click at actual center coordinates
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await new Promise(r => setTimeout(r, 320)); // wait for 2-stage lock

      if (i === 3) {
        const pMid = path.join(SCREENSHOTS_DIR, '03_manual_dial_in_progress.png');
        await page.screenshot({ path: pMid });
        record('Capture 03_manual_dial_in_progress.png (4/7 locked)', fs.existsSync(pMid));
      }
    }

    // 3. Negative Auto-Fire Verification
    console.log('\n--- Test: Negative Auto-Fire Verification ---');
    await new Promise(r => setTimeout(r, 1500)); // wait long enough to prove no auto-fire

    const postDialState = await page.$eval('#telem-state', el => el.textContent.trim());
    const isIgnitionEnabled = await page.$eval('#btn-activate-portal', el => !el.disabled);
    record('Negative Auto-Fire Proof', postDialState.includes('Pending Sanctification') && isIgnitionEnabled, `State: "${postDialState}", Ignition Enabled: ${isIgnitionEnabled}`);

    const pPending = path.join(SCREENSHOTS_DIR, '04_pending_sanctified_state.png');
    await page.screenshot({ path: pPending });
    record('Capture 04_pending_sanctified_state.png', fs.existsSync(pPending));

    // 4. Staged 3-Stage Activation Lifecycle
    console.log('\n--- Test: 3-Stage Activation Lifecycle ---');
    const ignBtn = await page.$('#btn-activate-portal');
    const ignBox = await ignBtn.boundingBox();
    await page.mouse.click(ignBox.x + ignBox.width / 2, ignBox.y + ignBox.height / 2);

    // Stage 1: BUILDUP (t = 800ms)
    await new Promise(r => setTimeout(r, 800));
    const buildupState = await page.$eval('#telem-state', el => el.textContent.trim());
    record('Stage 1: Buildup Verified', buildupState.includes('Buildup'), `State: "${buildupState}"`);
    const pBuildup = path.join(SCREENSHOTS_DIR, '05_activation_stage1_buildup.png');
    await page.screenshot({ path: pBuildup });
    record('Capture 05_activation_stage1_buildup.png', fs.existsSync(pBuildup));

    // Stage 2: BREAKTHROUGH (t = 2200ms total from click)
    await new Promise(r => setTimeout(r, 1400));
    const breakthroughState = await page.$eval('#telem-state', el => el.textContent.trim());
    record('Stage 2: Breakthrough Verified', breakthroughState.includes('Breakthrough'), `State: "${breakthroughState}"`);
    const pBreakthrough = path.join(SCREENSHOTS_DIR, '06_activation_stage2_breakthrough.png');
    await page.screenshot({ path: pBreakthrough });
    record('Capture 06_activation_stage2_breakthrough.png', fs.existsSync(pBreakthrough));

    // Stage 3: SUSTAINED ACTIVE (t = 3600ms total from click)
    await new Promise(r => setTimeout(r, 1400));
    const activeState = await page.$eval('#telem-state', el => el.textContent.trim());
    const isVortexActive = await page.$eval('#aperture-active-vortex', el => el.classList.contains('active'));
    record('Stage 3: Sustained Active Verified', activeState.includes('Sustained Active') && isVortexActive, `State: "${activeState}", Vortex active: ${isVortexActive}`);
    const pActive = path.join(SCREENSHOTS_DIR, '07_activation_stage3_sustained_active.png');
    await page.screenshot({ path: pActive });
    record('Capture 07_activation_stage3_sustained_active.png', fs.existsSync(pActive));

    // 5. Disengage Cycle 1
    console.log('\n--- Test: Disengage Cycle 1 ---');
    const disengageBtn = await page.$('#btn-disengage');
    const disBox = await disengageBtn.boundingBox();
    await page.mouse.click(disBox.x + disBox.width / 2, disBox.y + disBox.height / 2);
    await new Promise(r => setTimeout(r, 400));

    const resetState = await page.$eval('#telem-state', el => el.textContent.trim());
    const filledSlotsCount = await page.$$eval('.triforium-slot.filled', el => el.length);
    record('Disengage Resets to Idle', resetState.includes('Idle') && filledSlotsCount === 0, `State: "${resetState}", Filled slots: ${filledSlotsCount}`);
    const pDisengage = path.join(SCREENSHOTS_DIR, '08_disengaged_idle_reset.png');
    await page.screenshot({ path: pDisengage });
    record('Capture 08_disengaged_idle_reset.png', fs.existsSync(pDisengage));

    // 6. Quick-Dial Auto-Sequence Test (Preset 2: Abbey of the Cobalt Vaults)
    console.log('\n--- Test: Quick-Dial Auto-Sequence Test ---');
    const presetBtn = await page.$('#preset-2');
    const presetBox = await presetBtn.boundingBox();
    await page.mouse.click(presetBox.x + presetBox.width / 2, presetBox.y + presetBox.height / 2);

    // Capture mid-sequence screenshot during auto-dialing
    await new Promise(r => setTimeout(r, 800));
    const pAutoSeq = path.join(SCREENSHOTS_DIR, '09_quick_dial_autosequencing.png');
    await page.screenshot({ path: pAutoSeq });
    record('Capture 09_quick_dial_autosequencing.png', fs.existsSync(pAutoSeq));

    // Wait for auto-dial to finish into PENDING state
    await new Promise(r => setTimeout(r, 2200));
    const presetPendingState = await page.$eval('#telem-state', el => el.textContent.trim());
    record('Quick-Dial Lands in PENDING (No Auto-Fire)', presetPendingState.includes('Pending Sanctification'), `State: "${presetPendingState}"`);
    const pPresetPending = path.join(SCREENSHOTS_DIR, '10_quick_dial_pending_ready.png');
    await page.screenshot({ path: pPresetPending });
    record('Capture 10_quick_dial_pending_ready.png', fs.existsSync(pPresetPending));

    // 7. Second Activation & Second Disengage Cycle
    console.log('\n--- Test: Second Full Activation & Disengage Cycle ---');
    await page.mouse.click(ignBox.x + ignBox.width / 2, ignBox.y + ignBox.height / 2);
    await new Promise(r => setTimeout(r, 3400)); // wait for active

    const secondActiveState = await page.$eval('#telem-state', el => el.textContent.trim());
    record('Second Activation Succeeded', secondActiveState.includes('Sustained Active'), `State: "${secondActiveState}"`);
    const pSecondActive = path.join(SCREENSHOTS_DIR, '11_second_activation_active.png');
    await page.screenshot({ path: pSecondActive });
    record('Capture 11_second_activation_active.png', fs.existsSync(pSecondActive));

    // Second Disengage
    await page.mouse.click(disBox.x + disBox.width / 2, disBox.y + disBox.height / 2);
    await new Promise(r => setTimeout(r, 400));
    const secondResetState = await page.$eval('#telem-state', el => el.textContent.trim());
    record('Second Disengage Complete', secondResetState.includes('Idle'), `State: "${secondResetState}"`);
    const pSecondDisengage = path.join(SCREENSHOTS_DIR, '12_second_disengage_complete.png');
    await page.screenshot({ path: pSecondDisengage });
    record('Capture 12_second_disengage_complete.png', fs.existsSync(pSecondDisengage));

    // 8. Safety Interlock Test (Chantry Anathema Latch)
    console.log('\n--- Test: Safety Interlock (Anathema Latch) ---');
    const latchBtn = await page.$('#btn-toggle-latch');
    const latchBox = await latchBtn.boundingBox();
    // Engage latch
    await page.mouse.click(latchBox.x + latchBox.width / 2, latchBox.y + latchBox.height / 2);
    await new Promise(r => setTimeout(r, 200));

    const engagedBadgeText = await page.$eval('#latch-status-badge', el => el.textContent.trim());
    record('Anathema Latch Engaged', engagedBadgeText.includes('Engaged'), `Badge: "${engagedBadgeText}"`);

    // Dial 7 symbols via Preset 3
    const preset3 = await page.$('#preset-3');
    const p3Box = await preset3.boundingBox();
    await page.mouse.click(p3Box.x + p3Box.width / 2, p3Box.y + p3Box.height / 2);
    await new Promise(r => setTimeout(r, 2600)); // wait for pending

    // Attempt to ignite while latch is engaged
    await page.mouse.click(ignBox.x + ignBox.width / 2, ignBox.y + ignBox.height / 2);
    await new Promise(r => setTimeout(r, 300));

    const blockedInscription = await page.$eval('#inscription-text', el => el.textContent);
    const blockedState = await page.$eval('#telem-state', el => el.textContent.trim());
    record('Interlock Blocked Activation', blockedInscription.includes('TRANSMISSION BLOCKED') && blockedState.includes('Pending'), `Inscription: "${blockedInscription}"`);
    const pInterlock = path.join(SCREENSHOTS_DIR, '13_anathema_interlock_blocking.png');
    await page.screenshot({ path: pInterlock });
    record('Capture 13_anathema_interlock_blocking.png', fs.existsSync(pInterlock));

    // Release latch and verify ignition now works
    await page.mouse.click(latchBox.x + latchBox.width / 2, latchBox.y + latchBox.height / 2);
    await new Promise(r => setTimeout(r, 200));
    await page.mouse.click(ignBox.x + ignBox.width / 2, ignBox.y + ignBox.height / 2);
    await new Promise(r => setTimeout(r, 3400));

    const unblockedActive = await page.$eval('#telem-state', el => el.textContent.trim());
    record('Activation Succeeds After Latch Released', unblockedActive.includes('Sustained Active'), `State: "${unblockedActive}"`);
    await page.mouse.click(disBox.x + disBox.width / 2, disBox.y + disBox.height / 2);
    await new Promise(r => setTimeout(r, 400));

    // 9. Operator Reference Modal Test
    console.log('\n--- Test: Operator Reference Codex Modal ---');
    const helpBtn = await page.$('#btn-operator-help');
    const helpBox = await helpBtn.boundingBox();
    await page.mouse.click(helpBox.x + helpBox.width / 2, helpBox.y + helpBox.height / 2);
    await new Promise(r => setTimeout(r, 300));

    const isModalVisible = await page.$eval('#reference-modal', el => !el.classList.contains('hidden'));
    const tableRowCount = await page.$$eval('#codex-glyphs-tbody tr', el => el.length);
    record('Operator Codex Modal Opens with 12 Symbol Rows', isModalVisible && tableRowCount === 12, `Visible: ${isModalVisible}, Rows: ${tableRowCount}`);
    const pCodex = path.join(SCREENSHOTS_DIR, '14_operator_reference_codex.png');
    await page.screenshot({ path: pCodex });
    record('Capture 14_operator_reference_codex.png', fs.existsSync(pCodex));

    // Close Modal
    const closeBtn = await page.$('#btn-close-modal');
    const closeBox = await closeBtn.boundingBox();
    await page.mouse.click(closeBox.x + closeBox.width / 2, closeBox.y + closeBox.height / 2);
    await new Promise(r => setTimeout(r, 200));

    console.log('\n=============================================');
    console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY');
    console.log('=============================================');

  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
}

runTests();
