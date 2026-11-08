"use strict";
// Each original suite is preserved byte-for-byte in its exhibit. This adapter owns
// only HTTP listeners, browser contexts and ignored evidence destinations.
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const http = require("node:http"), vm = require("node:vm"), { Writable } = require("node:stream");
const { execFileSync } = require("node:child_process");
const { request, click } = require("./browser-check-helpers.js");
const { selectExhibit, startPreview } = require("./preview.js");
const ROOT = path.resolve(__dirname, ".."), OUTPUT = path.join(ROOT, "test/instrument-security");
const BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const TARGETS = [
  { kind: "caissa", name: "stargate_caissa_workstation", suite: "test_workstation.cjs", server: "server.js", entry: "runTests", originalURL: "http://127.0.0.1:8085/", completion: "ALL AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY", phases: 9, ready: "LINE_PENDING_COMMIT", active: "STAGE_SUSTAINED", idle: "IDLE", open: "#commit-line-btn", stop: "#resign-line-btn", manual: ["e4", "d4", "Nf3", "Bc4", "Qh5", "Rxd5", "Qxf7"].map(n => "#move-btn-" + n) },
  { kind: "cyber", name: "stargate_cyberpunk_gemini", suite: "test/test-suite.js", server: "server.js", entry: "runTestSuite", originalURL: "http://127.0.0.1:8080/", completion: "ALL AUTOMATED TESTS COMPLETED SUCCESSFULLY", phases: 12, ready: "pending", active: "active", idle: "idle", open: "#btn-execute", stop: "#btn-purge", manual: Array.from({ length: 7 }, (_, n) => "#btn-vector-" + n) },
  { kind: "dome", name: "stargate_fulldome_planetarium", suite: "scripts/verify_e2e.js", server: "scripts/server.js", entry: "runVerification", originalURL: "http://localhost:8092", completion: "ALL VERIFICATION CHECKS PASSED SUCCESSFULLY", phases: 10, ready: "PENDING", active: "ACTIVE", idle: "IDLE", open: "#btn-zenith-ignition", stop: "#btn-dome-abort", manual: ["apx", "crn", "plh", "lyr", "cas"].map(n => "#sector-node-" + n) },
  { kind: "seismic", name: "stargate_seismic_triangulation", suite: "scripts/verify.js", server: "scripts/server.js", entry: "runVerification", originalURL: "http://127.0.0.1:8090/index.html", completion: "VERIFICATION CHECKS PASSED PERFECTLY", phases: 8, ready: "PENDING", active: "ACTIVE", idle: "IDLE", open: "#establish-link-btn", stop: "#disengage-network-btn", manual: Array.from({ length: 7 }, (_, n) => "#station-tile-" + n) },
  { kind: "ukiyo", name: "stargate_ukiyo_waystation", suite: "scripts/test_e2e.js", server: "scripts/server.js", entry: "runE2ETests", originalURL: "http://localhost:8742", completion: "ALL E2E TESTS PASSED PERFECTLY (14/14)", phases: 10, ready: "PENDING", active: "STAGE_3_SUSTAINED", idle: "IDLE", open: "#btn-activate", stop: "#btn-disengage", manual: Array.from({ length: 7 }, (_, n) => '.station-pad-btn[data-index="' + n + '"]') }
];
function historical(target, file) { return execFileSync("git", ["show", BASE + ":" + target.name + "/" + file], { cwd: ROOT, encoding: "utf8" }); }
function evaluateHandler(target, intercepted) {
  vm.runInNewContext(historical(target, target.server), { require: n => n === "http" ? intercepted : require(n),
    __dirname: path.dirname(path.join(ROOT, target.name, target.server)), URL, console: { log() {}, error() {} }, process: { env: {}, on() {} } });
}
function oldTransport(target) {
  return new Promise((resolve, reject) => {
    evaluateHandler(target, { ...http, createServer(handler) {
      const server = http.createServer(handler); server.once("error", reject);
      server.listen = () => {
        http.Server.prototype.listen.call(server, 0, "127.0.0.1", () => resolve({ url: "http://127.0.0.1:" + server.address().port,
          close: () => new Promise(done => { server.close(done); server.closeAllConnections(); }) })); return server;
      }; return server;
    } });
  });
}
function probes(target) { return [["GET", "/" + target.server, target.server], ["GET", "/" + target.suite, target.suite], ["GET", "/package.json", "package.json"], ["POST", "/", "index.html"]]; }
async function offline(target) {
  let handler, binding; const stub = { listen(...args) { binding = args.filter(a => typeof a !== "function"); return stub; }, on() { return stub; }, close() {} };
  evaluateHandler(target, { createServer(fn) { handler = fn; return stub; } });
  const results = [];
  for (const [method, url, file] of probes(target)) {
    const value = await new Promise((resolve, reject) => {
      const chunks = []; const out = new Writable({ write(c, e, done) { chunks.push(Buffer.from(c)); done(); } });
      out.statusCode = 200; out.setHeader = () => {}; out.writeHead = status => { out.statusCode = status; return out; };
      out.on("error", reject); out.on("finish", () => resolve({ status: out.statusCode, body: Buffer.concat(chunks) }));
      try { handler({ method, url, headers: { host: "localhost" } }, out); } catch (e) { reject(e); }
    });
    assert.equal(value.status, 200); assert.deepEqual(value.body, fs.readFileSync(path.join(ROOT, target.name, file)));
    results.push({ method, url, status: value.status, exactTargetBytes: true });
  }
  return { exhibit: target.name, binding, probes: results, scope: "Offline original handler with intercepted listener and real read-only files; not HTTP/browser acceptance" };
}
async function originalSuite(browser, target, url, output) {
  const source = historical(target, target.suite), originalPath = path.join(ROOT, target.name, target.suite);
  assert.equal(fs.readFileSync(originalPath, "utf8").replace(/\r\n/g, "\n"), source.replace(/\r\n/g, "\n"), "Original suite unchanged: " + target.name);
  const context = await browser.createBrowserContext(), lines = [], errors = [];
  fs.mkdirSync(output, { recursive: true });
  const log = (...v) => lines.push(v.map(x => typeof x === "object" ? JSON.stringify(x) : String(x)).join(" "));
  const end = source.lastIndexOf("\n" + target.entry + "()"); assert.ok(end > 0);
  let adapted = source.slice(0, end).replace(target.originalURL, url + (target.originalURL.endsWith("/index.html") ? "/index.html" : target.originalURL.endsWith("/") ? "/" : ""))
    .replace(/^const SCREENSHOT_DIR = .*;$/m, "const SCREENSHOT_DIR = " + JSON.stringify(output) + ";");
  assert.notEqual(adapted, source.slice(0, end));
  const adapter = { executablePath: () => process.env.PUPPETEER_EXECUTABLE_PATH,
    launch: async () => ({ newPage: async () => {
      const page = await context.newPage();
      if (target.kind === "cyber") await page.evaluateOnNewDocument(() => {
        const events = window.__stargateQualificationEvents = [];
        const observe = (event, phase) => {
          const vector = event.target?.closest?.('.vector-btn');
          events.push({ type: event.type, phase, vector: vector?.id || null, target: event.target?.id,
            x: event.clientX, y: event.clientY, at: performance.now(), trusted: event.isTrusted, viewport: [innerWidth, innerHeight],
            address: [...(window.CipherDialer?.currentAddress || [])], stage: window.CipherDialer?.stage,
            scale: getComputedStyle(document.documentElement).getPropertyValue('--app-scale').trim() });
        };
        for (const type of ['pointerdown', 'pointerup', 'click']) {
          document.addEventListener(type, event => observe(event, 'capture'), { capture: true, passive: true });
          document.addEventListener(type, event => observe(event, 'bubble'), { passive: true });
        }
        window.addEventListener('error', event => events.push({ type: 'error', message: event.message, at: performance.now() }));
        window.addEventListener('unhandledrejection', event => events.push({ type: 'unhandledrejection', message: String(event.reason), at: performance.now() }));
      });
      return page;
    }, close: async () => {} }) };
  try {
    await new Function("require", "__dirname", "console", "process", adapted + "\nreturn " + target.entry + "();")(
      n => ["puppeteer", "puppeteer-core"].includes(n) ? adapter : require(n), path.dirname(originalPath),
      { log, warn: log, error: (...v) => { errors.push(v.map(String).join(" ")); log(...v); } },
      { env: process.env, exit(code) { throw new Error("Original suite attempted process.exit(" + code + ")"); } });
    assert.deepEqual(errors, [], "Original suite swallowed no errors");
    assert.ok(lines.some(line => line.includes(target.completion)), "Original completion marker: " + target.name);
    const result = { status: "PASS", suite: target.suite, phases: target.phases, note: "Entire original function and predicates retained; historical handler serves current client assets. Operator, sound and visual acceptance remain separate." };
    if (target.kind === "cyber") {
      const records = lines.filter(line => /^\[(?:PASS|FAIL)\]/.test(line)); assert.equal(records.length, 17, "All seventeen original predicates execute");
      assert.ok(records.every(line => line.startsWith("[PASS]")), "All original recorded predicates pass"); result.predicates = records.map(line => line.slice(0, line.indexOf(": ")));
    }
    if (target.kind === "seismic") {
      const records = lines.filter(line => /^\[TEST\]/.test(line)); assert.equal(records.length, 30, "All thirty original predicates execute");
      assert.ok(records.every(line => line.includes("✓ PASS"))); result.predicates = records.map(line => line.replace(/ \([^]*$/, ""));
    }
    if (target.kind === "caissa") {
      const records = lines.map(line => { try { return JSON.parse(line); } catch { return null; } }).find(v => Array.isArray(v) && v.length === 12 && v.every(x => x.status === "PASSED"));
      assert.ok(records, "All twelve original completion records execute"); result.records = records.map(x => x.test);
    }
    return result;
  } catch (error) {
    console.log("INSTRUMENT_ORIGINAL_FAILURE " + JSON.stringify({ exhibit: target.name, output: path.relative(ROOT, output), error: error.message, records: lines.filter(line => /^\[(?:PASS|FAIL|TEST)\]/.test(line)), logTail: lines.slice(-12) }));
    throw error;
  } finally {
    fs.writeFileSync(path.join(output, "run.log"), lines.join("\n"));
    try {
      if (target.kind === "cyber") for (const page of await context.pages()) {
        const events = await page.evaluate(() => window.__stargateQualificationEvents || []);
        fs.writeFileSync(path.join(output, "pointer-events.json"), JSON.stringify(events, null, 2));
        console.log("CYBER_ORIGINAL_POINTER_TRACE " + JSON.stringify({ output: path.relative(ROOT, output), events }));
      }
    } finally { await context.close(); }
  }
}
async function snapshot(page, kind) {
  return page.evaluate(kind => {
    if (kind === "caissa") return { state: window.CaissaState.status, count: window.CaissaState.history.length };
    if (kind === "cyber") return { state: window.CipherDialer.stage, count: window.CipherDialer.currentAddress.length };
    if (kind === "dome") return { state: window.vxdApp.state, count: Number(document.getElementById("buffer-count").textContent) };
    if (kind === "seismic") return { state: window.controlSystem.state, count: window.controlSystem.lockedStations.length };
    return { state: window.PortalController.state, count: window.PortalController.lockedStations.length };
  }, kind);
}
async function supplemental(browser, target, url, folder, mode) {
  const context = await browser.createBrowserContext(), page = await context.newPage();
  const result = { pageErrors: [], resources: [], requestFailures: [], cycles: [] };
  page.on("pageerror", e => result.pageErrors.push(e.message));
  page.on("response", r => { if (r.status() >= 400) result.resources.push(r.url().replace(url, "ORIGIN") + ":" + r.status()); });
  page.on("requestfailed", r => result.requestFailures.push(r.url().replace(url, "ORIGIN")));
  const shot = async name => {
    const filename = target.name + "-" + mode + "-" + name;
    await page.screenshot({ path: path.join(folder, filename + ".png") });
    if (mode === "shared" && process.env.STARGATE_LOG_VISUALS === "1") {
      const data = await page.screenshot({ type: "jpeg", quality: 60, encoding: "base64" });
      for (let offset = 0; offset < data.length; offset += 16000) console.log("STARGATE_VISUAL " + filename + ".jpg " + offset + " " + data.slice(offset, offset + 16000));
    }
  };
  const until = async predicate => {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) { const s = await snapshot(page, target.kind); if (predicate(s)) return s; await delay(80); }
    throw new Error("State wait failed: " + JSON.stringify(await snapshot(page, target.kind)));
  };
  try {
    await page.setViewport({ width: 1920, height: 1080 }); await page.goto(url, { waitUntil: "networkidle0" });
    result.initial = await snapshot(page, target.kind); assert.equal(result.initial.state, target.idle); assert.equal(result.initial.count, 0); await shot("idle");
    for (let cycle = 0; cycle < 2; cycle++) {
      for (let n = 0; n < target.manual.length; n++) { await click(page, target.manual[n]); await until(s => s.count === n + 1); }
      await delay(1200); const ready = await snapshot(page, target.kind); assert.equal(ready.state, target.ready); assert.equal(ready.count, target.manual.length);
      if (!cycle) await shot("ready");
      await click(page, target.open); const active = await until(s => s.state === target.active); if (!cycle) await shot("active");
      await click(page, target.stop); const stopped = await until(s => s.state === target.idle && s.count === 0);
      result.cycles.push({ ready, active, stopped });
    }
    // Observe activation cancellation independently of original suite coverage.
    for (let n = 0; n < target.manual.length; n++) { await click(page, target.manual[n]); await until(s => s.count === n + 1); }
    await click(page, target.open); await delay(300); await click(page, target.stop); await delay(8250);
    result.cancelled = await snapshot(page, target.kind); await shot("cancelled");
    result.functionalAcceptance = result.cancelled.state === target.idle && result.cancelled.count === 0 ? "UNVERIFIED: bounded interactions pass; operator and sound acceptance separate" : "FAIL: cancellation does not remain idle; preserved observation requires separate diagnosis";
    assert.deepEqual(result.pageErrors, []); assert.deepEqual(result.requestFailures, []);
    return result;
  } finally { await context.close(); }
}
async function qualify(browser, target, mode) {
  const folder = path.join(OUTPUT, target.name, mode); fs.mkdirSync(folder, { recursive: true });
  const selection = selectExhibit(target.name), result = { exhibit: target.name, mode, assets: 0, security: [] };
  const server = mode === "legacy" ? await oldTransport(target) : await startPreview({ ...selection, port: 0 });
  try {
    for (const file of selection.files) { const r = await request(server.url, "/" + file); assert.equal(r.status, 200, file); assert.deepEqual(r.body, fs.readFileSync(path.join(ROOT, target.name, file))); result.assets++; }
    for (const [method, url, file] of probes(target)) {
      const r = await request(server.url, url, method); assert.equal(r.status, mode === "legacy" ? 200 : method === "POST" ? 405 : 403);
      if (mode === "legacy") assert.deepEqual(r.body, fs.readFileSync(path.join(ROOT, target.name, file)));
      result.security.push({ method, url, status: r.status });
    }
    result.original = await originalSuite(browser, target, server.url, path.join(folder, "original"));
    result.supplemental = await supplemental(browser, target, server.url, folder, mode); result.status = "PASS"; return result;
  } catch (e) { result.status = "FAIL"; result.error = e.stack; throw e; }
  finally { fs.writeFileSync(path.join(folder, "result.json"), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result)); await server.close(); }
}
async function main(args = process.argv.slice(2)) {
  fs.mkdirSync(OUTPUT, { recursive: true }); const selected = [];
  for (let i = 0; i < args.length; i++) if (args[i] === "--exhibit") { const name = args[++i]; const target = TARGETS.find(t => t.name === name); assert.ok(target, "Unknown exhibit: " + name); selected.push(target); } else assert.equal(args[i], "--offline", "Unknown argument");
  const targets = selected.length ? selected : TARGETS;
  if (args.includes("--offline")) { const results = []; for (const target of targets) results.push(await offline(target)); fs.writeFileSync(path.join(OUTPUT, "offline.json"), JSON.stringify(results, null, 2)); console.log(JSON.stringify(results)); return; }
  const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer"), browser = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, headless: true }); const reports = [];
  try {
    for (const target of targets) {
      try {
        const modes = {}, failures = [];
        for (const mode of ["legacy", "shared"]) {
          try { modes[mode] = await qualify(browser, target, mode); }
          catch (error) { failures.push(mode + ": " + error.message); }
        }
        assert.deepEqual(failures, [], "Both comparison modes must pass; each failed mode retains its original evidence");
        const legacyTransport = modes.legacy, shared = modes.shared;
        assert.deepEqual(shared.original, legacyTransport.original);
        for (const key of ["initial", "cycles", "cancelled", "functionalAcceptance"]) assert.deepEqual(shared.supplemental[key], legacyTransport.supplemental[key], target.name + " " + key);
        for (const key of ["resources", "requestFailures"]) assert.deepEqual([...new Set(shared.supplemental[key])].sort(), [...new Set(legacyTransport.supplemental[key])].sort());
        reports.push({ exhibit: target.name, status: "PASS" });
      } catch (e) { reports.push({ exhibit: target.name, status: "FAIL", error: e.stack }); }
    }
    fs.writeFileSync(path.join(OUTPUT, "summary.json"), JSON.stringify(reports, null, 2)); console.log("INSTRUMENT_PRESERVATION " + JSON.stringify(reports));
    assert.ok(reports.every(r => r.status === "PASS"), "Instrument qualification failures remain");
  } finally { await browser.close(); }
}
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
