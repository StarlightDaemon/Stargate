/**
 * ISTITUTO DINAMICO DI PROPULSIONE E TRASLAZIONE (IDPT)
 * Main Application Coordinator & UI Wire Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Viewport Scale Calculation for 1920x1080 Native Scaling up to 4K
  function updateViewportScale() {
    const root = document.getElementById('viewport-root');
    if (!root) return;
    const scaleX = window.innerWidth / 1920;
    const scaleY = window.innerHeight / 1080;
    const scale = Math.min(scaleX, scaleY);
    document.documentElement.style.setProperty('--ui-scale', scale.toFixed(4));
    console.log(`[ViewportScale] Window: ${window.innerWidth}x${window.innerHeight} -> Scale: ${scale.toFixed(4)}`);
  }

  window.addEventListener('resize', updateViewportScale);
  updateViewportScale();

  // 2. Audio Context Initialization on first user interaction
  const unlockAudio = () => {
    if (window.idptAudio) {
      window.idptAudio.ensureContext();
    }
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  // 3. Stator Selection Buttons (Left Panel Cluster 1)
  const statorsGrid = document.getElementById('stators-grid');
  if (statorsGrid && window.STATOR_DEFINITIONS) {
    statorsGrid.innerHTML = window.STATOR_DEFINITIONS.map(def => `
      <button class="stator-btn" id="stator-btn-${def.index}" data-index="${def.index}">
        <span class="stator-code">${def.code}</span>
        <div style="display:flex; flex-direction:column; align-items:flex-start;">
          <span class="stator-name">${def.name}</span>
          <span class="stator-angle">${def.angle}° ROT</span>
        </div>
      </button>
    `).join('');

    statorsGrid.querySelectorAll('.stator-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        window.idptGate.selectStator(idx);
      });
    });
  }

  // 4. Stator Nodes on Central SVG Ring
  const svgStatorsGroup = document.getElementById('svg-stators-group');
  if (svgStatorsGroup && window.STATOR_DEFINITIONS) {
    const cx = 290, cy = 290, radius = 232;
    svgStatorsGroup.innerHTML = window.STATOR_DEFINITIONS.map(def => {
      const rad = (def.angle - 90) * (Math.PI / 180);
      const nx = cx + radius * Math.cos(rad);
      const ny = cy + radius * Math.sin(rad);
      return `
        <g class="ring-stator-node" id="ring-node-${def.index}" data-index="${def.index}" transform="translate(${nx}, ${ny})">
          <circle class="stator-glyph-bg" r="16" />
          <text class="stator-glyph-icon" text-anchor="middle" dy="4" font-family="'Syne', sans-serif" font-weight="900" font-size="10">${def.code}</text>
        </g>
      `;
    }).join('');

    svgStatorsGroup.querySelectorAll('.ring-stator-node').forEach(node => {
      node.addEventListener('click', () => {
        const idx = parseInt(node.getAttribute('data-index'), 10);
        window.idptGate.selectStator(idx);
      });
    });
  }

  // 5. Reset Dial Button
  const resetBtn = document.getElementById('btn-reset-dial');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      window.idptGate.resetDial();
    });
  }

  // 6. Actuation Lever (Right Panel Cluster 2)
  const actuateBtn = document.getElementById('btn-actuate-lever');
  if (actuateBtn) {
    actuateBtn.addEventListener('click', () => {
      window.idptGate.actuate();
    });
  }

  // 7. Disengage Brake
  const disengageBtn = document.getElementById('btn-disengage-brake');
  if (disengageBtn) {
    disengageBtn.addEventListener('click', () => {
      window.idptGate.disengage();
    });
  }

  // 8. Governor Interlock Toggle
  const governorBtn = document.getElementById('btn-governor-toggle');
  if (governorBtn) {
    governorBtn.addEventListener('click', () => {
      window.idptGate.toggleGovernor();
    });
  }

  // 9. Quick-Dial Presets Tiers & Rendering
  let activePresetTier = 'tier1';
  function renderPresets() {
    const listEl = document.getElementById('preset-list');
    if (!listEl || !window.PRESET_TIERS) return;
    const presets = window.PRESET_TIERS[activePresetTier] || [];
    listEl.innerHTML = presets.map(p => `
      <div class="preset-card" data-preset-id="${p.id}" role="button" tabindex="0">
        <div class="preset-info">
          <span class="preset-name">${p.name}</span>
          <span class="preset-route">${p.route}</span>
        </div>
        <span class="preset-vector-preview">[${p.vector.join('-')}]</span>
      </div>
    `).join('');

    listEl.querySelectorAll('.preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const pId = card.getAttribute('data-preset-id');
        const preset = presets.find(p => p.id === pId);
        if (preset) {
          window.idptGate.autoDialPreset(preset);
        }
      });
      // Keyboard: Enter/Space on a focused card does exactly what a click does.
      card.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        card.click();
      });
    });
  }

  const tierBtns = document.querySelectorAll('.tier-tab-btn');
  tierBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tierBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activePresetTier = btn.getAttribute('data-tier');
      renderPresets();
    });
  });
  renderPresets();

  // 10. Modal Management (Archive, Blueprint, Settings, Help, Logs)
  const modals = {
    archive: document.getElementById('modal-archive'),
    blueprint: document.getElementById('modal-blueprint'),
    telemetry: document.getElementById('modal-telemetry'),
    settings: document.getElementById('modal-settings'),
    help: document.getElementById('modal-help'),
    logs: document.getElementById('modal-logs')
  };

  function openModal(name) {
    closeAllModals();
    if (modals[name]) {
      modals[name].classList.add('open');
      if (window.idptAudio) window.idptAudio.playClick();
      if (name === 'archive') renderArchiveList();
      if (name === 'logs') renderSessionLog();
    }
  }

  function closeAllModals() {
    Object.values(modals).forEach(m => {
      if (m) m.classList.remove('open');
    });
  }

  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalName = btn.getAttribute('data-open-modal');
      openModal(modalName);
    });
  });

  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals();
    });
  });

  // Top-Right Reference '?' Button
  const helpBtn = document.getElementById('btn-help-ref');
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      openModal('help');
    });
  }

  // 11. Relational Archive Browser Logic
  let activeArchiveCategory = 'all';
  let activeArchiveSearch = '';
  let activeDossierId = 'VR-1913-A';

  function renderArchiveList() {
    const listEl = document.getElementById('archive-items-list');
    if (!listEl || !window.ARCHIVE_DATABASE) return;

    let items = window.ARCHIVE_DATABASE;
    if (activeArchiveCategory !== 'all') {
      items = items.filter(it => it.category === activeArchiveCategory);
    }
    if (activeArchiveSearch.trim()) {
      const q = activeArchiveSearch.toLowerCase();
      items = items.filter(it => 
        it.title.toLowerCase().includes(q) || 
        it.id.toLowerCase().includes(q) || 
        it.summary.toLowerCase().includes(q)
      );
    }

    listEl.innerHTML = items.map(it => `
      <div class="archive-entry-item ${it.id === activeDossierId ? 'active' : ''}" data-entry-id="${it.id}" role="button" tabindex="0">
        <span class="entry-code">${it.id} &bull; ${it.categoryName}</span>
        <div class="entry-title">${it.title}</div>
      </div>
    `).join('');

    listEl.querySelectorAll('.archive-entry-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-entry-id');
        showDossier(id);
      });
      // Keyboard: Enter/Space on a focused entry does exactly what a click does.
      el.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        el.click();
      });
    });

    showDossier(activeDossierId);
  }

  function showDossier(id) {
    activeDossierId = id;
    const doc = window.ARCHIVE_DATABASE.find(d => d.id === id);
    const pane = document.getElementById('archive-dossier-view');
    if (!doc || !pane) return;

    // Highlight in list
    document.querySelectorAll('.archive-entry-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-entry-id') === id);
    });

    // Mark as unlocked in persistent state
    if (window.idptState) {
      window.idptState.unlockRecord(id);
    }

    // Build metrics HTML
    const metricsHtml = Object.entries(doc.metrics || {}).map(([k, v]) => `
      <div class="meta-field">
        <span class="meta-label">${k}</span>
        <span class="meta-val">${v}</span>
      </div>
    `).join('');

    // Build relational links HTML
    const relatedDocs = (doc.relatedIds || []).map(rId => {
      const rItem = window.ARCHIVE_DATABASE.find(x => x.id === rId);
      return { id: rId, title: rItem ? rItem.title : rId, category: rItem ? rItem.categoryName : 'Dossier' };
    });

    const relLinksHtml = relatedDocs.map(r => `
      <button class="archive-rel-link" data-rel-id="${r.id}">
        <span>🔗</span> <strong>${r.id}</strong>: ${r.title}
      </button>
    `).join('');

    pane.innerHTML = `
      <div class="dossier-header">
        <div class="dossier-code">${doc.id} &bull; ${doc.classification} &bull; ${doc.date}</div>
        <h3 class="dossier-title">${doc.title}</h3>
      </div>
      <div class="dossier-meta-grid">
        ${metricsHtml}
      </div>
      <div class="dossier-body-text">
        <p>${doc.summary}</p>
      </div>
      <div class="dossier-relationships-box">
        <div class="box-title">Dossier e Riferimenti Correlati (Collegamenti Relazionali Cinetici):</div>
        <div class="relational-links-cloud">
          ${relLinksHtml || '<span style="font-size:11px; color:#64748b;">Nessun riferimento incrociato aggiuntivo.</span>'}
        </div>
      </div>
    `;

    // Bind relational jump clicks!
    pane.querySelectorAll('.archive-rel-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-rel-id');
        showDossier(targetId);
      });
    });
  }

  // Search input in archive
  const searchInput = document.getElementById('archive-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeArchiveSearch = e.target.value;
      renderArchiveList();
    });
  }

  // Category filters in archive
  document.querySelectorAll('.category-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeArchiveCategory = btn.getAttribute('data-cat');
      renderArchiveList();
    });
  });

  // 12. Operator Session Log Rendering
  function renderSessionLog() {
    const listEl = document.getElementById('session-log-list');
    if (!listEl || !window.idptState) return;
    const logs = window.idptState.state.sessionLog || [];
    listEl.innerHTML = logs.map(l => `
      <div style="display:flex; gap:12px; font-family:var(--font-mono); font-size:11px; border-bottom:1px solid rgba(255,255,255,0.06); padding:6px 0;">
        <span style="color:var(--text-muted); min-width:65px;">${l.timestamp}</span>
        <span style="color:var(--accent-speed); font-weight:700; min-width:80px;">[${l.type}]</span>
        <span style="color:var(--text-primary); flex:1;">${l.message}</span>
      </div>
    `).join('');
  }

  window.addEventListener('idpt-log-entry', () => {
    if (modals.logs && modals.logs.classList.contains('open')) {
      renderSessionLog();
    }
  });

  const clearLogsBtn = document.getElementById('btn-clear-logs');
  if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', () => {
      window.idptState.clearSessionLog();
      renderSessionLog();
    });
  }

  // 13. Settings Panel Bindings (Themes, Sliders)
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tName = btn.getAttribute('data-theme-name');
      window.idptState.setTheme(tName);
    });
  });

  // Init Theme from state
  if (window.idptState && window.idptState.state.theme) {
    window.idptState.setTheme(window.idptState.state.theme);
    const activeThemeBtn = document.querySelector(`.theme-btn[data-theme-name="${window.idptState.state.theme}"]`);
    if (activeThemeBtn) {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      activeThemeBtn.classList.add('active');
    }
  }

  const motionSlider = document.getElementById('slider-motion-intensity');
  if (motionSlider) {
    motionSlider.value = window.idptState.state.motionIntensity;
    motionSlider.addEventListener('input', (e) => {
      window.idptState.setMotionIntensity(e.target.value);
    });
  }

  ['master', 'turbine', 'shutter', 'flux'].forEach(ch => {
    const slider = document.getElementById(`slider-vol-${ch}`);
    if (slider) {
      slider.value = window.idptState.state.audioVolumes[ch];
      slider.addEventListener('input', (e) => {
        window.idptState.setAudioVolume(ch, e.target.value);
      });
    }
  });

  // 14. Live Telemetry Subscription & Canvas Oscilloscope
  const tachoRpm = document.getElementById('tacho-rpm');
  const tachoG = document.getElementById('tacho-g');
  const tachoFlux = document.getElementById('tacho-flux');

  const diagRpm = document.getElementById('diag-rpm');
  const diagG = document.getElementById('diag-g');
  const diagVibe = document.getElementById('diag-vibe');
  const diagTemp = document.getElementById('diag-temp');
  const diagFlux = document.getElementById('diag-flux');

  const oscCanvas = document.getElementById('telemetry-osc-canvas');
  const oscCtx = oscCanvas ? oscCanvas.getContext('2d') : null;

  window.idptTelemetry.subscribe(data => {
    if (tachoRpm) tachoRpm.textContent = `${data.rpm} RPM`;
    if (tachoG) tachoG.textContent = `${data.gForce} g`;
    if (tachoFlux) tachoFlux.textContent = `${data.forceFlux} MJ`;

    if (diagRpm) diagRpm.textContent = `${data.rpm} RPM`;
    if (diagG) diagG.textContent = `${data.gForce} g`;
    if (diagVibe) diagVibe.textContent = `${data.vibration} µm`;
    if (diagTemp) diagTemp.textContent = `${data.temperature} °C`;
    if (diagFlux) diagFlux.textContent = `${data.forceFlux} MJ`;

    // Draw Live Oscilloscope
    if (oscCtx && oscCanvas && data.waveform) {
      oscCtx.clearRect(0, 0, oscCanvas.width, oscCanvas.height);
      oscCtx.strokeStyle = '#f59e0b';
      oscCtx.lineWidth = 2;
      oscCtx.beginPath();
      const step = oscCanvas.width / (data.waveform.length - 1);
      data.waveform.forEach((val, i) => {
        const y = oscCanvas.height / 2 - (val * 0.8) + (Math.sin(i * 0.5 + performance.now() * 0.01) * 6);
        if (i === 0) oscCtx.moveTo(0, y);
        else oscCtx.lineTo(i * step, y);
      });
      oscCtx.stroke();
    }
  });

  // Start Telemetry simulation
  window.idptTelemetry.start();

  // 15. Central Particle Vortex Canvas Animation
  const pCanvas = document.getElementById('portal-particles-canvas');
  if (pCanvas) {
    const pCtx = pCanvas.getContext('2d');
    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * 220,
        y: Math.random() * 220,
        speed: 1 + Math.random() * 3,
        angle: Math.random() * Math.PI * 2,
        size: 1 + Math.random() * 2.5,
        color: i % 2 === 0 ? '#f59e0b' : (i % 3 === 0 ? '#ef4444' : '#06b6d4')
      });
    }

    function animParticles() {
      pCtx.clearRect(0, 0, 220, 220);
      const gateState = window.idptGate.state;
      const speedMult = gateState === 'active' ? 5 : (gateState === 'buildup' ? 3 : (gateState === 'breakthrough' ? 8 : 0.8));

      particles.forEach(p => {
        p.angle += 0.03 * speedMult;
        const cx = 110, cy = 110;
        const dist = 20 + ((p.speed * performance.now() * 0.05 * speedMult) % 85);
        p.x = cx + Math.cos(p.angle) * dist;
        p.y = cy + Math.sin(p.angle) * dist;

        pCtx.fillStyle = p.color;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        pCtx.fill();
      });
      requestAnimationFrame(animParticles);
    }
    requestAnimationFrame(animParticles);
  }

  // Initial gate sync
  window.idptGate.init();
});
