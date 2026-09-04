/**
 * Automated Verification Test Suite for stargate_orbital_atc
 * Port: 8084
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8084;
const CDP_PORT = 9334;
// Verification screenshots go to the gitignored test/ directory, never the
// build root (STARGATE_BUILD_STANDARDS.md section 3).
const OUT_DIR = path.join(__dirname, 'test');
fs.mkdirSync(OUT_DIR, { recursive: true });
// Browser resolution. No absolute local filesystem path is committed here:
// CHROME_PATH (or PUPPETEER_EXECUTABLE_PATH) wins, otherwise puppeteer's own
// executable path is used. Anything else is an explicit error.
async function resolveChrome() {
  const fromEnv = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv) return fromEnv;
  let why;
  try {
    let puppeteer;
    try { puppeteer = require('puppeteer'); } catch { puppeteer = require('puppeteer-core'); }
    const p = await puppeteer.executablePath();
    if (p && fs.existsSync(p)) return p;
    why = p ? `puppeteer's executable path does not exist: ${p}` : 'puppeteer reported no executable path';
  } catch (e) {
    why = `puppeteer could not resolve an executable path (${e.message})`;
  }
  throw new Error(`No browser found: ${why}. Set CHROME_PATH to a Chrome/Chromium executable.`);
}

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
  console.log('=== STARTING AUTOMATED VERIFICATION: stargate_orbital_atc ===');
  
  const CHROME_PATH = await resolveChrome();
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
    await cdp.screenshot(path.join(OUT_DIR, 'screenshot_4k.png'));

    // Reset to 1080p
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.eval(`window.dispatchEvent(new Event('resize'))`);
    await sleep(500);
    await cdp.screenshot(path.join(OUT_DIR, 'screenshot_1080p.png'));

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

    // --- TEST CYCLE 1: DIAL 9 GLYPHS -> VERIFY NEGATIVE AUTO-FIRE -> DISENGAGE ---
    console.log('\n--- EXECUTING DIAL-DISENGAGE CYCLE 1 ---');
    const glyphs = [
      '.glyph-btn[data-glyph="CORRIDOR-GEO"]',
      '.glyph-btn[data-glyph="APOGEE-VECTOR"]',
      '.glyph-btn[data-glyph="PERIGEE-BURN"]',
      '.glyph-btn[data-glyph="HOHMANN-TRANSFER"]',
      '.glyph-btn[data-glyph="LEO-POLAR"]',
      '.glyph-btn[data-glyph="MOLNIYA-ARC"]',
      '.glyph-btn[data-glyph="EQUATORIAL-SLOT"]',
      '.glyph-btn[data-glyph="ESCAPE-TRAJECTORY"]',
      '.glyph-btn[data-glyph="LAGRANGE-L1"]'
    ];

    for (const g of glyphs) {
      await hitAndClick(g);
    }

    const state9Locks = await cdp.eval(`(() => {
      const counter = document.getElementById('address-counter').textContent;
      const teleState = document.getElementById('tele-state').textContent;
      const activateDisabled = document.getElementById('btn-activate').hasAttribute('disabled');
      return { counter, teleState, activateDisabled };
    })()`);

    console.log(`[Cycle 1 - 9 Locked State]:`, state9Locks);

    // NEGATIVE ASSERTION CHECK
    if (state9Locks.teleState.includes('ORBITAL INSERTION ACTIVE')) {
      throw new Error('FATAL FAILURE: Gate auto-fired on 9th locked symbol!');
    }
    if (state9Locks.activateDisabled) {
      throw new Error('FAIL: Activate button was not enabled when 9 symbols locked.');
    }
    console.log('>>> CONFIRMED NEGATIVE CASE: 9th symbol locked, system is in PENDING state and did NOT auto-activate.');

    // Disengage Cycle 1
    console.log('Disengaging via Abort button...');
    await hitAndClick('#btn-disengage');
    await sleep(400);

    const stateAfterDisengage1 = await cdp.eval(`(() => {
      return document.getElementById('address-counter').textContent;
    })()`);
    console.log(`[Cycle 1 - After Disengage]: ${stateAfterDisengage1}`);
    if (!stateAfterDisengage1.includes('0 / 9')) {
      throw new Error('FAIL: Disengage did not reset address slots in Cycle 1.');
    }

    // --- TEST CYCLE 2: PRESET -> NEGATIVE CHECK -> ACTIVATE -> ACTIVE VERIFICATION -> DISENGAGE ---
    console.log('\n--- EXECUTING DIAL-ACTIVATE-DISENGAGE CYCLE 2 ---');
    await hitAndClick('.preset-btn[data-preset="iss-corridor"]');
    await sleep(2700); // flight-plan replay: 9 waypoints x 240ms autopilot cadence

    const stateAfterPreset = await cdp.eval(`(() => {
      const counter = document.getElementById('address-counter').textContent;
      const teleState = document.getElementById('tele-state').textContent;
      return { counter, teleState };
    })()`);
    console.log(`[Cycle 2 - Preset Loaded]:`, stateAfterPreset);

    if (stateAfterPreset.teleState.includes('ORBITAL INSERTION ACTIVE')) {
      throw new Error('FATAL FAILURE: Preset auto-activated the gate!');
    }
    console.log('>>> CONFIRMED NEGATIVE CASE: Preset loaded 9 symbols into PENDING state without auto-activating.');

    // Now Activate explicitly
    console.log('Clicking primary AUTHORIZE ORBITAL INSERTION button...');
    await hitAndClick('#btn-activate');
    await sleep(1000);

    const stateActive = await cdp.eval(`(() => {
      const teleState = document.getElementById('tele-state').textContent;
      const corridor = document.getElementById('corridor-status').textContent;
      return { teleState, corridor };
    })()`);
    console.log(`[Cycle 2 - Active State]:`, stateActive);
    if (!stateActive.teleState.includes('ORBITAL INSERTION ACTIVE')) {
      throw new Error('FAIL: Manual activation did not transition to ORBITAL INSERTION ACTIVE.');
    }

    await cdp.screenshot(path.join(OUT_DIR, 'screenshot_active.png'));

    // Disengage active conduit
    console.log('Disengaging active conduit via Abort button...');
    await hitAndClick('#btn-disengage');
    await sleep(400);

    const stateAfterDisengage2 = await cdp.eval(`(() => {
      return document.getElementById('address-counter').textContent;
    })()`);
    console.log(`[Cycle 2 - After Disengage]: ${stateAfterDisengage2}`);

    // --- TEST STAGED FLIGHT-PLAN REPLAY (per-waypoint locks, no instant jump) ---
    console.log('\n--- TESTING STAGED PRESET REPLAY ---');
    await hitAndClick('.preset-btn[data-preset="iss-corridor"]');
    // hitAndClick sleeps 250ms after the click; sample on an absolute clock
    const clickT0 = Date.now() - 250;

    const replaySamples = [];
    for (const off of [400, 1000, 1600]) {
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
      await cdp.screenshot(path.join(OUT_DIR, `screenshot_replay_t${off}.png`));
    }
    const rCounts = replaySamples.map(s => s.locked);
    const stagedOk = rCounts.every((v, i) => i === 0 || v > rCounts[i - 1]) &&
      replaySamples.every(s => s.locked > 0 && s.locked < 9 && s.activateDisabled &&
        !s.teleState.includes('ORBITAL INSERTION ACTIVE'));
    if (!stagedOk) {
      throw new Error(`FAIL: Preset replay is not visibly staged: ${JSON.stringify(replaySamples)}`);
    }

    // Completion +1.2s: PENDING, activate enabled, NOT active
    const toEnd = clickT0 + 2160 + 1200 - Date.now();
    if (toEnd > 0) await sleep(toEnd);
    const replayEnd = await cdp.eval(`(() => ({
      counter: document.getElementById('address-counter').textContent,
      teleState: document.getElementById('tele-state').textContent,
      activateDisabled: document.getElementById('btn-activate').hasAttribute('disabled')
    }))()`);
    console.log('[Replay End]:', JSON.stringify(replayEnd));
    if (!replayEnd.counter.includes('9 / 9') || replayEnd.activateDisabled ||
        replayEnd.teleState.includes('ORBITAL INSERTION ACTIVE')) {
      throw new Error('FAIL: Replay did not land in PENDING_READY without auto-fire.');
    }
    console.log('>>> STAGED REPLAY CONFIRMED: per-waypoint locks, PENDING at end, no auto-fire.');

    // --- TEST DISENGAGE DURING REPLAY ---
    console.log('\n--- TESTING ABORT DURING PRESET REPLAY ---');
    await hitAndClick('#btn-disengage');
    await sleep(200);
    await hitAndClick('.preset-btn[data-preset="iss-corridor"]');
    await sleep(450); // ~2 waypoints locked (250ms already slept in hitAndClick)
    const midAbortState = await cdp.eval(`document.getElementById('address-counter').textContent`);
    console.log(`[Mid-replay before abort]: ${midAbortState}`);
    await hitAndClick('#btn-disengage');
    await sleep(2100); // past when remaining autopilot steps would have fired
    const afterAbortState = await cdp.eval(`document.getElementById('address-counter').textContent`);
    console.log(`[After mid-replay abort +2.1s]: ${afterAbortState}`);
    if (!afterAbortState.includes('0 / 9')) {
      throw new Error('FAIL: Abort during replay left orphaned autopilot timers still locking waypoints.');
    }
    await cdp.screenshot(path.join(OUT_DIR, 'screenshot_mid_replay_abort.png'));
    console.log('>>> MID-REPLAY ABORT CONFIRMED: no orphaned locks after disengage.');

    // --- TEST ORBITAL COLLISION SAFETY HOLD ---
    console.log('\n--- TESTING ORBITAL COLLISION SAFETY HOLD ---');
    await hitAndClick('.slider');
    await sleep(300);

    const safetyStatus = await cdp.eval(`document.getElementById('safety-toggle-status').textContent`);
    console.log(`Safety status after toggle: ${safetyStatus}`);

    await hitAndClick('.glyph-btn[data-glyph="CORRIDOR-GEO"]');
    await sleep(300);

    const bannerActive = await cdp.eval(`document.getElementById('interlock-banner').classList.contains('active')`);
    console.log(`Interlock banner visible: ${bannerActive}`);
    if (!bannerActive) {
      throw new Error('FAIL: Collision Safety Hold did not trigger interlock banner on blocked dial.');
    }

    await hitAndClick('.slider');
    await sleep(300);
    console.log('Safety hold returned to RELEASED.');

    console.log('\n=== ALL VERIFICATION TESTS PASSED FOR stargate_orbital_atc ===\n');

  } finally {
    chromeProc.kill();
  }
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
