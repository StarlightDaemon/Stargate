/* Heliacal Ring — dialing sequencer.
   The state machine that owns the whole gate lifecycle:

     idle → dialing (7 rotate/lock cycles) → resolve → surge → active → closing → idle
                          ↘ abort / fault ↙

   plus unscheduled inbound breaches, probe launches and conduit stability.
   UI subscribes through a tiny event emitter so this module never touches
   the DOM directly. */

window.HG = window.HG || {};

HG.sequencer = (function () {
  "use strict";

  const { DESTINATIONS, GLYPH_NAMES, ORIGIN } = HG.data;

  // lock order for the nine lugs: sides alternate inward, primary (top) last
  const LOCK_ORDER = [1, 8, 2, 7, 3, 6, 0];
  const BONUS_LOCKS = [4, 5];

  const STABILITY_SECONDS = 150;   // full drain time for an open conduit
  const PROBE_COST = 18;
  const INBOUND_OPEN_SECONDS = 22;

  let state = "idle";              // idle | dialing | resolving | active | closing | inbound
  let abortRequested = false;
  let activeDest = null;           // destination record, or null for inbound
  let inbound = false;
  let stability = 0;
  let elapsed = 0;
  let probeCount = 0;
  let inboundTimer = 0;

  /* ---- events ---------------------------------------------------------------- */

  const listeners = {};
  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
  function emit(evt, ...args) {
    (listeners[evt] || []).forEach(fn => fn(...args));
  }
  function log(msg, cls)   { emit("log", msg, cls || ""); }
  function caption(text)   { emit("caption", text); }
  function setState(s) {
    state = s;
    emit("state", s, { inbound, dest: activeDest });
  }

  /* ---- helpers ----------------------------------------------------------------- */

  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  function checkAbort() { if (abortRequested) throw new Error("aborted"); }

  function matchDestination(address) {
    if (address[6] !== ORIGIN) return null;
    const six = address.slice(0, 6).join(",");
    return DESTINATIONS.find(d => d.address.join(",") === six) || null;
  }

  /* ---- outgoing dial -------------------------------------------------------------- */

  async function dial(address) {
    if (state !== "idle") return;
    if (address.length !== 7) return;

    if (HG.gate.isIrisClosed() || HG.gate.isIrisMoving()) {
      log("Dial refused — aperture shield is sealed. Retract the shield first.", "warn");
      HG.audio.uiDeny();
      return;
    }

    abortRequested = false;
    setState("dialing");
    log(`Outbound dial initiated — seven-glyph address accepted.`, "info");

    try {
      for (let n = 0; n < 7; n++) {
        const gi = address[n];
        caption(`ROTATING RING — GLYPH “${GLYPH_NAMES[gi].toUpperCase()}”`);
        await HG.gate.rotateToGlyph(gi, n);
        checkAbort();

        caption(`ENGAGING LOCK ${n + 1} OF 7`);
        await HG.gate.engageChevron(LOCK_ORDER[n], false);
        HG.gate.setGlyphLit(gi, true);
        log(`Lock ${n + 1} engaged — glyph “${GLYPH_NAMES[gi]}” encoded.`, "info");
        checkAbort();
        await wait(240);
        checkAbort();
      }

      setState("resolving");
      caption("ALL LOCKS ENGAGED — RESOLVING DESTINATION VECTOR…");
      await wait(1000);
      checkAbort();

      const dest = matchDestination(address);
      if (!dest) {
        failSequence();
        return;
      }

      for (const k of BONUS_LOCKS) {
        await HG.gate.engageChevron(k, false);
      }
      activate(dest);

    } catch (e) {
      if (e.message === "aborted") handleAbort();
      else throw e;
    }
  }

  function failSequence() {
    log("SEQUENCE FAULT — vector unresolved. No conduit at those coordinates.", "danger");
    caption("DIAL FAILED — COORDINATES UNRESOLVED");
    HG.audio.dialFail();
    HG.gate.chevronsFlicker();
    HG.gate.clearGlyphLights();
    setState("closing");
    setTimeout(async () => {
      await HG.gate.resetRing();
      caption("RING IDLE — AWAITING COORDINATES");
      setState("idle");
    }, 900);
  }

  function handleAbort() {
    log("Dial sequence aborted by operator. Ring spinning down.", "warn");
    caption("DIAL ABORTED — SPINNING DOWN");
    HG.gate.releaseChevrons();
    HG.gate.clearGlyphLights();
    setState("closing");
    HG.gate.resetRing().then(() => {
      caption("RING IDLE — AWAITING COORDINATES");
      setState("idle");
    });
  }

  function abort() {
    if (state === "dialing" || state === "resolving") {
      abortRequested = true;
      HG.gate.cancelMotion(); // if mid-rotation this rejects immediately
    }
  }

  /* ---- activation / active conduit --------------------------------------------------- */

  function activate(dest) {
    activeDest = dest;
    inbound = false;
    stability = 100;
    elapsed = 0;
    probeCount = 0;

    HG.portal.setDestination(dest.hue, false);
    caption("⚠ BREACH SURGE — STAND CLEAR OF THE RING");
    log(`Seventh lock resolved — breach surge forming.`, "good");
    emit("flash");
    HG.audio.surge();
    HG.portal.surgeStart();

    setTimeout(() => {
      if (activeDest !== dest) return; // shut down mid-surge
      HG.audio.portalStart(false);
      HG.audio.portalMuffle(HG.gate.isIrisClosed());
      setState("active");
      caption(`CONDUIT OPEN — ${dest.name}`);
      log(`Conduit established → ${dest.name}. ${dest.desc}`, "good");
      emit("visited", dest.id);
    }, 1900);

    setState("active"); // state is active from surge onward; caption tracks phase
  }

  function shutdown(reason) {
    if (state !== "active" && state !== "inbound") return;
    const wasInbound = inbound;
    setState("closing");
    caption("DISENGAGING CONDUIT…");
    if (reason) log(reason, "warn");
    HG.audio.portalStop();
    HG.audio.collapse();
    HG.portal.collapseThen(() => {
      HG.gate.releaseChevrons();
      HG.gate.clearGlyphLights();
      activeDest = null;
      inbound = false;
      caption("RING IDLE — AWAITING COORDINATES");
      log(wasInbound ? "Inbound conduit collapsed. Ring secure." : "Conduit disengaged. Ring secure.", "info");
      setState("idle");
    });
  }

  /* ---- survey probes ------------------------------------------------------------------- */

  function probe() {
    if (state !== "active" || inbound || !activeDest) return;
    if (HG.gate.isIrisClosed() || HG.gate.isIrisMoving()) {
      log("Probe launch refused — aperture shield is in the flight path.", "warn");
      HG.audio.uiDeny();
      return;
    }
    if (HG.portal.currentMode() !== "open") return; // still surging

    const dest = activeDest;
    probeCount++;
    stability = Math.max(0, stability - PROBE_COST);
    emit("probe", probeCount);
    log(`Survey probe ${probeCount} away — transiting to ${dest.name}.`, "info");
    HG.audio.probeLaunch();

    HG.portal.tunnel(dest.name, dest.hue, () => {
      log(`Probe ${probeCount} arrival confirmed. Telemetry follows:`, "good");
      dest.telemetry.forEach((line, i) => {
        setTimeout(() => {
          if (HG.audio.telemetryTick) HG.audio.telemetryTick();
          log(`  » ${line}`, "info");
        }, 600 + i * 900);
      });
    });
  }

  /* ---- unscheduled inbound breach --------------------------------------------------------- */

  async function inboundBreach() {
    if (state !== "idle") return;

    inbound = true;
    activeDest = null;
    setState("inbound");
    caption("⚠ UNSCHEDULED INBOUND BREACH");
    log("ALERT — unscheduled inbound breach. External locks engaging.", "danger");
    HG.audio.alarm();
    await wait(1400);

    for (let n = 0; n < 7; n++) {
      if (state !== "inbound") return; // operator disengaged mid-lock? not possible, but safe
      await HG.gate.engageChevron(LOCK_ORDER[n], true);
      await wait(160);
    }

    if (HG.gate.isIrisClosed()) {
      // shield holds: the surge blooms against it and dissipates
      log("Breach bloomed against the sealed aperture shield.", "warn");
      caption("SHIELD HOLDING — BREACH CONTAINED");
      for (let i = 0; i < 3; i++) {
        setTimeout(() => HG.audio.irisThud(), 500 + i * 900);
      }
      await wait(4200);
      HG.gate.releaseChevrons();
      log("Inbound breach repelled. No intrusion.", "good");
      caption("RING IDLE — AWAITING COORDINATES");
      inbound = false;
      setState("idle");
      return;
    }

    HG.portal.setDestination(358, true);
    emit("flash");
    HG.audio.surge();
    HG.portal.surgeStart();
    caption("⚠ INBOUND CONDUIT OPEN — ORIGIN UNREGISTERED");
    log("Inbound conduit open. Origin does not match any archive entry.", "danger");
    inboundTimer = INBOUND_OPEN_SECONDS;

    setTimeout(() => {
      if (state === "inbound") {
        HG.audio.portalStart(true);
        HG.audio.portalMuffle(HG.gate.isIrisClosed());
        log("Nothing has come through. Signal reads like… an echo.", "warn");
      }
    }, 1900);
  }

  /* ---- frame tick ---------------------------------------------------------------------------- */

  let lastTickAt = performance.now();
  function tick() {
    // real elapsed time, so throttled frames don't slow the drain
    const now = performance.now();
    const dt = Math.min(2, (now - lastTickAt) / 1000);
    lastTickAt = now;

    if (state === "active" && !inbound) {
      elapsed += dt;
      stability = Math.max(0, stability - dt * (100 / STABILITY_SECONDS));
      emit("stability", stability, elapsed);
      if (stability <= 0) {
        shutdown("Conduit stability exhausted — emergency disengage.");
      }
    } else if (state === "inbound") {
      inboundTimer -= dt;
      emit("stability", Math.max(0, (inboundTimer / INBOUND_OPEN_SECONDS) * 100), 0);
      if (inboundTimer <= 0 && HG.portal.currentMode() === "open") {
        shutdown("Inbound conduit released from the far side.");
      }
    }
  }

  /* ---- accessors ------------------------------------------------------------------------------- */

  function getState()   { return state; }
  function isInbound()  { return inbound; }
  function getDest()    { return activeDest; }

  return {
    on, dial, abort, shutdown, probe, inboundBreach, tick,
    getState, isInbound, getDest
  };
})();
