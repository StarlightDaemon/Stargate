/**
 * CAÏSSA NEURAL RECURSION WORKSTATION - MAIN APPLICATION CONTROLLER
 * Coordinates UI, scale engine, pointer events, telemetry, and test hooks.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Scale Engine (1920x1080 Aspect Lock)
  const wrapper = document.getElementById("viewport-wrapper");
  function updateScale() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / 1920, vh / 1080);
    document.documentElement.style.setProperty("--ui-scale", scale);
    window.__CAISSA_COMPUTED_SCALE__ = scale;
    window.__CAISSA_VIEWPORT_DIMS__ = { width: vw, height: vh };
  }
  window.addEventListener("resize", updateScale);
  updateScale();

  // 2. Initialize Search-Tree Ring Renderer
  const ringRenderer = new CaissaRingRenderer("tree-canvas");
  window.ringRendererInstance = ringRenderer;

  // 3. Populate Candidate Move Matrix (Cluster 1)
  const moveMatrixGrid = document.getElementById("move-matrix-grid");
  if (moveMatrixGrid && window.CANDIDATE_MOVES) {
    moveMatrixGrid.innerHTML = "";
    window.CANDIDATE_MOVES.forEach(move => {
      const btn = document.createElement("button");
      btn.className = "candidate-move-btn";
      btn.id = `move-btn-${move.id}`;
      btn.setAttribute("data-move-id", move.id);
      btn.innerHTML = `
        <div class="glyph-symbol">${move.symbol}</div>
        <div class="glyph-notation">${move.shortName}</div>
        <div class="glyph-heuristic">${move.delta}</div>
      `;

      btn.addEventListener("click", (e) => {
        handleMoveSelection(move.id, btn);
      });

      moveMatrixGrid.appendChild(btn);
    });
  }

  // 4. Populate Preset Selector (Cluster 2)
  const presetGrid = document.getElementById("preset-buttons-grid");
  if (presetGrid && window.PRESETS) {
    presetGrid.innerHTML = "";
    window.PRESETS.forEach(preset => {
      const btn = document.createElement("button");
      btn.className = `preset-btn tier-${preset.tier}`;
      btn.id = `preset-btn-${preset.id}`;
      btn.setAttribute("data-preset-id", preset.id);
      btn.innerHTML = `
        <div class="preset-name">${preset.name}</div>
        <div class="preset-tier-tag">${preset.tier === 1 ? "VERIFIED MATE" : "QUANTUM GAMBIT"} (${preset.eval})</div>
      `;

      btn.addEventListener("click", () => {
        handlePresetSelection(preset.id);
      });

      presetGrid.appendChild(btn);
    });
  }

  // 5. Wire Core Action Controls (Commit, Resign, Interlock)
  const commitBtn = document.getElementById("commit-line-btn");
  const resignBtn = document.getElementById("resign-line-btn");
  const interlockControl = document.getElementById("interlock-control");
  const blunderBanner = document.getElementById("blunder-warning-banner");

  if (commitBtn) {
    commitBtn.addEventListener("click", () => {
      handleCommitAction();
    });
  }

  if (resignBtn) {
    resignBtn.addEventListener("click", () => {
      handleResignAction();
    });
  }

  if (interlockControl) {
    interlockControl.addEventListener("click", () => {
      handleInterlockToggle();
    });
  }

  // 6. Operator Reference Modal (? Help)
  const helpBtn = document.getElementById("help-operator-btn");
  const helpModal = document.getElementById("operator-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");

  if (helpBtn && helpModal) {
    helpBtn.addEventListener("click", () => {
      helpModal.classList.add("open");
      if (window.CaissaAudio) window.CaissaAudio.playNotationTick();
    });
  }

  if (closeModalBtn && helpModal) {
    closeModalBtn.addEventListener("click", () => {
      helpModal.classList.remove("open");
    });
  }

  if (helpModal) {
    helpModal.addEventListener("click", (e) => {
      if (e.target === helpModal) {
        helpModal.classList.remove("open");
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && helpModal && helpModal.classList.contains("open")) {
      helpModal.classList.remove("open");
    }
  });

  // 7. Subscribe to Engine State Changes
  if (window.CaissaState) {
    window.CaissaState.subscribe(updateUIFromState);
  }

  // Initial UI Render
  updateUIFromState(window.CaissaState);

  // Shared per-ply lock feedback (audio + ring burst) — used by manual
  // dialing AND by the preset cache replay, so both paths lock identically.
  function playPlyLockFeedback(plyIndex) {
    if (window.CaissaAudio) {
      window.CaissaAudio.playClockPlunge();
      setTimeout(() => window.CaissaAudio.playNotationTick(), 40);
      setTimeout(() => window.CaissaAudio.playConfirmBlip(1.0 + plyIndex * 0.1), 80);
    }
    if (ringRenderer) {
      ringRenderer.triggerPruneBurst(480, 400, "α-cut");
    }
  }

  // Per-ply feedback hook fired by the engine's preset cache replay
  if (window.CaissaState) {
    window.CaissaState.onPresetPlyLocked = (moveId, idx) => {
      playPlyLockFeedback(idx);
    };
  }

  // Core Event Handlers
  function handleMoveSelection(moveId, btnElem) {
    if (!window.CaissaState) return;
    playPlyLockFeedback(window.CaissaState.history.length);
    window.CaissaState.dialMove(moveId);
  }

  function handlePresetSelection(presetId) {
    if (!window.CaissaState) return;
    if (window.CaissaAudio) {
      window.CaissaAudio.playConfirmBlip(1.4);
      setTimeout(() => window.CaissaAudio.playClockPlunge(), 60);
    }
    window.CaissaState.loadPreset(presetId);
  }

  function handleCommitAction() {
    if (!window.CaissaState) return;
    const result = window.CaissaState.commitLine();

    if (!result.success) {
      if (result.reason === "INTERLOCK_ENGAGED") {
        // Show Blunder Warning Banner
        if (blunderBanner) {
          blunderBanner.classList.add("show");
          setTimeout(() => blunderBanner.classList.remove("show"), 3500);
        }
        if (window.CaissaAudio) {
          window.CaissaAudio.playBlunderAlarm();
        }
      } else {
        // Line incomplete
        if (window.CaissaAudio) {
          window.CaissaAudio.playCutoffZap();
        }
      }
    } else {
      if (blunderBanner) {
        blunderBanner.classList.remove("show");
      }
    }
  }

  function handleResignAction() {
    if (blunderBanner) {
      blunderBanner.classList.remove("show");
    }
    if (!window.CaissaState) return;
    window.CaissaState.reset();
  }

  function handleInterlockToggle() {
    if (blunderBanner) {
      blunderBanner.classList.remove("show");
    }
    if (!window.CaissaState) return;
    if (window.CaissaAudio) {
      window.CaissaAudio.playNotationTick();
    }
    window.CaissaState.toggleSafetyInterlock();
  }

  // Update UI Elements based on State
  function updateUIFromState(state) {
    if (!state) return;

    // Status Pill
    const statusPill = document.getElementById("engine-status-pill");
    const statusText = document.getElementById("engine-status-text");
    if (statusText) {
      if (state.status === "IDLE") statusText.textContent = "STANDBY // IDLE";
      else if (state.status === "DIALING") statusText.textContent = `SEARCHING [PLY ${state.history.length}/${window.MAX_PLIES}]`;
      else if (state.status === "LINE_PENDING_COMMIT") statusText.textContent = "READY // PENDING COMMIT";
      else if (state.status === "STAGE_BUILDUP") statusText.textContent = "DEEPENING SEARCH // BUILDUP";
      else if (state.status === "STAGE_BREAKTHROUGH") statusText.textContent = "MATE CONFIRMED // HORIZON OPEN";
      else if (state.status === "STAGE_SUSTAINED") statusText.textContent = "SUSTAINED CONDUIT ACTIVE";
    }

    // Top Telemetry
    const depthVal = document.getElementById("tele-depth-val");
    if (depthVal) depthVal.textContent = `D:${state.currentDepth}`;

    const nodesVal = document.getElementById("tele-nodes-val");
    if (nodesVal) nodesVal.textContent = `${state.currentNodes.toFixed(1)}M/s`;

    // Eval Score Box
    const evalScore = document.getElementById("eval-score-num");
    if (evalScore) {
      if (state.currentEval >= 90) {
        evalScore.textContent = "#M0";
        evalScore.style.color = "var(--accent-emerald)";
      } else if (state.currentEval === 0) {
        evalScore.textContent = "0.00";
        evalScore.style.color = "var(--accent-cyan)";
      } else {
        const sign = state.currentEval > 0 ? "+" : "";
        evalScore.textContent = `${sign}${state.currentEval.toFixed(2)}`;
        evalScore.style.color = state.currentEval >= 0 ? "var(--accent-cyan)" : "var(--accent-crimson)";
      }
    }

    // Eval Bar Fill
    const evalFill = document.getElementById("eval-bar-fill");
    if (evalFill) {
      const clamped = Math.max(-10, Math.min(10, state.currentEval));
      const pct = Math.min(50, Math.abs(clamped) * 5); // 0 to 50%
      if (state.currentEval >= 0) {
        evalFill.classList.remove("negative");
        evalFill.style.width = `${pct}%`;
      } else {
        evalFill.classList.add("negative");
        evalFill.style.width = `${pct}%`;
      }
    }

    // Aperture Center HUD
    const apertureState = document.getElementById("aperture-state-text");
    const apertureNodes = document.getElementById("aperture-nodes-text");
    if (apertureState) {
      if (state.status === "IDLE") apertureState.textContent = "D:32 IDLE";
      else if (state.status === "DIALING") apertureState.textContent = `PLY ${state.history.length}/7`;
      else if (state.status === "LINE_PENDING_COMMIT") apertureState.textContent = "ARMED";
      else if (state.status === "STAGE_BUILDUP") apertureState.textContent = "SURGE";
      else if (state.status === "STAGE_BREAKTHROUGH") apertureState.textContent = "#MATE";
      else if (state.status === "STAGE_SUSTAINED") apertureState.textContent = "PORTAL ON";
    }
    if (apertureNodes) {
      apertureNodes.textContent = `${state.currentNodes.toFixed(1)}M NPS`;
    }

    // Principal Variation Slots
    const pvSlotsContainer = document.getElementById("pv-slots-grid");
    if (pvSlotsContainer) {
      pvSlotsContainer.innerHTML = "";
      for (let i = 0; i < window.MAX_PLIES; i++) {
        const historyItem = state.history[i];
        const isLocked = Boolean(historyItem);
        const isActive = i === state.history.length;

        const slot = document.createElement("div");
        slot.className = `pv-slot ${isLocked ? "locked" : ""} ${isActive ? "active" : ""}`;
        slot.id = `pv-slot-${i + 1}`;
        slot.innerHTML = `
          <div class="ply-num">P${i + 1}</div>
          <div class="move-symbol">${isLocked ? historyItem.move.shortName : "—"}</div>
          <div class="eval-delta">${isLocked ? historyItem.move.delta : "---"}</div>
        `;
        pvSlotsContainer.appendChild(slot);
      }
    }

    // Commit Button State
    if (commitBtn) {
      if (state.status === "LINE_PENDING_COMMIT") {
        commitBtn.classList.add("ready-pulse");
        commitBtn.querySelector(".main-label").textContent = "COMMIT LINE // EXECUTE";
        commitBtn.querySelector(".sub-label").textContent = "FORCED COMBINATION ARMED";
      } else if (state.status === "STAGE_BUILDUP" || state.status === "STAGE_BREAKTHROUGH" || state.status === "STAGE_SUSTAINED") {
        commitBtn.classList.remove("ready-pulse");
        commitBtn.querySelector(".main-label").textContent = "LINE COMMITTED";
        commitBtn.querySelector(".sub-label").textContent = "GATEWAY ENGAGED";
      } else {
        commitBtn.classList.remove("ready-pulse");
        commitBtn.querySelector(".main-label").textContent = "COMMIT LINE";
        commitBtn.querySelector(".sub-label").textContent = `${state.history.length}/${window.MAX_PLIES} PLIES DIALED`;
      }
    }

    // Safety Interlock UI
    if (interlockControl) {
      const statusLabel = document.getElementById("interlock-status-label");
      if (state.blunderCheckHold) {
        interlockControl.classList.add("engaged");
        interlockControl.classList.remove("released");
        if (statusLabel) statusLabel.textContent = "ENGAGED (HOLD)";
      } else {
        interlockControl.classList.remove("engaged");
        interlockControl.classList.add("released");
        if (statusLabel) statusLabel.textContent = "RELEASED (SAFE)";
      }
    }

    // Candidate Buttons Active Highlight
    const candidateBtns = document.querySelectorAll(".candidate-move-btn");
    candidateBtns.forEach(btn => {
      const moveId = btn.getAttribute("data-move-id");
      const isSelected = state.history.some(h => h.move.id === moveId);
      if (isSelected) {
        btn.classList.add("selected");
      } else {
        btn.classList.remove("selected");
      }
    });

    // Preset Buttons Active Highlight
    const presetBtns = document.querySelectorAll(".preset-btn");
    presetBtns.forEach(btn => {
      const pId = btn.getAttribute("data-preset-id");
      if (state.activePresetId === pId) {
        btn.style.borderColor = "var(--accent-cyan)";
        btn.style.boxShadow = "0 0 12px rgba(0, 240, 255, 0.4)";
      } else {
        btn.style.borderColor = "";
        btn.style.boxShadow = "";
      }
    });

    // Activation Overlays & Shockwaves
    const overlay = document.getElementById("activation-stage-overlay");
    if (overlay) {
      overlay.className = "";
      if (state.status === "STAGE_BUILDUP") {
        overlay.classList.add("stage-buildup");
      } else if (state.status === "STAGE_BREAKTHROUGH") {
        overlay.classList.add("stage-breakthrough");
        if (ringRenderer) {
          ringRenderer.triggerBreakthroughShockwave();
        }
      } else if (state.status === "STAGE_SUSTAINED") {
        overlay.classList.add("stage-sustained");
      }
    }
  }
});
