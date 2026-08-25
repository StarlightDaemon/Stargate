/**
 * DSV-9 ARCHELON - Console Settings & Web Audio Mixer Controller
 * Manages color mood themes, display density, motion intensity,
 * and synthesized acoustic channel mixing with localStorage persistence.
 */

const Settings = (() => {
  let currentPrefs = null;

  const init = () => {
    currentPrefs = Storage.getPreferences();
    applyPreferences(currentPrefs);
    bindEvents();
  };

  const applyPreferences = (prefs) => {
    // 1. Theme
    document.body.setAttribute('data-theme', prefs.theme);
    document.querySelectorAll('.theme-opt-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-set-theme') === prefs.theme);
    });

    // 2. Display Density
    const densitySelect = document.getElementById('setting-density-select');
    if (densitySelect) densitySelect.value = prefs.density;
    document.body.className = document.body.className
      .replace(/density-\w+/g, '') + ` density-${prefs.density}`;

    // 3. Motion Intensity
    const motionSelect = document.getElementById('setting-motion-select');
    if (motionSelect) motionSelect.value = prefs.motion;
    document.body.className = document.body.className
      .replace(/motion-\w+/g, '') + ` motion-${prefs.motion}`;

    // 4. Audio Volumes
    const volMaster = document.getElementById('vol-master');
    const volBallast = document.getElementById('vol-ballast');
    const volThruster = document.getElementById('vol-thruster');
    const volHull = document.getElementById('vol-hull');
    const volDrone = document.getElementById('vol-drone');

    if (volMaster) {
      volMaster.value = prefs.audioVolumes.master;
      document.getElementById('val-vol-master').textContent = `${prefs.audioVolumes.master}%`;
      SoundEngine.setMasterVolume(prefs.audioVolumes.master);
    }
    if (volBallast) {
      volBallast.value = prefs.audioVolumes.ballast;
      document.getElementById('val-vol-ballast').textContent = `${prefs.audioVolumes.ballast}%`;
      SoundEngine.setChannelVolume('ballast', prefs.audioVolumes.ballast);
    }
    if (volThruster) {
      volThruster.value = prefs.audioVolumes.thruster;
      document.getElementById('val-vol-thruster').textContent = `${prefs.audioVolumes.thruster}%`;
      SoundEngine.setChannelVolume('thruster', prefs.audioVolumes.thruster);
    }
    if (volHull) {
      volHull.value = prefs.audioVolumes.hull;
      document.getElementById('val-vol-hull').textContent = `${prefs.audioVolumes.hull}%`;
      SoundEngine.setChannelVolume('hull', prefs.audioVolumes.hull);
    }
    if (volDrone) {
      volDrone.value = prefs.audioVolumes.drone;
      document.getElementById('val-vol-drone').textContent = `${prefs.audioVolumes.drone}%`;
      SoundEngine.setChannelVolume('drone', prefs.audioVolumes.drone);
    }
  };

  const bindEvents = () => {
    // Theme buttons
    document.querySelectorAll('.theme-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-set-theme');
        if (theme) {
          currentPrefs.theme = theme;
          Storage.savePreferences(currentPrefs);
          applyPreferences(currentPrefs);
          SoundEngine.playSolenoidClick();
          Storage.logEvent('SETTINGS', `Switched HUD instrument theme to: ${theme.toUpperCase()}`);
        }
      });
    });

    // Density select
    const densitySelect = document.getElementById('setting-density-select');
    if (densitySelect) {
      densitySelect.addEventListener('change', (e) => {
        currentPrefs.density = e.target.value;
        Storage.savePreferences(currentPrefs);
        applyPreferences(currentPrefs);
        SoundEngine.playSolenoidClick();
      });
    }

    // Motion select
    const motionSelect = document.getElementById('setting-motion-select');
    if (motionSelect) {
      motionSelect.addEventListener('change', (e) => {
        currentPrefs.motion = e.target.value;
        Storage.savePreferences(currentPrefs);
        applyPreferences(currentPrefs);
        SoundEngine.playSolenoidClick();
      });
    }

    // Sliders
    const setupSlider = (sliderId, labelId, channel) => {
      const slider = document.getElementById(sliderId);
      const label = document.getElementById(labelId);
      if (slider && label) {
        slider.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          label.textContent = `${val}%`;
          if (channel === 'master') {
            currentPrefs.audioVolumes.master = val;
            SoundEngine.setMasterVolume(val);
          } else {
            currentPrefs.audioVolumes[channel] = val;
            SoundEngine.setChannelVolume(channel, val);
          }
          Storage.savePreferences(currentPrefs);
        });
      }
    };

    setupSlider('vol-master', 'val-vol-master', 'master');
    setupSlider('vol-ballast', 'val-vol-ballast', 'ballast');
    setupSlider('vol-thruster', 'val-vol-thruster', 'thruster');
    setupSlider('vol-hull', 'val-vol-hull', 'hull');
    setupSlider('vol-drone', 'val-vol-drone', 'drone');
  };

  return {
    init,
    applyPreferences
  };
})();

window.Settings = Settings;
