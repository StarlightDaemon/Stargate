/**
 * BOREAS-IX Instrument Settings & Theme Controller
 * Handles visual themes, display density, particle motion intensity, and audio mixing buses.
 */

class SettingsManager {
  constructor() {
    this.currentTheme = 'deep-xenon';
    this.currentDensity = 'standard';
    this.currentMotion = 'full';

    this.initFromStorage();
  }

  initFromStorage() {
    if (window.dmStorage) {
      const savedTheme = window.dmStorage.get('theme') || 'deep-xenon';
      const savedDensity = window.dmStorage.get('density') || 'standard';
      const savedMotion = window.dmStorage.get('motion') || 'full';
      
      this.applyTheme(savedTheme, false);
      this.applyDensity(savedDensity, false);
      this.applyMotion(savedMotion, false);
    }
  }

  applyTheme(themeName, save = true) {
    this.currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Update theme radio buttons in settings UI if available
    const radio = document.querySelector(`input[name="theme-select"][value="${themeName}"]`);
    if (radio) radio.checked = true;

    if (save && window.dmStorage) {
      window.dmStorage.set('theme', themeName);
      if (window.dmLogger) {
        window.dmLogger.log('SYSTEM', `Instrument color scheme set to: ${themeName}`);
      }
    }
  }

  applyDensity(density, save = true) {
    this.currentDensity = density;
    document.documentElement.setAttribute('data-density', density);

    const radio = document.querySelector(`input[name="density-select"][value="${density}"]`);
    if (radio) radio.checked = true;

    if (save && window.dmStorage) {
      window.dmStorage.set('density', density);
      if (window.dmLogger) {
        window.dmLogger.log('SYSTEM', `Telemetry display density set to: ${density}`);
      }
    }
  }

  applyMotion(motion, save = true) {
    this.currentMotion = motion;
    document.documentElement.setAttribute('data-motion', motion);

    const radio = document.querySelector(`input[name="motion-select"][value="${motion}"]`);
    if (radio) radio.checked = true;

    if (save && window.dmStorage) {
      window.dmStorage.set('motion', motion);
      if (window.dmLogger) {
        window.dmLogger.log('SYSTEM', `Particle animation intensity set to: ${motion}`);
      }
    }
  }

  bindUI() {
    // Theme selectors
    document.querySelectorAll('input[name="theme-select"]').forEach(r => {
      r.addEventListener('change', (e) => {
        this.applyTheme(e.target.value, true);
      });
    });

    // Density selectors
    document.querySelectorAll('input[name="density-select"]').forEach(r => {
      r.addEventListener('change', (e) => {
        this.applyDensity(e.target.value, true);
      });
    });

    // Motion selectors
    document.querySelectorAll('input[name="motion-select"]').forEach(r => {
      r.addEventListener('change', (e) => {
        this.applyMotion(e.target.value, true);
      });
    });

    // Audio volume sliders
    const audioChannels = ['master', 'cryo', 'pmt', 'chime', 'veto', 'aperture'];
    audioChannels.forEach(ch => {
      const slider = document.getElementById(`vol-${ch}`);
      if (slider) {
        // Set initial slider value from storage
        const savedAudio = window.dmStorage ? window.dmStorage.get('audio') : null;
        if (savedAudio && savedAudio[ch] !== undefined) {
          slider.value = savedAudio[ch];
        }

        slider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          if (window.dmAudio) {
            window.dmAudio.setVolume(ch, val);
          }
          if (window.dmStorage) {
            const currentAudio = window.dmStorage.get('audio') || {};
            currentAudio[ch] = val;
            window.dmStorage.set('audio', currentAudio);
          }
        });
      }
    });

    // Reset button
    const resetBtn = document.getElementById('btn-reset-storage');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset all saved session history, preferences, and telemetry logs?')) {
          if (window.dmStorage) window.dmStorage.resetAll();
          location.reload();
        }
      });
    }
  }
}

window.dmSettings = new SettingsManager();
