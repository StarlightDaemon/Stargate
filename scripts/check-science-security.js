"use strict";
// Qualification is independent of the launcher migration. Historical handlers are
// read from the pinned baseline; all browser work uses isolated contexts.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { Writable } = require("node:stream");
const { execFileSync } = require("node:child_process");
const { request, click } = require("./browser-check-helpers.js");
const { legacy } = require("./check-pilot-browsers.js");
const { startPreview, selectExhibit } = require("./preview.js");
const ROOT = path.resolve(__dirname, "..");
const BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1";
const OUTPUT = path.join(ROOT, "test/science-security");
const TARGETS = [
  { name: "stargate_epigraphic_spectrometry", suite: "test_build.js", port: 8082, kind: "cdp", total: 7, active: "GOLDEN CONDUIT OPEN" },
  { name: "stargate_genomic_sequencer", suite: "test_build.js", port: 8085, kind: "cdp", total: 8, active: "QUANTUM HELIX ACTIVE" },
  { name: "stargate_windtunnel_aerodynamics", suite: "verify.js", port: 8094, kind: "puppeteer" }
];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function historical(target, file) {
  return execFileSync("git", ["show", BASE + ":" + target.name + "/" + file], { cwd: ROOT, encoding: "utf8" });
}
function original(target) {
  const source = historical(target, target.suite);
  assert.equal(fs.readFileSync(path.join(ROOT, target.name, target.suite), "utf8").replace(/\r\n/g, "\n"),
    source.replace(/\r\n/g, "\n"), "Original suite must remain unchanged");
  return source;
}
function probes(target) {
  return [["GET", "/server.js", "server.js"], ["GET", "/" + target.suite, target.suite],
    ["GET", "/package.json", "package.json"], ["POST", "/", "index.html"]];
}
async function offline(target) {
  let handler, listener;
  const http = { createServer(fn) { handler = fn; return { listen(...args) { listener = args.slice(0, -1); } }; } };
  vm.runInNewContext(historical(target, "server.js"), {
    require: n => n === "http" ? http : require(n),
    __dirname: path.join(ROOT, target.name), process: { env: {} }, URL, console: { log() {} }
  });
  const results = [];
  for (const [method, url, file] of probes(target)) {
    const response = await new Promise((resolve, reject) => {
      let status, headers; const chunks = [];
      const out = new Writable({ write(chunk, encoding, done) { chunks.push(Buffer.from(chunk)); done(); } });
      out.writeHead = (s, h) => { status = s; headers = h; return out; };
      out.once("error", reject);
      out.once("finish", () => resolve({ status, headers, body: Buffer.concat(chunks) }));
      try { handler({ method, url }, out); } catch (error) { reject(error); }
    });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, fs.readFileSync(path.join(ROOT, target.name, file)));
    results.push({ method, url, status: response.status, exactTargetBytes: true });
  }
  return { exhibit: target.name, evidence: "Offline original-handler execution; not HTTP or browser acceptance", listener, probes: results };
}
async function runOriginal(browser, target, url, folder) {
  const source = original(target), context = await browser.createBrowserContext(), lines = [];
  const log = { log: (...v) => lines.push(v.map(x => typeof x === "object" ? JSON.stringify(x) : String(x)).join(" ")),
    error: (...v) => lines.push(v.map(String).join(" ")) };
  fs.mkdirSync(folder, { recursive: true });
  try {
    if (target.kind === "cdp") {
      const page = await context.newPage(); await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(url, { waitUntil: "networkidle0" });
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
      // The entire original runTests function, including every assertion and
      // sleep, is executed verbatim. Only browser/process and CDP discovery
      // ownership are supplied by this adapter.
      const start = source.indexOf("async function runTests() {");
      const end = source.lastIndexOf("\nrunTests().catch");
      assert.ok(start >= 0 && end > start);
      const body = source.slice(start, end);
      await new Function("PORT", "CDP_PORT", "OUT_DIR", "resolveChrome", "spawn", "sleep", "fetchJson", "SimpleCDP", "path", "console",
        body + "\nreturn runTests();")(new URL(url).port, 0, folder,
        async () => process.env.PUPPETEER_EXECUTABLE_PATH, () => ({ kill() {} }), delay,
        async () => [{ url, webSocketDebuggerUrl: "owned-cdp-session" }], CDPAdapter, path, log);
      assert.ok(lines.some(line => line.includes("ALL VERIFICATION TESTS PASSED")), "Original completion marker");
      return { status: "PASS", suite: target.suite, assertions: "Entire original raw-CDP function completed unchanged" };
    }
    const adapter = { executablePath: () => process.env.PUPPETEER_EXECUTABLE_PATH,
      launch: async () => ({ newPage: () => context.newPage(), close: async () => {} }) };
    const end = source.lastIndexOf("\nrunVerification().catch");
    assert.ok(end > 0);
    const adapted = source.slice(0, end).replace("const BASE_URL = `http://localhost:${TEST_PORT}/`;", "const BASE_URL = " + JSON.stringify(url + "/") + ";");
    assert.notEqual(adapted, source.slice(0, end), "URL adaptation matched");
    // __dirname redirects screenshots, run log, and the original preview.png
    // side effect into ignored evidence; no assertion or client source changes.
    await new Function("require", "__dirname", "console", adapted + "\nreturn runVerification();")(
      n => n === "puppeteer-core" ? adapter : require(n), folder, log);
    const result = JSON.parse(fs.readFileSync(path.join(folder, "test/test_results.json")));
    const expected = ["test1_responsive_scaling", "test2_vane_locking", "test3_never_auto_fire",
      "test4_three_stage_activation", "test5_disengage_cycles", "test6_safety_interlock", "test7_quick_dial_preset"];
    assert.deepEqual(Object.keys(result.tests).sort(), [...expected].sort(), "All seven original predicates executed");
    for (const name of expected) assert.equal(result.tests[name].passed, true, name);
    assert.equal(result.allPassed, true);
    return { status: "PASS", suite: target.suite, assertions: Object.fromEntries(expected.map(name => [name, result.tests[name].passed])) };
  } finally {
    fs.writeFileSync(path.join(folder, "run.log"), lines.join("\n"));
    await context.close();
  }
}
async function supplemental(browser, target, url, folder, mode) {
  const context = await browser.createBrowserContext(), page = await context.newPage();
  const result = { pageErrors: [], resources: [], requestFailures: [], cycles: [] };
  page.on("pageerror", error => result.pageErrors.push(error.message));
  page.on("response", response => { if (response.status() >= 400) result.resources.push(response.url().replace(url, "ORIGIN") + ":" + response.status()); });
  page.on("requestfailed", req => result.requestFailures.push(req.url().replace(url, "ORIGIN")));
  const shot = async name => {
    const filename = target.name + "-" + mode + "-" + name;
    await page.screenshot({ path: path.join(folder, filename + ".png") });
    if (mode === "shared" && process.env.STARGATE_LOG_VISUALS === "1") {
      const data = await page.screenshot({ type: "jpeg", quality: 60, encoding: "base64" });
      for (let offset = 0; offset < data.length; offset += 16000)
        console.log("STARGATE_VISUAL " + filename + ".jpg " + offset + " " + data.slice(offset, offset + 16000));
    }
  };
  try {
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: "networkidle0" }); await shot("idle");
    if (target.kind === "cdp") {
      const snapshot = () => page.evaluate(() => ({
        counter: document.getElementById("address-counter").textContent.trim(),
        state: document.getElementById("tele-state").textContent.trim(),
        disabled: document.getElementById("btn-activate").disabled
      }));
      const selectors = await page.$$eval(".glyph-btn", (els, total) => els.slice(0, total).map(el => '.glyph-btn[data-glyph="' + el.dataset.glyph + '"]'), target.total);
      assert.equal(selectors.length, target.total);
      for (let cycle = 0; cycle < 2; cycle++) {
        for (const selector of selectors) { await click(page, selector); await delay(100); }
        await delay(1200); const ready = await snapshot();
        assert.ok(ready.counter.includes(target.total + " / " + target.total)); assert.equal(ready.disabled, false);
        assert.ok(!ready.state.includes(target.active), "Manual input must not auto-fire");
        await click(page, "#btn-activate");
        await page.waitForFunction(active => document.getElementById("tele-state").textContent.includes(active), {}, target.active);
        if (!cycle) await shot("active");
        const active = await snapshot(); await click(page, "#btn-disengage"); await delay(500);
        const idle = await snapshot(); assert.ok(idle.counter.includes("0 / " + target.total));
        assert.ok(!idle.state.includes(target.active));
        result.cycles.push({ ready, active, idle });
      }
      await shot("reset");
    }
    // Original suites remain the primary functional evidence for all targets.
    // Supplementary cycles above add elementFromPoint hit testing to raw CDP.
    assert.deepEqual(result.pageErrors, []);
    return result;
  } finally { await context.close(); }
}
async function qualify(browser, target, mode) {
  const selection = selectExhibit(target.name);
  const folder = path.join(OUTPUT, target.name, mode); fs.mkdirSync(folder, { recursive: true });
  const server = mode === "legacy" ? await legacy({ name: target.name, server: "server.js" })
    : await startPreview({ ...selection, port: 0 });
  const result = { exhibit: target.name, mode, assets: 0, security: [] };
  try {
    for (const file of selection.files) {
      const response = await request(server.url, "/" + file);
      assert.equal(response.status, 200, file);
      assert.deepEqual(response.body, fs.readFileSync(path.join(selection.root, file))); result.assets++;
    }
    for (const [method, url, file] of probes(target)) {
      const response = await request(server.url, url, method);
      assert.equal(response.status, mode === "legacy" ? 200 : method === "POST" ? 405 : 403);
      if (mode === "legacy") assert.deepEqual(response.body, fs.readFileSync(path.join(selection.root, file)));
      result.security.push({ method, url, status: response.status });
    }
    result.original = await runOriginal(browser, target, server.url, path.join(folder, "original"));
    result.browser = await supplemental(browser, target, server.url, folder, mode);
    result.status = "PASS";
    result.acceptance = "Server preservation only; operator and acoustic acceptance are not inferred.";
    return result;
  } catch (error) { result.status = "FAIL"; result.error = error.stack; throw error; }
  finally {
    fs.writeFileSync(path.join(folder, "result.json"), JSON.stringify(result, null, 2));
    console.log("SCIENCE_RESULT " + JSON.stringify(result)); await server.close();
  }
}
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const requested = process.argv.slice(2).filter(arg => arg !== "--offline");
  const targets = requested.length ? TARGETS.filter(target => requested.includes(target.name)) : TARGETS;
  assert.equal(targets.length, requested.length || TARGETS.length, "Unknown or duplicate target");
  if (process.argv.includes("--offline")) {
    const result = [];
    for (const target of targets) { original(target); result.push(await offline(target)); }
    fs.writeFileSync(path.join(OUTPUT, "offline.json"), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2)); return;
  }
  const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE);
  const browser = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, headless: true });
  try {
    for (const target of targets) {
      const before = await qualify(browser, target, "legacy"), after = await qualify(browser, target, "shared");
      assert.deepEqual(after.original, before.original);
      assert.deepEqual(after.browser.cycles, before.browser.cycles);
      for (const key of ["resources", "requestFailures"])
        assert.deepEqual([...new Set(after.browser[key])].sort(), [...new Set(before.browser[key])].sort(), key);
      console.log("SCIENCE_PRESERVATION PASS " + target.name);
    }
  } finally { await browser.close(); }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });

