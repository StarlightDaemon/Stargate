"use strict";
// Preserve these four independent original raw-CDP suites before server replacement.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const { Writable } = require("node:stream");
const { execFileSync } = require("node:child_process");
const { request, click } = require("./browser-check-helpers.js");
const { legacy } = require("./check-pilot-browsers.js");
const { startPreview, selectExhibit } = require("./preview.js");
const ROOT = path.resolve(__dirname, ".."), OUTPUT = path.join(ROOT, "test/telemetry-security");
const BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1";
const TARGETS = [
  { name: "stargate_meteorological_nexrad", port: 8086, total: 7, active: "STORM EYE CONDUIT ACTIVE" },
  { name: "stargate_orbital_atc", port: 8084, total: 9, active: "ORBITAL INSERTION ACTIVE" },
  { name: "stargate_solarpunk_ecogrid", port: 8083, total: 8, active: "BIOSPHERE POWER CONDUIT ACTIVE" },
  { name: "stargate_sonar_abyssal", port: 8081, total: 6, active: "CONDUIT ACTIVE" },
];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const historical = (target, file) => execFileSync("git", ["show", BASE + ":" + target.name + "/" + file], { cwd: ROOT, encoding: "utf8" });
function original(target) {
  const source = historical(target, "test_build.js");
  assert.equal(fs.readFileSync(path.join(ROOT, target.name, "test_build.js"), "utf8").replace(/\r\n/g, "\n"), source.replace(/\r\n/g, "\n"), "Original suite must remain unchanged");
  return source;
}
const probes = () => [["GET", "/server.js", "server.js"], ["GET", "/test_build.js", "test_build.js"],
  ["GET", "/package.json", "package.json"], ["POST", "/", "index.html"]];

async function offline(target) {
  let handler, listener;
  const intercepted = { createServer(fn) { handler = fn; return { listen(...args) { listener = args.filter(arg => typeof arg !== "function"); } }; } };
  vm.runInNewContext(historical(target, "server.js"), {
    require: name => name === "http" ? intercepted : require(name), __dirname: path.join(ROOT, target.name),
    process: { env: {} }, URL, console: { log() {} },
  });
  const rows = [];
  for (const [method, url, file] of probes()) {
    const response = await new Promise((resolve, reject) => {
      const chunks = []; let status, headers;
      const res = new Writable({ write(chunk, encoding, done) { chunks.push(Buffer.from(chunk)); done(); } });
      res.writeHead = (code, values) => { status = code; headers = values; return res; };
      res.once("error", reject); res.once("finish", () => resolve({ status, headers, body: Buffer.concat(chunks) }));
      try { handler({ method, url }, res); } catch (error) { reject(error); }
    });
    assert.equal(response.status, 200); assert.equal(response.headers["Access-Control-Allow-Origin"], "*");
    assert.deepEqual(response.body, fs.readFileSync(path.join(ROOT, target.name, file)));
    rows.push({ method, url, status: response.status, exactTargetBytes: true, cors: "*" });
  }
  return { exhibit: target.name, scope: "Original handler with intercepted listener; not real HTTP or browser evidence. No directory traversal claim.", listener, rows };
}

async function runOriginal(browser, target, url, folder) {
  const source = original(target), context = await browser.createBrowserContext(), lines = [], pageErrors = [];
  fs.mkdirSync(folder, { recursive: true });
  const record = (...values) => lines.push(values.map(value => typeof value === "object" ? JSON.stringify(value) : String(value)).join(" "));
  try {
    const page = await context.newPage(); page.on("pageerror", error => pageErrors.push(error.message));
    await page.setViewport({ width: 1920, height: 1080 }); await page.goto(url, { waitUntil: "networkidle0" });
    const session = await page.createCDPSession();
    class CDPAdapter {
      async connect() {}
      send(method, params = {}) { return session.send(method, params); }
      async eval(expression) {
        const result = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
        if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
        return result.result?.value;
      }
      async screenshot(file) {
        const result = await this.send("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync(file, Buffer.from(result.data, "base64"));
      }
    }
    const start = source.indexOf("async function runTests() {"), end = source.lastIndexOf("\nrunTests().catch");
    assert.ok(start >= 0 && end > start);
    // Execute the entire original body verbatim, including every assertion and
    // delay. Adapt only browser ownership, CDP discovery, URL and evidence path.
    const body = source.slice(start, end);
    await new Function("PORT", "CDP_PORT", "OUT_DIR", "resolveChrome", "spawn", "sleep", "fetchJson", "SimpleCDP", "path", "console",
      body + "\nreturn runTests();")(new URL(url).port, 0, folder,
      async () => process.env.PUPPETEER_EXECUTABLE_PATH, () => ({ kill() {} }), delay,
      async endpoint => endpoint.endsWith("/json/version") ? session.send("Browser.getVersion") : [{ url, webSocketDebuggerUrl: "owned-cdp-session" }],
      CDPAdapter, path, { log: record, error: record, warn: record });
    assert.ok(lines.some(line => line.includes("ALL VERIFICATION TESTS PASSED FOR " + target.name)), "Exact original completion marker");
    assert.deepEqual(pageErrors, []);
    return { status: "PASS", suite: "test_build.js", bodySha256: crypto.createHash("sha256").update(body.replace(/\r\n/g, "\n")).digest("hex"),
      assertions: "Entire original raw-CDP runTests body and timing completed unchanged", pageErrors };
  } finally { fs.writeFileSync(path.join(folder, "run.log"), lines.join("\n")); await context.close(); }
}

async function supplemental(browser, target, url, folder, mode) {
  const context = await browser.createBrowserContext(), page = await context.newPage();
  const result = { pageErrors: [], consoleErrors: [], resources: [], requestFailures: [], cycles: [] };
  page.on("pageerror", error => result.pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") result.consoleErrors.push(message.text()); });
  page.on("response", response => { if (response.status() >= 400) result.resources.push(response.url().replace(url, "ORIGIN") + ":" + response.status()); });
  page.on("requestfailed", request => result.requestFailures.push(request.url().replace(url, "ORIGIN")));
  const shot = async state => {
    const filename = target.name + "-" + mode + "-" + state;
    await page.screenshot({ path: path.join(folder, filename + ".png") });
    if (mode === "shared" && process.env.STARGATE_LOG_VISUALS === "1") {
      const data = await page.screenshot({ type: "jpeg", quality: 60, encoding: "base64" });
      for (let offset = 0; offset < data.length; offset += 16000) console.log("STARGATE_VISUAL " + filename + ".jpg " + offset + " " + data.slice(offset, offset + 16000));
    }
  };
  const snapshot = () => page.evaluate(() => ({ counter: document.getElementById("address-counter").textContent.trim(),
    state: document.getElementById("tele-state").textContent.trim(), disabled: document.getElementById("btn-activate").disabled }));
  try {
    await page.setViewport({ width: 1920, height: 1080 }); await page.goto(url, { waitUntil: "networkidle0" });
    result.initial = await snapshot(); await shot("idle");
    const selectors = await page.$$eval(".glyph-btn", (elements, total) => elements.slice(0, total).map(element => '.glyph-btn[data-glyph="' + element.dataset.glyph + '"]'), target.total);
    assert.equal(selectors.length, target.total);
    const dial = async () => { for (const selector of selectors) { await click(page, selector); await delay(100); } };
    for (let cycle = 0; cycle < 2; cycle++) {
      await dial(); await delay(1200); const ready = await snapshot();
      assert.ok(ready.counter.includes(target.total + " / " + target.total)); assert.equal(ready.disabled, false);
      assert.ok(!ready.state.includes(target.active), "Manual input must not auto-fire");
      if (!cycle) await shot("ready");
      await click(page, "#btn-activate");
      await page.waitForFunction(active => document.getElementById("tele-state").textContent.includes(active), {}, target.active);
      const active = await snapshot(); if (!cycle) await shot("active");
      await click(page, "#btn-disengage"); await delay(500); const idle = await snapshot();
      assert.ok(idle.counter.includes("0 / " + target.total)); assert.ok(!idle.state.includes(target.active));
      result.cycles.push({ ready, active, idle });
    }
    await shot("reset");
    await dial(); await click(page, "#btn-activate"); await delay(500); await click(page, "#btn-disengage"); await delay(8250);
    result.cancelled = await snapshot(); assert.deepEqual(result.cancelled, result.initial, "State remains idle after activation cancellation and 8.25 seconds");
    await shot("cancelled");
    result.acceptance = "Original suites and bounded preservation checks only. Historical operator notes are retained; three-stage visuals, acoustic and complete keyboard acceptance are not inferred.";
    if (target.name === "stargate_solarpunk_ecogrid") result.knownLimitation = "Existing CHANGELOG records the safety checkbox as keyboard-unreachable; this migration does not repair or qualify it.";
    assert.deepEqual(result.pageErrors, []);
    return result;
  } finally { await context.close(); }
}

async function qualify(browser, target, mode) {
  const selection = selectExhibit(target.name), folder = path.join(OUTPUT, target.name, mode); fs.mkdirSync(folder, { recursive: true });
  const server = mode === "legacy" ? await legacy({ name: target.name, server: "server.js" }) : await startPreview({ ...selection, port: 0 });
  const result = { exhibit: target.name, mode, assets: 0, security: [] };
  try {
    for (const file of selection.files) {
      const response = await request(server.url, "/" + file); assert.equal(response.status, 200, file);
      assert.deepEqual(response.body, fs.readFileSync(path.join(selection.root, file))); result.assets++;
    }
    for (const [method, url, file] of probes()) {
      const response = await request(server.url, url, method);
      assert.equal(response.status, mode === "legacy" ? 200 : method === "POST" ? 405 : 403);
      if (mode === "legacy") { assert.deepEqual(response.body, fs.readFileSync(path.join(selection.root, file))); assert.equal(response.headers["access-control-allow-origin"], "*"); }
      else assert.equal(response.headers["access-control-allow-origin"], undefined);
      result.security.push({ method, url, status: response.status, cors: response.headers["access-control-allow-origin"] || null });
    }
    result.original = await runOriginal(browser, target, server.url, path.join(folder, "original"));
    result.browser = await supplemental(browser, target, server.url, folder, mode); result.status = "PASS";
    return result;
  } catch (error) { result.status = "FAIL"; result.error = error.stack; throw error; }
  finally { fs.writeFileSync(path.join(folder, "result.json"), JSON.stringify(result, null, 2)); console.log("TELEMETRY_RESULT " + JSON.stringify(result)); await server.close(); }
}

async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const requested = process.argv.slice(2).filter(argument => argument !== "--offline");
  const targets = requested.length ? TARGETS.filter(target => requested.includes(target.name)) : TARGETS;
  assert.equal(targets.length, requested.length || TARGETS.length, "Unknown or duplicate target");
  if (process.argv.includes("--offline")) {
    const result = []; for (const target of targets) { original(target); result.push(await offline(target)); }
    fs.writeFileSync(path.join(OUTPUT, "offline.json"), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2)); return;
  }
  const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer");
  const browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
  try {
    for (const target of targets) {
      const before = await qualify(browser, target, "legacy"), after = await qualify(browser, target, "shared");
      assert.deepEqual(after.original, before.original); assert.deepEqual(after.browser.cycles, before.browser.cycles); assert.deepEqual(after.browser.cancelled, before.browser.cancelled);
      for (const key of ["resources", "requestFailures", "consoleErrors"]) assert.deepEqual([...new Set(after.browser[key])].sort(), [...new Set(before.browser[key])].sort(), key);
      console.log("TELEMETRY_PRESERVATION PASS " + target.name);
    }
  } finally { await browser.close(); }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
