/**
 * KONSTRUKT TRANSIT BUREAU
 * Main Application Controller & DOM Orchestrator
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Audio Engine & Dialer
  const audio = new KonstruktAudioEngine();
  const dialer = new KonstruktDialer(audio);

  // 2. DOM Element Selectors
  const appCanvas = document.getElementById('app-canvas');
  const clockDisplay = document.getElementById('clock-display');
  const btnAudioToggle = document.getElementById('btn-audio-toggle');
  const btnOperatorHelp = document.getElementById('btn-operator-help');
  const operatorModal = document.getElementById('operator-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnModalGotIt = document.getElementById('btn-modal-got-it');

  // Ring Elements
  const ringSvg = document.getElementById('primary-ring-svg');
  const svgSectorsGroup = document.getElementById('svg-sectors-group');
  const apertureStatusText = document.getElementById('aperture-status-text');

  // Cluster 1 Elements
  const regCountCurrent = document.getElementById('reg-count-current');
  const stencilSlotsContainer = document.getElementById('stencil-slots-container');
  const manualMatrixGrid = document.getElementById('manual-matrix-grid');
  const btnPopGlyph = document.getElementById('btn-pop-glyph');
  const btnClearRegister = document.getElementById('btn-clear-register');
  const pendingPromptBanner = document.getElementById('pending-prompt-banner');
  const cluster1StatusPill = document.getElementById('cluster1-status-pill');

  // Cluster 2 Elements
  const btnEngageVector = document.getElementById('btn-engage-vector');
  const btnDisengageVector = document.getElementById('btn-disengage-vector');
  const btnToggleInterlock = document.getElementById('btn-toggle-interlock');
  const interlockDescText = document.getElementById('interlock-desc-text');
  const interlockToggleLabel = document.getElementById('interlock-toggle-label');
  const tier1List = document.getElementById('tier-1-list');
  const tier2List = document.getElementById('tier-2-list');
  const cluster2StatusPill = document.getElementById('cluster2-status-pill');

  // Footer & Overlays
  const statusTickerText = document.getElementById('status-ticker-text');
  const hazardOverlay = document.getElementById('hazard-warning-overlay');
  const btnDismissHazard = document.getElementById('btn-dismiss-hazard');

  // 3. Viewport Responsive Scaling
  function updateViewportScale() {
    const targetWidth = 1920;
    const targetHeight = 1080;
    const scaleX = window.innerWidth / targetWidth;
    const scaleY = window.innerHeight / targetHeight;
    const scale = Math.min(scaleX, scaleY);

    document.documentElement.style.setProperty('--scale-factor', scale.toString());
  }

  window.addEventListener('resize', updateViewportScale);
  updateViewportScale();

  // Cycle Clock Simulator
  function updateCycleClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    clockDisplay.textContent = `${h}:${m}:${s}`;
  }
  setInterval(updateCycleClock, 1000);
  updateCycleClock();

  // 4. Build SVG Ring Sectors Dynamically (Starting at 12 o'clock = -90 deg)
  function buildSvgRingSectors() {
    svgSectorsGroup.innerHTML = '';
    const R_outer = 238;
    const R_inner = 138;
    const R_glyph = 188;

    GLYPHS.forEach((glyph, index) => {
      // 12 o'clock start: -90 deg
      const angleStart = -90 + (index * 45);
      const angleEnd = -90 + ((index + 1) * 45);
      const radStart = (angleStart * Math.PI) / 180;
      const radEnd = (angleEnd * Math.PI) / 180;
      const radMid = ((angleStart + 22.5) * Math.PI) / 180;

      const x1 = R_outer * Math.cos(radStart);
      const y1 = R_outer * Math.sin(radStart);
      const x2 = R_outer * Math.cos(radEnd);
      const y2 = R_outer * Math.sin(radEnd);

      const ix1 = R_inner * Math.cos(radStart);
      const iy1 = R_inner * Math.sin(radStart);
      const ix2 = R_inner * Math.cos(radEnd);
      const iy2 = R_inner * Math.sin(radEnd);

      const gx = R_glyph * Math.cos(radMid);
      const gy = R_glyph * Math.sin(radMid);

      // Annulus sector wedge path (from R_inner to R_outer)
      const pathD = `M ${ix1.toFixed(2)} ${iy1.toFixed(2)} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R_outer} ${R_outer} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${ix2.toFixed(2)} ${iy2.toFixed(2)} A ${R_inner} ${R_inner} 0 0 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)} Z`;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'ring-sector-group');
      g.setAttribute('id', `ring-sec-${index}`);
      g.setAttribute('data-glyph-id', glyph.id);

      // Wedge background
      const wedge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      wedge.setAttribute('d', pathD);
      wedge.setAttribute('class', 'svg-sector-wedge sector-bg-idle');
      wedge.setAttribute('id', `wedge-path-${index}`);
      wedge.addEventListener('click', () => {
        audio.ensureContext();
        dialer.inputGlyph(glyph.id);
      });

      // Squeegee wipe path overlay inside sector
      const squeegeeOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      squeegeeOverlay.setAttribute('d', pathD);
      squeegeeOverlay.setAttribute('class', 'sector-squeegee-mask');
      squeegeeOverlay.setAttribute('id', `squeegee-mask-${index}`);
      squeegeeOverlay.setAttribute('fill', glyph.color);
      squeegeeOverlay.setAttribute('opacity', '0');

      // Glyph SVG Container (Exact 38x38 centered)
      const glyphGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      glyphGroup.setAttribute('transform', `translate(${gx.toFixed(2)}, ${gy.toFixed(2)}) scale(0.38) translate(-50, -50)`);
      glyphGroup.setAttribute('class', 'ring-glyph-icon');
      glyphGroup.setAttribute('id', `ring-glyph-icon-${index}`);
      glyphGroup.setAttribute('color', '#181716');
      glyphGroup.innerHTML = glyph.innerSvg;

      // Index label
      const textLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      const lx = 226 * Math.cos(radMid);
      const ly = 226 * Math.sin(radMid);
      textLabel.setAttribute('x', lx.toFixed(2));
      textLabel.setAttribute('y', ly.toFixed(2));
      textLabel.setAttribute('fill', '#8D9399');
      textLabel.setAttribute('font-size', '9');
      textLabel.setAttribute('font-family', 'var(--font-mono)');
      textLabel.setAttribute('font-weight', '800');
      textLabel.setAttribute('text-anchor', 'middle');
      textLabel.setAttribute('dominant-baseline', 'central');
      textLabel.setAttribute('id', `ring-label-${index}`);
      textLabel.textContent = glyph.code;

      g.appendChild(wedge);
      g.appendChild(squeegeeOverlay);
      g.appendChild(glyphGroup);
      g.appendChild(textLabel);
      svgSectorsGroup.appendChild(g);
    });
  }
  buildSvgRingSectors();

  // 5. Build Manual Matrix Buttons in Cluster 1
  function buildManualMatrix() {
    manualMatrixGrid.innerHTML = '';
    GLYPHS.forEach((glyph) => {
      const btn = document.createElement('button');
      btn.className = 'glyph-tile-btn';
      btn.id = `btn-glyph-${glyph.id}`;
      btn.setAttribute('data-glyph-id', glyph.id);
      btn.setAttribute('title', `${glyph.name}: ${glyph.subtitle}`);

      btn.innerHTML = `
        <div class="tile-svg-box" style="color: ${glyph.color};">${glyph.svg}</div>
        <div class="tile-meta">
          <span class="tile-code">${glyph.id} // ${glyph.code}</span>
          <span class="tile-name">${glyph.name}</span>
        </div>
        <div class="tile-accent-bar" style="background-color: ${glyph.color};"></div>
      `;

      btn.addEventListener('click', () => {
        audio.ensureContext();
        dialer.inputGlyph(glyph.id);
      });

      manualMatrixGrid.appendChild(btn);
    });
  }
  buildManualMatrix();

  // 6. Build Quick-Dial Preset Roster in Cluster 2
  function buildPresetRoster() {
    tier1List.innerHTML = '';
    tier2List.innerHTML = '';

    PRESETS.forEach((preset) => {
      const card = document.createElement('button');
      card.className = 'preset-card-btn';
      card.id = `btn-preset-${preset.id}`;
      card.setAttribute('data-preset-id', preset.id);

      const miniGlyphsHtml = preset.sequence.map((gid) => {
        const g = GLYPHS.find(item => item.id === gid);
        return `<div class="p-mini-glyph" style="background-color: ${g.color};" title="${g.name}"></div>`;
      }).join('');

      card.innerHTML = `
        <div class="p-meta-left">
          <span class="p-code">${preset.code} · TRANSIT ${preset.transitTime}</span>
          <span class="p-name">${preset.name}</span>
          <span class="p-dest">${preset.destination}</span>
        </div>
        <div class="p-glyph-sequence">${miniGlyphsHtml}</div>
      `;

      card.addEventListener('click', () => {
        audio.ensureContext();
        dialer.loadPreset(preset.id);
      });

      if (preset.tier === 1) {
        tier1List.appendChild(card);
      } else {
        tier2List.appendChild(card);
      }
    });
  }
  buildPresetRoster();

  // 7. Update Linear Stencil Slots
  function updateAddressSlots() {
    const address = dialer.address;
    regCountCurrent.textContent = address.length.toString();

    for (let i = 0; i < 6; i++) {
      const slotEl = document.getElementById(`slot-${i}`);
      const targetEl = slotEl.querySelector('.slot-glyph-target');
      const codeEl = slotEl.querySelector('.slot-code');

      if (i < address.length) {
        const glyphId = address[i];
        const glyph = GLYPHS.find(g => g.id === glyphId);
        slotEl.className = 'stencil-slot filled';
        if (glyph.color === '#D82B27') slotEl.classList.add('slot-red');
        else if (glyph.color === '#15448C') slotEl.classList.add('slot-blue');
        else if (glyph.color === '#F4B810') slotEl.classList.add('slot-yellow');

        targetEl.innerHTML = glyph.svg;
        targetEl.style.color = glyph.color;
        codeEl.textContent = glyph.id;
      } else {
        slotEl.className = 'stencil-slot empty';
        targetEl.innerHTML = '';
        targetEl.style.color = 'inherit';
        codeEl.textContent = '---';
      }
    }

    // Trigger slot squeegee wipe animation on newest filled slot
    if (address.length > 0) {
      const newestSlot = document.getElementById(`slot-${address.length - 1}`);
      if (newestSlot) {
        newestSlot.classList.remove('wiping');
        void newestSlot.offsetWidth; // trigger reflow
        newestSlot.classList.add('wiping');
      }
    }
  }

  // 8. Update SVG Ring Visuals
  function updateRingVisuals() {
    const address = dialer.address;

    // Reset all ring sector squeegee masks and active colors
    GLYPHS.forEach((glyph, index) => {
      const wedgePath = document.getElementById(`wedge-path-${index}`);
      const squeegeeMask = document.getElementById(`squeegee-mask-${index}`);
      const glyphIcon = document.getElementById(`ring-glyph-icon-${index}`);
      const label = document.getElementById(`ring-label-${index}`);
      const isSelected = address.includes(glyph.id);

      if (isSelected) {
        wedgePath.setAttribute('class', `svg-sector-wedge sector-locked-${index}`);
        wedgePath.style.fill = glyph.color;
        squeegeeMask.setAttribute('opacity', '0.25');
        if (glyphIcon) glyphIcon.setAttribute('color', '#F4F0E8');
        if (label) label.setAttribute('fill', '#F4F0E8');
      } else {
        wedgePath.setAttribute('class', 'svg-sector-wedge sector-bg-idle');
        wedgePath.style.fill = '';
        squeegeeMask.setAttribute('opacity', '0');
        if (glyphIcon) glyphIcon.setAttribute('color', '#181716');
        if (label) label.setAttribute('fill', '#8D9399');
      }
    });

    // Squeegee wipe animation for newest selected glyph on ring
    if (address.length > 0) {
      const lastGlyphId = address[address.length - 1];
      const sectorIndex = GLYPHS.findIndex(g => g.id === lastGlyphId);
      if (sectorIndex >= 0) {
        const mask = document.getElementById(`squeegee-mask-${sectorIndex}`);
        mask.setAttribute('opacity', '0.85');
        setTimeout(() => {
          mask.setAttribute('opacity', '0.25');
        }, 320);
      }
    }
  }

  // 9. State Machine Listener
  dialer.onStateChange((state, event, data) => {
    // Canvas state class
    appCanvas.className = `state-${state.toLowerCase()}`;

    // Update slots and ring
    updateAddressSlots();
    updateRingVisuals();

    // Enable/Disable Controls based on state
    if (state === 'PENDING') {
      btnEngageVector.disabled = false;
      pendingPromptBanner.classList.add('visible');
      cluster1StatusPill.textContent = 'ARMED (6/6)';
      cluster1StatusPill.style.backgroundColor = 'var(--c-yellow)';
      cluster2StatusPill.textContent = 'ENGAGE READY';
      cluster2StatusPill.style.backgroundColor = 'var(--c-red)';
      cluster2StatusPill.style.color = '#FFFFFF';
      apertureStatusText.textContent = 'ARMED // AWAITING DISPATCH';
      statusTickerText.textContent = 'COORDINATE LOCK CONFIRMED // APPARATUS ARMED // DISPATCH MASTER ENGAGE VECTOR';
    } else if (state === 'BUILDUP') {
      btnEngageVector.disabled = true;
      pendingPromptBanner.classList.remove('visible');
      cluster1StatusPill.textContent = 'LOCKING';
      cluster2StatusPill.textContent = 'STAGE I: BUILDUP';
      cluster2StatusPill.style.backgroundColor = 'var(--c-yellow)';
      cluster2StatusPill.style.color = '#181716';
      apertureStatusText.textContent = 'HARMONIC BUILDUP ACTIVE';
      statusTickerText.textContent = 'APERTURE IGNITION INITIATED // MECHANICAL TENSION MOUNTING // ALIGNING VECTORS';
    } else if (state === 'BREAKTHROUGH') {
      btnEngageVector.disabled = true;
      pendingPromptBanner.classList.remove('visible');
      cluster2StatusPill.textContent = 'STAGE II: BREAKTHROUGH';
      cluster2StatusPill.style.backgroundColor = 'var(--c-red)';
      cluster2StatusPill.style.color = '#FFFFFF';
      apertureStatusText.textContent = 'BREAKTHROUGH IN PROGRESS';
      statusTickerText.textContent = 'GEOMETRIC SPEARHEAD PENETRATING IRIS // CORRIDOR BREACH ACHIEVED';
    } else if (state === 'ACTIVE') {
      btnEngageVector.disabled = true;
      pendingPromptBanner.classList.remove('visible');
      cluster1StatusPill.textContent = 'TRANSIT ACTIVE';
      cluster2StatusPill.textContent = 'STAGE III: ACTIVE';
      cluster2StatusPill.style.backgroundColor = 'var(--c-yellow)';
      cluster2StatusPill.style.color = '#181716';
      apertureStatusText.textContent = 'PORTAL SUSTAINED // OPEN';
      statusTickerText.textContent = 'APERTURE TRANSIT ESTABLISHED // CONTINUOUS VECTOR HARMONIC STABLE';
    } else if (state === 'DISENGAGING') {
      btnEngageVector.disabled = true;
      pendingPromptBanner.classList.remove('visible');
      cluster1StatusPill.textContent = 'PURGING';
      cluster2StatusPill.textContent = 'DISENGAGING';
      cluster2StatusPill.style.backgroundColor = 'var(--c-grey-light)';
      cluster2StatusPill.style.color = '#181716';
      apertureStatusText.textContent = 'HYDRAULIC PURGE EXHAUST';
      statusTickerText.textContent = 'DISENGAGING APPARATUS // HYDRAULIC PRESSURE DUMP // RESETTING REGISTERS';
    } else if (state === 'DIALING') {
      btnEngageVector.disabled = true;
      pendingPromptBanner.classList.remove('visible');
      cluster1StatusPill.textContent = `DIALING (${dialer.address.length}/6)`;
      cluster1StatusPill.style.backgroundColor = 'var(--c-grey-light)';
      cluster2StatusPill.textContent = 'STANDBY';
      cluster2StatusPill.style.backgroundColor = 'var(--c-grey-light)';
      cluster2StatusPill.style.color = '#181716';
      apertureStatusText.textContent = 'REGISTRATION IN PROGRESS';
      statusTickerText.textContent = `STENCIL PASS ${dialer.address.length} OF 6 RECORDED // AWAITING FURTHER VECTORS`;
    } else {
      // IDLE
      btnEngageVector.disabled = true;
      pendingPromptBanner.classList.remove('visible');
      cluster1StatusPill.textContent = 'STANDBY';
      cluster1StatusPill.style.backgroundColor = 'var(--c-grey-light)';
      cluster2StatusPill.textContent = 'READY';
      cluster2StatusPill.style.backgroundColor = 'var(--c-grey-light)';
      cluster2StatusPill.style.color = '#181716';
      apertureStatusText.textContent = 'LOCKED / READY';
      statusTickerText.textContent = 'SYSTEM IDLE // SELECT 6 GLYPHS TO CONFIGURE VECTOR COORDINATES';
    }

    // Safety interlock blocked event
    if (event === 'INTERLOCK_BLOCKED') {
      hazardOverlay.classList.add('visible');
      hazardOverlay.setAttribute('aria-hidden', 'false');
    }
  });

  // 10. Register Buttons & Interlock Listeners
  btnPopGlyph.addEventListener('click', () => {
    audio.ensureContext();
    dialer.popGlyph();
  });

  btnClearRegister.addEventListener('click', () => {
    audio.ensureContext();
    dialer.clearAddress();
  });

  btnEngageVector.addEventListener('click', () => {
    audio.ensureContext();
    dialer.activate();
  });

  btnDisengageVector.addEventListener('click', () => {
    audio.ensureContext();
    dialer.disengage();
  });

  btnToggleInterlock.addEventListener('click', () => {
    audio.ensureContext();
    const isEngaged = dialer.toggleInterlock();
    if (isEngaged) {
      btnToggleInterlock.className = 'interlock-toggle-btn engaged';
      btnToggleInterlock.setAttribute('aria-checked', 'true');
      interlockToggleLabel.textContent = 'ENGAGED';
      interlockDescText.innerHTML = 'STATUS: <strong style="color: var(--c-red);">ENGAGED (LOCKED)</strong> — Gate dispatch prohibited.';
    } else {
      btnToggleInterlock.className = 'interlock-toggle-btn released';
      btnToggleInterlock.setAttribute('aria-checked', 'false');
      interlockToggleLabel.textContent = 'RELEASED';
      interlockDescText.innerHTML = 'STATUS: <strong>RELEASED (ARMED)</strong> — Gate dispatch permissible.';
    }
  });

  btnDismissHazard.addEventListener('click', () => {
    hazardOverlay.classList.remove('visible');
    hazardOverlay.setAttribute('aria-hidden', 'true');
  });

  // 11. Operator Help Modal
  btnOperatorHelp.addEventListener('click', () => {
    operatorModal.classList.add('visible');
    operatorModal.setAttribute('aria-hidden', 'false');
  });

  btnCloseModal.addEventListener('click', () => {
    operatorModal.classList.remove('visible');
    operatorModal.setAttribute('aria-hidden', 'true');
  });

  btnModalGotIt.addEventListener('click', () => {
    operatorModal.classList.remove('visible');
    operatorModal.setAttribute('aria-hidden', 'true');
  });

  // 12. Audio Engine Toggle
  btnAudioToggle.addEventListener('click', () => {
    audio.ensureContext();
    const isMuted = audio.toggleMute();
    btnAudioToggle.querySelector('.btn-icon').textContent = isMuted ? '🔇' : '🔊';
    btnAudioToggle.querySelector('.btn-text').textContent = isMuted ? 'AUDIO OFF' : 'AUDIO ON';
  });

  // 13. Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key >= '1' && e.key <= '8') {
      const idx = parseInt(e.key, 10) - 1;
      if (GLYPHS[idx]) {
        audio.ensureContext();
        dialer.inputGlyph(GLYPHS[idx].id);
      }
    } else if (e.key === 'Backspace') {
      audio.ensureContext();
      dialer.popGlyph();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      audio.ensureContext();
      dialer.activate();
    } else if (e.key === 'Escape') {
      audio.ensureContext();
      if (operatorModal.classList.contains('visible')) {
        operatorModal.classList.remove('visible');
      } else if (hazardOverlay.classList.contains('visible')) {
        hazardOverlay.classList.remove('visible');
      } else {
        dialer.disengage();
      }
    } else if (e.key === 'i' || e.key === 'I') {
      audio.ensureContext();
      btnToggleInterlock.click();
    } else if (e.key === '?') {
      btnOperatorHelp.click();
    }
  });

  // First interaction unlock for Web Audio
  ['click', 'keydown', 'touchstart'].forEach(eventType => {
    window.addEventListener(eventType, () => {
      audio.ensureContext();
    }, { once: true });
  });

  console.log('KONSTRUKT TRANSIT BUREAU online.');
});
