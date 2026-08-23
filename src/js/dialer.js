/**
 * DSV-9 ARCHELON - Waypoint Locking State Machine & Ballast-Trim Solver
 * Controls the core dialing loop:
 * - 8 Hadal depth waypoints
 * - 10-Channel Ballast & Thruster Trim convergence (Neutral Buoyancy Hold)
 * - Safety Interlock enforcement (defaults to RELEASED)
 * - Three-stage descent activation (Buildup -> Breakthrough -> Sustained Active)
 * - Emergency Ascent / Blow All Ballast disengage procedure
 */

const Dialer = (() => {
  const WAYPOINTS = [
    { id: 'WP-1', name: 'Epipelagic Shelf', depth: 850, code: 'EPI-850' },
    { id: 'WP-2', name: 'Mesopelagic Sill', depth: 2200, code: 'MES-220' },
    { id: 'WP-3', name: 'Bathypelagic Ridge', depth: 4100, code: 'BAT-410' },
    { id: 'WP-4', name: 'Abyssopelagic Chasm', depth: 6300, code: 'ABY-630' },
    { id: 'WP-5', name: 'Hadal Trench Entry', depth: 8400, code: 'HAD-840' },
    { id: 'WP-6', name: 'Sirena Deep Rift', depth: 10100, code: 'SIR-101' },
    { id: 'WP-7', name: 'Mariana Sill Anomaly', depth: 11200, code: 'MAR-112' },
    { id: 'WP-8', name: 'Gateway Horizon', depth: 11800, code: 'GAT-118' }
  ];

  const TRIM_CHANNELS = [
    { id: 'ch-mf1', name: 'MF-01', type: 'ballast', fill: 45 },
    { id: 'ch-ma2', name: 'MA-02', type: 'ballast', fill: 45 },
    { id: 'ch-pt3', name: 'PT-03', type: 'trim', fill: 50 },
    { id: 'ch-st4', name: 'ST-04', type: 'trim', fill: 50 },
    { id: 'ch-vbta', name: 'VBT-A', type: 'variable', fill: 48 },
    { id: 'ch-vbtb', name: 'VBT-B', type: 'variable', fill: 48 },
    { id: 'ch-vtfwd', name: 'VT-FWD', type: 'thruster', fill: 30 },
    { id: 'ch-vtaft', name: 'VT-AFT', type: 'thruster', fill: 30 },
    { id: 'ch-tvdor', name: 'TV-DOR', type: 'trim_vector', fill: 50 },
    { id: 'ch-tvven', name: 'TV-VEN', type: 'trim_vector', fill: 50 }
  ];

  // Dialer States: 'IDLE' | 'TRIMMING' | 'PENDING_READY' | 'BUILDUP' | 'BREAKTHROUGH' | 'SUSTAINED_ACTIVE' | 'EMERGENCY_ASCENT'
  let dialerState = 'IDLE';
  let lockedWaypoints = [];
  let isInterlockEngaged = false; // MUST default to false (RELEASED)
  let trimAnimationTimer = null;
  let stagedDescentTimers = [];

  const getWaypoints = () => WAYPOINTS;
  const getTrimChannels = () => TRIM_CHANNELS;
  const getLockedWaypoints = () => lockedWaypoints;
  const getDialerState = () => dialerState;
  const isInterlockActive = () => isInterlockEngaged;

  /**
   * Set Safety Interlock (Default: RELEASED = false)
   */
  const setInterlock = (engaged) => {
    isInterlockEngaged = engaged;
    SoundEngine.playSolenoidClick();
    Storage.logEvent(
      'INTERLOCK',
      engaged ? 'Safety interlock ENGAGED: Aperture vector locked' : 'Safety interlock RELEASED: Descent vector permitted',
      engaged ? 'warn' : 'info'
    );
    updateUIState();
  };

  /**
   * Toggle Safety Interlock
   */
  const toggleInterlock = () => {
    setInterlock(!isInterlockEngaged);
    return isInterlockEngaged;
  };

  /**
   * Select a Waypoint and initiate Ballast & Trim Neutral Buoyancy Hold Sequence
   */
  const selectWaypoint = (waypointIndex, speed = 'manual', onComplete = null) => {
    if (dialerState === 'BUILDUP' || dialerState === 'BREAKTHROUGH' || dialerState === 'SUSTAINED_ACTIVE') {
      if (typeof onComplete === 'function') onComplete(false);
      return false;
    }

    const wp = WAYPOINTS[waypointIndex];
    if (!wp) {
      if (typeof onComplete === 'function') onComplete(false);
      return false;
    }

    // If already locked, ignore
    if (lockedWaypoints.some(w => w.id === wp.id)) {
      if (typeof onComplete === 'function') onComplete(true);
      return false;
    }

    SoundEngine.resumeContext();
    SoundEngine.playSolenoidClick();
    SoundEngine.playBallastHiss(speed === 'computer' ? 0.25 : 0.45, true);
    SoundEngine.playThrusterWhine(speed === 'computer' ? 0.25 : 0.4, 0.8);

    dialerState = 'TRIMMING';
    Storage.logEvent('PILOT_TRIM', `Initiating ballast flood & vector adjustment for waypoint: ${wp.id} (${wp.depth}m)`);

    // Animate 10 Trim channels converging to neutral balance
    const startDelta = (Math.random() > 0.5 ? 1 : -1) * (1.8 + Math.random() * 2.5);
    let currentDelta = startDelta;
    Physics.setBuoyancyDelta(currentDelta);

    const isFast = speed === 'computer';
    const stepCount = isFast ? 5 : 7;
    const intervalMs = isFast ? 28 : 45;
    let step = 0;

    if (trimAnimationTimer) clearInterval(trimAnimationTimer);

    trimAnimationTimer = setInterval(() => {
      step++;
      const progress = step / stepCount;

      // Exponentially decay delta to 0.00 kN (Neutral Buoyancy Hold)
      currentDelta = startDelta * (1 - progress);
      Physics.setBuoyancyDelta(currentDelta);

      // Perturb channel bars realistically
      TRIM_CHANNELS.forEach((ch, idx) => {
        const targetFill = 50 + (idx % 2 === 0 ? 1 : -1) * (15 * (1 - progress)) + (Math.sin(step + idx) * 3);
        ch.fill = Math.max(10, Math.min(90, targetFill));
      });

      renderTrimBars();

      if (step >= stepCount) {
        clearInterval(trimAnimationTimer);
        trimAnimationTimer = null;
        Physics.setBuoyancyDelta(0.0);
        
        // Stabilize channel bars to nominal
        TRIM_CHANNELS.forEach(ch => { ch.fill = 50; });
        renderTrimBars();

        // Lock waypoint
        lockedWaypoints.push(wp);
        SoundEngine.playSolenoidClick();
        Storage.logEvent('TRIM_LOCK', `Neutral Buoyancy Hold confirmed for ${wp.id} [${wp.code}]. Locked.`);

        // Move vessel target depth incrementally to preview waypoint
        Physics.setTargetDepth(wp.depth, 0.4);

        if (lockedWaypoints.length === WAYPOINTS.length) {
          dialerState = 'PENDING_READY';
          Storage.logEvent('COMPUTER', 'All 8 waypoints locked. Descent profile ARMED. Awaiting manual actuation.');
        } else {
          dialerState = 'IDLE';
        }

        updateUIState();
        if (typeof onComplete === 'function') onComplete(true);
      }
    }, intervalMs);

    updateUIState();
    return true;
  };

  /**
   * Commence Staged Descent Aperture (Stage 1 -> Stage 2 -> Stage 3)
   * Explicitly requires manual trigger, NEVER auto-fires.
   */
  const commenceDescent = () => {
    if (lockedWaypoints.length < WAYPOINTS.length) {
      Storage.logEvent('ACTUATOR', 'Descent aborted: All 8 waypoints must be locked prior to actuation', 'warn');
      return false;
    }

    if (isInterlockEngaged) {
      Storage.logEvent('ACTUATOR', 'Descent blocked: Safety Interlock is currently ENGAGED', 'alert');
      return false;
    }

    if (dialerState === 'BUILDUP' || dialerState === 'BREAKTHROUGH' || dialerState === 'SUSTAINED_ACTIVE') {
      return false;
    }

    // Clear any prior pending timers
    clearStagedTimers();

    // =========================================================================
    // STAGE 1: BUILDUP (2.0s duration)
    // =========================================================================
    dialerState = 'BUILDUP';
    SoundEngine.playApertureBoom(1);
    Storage.logEvent('DESCENT_STG1', 'Stage 1 BUILDUP: Main descent thrusters vectoring 100%, hydraulic purge engaged');
    
    // Set target depth to gateway floor (11,800m) with rapid velocity
    Physics.setTargetDepth(11800, 1.6);
    updateUIState();

    // =========================================================================
    // STAGE 2: BREAKTHROUGH (after 2.0s buildup)
    // =========================================================================
    const timerStage2 = setTimeout(() => {
      if (dialerState !== 'BUILDUP') return;

      dialerState = 'BREAKTHROUGH';
      SoundEngine.playApertureBoom(2);
      Storage.logEvent('DESCENT_STG2', 'Stage 2 BREAKTHROUGH: Abyssal Gateway rift aperture breached at 11,800m');
      
      // Trigger aperture optical flash shockwave
      const fxLayer = document.getElementById('aperture-fx-layer');
      if (fxLayer) {
        fxLayer.className = 'aperture-fx-layer fx-breakthrough';
      }

      updateUIState();

      // =========================================================================
      // STAGE 3: SUSTAINED ACTIVE (after 0.8s breakthrough)
      // =========================================================================
      const timerStage3 = setTimeout(() => {
        if (dialerState !== 'BREAKTHROUGH') return;

        dialerState = 'SUSTAINED_ACTIVE';
        SoundEngine.playApertureBoom(3);
        Storage.logEvent('DESCENT_STG3', 'Stage 3 SUSTAINED ACTIVE: Bathyscaphe holding in Hadal Rift Gateway corridor');

        // Log completed dive to localStorage
        Storage.saveCompletedDive({
          depth: 11800,
          pressure: '1,191.0 BAR',
          duration: 180,
          routeName: 'Standard Hadal Gateway Vector'
        });

        if (fxLayer) {
          fxLayer.className = 'aperture-fx-layer fx-active';
        }

        updateUIState();
      }, 800);

      stagedDescentTimers.push(timerStage3);
    }, 2000);

    stagedDescentTimers.push(timerStage2);
    return true;
  };

  /**
   * Emergency Ascent / Blow All Ballast (Disengage)
   * Always reachable, immediately purges profile and surfaces the vehicle.
   */
  const emergencyBlowBallast = () => {
    clearStagedTimers();
    if (trimAnimationTimer) {
      clearInterval(trimAnimationTimer);
      trimAnimationTimer = null;
    }

    dialerState = 'EMERGENCY_ASCENT';
    SoundEngine.playBallastHiss(1.2, false);
    SoundEngine.playThrusterWhine(1.0, 1.2);
    SoundEngine.playSolenoidClick();

    Storage.logEvent('EMERGENCY_BLOW', 'EMERGENCY ASCENT EXECUTED: All 10 ballast & trim channels purged to surface', 'alert');

    // Reset locked waypoints
    lockedWaypoints = [];

    // Surface vehicle immediately
    Physics.setTargetDepth(0, 2.5);
    Physics.setBuoyancyDelta(8.5); // Strong positive buoyancy during ascent

    TRIM_CHANNELS.forEach(ch => { ch.fill = 15; });
    renderTrimBars();

    const fxLayer = document.getElementById('aperture-fx-layer');
    if (fxLayer) fxLayer.className = 'aperture-fx-layer';

    setTimeout(() => {
      Physics.setBuoyancyDelta(0.0);
      TRIM_CHANNELS.forEach(ch => { ch.fill = 50; });
      renderTrimBars();
      dialerState = 'IDLE';
      updateUIState();
    }, 1200);

    updateUIState();
  };

  const clearStagedTimers = () => {
    stagedDescentTimers.forEach(t => clearTimeout(t));
    stagedDescentTimers = [];
  };

  /**
   * Render 10 Trim Channel Progress Bars
   */
  const renderTrimBars = () => {
    const grid = document.getElementById('trim-channels-grid');
    if (!grid) return;

    if (grid.children.length !== TRIM_CHANNELS.length) {
      grid.innerHTML = TRIM_CHANNELS.map(ch => `
        <div class="channel-item" id="${ch.id}">
          <div class="ch-label-row">
            <span>${ch.name}</span>
            <span class="ch-val">${Math.round(ch.fill)}%</span>
          </div>
          <div class="ch-meter-track">
            <div class="ch-meter-fill" style="width: ${ch.fill}%;"></div>
          </div>
        </div>
      `).join('');
    } else {
      TRIM_CHANNELS.forEach(ch => {
        const el = document.getElementById(ch.id);
        if (el) {
          const valEl = el.querySelector('.ch-val');
          const fillEl = el.querySelector('.ch-meter-fill');
          if (valEl) valEl.textContent = `${Math.round(ch.fill)}%`;
          if (fillEl) fillEl.style.width = `${ch.fill}%`;
        }
      });
    }
  };

  /**
   * Update UI buttons, status pills, and locks
   */
  const updateUIState = () => {
    // 1. Waypoint Grid Buttons
    const wpGrid = document.getElementById('waypoint-grid');
    if (wpGrid) {
      wpGrid.innerHTML = WAYPOINTS.map((wp, idx) => {
        const isLocked = lockedWaypoints.some(w => w.id === wp.id);
        return `
          <button class="waypoint-btn ${isLocked ? 'locked' : ''}" data-wp-index="${idx}" aria-label="Waypoint ${wp.id} ${wp.name}">
            <div class="wp-top-row">
              <span class="wp-id">${wp.id}</span>
              <span class="wp-depth">${wp.depth}m</span>
            </div>
            <div class="wp-name">${wp.name}</div>
            <div class="wp-lock-badge">${isLocked ? 'HOLD LOCKED' : 'STANDBY'}</div>
          </button>
        `;
      }).join('');
    }

    // 2. Locked Count Display
    const lockedCountEl = document.getElementById('locked-count-display');
    if (lockedCountEl) {
      lockedCountEl.textContent = `${lockedWaypoints.length} / ${WAYPOINTS.length} LOCKED`;
    }

    // 3. Sequence Pill
    const seqPill = document.getElementById('sequence-state-pill');
    if (seqPill) {
      if (lockedWaypoints.length === WAYPOINTS.length) {
        seqPill.textContent = 'PROFILE ARMED';
        seqPill.className = 'status-pill-sub text-amber';
      } else {
        seqPill.textContent = 'INCOMPLETE';
        seqPill.className = 'status-pill-sub';
      }
    }

    // 4. Safety Interlock Switch
    const interlockToggle = document.getElementById('safety-interlock-toggle');
    const interlockStatusText = document.getElementById('interlock-status-text');
    const interlockWarning = document.getElementById('interlock-warning-box');
    const footerSafety = document.getElementById('footer-safety-indicator');

    if (interlockToggle) {
      interlockToggle.className = `btn-interlock ${isInterlockEngaged ? 'state-engaged' : 'state-released'}`;
      interlockToggle.setAttribute('aria-checked', isInterlockEngaged ? 'true' : 'false');
    }
    if (interlockStatusText) {
      interlockStatusText.textContent = isInterlockEngaged
        ? 'INTERLOCK ENGAGED // DESCENT LOCKED'
        : 'INTERLOCK RELEASED // DESCENT PERMITTED';
    }
    if (interlockWarning) {
      interlockWarning.style.display = isInterlockEngaged ? 'flex' : 'none';
    }
    if (footerSafety) {
      footerSafety.textContent = isInterlockEngaged ? 'INTERLOCK: ENGAGED' : 'INTERLOCK: RELEASED';
      footerSafety.className = `safety-indicator ${isInterlockEngaged ? 'state-engaged' : ''}`;
    }

    // 5. Commence Descent Actuator Button
    const actBtn = document.getElementById('btn-commence-descent');
    const actPrimaryText = document.getElementById('act-primary-text');
    const actSubtext = document.getElementById('act-subtext');
    const actStageLabel = document.getElementById('act-stage-label');
    const hudApertureState = document.getElementById('hud-aperture-state');

    if (actBtn) {
      if (dialerState === 'SUSTAINED_ACTIVE') {
        actBtn.disabled = true;
        actBtn.className = 'btn-commence-descent active-sustained';
        if (actPrimaryText) actPrimaryText.textContent = 'APERTURE STABILIZED ACTIVE';
        if (actSubtext) actSubtext.textContent = 'HOLDING AT 11,800m HADAL GATEWAY';
        if (actStageLabel) actStageLabel.textContent = 'STAGE 03: ACTIVE';
        if (hudApertureState) {
          hudApertureState.textContent = 'HADAL GATEWAY ACTIVE // APERTURE OPEN';
          hudApertureState.className = 'hud-aperture-state-pill state-active';
        }
      } else if (dialerState === 'BREAKTHROUGH') {
        actBtn.disabled = true;
        actBtn.className = 'btn-commence-descent active-buildup';
        if (actPrimaryText) actPrimaryText.textContent = 'APERTURE BREACH IN PROGRESS';
        if (actSubtext) actSubtext.textContent = 'CROSSING DIMENSIONAL THRESHOLD';
        if (actStageLabel) actStageLabel.textContent = 'STAGE 02: BREACH';
        if (hudApertureState) {
          hudApertureState.textContent = 'APERTURE BREAKTHROUGH // 11,800M';
          hudApertureState.className = 'hud-aperture-state-pill state-buildup';
        }
      } else if (dialerState === 'BUILDUP') {
        actBtn.disabled = true;
        actBtn.className = 'btn-commence-descent active-buildup';
        if (actPrimaryText) actPrimaryText.textContent = 'COMMENCING DESCENT BUILDUP';
        if (actSubtext) actSubtext.textContent = 'HYDRAULIC PURGE & THRUSTER SURGE';
        if (actStageLabel) actStageLabel.textContent = 'STAGE 01: BUILDUP';
        if (hudApertureState) {
          hudApertureState.textContent = 'DESCENT BUILDUP // ACCELERATING';
          hudApertureState.className = 'hud-aperture-state-pill state-buildup';
        }
      } else if (lockedWaypoints.length === WAYPOINTS.length) {
        actBtn.disabled = isInterlockEngaged;
        actBtn.className = isInterlockEngaged ? 'btn-commence-descent' : 'btn-commence-descent ready';
        if (actPrimaryText) actPrimaryText.textContent = 'COMMENCE DESCENT APERTURE';
        if (actSubtext) actSubtext.textContent = isInterlockEngaged ? 'RELEASE SAFETY INTERLOCK TO ACTUATE' : 'READY TO ENGAGE HADAL DESCENT';
        if (actStageLabel) actStageLabel.textContent = 'ARMED & PENDING';
        if (hudApertureState) {
          hudApertureState.textContent = 'DESCENT PROFILE ARMED // AWAITING ACTUATION';
          hudApertureState.className = 'hud-aperture-state-pill state-ready';
        }
      } else {
        actBtn.disabled = true;
        actBtn.className = 'btn-commence-descent';
        if (actPrimaryText) actPrimaryText.textContent = 'COMMENCE DESCENT APERTURE';
        if (actSubtext) actSubtext.textContent = `LOCK ALL 8 WAYPOINTS (${lockedWaypoints.length}/8)`;
        if (actStageLabel) actStageLabel.textContent = 'STANDBY';
        if (hudApertureState) {
          hudApertureState.textContent = 'SURFACE HOLD // PROFILE PENDING';
          hudApertureState.className = 'hud-aperture-state-pill';
        }
      }
    }

    // 6. Stage Matrix Indicators
    const stg1 = document.getElementById('stage-step-1');
    const stg2 = document.getElementById('stage-step-2');
    const stg3 = document.getElementById('stage-step-3');
    const stgState1 = document.getElementById('stage-state-1');
    const stgState2 = document.getElementById('stage-state-2');
    const stgState3 = document.getElementById('stage-state-3');

    if (stg1 && stg2 && stg3) {
      stg1.className = 'stage-step';
      stg2.className = 'stage-step';
      stg3.className = 'stage-step';

      if (dialerState === 'BUILDUP') {
        stg1.className = 'stage-step active';
        if (stgState1) stgState1.textContent = 'SURGING';
        if (stgState2) stgState2.textContent = 'PENDING';
        if (stgState3) stgState3.textContent = 'PENDING';
      } else if (dialerState === 'BREAKTHROUGH') {
        stg1.className = 'stage-step completed';
        stg2.className = 'stage-step active';
        if (stgState1) stgState1.textContent = 'COMPLETE';
        if (stgState2) stgState2.textContent = 'BREACH';
        if (stgState3) stgState3.textContent = 'PENDING';
      } else if (dialerState === 'SUSTAINED_ACTIVE') {
        stg1.className = 'stage-step completed';
        stg2.className = 'stage-step completed';
        stg3.className = 'stage-step active';
        if (stgState1) stgState1.textContent = 'COMPLETE';
        if (stgState2) stgState2.textContent = 'COMPLETE';
        if (stgState3) stgState3.textContent = 'STABLE';
      } else if (lockedWaypoints.length === WAYPOINTS.length) {
        if (stgState1) stgState1.textContent = 'ARMED';
        if (stgState2) stgState2.textContent = 'PENDING';
        if (stgState3) stgState3.textContent = 'PENDING';
      } else {
        if (stgState1) stgState1.textContent = 'STANDBY';
        if (stgState2) stgState2.textContent = 'STANDBY';
        if (stgState3) stgState3.textContent = 'STANDBY';
      }
    }
  };

  return {
    WAYPOINTS,
    TRIM_CHANNELS,
    getWaypoints,
    getTrimChannels,
    getLockedWaypoints,
    getDialerState,
    isInterlockActive,
    setInterlock,
    toggleInterlock,
    selectWaypoint,
    commenceDescent,
    emergencyBlowBallast,
    renderTrimBars,
    updateUIState
  };
})();

window.Dialer = Dialer;
