"use strict";
// Actual application methods on a deterministic clock. DOM/canvas/audio rendering
// and genuine pointer delivery remain separate hosted qualification.
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const ROOT = path.resolve(__dirname, "..");
function fixture(source = fs.readFileSync(path.join(ROOT, "stargate_seti_freeform/src/main.js"), "utf8")) {
  let now = 0, next = 1;
  const timers = new Map(), elements = new Map();
  const add = (fn, ms, repeat) => { const id = next++; timers.set(id, { fn, ms, at: now + ms, repeat }); return id; };
  function element(id) {
    if (!elements.has(id)) {
      const classes = new Set();
      elements.set(id, { className: "", innerText: "", classes,
        classList: { add: (...names) => names.forEach(name => classes.add(name)), remove: (...names) => names.forEach(name => classes.delete(name)) } });
    }
    return elements.get(id);
  }
  const scope = {
    window: { addEventListener() {} }, document: { getElementById: element, querySelectorAll: () => [] },
    audioEngine: new Proxy({}, { get: () => () => {} }),
    setTimeout: (fn, ms) => add(fn, ms, false), setInterval: (fn, ms) => add(fn, ms, true),
    clearTimeout: id => timers.delete(id), clearInterval: id => timers.delete(id)
  };
  vm.createContext(scope);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "stargate_seti_freeform/src/data.js"), "utf8").replace(/^export /gm, ""), scope);
  vm.runInContext(source.replace(/^import .*;\r?$/gm, "") + "\nthis.App=TechnosignatureApp; this.presets=QUICK_DIAL_ENTRIES;", scope);
  scope.App.prototype.init = () => {};
  const app = new scope.App();
  for (const name of ["updateUIState", "updateTelemetryValues", "updateSlotUI", "clearSlotUI"]) app[name] = () => {};
  return { app, timers, elements, presets: scope.presets,
    advance(ms) {
      const end = now + ms; let count = 0;
      for (;;) {
        const entry = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!entry || entry[1].at > end) break;
        assert.ok(count++ < 10000, "Bounded controlled timer execution");
        now = entry[1].at;
        if (entry[1].repeat) entry[1].at += entry[1].ms; else timers.delete(entry[0]);
        entry[1].fn();
      }
      now = end;
    }
  };
}
function assertIdle(f) {
  assert.equal(f.app.systemState, "IDLE"); assert.equal(f.app.currentAddress.length, 0);
  assert.equal(f.app.isAutoDialing, false); assert.equal(f.timers.size, 0);
  for (const [id, element] of f.elements) {
    if (id.startsWith("dish-")) assert.ok(!element.classes.has("locked") && !element.classes.has("scanning"), "Dish stays cleared");
    if (id.startsWith("led-")) assert.equal(element.className, "dish-led");
  }
}
module.exports = { fixture };
// Register tests in shared-process node --test runs as well as direct execution.
{
  test("manual cancellation clears concurrent checks and late dish callbacks for 8.25 seconds", () => {
    const f = fixture();
    for (const id of [1, 2, 3]) f.app.selectCandidate(id);
    f.advance(100); assert.ok(f.timers.size > 3);
    f.app.disengage(); f.advance(8250); assertIdle(f);
  });
  test("old callbacks cannot append a carrier or restore dish visuals after manual restart", () => {
    for (const offset of [0, 27, 100, 307]) {
      const f = fixture(); f.app.selectCandidate(1); f.advance(offset);
      const stale = [...f.timers.values()].map(timer => timer.fn);
      f.app.disengage(); f.app.selectCandidate(2);
      for (const callback of stale) callback();
      f.advance(8250);
      assert.deepEqual(Array.from(f.app.currentAddress), [2]); assert.equal(f.app.systemState, "DIALING");
      f.app.disengage(); f.advance(8250); assertIdle(f);
    }
  });
  test("manual cancel followed by preset completes its exact seven-carrier address", () => {
    const f = fixture(); f.app.selectCandidate(2); f.advance(100);
    const stale = [...f.timers.values()].map(timer => timer.fn);
    f.app.disengage(); f.app.loadQuickDialPreset(f.presets[0]);
    for (const callback of stale) callback();
    f.advance(4000);
    assert.equal(f.app.systemState, "READY");
    assert.deepEqual(Array.from(f.app.currentAddress), Array.from(f.presets[0].sequence));
    f.app.disengage(); f.advance(8250); assertIdle(f);
  });
  test("normal manual dish cadence and seven original 350ms selections remain intact", () => {
    const first = fixture(); first.app.selectCandidate(1);
    first.advance(307); assert.equal(first.app.currentAddress.length, 0);
    first.advance(1); assert.deepEqual(Array.from(first.app.currentAddress), [1]);
    const f = fixture();
    for (let id = 1; id <= 7; id++) { f.app.selectCandidate(id); f.advance(350); assert.equal(f.app.currentAddress.length, id); }
    assert.equal(f.app.systemState, "READY"); assert.equal(f.app.isAutoDialing, false);
  });
}

