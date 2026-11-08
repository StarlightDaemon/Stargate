"use strict";
// Security and behavior-preservation evidence, not full exhibit acceptance.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { request, click } = require("./browser-check-helpers.js");
const { legacy } = require("./check-pilot-browsers.js");
const { selectExhibit, startPreview } = require("./preview.js");
const ROOT = path.resolve(__dirname, "..");
const TARGET = { name: "stargate_erebus_signal", server: "server.js" };
const OUTPUT = path.join(ROOT, "test", "erebus-security");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function originalFlow(browser, url, result) {
  const context = await browser.createBrowserContext();
  const diagnostics = [];
  try {
    // Preserve every statement of the original flow; adapt only transport/browser ownership.
    const original = fs.readFileSync(path.join(ROOT, TARGET.name, "test.js"), "utf8");
    const source = original.replace("http://localhost:8000", url).replace("(async () => {", "return (async () => {");
    const browserAdapter = {
      launch: async () => ({
        newPage: async () => { const page = await context.newPage(); await page.setViewport({ width: 1920, height: 1080 }); return page; },
        close: async () => {}
      })
    };
    await new Function("require", "console", "process", "setTimeout", source)(
      name => name === "puppeteer" ? browserAdapter : require(name),
      { log: (...v) => diagnostics.push(v.join(" ")), error: (...v) => diagnostics.push("ERROR " + v.join(" ")) },
      { exit: code => { throw new Error("Original flow exited " + code); } }, setTimeout);
    for (const expected of [
      "Engage disabled before click: false", "Connected after engage: true",
      "Button: DISCONNECT_LINK, disabled: false", "Connected after disengage: false",
      "Sequence after disengage: 0", "Sequence after redial 1 symbol: 1", "DONE"
    ]) assert.ok(diagnostics.includes(expected), "Original diagnostic: " + expected);
    result.originalFlow = { status: "PASS", diagnostics, note: "Original file logs values without assertions; adapter checks all seven expected diagnostics." };
  } finally { await context.close(); }
}
async function qualify(browser, mode) {
  const selection = selectExhibit(TARGET.name);
  const server = mode === "legacy" ? await legacy(TARGET) : await startPreview({ ...selection, port: 0 });
  const context = await browser.createBrowserContext();
  const result = { mode, assets: 0, security: [], pageErrors: [], resources: [], requestFailures: [], cycles: [] };
  try {
    for (const file of selection.files) {
      const response = await request(server.url, "/" + file);
      assert.equal(response.status, 200, file);
      assert.deepEqual(response.body, fs.readFileSync(path.join(selection.root, file)), file);
      result.assets++;
    }
    for (const [method, url, expected, file] of [
      ["GET", "/../README.md", 403, path.join(ROOT, "README.md")],
      ["GET", "/../stargate_bathyscaphe_pilot_fable/index.html", 403, path.join(ROOT, "stargate_bathyscaphe_pilot_fable/index.html")],
      ["GET", "/server.js", 403, null],
      ["POST", "/", 405, path.join(selection.root, "index.html")]
    ]) {
      const response = await request(server.url, url, method);
      assert.equal(response.status, mode === "legacy" ? 200 : expected, method + " " + url);
      if (mode === "legacy" && file) assert.deepEqual(response.body, fs.readFileSync(file));
      result.security.push({ method, url, status: response.status, expectedBytesMatched: mode === "legacy" && file ? true : null });
    }
    await originalFlow(browser, server.url, result);
    const page = await context.newPage();
    page.on("pageerror", e => result.pageErrors.push(e.message));
    page.on("response", r => { if (r.status() >= 400) result.resources.push(r.url().replace(server.url, "ORIGIN") + ":" + r.status()); });
    page.on("requestfailed", r => result.requestFailures.push(r.url().replace(server.url, "ORIGIN")));
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(server.url, { waitUntil: "networkidle0" });
    const shot = async state => {
      const filename = "erebus-" + mode + "-" + state;
      await page.screenshot({ path: path.join(OUTPUT, filename + ".png") });
      if (mode === "shared" && process.env.STARGATE_LOG_VISUALS === "1") {
        const data = await page.screenshot({ type: "jpeg", quality: 65, encoding: "base64" });
        for (let offset = 0; offset < data.length; offset += 16000)
          console.log("STARGATE_VISUAL " + filename + ".jpg " + offset + " " + data.slice(offset, offset + 16000));
      }
    };
    await shot("idle");
    assert.equal(await page.$eval("#signal-lockout", el => el.checked), false);
    for (let cycle = 0; cycle < 2; cycle++) {
      for (let symbol = 0; symbol < 4; symbol++) {
        await click(page, ".symbol-btn:nth-child(" + (symbol + 1) + ")");
        await page.waitForFunction(n => sequence.length === n && !isBusy, { timeout: 10000 }, symbol + 1);
      }
      await delay(1200);
      assert.equal(await page.evaluate(() => isConnected), false, "Manual dialing must not auto-activate");
      assert.equal(await page.$eval("#engage-btn", el => el.disabled), false);
      if (!cycle) await shot("ready");
      await click(page, "#engage-btn");
      // isConnected flips during the 200ms breakthrough flash; sample sustained active afterward.
      await page.waitForFunction(() => isConnected && !isBusy && !document.body.classList.contains("breakthrough-flash"), { timeout: 10000 });
      if (!cycle) await shot("active");
      assert.equal(await page.$eval("#engage-btn", el => el.disabled), false);
      await click(page, "#engage-btn");
      await page.waitForFunction(() => !isConnected && !isBusy && sequence.length === 0, { timeout: 10000 });
      assert.equal(await page.$eval("#surface", el => el.classList.contains("active")), false);
      result.cycles.push({ manualReady: true, active: true, disconnected: true, emptySequence: true });
    }
    await shot("disconnected");
    // Diagnose the existing quick-dial behavior separately from migration equivalence.
    await click(page, ".quick-dial-btn");
    await page.waitForFunction(() => sequence.length === 4 && !isBusy, { timeout: 15000 });
    await delay(1200);
    result.presetAutoActivated = await page.evaluate(() => isConnected);
    result.functionalAcceptance = result.presetAutoActivated ? "FAIL: preset activates without a separate activation click" : "UNVERIFIED: remaining exhibit acceptance";
    assert.deepEqual(result.pageErrors, []);
    result.status = "PASS";
  } catch (e) { result.status = "FAIL"; result.error = e.stack; }
  finally { await context.close(); await server.close(); }
  return result;
}
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer");
  const browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
  const report = { scope: "Erebus raw-HTTP security and historical/shared preservation; full functional/operator acceptance remains separate.", results: [] };
  try {
    for (const mode of ["legacy", "shared"]) {
      const result = await qualify(browser, mode);
      report.results.push(result); console.log(JSON.stringify(result));
    }
    assert.ok(report.results.every(r => r.status === "PASS"), "Erebus preservation checks failed");
    const [before, after] = report.results;
    assert.deepEqual([...new Set(after.resources)].sort(), [...new Set(before.resources)].sort(), "Resource regression");
    assert.deepEqual([...new Set(after.requestFailures)].sort(), [...new Set(before.requestFailures)].sort(), "Request regression");
    assert.equal(after.presetAutoActivated, before.presetAutoActivated, "Preset behavior changed");
    report.status = "PASS";
  } catch (e) { report.status = "FAIL"; report.error = e.message; throw e; }
  finally {
    await browser.close();
    fs.writeFileSync(path.join(OUTPUT, "report.json"), JSON.stringify(report, null, 2));
  }
}
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
