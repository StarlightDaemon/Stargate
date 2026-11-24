"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { legacy } = require("./check-pilot-browsers.js");
const { request, click } = require("./browser-check-helpers.js");
const { selectExhibit, startPreview } = require("./preview.js");
const ROOT = path.resolve(__dirname, ".."), NAME = "stargate_konstrukt_transit";
const DIR = path.join(ROOT, NAME), OUTPUT = path.join(ROOT, "test/konstrukt-security");
const BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function originalSuite(browser, url, mode) {
  const context = await browser.createBrowserContext(), lines = [];
  const folder = path.join(OUTPUT, mode, "original"); fs.mkdirSync(folder, { recursive: true });
  const original = execFileSync("git", ["show", BASE + ":" + NAME + "/tests/test_flow.js"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(fs.readFileSync(path.join(DIR, "tests/test_flow.js"), "utf8").replace(/\r\n/g, "\n"), original.replace(/\r\n/g, "\n"));
  // Only URL, evidence directory and browser ownership change; all eight original phases remain.
  let source = original.replace("http://127.0.0.1:8088/index.html", url + "/index.html")
    .replace("path.join(__dirname, '..', 'screenshots')", JSON.stringify(folder));
  const end = source.indexOf("\nrunTests().catch"); assert.ok(end > 0);
  source = source.slice(0, end) + "\nreturn runTests();";
  const adapter = { executablePath: () => process.env.PUPPETEER_EXECUTABLE_PATH,
    launch: async () => ({ newPage: () => context.newPage(), close: async () => {} }) };
  try {
    await new Function("require", "__dirname", "console", source)(n => n === "puppeteer-core" ? adapter : require(n), path.join(DIR, "tests"),
      { log: (...v) => lines.push(v.map(x => typeof x === "object" ? JSON.stringify(x) : String(x)).join(" ")), error: (...v) => lines.push(v.join(" ")) });
    assert.ok(lines.includes("ALL PUPPETEER VERIFICATION TESTS PASSED PERFECTLY!"));
    assert.equal(lines.filter(l => /^\[TEST [1-8]\]/.test(l)).length, 8);
    return { status: "PASS", phases: 8, originalAssertionBody: "unchanged" };
  } finally { fs.writeFileSync(path.join(folder, "run.log"), lines.join("\n")); await context.close(); }
}
async function qualify(browser, mode) {
  const selection = selectExhibit(NAME);
  const server = mode === "legacy" ? await legacy({ name: NAME, server: "server.js" }) : await startPreview({ ...selection, port: 0 });
  const context = await browser.createBrowserContext();
  const result = { mode, assets: 0, security: [], pageErrors: [], resources: [], requestFailures: [] };
  try {
    for (const file of selection.files) {
      const r = await request(server.url, "/" + file); assert.equal(r.status, 200, file);
      assert.deepEqual(r.body, fs.readFileSync(path.join(DIR, file))); result.assets++;
    }
    for (const [method, url, target] of [["GET", "/../README.md", path.join(ROOT, "README.md")],
      ["GET", "/server.js", path.join(DIR, "server.js")], ["GET", "/tests/test_flow.js", path.join(DIR, "tests/test_flow.js")],
      ["GET", "/package.json", path.join(DIR, "package.json")], ["POST", "/", path.join(DIR, "index.html")]]) {
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
    const state = () => page.$eval("#app-canvas", el => el.className);
    const shot = async name => {
      const file = "konstrukt-" + mode + "-" + name;
      await page.screenshot({ path: path.join(OUTPUT, file + ".png") });
      if (mode === "shared" && process.env.STARGATE_LOG_VISUALS === "1") {
        const data = await page.screenshot({ type: "jpeg", quality: 65, encoding: "base64" });
        for (let offset = 0; offset < data.length; offset += 16000) console.log("STARGATE_VISUAL " + file + ".jpg " + offset + " " + data.slice(offset, offset + 16000));
      }
    };
    await shot("idle");
    for (const glyph of ["01", "03", "05", "02", "07", "04"]) await click(page, "#btn-glyph-V-" + glyph);
    assert.equal(await state(), "state-pending"); await shot("ready");
    await click(page, "#btn-engage-vector"); await delay(300); assert.equal(await state(), "state-buildup");
    await click(page, "#btn-disengage-vector"); await delay(8250);
    result.cancelled = { state: await state(), count: await page.$eval("#reg-count-current", el => el.textContent) };
    assert.deepEqual(result.cancelled, { state: "state-idle", count: "0" }); await shot("cancelled");
    assert.deepEqual(result.pageErrors, []); result.status = "PASS";
    result.acceptance = "Server preservation and bounded cancellation checks; historical operator qualification retained, no new operator acceptance inferred.";
    return result;
  } catch (e) { result.status = "FAIL"; result.error = e.stack; throw e; }
  finally { fs.writeFileSync(path.join(OUTPUT, mode + ".json"), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result)); await context.close(); await server.close(); }
}
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const browser = await require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer").launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, headless: true });
  try {
    const before = await qualify(browser, "legacy"), after = await qualify(browser, "shared");
    for (const key of ["originalSuite", "cancelled"]) assert.deepEqual(after[key], before[key]);
    for (const key of ["resources", "requestFailures"]) assert.deepEqual([...new Set(after[key])].sort(), [...new Set(before[key])].sort());
    console.log("KONSTRUKT_PRESERVATION PASS");
  } finally { await browser.close(); }
}
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
