/**
 * VALENCE-9 Staged Activation Engine
 * Coordinates the 3-stage execution sequence: Buildup -> Breakthrough -> Sustained Active
 * Enforces pre-trade risk interlock and manual trigger requirement (No Auto-Fire).
 */

class ActivationEngine {
  constructor() {
    this.state = 'IDLE'; // IDLE, READY, BUILDUP, BREAKTHROUGH, ACTIVE
    this.isReady = false;
    this.buildupTimer = null;
    this.buildupRaf = null;
    this.pnlInterval = null;
    this.runningPnl = 0;
  }

  init() {
    this.activateBtn = document.getElementById('btn-activate');
    this.disengageBtn = document.getElementById('btn-disengage');
    this.statusPill = document.getElementById('system-status-pill');
    this.pnlDisplay = document.getElementById('live-pnl-val');
    this.volatilityDisplay = document.getElementById('volatility-gauge-val');
    this.volumeDisplay = document.getElementById('volume-multiplier-val');

    if (this.activateBtn) {
      this.activateBtn.addEventListener('click', () => {
        this.handleActivateClick();
      });
    }

    if (this.disengageBtn) {
      this.disengageBtn.addEventListener('click', () => {
        this.disengage();
      });
    }

    this.updateUI();
  }

  setReadyState(ready) {
    this.isReady = ready;
    if (this.state !== 'BUILDUP' && this.state !== 'ACTIVE') {
      this.state = ready ? 'READY' : 'IDLE';
    }
    this.updateUI();
  }

  handleActivateClick() {
    if (!this.isReady || this.state === 'BUILDUP' || this.state === 'ACTIVE') {
      return;
    }

    // Pre-Trade Risk Interlock Check
    if (window.riskInterlock && window.riskInterlock.isEngaged) {
      window.riskInterlock.triggerTripAlert();
      return;
    }

    this.startActivationSequence();
  }

  startActivationSequence() {
    this.state = 'BUILDUP';
    this.updateUI();

    if (window.orderBookRing) {
      window.orderBookRing.setSystemState('BUILDUP');
    }

    const duration = 1800; // 1.8 seconds
    const startTime = performance.now();

    if (window.soundEngine) {
      window.soundEngine.playBuildup(duration / 1000);
    }

    // Buildup telemetry animation
    const updateBuildup = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1.0, elapsed / duration);

      if (window.orderBookRing) {
        window.orderBookRing.setBuildupIntensity(progress);
      }

      if (this.volatilityDisplay) {
        this.volatilityDisplay.textContent = `${(14.2 + progress * 84.2).toFixed(1)}%`;
      }
      if (this.volumeDisplay) {
        this.volumeDisplay.textContent = `${(1.0 + progress * 14.8).toFixed(1)}x`;
      }

      if (progress < 1.0 && this.state === 'BUILDUP') {
        this.buildupRaf = requestAnimationFrame(updateBuildup);
      } else if (progress >= 1.0 && this.state === 'BUILDUP') {
        this.triggerBreakthrough();
      }
    };

    this.buildupRaf = requestAnimationFrame(updateBuildup);
  }

  triggerBreakthrough() {
    this.state = 'BREAKTHROUGH';
    this.updateUI();

    if (window.orderBookRing) {
      window.orderBookRing.triggerBreakthroughFlash();
    }

    if (window.soundEngine) {
      window.soundEngine.playBreakthrough();
    }

    // Flash overlay
    const flashOverlay = document.getElementById('breakthrough-flash-overlay');
    if (flashOverlay) {
      flashOverlay.classList.add('flash-active');
      setTimeout(() => {
        flashOverlay.classList.remove('flash-active');
      }, 500);
    }

    // Transition to Sustained Active after 350ms
    setTimeout(() => {
      if (this.state === 'BREAKTHROUGH') {
        this.enterSustainedActive();
      }
    }, 350);
  }

  enterSustainedActive() {
    this.state = 'ACTIVE';
    this.updateUI();

    if (window.orderBookRing) {
      window.orderBookRing.setSystemState('ACTIVE');
    }

    if (window.soundEngine) {
      window.soundEngine.startActiveAmbient();
    }

    // Live P&L accumulation stream
    this.runningPnl = 125000 + Math.random() * 45000;
    if (this.pnlInterval) clearInterval(this.pnlInterval);
    this.pnlInterval = setInterval(() => {
      if (this.state !== 'ACTIVE') return;
      this.runningPnl += (Math.random() * 2400 + 400);
      if (this.pnlDisplay) {
        this.pnlDisplay.textContent = `+$${this.runningPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (this.volatilityDisplay) {
        this.volatilityDisplay.textContent = `${(88.0 + Math.sin(Date.now() * 0.005) * 6.5).toFixed(1)}%`;
      }
      if (this.volumeDisplay) {
        this.volumeDisplay.textContent = `${(15.2 + Math.sin(Date.now() * 0.003) * 2.1).toFixed(1)}x`;
      }
    }, 120);
  }

  disengage() {
    // Cancel any ongoing buildup
    if (this.buildupRaf) {
      cancelAnimationFrame(this.buildupRaf);
      this.buildupRaf = null;
    }
    if (this.pnlInterval) {
      clearInterval(this.pnlInterval);
      this.pnlInterval = null;
    }

    // If auto-dial is running, stop it
    if (window.presetEngine) {
      window.presetEngine.stopAutoDial();
    }

    // Play Disengage Dump Sound
    if (window.soundEngine) {
      window.soundEngine.playDisengageDump();
    }

    this.state = 'IDLE';
    this.isReady = false;
    this.runningPnl = 0;

    // Reset Locking and Ring
    if (window.lockingEngine) {
      window.lockingEngine.resetAll();
    }

    // Reset telemetry displays
    if (this.pnlDisplay) this.pnlDisplay.textContent = '+$0.00';
    if (this.volatilityDisplay) this.volatilityDisplay.textContent = '14.2%';
    if (this.volumeDisplay) this.volumeDisplay.textContent = '1.0x';

    this.updateUI();
  }

  updateUI() {
    if (this.activateBtn) {
      this.activateBtn.className = 'action-btn btn-activate';
      if (this.state === 'ACTIVE') {
        this.activateBtn.classList.add('state-active');
        this.activateBtn.innerHTML = `
          <span class="btn-main">ROUTE ACTIVE</span>
          <span class="btn-sub">DARK POOL APERTURE OPEN // MATCHED</span>
        `;
        this.activateBtn.disabled = true;
      } else if (this.state === 'BUILDUP') {
        this.activateBtn.classList.add('state-buildup');
        this.activateBtn.innerHTML = `
          <span class="btn-main">TRANSMITTING...</span>
          <span class="btn-sub">CONVERGING LIQUIDITY VECTORS</span>
        `;
        this.activateBtn.disabled = true;
      } else if (this.state === 'BREAKTHROUGH') {
        this.activateBtn.classList.add('state-breakthrough');
        this.activateBtn.innerHTML = `
          <span class="btn-main">BREAKTHROUGH</span>
          <span class="btn-sub">MATCHED EXECUTION BURST</span>
        `;
        this.activateBtn.disabled = true;
      } else if (this.state === 'READY') {
        this.activateBtn.classList.add('state-ready');
        this.activateBtn.innerHTML = `
          <span class="btn-main">EXECUTE BASKET</span>
          <span class="btn-sub">7/7 LOCKED // READY TO ROUTE</span>
        `;
        this.activateBtn.disabled = false;
      } else {
        // IDLE
        this.activateBtn.classList.add('state-idle');
        const lockedCount = window.lockingEngine ? window.lockingEngine.activeBasket.length : 0;
        this.activateBtn.innerHTML = `
          <span class="btn-main">EXECUTE BASKET</span>
          <span class="btn-sub">${lockedCount}/7 LEGS SELECTED // STANDBY</span>
        `;
        this.activateBtn.disabled = true;
      }
    }

    if (this.statusPill) {
      this.statusPill.className = `status-pill status-${this.state.toLowerCase()}`;
      if (this.state === 'ACTIVE') {
        this.statusPill.textContent = 'STATUS: ACTIVE_EXECUTION';
      } else if (this.state === 'BUILDUP') {
        this.statusPill.textContent = 'STATUS: TRANSMITTING_BURST';
      } else if (this.state === 'READY') {
        this.statusPill.textContent = 'STATUS: BASKET_ROUTED_READY';
      } else {
        this.statusPill.textContent = 'STATUS: STANDBY_MONITORING';
      }
    }
  }
}

window.ActivationEngine = ActivationEngine;
window.activationEngine = new ActivationEngine();
