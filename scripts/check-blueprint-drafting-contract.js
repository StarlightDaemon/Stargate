"use strict";
// Supplemental current-client contract. Historical original suites remain unchanged
// in check-package-entry-security; this checker cannot satisfy their original gate.
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const { selectExhibit, startPreview } = require("./preview");
const { click } = require("./browser-check-helpers");
const ROOT = path.resolve(__dirname, ".."), NAME = "stargate_blueprint_drafting";
const OUTPUT = path.join(ROOT, "test/blueprint-drafting-current-contract");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const hash = file => crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, NAME, file))).digest("hex");
const SOURCE_FILES = ["script.js", "index.html", "README.md", "test.js", "test_fix.js", "run_tests_with_vite.js"];
async function state(page) {
  return page.evaluate(() => ({
    status: document.getElementById("drawing-status").textContent,
    count: document.querySelectorAll("#address-buffer span").length,
    selected: document.querySelectorAll(".symbol-btn.selected").length,
    engageDisabled: document.getElementById("btn-engage").disabled,
    hold: document.getElementById("toggle-review-hold").checked,
    active: document.querySelector(".gate-svg").classList.contains("is-active")
  }));
}
async function capture(page, label) {
  const file = path.join(OUTPUT, label + ".png");
  await page.screenshot({ path: file });
  if (process.env.STARGATE_LOG_VISUALS !== "1") return;
  const encoded = await page.evaluate(async value => {
    const img = new Image(); img.src = "data:image/png;base64," + value; await img.decode();
    const canvas = document.createElement("canvas"), scale = Math.min(1, 1280 / img.width);
    canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.65).split(",")[1];
  }, fs.readFileSync(file).toString("base64"));
  for (let offset = 0; offset < encoded.length; offset += 16000) console.log("STARGATE_VISUAL blueprint-drafting-contract-" + label + ".jpg " + offset + " " + encoded.slice(offset, offset + 16000));
}
function assertDraft(value, count, hold) {
  assert.equal(value.status, "DRAFT"); assert.equal(value.count, count);
  assert.equal(value.hold, hold); assert.equal(value.active, false);
  assert.equal(value.engageDisabled, count !== 8);
}
async function holdReleaseEngage(page, prefix, result) {
  assert.equal((await state(page)).count, 8);
  await click(page, "#btn-engage");
  const held = await state(page);
  assert.equal(held.status, "REVIEW HOLD"); assert.equal(held.active, false); assert.equal(held.hold, true);
  await click(page, ".slider"); await delay(500);
  const released = await state(page);
  assertDraft(released, 8, false);
  // Keep the original test expectation visible. This does not replace its failure.
  const historicalExpectation = { expected: "APPROVED", observed: released.status, satisfied: released.status === "APPROVED" };
  await click(page, "#btn-engage");
  const engaged = await state(page);
  assert.equal(engaged.status, "APPROVED"); assert.equal(engaged.active, true); assert.equal(engaged.count, 8);
  if (prefix.endsWith("350ms") || prefix.includes("preset")) await capture(page, prefix + "-explicit-engage");
  await click(page, "#btn-disengage");
  const cancelled = await state(page); assertDraft(cancelled, 0, false); assert.equal(cancelled.selected, 0);
  result.cycles.push({ cycle: prefix, held, released, historicalExpectation, engaged, cancelled, currentContractStatus: "PASS" });
}
async function main(args = process.argv.slice(2)) {
  assert.ok(args.length === 0 || args.length === 1 && args[0] === "--offline", "Only --offline is supported");
  fs.mkdirSync(OUTPUT, { recursive: true });
  const sources = Object.fromEntries(SOURCE_FILES.map(file => [file, hash(file)]));
  const warning = fs.readFileSync(path.join(ROOT, NAME, "README.md"), "utf8");
  assert.ok(warning.includes("UNRESOLVED ISSUE - BUILD CLOSED AS-IS") && warning.includes("manual dialing *still* does not work"), "Existing operator warning must remain recorded");
  const result = {
    exhibit: NAME, mode: "shared", scope: "Supplementary current Review Hold/manual Engage pointer contract",
    status: "UNVERIFIED", currentContractStatus: "UNVERIFIED", originalSuiteStatus: "UNVERIFIED",
    acceptanceStatus: "UNVERIFIED", operatorStatus: "UNVERIFIED", sourceSHA256: sources,
    historicalOriginalSuites: { status: "FAIL", run: "42510716794", job: "128822958253", note: "test.js and run_tests_with_vite.js require automatic APPROVED after Review Hold release; test_fix.js explicit Engage passed. Fresh originals run separately." },
    readmeWarning: "Operator manual dialing failure remains unresolved; this browser check does not overrule the warning.",
    cycles: [], viewports: [], pageErrors: [], resources: []
  };
  let browser, server;
  try {
    if (args.includes("--offline")) { result.note = "Source provenance and warning checked; no browser/current-contract execution"; return; }
    server = await startPreview({ ...selectExhibit(NAME), port: 0 });
    const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer");
    browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
    for (const viewport of [{ width: 1920, height: 1080 }, { width: 3840, height: 2160 }]) {
      const context = await browser.createBrowserContext(), page = await context.newPage();
      try {
        page.on("pageerror", error => result.pageErrors.push(error.message));
        page.on("response", response => { if (response.status() >= 400) result.resources.push(response.url().replace(server.url, "ORIGIN") + ":" + response.status()); });
        await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
        await page.goto(server.url, { waitUntil: "networkidle0", timeout: 30000 });
        assertDraft(await state(page), 0, false);
        result.viewports.push({ ...viewport, layout: await page.evaluate(() => ({
          width: window.innerWidth, height: window.innerHeight,
          transform: getComputedStyle(document.querySelector(".viewport-scaler")).transform
        })) });
        await capture(page, viewport.height + "p-cold");
        // Reference overlay uses the same visible, hit-tested controls as a visitor.
        await click(page, "#btn-operator-ref");
        assert.equal(await page.$eval("#operator-overlay", element => element.classList.contains("hidden")), false);
        await click(page, "#btn-close-overlay");
        assert.equal(await page.$eval("#operator-overlay", element => element.classList.contains("hidden")), true);
        // Repeated genuine pointer manual cycles at different typing cadences.
        for (const cadenceMs of [0, 80, 350]) {
          await click(page, ".slider");
          for (let index = 1; index <= 8; index++) {
            await click(page, "#symbol-grid .symbol-btn:nth-child(" + index + ")");
            const current = await state(page);
            assert.equal(current.count, index, "Each pointer-selected glyph reaches the address");
            assert.equal(current.selected, index, "Each selected glyph remains visibly marked");
            if (cadenceMs) await delay(cadenceMs);
          }
          assertDraft(await state(page), 8, true);
          await holdReleaseEngage(page, viewport.height + "p-manual-" + cadenceMs + "ms", result);
        }
        // Also qualify the held preset path used by the historical failing suites.
        await click(page, ".slider"); await click(page, ".qd-btn");
        await page.waitForFunction(() => document.getElementById("drawing-status").textContent === "REVIEW HOLD", { timeout: 10000 });
        await capture(page, viewport.height + "p-preset-held");
        await holdReleaseEngage(page, viewport.height + "p-preset", result);
        await capture(page, viewport.height + "p-final-idle");
      } finally { await context.close(); }
    }
    assert.deepEqual(result.pageErrors, []); assert.deepEqual(result.resources, []);
    assert.equal(result.cycles.length, 8, "Six manual and two preset pointer cycles");
    assert.deepEqual(Object.fromEntries(SOURCE_FILES.map(file => [file, hash(file)])), sources, "Source, original suites and operator warning unchanged");
    result.status = "PASS"; result.currentContractStatus = "PASS";
  } catch (error) { result.status = "FAIL"; result.currentContractStatus = "FAIL"; result.error = error.stack; process.exitCode = 1; }
  finally {
    if (browser) await browser.close();
    if (server) await server.close();
    fs.writeFileSync(path.join(OUTPUT, "result.json"), JSON.stringify(result, null, 2));
    console.log("BLUEPRINT_DRAFTING_CURRENT_CONTRACT " + JSON.stringify(result));
  }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { state, assertDraft, SOURCE_FILES };

