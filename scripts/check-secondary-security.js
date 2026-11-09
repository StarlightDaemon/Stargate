"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const http = require("node:http"), { once } = require("node:events"), { Writable } = require("node:stream");
const { execFileSync } = require("node:child_process");
const { startPreview, selectExhibit } = require("./preview.js");
const { request, click } = require("./browser-check-helpers.js");
const ROOT = path.resolve(__dirname, ".."), BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1";
const OUTPUT = path.join(ROOT, "test/secondary-security"), delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const TARGETS = [
  { name: "stargate_bathyscaphe_pilot_fable", server: "server.js", suites: ["verify/run.js", "verify/closeout.js", "verify/closeout_stages.js", "verify/smoke.js"] },
  { name: "stargate_dark_matter_array", server: "server.js", suites: ["test/verify.js", "test/verify_tabs.js", "test/verify_viewport_scaling.js", "test/final_closeout_verify.js", "test/diag_viewport.js"] },
  { name: "stargate_solarpunk_conservatory", server: "server.js", suites: ["test/run-tests.mjs"] },
  { name: "stargate_lowmagic_gemini", server: "scripts/server.js", suites: [] }
];
function historical(target, file) {
  return execFileSync("git", ["show", BASE + ":" + target.name + "/" + file], { cwd: ROOT, encoding: "utf8" });
}
function original(target, file) {
  const source = historical(target, file);
  assert.equal(fs.readFileSync(path.join(ROOT, target.name, file), "utf8").replace(/\r\n/g, "\n"), source.replace(/\r\n/g, "\n"), "Original suite unchanged: " + file);
  return source;
}
function handler(target, createServer) {
  vm.runInNewContext(historical(target, target.server), {
    require: name => name === "http" ? { ...http, createServer } : require(name),
    __dirname: path.dirname(path.join(ROOT, target.name, target.server)),
    process: { env: {}, argv: ["node", target.server], on() {}, pid: 0 },
    URL, console: { log() {} }
  });
}
function probes(target) {
  const out = [["GET", "/" + target.server, target.server], ["GET", "/README.md", "README.md"], ["POST", "/", "index.html"]];
  if (target.suites.length) out.push(["GET", "/" + target.suites[0], target.suites[0]], ["GET", "/package.json", "package.json"]);
  return out;
}
function replayCancellationRegression() {
  const scheduled = new Map(); let nextTimer = 0, address = [];
  const window = { Portal: { getState: () => "IDLE" }, HearthDial: {
    clearDial() { window.App.cancelAutoDial(); address = []; },
    dialSymbol(symbol) { address.push(symbol); }
  } };
  const app = vm.runInNewContext(fs.readFileSync(path.join(ROOT, "stargate_lowmagic_gemini/js/app.js"), "utf8") + "\nnew RushlightApp();", {
    window, document: { addEventListener() {} },
    setInterval(fn) { const timer = ++nextTimer; scheduled.set(timer, fn); return timer; },
    clearInterval(timer) { scheduled.delete(timer); }
  });
  window.App = app;
  app.startSequentialAutoDial(["old-1", "old-2"]);
  const queuedOldTick = scheduled.get(app.autoDialTimer); queuedOldTick(); assert.deepEqual(address, ["old-1"]);
  app.cancelAutoDial(); assert.equal(scheduled.size, 0); assert.equal(app.autoDialTimer, null);
  window.HearthDial.clearDial(); app.startSequentialAutoDial(["new-1", "new-2"]);
  const newTimer = app.autoDialTimer, queuedNewTick = scheduled.get(newTimer);
  queuedOldTick(); assert.deepEqual(address, []); assert.equal(app.autoDialTimer, newTimer);
  queuedNewTick(); assert.deepEqual(address, ["new-1"]);
  window.HearthDial.clearDial(); queuedNewTick(); assert.deepEqual(address, []); assert.equal(scheduled.size, 0);
  app.startSequentialAutoDial(["last-1", "last-2"]); const lastTick = scheduled.get(app.autoDialTimer);
  lastTick(); lastTick(); lastTick(); assert.deepEqual(address, ["last-1", "last-2"]); assert.equal(scheduled.size, 0);
  return { status: "PASS", checks: "Cancelled, replaced, and completed replay callbacks cannot append stale symbols or clear a newer interval." };
}
async function offline(target) {
  let fn, binding;
  handler(target, f => { fn = f; return { listen(...args) { binding = args.slice(0, -1); } }; });
  const rows = [];
  for (const [method, url, file] of probes(target)) {
    const response = await new Promise((resolve, reject) => {
      const chunks = []; const res = new Writable({ write(chunk, enc, done) { chunks.push(Buffer.from(chunk)); done(); } });
      res.writeHead = code => { res.statusCode = code; return res; }; res.setHeader = () => {};
      res.once("error", reject); res.once("finish", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
      try { fn({ method, url, headers: { host: "localhost" } }, res); } catch (error) { reject(error); }
    });
    assert.equal(response.status, 200); assert.deepEqual(response.body, fs.readFileSync(path.join(ROOT, target.name, file)));
    rows.push({ method, url, status: response.status, exactTargetBytes: true });
  }
  const malformed = target.name !== "stargate_solarpunk_conservatory";
  if (malformed) assert.throws(() => fn({ method: "GET", url: "/%ZZ", headers: { host: "localhost" } }, {}), error => error.name === "URIError");
  return { exhibit: target.name, binding, rows, malformedThrows: malformed, evidence: "Offline handler execution only" };
}
async function legacy(target) {
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
function artifactIO(target, folder) {
  const directory = path.join(ROOT, target.name);
  const mapped = file => {
    if (typeof file !== "string") return file;
    const absolute = path.resolve(directory, file), relative = path.relative(directory, absolute);
    if (/^(?:verify[\\/](?:shots(?:[\\/]|$)|report\.md$|closeout(?:_stages)?\.log$)|test[\\/]screenshots(?:[\\/]|$)|screenshots(?:[\\/]|$))/.test(relative))
      return path.join(folder, relative);
    return absolute;
  };
  const safeWrite = file => {
    const output = mapped(file), relative = path.relative(folder, output);
    assert.ok(relative && relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative), "Evidence write must stay in its own output directory");
    return output;
  };
  return { mapped, safeWrite, io: { ...fs,
    readFileSync: (file, ...args) => fs.readFileSync(mapped(file), ...args),
    existsSync: file => fs.existsSync(mapped(file)),
    readdirSync: (file, ...args) => fs.readdirSync(mapped(file), ...args),
    mkdirSync: (file, ...args) => fs.mkdirSync(safeWrite(file), ...args),
    writeFileSync: (file, ...args) => { const output = safeWrite(file); fs.mkdirSync(path.dirname(output), { recursive: true }); return fs.writeFileSync(output, ...args); },
    unlinkSync: file => fs.unlinkSync(safeWrite(file))
  } };
}
async function emitVisuals(context, folder, target, suite, mode) {
  const files = fs.readdirSync(folder, { recursive: true }).filter(file => /(?:cold_start|stage[123]?[_-]|pending|buildup|breakthrough|sustained|active).*\.png$/.test(file) && !/4k/i.test(file));
  const page = await context.newPage();
  for (const file of files.slice(0, 8)) {
    const data = await page.evaluate(async base64 => {
      const img = new Image(); img.src = "data:image/png;base64," + base64; await img.decode();
      const canvas = document.createElement("canvas"); canvas.width = img.width; canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0); return canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
    }, fs.readFileSync(path.join(folder, file)).toString("base64"));
    const name = target.name + "-" + mode + "-" + path.basename(suite, path.extname(suite)) + "-" + path.basename(file, ".png") + ".jpg";
    for (let offset = 0; offset < data.length; offset += 16000)
      console.log("STARGATE_VISUAL " + name + " " + offset + " " + data.slice(offset, offset + 16000));
  }
  await page.close();
}
async function runSuite(browser, target, suite, url, folder, mode) {
  const context = await browser.createBrowserContext(), lines = [], pageErrors = [];
  fs.mkdirSync(folder, { recursive: true });
  const artifacts = artifactIO(target, folder);
  const processAdapter = { env: { ...process.env, URL: url + "/", LANTERN_URL: url + "/", LANTERN_REPO: path.join(ROOT, target.name),
    LANTERN_SHOTS: path.join(ROOT, target.name, "verify/shots/closeout") }, cwd: () => folder, exitCode: 0, exit(code) { this.exitCode = code; } };
  const puppeteer = { executablePath: () => process.env.PUPPETEER_EXECUTABLE_PATH, launch: async () => ({
    async newPage() {
      const page = await context.newPage(), screenshot = page.screenshot.bind(page);
      page.on("pageerror", e => pageErrors.push(e.message));
      page.screenshot = options => {
        if (options?.path) { const output = artifacts.safeWrite(options.path); fs.mkdirSync(path.dirname(output), { recursive: true }); options = { ...options, path: output }; }
        return screenshot(options);
      };
      return page;
    }, close: async () => {}
  }) };
  const log = { log: (...values) => lines.push(values.map(value => typeof value === "object" ? JSON.stringify(value) : String(value)).join(" ")),
    error: (...values) => lines.push(values.map(value => value?.stack || String(value)).join(" ")) };
  const load = name => /(?:^puppeteer$|[\\/]node_modules[\\/]puppeteer$)/.test(name) ? puppeteer
    : name === "fs" ? artifacts.io : name === "./png" || /[\\/]verify[\\/]png\.js$/.test(name)
      ? require(path.join(ROOT, target.name, "verify/png.js")) : require(name);
  let result = { suite, status: "FAIL" };
  try {
    let source = original(target, suite);
    if (suite.endsWith(".mjs")) {
      source = source.slice(source.indexOf("const URL = "));
      const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
      const value = await new AsyncFunction("puppeteer", "fs", "path", "PNG", "process", "console", source + "\nreturn summary;")(
        puppeteer, artifacts.io, path, require(process.env.STARGATE_PNG_MODULE || "pngjs").PNG, processAdapter, log);
      result = { suite, ...value }; assert.equal(value.total, 42, "All original HELIANTH checks executed");
    } else {
      source = source.replaceAll("'http://localhost:8080'", JSON.stringify(url))
        .replaceAll("'http://127.0.0.1:8747/'", JSON.stringify(url + "/"));
      if (source.includes("(async () => {")) source = source.replace("(async () => {", "return (async () => {");
      else {
        const call = source.match(/\n([A-Za-z]+)\(\)\.catch/); assert.ok(call, "Original entry point");
        source = source.replace(call[0], "\nreturn " + call[1] + "().catch");
      }
      const value = await new Function("require", "__dirname", "process", "console", source)(
        load, path.dirname(path.join(ROOT, target.name, suite)), processAdapter, log);
      if (suite.startsWith("verify/") && suite !== "verify/smoke.js") {
        const summary = lines.map(line => line.match(/RESULT[^:]*: (\d+) passed, (\d+) failed/)).find(Boolean);
        assert.ok(summary, "Original completion summary");
        result.passed = Number(summary[1]); result.failed = Number(summary[2]);
      } else if (suite === "test/verify.js") assert.ok(lines.some(line => line.includes("ALL 10 VERIFICATION TESTS COMPLETED SUCCESSFULLY")));
      else if (suite === "test/verify_tabs.js") assert.ok(lines.some(line => line.includes("ALL TAB & LAYOUT VERIFICATIONS PASSED")));
      else if (suite === "test/verify_viewport_scaling.js") assert.ok(lines.some(line => line.includes("ALL VIEWPORT & BACKDROP TESTS PASSED")));
      else result.note = "Original diagnostic completed; unasserted observations are not functional acceptance.";
      if (value !== undefined) result.returned = value;
    }
    result.exitCode = processAdapter.exitCode; result.pageErrors = pageErrors;
    result.failureDetails = lines.filter(line => /\bFAIL\b/.test(line));
    if (target.name === "stargate_bathyscaphe_pilot_fable" && suite === "verify/run.js") {
      const changelog = fs.readFileSync(path.join(ROOT, target.name, "CHANGELOG.md"), "utf8");
      const version = JSON.parse(fs.readFileSync(path.join(ROOT, target.name, "version.json"), "utf8"));
      result.currentMetadataContract = {
        historicalLiteralPreserved: "## v1.0.0",
        releaseVersion: version.version,
        semverHeading: /^## \[1\.0\.0\] - 2026-08-23$/m.test(changelog),
        exactBuilder: changelog.includes("**Built by:** Claude Fable 5 (high reasoning)"),
        note: "Separate current metadata check for the documented September heading normalization; historical predicate remains unchanged and FAIL."
      };
      assert.equal(version.version, "1.0.0"); assert.equal(result.currentMetadataContract.semverHeading, true); assert.equal(result.currentMetadataContract.exactBuilder, true);
    }
    if (target.name === "stargate_bathyscaphe_pilot_fable" && suite === "verify/closeout_stages.js") {
      // Read completed original evidence only. Do not add browser round-trips
      // inside the bracketed captures or change any original pixel predicate.
      const file = fs.readdirSync(folder, { recursive: true }).find(file => path.basename(file) === "04b_stage2_breakthrough_bracketed.png");
      assert.ok(file, "Original breakthrough evidence exists");
      const bytes = fs.readFileSync(path.join(folder, file));
      const decoded = require(path.join(ROOT, target.name, "verify/png.js")).decode(bytes);
      const reference = require(process.env.STARGATE_PNG_MODULE || "pngjs").PNG.sync.read(bytes);
      assert.deepEqual(decoded.data, reference.data, "Original PNG decoder matches independent pngjs decoder");
      const offsets = [-3, -1.5, 0, 1.5, 3, 5].map(offset => {
        const pixels = [];
        // Fixed original 1920x1080 layout: sphere assembly (540,62),
        // wrap (90,90), 660px diameter; no replacement geometry assertion.
        for (let angle = 0; angle < 360; angle += 5) {
          const x = Math.round(960 + (330 + offset) * Math.cos(angle * Math.PI / 180));
          const y = Math.round(482 + (330 + offset) * Math.sin(angle * Math.PI / 180));
          const index = (y * decoded.width + x) * 4; pixels.push([...decoded.data.subarray(index, index + 3)]);
        }
        return { offset, whiteFraction: pixels.filter(rgb => rgb.every(v => v > 225)).length / pixels.length,
          meanRGB: [0, 1, 2].map(channel => pixels.reduce((sum, rgb) => sum + rgb[channel], 0) / pixels.length) };
      });
      result.rimDiagnostic = { status: "OBSERVATION_ONLY", decoderMatch: true, geometry: { cx: 960, cy: 482, r: 330, basis: "Original fixed CSS layout" }, offsets,
        timingAndLuminance: lines.filter(line => /INFO (page-clock|shot1|sphere-rim|pixel diff|frame luminance)/.test(line)) };
    }
    result.status = !result.failed && !result.exitCode && !pageErrors.length ? "PASS" : "FAIL";
  } catch (error) { result.error = error.stack; result.status = "FAIL"; }
  finally {
    fs.writeFileSync(path.join(folder, "adapter.log"), lines.join("\n"));
    fs.writeFileSync(path.join(folder, "adapter-result.json"), JSON.stringify(result, null, 2));
    if ((mode === "shared" || target.name === "stargate_solarpunk_conservatory" ||
      (target.name === "stargate_bathyscaphe_pilot_fable" && suite === "verify/closeout_stages.js")) &&
      process.env.STARGATE_LOG_VISUALS === "1") await emitVisuals(context, folder, target, suite, mode);
    await context.close();
  }
  return result;
}
async function lowmagic(browser, url, folder, mode) {
  const context = await browser.createBrowserContext(), page = await context.newPage();
  const result = { originalSuite: "NONE — supplementary evidence only", cycles: [], errors: [], defects: [] };
  page.on("pageerror", e => result.errors.push(e.message));
  const snapshot = () => page.evaluate(() => ({ state: Portal.getState(), count: HearthDial.currentAddress.length,
    hold: Portal.safetyInterlockEngaged, timers: Portal.activeTimers.length, replay: App.autoDialTimer !== null }));
  const shot = async name => page.screenshot({ path: path.join(folder, name + ".png") });
  const wait = state => page.waitForFunction(state => Portal.getState() === state, { timeout: 8000 }, state);
  try {
    await page.setViewport({ width: 1920, height: 1080 }); await page.goto(url, { waitUntil: "networkidle0" });
    result.initial = await snapshot(); assert.equal(result.initial.state, "IDLE"); assert.equal(result.initial.hold, false); await shot("cold_start");
    const selectors = await page.$$eval(".spindle-glyph-btn", els => els.slice(0, 7).map(el => "#" + el.id));
    assert.equal(selectors.length, 7);
    for (let cycle = 0; cycle < 2; cycle++) {
      for (const selector of selectors) { await click(page, selector); await delay(1100); }
      await delay(1200); const ready = await snapshot(); assert.equal(ready.state, "PENDING_KINDLE"); assert.equal(ready.count, 7);
      await click(page, "#btn-kindle-portal"); await delay(400); assert.equal((await snapshot()).state, "BUILDUP"); if (!cycle) await shot("stage1_buildup");
      await wait("BREAKTHROUGH"); if (!cycle) await shot("stage2_breakthrough"); await wait("ACTIVE"); if (!cycle) await shot("stage3_sustained_active");
      await click(page, "#btn-snuff-portal"); await delay(300); const idle = await snapshot();
      assert.equal(idle.state, "IDLE"); assert.equal(idle.count, 0); assert.equal(idle.timers, 0);
      result.cycles.push({ ready, idle });
    }
    await click(page, ".hearth-preset-btn"); const counts = [], start = Date.now();
    while (Date.now() - start < 2200) { counts.push((await snapshot()).count); await delay(60); }
    assert.ok(counts.some(n => n > 0 && n < 7)); assert.equal((await snapshot()).state, "PENDING_KINDLE"); result.presetCounts = [...new Set(counts)];
    await click(page, "#btn-iron-nail"); await click(page, "#btn-kindle-portal"); assert.equal((await snapshot()).state, "PENDING_KINDLE");
    await click(page, "#btn-iron-nail"); await click(page, "#btn-kindle-portal"); await delay(400);
    await click(page, "#btn-snuff-portal"); await delay(8250); result.activationCancelled = await snapshot();
    assert.equal(result.activationCancelled.state, "IDLE"); assert.equal(result.activationCancelled.count, 0); assert.equal(result.activationCancelled.timers, 0);
    await click(page, ".hearth-preset-btn"); await delay(550); result.beforeReplayCancel = await snapshot();
    assert.equal(result.beforeReplayCancel.state, "DIALING");
    assert.ok(result.beforeReplayCancel.count > 0 && result.beforeReplayCancel.count < 7); assert.equal(result.beforeReplayCancel.replay, true);
    await click(page, "#btn-snuff-portal"); result.immediateReplayCancel = await snapshot();
    assert.equal(result.immediateReplayCancel.state, "IDLE"); assert.equal(result.immediateReplayCancel.count, 0);
    assert.equal(result.immediateReplayCancel.replay, false); assert.equal(result.immediateReplayCancel.timers, 0);
    await delay(8250); result.replayCancelled = await snapshot();
    if (result.replayCancelled.state !== "IDLE" || result.replayCancelled.count !== 0 || result.replayCancelled.replay)
      result.defects.push("Snuff during preset replay leaves subsequent glyph locks after cancellation.");
    assert.equal(result.replayCancelled.state, "IDLE"); assert.equal(result.replayCancelled.count, 0);
    assert.equal(result.replayCancelled.replay, false); assert.equal(result.replayCancelled.timers, 0);
    await click(page, ".hearth-preset-btn"); await delay(550); await click(page, "#btn-clear-hearth"); await delay(8250);
    result.clearedReplay = await snapshot(); assert.equal(result.clearedReplay.state, "IDLE");
    assert.equal(result.clearedReplay.count, 0); assert.equal(result.clearedReplay.replay, false);
    const presets = await page.$$eval(".hearth-preset-btn", els => els.slice(0, 2).map(el => ({
      selector: '.hearth-preset-btn[data-dest-id="' + el.dataset.destId + '"]',
      symbols: FOLK_DESTINATIONS.find(destination => destination.id === el.dataset.destId).symbols
    })));
    assert.equal(presets.length, 2);
    await click(page, presets[0].selector); await delay(550); await click(page, "#btn-snuff-portal");
    await click(page, presets[1].selector); await wait("PENDING_KINDLE"); await delay(8250);
    result.restartedReplay = await snapshot();
    assert.equal(result.restartedReplay.state, "PENDING_KINDLE"); assert.equal(result.restartedReplay.count, 7);
    assert.equal(result.restartedReplay.replay, false);
    assert.deepEqual(await page.evaluate(() => HearthDial.currentAddress), presets[1].symbols, "Restart contains only the replacement address");
    await click(page, "#btn-snuff-portal"); await delay(8250); result.finalIdle = await snapshot();
    assert.equal(result.finalIdle.state, "IDLE"); assert.equal(result.finalIdle.count, 0);
    assert.equal(result.finalIdle.replay, false); assert.equal(result.finalIdle.timers, 0);
    await shot("cancelled");
    assert.deepEqual(result.errors, []); result.status = result.defects.length ? "FAIL" : "PASS";
    return result;
  } catch (error) { result.status = "FAIL"; result.error = error.stack; return result; }
  finally {
    fs.writeFileSync(path.join(folder, "supplementary.json"), JSON.stringify(result, null, 2));
    if (mode === "shared" && process.env.STARGATE_LOG_VISUALS === "1") await emitVisuals(context, folder, { name: "stargate_lowmagic_gemini" }, "supplementary", mode);
    await context.close();
  }
}
async function qualify(browser, target, mode) {
  const folder = path.join(OUTPUT, target.name, mode); fs.mkdirSync(folder, { recursive: true });
  const selection = selectExhibit(target.name), server = mode === "legacy" ? await legacy(target) : await startPreview({ ...selection, port: 0 });
  const result = { exhibit: target.name, mode, assets: 0, security: [], suites: [] };
  try {
    for (const file of selection.files) {
      const response = await request(server.url, "/" + file); assert.equal(response.status, 200, file);
      assert.deepEqual(response.body, fs.readFileSync(path.join(selection.root, file))); result.assets++;
    }
    for (const [method, url, file] of probes(target)) {
      const response = await request(server.url, url, method);
      assert.equal(response.status, mode === "legacy" ? 200 : method === "POST" ? 405 : 403);
      if (mode === "legacy") assert.deepEqual(response.body, fs.readFileSync(path.join(selection.root, file)));
      result.security.push({ method, url, status: response.status });
    }
    if (mode === "shared") assert.equal((await request(server.url, "/%ZZ")).status, 400);
    for (const suite of target.suites) result.suites.push(await runSuite(browser, target, suite, server.url, path.join(folder, suite.replaceAll("/", "-")), mode));
    if (!target.suites.length) result.supplementary = await lowmagic(browser, server.url, folder, mode);
    result.status = result.suites.every(suite => suite.status === "PASS") && (!result.supplementary || result.supplementary.status === "PASS") ? "PASS" : "FAIL";
    return result;
  } catch (error) { result.status = "FAIL"; result.error = error.stack; throw error; }
  finally {
    fs.writeFileSync(path.join(folder, "result.json"), JSON.stringify(result, null, 2));
    console.log("SECONDARY_RESULT " + JSON.stringify(result)); await server.close();
  }
}
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const names = process.argv.slice(2).filter(name => name !== "--offline");
  const targets = names.length ? TARGETS.filter(target => names.includes(target.name)) : TARGETS;
  assert.equal(targets.length, names.length || TARGETS.length, "Unknown or duplicate target");
  if (targets.some(target => target.name === "stargate_lowmagic_gemini")) console.log("LOWMAGIC_REPLAY_REGRESSION " + JSON.stringify(replayCancellationRegression()));
  if (process.argv.includes("--offline")) {
    const results = [];
    for (const target of targets) { for (const suite of target.suites) original(target, suite); results.push(await offline(target)); }
    fs.writeFileSync(path.join(OUTPUT, "offline.json"), JSON.stringify(results, null, 2)); console.log(JSON.stringify(results)); return;
  }
  const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer");
  const browser = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, headless: true });
  try {
    for (const target of targets) {
      const before = await qualify(browser, target, "legacy"), after = await qualify(browser, target, "shared");
      assert.equal(before.status, "PASS", target.name + " original suite/supplement"); assert.equal(after.status, "PASS", target.name + " shared suite/supplement");
      console.log("SECONDARY_PRESERVATION PASS " + target.name);
    }
  } finally { await browser.close(); }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });

