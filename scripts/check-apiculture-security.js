"use strict";
// Infrastructure qualification only: preserve the original closed creative brief.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const vm = require("node:vm");
const crypto = require("node:crypto");
const { Writable } = require("node:stream");
const { execFileSync } = require("node:child_process");
const { request, click } = require("./browser-check-helpers.js");
const { startPreview, selectExhibit } = require("./preview.js");
const ROOT = path.resolve(__dirname, ".."), NAME = "stargate_apiculture_telemetry";
const DIR = path.join(ROOT, NAME), OUTPUT = path.join(ROOT, "test/apiculture-security");
const BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1";
const SUITE = "tests/e2e_verification.js", SERVER = "scripts/server.js";
const historical = file => execFileSync("git", ["show", BASE + ":" + NAME + "/" + file], { cwd: ROOT, encoding: "utf8" });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function loadHandler(intercepted) {
  const signals = [];
  vm.runInNewContext(historical(SERVER), {
    require: name => name === "http" ? intercepted : require(name), __dirname: path.join(DIR, "scripts"),
    process: { env: {}, on: name => signals.push(name), exit() {} }, console: { log() {} },
  });
  return signals;
}
function legacyServer() {
  return new Promise((resolve, reject) => {
    loadHandler({ ...http, createServer(handler) {
      const server = http.createServer(handler); server.once("error", reject);
      server.listen = () => {
        http.Server.prototype.listen.call(server, 0, "127.0.0.1", () => resolve({ url: "http://127.0.0.1:" + server.address().port,
          close: () => new Promise(done => { server.close(done); server.closeAllConnections(); }) }));
        return server;
      };
      return server;
    } });
  });
}
const probes = () => [["GET", "/" + SERVER, SERVER], ["GET", "/" + SUITE, SUITE],
  ["GET", "/package.json", "package.json"], ["POST", "/", "index.html"]];
async function offline() {
  let handler, listener;
  const signals = loadHandler({ createServer(fn) { handler = fn; return { listen(...args) { listener = args.filter(arg => typeof arg !== "function"); } }; } });
  const rows = [];
  for (const [method, url, file] of probes()) {
    const response = await new Promise((resolve, reject) => {
      let status, headers; const chunks = [];
      const res = new Writable({ write(chunk, encoding, done) { chunks.push(Buffer.from(chunk)); done(); } });
      res.writeHead = (code, values) => { status = code; headers = values; return res; };
      res.once("error", reject); res.once("finish", () => resolve({ status, headers, body: Buffer.concat(chunks) }));
      try { handler({ method, url }, res); } catch (error) { reject(error); }
    });
    assert.equal(response.status, 200); assert.deepEqual(response.body, fs.readFileSync(path.join(DIR, file)));
    rows.push({ method, url, status: response.status, exactTargetBytes: true, cors: response.headers["Access-Control-Allow-Origin"] });
  }
  return { name: NAME, listener, signals, scope: "Original handler, intercepted listener and read-only files; no HTTP/browser or sibling-escape claim.", rows };
}

async function originalSuite(browser, url, mode) {
  const original = historical(SUITE), context = await browser.createBrowserContext(), lines = [], pageErrors = [];
  assert.equal(fs.readFileSync(path.join(DIR, SUITE), "utf8").replace(/\r\n/g, "\n"), original.replace(/\r\n/g, "\n"), "Original suite must remain unchanged");
  const folder = path.join(OUTPUT, mode, "original"); fs.mkdirSync(folder, { recursive: true });
  const end = original.lastIndexOf("\nrunVerification().catch"); assert.ok(end > 0);
  const originalBody = original.slice(original.indexOf("async function runVerification() {"), end);
  const urlDeclaration = "const url = 'http://127.0.0.1:8080';";
  const imageDeclaration = "const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');";
  assert.ok(original.includes(urlDeclaration) && original.includes(imageDeclaration));
  const source = original.slice(0, end).replace(urlDeclaration, "const url = " + JSON.stringify(url) + ";")
    .replace(imageDeclaration, "const SCREENSHOT_DIR = " + JSON.stringify(folder) + ";");
  assert.ok(source.replace("const url = " + JSON.stringify(url) + ";", urlDeclaration).includes(originalBody), "Original functional body and timing unchanged apart from URL");
  const adapter = { executablePath: () => process.env.PUPPETEER_EXECUTABLE_PATH,
    launch: async () => ({ newPage: async () => { const page = await context.newPage(); page.on("pageerror", error => pageErrors.push(error.message)); return page; }, close: async () => {} }) };
  const log = (...values) => lines.push(values.map(value => typeof value === "object" ? JSON.stringify(value) : String(value)).join(" "));
  try {
    await new Function("require", "__dirname", "console", "process", "setTimeout", source + "\nreturn runVerification();")(
      name => name === "puppeteer" ? adapter : require(name), path.join(DIR, "tests"), { log, error: log, warn: log },
      { env: process.env, exit: code => { throw new Error("Original suite exited " + code); } }, setTimeout);
    for (let phase = 1; phase <= 10; phase++) assert.ok(lines.some(line => line.includes("[Test " + phase + "]")), "Original phase " + phase + " completed");
    assert.ok(lines.some(line => line.includes("ALL 10 TEST SEQUENCES COMPLETED AND VERIFIED WITH PUPPETEER!")));
    assert.ok(lines.some(line => line.includes("Activation Button Ready & Enabled: true")), "Original logged ready control");
    assert.deepEqual(pageErrors, []);
    return { status: "PASS", phases: 10, bodySha256: crypto.createHash("sha256").update(originalBody.replace(/\r\n/g, "\n")).digest("hex"), pageErrors,
      note: "Entire original flow retained, including its direct-state hold fallback and reset. Supplemental pointer checks are separate. Only URL, screenshot destination and browser ownership adapted; Chrome sandbox enabled." };
  } finally { fs.writeFileSync(path.join(folder, "run.log"), lines.join("\n")); await context.close(); }
}

async function supplemental(browser, url, mode) {
  const context = await browser.createBrowserContext(), page = await context.newPage();
  const result = { cycles: [], pageErrors: [], consoleErrors: [], resources: [], requestFailures: [] };
  page.on("pageerror", error => result.pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") result.consoleErrors.push(message.text()); });
  page.on("response", response => { if (response.status() >= 400) result.resources.push(response.url().replace(url, "ORIGIN") + ":" + response.status()); });
  page.on("requestfailed", request => result.requestFailures.push(request.url().replace(url, "ORIGIN")));
  const snapshot = () => page.evaluate(() => ({ state: window.app.activationState, count: window.app.activeAddress.length,
    nodes: window.app.dialedNodeIndices.length, acquiring: window.app.isDialingNode, hold: window.app.biosecurityHoldEngaged,
    presetTimers: window.app.autoDialTimeoutIds.length, renderer: window.app.ringRenderer.activationState,
    apertureAudioNodes: window.telemetryAudio.activeApertureNodes.length, activateDisabled: document.getElementById("btn-activate").disabled }));
  const shot = async state => {
    const filename = "apiculture-" + mode + "-" + state;
    await page.screenshot({ path: path.join(OUTPUT, filename + ".png") });
    if (mode === "shared" && process.env.STARGATE_LOG_VISUALS === "1") {
      const data = await page.screenshot({ type: "jpeg", quality: 60, encoding: "base64" });
      for (let offset = 0; offset < data.length; offset += 16000) console.log("STARGATE_VISUAL " + filename + ".jpg " + offset + " " + data.slice(offset, offset + 16000));
    }
  };
  const dial = async () => {
    let count = 0;
    for (const id of [1, 2, 3, 5, 7, 4, 10]) {
      await click(page, "#colony-key-" + id); count++;
      await page.waitForFunction(expected => window.app.activeAddress.length === expected && !window.app.isDialingNode, {}, count);
    }
  };
  try {
    await page.setViewport({ width: 1920, height: 1080 }); await page.goto(url, { waitUntil: "networkidle0" });
    const initial = await snapshot(); assert.equal(initial.state, "IDLE"); assert.equal(initial.hold, false); await shot("idle");
    for (let cycle = 0; cycle < 2; cycle++) {
      await dial(); await delay(700); const ready = await snapshot(); assert.equal(ready.state, "PENDING"); assert.equal(ready.count, 7); assert.equal(ready.activateDisabled, false);
      if (!cycle) {
        await shot("ready"); await click(page, "#safety-toggle-card"); assert.equal((await snapshot()).hold, true);
        await click(page, "#btn-activate"); await delay(300); assert.equal((await snapshot()).state, "PENDING");
        await click(page, "#safety-toggle-card"); assert.equal((await snapshot()).hold, false);
      }
      await click(page, "#btn-activate"); await delay(500); assert.equal((await snapshot()).state, "BUILDUP");
      if (!cycle) await shot("buildup");
      await page.waitForFunction(() => window.app.activationState === "BREAKTHROUGH"); if (!cycle) await shot("breakthrough");
      await page.waitForFunction(() => window.app.activationState === "ACTIVE"); const active = await snapshot(); if (!cycle) await shot("active");
      await click(page, "#btn-disengage"); await delay(600); const idle = await snapshot(); assert.deepEqual(idle, initial);
      result.cycles.push({ ready: ready.state, active: active.state, activeCount: active.count, reset: idle });
    }
    await shot("reset");
    await dial(); await click(page, "#btn-activate"); await delay(500); await click(page, "#btn-disengage"); await delay(8250);
    result.cancelled = await snapshot(); assert.deepEqual(result.cancelled, initial); await shot("cancelled");
    assert.deepEqual(result.pageErrors, []);
    result.acceptance = "Infrastructure preservation; original closed creative brief and operator evaluation unchanged. Screenshots and audio-node state are not human visual/acoustic approval.";
    return result;
  } finally { await context.close(); }
}

async function qualify(browser, mode) {
  const selection = selectExhibit(NAME), result = { mode, assets: 0, security: [] };
  const server = mode === "legacy" ? await legacyServer() : await startPreview({ ...selection, port: 0 });
  try {
    for (const file of selection.files) {
      const response = await request(server.url, "/" + file); assert.equal(response.status, 200, file);
      assert.deepEqual(response.body, fs.readFileSync(path.join(DIR, file))); result.assets++;
    }
    for (const [method, url, file] of probes()) {
      const response = await request(server.url, url, method);
      assert.equal(response.status, mode === "legacy" ? 200 : method === "POST" ? 405 : 403);
      if (mode === "legacy") assert.deepEqual(response.body, fs.readFileSync(path.join(DIR, file)));
      assert.equal(response.headers["access-control-allow-origin"], mode === "legacy" ? "*" : undefined);
      result.security.push({ method, url, status: response.status, cors: response.headers["access-control-allow-origin"] || null });
    }
    const parent = await request(server.url, "/../README.md"); assert.equal(parent.status, 403);
    result.security.push({ method: "GET", url: "/../README.md", status: parent.status, note: "Parent access already rejected by historical handler; no sibling-prefix escape claim." });
    result.original = await originalSuite(browser, server.url, mode);
    result.browser = await supplemental(browser, server.url, mode); result.status = "PASS";
    return result;
  } catch (error) { result.status = "FAIL"; result.error = error.stack; throw error; }
  finally { fs.writeFileSync(path.join(OUTPUT, mode + ".json"), JSON.stringify(result, null, 2)); console.log("APICULTURE_RESULT " + JSON.stringify(result)); await server.close(); }
}

async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  if (process.argv.includes("--offline")) {
    const result = await offline(); fs.writeFileSync(path.join(OUTPUT, "offline.json"), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2)); return;
  }
  const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || path.join(ROOT, "stargate_blueprint_alpha/node_modules/puppeteer"));
  const browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, args: ["--autoplay-policy=no-user-gesture-required"] });
  try {
    const before = await qualify(browser, "legacy"), after = await qualify(browser, "shared");
    assert.deepEqual(after.original, before.original); assert.deepEqual(after.browser.cycles, before.browser.cycles); assert.deepEqual(after.browser.cancelled, before.browser.cancelled);
    for (const key of ["resources", "requestFailures", "consoleErrors"]) assert.deepEqual([...new Set(after.browser[key])].sort(), [...new Set(before.browser[key])].sort(), key);
    console.log("APICULTURE_PRESERVATION PASS");
  } finally { await browser.close(); }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
