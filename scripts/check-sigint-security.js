"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const { execFileSync } = require("node:child_process");
const { request, click } = require("./browser-check-helpers.js");
const { legacy } = require("./check-pilot-browsers.js");
const { startPreview, selectExhibit } = require("./preview.js");
const ROOT = path.resolve(__dirname, ".."), NAME = "stargate_sigint_cryptanalysis";
const DIR = path.join(ROOT, NAME), OUTPUT = path.join(ROOT, "test/sigint-security");
const BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function originalSuite(browser, url, mode) {
  const context = await browser.createBrowserContext(), lines = [], errors = [];
  const folder = path.join(OUTPUT, mode, "original"); fs.mkdirSync(folder, { recursive: true });
  const original = execFileSync("git", ["show", BASE + ":" + NAME + "/test_suite.js"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(fs.readFileSync(path.join(DIR, "test_suite.js"), "utf8").replace(/\r\n/g, "\n"), original.replace(/\r\n/g, "\n"), "Original suite must be unchanged");
  // Only transport, output locations and browser ownership change. Original observations and predicates remain intact.
  let source = original.replace("http://localhost:8420", url)
    .replace("const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');", "const SCREENSHOT_DIR = " + JSON.stringify(folder) + ";")
    .replaceAll("path.join(__dirname, 'test', 'test_results.json')", JSON.stringify(path.join(folder, "results.json")))
    .replaceAll("path.join(__dirname, 'test')", JSON.stringify(folder));
  assert.ok(source.endsWith("runTestSuite();\n") || source.trimEnd().endsWith("runTestSuite();"));
  source = source.replace(/runTestSuite\(\);\s*$/, "return runTestSuite();");
  const adapter = { executablePath: () => process.env.PUPPETEER_EXECUTABLE_PATH,
    launch: async () => ({ newPage: () => context.newPage(), close: async () => {} }) };
  const log = (...v) => lines.push(v.map(x => typeof x === "object" ? JSON.stringify(x) : String(x)).join(" "));
  try {
    await new Function("require", "__dirname", "console", source)(n => n === "puppeteer-core" ? adapter : require(n), DIR,
      { log, warn: log, error: (...v) => { errors.push(v.map(String).join(" ")); log(...v); } });
    assert.deepEqual(errors, [], "Original harness must not swallow an exception");
    const values = JSON.parse(fs.readFileSync(path.join(folder, "results.json"), "utf8"));
    for (const key of ["viewportScale1080p", "viewportScale4K", "cornerDisplayVerification", "operatorReferenceModal",
      "negativeAutoFireTest", "safetyInterlockDefaultAndBlock", "threeStageActivation", "disengageRedialCycle1", "disengageRedialCycle2"])
      assert.ok(values[key], "Original phase completed: " + key);
    const predicates = { negativeAutoFire: values.negativeAutoFireTest.passed,
      defaultReleased: values.safetyInterlockDefaultAndBlock.defaultReleased,
      interlockBlocks: values.safetyInterlockDefaultAndBlock.blockSuccess };
    for (const [key, value] of Object.entries(predicates)) assert.equal(value, true, "Original predicate: " + key);
    for (const key of ["stage1Buildup", "stage2Breakthrough", "stage3Sustained"])
      assert.ok(values.threeStageActivation[key], "Original stage observation: " + key);
    return { status: "PASS", phases: 8, predicates,
      note: "All eight original phases execute. Three original boolean predicates enforced; remaining raw observations retained in results.json. quickDialTiers is an unassigned original placeholder, not a passed test." };
  } finally { fs.writeFileSync(path.join(folder, "run.log"), lines.join("\n")); await context.close(); }
}
async function qualify(browser, mode) {
  const selection = selectExhibit(NAME);
  const server = mode === "legacy" ? await legacy({ name: NAME, server: "server.js" })
    : await startPreview({ ...selection, port: 0 });
  const context = await browser.createBrowserContext();
  const result = { mode, assets: 0, security: [], pageErrors: [], resources: [], requestFailures: [], cycles: [] };
  try {
    for (const file of selection.files) {
      const r = await request(server.url, "/" + file);
      assert.equal(r.status, 200, file); assert.deepEqual(r.body, fs.readFileSync(path.join(DIR, file))); result.assets++;
    }
    for (const [method, url, target] of [
      ["GET", "/../README.md", path.join(ROOT, "README.md")],
      ["GET", "/../stargate_blueprint_alpha/index.html", path.join(ROOT, "stargate_blueprint_alpha/index.html")],
      ["GET", "/server.js", path.join(DIR, "server.js")],
      ["GET", "/test_suite.js", path.join(DIR, "test_suite.js")],
      ["GET", "/package.json", path.join(DIR, "package.json")],
      ["POST", "/", path.join(DIR, "index.html")]
    ]) {
      const r = await request(server.url, url, method);
      assert.equal(r.status, mode === "legacy" ? 200 : method === "POST" ? 405 : 403);
      if (mode === "legacy") assert.deepEqual(r.body, fs.readFileSync(target));
      result.security.push({ method, url, status: r.status, returnedTargetBytes: r.body.equals(fs.readFileSync(target)) });
    }
    result.originalSuite = await originalSuite(browser, server.url, mode);
    const page = await context.newPage();
    page.on("pageerror", e => result.pageErrors.push(e.message));
    page.on("response", r => { if (r.status() >= 400) result.resources.push(r.url().replace(server.url, "ORIGIN") + ":" + r.status()); });
    page.on("requestfailed", r => result.requestFailures.push(r.url().replace(server.url, "ORIGIN")));
    await page.setViewport({ width: 1920, height: 1080 }); await page.goto(server.url, { waitUntil: "networkidle0" });
    const snapshot = () => page.evaluate(() => {
      const s = window.__DSCR_STATE__;
      return { state: s.systemState, count: s.lockedKeys.filter(k => k !== null).length, hold: s.interlockEngaged,
        cycling: s.isHypothesisCycling, slot: s.activeSlotIndex,
        activationDisabled: document.getElementById("btn-activate").disabled };
    });
    const shot = async name => {
      const file = "sigint-" + mode + "-" + name;
      await page.screenshot({ path: path.join(OUTPUT, file + ".png") });
      if (mode === "shared" && process.env.STARGATE_LOG_VISUALS === "1") {
        const data = await page.screenshot({ type: "jpeg", quality: 65, encoding: "base64" });
        for (let offset = 0; offset < data.length; offset += 16000) console.log("STARGATE_VISUAL " + file + ".jpg " + offset + " " + data.slice(offset, offset + 16000));
      }
    };
    const idle = async () => { const s = await snapshot(); assert.equal(s.state, "IDLE"); assert.equal(s.count, 0); assert.equal(s.slot, 0); assert.equal(s.cycling, false); return s; };
    const dial = async () => {
      for (let n = 0; n < 8; n++) {
        await click(page, "#glyph-btn-" + n);
        await page.waitForFunction(count => window.__DSCR_STATE__.lockedKeys.filter(k => k !== null).length === count && !window.__DSCR_STATE__.isHypothesisCycling, {}, n + 1);
      }
    };
    result.initial = await idle(); assert.equal(result.initial.hold, false); await shot("idle");
    for (let cycle = 0; cycle < 2; cycle++) {
      await dial(); await delay(700);
      const ready = await snapshot(); assert.equal(ready.state, "READY"); assert.equal(ready.count, 8); assert.equal(ready.activationDisabled, false);
      if (!cycle) await shot("ready");
      await click(page, "#btn-activate"); await delay(400);
      const ramp = await snapshot(); assert.equal(ramp.state, "BUILDUP"); if (!cycle) await shot("buildup");
      await page.waitForFunction(() => window.__DSCR_STATE__.systemState === "BREAKTHROUGH", { polling: 30 });
      const breakthrough = await snapshot(); if (!cycle) await shot("breakthrough");
      await page.waitForFunction(() => window.__DSCR_STATE__.systemState === "SUSTAINED_ACTIVE");
      const active = await snapshot(); if (!cycle) await shot("active");
      await click(page, "#btn-disengage"); await delay(400); const severed = await idle();
      result.cycles.push({ ready: ready.state, ramp: ramp.state, breakthrough: breakthrough.state, active: active.state, severed: severed.state });
    }
    await dial(); await click(page, "#btn-activate"); await delay(500); await click(page, "#btn-disengage");
    await delay(8250); result.cancelledActivation = await idle(); await shot("cancelled");
    // Preserve, but do not bless, any existing preset replay after emergency sever.
    await click(page, "#preset-btn-p2"); await delay(450); await click(page, "#btn-disengage");
    result.presetCancellationImmediate = await snapshot(); await delay(4000); result.presetCancellationSettled = await snapshot();
    result.functionalAcceptance = result.presetCancellationSettled.state === "IDLE" && result.presetCancellationSettled.count === 0 ? "UNVERIFIED: bounded automation only; operator and sound acceptance pending" : "FAIL: original preset replay repopulates keys after emergency sever";
    result.metadataObservation = await page.$eval(".version-label", el => el.textContent.trim());
    result.metadataVersion = JSON.parse(fs.readFileSync(path.join(DIR, "version.json"))).version;
    assert.deepEqual(result.pageErrors, []); result.status = "PASS"; return result;
  } catch (e) { result.status = "FAIL"; result.error = e.stack; throw e; }
  finally {
    fs.writeFileSync(path.join(OUTPUT, mode + ".json"), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result)); await context.close(); await server.close();
  }
}
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE);
  const browser = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, headless: true });
  try {
    const baseline = await qualify(browser, "legacy"), shared = await qualify(browser, "shared");
    for (const key of ["originalSuite", "cycles", "cancelledActivation", "presetCancellationSettled", "functionalAcceptance"])
      assert.deepEqual(shared[key], baseline[key], "Preservation " + key);
    for (const key of ["resources", "requestFailures"])
      assert.deepEqual([...new Set(shared[key])].sort(), [...new Set(baseline[key])].sort(), key);
    console.log("SIGINT_PRESERVATION PASS");
  } finally { await browser.close(); }
}
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
