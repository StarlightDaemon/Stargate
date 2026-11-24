"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { TARGETS, runSuite } = require("./check-package-entry-security");
test("original Radio launch viewport reaches the owned browser page unchanged", async () => {
  const target = TARGETS.find(row => row.name === "stargate_radio_interferometry"), viewports = [];
  const folder = path.resolve(__dirname, "../test/package-entry-viewport");
  fs.mkdirSync(folder, { recursive: true });
  const page = { on() {}, screenshot: async () => {}, setViewport: async value => viewports.push(value),
    goto: async () => { throw new Error("Controlled stop before browser navigation"); }, close: async () => {} };
  const browser = { createBrowserContext: async () => ({ newPage: async () => page, close: async () => {} }) };
  const result = await runSuite(browser, target, target.suites[0], "http://127.0.0.1:12345", folder);
  assert.deepEqual(viewports, [{ width: 1920, height: 1080, deviceScaleFactor: 1 }]);
  assert.equal(result.status, "FAIL"); assert.match(result.error, /Controlled stop before browser navigation/);
});

