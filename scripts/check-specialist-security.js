"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const http = require("node:http"), vm = require("node:vm");
const { Writable } = require("node:stream"), { once } = require("node:events"), { execFileSync } = require("node:child_process");
const { createPreviewServer, selectExhibit } = require("./preview.js");
const { request } = require("./browser-check-helpers.js");
const ROOT = path.resolve(__dirname, ".."), BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1";
const OUTPUT = path.join(ROOT, "test/specialist-security");
const TARGETS = [
  { name: "stargate_atompunk_fable", suite: "test/run-tests.mjs", kind: "esm", checks: 104 },
  { name: "stargate_canopy_commons", suite: "test/run-tests.mjs", kind: "esm", checks: 102 },
  { name: "stargate_dark_gothic_fable", suite: "test/run-tests.mjs", kind: "esm", checks: 109 },
  { name: "stargate_nouveau_nimbus", suite: "test/verify.js", kind: "cjs", checks: 37 },
  { name: "stargate_futurist_dynamism", suite: "test/verify.js", kind: "server" }
];
function historical(target, file) {
  return execFileSync("git", ["show", BASE + ":" + target.name + "/" + file], { cwd: ROOT, encoding: "utf8" });
}
function original(target) {
  const source = historical(target, target.suite);
  assert.equal(fs.readFileSync(path.join(ROOT, target.name, target.suite), "utf8").replace(/\r\n/g, "\n"),
    source.replace(/\r\n/g, "\n"), "Original suite remains unchanged");
  return source;
}
function baselineModule(target, createServer) {
  const module = { exports: {} };
  const load = name => name === "http" ? { ...http, createServer } : require(name);
  load.main = {}; // Import mode: the original CLI guard must not listen.
  vm.runInNewContext(historical(target, "server.js"), {
    require: load, module, exports: module.exports, __dirname: path.join(ROOT, target.name),
    process: { env: {}, on() {}, once() {} }, console: { log() {}, error() {} }, URL
  }, { filename: target.name + "/historical-server.js" });
  return module.exports;
}
function probes(target) {
  return [["GET", "/server.js", "server.js"], ["GET", "/" + target.suite, target.suite],
    ["GET", "/package.json", "package.json"], ["POST", "/", "index.html"]];
}
async function offline(target) {
  let handler;
  const api = baselineModule(target, fn => {
    handler = fn; return { listen() { return this; }, on() { return this; } };
  });
  if (target.kind !== "server") api.startServer(0);
  assert.equal(typeof handler, "function");
  const security = [];
  for (const [method, url, file] of probes(target)) {
    const response = await new Promise((resolve, reject) => {
      let status; const chunks = [];
      const out = new Writable({ write(chunk, enc, done) { chunks.push(Buffer.from(chunk)); done(); } });
      out.writeHead = code => { status = code; return out; };
      out.once("error", reject); out.once("finish", () => resolve({ status, body: Buffer.concat(chunks) }));
      try { handler({ method, url }, out); } catch (error) { reject(error); }
    });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, fs.readFileSync(path.join(ROOT, target.name, file)));
    security.push({ method, url, status: response.status, exactTargetBytes: true });
  }
  let malformed;
  if (target.name !== "stargate_nouveau_nimbus") {
    assert.throws(() => handler({ method: "GET", url: "/%ZZ" }, {}), error => error.name === "URIError");
    malformed = "Original handler throws URIError synchronously on /%ZZ; not sent to a live process.";
  }
  return { exhibit: target.name, security, malformed, evidence: "Offline original handler only; no HTTP/browser acceptance" };
}
async function serving(target, mode) {
  let server;
  if (mode === "legacy") {
    const api = baselineModule(target, handler => {
      const current = http.createServer(handler);
      // Only historical binding changes; the request handler remains verbatim.
      current.listen = function() { return http.Server.prototype.listen.call(this, 0, "127.0.0.1"); };
      return current;
    });
    if (target.kind === "server") {
      assert.ok(api instanceof http.Server); assert.equal(api.listening, false);
      server = api.listen(0); assert.equal(server, api);
    } else {
      assert.equal(typeof api.startServer, "function"); server = api.startServer(0);
    }
  } else {
    const api = createPreviewServer(selectExhibit(target.name));
    assert.ok(api instanceof http.Server); assert.equal(api.listening, false);
    server = api.listen(0); assert.equal(server, api);
  }
  assert.ok(server instanceof http.Server, "Synchronous native Server import contract");
  if (!server.listening) await once(server, "listening");
  assert.equal(server.address().address, "127.0.0.1");
  return { server, url: "http://127.0.0.1:" + server.address().port, async close() {
    if (server.listening) await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve()); server.closeAllConnections();
    });
  } };
}
function replaceOnce(source, before, after) {
  assert.equal(source.split(before).length, 2, "Exactly one transport/artifact adaptation: " + before);
  return source.replace(before, after);
}
async function originalSuite(browser, target, url, folder) {
  const context = await browser.createBrowserContext(), lines = [], pageErrors = [], resources = [];
  fs.mkdirSync(folder, { recursive: true });
  const processAdapter = { env: process.env, cwd: () => ROOT, exitCode: 0, exit(code) { this.exitCode = code; } };
  const fakeServer = { close() {}, listen() { return this; } };
  const puppeteer = { executablePath: () => process.env.PUPPETEER_EXECUTABLE_PATH,
    launch: async () => ({ async newPage() {
      const page = await context.newPage();
      page.on("pageerror", e => pageErrors.push(e.message));
      page.on("response", r => { if (r.status() >= 400) resources.push(r.url().replace(url, "ORIGIN") + ":" + r.status()); });
      return page;
    }, close: async () => {} }) };
  const log = { log: (...v) => lines.push(v.map(x => typeof x === "object" ? JSON.stringify(x) : String(x)).join(" ")),
    error: (...v) => lines.push(v.map(x => x?.stack || String(x)).join(" ")) };
  let source = original(target), result;
  const originalURL = String.fromCharCode(96) + "http://localhost:" + "$" + "{PORT}/" + String.fromCharCode(96) + ";";
  try {
    if (target.kind === "esm") {
      // Import binding/browser/server/evidence ownership changes only. All
      // original functional assertions and timing/pixel analysis stay intact.
      const start = source.indexOf("const PORT = "), end = source.lastIndexOf("\nmain()");
      assert.ok(start >= 0 && end > start); source = source.slice(start, end);
      source = replaceOnce(source, "const url = " + originalURL, "const url = " + JSON.stringify(url + "/") + ";");
      const PNG = require(process.env.STARGATE_PNG_MODULE).PNG;
      result = await new Function("fs", "path", "os", "puppeteer", "PNG", "__dirname", "startServer", "process", "console",
        source + "\nreturn main().then(() => ({ results }), error => ({ results, error: error.stack }));")(
        fs, path, require("node:os"), puppeteer, PNG, path.join(folder, "test"), () => fakeServer, processAdapter, log);
      result.passed = result.results.filter(value => value.ok).length;
      result.failed = result.results.length - result.passed;
      result.expectedChecks = target.checks; result.complete = result.results.length === target.checks;
    } else {
      const end = source.lastIndexOf("\nrunVerification();"); assert.ok(end > 0); source = source.slice(0, end);
      const constant = target.kind === "server" ? "const BASE_URL = " : "const url = ";
      source = replaceOnce(source, constant + originalURL, constant + JSON.stringify(url + "/") + ";");
      const screenshotName = target.kind === "server" ? "SCREENSHOT_DIR" : "SCREENSHOTS_DIR";
      source = replaceOnce(source, "const " + screenshotName + " = path.join(__dirname, 'screenshots');",
        "const " + screenshotName + " = " + JSON.stringify(path.join(folder, "screenshots")) + ";");
      const load = name => name === "puppeteer" ? puppeteer : name === "../server.js"
        ? target.kind === "server" ? fakeServer : { startServer: () => fakeServer } : require(name);
      await new Function("require", "__dirname", "process", "console", source + "\nreturn runVerification();")(
        load, path.join(ROOT, target.name, "test"), processAdapter, log);
      if (target.kind === "cjs") {
        const summary = lines.map(line => line.match(/VERIFICATION RESULTS: (\d+) PASSED \/ (\d+) FAILED \(TOTAL: (\d+)\)/)).find(Boolean);
        assert.ok(summary, "Original suite summary");
        result = { passed: Number(summary[1]), failed: Number(summary[2]), total: Number(summary[3]), expectedChecks: target.checks,
          complete: Number(summary[3]) === target.checks };
      } else result = { complete: lines.some(line => line.includes("ALL AUTOMATED VERIFICATION TESTS PASSED WITH 100% SUCCESS!")),
        note: "Original thrown predicates enforced; original unasserted PASS-labelled observations remain observations." };
    }
    result.exitCode = processAdapter.exitCode;
    result.status = result.complete && !result.error && !result.failed && !result.exitCode ? "PASS" : "FAIL";
    result.pageErrors = pageErrors; result.resources = [...new Set(resources)].sort();
    return result;
  } catch (error) {
    result = { status: "FAIL", error: error.stack, exitCode: processAdapter.exitCode, pageErrors, resources }; return result;
  } finally {
    fs.writeFileSync(path.join(folder, "run.log"), lines.join("\n"));
    fs.writeFileSync(path.join(folder, "result.json"), JSON.stringify(result, null, 2));
    if (process.env.STARGATE_LOG_VISUALS === "1" && folder.includes(path.sep + "shared" + path.sep)) {
      // Encode already-captured evidence after all timed predicates finish, so
      // connector-visible screenshots cannot perturb the original stage timing.
      const imagePage = await context.newPage();
      const files = fs.readdirSync(folder, { recursive: true }).filter(file => /(?:cold_start_1080p|stage[123]_).*\.png$/.test(file));
      for (const file of files) {
        const data = await imagePage.evaluate(async base64 => {
          const image = new Image(); image.src = "data:image/png;base64," + base64; await image.decode();
          const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height;
          canvas.getContext("2d").drawImage(image, 0, 0);
          return canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
        }, fs.readFileSync(path.join(folder, file)).toString("base64"));
        for (let offset = 0; offset < data.length; offset += 16000)
          console.log("STARGATE_VISUAL " + target.name + "-shared-" + path.basename(file, ".png") + ".jpg " + offset + " " + data.slice(offset, offset + 16000));
      }
    }
    await context.close();
  }
}
async function qualify(browser, target, mode) {
  const folder = path.join(OUTPUT, target.name, mode); fs.mkdirSync(folder, { recursive: true });
  const server = await serving(target, mode), selection = selectExhibit(target.name);
  const result = { exhibit: target.name, mode, assets: 0, security: [], importContract: "PASS" };
  try {
    for (const file of selection.files) {
      const response = await request(server.url, "/" + file);
      assert.equal(response.status, 200, file); assert.deepEqual(response.body, fs.readFileSync(path.join(selection.root, file)));
      result.assets++;
    }
    for (const [method, url, file] of probes(target)) {
      const response = await request(server.url, url, method);
      assert.equal(response.status, mode === "legacy" ? 200 : method === "POST" ? 405 : 403);
      if (mode === "legacy") assert.deepEqual(response.body, fs.readFileSync(path.join(selection.root, file)));
      result.security.push({ method, url, status: response.status });
    }
    if (mode === "shared") assert.equal((await request(server.url, "/%ZZ")).status, 400);
    result.original = await originalSuite(browser, target, server.url, path.join(folder, "original"));
    result.status = result.original.status;
    result.acceptance = "Preservation evidence only; original operator/creative-fit dispositions unchanged.";
    return result;
  } catch (error) { result.status = "FAIL"; result.error = error.stack; throw error; }
  finally {
    fs.writeFileSync(path.join(folder, "result.json"), JSON.stringify(result, null, 2));
    console.log("SPECIALIST_RESULT " + JSON.stringify(result)); await server.close();
  }
}
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const names = process.argv.slice(2).filter(value => value !== "--offline");
  const targets = names.length ? TARGETS.filter(target => names.includes(target.name)) : TARGETS;
  assert.equal(targets.length, names.length || TARGETS.length, "Unknown or duplicate target");
  if (process.argv.includes("--offline")) {
    const result = [];
    for (const target of targets) { original(target); result.push(await offline(target)); }
    fs.writeFileSync(path.join(OUTPUT, "offline.json"), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result)); return;
  }
  const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE);
  const browser = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, headless: true });
  try {
    for (const target of targets) {
      const before = await qualify(browser, target, "legacy"), after = await qualify(browser, target, "shared");
      // Original failures remain failures; no success inferred from a PASS log.
      assert.equal(before.status, "PASS", target.name + " legacy suite");
      assert.equal(after.status, "PASS", target.name + " shared suite");
      assert.deepEqual(after.original.resources, before.original.resources);
      assert.deepEqual(after.original.pageErrors, before.original.pageErrors);
      console.log("SPECIALIST_PRESERVATION PASS " + target.name);
    }
  } finally { await browser.close(); }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });

