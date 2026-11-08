"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const { startPreview, selectExhibit } = require("./preview.js");
const { click } = require("./browser-check-helpers.js");
const ROOT = path.resolve(__dirname, ".."), NAME = "stargate_blueprint_alpha", DIR = path.join(ROOT, NAME);
const OUTPUT = path.join(ROOT, "test/blueprint-regressions");
// Blob identity survives the campaign's distinct local and API-published commit IDs.
const MUTE_BASELINE = { commit: "eebe6beee81f3872230eb038bdc9b65c9cbcdbfc", blob: "c595dc2c4726869b5d64ea3b3344aa0f40a21a9f" };
const previousAudio = () => execFileSync("git", ["show", MUTE_BASELINE.blob], { cwd: ROOT, encoding: "utf8" });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const html = fs.readFileSync(path.join(DIR, "index.html"), "utf8");
const plans = [...html.matchAll(/data-plan-id="([^"]+)" data-symbols="([^"]+)"/g)].map(([, id, symbols]) => ({ id, symbols: symbols.split(",").map(Number) }));
function fixture(realAudio = false, audioSourceText) {
  let now = 0, timerId = 0;
  const timers = new Map(), elements = new Map(), activeAudio = new Set(), calls = [];
  const schedule = (fn, ms, repeat = false) => { const id = ++timerId; timers.set(id, { fn, ms, time: now + ms, repeat }); return id; };
  const element = id => {
    if (id === "aperture-flux-canvas") return null;
    if (!elements.has(id)) {
      const classes = new Set(/stamp-group|operator-modal/.test(id) ? ["hidden"] : []), attributes = {};
      elements.set(id, { textContent: "", innerHTML: "", style: {}, dataset: {}, disabled: false,
        classList: { add: (...values) => values.forEach(v => classes.add(v)), remove: (...values) => values.forEach(v => classes.delete(v)), contains: value => classes.has(value) },
        addEventListener(type, fn) { this[type] = fn; }, setAttribute: (key, value) => { attributes[key] = value; }, getAttribute: key => attributes[key],
        querySelector: selector => element(id + selector), querySelectorAll: () => [], getBoundingClientRect: () => ({ width: 1920, height: 1080, left: 0, top: 0 }) });
    }
    return elements.get(id);
  };
  const glyphs = Array.from({ length: 16 }, (_, i) => { const button = element("glyph-" + i); button.dataset.glyphIndex = String(i); return button; });
  const cards = plans.map(plan => { const card = element("plan-" + plan.id); card.dataset = { planId: plan.id, symbols: plan.symbols.join(",") }; return card; });
  const nodes = Array.from({ length: 8 }, (_, i) => element("lock-node-" + i));
  const slots = Array.from({ length: 6 }, (_, i) => element("slot-" + i)); element("address-slots-container").querySelectorAll = () => slots;
  const param = () => ({ value: 0, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; }, exponentialRampToValueAtTime(v) { this.value = v; }, setTargetAtTime(v) { this.value = v; }, cancelScheduledValues() {} });
  const audioNode = () => ({ gain: param(), frequency: param(), Q: param(), connect() {}, disconnect() {} });
  const audioSource = () => {
    const node = audioNode(); let startTimer, endTimer;
    node.start = (time = now / 1000) => {
      startTimer = schedule(() => activeAudio.add(node), Math.max(0, time * 1000 - now));
      if (node.buffer && !node.loop) node.stop(time + node.buffer.duration);
    };
    node.stop = (time = now / 1000) => {
      if (endTimer) timers.delete(endTimer);
      endTimer = schedule(() => { timers.delete(startTimer); activeAudio.delete(node); node.stopped = true; if (node.onended) node.onended(); }, Math.max(0, time * 1000 - now));
    };
    return node;
  };
  class AudioContext {
    constructor() { this.sampleRate = 100; this.destination = {}; this.state = "running"; }
    get currentTime() { return now / 1000; }
    createGain() { return audioNode(); } createBiquadFilter() { return audioNode(); }
    createOscillator() { return audioSource(); } createBufferSource() { return audioSource(); }
    createBuffer(channels, length, rate) { return { duration: length / rate, getChannelData: () => new Float32Array(length) }; }
    resume() {}
  }
  const ctx = { console, Date, Math, AudioContext, innerWidth: 1920, innerHeight: 1080, addEventListener() {},
    document: { readyState: "complete", getElementById: element, addEventListener() {},
      querySelectorAll: selector => selector === ".glyph-btn" ? glyphs : selector === ".site-plan-card" ? cards : selector === ".datum-lock-node" ? nodes : [],
      querySelector: selector => cards.find(card => selector.includes('"' + card.dataset.planId + '"')) },
    setTimeout: (fn, ms) => schedule(fn, ms), setInterval: (fn, ms) => schedule(fn, ms, true), clearTimeout: id => timers.delete(id),
    requestAnimationFrame: () => 1, cancelAnimationFrame() {}, blueprintAudio: new Proxy({}, { get: (target, name) => (...args) => calls.push({ time: now, name, args }) }) };
  ctx.window = ctx; vm.createContext(ctx);
  if (realAudio) vm.runInContext(audioSourceText || fs.readFileSync(path.join(DIR, "audio.js"), "utf8"), ctx);
  vm.runInContext(fs.readFileSync(path.join(DIR, "app.js"), "utf8"), ctx);
  const advance = ms => { const end = now + ms; while (now < end) { now = Math.min(now + 1, end); for (const [id, timer] of [...timers]) if (timer.time <= now && timers.has(id)) { if (timer.repeat) timer.time += timer.ms; else timers.delete(id); timer.fn(); } } };
  const snapshot = () => ({ ...JSON.parse(JSON.stringify(ctx.__BLUEPRINT_CAD_API__.getState())), stamp: !element("approval-stamp-group").classList.contains("hidden"), status: element("system-status-indicator").textContent, filled: slots.filter(slot => slot.classList.contains("filled")).length });
  return { ctx, api: ctx.__BLUEPRINT_CAD_API__, element, glyphs, cards, nodes, slots, advance, snapshot, calls, activeAudio };
}
function assertIdle(f) {
  const state = f.snapshot(); assert.deepEqual(state.stagedGlyphs, []); assert.deepEqual(state.lockedNodes, []);
  assert.equal(state.isConnected, false); assert.equal(state.isEngaging, false); assert.equal(state.isPlottingPlan, false);
  assert.equal(state.currentSitePlan, null); assert.equal(state.stamp, false); assert.equal(state.filled, 0); assert.equal(f.activeAudio.size, 0);
}
function deterministic() {
  const rows = [];
  for (const plan of plans) {
    const f = fixture(true); f.api.loadPlan(plan.id); const counts = [];
    for (let i = 0; i < 6; i++) {
      if (i) f.advance(120); const state = f.snapshot(); counts.push(state.filled);
      assert.deepEqual(state.stagedGlyphs, plan.symbols.slice(0, i + 1)); assert.equal(state.filled, i + 1); assert.equal(state.isConnected, false); assert.equal(state.stamp, false);
    }
    f.advance(8250); assert.equal(f.snapshot().isConnected, false); assert.equal(f.element("btn-engage-draft").disabled, false);
    f.api.engage(); f.advance(1599); assert.equal(f.snapshot().activationStage, "BUILDUP"); assert.equal(f.snapshot().stamp, false);
    f.advance(1); assert.equal(f.snapshot().activationStage, "BREAKTHROUGH"); assert.equal(f.snapshot().stamp, true); assert.equal(f.snapshot().isConnected, false);
    f.advance(599); assert.equal(f.snapshot().activationStage, "BREAKTHROUGH"); f.advance(1); assert.equal(f.snapshot().activationStage, "SUSTAINED_ACTIVE"); assert.equal(f.snapshot().isConnected, true);
    f.api.disengage(); f.advance(8250); assertIdle(f); rows.push({ plan: plan.id, counts, exactSymbols: plan.symbols });
  }
  for (const at of [0, 60, 240, 500, 590]) for (const cancel of ["disengage", "clearBuffer"]) {
    const f = fixture(true); f.api.loadPlan(plans[0].id); f.advance(at); f.api[cancel](); f.advance(8250); assertIdle(f);
  }
  const replacement = fixture(true); replacement.api.loadPlan(plans[0].id); replacement.advance(240); replacement.api.loadPlan(plans[3].id); replacement.advance(8250);
  assert.deepEqual(replacement.snapshot().stagedGlyphs, plans[3].symbols); assert.equal(replacement.snapshot().isConnected, false);
  const manual = fixture(true); manual.api.loadPlan(plans[0].id); manual.advance(240); manual.api.selectGlyph(15); manual.advance(8250);
  assert.deepEqual(manual.snapshot().stagedGlyphs, [0, 1, 2, 15]); assert.equal(manual.snapshot().currentSitePlan, null);
  const activation = fixture(true); for (let i = 0; i < 6; i++) activation.api.selectGlyph(i); activation.api.engage(); activation.advance(50); activation.api.disengage(); activation.advance(8250); assertIdle(activation);
  for (const [at, stage] of [[500, "BUILDUP"], [1800, "BREAKTHROUGH"], [2500, "SUSTAINED_ACTIVE"]]) {
    const f = fixture(true); f.api.loadPlan(plans[0].id); f.advance(600); f.api.engage(); f.advance(at);
    assert.equal(f.snapshot().activationStage, stage); f.api.disengage(); f.advance(8250); assertIdle(f); assert.equal(f.snapshot().activationStage, "IDLE");
  }
  const duringHold = fixture(true); duringHold.api.loadPlan(plans[0].id); duringHold.advance(600); duringHold.api.engage(); duringHold.advance(500); duringHold.api.toggleHold(); duringHold.advance(8250); assertIdle(duringHold); assert.equal(duringHold.snapshot().reviewHoldActive, true);
  const hold = fixture(true); for (let i = 0; i < 6; i++) hold.api.selectGlyph(i); hold.api.toggleHold(); hold.api.engage(); hold.api.clearBuffer(); hold.advance(8250); assertIdle(hold); assert.equal(hold.element("review-hold-stamp-group").classList.contains("hidden"), true);
  const audio = fixture(true), engine = audio.ctx.blueprintAudio; let penStrokes = 0; const scratch = engine.playPenScratch.bind(engine); engine.playPenScratch = () => { penStrokes++; scratch(); };
  engine.playCaliperSnap(); audio.advance(10); engine.playDisengage(); audio.advance(100); assert.equal(penStrokes, 0);
  engine.playApprovalAndActivation(); audio.advance(50); engine.playDisengage(); audio.advance(50); engine.playApprovalAndActivation(); audio.advance(650);
  assert.equal(engine.ambientHumNodes.length, 3); assert.ok(engine.ambientHumNodes.every(node => !node.stopped));
  engine.playDisengage(); audio.advance(8250); assert.equal(audio.activeAudio.size, 0);
  const baselineMute = fixture(true, previousAudio()), oldAudio = baselineMute.ctx.blueprintAudio;
  oldAudio.startAmbientHum(); baselineMute.advance(1200); oldAudio.toggleAudio(); oldAudio.toggleAudio(); baselineMute.advance(250);
  assert.equal(oldAudio.enabled, true); assert.equal(oldAudio.ambientHumGain.gain.value, 0, "Retain the original mute/unmute defect proof");
  const mute = fixture(true), sound = mute.ctx.blueprintAudio;
  sound.startAmbientHum(); mute.advance(50); sound.toggleAudio(); mute.advance(1200);
  assert.equal(sound.ambientHumGain.gain.value, 0); assert.equal(sound.enabled, false);
  sound.toggleAudio(); mute.advance(250); assert.equal(sound.ambientHumGain.gain.value, 0.08);
  sound.toggleAudio(); sound.playDisengage(); mute.advance(8250); assert.equal(mute.activeAudio.size, 0);
  sound.toggleAudio(); mute.advance(1200); assert.equal(sound.ambientHumNodes.length, 0, "Unmuting idle does not restart a cancelled connection");
  sound.toggleAudio(); sound.startAmbientHum(); assert.equal(sound.enabled, false); assert.equal(sound.ambientHumNodes.length, 0);
  sound.toggleAudio(); mute.advance(1200); assert.equal(sound.ambientHumNodes.length, 3); assert.equal(sound.ambientHumGain.gain.value, 0.08);
  sound.playDisengage(); mute.advance(10); sound.toggleAudio(); mute.advance(10);
  assert.equal(sound.ambientCleanups.size, 0); assert.equal(mute.activeAudio.size, 0, "Muting a retiring connection stops its owned fade and transient sounds");
  const timings = [];
  for (const interval of [0, 80, 350]) { const f = fixture(); for (let i = 0; i < 6; i++) { f.glyphs[i].click({}); f.advance(interval); } assert.equal(f.snapshot().filled, 6); assert.equal(f.snapshot().isConnected, false); timings.push({ intervalMs: interval, filled: 6 }); }
  return { status: "PASS", plans: rows, interruptionTimesMs: [0, 60, 240, 500, 590], cancellationControls: ["disengage", "clearBuffer"], idleObservationMs: 8250,
    exactReplacement: plans[3].symbols, manualTakeover: [0, 1, 2, 15], lateActivationCancelledAtMs: 50, stageBoundariesMs: [1600, 2200], stageCancellationsMs: [500, 1800, 2500], rapidRedialAmbientNodes: 3, cancelledPenStrokes: penStrokes, manualTiming: timings,
    mute: { baseline: MUTE_BASELINE, oldUnmutedGain: 0, repairedGain: 0.08, mutedActivation: "silent until unmuted", cancelledActivation: "does not resume on unmute", retiringFade: "stopped on mute" },
    operatorIssue: "UNRESOLVED: automated manual staging does not supersede operator-reported failure", originalSuite: "CONTRACT_CONFLICT: unchanged manual500ms and phase9 automatic-activation assertions conflict with staged activation" };
}
async function browserMuteChecks(browser, url) {
  const results = [];
  for (const baseline of [true, false]) {
    const context = await browser.createBrowserContext(), page = await context.newPage(), errors = [];
    try {
      page.on("pageerror", error => errors.push(error.message));
      page.on("requestfailed", request => errors.push(request.url()));
      page.on("response", response => { if (response.status() >= 400) errors.push(response.status() + " " + response.url()); });
      if (baseline) {
        const source = previousAudio(); await page.setRequestInterception(true);
        page.on("request", request => request.url() === url + "/audio.js"
          ? request.respond({ status: 200, contentType: "text/javascript", body: source }) : request.continue());
      }
      await page.setViewport({ width: 1920, height: 1080 }); await page.goto(url, { waitUntil: "networkidle0" });
      const state = () => page.evaluate(() => ({ enabled: window.blueprintAudio.enabled, gain: window.blueprintAudio.ambientHumGain?.gain.value ?? null,
        nodes: window.blueprintAudio.ambientHumNodes.length, transients: window.blueprintAudio.transientSources.size,
        cleanups: window.blueprintAudio.ambientCleanups.size, connected: window.__BLUEPRINT_CAD_API__.getState().isConnected }));
      const engage = async () => {
        await click(page, '[data-plan-id="civil-helios"]');
        await page.waitForFunction(() => !document.getElementById("btn-engage-draft").disabled);
        await click(page, "#btn-engage-draft");
        await page.waitForFunction(() => window.__BLUEPRINT_CAD_API__.getState().isConnected);
      };
      await engage(); await delay(1250);
      assert.ok((await state()).gain > 0.07);
      await click(page, "#sound-toggle-btn"); await delay(100);
      assert.equal((await state()).gain, 0);
      await click(page, "#sound-toggle-btn"); await delay(250);
      const resumed = await state(); assert.equal(resumed.enabled, true);
      if (baseline) assert.equal(resumed.gain, 0, "Reproduce historical silent unmute through real pointer controls");
      else {
        assert.ok(resumed.gain > 0.07, "Unmute restores the connected ambient gain");
        await click(page, "#sound-toggle-btn"); await click(page, "#btn-disengage-draft"); await delay(750);
        let current = await state(); assert.equal(current.enabled, false); assert.equal(current.nodes, 0); assert.equal(current.transients, 0);
        await click(page, "#sound-toggle-btn"); await delay(250);
        current = await state(); assert.equal(current.nodes, 0); assert.equal(current.connected, false);
        await click(page, "#sound-toggle-btn"); await engage(); await delay(1250);
        current = await state(); assert.equal(current.enabled, false); assert.equal(current.nodes, 0); assert.equal(current.transients, 0);
        await click(page, "#sound-toggle-btn"); await delay(50); await click(page, "#sound-toggle-btn"); await delay(1250);
        current = await state(); assert.equal(current.enabled, false); assert.equal(current.gain, 0, "Muting cancels an in-progress gain ramp");
        await click(page, "#sound-toggle-btn"); await delay(250); assert.ok((await state()).gain > 0.07);
        await click(page, "#btn-disengage-draft"); await click(page, "#sound-toggle-btn"); await delay(8250);
        current = await state(); assert.equal(current.enabled, false); assert.equal(current.nodes, 0); assert.equal(current.transients, 0); assert.equal(current.cleanups, 0);
      }
      assert.deepEqual(errors, []);
      results.push({ mode: baseline ? "baseline-audio" : "repaired-audio", status: "PASS", resumed,
        scope: baseline ? "Historical unmute defect reproduced" : "Real pointer mute, active/idle unmute, muted activation, ramp interruption and cancellation" });
    } finally { await context.close(); }
  }
  return results;
}
async function browserChecks() {
  const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer");
  const server = await startPreview({ ...selectExhibit(NAME), port: 0 }); let browser;
  const report = { status: "FAIL", errors: [], manual: [], geometry: [], plans: [], cancellations: [] };
  try {
    browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
    report.mute = await browserMuteChecks(browser, server.url);
    const page = await browser.newPage();
    page.on("pageerror", error => report.errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") report.errors.push(message.text()); });
    page.on("response", response => { if (response.status() >= 400) report.errors.push(response.status() + " " + response.url()); });
    page.on("requestfailed", request => report.errors.push(request.url()));
    await page.evaluateOnNewDocument(() => {
      window.__blueprintSources = new Set();
      for (const method of ["createOscillator", "createBufferSource"]) {
        const create = AudioContext.prototype[method];
        AudioContext.prototype[method] = function(...args) { const source = create.apply(this, args), start = source.start;
          source.start = function(...times) { window.__blueprintSources.add(this); this.addEventListener("ended", () => window.__blueprintSources.delete(this)); return start.apply(this, times); }; return source; };
      }
    });
    await page.setViewport({ width: 1920, height: 1080 }); await page.goto(server.url, { waitUntil: "networkidle0" });
    const snapshot = () => page.evaluate(() => ({ ...window.__BLUEPRINT_CAD_API__.getState(),
      filled: document.querySelectorAll(".seq-slot.filled").length, locked: document.querySelectorAll(".datum-lock-node.locked").length,
      stamp: !document.getElementById("approval-stamp-group").classList.contains("hidden"), canvas: document.getElementById("aperture-flux-canvas").classList.contains("active"),
      status: document.getElementById("system-status-indicator").textContent, engageDisabled: document.getElementById("btn-engage-draft").disabled,
      audioSources: window.__blueprintSources.size, ambientHumNodes: window.blueprintAudio.ambientHumNodes.length }));
    const capturedImages = [];
    const shot = async name => {
      const png = Buffer.from(await page.screenshot({ path: path.join(OUTPUT, name + ".png") })).toString("base64");
      capturedImages.push({ name, png });
      return png;
    };
    const emitCapturedImages = async () => {
      if (process.env.STARGATE_LOG_VISUALS !== "1") return;
      // Convert the exact asserted PNG after timing-sensitive checks. A second live
      // screenshot can show a later stage and consume the 600 ms breakthrough window.
      for (const { name, png } of capturedImages) {
        const data = await page.evaluate(async png => {
          const image = new Image(); image.src = "data:image/png;base64," + png; await image.decode();
          const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height;
          canvas.getContext("2d").drawImage(image, 0, 0); return canvas.toDataURL("image/jpeg", 0.65).split(",")[1];
        }, png);
        for (let offset = 0; offset < data.length; offset += 16000) console.log("STARGATE_VISUAL blueprint-" + name + ".jpg " + offset + " " + data.slice(offset, offset + 16000));
      }
    };
    const pending = async symbols => {
      await page.waitForFunction(() => { const state = window.__BLUEPRINT_CAD_API__.getState(); return state.stagedGlyphs.length === 6 && !state.isPlottingPlan; });
      const state = await snapshot(); assert.deepEqual(state.stagedGlyphs, symbols); assert.equal(state.filled, 6); assert.equal(state.locked, 6); assert.equal(state.isConnected, false); assert.equal(state.stamp, false); assert.equal(state.canvas, false); assert.equal(state.engageDisabled, false); return state;
    };
    const active = async () => {
      await page.waitForFunction(() => window.__BLUEPRINT_CAD_API__.getState().activationStage === "SUSTAINED_ACTIVE");
      const state = await snapshot(); assert.equal(state.isConnected, true); assert.equal(state.stamp, true); assert.equal(state.canvas, true); return state;
    };
    const idle = async label => {
      await delay(8250); const state = await snapshot(); assert.deepEqual(state.stagedGlyphs, []); assert.equal(state.filled, 0); assert.equal(state.locked, 0);
      assert.equal(state.isConnected, false); assert.equal(state.stamp, false); assert.equal(state.canvas, false); assert.equal(state.audioSources, 0); assert.equal(state.ambientHumNodes, 0); report.cancellations.push({ label, state }); await shot(label);
    };
    const headerLayout = async replacement => page.evaluate(replacement => {
      const status = document.getElementById('system-status-indicator'), previous = status.textContent;
      if (replacement) status.textContent = replacement;
      const selectors = ['.firm-main-title', '.firm-sub-title', '.telemetry-item', '#sound-toggle-btn'];
      const items = selectors.flatMap(selector => [...document.querySelectorAll(selector)].map(element => {
        const range = document.createRange(); range.selectNodeContents(element);
        const bands = [];
        for (const rect of [...range.getClientRects()].filter(r => r.width && r.height)) {
          const center = rect.top + rect.height / 2;
          // Inline icons/spans may differ slightly in font metrics on one line.
          if (!bands.some(band => Math.abs(band.center - center) < Math.min(band.height, rect.height) / 2)) bands.push({ center, height: rect.height });
        }
        const r = element.getBoundingClientRect();
        return { selector, lines: bands.length, top: r.top, height: r.height, visible: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight };
      }));
      if (replacement) status.textContent = previous;
      return items;
    }, replacement);
    const assertStableHeader = layout => {
      assert.ok(layout.every(item => item.visible), 'Header text remains inside the viewport');
      assert.ok(layout.every(item => item.lines === 1), 'Brand, metadata and audio control retain single-line layout');
    };
    report.headerLayout = []; report.stageHeaderLayout = [];
    for (const [width, height] of [[1920, 1080], [3840, 2160]]) {
      await page.setViewport({ width, height }); await delay(100);
      await page.evaluate(() => document.fonts.ready);
      const beforeHeader = await headerLayout('BREAKTHROUGH // DRAWING CERTIFIED');
      const afterHeader = await headerLayout('BREAKTHROUGH // CERTIFIED');
      assert.ok(beforeHeader.find(item => item.selector === '.firm-main-title').lines > 1, 'Prior status text reproduces brand wrapping in the actual browser');
      assertStableHeader(afterHeader);
      report.headerLayout.push({ viewport: [width, height], baseline: 'Prior status label replayed in the same DOM/CSS', before: beforeHeader, after: afterHeader });
      const geometry = await page.evaluate(() => {
        const selectors = [...Array.from({ length: 16 }, (_, i) => '.glyph-btn[data-glyph-index="' + i + '"]'), "#btn-engage-draft", "#btn-disengage-draft"];
        return selectors.map(selector => { const element = document.querySelector(selector), box = element.getBoundingClientRect(), x = box.x + box.width / 2, y = box.y + box.height / 2, hit = document.elementFromPoint(x, y);
          return { selector, x, y, width: box.width, height: box.height, inViewport: x >= 0 && y >= 0 && x <= innerWidth && y <= innerHeight, reachable: hit === element || element.contains(hit) }; });
      });
      assert.ok(geometry.every(item => item.reachable && item.inViewport));
      report.geometry.push({ viewport: [width, height], controls: geometry });
      for (const interval of [0, 80, 350]) {
        const start = Date.now(); for (let i = 0; i < 6; i++) { await click(page, '.glyph-btn[data-glyph-index="' + i + '"]'); if (interval) await delay(interval); }
        const state = await pending([0, 1, 2, 3, 4, 5]); await click(page, "#btn-engage-draft"); await active();
        await click(page, "#btn-disengage-draft"); await delay(100); assert.equal((await snapshot()).filled, 0);
        report.manual.push({ viewport: [width, height], requestedIntervalMs: interval, elapsedMs: Date.now() - start, staged: state.stagedGlyphs });
      }
    }
    await page.setViewport({ width: 1920, height: 1080 }); await delay(100);
    await click(page, '[data-plan-id="civil-helios"]'); await pending(plans[0].symbols);
    const stageImages = [], stageStart = Date.now(); report.stages = [];
    await click(page, "#btn-engage-draft"); await delay(500);
    for (const stage of ["BUILDUP", "BREAKTHROUGH", "SUSTAINED_ACTIVE"]) {
      await page.waitForFunction(expected => window.__BLUEPRINT_CAD_API__.getState().activationStage === expected, {}, stage);
      if (stage === "SUSTAINED_ACTIVE") await delay(400);
      const before = await snapshot(); assert.equal(before.activationStage, stage);
      const layout = await headerLayout(); assertStableHeader(layout);
      report.stageHeaderLayout.push({ viewport: [1920, 1080], stage, layout });
      assert.equal(before.stamp, stage !== "BUILDUP"); assert.equal(before.canvas, stage === "SUSTAINED_ACTIVE");
      stageImages.push(await shot("stage-" + stage.toLowerCase()));
      assert.equal((await snapshot()).activationStage, stage, "Capture must remain inside the named stage");
      report.stages.push({ stage, elapsedMs: Date.now() - stageStart, stamp: before.stamp, canvas: before.canvas, connected: before.isConnected });
    }
    const region = await page.$eval(".drawing-canvas-wrapper", element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
    report.stagePixels = await page.evaluate(async (images, region) => {
      const frames = [];
      for (const data of images) {
        const image = new Image(); image.src = "data:image/png;base64," + data; await image.decode();
        const canvas = document.createElement("canvas"); canvas.width = Math.round(region.width); canvas.height = Math.round(region.height);
        const ctx = canvas.getContext("2d"); ctx.drawImage(image, region.x, region.y, region.width, region.height, 0, 0, canvas.width, canvas.height);
        frames.push(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
      }
      return [[0, 1], [1, 2], [0, 2]].map(([a, b]) => {
        let changed = 0; for (let i = 0; i < frames[a].length; i += 4) if (Math.abs(frames[a][i] - frames[b][i]) + Math.abs(frames[a][i + 1] - frames[b][i + 1]) + Math.abs(frames[a][i + 2] - frames[b][i + 2]) > 24) changed++;
        return { pair: [a, b], changedFraction: changed / (frames[a].length / 4) };
      });
    }, stageImages, region);
    assert.ok(report.stagePixels.every(pair => pair.changedFraction > 0.002), "All three central instrument captures must differ visibly");
    await click(page, "#btn-disengage-draft");
    await page.setViewport({ width: 3840, height: 2160 }); await delay(100);
    await click(page, '[data-plan-id="civil-helios"]'); await pending(plans[0].symbols); await click(page, '#btn-engage-draft');
    for (const stage of ['BUILDUP', 'BREAKTHROUGH', 'SUSTAINED_ACTIVE']) {
      await page.waitForFunction(expected => window.__BLUEPRINT_CAD_API__.getState().activationStage === expected, {}, stage);
      const layout = await headerLayout(); assertStableHeader(layout); report.stageHeaderLayout.push({ viewport: [3840, 2160], stage, layout });
    }
    await click(page, '#btn-disengage-draft'); await page.setViewport({ width: 1920, height: 1080 }); await delay(100);
    for (const plan of plans) {
      await click(page, '.site-plan-card[data-plan-id="' + plan.id + '"]'); const samples = [], start = Date.now();
      while (Date.now() - start < 800) { const state = await snapshot(); samples.push({ count: state.filled, symbols: state.stagedGlyphs, connected: state.isConnected }); if (plan === plans[0] && state.filled === 3) await shot("preset-in-progress"); await delay(25); }
      const pendingState = await pending(plan.symbols); await delay(1500); assert.equal((await snapshot()).isConnected, false);
      assert.ok(samples.some(s => s.count > 0 && s.count < 6)); assert.ok(samples.every(s => !s.connected));
      for (const sample of samples) assert.deepEqual(sample.symbols, plan.symbols.slice(0, sample.count));
      if (plan === plans[0]) await shot("preset-pending");
      await click(page, "#btn-engage-draft"); await active();
      await click(page, "#btn-disengage-draft"); report.plans.push({ id: plan.id, samples, pendingState });
    }
    await click(page, '[data-plan-id="civil-helios"]'); await delay(250); await click(page, '[data-plan-id="class-oort"]'); await pending(plans[3].symbols);
    report.replacement = (await snapshot()).stagedGlyphs; await click(page, "#btn-disengage-draft"); await idle("exact-replacement-cancelled");
    for (const [button, at] of [["#btn-disengage-draft", 50], ["#btn-clear-buffer", 300]]) {
      await click(page, '[data-plan-id="civil-helios"]'); await delay(at); await click(page, button); await idle("preset-" + at + "-cancelled");
    }
    for (const stage of ["BUILDUP", "BREAKTHROUGH", "SUSTAINED_ACTIVE"]) {
      await click(page, '[data-plan-id="civil-helios"]'); await pending(plans[0].symbols); await click(page, "#btn-engage-draft");
      await page.waitForFunction(expected => window.__BLUEPRINT_CAD_API__.getState().activationStage === expected, {}, stage);
      if (stage === "BUILDUP") await delay(500);
      assert.equal((await snapshot()).activationStage, stage); await click(page, "#btn-disengage-draft"); await idle(stage.toLowerCase() + "-cancelled");
    }
    // Real keyboard redial checks the complete staged path; the deterministic audio case isolates the550ms cleanup race.
    for (let i = 0; i < 6; i++) { await page.focus('.glyph-btn[data-glyph-index="' + i + '"]'); await page.keyboard.press("Enter"); }
    await click(page, "#btn-engage-draft"); await active(); await click(page, "#btn-disengage-draft");
    for (let i = 0; i < 6; i++) { await page.focus('.glyph-btn[data-glyph-index="' + i + '"]'); await page.keyboard.press("Enter"); }
    await click(page, "#btn-engage-draft"); await active(); await delay(700); report.rapidRedial = await snapshot(); assert.equal(report.rapidRedial.ambientHumNodes, 3); assert.equal(report.rapidRedial.stamp, true);
    await click(page, "#btn-disengage-draft"); await idle("rapid-redial-cancelled");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await click(page, '[data-plan-id="civil-helios"]'); await pending(plans[0].symbols); await click(page, "#btn-engage-draft"); await delay(500);
    report.reducedMotion = await page.evaluate(() => ({ stage: window.__BLUEPRINT_CAD_API__.getState().activationStage,
      traceAnimation: getComputedStyle(document.querySelector('.aperture-grid-circle')).animationName,
      statusAnimation: getComputedStyle(document.getElementById('system-status-indicator')).animationName,
      caption: document.getElementById('aperture-status-text').textContent }));
    assert.equal(report.reducedMotion.stage, "BUILDUP"); assert.equal(report.reducedMotion.traceAnimation, "none"); assert.equal(report.reducedMotion.statusAnimation, "none"); assert.match(report.reducedMotion.caption, /BUILDUP/);
    await active(); await click(page, "#btn-disengage-draft");
    assert.deepEqual(report.errors, []); report.operatorIssue = "UNRESOLVED: pointer/key automation cannot overturn operator-reported manual failure";
    report.originalSuite = "CONTRACT_CONFLICT: verify.js still requires active at500ms and automatic presets; no assertions altered or shimmed";
    await emitCapturedImages();
    report.activationStages = "PASS:1600ms buildup,600ms breakthrough then sustained; central screenshot pairs compared and every stage canceled"; report.status = "PASS"; return report;
  } catch (error) { report.error = error.stack; throw error; }
  finally { fs.writeFileSync(path.join(OUTPUT, "browser.json"), JSON.stringify(report, null, 2)); if (browser) await browser.close(); await server.close(); }
}
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true }); const local = deterministic(); fs.writeFileSync(path.join(OUTPUT, "deterministic.json"), JSON.stringify(local, null, 2)); console.log("BLUEPRINT_REGRESSIONS " + JSON.stringify(local));
  if (!process.argv.includes("--offline")) {
    const report = await browserChecks();
    console.log("BLUEPRINT_BROWSER_REGRESSIONS " + JSON.stringify({ status: report.status, manual: report.manual,
      geometry: report.geometry, plans: report.plans.map(row => ({ id: row.id, sampledCounts: [...new Set(row.samples.map(sample => sample.count))] })),
      stages: report.stages, stagePixels: report.stagePixels, cancellations: report.cancellations.map(row => ({ label: row.label, stage: row.state.activationStage, count: row.state.filled, audioSources: row.state.audioSources })),
      headerLayout: report.headerLayout, stageHeaderLayout: report.stageHeaderLayout, mute: report.mute,
      reducedMotion: report.reducedMotion, operatorIssue: report.operatorIssue, originalSuite: report.originalSuite }));
  }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { fixture, plans, deterministic, browserChecks };
