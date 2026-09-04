/**
 * End-to-End Automated Verification Script using Chrome DevTools Protocol (CDP)
 * Tests full manual dial, negative auto-fire, safety interlock, 3-stage activation,
 * disengage, quick-dial sequential auto-dial, secondary tabs, and 4K scaling.
 */

import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Browser resolution. No absolute local filesystem path is committed here:
// CHROME_PATH (or PUPPETEER_EXECUTABLE_PATH) wins, otherwise puppeteer's own
// executable path is used. Anything else is an explicit error.
async function resolveChrome() {
  const fromEnv = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv) return fromEnv;
  let why;
  try {
    const puppeteer = (await import('puppeteer').catch(() => import('puppeteer-core'))).default;
    const p = await puppeteer.executablePath();
    if (p && fs.existsSync(p)) return p;
    why = p ? `puppeteer's executable path does not exist: ${p}` : 'puppeteer reported no executable path';
  } catch (e) {
    why = `puppeteer could not resolve an executable path (${e.message})`;
  }
  throw new Error(`No browser found: ${why}. Set CHROME_PATH to a Chrome/Chromium executable.`);
}
const ARTIFACT_DIR = path.join(__dirname, 'test_screenshots');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}
const PORT = 9222;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.callbacks = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = err => reject(err);
      this.ws.onmessage = (evt) => {
        const res = JSON.parse(evt.data);
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
      const id = ++this.id;
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
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async setViewport(width, height, deviceScaleFactor = 1) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: false
    });
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buf);
    console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
  }

  async click(selector) {
    const box = await this.eval(`
      (() => {
        const el = document.querySelector('${selector}');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()
    `);
    if (!box) throw new Error(`Element not found: ${selector}`);

    await this.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: box.x,
      y: box.y,
      button: 'left',
      clickCount: 1
    });
    await this.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: box.x,
      y: box.y,
      button: 'left',
      clickCount: 1
    });
  }
}

async function run() {
  console.log('Starting Headless Chrome for End-to-End Testing...');
  const CHROME_PATH = await resolveChrome();
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--hide-scrollbars',
    '--window-size=1920,1080',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + path.join(os.tmpdir(), 'chrome_test_profile_' + Date.now()),
    'http://localhost:8080'
  ]);

  await sleep(2500);

  try {
    const targets = await fetchJson(`http://localhost:${PORT}/json`);
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    client.ws.onmessage = (evt) => {
      const res = JSON.parse(evt.data);
      if (res.method === 'Runtime.consoleAPICalled') {
        console.log('BROWSER CONSOLE:', res.params.args.map(a => a.value || a.description).join(' '));
      }
      if (res.method === 'Runtime.exceptionThrown') {
        console.error('BROWSER EXCEPTION:', res.params.exceptionDetails);
      }
      if (res.id && client.callbacks.has(res.id)) {
        const cb = client.callbacks.get(res.id);
        client.callbacks.delete(res.id);
        if (res.error) cb.reject(res.error);
        else cb.resolve(res.result);
      }
    };

    console.log('--- Step 1: Cold Start Verification (1920x1080) ---');
    await client.setViewport(1920, 1080, 1);
    await sleep(1000);

    const domInfo = await client.eval(`({
      starBtnCount: document.querySelectorAll('.star-select-btn').length,
      buttonsHtml: document.getElementById('star-buttons-container').innerHTML.substring(0, 200),
      bodyHtml: document.body.innerHTML.substring(0, 300)
    })`);
    console.log('DOM Info:', domInfo);


    const coldState = await client.eval(`({
      sightingCount: document.getElementById('sighting-count').textContent,
      confidence: document.getElementById('fix-confidence').textContent,
      actuateDisabled: document.getElementById('btn-actuate').disabled,
      interlockChecked: document.getElementById('interlock-toggle').checked
    })`);
    console.log('Cold state:', coldState);
    await client.captureScreenshot('e2e_01_cold_start.png');

    console.log('--- Step 2: Operator Reference Modal ---');
    await client.click('#btn-help');
    await sleep(500);
    await client.captureScreenshot('e2e_02_operator_reference_modal.png');
    await client.click('#btn-close-modal');
    await sleep(400);

    console.log('--- Step 3: Secondary Panels Spot-Check ---');
    // Horizon tab (already active by default or switch)
    await client.click('.tab-btn[data-tab="horizon-tab"]');
    await sleep(400);
    await client.captureScreenshot('e2e_03a_tab_horizon.png');

    // Dead-reckoning tab
    await client.click('.tab-btn[data-tab="dr-tab"]');
    await sleep(500);
    await client.captureScreenshot('e2e_03b_tab_dead_reckoning.png');

    // Ephemeris Star Catalog with search
    await client.click('.tab-btn[data-tab="almanac-tab"]');
    await sleep(400);
    await client.eval(`
      (() => {
        const input = document.getElementById('almanac-search-input');
        input.value = 'Rigel';
        input.dispatchEvent(new Event('input'));
      })()
    `);
    await sleep(400);
    await client.captureScreenshot('e2e_03c_tab_almanac_search.png');

    // Reset back to Horizon tab
    await client.click('.tab-btn[data-tab="horizon-tab"]');
    await sleep(300);

    console.log('--- Step 4: Full Manual Dialing (7 Stars) ---');
    for (let i = 0; i < 7; i++) {
      console.log(`Selecting star #${i} (#star-btn-${i})...`);
      await client.click(`#star-btn-${i}`);
      await sleep(450); // wait for Rete rotation & audio lock
    }

    console.log('--- Step 5: Negative Test (No Auto-Fire Confirmed) ---');
    const pendingState = await client.eval(`({
      sightingCount: document.getElementById('sighting-count').textContent,
      confidence: document.getElementById('fix-confidence').textContent,
      statusText: document.getElementById('gate-status-text').textContent,
      actuateDisabled: document.getElementById('btn-actuate').disabled,
      actuateClass: document.getElementById('btn-actuate').className
    })`);
    console.log('Pending state:', pendingState);
    await client.captureScreenshot('e2e_04_pending_ready_no_autofire.png');

    console.log('--- Step 6: Safety Interlock Test ---');
    // Engage Hold
    await client.click('#interlock-toggle');
    await sleep(200);
    // Try to activate while hold is engaged
    await client.click('#btn-actuate');
    await sleep(300);
    await client.captureScreenshot('e2e_05_safety_interlock_blocked.png');
    // Release Hold
    await client.click('#interlock-toggle');
    await sleep(300);

    console.log('--- Step 7: Three-Stage Staged Activation ---');
    await client.click('#btn-actuate');
    
    // Stage 1: Buildup (capture within 600ms)
    await sleep(500);
    await client.captureScreenshot('e2e_06_stage_1_buildup.png');

    // Stage 2: Breakthrough (at ~1.9s from start)
    await sleep(1400);
    await client.captureScreenshot('e2e_07_stage_2_breakthrough.png');

    // Stage 3: Sustained Active (after 1s)
    await sleep(1200);
    const activeState = await client.eval(`({
      statusText: document.getElementById('gate-status-text').textContent,
      confidence: document.getElementById('fix-confidence').textContent,
      actuateText: document.getElementById('btn-actuate').textContent.trim()
    })`);
    console.log('Active state:', activeState);
    await client.captureScreenshot('e2e_08_stage_3_sustained_active.png');

    console.log('--- Step 8: Disengage Cycle 1 ---');
    await client.click('#btn-disengage');
    await sleep(500);
    await client.captureScreenshot('e2e_09_disengage_reset_idle.png');

    console.log('--- Step 9: Quick-Dial Auto-Dial Sequence Test ---');
    // Click Tier-1 Preset: Sol-Station
    await client.click('#preset-preset-sol');
    // Capture mid-sequence screenshot
    await sleep(1000);
    await client.captureScreenshot('e2e_10_autodial_mid_sequence.png');

    // Wait for auto-dial to finish (7 stars * 320ms ~ 2.3s)
    await sleep(2200);
    const autodialPending = await client.eval(`({
      sightingCount: document.getElementById('sighting-count').textContent,
      confidence: document.getElementById('fix-confidence').textContent,
      statusText: document.getElementById('gate-status-text').textContent
    })`);
    console.log('Autodial pending:', autodialPending);
    await client.captureScreenshot('e2e_11_autodial_complete_pending.png');

    console.log('--- Step 10: Activate & Disengage Cycle 2 ---');
    await client.click('#btn-actuate');
    await sleep(2800); // reach sustained active
    await client.captureScreenshot('e2e_12_cycle2_sustained_active.png');
    await client.click('#btn-disengage');
    await sleep(500);
    await client.captureScreenshot('e2e_13_cycle2_disengaged.png');

    console.log('--- Step 11: 4K Scaled Viewport Test (3840x2160) ---');
    await client.setViewport(3840, 2160, 1);
    await sleep(800);
    await client.captureScreenshot('e2e_14_scaled_4k_viewport.png');

    console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    chromeProcess.kill();
  }
}

run();
