/**
 * The Grand Vitrarium of Lumisfer - Cathedral Oculus Portal Controller
 * Manages two-stage glass-and-lead locking, 3-stage activation, auto-dial presets, and safety interlock.
 */

document.addEventListener('DOMContentLoaded', () => {
  // App State
  const state = {
    mode: 'IDLE', // IDLE, DIALING, PENDING, BUILDUP, BREAKTHROUGH, ACTIVE, DISENGAGING
    address: [], // Array of glyph IDs (1 to 12), max 7
    isLatchEngaged: false, // Default RELEASED (sanctified)
    activeTimers: [],
    audioMuted: false,
    activePresetId: null
  };

  // DOM Elements
  const scaler = document.getElementById('cathedral-scaler');
  const paletteGrid = document.getElementById('palette-grid');
  const radialLightsGroup = document.getElementById('radial-lights-group');
  const traceryStoneCusps = document.getElementById('tracery-stone-cusps');
  const leadCameWeb = document.getElementById('lead-came-web');
  const vortexGlassShards = document.getElementById('vortex-glass-shards');
  const apertureSealedRosette = document.getElementById('aperture-sealed-rosette');
  const apertureActiveVortex = document.getElementById('aperture-active-vortex');
  const solderSparkLayer = document.getElementById('solder-spark-layer');
  const clerestorySunbeams = document.getElementById('clerestory-sunbeams');
  
  const addressCountIndicator = document.getElementById('address-count-indicator');
  const triforiumLancets = document.getElementById('triforium-lancets');
  const activeGlyphPreview = document.getElementById('active-glyph-preview');
  
  const btnToggleLatch = document.getElementById('btn-toggle-latch');
  const latchStatusBadge = document.getElementById('latch-status-badge');
  const latchBtnLabel = document.getElementById('latch-btn-label');
  const latchWarningText = document.getElementById('latch-warning-text');
  
  const btnActivatePortal = document.getElementById('btn-activate-portal');
  const ignitionSubtitle = document.getElementById('ignition-subtitle');
  const btnDisengage = document.getElementById('btn-disengage');
  
  const presetListTier1 = document.getElementById('preset-list-tier1');
  const presetListTier2 = document.getElementById('preset-list-tier2');
  
  const telemFlux = document.getElementById('telem-flux');
  const telemState = document.getElementById('telem-state');
  const inscriptionText = document.getElementById('inscription-text');
  
  const btnAudioToggle = document.getElementById('btn-audio-toggle');
  const audioIcon = document.getElementById('audio-icon');
  const audioStatusText = document.getElementById('audio-status-text');
  
  const btnOperatorHelp = document.getElementById('btn-operator-help');
  const referenceModal = document.getElementById('reference-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const codexGlyphsTbody = document.getElementById('codex-glyphs-tbody');

  // 1. Initialize Viewport Scaling (Strict 1080p fit & 4K scaling)
  function updateViewportScale() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scale = Math.min(w / 1920, h / 1080);
    document.documentElement.style.setProperty('--scale-factor', scale);
  }
  window.addEventListener('resize', updateViewportScale);
  updateViewportScale();

  // 2. Build Rose Window SVG Geometry
  function initRoseWindowSVG() {
    const numSectors = 12;
    const rInner = 72;
    const rMid = 148;
    const rOuter = 222;

    // A. Build Outer Cusped Trefoil Stonework
    let cuspsHtml = '';
    for (let i = 0; i < numSectors; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const cx = 229 * Math.cos(angle);
      const cy = 229 * Math.sin(angle);
      cuspsHtml += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="7" fill="#24201c" stroke="#38342e" stroke-width="2" />`;
    }
    traceryStoneCusps.innerHTML = cuspsHtml;

    // B. Build 12 Radial Lights (Stained Glass Wedges)
    let lightsHtml = '';
    for (let i = 0; i < numSectors; i++) {
      const startDeg = i * 30 - 90;
      const endDeg = (i + 1) * 30 - 90;
      const startRad = startDeg * (Math.PI / 180);
      const endRad = endDeg * (Math.PI / 180);

      const p1x = rInner * Math.cos(startRad);
      const p1y = rInner * Math.sin(startRad);
      const p2x = rOuter * Math.cos(startRad);
      const p2y = rOuter * Math.sin(startRad);
      const p3x = rOuter * Math.cos(endRad);
      const p3y = rOuter * Math.sin(endRad);
      const p4x = rInner * Math.cos(endRad);
      const p4y = rInner * Math.sin(endRad);

      const pathData = `M ${p1x.toFixed(1)} ${p1y.toFixed(1)} L ${p2x.toFixed(1)} ${p2y.toFixed(1)} A ${rOuter} ${rOuter} 0 0 1 ${p3x.toFixed(1)} ${p3y.toFixed(1)} L ${p4x.toFixed(1)} ${p4y.toFixed(1)} A ${rInner} ${rInner} 0 0 0 ${p1x.toFixed(1)} ${p1y.toFixed(1)} Z`;

      // Midpoint for glyph icon in the light
      const midRad = ((i + 0.5) * 30 - 90) * (Math.PI / 180);
      const iconX = (rMid * Math.cos(midRad)).toFixed(1);
      const iconY = (rMid * Math.sin(midRad)).toFixed(1);

      lightsHtml += `
        <g id="light-group-${i}" class="light-group" data-sector="${i}">
          <path id="light-pane-${i}" class="radial-light-pane unlit" d="${pathData}" />
          <!-- Embedded Glyph Lead Overlay inside the light -->
          <g id="light-glyph-overlay-${i}" class="light-glyph-overlay" transform="translate(${iconX}, ${iconY}) scale(0.32) translate(-50, -50)" style="opacity: 0.15; transition: opacity 0.3s ease;">
            <path id="light-glyph-path-${i}" d="${GLYPHS[i].path}" fill="#333" stroke="#111115" stroke-width="4" />
          </g>
        </g>
      `;
    }
    radialLightsGroup.innerHTML = lightsHtml;

    // C. Build Leaded Came Structural Web (Dark lead outlines)
    let leadWebHtml = '';
    // Radial Mullions
    for (let i = 0; i < numSectors; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x1 = (rInner * Math.cos(angle)).toFixed(1);
      const y1 = (rInner * Math.sin(angle)).toFixed(1);
      const x2 = (rOuter * Math.cos(angle)).toFixed(1);
      const y2 = (rOuter * Math.sin(angle)).toFixed(1);
      leadWebHtml += `<line class="lead-mullion" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;

      // Solder Joint Bosses
      const jx = (rMid * Math.cos(angle)).toFixed(1);
      const jy = (rMid * Math.sin(angle)).toFixed(1);
      leadWebHtml += `<circle class="lead-solder-joint" cx="${jx}" cy="${jy}" r="3.5" />`;
    }
    // Concentric Structural Rings
    leadWebHtml += `<circle class="lead-concentric-ring" cx="0" cy="0" r="${rInner}" />`;
    leadWebHtml += `<circle class="lead-concentric-ring" cx="0" cy="0" r="${rMid}" stroke-dasharray="12 4" />`;
    leadWebHtml += `<circle class="lead-concentric-ring" cx="0" cy="0" r="${rOuter}" />`;
    leadCameWeb.innerHTML = leadWebHtml;

    // D. Build Central Kaleidoscope Shards for Active Aperture
    let shardsHtml = '';
    for (let i = 0; i < 12; i++) {
      const g = GLYPHS[i];
      const ang1 = (i * 30) * (Math.PI / 180);
      const ang2 = ((i + 1) * 30) * (Math.PI / 180);
      const sx = (68 * Math.cos(ang1)).toFixed(1);
      const sy = (68 * Math.sin(ang1)).toFixed(1);
      const ex = (68 * Math.cos(ang2)).toFixed(1);
      const ey = (68 * Math.sin(ang2)).toFixed(1);

      shardsHtml += `
        <polygon points="0,0 ${sx},${sy} ${ex},${ey}" fill="${g.color}" opacity="0.8" stroke="#111115" stroke-width="2" />
      `;
    }
    vortexGlassShards.innerHTML = shardsHtml;

    // E. Solder Spark Ring for lock flashes
    solderSparkLayer.innerHTML = `
      <circle id="solder-spark-ring" class="solder-spark-ring" cx="0" cy="0" r="148" />
    `;
  }

  // 3. Build Artificer's Palette Grid (Cluster 1)
  function initPaletteGrid() {
    paletteGrid.innerHTML = GLYPHS.map(g => `
      <button class="palette-btn" id="glyph-btn-${g.id}" data-id="${g.id}" aria-label="Select Glyph ${g.name}" style="--pane-color: ${g.color}; --pane-glow: ${g.glowColor}; --pane-light-color: ${g.lightColor};">
        <svg class="glyph-svg-icon" viewBox="0 0 100 100">
          <path d="${g.path}" />
        </svg>
        <div class="palette-btn-meta">
          <span class="palette-btn-name">${g.name}</span>
          <span class="palette-btn-latin">${g.latin}</span>
        </div>
      </button>
    `).join('');

    paletteGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.palette-btn');
      if (!btn) return;
      const glyphId = parseInt(btn.dataset.id, 10);
      manualDialGlyph(glyphId);
    });
  }

  // 4. Build Quick-Dial Presets (Tier I & Tier II)
  function initPresets() {
    const tier1 = PRESETS.filter(p => p.tier === 1);
    const tier2 = PRESETS.filter(p => p.tier === 2);

    const renderPresetCard = p => `
      <button class="preset-card-btn" id="${p.id}" data-id="${p.id}" aria-label="Recite Preset ${p.name}">
        <div class="preset-card-header">
          <span class="preset-card-name">${p.name}</span>
          <span class="preset-card-sequence">[${p.sequence.join(' - ')}]</span>
        </div>
        <span class="preset-card-latin">${p.latin}</span>
      </button>
    `;

    presetListTier1.innerHTML = tier1.map(renderPresetCard).join('');
    presetListTier2.innerHTML = tier2.map(renderPresetCard).join('');

    const handlePresetClick = (e) => {
      const btn = e.target.closest('.preset-card-btn');
      if (!btn) return;
      const presetId = btn.dataset.id;
      executeQuickDialPreset(presetId);
    };

    presetListTier1.addEventListener('click', handlePresetClick);
    presetListTier2.addEventListener('click', handlePresetClick);
  }

  // 5. Populate Codex Table in Operator Reference Modal
  function initCodexTable() {
    codexGlyphsTbody.innerHTML = GLYPHS.map(g => `
      <tr>
        <td><strong>${g.id}</strong></td>
        <td><strong>${g.name}</strong></td>
        <td><em>${g.latin}</em></td>
        <td><span class="glyph-color-pip" style="background: ${g.color};"></span>${g.color}</td>
        <td>${g.description}</td>
      </tr>
    `).join('');
  }

  // 6. Two-Stage Glass & Lead Locking Mechanism
  function lockGlyphTwoStage(glyphId, isAutoDial = false, onComplete = null) {
    const glyph = GLYPHS.find(g => g.id === glyphId);
    if (!glyph) return;

    const sectorIndex = glyph.id - 1;
    const lightPane = document.getElementById(`light-pane-${sectorIndex}`);
    const glyphOverlay = document.getElementById(`light-glyph-overlay-${sectorIndex}`);
    const glyphPath = document.getElementById(`light-glyph-path-${sectorIndex}`);
    const paletteBtn = document.getElementById(`glyph-btn-${glyph.id}`);

    const slotIndex = state.address.length;
    state.address.push(glyph.id);

    // Update Triforium slot
    const slotEl = document.getElementById(`slot-${slotIndex}`);
    if (slotEl) {
      slotEl.style.setProperty('--slot-glow', glyph.glowColor);
      slotEl.classList.add('filled');
      const glassEl = slotEl.querySelector('.slot-glass');
      if (glassEl) glassEl.style.backgroundColor = glyph.color;
      const nameEl = slotEl.querySelector('.slot-name');
      if (nameEl) nameEl.textContent = glyph.name;
    }

    if (paletteBtn) paletteBtn.classList.add('locked');
    activeGlyphPreview.textContent = `${glyph.name} (${glyph.latin})`;

    // Stage 1: Glass Tile Seating (Pure Crystalline Chime)
    AudioEngine.playGlassSeat(sectorIndex);
    lightPane.style.setProperty('--pane-glow', glyph.glowColor);
    lightPane.classList.remove('unlit');
    lightPane.classList.add('seating');
    lightPane.style.fill = glyph.color;

    // Stage 2: Lead Came Soldering & Sealing (240ms delay)
    const solderTimer = setTimeout(() => {
      AudioEngine.playLeadSolder(sectorIndex);
      lightPane.classList.remove('seating');
      lightPane.classList.add('locked');

      if (glyphOverlay) {
        glyphOverlay.style.opacity = '1';
        glyphPath.setAttribute('fill', glyph.lightColor);
        glyphPath.style.filter = `drop-shadow(0 0 5px ${glyph.glowColor})`;
      }

      // Spark flash animation
      const sparkRing = document.getElementById('solder-spark-ring');
      if (sparkRing) {
        sparkRing.classList.remove('flash');
        void sparkRing.offsetWidth;
        sparkRing.classList.add('flash');
      }

      updateStatusAndAddress();

      if (onComplete) onComplete();
    }, isAutoDial ? 140 : 240);

    state.activeTimers.push(solderTimer);
  }

  // 7. Manual Dialing Handling
  function manualDialGlyph(glyphId) {
    if (state.mode === 'ACTIVE' || state.mode === 'BUILDUP' || state.mode === 'BREAKTHROUGH') {
      inscriptionText.textContent = "Oculus is currently active. Quench before redialing.";
      return;
    }

    if (state.address.length >= 7) {
      inscriptionText.textContent = "Sevenfold address full. Ignite the sanctified rose or quench the oculus.";
      return;
    }

    if (state.address.includes(glyphId)) {
      inscriptionText.textContent = "This light is already sealed in the current liturgical address.";
      return;
    }

    if (state.mode === 'IDLE') {
      setMode('DIALING');
    }

    lockGlyphTwoStage(glyphId, false, () => {
      if (state.address.length === 7) {
        reachPendingState();
      }
    });
  }

  // 8. Reaching the Pending State (Guaranteed No Auto-Fire)
  function reachPendingState() {
    setMode('PENDING');
    AudioEngine.playSanctifiedPendingChime();
    btnActivatePortal.disabled = false;
    btnActivatePortal.classList.remove('disabled');
    ignitionSubtitle.textContent = "Sanctified & Ready for Ignition";
    inscriptionText.textContent = "Sevenfold alignment achieved. Oculus in PENDING SANCTIFICATION. Awaiting manual ignition.";
  }

  // 9. Quick-Dial Preset Auto-Sequencer (Genuinely Auto-Dialed)
  function executeQuickDialPreset(presetId) {
    if (state.mode === 'BUILDUP' || state.mode === 'BREAKTHROUGH') return;

    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    // Reset current address cleanly first
    quenchOculus(false);

    state.activePresetId = presetId;
    document.querySelectorAll('.preset-card-btn').forEach(b => b.classList.remove('active-dialing'));
    const pBtn = document.getElementById(presetId);
    if (pBtn) pBtn.classList.add('active-dialing');

    setMode('DIALING');
    inscriptionText.textContent = `Chanting Liturgy: Reciting ${preset.name} [${preset.sequence.join('-')}]...`;

    let step = 0;
    function stepNextLight() {
      if (state.mode !== 'DIALING') return;
      if (step >= preset.sequence.length) {
        if (pBtn) pBtn.classList.remove('active-dialing');
        reachPendingState();
        return;
      }

      const glyphId = preset.sequence[step];
      lockGlyphTwoStage(glyphId, true, () => {
        step++;
        const timer = setTimeout(stepNextLight, 180);
        state.activeTimers.push(timer);
      });
    }

    stepNextLight();
  }

  // 10. Activation Lifecycle (3 Explicit Stages)
  function activatePortal() {
    if (state.address.length < 7 || state.mode !== 'PENDING') return;

    // Check Safety Interlock
    if (state.isLatchEngaged) {
      AudioEngine.playBlockedWarning();
      latchWarningText.textContent = "ANATHEMA ENGAGED: Oculus unhallowed! Ignition barred.";
      latchWarningText.style.color = "#fa5575";
      latchWarningText.style.fontWeight = "bold";
      inscriptionText.textContent = "TRANSMISSION BLOCKED: The Chantry Anathema Latch is engaged. Release latch to sanctify.";
      
      btnToggleLatch.classList.add('engaged');
      setTimeout(() => {
        latchWarningText.style.color = "";
        latchWarningText.style.fontWeight = "";
      }, 2000);
      return;
    }

    // Stage 1: BUILDUP (1.8s)
    setMode('BUILDUP');
    btnActivatePortal.disabled = true;
    clerestorySunbeams.className = "clerestory-sunbeams buildup";
    AudioEngine.startBuildupAudio();
    inscriptionText.textContent = "Stage 1: BUILDUP - Clerestory sunbeams piercing the firmament, pipe organ swelling...";

    const breakthroughTimer = setTimeout(() => {
      // Stage 2: BREAKTHROUGH (1.2s)
      setMode('BREAKTHROUGH');
      AudioEngine.playBreakthroughBlast();
      
      apertureSealedRosette.style.opacity = '0';
      apertureActiveVortex.classList.add('active');
      inscriptionText.textContent = "Stage 2: BREAKTHROUGH - Aperture unsealed! Cathedral Great Bell tolls in chromatic blaze!";

      const activeTimer = setTimeout(() => {
        // Stage 3: SUSTAINED ACTIVE
        setMode('ACTIVE');
        AudioEngine.startSustainedActiveDrone();
        clerestorySunbeams.className = "clerestory-sunbeams active";
        btnActivatePortal.disabled = false;
        btnActivatePortal.classList.add('active-transit');
        ignitionSubtitle.textContent = "Sanctuary Conduit Open";
        inscriptionText.textContent = "Stage 3: SUSTAINED ACTIVE - Trans-meridian passage locked in steady celestial equilibrium.";
      }, 1200);

      state.activeTimers.push(activeTimer);
    }, 1800);

    state.activeTimers.push(breakthroughTimer);
  }

  // 11. Disengage / Quench Oculus
  function quenchOculus(playSound = true) {
    // Clear all pending auto-dial or staged activation timers
    state.activeTimers.forEach(t => clearTimeout(t));
    state.activeTimers = [];

    if (playSound && (state.mode !== 'IDLE' || state.address.length > 0)) {
      AudioEngine.playDisengageSound();
    } else {
      AudioEngine.stopDrone();
    }

    state.address = [];
    state.activePresetId = null;
    document.querySelectorAll('.preset-card-btn').forEach(b => b.classList.remove('active-dialing'));

    // Reset Radial Lights in Rose Window
    for (let i = 0; i < 12; i++) {
      const lightPane = document.getElementById(`light-pane-${i}`);
      const glyphOverlay = document.getElementById(`light-glyph-overlay-${i}`);
      const glyphPath = document.getElementById(`light-glyph-path-${i}`);
      if (lightPane) {
        lightPane.className = "radial-light-pane unlit";
        lightPane.style.fill = "";
        lightPane.style.filter = "";
      }
      if (glyphOverlay) {
        glyphOverlay.style.opacity = "0.15";
      }
      if (glyphPath) {
        glyphPath.setAttribute("fill", "#333");
        glyphPath.style.filter = "";
      }
    }

    // Reset Triforium slots
    for (let i = 0; i < 7; i++) {
      const slotEl = document.getElementById(`slot-${i}`);
      if (slotEl) {
        slotEl.className = "triforium-slot";
        const glassEl = slotEl.querySelector('.slot-glass');
        if (glassEl) glassEl.style.backgroundColor = "";
        const nameEl = slotEl.querySelector('.slot-name');
        if (nameEl) nameEl.textContent = "Vacant";
      }
    }

    // Reset Palette buttons
    document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('locked'));

    // Reset Central Aperture & Sunbeams
    apertureSealedRosette.style.opacity = '1';
    apertureActiveVortex.classList.remove('active');
    clerestorySunbeams.className = "clerestory-sunbeams";

    // Reset Ignition Button
    btnActivatePortal.disabled = true;
    btnActivatePortal.classList.remove('active-transit');
    btnActivatePortal.classList.add('disabled');
    ignitionSubtitle.textContent = "Requires 7 Sealed Lumens";

    activeGlyphPreview.textContent = "None Selected";

    setMode('IDLE');
    if (playSound) {
      inscriptionText.textContent = "Oculus quenched. Address cleared. Sanctuary in idle vigil of dawn.";
    }
  }

  // 12. Mode & Status Controller
  function setMode(newMode) {
    state.mode = newMode;
    updateStatusAndAddress();
  }

  function updateStatusAndAddress() {
    addressCountIndicator.textContent = `${state.address.length} / 7 Lumens Sealed`;

    // Update Telemetry
    let fluxVal = "0.00";
    let stateClass = "state-idle";
    let stateLabel = "Idle (Vigil of Dawn)";

    switch (state.mode) {
      case 'IDLE':
        fluxVal = "0.00";
        stateClass = "state-idle";
        stateLabel = "Idle (Vigil of Dawn)";
        break;
      case 'DIALING':
        fluxVal = (state.address.length * 14.28).toFixed(1);
        stateClass = "state-dialing";
        stateLabel = `Dialing (${state.address.length}/7 Sealed)`;
        break;
      case 'PENDING':
        fluxVal = "100.0";
        stateClass = "state-pending";
        stateLabel = "Pending Sanctification";
        break;
      case 'BUILDUP':
        fluxVal = "128.5";
        stateClass = "state-buildup";
        stateLabel = "Stage 1: Buildup";
        break;
      case 'BREAKTHROUGH':
        fluxVal = "144.0";
        stateClass = "state-buildup";
        stateLabel = "Stage 2: Breakthrough";
        break;
      case 'ACTIVE':
        fluxVal = "144.0";
        stateClass = "state-active";
        stateLabel = "Stage 3: Sustained Active";
        break;
    }

    telemFlux.textContent = `${fluxVal} Lumen-Harmonics`;
    telemState.className = `telem-val ${stateClass}`;
    telemState.textContent = stateLabel;
  }

  // 13. Safety Interlock Toggle Handler
  btnToggleLatch.addEventListener('click', () => {
    state.isLatchEngaged = !state.isLatchEngaged;
    AudioEngine.playLatchToggle(state.isLatchEngaged);

    btnToggleLatch.setAttribute('aria-pressed', state.isLatchEngaged);
    if (state.isLatchEngaged) {
      btnToggleLatch.classList.add('engaged');
      latchStatusBadge.className = "interlock-status-badge engaged";
      latchStatusBadge.textContent = "Engaged (Blocked)";
      latchBtnLabel.textContent = "Release Anathema Latch";
      latchWarningText.textContent = "ANATHEMA ENGAGED: Oculus unhallowed - consecration forbidden.";
    } else {
      btnToggleLatch.classList.remove('engaged');
      latchStatusBadge.className = "interlock-status-badge released";
      latchStatusBadge.textContent = "Released (Sanctified)";
      latchBtnLabel.textContent = "Engage Anathema Latch";
      latchWarningText.textContent = "Oculus is sanctified for transit alignment.";
    }
  });

  // 14. Action Controls Event Listeners
  btnActivatePortal.addEventListener('click', activatePortal);
  btnDisengage.addEventListener('click', () => quenchOculus(true));

  // 15. Audio Toggle
  btnAudioToggle.addEventListener('click', () => {
    const isMuted = AudioEngine.toggleMute();
    state.audioMuted = isMuted;
    if (isMuted) {
      audioIcon.textContent = "🔕";
      audioStatusText.textContent = "Silentium";
      btnAudioToggle.classList.add('muted');
    } else {
      audioIcon.textContent = "🔔";
      audioStatusText.textContent = "Vox Sancta";
      btnAudioToggle.classList.remove('muted');
    }
  });

  // 16. Operator Reference Modal
  btnOperatorHelp.addEventListener('click', () => {
    referenceModal.classList.remove('hidden');
  });

  const closeModal = () => referenceModal.classList.add('hidden');
  btnCloseModal.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !referenceModal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // 17. Run Initializers
  initRoseWindowSVG();
  initPaletteGrid();
  initPresets();
  initCodexTable();
  updateStatusAndAddress();
});
