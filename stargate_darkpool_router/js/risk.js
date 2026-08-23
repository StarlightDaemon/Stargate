/**
 * VALENCE-9 Hardware Risk Interlock & Circuit Breaker
 * Pre-trade risk control module. Defaults strictly to RELEASED (0).
 */

class RiskInterlock {
  constructor() {
    this.isEngaged = false; // MUST default to false (RELEASED)
    this.alarmActive = false;
    this.alarmTimer = null;
  }

  init() {
    this.toggleEl = document.getElementById('risk-toggle');
    this.statusLed = document.getElementById('risk-led');
    this.statusLabel = document.getElementById('risk-status-label');
    this.bannerEl = document.getElementById('risk-alarm-banner');
    this.panelEl = document.getElementById('risk-panel');

    if (this.toggleEl) {
      this.toggleEl.checked = false; // Defaults to released
      this.toggleEl.addEventListener('change', (e) => {
        this.setEngaged(e.target.checked);
      });
    }

    this.updateUI();
  }

  setEngaged(engaged) {
    this.isEngaged = engaged;
    if (this.toggleEl) this.toggleEl.checked = engaged;
    if (window.soundEngine) {
      if (engaged) {
        window.soundEngine.playRiskAlert();
      } else {
        window.soundEngine.playPresetClick();
      }
    }
    if (!engaged) {
      this.clearAlarm();
    }
    this.updateUI();
  }

  updateUI() {
    if (this.statusLed) {
      if (this.isEngaged) {
        this.statusLed.className = 'risk-led led-engaged';
      } else {
        this.statusLed.className = 'risk-led led-released';
      }
    }

    if (this.statusLabel) {
      this.statusLabel.textContent = this.isEngaged ? 'ENGAGED // EXECUTION BLOCKED' : 'RELEASED // DIRECT ROUTE ARMED';
      this.statusLabel.style.color = this.isEngaged ? '#ff0055' : '#00ff9d';
    }

    if (this.panelEl) {
      if (this.isEngaged) {
        this.panelEl.classList.add('panel-risk-engaged');
      } else {
        this.panelEl.classList.remove('panel-risk-engaged');
      }
    }
  }

  triggerTripAlert() {
    this.alarmActive = true;
    if (window.soundEngine) window.soundEngine.playRiskAlert();

    if (this.bannerEl) {
      this.bannerEl.textContent = 'RISK LIMIT TRIP: PRE-TRADE EXPOSURE EXCEEDED // EXECUTION HALTED';
      this.bannerEl.classList.add('active-alarm');
    }

    if (this.panelEl) {
      this.panelEl.classList.add('alarm-shake');
      setTimeout(() => {
        if (this.panelEl) this.panelEl.classList.remove('alarm-shake');
      }, 600);
    }

    clearTimeout(this.alarmTimer);
    this.alarmTimer = setTimeout(() => {
      this.clearAlarm();
    }, 4500);
  }

  clearAlarm() {
    this.alarmActive = false;
    if (this.bannerEl) {
      this.bannerEl.classList.remove('active-alarm');
    }
  }
}

window.RiskInterlock = RiskInterlock;
window.riskInterlock = new RiskInterlock();
