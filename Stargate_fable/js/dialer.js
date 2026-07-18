// ============================================================
// dialer.js — the dialing state machine.
// States: idle -> dialing -> igniting -> active -> sealing -> idle
// The dialer owns sequencing; gate/audio/ui are driven through
// callbacks so this module stays free of DOM knowledge.
// ============================================================

import { LOCK_ORDER } from "./gate.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Wait on simulation state rather than wall-clock, so sequencing stays
// correct even when background-tab throttling slows the animation clock.
const waitFor = (pred) => new Promise((r) => {
  const iv = setInterval(() => { if (pred()) { clearInterval(iv); r(); } }, 50);
});

export const STABILITY_SECONDS = 150;

export class Dialer {
  /**
   * @param {import('./gate.js').Gate} gate
   * @param {import('./audio.js').AudioEngine} sfx
   * @param {object} ui  callbacks: onState(state), onSlot(i, phase),
   *                     onLog(msg, cls), onStability(frac, secs)
   */
  constructor(gate, sfx, ui) {
    this.gate = gate;
    this.sfx = sfx;
    this.ui = ui;
    this.state = "idle";
    this.address = [];
    this.destName = null;
    this.stability = 0;
    this._run = 0; // cancellation token
  }

  _setState(s) {
    this.state = s;
    this.ui.onState(s);
  }

  canEdit() { return this.state === "idle"; }

  queueSymbol(i) {
    if (!this.canEdit() || this.address.length >= 7 || this.address.includes(i)) return false;
    this.address.push(i);
    this.destName = null;
    this.ui.onSlot(this.address.length - 1, "filled", i);
    this.sfx.click();
    return true;
  }

  setAddress(addr, name = null) {
    if (!this.canEdit()) return false;
    this.address = addr.slice(0, 7);
    this.destName = name;
    this.ui.onAddressReplaced(this.address);
    this.sfx.click();
    return true;
  }

  clear() {
    if (!this.canEdit()) return;
    this.address = [];
    this.destName = null;
    this.ui.onAddressReplaced([]);
    this.sfx.click();
  }

  async engage() {
    if (this.state !== "idle" || this.address.length !== 7) return;
    const run = ++this._run;
    this._setState("dialing");
    this.ui.onLog(`Dial sequence initiated — ${this.destName ?? "MANUAL ADDRESS"}`, "warn");

    for (let k = 0; k < 7; k++) {
      if (run !== this._run) return;
      const sym = this.address[k];
      this.ui.onSlot(k, "current");
      this.sfx.spinStart();
      const done = await this.gate.rotateToSymbol(sym, k % 2 === 0 ? 1 : -1);
      this.sfx.spinStop();
      if (run !== this._run || !done) return;

      this.gate.pressApex();
      await sleep(160);
      if (run !== this._run) return;
      this.sfx.clunk();
      this.sfx.chime(k);
      this.gate.setLock(LOCK_ORDER[k], true, "amber");
      this.gate.markSymbolLocked(sym);
      this.ui.onSlot(k, "locked");
      this.ui.onLog(`Sigil ${k + 1} of 7 acquired — clamp ${LOCK_ORDER[k]} seated`, "");
      await sleep(420);
      if (run !== this._run) return;
    }

    // keystone confirmation + ignition
    this.ui.onLog("All clamps seated. Charging conduit…", "warn");
    this.gate.setLock(0, true, "amber");
    this.sfx.clunk();
    await sleep(700);
    if (run !== this._run) return;

    this._setState("igniting");
    this.ui.onLog("CONDUIT IGNITION — stand clear of the aperture", "bad");
    this.sfx.burst();
    this.gate.startBurst();
    await waitFor(() => this.gate.burstT >= 1.72 || run !== this._run);
    if (run !== this._run) return;

    this.gate.setActive();
    this.gate.setAllLockLights("cyan");
    this.sfx.horizonStart();
    this.stability = STABILITY_SECONDS;
    this._setState("active");
    this.ui.onLog(`Conduit stable. Route open to ${this.destName ?? "unregistered coordinates"}.`, "ok");
  }

  abort() {
    if (this.state !== "dialing") return;
    this._run++;
    this.sfx.spinStop();
    this.sfx.fail();
    this.gate.cancelRotation();
    this._releaseClamps();
    this.gate.resetToIdle();
    this.ui.onAddressReplaced(this.address); // back to "filled" chips
    this._setState("idle");
    this.ui.onLog("Dial sequence aborted — clamps released", "bad");
  }

  async shutdown(reason = "operator command") {
    if (this.state !== "active") return;
    const run = ++this._run;
    this._setState("sealing");
    this.ui.onLog(`Sealing ring (${reason})…`, "warn");
    this.sfx.horizonStop();
    this.sfx.seal();
    this.gate.startCollapse();
    await waitFor(() => this.gate.collapseT >= 1.12 || run !== this._run);
    if (run !== this._run) return;
    this.gate.resetToIdle();
    await this._releaseClampsStaggered(run);
    if (run !== this._run) return;
    this.address = [];
    this.destName = null;
    this.ui.onAddressReplaced([]);
    this._setState("idle");
    this.ui.onLog("Ring sealed. Terminal returned to standby.", "ok");
  }

  _releaseClamps() {
    for (let k = 0; k < 8; k++) this.gate.setLock(k, false, "off");
  }

  async _releaseClampsStaggered(run) {
    for (const k of [...LOCK_ORDER].reverse()) {
      this.gate.setLock(k, false, "off");
      this.sfx.click();
      await sleep(110);
      if (run !== this._run) return;
    }
    this.gate.setLock(0, false, "off");
  }

  // called every frame from the main loop
  tick(dt) {
    if (this.state === "active") {
      this.stability -= dt;
      this.ui.onStability(Math.max(0, this.stability / STABILITY_SECONDS), Math.max(0, this.stability));
      if (this.stability <= 0) this.shutdown("stability exhausted");
    }
  }

  probe() {
    if (this.state !== "active") return false;
    this.sfx.plunge();
    return true;
  }
}
