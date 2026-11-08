"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), http = require("node:http"), vm = require("node:vm");
const { execFileSync, spawn } = require("node:child_process"), { once } = require("node:events"), { Writable } = require("node:stream");
const { startPreview, selectExhibit } = require("./preview.js"), { request } = require("./browser-check-helpers.js");
const ROOT = path.resolve(__dirname, ".."), BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1", OUTPUT = path.join(ROOT, "test/extra-entry-security");
const TARGETS = [
  { name: "stargate_cyberpunk_fable", port: 8637, suites: ["test/run-tests.mjs"] },
  { name: "stargate_steampunk_fable", port: 8661, suites: ["test/run-tests.mjs"] },
  { name: "stargate_ukiyo_waystation_fable", port: 8613, python: true, suites: ["test/run-tests.mjs", "test/ring-verify.mjs", "test/diagnose.mjs", "test/probe-4k.mjs"] }
];
function historical(target, file) {
  return execFileSync("git", ["show", BASE + ":" + target.name + "/" + file], { cwd: ROOT, encoding: "utf8" });
}
function original(target, suite) {
  const source = historical(target, suite);
  assert.equal(fs.readFileSync(path.join(ROOT, target.name, suite), "utf8").replace(/\r\n/g, "\n"), source.replace(/\r\n/g, "\n"), "Original suite unchanged");
  return source;
}
function handler(target, createServer) {
  vm.runInNewContext(historical(target, "serve.js"), { require: name => name === "http" ? { ...http, createServer } : require(name),
    __dirname: path.join(ROOT, target.name), console: { log() {} } });
}
function probes(target) {
  const out = [["GET", "/package.json", "package.json"], ["GET", "/test/run-tests.mjs", "test/run-tests.mjs"], ["GET", "/README.md", "README.md"], ["POST", "/", "index.html"]];
  if (!target.python) out.unshift(["GET", "/serve.js", "serve.js"]);
  return out;
}
async function offline(target) {
  if (target.python) {
    const command = JSON.parse(historical(target, "package.json")).scripts.serve;
    assert.equal(command, "python -m http.server 8613");
    return { exhibit: target.name, originalCommand: command, status: "UNVERIFIED", note: "Python handler findings require actual hosted subprocess/HTTP evidence." };
  }
  let fn, binding;
  handler(target, f => { fn = f; return { listen(...args) { binding = args.slice(0, -1); } }; });
  const rows = [];
  for (const [method, url, file] of probes(target)) {
    const response = await new Promise((resolve, reject) => {
      const chunks = [], out = new Writable({ write(chunk, enc, done) { chunks.push(Buffer.from(chunk)); done(); } });
      out.writeHead = status => { out.statusCode = status; return out; };
      out.once("error", reject); out.once("finish", () => resolve({ status: out.statusCode, body: Buffer.concat(chunks) }));
      try { fn({ method, url }, out); } catch (error) { reject(error); }
    });
    assert.equal(response.status, 200); assert.deepEqual(response.body, fs.readFileSync(path.join(ROOT, target.name, file)));
    rows.push({ method, url, status: response.status, exactTargetBytes: true });
  }
  assert.throws(() => fn({ method: "GET", url: "/%ZZ" }, {}), error => error.name === "URIError");
  return { exhibit: target.name, binding, rows, malformedThrows: true, evidence: "Offline original Node handler; not HTTP/browser evidence" };
}
async function legacy(target) {
  if (target.python) {
    // Run the actual standard-library handler; only bind address and selected
    // port differ from the original package command.
    const child = spawn(process.env.STARGATE_PYTHON || (process.platform === "win32" ? "python" : "python3"),
      ["-u", "-m", "http.server", "0", "--bind", "127.0.0.1"], { cwd: path.join(ROOT, target.name), stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let output = "";
    const url = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { child.kill(); reject(new Error("Python listener startup timed out")); }, 10000);
      const failed = error => { clearTimeout(timer); reject(error); };
      child.once("error", failed); child.once("exit", (code, signal) => failed(new Error("Python listener exited: " + code + "/" + signal)));
      child.stderr.on("data", chunk => { output += chunk; });
      child.stdout.on("data", chunk => {
        output += chunk; const match = output.match(/Serving HTTP on 127\.0\.0\.1 port (\d+)/);
        if (match) { clearTimeout(timer); resolve("http://127.0.0.1:" + match[1]); }
      });
    });
    return { url, async close() {
      if (child.exitCode === null && child.signalCode === null) {
        const exited = once(child, "exit"); child.kill(); await exited;
      }
    } };
  }
  let server;
  handler(target, fn => {
    server = http.createServer(fn);
    server.listen = function() { return http.Server.prototype.listen.call(this, 0, "127.0.0.1"); };
    return server;
  });
  if (!server.listening) await once(server, "listening");
  return { url: "http://127.0.0.1:" + server.address().port, close: () => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve()); server.closeAllConnections();
  }) };
}
async function visuals(context, folder, target, suite) {
  const files = fs.readdirSync(folder, { recursive: true }).filter(file => /(?:cold|idle|buildup|breakthrough|active|stage[123]).*\.png$/.test(file) && !/4k|cycle2/.test(file)).slice(0, 8);
  const page = await context.newPage();
  for (const file of files) {
    const data = await page.evaluate(async value => {
      const image = new Image(); image.src = "data:image/png;base64," + value; await image.decode();
      const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height;
      canvas.getContext("2d").drawImage(image, 0, 0); return canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
    }, fs.readFileSync(path.join(folder, file)).toString("base64"));
    const name = target.name + "-" + path.basename(suite, ".mjs") + "-" + path.basename(file, ".png") + ".jpg";
    for (let offset = 0; offset < data.length; offset += 16000) console.log("STARGATE_VISUAL " + name + " " + offset + " " + data.slice(offset, offset + 16000));
  }
  await page.close();
}
async function runSuite(browser, target, suite, url, folder, mode) {
  fs.mkdirSync(folder, { recursive: true });
  const context = await browser.createBrowserContext(), lines = [], errors = [];
  const processAdapter = { env: { ...process.env, REGISTRY_URL: url + "/" }, exitCode: 0, exit(code) { this.exitCode = code; } };
  const puppeteer = { executablePath: () => process.env.PUPPETEER_EXECUTABLE_PATH, launch: async () => ({
    async newPage() { const page = await context.newPage(); page.on("pageerror", error => errors.push(error.message)); return page; }, close: async () => {}
  }) };
  const log = { log: (...values) => lines.push(values.map(value => typeof value === "object" ? JSON.stringify(value) : String(value)).join(" ")),
    error: (...values) => lines.push(values.map(value => value?.stack || String(value)).join(" ")) };
  let result = { suite, status: "FAIL" };
  try {
    let source = original(target, suite);
    // Keep every functional assertion, timing and pixel measurement. Imports,
    // URL, evidence directory, process exit and browser ownership are adapted.
    source = source.replace(/^import .+;\r?$/gm, "");
    source = source.replace(/const (HERE|__dirname) = (?:path\.)?dirname\(fileURLToPath\(import\.meta\.url\)\);/g,
      (text, name) => "const " + name + " = " + JSON.stringify(path.join(folder, "test")) + ";");
    assert.ok(!source.includes("import.meta"), "All artifact-root bindings adapted");
    source = source.replaceAll("'http://localhost:" + target.port + "/'", JSON.stringify(url + "/"))
      .replaceAll("'http://localhost:" + target.port + "'", JSON.stringify(url));
    const invocation = source.match(/\n(main|run)\(\)\.catch/);
    let returned = "";
    if (invocation) {
      source = source.slice(0, invocation.index);
      const value = suite === "test/ring-verify.mjs" ? "{ failures }" : suite === "test/diagnose.mjs" ? "{ diagnostic: true }" : "{ results }";
      returned = "\nawait " + invocation[1] + "(); return " + value + ";";
    } else returned = "\nreturn { diagnostic: true };";
    const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
    result = { suite, ...await new AsyncFunction("puppeteer", "fs", "path", "PNG", "mkdirSync", "existsSync", "statSync", "join", "dirname", "process", "console", source + returned)(
      puppeteer, fs, path, target.python ? undefined : require(process.env.STARGATE_PNG_MODULE).PNG,
      fs.mkdirSync, fs.existsSync, fs.statSync, path.join, path.dirname, processAdapter, log) };
    if (result.results) {
      assert.ok(result.results.length > 0, "Original assertion results returned");
      result.failed = result.results.filter(value => !(Object.hasOwn(value, "pass") ? value.pass : value.ok)).length;
      result.total = result.results.length;
    }
    result.exitCode = processAdapter.exitCode; result.pageErrors = errors;
    result.status = !result.failed && !result.failures && !result.exitCode && !errors.length ? "PASS" : "FAIL";
    if (result.diagnostic) result.note = "Original diagnostic executed; observations are not acceptance assertions.";
    if (target.python) result.operatorGate = "UNRESOLVED: original operator quick-dial contradiction remains; automated passes do not resolve it.";
  } catch (error) { result.error = error.stack; result.status = "FAIL"; }
  finally {
    fs.writeFileSync(path.join(folder, "adapter.log"), lines.join("\n"));
    fs.writeFileSync(path.join(folder, "adapter-result.json"), JSON.stringify(result, null, 2));
    if (mode === "shared" && process.env.STARGATE_LOG_VISUALS === "1") await visuals(context, folder, target, suite);
    await context.close();
  }
  return result;
}
async function qualify(browser, target, mode) {
  const folder = path.join(OUTPUT, target.name, mode); fs.mkdirSync(folder, { recursive: true });
  const selection = selectExhibit(target.name);
  if (!target.python) assert.ok(!selection.files.includes("serve.js"), "serve.js must be classified as private development tooling");
  const server = mode === "legacy" ? await legacy(target) : await startPreview({ ...selection, port: 0 });
  const result = { exhibit: target.name, mode, assets: 0, security: [], suites: [] };
  try {
    for (const file of selection.files) {
      const response = await request(server.url, "/" + file); assert.equal(response.status, 200, file);
      assert.deepEqual(response.body, fs.readFileSync(path.join(selection.root, file))); result.assets++;
    }
    for (const [method, url, file] of probes(target)) {
      const response = await request(server.url, url, method);
      const expected = mode === "shared" ? method === "POST" ? 405 : 403 : target.python && method === "POST" ? 501 : 200;
      assert.equal(response.status, expected);
      if (mode === "legacy" && response.status === 200) assert.deepEqual(response.body, fs.readFileSync(path.join(selection.root, file)));
      result.security.push({ method, url, status: response.status });
    }
    if (mode === "shared") assert.equal((await request(server.url, "/%ZZ")).status, 400);
    for (const suite of target.suites) result.suites.push(await runSuite(browser, target, suite, server.url, path.join(folder, path.basename(suite, ".mjs")), mode));
    result.status = result.suites.every(suite => suite.status === "PASS") ? "PASS" : "FAIL";
    return result;
  } catch (error) { result.status = "FAIL"; result.error = error.stack; throw error; }
  finally {
    fs.writeFileSync(path.join(folder, "result.json"), JSON.stringify(result, null, 2));
    console.log("EXTRA_ENTRY_RESULT " + JSON.stringify(result)); await server.close();
  }
}
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const names = process.argv.slice(2).filter(name => name !== "--offline");
  const targets = names.length ? TARGETS.filter(target => names.includes(target.name)) : TARGETS;
  assert.equal(targets.length, names.length || TARGETS.length, "Unknown or duplicate target");
  if (process.argv.includes("--offline")) {
    const result = []; for (const target of targets) { for (const suite of target.suites) original(target, suite); result.push(await offline(target)); }
    fs.writeFileSync(path.join(OUTPUT, "offline.json"), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result)); return;
  }
  const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE);
  const browser = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, headless: true });
  try {
    for (const target of targets) {
      const before = await qualify(browser, target, "legacy"), after = await qualify(browser, target, "shared");
      assert.equal(before.status, "PASS", target.name + " original suites"); assert.equal(after.status, "PASS", target.name + " shared suites");
      console.log("EXTRA_ENTRY_PRESERVATION PASS " + target.name);
    }
  } finally { await browser.close(); }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });

