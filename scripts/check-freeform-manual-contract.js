"use strict";
// Supplemental completion-aware contract and callback timing observation.
// The historical 350ms original suite remains unchanged and reports separately.
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const { selectExhibit, startPreview } = require("./preview");
const { loadPage } = require("./browser-load");
const ROOT = path.resolve(__dirname, ".."), NAME = "stargate_seti_freeform", OUTPUT = path.join(ROOT, "test/freeform-manual-contract");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function state(page) {
  return page.evaluate(() => ({ state: window.__APP__.systemState, address: [...window.__APP__.currentAddress],
    slots: document.querySelectorAll(".address-slot.filled").length,
    hold: window.__APP__.verificationHoldEngaged, activateDisabled: document.getElementById("activateBtn").disabled }));
}
async function pointer(page, selector) {
  const element = await page.$(selector); assert.ok(element, selector);
  const box = await element.boundingBox(); assert.ok(box, selector);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const hit = await page.evaluate(({ selector, x, y }) => {
    const control = document.querySelector(selector), actual = document.elementFromPoint(x, y);
    return { correct: actual === control || control.contains(actual), id: actual?.id, at: performance.now() };
  }, { selector, x, y });
  assert.equal(hit.correct, true, "Real pointer hits " + selector);
  await page.mouse.click(x, y); return hit;
}
async function instrument(page) {
  await page.evaluate(() => {
    const app = window.__APP__, records = window.__freeformTiming = { checks: [], events: [], stages: [] };
    const original = app.performCoincidenceCheck;
    app.performCoincidenceCheck = function(candidateId, callback) {
      const record = { candidateId, startedAt: performance.now(), addressBefore: [...this.currentAddress] };
      records.checks.push(record);
      return original.call(this, candidateId, function(...args) {
        record.completedAt = performance.now(); record.durationMs = record.completedAt - record.startedAt;
        const value = callback.apply(this, args);
        record.addressAfter = [...app.currentAddress]; record.stateAfter = app.systemState; return value;
      });
    };
    document.addEventListener("click", event => {
      const button = event.target.closest(".candidate-btn");
      if (button) records.events.push({ id: button.id, at: performance.now(), address: [...app.currentAddress] });
    }, true);
    for (const name of ["startThreeStageActivation", "triggerBreakthrough", "enterSustainedActiveState"]) {
      const original = app[name];
      app[name] = function(...args) {
        const value = original.apply(this, args);
        records.stages.push({ method: name, at: performance.now(), state: this.systemState }); return value;
      };
    }
  });
}
async function capture(page, label) {
  const file = path.join(OUTPUT, label + ".png"); await page.screenshot({ path: file });
  if (process.env.STARGATE_LOG_VISUALS !== "1") return;
  const value = await page.evaluate(async source => {
    const image = new Image(); image.src = "data:image/png;base64," + source; await image.decode();
    const canvas = document.createElement("canvas"), scale = Math.min(1, 1280 / image.width);
    canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.65).split(",")[1];
  }, fs.readFileSync(file).toString("base64"));
  for (let offset = 0; offset < value.length; offset += 16000) console.log("STARGATE_VISUAL freeform-manual-" + label + ".jpg " + offset + " " + value.slice(offset, offset + 16000));
}
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const files = ["src/main.js", "test_e2e.js"], hash = file => crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, NAME, file))).digest("hex");
  const hashes = Object.fromEntries(files.map(file => [file, hash(file)]));
  const result = { exhibit: NAME, mode: "shared", scope: "Supplementary completion-aware manual interaction and real callback timing",
    status: "FAIL", currentContractStatus: "UNVERIFIED", originalSuiteStatus: "UNVERIFIED", operatorStatus: "UNVERIFIED", acceptanceStatus: "UNVERIFIED",
    sourceSHA256: hashes, cycles: [], pageErrors: [], resources: [],
    historicalOriginalEvidence: { run: "42515274539", job: "128836833483", status: "FAIL", note: "Original 350ms-per-click built suite observed counts0,1,2,3,4,5,6 and DIALING; no original delay or assertion is changed here." } };
  let browser, server;
  try {
    server = await startPreview({ ...selectExhibit(NAME), port: 0 });
    browser = await require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer").launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
    for (const [label, viewport, aware] of [
      ["original-cadence-observation", { width: 1920, height: 1080 }, false],
      ["completion-aware-1080p", { width: 1920, height: 1080 }, true],
      ["completion-aware-4k", { width: 3840, height: 2160 }, true]
    ]) {
      const context = await browser.createBrowserContext(), page = await context.newPage();
      try {
        page.on("pageerror", error => result.pageErrors.push(error.message));
        page.on("response", response => { if (response.status() >= 400) result.resources.push(response.url().replace(server.url, "ORIGIN") + ":" + response.status()); });
        await page.setViewport({ ...viewport, deviceScaleFactor: 1 }); await loadPage(page, server.url, 15000); await instrument(page);
        const cycle = { label, viewport, clicks: [] }; result.cycles.push(cycle);
        // Match the original pre-manual viewport/help transition in the diagnostic
        // case, without changing that original suite or calling it a pass.
        if (!aware) {
          await page.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 1 }); await delay(200);
          await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 }); await delay(200);
          await pointer(page, "#helpBtn"); await delay(200); await pointer(page, "#closeHelpBtn"); await delay(200);
        }
        for (let id = 1; id <= 7; id++) {
          const hit = await pointer(page, "#candidate-btn-" + id);
          if (aware) await page.waitForFunction(expected => window.__APP__.currentAddress.length === expected, { timeout: 5000 }, id);
          else await delay(350);
          const observed = await state(page);
          cycle.clicks.push({ id, hit, observed, measuredAt: await page.evaluate(() => performance.now()) });
          if (aware) assert.deepEqual(observed.address, Array.from({ length: id }, (_, index) => index + 1));
        }
        cycle.atLastClickDeadline = await state(page);
        if (!aware) {
          cycle.matchesOriginalReadyPredicate = cycle.atLastClickDeadline.state === "READY" && cycle.atLastClickDeadline.address.length === 7;
          const start = await page.evaluate(() => performance.now());
          await page.waitForFunction(() => window.__APP__.systemState === "READY" && window.__APP__.currentAddress.length === 7, { timeout: 5000 });
          cycle.additionalCompletionMs = await page.evaluate(start => performance.now() - start, start);
          cycle.afterCompletion = await state(page);
        } else {
          assert.equal(cycle.atLastClickDeadline.state, "READY"); assert.equal(cycle.atLastClickDeadline.slots, 7);
          assert.equal(cycle.atLastClickDeadline.activateDisabled, false);
          await capture(page, label + "-ready");
          await pointer(page, 'label[for="verificationHoldToggle"]'); assert.equal((await state(page)).hold, true);
          await pointer(page, "#activateBtn");
          assert.equal((await state(page)).state, "READY");
          assert.equal(await page.$eval("#holdWarningBanner", node => node.classList.contains("active")), true);
          await pointer(page, 'label[for="verificationHoldToggle"]'); assert.equal((await state(page)).hold, false);
          await pointer(page, "#activateBtn"); assert.equal((await state(page)).state, "BUILDUP");
          await page.waitForFunction(() => window.__APP__.systemState === "ACTIVE", { timeout: 7000 });
          cycle.active = await state(page); await capture(page, label + "-active");
          const stages = await page.evaluate(() => window.__freeformTiming.stages);
          assert.deepEqual(stages.map(stage => stage.state), ["BUILDUP", "BREAKTHROUGH", "ACTIVE"]);
          await pointer(page, "#disengageBtn"); await delay(8250);
          cycle.cancelled = await state(page); assert.equal(cycle.cancelled.state, "IDLE"); assert.equal(cycle.cancelled.address.length, 0); assert.equal(cycle.cancelled.slots, 0);
          await capture(page, label + "-cancelled"); cycle.currentContractStatus = "PASS";
        }
        cycle.timing = await page.evaluate(() => window.__freeformTiming);
        assert.equal(cycle.timing.checks.length, 7); assert.equal(cycle.timing.events.length, 7);
        assert.ok(cycle.timing.checks.every(check => Number.isFinite(check.durationMs)), "Every original callback completed");
      } finally { await context.close(); }
    }
    assert.deepEqual(result.pageErrors, []); assert.deepEqual(result.resources, []);
    assert.deepEqual(Object.fromEntries(files.map(file => [file, hash(file)])), hashes, "Client and original harness remain unchanged");
    result.status = "PASS"; result.currentContractStatus = "PASS";
  } catch (error) { result.error = error.stack; process.exitCode = 1; }
  finally {
    if (browser) await browser.close(); if (server) await server.close();
    fs.writeFileSync(path.join(OUTPUT, "result.json"), JSON.stringify(result, null, 2));
    console.log("FREEFORM_MANUAL_CONTRACT " + JSON.stringify(result));
  }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });

