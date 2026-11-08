"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const { startPreview, selectExhibit } = require("./preview.js"), { click } = require("./browser-check-helpers.js");
const ROOT = path.resolve(__dirname, ".."), NAME = "stargate_municipal_registry", OUT = path.join(ROOT, "test/municipal-regressions");
const BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1", delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const original = () => execFileSync("git", ["show", BASE + ":" + NAME + "/app.js"], { cwd: ROOT, encoding: "utf8" });
function probe(source) {
  let time = 0, next = 0; const timers = new Map(), sounds = [], listeners = new Map();
  const window = { addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(fn); } }, document = { body: { dataset: {} }, getElementById: () => null, querySelectorAll: () => [] };
  source = source.replace(/\}\)\(\);\s*$/, "window.__probe = { state, audio, bindEvents, handleEngageClick, handleDisengageClick, handleQuickDial, toggleLockout };})();");
  vm.runInNewContext(source, { window, document, setTimeout: (fn, ms) => { timers.set(++next, { fn, time: time + ms }); return next; },
    clearTimeout: id => timers.delete(id), setInterval: () => ++next, clearInterval() {}, requestAnimationFrame() {} });
  const api = window.__probe;
  for (const method of ["playKeyClick", "playSeekChirp", "playStampLock", "startMainframeCarrier", "stopMainframeCarrier", "playDisengageTear", "playErrorBuzzer"])
    api.audio[method] = () => sounds.push({ method, time });
  const advance = ms => { const end = time + ms; for (;;) { const due = [...timers].filter(([, t]) => t.time <= end).sort((a, b) => a[1].time - b[1].time)[0];
    if (!due) break; timers.delete(due[0]); time = due[1].time; due[1].fn(); } time = end; };
  const ready = () => { api.state.enteredGlyphs = Array.from({ length: 8 }, (_, index) => ({ index })); api.state.systemStatus = "FILED_READY"; };
  return { api, timers, sounds, advance, ready, dispatch: (name, event) => (listeners.get(name) || []).forEach(fn => fn(event)) };
}
function deterministic() {
  const before = probe(original()); before.ready(); before.api.handleEngageClick();
  assert.equal(before.api.state.systemStatus, "ENGAGED");
  const source = fs.readFileSync(path.join(ROOT, NAME, "app.js"), "utf8"), after = probe(source);
  after.ready(); after.api.handleEngageClick(); assert.equal(after.api.state.systemStatus, "BUILDUP");
  after.advance(1399); assert.equal(after.api.state.systemStatus, "BUILDUP");
  assert.equal(after.sounds.some(x => x.method === "startMainframeCarrier"), false);
  after.advance(1); assert.equal(after.api.state.systemStatus, "BREAKTHROUGH");
  after.advance(800); assert.equal(after.api.state.systemStatus, "ENGAGED");
  assert.deepEqual(after.sounds.filter(x => ["playStampLock", "startMainframeCarrier"].includes(x.method)), [{ method: "playStampLock", time: 1400 }, { method: "startMainframeCarrier", time: 2200 }]);
  for (const at of [500, 1600]) {
    const test = probe(source); test.ready(); test.api.handleEngageClick(); test.advance(at);
    const stale = [...test.timers.values()].map(x => x.fn); test.api.handleDisengageClick(); test.advance(8250);
    stale.forEach(fn => fn()); assert.equal(test.api.state.systemStatus, "DORMANT"); assert.equal(test.api.state.enteredGlyphs.length, 0);
    test.api.handleQuickDial("qd2"); test.advance(8250); assert.equal(test.api.state.systemStatus, "FILED_READY");
    assert.deepEqual(Array.from(test.api.state.enteredGlyphs, x => x.index), [1, 7, 16, 29, 21, 4, 22, 31]);
    test.api.handleEngageClick(); test.advance(2200); assert.equal(test.api.state.systemStatus, "ENGAGED");
  }
  const hold = probe(source); hold.ready(); hold.api.handleEngageClick(); hold.advance(1500); hold.api.toggleLockout(); hold.advance(8250);
  assert.equal(hold.api.state.systemStatus, "DORMANT"); assert.equal(hold.api.state.isLockoutActive, true);
  const unlock = probe(source); let initializations = 0; unlock.api.audio.init = () => initializations++; unlock.api.bindEvents();
  unlock.dispatch('pointerdown', { isTrusted: false }); assert.equal(initializations, 0);
  unlock.dispatch('pointerdown', { isTrusted: true }); assert.equal(initializations, 1);
  unlock.api.state.audioEnabled = false;
  unlock.dispatch('pointerdown', { isTrusted: true }); unlock.dispatch('keydown', { isTrusted: true }); assert.equal(initializations, 1);
  unlock.api.state.audioEnabled = true; unlock.dispatch('keydown', { isTrusted: true }); assert.equal(initializations, 2);
  return { status: "PASS", baseline: "Synchronous ENGAGED; no transitional stages", fixed: "1400ms BUILDUP, 800ms BREAKTHROUGH, then ENGAGED", cancelledAt: [500, 1600], staleCallbacks: "Ignored", exactReplacement: [1, 7, 16, 29, 21, 4, 22, 31], midStageHold: "Cancelled", audioUnlock: "Only trusted pointer/key input while AUDIO: ON initializes audio" };
}
async function browserRun(browser, url, baseline) {
  const context = await browser.createBrowserContext(), page = await context.newPage(), errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("requestfailed", request => errors.push(request.url()));
  await page.evaluateOnNewDocument(() => {
    const Native = window.AudioContext; window.__municipalAudio = [];
    if (Native) window.AudioContext = class extends Native {
      createOscillator() { const osc = super.createOscillator(), start = osc.start.bind(osc), stop = osc.stop.bind(osc);
        const row = { started: false, stop: Infinity, ctx: this }; window.__municipalAudio.push(row);
        osc.start = at => { row.started = true; return start(at); };
        osc.stop = at => { row.stop = at ?? this.currentTime; return stop(at); }; return osc; }
    };
  });
  if (baseline) { const source = original(); await page.setRequestInterception(true); page.on("request", request => request.url() === url + "/app.js"
    ? request.respond({ status: 200, contentType: "application/javascript", body: source }) : request.continue()); }
  const snapshot = () => page.evaluate(() => ({ stage: document.body.dataset.activationStage || null,
    count: Number(document.getElementById("counterCurrent").textContent), auth: document.getElementById("authStatusPill").textContent,
    stamp: document.getElementById("centerStampOverlay").className, flux: document.getElementById("monFlux").textContent,
    canCancel: !document.getElementById("disengageBtn").disabled,
    activeOscillators: window.__municipalAudio.filter(x => x.started && x.ctx.state === 'running' && x.stop > x.ctx.currentTime).length,
    audioContextStates: [...new Set(window.__municipalAudio.map(x => x.ctx.state))],
    oscillatorStarts: window.__municipalAudio.filter(x => x.started).length }));
  const wait = stage => page.waitForFunction(stage => document.body.dataset.activationStage === stage, { timeout: 10000 }, stage);
  const pending = async () => { await page.waitForFunction(() => Number(document.getElementById("counterCurrent").textContent) === 8 && !document.getElementById("engageBtn").disabled); };
  const cancel = async () => { await click(page, "#disengageBtn"); await delay(8250); const idle = await snapshot();
    assert.equal(idle.stage, "DORMANT"); assert.equal(idle.count, 0); assert.equal(idle.flux, "0.00 MB/s"); assert.equal(idle.stamp, "center-stamp-overlay"); assert.equal(idle.activeOscillators, 0); return idle; };
  const shot = async label => {
    const name = "municipal-" + label; await page.screenshot({ path: path.join(OUT, name + ".png") });
    if (process.env.STARGATE_LOG_VISUALS === "1") { const data = await page.screenshot({ type: "jpeg", quality: 65, encoding: "base64" });
      for (let offset = 0; offset < data.length; offset += 16000) console.log("STARGATE_VISUAL " + name + ".jpg " + offset + " " + data.slice(offset, offset + 16000)); }
  };
  const result = { mode: baseline ? "BASELINE" : "REPAIRED", stages: [], cancellations: [] };
  try {
    await page.setViewport({ width: 1920, height: 1080 }); await page.goto(url, { waitUntil: "networkidle0" });
    assert.equal(await page.$eval("#lockoutToggleBtn", element => element.getAttribute("aria-pressed")), "false");
    await click(page, "#qdRoute1"); await pending(); const beforeEngage = await snapshot(); await click(page, "#engageBtn");
    if (baseline) { await delay(100); result.at100ms = await snapshot(); assert.equal(result.at100ms.auth, "CONDUIT AUTHORIZED");
      assert.equal(result.at100ms.oscillatorStarts, 0); result.audioDefect = "Default AUDIO: ON never initializes on ordinary cold pointer workflow";
      result.status = "DEFECT_REPRODUCED"; return result; }
    assert.ok(beforeEngage.oscillatorStarts > 0, 'First trusted cold pointer workflow must actually start audio sources');
    const pixels = [];
    for (const stage of ["BUILDUP", "BREAKTHROUGH", "SUSTAINED_ACTIVE"]) {
      await wait(stage); const value = await snapshot(); assert.equal(value.canCancel, true);
      if (stage !== "SUSTAINED_ACTIVE") { assert.notEqual(value.auth, "CONDUIT AUTHORIZED"); assert.equal(value.flux, "0.00 MB/s"); assert.equal(value.stamp, "center-stamp-overlay"); }
      else { assert.equal(value.auth, "CONDUIT AUTHORIZED"); assert.equal(value.activeOscillators, 2, 'Both sustained carrier oscillators are actually running'); }
      if (stage === 'BUILDUP') assert.ok(value.oscillatorStarts > beforeEngage.oscillatorStarts, 'Buildup actually starts its seek chirp');
      result.stages.push(value);
      pixels.push(await page.evaluate(() => { const image = document.getElementById("conduitCanvas").getContext("2d").getImageData(0, 0, 560, 420).data;
        let sum = 0, amberPixels = 0; for (let i = 0; i < image.length; i += 4) { sum += (image[i] + image[i + 1] + image[i + 2]) / 3;
          if (image[i] > 180 && image[i + 1] > 80 && image[i + 1] < 220 && image[i + 2] < 50) amberPixels++; }
        return { meanRGB: sum / (image.length / 4), amberPixels }; }));
      await shot(stage.toLowerCase());
    }
    assert.ok(pixels[1].meanRGB > pixels[0].meanRGB + 10 && pixels[1].meanRGB > pixels[2].meanRGB + 10, "Breakthrough phosphor flash differs from buildup and sustained raster");
    assert.ok(pixels[0].amberPixels > 500 && pixels[2].amberPixels === 0, "Amber contracting buildup rings differ from sustained green raster");
    result.canvasPixels = pixels; result.cancellations.push(await cancel());
    const beforeMute = await snapshot(); await click(page, '#audioToggleBtn');
    assert.equal(await page.$eval('#audioLabel', element => element.textContent), 'AUDIO: MUTED');
    await click(page, '#qdRoute1'); await pending(); await click(page, '#engageBtn'); await wait('SUSTAINED_ACTIVE');
    result.muted = await snapshot(); assert.equal(result.muted.activeOscillators, 0); assert.equal(result.muted.oscillatorStarts, beforeMute.oscillatorStarts, 'Muted pointer workflow starts no new oscillators');
    result.cancellations.push(await cancel()); await click(page, '#audioToggleBtn');
    assert.equal(await page.$eval('#audioLabel', element => element.textContent), 'AUDIO: ON');
    for (const stage of ["BUILDUP", "BREAKTHROUGH"]) {
      await click(page, "#qdRoute2"); await pending(); await click(page, "#engageBtn"); await wait(stage);
      if (stage === "BUILDUP") await delay(500);
      result.cancellations.push(await cancel());
    }
    // Exact replacement immediately after cancellation invalidates old stage/teardown work.
    await click(page, "#qdRoute1"); await pending(); await click(page, "#engageBtn"); await delay(500);
    await click(page, "#disengageBtn"); await click(page, "#qdRoute2"); await pending(); await delay(8250);
    result.replacementCodes = await page.$$eval(".chevron-slot-card.state-locked .slot-name", elements => elements.map(e => e.textContent.split(" // ")[0]));
    assert.deepEqual(result.replacementCodes, ["HYD-02", "ALT-08", "CLR-17", "VAP-30", "VOL-22", "WBD-05", "SUR-23", "SUM-32"]);
    assert.equal((await snapshot()).stage, "FILED_READY"); await click(page, "#engageBtn"); await wait("SUSTAINED_ACTIVE"); result.cancellations.push(await cancel());
    for (let cycle = 0; cycle < 2; cycle++) {
      for (let i = 0; i < 8; i++) { await click(page, "#glyphBtn-" + (i + cycle * 8)); await delay(200); }
      await pending(); await delay(8250); assert.equal((await snapshot()).stage, "FILED_READY");
      await click(page, "#engageBtn"); await wait("SUSTAINED_ACTIVE"); result.cancellations.push(await cancel());
    }
    await click(page, "#qdRoute1"); await pending(); await click(page, "#engageBtn"); await wait("BREAKTHROUGH"); await click(page, "#lockoutToggleBtn");
    await delay(8250); assert.equal((await snapshot()).stage, "DORMANT"); assert.equal((await snapshot()).activeOscillators, 0);
    result.status = "PASS"; return result;
  } finally { result.errors = errors; await context.close(); assert.deepEqual(errors, []); }
}
async function main() {
  fs.mkdirSync(OUT, { recursive: true }); const report = { deterministic: deterministic(), browser: "NOT_RUN" };
  if (!process.argv.includes("--offline")) {
    const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || path.join(ROOT, "node_modules/puppeteer"));
    const server = await startPreview({ ...selectExhibit(NAME), port: 0 }), browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
    try { report.browser = { baseline: await browserRun(browser, server.url, true), repaired: await browserRun(browser, server.url, false) }; }
    finally { await browser.close(); await server.close(); }
  }
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2)); console.log("MUNICIPAL_REGRESSIONS " + JSON.stringify(report));
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { deterministic, browserRun };
