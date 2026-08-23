/**
 * BOREAS-IX Local Storage State Persistence Layer
 * Pure client-side single-device persistence surviving page reload.
 */

const STORAGE_KEY = 'boreas_ix_dark_matter_state_v1';

class DarkMatterStorage {
  constructor() {
    this.defaultState = {
      theme: 'deep-xenon',
      density: 'standard',
      motion: 'full',
      audio: {
        master: 0.7,
        cryo: 0.35,
        pmt: 0.25,
        chime: 0.6,
        veto: 0.5,
        aperture: 0.65,
        muted: false
      },
      blindAnalysisLock: false, // Must default to false (released)
      viewedArchiveIds: [],
      dialHistory: [],
      operatorNotes: '',
      stats: {
        totalChannelsScanned: 0,
        candidatesPassed: 0,
        candidatesRejected: 0,
        aperturesOpened: 0,
        firstActiveTimestamp: Date.now()
      }
    };

    this.state = this.loadState();
  }

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...this.defaultState };
      const parsed = JSON.parse(raw);
      return {
        ...this.defaultState,
        ...parsed,
        audio: { ...this.defaultState.audio, ...(parsed.audio || {}) },
        stats: { ...this.defaultState.stats, ...(parsed.stats || {}) },
        blindAnalysisLock: false // Always force default released on fresh load per scientific safety requirement
      };
    } catch (e) {
      console.warn('Could not read localStorage:', e);
      return { ...this.defaultState };
    }
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not write to localStorage:', e);
    }
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    this.saveState();
  }

  updateStats(metric, delta = 1) {
    if (this.state.stats[metric] !== undefined) {
      this.state.stats[metric] += delta;
      this.saveState();
    }
  }

  markArchiveViewed(id) {
    if (!this.state.viewedArchiveIds.includes(id)) {
      this.state.viewedArchiveIds.push(id);
      this.saveState();
    }
  }

  addDialHistory(entry) {
    this.state.dialHistory.unshift({
      ...entry,
      timestamp: new Date().toISOString()
    });
    if (this.state.dialHistory.length > 50) {
      this.state.dialHistory.pop();
    }
    this.saveState();
  }

  resetAll() {
    this.state = { ...this.defaultState };
    this.saveState();
  }
}

window.dmStorage = new DarkMatterStorage();
