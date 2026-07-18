/* ═══════════════════════════════════════════════════════════════════
   main.js — the working of the Wayband.
   State runs: idle → chalking (marks 1..6) → wren's mark (7th) →
   primed → pouring → open → sealing → idle.
   Nothing dials itself. The visitor does every deliberate thing.
   ═══════════════════════════════════════════════════════════════════ */

(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const NUM_SOCKETS = 7;
  const CHIP_STEP = 360 / GLYPHS.length;

  /* ── tunables ── */
  const CFG = {
    timeScale: 1,               // dev hook can shrink this
    openSeconds: 150,           // tallow burn while the way is open
    mothOpenSeconds: 75,        // moth-light burns twice as fast
    gutterWarn: 40,             // seconds before close to warn
    startTapers: 2,
    dripsPerTaper: 2,
    maxTapers: 3,
  };

  const S = {
    state: "idle",              // idle | chalking | primed | pouring | open | sealing
    busy: false,
    dialed: [],                 // glyph ids chalked so far (max 6)
    hearthSet: false,
    target: null,               // destination object if opened via ledger
    mode: "patient",            // patient | moth
    mothLit: false,             // current dial bought with a taper
    tapers: CFG.startTapers,
    drippings: 0,
    rotation: 0,                // cumulative wheel rotation deg
    litChip: null,
    openTimers: [],
  };

  const els = {};
  let portal;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms * CFG.timeScale));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const glyphById = (id) => GLYPHS.find((g) => g.id === id);

  /* ═══════════════ journal ═══════════════ */
  function journal(line) {
    const p = document.createElement("p");
    p.className = "journal-line";
    p.style.setProperty("--tilt", (Math.random() * 2 - 1).toFixed(2) + "deg");
    p.textContent = line;
    els.journal.prepend(p);
    while (els.journal.children.length > 7) els.journal.lastChild.remove();
  }

  /* ═══════════════ build: the wheel ═══════════════ */
  function buildWheel() {
    const NS = "http://www.w3.org/2000/svg";
    const svg = els.wheel;
    const mk = (tag, attrs, parent) => {
      const el = document.createElementNS(NS, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      (parent || svg).appendChild(el);
      return el;
    };

    /* fixed backing: the sawn-spoke stubs don't turn (they're nailed to the wall ring) */
    const backing = mk("g", { class: "wheel-backing" });
    for (let i = 0; i < 12; i++) {
      mk("line", {
        x1: 0, y1: -368, x2: 0, y2: -330,
        transform: `rotate(${i * 30 + 15})`,
        class: "spoke-stub",
      }, backing);
    }

    /* the turning group */
    const turn = mk("g", { class: "wheel-turn", id: "wheel-turn" });

    /* wooden tire: two rough circles + strapping */
    mk("circle", { cx: 0, cy: 0, r: 452, class: "tire" }, turn);
    mk("circle", { cx: 0, cy: 0, r: 452, class: "tire-grain", "stroke-dasharray": "40 9 66 14 23 7" }, turn);
    mk("circle", { cx: 0, cy: 0, r: 407, class: "tire-inner" }, turn);
    /* iron strap patches — mends from hard use */
    [33, 141, 260].forEach((a) => {
      mk("rect", {
        x: -34, y: -486, width: 68, height: 66, rx: 5,
        transform: `rotate(${a})`, class: "strap",
      }, turn);
      mk("circle", { cx: -20, cy: -474, r: 4, class: "rivet", transform: `rotate(${a})` }, turn);
      mk("circle", { cx: 20, cy: -438, r: 4, class: "rivet", transform: `rotate(${a})` }, turn);
    });

    /* 24 slate chips, each hung a little crooked */
    GLYPHS.forEach((g, i) => {
      const jitter = (((i * 7919) % 11) - 5) * 0.7; /* deterministic crookedness */
      const grp = mk("g", {
        class: "chip",
        "data-idx": i,
        "data-id": g.id,
        transform: `rotate(${i * CHIP_STEP}) translate(0,-452) rotate(${jitter})`,
      }, turn);
      mk("title", {}, grp).textContent = `${g.name} — ${g.whisper}`;
      /* twine loop to the tire */
      mk("path", { d: "M0,-44 C -6,-56 6,-56 0,-44", class: "chip-twine" }, grp);
      mk("rect", { x: -33, y: -40, width: 66, height: 80, rx: 7, class: "slate" }, grp);
      mk("circle", { cx: 0, cy: -32, r: 3.5, class: "slate-hole" }, grp);
      const glyphWrap = mk("g", { transform: "translate(-27,-24) scale(0.54)", class: "glyph" }, grp);
      mk("path", { d: g.d, class: "glyph-stroke" }, glyphWrap);
      grp.addEventListener("click", () => onChipClick(i));
    });

    els.turn = svg.querySelector("#wheel-turn");
  }

  function chipEl(i) { return els.wheel.querySelectorAll(".chip")[i]; }

  /* ═══════════════ build: sockets ═══════════════ */
  function buildSockets() {
    const angles = [];
    for (let i = 0; i < NUM_SOCKETS; i++) {
      const aDeg = -90 + (i * 360) / NUM_SOCKETS;
      const a = (aDeg * Math.PI) / 180;
      angles.push(a);
      const d = document.createElement("div");
      d.className = "socket";
      d.dataset.idx = i;
      d.style.left = `${50 + Math.cos(a) * 31.5}%`;
      d.style.top = `${50 + Math.sin(a) * 31.5}%`;
      d.innerHTML = `
        <div class="sconce"></div>
        <div class="wax"><div class="drip d1"></div><div class="drip d2"></div></div>
        <div class="wick"></div>
        <div class="flame"></div>
        <div class="smoke"></div>
        <div class="twine-catch"><span class="knot"></span></div>`;
      els.sockets.appendChild(d);
    }
    portal.candleAngles = angles;
  }

  function socketEl(i) { return els.sockets.children[i]; }

  function lightSocket(i, moth) {
    const s = socketEl(i);
    s.classList.add("lit");
    if (moth) s.classList.add("moth-lit");
    s.classList.add("cinched");
  }

  function snuffSocket(i) {
    const s = socketEl(i);
    if (!s.classList.contains("lit")) return;
    s.classList.remove("lit", "moth-lit", "cinched");
    s.classList.add("smoking");
    hearthAudio.puff();
    setTimeout(() => s.classList.remove("smoking"), 1600 * CFG.timeScale);
  }

  function litCount() { return els.sockets.querySelectorAll(".socket.lit").length; }

  /* ═══════════════ build: ledger ═══════════════ */
  function buildLedger() {
    DESTINATIONS.forEach((dest) => {
      const card = document.createElement("button");
      card.className = `ledger-card kind-${dest.kind}`;
      card.dataset.id = dest.id;
      const minis = dest.marks
        .map((id) => `<svg viewBox="0 0 100 100" class="mini-glyph"><path d="${glyphById(id).d}"/></svg>`)
        .join("");
      card.innerHTML = `
        <span class="card-name">${dest.name}</span>
        <span class="card-glyphs">${minis}</span>
        <span class="card-note">${dest.note}</span>`;
      card.addEventListener("click", () => onLedgerClick(dest));
      els.ledgerCards.appendChild(card);
    });
  }

  /* ═══════════════ tapers & drippings ═══════════════ */
  function renderTapers() {
    els.taperRow.innerHTML = "";
    for (let i = 0; i < CFG.maxTapers; i++) {
      const t = document.createElement("span");
      t.className = "taper" + (i < S.tapers ? " have" : " spent");
      t.title = i < S.tapers ? "a moth-dipped taper" : "an empty notch on the shelf";
      els.taperRow.appendChild(t);
    }
    els.dripCount.textContent = `(${S.drippings}/${CFG.dripsPerTaper} drippings)`;
    els.dipBtn.disabled = !(S.drippings >= CFG.dripsPerTaper && S.tapers < CFG.maxTapers);
  }

  function onDip() {
    if (S.drippings < CFG.dripsPerTaper || S.tapers >= CFG.maxTapers) return;
    S.drippings -= CFG.dripsPerTaper;
    S.tapers++;
    hearthAudio.tick();
    journal(COPY.taperDipped);
    renderTapers();
  }

  /* ═══════════════ wheel turning ═══════════════ */
  function rotateToChip(i) {
    /* bring chip i under the reading nail (top). Wheel is heavy; take the short way. */
    const targetMod = -i * CHIP_STEP;
    let delta = targetMod - (S.rotation % 360);
    while (delta > 180) delta -= 360;
    while (delta <= -180) delta += 360;
    if (Math.abs(delta) < 0.5) return Promise.resolve(0);
    const dur = Math.max(0.85, (Math.abs(delta) / 90) * 1.1) * CFG.timeScale;
    S.rotation += delta;
    els.turn.style.transition = `transform ${dur}s cubic-bezier(.36,1.14,.44,1)`;
    els.turn.style.transform = `rotate(${S.rotation}deg)`;
    hearthAudio.creak(Math.min(dur, 2.2));
    return wait(dur * 1000 / CFG.timeScale).then(() => dur);
  }

  function litChipSet(i, on) {
    if (S.litChip !== null && S.litChip !== i) chipEl(S.litChip).classList.remove("read");
    if (i !== null) chipEl(i).classList.toggle("read", on);
    S.litChip = on ? i : null;
  }

  /* ═══════════════ chalking a mark (the patient way) ═══════════════ */
  async function chalkMark(glyphId) {
    const i = GLYPHS.findIndex((g) => g.id === glyphId);
    if (i < 0) return;
    S.busy = true;
    setHint(`turning to ${GLYPHS[i].name}…`);
    await rotateToChip(i);
    litChipSet(i, true);
    await wait(220);
    hearthAudio.thunk();
    await wait(160);
    hearthAudio.sputter();
    lightSocket(S.dialed.length, false);
    S.dialed.push(glyphId);
    journal(pick(COPY.markSet));
    await wait(620);
    S.busy = false;
    refreshControls();
  }

  /* ═══════════════ the moth flight (the bargain) ═══════════════ */
  function chipCenterPct(i) {
    const rect = els.rig.getBoundingClientRect();
    const aDeg = i * CHIP_STEP + (S.rotation % 360) - 90;
    const a = (aDeg * Math.PI) / 180;
    return {
      x: 50 + Math.cos(a) * 45.2,
      y: 50 + Math.sin(a) * 45.2,
      rect,
    };
  }

  async function mothFlyTo(i, socketIdx) {
    const { x, y } = chipCenterPct(i);
    const moth = document.createElement("div");
    moth.className = "moth";
    els.rig.appendChild(moth);
    const start = socketIdx === 0
      ? { x: 50, y: 96 }
      : chipCenterPct(GLYPHS.findIndex((g) => g.id === S.dialed[S.dialed.length - 1]));
    const midX = (start.x + x) / 2 + (Math.random() * 16 - 8);
    const midY = (start.y + y) / 2 + (Math.random() * 16 - 8);
    hearthAudio.mothFlit();
    const anim = moth.animate(
      [
        { left: start.x + "%", top: start.y + "%", opacity: 0.2 },
        { left: midX + "%", top: midY + "%", opacity: 1, offset: 0.55 },
        { left: x + "%", top: y + "%", opacity: 0.9 },
      ],
      { duration: 420 * CFG.timeScale, easing: "ease-in-out", fill: "forwards" }
    );
    /* finished can stall in throttled/background tabs — don't let the rig hang on it */
    await Promise.race([anim.finished.catch(() => {}), wait(520)]);
    chipEl(i).classList.add("ember");
    setTimeout(() => chipEl(i).classList.remove("ember"), 900 * CFG.timeScale);
    hearthAudio.sputter();
    lightSocket(socketIdx, true);
    moth.remove();
  }

  /* ═══════════════ input handlers ═══════════════ */
  function onChipClick(i) {
    if (S.busy) return journal(COPY.busy);
    if (S.state === "open" || S.state === "pouring" || S.state === "sealing") return journal(COPY.alreadyOpen);
    if (S.state === "primed") return;
    if (S.dialed.length >= 6) return;
    if (S.mode === "moth") journal(COPY.mothNoMemory);
    S.state = "chalking";
    S.target = null; /* hand-chalked: destination resolved at the ladle */
    hearthAudio.tick();
    chalkMark(GLYPHS[i].id);
  }

  async function onLedgerClick(dest) {
    if (S.busy) return journal(COPY.busy);
    if (S.state === "open" || S.state === "pouring" || S.state === "sealing") return journal(COPY.alreadyOpen);
    if (S.state === "primed" || S.dialed.length > 0) resetChalking(true);

    const fast = S.mode === "moth";
    if (fast && S.tapers <= 0) journal(COPY.mothNoTaper);
    const useMoth = fast && S.tapers > 0;

    S.state = "chalking";
    S.target = dest;
    S.busy = true;
    refreshControls();

    if (useMoth) {
      S.tapers--;
      S.mothLit = true;
      renderTapers();
      journal(COPY.mothStart(dest.name));
      setHint("the moth flies the road…");
      await wait(500);
      for (let k = 0; k < dest.marks.length; k++) {
        const gi = GLYPHS.findIndex((g) => g.id === dest.marks[k]);
        S.busy = true;
        await mothFlyTo(gi, k);
        S.dialed.push(dest.marks[k]);
        await wait(140);
      }
      await setHearthMark(true);
    } else {
      S.mothLit = false;
      journal(COPY.dialStart(dest.name));
      for (const id of dest.marks) {
        await chalkMark(id);
        S.busy = true; /* keep the rig held through the whole run */
      }
      await setHearthMark(false);
    }
    S.busy = false;
    refreshControls();
  }

  async function setHearthMark(moth) {
    S.busy = true;
    els.hearthMark.classList.add("pressed");
    await wait(moth ? 260 : 700);
    hearthAudio.thunk();
    hearthAudio.sputter();
    lightSocket(6, moth);
    S.hearthSet = true;
    S.state = "primed";
    journal(COPY.hearthSet);
    journal(COPY.primed);
    setHint("tip the ladle");
    S.busy = false;
    refreshControls();
  }

  function onHearthClick() {
    if (S.busy || S.state !== "chalking" || S.dialed.length !== 6 || S.hearthSet) return;
    hearthAudio.tick();
    setHearthMark(S.mothLit);
  }

  function onWipe() {
    if (S.busy || (S.state !== "chalking" && S.state !== "primed")) return;
    hearthAudio.tick();
    resetChalking(true);
    journal(COPY.wipe);
  }

  /* ═══════════════ the ladle: priming the way ═══════════════ */
  async function onLadle() {
    if (S.busy || S.state !== "primed") return;
    S.busy = true;
    S.state = "pouring";
    refreshControls();
    els.ladle.classList.add("tipping");
    hearthAudio.ladle();
    journal(COPY.opening);
    await wait(1000);
    portal.splash();
    portal.begin();
    await wait(500);
    els.ladle.classList.remove("tipping");

    const match = DESTINATIONS.find(
      (d) => d.marks.length === S.dialed.length && d.marks.every((m, k) => m === S.dialed[k])
    );

    if (!match) return failDial();
    if (match.kind === "crossed") return crossedDial(match);

    /* ── it answers ── */
    S.target = match;
    hearthAudio.openWhoosh();
    portal.setState("opening", { unstable: S.mothLit });
    els.rig.classList.add("way-open");
    if (S.mothLit) els.rig.classList.add("moth-way");
    await wait(1900);
    hearthAudio.startPortal(S.mothLit);
    S.state = "open";
    S.busy = false;
    journal(S.mothLit ? COPY.openMoth(match.name) : COPY.open(match.name));
    setHint(`the way stands open — ${match.name}`);
    refreshControls();
    scheduleGutter();
  }

  async function failDial() {
    await wait(900);
    hearthAudio.fizzle();
    portal.setState("fizzle");
    journal(pick(COPY.fizzle));
    for (let i = NUM_SOCKETS - 1; i >= 0; i--) {
      snuffSocket(i);
      await wait(160);
    }
    await wait(700);
    resetChalking(false);
    S.state = "idle";
    S.busy = false;
    setHint("");
    refreshControls();
  }

  async function crossedDial(dest) {
    hearthAudio.dread();
    portal.setState("opening", { unstable: true });
    els.rig.classList.add("way-open", "dread-way");
    await wait(1500);
    portal.setState("dread");
    journal(COPY.crossed);
    await wait(600);
    els.rig.classList.remove("way-open", "dread-way");
    for (let i = 0; i < NUM_SOCKETS; i++) { snuffSocket(i); await wait(70); }
    await wait(900);
    resetChalking(false);
    S.state = "idle";
    S.busy = false;
    setHint("");
    refreshControls();
  }

  /* ═══════════════ tallow clock while open ═══════════════ */
  function scheduleGutter() {
    clearOpenTimers();
    const total = (S.mothLit ? CFG.mothOpenSeconds : CFG.openSeconds) * 1000 * CFG.timeScale;
    const warnAt = total - CFG.gutterWarn * 1000 * CFG.timeScale;
    S.openTimers.push(setTimeout(() => {
      if (S.state === "open") { journal(COPY.guttering); els.rig.classList.add("guttering"); }
    }, Math.max(warnAt, total * 0.5)));
    S.openTimers.push(setTimeout(() => {
      if (S.state === "open") { journal(COPY.guttered); sealWay(false); }
    }, total));
  }

  function clearOpenTimers() {
    S.openTimers.forEach(clearTimeout);
    S.openTimers = [];
  }

  /* ═══════════════ the iron pin: sealing ═══════════════ */
  async function sealWay(byHand = true) {
    if (S.state !== "open") return;
    clearOpenTimers();
    S.state = "sealing";
    S.busy = true;
    refreshControls();
    if (byHand) { journal(COPY.sealing); els.ironPin.classList.add("drawn"); }
    hearthAudio.seal();
    hearthAudio.stopPortal();
    portal.setState("closing");
    els.rig.classList.remove("guttering");
    await wait(700);
    for (let i = NUM_SOCKETS - 1; i >= 0; i--) {
      snuffSocket(i);
      await wait(150);
    }
    els.rig.classList.remove("way-open", "moth-way");
    if (!S.mothLit) {
      S.drippings = Math.min(S.drippings + 1, 8);
      journal(COPY.drippings);
      journal(COPY.sealed);
    } else {
      journal(COPY.sealedMoth);
    }
    await wait(600);
    els.ironPin.classList.remove("drawn");
    resetChalking(false);
    S.state = "idle";
    S.busy = false;
    setHint("");
    renderTapers();
    refreshControls();
  }

  /* ═══════════════ housekeeping ═══════════════ */
  function resetChalking(snuff) {
    if (snuff) for (let i = 0; i < NUM_SOCKETS; i++) snuffSocket(i);
    S.dialed = [];
    S.hearthSet = false;
    S.mothLit = false;
    S.target = null;
    if (S.state === "chalking" || S.state === "primed") S.state = "idle";
    litChipSet(null, false);
    els.hearthMark.classList.remove("pressed");
    refreshControls();
  }

  function setHint(txt) {
    els.rigWrap.dataset.hint = txt || "";
  }

  function refreshControls() {
    const chalkDone = S.dialed.length === 6 && !S.hearthSet && S.state === "chalking";
    els.hearthMark.disabled = !chalkDone || S.busy;
    els.hearthMark.classList.toggle("glowing", chalkDone && !S.busy);
    els.ladle.disabled = !(S.state === "primed" && !S.busy);
    els.ladle.classList.toggle("glowing", S.state === "primed" && !S.busy);
    els.ironPin.hidden = S.state !== "open";
    els.wipe.hidden = !((S.state === "chalking" || S.state === "primed") && !S.busy && S.dialed.length > 0);
    document.body.dataset.state = S.state;
  }

  /* ═══════════════ mode toggle & sound ═══════════════ */
  function onModeClick(e) {
    const btn = e.currentTarget;
    document.querySelectorAll(".mode-btn").forEach((b) => {
      b.classList.toggle("selected", b === btn);
      b.setAttribute("aria-checked", b === btn ? "true" : "false");
    });
    S.mode = btn.dataset.mode;
    hearthAudio.tick();
    if (S.mode === "moth" && S.tapers <= 0) journal(COPY.mothNoTaper);
  }

  function onSoundToggle() {
    const btn = els.soundToggle;
    if (hearthAudio.enabled) {
      hearthAudio.sleep();
      btn.setAttribute("aria-pressed", "false");
      $("#sound-label").textContent = "wake the sounds";
    } else {
      hearthAudio.wake();
      btn.setAttribute("aria-pressed", "true");
      $("#sound-label").textContent = "hush the sounds";
      if (S.state === "open") hearthAudio.startPortal(S.mothLit);
    }
  }

  /* ═══════════════ ambient idle murmurs (no dialing, ever) ═══════════════ */
  function ambientMurmur() {
    if (S.state === "idle" && !S.busy && Math.random() < 0.6) journal(pick(COPY.idle));
    setTimeout(ambientMurmur, (50 + Math.random() * 40) * 1000);
  }

  /* ═══════════════ dev / verification hooks ═══════════════
     Not reachable by an idle visitor. Console API + Ctrl+Alt+R
     + URL params (?rig=<dest-id>&fast=1&quick=1). Documented in README. */
  async function runTestCycle(destId = "fen-market", fast = false, holdMs = 4000) {
    const dest = DESTINATIONS.find((d) => d.id === destId) || DESTINATIONS[0];
    S.mode = fast ? "moth" : "patient";
    if (S.state === "open") await sealWay(true);
    await onLedgerClick(dest);
    if (S.state === "primed") await onLadle();
    if (S.state === "open") {
      await wait(holdMs / CFG.timeScale);
      await sealWay(true);
    }
    return S.state;
  }

  window.wayband = {
    state: () => ({ ...S, dialed: [...S.dialed] }),
    dial: (destId, opts = {}) => onLedgerClick(DESTINATIONS.find((d) => d.id === destId) || DESTINATIONS[0], opts),
    pour: () => onLadle(),
    seal: () => sealWay(true),
    grantTaper: () => { S.tapers = Math.min(S.tapers + 1, CFG.maxTapers); renderTapers(); },
    timeScale: (x) => { CFG.timeScale = x; },
    test: runTestCycle,
    _setMode: (m) => { S.mode = m; },
    _fx: () => portal,
  };

  /* ═══════════════ boot ═══════════════ */
  function boot() {
    els.rig = $("#rig");
    els.rigWrap = $("#rig-wrap");
    els.wheel = $("#wheel");
    els.sockets = $("#sockets");
    els.journal = $("#journal");
    els.ledgerCards = $("#ledger-cards");
    els.taperRow = $("#taper-row");
    els.dipBtn = $("#dip-btn");
    els.dripCount = $("#drip-count");
    els.hearthMark = $("#hearth-mark");
    els.ladle = $("#ladle");
    els.ironPin = $("#iron-pin");
    els.wipe = $("#wipe-slate");
    els.soundToggle = $("#sound-toggle");

    portal = new PortalFX($("#portal"));

    buildWheel();
    buildSockets();
    buildLedger();
    renderTapers();
    refreshControls();

    els.hearthMark.addEventListener("click", onHearthClick);
    els.ladle.addEventListener("click", onLadle);
    els.ironPin.addEventListener("click", () => sealWay(true));
    els.wipe.addEventListener("click", onWipe);
    els.dipBtn.addEventListener("click", onDip);
    els.soundToggle.addEventListener("click", onSoundToggle);
    document.querySelectorAll(".mode-btn").forEach((b) => b.addEventListener("click", onModeClick));

    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.altKey && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        runTestCycle("fen-market", false);
      }
    });

    journal(pick(COPY.idle));
    setTimeout(ambientMurmur, 55 * 1000);

    /* URL-param test rig (verification only; never triggers on a plain visit) */
    const q = new URLSearchParams(location.search);
    if (q.has("quick")) CFG.timeScale = 0.25;
    if (q.has("rig")) {
      const fast = q.get("fast") === "1";
      if (fast) { S.mode = "moth"; }
      setTimeout(() => runTestCycle(q.get("rig") || "fen-market", fast), 600);
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
