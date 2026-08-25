/**
 * DSV-9 ARCHELON - Quick-Dial Stored Descent Profiles & Computer Auto-Dialer
 * Preloaded with 6+ verified and experimental deep descent profiles across 2 tiers.
 * Replays computer-controlled ballast-trim sequencing at accelerated playback rates,
 * landing in the ARMED/PENDING state without auto-firing.
 */

const QuickDial = (() => {
  const PRESET_TIERS = {
    tier1: [
      {
        id: 'PRESET-VER-01',
        name: 'HEARC-Standard Alpha // Kermadec Trench Survey',
        tier: 'Tier I (Verified)',
        targetDepth: 10047,
        waypoints: [0, 1, 2, 3, 4, 5, 6, 7],
        desc: 'Verified Consortium profile with calibrated ballast offsets for extreme south Pacific hadal trenches.'
      },
      {
        id: 'PRESET-VER-02',
        name: 'Consortium Beta // Challenger Abyss Deep Sounding',
        tier: 'Tier I (Verified)',
        targetDepth: 10928,
        waypoints: [0, 1, 2, 3, 4, 5, 6, 7],
        desc: 'High-density bathymetric survey profile holding verified neutral buoyancy across all 8 strata.'
      },
      {
        id: 'PRESET-VER-03',
        name: 'Vessel Log 44-D // Sirena Deep Observation Vector',
        tier: 'Tier I (Verified)',
        targetDepth: 10714,
        waypoints: [0, 1, 2, 3, 4, 5, 6, 7],
        desc: 'Standard research profile featuring gradual trim equalization for sensitive optical observation.'
      }
    ],
    tier2: [
      {
        id: 'PRESET-EXP-01',
        name: 'Anomaly Omega-7 // Hadal Singularity Descent',
        tier: 'Tier II (Experimental)',
        targetDepth: 11800,
        waypoints: [0, 1, 2, 3, 4, 5, 6, 7],
        desc: 'Classified rapid descent profile targeting the sub-bathic gravitational anomaly corridor.'
      },
      {
        id: 'PRESET-EXP-02',
        name: 'Sub-Bathic Rift Echo-9 // Gateway Vector',
        tier: 'Tier II (Experimental)',
        targetDepth: 11800,
        waypoints: [0, 1, 2, 3, 4, 5, 6, 7],
        desc: 'Experimental high-speed ballast flooding sequence engineered for rapid aperture breach.'
      },
      {
        id: 'PRESET-EXP-03',
        name: 'Classified Recon // Abyssal Rift Void Crossing',
        tier: 'Tier II (Experimental)',
        targetDepth: 11840,
        waypoints: [0, 1, 2, 3, 4, 5, 6, 7],
        desc: 'Maximum depth envelope traversal near the 11,850m crush limit of the titanium sphere.'
      }
    ]
  };

  let isAutoDialing = false;
  let autoDialTimer = null;

  const init = () => {
    renderPresetsList();
    bindEvents();
  };

  const renderPresetsList = () => {
    const t1Container = document.getElementById('tier1-presets-list');
    const t2Container = document.getElementById('tier2-presets-list');

    if (t1Container) {
      t1Container.innerHTML = PRESET_TIERS.tier1.map(p => `
        <button class="preset-card-btn" data-preset-id="${p.id}" data-tier="1">
          <span class="preset-name">${p.name}</span>
          <div class="preset-meta">
            <span>TARGET: ${p.targetDepth}m</span>
            <span>8 WAYPOINTS</span>
          </div>
        </button>
      `).join('');
    }

    if (t2Container) {
      t2Container.innerHTML = PRESET_TIERS.tier2.map(p => `
        <button class="preset-card-btn" data-preset-id="${p.id}" data-tier="2">
          <span class="preset-name">${p.name}</span>
          <div class="preset-meta">
            <span class="text-amber">TARGET: ${p.targetDepth}m</span>
            <span>8 WAYPOINTS</span>
          </div>
        </button>
      `).join('');
    }
  };

  const bindEvents = () => {
    const drawer = document.getElementById('quickdial-drawer');
    const toggleBtn = document.getElementById('btn-quickdial-toggle');
    const closeBtn = document.getElementById('btn-quickdial-close');

    if (toggleBtn && drawer) {
      toggleBtn.addEventListener('click', () => {
        const isOpen = drawer.classList.toggle('active');
        drawer.setAttribute('aria-hidden', (!isOpen).toString());
        toggleBtn.setAttribute('aria-expanded', isOpen.toString());
        SoundEngine.playSolenoidClick();
      });
    }

    if (closeBtn && drawer) {
      closeBtn.addEventListener('click', () => {
        drawer.classList.remove('active');
        drawer.setAttribute('aria-hidden', 'true');
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
        SoundEngine.playSolenoidClick();
      });
    }

    // Preset button click delegation
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.preset-card-btn');
      if (btn) {
        const id = btn.getAttribute('data-preset-id');
        executePresetAutoDial(id);
      }
    });
  };

  /**
   * Execute Staged Auto-Dialing Sequence
   * Sequentially dials each waypoint at dive-computer playback speed (~150ms per waypoint)
   * Lands in PENDING/READY state without auto-firing.
   */
  const executePresetAutoDial = (presetId) => {
    if (isAutoDialing) return;

    let preset = PRESET_TIERS.tier1.find(p => p.id === presetId) || PRESET_TIERS.tier2.find(p => p.id === presetId);
    if (!preset) return;

    // Close drawer
    const drawer = document.getElementById('quickdial-drawer');
    if (drawer) drawer.classList.remove('active');

    // Reset current dialer state first
    Dialer.emergencyBlowBallast();

    isAutoDialing = true;
    Storage.logEvent('DIVE_COMPUTER', `Replaying stored dive profile [${preset.id}]: "${preset.name}" at computer bus speed`);

    const waypoints = [...preset.waypoints];
    let stepIndex = 0;

    const dialNext = () => {
      if (!isAutoDialing) return;

      if (stepIndex < waypoints.length) {
        const wpIdx = waypoints[stepIndex];
        stepIndex++;
        Dialer.selectWaypoint(wpIdx, 'computer', (success) => {
          if (isAutoDialing) {
            // Small gap between computer locks
            autoDialTimer = setTimeout(dialNext, 40);
          }
        });
      } else {
        autoDialTimer = null;
        isAutoDialing = false;
        Storage.logEvent('DIVE_COMPUTER', `Auto-dial profile sequence complete. System ARMED & PENDING. Manual activation required.`);
      }
    };

    // Begin sequence after 150ms surface settle
    autoDialTimer = setTimeout(dialNext, 150);
  };

  const cancelAutoDial = () => {
    if (autoDialTimer) {
      clearTimeout(autoDialTimer);
      autoDialTimer = null;
    }
    isAutoDialing = false;
  };

  return {
    init,
    PRESET_TIERS,
    executePresetAutoDial,
    cancelAutoDial
  };
})();

window.QuickDial = QuickDial;
