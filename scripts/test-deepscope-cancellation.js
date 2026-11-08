"use strict";
// Real application state/timer methods with a controlled clock; browser rendering
// remains covered by check-package-entry-security and the untouched original suite.
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const ROOT = path.resolve(__dirname, "..");
function fixture(source = fs.readFileSync(path.join(ROOT, "stargate_seti_deepscope/src/main.js"), "utf8")) {
  let now = 0, nextId = 1;
  const timers = new Map();
  const scope = {
    performance: { now: () => now }, window: { addEventListener() {} },
    document: { getElementById: () => null },
    soundEngine: new Proxy({}, { get: () => () => {} }),
    setTimeout(fn, ms) { const id = nextId++; timers.set(id, { fn, at: now + ms }); return id; },
    clearTimeout(id) { timers.delete(id); }
  };
  vm.createContext(scope);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "stargate_seti_deepscope/src/data/carriers.js"), "utf8").replace(/^export /gm, ""), scope);
  vm.runInContext(source.replace(/^import .*;\r?$/gm, "") + "\nthis.App = DeepScopeApp; this.presets = QUICKDIAL_PRESETS;", scope);
  scope.App.prototype.init = () => {};
  const app = new scope.App();
  for (const name of ["renderSectorDial", "updateStatusBanner", "renderRegisterSlots", "setTelemetryState", "hideSafetyToast"]) app[name] = () => {};
  app.polarWaterfall = { setSystemState() {}, setLockedSectors() {} };
  app.spectralOsc = { setState() {} };
  return { app, presets: scope.presets, timers,
    advance(ms) {
      const end = now + ms; let count = 0;
      for (;;) {
        const item = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!item || item[1].at > end) break;
        assert.ok(count++ < 10000, "Bounded timer execution");
        now = item[1].at; timers.delete(item[0]); item[1].fn();
      }
      now = end;
    }
  };
}
function idle(f) {
  assert.equal(f.app.state, "IDLE");
  assert.equal(f.app.lockedCarriers.length, 0);
  assert.equal(f.app.isAutoDialing, false);
  assert.equal(f.timers.size, 0);
}
if (require.main !== module) module.exports = { fixture };
else {
  test("preset and manual verification cancellation stay idle after 8.25 seconds", () => {
    for (const preset of [true, false]) {
      const f = fixture();
      if (preset) f.app.triggerAutoDialPreset(f.presets[0]);
      else f.app.handleManualCarrierSelect(f.presets[0].carriers[0]);
      f.advance(preset ? 450 : 100);
      assert.equal(f.app.state, "VERIFYING");
      f.app.handleDisengage(); f.advance(8250); idle(f);
    }
  });
  test("cancelled queued callbacks cannot mutate a replacement preset", () => {
    const f = fixture();
    for (const wait of [0, 24, 249, 300, 450]) {
      f.app.triggerAutoDialPreset(f.presets[0]); f.advance(wait);
      const stale = [...f.timers.values()].map(timer => timer.fn);
      f.app.handleDisengage();
      f.app.triggerAutoDialPreset(f.presets[1]);
      for (const callback of stale) callback();
      assert.equal(f.app.isAutoDialing, true);
      f.advance(4000);
      assert.equal(f.app.state, "PENDING");
      assert.deepEqual(Array.from(f.app.lockedCarriers), Array.from(f.presets[1].carriers));
      f.app.handleDisengage(); f.advance(8250); idle(f);
    }
  });
  test("normal paced seven-carrier dialing and activation stages remain intact", () => {
    const f = fixture();
    f.app.triggerAutoDialPreset(f.presets[0]);
    f.advance(249); assert.equal(f.app.lockedCarriers.length, 0);
    f.advance(1); assert.equal(f.app.lockedCarriers.length, 1);
    f.advance(120); assert.equal(f.app.state, "VERIFYING");
    f.advance(4000);
    assert.equal(f.app.state, "PENDING");
    assert.deepEqual(Array.from(f.app.lockedCarriers), Array.from(f.presets[0].carriers));
    f.app.handleEngageClick(); assert.equal(f.app.state, "BUILDUP");
    f.advance(1999); assert.equal(f.app.state, "BUILDUP");
    f.advance(1); assert.equal(f.app.state, "BREAKTHROUGH");
    f.advance(1400); assert.equal(f.app.state, "ACTIVE");
    f.app.handleDisengage(); f.advance(8250); idle(f);
  });
}

