"use strict";
// Narrow state-feedback regression. Original 79-assertion suite is unchanged.
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { execFileSync } = require("node:child_process");
const { startPreview, selectExhibit } = require("./preview.js");
const { click } = require("./browser-check-helpers.js");
const ROOT = path.resolve(__dirname, ".."), TARGET = "stargate_reactor_criticality";
const BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1", OUTPUT = path.join(ROOT, "test/reactor-regressions");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function offlineStageProbe(source) {
  const elements = new Map();
  for (const id of ["activate-criticality-btn", "activate-btn-label", "activate-btn-sub", "aperture-activation-banner"])
    elements.set(id, { textContent: "", classList: { hidden: true, add() { this.hidden = true; }, remove() { this.hidden = false; } } });
  const Application = require("node:vm").runInNewContext(source + "\nHMIApplication;", {
    window: { addEventListener() {} }, document: { getElementById: id => elements.get(id) }, requestAnimationFrame() {}
  });
  const app = Object.create(Application.prototype);
  app.lastFrameTime = 0; app.physics = { state: "BUILDUP", keff: 0.99, selectedSequence: [], update() { this.state = "SUSTAINED"; } };
  app.renderer = { render() {} }; app.telemetry = { update() {} }; app.updateChannelButtonsUI = () => {};
  app.updateActionButtonsUI(); app.animationLoop(16);
  return { label: elements.get("activate-btn-label").textContent, bannerHidden: elements.get("aperture-activation-banner").classList.hidden };
}
async function run(browser, url, baseline) {
  const context = await browser.createBrowserContext(), page = await context.newPage();
  const result = { mode: baseline ? "baseline-client" : "repaired-client", errors: [], stages: [] };
  page.on("pageerror", error => result.errors.push(error.message));
  if (baseline) {
    const source = execFileSync("git", ["show", BASE + ":" + TARGET + "/js/app.js"], { cwd: ROOT, encoding: "utf8" });
    await page.setRequestInterception(true);
    page.on("request", request => request.url() === url + "/js/app.js"
      ? request.respond({ status: 200, contentType: "application/javascript", body: source }) : request.continue());
  }
  const wait = state => page.waitForFunction(state => reactorPhysics.state === state, { timeout: 15000 }, state);
  const snapshot = () => page.evaluate(() => ({ state: reactorPhysics.state, count: reactorPhysics.selectedSequence.length,
    running: hmiApp.presets.isRunning, label: document.getElementById("activate-btn-label").textContent,
    indicator: document.getElementById("preset-status-indicator").textContent,
    bannerHidden: document.getElementById("aperture-activation-banner").classList.contains("hidden") }));
  const idle = async () => {
    await click(page, "#scram-disengage-btn"); const immediate = await snapshot();
    assert.equal(immediate.state, "SUBCRITICAL"); assert.equal(immediate.count, 0); assert.equal(immediate.running, false);
    if (!baseline) assert.equal(immediate.indicator, "STANDBY");
    await delay(8250); const stable = await snapshot();
    assert.equal(stable.state, "SUBCRITICAL"); assert.equal(stable.count, 0); assert.equal(stable.running, false);
    assert.equal(stable.bannerHidden, true); return stable;
  };
  try {
    await page.setViewport({ width: 1920, height: 1080 }); await page.goto(url, { waitUntil: "networkidle0" });
    await page.select("#preset-dropdown", "CRIT-B04"); await click(page, "#run-preset-autodial-btn");
    await wait("PENDING"); await page.waitForFunction(() => !hmiApp.presets.isRunning); await delay(1000);
    const pending = await snapshot(); assert.equal(pending.state, "PENDING"); assert.equal(pending.indicator, "PENDING CRITICALITY");
    await click(page, "#activate-criticality-btn");
    for (const state of ["BUILDUP", "BREAKTHROUGH", "SUSTAINED"]) {
      await wait(state); const observed = await snapshot(); result.stages.push(observed);
      if (!baseline) {
        assert.match(observed.label, state === "BUILDUP" ? /BUILDUP/ : /SUSTAINED/);
        assert.equal(observed.bannerHidden, state === "BUILDUP");
      }
    }
    result.cancelled = await idle();
    if (baseline) {
      assert.match(result.stages[2].label, /BUILDUP/); assert.equal(result.stages[2].bannerHidden, true);
      assert.equal(result.cancelled.indicator, "PENDING CRITICALITY");
      result.baselineDefects = ["Sustained label remains buildup", "Sustained banner remains hidden", "SCRAM retains pending preset label"];
    } else {
      // Manual second cycle and mid-buildup cancellation retain existing behavior.
      for (const [index, channel] of [0, 2, 4, 5, 7, 9].entries()) {
        await click(page, "#channel-btn-" + channel);
        await page.waitForFunction(count => reactorPhysics.selectedSequence.length === count, { timeout: 10000 }, index + 1);
      }
      await wait("PENDING"); await delay(1000); assert.equal((await snapshot()).state, "PENDING");
      await click(page, "#activate-criticality-btn"); await wait("BUILDUP"); result.cancelledBuildup = await idle();
      await click(page, "#run-preset-autodial-btn");
      await page.waitForFunction(() => hmiApp.presets.isRunning && reactorPhysics.selectedSequence.length > 0);
      result.cancelledPreset = await idle();
    }
    assert.deepEqual(result.errors, []); result.status = "PASS";
  } catch (error) { result.status = "FAIL"; result.error = error.stack; }
  finally { await context.close(); }
  return result;
}
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const original = execFileSync("git", ["show", BASE + ":" + TARGET + "/js/app.js"], { cwd: ROOT, encoding: "utf8" });
  const before = offlineStageProbe(original), after = offlineStageProbe(fs.readFileSync(path.join(ROOT, TARGET, "js/app.js"), "utf8"));
  assert.match(before.label, /BUILDUP/); assert.equal(before.bannerHidden, true);
  assert.match(after.label, /SUSTAINED/); assert.equal(after.bannerHidden, false);
  console.log("REACTOR_OFFLINE_STAGE_PROBE " + JSON.stringify({ before, after, evidence: "Actual app animation/UI methods with minimal DOM; browser acceptance separate" }));
  if (process.argv.includes("--offline")) return;
  const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer");
  const server = await startPreview({ ...selectExhibit(TARGET), port: 0 });
  let browser;
  const results = [];
  try {
    browser = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, headless: true });
    for (const baseline of [true, false]) { const result = await run(browser, server.url, baseline); results.push(result); console.log("REACTOR_REGRESSION " + JSON.stringify(result)); }
    assert.ok(results.every(result => result.status === "PASS"));
  } finally {
    fs.writeFileSync(path.join(OUTPUT, "report.json"), JSON.stringify({ scope: "Diagnosed UI feedback regression only; full operator acceptance remains separate.", baseline: BASE, results }, null, 2));
    if (browser) await browser.close(); await server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
