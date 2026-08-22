// Settings & Theme Customization Modal Component

import { soundEngine } from '../audio/soundEngine.js';

export class SettingsModal {
  constructor(onThemeChange) {
    this.modal = document.getElementById('modal-settings');
    this.onThemeChange = onThemeChange;
    this.currentTheme = 'theme-cyan';

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.volumeSlider = document.getElementById('setting-volume');
    this.volumeValTxt = document.getElementById('volume-val-txt');
    this.ambientCheck = document.getElementById('setting-audio-ambient');
    this.scanlinesCheck = document.getElementById('setting-scanlines');
    this.reduceMotionCheck = document.getElementById('setting-reduce-motion');
    this.themeBtns = document.querySelectorAll('.theme-btn');
    this.crtOverlay = document.getElementById('crt-overlay');
  }

  bindEvents() {
    const openBtn = document.getElementById('btn-open-settings');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        soundEngine.playUiClick();
        this.modal.classList.add('is-open');
        this.modal.setAttribute('aria-hidden', 'false');
      });
    }

    document.querySelectorAll('[data-close="modal-settings"]').forEach(btn => {
      btn.addEventListener('click', () => {
        soundEngine.playUiClick();
        this.modal.classList.remove('is-open');
        this.modal.setAttribute('aria-hidden', 'true');
      });
    });

    // Volume Slider
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        soundEngine.setVolume(val);
        if (this.volumeValTxt) {
          this.volumeValTxt.textContent = `${Math.round(val * 100)}%`;
        }
      });
    }

    // Ambient Audio Check
    if (this.ambientCheck) {
      this.ambientCheck.addEventListener('change', (e) => {
        soundEngine.setAmbientEnabled(e.target.checked);
      });
    }

    // CRT Scanlines Check
    if (this.scanlinesCheck && this.crtOverlay) {
      this.scanlinesCheck.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.crtOverlay.classList.remove('disabled');
        } else {
          this.crtOverlay.classList.add('disabled');
        }
      });
    }

    // Theme Buttons
    this.themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        soundEngine.playUiClick();
        const theme = btn.dataset.theme;
        this.setTheme(theme);
      });
    });
  }

  setTheme(themeName) {
    this.currentTheme = themeName;
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
      appContainer.className = themeName;
    }

    this.themeBtns.forEach(b => {
      if (b.dataset.theme === themeName) b.classList.add('active');
      else b.classList.remove('active');
    });

    let hex = '#00f0ff';
    let rgb = '0, 240, 255';
    if (themeName === 'theme-amber') { hex = '#ffaa00'; rgb = '255, 170, 0'; }
    if (themeName === 'theme-emerald') { hex = '#00ff88'; rgb = '0, 255, 136'; }
    if (themeName === 'theme-violet') { hex = '#d946ef'; rgb = '217, 70, 239'; }

    if (this.onThemeChange) {
      this.onThemeChange(hex, rgb);
    }
  }
}
