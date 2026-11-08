"use strict";
// Qualification only: original files/assertions are untouched. Package listeners,
// module loading, browser ownership and evidence destinations belong to this adapter.
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const { createRequire } = require("node:module"), { pathToFileURL } = require("node:url"), { execFileSync } = require("node:child_process");
const { request, click } = require("./browser-check-helpers.js"), { selectExhibit, startPreview } = require("./preview.js");
const { startOwnedVite, bounded } = require("./qualification-vite-process.js");
const { loadPage } = require("./browser-load.js");
const ROOT = path.resolve(__dirname, ".."), OUTPUT = path.join(ROOT, "test/package-entry-security"), BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const TARGETS = [
  { name: "stargate_cathedral_oculus", package: "http-server", command: "start", preset: "#preset-2", stop: "#btn-disengage", suites: [{ file: "tests/verify.js", entry: "runTests", server: "startServer", completion: "ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY", records: 32 }] },
  { name: "stargate_mastering_suite", package: "http-server", command: "start", preset: ".btn-quick-preset", stop: "#btn-feed-cut", suites: [{ file: "test_suite.js", entry: "runTests", completion: "ALL PUPPETEER RIGOROUS AUTOMATED TESTS PASSED CLEANLY" }] },
  { name: "stargate_blueprint_drafting", package: "vite", command: "start", preset: ".qd-btn", stop: "#btn-disengage", suites: [
    { file: "test.js", entry: "run", completion: "All tests passed successfully." },
    { file: "test_fix.js", entry: "run", completion: "All interactive tests passed successfully!", spawn: "python" },
    { file: "run_tests_with_vite.js", entry: "run", completion: "All tests passed successfully.", spawn: "npx.cmd" }
  ] },
  { name: "stargate_orthographic_cad", package: "vite", command: "dev", preset: ".preset-card-btn", stop: "#btn-disengage", suites: [{ file: "tests/e2e.test.mjs", entry: "runE2ETests", server: "startStaticServer", completion: "ALL TESTS PASSED:" }] },
  { name: "stargate_radio_interferometry", package: "vite", command: "dev", preset: "#preset-trappist1e", stop: "#disengage-btn", suites: [{ file: "test_e2e.mjs", entry: "runVerification", completion: "ALL END-TO-END VERIFICATION TESTS PASSED SUCCESSFULLY" }] },
  { name: "stargate_seti_deepscope", package: "vite", command: "dev", preset: "#preset-tgt-trappist1e", stop: "#btn-disengage", suites: [{ file: "test_e2e.js", entry: "runTests", completion: "ALL TESTS PASSED SUCCESSFULLY!" }] },
  { name: "stargate_seti_freeform", package: "vite", command: "dev", preset: ".preset-load-btn", stop: "#disengageBtn", suites: [{ file: "test_e2e.js", entry: "runE2ETests", completion: "ALL E2E TESTS COMPLETED WITH 100% SUCCESS!" }] }
];
function original(target, suite) {
  const source = execFileSync("git", ["show", BASE + ":" + target.name + "/" + suite.file], { cwd: ROOT, encoding: "utf8" });
  assert.equal(fs.readFileSync(path.join(ROOT, target.name, suite.file), "utf8").replace(/\r\n/g, "\n"), source.replace(/\r\n/g, "\n"), "Original suite unchanged: " + suite.file);
  return source;
}
function compiledSuite(target, suite, url) {
  let source = original(target, suite);
  const end = source.lastIndexOf("\n" + suite.entry + "()"); assert.ok(end > 0, "Original entry point");
  source = source.slice(0, end).replace(/^import (.+?) from ['"](.+?)['"];?\r?$/gm, "const $1 = require('$2');")
    .replaceAll("import.meta.url", "__suiteURL")
    .replace(/http:\/\/(?:localhost|127\.0\.0\.1):(?:\d+|\$\{(?:PORT|port)\})/g, url);
  // No assertion, timing, predicate or UI code is replaced.
  if (!/^const __dirname\s*=/m.test(source)) source = "const __dirname = __suiteDir;\n" + source;
  if (suite.server) source += "\n" + suite.server + " = __ownedServer;";
  return new Function("require", "__suiteURL", "__suiteDir", "console", "process", "__ownedServer", source + "\nreturn " + suite.entry + "();");
}
async function packageServer(target, folder, phase) {
  const root = path.join(ROOT, target.name), load = createRequire(path.join(root, "package.json"));
  const packageFile = load.resolve(target.package + "/package.json"), version = JSON.parse(fs.readFileSync(packageFile, "utf8")).version;
  if (target.package === "vite") {
    return { ...await startOwnedVite(target, packageFile, folder, phase), version };
  }
  const instance = load("http-server").createServer({ root, cache: -1 });
  await new Promise((resolve, reject) => { instance.server.once("error", reject); instance.listen(0, "127.0.0.1", resolve); });
  assert.equal(instance.server.address().address, "127.0.0.1");
  return { url: "http://127.0.0.1:" + instance.server.address().port, version,
    // http-server 14.1.1's wrapper close() drops callback arguments.
    close: () => closeOwnedHttpServer(instance.server) };
}
function closeOwnedHttpServer(server) {
  return new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections?.();
  });
}
function artifactIO(target, folder) {
  const exhibit = path.join(ROOT, target.name);
  const roots = ["test", "test_screenshots", "test_artifacts", "test-artifacts", "tests/screenshots"].map(name => path.join(exhibit, name));
  roots.push(path.join(ROOT, "test_screenshots"));
  const inside = (root, file) => { const rel = path.relative(root, file); return rel === "" || rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel); };
  const mapped = file => {
    const absolute = path.resolve(file);
    const index = roots.findIndex(root => inside(root, absolute));
    return index < 0 ? absolute : path.join(folder, "artifacts-" + index, path.relative(roots[index], absolute));
  };
  const safeWrite = file => { const output = mapped(file); assert.ok(inside(folder, output), "Artifact must remain in ignored evidence directory"); return output; };
  return { safeWrite, io: { ...fs,
    existsSync: file => fs.existsSync(mapped(file)), readFileSync: (file, ...args) => fs.readFileSync(mapped(file), ...args),
    mkdirSync: (file, ...args) => fs.mkdirSync(safeWrite(file), ...args),
    writeFileSync: (file, ...args) => fs.writeFileSync(safeWrite(file), ...args)
  } };
}
async function emitVisuals(context, target, suite, folder) {
  if (process.env.STARGATE_LOG_VISUALS !== "1") return;
  const files = fs.readdirSync(folder, { recursive: true }).filter(file => /\.png$/i.test(file) && !/4k|3840/.test(file)).slice(0, 8);
  const page = await context.newPage();
  try {
    for (const file of files) {
      const value = await page.evaluate(async base64 => {
        const img = new Image(); img.src = "data:image/png;base64," + base64; await img.decode();
        const canvas = document.createElement("canvas"), scale = Math.min(1, 1280 / img.width);
        canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height); return canvas.toDataURL("image/jpeg", 0.65).split(",")[1];
      }, fs.readFileSync(path.join(folder, file)).toString("base64"));
      const name = target.name + "-" + path.basename(path.dirname(folder)) + "-" + suite.file.replace(/[/.]/g, "-") + "-" + path.basename(file, ".png") + ".jpg";
      for (let offset = 0; offset < value.length; offset += 16000) console.log("STARGATE_VISUAL " + name + " " + offset + " " + value.slice(offset, offset + 16000));
    }
  } finally { await page.close(); }
}
async function runSuite(browser, target, suite, url, folder) {
  fs.mkdirSync(folder, { recursive: true });
  const context = await browser.createBrowserContext(), artifacts = artifactIO(target, folder), lines = [], errors = [], pageErrors = [], resources = [];
  const format = values => values.map(value => value?.stack || (typeof value === "object" ? JSON.stringify(value) : String(value))).join(" ");
  const log = { log: (...values) => lines.push(format(values)), warn: (...values) => lines.push(format(values)), error: (...values) => { errors.push(format(values)); lines.push(format(values)); } };
  const processAdapter = { env: process.env, cwd: () => path.join(ROOT, target.name), exitCode: 0, exit(code) { this.exitCode = code; throw new Error("Original process.exit(" + code + ")"); } };
  const puppeteer = { executablePath: () => process.env.PUPPETEER_EXECUTABLE_PATH, launch: async (options = {}) => ({
    async newPage() {
      const page = await context.newPage(), screenshot = page.screenshot.bind(page);
      if (options.defaultViewport != null) await page.setViewport(options.defaultViewport);
      if (target.name === "stargate_seti_freeform") {
        // Reuse the diagnosed load/observed-network-idle adapter from the 57-page
        // gate. Preserve the original 15s total deadline and every test assertion.
        const navigation = { goto: page.goto.bind(page), waitForNetworkIdle: page.waitForNetworkIdle.bind(page) };
        page.goto = (destination, options) => {
          assert.equal(options.waitUntil, "networkidle0"); assert.equal(options.timeout, 15000);
          return loadPage(navigation, destination, options.timeout);
        };
      }
      page.on("pageerror", error => pageErrors.push(error.message));
      page.on("response", response => { if (response.status() >= 400) resources.push(response.url().replace(url, "ORIGIN") + ":" + response.status()); });
      page.screenshot = options => {
        if (options?.path) { const file = artifacts.safeWrite(options.path); fs.mkdirSync(path.dirname(file), { recursive: true }); options = { ...options, path: file }; }
        return screenshot(options);
      };
      return page;
    }, close: async () => {}
  }) };
  const spawn = command => {
    assert.equal(command, suite.spawn, "Only the declared original transport process is adapted");
    return { stdout: { on(event, listener) { if (event === "data") queueMicrotask(() => listener(Buffer.from(url + "/"))); } }, stderr: { on() {} }, kill() {} };
  };
  const load = name => ["puppeteer", "puppeteer-core"].includes(name) ? puppeteer : name === "fs" ? artifacts.io : name === "child_process" ? { spawn } : require(name);
  const result = { suite: suite.file, sourceSHA256: crypto.createHash("sha256").update(original(target, suite)).digest("hex"), status: "FAIL", pageErrors, resources };
  if (target.name === "stargate_seti_freeform") result.navigationAdapter = "Load event plus observed 500ms network idle, within the unchanged original 15000ms deadline; no request/error suppression";
  let timer;
  try {
    await Promise.race([
      compiledSuite(target, suite, url)(load, pathToFileURL(path.join(ROOT, target.name, suite.file)).href, path.dirname(path.join(ROOT, target.name, suite.file)), log, processAdapter, async () => ({ close() {} })),
      new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error("Original suite exceeded 180s qualification bound")), 180000); })
    ]);
    assert.equal(processAdapter.exitCode, 0); assert.deepEqual(errors, [], "Original suite reported no errors");
    assert.deepEqual(pageErrors, [], "No browser exception"); assert.deepEqual(resources, [], "No HTTP loading errors");
    assert.ok(lines.some(line => line.includes(suite.completion)), "Full original completion marker");
    assert.ok(!lines.some(line => /^\[FAIL\]/.test(line)), "Original boolean records must all pass");
    if (suite.records) { const records = lines.filter(line => /^\[(?:PASS|FAIL)\]/.test(line)); assert.equal(records.length, suite.records, "All original record predicates ran"); result.records = records.length; }
    if (target.name === "stargate_orthographic_cad") {
      const summary = lines.join("\n").match(/ALL TESTS PASSED: (\d+) \/ (\d+)/); assert.ok(summary); assert.equal(summary[1], summary[2]); result.assertions = Number(summary[1]);
    }
    result.status = "PASS";
  } catch (error) {
    result.error = error.message;
    result.originalLogTail = lines.slice(-20).map(line => line.slice(0, 2000));
  }
  finally {
    clearTimeout(timer);
    try { await emitVisuals(context, target, suite, folder); } catch (error) { result.visualError = error.message; }
    fs.writeFileSync(path.join(folder, "run.log"), lines.join("\n") + "\n"); fs.writeFileSync(path.join(folder, "result.json"), JSON.stringify(result, null, 2)); await context.close();
  }
  return result;
}
async function state(page, name) {
  return page.evaluate(name => {
    if (name === "stargate_cathedral_oculus") return { state: document.getElementById("telem-state").textContent.trim(), count: document.querySelectorAll(".triforium-slot.filled").length };
    if (name === "stargate_blueprint_drafting") return { state: document.getElementById("drawing-status").textContent.trim(), count: document.querySelectorAll("#address-buffer span").length };
    if (name === "stargate_seti_deepscope") return { state: window.deepScopeApp.state, count: window.deepScopeApp.lockedCarriers.length, slots: document.querySelectorAll("#register-slots .reg-slot.filled").length, cycling: window.deepScopeApp.isAutoDialing };
    if (name === "stargate_seti_freeform") return { state: window.__APP__.systemState, count: window.__APP__.currentAddress.length, slots: document.querySelectorAll(".address-slot.filled").length, cycling: window.__APP__.isAutoDialing, dishActivity: document.querySelectorAll(".dish-card.scanning, .dish-card.locked, .dish-led.scanning, .dish-led.locked").length };
    const app = name === "stargate_mastering_suite" ? window.AxiomApp : name === "stargate_orthographic_cad" ? window.__STARGATE_CAD_APP.dialer
      : name === "stargate_radio_interferometry" ? window.__stargateConsole : name === "stargate_seti_deepscope" ? window.deepScopeApp : window.__APP__;
    return { state: app.state || app.systemState, count: (app.patchedChannels || app.currentAddress || app.address || app.lockedCarriers).length };
  }, name);
}
async function cancellation(browser, target, url, folder) {
  const context = await browser.createBrowserContext(), page = await context.newPage(), result = { status: "FAIL", pageErrors: [] };
  page.on("pageerror", error => result.pageErrors.push(error.message));
  try {
    await page.setViewport({ width: 1920, height: 1080 }); await loadPage(page, url, 30000);
    result.initial = await state(page, target.name);
    await click(page, target.preset); await delay(450); result.beforeCancel = await state(page, target.name);
    await click(page, target.stop); result.immediate = await state(page, target.name); await delay(8250);
    result.after8250ms = await state(page, target.name); await page.screenshot({ path: path.join(folder, "cancelled.png") });
    result.functionalAcceptance = result.after8250ms.state === result.initial.state && result.after8250ms.count === 0
      ? "UNVERIFIED: preset cancellation remains idle after 8.25s; full operator/sound acceptance separate"
      : "FAIL: preset cancellation does not remain idle after 8.25s";
    if (target.name === "stargate_seti_deepscope") {
      const idle = { state: "IDLE", count: 0, slots: 0, cycling: false };
      assert.deepEqual(result.immediate, idle, "Preset cancellation immediately clears state and register");
      assert.deepEqual(result.after8250ms, idle, "Preset cancellation stays clear after 8.25s");
      result.restartRaces = [];
      for (const cancelAfterMs of [25, 450]) {
        await click(page, target.preset); await delay(cancelAfterMs); await click(page, target.stop);
        const cancelled = await state(page, target.name);
        assert.deepEqual(cancelled, idle, "Repeated cancellation immediately clears the register");
        await click(page, target.preset);
        await page.waitForFunction(() => window.deepScopeApp.state === "PENDING" && window.deepScopeApp.lockedCarriers.length === 7 && !window.deepScopeApp.isAutoDialing, { timeout: 12000 });
        const restarted = await state(page, target.name);
        assert.deepEqual(restarted, { state: "PENDING", count: 7, slots: 7, cycling: false }, "Replacement preset completes exactly seven slots");
        assert.equal(await page.evaluate(() => new Set(window.deepScopeApp.lockedCarriers).size), 7, "No stale duplicate carrier from the cancelled sequence");
        await click(page, target.stop); await delay(8250);
        const after8250ms = await state(page, target.name);
        assert.deepEqual(after8250ms, idle, "Replacement preset flush remains idle after 8.25s");
        result.restartRaces.push({ cancelAfterMs, cancelled, restarted, after8250ms, status: "PASS" });
      }
      await page.screenshot({ path: path.join(folder, "cancel-restart-regression.png") });
    }
    if (target.name === "stargate_seti_freeform") {
      const idle = { state: "IDLE", count: 0, slots: 0, cycling: false, dishActivity: 0 };
      const manual = result.manualCancellation = { status: "FAIL", restarts: [] };
      await click(page, "#candidate-btn-1"); await delay(100);
      manual.before = await state(page, target.name);
      assert.equal(manual.before.count, 0, "Manual cancellation begins before any carrier commits");
      assert.ok(await page.evaluate(() => window.__APP__.coincidenceIntervals.size > 0), "Manual coincidence scan is actually pending before cancellation");
      await click(page, target.stop); manual.immediate = await state(page, target.name);
      assert.deepEqual(manual.immediate, idle, "Manual cancellation immediately resets state/register/dishes");
      await delay(8250); manual.after8250ms = await state(page, target.name);
      assert.deepEqual(manual.after8250ms, idle, "Cancelled coincidence callbacks cannot restore carrier or dish visuals");
      for (const [kind, cancelAfterMs] of [["manual", 25], ["preset", 100]]) {
        await click(page, "#candidate-btn-1"); await delay(cancelAfterMs);
        assert.ok(await page.evaluate(() => window.__APP__.coincidenceIntervals.size > 0), "Restart race cancels an in-flight manual scan");
        await click(page, target.stop);
        assert.deepEqual(await state(page, target.name), idle);
        await click(page, kind === "manual" ? "#candidate-btn-2" : target.preset);
        await page.waitForFunction(kind => kind === "manual"
          ? window.__APP__.currentAddress.length === 1 && window.__APP__.currentAddress[0] === 2
          : window.__APP__.systemState === "READY" && window.__APP__.currentAddress.length === 7 && !window.__APP__.isAutoDialing,
        { timeout: 12000 }, kind);
        const restarted = await state(page, target.name);
        assert.equal(restarted.slots, kind === "manual" ? 1 : 7);
        assert.equal(await page.evaluate(() => new Set(window.__APP__.currentAddress).size), kind === "manual" ? 1 : 7);
        await click(page, target.stop); await delay(8250);
        const after8250ms = await state(page, target.name); assert.deepEqual(after8250ms, idle);
        manual.restarts.push({ kind, cancelAfterMs, restarted, after8250ms, status: "PASS" });
      }
      manual.status = "PASS";
      await page.screenshot({ path: path.join(folder, "manual-cancel-restart-regression.png") });
    }
    assert.deepEqual(result.pageErrors, []); result.status = "PASS";
  } catch (error) {
    result.error = error.message;
    if (result.manualCancellation?.status === "FAIL") result.functionalAcceptance = "FAIL: manual cancellation/restart regression: " + error.message;
  }
  finally { await context.close(); }
  return result;
}
async function qualify(browser, target, mode) {
  const folder = path.join(OUTPUT, target.name, mode); fs.mkdirSync(folder, { recursive: true });
  const selection = selectExhibit(target.name), result = { exhibit: target.name, mode, status: "FAIL", assets: [], security: [], suites: [] };
  result.phases = [];
  const phase = (name, status, detail) => {
    const event = { name, status, detail, at: new Date().toISOString() };
    result.phases.push(event);
    // Partial evidence is always FAIL until all qualification and cleanup finish.
    fs.writeFileSync(path.join(folder, "result.json"), JSON.stringify({ ...result, status: "FAIL", complete: false }, null, 2));
    console.log("PACKAGE_ENTRY_PHASE " + JSON.stringify({ exhibit: target.name, mode, ...event }));
  };
  const closeListener = async () => {
    const owned = server; server = undefined;
    if (!owned) return;
    phase("listener-cleanup", "START");
    try { await bounded(owned.close(), 20000, "Listener cleanup"); phase("listener-cleanup", "PASS"); }
    catch (error) { phase("listener-cleanup", "FAIL", error.message); throw error; }
  };
  let server;
  try {
    phase("listener-startup", "START");
    server = mode === "legacy" ? await packageServer(target, folder, phase) : await startPreview({ ...selection, port: 0 });
    phase("listener-startup", "PASS");
    result.transport = { package: mode === "legacy" ? target.package : "shared", version: server.version, binding: "127.0.0.1", port: Number(new URL(server.url).port), note: "Installed package transport and current client source; loopback listener owned by qualification. Native Vite treats configured port 0 as default 5173; strict port binding prevents silent fallback." };
    for (const file of selection.files) {
      phase("asset:" + file, "START");
      const response = await request(server.url, "/" + file); assert.equal(response.status, 200, file);
      const exactBytes = response.body.equals(fs.readFileSync(path.join(selection.root, file)));
      if (mode === "shared" || target.package !== "vite" || !/\.(?:html|js|mjs|css)$/.test(file)) assert.ok(exactBytes, "Public asset bytes: " + file);
      result.assets.push({ file, status: response.status, exactBytes, transformation: !exactBytes ? "Vite development transform; original suites must qualify behavior" : undefined });
      phase("asset:" + file, "PASS");
    }
    // Requesting Node-only test source through Vite discovers its dependencies and
    // can trigger optimizer errors/HMR. Run original browser assertions first, then
    // probe a separate listener/cache so those deliberate requests cannot affect
    // functional evidence. Both listeners still use the installed package defaults.
    for (const suite of target.suites) {
      phase("suite:" + suite.file, "START");
      const original = await runSuite(browser, target, suite, server.url, path.join(folder, suite.file.replace(/[/.]/g, "-")));
      result.suites.push(original); phase("suite:" + suite.file, original.status, original.error);
    }
    phase("cancellation", "START");
    result.cancellation = await cancellation(browser, target, server.url, folder);
    phase("cancellation", result.cancellation.status, result.cancellation.functionalAcceptance);
    if (mode === "legacy" && target.package === "vite") {
      await closeListener();
      phase("security-listener-startup", "START");
      server = await packageServer(target, path.join(folder, "security-listener"), phase);
      phase("security-listener-startup", "PASS");
      result.transport.securityIsolation = "Separate listener and optimizer cache, started after all browser contexts closed";
    }
    const fixture = path.join(folder, "controlled-traversal.txt"), bytes = Buffer.from("Controlled qualification fixture " + target.name + "\n"); fs.writeFileSync(fixture, bytes);
    const probes = [["GET", "/package.json", 403], ["GET", "/README.md", 403], ...target.suites.map(suite => ["GET", "/" + suite.file, 403]),
      ["POST", "/", 405], ["OPTIONS", "/", 405], ["GET", "/%ZZ", 400],
      ["GET", "/../test/package-entry-security/" + target.name + "/" + mode + "/controlled-traversal.txt", 403],
      ["GET", "/@fs/" + fixture.replaceAll("\\", "/"), 403]];
    for (const [method, route, expected] of probes) {
      phase("probe:" + method + " " + route, "START");
      const response = await request(server.url, route, method);
      if (mode === "shared") { assert.ok([expected, ...(route.startsWith("/@fs/") ? [404] : [])].includes(response.status), route + ": " + response.status); assert.ok(!response.body.equals(bytes), "No controlled traversal bytes"); }
      result.security.push({ method, route, status: response.status, controlledFixtureExposed: response.body.equals(bytes) });
      phase("probe:" + method + " " + route, mode === "legacy" ? "OBSERVED" : "PASS", "HTTP " + response.status);
    }
    assert.equal((await request(server.url, "/")).status, 200, "Listener survives malformed/traversal probes");
    result.status = result.suites.every(suite => suite.status === "PASS") && result.cancellation.status === "PASS" ? "PASS" : "FAIL";
    return result;
  } catch (error) { result.status = "FAIL"; result.error = error.stack; phase("qualification", "FAIL", error.message); return result; }
  finally {
    try { await closeListener(); }
    catch (error) { result.status = "FAIL"; result.cleanupError = error.message; }
    result.complete = true;
    fs.writeFileSync(path.join(folder, "result.json"), JSON.stringify(result, null, 2)); console.log("PACKAGE_ENTRY_RESULT " + JSON.stringify(result));
  }
}
function originalSuiteStatus(target, modes) {
  const names = target.suites.map(suite => suite.file);
  if (modes.length !== 2 || names.length === 0) return "UNVERIFIED";
  if (modes.some(mode => mode.suites?.some(suite => suite.status === "FAIL"))) return "FAIL";
  return modes.every(mode => mode.suites?.length === names.length && names.every(name => mode.suites.filter(suite => suite.suite === name && suite.status === "PASS").length === 1)) ? "PASS" : "UNVERIFIED";
}
async function main(args = process.argv.slice(2)) {
  const names = args.filter(arg => arg !== "--offline"), targets = names.length ? TARGETS.filter(target => names.includes(target.name)) : TARGETS;
  assert.equal(targets.length, names.length || TARGETS.length, "Unknown or duplicate exact target");
  const contracts = targets.map(target => ({ exhibit: target.name, package: target.package, command: JSON.parse(fs.readFileSync(path.join(ROOT, target.name, "package.json"), "utf8")).scripts[target.command],
    suites: target.suites.map(suite => { compiledSuite(target, suite, "http://127.0.0.1:12345"); return { file: suite.file, sourceSHA256: crypto.createHash("sha256").update(original(target, suite)).digest("hex"), completion: suite.completion }; }) }));
  fs.mkdirSync(OUTPUT, { recursive: true });
  if (args.includes("--offline")) { fs.writeFileSync(path.join(OUTPUT, "offline.json"), JSON.stringify({ status: "UNVERIFIED", scope: "Original suite/source and adapter compilation only; HTTP/browser requires hosted runtime", contracts }, null, 2)); console.log(JSON.stringify(contracts)); return; }
  const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer"), browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
  const reports = [];
  try {
    for (const target of targets) {
      const legacy = await qualify(browser, target, "legacy"), shared = await qualify(browser, target, "shared");
      const suiteStatus = originalSuiteStatus(target, [legacy, shared]);
      const functionalStatus = [legacy, shared].some(result => result.cancellation?.functionalAcceptance?.startsWith("FAIL")) ? "FAIL" : "UNVERIFIED";
      const result = { exhibit: target.name, originalSuiteStatus: suiteStatus, functionalStatus, operatorStatus: "UNVERIFIED", status: suiteStatus === "PASS" && legacy.status === "PASS" && shared.status === "PASS" && functionalStatus !== "FAIL" ? "PASS" : "FAIL" };
      if (legacy.cancellation?.after8250ms && shared.cancellation?.after8250ms) {
        try { assert.deepEqual(shared.cancellation.after8250ms, legacy.cancellation.after8250ms, "Cancellation transport regression"); }
        catch (error) { result.status = "FAIL"; result.error = error.message; }
      }
      reports.push(result);
    }
  } finally { await browser.close(); fs.writeFileSync(path.join(OUTPUT, "summary.json"), JSON.stringify({ contracts, reports }, null, 2)); console.log("PACKAGE_ENTRY_PRESERVATION " + JSON.stringify(reports)); }
  assert.ok(reports.every(result => result.status === "PASS"), "Package entry qualification remains incomplete");
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { TARGETS, compiledSuite, artifactIO, closeOwnedHttpServer, runSuite, cancellation, originalSuiteStatus };
