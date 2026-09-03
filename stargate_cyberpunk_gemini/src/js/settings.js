/**
 * Khepri Cipher Terminal - System Matrix Settings & Theme Engine
 */

class CipherSettingsManager {
  constructor() {
    this.drawer = document.getElementById('settings-drawer');
    this.storageKey = 'khepri_terminal_settings';

    this.settings = {
      theme: 'emerald',
      masterVol: 0.7,
      droneVol: 0.35,
      sfxVol: 0.8,
      noiseVol: 0.2,
      scanlines: 0.15,
      reducedMotion: false
    };

    this.init();
  }

  init() {
    this.loadSettings();
    this.applySettings();
    this.bindEvents();
  }

  loadSettings() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Could not load settings from localStorage:', e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (e) {}
  }

  applySettings() {
    // Theme
    if (this.settings.theme === 'emerald') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', this.settings.theme);
    }

    // Active theme card styling
    const themeCards = document.querySelectorAll('.theme-card');
    themeCards.forEach(card => {
      if (card.getAttribute('data-theme-val') === this.settings.theme) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Scanlines
    document.documentElement.style.setProperty('--scanline-opacity', this.settings.scanlines);

    // Audio
    if (window.CipherAudio) {
      window.CipherAudio.setVolume('master', this.settings.masterVol);
      window.CipherAudio.setVolume('drone', this.settings.droneVol);
      window.CipherAudio.setVolume('sfx', this.settings.sfxVol);
      window.CipherAudio.setVolume('noise', this.settings.noiseVol);
    }

    // Inputs
    const sScanlines = document.getElementById('setting-scanlines');
    if (sScanlines) sScanlines.value = this.settings.scanlines;

    const sMaster = document.getElementById('setting-master-vol');
    if (sMaster) sMaster.value = this.settings.masterVol;

    const sDrone = document.getElementById('setting-drone-vol');
    if (sDrone) sDrone.value = this.settings.droneVol;

    const sSfx = document.getElementById('setting-sfx-vol');
    if (sSfx) sSfx.value = this.settings.sfxVol;
  }

  bindEvents() {
    // Theme buttons
    const themeCards = document.querySelectorAll('.theme-card');
    themeCards.forEach(card => {
      card.addEventListener('click', () => {
        const theme = card.getAttribute('data-theme-val');
        this.settings.theme = theme;
        this.applySettings();
        this.saveSettings();
        if (window.CipherAudio) window.CipherAudio.playCandidateTick();
      });
    });

    // Range inputs
    const bindRange = (id, key, callback) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          this.settings[key] = parseFloat(e.target.value);
          if (callback) callback(this.settings[key]);
          this.saveSettings();
        });
      }
    };

    bindRange('setting-scanlines', 'scanlines', (v) => {
      document.documentElement.style.setProperty('--scanline-opacity', v);
    });

    bindRange('setting-master-vol', 'masterVol', (v) => {
      if (window.CipherAudio) window.CipherAudio.setVolume('master', v);
    });

    bindRange('setting-drone-vol', 'droneVol', (v) => {
      if (window.CipherAudio) window.CipherAudio.setVolume('drone', v);
    });

    bindRange('setting-sfx-vol', 'sfxVol', (v) => {
      if (window.CipherAudio) window.CipherAudio.setVolume('sfx', v);
    });

    // Close button
    const closeBtn = document.getElementById('btn-close-settings');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }

  open() {
    if (this.drawer) this.drawer.classList.add('open');
  }

  close() {
    if (this.drawer) this.drawer.classList.remove('open');
  }

  isOpen() {
    return this.drawer && this.drawer.classList.contains('open');
  }
}

// Global Export
window.CipherSettingsManager = CipherSettingsManager;
