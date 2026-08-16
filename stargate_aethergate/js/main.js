/* ============================================================
   AETHERGATE — console orchestrator
   State machine: idle -> dialing -> active -> closing -> idle.
   Wires the sigil pad, address slots, charted destinations,
   operations log, stability drain, probe telemetry, keyboard
   shortcuts and ambient idle behavior to the ring + portal.
   ============================================================ */
(function () {
  "use strict";
  const AG = window.AG;

  const ADDRESS_LEN = 7;
  const STABILITY_SECONDS = 46;

  /* ---------- bootstrapping ---------- */

  const sigils = AG.makeSigils(36);
  const audio = new AG.AudioEngine();
  const ring = new AG.Ring(document.getElementById("ring"), sigils, audio);
  const portal = new AG.Portal(document.getElementById("portal"));
  AG.startStarfield(document.getElementById("starfield"));

  const el = {
    body: document.body,
    status: document.getElementById("status-text"),
    slots: document.getElementById("address-slots"),
    pad: document.getElementById("sigil-pad"),
    dests: document.getElementById("destinations"),
    log: document.getElementById("log"),
    flash: document.getElementById("flash"),
    stabilityBar: document.getElementById("stability-bar"),
    stabilityPct: document.getElementById("stability-pct"),
    btnDial: document.getElementById("btn-dial"),
    btnAbort: document.getElementById("btn-abort"),
    btnClose: document.getElementById("btn-close"),
    btnProbe: document.getElementById("btn-probe"),
    btnRandom: document.getElementById("btn-random"),
    btnClear: document.getElementById("btn-clear"),
    btnAudio: document.getElementById("btn-audio"),
    btnHelp: document.getElementById("btn-help"),
    btnHelpClose: document.getElementById("btn-help-close"),
    help: document.getElementById("help"),
    opRefBtn: document.getElementById("op-ref-btn"),
    opRefClose: document.getElementById("op-ref-close"),
    opRef: document.getElementById("op-ref")
  };

  let state = "idle";           // idle | dialing | active | closing
  let address = [];             // sigil indices, up to 7
  let lockedCount = 0;
  let abortRequested = false;
  let stability = 0;
  let stabilityTimer = null;
  let currentDest = null;       // matched charted destination, if any
  let lastInteraction = performance.now();

  /* ---------- fictional destinations ---------- */

  const DESTINATIONS = [
    { name: "Kel Sharan",   addr: [3, 11, 19, 27, 33, 7, 14],  blurb: "ocean world · twin moons · calm lane" },
    { name: "Vessary Deep", addr: [30, 2, 24, 9, 16, 21, 5],   blurb: "subsurface archive · low light · dry air" },
    { name: "Auric Halo",   addr: [12, 28, 1, 35, 18, 6, 23],  blurb: "orbital ring station · dock 9 cleared" },
    { name: "Thornwake",    addr: [8, 25, 15, 0, 31, 20, 4],   blurb: "jungle relay · heavy spore season" },
    { name: "Null Meridian", addr: [34, 10, 26, 17, 2, 29, 13], blurb: "abandoned outpost · lane unstable" }
  ];

  /* ---------- log ---------- */

  function stamp() {
    const d = new Date();
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map(n => String(n).padStart(2, "0")).join(":");
  }

  function log(msg, cls) {
    const p = document.createElement("p");
    if (cls) p.className = cls;
    const ts = document.createElement("span");
    ts.className = "ts";
    ts.textContent = stamp();
    p.appendChild(ts);
    p.appendChild(document.createTextNode(msg));
    el.log.appendChild(p);
    while (el.log.childElementCount > 120) el.log.firstElementChild.remove();
    el.log.scrollTop = el.log.scrollHeight;
  }

  /* ---------- UI construction ---------- */

  function buildSlots() {
    el.slots.innerHTML = "";
    for (let i = 0; i < ADDRESS_LEN; i++) {
      const s = document.createElement("div");
      s.className = "slot";
      s.innerHTML = `<span class="slot-num">${i + 1}</span>`;
      el.slots.appendChild(s);
    }
  }

  function renderSlots() {
    Array.from(el.slots.children).forEach((s, i) => {
      const idx = address[i];
      s.classList.toggle("filled", idx !== undefined);
      s.classList.toggle("locked", i < lockedCount);
      const num = `<span class="slot-num">${i + 1}</span>`;
      s.innerHTML = (idx !== undefined)
        ? AG.sigilSVG(sigils[idx]) + num
        : num;
    });
    Array.from(el.pad.children).forEach((k, i) => {
      k.classList.toggle("picked", address.includes(i));
    });
  }

  function buildPad() {
    sigils.forEach((s, i) => {
      const b = document.createElement("button");
      b.className = "pad-key";
      b.title = `Sigil of ${s.name}`;
      b.setAttribute("aria-label", `Sigil of ${s.name}`);
      b.innerHTML = AG.sigilSVG(s);
      b.addEventListener("click", () => onPadKey(i));
      el.pad.appendChild(b);
    });
  }

  function buildDestinations() {
    DESTINATIONS.forEach(d => {
      const b = document.createElement("button");
      b.className = "dest";
      b.innerHTML =
        `<span class="dest-name">${d.name}</span>` +
        `<span class="dest-blurb">${d.blurb}</span>`;
      b.addEventListener("click", () => {
        if (state !== "idle") return;
        touch();
        address = d.addr.slice();
        audio.blip();
        renderSlots();
        log(`Charted coordinates loaded: ${d.name}.`, "sys");
      });
      el.dests.appendChild(b);
    });
  }

  /* ---------- state plumbing ---------- */

  function setState(next, statusText) {
    state = next;
    el.body.dataset.state = next;
    el.status.textContent = statusText;
    const idle = next === "idle";
    const dialing = next === "dialing";
    const active = next === "active";
    el.btnDial.hidden = !idle;
    el.btnAbort.hidden = !dialing;
    el.btnClose.hidden = !active;
    el.btnProbe.hidden = !active;
    el.btnRandom.disabled = !idle;
    el.btnClear.disabled = !idle;
    Array.from(el.pad.children).forEach(k => (k.disabled = !idle));
    Array.from(el.dests.children).forEach(k => (k.disabled = !idle));
  }

  function touch() { lastInteraction = performance.now(); }

  /* ---------- interactions ---------- */

  function onPadKey(i) {
    if (state !== "idle") return;
    touch();
    const pos = address.indexOf(i);
    if (pos !== -1) {                       // tap again to remove
      address.splice(pos, 1);
      audio.blip();
    } else if (address.length >= ADDRESS_LEN) {
      audio.uiDeny();
      log("Sequence buffer full — seven sigils maximum.", "dim");
      return;
    } else {
      address.push(i);
      audio.blip();
      log(`Sigil of ${sigils[i].name} queued (${address.length}/${ADDRESS_LEN}).`);
    }
    renderSlots();
  }

  function randomAddress() {
    if (state !== "idle") return;
    touch();
    const pool = sigils.map((_, i) => i);
    address = [];
    for (let i = 0; i < ADDRESS_LEN; i++) {
      address.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    audio.blip();
    renderSlots();
    log("Navigation computer drafted random coordinates.", "sys");
  }

  function clearAddress() {
    if (state !== "idle") return;
    touch();
    address = [];
    lockedCount = 0;
    audio.blip();
    renderSlots();
    log("Sequence buffer cleared.");
  }

  /* ---------- the dialing sequence ---------- */

  async function dial() {
    if (state !== "idle") return;
    touch();
    if (address.length !== ADDRESS_LEN) {
      audio.uiDeny();
      log(`Cannot engage — sequence incomplete (${address.length}/${ADDRESS_LEN}).`, "bad");
      return;
    }
    abortRequested = false;
    lockedCount = 0;
    currentDest = DESTINATIONS.find(d =>
      d.addr.length === address.length && d.addr.every((v, i) => v === address[i])
    ) || null;

    setState("dialing", "DIALING — TRACK LIVE");
    log("Ring energized. Beginning encode sequence.", "sys");

    for (let k = 0; k < ADDRESS_LEN; k++) {
      const idx = address[k];
      el.status.textContent = `DIALING — ENCODING ${k + 1} OF ${ADDRESS_LEN}`;
      const spin = await ring.spinTo(idx, k);
      if (abortRequested || spin.aborted) return dialAborted();
      await ring.engageSeal(k, idx);
      if (abortRequested) return dialAborted();
      lockedCount = k + 1;
      renderSlots();
      log(`Seal ${k + 1} engaged — sigil of ${sigils[idx].name} locked.`, "lock");
    }

    log("All route seals engaged. Arming prime seal.", "sys");
    el.status.textContent = "SEQUENCE LOCKED — ARMING PRIME SEAL";
    await wait(500);
    if (abortRequested) return dialAborted();
    await ring.engagePrime();
    log("PRIME SEAL ENGAGED. Stand clear of the vestibule.", "lock");
    await wait(350);
    if (abortRequested) return dialAborted();
    await activate();
  }

  function dialAborted() {
    ring.cancel();
    ring.releaseAll();
    audio.fail();
    lockedCount = 0;
    renderSlots();
    setState("idle", "IDLE — DIAL ABORTED");
    log("Dial aborted. Seals released, track spun down.", "bad");
  }

  async function activate() {
    el.status.textContent = "APERTURE FORMING";
    el.btnAbort.hidden = true;   // past the point of no return
    audio.burst();
    el.flash.classList.remove("go");
    void el.flash.offsetWidth;
    el.flash.classList.add("go");
    el.body.classList.add("shake");
    setTimeout(() => el.body.classList.remove("shake"), 600);
    log("Aperture breach — energy surge past the threshold!", "sys");

    await portal.open();

    setState("active", "PORTAL ACTIVE — LANE OPEN");
    audio.startHum();
    const destName = currentDest ? currentDest.name : "uncharted coordinates";
    log(`Event horizon stable. Transit lane open to ${destName}.`, "good");
    startStability();
  }

  /* ---------- stability drain ---------- */

  function startStability() {
    stability = 100;
    let warned75 = false, warned40 = false, warned15 = false;
    updateStabilityUI();
    const unstable = currentDest && currentDest.name === "Null Meridian";
    const totalMs = STABILITY_SECONDS * (unstable ? 0.55 : 1) * 1000;
    const openedAt = performance.now();
    if (unstable) log("Warning: this lane is charted UNSTABLE. Expect rapid decay.", "bad");
    // time-based, not tick-based, so background-tab timer throttling
    // cannot slow the drain
    stabilityTimer = setInterval(() => {
      const elapsed = performance.now() - openedAt;
      const wobble = Math.sin(elapsed / 310) * 1.2;
      stability = Math.max(0, Math.min(100, 100 * (1 - elapsed / totalMs) + wobble));
      updateStabilityUI();
      if (stability < 75 && !warned75) { warned75 = true; log("Aperture stability below 75%."); }
      if (stability < 40 && !warned40) { warned40 = true; log("Stability 40% — recommend concluding transit.", "lock"); }
      if (stability < 15 && !warned15) { warned15 = true; log("STABILITY CRITICAL — emergency seal imminent.", "bad"); }
      if (stability <= 0) {
        log("Aperture destabilized. Executing emergency seal.", "bad");
        closeGate(true);
      }
    }, 250);
  }

  function stopStability() {
    clearInterval(stabilityTimer);
    stabilityTimer = null;
  }

  function updateStabilityUI() {
    const pct = state === "active" || state === "closing" ? stability : 0;
    el.stabilityBar.style.width = pct + "%";
    el.stabilityBar.classList.toggle("warn", pct < 40 && pct >= 15);
    el.stabilityBar.classList.toggle("crit", pct < 15);
    el.stabilityPct.textContent =
      (state === "active") ? Math.round(pct) + "%" : "—";
  }

  /* ---------- shutdown ---------- */

  async function closeGate(emergency) {
    if (state !== "active") return;
    touch();
    stopStability();
    setState("closing", emergency ? "EMERGENCY SEAL IN PROGRESS" : "SEALING PORTAL");
    audio.stopHum(emergency);
    audio.shutdown();
    log(emergency ? "Collapsing the lane…" : "Disengaging transit lane…", "sys");

    await portal.close();

    ring.releaseAll();
    lockedCount = 0;
    address = [];
    currentDest = null;
    renderSlots();
    updateStabilityUI();
    setState("idle", "IDLE — RING COLD");
    log("Portal sealed. Seals retracted. Ring is cold.", "good");
  }

  /* ---------- probe telemetry ---------- */

  const ATMOS = ["nitrogen-argon, breathable", "thin CO2, suit required",
    "dense methane haze", "oxygen-rich, humid", "trace vapor, near-vacuum"];
  const TERRAIN = ["black-sand littoral", "fungal canopy", "glassy impact plain",
    "terraced ruins", "ice shelves over dark water", "basalt spires"];
  const NOTES = ["no artificial signals", "weak beacon on old survey band",
    "seismic murmurs within tolerance", "bioluminescent flora detected",
    "automated dock answering hails", "wind shear above safe margins"];

  function launchProbe() {
    if (state !== "active") return;
    touch();
    audio.probe();
    portal.pulse();
    log("Probe away — crossing the horizon.", "sys");
    const seed = address.reduce((a, b) => a * 37 + b + 1, 17) >>> 0;
    const rng = AG.mulberry32(seed + Math.floor(stability));
    const g = (0.4 + rng() * 1.4).toFixed(2);
    const t = Math.round(-60 + rng() * 110);
    setTimeout(() => {
      log(`Telemetry — gravity ${g} g · surface ${t}°C · ${ATMOS[Math.floor(rng() * ATMOS.length)]}.`);
      log(`Survey — ${TERRAIN[Math.floor(rng() * TERRAIN.length)]}; ${NOTES[Math.floor(rng() * NOTES.length)]}.`);
    }, 1100);
  }

  /* ---------- ambient idle behavior ---------- */

  const AMBIENT = [
    "Coolant loop nominal. Ring standing by.",
    "Star tracker recalibrated against local drift.",
    "Capacitor banks holding at 98% charge.",
    "Dust shielding cycled. Vestibule clear.",
    "Long-range survey queue empty. Awaiting coordinates."
  ];

  setInterval(() => {
    if (state !== "idle" || document.hidden) return;
    if (performance.now() - lastInteraction < 18000) return;
    if (Math.random() < 0.5) {
      ring.sheen();
    } else {
      log(AMBIENT[Math.floor(Math.random() * AMBIENT.length)], "dim");
    }
    lastInteraction = performance.now() - 6000;  // space the ambience out
  }, 9000);

  /* ---------- top-level controls ---------- */

  el.btnDial.addEventListener("click", dial);
  el.btnAbort.addEventListener("click", () => {
    if (state !== "dialing") return;
    abortRequested = true;
    ring.cancel();
  });
  el.btnClose.addEventListener("click", () => closeGate(false));
  el.btnProbe.addEventListener("click", launchProbe);
  el.btnRandom.addEventListener("click", randomAddress);
  el.btnClear.addEventListener("click", clearAddress);

  el.btnAudio.addEventListener("click", () => {
    const on = audio.setEnabled(!audio.enabled);
    el.btnAudio.textContent = on ? "SOUND : ON" : "SOUND : OFF";
    el.btnAudio.setAttribute("aria-pressed", String(on));
    if (on) { audio.blip(); log("Acoustic synthesis online.", "sys"); }
    if (on && state === "active") audio.startHum();
  });

  el.btnHelp.addEventListener("click", () => { el.help.hidden = false; });
  el.btnHelpClose.addEventListener("click", () => { el.help.hidden = true; });
  el.help.addEventListener("click", e => { if (e.target === el.help) el.help.hidden = true; });

  function openOpRef() {
    el.opRef.hidden = false;
    el.opRefBtn.setAttribute("aria-expanded", "true");
  }
  function closeOpRef() {
    el.opRef.hidden = true;
    el.opRefBtn.setAttribute("aria-expanded", "false");
  }
  el.opRefBtn.addEventListener("click", openOpRef);
  el.opRefClose.addEventListener("click", closeOpRef);
  el.opRef.addEventListener("click", e => { if (e.target === el.opRef) closeOpRef(); });

  document.addEventListener("keydown", e => {
    if (e.target instanceof HTMLInputElement) return;
    if (!el.opRef.hidden) {
      if (e.key === "Escape") closeOpRef();
      return;
    }
    if (!el.help.hidden) {
      if (e.key === "Escape") el.help.hidden = true;
      return;
    }
    switch (e.key) {
      case "Enter":
        if (state === "idle") { e.preventDefault(); dial(); }
        break;
      case "Escape":
        if (state === "dialing") { abortRequested = true; ring.cancel(); }
        else if (state === "active") closeGate(false);
        break;
      case "r": case "R": randomAddress(); break;
      case "c": case "C": clearAddress(); break;
      case "m": case "M": el.btnAudio.click(); break;
    }
  });

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* ---------- go ---------- */

  buildSlots();
  buildPad();
  buildDestinations();
  renderSlots();
  setState("idle", "IDLE — RING COLD");
  log("AETHERGATE console 7 online. Ring diagnostics green.", "sys");
  log("Compose a seven-sigil sequence, then engage the ring.");

  /* console tinkering handle for the curious */
  window.AETHERGATE = {
    sigils, ring, portal, audio,
    getState: () => state,
    getAddress: () => address.slice()
  };
})();
