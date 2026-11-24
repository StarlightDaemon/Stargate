"use strict";
// Focused repairs, supplementary to the untouched original nine-phase suite.
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const { startPreview, selectExhibit } = require("./preview.js");
const { click } = require("./browser-check-helpers.js");
const ROOT = path.resolve(__dirname, ".."), NAME = "stargate_bathyscaphe_pilot";
const DIR = path.join(ROOT, NAME), OUTPUT = path.join(ROOT, "test/bathyscaphe-regressions");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const TAKEOVER_BASELINE = { commit: "eebe6beee81f3872230eb038bdc9b65c9cbcdbfc", blob: "171fa21245ce4a94655c603de8c1eb87aa818591" };
const previousDialer = () => execFileSync("git", ["show", TAKEOVER_BASELINE.blob], { cwd: ROOT, encoding: "utf8" });

function fixture(sourceOverrides = {}) {
  let now = 0, timerId = 0;
  const timers = new Map(), elements = new Map(), stored = new Map(), listeners = new Map(), sources = new Set(), filters = [];
  const schedule = (fn, ms, repeat = false) => { const id = ++timerId; timers.set(id, { fn, ms, time: now + ms, repeat }); return id; };
  const element = key => {
    if (!elements.has(key)) elements.set(key, { textContent: key === "local-dives-count" ? "0 recorded" : "", innerHTML: "", children: [], style: {}, offsetParent: null,
      classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, getAttribute() { return ""; },
      addEventListener(type, fn) { this[type] = fn; }, querySelector() { return null; } });
    return elements.get(key);
  };
  const categories = [...fs.readFileSync(path.join(DIR, "index.html"), "utf8").matchAll(/class="btn-cat-filter[^"]*" data-cat="([^"]+)">([^<]+)/g)].map(([, cat, label]) => {
    const button = element("category-" + cat); button.textContent = label; button.getAttribute = () => cat; return button;
  });
  const param = () => ({ value: 0, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; }, exponentialRampToValueAtTime(v) { this.value = v; }, setTargetAtTime(v) { this.value = v; }, cancelScheduledValues() {} });
  const node = () => ({ gain: param(), frequency: param(), Q: param(), connect() {}, disconnect() {} });
  const source = () => {
    const item = node(); let stopTimer;
    item.start = () => sources.add(item);
    item.stop = time => { if (stopTimer) timers.delete(stopTimer); stopTimer = schedule(() => { sources.delete(item); if (item.onended) item.onended(); }, Math.max(0, (time ?? now / 1000) * 1000 - now)); };
    return item;
  };
  class AudioContext {
    constructor() { this.sampleRate = 100; this.destination = {}; this.state = "running"; }
    get currentTime() { return now / 1000; }
    createGain() { return node(); }
    createBiquadFilter() { const filter = node(); filters.push(filter); return filter; }
    createOscillator() { return source(); }
    createBufferSource() { return source(); }
    createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
    resume() {}
  }
  const ctx = { console: { log() {}, warn() {} }, Date, Math, AudioContext, innerWidth: 1920, innerHeight: 1080,
    performance: { now: () => now }, addEventListener: (type, fn) => listeners.set("window-" + type, fn),
    document: { getElementById: element, querySelectorAll: selector => selector === ".btn-cat-filter" ? categories : [],
      documentElement: { style: { setProperty() {} } }, addEventListener: (type, fn) => listeners.set(type, fn) },
    localStorage: { getItem: key => stored.get(key) || null, setItem: (key, value) => stored.set(key, value) },
    Viewport: { init() {} }, Engineering: { init() {} }, Settings: { init() {} },
    setTimeout: (fn, ms) => schedule(fn, ms), setInterval: (fn, ms) => schedule(fn, ms, true), clearTimeout: id => timers.delete(id), clearInterval: id => timers.delete(id) };
  ctx.window = ctx; vm.createContext(ctx);
  for (const file of ["storage", "physics", "audio", "dialer", "quickdial", "archive", "app"]) vm.runInContext(sourceOverrides[file] || fs.readFileSync(path.join(DIR, "src/js", file + ".js"), "utf8"), ctx, { filename: file + ".js" });
  listeners.get("DOMContentLoaded")();
  function advance(ms) {
    const end = now + ms;
    while (now < end) {
      now = Math.min(now + 1, end); ctx.Physics.update();
      for (const [id, timer] of [...timers]) if (timer.time <= now && timers.has(id)) { if (timer.repeat) timer.time += timer.ms; else timers.delete(id); timer.fn(); }
    }
  }
  return { ctx, advance, element, categories, stored, sources, filters, listeners };
}
function assertSurface(f) {
  assert.equal(f.ctx.Dialer.getDialerState(), "IDLE"); assert.equal(f.ctx.Dialer.getLockedWaypoints().length, 0);
  const p = f.ctx.Physics.getState();
  for (const key of ["depth", "targetDepth", "velocity", "buoyancyDeltaKN", "pitchDeg", "rollDeg"]) assert.equal(p[key], 0, key);
  assert.equal(p.pressureBar, 1.01325); assert.equal(p.temperatureC, 24.5); assert.equal(p.densityKgM3, 1025);
  assert.equal(f.sources.size, 2, "Only the original two ambient drone sources remain"); assert.equal(f.filters[0].frequency.value, 140);
}
function deterministic() {
  const f = fixture(), rows = [];
  for (let cycle = 0; cycle < 2; cycle++) {
    for (let i = 0; i < 8; i++) { f.ctx.Dialer.selectWaypoint(i); f.advance(315); }
    assert.equal(f.ctx.Dialer.getDialerState(), "PENDING_READY");
    f.ctx.Dialer.commenceDescent(); f.advance(2000); assert.equal(f.ctx.Dialer.getDialerState(), "BREAKTHROUGH");
    f.advance(800); assert.equal(f.ctx.Dialer.getDialerState(), "SUSTAINED_ACTIVE");
    const p = f.ctx.Physics.getState(), record = f.ctx.Storage.getDiveHistory()[0];
    assert.ok(p.depth > 0 && p.depth < 200, "Activation preserves integrated physical depth");
    assert.match(f.element("act-subtext").textContent, /TARGET: 11,800m/);
    assert.equal(record.targetDepth, 11800); assert.equal(record.maxPressure, p.pressureBar.toFixed(1) + " BAR"); assert.equal(record.durationSeconds, 2.8);
    assert.equal(f.element("local-dives-count").textContent, (cycle + 1) + " recorded");
    assert.equal(f.filters[0].frequency.value, 350);
    rows.push({ cycle: cycle + 1, depth: p.depth, pressure: record.maxPressure, duration: record.durationSeconds });
    f.ctx.Dialer.emergencyBlowBallast(); f.advance(8250); assertSurface(f);
  }
  for (const at of [0, 160, 300, 500, 1000, 1400]) {
    const q = fixture(); q.ctx.QuickDial.executePresetAutoDial("PRESET-VER-01"); q.advance(at); q.ctx.Dialer.emergencyBlowBallast(); q.advance(8250); assertSurface(q);
  }
  const baselineTakeover = fixture({ dialer: previousDialer() });
  baselineTakeover.ctx.QuickDial.executePresetAutoDial("PRESET-VER-01"); baselineTakeover.advance(200);
  baselineTakeover.ctx.Dialer.selectWaypoint(7); baselineTakeover.advance(2000);
  baselineTakeover.ctx.QuickDial.executePresetAutoDial("PRESET-VER-02"); baselineTakeover.advance(2000);
  assert.deepEqual(Array.from(baselineTakeover.ctx.Dialer.getLockedWaypoints(), wp => wp.id), ["WP-8"], "Historical manual takeover leaves later presets ignored");
  const takeover = [];
  for (const at of [0, 200, 300, 500, 1000]) {
    const q = fixture(); q.ctx.QuickDial.executePresetAutoDial("PRESET-VER-01"); q.advance(at);
    const completed = Array.from(q.ctx.Dialer.getLockedWaypoints(), wp => wp.id);
    q.ctx.Dialer.selectWaypoint(7); q.advance(8250);
    assert.deepEqual(Array.from(q.ctx.Dialer.getLockedWaypoints(), wp => wp.id), [...completed, "WP-8"]);
    assert.equal(q.ctx.Dialer.getDialerState(), "IDLE", "Manual partial profile must not auto-activate");
    q.ctx.QuickDial.executePresetAutoDial("PRESET-VER-02"); q.advance(8250);
    assert.deepEqual(Array.from(q.ctx.Dialer.getLockedWaypoints(), wp => wp.id), Array.from({ length: 8 }, (_, i) => "WP-" + (i + 1)));
    assert.equal(q.ctx.Dialer.getDialerState(), "PENDING_READY");
    q.ctx.Dialer.emergencyBlowBallast(); q.advance(8250); assertSurface(q); takeover.push({ atMs: at, retainedCompleted: completed });
  }
  const r = fixture(); r.ctx.Dialer.emergencyBlowBallast();
  for (let i = 0; i < 8; i++) { r.ctx.Dialer.selectWaypoint(i, "computer"); r.advance(140); }
  r.advance(120); assert.equal(r.ctx.Dialer.getDialerState(), "PENDING_READY", "An old settle callback cannot overwrite redial");
  r.ctx.Dialer.commenceDescent(); r.advance(500); r.ctx.Dialer.emergencyBlowBallast(); r.advance(8250); assertSurface(r); assert.equal(r.ctx.Storage.getDiveHistory().length, 0);
  assert.deepEqual(f.categories.map(button => Number(button.textContent.match(/\((\d+)\)$/)[1])), [10, 3, 2, 3, 2]);
  for (const [index, count] of [10, 3, 2, 3, 2].entries()) { f.categories[index].click(); assert.equal((f.element("archive-record-list").innerHTML.match(/data-rec-id=/g) || []).length, count); }
  const key = "archelon_pilot_dives_v1";
  f.stored.set(key, JSON.stringify(Array.from({ length: 50 }, () => ({ targetDepth: 11800 }))));
  vm.runInContext("Archive.init()", f.ctx); assert.equal(f.element("local-dives-count").textContent, "50 recorded");
  f.ctx.Storage.saveCompletedDive({ depth: 11800, duration: 2.8 }); assert.equal(f.ctx.Storage.getDiveHistory().length, 50); assert.equal(f.element("local-dives-count").textContent, "50 recorded");
  f.ctx.localStorage.setItem = () => { throw Error("quota"); }; f.ctx.Storage.saveCompletedDive({ depth: 11800 }); assert.equal(f.element("local-dives-count").textContent, "50 recorded");
  f.stored.set(key, "invalid JSON"); vm.runInContext("Archive.init()", f.ctx); assert.equal(f.element("local-dives-count").textContent, "0 recorded");
  return { status: "PASS", activationCycles: rows, presetCancellationTimesMs: [0, 160, 300, 500, 1000, 1400], buildupCancellationMs: 500, idleObservationMs: 8250, archiveCounts: [10, 3, 2, 3, 2], storage: "live refresh, reload, fifty-record cap, failed write, invalid JSON",
    manualTakeover: { baseline: TAKEOVER_BASELINE, baselineNextPresetIgnored: true, repaired: takeover, nextPreset: "Exact eight waypoints, pending without auto-fire" } };
}

async function browserTakeoverChecks(browser, url) {
  const results = [];
  for (const [baseline, input] of [[true, "keyboard"], [false, "pointer"], [false, "keyboard"]]) {
    const context = await browser.createBrowserContext(), page = await context.newPage(), errors = [];
    try {
      page.on("pageerror", error => errors.push(error.message));
      page.on("requestfailed", request => errors.push(request.url()));
      page.on("response", response => { if (response.status() >= 400) errors.push(response.status() + " " + response.url()); });
      if (baseline) {
        const source = previousDialer(); await page.setRequestInterception(true);
        page.on("request", request => request.url() === url + "/src/js/dialer.js"
          ? request.respond({ status: 200, contentType: "text/javascript", body: source }) : request.continue());
      }
      await page.setViewport({ width: 1920, height: 1080 }); await page.goto(url, { waitUntil: "networkidle0" });
      const state = () => page.evaluate(() => ({ state: Dialer.getDialerState(), waypoints: Dialer.getLockedWaypoints().map(wp => wp.id) }));
      const preset = async id => { await click(page, "#btn-quickdial-toggle"); await click(page, '[data-preset-id="' + id + '"]'); };
      await preset("PRESET-VER-01");
      await page.waitForFunction(() => Dialer.getDialerState() === "TRIMMING" && Dialer.getLockedWaypoints().length < 2);
      if (input === "keyboard") await page.keyboard.press("8");
      else await click(page, '[data-wp-index="7"]');
      await delay(600); const manual = await state();
      assert.equal(manual.waypoints.at(-1), "WP-8"); assert.ok(manual.waypoints.length < 8);
      await delay(8250); assert.deepEqual(await state(), manual, "Stale computer callbacks cannot append to a manual partial profile");
      await preset("PRESET-VER-02");
      if (baseline) { await delay(2200); assert.deepEqual(await state(), manual, "Reproduce the historical latched preset-busy state"); }
      else {
        await page.waitForFunction(() => Dialer.getDialerState() === "PENDING_READY");
        await delay(8250); assert.deepEqual(await state(), { state: "PENDING_READY", waypoints: Array.from({ length: 8 }, (_, i) => "WP-" + (i + 1)) });
      }
      results.push({ mode: baseline ? "baseline-dialer" : "repaired-dialer", input, status: "PASS", manual, afterNextPreset: await state(),
        scope: baseline ? "Historical subsequent preset rejection reproduced" : "Manual takeover cancels stale replay; next preset replaces exactly and remains pending" });
      await page.keyboard.press("Escape"); await delay(1250); assert.deepEqual(await state(), { state: "IDLE", waypoints: [] });
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
  return results;
}
async function browserChecks() {
  const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer");
  const server = await startPreview({ ...selectExhibit(NAME), port: 0 });
  let browser;
  const report = { status: "FAIL", errors: [], cycles: [], cancellations: [] };
  try {
    browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
    report.manualTakeover = await browserTakeoverChecks(browser, server.url);
    const page = await browser.newPage();
    page.on("pageerror", error => report.errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") report.errors.push(message.text()); });
    page.on("response", response => { if (response.status() >= 400) report.errors.push(response.status() + " " + response.url()); });
    page.on("requestfailed", request => report.errors.push(request.url()));
    await page.evaluateOnNewDocument(() => {
      window.__bathAudioSources = new Set(); window.__bathAudioFilters = [];
      for (const method of ["createOscillator", "createBufferSource"]) {
        const create = AudioContext.prototype[method];
        AudioContext.prototype[method] = function(...args) {
          const source = create.apply(this, args), start = source.start;
          source.start = function(...times) { window.__bathAudioSources.add(this); this.addEventListener("ended", () => window.__bathAudioSources.delete(this)); return start.apply(this, times); };
          return source;
        };
      }
      const filter = AudioContext.prototype.createBiquadFilter;
      AudioContext.prototype.createBiquadFilter = function(...args) { const value = filter.apply(this, args); window.__bathAudioFilters.push(value); return value; };
    });
    await page.setViewport({ width: 1920, height: 1080 }); await page.goto(server.url, { waitUntil: "networkidle0" });
    const snapshot = () => page.evaluate(() => ({ state: Dialer.getDialerState(), count: Dialer.getLockedWaypoints().length,
      physics: { ...Physics.getState() }, caption: document.getElementById("act-subtext").textContent,
      depthText: document.getElementById("hud-depth-display").textContent, velocityText: document.getElementById("hud-velocity-display").textContent,
      fx: document.getElementById("aperture-fx-layer").className, records: Storage.getDiveHistory(), counter: document.getElementById("local-dives-count").textContent,
      audioSources: window.__bathAudioSources.size, droneFrequency: window.__bathAudioFilters[0].frequency.value }));
    const shot = async name => {
      await page.screenshot({ path: path.join(OUTPUT, name + ".png") });
      if (process.env.STARGATE_LOG_VISUALS === "1") {
        const data = await page.screenshot({ type: "jpeg", quality: 65, encoding: "base64" });
        for (let offset = 0; offset < data.length; offset += 16000) console.log("STARGATE_VISUAL bathyscaphe-" + name + ".jpg " + offset + " " + data.slice(offset, offset + 16000));
      }
    };
    const preset = async () => { await click(page, "#btn-quickdial-toggle"); await click(page, '[data-preset-id="PRESET-VER-01"]'); };
    const ready = async () => { await page.waitForFunction(() => Dialer.getDialerState() === "PENDING_READY"); assert.equal((await snapshot()).count, 8); };
    const idle = async label => {
      await delay(8250); const state = await snapshot();
      assert.equal(state.state, "IDLE"); assert.equal(state.count, 0); assert.equal(state.physics.depth, 0); assert.equal(state.physics.velocity, 0); assert.equal(state.physics.pressureBar, 1.01325);
      assert.equal(state.depthText, "00,000"); assert.equal(state.velocityText, "0.0 M/S"); assert.equal(state.fx, "aperture-fx-layer"); assert.equal(state.audioSources, 2); assert.equal(state.droneFrequency, 140);
      report.cancellations.push({ label, state }); await shot(label);
    };
    for (let cycle = 0; cycle < 2; cycle++) {
      if (!cycle) for (let i = 0; i < 8; i++) { await click(page, '[data-wp-index="' + i + '"]'); await delay(350); }
      else { await preset(); }
      await ready(); await delay(1500); assert.equal((await snapshot()).state, "PENDING_READY");
      await click(page, "#btn-commence-descent"); await delay(500); assert.equal((await snapshot()).state, "BUILDUP"); if (!cycle) await shot("buildup");
      await page.waitForFunction(() => Dialer.getDialerState() === "BREAKTHROUGH"); if (!cycle) await shot("breakthrough");
      await page.waitForFunction(() => Dialer.getDialerState() === "SUSTAINED_ACTIVE"); const active = await snapshot();
      assert.ok(active.physics.depth < 1000); assert.match(active.caption, /TARGET: 11,800m/);
      assert.equal(active.records.length, cycle + 1); assert.equal(active.counter, (cycle + 1) + " recorded");
      assert.ok(active.records[0].durationSeconds >= 2.8 && active.records[0].durationSeconds < 5); const measuredPressure = Number(active.records[0].maxPressure.replace(/[^0-9.]/g, ""));
      assert.ok(measuredPressure > 1 && Math.abs(measuredPressure - active.physics.pressureBar) < 10);
      report.cycles.push(active); if (!cycle) await shot("active");
      await click(page, "#btn-emergency-blow"); await idle("cycle-" + (cycle + 1) + "-cancelled");
    }
    await preset(); await ready(); await click(page, "#btn-commence-descent"); await delay(500); await page.keyboard.press("Escape"); await idle("buildup-key-cancelled");
    for (const at of [100, 500]) { await preset(); await delay(at); await click(page, "#btn-emergency-blow"); await idle("preset-" + at + "-cancelled"); }
    await preset(); await delay(300); await page.keyboard.press("Escape"); await preset(); await ready(); await delay(1500); assert.equal((await snapshot()).state, "PENDING_READY");
    await page.keyboard.press("Escape"); await idle("immediate-redial-cancelled");
    await click(page, '[data-target="panel-archive"]');
    report.categories = [];
    for (const [cat, count] of [["all", 10], ["dive", 3], ["incident", 2], ["anomaly", 3], ["crew", 2]]) {
      const selector = '.btn-cat-filter[data-cat="' + cat + '"]'; await click(page, selector);
      assert.match(await page.$eval(selector, element => element.textContent), new RegExp("\\(" + count + "\\)$"));
      assert.equal(await page.$$eval(".record-card", elements => elements.length), count); report.categories.push({ cat, count });
    }
    await shot("archive-counts"); await page.reload({ waitUntil: "networkidle0" });
    assert.equal((await snapshot()).counter, "2 recorded"); assert.equal((await snapshot()).records.length, 2);
    assert.deepEqual(report.errors, []); report.status = "PASS"; return report;
  } catch (error) { report.error = error.stack; throw error; }
  finally { fs.writeFileSync(path.join(OUTPUT, "browser.json"), JSON.stringify(report, null, 2) + "\n"); if (browser) await browser.close(); await server.close(); }
}
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const local = deterministic(); fs.writeFileSync(path.join(OUTPUT, "deterministic.json"), JSON.stringify(local, null, 2) + "\n"); console.log("BATHYSCAPHE_DETERMINISTIC " + JSON.stringify(local));
  if (!process.argv.includes("--offline")) console.log("BATHYSCAPHE_BROWSER " + JSON.stringify(await browserChecks()));
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { fixture, deterministic, browserChecks };
