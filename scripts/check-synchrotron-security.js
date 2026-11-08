"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { request, click } = require("./browser-check-helpers.js");
const { legacy } = require("./check-pilot-browsers.js");
const { startPreview, selectExhibit } = require("./preview.js");
const ROOT = path.resolve(__dirname, ".."), NAME = "stargate_synchrotron_collider";
const DIR = path.join(ROOT, NAME), OUTPUT = path.join(ROOT, "test/synchrotron-security");
const BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const EXPECTED = ["scale1080p", "scale4k", "interlockDefaultsReleased", "negativeAutoFirePassed", "quenchBlockVerified",
  "visibleActivationSuccess", "twoDialDisengageCyclesPassed", "quickDialSuccess", "stagedQuickDialReplay",
  "midReplayScreenshotsDistinct", "midReplayDumpClean", "cornerAttributionValid"];
async function originalSuite(browser, url, mode) {
  const context = await browser.createBrowserContext(), lines = [];
  const folder = path.join(OUTPUT, mode, "original"); fs.mkdirSync(folder, { recursive: true });
  const original = execFileSync("git", ["show", BASE + ":" + NAME + "/verify.js"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(fs.readFileSync(path.join(DIR, "verify.js"), "utf8").replace(/\r\n/g, "\n"), original.replace(/\r\n/g, "\n"), "Original suite must be unchanged");
  // Adapt only URL, evidence location and browser ownership. All original predicates remain.
  let source = original.replace("http://localhost:3042", url)
    .replace("const SCREENSHOT_DIR = path.join(__dirname, 'test_screenshots');", "const SCREENSHOT_DIR = " + JSON.stringify(folder) + ";");
  const end = source.indexOf("\nrunVerification().then");
  assert.ok(end > 0); source = source.slice(0, end) + "\nreturn runVerification();";
  const adapter = { executablePath: () => process.env.PUPPETEER_EXECUTABLE_PATH,
    launch: async () => ({ newPage: () => context.newPage(), close: async () => {} }) };
  try {
    const values = await new Function("require", "__dirname", "console", source)(
      n => n === "puppeteer-core" ? adapter : require(n), DIR,
      { log: (...v) => lines.push(v.map(x => typeof x === "object" ? JSON.stringify(x) : String(x)).join(" ")),
        error: (...v) => lines.push(v.map(String).join(" ")) });
    fs.writeFileSync(path.join(folder, "results.json"), JSON.stringify(values, null, 2));
    assert.deepEqual(Object.keys(values).sort(), [...EXPECTED].sort(), "All original predicates must execute");
    for (const name of EXPECTED.filter(name => name !== "cornerAttributionValid")) assert.equal(values[name], true, "Original assertion: " + name);
    // The retained suite pins the old displayed version. Keep that result visible,
    // then enforce the identical attribution checks against current metadata.
    const cornerLine = lines.find(line => line.startsWith("Corner Attribution: "));
    assert.ok(cornerLine, "Original attribution observation must execute");
    const corner = JSON.parse(cornerLine.slice("Corner Attribution: ".length));
    const version = JSON.parse(fs.readFileSync(path.join(DIR, "version.json"), "utf8")).version;
    assert.equal(corner.attrHref, "https://github.com/StarlightDaemon");
    assert.equal(corner.attrText, "StarlightDaemon"); assert.ok(corner.attrRel.includes("noopener"));
    assert.equal(corner.version, "v" + version, "Displayed version must match current metadata");
    assert.equal(values.cornerAttributionValid, corner.version === "v1.1.0", "Historical predicate remains unchanged");
    return { status: values.cornerAttributionValid ? "PASS" : "FAIL", assertions: values,
      currentMetadataContract: { status: "PASS", observed: corner, expectedVersion: "v" + version },
      note: "Original twelve predicates retained; old literal v1.1.0 mismatch remains FAIL. Current metadata and unchanged attribution are independently enforced." };
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
      ["GET", "/verify.js", path.join(DIR, "verify.js")],
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
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(server.url, { waitUntil: "networkidle0" });
    const snapshot = () => page.evaluate(() => {
      const a = window.arcApp, p = a.physicsCanvas;
      return { state: a.state, count: a.lockedSectors.length, hold: a.quenchInterlockActive,
        canvas: p.state, portal: p.portalHorizonRadius, target: p.portalHorizonTarget,
        replayTimers: a.coordinateReplayTimers.length, detectorRate: synchrotronAudio.geigerRate };
    });
    const shot = async name => {
      const file = "synchrotron-" + mode + "-" + name;
      await page.screenshot({ path: path.join(OUTPUT, file + ".png") });
      if (mode === "shared" && process.env.STARGATE_LOG_VISUALS === "1") {
        const data = await page.screenshot({ type: "jpeg", quality: 65, encoding: "base64" });
        for (let offset = 0; offset < data.length; offset += 16000) console.log("STARGATE_VISUAL " + file + ".jpg " + offset + " " + data.slice(offset, offset + 16000));
      }
    };
    const dial = async () => {
      for (const n of [3, 7, 11, 2, 14, 8]) { await click(page, "#sec-btn-" + n); await click(page, "#btn-engage-sector"); }
    };
    const idle = async () => {
      const s = await snapshot(); assert.equal(s.state, "STANDBY"); assert.equal(s.count, 0);
      assert.equal(s.canvas, "STANDBY"); assert.equal(s.target, 0); return s;
    };
    result.initial = await idle(); assert.equal(result.initial.hold, false); await shot("idle");
    for (let cycle = 0; cycle < 2; cycle++) {
      await dial(); await delay(700);
      const ready = await snapshot(); assert.equal(ready.state, "ARMED"); assert.equal(ready.count, 6); assert.equal(ready.target, 0); assert.ok(ready.portal < 0.01);
      if (!cycle) await shot("ready");
      await click(page, "#btn-trigger-collision"); await delay(400);
      const ramp = await snapshot(); assert.equal(ramp.state, "ACTIVATING");
      if (!cycle) await shot("activation");
      await page.waitForFunction(() => window.arcApp.state === "ACTIVE_COLLISION");
      await delay(400);
      const active = await snapshot(); assert.ok(active.portal > 50);
      if (!cycle) await shot("active");
      await click(page, "#btn-beam-dump"); await delay(400);
      // The existing renderer interpolates portal radius toward zero after dump.
      await page.waitForFunction(() => window.arcApp.physicsCanvas.portalHorizonRadius < 0.01, { timeout: 5000 });
      const dumped = await idle();
      result.cycles.push({ ready: ready.state, ramp: ramp.state, active: active.state, dumped: dumped.state, cleared: dumped.count });
    }
    await shot("dumped");
    await click(page, ".quick-dial-btn");
    const counts = [], start = Date.now();
    while (Date.now() - start < 3000) { const s = await snapshot(); counts.push({ state: s.state, count: s.count }); await delay(80); }
    result.preset = [...new Set(counts.map(s => s.count))];
    assert.ok(result.preset.some(n => n > 0 && n < 6), "Preset must visibly stage");
    assert.ok(counts.every(s => ["STANDBY", "ARMED"].includes(s.state)), "No preset auto-fire");
    const ready = await snapshot(); assert.equal(ready.state, "ARMED"); assert.equal(ready.count, 6); assert.equal(ready.target, 0); assert.ok(ready.portal < 0.01);
    await click(page, "#btn-trigger-collision"); await delay(500); await click(page, "#btn-beam-dump");
    await delay(8250); result.cancelled = await idle(); assert.equal(result.cancelled.replayTimers, 0); assert.ok(result.cancelled.portal < 0.01);
    await shot("cancelled");
    result.metadataObservation = await page.$eval("#corner-version", el => el.textContent.trim());
    result.metadataVersion = JSON.parse(fs.readFileSync(path.join(DIR, "version.json"))).version;
    assert.equal(result.metadataObservation, "v" + result.metadataVersion);
    result.acceptance = "Current metadata alignment and preservation checked. Historical version-literal FAIL retained; full operator and sound acceptance not established.";
    assert.deepEqual(result.pageErrors, []);
    result.status = "PASS";
    return result;
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
    assert.deepEqual(shared.originalSuite, baseline.originalSuite);
    assert.deepEqual(shared.cycles, baseline.cycles);
    // Portal decay is frame-timed; both modes independently require radius <0.01.
    for (const key of ["state", "count", "hold", "canvas", "target", "replayTimers", "detectorRate"])
      assert.equal(shared.cancelled[key], baseline.cancelled[key], "Cancelled " + key);
    for (const key of ["resources", "requestFailures"]) assert.deepEqual([...new Set(shared[key])].sort(), [...new Set(baseline[key])].sort(), key);
    console.log("SYNCHROTRON_PRESERVATION PASS");
  } finally { await browser.close(); }
}
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
