/* ═══════════════════════════════════════════════════════════════════
   SIDEREUM · main.js — the rite itself
   State machine: dormant → inscribing → ready → igniting → open →
   sealing → dormant. Wires the Codex of Ways, the Ring's memory
   (Swift Working), the Ritual Record, and the dev-only test hooks.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const S = window.SIDEREUM;
  const glyphs = S.glyphs;
  const audio = S.audio;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ————— the charted Ways (all destinations are fictions) —————

  const CODEX = [
    {
      id: "vael-tirion",
      name: "Vael-Tirion, Citadel of First Light",
      lore: "Where the Order keeps its high seat, and dawn is a standing law.",
      address: [0, 6, 14, 2, 9, 18, 4],
    },
    {
      id: "undermoon-sea",
      name: "The Undermoon Sea",
      lore: "A tide beneath the world that answers a moon no sky has held.",
      address: [1, 4, 19, 8, 13, 3, 16],
    },
    {
      id: "silent-orrery",
      name: "The Orrery of the Silent Choir",
      lore: "Nine spheres of glass that sing only when no one remains to hear.",
      address: [7, 12, 5, 20, 10, 15, 2],
    },
    {
      id: "ashen-library",
      name: "The Ashen Library",
      lore: "Every book ever burned is shelved here, ash bound in iron covers.",
      address: [16, 3, 11, 6, 17, 0, 13],
    },
    {
      id: "thornmere",
      name: "Thornmere, Court of the Briar Queen",
      lore: "Guests are welcome; leaving is a matter of negotiation.",
      address: [10, 18, 1, 15, 5, 12, 8],
    },
    {
      id: "star-forges",
      name: "The Star-Forges of Hesh",
      lore: "Where dead stars are hammered thin to make the leaf that gilds this Ring.",
      address: [20, 9, 17, 4, 14, 7, 11],
    },
  ];

  // Vael-Tirion was graven into the Ring's memory by the Order itself,
  // so Swift Working is demonstrable from first visit.
  const PRE_REMEMBERED = ["vael-tirion"];

  // ————— state —————

  let state = "dormant"; // dormant | inscribing | ready | igniting | open | sealing
  let busy = false;      // an animation/step is in flight
  let inscription = [];  // sigil indices graven so far
  let openWay = null;    // { name, address, uncharted } while open
  let unchartedCount = 0;

  // ————— elements —————

  const body = document.body;
  const statusLine = document.getElementById("statusLine");
  const record = document.getElementById("record");
  const tray = document.getElementById("tray");
  const codexList = document.getElementById("codexList");
  const rememberedList = document.getElementById("rememberedList");
  const effaceBtn = document.getElementById("effaceBtn");
  const sealBtn = document.getElementById("sealBtn");
  const audioBtn = document.getElementById("audioBtn");
  const helpBtn = document.getElementById("helpBtn");
  const grimoire = document.getElementById("grimoire");
  const grimoireClose = document.getElementById("grimoireClose");
  const forgetBtn = document.getElementById("forgetBtn");
  const flash = document.getElementById("flash");

  const portal = S.portal.Portal(document.getElementById("portalCanvas"));
  const ring = S.ring.Ring(document.getElementById("ringSvg"));
  S.portal.paintStarfield(document.getElementById("starfield"));

  // ————— the Ring's memory (localStorage; purely client-side) —————

  const MEM_KEY = "sidereum.memory.v1";

  function loadMemory() {
    try {
      const raw = localStorage.getItem(MEM_KEY);
      if (raw) {
        const m = JSON.parse(raw);
        if (m && Array.isArray(m.ways)) return m;
      }
    } catch (e) { /* a mute Ring still turns */ }
    return { ways: PRE_REMEMBERED.map(id => {
      const w = CODEX.find(c => c.id === id);
      return { id: w.id, name: w.name, address: w.address.slice(), uncharted: false };
    }), unchartedCount: 0 };
  }

  let memory = loadMemory();
  unchartedCount = memory.unchartedCount || 0;

  function saveMemory() {
    memory.unchartedCount = unchartedCount;
    try { localStorage.setItem(MEM_KEY, JSON.stringify(memory)); } catch (e) { /* ephemeral, then */ }
  }

  function isRemembered(address) {
    return memory.ways.some(w => w.address.join(",") === address.join(","));
  }

  function remember(name, address, uncharted, id) {
    if (isRemembered(address)) return false;
    memory.ways.push({ id: id || null, name, address: address.slice(), uncharted: !!uncharted });
    saveMemory();
    return true;
  }

  // ————— roman numerals for uncharted ways —————

  function roman(n) {
    const table = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let out = "";
    for (const [v, s] of table) while (n >= v) { out += s; n -= v; }
    return out || "I";
  }

  // ————— ritual record —————

  const ORDINALS = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh"];

  function log(text, cls) {
    const li = document.createElement("li");
    li.textContent = text;
    if (cls) li.className = cls;
    record.insertBefore(li, record.firstChild);
    while (record.children.length > 48) record.removeChild(record.lastChild);
  }

  function setStatus(text) { statusLine.textContent = text; }

  function setState(next) {
    state = next;
    body.setAttribute("data-state", next);
    effaceBtn.hidden = !(next === "inscribing" || next === "ready");
    sealBtn.hidden = next !== "open";
  }

  // ————— inscription tray —————

  function buildTray() {
    tray.innerHTML = "";
    for (let i = 0; i < 7; i++) {
      const li = document.createElement("li");
      li.setAttribute("aria-label", `Ward ${i + 1}: empty`);
      tray.appendChild(li);
    }
  }

  function trayFill(slot, sigilIndex) {
    const li = tray.children[slot];
    const s = glyphs.SIGILS[sigilIndex];
    li.innerHTML = glyphs.sigilMarkup(sigilIndex, 28, "tray-chip");
    li.classList.add("filled");
    li.style.color = "var(--aurum)";
    li.setAttribute("aria-label", `Ward ${slot + 1}: ${s.name}`);
  }

  function trayClear() { buildTray(); }

  // ————— codex UI —————

  function buildCodex() {
    codexList.innerHTML = "";
    for (const way of CODEX) {
      const li = document.createElement("li");
      li.className = "way";
      li.dataset.id = way.id;
      const chips = way.address
        .map(i => `<span style="color: var(--argent-dim)">${glyphs.sigilMarkup(i, 20)}</span>`)
        .join("");
      li.innerHTML =
        `<div class="way-name"><span class="mem-star" hidden>✦</span><span>${way.name}</span></div>` +
        `<p class="way-lore">${way.lore}</p>` +
        `<div class="way-sigils">${chips}</div>` +
        `<div class="way-actions">` +
        `<button class="btn intone" type="button">Intone the Way</button>` +
        `<button class="btn btn-swift swift" type="button">Swift Working</button>` +
        `</div>`;
      li.querySelector(".intone").addEventListener("click", () => intoneWay(way, false));
      li.querySelector(".swift").addEventListener("click", () => intoneWay(way, true));
      codexList.appendChild(li);
    }
    refreshCodex();
  }

  function refreshCodex() {
    for (const li of codexList.children) {
      const way = CODEX.find(w => w.id === li.dataset.id);
      const remembered = isRemembered(way.address);
      li.classList.toggle("is-remembered", remembered);
      li.querySelector(".mem-star").hidden = !remembered;
      const swiftBtn = li.querySelector(".swift");
      swiftBtn.disabled = !remembered;
      swiftBtn.title = remembered
        ? "The Ring holds this Way's echo — it may be recalled without turning."
        : "The Ring holds no echo of this Way yet. Open it once in full ritual, and it will be remembered.";
    }
    rememberedList.innerHTML = "";
    if (!memory.ways.length) {
      rememberedList.innerHTML = `<li class="none">The Ring's memory is empty stone.</li>`;
    } else {
      for (const w of memory.ways) {
        const li = document.createElement("li");
        li.textContent = `✦ ${w.name}`;
        rememberedList.appendChild(li);
      }
    }
    forgetBtn.disabled = !memory.ways.length;
  }

  // ————— the rite: single sigil step —————

  async function graveSigil(sigilIndex, swift) {
    const slot = inscription.length;
    inscription.push(sigilIndex);
    const s = glyphs.SIGILS[sigilIndex];

    if (swift) {
      ring.flashLens(sigilIndex, true);
      ring.igniteWard(slot, true);
      audio.chime(slot, true);
    } else {
      const turn = ring.rotateToSigil(sigilIndex, {});
      audio.turnWhisper(1.2);
      await turn;
      ring.flashLens(sigilIndex, false);
      ring.igniteWard(slot, false);
      audio.chime(slot, false);
      await wait(reducedMotion ? 120 : 420);
    }

    ring.sigilNodes[sigilIndex].classList.add("is-used");
    trayFill(slot, sigilIndex);
    log(`The ${ORDINALS[slot]} Ward takes the sigil ${s.name}, ${s.epithet}.`, swift ? "swift" : "");

    if (inscription.length === 7) {
      setState("ready");
      ring.keystoneAwake(true);
      setStatus("Seven sigils graven. The Keystone wakes — touch it.");
      log("Seven wards burn. The Keystone wakes.", "notable");
    } else {
      setState("inscribing");
      setStatus(`The Ring turns. ${inscription.length} of seven wards ${inscription.length === 1 ? "bears its sigil" : "bear their sigils"}.`);
    }
  }

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ————— sigil click (manual dialing) —————

  async function onSigilClick(sigilIndex) {
    if (busy) return;
    if (state !== "dormant" && state !== "inscribing") return;
    if (inscription.includes(sigilIndex)) {
      const s = glyphs.SIGILS[sigilIndex];
      log(`${s.name} is already graven; a sigil holds but one ward at a time.`);
      audio.refusal();
      return;
    }
    busy = true;
    await graveSigil(sigilIndex, false);
    busy = false;
  }

  // ————— ignition —————

  function matchWay(address) {
    const key = address.join(",");
    const charted = CODEX.find(w => w.address.join(",") === key);
    if (charted) return { name: charted.name, id: charted.id, uncharted: false };
    const known = memory.ways.find(w => w.address.join(",") === key);
    if (known) return { name: known.name, id: known.id, uncharted: true };
    return null;
  }

  async function ignite(swift) {
    if (state !== "ready") return;
    busy = true;
    setState("igniting");
    ring.keystoneAwake(false);
    ring.keystoneHidden(true);

    const found = matchWay(inscription);
    let way;
    if (found) {
      way = { name: found.name, id: found.id, address: inscription.slice(), uncharted: found.uncharted };
    } else {
      unchartedCount += 1;
      way = {
        name: `Uncharted Way ${roman(unchartedCount)}`,
        id: null,
        address: inscription.slice(),
        uncharted: true,
      };
    }

    setStatus(way.uncharted
      ? "The wards answer. An uncharted Way is opening—"
      : "The wards answer. The Way is opening—");
    log(swift ? "The Keystone answers the remembered echo." : "The Keystone is touched. The wards answer.", "notable");

    audio.ignition();

    // cascade re-flare of the wards
    for (let k = 0; k < 7; k++) {
      ring.igniteWard(k, swift);
      await wait(reducedMotion ? 30 : 95);
    }

    if (!reducedMotion) {
      flash.classList.remove("blaze");
      void flash.getBoundingClientRect();
      flash.classList.add("blaze");
    }

    portal.bloom(way.uncharted ? "uncharted" : "charted", reducedMotion ? 0.8 : 1.9);
    await wait(reducedMotion ? 800 : 1900);

    openWay = way;
    setState("open");
    audio.startChoir();
    setStatus(way.uncharted
      ? `An uncharted Way stands open — the Codex holds no name for what lies beyond.`
      : `The Way stands open to ${way.name}.`);
    log(`The Way is open: ${way.name}.`, "notable" + (swift ? " swift" : ""));

    const newlyRemembered = remember(way.name, way.address, way.uncharted, way.id);
    if (newlyRemembered) {
      log(`The Ring takes this Way into memory. It may now be recalled by Swift Working.`, "notable");
    }
    refreshCodex();
    busy = false;
  }

  // ————— sealing —————

  async function seal() {
    if (state !== "open" || busy) return;
    busy = true;
    setState("sealing");
    setStatus("The seals close upon the Way.");
    log(`The Sealing is spoken over ${openWay ? openWay.name : "the Way"}.`, "notable");
    audio.stopChoir();
    audio.sealing();

    portal.seal(reducedMotion ? 0.8 : 1.6, null);

    // wards release in reverse order
    for (let k = 6; k >= 0; k--) {
      ring.dimWard(k);
      await wait(reducedMotion ? 40 : 130);
    }
    await wait(reducedMotion ? 400 : 900);

    // restore the ring to dormancy
    for (const i of inscription) ring.sigilNodes[i].classList.remove("is-used");
    inscription = [];
    trayClear();
    ring.keystoneHidden(false);
    openWay = null;
    setState("dormant");
    setStatus("The Ring dreams beneath its wards.");
    log("The Way is sealed. The Ring returns to its dreaming.");
    busy = false;
  }

  // ————— efface (abort a partial inscription) —————

  async function efface() {
    if ((state !== "inscribing" && state !== "ready") || busy) return;
    busy = true;
    ring.keystoneAwake(false);
    for (let k = inscription.length - 1; k >= 0; k--) {
      ring.dimWard(k);
      await wait(reducedMotion ? 30 : 110);
    }
    for (const i of inscription) ring.sigilNodes[i].classList.remove("is-used");
    inscription = [];
    trayClear();
    setState("dormant");
    setStatus("The inscription is effaced. The Ring dreams again.");
    log("The half-written Way is effaced from the band.");
    busy = false;
  }

  // ————— intoning a Way from the Codex (auto-dial) —————

  async function intoneWay(way, swift) {
    if (busy) return;
    if (state === "open" || state === "igniting" || state === "sealing") {
      log("A Way already stands open. Seal it before intoning another.");
      audio.refusal();
      return;
    }
    if (swift && !isRemembered(way.address)) {
      log(`The Ring holds no echo of ${way.name}. Swift Working needs a remembered Way.`);
      audio.refusal();
      return;
    }
    busy = true;

    // clear any half-inscription first
    if (inscription.length) {
      for (let k = inscription.length - 1; k >= 0; k--) ring.dimWard(k);
      for (const i of inscription) ring.sigilNodes[i].classList.remove("is-used");
      inscription = [];
      trayClear();
      ring.keystoneAwake(false);
    }

    if (swift) {
      setStatus(`Swift Working: the Ring recalls ${way.name}.`);
      log(`Swift Working begins — the Ring recalls the echo of ${way.name}. The band need not turn.`, "notable swift");
      for (const sigilIndex of way.address) {
        await graveSigil(sigilIndex, true);
        await wait(reducedMotion ? 60 : 200);
      }
    } else {
      setStatus(`The rite begins: intoning the Way to ${way.name}.`);
      log(`The full rite begins: the Way to ${way.name} is intoned sigil by sigil.`, "notable");
      for (const sigilIndex of way.address) {
        await graveSigil(sigilIndex, false);
        await wait(reducedMotion ? 80 : 300);
      }
    }

    // in an intoned rite the Keystone answers of its own accord
    await wait(reducedMotion ? 150 : swift ? 260 : 700);
    log("The Keystone answers the intonation of its own accord.");
    busy = false;
    await ignite(swift);
  }

  // ————— forget everything —————

  function forgetAll() {
    if (busy || state === "open" || state === "igniting" || state === "sealing") {
      log("The Ring will not be made to forget while a Way is open.");
      audio.refusal();
      return;
    }
    memory = { ways: [], unchartedCount: unchartedCount };
    saveMemory();
    refreshCodex();
    log("The Ring's memory is effaced. Every echo is gone; every Way must be opened anew.", "notable");
  }

  // ————— wiring —————

  for (const node of ring.sigilNodes) {
    node.addEventListener("click", () => onSigilClick(+node.dataset.index));
  }

  ring.keystone.addEventListener("click", () => {
    if (state === "ready" && !busy) ignite(false);
  });

  sealBtn.addEventListener("click", seal);
  effaceBtn.addEventListener("click", efface);
  forgetBtn.addEventListener("click", forgetAll);

  audioBtn.addEventListener("click", () => {
    const on = !audio.isEnabled();
    const ok = audio.setEnabled(on);
    const active = on && ok !== false;
    audioBtn.textContent = active ? "Voces Aetheris: Singing" : "Voces Aetheris: Silent";
    audioBtn.setAttribute("aria-pressed", active ? "true" : "false");
    log(active ? "The Ring is granted its voice." : "The Ring falls silent.");
    if (active && state === "open") audio.startChoir();
  });

  helpBtn.addEventListener("click", () => { grimoire.hidden = false; grimoireClose.focus(); });
  grimoireClose.addEventListener("click", () => { grimoire.hidden = true; helpBtn.focus(); });
  grimoire.addEventListener("click", e => { if (e.target === grimoire) grimoire.hidden = true; });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (!grimoire.hidden) { grimoire.hidden = true; return; }
      if (state === "open") seal();
      else if (state === "inscribing" || state === "ready") efface();
    }
    if ((e.key === "s" || e.key === "S") && state === "open" && !e.ctrlKey && !e.metaKey && !e.altKey) seal();
    // ——— dev-only verification triggers (never fired by idleness) ———
    if (e.ctrlKey && e.altKey && (e.key === "g" || e.key === "G")) { e.preventDefault(); devRite(false); }
    if (e.ctrlKey && e.altKey && (e.key === "j" || e.key === "J")) { e.preventDefault(); devRite(true); }
  });

  // ————— dev/test hooks (explicit invocation only; no idle automation) —————

  function devRite(swift) {
    const way = swift
      ? CODEX.find(w => isRemembered(w.address)) || CODEX[0]
      : CODEX[0];
    intoneWay(way, swift);
  }

  window.RITE = {
    /** Intone a way by codex id (or the first way). RITE.dial("thornmere"); */
    dial(id, opts) {
      const way = CODEX.find(w => w.id === id) || CODEX[0];
      return intoneWay(way, !!(opts && opts.swift));
    },
    seal, efface,
    state: () => ({ state, busy, inscription: inscription.slice(), openWay }),
    codex: () => CODEX.map(w => w.id),
  };

  // ?rite=full or ?rite=swift — a dev-only auto-run for verification.
  // This never triggers from idleness; it requires the explicit query string.
  const params = new URLSearchParams(location.search);
  if (params.get("rite") === "full") setTimeout(() => devRite(false), 600);
  if (params.get("rite") === "swift") setTimeout(() => devRite(true), 600);

  // ?diag=1 — dev-only: report canvas/render diagnostics via document.title
  // (readable from headless --dump-dom during verification).
  if (params.get("diag")) setTimeout(() => {
    try {
      const c = document.getElementById("portalCanvas");
      const g = c.getContext("2d");
      const px = g.getImageData(Math.round(c.width / 2), Math.round(c.height / 2), 1, 1).data;
      document.title = "DIAG " + JSON.stringify({
        w: c.width, h: c.height, mode: portal.mode(),
        px: Array.from(px), state: document.body.dataset.state,
      });
    } catch (err) {
      document.title = "DIAG ERROR " + err.message;
    }
  }, 2500);

  // ?freeze=1 — dev-only: halt the veil render loop after 3s so headless
  // screenshot tools (which skip continuously-repainting canvases) can
  // composite the final frame.
  if (params.get("freeze")) setTimeout(() => portal.freeze(), 3000);

  // ?veilimg=1 — dev-only: mirror the veil canvas into an <img> so headless
  // screenshot tools that skip live canvas layers still show the veil.
  if (params.get("veilimg")) setInterval(() => {
    const c = document.getElementById("portalCanvas");
    let img = document.getElementById("veilImg");
    if (!img) {
      img = document.createElement("img");
      img.id = "veilImg";
      img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
      c.insertAdjacentElement("afterend", img);
    }
    img.src = c.toDataURL();
  }, 800);

  // ?tableau=open|uncharted — dev-only static preview of the open state,
  // for visual verification without waiting on animation timing.
  const tableau = params.get("tableau");
  if (tableau === "open" || tableau === "uncharted") setTimeout(() => {
    const way = CODEX[0];
    inscription = way.address.slice();
    inscription.forEach((sigilIndex, slot) => {
      ring.igniteWard(slot, false);
      ring.sigilNodes[sigilIndex].classList.add("is-used");
      trayFill(slot, sigilIndex);
    });
    ring.keystoneHidden(true);
    openWay = { name: way.name, id: way.id, address: way.address.slice(), uncharted: tableau === "uncharted" };
    portal.presentOpen(tableau === "uncharted" ? "uncharted" : "charted");
    setState("open");
    setStatus(`The Way stands open to ${way.name}.`);
  }, 60);

  console.info(
    "%cSIDEREUM%c dev hooks: RITE.dial(id, {swift}), RITE.seal(), RITE.state() · " +
    "Ctrl+Alt+G full rite · Ctrl+Alt+J swift · ?rite=full|swift",
    "color:#e8c06a;letter-spacing:.3em", "color:inherit"
  );

  // ————— init —————

  buildTray();
  buildCodex();
  setState("dormant");
  setStatus("The Ring dreams beneath its wards.");
  log("You stand before the Sidereum. Touch a sigil, or consult the Codex of Ways.", "notable");
})();
