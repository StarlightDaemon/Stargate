"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { createRequire } = require("node:module");
const { execFileSync } = require("node:child_process");
const { request, click } = require("./browser-check-helpers.js");
const { legacy } = require("./check-pilot-browsers.js");
const { startPreview, selectExhibit } = require("./preview.js");
const ROOT = path.resolve(__dirname, ".."), NAME = "stargate_municipal_registry";
const DIR = path.join(ROOT, NAME), OUTPUT = path.join(ROOT, "test/municipal-security");
const BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const historical = file => execFileSync("git", ["show", BASE + ":" + NAME + "/" + file], { cwd: ROOT, encoding: "utf8" });
const original = historical("verify_test.js");

function evidencePath(source, folder) {
  const marker = "const OUT_DIR = path.join(__dirname, 'test');";
  assert.ok(source.includes(marker), "Expected original evidence destination");
  return source.replace(marker, "const OUT_DIR = " + JSON.stringify(folder) + ";");
}

async function embeddedBaseline(current = false) {
  const entry = current ? fs.readFileSync(path.join(DIR, "verify_test.js"), "utf8").replace(/\r\n/g, "\n") : original;
  const end = entry.indexOf("async function makeHttpRequest"); assert.ok(end > 0);
  // Execute the actual selected entry-point transport, excluding the unrelated test invocation.
  const source = evidencePath(entry.slice(0, end), path.join(OUTPUT, current ? "shared-embedded" : "legacy-embedded")) + "\nreturn server;";
  const server = new Function("require", "__dirname", source)(createRequire(path.join(DIR, "verify_test.js")), DIR);
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  return { url: "http://127.0.0.1:" + server.address().port,
    close: () => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }) };
}

async function originalSuite(browser, server, mode, contract = "historical") {
  const context = await browser.createBrowserContext(), lines = [];
  const folder = path.join(OUTPUT, mode, contract); fs.mkdirSync(folder, { recursive: true });
  const current = fs.readFileSync(path.join(DIR, "verify_test.js"), "utf8").replace(/\r\n/g, "\n");
  const assertions = text => text.slice(text.indexOf("async function makeHttpRequest"), text.indexOf("\nrunVerification().catch"));
  assert.equal(assertions(current), assertions(original), "Original HTTP helper and complete verification body remain identical after checkout newline normalization");
  const entry = mode.startsWith("legacy") ? original : current;
  let source = evidencePath(entry, folder).replace("const PORT = 8899;", "const PORT = " + new URL(server.url).port + ";");
  const end = source.indexOf("\nrunVerification().catch"); assert.ok(end > 0);
  source = source.slice(0, end) + "\nreturn runVerification();";
  const body = text => text.slice(text.indexOf("async function runVerification()"), text.indexOf("\nrunVerification().catch"));
  assert.ok(source.includes(body(original)), "Every original verification statement must be preserved");
  if (contract === "current") {
    const action = "    await page.click('#engageBtn');\n    await new Promise(r => setTimeout(r, 600));";
    const insertion = "\n    await page.waitForFunction(() => document.body.dataset.activationStage === 'SUSTAINED_ACTIVE', { timeout: 10000 });";
    assert.equal(source.split(action).length - 1, 2, "Exactly two original manual activation waits");
    const adapted = source.replaceAll(action, action + insertion);
    assert.equal(adapted.replaceAll(insertion, ""), source, "Removing two declared waits restores every original statement");
    source = adapted;
  }
  const listener = { listen: (...args) => { args.at(-1)(); return listener; }, close() {} };
  const browserAdapter = { launch: async () => ({ newPage: () => context.newPage(), close: async () => {} }) };
  const log = (...values) => lines.push(values.map(value => typeof value === "object" ? JSON.stringify(value) : String(value)).join(" "));
  try {
    await new Function("require", "__dirname", "console", "process", "setTimeout", source)(
      name => name === "http" ? { ...http, createServer: () => listener } : name === "puppeteer" ? browserAdapter : name === "../scripts/preview.js" ? { ...require("./preview.js"), createPreviewServer: () => listener } : createRequire(path.join(DIR, "verify_test.js"))(name),
      DIR, { log, error: log }, { exit: code => { throw new Error("Original suite exited " + code); } }, setTimeout);
    const expected = [
      'Engage button disabled before click: false',
      'Status after Engage: "CONDUIT AUTHORIZED"',
      'Status after Disengage: "AWAITING FILING (0/8)"',
      'Status after Second Engage: "CONDUIT AUTHORIZED"',
      'Status after Second Disengage: "AWAITING FILING (0/8)"',
      'Zero console or runtime errors detected!',
    ];
    const missingDiagnostics = expected.filter(line => !lines.includes(line));
    if (contract === "current") for (const line of expected) assert.ok(lines.includes(line), "Current-contract diagnostic: " + line);
    else assert.ok(missingDiagnostics.every(line => /Status after (?:Second )?Engage:/.test(line)), "Only historical instantaneous activation diagnostics may differ");
    assert.ok(lines.some(line => line.includes("ALL VERIFICATION TESTS PASSED SUCCESSFULLY")));
    return { status: "PASS", contract: contract.toUpperCase(), phases: 8, originalChecks: "Four HTTP status checks, enabled engage control, and zero runtime/console errors; entire original flow retained.",
      diagnosticsStatus: missingDiagnostics.length ? "FAIL_HISTORICAL_TIMING" : "PASS", missingDiagnostics,
      declaredInsertions: contract === "current" ? 2 : 0,
      note: contract === "current" ? "Two explicit sustained-stage waits added after unchanged original manual 600ms waits; every original positive assertion retained. This is CURRENT contract acceptance."
        : "Original suite positive assertions pass; its non-asserted 600ms authorization observations cannot qualify the new three-stage contract. Historical diagnostic mismatch is retained, not relabeled PASS." };
  } catch (error) { return { status: "FAIL", error: error.message }; }
  finally { fs.writeFileSync(path.join(folder, "run.log"), lines.join("\n")); await context.close(); }
}

async function security(server, mode) {
  const result = [], old = mode.startsWith("legacy");
  for (const [method, url, file] of [
    ["GET", "/../README.md", path.join(ROOT, "README.md")],
    ["GET", "/../stargate_blueprint_alpha/index.html", path.join(ROOT, "stargate_blueprint_alpha/index.html")],
    ["GET", "/server.js", path.join(DIR, "server.js")],
    ["GET", "/verify_test.js", path.join(DIR, "verify_test.js")],
    ["GET", "/package.json", path.join(DIR, "package.json")],
    ["POST", "/", path.join(DIR, "index.html")],
  ]) {
    const response = await request(server.url, url, method), matches = response.body.equals(fs.readFileSync(file));
    assert.equal(response.status, old ? 200 : method === "POST" ? 405 : 403, mode + " " + method + " " + url);
    if (old) assert.equal(matches, true, "Historical handler returns exact target bytes");
    result.push({ method, url, status: response.status, returnedTargetBytes: matches });
  }
  for (const [url, expected] of [["/%2e%2e/README.md", 403], ["/%zz", 400]]) {
    const response = await request(server.url, url);
    assert.equal(response.status, old ? 404 : expected, mode + " " + url);
    result.push({ method: "GET", url, status: response.status });
  }
  return result;
}

async function observe(browser, server, mode) {
  const context = await browser.createBrowserContext(), page = await context.newPage();
  const result = { cycles: [], pageErrors: [], consoleErrors: [], resources: [], requestFailures: [] };
  page.on("pageerror", error => result.pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") result.consoleErrors.push(message.text()); });
  page.on("response", response => { if (response.status() >= 400) result.resources.push(response.url().replace(server.url, "ORIGIN") + ":" + response.status()); });
  page.on("requestfailed", request => result.requestFailures.push(request.url().replace(server.url, "ORIGIN")));
  const snapshot = () => page.evaluate(() => ({
    count: Number(document.getElementById("counterCurrent").textContent),
    authorized: document.getElementById("authStatusPill").textContent === "CONDUIT AUTHORIZED",
    status: document.getElementById("sysStatusText").textContent,
    hold: document.getElementById("lockoutToggleBtn").getAttribute("aria-pressed") === "true",
    engageDisabled: document.getElementById("engageBtn").disabled,
    locked: document.querySelectorAll(".radial-chevron-station.state-locked").length,
    seeking: document.querySelectorAll(".radial-chevron-station.state-seeking").length,
    stamp: document.getElementById("centerStampOverlay").className,
    duration: document.getElementById("monDuration").textContent,
    flux: document.getElementById("monFlux").textContent,
  }));
  const shot = async state => {
    const filename = "municipal-" + mode + "-" + state;
    await page.screenshot({ path: path.join(OUTPUT, filename + ".png") });
    if (mode === "shared" && process.env.STARGATE_LOG_VISUALS === "1") {
      const data = await page.screenshot({ type: "jpeg", quality: 65, encoding: "base64" });
      for (let offset = 0; offset < data.length; offset += 16000) console.log("STARGATE_VISUAL " + filename + ".jpg " + offset + " " + data.slice(offset, offset + 16000));
    }
  };
  const dial = async offset => { for (let i = 0; i < 8; i++) { await click(page, "#glyphBtn-" + (offset + i)); await delay(200); } };
  const idle = async () => {
    await page.waitForFunction(() => document.getElementById("counterCurrent").textContent === "0" && document.getElementById("monFlux").textContent === "0.00 MB/s");
    const value = await snapshot(); assert.equal(value.authorized, false); assert.equal(value.locked, 0); assert.equal(value.seeking, 0); return value;
  };
  try {
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(server.url, { waitUntil: "networkidle0" });
    result.initial = await idle(); assert.equal(result.initial.hold, false); await shot("idle");
    result.scaling = [];
    for (const [width, height] of [[3840, 2160], [1920, 1080]]) {
      await page.setViewport({ width, height }); await delay(150);
      const transform = await page.$eval(".terminal-wrapper", element => getComputedStyle(element).transform);
      assert.notEqual(transform, "none"); result.scaling.push({ width, height, transform });
    }
    for (let cycle = 0; cycle < 2; cycle++) {
      await dial(cycle * 8); await delay(800);
      const ready = await snapshot(); assert.equal(ready.count, 8); assert.equal(ready.locked, 8); assert.equal(ready.authorized, false); assert.equal(ready.engageDisabled, false);
      if (!cycle) await shot("ready");
      await click(page, "#engageBtn"); await delay(300);
      assert.equal((await snapshot()).authorized, false, "300ms is BUILDUP, not authorization");
      await page.waitForFunction(() => document.body.dataset.activationStage === 'SUSTAINED_ACTIVE', { timeout: 10000 });
      const active = await snapshot(); assert.equal(active.authorized, true);
      if (!cycle) await shot("active");
      await click(page, "#disengageBtn"); await delay(600); const reset = await idle();
      result.cycles.push({ count: ready.count, locked: ready.locked, noAutoFire: !ready.authorized, authorized: active.authorized, reset: reset.status });
    }
    await shot("disengaged");
    await click(page, "#qdRoute1");
    const observations = [], begin = Date.now();
    while (Date.now() - begin < 2000) { observations.push(await snapshot()); await delay(75); }
    result.presetCounts = [...new Set(observations.map(item => item.count))];
    assert.ok(result.presetCounts.some(count => count > 0 && count < 8));
    assert.ok(observations.every(item => !item.authorized));
    const ready = await snapshot(); assert.equal(ready.count, 8); assert.equal(ready.locked, 8);
    await click(page, "#engageBtn"); await delay(500); await click(page, "#disengageBtn"); await delay(8250);
    result.activationCancelled = await idle(); await shot("activation-cancelled");
    // Diagnose interrupted preset callbacks without pretending a matching existing defect is acceptable.
    await click(page, "#qdRoute1"); await delay(500); await click(page, "#disengageBtn"); await delay(8250);
    result.presetCancelled = await snapshot();
    result.presetCancellationIdle = result.presetCancelled.count === 0 && result.presetCancelled.locked === 0 && result.presetCancelled.seeking === 0 && !result.presetCancelled.authorized;
    await shot("preset-cancelled");
    assert.equal(result.presetCancellationIdle, true, "Cancelled preset must not file later glyphs");
    // Cancel a pending manual stamp and replace it before the 450ms teardown.
    await click(page, "#glyphBtn-0"); await delay(30); await click(page, "#disengageBtn");
    await click(page, "#qdRoute2"); await delay(8250);
    result.replacement = await snapshot();
    assert.equal(result.replacement.count, 8); assert.equal(result.replacement.locked, 8);
    assert.equal(result.replacement.authorized, false); assert.equal(result.replacement.seeking, 0);
    result.replacementCodes = await page.$$eval('.chevron-slot-card.state-locked .slot-name', elements => elements.map(element => element.textContent.split(' // ')[0]));
    assert.deepEqual(result.replacementCodes, ['HYD-02', 'ALT-08', 'CLR-17', 'VAP-30', 'VOL-22', 'WBD-05', 'SUR-23', 'SUM-32']);
    await click(page, "#disengageBtn"); await delay(8250); result.finalIdle = await idle();
    result.activationObservation = "Current contract: pending at the 300ms buildup sample, then explicit sustained-stage wait; focused staged visual/audio regression is reported separately.";
    result.functionalAcceptance = result.presetCancellationIdle ? "UNVERIFIED: remaining functional and operator gates" : "FAIL: interrupted preset leaves later filed glyphs after disengage";
    assert.deepEqual(result.pageErrors, []); assert.deepEqual(result.consoleErrors, []); assert.deepEqual(result.resources, []); assert.deepEqual(result.requestFailures, []);
    result.status = "PASS";
  } catch (error) { result.status = "FAIL"; result.error = error.stack; }
  finally { await context.close(); }
  return result;
}

async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const report = { name: NAME, baseline: BASE, scope: "Server security and preservation; original functional/operator acceptance remains separate.", results: [] };
  const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer");
  const browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
  try {
    for (const mode of ["legacy", "legacy-embedded", "shared", "shared-embedded"]) {
      const selection = selectExhibit(NAME), row = { mode, assets: 0 };
      const server = mode === "legacy" ? await legacy({ name: NAME, server: "server.js" }) : mode.endsWith("-embedded") ? await embeddedBaseline(mode === "shared-embedded") : await startPreview({ ...selection, port: 0 });
      try {
        row.security = await security(server, mode);
        for (const file of selection.files) {
          const response = await request(server.url, "/" + file); assert.equal(response.status, 200, mode + " " + file);
          assert.deepEqual(response.body, fs.readFileSync(path.join(DIR, file))); row.assets++;
        }
        row.originalSuite = await originalSuite(browser, server, mode);
        row.currentContract = await originalSuite(browser, server, mode, "current");
        if (!mode.endsWith("-embedded")) row.browser = await observe(browser, server, mode);
        row.status = row.originalSuite.status === "PASS" && row.currentContract.status === "PASS" && (!row.browser || row.browser.status === "PASS") ? "PASS" : "FAIL";
      } catch (error) { row.status = "FAIL"; row.error = error.stack; }
      finally { await server.close(); report.results.push(row); console.log("MUNICIPAL_RESULT " + JSON.stringify(row)); }
    }
    for (const row of report.results) assert.equal(row.status, "PASS", row.mode + " qualification");
    const baseline = report.results.find(row => row.mode === "legacy"), shared = report.results.find(row => row.mode === "shared");
    for (const row of report.results) assert.deepEqual(row.originalSuite, baseline.originalSuite);
    for (const row of report.results) assert.deepEqual(row.currentContract, baseline.currentContract);
    assert.deepEqual(shared.browser.cycles, baseline.browser.cycles);
    assert.deepEqual(shared.browser.activationCancelled, baseline.browser.activationCancelled);
    assert.equal(shared.browser.presetCancellationIdle, baseline.browser.presetCancellationIdle);
    report.status = "PASS"; console.log("MUNICIPAL_PRESERVATION PASS");
  } catch (error) { report.status = "FAIL"; report.error = error.stack; throw error; }
  finally { await browser.close(); fs.writeFileSync(path.join(OUTPUT, "report.json"), JSON.stringify(report, null, 2) + "\n"); }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { embeddedBaseline, originalSuite, security, observe };
