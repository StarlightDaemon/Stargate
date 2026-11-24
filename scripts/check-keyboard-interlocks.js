"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { execFileSync } = require("node:child_process");
const { startPreview, selectExhibit } = require("./preview.js");
const { loadPage } = require("./browser-load.js");
const ROOT = path.resolve(__dirname, ".."), OUTPUT = path.join(ROOT, "test/keyboard-interlocks");
const BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1";
const targets = [
  { name: "stargate_solarpunk_ecogrid", css: "style.css", id: "safety-hold-toggle" },
  { name: "stargate_seti_freeform", css: "src/style.css", id: "verificationHoldToggle" }
];
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const browser = await require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer").launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
  const results = [];
  try {
    for (const target of targets) {
      const server = await startPreview({ ...selectExhibit(target.name), port: 0 });
      try {
        for (const baseline of [true, false]) {
          const context = await browser.createBrowserContext(), page = await context.newPage();
          const row = { exhibit: target.name, mode: baseline ? "baseline" : "repaired", errors: [] };
          page.on("pageerror", error => row.errors.push(error.message));
          try {
            if (baseline) {
              const css = execFileSync("git", ["show", BASE + ":" + target.name + "/" + target.css], { cwd: ROOT, encoding: "utf8" });
              await page.setRequestInterception(true);
              page.on("request", request => request.url() === server.url + "/" + target.css ? request.respond({ status: 200, contentType: "text/css", body: css }) : request.continue());
            }
            await page.setViewport({ width: 1920, height: 1080 }); await loadPage(page, server.url);
            assert.equal(await page.$eval("#" + target.id, input => input.checked), false);
            if (baseline) {
              row.display = await page.$eval("#" + target.id, input => { input.focus(); return { display: getComputedStyle(input).display, focused: document.activeElement === input }; });
              assert.equal(row.display.display, "none"); assert.equal(row.display.focused, false);
            } else {
              let reached = false;
              for (let tabs = 1; tabs <= 150; tabs++) {
                await page.keyboard.press("Tab");
                if (await page.evaluate(id => document.activeElement?.id === id, target.id)) { reached = true; row.tabs = tabs; break; }
              }
              assert.equal(reached, true, "Native checkbox must be reachable by Tab");
              row.focus = await page.$eval("#" + target.id, input => ({ visible: input.matches(":focus-visible"), outline: getComputedStyle(input.nextElementSibling).outlineStyle }));
              assert.equal(row.focus.visible, true); assert.equal(row.focus.outline, "solid");
              await page.keyboard.press("Space"); assert.equal(await page.$eval("#" + target.id, input => input.checked), true);
              await page.screenshot({ path: path.join(OUTPUT, target.name + "-keyboard-hold.png") });
              await page.keyboard.press("Space"); assert.equal(await page.$eval("#" + target.id, input => input.checked), false);
            }
            assert.deepEqual(row.errors, []); row.status = "PASS";
          } catch (error) { row.status = "FAIL"; row.error = error.stack; }
          finally { results.push(row); console.log("KEYBOARD_INTERLOCK " + JSON.stringify(row)); await context.close(); }
        }
      } finally { await server.close(); }
    }
    assert.ok(results.every(row => row.status === "PASS"));
  } finally { fs.writeFileSync(path.join(OUTPUT, "report.json"), JSON.stringify({ results, scope: "Native keyboard reachability and toggle only; original interlock functional suites remain separate." }, null, 2)); await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
