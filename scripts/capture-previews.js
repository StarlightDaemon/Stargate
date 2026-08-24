// ============================================================
// capture-previews.js — captures a cold-start/idle 1920x1080
// screenshot of each listed build into <build>/preview.png (the
// filename hub/generate.js already picks up as a card preview).
//
// Per site: start `python -m http.server <port>` with cwd at the
// build folder, navigate a headless-Chrome tab over CDP, wait for
// load + a settle delay (ambient idle state, no interaction), take
// the screenshot, close the tab, and stop the server — leaving the
// site's server stopped, matching how it was found.
//
// Usage:
//   node scripts/capture-previews.js --sites <sites.json> --base-port 8501 --debug-port 9301
//
// sites.json: [ { "folder": "stargate_high_scifi", "dir": "E:/abs/path" }, ... ]
// Node built-ins only (global WebSocket, Node >= 22).
// ============================================================

const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

const CHROME = process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SETTLE_MS = 6000; // ambient idle settle after load
const NAV_TIMEOUT_MS = 30000;

function arg(name, dflt) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : dflt;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

function waitForPort(port, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      const req = http.get({ host: "127.0.0.1", port, path: "/", timeout: 2000 }, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) reject(new Error(`port ${port} never came up`));
        else setTimeout(poll, 250);
      });
    })();
  });
}

// --- minimal flat-session CDP client over the browser websocket ---
class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = [];
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`));
        else resolve(msg.result);
      } else if (msg.method) {
        for (const fn of this.listeners) fn(msg);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, NAV_TIMEOUT_MS + 10000);
    });
  }
  onEvent(fn) { this.listeners.push(fn); }
}

async function connectChrome(debugPort) {
  const ver = await httpGetJson(`http://127.0.0.1:${debugPort}/json/version`);
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  return new CDP(ws);
}

async function captureOne(cdp, site, port) {
  const url = `http://127.0.0.1:${port}/${site.path || "index.html"}`;
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  try {
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Emulation.setDeviceMetricsOverride",
      { width: 1920, height: site.height || 1080, deviceScaleFactor: 1, mobile: false }, sessionId);

    const loaded = new Promise((resolve) => {
      const check = (msg) => {
        if (msg.method === "Page.loadEventFired" && msg.sessionId === sessionId) resolve();
      };
      cdp.onEvent(check);
      setTimeout(resolve, NAV_TIMEOUT_MS); // fail open: settle delay still applies
    });
    await cdp.send("Page.navigate", { url }, sessionId);
    await loaded;
    await sleep(SETTLE_MS); // cold-start ambient idle — no interaction performed

    if (site.scrollTo != null) {
      // verification-only: scroll before capture; build previews never set this
      await cdp.send("Runtime.evaluate",
        { expression: `window.scrollTo(0, ${Number(site.scrollTo)})` }, sessionId);
      await sleep(500);
    }

    const shot = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
    const outPath = site.out || path.join(site.dir, "preview.png");
    fs.writeFileSync(outPath, Buffer.from(shot.data, "base64"));
    return outPath;
  } finally {
    await cdp.send("Target.closeTarget", { targetId }).catch(() => {});
  }
}

function startServer(dir, port) {
  const proc = spawn("python", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: dir, stdio: "ignore",
  });
  return proc;
}

function stopProc(proc) {
  return new Promise((resolve) => {
    if (!proc || proc.exitCode !== null) return resolve();
    proc.on("exit", () => resolve());
    proc.kill();
    setTimeout(() => { try { proc.kill("SIGKILL"); } catch {} resolve(); }, 3000);
  });
}

async function main() {
  const sitesPath = arg("--sites");
  const basePort = parseInt(arg("--base-port", "8501"), 10);
  const debugPort = parseInt(arg("--debug-port", "9301"), 10);
  // strip a UTF-8 BOM if present (PowerShell 5.1's Out-File adds one)
  const sites = JSON.parse(fs.readFileSync(sitesPath, "utf8").replace(/^﻿/, ""));

  const profileDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "cap-prof-"));
  const chrome = spawn(CHROME, [
    "--headless=new", `--remote-debugging-port=${debugPort}`,
    "--window-size=1920,1080", "--hide-scrollbars", "--disable-gpu",
    `--user-data-dir=${profileDir}`, "--no-first-run", "about:blank",
  ], { stdio: "ignore" });

  const results = [];
  try {
    await waitForPort(debugPort, 20000);
    const cdp = await connectChrome(debugPort);

    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];
      const port = basePort + i;
      let server = null;
      try {
        server = startServer(site.dir, port);
        await waitForPort(port);
        const out = await captureOne(cdp, site, port);
        const size = fs.statSync(out).size;
        results.push({ folder: site.folder, ok: true, out, bytes: size, port });
        console.log(`OK   ${site.folder} -> ${out} (${size} bytes)`);
      } catch (e) {
        results.push({ folder: site.folder, ok: false, error: String(e.message || e), port });
        console.log(`FAIL ${site.folder}: ${e.message || e}`);
      } finally {
        await stopProc(server);
      }
    }
  } finally {
    await stopProc(chrome);
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\nDone: ${results.length - failed.length}/${results.length} captured.`);
  if (failed.length) process.exitCode = 1;
}

main().catch((e) => { console.error("FATAL:", e); process.exit(2); });
