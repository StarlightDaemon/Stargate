"use strict";
// Vite's built-artifact preview remains a deliberate specialist path. This runs
// actual package commands and unchanged original assertions; it is not release acceptance.
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const crypto = require("node:crypto"), http = require("node:http"), { spawn } = require("node:child_process");
const { TARGETS, runSuite, cancellation } = require("./check-package-entry-security");
const { selectExhibit, startPreview, publicAsset } = require("./preview");
const { request } = require("./browser-check-helpers");
const { loadPage } = require("./browser-load");
const ROOT = path.resolve(__dirname, ".."), OUTPUT = path.join(ROOT, "test/vite-built-preview");
const NAMES = ["stargate_orthographic_cad", "stargate_radio_interferometry", "stargate_seti_deepscope", "stargate_seti_freeform"];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function npmProcess(args, cwd) {
  assert.ok(args.every(arg => /^[a-zA-Z0-9_.:/-]+$/.test(arg)), "Only fixed npm command tokens");
  const options = { cwd, env: process.env, windowsHide: true, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"] };
  const child = process.platform === "win32"
    ? spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm " + args.join(" ")], options)
    : spawn("npm", args, options);
  let output = "", ended = false;
  child.stdout.on("data", data => { output += data; });
  child.stderr.on("data", data => { output += data; });
  const done = new Promise((resolve, reject) => {
    child.once("error", error => { ended = true; reject(error); });
    child.once("close", (code, signal) => { ended = true; resolve({ code, signal }); });
  });
  async function stop() {
    if (ended) return;
    if (process.platform === "win32") {
      await new Promise(resolve => {
        const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
        killer.once("error", () => { child.kill(); resolve(); }); killer.once("close", resolve);
      });
    } else {
      try { process.kill(-child.pid, "SIGTERM"); } catch (error) { if (error.code !== "ESRCH") throw error; }
    }
    await Promise.race([done, sleep(3000)]);
    if (!ended) {
      if (process.platform === "win32") child.kill();
      else { try { process.kill(-child.pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; } }
    }
    await done;
  }
  return { child, done, stop, output: () => output, ended: () => ended };
}
async function finish(proc, timeout) {
  let timer;
  try { return await Promise.race([proc.done, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("npm command exceeded " + timeout + "ms")), timeout); })]); }
  finally { clearTimeout(timer); }
}
async function preview(cwd, folder) {
  const proc = npmProcess(["run", "preview", "--", "--host", "127.0.0.1", "--strictPort"], cwd);
  let timer;
  try {
    const url = await Promise.race([
      new Promise((resolve, reject) => {
        timer = setInterval(() => {
          const match = proc.output().match(/http:\/\/127\.0\.0\.1:(\d+)/);
          if (match) { clearInterval(timer); resolve(match[0]); }
          else if (proc.ended()) { clearInterval(timer); reject(new Error("Preview exited before binding: " + proc.output())); }
        }, 50);
      }), proc.done.then(() => { throw new Error("Preview exited before binding: " + proc.output()); }),
      sleep(15000).then(() => { throw new Error("Preview startup exceeded 15s"); })
    ]);
    assert.equal(new URL(url).port, "4173", "Preserve Vite built-preview default port");
    return { ...proc, url };
  } catch (error) { await proc.stop(); throw error; }
  finally { clearInterval(timer); fs.writeFileSync(path.join(folder, "preview-start.log"), proc.output()); }
}
function filesIn(directory) {
  const output = [];
  function visit(relative) {
    for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true })) {
      assert.equal(entry.isSymbolicLink(), false, "Build output contains no links");
      const name = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) visit(name);
      else { assert.ok(entry.isFile() && publicAsset(name), "Only public built assets: " + name); output.push(name); }
    }
  }
  visit(""); return output.sort();
}
async function render(browser, target, url, folder, label) {
  const context = await browser.createBrowserContext(), page = await context.newPage(), rows = [], errors = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    for (const viewport of [{ width: 1920, height: 1080 }, { width: 3840, height: 2160 }]) {
      await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
      if (target.name === "stargate_seti_freeform") await loadPage(page, url, 15000);
      else await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 });
      rows.push(await page.evaluate(({ preset, stop }) => {
        const bounds = selector => {
          const element = document.querySelector(selector), r = element.getBoundingClientRect();
          return { text: element.textContent.trim(), x: r.x, y: r.y, width: r.width, height: r.height };
        };
        return { width: innerWidth, height: innerHeight, title: document.title,
          buttons: document.querySelectorAll("button").length, canvases: document.querySelectorAll("canvas").length,
          preset: bounds(preset), stop: bounds(stop) };
      }, target));
      await page.screenshot({ path: path.join(folder, label + "-" + viewport.height + "p.png") });
      if (process.env.STARGATE_LOG_VISUALS === "1") {
        const image = await page.evaluate(async value => {
          const img = new Image(); img.src = "data:image/png;base64," + value; await img.decode();
          const canvas = document.createElement("canvas"), scale = Math.min(1, 1280 / img.width);
          canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL("image/jpeg", 0.65).split(",")[1];
        }, fs.readFileSync(path.join(folder, label + "-" + viewport.height + "p.png")).toString("base64"));
        const name = target.name + "-built-contract-" + label + "-" + viewport.height + "p.jpg";
        for (let offset = 0; offset < image.length; offset += 16000) console.log("STARGATE_VISUAL " + name + " " + offset + " " + image.slice(offset, offset + 16000));
      }
    }
    assert.deepEqual(errors, [], label + " browser errors"); return rows;
  } finally { await context.close(); }
}
function compareRender(source, built) {
  assert.equal(built.length, source.length);
  for (let i = 0; i < source.length; i++) {
    for (const key of ["width", "height", "title", "buttons", "canvases"]) assert.equal(built[i][key], source[i][key], key);
    for (const control of ["preset", "stop"]) {
      assert.equal(built[i][control].text, source[i][control].text);
      for (const key of ["x", "y", "width", "height"]) assert.ok(Math.abs(built[i][control][key] - source[i][control][key]) <= 0.5, control + " " + key + " preserved");
    }
  }
}
async function qualify(name) {
  const target = TARGETS.find(value => value.name === name), cwd = path.join(ROOT, name), folder = path.join(OUTPUT, name);
  fs.mkdirSync(folder, { recursive: true });
  const before = Object.fromEntries(["package.json", "package-lock.json", ...target.suites.map(suite => suite.file)].map(file => [file, crypto.createHash("sha256").update(fs.readFileSync(path.join(cwd, file))).digest("hex")]));
  const result = { exhibit: name, scope: "Retained Vite build and built-preview specialist contract", status: "FAIL", originalSuiteStatus: "UNVERIFIED", acceptanceStatus: "UNVERIFIED", assets: [], probes: [], suites: [], sourceSHA256: before };
  let source, built, browser, build;
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
    assert.equal(manifest.scripts.build, "vite build", "Retain actual build command");
    assert.match(manifest.scripts.preview, /^vite preview(?: --host 127\.0\.0\.1 --strictPort)?$/, "Expected built-artifact preview");
    build = npmProcess(["run", "build"], cwd);
    const exit = await finish(build, 120000); assert.equal(exit.code, 0, "Actual npm build succeeds: " + build.output());
    const dist = path.join(cwd, "dist"), files = filesIn(dist); assert.ok(files.includes("index.html"));
    built = await preview(cwd, folder);
    for (const file of files) {
      const response = await request(built.url, "/" + file.split("/").map(encodeURIComponent).join("/"));
      assert.equal(response.status, 200, file); assert.deepEqual(response.body, fs.readFileSync(path.join(dist, file)), "Actual built bytes " + file);
      result.assets.push({ file, status: response.status, exactBytes: true, sha256: crypto.createHash("sha256").update(response.body).digest("hex") });
    }
    const marker = "Controlled outside-built-root fixture " + name, fixture = path.join(folder, "outside-built-root.txt");
    fs.writeFileSync(fixture, marker);
    const privateFiles = ["package.json", "README.md", ...target.suites.map(suite => suite.file), ...selectExhibit(name).files.filter(file => /\.(?:js|mjs|css)$/.test(file))];
    const privateBytes = privateFiles.map(file => fs.readFileSync(path.join(cwd, file)));
    const routes = [...privateFiles.map(file => "/" + file), "/../package.json", "/%2e%2e/package.json", "/@fs/" + fixture.replaceAll("\\", "/"), "/../../test/vite-built-preview/" + name + "/outside-built-root.txt", "/%ZZ"];
    for (const route of routes) {
      const response = await request(built.url, route);
      assert.ok(!response.body.includes(Buffer.from(marker)), "Controlled outside-root bytes denied");
      assert.ok(!privateBytes.some(bytes => bytes.equals(response.body)), "No raw source or private file returned: " + route);
      result.probes.push({ method: "GET", route, status: response.status, privateBytesExposed: false, note: response.status === 200 ? "Vite SPA HTML fallback; not shared-preview deny policy" : undefined });
    }
    for (const method of ["POST", "OPTIONS"]) result.probes.push({ method, route: "/", status: (await request(built.url, "/", method)).status, scope: "Observed native Vite preview method policy" });
    const conflict = npmProcess(["run", "preview", "--", "--host", "127.0.0.1", "--strictPort"], cwd);
    try {
      const exit = await finish(conflict, 15000);
      assert.notEqual(exit.code, 0); assert.match(conflict.output(), /4173.*already in use|already in use.*4173/i);
      result.portConflict = "PASS";
    } finally { await conflict.stop(); fs.writeFileSync(path.join(folder, "preview-conflict.log"), conflict.output()); }
    source = await startPreview({ ...selectExhibit(name), port: 0 });
    browser = await require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer").launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
    result.sourceRender = await render(browser, target, source.url, folder, "source");
    result.builtRender = await render(browser, target, built.url, folder, "built");
    compareRender(result.sourceRender, result.builtRender); result.renderContract = "PASS";
    for (const suite of target.suites) result.suites.push(await runSuite(browser, target, suite, built.url, path.join(folder, "built", suite.file.replace(/[/.]/g, "-"))));
    fs.mkdirSync(path.join(folder, "built"), { recursive: true });
    result.cancellation = await cancellation(browser, target, built.url, path.join(folder, "built"));
    result.originalSuiteStatus = result.suites.every(suite => suite.status === "PASS") ? "PASS" : "FAIL";
    assert.equal(result.originalSuiteStatus, "PASS", "Full original suite against built artifact");
    assert.equal(result.cancellation.status, "PASS");
    assert.ok(!result.cancellation.functionalAcceptance?.startsWith("FAIL"), "Built-artifact cancellation remains functional");
    await built.stop(); fs.writeFileSync(path.join(folder, "preview.log"), built.output()); built = undefined;
    const rebound = http.createServer();
    await new Promise((resolve, reject) => { rebound.once("error", reject); rebound.listen(4173, "127.0.0.1", resolve); });
    await new Promise(resolve => rebound.close(resolve)); result.portReleased = "PASS";
    assert.deepEqual(Object.fromEntries(Object.keys(before).map(file => [file, crypto.createHash("sha256").update(fs.readFileSync(path.join(cwd, file))).digest("hex")])), before, "Commands, locks and original suites unchanged");
    result.status = "PASS";
  } catch (error) { result.error = error.stack; }
  finally {
    if (browser) await browser.close();
    if (source) await source.close();
    if (built) { await built.stop(); fs.writeFileSync(path.join(folder, "preview.log"), built.output()); }
    if (build) { await build.stop(); fs.writeFileSync(path.join(folder, "build.log"), build.output()); }
    fs.writeFileSync(path.join(folder, "result.json"), JSON.stringify(result, null, 2));
    console.log("VITE_BUILT_PREVIEW_RESULT " + JSON.stringify(result));
  }
  return result;
}
async function main(names = process.argv.slice(2)) {
  assert.ok(names.length > 0 && new Set(names).size === names.length && names.every(name => NAMES.includes(name)), "Choose exact supported Vite exhibit names");
  const rows = [];
  for (const name of names) rows.push(await qualify(name));
  assert.ok(rows.every(row => row.status === "PASS"), "Built-preview specialist qualification incomplete");
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { NAMES, filesIn, compareRender };

