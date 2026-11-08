"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { verifyLock, planManifest, parse } = require("./prepare-exhibit-dependency-candidates.js");
const BASE = path.resolve(__dirname, "../test"); fs.mkdirSync(BASE, { recursive: true });
function fixture(lock, candidate = {}) {
  const folder = fs.mkdtempSync(path.join(BASE, "candidate-lock-test-"));
  fs.writeFileSync(path.join(folder, "package-lock.json"), JSON.stringify({ name: path.basename(folder), ...lock }));
  return () => verifyLock(folder, { candidate, changes: [], refresh: [] });
}
test("modern npm anonymous empty graph is valid only without declarations or entries", () => {
  fixture({ lockfileVersion: 3, requires: true, packages: {} })();
  assert.throws(fixture({ lockfileVersion: 1, packages: {} }), /Modern npm lock version/);
  assert.throws(fixture({ lockfileVersion: 3, packages: {} }, { dependencies: { vite: "^6.4.4" } }), /without dependency declarations/);
  assert.throws(fixture({ lockfileVersion: 3, packages: { "node_modules/example": { version: "1.0.0" } } }), /empty lock graph/);
  assert.throws(fixture({ lockfileVersion: 3, packages: {} }, { workspaces: ["other"] }), /workspace/);
  assert.throws(fixture({ name: "wrong", lockfileVersion: 3, packages: {} }), /Lock name/);
});
test("empty graph exception cannot bypass duplicated browser or metadata guards", () => {
  assert.throws(fixture({ lockfileVersion: 3, packages: { "": {}, "node_modules/puppeteer": { version: "25.16.0" } } }), /redundant browser/);
  assert.throws(fixture({ lockfileVersion: 3, packages: { "": { name: "wrong" } } }, { name: "expected" }), /Lock name|name consistency/);
  assert.throws(() => parse(["--exhibit", "Stargate_OG"]), /flagship excluded/);
  assert.throws(() => parse(["--emit"]), /requires clean install/);
  const source = { name: "fixture", scripts: { start: "node scripts/server.js" }, devDependencies: { puppeteer: "^25.9.0", express: "^4.22.2" }, overrides: { qs: "6.16.0" } };
  const plan = planManifest("stargate_apiculture_telemetry", source);
  assert.deepEqual(plan.candidate.scripts, source.scripts); assert.equal(plan.candidate.devDependencies, undefined); assert.equal(plan.candidate.overrides, undefined);
  assert.ok(plan.changes.some(change => change.provenance?.includes("/pull/6")));
});
