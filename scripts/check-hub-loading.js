"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { execFileSync } = require("node:child_process");
const { startPreview, publicAsset } = require("./preview.js");
const ROOT = path.resolve(__dirname, ".."), OUTPUT = path.join(ROOT, "test/hub-loading");
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const files = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8" }).split("\0").filter(file => file && publicAsset(file));
  const server = await startPreview({ root: ROOT, files, port: 0 });
  const browser = await require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer").launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
  const results = [];
  try {
    for (const failure of [false, true]) {
      const context = await browser.createBrowserContext(), page = await context.newPage();
      const row = { mode: failure ? "catalog-failure" : "catalog-success", pageErrors: [] };
      page.on("pageerror", error => row.pageErrors.push(error.message));
      try {
        await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setRequestInterception(true);
        let release;
        const requested = new Promise(resolve => {
          page.on("request", request => {
            if (request.url() === server.url + "/hub/index.json") {
              release = () => failure ? request.respond({ status: 503, contentType: "text/plain", body: "Controlled catalog failure" }) : request.continue();
              resolve();
            } else request.continue();
          });
        });
        await page.goto(server.url + "/hub/index.html", { waitUntil: "domcontentloaded" }); await requested;
        const snapshot = () => page.evaluate(() => ({ busy: document.getElementById("grid").getAttribute("aria-busy"), text: document.getElementById("filter-count").textContent,
          role: document.getElementById("filter-count").getAttribute("role"), atomic: document.getElementById("filter-count").getAttribute("aria-atomic"), hidden: document.getElementById("grid").hidden,
          alert: document.getElementById("empty-state").getAttribute("role"), count: document.getElementById("grid").children.length }));
        row.pending = await snapshot(); assert.equal(row.pending.busy, "true"); assert.equal(row.pending.text, "Loading gallery…");
        assert.equal(row.pending.role, "status"); assert.equal(row.pending.atomic, "true");
        await release(); await page.waitForFunction(() => document.getElementById("grid").getAttribute("aria-busy") === "false");
        row.settled = await snapshot();
        if (failure) { assert.equal(row.settled.text, "Catalog unavailable"); assert.equal(row.settled.hidden, true); assert.equal(row.settled.alert, "alert"); }
        else {
          assert.ok(row.settled.count > 0); assert.notEqual(row.settled.text, "Loading gallery…");
          await page.focus('[data-status="known-issue"]'); await page.keyboard.press("Enter");
          row.keyboardFilter = await page.evaluate(() => window.__hub.report()); assert.equal(row.keyboardFilter.filter, "known-issue"); assert.equal(row.keyboardFilter.visible, 4);
        }
        await page.screenshot({ path: path.join(OUTPUT, row.mode + ".png") });
        assert.deepEqual(row.pageErrors, []); row.status = "PASS";
      } catch (error) { row.status = "FAIL"; row.error = error.stack; }
      finally { results.push(row); console.log("HUB_LOADING " + JSON.stringify(row)); await context.close(); }
    }
    assert.ok(results.every(row => row.status === "PASS"));
  } finally { fs.writeFileSync(path.join(OUTPUT, "report.json"), JSON.stringify({ results, provenance: "PR7 a26cea51dbd404c054e776a535008cc87415e63e", scope: "Loading, failure, live status and keyboard filter; not accessibility certification" }, null, 2)); await browser.close(); await server.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
