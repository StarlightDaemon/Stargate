"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const { startPreview, selectExhibit } = require("./preview.js"), { click } = require("./browser-check-helpers.js");
const ROOT = path.resolve(__dirname, ".."), TARGET = "stargate_erebus_signal", BASE = "8c3f718c3e31cd19c169c7cf87ab2feeee7242c1";
const OUTPUT = path.join(ROOT, "test/erebus-regressions"), delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function original() { return execFileSync("git", ["show", BASE + ":" + TARGET + "/main.js"], { cwd: ROOT, encoding: "utf8" }); }
function harness(source) {
  const nodes = new Map(), timers = new Map(); let next = 0;
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { style: {}, checked: false, classList: { add() {}, remove() {} } });
    return nodes.get(id);
  };
  const api = vm.runInNewContext(source.slice(source.indexOf("const chevronIndices"), source.indexOf("// Ambient static")) +
    "\n({ quickDial, selectSymbol, disengage, get: () => ({ sequence: [...sequence], isBusy, isConnected }) });", {
    document: { body: node("body"), getElementById: node, querySelector: node, querySelectorAll: () => [] },
    Synth: new Proxy({}, { get: () => () => {} }),
    setTimeout(fn) { const id = ++next; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); },
    setInterval() { return ++next; }, clearInterval() {}
  });
  return { api, async tick() { const item = timers.entries().next().value; if (item) { timers.delete(item[0]); item[1](); } await Promise.resolve(); await Promise.resolve(); }, timers };
}
async function offline() {
  const before = harness(original()); before.api.quickDial("0,1,2,3");
  for (let i = 0; i < 7; i++) await before.tick();
  assert.equal(before.api.get().isConnected, true);
  const blocked = harness(original()); blocked.api.selectSymbol(0); blocked.api.disengage(); await blocked.tick();
  assert.equal(blocked.api.get().sequence.length, 1);
  const after = harness(fs.readFileSync(path.join(ROOT, TARGET, "main.js"), "utf8"));
  after.api.quickDial("0,1,2,3"); await after.tick(); after.api.disengage();
  after.api.quickDial("4,5,6,7"); for (let i = 0; i < 7; i++) await after.tick();
  assert.deepEqual(Array.from(after.api.get().sequence), [4, 5, 6, 7]); assert.equal(after.api.get().isConnected, false);
  after.api.disengage(); for (let i = 0; i < 3; i++) await after.tick();
  assert.equal(after.api.get().sequence.length, 0); assert.equal(after.timers.size, 0);
  function audioProbe(source) {
    const timers = new Map(); let id = 0;
    const synth = vm.runInNewContext(source.slice(0, source.indexOf("const chevronIndices")) + "\nSynth;", {
      setTimeout(fn) { timers.set(++id, fn); return id; }, clearTimeout(key) { timers.delete(key); }
    });
    const audioNode = () => ({ connect() {}, disconnect() {}, start() {}, stop(time = 0) { this.stopAt = time; },
      frequency: { setValueAtTime() {} }, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } });
    synth.ctx = { currentTime: 0, sampleRate: 100, createOscillator: audioNode, createGain: audioNode, createBiquadFilter: audioNode,
      createBufferSource: audioNode, createBuffer: () => ({ getChannelData: () => new Float32Array(10) }) };
    synth.playHum(); const oldHum = synth.humOsc; synth.stopHum(); synth.playHum(); const newHum = synth.humOsc;
    for (const callback of timers.values()) callback(); timers.clear();
    const result = { oldStopAt: oldHum.stopAt, replacementStopped: newHum.stopAt !== undefined };
    if (synth.stopEffects) {
      synth.playFinalLock(); assert.equal(synth.effectTimers.size, 1); assert.equal(synth.transientSources.size, 2);
      synth.stopEffects(); assert.equal(synth.effectTimers.size, 0); assert.equal(synth.transientSources.size, 0); assert.equal(timers.size, 0);
    }
    return result;
  }
  const audioBefore = audioProbe(original()), audioAfter = audioProbe(fs.readFileSync(path.join(ROOT, TARGET, "main.js"), "utf8"));
  assert.equal(audioBefore.replacementStopped, true); assert.equal(audioAfter.replacementStopped, false); assert.equal(audioAfter.oldStopAt, 1);
  console.log("EREBUS_AUDIO_REGRESSION " + JSON.stringify({ before: audioBefore, after: audioAfter, effectCancellation: "PASS", evidence: "Actual Synth methods with instrumented audio nodes; no sound-quality claim" }));
  console.log("EREBUS_OFFLINE_REGRESSION " + JSON.stringify({ status: "PASS", baseline: "Preset autoactivates; busy cancellation does not prevent symbol lock", repaired: "Cancelled/restarted preset contains replacement address only, remains pending, then clears without timers", evidence: "Actual workflow methods with fake scheduler; browser acceptance separate" }));
}
async function run(browser, url, baseline) {
  const context = await browser.createBrowserContext(), page = await context.newPage();
  const result = { mode: baseline ? "baseline-client" : "repaired-client", errors: [], checks: [] };
  page.on("pageerror", e => result.errors.push(e.message));
  if (baseline) {
    const source = original(); await page.setRequestInterception(true);
    page.on("request", request => request.url() === url + "/main.js"
      ? request.respond({ status: 200, contentType: "application/javascript", body: source }) : request.continue());
  }
  const snapshot = () => page.evaluate(() => ({ sequence: [...sequence], busy: isBusy, connected: isConnected,
    buttonDisabled: document.getElementById("engage-btn").disabled, button: document.getElementById("engage-btn").textContent,
    active: document.getElementById("surface").classList.contains("active"), seeking: document.body.classList.contains("seeking"),
    locked: document.querySelectorAll(".chevron.locked").length,
    timers: typeof operationTimers === "undefined" ? null : operationTimers.size,
    effectTimers: Synth.effectTimers?.size ?? null, effects: Synth.transientSources?.size ?? null, hum: Synth.humOsc !== null }));
  const pending = async address => {
    await page.waitForFunction(() => sequence.length === 4 && !isBusy, { timeout: 15000 });
    await delay(1200); const state = await snapshot(); assert.deepEqual(state.sequence, address);
    assert.equal(state.connected, false); assert.equal(state.buttonDisabled, false); assert.equal(state.button, "ENGAGE_LINK");
    return state;
  };
  const stableIdle = async () => {
    await delay(8250); const state = await snapshot();
    assert.deepEqual(state.sequence, []); assert.equal(state.connected, false); assert.equal(state.busy, false);
    assert.equal(state.active, false); assert.equal(state.seeking, false); assert.equal(state.locked, 0); assert.equal(state.timers, 0);
    assert.equal(state.effectTimers, 0); assert.equal(state.effects, 0); assert.equal(state.hum, false);
    return state;
  };
  try {
    await page.setViewport({ width: 1920, height: 1080 }); await page.goto(url, { waitUntil: "networkidle0" });
    await click(page, ".quick-dial-btn"); await delay(250); result.seeking = await snapshot();
    if (baseline) {
      assert.equal(result.seeking.buttonDisabled, true);
      await page.waitForFunction(() => isConnected && !isBusy, { timeout: 15000 });
      result.autoactivated = await snapshot(); assert.equal(result.autoactivated.connected, true);
    } else {
      assert.equal(result.seeking.buttonDisabled, false); assert.equal(result.seeking.button, "CANCEL_LINK");
      await click(page, "#engage-btn"); result.cancelledSeek = await stableIdle();
      // Cancel a partially completed preset and immediately start a different one.
      await click(page, ".quick-dial-btn"); await delay(1700); await click(page, "#engage-btn");
      await click(page, ".quick-dial-btn:nth-child(3)"); result.restarted = await pending([4, 5, 6, 7]);
      await click(page, "#engage-btn"); await delay(250); assert.equal((await snapshot()).button, "CANCEL_LINK");
      await click(page, "#engage-btn"); result.cancelledBuildup = await stableIdle();
      // Two ordinary manual cycles preserve explicit activation and disconnect.
      for (let cycle = 0; cycle < 2; cycle++) {
        for (let symbol = 0; symbol < 4; symbol++) {
          await click(page, ".symbol-btn:nth-child(" + (symbol + 1) + ")");
          await page.waitForFunction(count => sequence.length === count && !isBusy, { timeout: 4000 }, symbol + 1);
        }
        await pending([0, 1, 2, 3]); await click(page, "#engage-btn");
        await page.waitForFunction(() => isConnected && !isBusy, { timeout: 5000 });
        await click(page, "#engage-btn"); await page.waitForFunction(() => !isConnected && !isBusy && sequence.length === 0);
        result.checks.push("Manual explicit activation/disconnect cycle " + (cycle + 1));
      }
      // Rejection callbacks must also lose authority after cancellation/restart.
      await click(page, ".quick-dial-btn"); await pending([0, 1, 2, 3]); await click(page, ".lockout-toggle");
      await click(page, "#engage-btn"); await page.waitForFunction(() => document.getElementById("surface").classList.contains("rejected"));
      await click(page, "#engage-btn"); await click(page, ".lockout-toggle");
      await click(page, ".quick-dial-btn:nth-child(3)"); result.afterRejection = await pending([4, 5, 6, 7]);
      await click(page, "#engage-btn"); await page.waitForFunction(() => isConnected && !isBusy);
      await click(page, "#engage-btn"); result.finalIdle = await stableIdle();
    }
    // Audio ownership probe is separate from the real-pointer workflow above.
    result.audioReplacement = await page.evaluate(async () => {
      Synth.playHum(); const old = Synth.humOsc; let oldEnded = false, replacementEnded = false;
      old.addEventListener("ended", () => { oldEnded = true; });
      Synth.stopHum(); Synth.playHum(); const replacement = Synth.humOsc;
      replacement.addEventListener("ended", () => { replacementEnded = true; });
      await new Promise(resolve => setTimeout(resolve, 1250));
      const result = { oldEnded, replacementEnded, retained: Synth.humOsc === replacement };
      Synth.stopHum(); return result;
    });
    assert.equal(result.audioReplacement.replacementEnded, baseline);
    assert.equal(result.audioReplacement.retained, !baseline);
    if (!baseline) assert.equal(result.audioReplacement.oldEnded, true);
    assert.deepEqual(result.errors, []); result.status = "PASS";
  } catch (error) { result.status = "FAIL"; result.error = error.stack; }
  finally { await context.close(); }
  return result;
}
async function main() {
  await offline(); if (process.argv.includes("--offline")) return;
  fs.mkdirSync(OUTPUT, { recursive: true }); const results = [];
  const server = await startPreview({ ...selectExhibit(TARGET), port: 0 }); let browser;
  try {
    const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer");
    browser = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, headless: true });
    for (const baseline of [true, false]) { const result = await run(browser, server.url, baseline); results.push(result); console.log("EREBUS_REGRESSION " + JSON.stringify(result)); }
    assert.ok(results.every(result => result.status === "PASS"));
  } finally {
    fs.writeFileSync(path.join(OUTPUT, "report.json"), JSON.stringify({ scope: "Preset/cancellation regression only; full operator acceptance separate.", baseline: BASE, results }, null, 2));
    if (browser) await browser.close(); await server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
