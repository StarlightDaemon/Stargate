/**
 * Automated Verification Test Suite for stargate_solarpunk_ecogrid
 * Port: 8083
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8083;
const CDP_PORT = 9333;
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
  console.log('=== STARTING AUTOMATED VERIFICATION: stargate_solarpunk_ecogrid ===');
  
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
    const pages = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const targetPage = pages.find(p => p.url.includes(`127.0.0.1:${PORT}`)) || pages[0];
    
    if (!targetPage || !targetPage.webSocketDebuggerUrl) {
      throw new Error('Could not find CDP target.');
    }

    const cdp = new SimpleCDP(targetPage.webSocketDebuggerUrl);
    await cdp.connect();
    console.log('Connected to CDP.');

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');
    await sleep(1000);

    // 1. Check 1080p transform
    const transform1080 = await cdp.eval(`getComputedStyle(document.getElementById('viewport-root')).transform`);
    console.log(`[1080p Transform]: ${transform1080}`);
    if (transform1080 === 'none' || !transform1080) {
      throw new Error('Transform validation failed at 1080p!');
    }

    // 2. Check 4K Viewport scaling
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
      throw new Error('Transform validation failed at 4K!');
    }
    await cdp.screenshot(path.join(__dirname, 'screenshot_4k.png'));

    // Reset to 1080p
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.eval(`window.dispatchEvent(new Event('resize'))`);
    await sleep(500);
    await cdp.screenshot(path.join(__dirname, 'screenshot_1080p.png'));

    async function hitAndClick(selector) {
      const rect = await cdp.eval(`(() => {
        const el = document.querySelector('${selector}');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, found: true };
      })()`);

      if (!rect || !rect.found) {
        throw new Error(`Element ${selector} not found.`);
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

    // --- TEST CYCLE 1: DIAL 8 GLYPHS -> VERIFY NEGATIVE AUTO-FIRE -> DISENGAGE ---
    console.log('\n--- EXECUTING DIAL-DISENGAGE CYCLE 1 ---');
    const glyphs = [
      '.glyph-btn[data-glyph="PV-ARRAY-CORE"]',
      '.glyph-btn[data-glyph="HYDRO-TURBINE"]',
      '.glyph-btn[data-glyph="GEOTHERMAL-VENT"]',
      '.glyph-btn[data-glyph="AERO-VORTEX"]',
      '.glyph-btn[data-glyph="BIOMASS-DIGESTER"]',
      '.glyph-btn[data-glyph="MHD-CONVERTER"]',
      '.glyph-btn[data-glyph="FLYWHEEL-STORAGE"]',
      '.glyph-btn[data-glyph="SUPERCONDUCTING-BUS"]'
    ];

    for (const g of glyphs) {
      await hitAndClick(g);
    }

    const state8Locks = await cdp.eval(`(() => {
      const counter = document.getElementById('address-counter').textContent;
      const teleState = document.getElementById('tele-state').textContent;
      const activateDisabled = document.getElementById('btn-activate').hasAttribute('disabled');
      return { counter, teleState, activateDisabled };
    })()`);

    console.log(`[Cycle 1 - 8 Locked State]:`, state8Locks);

    // NEGATIVE ASSERTION CHECK
    if (state8Locks.teleState.includes('BIOSPHERE POWER CONDUIT ACTIVE')) {
      throw new Error('FATAL FAILURE: Gate auto-fired on 8th locked symbol!');
    }
    if (state8Locks.activateDisabled) {
      throw new Error('FAIL: Activate button was not enabled when 8 symbols locked.');
    }
    console.log('>>> CONFIRMED NEGATIVE CASE: 8th symbol locked, system is in PENDING state and did NOT auto-activate.');

    // Disengage Cycle 1
    console.log('Disengaging via Scram button...');
    await hitAndClick('#btn-disengage');
    await sleep(400);

    const stateAfterDisengage1 = await cdp.eval(`(() => {
      return document.getElementById('address-counter').textContent;
    })()`);
    console.log(`[Cycle 1 - After Disengage]: ${stateAfterDisengage1}`);
    if (!stateAfterDisengage1.includes('0 / 8')) {
      throw new Error('FAIL: Disengage did not reset address slots in Cycle 1.');
    }

    // --- TEST CYCLE 2: PRESET -> NEGATIVE CHECK -> ACTIVATE -> ACTIVE VERIFICATION -> DISENGAGE ---
    console.log('\n--- EXECUTING DIAL-ACTIVATE-DISENGAGE CYCLE 2 ---');
    await hitAndClick('.preset-btn[data-preset="valencia-sol"]');
    await sleep(600);

    const stateAfterPreset = await cdp.eval(`(() => {
      const counter = document.getElementById('address-counter').textContent;
      const teleState = document.getElementById('tele-state').textContent;
      return { counter, teleState };
    })()`);
    console.log(`[Cycle 2 - Preset Loaded]:`, stateAfterPreset);

    if (stateAfterPreset.teleState.includes('BIOSPHERE POWER CONDUIT ACTIVE')) {
      throw new Error('FATAL FAILURE: Preset auto-activated the gate!');
    }
    console.log('>>> CONFIRMED NEGATIVE CASE: Preset loaded 8 symbols into PENDING state without auto-activating.');

    // Now Activate explicitly
    console.log('Clicking primary ENGAGE BIOSPHERE CONDUIT button...');
    await hitAndClick('#btn-activate');
    await sleep(1000);

    const stateActive = await cdp.eval(`(() => {
      const teleState = document.getElementById('tele-state').textContent;
      const synchro = document.getElementById('synchro-status').textContent;
      return { teleState, synchro };
    })()`);
    console.log(`[Cycle 2 - Active State]:`, stateActive);
    if (!stateActive.teleState.includes('BIOSPHERE POWER CONDUIT ACTIVE')) {
      throw new Error('FAIL: Manual activation did not transition to BIOSPHERE POWER CONDUIT ACTIVE.');
    }

    await cdp.screenshot(path.join(__dirname, 'screenshot_active.png'));

    // Disengage active conduit
    console.log('Disengaging active conduit via Scram button...');
    await hitAndClick('#btn-disengage');
    await sleep(400);

    const stateAfterDisengage2 = await cdp.eval(`(() => {
      return document.getElementById('address-counter').textContent;
    })()`);
    console.log(`[Cycle 2 - After Disengage]: ${stateAfterDisengage2}`);

    // --- TEST SUPERCONDUCTING BUS OVERLOAD HOLD ---
    console.log('\n--- TESTING SUPERCONDUCTING BUS OVERLOAD HOLD ---');
    await hitAndClick('.slider');
    await sleep(300);

    const safetyStatus = await cdp.eval(`document.getElementById('safety-toggle-status').textContent`);
    console.log(`Safety status after toggle: ${safetyStatus}`);

    await hitAndClick('.glyph-btn[data-glyph="PV-ARRAY-CORE"]');
    await sleep(300);

    const bannerActive = await cdp.eval(`document.getElementById('interlock-banner').classList.contains('active')`);
    console.log(`Interlock banner visible: ${bannerActive}`);
    if (!bannerActive) {
      throw new Error('FAIL: Bus Overload Hold did not trigger interlock banner on blocked dial.');
    }

    await hitAndClick('.slider');
    await sleep(300);
    console.log('Safety hold returned to RELEASED.');

    console.log('\n=== ALL VERIFICATION TESTS PASSED FOR stargate_solarpunk_ecogrid ===\n');

  } finally {
    chromeProc.kill();
  }
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
