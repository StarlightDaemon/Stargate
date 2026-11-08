"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const { startPreview, selectExhibit } = require("./preview.js"), { click } = require("./browser-check-helpers.js");
const ROOT = path.resolve(__dirname, ".."), TARGET = "stargate_nouveau_nimbus", BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1";
const OUTPUT = path.join(ROOT, "test/nimbus-notes-security"), KEY = "nouveau_nimbus_session_v1";
const NOTES = 'Écriture & <literal>\n</textarea><img data-notes-probe src="data:image/png;base64,!" onerror="window.__notesProbe=(window.__notesProbe||0)+1"><textarea>\nFin';
function original() { return execFileSync("git", ["show", BASE + ":" + TARGET + "/js/app.js"], { cwd: ROOT, encoding: "utf8" }); }
function offline(source) {
  const notes = { addEventListener() {} };
  const App = vm.runInNewContext(source + "\nNimbusApp;", { document: {
    addEventListener() {}, querySelectorAll: () => [], getElementById: id => id === "operator-notes-input" ? notes : null
  } });
  const app = Object.create(App.prototype);
  app.modalTitle = {}; app.modalContent = {}; app.audio = { volumes: {} }; app.state = { sessionData: { operatorNotes: NOTES } };
  app.renderSettingsModal(); return { parsedAsMarkup: app.modalContent.innerHTML.includes('<img data-notes-probe'), value: notes.value };
}
async function run(browser, url, baseline) {
  const context = await browser.createBrowserContext(), page = await context.newPage();
  const result = { mode: baseline ? "baseline-client" : "repaired-client", errors: [] };
  page.on("pageerror", e => result.errors.push(e.message));
  if (baseline) {
    const source = original(); await page.setRequestInterception(true);
    page.on("request", request => request.url() === url + "/js/app.js"
      ? request.respond({ status: 200, contentType: "application/javascript", body: source }) : request.continue());
  }
  try {
    await page.setViewport({ width: 1920, height: 1080 }); await page.goto(url, { waitUntil: "networkidle0" });
    await click(page, "#btn-nav-settings");
    await click(page, "#operator-notes-input"); await page.keyboard.down("Control"); await page.keyboard.press("KeyA"); await page.keyboard.up("Control");
    await page.keyboard.type(NOTES); await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).sessionData.operatorNotes, KEY), NOTES);
    // Reload proves persistence from the ordinary operator-entry path.
    await page.reload({ waitUntil: "networkidle0" }); await click(page, "#btn-nav-settings");
    if (baseline) await page.waitForFunction(() => window.__notesProbe > 0);
    else await new Promise(resolve => setTimeout(resolve, 350));
    result.sentinel = await page.evaluate(() => window.__notesProbe || 0);
    result.injectedElements = await page.$$eval("[data-notes-probe]", nodes => nodes.length);
    result.notesPreserved = await page.$eval("#operator-notes-input", (el, expected) => el.value === expected, NOTES);
    assert.equal(result.sentinel > 0, baseline); assert.equal(result.injectedElements > 0, baseline);
    if (!baseline) assert.equal(result.notesPreserved, true);
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).sessionData.operatorNotes, KEY), NOTES);
    assert.deepEqual(result.errors, []); result.status = "PASS";
  } catch (error) { result.status = "FAIL"; result.error = error.stack; }
  finally { await context.close(); }
  return result;
}
async function main() {
  const before = offline(original()), after = offline(fs.readFileSync(path.join(ROOT, TARGET, "js/app.js"), "utf8"));
  assert.equal(before.parsedAsMarkup, true); assert.equal(after.parsedAsMarkup, false); assert.equal(after.value, NOTES);
  console.log("NIMBUS_NOTES_OFFLINE " + JSON.stringify({ beforeMarkup: before.parsedAsMarkup, afterMarkup: after.parsedAsMarkup, valuePreserved: after.value === NOTES, evidence: "Actual renderer method output; execution awaits browser probe" }));
  if (process.argv.includes("--offline")) return;
  fs.mkdirSync(OUTPUT, { recursive: true }); const results = [];
  const server = await startPreview({ ...selectExhibit(TARGET), port: 0 }); let browser;
  try {
    const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer");
    browser = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, headless: true });
    for (const baseline of [true, false]) { const result = await run(browser, server.url, baseline); results.push(result); console.log("NIMBUS_NOTES_RESULT " + JSON.stringify(result)); }
    assert.ok(results.every(result => result.status === "PASS"));
  } finally {
    fs.writeFileSync(path.join(OUTPUT, "report.json"), JSON.stringify({ baseline: BASE, storageKey: KEY, results }, null, 2));
    if (browser) await browser.close(); await server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
