"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { metadata, staticReferences, parseArgs } = require("./verify.js");
const base = path.resolve(__dirname, "../test"); fs.mkdirSync(base, { recursive: true });

test("browser load waits for both readiness signals within one unchanged deadline", async () => {
  const { loadPage } = require("./browser-load.js");
  let clock = 100, idle;
  const response = { status: () => 200 };
  const page = {
    async goto(url, options) { assert.equal(url, "http://fixture/"); assert.deepEqual(options, { waitUntil: "load", timeout: 15000 }); clock += 900; return response; },
    async waitForNetworkIdle(options) { idle = options; }
  };
  assert.equal(await loadPage(page, "http://fixture/", 15000, () => clock), response);
  assert.deepEqual(idle, { idleTime: 500, timeout: 14100 });
  page.goto = async () => { clock += 15001; return response; };
  await assert.rejects(loadPage(page, "http://fixture/", 15000, () => clock), /exhausted/);
  page.goto = async () => response;
  page.waitForNetworkIdle = async () => { throw new Error("still requesting"); };
  await assert.rejects(loadPage(page, "http://fixture/", 15000, () => clock), /still requesting/);
});
test("reference audit catches missing, case-mismatched and escaping assets while decoding valid paths", () => {
  const root = fs.mkdtempSync(path.join(base, "references-"));
  fs.writeFileSync(path.join(root, "index.html"), '<script src="app.js"></script><img src="hello%20world.svg"><link href="style.css"><a href="#section">Section</a>');
  fs.writeFileSync(path.join(root, "app.js"), 'import "./module.js";');
  fs.writeFileSync(path.join(root, "style.css"), 'body {background: url("hello%20world.svg")} .noise {background:url(\'data:image/svg+xml,%3Csvg%3E%3Crect filter="url(%23noiseFilter)"/%3E%3C/svg%3E\')}');
  fs.writeFileSync(path.join(root, "hello world.svg"), "<svg/>");
  fs.writeFileSync(path.join(root, "module.js"), "export {};");
  const files = ["index.html", "app.js", "style.css", "hello world.svg", "module.js"];
  assert.deepEqual(staticReferences(root, files).errors, []);
  fs.appendFileSync(path.join(root, "index.html"), '<img src="Missing.png"><img src="Hello%20world.svg"><img src="../private.png"><img src="%ZZ"><script src="https://example.invalid/app.js"></script>');
  const result = staticReferences(root, files);
  assert.equal(result.errors.length, 4); assert.equal(result.external.length, 1);
  fs.unlinkSync(path.join(root, "module.js"));
  const missing = staticReferences(root, files.filter(f => f !== "module.js"));
  assert.ok(missing.errors.some(e => e.includes("module.js")));
});
test("metadata errors remain failures even when a test harness exists", () => {
  const root = fs.mkdtempSync(path.join(base, "metadata-"));
  fs.writeFileSync(path.join(root, "README.md"), "# Fixture\n\nAn exhibit.\n");
  fs.writeFileSync(path.join(root, "CHANGELOG.md"), "**Built by:** original builder\n");
  fs.writeFileSync(path.join(root, ".gitignore"), "node_modules/\n");
  fs.writeFileSync(path.join(root, "version.json"), '{"version":"1.0.0","model":"original builder"}');
  const files = ["README.md", "CHANGELOG.md", ".gitignore", "version.json"];
  assert.deepEqual(metadata(root, files), []);
  assert.ok(metadata(root, files.filter(f => f !== ".gitignore")).includes("Missing tracked .gitignore"));
  fs.writeFileSync(path.join(root, "version.json"), "{broken");
  assert.ok(metadata(root, files).includes("Invalid version.json"));
});
test("target selection rejects ambiguous or incomplete flags", () => {
  assert.throws(() => parseArgs(["--changed", "main", "--exhibit", "example"]));
  assert.throws(() => parseArgs(["--exhibit"]));
  assert.throws(() => parseArgs(["--unknown"]));
  assert.equal(parseArgs(["--suites"]).suites, true);
  assert.deepEqual(parseArgs(["--exhibit", "example", "--http"]).exhibits, ["example"]);
});
