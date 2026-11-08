"use strict";
// Historical/shared transport and browser preservation; operator acceptance is separate.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { request, click } = require("./browser-check-helpers.js");
const { legacy } = require("./check-pilot-browsers.js");
const { selectExhibit, startPreview } = require("./preview.js");
const ROOT = path.resolve(__dirname, "..");
const TARGET = { name: "stargate_reactor_criticality", server: "scripts/server.js" };
const OUTPUT = path.join(ROOT, "test", "reactor-security");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function qualify(browser, mode) {
  const selection = selectExhibit(TARGET.name);
  const server = mode === "legacy" ? await legacy(TARGET) : await startPreview({ ...selection, port: 0 });
  const context = await browser.createBrowserContext();
  const result = { mode, assets: 0, security: [], pageErrors: [], resources: [], requestFailures: [], cycles: [], screenshots: [] };
  try {
    for (const file of selection.files) {
      const response = await request(server.url, "/" + file);
      assert.equal(response.status, 200, file);
      assert.deepEqual(response.body, fs.readFileSync(path.join(selection.root, file)), file);
      result.assets++;
    }
    for (const [method, url, expected, file] of [
      ["GET", "/../README.md", 403, path.join(ROOT, "README.md")],
      ["GET", "/../stargate_blueprint_alpha/index.html", 403, path.join(ROOT, "stargate_blueprint_alpha/index.html")],
      ["GET", "/scripts/server.js", 403, path.join(selection.root, "scripts/server.js")],
      ["POST", "/", 405, path.join(selection.root, "index.html")]
    ]) {
      const response = await request(server.url, url, method);
      assert.equal(response.status, mode === "legacy" ? 200 : expected, method + " " + url);
      if (mode === "legacy") assert.deepEqual(response.body, fs.readFileSync(file));
      assert.equal(response.headers["access-control-allow-origin"], mode === "legacy" ? "*" : undefined);
      result.security.push({ method, url, status: response.status, cors: response.headers["access-control-allow-origin"] ?? null, expectedBytesMatched: mode === "legacy" });
    }
    const page = await context.newPage();
    page.on("pageerror", e => result.pageErrors.push(e.message));
    page.on("response", r => { if (r.status() >= 400) result.resources.push(r.url().replace(server.url, "ORIGIN") + ":" + r.status()); });
    page.on("requestfailed", r => result.requestFailures.push(r.url().replace(server.url, "ORIGIN")));
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(server.url, { waitUntil: "networkidle0" });
    const waitState = state => page.waitForFunction(s => window.reactorPhysics?.state === s, { timeout: 15000 }, state);
    const snapshot = () => page.evaluate(() => ({
      state: reactorPhysics.state, count: reactorPhysics.selectedSequence.length,
      hold: reactorPhysics.rpsHoldEngaged, calibrating: reactorPhysics.channels.filter(c => c.isCalibrating).length,
      locked: reactorPhysics.channels.filter(c => c.isCalibrated).length,
      presetRunning: hmiApp.presets.isRunning,
      bannerHidden: document.getElementById("aperture-activation-banner").classList.contains("hidden")
    }));
    const shot = async name => {
      const filename = "reactor-" + mode + "-" + name;
      result.screenshots.push({ file: filename + ".png", snapshot: await snapshot() });
      await page.screenshot({ path: path.join(OUTPUT, filename + ".png") });
      if (mode === "shared" && process.env.STARGATE_LOG_VISUALS === "1") {
        const data = await page.screenshot({ type: "jpeg", quality: 65, encoding: "base64" });
        for (let offset = 0; offset < data.length; offset += 16000)
          console.log("STARGATE_VISUAL " + filename + ".jpg " + offset + " " + data.slice(offset, offset + 16000));
      }
    };
    await waitState("SUBCRITICAL");
    assert.equal((await snapshot()).hold, false);
    await shot("idle");
    for (let cycle = 0; cycle < 2; cycle++) {
      const channels = [0, 2, 4, 5, 7, 9];
      for (let i = 0; i < channels.length; i++) {
        await click(page, "#channel-btn-" + channels[i]);
        await page.waitForFunction(n => reactorPhysics.selectedSequence.length === n, { timeout: 10000 }, i + 1);
      }
      await waitState("PENDING"); await delay(1000); await waitState("PENDING");
      if (!cycle) {
        await shot("ready");
        await click(page, "#rps-toggle-btn");
        assert.equal((await snapshot()).hold, true);
        // The existing UI leaves activation enabled and rejects it with an alert.
        let warning;
        page.once("dialog", async dialog => { warning = dialog.message(); await dialog.accept(); });
        await click(page, "#activate-criticality-btn");
        assert.match(warning || "", /RPS.*HOLD ACTIVE/);
        await delay(500); await waitState("PENDING");
        result.interlock = { blockedActivation: true, warning };
        await click(page, "#rps-toggle-btn");
      }
      assert.equal(await page.$eval("#activate-criticality-btn", el => el.disabled), false);
      await click(page, "#activate-criticality-btn");
      await waitState("BUILDUP"); await delay(400);
      if (!cycle) await shot("buildup");
      await waitState("BREAKTHROUGH");
      if (!cycle) await shot("breakthrough");
      await waitState("SUSTAINED");
      if (!cycle) await shot("active");
      assert.equal(await page.$eval("#scram-disengage-btn", el => el.disabled), false);
      await click(page, "#scram-disengage-btn");
      await waitState("SUBCRITICAL");
      const after = await snapshot();
      assert.equal(after.count, 0); assert.equal(after.locked, 0); assert.equal(after.calibrating, 0);
      result.cycles.push({ manualNoAutoFire: true, stages: ["BUILDUP", "BREAKTHROUGH", "SUSTAINED"], scram: after });
    }
    await page.select("#preset-dropdown", "CRIT-B04");
    await click(page, "#run-preset-autodial-btn");
    result.presetCounts = [];
    const deadline = Date.now() + 15000;
    let captured = false;
    while (Date.now() < deadline) {
      const current = await snapshot();
      if (!result.presetCounts.includes(current.count)) result.presetCounts.push(current.count);
      if (!captured && current.count > 0 && current.count < 6) { await shot("preset-dialing"); captured = true; }
      if (current.state === "PENDING" && !current.presetRunning) break;
      await delay(80);
    }
    assert.ok(captured, "Preset must dial visibly in steps");
    await waitState("PENDING"); await delay(1000); await waitState("PENDING");
    assert.equal((await snapshot()).count, 6);
    result.presetNoAutoFire = true;
    await click(page, "#activate-criticality-btn");
    await waitState("BUILDUP"); await delay(500);
    await click(page, "#scram-disengage-btn"); await delay(8250);
    const cancelled = await snapshot();
    assert.equal(cancelled.state, "SUBCRITICAL"); assert.equal(cancelled.count, 0);
    assert.equal(cancelled.locked, 0); assert.equal(cancelled.calibrating, 0);
    assert.equal(cancelled.presetRunning, false); assert.equal(cancelled.bannerHidden, true);
    result.cancelled = cancelled;
    await shot("cancelled");
    assert.deepEqual(result.pageErrors, []);
    result.status = "PASS";
  } catch (e) { result.status = "FAIL"; result.error = e.stack; }
  finally { await context.close(); await server.close(); }
  return result;
}
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const report = { scope: "Original mock-DOM integration suite plus real HTTP/browser historical/shared preservation; no operator or sound-quality qualification.", results: [] };
  let browser;
  try {
    const original = execFileSync(process.execPath, ["tests/integration_test.js"], {
      cwd: path.join(ROOT, TARGET.name), encoding: "utf8", timeout: 30000, windowsHide: true
    });
    fs.writeFileSync(path.join(OUTPUT, "original-integration.log"), original);
    assert.match(original, /ALL TESTS PASSED: 79 \/ 79 assertions verified!/);
    report.originalSuite = { status: "PASS", assertions: 79, kind: "Original unmodified mock-DOM engine integration suite" };
    console.log(JSON.stringify(report.originalSuite));
    const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer");
    browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
    for (const mode of ["legacy", "shared"]) {
      const result = await qualify(browser, mode);
      report.results.push(result); console.log(JSON.stringify(result));
    }
    assert.ok(report.results.every(r => r.status === "PASS"), "Reactor preservation checks failed");
    const [before, after] = report.results;
    assert.deepEqual([...new Set(after.resources)].sort(), [...new Set(before.resources)].sort(), "Resource regression");
    assert.deepEqual([...new Set(after.requestFailures)].sort(), [...new Set(before.requestFailures)].sort(), "Request regression");
    report.status = "PASS";
  } catch (e) { report.status = "FAIL"; report.error = e.stack; throw e; }
  finally {
    if (browser) await browser.close();
    fs.writeFileSync(path.join(OUTPUT, "report.json"), JSON.stringify(report, null, 2));
  }
}
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
