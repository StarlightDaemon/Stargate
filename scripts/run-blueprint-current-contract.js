"use strict";
// Explicit current-contract runner for the retained eleven-phase historical suite.
// verify.js is never edited. Default also runs the focused staged/cancellation suite.
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const { createRequire } = require("node:module");
const { click } = require("./browser-check-helpers.js");
const ROOT = path.resolve(__dirname, ".."), DIR = path.join(ROOT, "stargate_blueprint_alpha");
const OUTPUT = path.join(ROOT, "test/blueprint-current-contract");
const ORIGINAL_SHA256 = "9ae181dd995cadb60a33a4c25e924933deecdf5fe74da11db6ab2e4ed9c19473";
const CHANGES = [
  "After each original500ms manual wait, wait explicitly for SUSTAINED_ACTIVE; original wait and positive assertions remain.",
  "After each original800ms preset wait, assert exact staged symbols, no connection/stamp/flux, then dispatch a hit-tested Engage and wait for SUSTAINED_ACTIVE.",
];
function readOriginal() {
  const source = fs.readFileSync(path.join(DIR, "verify.js"), "utf8").replace(/\r\n/g, "\n");
  assert.equal(crypto.createHash("sha256").update(source).digest("hex"), ORIGINAL_SHA256, "Historical suite changed: review and update this explicit contract before adapting it");
  return source;
}
function adapt(source) {
  const additions = [], manual = "    await new Promise(r => setTimeout(r, 500));", preset = "    await new Promise(r => setTimeout(r, 800));";
  assert.equal(source.split(manual).length - 1, 2); assert.equal(source.split(preset).length - 1, 2);
  let manualIndex = 0, presetIndex = 0;
  const inserted = (name, code) => { const block = "\n    // CURRENT-CONTRACT BEGIN " + name + "\n" + code + "\n    // CURRENT-CONTRACT END " + name;
    additions.push(block); return block; };
  let adapted = source.replaceAll(manual, () => manual + inserted("manual-" + (++manualIndex), "    await currentContract.waitActive(page, 'manual-cycle-" + manualIndex + "');"));
  const ids = ["civil-helios", "class-oort"];
  adapted = adapted.replaceAll(preset, () => { const id = ids[presetIndex++]; return preset + inserted("preset-" + id, "    await currentContract.approveStagedPlan(page, '" + id + "');"); });
  let reconstructed = adapted; for (const block of additions) reconstructed = reconstructed.replace(block, "");
  assert.equal(reconstructed, source, "Removing only the four declared insertions restores every original byte (after checkout newline normalization)");
  return { source: adapted, insertions: additions.length, originalSourceSha256: ORIGINAL_SHA256, changes: CHANGES };
}
function createCurrentContract(observations = []) {
  const currentContract = {
    async waitActive(page, label) {
      await page.waitForFunction(() => window.__BLUEPRINT_CAD_API__.getState().activationStage === "SUSTAINED_ACTIVE", { timeout: 10000 });
      const state = await page.evaluate(() => window.__BLUEPRINT_CAD_API__.getState()); assert.equal(state.isConnected, true);
      observations.push({ label, phase: state.activationStage, connected: state.isConnected });
    },
    async approveStagedPlan(page, id) {
      const staged = await page.evaluate(id => {
        const expected = document.querySelector('.site-plan-card[data-plan-id="' + id + '"]').dataset.symbols.split(",").map(Number);
        return { state: window.__BLUEPRINT_CAD_API__.getState(), expected, filled: document.querySelectorAll(".seq-slot.filled").length,
          locked: document.querySelectorAll(".datum-lock-node.locked").length, stamp: !document.getElementById("approval-stamp-group").classList.contains("hidden"),
          flux: document.getElementById("aperture-flux-canvas").classList.contains("active") };
      }, id);
      assert.deepEqual(staged.state.stagedGlyphs, staged.expected); assert.equal(staged.state.currentSitePlan, id);
      assert.equal(staged.filled, 6); assert.equal(staged.locked, 6); assert.equal(staged.state.isConnected, false); assert.equal(staged.state.isEngaging, false);
      assert.equal(staged.state.isPlottingPlan, false); assert.equal(staged.stamp, false); assert.equal(staged.flux, false);
      observations.push({ label: id, phase: "PENDING", exactSymbols: staged.expected, connected: false, action: "Explicit real pointer Engage follows" });
      await click(page, "#btn-engage-draft"); await currentContract.waitActive(page, id);
    },
  };
  return currentContract;
}
async function runContract(kind) {
  assert.ok(kind === "historical" || kind === "current");
  const original = readOriginal(), adaptation = adapt(original), folder = path.join(OUTPUT, kind);
  fs.mkdirSync(folder, { recursive: true });
  const lines = [kind.toUpperCase() + " CONTRACT: " + (kind === "current" ? "Explicit stage waits/manual preset approval added. Original positive assertions retained; this is not an original-contract PASS." : "Unchanged retained suite; known incompatibilities are expected FAIL, never relabeled PASS.")];
  const errors = [], observations = [], processState = { exitCode: 0, env: { ...process.env, STARGATE_TEST_OUTPUT_DIR: folder } };
  const requireOriginal = createRequire(path.join(DIR, "verify.js"));
  const puppeteer = requireOriginal(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer");
  const browserAdapter = { ...puppeteer, launch: async options => {
    const browser = await puppeteer.launch(options), newPage = browser.newPage.bind(browser);
    browser.newPage = async () => { const page = await newPage(); page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
      page.on("requestfailed", request => errors.push(request.url())); return page; };
    return browser;
  } };
  const currentContract = createCurrentContract(observations);
  const log = (...values) => lines.push(values.map(value => value instanceof Error ? value.stack : typeof value === "object" ? JSON.stringify(value) : String(value)).join(" "));
  let thrown;
  try {
    await new Function("require", "__dirname", "console", "process", "module", "currentContract", (kind === "current" ? adaptation.source : original) + "\nreturn runTests();")(
      name => name === (processState.env.STARGATE_PUPPETEER_MODULE || "puppeteer") ? browserAdapter : requireOriginal(name), DIR,
      { log, error: log }, processState, { exports: {} }, currentContract);
  } catch (error) { thrown = error; log(error); processState.exitCode = 1; }
  finally { fs.writeFileSync(path.join(folder, "run.log"), lines.join("\n") + "\n"); assert.equal(readOriginal(), original, "Historical suite remains untouched after execution"); }
  const failure = lines.find(line => line.includes("VERIFICATION TEST FAILED")) || thrown?.message || null;
  const phases = [...new Set(lines.flatMap(line => [...line.matchAll(/--- (\d+)\./g)].map(match => Number(match[1]))))];
  const result = { contract: kind, status: processState.exitCode ? "FAIL" : "PASS", phasesCompletedOrEntered: phases, failure, errors, observations,
    originalSourceSha256: ORIGINAL_SHA256, originalFileUnchanged: true, declaredInsertions: kind === "current" ? adaptation.insertions : 0,
    changes: kind === "current" ? CHANGES : [], expectedHistoricalIncompatibilities: ["Phase6 requires active approval500ms after engage; current stages reach active at2200ms", "Phase9 requires automatic preset activation; current presets require manual Engage"] };
  if (kind === "historical") result.expectedFailureObserved = result.status === "FAIL" && /Failed to activate manifold after dial/.test(failure || "") && phases.join() === "1,2,3,4,5,6" && errors.length === 0;
  if (kind === "current" && result.status === "PASS") { assert.deepEqual(phases, Array.from({ length: 11 }, (_, i) => i + 1)); assert.equal(observations.length, 6); assert.deepEqual(errors, []); }
  fs.writeFileSync(path.join(folder, "report.json"), JSON.stringify(result, null, 2)); return result;
}
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true }); const adaptation = adapt(readOriginal());
  if (process.argv.includes("--offline")) {
    const report = { status: "ADAPTER_VALIDATED_ONLY", originalSourceSha256: ORIGINAL_SHA256, restoredOriginalBytes: true, declaredInsertions: adaptation.insertions, changes: CHANGES, historicalExecution: "NOT_RUN", currentExecution: "NOT_RUN" };
    fs.writeFileSync(path.join(OUTPUT, "adapter-validation.json"), JSON.stringify(report, null, 2)); console.log("BLUEPRINT_CURRENT_CONTRACT " + JSON.stringify(report)); return;
  }
  const report = { historical: await runContract("historical"), current: await runContract("current") };
  console.log("BLUEPRINT_HISTORICAL_CONTRACT " + JSON.stringify(report.historical));
  console.log("BLUEPRINT_CURRENT_CONTRACT " + JSON.stringify(report.current));
  assert.equal(report.historical.expectedFailureObserved, true, "Historical contract must fail only for the documented incompatibility");
  assert.equal(report.current.status, "PASS", "Current-contract eleven-phase suite must pass");
  if (!process.argv.includes("--suite-only")) {
    const focused = require("./check-blueprint-regressions.js"); fs.mkdirSync(path.join(ROOT, "test/blueprint-regressions"), { recursive: true });
    report.regressions = { deterministic: focused.deterministic(), browser: await focused.browserChecks() };
    console.log("BLUEPRINT_FOCUSED_CONTRACT " + JSON.stringify({ deterministic: report.regressions.deterministic.status, browser: report.regressions.browser.status,
      stages: report.regressions.browser.stages, stagePixels: report.regressions.browser.stagePixels, operatorIssue: report.regressions.browser.operatorIssue }));
  }
  report.status = "PASS_CURRENT_CONTRACT"; report.operatorAcceptance = "UNRESOLVED; merge/deployment remain HOLD";
  fs.writeFileSync(path.join(OUTPUT, "report.json"), JSON.stringify(report, null, 2));
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { readOriginal, adapt, runContract, createCurrentContract };
