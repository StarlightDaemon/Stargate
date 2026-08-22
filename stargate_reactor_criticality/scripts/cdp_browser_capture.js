/**
 * Automated CDP (Chrome DevTools Protocol) Test Runner & Screenshot Capturer
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
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

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(msg.error);
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  async screenshot(filepath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filepath, buffer);
    console.log(`  [SCREENSHOT] Saved: ${path.basename(filepath)}`);
  }
}

async function run() {
  console.log('Launching headless Chrome with CDP on port 9222...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1920,1080',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    'http://127.0.0.1:8080/'
  ]);

  await sleep(1500);

  try {
    const targets = await getJson('http://127.0.0.1:9222/json');
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found in Chrome');

    console.log('Connecting WebSocket to:', pageTarget.webSocketDebuggerUrl);
    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });

    await client.send('Page.navigate', { url: 'http://127.0.0.1:8080/' });
    await sleep(1500);
    const outDir = path.join(__dirname, '..');

    // 1. Cold Start
    console.log('\nStep 1: Cold Start State');
    await client.screenshot(path.join(outDir, '01_cold_start_1080p.png'));

    // 2. Manual Dialing (6 channels)
    console.log('\nStep 2: Manual Dialing Sequence');
    const channelsToDial = [0, 2, 4, 5, 7, 9];
    for (let ch of channelsToDial) {
      console.log(`  Clicking channel-btn-${ch}...`);
      await client.eval(`document.getElementById('channel-btn-${ch}').click();`);
      await sleep(1400); // rod withdrawal + flux stabilization wait
    }
    await client.screenshot(path.join(outDir, '02_manual_dial_pending_1080p.png'));

    // 3. Stage 1: Buildup
    console.log('\nStep 3: Initiating Controlled Criticality -> Stage 1: Buildup');
    await client.eval(`document.getElementById('activate-criticality-btn').click();`);
    await sleep(400);
    await client.screenshot(path.join(outDir, '03_stage1_buildup_1080p.png'));

    // 4. Stage 2: Breakthrough
    console.log('\nStep 4: Stage 2: Cherenkov Breakthrough Flash');
    await sleep(1900);
    await client.screenshot(path.join(outDir, '04_stage2_breakthrough_1080p.png'));

    // 5. Stage 3: Sustained Active
    console.log('\nStep 5: Stage 3: Sustained Controlled Criticality');
    await sleep(1800);
    await client.screenshot(path.join(outDir, '05_stage3_sustained_active_1080p.png'));

    // 6. Emergency SCRAM Disengage
    console.log('\nStep 6: Emergency SCRAM Disengage');
    await client.eval(`document.getElementById('scram-disengage-btn').click();`);
    await sleep(600);
    await client.screenshot(path.join(outDir, '06_scram_disengage_1080p.png'));

    // 7. Quick-Dial Preset Auto-Sequencer
    console.log('\nStep 7: Quick-Dial Preset Auto-Sequencer (CRIT-B04)');
    await client.eval(`
      document.getElementById('preset-dropdown').value = 'CRIT-B04';
      document.getElementById('run-preset-autodial-btn').click();
    `);
    await sleep(1200);
    await client.screenshot(path.join(outDir, '07_autodial_in_progress_1080p.png'));

    await sleep(4500); // wait for all 6 rods to finish auto-sequencing
    await client.screenshot(path.join(outDir, '08_autodial_pending_1080p.png'));

    // 8. Activation 2 & SCRAM Cycle 2
    console.log('\nStep 8: Activation 2 & SCRAM Cycle 2');
    await client.eval(`document.getElementById('activate-criticality-btn').click();`);
    await sleep(3500);
    await client.eval(`document.getElementById('scram-disengage-btn').click();`);
    await sleep(500);
    await client.screenshot(path.join(outDir, '09_scram_cycle2_1080p.png'));

    // 9. Secondary Panels
    console.log('\nStep 9: Secondary Panels Spot-Check');
    await client.eval(`document.getElementById('tab-btn-xenon').click();`);
    await sleep(500);
    await client.screenshot(path.join(outDir, '10_tab_xenon_poisoning.png'));

    await client.eval(`document.getElementById('tab-btn-cross-section').click();`);
    await sleep(500);
    await client.screenshot(path.join(outDir, '11_tab_axial_cross_section.png'));

    await client.eval(`
      document.getElementById('tab-btn-archive').click();
      const input = document.getElementById('archive-search-input');
      input.value = 'Lindholm';
      input.dispatchEvent(new Event('input'));
    `);
    await sleep(500);
    await client.screenshot(path.join(outDir, '12_tab_archive_search.png'));

    await client.eval(`document.getElementById('operator-ref-btn').click();`);
    await sleep(500);
    await client.screenshot(path.join(outDir, '13_operator_manual_modal.png'));
    await client.eval(`document.getElementById('close-operator-ref-btn').click();`);
    await sleep(300);

    // 10. Simulated 4K Viewport Test
    console.log('\nStep 10: Simulated 4K Viewport (3840x2160)');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 3840,
      height: 2160,
      deviceScaleFactor: 1,
      mobile: false
    });
    await client.eval(`window.dispatchEvent(new Event('resize'));`);
    await sleep(800);
    await client.screenshot(path.join(outDir, '14_simulated_4k_viewport.png'));

    console.log('\nCDP verification completed with 14 screenshots successfully captured!');
  } finally {
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error('CDP script failed:', err);
  process.exit(1);
});
