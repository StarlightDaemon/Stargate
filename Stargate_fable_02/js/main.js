/* Heliacal Ring — bootstrap and master frame loop. */

(function () {
  "use strict";

  HG.ui.init();

  /* Audio contexts must be created on a user gesture. */
  let interacted = false;
  function firstGesture() {
    interacted = true;
    HG.audio.ensure();
  }
  window.addEventListener("pointerdown", firstGesture, { once: false });
  window.addEventListener("keydown", firstGesture, { once: false });

  /* ---- master loop ------------------------------------------------------- */

  let last = performance.now();
  let lastRaf = performance.now();

  function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    HG.starfield.tick(dt);
    HG.gate.tick(dt);
    HG.portal.render(dt);
    HG.sequencer.tick(dt);
  }

  function frame(now) {
    lastRaf = now;
    step(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Browsers suspend requestAnimationFrame in hidden/occluded tabs, which
  // would freeze a dial sequence mid-lock. A timer watchdog keeps the
  // simulation stepping whenever rAF stalls; rAF takes over again when the
  // page becomes visible.
  setInterval(() => {
    const now = performance.now();
    if (now - lastRaf > 300) step(now);
  }, 33);

  /* ---- document title follows gate state ---------------------------------- */

  HG.sequencer.on("state", (s) => {
    document.title =
      s === "active"  ? "● CONDUIT OPEN — Heliacal Ring" :
      s === "inbound" ? "⚠ INBOUND — Heliacal Ring" :
      s === "dialing" ? "… DIALING — Heliacal Ring" :
                        "Heliacal Ring — Gate Command";
  });

  /* ---- ambient life ---------------------------------------------------------- */

  const CHATTER = [
    "Station sweep complete — corridor sensors quiet.",
    "Ring capacitors trickle-charging from the solar array.",
    "Deep-space relay pinged the beacon net. All quiet.",
    "Maintenance note: lug 4 servo grease at 61%. Within tolerance.",
    "Long-range array recalibrated against the Ymbral cluster.",
    "Night cycle lighting engaged in the gate hall.",
    "Archive checksum verified — 8 destination vectors on file."
  ];
  let chatterIdx = Math.floor(Math.random() * CHATTER.length);

  setInterval(() => {
    if (HG.sequencer.getState() === "idle" && Math.random() < 0.55) {
      chatterIdx = (chatterIdx + 1 + Math.floor(Math.random() * 3)) % CHATTER.length;
      HG.ui.log(CHATTER[chatterIdx], "");
    }
  }, 45000);

  /* ---- unscheduled inbound breaches --------------------------------------------- */

  const staged = new URLSearchParams(location.search).has("vis");

  let lastInbound = performance.now();
  setInterval(() => {
    const idleFor = performance.now() - lastInbound;
    if (
      interacted && !staged &&
      HG.sequencer.getState() === "idle" &&
      idleFor > 150000 &&           // at least 2.5 min between events
      Math.random() < 0.30
    ) {
      lastInbound = performance.now();
      HG.sequencer.inboundBreach();
    }
  }, 30000);
  HG.sequencer.on("state", (s) => {
    if (s !== "idle") lastInbound = performance.now();
  });

  window.addEventListener("resize", () => HG.portal.resize());

  /* ---- deep links -----------------------------------------------------------
     ?dial=<destId>            auto-dial an archive destination on load
     ?vis=open|surge&dest=<id> jump straight to a visual state (gallery/testing)
     ?vis=iris                 sealed aperture shield */

  const q = new URLSearchParams(location.search);

  if (q.has("dial")) {
    const d = HG.data.DESTINATIONS.find(x => x.id === q.get("dial"));
    if (d) {
      setTimeout(() => {
        HG.ui.log(`Deep-link dial — ${d.name}.`, "info");
        HG.sequencer.dial([...d.address, HG.data.ORIGIN]);
      }, 700);
    }
  }

  const vis = q.get("vis");
  if (vis) {
    const d = HG.data.DESTINATIONS.find(x => x.id === q.get("dest")) ||
              HG.data.DESTINATIONS[0];
    if (vis === "open" || vis === "surge") {
      HG.portal.setDestination(d.hue, false);
      HG.gate.debugLockAll(false);
      document.body.dataset.state = "active";
      if (vis === "open") HG.portal.openNow();
      else HG.portal.surgeStart();
    } else if (vis === "iris") {
      HG.gate.debugIris(1);
    }
  }
})();
