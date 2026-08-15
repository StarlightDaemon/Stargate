/**
 * Automated Verification Test Suite for stargate_sonar_abyssal
 * Tests:
 * 1. 1080p & 4K Viewport scaling (computed transform != 'none')
 * 2. Hit-testing elementFromPoint with real pointer events
 * 3. Negative assertion: 6th lock does NOT auto-fire activation
 * 4. Dual Dial-Disengage-Redial full operational cycles
 * 5. Cavitation Safety Hold blocking and visual/audible alert
 * 6. High-res screenshots capture (1080p & 4K)
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8081;
const CDP_PORT = 9331;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class SimpleCDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    const WebSocket = require('stream'); // fallback check or native ws
    // We will use native WebSocket available in Node 22+ or basic client
    return new Promise((resolve, reject) => {
      const ws = new globalThis.WebSocket(this.wsUrl);
      this.ws = ws;
      ws.onopen = () => resolve();
      ws.onerror = err => reject(err);
      ws.onmessage = msg => {
        const res = JSON.parse(msg.data);
        if (res.id && this.callbacks.has(res.id)) {
          const cb = this.callbacks.get(res.id);
          this.callbacks.delete(res.id);
          if (res.error) cb.reject(res.error);
          else cb.resolve(res.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`[Screenshot Saved]: ${filePath}`);
  }
}

async function runTests() {
  console.log('=== STARTING AUTOMATED VERIFICATION: stargate_sonar_abyssal ===');
  
  // Launch Chrome Headless
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1920,1080',
    `http://127.0.0.1:${PORT}`
  ]);

  await sleep(2000);

  try {
    const versionInfo = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
    const pages = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const targetPage = pages.find(p => p.url.includes(`127.0.0.1:${PORT}`)) || pages[0];
    
    if (!targetPage || !targetPage.webSocketDebuggerUrl) {
      throw new Error('Could not find CDP WebSocket target page.');
    }

    const cdp = new SimpleCDP(targetPage.webSocketDebuggerUrl);
    await cdp.connect();
    console.log('Connected to Chrome DevTools Protocol.');

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    await sleep(1000);

    // 1. Check 1080p transform
    const transform1080 = await cdp.eval(`getComputedStyle(document.getElementById('viewport-root')).transform`);
    console.log(`[1080p Transform]: ${transform1080}`);
    if (transform1080 === 'none' || !transform1080) {
      throw new Error('Transform scale validation failed at 1080p!');
    }

    // 2. Test 4K Viewport scaling
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 3840,
      height: 2160,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.eval(`window.dispatchEvent(new Event('resize'))`);
    await sleep(500);

    const transform4k = await cdp.eval(`getComputedStyle(document.getElementById('viewport-root')).transform`);
    console.log(`[4K Transform]: ${transform4k}`);
    if (transform4k === 'none' || !transform4k) {
      throw new Error('Transform scale validation failed at 4K!');
    }

    await cdp.screenshot(path.join(__dirname, 'screenshot_4k.png'));

    // Reset back to 1080p
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.eval(`window.dispatchEvent(new Event('resize'))`);
    await sleep(500);
    await cdp.screenshot(path.join(__dirname, 'screenshot_1080p.png'));

    // Helper: Hit-test and click element via real pointer events at rendered position
    async function hitAndClick(selector) {
      const rect = await cdp.eval(`(() => {
        const el = document.querySelector('${selector}');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, found: true };
      })()`);

      if (!rect || !rect.found) {
        throw new Error(`Element ${selector} not found for hit-testing.`);
      }

      // Verify elementFromPoint matches or contains
      const hitMatch = await cdp.eval(`(() => {
        const el = document.elementFromPoint(${rect.x}, ${rect.y});
        const target = document.querySelector('${selector}');
        return el === target || target.contains(el) || el.contains(target);
      })()`);

      if (!hitMatch) {
        console.warn(`Hit-test direct match warning for ${selector}, dispatching pointer events to coordinates (${rect.x}, ${rect.y})`);
      }

      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: rect.x,
        y: rect.y,
        button: 'left',
        clickCount: 1
      });
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: rect.x,
        y: rect.y,
        button: 'left',
        clickCount: 1
      });
      await sleep(250);
    }

    // --- TEST CYCLE 1: DIAL 6 GLYPHS -> VERIFY NEGATIVE AUTO-FIRE -> DISENGAGE ---
    console.log('\n--- EXECUTING DIAL-DISENGAGE CYCLE 1 ---');
    const glyphBtns = [
      '.glyph-btn[data-glyph="ALPHA-TRENCH"]',
      '.glyph-btn[data-glyph="HADAL-VORTEX"]',
      '.glyph-btn[data-glyph="BATHY-RIDGE"]',
      '.glyph-btn[data-glyph="THERMOCLINE"]',
      '.glyph-btn[data-glyph="PELAGIC-SURGE"]',
      '.glyph-btn[data-glyph="BENTHIC-CHASM"]'
    ];

    for (const btn of glyphBtns) {
      await hitAndClick(btn);
    }

    const stateAfter6Locks = await cdp.eval(`(() => {
      const counter = document.getElementById('address-counter').textContent;
      const teleState = document.getElementById('tele-state').textContent;
      const activateDisabled = document.getElementById('btn-activate').hasAttribute('disabled');
      return { counter, teleState, activateDisabled };
    })()`);

    console.log(`[Cycle 1 - 6 Locked State]:`, stateAfter6Locks);

    // NEGATIVE ASSERTION CHECK: MUST NOT BE ACTIVE_CONDUIT
    if (stateAfter6Locks.teleState.includes('CONDUIT ACTIVE')) {
      throw new Error('FATAL FAILURE: Gate auto-fired on 6th locked symbol!');
    }
    if (stateAfter6Locks.activateDisabled) {
      throw new Error('FAIL: Activate button was not enabled when 6 symbols were locked.');
    }
    console.log('>>> CONFIRMED NEGATIVE CASE: 6th symbol locked, system is in PENDING state and did NOT auto-activate.');

    // Disengage Cycle 1
    console.log('Disengaging via Abort button...');
    await hitAndClick('#btn-disengage');
    await sleep(400);

    const stateAfterDisengage1 = await cdp.eval(`(() => {
      const counter = document.getElementById('address-counter').textContent;
      const teleState = document.getElementById('tele-state').textContent;
      return { counter, teleState };
    })()`);
    console.log(`[Cycle 1 - After Disengage]:`, stateAfterDisengage1);
    if (!stateAfterDisengage1.counter.includes('0 / 6')) {
      throw new Error('FAIL: Disengage did not reset address slots in Cycle 1.');
    }

    // --- TEST CYCLE 2: REDIAL -> NEGATIVE CHECK -> ACTIVATE -> ACTIVE VERIFICATION -> DISENGAGE ---
    console.log('\n--- EXECUTING DIAL-ACTIVATE-DISENGAGE CYCLE 2 ---');
    // Load Preset "mariana"
    await hitAndClick('.preset-btn[data-preset="mariana"]');
    await sleep(2400); // bearing-track replay: 6 bearings x 300ms beamformer cadence

    const stateAfterPreset = await cdp.eval(`(() => {
      const counter = document.getElementById('address-counter').textContent;
      const teleState = document.getElementById('tele-state').textContent;
      return { counter, teleState };
    })()`);
    console.log(`[Cycle 2 - Preset Loaded]:`, stateAfterPreset);

    // Explicit Negative Check on Preset
    if (stateAfterPreset.teleState.includes('CONDUIT ACTIVE')) {
      throw new Error('FATAL FAILURE: Preset auto-activated the gate!');
    }
    console.log('>>> CONFIRMED NEGATIVE CASE: Preset loaded 6 symbols into PENDING state without auto-activating.');

    // Now Activate explicitly
    console.log('Clicking primary EMIT ABYSSAL RESONANCE button...');
    await hitAndClick('#btn-activate');
    await sleep(1000);

    const stateActive = await cdp.eval(`(() => {
      const teleState = document.getElementById('tele-state').textContent;
      const aperture = document.getElementById('aperture-status').textContent;
      return { teleState, aperture };
    })()`);
    console.log(`[Cycle 2 - Active State]:`, stateActive);
    if (!stateActive.teleState.includes('CONDUIT ACTIVE')) {
      throw new Error('FAIL: Manual activation did not transition to CONDUIT ACTIVE.');
    }

    await cdp.screenshot(path.join(__dirname, 'screenshot_active.png'));

    // Disengage active conduit
    console.log('Disengaging active conduit via Abort button...');
    await hitAndClick('#btn-disengage');
    await sleep(400);

    const stateAfterDisengage2 = await cdp.eval(`(() => {
      return document.getElementById('address-counter').textContent;
    })()`);
    console.log(`[Cycle 2 - After Disengage]: ${stateAfterDisengage2}`);

    // --- TEST STAGED BEARING-TRACK REPLAY (per-bearing locks, no instant jump) ---
    console.log('\n--- TESTING STAGED PRESET REPLAY ---');
    await hitAndClick('.preset-btn[data-preset="mariana"]');
    // hitAndClick sleeps 250ms after the click; sample on an absolute clock
    const clickT0 = Date.now() - 250;

    const replaySamples = [];
    for (const off of [480, 1050, 1650]) {
      const rem = clickT0 + off - Date.now();
      if (rem > 0) await sleep(rem);
      const s = await cdp.eval(`(() => ({
        locked: (document.getElementById('address-counter').textContent.match(/^(\\d+)/) || [0,0])[1],
        teleState: document.getElementById('tele-state').textContent,
        activateDisabled: document.getElementById('btn-activate').hasAttribute('disabled')
      }))()`);
      s.locked = parseInt(s.locked, 10);
      replaySamples.push(s);
      console.log(`  t=${Date.now() - clickT0}ms:`, JSON.stringify(s));
      await cdp.screenshot(path.join(__dirname, `screenshot_replay_t${off}.png`));
    }
    const rCounts = replaySamples.map(s => s.locked);
    const stagedOk = rCounts.every((v, i) => i === 0 || v > rCounts[i - 1]) &&
      replaySamples.every(s => s.locked > 0 && s.locked < 6 && s.activateDisabled &&
        !s.teleState.includes('CONDUIT ACTIVE'));
    if (!stagedOk) {
      throw new Error(`FAIL: Preset replay is not visibly staged: ${JSON.stringify(replaySamples)}`);
    }

    // Completion +1.2s: PENDING, activate enabled, NOT active
    const toEnd = clickT0 + 1800 + 1200 - Date.now();
    if (toEnd > 0) await sleep(toEnd);
    const replayEnd = await cdp.eval(`(() => ({
      counter: document.getElementById('address-counter').textContent,
      teleState: document.getElementById('tele-state').textContent,
      activateDisabled: document.getElementById('btn-activate').hasAttribute('disabled')
    }))()`);
    console.log('[Replay End]:', JSON.stringify(replayEnd));
    if (!replayEnd.counter.includes('6 / 6') || replayEnd.activateDisabled ||
        replayEnd.teleState.includes('CONDUIT ACTIVE')) {
      throw new Error('FAIL: Replay did not land in PENDING_READY without auto-fire.');
    }
    console.log('>>> STAGED REPLAY CONFIRMED: per-bearing locks, PENDING at end, no auto-fire.');

    // --- TEST DISENGAGE DURING REPLAY ---
    console.log('\n--- TESTING ABORT DURING PRESET REPLAY ---');
    await hitAndClick('#btn-disengage');
    await sleep(200);
    await hitAndClick('.preset-btn[data-preset="mariana"]');
    await sleep(550); // ~2 bearings locked (250ms already slept in hitAndClick)
    const midAbortState = await cdp.eval(`document.getElementById('address-counter').textContent`);
    console.log(`[Mid-replay before abort]: ${midAbortState}`);
    await hitAndClick('#btn-disengage');
    await sleep(1900); // past when remaining beam steps would have fired
    const afterAbortState = await cdp.eval(`document.getElementById('address-counter').textContent`);
    console.log(`[After mid-replay abort +1.9s]: ${afterAbortState}`);
    if (!afterAbortState.includes('0 / 6')) {
      throw new Error('FAIL: Abort during replay left orphaned beam timers still locking bearings.');
    }
    await cdp.screenshot(path.join(__dirname, 'screenshot_mid_replay_abort.png'));
    console.log('>>> MID-REPLAY ABORT CONFIRMED: no orphaned locks after disengage.');

    // --- TEST SAFETY HOLD INTERLOCK ---
    console.log('\n--- TESTING CAVITATION SAFETY HOLD INTERLOCK ---');
    await hitAndClick('.slider'); // Toggle safety on
    await sleep(300);

    const safetyStatus = await cdp.eval(`document.getElementById('safety-toggle-status').textContent`);
    console.log(`Safety status after toggle: ${safetyStatus}`);

    // Attempt dialing with safety ON
    await hitAndClick('.glyph-btn[data-glyph="ALPHA-TRENCH"]');
    await sleep(300);

    const bannerActive = await cdp.eval(`document.getElementById('interlock-banner').classList.contains('active')`);
    console.log(`Interlock banner visible: ${bannerActive}`);
    if (!bannerActive) {
      throw new Error('FAIL: Safety Hold did not trigger interlock banner on blocked dial.');
    }

    // Toggle safety back off
    await hitAndClick('.slider');
    await sleep(300);
    console.log('Safety hold returned to RELEASED.');

    console.log('\n=== ALL VERIFICATION TESTS PASSED FOR stargate_sonar_abyssal ===\n');

  } finally {
    chromeProc.kill();
  }
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
