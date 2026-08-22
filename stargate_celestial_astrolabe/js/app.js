/**
 * App - Main Controller & Navigation Console Interface
 * Hyperion Astronavigation Institute // Series IX Digital Astrolabe
 */

function initApp() {
  // Initialize Core Engines
  const audio = new CelestialAudio();
  const navEngine = new NavigationEngine();

  const astrolabeCanvas = document.getElementById('astrolabe-canvas');
  const astrolabe = new DigitalAstrolabe(astrolabeCanvas, audio, navEngine);

  // App State
  let systemState = 'idle'; // 'idle' | 'pending' | 'buildup' | 'breakthrough' | 'active'
  let autoDialInterval = null;
  let activeTab = 'horizon-tab';

  // DOM Elements
  const starButtonsContainer = document.getElementById('star-buttons-container');
  const quickDialContainer = document.getElementById('quick-dial-container');
  const activeSightsList = document.getElementById('active-sights-list');
  const sightingCountEl = document.getElementById('sighting-count');
  const fixConfidenceEl = document.getElementById('fix-confidence');
  const interceptResidualEl = document.getElementById('intercept-residual');
  const dopEl = document.getElementById('dop-val');
  const latCoordEl = document.getElementById('lat-coord');
  const lonCoordEl = document.getElementById('lon-coord');
  const headingEl = document.getElementById('heading-val');
  const siderealClockEl = document.getElementById('sidereal-clock');
  const gateStatusBanner = document.getElementById('gate-status-banner');
  const gateStatusText = document.getElementById('gate-status-text');
  const btnActuate = document.getElementById('btn-actuate');
  const btnDisengage = document.getElementById('btn-disengage');
  const interlockToggle = document.getElementById('interlock-toggle');
  const interlockWarning = document.getElementById('interlock-warning');
  const operatorModal = document.getElementById('operator-modal');
  const btnHelp = document.getElementById('btn-help');
  const btnCloseModal = document.getElementById('btn-close-modal');

  // Secondary Panel Canvases
  const horizonCanvas = document.getElementById('horizon-canvas');
  const drCanvas = document.getElementById('dr-canvas');
  let horizonCtx = horizonCanvas ? horizonCanvas.getContext('2d') : null;
  let drCtx = drCanvas ? drCanvas.getContext('2d') : null;

  // Audio Unlock on First Interaction
  const unlockAudio = () => {
    audio.ensureContext();
    document.removeEventListener('pointerdown', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  };
  document.addEventListener('pointerdown', unlockAudio);
  document.addEventListener('keydown', unlockAudio);

  // 1. POPULATE 12 NAVIGATIONAL STAR SELECTION BUTTONS
  function renderStarButtons() {
    starButtonsContainer.innerHTML = '';
    NAV_STARS.forEach((star) => {
      const btn = document.createElement('button');
      btn.className = 'star-select-btn';
      btn.id = `star-btn-${star.index}`;
      btn.dataset.starId = star.id;
      btn.dataset.starIndex = star.index;

      const isSelected = navEngine.isSightSelected(star.id);
      if (isSelected) btn.classList.add('selected');

      btn.innerHTML = `
        <div class="star-btn-indicator"></div>
        <div class="star-btn-info">
          <div class="star-btn-title">
            <span class="star-name">${star.name}</span>
            <span class="star-bayer">${star.bayer}</span>
          </div>
          <div class="star-btn-meta">
            <span>MAG ${star.mag >= 0 ? '+' : ''}${star.mag.toFixed(2)}</span>
            <span>ALT ${star.targetAlt.toFixed(1)}°</span>
            <span>AZ ${star.targetAz.toFixed(1)}°</span>
          </div>
        </div>
        <div class="star-btn-lock-badge">${isSelected ? 'LOCKED' : 'SIGHT'}</div>
      `;

      btn.addEventListener('click', () => {
        handleStarClick(star);
      });

      starButtonsContainer.appendChild(btn);
    });
  }

  function handleStarClick(star) {
    if (systemState === 'buildup' || systemState === 'breakthrough') return;

    audio.playSightSelect(star.index);
    navEngine.toggleSight(star);

    // Rotate astrolabe Rete to align this star
    astrolabe.rotateToStar(star);

    updateUI();
  }

  // 2. POPULATE QUICK-DIAL PRESETS (6 PRESETS across 2 TIERS)
  function renderQuickDialPresets() {
    quickDialContainer.innerHTML = '';

    // Group by Tier
    const tier1 = QUICK_DIAL_PRESETS.filter(p => p.tier === 1);
    const tier2 = QUICK_DIAL_PRESETS.filter(p => p.tier === 2);

    const renderTierGroup = (title, presets, tierClass) => {
      const groupEl = document.createElement('div');
      groupEl.className = `quick-dial-group ${tierClass}`;
      groupEl.innerHTML = `<div class="tier-header">${title}</div>`;

      const listEl = document.createElement('div');
      listEl.className = 'quick-dial-list';

      presets.forEach(p => {
        const item = document.createElement('button');
        item.className = 'quick-dial-item';
        item.id = `preset-${p.id}`;
        item.innerHTML = `
          <div class="preset-top">
            <span class="preset-name">${p.name}</span>
            <span class="preset-dist">${p.distanceLy}</span>
          </div>
          <div class="preset-dest">${p.destination} [${p.epoch}]</div>
        `;

        item.addEventListener('click', () => {
          triggerQuickDial(p);
        });

        listEl.appendChild(item);
      });

      groupEl.appendChild(listEl);
      quickDialContainer.appendChild(groupEl);
    };

    renderTierGroup('TIER 1: VERIFIED & LOGGED FIXES', tier1, 'tier-1-group');
    renderTierGroup('TIER 2: PROVISIONAL / DEEP SIGHTINGS', tier2, 'tier-2-group');
  }

  // QUICK-DIAL SEQUENTIAL AUTO-DIALER
  // Genuinely auto-dials star-by-star (~300ms per star) with real Rete motion
  // Lands in PENDING ready state without auto-firing!
  function triggerQuickDial(preset) {
    if (systemState === 'buildup' || systemState === 'breakthrough') return;

    if (autoDialInterval) {
      clearInterval(autoDialInterval);
      autoDialInterval = null;
    }

    // Reset sights first
    navEngine.clearSights();
    updateUI();

    let step = 0;
    const address = preset.fixAddress; // 7 star indices

    gateStatusBanner.className = 'status-banner sequencing';
    gateStatusText.textContent = `REPLAYING ARCHIVED SIGHTING LOG: ${preset.name.toUpperCase()}...`;

    autoDialInterval = setInterval(() => {
      if (step >= address.length) {
        clearInterval(autoDialInterval);
        autoDialInterval = null;
        updateUI();
        return;
      }

      const starIndex = address[step];
      const star = NAV_STARS[starIndex];
      navEngine.toggleSight(star);
      astrolabe.rotateToStar(star);
      audio.playSightSelect(starIndex);

      step++;
      updateUI();
    }, 320);
  }

  // 3. EPHEMERIS VERIFICATION INTERLOCK (SAFETY SWITCH)
  interlockToggle.addEventListener('change', (e) => {
    const isEngaged = e.target.checked;
    navEngine.setEphemerisHold(isEngaged);
    audio.playInterlockClick(isEngaged);
    updateUI();
  });

  // 4. THREE-STAGE GATEWAY ACTUATION CONTROLLER
  btnActuate.addEventListener('click', () => {
    // Check if sights complete
    if (!navEngine.isReadyForActuation()) return;

    // Check if blocked by Safety Interlock
    if (navEngine.isActuationBlockedByInterlock()) {
      interlockWarning.classList.add('active');
      audio.playDataChirp();
      setTimeout(() => {
        interlockWarning.classList.remove('active');
      }, 3500);
      return;
    }

    if (systemState === 'pending' || systemState === 'idle') {
      startStagedActivation();
    }
  });

  function startStagedActivation() {
    systemState = 'buildup';
    astrolabe.setPortalState('buildup', 0);
    audio.playBuildupRiser(1.8);

    btnActuate.disabled = true;
    btnActuate.className = 'btn-primary-action buildup';
    btnActuate.innerHTML = `
      <span class="btn-glow-ring"></span>
      <span class="btn-text">WARP FIELD CONVERGING... [STAGE 1/3]</span>
    `;

    gateStatusBanner.className = 'status-banner buildup';
    gateStatusText.textContent = 'STAGE 1: GIMBAL ACCELERATION & POSITION CONVERGENCE...';

    const startTime = performance.now();
    const buildupDuration = 1800; // 1.8 seconds

    const buildupTimer = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1.0, elapsed / buildupDuration);
      astrolabe.buildupProgress = progress;

      if (progress >= 1.0) {
        clearInterval(buildupTimer);
        triggerBreakthrough();
      }
    }, 30);
  }

  function triggerBreakthrough() {
    systemState = 'breakthrough';
    astrolabe.setPortalState('breakthrough');
    audio.playBreakthrough();

    btnActuate.className = 'btn-primary-action breakthrough';
    btnActuate.innerHTML = `
      <span class="btn-glow-ring"></span>
      <span class="btn-text">OPTICAL SINGULARITY RESOLVED! [STAGE 2/3]</span>
    `;

    gateStatusBanner.className = 'status-banner breakthrough';
    gateStatusText.textContent = 'STAGE 2: BREAKTHROUGH — STELLAR IRIS DILATING...';

    setTimeout(() => {
      triggerSustainedActive();
    }, 850);
  }

  function triggerSustainedActive() {
    systemState = 'active';
    astrolabe.setPortalState('sustained');
    audio.startSustainedPortal();

    btnActuate.disabled = false;
    btnActuate.className = 'btn-primary-action active';
    btnActuate.innerHTML = `
      <span class="btn-glow-ring"></span>
      <span class="btn-text">CONDUIT STABILIZED // GATEWAY OPEN</span>
    `;

    gateStatusBanner.className = 'status-banner active';
    gateStatusText.textContent = 'STAGE 3: SUSTAINED ACTIVE — TRANSIT CONDUIT LOCKED TO FIX COORDINATES';

    updateUI();
  }

  // 5. EMERGENCY DISENGAGE CONTROLLER
  btnDisengage.addEventListener('click', () => {
    handleDisengage();
  });

  function handleDisengage() {
    if (autoDialInterval) {
      clearInterval(autoDialInterval);
      autoDialInterval = null;
    }

    audio.playDisengage();
    astrolabe.setPortalState('idle');

    systemState = 'idle';
    navEngine.clearSights();

    btnActuate.className = 'btn-primary-action';
    btnActuate.innerHTML = `
      <span class="btn-glow-ring"></span>
      <span class="btn-text">INITIATE STELLAR GATEWAY ACTUATION</span>
    `;

    gateStatusBanner.className = 'status-banner idle';
    gateStatusText.textContent = 'STATUS: STANDBY // GIMBAL STABILIZED // AWAITING STELLAR SIGHTS';

    updateUI();
  }

  // 6. UI UPDATE & RECOMPUTE
  function updateUI() {
    const selected = navEngine.selectedSights;
    const count = selected.length;
    const isComplete = count === navEngine.fixLength;

    // Update Star Buttons
    NAV_STARS.forEach((star) => {
      const btn = document.getElementById(`star-btn-${star.index}`);
      if (btn) {
        const isSel = navEngine.isSightSelected(star.id);
        btn.classList.toggle('selected', isSel);
        const badge = btn.querySelector('.star-btn-lock-badge');
        if (badge) badge.textContent = isSel ? 'LOCKED' : 'SIGHT';
      }
    });

    // Update Active Sights List
    activeSightsList.innerHTML = '';
    if (selected.length === 0) {
      activeSightsList.innerHTML = '<div class="no-sights-prompt">No stellar sightings recorded. Select 7 navigational stars to compute position fix.</div>';
    } else {
      selected.forEach((star, i) => {
        const item = document.createElement('div');
        item.className = 'sight-chip';
        item.innerHTML = `
          <span class="chip-num">#${i + 1}</span>
          <span class="chip-name">${star.name}</span>
          <span class="chip-alt">${star.targetAlt.toFixed(1)}° ALT</span>
          <button class="chip-remove" title="Deselect">×</button>
        `;
        item.querySelector('.chip-remove').addEventListener('click', (e) => {
          e.stopPropagation();
          handleStarClick(star);
        });
        activeSightsList.appendChild(item);
      });
    }

    // Telemetry Readouts
    sightingCountEl.textContent = `${count} / ${navEngine.fixLength}`;
    const coords = navEngine.formatCoordinates();
    fixConfidenceEl.textContent = coords.confidenceStr;
    interceptResidualEl.textContent = coords.residualStr;
    dopEl.textContent = coords.dopStr;
    latCoordEl.textContent = coords.latStr;
    lonCoordEl.textContent = coords.lonStr;
    headingEl.textContent = coords.headingStr;

    // Actuate Button States
    if (systemState === 'idle' || systemState === 'pending') {
      if (isComplete) {
        systemState = 'pending';
        btnActuate.disabled = false;
        btnActuate.classList.add('ready');
        gateStatusBanner.className = 'status-banner pending';
        gateStatusText.textContent = '7/7 SIGHTINGS RESOLVED // FIX SOLUTION CONVERGED // READY FOR TRANSIT';
      } else {
        systemState = 'idle';
        btnActuate.disabled = true;
        btnActuate.classList.remove('ready');
        if (!gateStatusBanner.classList.contains('sequencing')) {
          gateStatusBanner.className = 'status-banner idle';
          gateStatusText.textContent = `STATUS: SIGHTING IN PROGRESS (${count}/7 STARS ALIGNED)`;
        }
      }
    }
  }

  // 7. CLOCKS & LIVE TELEMETRY LOOP
  function startTelemetryClocks() {
    setInterval(() => {
      // Advance sidereal time
      const d = new Date();
      const h = (d.getUTCHours() + 4) % 24;
      const m = d.getUTCMinutes();
      const s = d.getUTCSeconds();
      const ms = Math.floor(d.getUTCMilliseconds() / 100);
      const str = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms} CST`;
      siderealClockEl.textContent = str;

      // Update dead reckoning
      navEngine.updateDR(0.25);
      if (activeTab === 'horizon-tab') {
        renderHorizonView();
      } else if (activeTab === 'dr-tab') {
        renderDeadReckoningView();
      }
    }, 250);
  }

  // 8. SECONDARY VIEWS: TAB SWITCHING
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');

      activeTab = targetId;
      if (activeTab === 'horizon-tab') renderHorizonView();
      if (activeTab === 'dr-tab') renderDeadReckoningView();
    });
  });

  // 9. HORIZON SKY-DOME CANVAS RENDERER (Tab 1)
  function renderHorizonView() {
    if (!horizonCanvas || !horizonCtx) return;
    const rect = horizonCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width > 0 ? rect.width : 320;
    const h = rect.height > 0 ? rect.height : 160;
    horizonCanvas.width = Math.floor(w * dpr);
    horizonCanvas.height = Math.floor(h * dpr);
    horizonCtx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;
    const r = Math.max(20, Math.min(cx, cy) * 0.88);

    horizonCtx.clearRect(0, 0, w, h);

    // Sky Dome Circle
    horizonCtx.fillStyle = '#030814';
    horizonCtx.beginPath();
    horizonCtx.arc(cx, cy, r, 0, Math.PI * 2);
    horizonCtx.fill();

    // Altitude Rings (Horizon 0°, 30°, 60°)
    [0, 30, 60].forEach(alt => {
      const ringR = Math.max(5, r * (1 - alt / 90));
      horizonCtx.beginPath();
      horizonCtx.arc(cx, cy, ringR, 0, Math.PI * 2);
      horizonCtx.strokeStyle = alt === 0 ? 'rgba(0, 240, 255, 0.4)' : 'rgba(0, 240, 255, 0.15)';
      horizonCtx.stroke();
    });

    // Cardinal Points
    const cardinals = [
      { label: 'N (000°)', angle: -Math.PI / 2 },
      { label: 'E (090°)', angle: 0 },
      { label: 'S (180°)', angle: Math.PI / 2 },
      { label: 'W (270°)', angle: Math.PI }
    ];
    cardinals.forEach(c => {
      horizonCtx.font = '9px "Orbitron", sans-serif';
      horizonCtx.fillStyle = '#00f0ff';
      horizonCtx.textAlign = 'center';
      horizonCtx.textBaseline = 'middle';
      const lx = cx + Math.cos(c.angle) * (r + 14);
      const ly = cy + Math.sin(c.angle) * (r + 14);
      horizonCtx.fillText(c.label, lx, ly);
    });

    // Plot Navigational Stars in Sky Dome
    NAV_STARS.forEach(star => {
      const isSel = navEngine.isSightSelected(star.id);
      const azRad = ((star.targetAz - 90) * Math.PI) / 180;
      const altFactor = 1 - (star.targetAlt / 90);
      const starR = r * altFactor;
      const sx = cx + Math.cos(azRad) * starR;
      const sy = cy + Math.sin(azRad) * starR;

      horizonCtx.beginPath();
      horizonCtx.arc(sx, sy, isSel ? 4.5 : 2.5, 0, Math.PI * 2);
      horizonCtx.fillStyle = isSel ? '#ffaa00' : (star.color || '#00f0ff');
      horizonCtx.fill();

      if (isSel) {
        horizonCtx.strokeStyle = '#00f0ff';
        horizonCtx.lineWidth = 1;
        horizonCtx.beginPath();
        horizonCtx.arc(sx, sy, 8, 0, Math.PI * 2);
        horizonCtx.stroke();
      }

      horizonCtx.font = '8px "JetBrains Mono", monospace';
      horizonCtx.fillStyle = isSel ? '#ffdd88' : 'rgba(200, 230, 255, 0.6)';
      horizonCtx.fillText(star.name, sx + 7, sy - 4);
    });
  }

  // 10. DEAD-RECKONING & DRIFT PLOTTER CANVAS RENDERER (Tab 2)
  function renderDeadReckoningView() {
    if (!drCanvas || !drCtx) return;
    const rect = drCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    drCanvas.width = rect.width * dpr;
    drCanvas.height = rect.height * dpr;
    drCtx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    drCtx.clearRect(0, 0, w, h);

    // Background Grid
    drCtx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
    drCtx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      drCtx.beginPath(); drCtx.moveTo(x, 0); drCtx.lineTo(x, h); drCtx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      drCtx.beginPath(); drCtx.moveTo(0, y); drCtx.lineTo(w, y); drCtx.stroke();
    }

    // Plot Track Points
    const pts = navEngine.drTrackPoints;
    if (pts.length > 1) {
      drCtx.beginPath();
      drCtx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
      drCtx.lineWidth = 1.8;
      pts.forEach((p, i) => {
        const px = 40 + (i / pts.length) * (w - 80);
        const py = h / 2 + (p.lat - navEngine.baseLatitude) * 600;
        if (i === 0) drCtx.moveTo(px, py);
        else drCtx.lineTo(px, py);
      });
      drCtx.stroke();

      // Fix Nodes
      pts.forEach((p, i) => {
        if (p.isFix) {
          const px = 40 + (i / pts.length) * (w - 80);
          const py = h / 2 + (p.lat - navEngine.baseLatitude) * 600;
          drCtx.fillStyle = '#ffaa00';
          drCtx.beginPath();
          drCtx.arc(px, py, 4, 0, Math.PI * 2);
          drCtx.fill();
        }
      });
    }

    // Current Vessel Node with Drift Error Ellipse
    const cx = w - 40;
    const cy = h / 2 + (navEngine.drLatitude - navEngine.baseLatitude) * 600;

    // Error Ellipse
    const errRadius = Math.max(8, parseFloat(navEngine.interceptResidual) * 3);
    drCtx.beginPath();
    drCtx.ellipse(cx, cy, errRadius * 1.5, errRadius, Math.PI / 4, 0, Math.PI * 2);
    drCtx.strokeStyle = 'rgba(255, 51, 102, 0.7)';
    drCtx.setLineDash([3, 3]);
    drCtx.stroke();
    drCtx.setLineDash([]);

    // Vessel Pointer
    drCtx.fillStyle = '#00f0ff';
    drCtx.beginPath();
    drCtx.arc(cx, cy, 5, 0, Math.PI * 2);
    drCtx.fill();

    drCtx.font = '9px "JetBrains Mono", monospace';
    drCtx.fillStyle = '#00f0ff';
    drCtx.fillText('R/V TETHYS-V [ESTIMATED DR]', cx - 120, cy - 12);
  }

  // 11. ASTROMETRIC EPHEMERIS ALMANAC (Tab 3)
  const almanacSearchInput = document.getElementById('almanac-search-input');
  const almanacCategoryFilter = document.getElementById('almanac-category-filter');
  const almanacTableBody = document.getElementById('almanac-table-body');

  function renderAlmanacTable() {
    if (!almanacTableBody) return;
    const query = (almanacSearchInput ? almanacSearchInput.value : '').toLowerCase();
    const cat = almanacCategoryFilter ? almanacCategoryFilter.value : 'all';

    const filtered = EXTENDED_ALMANAC.filter(item => {
      const matchQuery = item.name.toLowerCase().includes(query) ||
                         item.designation.toLowerCase().includes(query) ||
                         item.bayer.toLowerCase().includes(query);
      const matchCat = cat === 'all' || item.category === cat;
      return matchQuery && matchCat;
    });

    almanacTableBody.innerHTML = '';
    filtered.forEach(star => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="col-name"><span class="star-dot" style="background:${star.color}"></span> ${star.name}</td>
        <td>${star.designation}</td>
        <td>${star.bayer}</td>
        <td>${star.spectral}</td>
        <td>${star.mag >= 0 ? '+' : ''}${star.mag.toFixed(2)}</td>
        <td>${star.ra}</td>
        <td>${star.dec}</td>
        <td>${star.targetAlt.toFixed(1)}°</td>
        <td><span class="cat-pill">${star.category}</span></td>
      `;
      almanacTableBody.appendChild(tr);
    });
  }

  if (almanacSearchInput) almanacSearchInput.addEventListener('input', renderAlmanacTable);
  if (almanacCategoryFilter) almanacCategoryFilter.addEventListener('change', renderAlmanacTable);

  // 12. GIMBAL & SETTINGS CONTROLS (Tab 4)
  const volumeSlider = document.getElementById('volume-slider');
  const muteCheck = document.getElementById('mute-check');
  const scanlinesCheck = document.getElementById('scanlines-check');
  const crtOverlay = document.getElementById('crt-overlay');

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      audio.setMasterVolume(parseFloat(e.target.value));
    });
  }
  if (muteCheck) {
    muteCheck.addEventListener('change', (e) => {
      audio.setMute(e.target.checked);
    });
  }
  if (scanlinesCheck && crtOverlay) {
    scanlinesCheck.addEventListener('change', (e) => {
      crtOverlay.style.display = e.target.checked ? 'block' : 'none';
    });
  }

  // 13. OPERATOR REFERENCE MODAL
  btnHelp.addEventListener('click', () => {
    operatorModal.classList.add('active');
  });
  btnCloseModal.addEventListener('click', () => {
    operatorModal.classList.remove('active');
  });
  operatorModal.addEventListener('click', (e) => {
    if (e.target === operatorModal) operatorModal.classList.remove('active');
  });

  // Initialize all components
  renderStarButtons();
  renderQuickDialPresets();
  renderAlmanacTable();
  updateUI();
  startTelemetryClocks();

  // Initial resize
  setTimeout(() => {
    astrolabe.resize();
    renderHorizonView();
    renderDeadReckoningView();
  }, 100);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
