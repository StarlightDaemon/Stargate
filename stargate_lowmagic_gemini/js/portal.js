/**
 * portal.js — Portal State Controller & Three-Stage Activation Engine
 * Part of Stargate Low Magic ("RUSHLIGHT")
 *
 * Implements:
 * 1. PENDING_KINDLE state (never auto-fires upon 7th symbol)
 * 2. Strict 3-stage activation: BUILDUP (1.8s) -> BREAKTHROUGH (instant) -> SUSTAINED ACTIVE
 * 3. Guaranteed cancellation on disengage (dual timer clearance + state check)
 * 4. Cold-Iron Threshold Nail safety interlock (defaults to RELEASED)
 */

const PORTAL_STATE = {
  IDLE: 'IDLE',
  DIALING: 'DIALING',
  PENDING_KINDLE: 'PENDING_KINDLE',
  BUILDUP: 'BUILDUP',
  BREAKTHROUGH: 'BREAKTHROUGH',
  ACTIVE: 'ACTIVE'
};

class PortalController {
  constructor() {
    this.state = PORTAL_STATE.IDLE;
    this.safetyInterlockEngaged = false; // MUST default to released (Standards Sec 6)
    this.activeTimers = []; // Storage for all timer handles (Standards Sec 8)

    // DOM Elements
    this.statusPillEl = null;
    this.statusTextEl = null;
    this.captionLiveEl = null;
    this.kindleBtnEl = null;
    this.snuffBtnEl = null;
    this.ironNailBtnEl = null;
    this.ironNailStatusEl = null;
    this.warningBannerEl = null;
    this.portalApertureEl = null;
    this.saltBoundaryEl = null;
    this.mothContainerEl = null;
    this.activeDestinationCardEl = null;

    this.currentDestination = null;
  }

  init() {
    this.statusPillEl = document.getElementById('portal-status-pill');
    this.statusTextEl = document.getElementById('portal-status-text');
    this.captionLiveEl = document.getElementById('live-portal-caption');
    this.kindleBtnEl = document.getElementById('btn-kindle-portal');
    this.snuffBtnEl = document.getElementById('btn-snuff-portal');
    this.ironNailBtnEl = document.getElementById('btn-iron-nail');
    this.ironNailStatusEl = document.getElementById('iron-nail-status');
    this.warningBannerEl = document.getElementById('hearth-warning-banner');
    this.portalApertureEl = document.getElementById('hearth-aperture');
    this.saltBoundaryEl = document.getElementById('salt-boundary-ring');
    this.mothContainerEl = document.getElementById('active-moths-container');
    this.activeDestinationCardEl = document.getElementById('active-destination-display');

    this.setupListeners();
    this.updateUI();

    // Hook dial address changes
    window.HearthDial.onAddressChanged = (address) => {
      this.handleAddressChanged(address);
    };

    window.HearthDial.onPendingKindle = (address) => {
      this.handlePendingKindle(address);
    };
  }

  // Timer helper enforcing handle tracking
  scheduleTimer(fn, delayMs) {
    const handle = setTimeout(() => {
      // Remove handle from active list
      this.activeTimers = this.activeTimers.filter(h => h !== handle);
      fn();
    }, delayMs);
    this.activeTimers.push(handle);
    return handle;
  }

  clearAllTimers() {
    this.activeTimers.forEach(h => clearTimeout(h));
    this.activeTimers = [];
  }

  setupListeners() {
    if (this.kindleBtnEl) {
      this.kindleBtnEl.addEventListener('click', () => {
        this.attemptKindle();
      });
    }

    if (this.snuffBtnEl) {
      this.snuffBtnEl.addEventListener('click', () => {
        this.disengage("Operator snuffed the hearth.");
      });
    }

    if (this.ironNailBtnEl) {
      this.ironNailBtnEl.addEventListener('click', () => {
        this.toggleSafetyInterlock();
      });
    }
  }

  toggleSafetyInterlock() {
    this.safetyInterlockEngaged = !this.safetyInterlockEngaged;
    window.FolkAudio.playBarredClang();

    if (this.ironNailBtnEl) {
      this.ironNailBtnEl.setAttribute('aria-pressed', this.safetyInterlockEngaged ? 'true' : 'false');
      if (this.safetyInterlockEngaged) {
        this.ironNailBtnEl.classList.add('engaged');
      } else {
        this.ironNailBtnEl.classList.remove('engaged');
      }
    }

    if (this.ironNailStatusEl) {
      this.ironNailStatusEl.textContent = this.safetyInterlockEngaged ? "Driven (Barred)" : "Drawn (Released)";
    }

    if (this.warningBannerEl) {
      if (this.safetyInterlockEngaged && this.state === PORTAL_STATE.PENDING_KINDLE) {
        this.showWarning("Cold iron rests in the hearthstone. The threshold will not catch until drawn.");
      } else {
        this.hideWarning();
      }
    }

    this.caption(`Cold-Iron Threshold Nail is now ${this.safetyInterlockEngaged ? 'engaged and barring' : 'released'}.`);
    this.updateUI();
  }

  handleAddressChanged(address) {
    if (this.state === PORTAL_STATE.ACTIVE || this.state === PORTAL_STATE.BUILDUP) {
      return;
    }

    if (address.length === 0) {
      this.state = PORTAL_STATE.IDLE;
      this.currentDestination = null;
    } else if (address.length < 7) {
      this.state = PORTAL_STATE.DIALING;
      this.currentDestination = null;
    }
    this.updateUI();
  }

  handlePendingKindle(address) {
    // 7 symbols complete: STANDARDS MANDATE NEVER AUTO-FIRE!
    this.state = PORTAL_STATE.PENDING_KINDLE;

    // Check if matching destination exists
    const match = window.FOLK_DESTINATIONS.find(dest => {
      return dest.symbols.length === 7 && dest.symbols.every((s, i) => s === address[i]);
    });

    this.currentDestination = match || {
      id: "uncharted-hearth",
      name: "Uncharted Cot-Hearth",
      region: "Beyond the Pale",
      season: "Nameless Twilight",
      lore: "A hearth not recorded in the old parish rolls. The smoke rises thin and sweet into unknown pines.",
      symbols: [...address]
    };

    if (this.safetyInterlockEngaged) {
      this.showWarning("Cold iron bars the threshold. Draw the iron nail to permit kindling.");
    } else {
      this.hideWarning();
    }

    this.caption(`Seven knots tied for ${this.currentDestination.name}. Kindler is primed and awaiting touch.`);
    this.updateUI();
  }

  showWarning(text) {
    if (this.warningBannerEl) {
      this.warningBannerEl.textContent = text;
      this.warningBannerEl.classList.add('visible');
    }
  }

  hideWarning() {
    if (this.warningBannerEl) {
      this.warningBannerEl.textContent = '';
      this.warningBannerEl.classList.remove('visible');
    }
  }

  attemptKindle() {
    // Can only kindle from PENDING_KINDLE state
    if (this.state !== PORTAL_STATE.PENDING_KINDLE) {
      if (this.state === PORTAL_STATE.ACTIVE || this.state === PORTAL_STATE.BUILDUP) {
        return;
      }
      this.caption("The hearth is incomplete. Seven cords must be tied before kindling.");
      window.FolkAudio.playChalkScrape();
      return;
    }

    // Check safety interlock
    if (this.safetyInterlockEngaged) {
      this.showWarning("BARRED: Cold iron bars the threshold! Draw the nail before kindling.");
      window.FolkAudio.playBarredClang();
      this.caption("Kindling failed: Cold-Iron Nail is driven.");
      return;
    }

    this.hideWarning();
    this.beginThreeStageActivation();
  }

  beginThreeStageActivation() {
    // -------------------------------------------------------------
    // STAGE 1: BUILDUP (1.8 seconds)
    // -------------------------------------------------------------
    this.state = PORTAL_STATE.BUILDUP;
    window.HearthDial.setLock(true);
    this.updateUI();

    this.caption("Stage 1: Kindling Buildup. Bellows breath stirs the tallow wick; linen cords draw taut.");

    // Sound: bellows breath + tallow crackle start
    window.FolkAudio.playBellows();
    window.FolkAudio.startTallowHiss();

    // Visual: Salt boundary glows warm ochre, aperture darkens with warm embers
    if (this.portalApertureEl) {
      this.portalApertureEl.className = 'stage-buildup';
    }
    if (this.saltBoundaryEl) {
      this.saltBoundaryEl.classList.add('kindling-glow');
    }
    this.spawnBuildupEmbers();

    // Store timer with dual safety check
    this.scheduleTimer(() => {
      // Top-of-callback state re-check (Standards Sec 8)
      if (this.state !== PORTAL_STATE.BUILDUP) return;

      // -------------------------------------------------------------
      // STAGE 2: BREAKTHROUGH (Instantaneous crescendo)
      // -------------------------------------------------------------
      this.state = PORTAL_STATE.BREAKTHROUGH;
      this.updateUI();

      this.caption("Stage 2: Breakthrough! The salt line fractures; the bronze hearth-bell strikes.");

      // Sound: resonant bronze hearth bell + chalk snap
      window.FolkAudio.playHearthBell();

      // Visual: instant bloom explosion of botanical pressings
      if (this.portalApertureEl) {
        this.portalApertureEl.className = 'stage-breakthrough';
      }
      this.clearBuildupEmbers();

      // Schedule transition to sustained active after 650ms dramatic bloom
      this.scheduleTimer(() => {
        // Top-of-callback state re-check (Standards Sec 8)
        if (this.state !== PORTAL_STATE.BREAKTHROUGH) return;

        // -------------------------------------------------------------
        // STAGE 3: SUSTAINED ACTIVE
        // -------------------------------------------------------------
        this.state = PORTAL_STATE.ACTIVE;
        this.updateUI();

        this.caption(`Stage 3: Hearth Wide Open to ${this.currentDestination ? this.currentDestination.name : 'the Threshold'}. Thistle seedheads and night moths drift.`);

        // Sound: warm hearth drone + gentle crackle
        window.FolkAudio.startHearthDrone();

        // Visual: aperture veil open with drifting moths/seeds
        if (this.portalApertureEl) {
          this.portalApertureEl.className = 'stage-active';
        }
        this.spawnActiveMoths();
        this.showDestinationCard();

      }, 650);

    }, 1800);
  }

  spawnBuildupEmbers() {
    const container = document.getElementById('buildup-embers-container');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 12; i++) {
      const spark = document.createElement('div');
      spark.className = 'peat-ember-spark';
      const size = 3 + (i % 4) * 2;
      spark.style.width = `${size}px`;
      spark.style.height = `${size}px`;
      spark.style.left = `${15 + (i * 7) % 70}%`;
      spark.style.bottom = `${10 + (i * 6) % 35}%`;
      spark.style.animationDelay = `${(i * 0.15).toFixed(2)}s`;
      spark.style.animationDuration = `${(1.2 + (i % 3) * 0.4).toFixed(2)}s`;
      container.appendChild(spark);
    }
  }

  clearBuildupEmbers() {
    const container = document.getElementById('buildup-embers-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  spawnActiveMoths() {
    if (!this.mothContainerEl) return;
    this.mothContainerEl.innerHTML = '';

    // Create 7 flat vector moths & botanical seedheads drifting in SVG space
    for (let i = 0; i < 7; i++) {
      const moth = document.createElement('div');
      moth.className = `folk-moth-entity moth-type-${i % 3}`;
      moth.style.left = `${20 + (i * 11) % 65}%`;
      moth.style.top = `${25 + (i * 9) % 55}%`;
      moth.style.animationDelay = `${(i * 0.45).toFixed(2)}s`;
      moth.style.animationDuration = `${(3.5 + (i % 3) * 0.8).toFixed(2)}s`;

      moth.innerHTML = `
        <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.2">
          <ellipse cx="16" cy="16" rx="2" ry="7"/>
          <path d="M14 12C8 6 4 12 14 16" fill="currentColor" fill-opacity="0.25"/>
          <path d="M18 12C24 6 28 12 18 16" fill="currentColor" fill-opacity="0.25"/>
          <path d="M14 16C8 20 6 26 14 18" fill="currentColor" fill-opacity="0.18"/>
          <path d="M18 16C24 20 26 26 18 18" fill="currentColor" fill-opacity="0.18"/>
          <path d="M15 9l-3-4m5 4l3-4"/>
        </svg>
      `;
      this.mothContainerEl.appendChild(moth);
    }
  }

  clearMoths() {
    if (this.mothContainerEl) {
      this.mothContainerEl.innerHTML = '';
    }
  }

  showDestinationCard() {
    if (this.activeDestinationCardEl && this.currentDestination) {
      this.activeDestinationCardEl.innerHTML = `
        <div class="dest-card-inner">
          <span class="dest-card-region">${this.currentDestination.region} · ${this.currentDestination.season}</span>
          <h3 class="dest-card-title">${this.currentDestination.name}</h3>
          <p class="dest-card-lore">${this.currentDestination.lore}</p>
        </div>
      `;
      this.activeDestinationCardEl.classList.add('visible');
    }
  }

  hideDestinationCard() {
    if (this.activeDestinationCardEl) {
      this.activeDestinationCardEl.innerHTML = '';
      this.activeDestinationCardEl.classList.remove('visible');
    }
  }

  disengage(reason = "Hearth Snuffed") {
    // -------------------------------------------------------------
    // DISENGAGE GUARANTEE (Standards Sec 8)
    // Clear all scheduled timers immediately
    // -------------------------------------------------------------
    this.clearAllTimers();

    const previousState = this.state;
    this.state = PORTAL_STATE.IDLE;

    // Silence all audio immediately
    window.FolkAudio.silenceAll();
    window.FolkAudio.playShearSnip();
    window.FolkAudio.playSnuffAsh();

    // Reset visual stages
    if (this.portalApertureEl) {
      this.portalApertureEl.className = 'stage-idle';
    }
    if (this.saltBoundaryEl) {
      this.saltBoundaryEl.classList.remove('kindling-glow');
    }
    this.clearMoths();
    this.clearBuildupEmbers();
    this.hideDestinationCard();
    this.hideWarning();

    // Reset dial instrument
    window.HearthDial.setLock(false);
    window.HearthDial.clearDial();

    this.currentDestination = null;
    this.updateUI();

    this.caption(`Disengaged: ${reason} System returned to idle.`);
  }

  updateUI() {
    if (this.statusPillEl) {
      this.statusPillEl.className = `status-pill state-${this.state.toLowerCase()}`;
    }

    if (this.statusTextEl) {
      switch (this.state) {
        case PORTAL_STATE.IDLE:
          this.statusTextEl.textContent = "HEARTH SLUMBERING";
          break;
        case PORTAL_STATE.DIALING:
          this.statusTextEl.textContent = `TYING CORDS (${window.HearthDial.getAddress().length}/7)`;
          break;
        case PORTAL_STATE.PENDING_KINDLE:
          this.statusTextEl.textContent = "BOUND & PENDING KINDLE";
          break;
        case PORTAL_STATE.BUILDUP:
          this.statusTextEl.textContent = "KINDLING BUILDUP...";
          break;
        case PORTAL_STATE.BREAKTHROUGH:
          this.statusTextEl.textContent = "BREAKTHROUGH!";
          break;
        case PORTAL_STATE.ACTIVE:
          this.statusTextEl.textContent = "HEARTH-GATE OPEN";
          break;
      }
    }

    if (this.kindleBtnEl) {
      const canKindle = (this.state === PORTAL_STATE.PENDING_KINDLE && !this.safetyInterlockEngaged);
      if (canKindle) {
        this.kindleBtnEl.removeAttribute('disabled');
        this.kindleBtnEl.classList.add('ready-to-kindle');
      } else {
        this.kindleBtnEl.setAttribute('disabled', 'true');
        this.kindleBtnEl.classList.remove('ready-to-kindle');
      }
    }

    // Disengage is always reachable!
    if (this.snuffBtnEl) {
      this.snuffBtnEl.removeAttribute('disabled');
    }
  }

  caption(text) {
    if (this.captionLiveEl) {
      this.captionLiveEl.textContent = text;
    }
  }

  getState() {
    return this.state;
  }
}

window.Portal = new PortalController();
