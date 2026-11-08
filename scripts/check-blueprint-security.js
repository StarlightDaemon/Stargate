"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const vm = require("node:vm");
const { spawn, execFileSync } = require("node:child_process");
const { request, click } = require("./browser-check-helpers.js");
const { legacy } = require("./check-pilot-browsers.js");
const { selectExhibit, startPreview } = require("./preview.js");
const ROOT = path.resolve(__dirname, ".."), NAME = "stargate_blueprint_alpha";
const DIR = path.join(ROOT, NAME), OUTPUT = path.join(ROOT, "test", "blueprint-security");
const BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1";
const historical = file => execFileSync("git", ["show", BASE + ":" + NAME + "/" + file], { cwd: ROOT, encoding: "utf8" });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const original = historical("verify.js");

function childServer(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: DIR, env: { ...process.env, PORT: "0", NO_COLOR: "1", FORCE_COLOR: "0" },
      windowsHide: true, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "", settled = false;
    const closed = new Promise(done => child.once("close", done));
    const stop = async () => {
      if (child.exitCode === null && child.pid) {
        if (process.platform === "win32") {
          try { execFileSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" }); } catch {}
        } else { try { process.kill(-child.pid, "SIGTERM"); } catch {} }
      }
      await Promise.race([closed, delay(3000)]);
    };
    const timer = setTimeout(() => { if (!settled) { settled = true; stop().then(() => reject(new Error("Launcher timeout: " + output))); } }, 15000);
    const collect = chunk => {
      output += chunk.toString().replace(/\u001b\[[0-9;]*m/g, "");
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match && !settled) { settled = true; clearTimeout(timer); resolve({ url: match[0], close: stop }); }
    };
    child.stdout.on("data", collect); child.stderr.on("data", collect);
    child.on("error", e => { clearTimeout(timer); reject(e); });
    child.on("close", code => { if (!settled) { settled = true; clearTimeout(timer); reject(new Error("Launcher exited " + code + ": " + output)); } });
  });
}
function npmCli() {
  const base = path.dirname(process.execPath);
  const found = [process.env.npm_execpath, path.join(base, "node_modules/npm/bin/npm-cli.js"), path.join(base, "../lib/node_modules/npm/bin/npm-cli.js")].find(p => p && fs.existsSync(p));
  assert.ok(found, "npm CLI must be available"); return found;
}
async function serveBaseline() {
  const pkg = JSON.parse(fs.readFileSync(path.join(DIR, "node_modules/serve/package.json"), "utf8"));
  assert.equal(pkg.version, "14.2.6", "Use the version pinned in the existing lock");
  const script = JSON.parse(historical("package.json")).scripts.start;
  assert.equal(script, "serve . -l 8088 --no-clipboard");
  const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin.serve;
  // Same locked CLI and serving options; only the listener is constrained for diagnostics.
  return childServer([path.join(DIR, "node_modules/serve", bin), ".", "-l", "tcp://127.0.0.1:0", "--no-clipboard"]);
}
async function embeddedBaseline() {
  let handler;
  const definition = original.slice(original.indexOf("function createServer()"), original.indexOf("// Helper to make real HTTP"));
  vm.runInNewContext(definition + "\ncreateServer();", {
    http: { createServer(fn) { handler = fn; return { listen() {} }; } },
    fs, path, __dirname: DIR, PORT: 0, BASE_URL: "", console: { log() {} }
  });
  assert.equal(typeof handler, "function");
  const server = http.createServer(handler);
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  return { url: "http://127.0.0.1:" + server.address().port, close: () => new Promise(done => { server.close(done); server.closeAllConnections(); }) };
}
async function security(server, mode) {
  const results = [];
  for (const [method, url, target] of [
    ["GET", "/../README.md", path.join(ROOT, "README.md")],
    ["GET", "/../stargate_blueprint_drafting/index.html", path.join(ROOT, "stargate_blueprint_drafting/index.html")],
    ["GET", "/server.js", path.join(DIR, "server.js")],
    ["GET", "/verify.js", path.join(DIR, "verify.js")],
    ["GET", "/package.json", path.join(DIR, "package.json")],
    ["GET", "/CHANGELOG.md", path.join(DIR, "CHANGELOG.md")],
    ["POST", "/", path.join(DIR, "index.html")]
  ]) {
    const r = await request(server.url, url, method);
    if (["shared", "node-command", "npm-start"].includes(mode)) assert.equal(r.status, method === "POST" ? 405 : 403, mode + " " + url);
    if (["legacy-custom", "legacy-test"].includes(mode)) { assert.equal(r.status, 200); assert.deepEqual(r.body, fs.readFileSync(target)); }
    // serve has its own containment behavior; measure it without assuming the custom-handler vulnerability.
    results.push({ method, url, status: r.status, returnedTargetBytes: r.body.equals(fs.readFileSync(target)) });
  }
  return results;
}
function adaptTransport(source) {
  return source
    .replace("{ path: '/CHANGELOG.md', mime: 'text/markdown' }", "{ path: '/CHANGELOG.md', mime: 'text/plain', status: 403 }")
    .replace("res.status === 200 && res.headers['content-type'].includes(ep.mime)", "res.status === (ep.status || 200) && (res.headers['content-type'].includes(ep.mime) || (ep.mime === 'application/javascript' && res.headers['content-type'].includes('text/javascript')))");
}
async function runOriginal(browser, server, mode) {
  const context = await browser.createBrowserContext(), lines = [], errors = [], processState = { exitCode: 0 };
  const folder = path.join(OUTPUT, mode); fs.mkdirSync(folder, { recursive: true });
  let source = original;
  if (mode === "shared") source = adaptTransport(source);
  // Existing assertions remain. Adapt only URL, server/browser ownership and evidence destination.
  source = source.replace(/const BASE_URL = .*;/, "const BASE_URL = " + JSON.stringify(server.url) + ";")
    .replace(/const OUT_DIR = .*;/, "const OUT_DIR = " + JSON.stringify(folder) + ";");
  const start = source.indexOf("function createServer()"), end = source.indexOf("// Helper to make real HTTP");
  source = source.slice(0, start) + "async function createServer() { return {close() {}}; }\n" + source.slice(end);
  source = source.replace(/\nrunTests\(\);\s*$/, "\nreturn runTests();");
  try {
    const adapter = { launch: async () => ({
      newPage: async () => { const p = await context.newPage(); p.on("pageerror", e => errors.push(e.message)); return p; },
      close: async () => {}
    }) };
    await new Function("require", "__dirname", "console", "process", source)(
      n => n === "puppeteer" ? adapter : require(n), DIR,
      { log: (...v) => lines.push(v.join(" ")), error: (...v) => lines.push(v.map(x => x instanceof Error ? x.message : String(x)).join(" ")) },
      processState);
    const failure = lines.find(l => l.includes("VERIFICATION TEST FAILED"));
    return { status: processState.exitCode ? "FAIL" : "PASS", failure: failure || null, pageErrors: errors, lines,
      transportChanges: mode === "shared" ? ["CHANGELOG.md is denied with403; metadata still checked from disk", "Accept standard text/javascript MIME"] : [] };
  } finally { fs.writeFileSync(path.join(folder, "original-suite.log"), lines.join("\n")); await context.close(); }
}
async function observe(browser, server, mode) {
  const context = await browser.createBrowserContext(), page = await context.newPage();
  const result = { pageErrors: [], resources: [], cycles: [] };
  page.on("pageerror", e => result.pageErrors.push(e.message));
  page.on("response", r => { if (r.status() >= 400) result.resources.push(r.url().replace(server.url, "ORIGIN") + ":" + r.status()); });
  const snapshot = () => page.evaluate(() => {
    const s = window.__BLUEPRINT_CAD_API__.getState();
    return { count: s.stagedGlyphs.length, connected: s.isConnected, hold: s.reviewHoldActive,
      filled: document.querySelectorAll(".seq-slot.filled").length, status: document.getElementById("system-status-indicator").textContent,
      stampVisible: !document.getElementById("approval-stamp-group").classList.contains("hidden") };
  });
  const shot = async name => {
    const file = "blueprint-" + mode + "-" + name;
    await page.screenshot({ path: path.join(OUTPUT, file + ".png") });
    if (mode === "shared" && process.env.STARGATE_LOG_VISUALS === "1") {
      const data = await page.screenshot({ type: "jpeg", quality: 65, encoding: "base64" });
      for (let offset = 0; offset < data.length; offset += 16000) console.log("STARGATE_VISUAL " + file + ".jpg " + offset + " " + data.slice(offset, offset + 16000));
    }
  };
  try {
    await page.setViewport({ width: 1920, height: 1080 }); await page.goto(server.url, { waitUntil: "networkidle0" });
    result.initial = await snapshot(); await shot("idle");
    for (let cycle = 0; cycle < 2; cycle++) {
      for (const index of [0, 1, 2, 3, 4, 5]) await click(page, '.glyph-btn[data-glyph-index="' + index + '"]');
      await delay(600);
      const ready = await snapshot(); assert.equal(ready.count, 6); assert.equal(ready.filled, 6); assert.equal(ready.connected, false);
      if (!cycle) await shot("ready");
      await click(page, "#btn-engage-draft"); await delay(600);
      const active = await snapshot(); assert.equal(active.connected, true); assert.equal(active.stampVisible, true);
      if (!cycle) await shot("active");
      await click(page, "#btn-disengage-draft"); await delay(300);
      const cancelled = await snapshot(); assert.equal(cancelled.count, 0); assert.equal(cancelled.connected, false); assert.equal(cancelled.stampVisible, false);
      result.cycles.push({ ready, active, cancelled });
    }
    await shot("disconnected");
    await click(page, '.site-plan-card[data-plan-id="civil-helios"]'); await delay(800);
    result.preset = await snapshot();
    result.functionalAcceptance = "FAIL: operator-reported manual-dial defect remains open; preset auto-activation is separately recorded";
    return result;
  } catch (e) { result.failure = e.message; return result; }
  finally { await context.close(); }
}
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const report = { scope: "Blueprint entry-point security and preservation; operator known-issue status retained.", results: [] };
  let browser;
  try {
    const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || path.join(DIR, "node_modules/puppeteer"));
    browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
    for (const mode of ["legacy-custom", "legacy-test", "legacy-serve", "shared"]) {
      const server = mode === "legacy-custom" ? await legacy({ name: NAME, server: "server.js" })
        : mode === "legacy-test" ? await embeddedBaseline() : mode === "legacy-serve" ? await serveBaseline()
        : await startPreview({ ...selectExhibit(NAME), port: 0 });
      const row = { mode, assets: 0 };
      try {
        row.security = await security(server, mode);
        if (mode !== "legacy-test") {
          for (const file of selectExhibit(NAME).files) {
            const response = await request(server.url, "/" + file);
            assert.equal(response.status, 200, mode + " " + file);
            assert.deepEqual(response.body, fs.readFileSync(path.join(DIR, file))); row.assets++;
          }
          row.originalSuite = await runOriginal(browser, server, mode);
          row.browser = await observe(browser, server, mode);
        }
        row.status = "PASS";
      } finally { await server.close(); report.results.push(row); console.log(JSON.stringify(row)); }
    }
    const baseline = report.results.find(r => r.mode === "legacy-custom");
    for (const row of report.results.filter(r => r.originalSuite)) {
      assert.equal(row.originalSuite.status, baseline.originalSuite.status, row.mode + " original suite regression");
      assert.equal(row.originalSuite.failure, baseline.originalSuite.failure, row.mode + " original failure changed");
      assert.deepEqual(row.originalSuite.pageErrors, baseline.originalSuite.pageErrors);
      assert.equal(row.browser.failure, baseline.browser.failure, row.mode + " pointer behavior changed");
      assert.deepEqual(row.browser.cycles, baseline.browser.cycles);
      assert.deepEqual(row.browser.preset, baseline.browser.preset);
      assert.deepEqual([...new Set(row.browser.resources)].sort(), [...new Set(baseline.browser.resources)].sort());
    }
    // After migration, exercise both actual launch commands, not just the shared API.
    if (JSON.parse(fs.readFileSync(path.join(DIR, "package.json"), "utf8")).scripts.start === "node server.js") {
      for (const [mode, args] of [["node-command", ["server.js"]], ["npm-start", [npmCli(), "start"]]]) {
        const server = await childServer(args);
        try { const row = { mode, security: await security(server, mode), status: "PASS" }; report.results.push(row); console.log(JSON.stringify(row)); }
        finally { await server.close(); }
      }
    }
    report.status = "PASS";
  } catch (e) { report.status = "FAIL"; report.error = e.stack; throw e; }
  finally { if (browser) await browser.close(); fs.writeFileSync(path.join(OUTPUT, "report.json"), JSON.stringify(report, null, 2)); }
}
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
