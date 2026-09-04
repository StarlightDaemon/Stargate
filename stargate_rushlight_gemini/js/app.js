// app.js — Main bootstrap, event wiring, telemetry updates, and accessibility handling
// Codename: RUSHLIGHT — Stargate Low Magic Console

import { FOLK_RUNES, DESTINATIONS } from "./data.js";
import { sound } from "./audio.js";
import { FolkGateRenderer } from "./gate-renderer.js";
import { HearthDialer, GATE_STATES } from "./dialer.js";
import { FolkAutocomplete } from "./autocomplete.js";

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const gateSvg = document.getElementById("gate-svg");
  const liveAnnouncer = document.getElementById("live-announcer");
  const strikeBtn = document.getElementById("strike-rushlight-btn");
  const disengageBtn = document.getElementById("disengage-btn");
  const interlockBtn = document.getElementById("interlock-toggle-btn");
  const autoDialBtn = document.getElementById("autodial-btn");
  const audioToggleBtn = document.getElementById("audio-toggle-btn");
  const runePadContainer = document.getElementById("manual-rune-pad");
  const selectedRunesDisplay = document.getElementById("selected-runes-display");
  const searchInput = document.getElementById("destination-search-input");
  const searchDropdown = document.getElementById("destination-dropdown");

  // Telemetry elements
  const stateBadge = document.getElementById("hearth-state-badge");
  const statusSummary = document.getElementById("status-summary-text");
  const tallowGauge = document.getElementById("tallow-depth-val");
  const tensionGauge = document.getElementById("thread-tension-val");
  const saltGauge = document.getElementById("salt-integrity-val");
  const temperGauge = document.getElementById("hearth-temper-val");
  const activeDestName = document.getElementById("active-dest-name");
  const activeDestLore = document.getElementById("active-dest-lore");
  const activeDestHerb = document.getElementById("active-dest-herb");

  // Initialize Gate Renderer
  const renderer = new FolkGateRenderer(gateSvg, FOLK_RUNES);

  // Announce helper for ARIA live region
  function announce(message) {
    if (liveAnnouncer) {
      liveAnnouncer.textContent = message;
    }
  }

  // Initialize Dialer
  let selectedDestination = null;

  const dialer = new HearthDialer(renderer, FOLK_RUNES, (state, detail) => {
    updateUI(state, detail);
  });

  // Initialize Autocomplete
  const autocomplete = new FolkAutocomplete({
    inputEl: searchInput,
    dropdownEl: searchDropdown,
    destinations: DESTINATIONS,
    runes: FOLK_RUNES,
    onSelect: (dest) => {
      selectDestination(dest);
    }
  });

  // Render Manual Rune Buttons
  function renderManualRunePad() {
    runePadContainer.innerHTML = "";
    FOLK_RUNES.forEach((rune) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rune-btn";
      btn.setAttribute("aria-label", `Dial Rune #${rune.id}: ${rune.name} (${rune.element})`);
      btn.setAttribute("title", `#${rune.id}: ${rune.name} — ${rune.description}`);
      btn.dataset.id = rune.id;

      btn.innerHTML = `
        <svg viewBox="0 0 32 32" class="rune-pad-icon" aria-hidden="true">
          <path d="${rune.path}"/>
        </svg>
        <span class="rune-pad-num">${rune.id}</span>
        <span class="rune-pad-label">${rune.name}</span>
      `;

      btn.addEventListener("click", () => {
        if (dialer.state === GATE_STATES.IDLE || dialer.state === GATE_STATES.DIALING) {
          dialer.dialRune(rune);
        }
      });

      runePadContainer.appendChild(btn);
    });
  }

  // Handle destination selection
  function selectDestination(dest) {
    selectedDestination = dest;
    activeDestName.textContent = dest.name;
    activeDestLore.textContent = dest.lore;
    activeDestHerb.textContent = `🌿 Herbal Pairing: ${dest.herb} (${dest.distance})`;
    autoDialBtn.disabled = false;
    autoDialBtn.classList.remove("btn-disabled");
    announce(`Selected destination ${dest.name}. Ready to thread the hearth knots.`);

    // Highlight preset cards if any match
    document.querySelectorAll(".preset-card").forEach(c => {
      c.classList.toggle("active-preset", parseInt(c.dataset.id) === dest.id);
    });
  }

  // Render Preset Cards
  function renderPresetCatalog(filterCategory = "All") {
    const catalogContainer = document.getElementById("dest-presets-list");
    if (!catalogContainer) return;
    catalogContainer.innerHTML = "";

    const list = filterCategory === "All"
      ? DESTINATIONS.slice(0, 16) // Show seed set by default
      : DESTINATIONS.filter(d => d.category === filterCategory);

    list.forEach(dest => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "preset-card";
      card.dataset.id = dest.id;
      card.innerHTML = `
        <div class="preset-title-row">
          <span class="preset-name">${dest.name}</span>
          <span class="preset-category-tag">${dest.category}</span>
        </div>
        <div class="preset-lore-snippet">${dest.lore}</div>
        <div class="preset-herb-tag">🌿 ${dest.herb}</div>
      `;

      card.addEventListener("click", () => {
        searchInput.value = dest.name;
        selectDestination(dest);
      });

      catalogContainer.appendChild(card);
    });
  }

  // UI state synchronizer
  function updateUI(state, detail) {
    // 1. Update State Badge & Summary
    stateBadge.className = `state-badge state-${state}`;
    switch (state) {
      case GATE_STATES.IDLE:
        stateBadge.textContent = "COLD HEARTH";
        statusSummary.textContent = "The hearth is cold and swept. Spindle ring at rest.";
        strikeBtn.disabled = true;
        strikeBtn.classList.add("btn-disabled");
        announce("Hearth returned to cold resting state.");
        break;
      case GATE_STATES.DIALING:
        stateBadge.textContent = `KNOTTING (${detail.dialedRunes.length}/7)`;
        statusSummary.textContent = `Thread ${detail.dialedRunes.length} drawn taut across the aperture.`;
        strikeBtn.disabled = true;
        strikeBtn.classList.add("btn-disabled");
        announce(`Rune ${detail.dialedRunes[detail.dialedRunes.length - 1]?.name} locked at pin ${detail.dialedRunes.length}.`);
        break;
      case GATE_STATES.PENDING:
        stateBadge.textContent = "THRESHOLD READY";
        statusSummary.textContent = "Seven knots bound. Tallow wick awaits the flint strike.";
        strikeBtn.disabled = detail.isInterlocked;
        strikeBtn.classList.toggle("btn-disabled", detail.isInterlocked);
        announce("Threshold knotted and awaiting rushlight strike. System pending.");
        break;
      case GATE_STATES.BUILDUP:
        stateBadge.textContent = "KINDLING BUILDUP";
        statusSummary.textContent = "Flint struck! Sparks catching the tallow rushlight...";
        strikeBtn.disabled = true;
        announce("Stage one: Kindling buildup. Heat rising in hearth aperture.");
        break;
      case GATE_STATES.BREAKTHROUGH:
        stateBadge.textContent = "BREAKTHROUGH!";
        statusSummary.textContent = "Salt line flares chalk-white. Threshold blooming open!";
        announce("Stage two: Breakthrough! Threshold boundary parted.");
        break;
      case GATE_STATES.ACTIVE:
        stateBadge.textContent = "HEARTH SUSTAINED";
        statusSummary.textContent = "Hearth window open and tranquil. Wayfarers may cross.";
        strikeBtn.disabled = true;
        announce("Stage three: Sustained active. Folk threshold open.");
        break;
    }

    // 2. Selected Runes Ribbon
    selectedRunesDisplay.innerHTML = "";
    for (let i = 0; i < 7; i++) {
      const rune = detail.dialedRunes[i];
      const slot = document.createElement("div");
      slot.className = `rune-slot ${rune ? "filled" : "empty"}`;
      if (rune) {
        slot.innerHTML = `
          <svg viewBox="0 0 32 32" class="slot-icon" aria-hidden="true"><path d="${rune.path}"/></svg>
          <span class="slot-num">#${rune.id}</span>
          <span class="slot-name">${rune.name}</span>
        `;
      } else {
        slot.innerHTML = `<span class="slot-empty-label">Pin ${i + 1}</span>`;
      }
      selectedRunesDisplay.appendChild(slot);
    }

    // 3. Update Manual Buttons (disable dialed ones, disable all if >= 7 or active)
    const isDialable = (state === GATE_STATES.IDLE || state === GATE_STATES.DIALING) && detail.dialedRunes.length < 7;
    document.querySelectorAll(".rune-btn").forEach(btn => {
      const id = parseInt(btn.dataset.id);
      const isAlreadyDialed = detail.dialedRunes.some(r => r.id === id);
      btn.disabled = !isDialable || isAlreadyDialed;
      btn.classList.toggle("rune-active-dialed", isAlreadyDialed);
    });

    // 4. Update Interlock Latch Visuals
    interlockBtn.setAttribute("aria-pressed", detail.isInterlocked ? "true" : "false");
    interlockBtn.classList.toggle("interlock-engaged", detail.isInterlocked);
    const interlockIndicator = document.getElementById("interlock-bar-overlay");
    if (interlockIndicator) {
      interlockIndicator.classList.toggle("bar-dropped", detail.isInterlocked);
    }
    const interlockText = document.getElementById("interlock-status-text");
    if (interlockText) {
      interlockText.textContent = detail.isInterlocked
        ? "THRESHOLD BARRED (Cold Salt Latch Engaged)"
        : "THRESHOLD CLEAR (Strike Allowed)";
    }

    // 5. Telemetry updates
    const knotCount = detail.dialedRunes.length;
    tensionGauge.textContent = `${knotCount * 14} Lbs (${knotCount}/7 Twines)`;
    if (state === GATE_STATES.ACTIVE) {
      tallowGauge.textContent = "2.8 in (Steady Flame)";
      saltGauge.textContent = "Warded (Radiant Salt)";
      temperGauge.textContent = "Golden Ash (Active)";
    } else if (state === GATE_STATES.BUILDUP) {
      tallowGauge.textContent = "3.2 in (Kindling)";
      saltGauge.textContent = "Tensioning (White Grain)";
      temperGauge.textContent = "Smoldering Turf";
    } else if (state === GATE_STATES.PENDING) {
      tallowGauge.textContent = "3.5 in (Wick Primed)";
      saltGauge.textContent = "100% (Salt Ring Set)";
      temperGauge.textContent = "Cold Ash (Ready)";
    } else {
      tallowGauge.textContent = "3.5 in (Unlit Tallow)";
      saltGauge.textContent = "100% (Swept Stone)";
      temperGauge.textContent = "Cold Hearth (Ash)";
    }
  }

  // Event Listeners: Controls
  strikeBtn.addEventListener("click", () => {
    const res = dialer.strikeRushlight();
    if (!res.success) {
      if (res.reason === "INTERLOCKED") {
        announce("Cannot strike rushlight: Salt-Line Threshold Latch is engaged! Release latch first.");
        const interlockText = document.getElementById("interlock-status-text");
        if (interlockText) {
          interlockText.classList.add("interlock-alert-flash");
          setTimeout(() => interlockText.classList.remove("interlock-alert-flash"), 1200);
        }
      } else if (res.reason === "NOT_PENDING") {
        announce("Cannot strike: 7 knots must be bound first.");
      }
    }
  });

  disengageBtn.addEventListener("click", () => {
    dialer.disengage();
  });

  interlockBtn.addEventListener("click", () => {
    const latched = dialer.toggleInterlock();
    announce(`Safety interlock ${latched ? "latched. Striker barred." : "released. Striker ready."}`);
  });

  autoDialBtn.addEventListener("click", () => {
    if (!selectedDestination) return;
    dialer.autoDialAddress(selectedDestination, (step, rune) => {
      announce(`Auto-weaving knot ${step + 1} for ${rune.name}.`);
    });
  });

  audioToggleBtn.addEventListener("click", () => {
    const willMute = !sound.isMuted;
    sound.setMuted(willMute);
    audioToggleBtn.setAttribute("aria-pressed", willMute ? "true" : "false");
    audioToggleBtn.textContent = willMute ? "🔇 Unmute Folk Soundscape" : "🔔 Mute Soundscape";
    announce(willMute ? "Folk soundscape muted." : "Folk soundscape unmuted.");
  });

  // Filter tabs for preset catalog
  document.querySelectorAll(".filter-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderPresetCatalog(tab.dataset.category);
    });
  });

  // Keyboard navigation & accessibility for reduced motion
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  function handleReducedMotion(e) {
    const badge = document.getElementById("reduced-motion-indicator");
    if (badge) {
      badge.style.display = e.matches ? "inline-block" : "none";
    }
    document.body.classList.toggle("reduce-motion", e.matches);
  }
  reducedMotionQuery.addEventListener("change", handleReducedMotion);
  handleReducedMotion(reducedMotionQuery);

  // Initial render
  renderManualRunePad();
  renderPresetCatalog("All");
  updateUI(dialer.state, { dialedRunes: [], isInterlocked: false });
  // Select first destination as default preview
  selectDestination(DESTINATIONS[0]);
});
