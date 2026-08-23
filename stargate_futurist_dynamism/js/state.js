/**
 * ISTITUTO DINAMICO DI PROPULSIONE E TRASLAZIONE (IDPT)
 * LocalStorage State Persistence & Operator Event Logger
 */

class FuturistStateManager {
  constructor() {
    this.STORAGE_KEY_PREFIX = 'idpt_gateway_';
    this.listeners = new Set();
    this.state = this.loadInitialState();
  }

  loadInitialState() {
    const defaultState = {
      theme: 'boccioni',
      motionIntensity: 1.0,
      audioVolumes: { master: 0.7, turbine: 0.6, shutter: 0.8, flux: 0.5 },
      dialHistory: [
        {
          id: 'DH-INIT-01',
          timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
          stators: [1, 3, 5, 2, 7, 9, 4],
          name: 'Collaudo Preliminare Statori',
          status: 'COMPLETATO',
          peakRpm: 12450
        }
      ],
      unlockedRecords: ['VR-1913-A', 'SEC-01', 'APP-01', 'ENG-01'],
      sessionLog: [
        {
          timestamp: new Date().toLocaleTimeString(),
          type: 'SISTEMA',
          message: 'Inizializzazione banco di prova cinetico IDPT completata con successo.'
        }
      ]
    };

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_PREFIX + 'state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultState, ...parsed };
      }
    } catch (e) {
      console.warn('[StateManager] LocalStorage read error:', e);
    }
    return defaultState;
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY_PREFIX + 'state', JSON.stringify(this.state));
    } catch (e) {
      console.warn('[StateManager] LocalStorage write error:', e);
    }
    this.notify();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach(cb => {
      try { cb(this.state); } catch (e) { console.error(e); }
    });
  }

  // Event Logging
  logEvent(type, message) {
    const entry = {
      id: 'EVT-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    this.state.sessionLog.unshift(entry);
    if (this.state.sessionLog.length > 60) {
      this.state.sessionLog.pop();
    }
    this.saveState();

    // Custom DOM event for real-time drawer updates
    window.dispatchEvent(new CustomEvent('idpt-log-entry', { detail: entry }));
  }

  // Dial Record Persistence
  recordDialRun(record) {
    this.state.dialHistory.unshift({
      id: 'DH-' + Date.now().toString(36).toUpperCase(),
      timestamp: new Date().toLocaleTimeString(),
      ...record
    });
    if (this.state.dialHistory.length > 25) {
      this.state.dialHistory.pop();
    }
    this.saveState();
  }

  // Unlock Relational Archive Entry
  unlockRecord(recordId) {
    if (!this.state.unlockedRecords.includes(recordId)) {
      this.state.unlockedRecords.push(recordId);
      this.logEvent('ARCHIVIO', `Nuovo dossier sbloccato nel registro: ${recordId}`);
      this.saveState();
    }
  }

  // Theme Management
  setTheme(themeName) {
    this.state.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName === 'boccioni' ? '' : themeName);
    this.logEvent('CONFIG', `Variazione cromatica impostata su: ${themeName.toUpperCase()}`);
    this.saveState();
  }

  // Motion Intensity
  setMotionIntensity(val) {
    this.state.motionIntensity = parseFloat(val);
    document.documentElement.style.setProperty('--motion-intensity', val);
    this.saveState();
  }

  // Audio Volume
  setAudioVolume(channel, val) {
    this.state.audioVolumes[channel] = parseFloat(val);
    if (window.idptAudio) {
      window.idptAudio.setVolume(channel, val);
    }
    this.saveState();
  }

  clearSessionLog() {
    this.state.sessionLog = [
      {
        timestamp: new Date().toLocaleTimeString(),
        type: 'SISTEMA',
        message: 'Registro delle operazioni azzerato dall\'operatore.'
      }
    ];
    this.saveState();
  }
}

window.idptState = new FuturistStateManager();
