/* Heliacal Ring — console UI.
   Builds the glyph keypad, address register, destination archive and event
   log; wires every control and keyboard shortcut to the sequencer. */

window.HG = window.HG || {};

HG.ui = (function () {
  "use strict";

  const { GLYPH_NAMES, DESTINATIONS, ORIGIN } = HG.data;
  const seq = HG.sequencer;

  const $ = (id) => document.getElementById(id);
  const els = {
    slots: $("register-slots"),
    hint: $("register-hint"),
    grid: $("glyph-grid"),
    destList: $("dest-list"),
    log: $("event-log"),
    caption: $("gate-caption"),
    statusText: $("status-text"),
    clock: $("clock"),
    stabilityFill: $("stability-fill"),
    stabilityPct: $("stability-pct"),
    elapsed: $("elapsed"),
    probeCount: $("probe-count"),
    irisState: $("iris-state"),
    flash: $("flash"),
    hotspot: $("portal-hotspot"),
    btnDial: $("btn-dial"), btnAbort: $("btn-abort"),
    btnClear: $("btn-clear"), btnUndo: $("btn-undo"), btnSurvey: $("btn-survey"),
    btnShutdown: $("btn-shutdown"), btnProbe: $("btn-probe"), btnIris: $("btn-iris"),
    btnMute: $("btn-mute"), btnHelp: $("btn-help"), btnHelpClose: $("btn-help-close"),
    helpOverlay: $("help-overlay"),
    btnOpRef: $("btn-op-ref"), btnOpRefClose: $("btn-op-ref-close"),
    opRefOverlay: $("op-ref-overlay")
  };

  let register = [];          // selected glyph indices, max 7
  let lockedRegister = false; // frozen while dialing/active
  let glyphButtons = [];
  let visited = loadVisited();

  /* ---- persistence (local only) --------------------------------------------- */

  function loadVisited() {
    try { return new Set(JSON.parse(localStorage.getItem("hg.visited") || "[]")); }
    catch (e) { return new Set(); }
  }
  function saveVisited() {
    try { localStorage.setItem("hg.visited", JSON.stringify([...visited])); }
    catch (e) { /* private mode — fine */ }
  }

  /* ---- event log --------------------------------------------------------------- */

  function stamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  function log(msg, cls) {
    const row = document.createElement("div");
    row.className = `log-entry ${cls || ""}`;
    const t = document.createElement("span");
    t.className = "log-time";
    t.textContent = stamp();
    row.appendChild(t);
    row.appendChild(document.createTextNode(msg));
    els.log.appendChild(row);
    while (els.log.children.length > 90) els.log.removeChild(els.log.firstChild);
    els.log.scrollTop = els.log.scrollHeight;
  }

  /* ---- address register ----------------------------------------------------------- */

  function renderRegister() {
    els.slots.textContent = "";
    for (let i = 0; i < 7; i++) {
      const slot = document.createElement("div");
      const gi = register[i];
      if (gi === undefined) {
        slot.className = "slot empty";
      } else {
        slot.className = "slot" + (lockedRegister ? " locked" : "");
        slot.appendChild(HG.glyphs.makeSVG(gi, 10));
        slot.title = GLYPH_NAMES[gi];
      }
      const num = document.createElement("span");
      num.className = "slot-num";
      num.textContent = i + 1;
      slot.appendChild(num);
      els.slots.appendChild(slot);
    }

    const n = register.length;
    if (lockedRegister) {
      els.hint.textContent = "REGISTER LOCKED — SEQUENCE IN PROGRESS";
    } else if (n === 0) {
      els.hint.textContent = "Select six glyphs, then the ◈ Solyn origin glyph — or pick an archive entry.";
    } else if (n < 6) {
      els.hint.textContent = `${n} of 7 — ${6 - n} destination glyph${6 - n === 1 ? "" : "s"} remaining.`;
    } else if (n === 6) {
      els.hint.textContent = "Six encoded. Add the ◈ Solyn origin glyph to complete the address.";
    } else {
      els.hint.textContent = "Address complete. Initiate dial when ready.";
    }

    glyphButtons.forEach((b, gi) => {
      b.classList.toggle("selected", register.includes(gi));
    });
    refreshControls();
  }

  function pushGlyph(gi) {
    if (lockedRegister || register.length >= 7 || register.includes(gi)) {
      HG.audio.uiDeny();
      return;
    }
    // slot 7 is reserved for the origin glyph; origin only fits there
    if (gi === ORIGIN && register.length !== 6) {
      log("The Solyn origin glyph seals an address — it takes the seventh slot.", "warn");
      HG.audio.uiDeny();
      return;
    }
    if (gi !== ORIGIN && register.length === 6) {
      log("Seventh slot expects the ◈ Solyn origin glyph.", "warn");
      HG.audio.uiDeny();
      return;
    }
    register.push(gi);
    HG.audio.uiClick();
    renderRegister();
  }

  function popGlyph() {
    if (lockedRegister || register.length === 0) return;
    register.pop();
    HG.audio.uiClick();
    renderRegister();
  }

  function clearRegister() {
    if (lockedRegister) return;
    register = [];
    HG.audio.uiClick();
    renderRegister();
  }

  function setRegister(addr6) {
    if (lockedRegister) return;
    register = [...addr6, ORIGIN];
    renderRegister();
  }

  /* ---- glyph keypad --------------------------------------------------------------- */

  function buildGrid() {
    for (let gi = 0; gi < GLYPH_NAMES.length; gi++) {
      const b = document.createElement("button");
      b.className = "glyph-btn" + (gi === ORIGIN ? " origin" : "");
      b.title = GLYPH_NAMES[gi] + (gi === ORIGIN ? " — point of origin" : "");
      b.setAttribute("aria-label", `Glyph ${GLYPH_NAMES[gi]}`);
      b.appendChild(HG.glyphs.makeSVG(gi, 9));
      b.addEventListener("click", () => pushGlyph(gi));
      els.grid.appendChild(b);
      glyphButtons.push(b);
    }
  }

  /* ---- destination archive ----------------------------------------------------------- */

  function buildArchive() {
    for (const d of DESTINATIONS) {
      const li = document.createElement("li");
      li.className = "dest";
      li.dataset.id = d.id;
      li.setAttribute("role", "button");
      li.tabIndex = 0;
      li.setAttribute("aria-label", `Load address for ${d.name}`);
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); li.click(); }
      });

      const sw = document.createElement("span");
      sw.className = "dest-swatch";
      sw.style.color = `hsl(${d.hue}, 85%, 60%)`;
      sw.style.background = `hsl(${d.hue}, 85%, 60%)`;

      const info = document.createElement("span");
      info.className = "dest-info";
      const name = document.createElement("span");
      name.className = "dest-name";
      name.textContent = d.name;
      const desc = document.createElement("span");
      desc.className = "dest-desc";
      desc.textContent = d.desc;
      info.appendChild(name);
      info.appendChild(desc);

      li.appendChild(sw);
      li.appendChild(info);

      if (visited.has(d.id)) li.appendChild(makeBadge());

      li.addEventListener("click", () => {
        if (lockedRegister) { HG.audio.uiDeny(); return; }
        HG.audio.uiClick();
        setRegister(d.address);
        log(`Archive address loaded — ${d.name}.`, "info");
      });

      els.destList.appendChild(li);
    }
  }

  function makeBadge() {
    const b = document.createElement("span");
    b.className = "dest-badge";
    b.textContent = "VISITED";
    return b;
  }

  function markVisited(id) {
    if (visited.has(id)) return;
    visited.add(id);
    saveVisited();
    const li = els.destList.querySelector(`[data-id="${id}"]`);
    if (li && !li.querySelector(".dest-badge")) li.appendChild(makeBadge());
  }

  /* ---- controls state --------------------------------------------------------------------- */

  function refreshControls() {
    const st = seq.getState();
    const idle = st === "idle";
    const dialing = st === "dialing" || st === "resolving";
    const active = st === "active";
    const inbound = st === "inbound";

    lockedRegister = !idle;

    els.btnDial.disabled = !(idle && register.length === 7);
    els.btnAbort.disabled = !dialing;
    els.btnClear.disabled = !idle || register.length === 0;
    els.btnUndo.disabled = !idle || register.length === 0;
    els.btnSurvey.disabled = !idle;
    els.btnShutdown.disabled = !(active || inbound);
    els.btnProbe.disabled = !(active && !seq.isInbound());
    els.hotspot.hidden = !(active && !seq.isInbound());

    document.body.dataset.state =
      inbound ? "incoming" : active ? "active" : dialing ? "dialing" : "idle";
    els.statusText.textContent =
      inbound ? "INBOUND BREACH" :
      active ? (seq.isInbound() ? "INBOUND" : "CONDUIT OPEN") :
      dialing ? "DIALING" :
      st === "closing" ? "SECURING" : "STANDBY";

    if (!active && !inbound) {
      els.stabilityFill.style.width = "0%";
      els.stabilityPct.textContent = "—";
      els.elapsed.textContent = "—";
    }
  }

  /* ---- wiring --------------------------------------------------------------------------------- */

  function surveyDial() {
    if (lockedRegister) return;
    const pool = [];
    for (let i = 1; i < GLYPH_NAMES.length; i++) pool.push(i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setRegister(pool.slice(0, 6));
    HG.audio.uiClick();
    log("Survey coordinates generated — vector unverified. Dial at your own risk.", "warn");
  }

  function randomArchiveDial() {
    if (seq.getState() !== "idle") return;
    const d = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];
    setRegister(d.address);
    log(`Random archive draw — ${d.name}.`, "info");
    seq.dial([...register]);
  }

  function toggleIris() {
    if (HG.gate.isIrisMoving()) return;
    const closing = !HG.gate.isIrisClosed();
    els.irisState.textContent = closing ? "SEALING…" : "OPENING…";
    log(closing ? "Aperture shield closing." : "Aperture shield retracting.", "info");
    HG.audio.portalMuffle(closing);
    HG.gate.setIris(closing).then(() => {
      els.irisState.textContent = closing ? "SEALED" : "OPEN";
      log(closing ? "Aperture shield sealed." : "Aperture shield fully retracted.", "info");
    });
  }

  function toggleMute() {
    const next = !HG.audio.isMuted();
    HG.audio.setMuted(next);
    els.btnMute.textContent = next ? "SOUND OFF" : "SOUND ON";
    els.btnMute.setAttribute("aria-pressed", String(!next));
    try { localStorage.setItem("hg.muted", next ? "1" : "0"); } catch (e) {}
    if (!next) HG.audio.uiClick();
  }

  function showHelp(show) {
    els.helpOverlay.hidden = !show;
    if (show) HG.audio.uiClick();
  }

  function showOpRef(show) {
    els.opRefOverlay.hidden = !show;
    if (show) HG.audio.uiClick();
  }

  function bind() {
    els.btnDial.addEventListener("click", () => seq.dial([...register]));
    els.btnAbort.addEventListener("click", () => { HG.audio.uiClick(); seq.abort(); });
    els.btnClear.addEventListener("click", clearRegister);
    els.btnUndo.addEventListener("click", popGlyph);
    els.btnSurvey.addEventListener("click", surveyDial);
    els.btnShutdown.addEventListener("click", () => seq.shutdown());
    els.btnProbe.addEventListener("click", () => seq.probe());
    els.hotspot.addEventListener("click", () => seq.probe());
    els.btnIris.addEventListener("click", () => { HG.audio.uiClick(); toggleIris(); });
    els.btnMute.addEventListener("click", toggleMute);
    els.btnHelp.addEventListener("click", () => showHelp(true));
    els.btnHelpClose.addEventListener("click", () => showHelp(false));
    els.helpOverlay.addEventListener("click", (e) => {
      if (e.target === els.helpOverlay) showHelp(false);
    });
    els.btnOpRef.addEventListener("click", () => showOpRef(true));
    els.btnOpRefClose.addEventListener("click", () => showOpRef(false));
    els.opRefOverlay.addEventListener("click", (e) => {
      if (e.target === els.opRefOverlay) showOpRef(false);
    });

    window.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      switch (e.key) {
        case "Enter":
          if (!els.btnDial.disabled && document.activeElement.tagName !== "BUTTON") {
            seq.dial([...register]);
          }
          break;
        case "Escape":
          if (!els.helpOverlay.hidden) { showHelp(false); break; }
          if (!els.opRefOverlay.hidden) { showOpRef(false); break; }
          if (seq.getState() === "dialing" || seq.getState() === "resolving") seq.abort();
          else if (seq.getState() === "active" || seq.getState() === "inbound") seq.shutdown();
          break;
        case "Backspace": popGlyph(); break;
        case "i": case "I": toggleIris(); break;
        case "m": case "M": toggleMute(); break;
        case "p": case "P": seq.probe(); break;
        case "r": case "R": randomArchiveDial(); break;
        case "h": case "H": case "?": showHelp(els.helpOverlay.hidden); break;
      }
    });
  }

  /* ---- sequencer subscriptions ------------------------------------------------------------------ */

  function subscribe() {
    seq.on("log", log);
    seq.on("caption", (t) => { els.caption.textContent = t; });
    seq.on("state", () => { refreshControls(); renderRegister(); });
    seq.on("visited", markVisited);
    seq.on("flash", () => {
      els.flash.classList.remove("burst");
      void els.flash.offsetWidth; // restart the animation
      els.flash.classList.add("burst");
    });
    seq.on("probe", (n) => { els.probeCount.textContent = n; });
    seq.on("stability", (pct, elapsed) => {
      els.stabilityFill.style.width = pct.toFixed(1) + "%";
      els.stabilityFill.classList.toggle("low", pct < 25);
      els.stabilityPct.textContent = Math.round(pct) + "%";
      const m = Math.floor(elapsed / 60), s = Math.floor(elapsed % 60);
      els.elapsed.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    });
  }

  /* ---- clock + boot --------------------------------------------------------------------------------- */

  function tickClock() {
    els.clock.textContent = stamp();
  }

  function init() {
    buildGrid();
    buildArchive();
    bind();
    subscribe();
    renderRegister();
    tickClock();
    setInterval(tickClock, 1000);

    let muted = true;
    try { muted = localStorage.getItem("hg.muted") !== "0"; } catch (e) {}
    HG.audio.setMuted(muted);
    els.btnMute.textContent = muted ? "SOUND OFF" : "SOUND ON";
    els.btnMute.setAttribute("aria-pressed", String(!muted));

    log("Terminal VII online. Ring diagnostics nominal.", "good");
    log("Compose a seven-glyph address or select an archive destination.", "info");
  }

  return { init, log };
})();
