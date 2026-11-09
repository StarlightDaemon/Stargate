"use strict";
// Saved-inventory coverage closure. Absence of assertions is never a suite pass.
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const { execFileSync } = require("node:child_process"), { createRequire } = require("node:module");
const { selectExhibit, startPreview } = require("./preview.js"), { request } = require("./browser-check-helpers.js");
const ROOT = path.resolve(__dirname, ".."), OUTPUT = path.join(ROOT, "test/remaining-harnesses"), BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const TARGETS = [
  { name: "stargate_celestial_astrolabe", file: "test_e2e.js", kind: "cdp-observations", completion: "ALL TESTS COMPLETED SUCCESSFULLY!", scope: "original-observational-harness" },
  { name: "stargate_darkpool_router", file: "tests/test_suite.js", kind: "cjs", entry: "runTestSuite", completion: "ALL VALENCE-9 VERIFICATION TESTS PASSED PERFECTLY!", scope: "original-suite" },
  { name: "stargate_lumina_grove", file: "puppeteer_test.js", kind: "iife", completion: "SUCCESS: Completed 2 full cycles cleanly.", scope: "original-suite" },
  { name: "stargate_high_scifi", file: "js/selftest.js", kind: "diagnostic", scope: "original-diagnostic-with-supplementary-guards" },
  { name: "stargate_aetheric_telegraph", file: "test_env.js", kind: "environment", completion: "Puppeteer successfully loaded!", scope: "dependency-load-smoke" },
  { name: "stargate_bibliographic_depository", file: "test_simulated_browser.js", kind: "scaffold", completion: "Simulated Browser Logic Tests Complete", scope: "unused-mock-scaffold-only" },
  { name: "stargate_solarpunk_conservatory", file: "test/capture.mjs", kind: "capture", completion: "wrote", scope: "original-preview-capture-tool" }
];
const NO_ORIGINAL_SUITES = ["aethergate", "astro_pavilion", "bureaucratic_mainframe", "heliacal_ring", "heliora_annulus", "high_magic", "meridian_ring", "modern", "retro", "rushlight_gemini"].map(name => "stargate_" + name);
function original(target) {
  const source = execFileSync("git", ["show", BASE + ":" + target.name + "/" + target.file], { cwd: ROOT, encoding: "utf8" });
  assert.equal(source.replace(/\r\n/g, "\n"), fs.readFileSync(path.join(ROOT, target.name, target.file), "utf8").replace(/\r\n/g, "\n"), "Original harness unchanged: " + target.name);
  return source;
}
function artifactIO(target, folder) {
  const exhibit = path.join(ROOT, target.name), roots = ["test", "screenshots", "test_screenshots"].map(dir => path.join(exhibit, dir));
  const inside = (root, file) => { const rel = path.relative(root, file); return rel === "" || rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel); };
  const mapped = file => { const absolute = path.resolve(file), index = roots.findIndex(root => inside(root, absolute)); return index < 0 ? absolute : path.join(folder, "artifacts-" + index, path.relative(roots[index], absolute)); };
  const safe = file => { const output = mapped(file); assert.ok(inside(folder, output), "Harness artifact must remain in ignored evidence"); return output; };
  return { safe, io: { ...fs,
    existsSync: file => fs.existsSync(mapped(file)), readFileSync: (file, ...args) => fs.readFileSync(mapped(file), ...args),
    mkdirSync: (file, ...args) => fs.mkdirSync(safe(file), ...args),
    writeFileSync: (file, ...args) => { const output = safe(file); fs.mkdirSync(path.dirname(output), { recursive: true }); return fs.writeFileSync(output, ...args); }
  } };
}
function compile(target, url) {
  let source = original(target);
  if (target.kind === "cdp-observations") {
    const start = source.indexOf("async function run() {"), end = source.lastIndexOf("\nrun();"); assert.ok(start > 0 && end > start);
    return new Function("resolveChrome", "spawn", "PORT", "path", "os", "sleep", "fetchJson", "CDPClient", "console", source.slice(start, end) + "\nreturn run();");
  }
  if (target.kind === "diagnostic") return null; // Executed by its unchanged browser module.
  source = source.replace(/http:\/\/(?:localhost|127\.0\.0\.1):\d+/g, url)
    .replace(/^import (.+?) from ['"](.+?)['"];?\r?$/gm, "const $1 = require('$2');");
  if (target.kind === "cjs") { const end = source.lastIndexOf("\n" + target.entry + "();"); assert.ok(end > 0); source = source.slice(0, end) + "\nreturn " + target.entry + "();"; }
  if (target.kind === "iife") { assert.ok(source.includes("(async () => {")); source = source.replace("(async () => {", "return (async () => {"); }
  const Constructor = target.kind === "capture" ? Object.getPrototypeOf(async function() {}).constructor : Function;
  return new Constructor("require", "__dirname", "process", "console", source);
}
async function emitVisuals(context, target, folder) {
  if (process.env.STARGATE_LOG_VISUALS !== "1") return;
  const files = fs.readdirSync(folder, { recursive: true }).filter(file => /\.png$/.test(file) && !/4k|3840/.test(file)).slice(0, 8), page = await context.newPage();
  try {
    for (const file of files) {
      const value = await page.evaluate(async data => {
        const img = new Image(); img.src = "data:image/png;base64," + data; await img.decode();
        const canvas = document.createElement("canvas"), scale = Math.min(1, 1280 / img.width); canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height); return canvas.toDataURL("image/jpeg", 0.65).split(",")[1];
      }, fs.readFileSync(path.join(folder, file)).toString("base64"));
      const name = target.name + "-remaining-" + path.basename(file, ".png") + ".jpg";
      for (let offset = 0; offset < value.length; offset += 16000) console.log("STARGATE_VISUAL " + name + " " + offset + " " + value.slice(offset, offset + 16000));
    }
  } finally { await page.close(); }
}
async function diagnostic(page, url, folder) {
  await page.setViewport({ width: 1920, height: 1080 }); await page.goto(url, { waitUntil: "networkidle0" }); await delay(2000);
  const initial = await page.evaluate(() => ({ phase: window.__meridian.dialer.phase, badgeHidden: document.getElementById("diagBadge").hidden }));
  assert.deepEqual(initial, { phase: "idle", badgeHidden: true }, "Normal visitor must not auto-run diagnostics");
  await page.screenshot({ path: path.join(folder, "diagnostic-idle.png") });
  const result = await page.evaluate(async () => {
    const phases = [], dialer = window.__meridian.dialer, listen = event => phases.push(event.detail.phase);
    dialer.addEventListener("state", listen);
    try { await window.__meridian.diag(); return { phases, phase: dialer.phase, badgeHidden: document.getElementById("diagBadge").hidden, cached: dialer.cache.has("halcyon") }; }
    finally { dialer.removeEventListener("state", listen); }
  });
  assert.deepEqual(result.phases, ["solve", "open", "collapse", "idle", "recall", "open", "collapse", "idle"]);
  assert.equal(result.phase, "idle"); assert.equal(result.badgeHidden, true); assert.equal(result.cached, true);
  await page.screenshot({ path: path.join(folder, "diagnostic-complete.png") });
  return { initial, result, status: "PASS", scope: "Supplementary observations around unchanged original opt-in diagnostic; not an original assertion suite" };
}
async function qualify(browser, target) {
  const folder = path.join(OUTPUT, target.name); fs.mkdirSync(folder, { recursive: true });
  const source = original(target), toolsOnly = ["environment", "scaffold"].includes(target.kind);
  const result = { exhibit: target.name, mode: toolsOnly ? "tooling" : "shared", scope: target.scope, status: "FAIL", originalSuiteStatus: "UNVERIFIED", acceptanceStatus: "UNVERIFIED", sourceSHA256: crypto.createHash("sha256").update(source).digest("hex"), pageErrors: [], resources: [] };
  const lines = [], errors = [], format = values => values.map(value => value?.stack || (typeof value === "object" ? JSON.stringify(value) : String(value))).join(" ");
  const log = { log: (...values) => lines.push(format(values)), warn: (...values) => lines.push(format(values)), error: (...values) => { errors.push(format(values)); lines.push(format(values)); } };
  const artifacts = artifactIO(target, folder), loadFromTarget = createRequire(path.join(ROOT, target.name, target.file));
  const processAdapter = { env: process.env, argv: [process.execPath, target.file, path.join(folder, "captured-preview.png")], cwd: () => path.join(ROOT, target.name), exitCode: 0, exit(code) { this.exitCode = code; throw new Error("Original process.exit(" + code + ")"); } };
  let server, context, timer;
  try {
    const execute = async () => {
      if (toolsOnly) {
        compile(target, "http://127.0.0.1:0")(loadFromTarget, path.dirname(path.join(ROOT, target.name, target.file)), processAdapter, log);
        assert.ok(lines.some(line => line.includes(target.completion)), "Original tooling completion");
        assert.ok(!lines.some(line => line.includes("load error"))); return;
      }
      const selection = selectExhibit(target.name); server = await startPreview({ ...selection, port: 0 }); context = await browser.createBrowserContext();
      result.assets = 0;
      for (const file of selection.files) { const response = await request(server.url, "/" + file); assert.equal(response.status, 200); assert.deepEqual(response.body, fs.readFileSync(path.join(selection.root, file))); result.assets++; }
      result.security = [];
      for (const [route, method, status] of [["/README.md", "GET", 403], ["/", "POST", 405], ["/%ZZ", "GET", 400], ...(!selection.files.includes(target.file) ? [["/" + target.file, "GET", 403]] : [])]) {
        const response = await request(server.url, route, method); assert.equal(response.status, status); result.security.push({ route, method, status });
      }
      const newPage = async () => {
        const page = await context.newPage(), screenshot = page.screenshot.bind(page);
        page.on("pageerror", error => result.pageErrors.push(error.message));
        page.on("response", response => { if (response.status() >= 400) result.resources.push(response.url().replace(server.url, "ORIGIN") + ":" + response.status()); });
        page.screenshot = options => { if (options?.path) { const file = artifacts.safe(options.path); fs.mkdirSync(path.dirname(file), { recursive: true }); options = { ...options, path: file }; } return screenshot(options); };
        return page;
      };
      if (target.kind === "diagnostic") { result.supplementary = await diagnostic(await newPage(), server.url, folder); return; }
      if (target.kind === "cdp-observations") {
        const page = await newPage(); await page.goto(server.url, { waitUntil: "networkidle0" }); const session = await page.createCDPSession();
        const start = source.indexOf("class CDPClient {"), end = source.indexOf("async function run() {"); assert.ok(start > 0 && end > start);
        const OriginalClient = new Function("ARTIFACT_DIR", "fs", "path", "console", "WebSocket", source.slice(start, end) + "\nreturn CDPClient;")(folder, artifacts.io, path, log, class { constructor() { throw new Error("CDP websocket owned by adapter"); } });
        class OwnedClient extends OriginalClient {
          async connect() {
            this.ws = {};
            for (const method of ["Runtime.consoleAPICalled", "Runtime.exceptionThrown"]) session.on(method, params => this.ws.onmessage?.({ data: JSON.stringify({ method, params }) }));
          }
          send(method, params = {}) { return session.send(method, params); }
        }
        // Execute the full original run() body and original eval/click/capture
        // implementations. Only process/CDP discovery and transport are owned here.
        await compile(target)(async () => process.env.PUPPETEER_EXECUTABLE_PATH, () => ({ kill() {} }), 0, path, { tmpdir: () => folder }, delay,
          async () => [{ type: "page", webSocketDebuggerUrl: "owned-session" }], OwnedClient, log);
        result.phases = lines.filter(line => /^--- Step \d+:/.test(line)).length; assert.equal(result.phases, 11, "All eleven original observational phases");
      } else {
        const puppeteer = { executablePath: () => process.env.PUPPETEER_EXECUTABLE_PATH, launch: async () => ({ newPage, close: async () => {} }) };
        const load = name => ["puppeteer", "puppeteer-core"].includes(name) ? puppeteer : ["fs", "node:fs"].includes(name) ? artifacts.io : loadFromTarget(name);
        processAdapter.env = { ...process.env, URL: server.url + "/" };
        await compile(target, server.url)(load, path.dirname(path.join(ROOT, target.name, target.file)), processAdapter, log);
        if (target.kind === "iife") assert.equal(lines.filter(line => /^Cycle [12] completed cleanly\./.test(line)).length, 2);
        if (target.kind === "capture") assert.ok(fs.existsSync(path.join(folder, "captured-preview.png")), "Original capture output exists");
      }
      assert.ok(lines.some(line => line.includes(target.completion)), "Complete original harness marker");
    };
    await Promise.race([execute(), new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error("Harness exceeded 180s bound")), 180000); })]);
    assert.equal(processAdapter.exitCode, 0); assert.deepEqual(errors, [], "Original harness swallowed no errors"); assert.deepEqual(result.pageErrors, []); assert.deepEqual(result.resources, []);
    result.status = "PASS"; if (target.scope === "original-suite") result.originalSuiteStatus = "PASS";
  } catch (error) { result.error = error.stack; if (target.scope === "original-suite") result.originalSuiteStatus = "FAIL"; }
  finally {
    clearTimeout(timer);
    if (context) { try { await emitVisuals(context, target, folder); } catch (error) { result.visualError = error.message; } await context.close(); }
    if (server) await server.close();
    fs.writeFileSync(path.join(folder, "run.log"), lines.join("\n") + "\n"); fs.writeFileSync(path.join(folder, "result.json"), JSON.stringify(result, null, 2)); console.log("REMAINING_HARNESS_RESULT " + JSON.stringify(result));
  }
  return result;
}
async function main(args = process.argv.slice(2)) {
  const names = args.filter(arg => arg !== "--offline"), targets = names.length ? TARGETS.filter(target => names.includes(target.name)) : TARGETS;
  assert.equal(targets.length, names.length || TARGETS.length, "Unknown or duplicate exact target"); fs.mkdirSync(OUTPUT, { recursive: true });
  const contracts = targets.map(target => { compile(target, "http://127.0.0.1:12345"); return { ...target, sourceSHA256: crypto.createHash("sha256").update(original(target)).digest("hex") }; });
  if (args.includes("--offline")) { const result = { status: "UNVERIFIED", scope: "Original source and adapter compilation only", contracts, absentOriginalSuites: NO_ORIGINAL_SUITES, historicalReportOnly: "stargate_bathyscaphe_pilot_fable/verify/report.md" }; fs.writeFileSync(path.join(OUTPUT, "offline.json"), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result)); return; }
  let browser;
  try {
    if (targets.some(target => !["environment", "scaffold"].includes(target.kind))) { const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer"); browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }); }
    const results = []; for (const target of targets) results.push(await qualify(browser, target));
    fs.writeFileSync(path.join(OUTPUT, "summary.json"), JSON.stringify({ contracts, results }, null, 2)); assert.ok(results.every(result => result.status === "PASS"), "Remaining harness execution failed");
  } finally { if (browser) await browser.close(); }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { TARGETS, NO_ORIGINAL_SUITES, compile, artifactIO };
