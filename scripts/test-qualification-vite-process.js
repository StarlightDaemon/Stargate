"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { startOwnedVite } = require("./qualification-vite-process");
const { originalSuiteStatus } = require("./check-package-entry-security");
const ROOT = path.resolve(__dirname, "..");
function fixture(hang, failListen = false) {
  fs.mkdirSync(path.join(ROOT, "test"), { recursive: true });
  const folder = fs.mkdtempSync(path.join(ROOT, "test/vite-owned-process-"));
  const packageFile = path.join(folder, "package.json");
  fs.writeFileSync(packageFile, JSON.stringify({ type: "module" }));
  fs.mkdirSync(path.join(folder, "dist/node"), { recursive: true });
  fs.writeFileSync(path.join(folder, "dist/node/index.js"),
    "import fs from 'node:fs'; import path from 'node:path';\n" +
    "export async function createServer(config) { let cleared=false; fs.writeFileSync(path.join(path.dirname(config.cacheDir),'owned-pid.json'),JSON.stringify(process.pid)); return {\n" +
    "httpServer:{address:()=>({address:'127.0.0.1',port:12345}),closeAllConnections(){cleared=true}},\n" +
    "listen:async()=>{" + (failListen ? "throw new Error('Controlled Vite listen failure');" : "") + "},close:async()=>{ fs.writeFileSync(path.join(path.dirname(config.cacheDir),'close-called.json'),JSON.stringify({cleared}));" +
    (hang ? "await new Promise(()=>{});" : "") + "} }; }\n");
  return { folder, packageFile };
}
test("owned Vite closure clears HTTP connections and completes its process", async () => {
  const f = fixture(false), phases = [];
  const owned = await startOwnedVite({ name: "stargate_blueprint_drafting" }, f.packageFile, f.folder,
    (...args) => phases.push(args), { startup: 5000, close: 2000 });
  assert.equal(owned.url, "http://127.0.0.1:12345");
  await owned.close(); await owned.close();
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.folder, "close-called.json"), "utf8")), { cleared: true });
  assert.ok(phases.some(row => row[0] === "owned-vite-cleanup" && row[1] === "PASS"));
});
test("startup failure closes the created instance and terminates its owned process without PASS", async () => {
  for (const hang of [false, true]) {
    const f = fixture(hang, true), phases = [];
    await assert.rejects(startOwnedVite({ name: "stargate_blueprint_drafting" }, f.packageFile, f.folder,
      (...args) => phases.push(args), { startup: 5000 }), /Controlled Vite listen failure/);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.folder, "close-called.json"), "utf8")), { cleared: true });
    const pid = JSON.parse(fs.readFileSync(path.join(f.folder, "owned-pid.json"), "utf8"));
    assert.throws(() => process.kill(pid, 0), { code: "ESRCH" }, "Failed owned child has exited");
    assert.ok(phases.some(row => row[0] === "owned-vite-startup" && row[1] === "FAIL"));
    assert.ok(!phases.some(row => row[1] === "PASS"), "Partial startup never becomes PASS");
    if (hang) assert.match(fs.readFileSync(path.join(f.folder, "vite-listener.log"), "utf8"), /cleanup exceeded 1000ms/);
  }
});
test("hung framework cleanup is bounded and fails after terminating only its child", async () => {
  const f = fixture(true), phases = [];
  const owned = await startOwnedVite({ name: "stargate_blueprint_drafting" }, f.packageFile, f.folder,
    (...args) => phases.push(args), { startup: 5000, close: 100 });
  await assert.rejects(owned.close(), /Vite close API exceeded 100ms/);
  assert.ok(phases.some(row => row[0] === "owned-vite-cleanup" && row[1] === "FAIL"));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.folder, "close-called.json"), "utf8")), { cleared: true });
});
test("original-suite summary stays separate from cleanup and cancellation", () => {
  const target = { suites: [{ file: "original.js" }] };
  const pass = { status: "FAIL", cleanupError: "controlled", suites: [{ suite: "original.js", status: "PASS" }] };
  assert.equal(originalSuiteStatus(target, []), "UNVERIFIED");
  assert.equal(originalSuiteStatus(target, [pass, pass]), "PASS");
  assert.equal(originalSuiteStatus(target, [pass, { suites: [] }]), "UNVERIFIED");
  assert.equal(originalSuiteStatus(target, [pass, { suites: [{ suite: "original.js", status: "FAIL" }] }]), "FAIL");
  assert.equal(originalSuiteStatus(target, [pass, { suites: [...pass.suites, ...pass.suites] }]), "UNVERIFIED");
});

