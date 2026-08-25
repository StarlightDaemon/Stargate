/**
 * DSV-9 ARCHELON - Storage & Session Management
 * Handles localStorage persistence for user preferences, completed dives,
 * viewed archive records, and real-time session audit logging.
 */

const Storage = (() => {
  const STORAGE_KEYS = {
    PREFERENCES: 'archelon_pilot_preferences_v1',
    DIVE_HISTORY: 'archelon_pilot_dives_v1',
    VIEWED_ARCHIVES: 'archelon_pilot_viewed_archives_v1',
    EVENT_LOG: 'archelon_pilot_session_events_v1'
  };

  const defaultPreferences = {
    theme: 'abyssal',
    density: 'standard',
    motion: 'full',
    audioMuted: false,
    audioVolumes: {
      master: 80,
      ballast: 85,
      thruster: 75,
      hull: 90,
      drone: 65
    }
  };

  let sessionEvents = [];

  const getPreferences = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences;
    } catch (e) {
      console.warn('Storage read error for preferences:', e);
      return defaultPreferences;
    }
  };

  const savePreferences = (prefs) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
    } catch (e) {
      console.warn('Storage save error for preferences:', e);
    }
  };

  const getDiveHistory = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DIVE_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };

  const saveCompletedDive = (diveData) => {
    try {
      const history = getDiveHistory();
      history.unshift({
        id: `DIVE-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        targetDepth: diveData.depth || 11800,
        maxPressure: diveData.pressure || '1,190 BAR',
        durationSeconds: diveData.duration || 120,
        route: diveData.routeName || 'Standard Hadal Gateway Vector',
        status: 'SUCCESSFUL BREACH'
      });
      localStorage.setItem(STORAGE_KEYS.DIVE_HISTORY, JSON.stringify(history.slice(0, 50)));
      logEvent('DIVE_RECORDER', `Completed dive profile logged to on-board storage: ${diveData.routeName || 'Hadal Vector'}`);
    } catch (e) {
      console.warn('Storage save error for dive history:', e);
    }
  };

  const getViewedArchives = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VIEWED_ARCHIVES);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };

  const markArchiveViewed = (archiveId) => {
    try {
      const viewed = getViewedArchives();
      if (!viewed.includes(archiveId)) {
        viewed.push(archiveId);
        localStorage.setItem(STORAGE_KEYS.VIEWED_ARCHIVES, JSON.stringify(viewed));
      }
    } catch (e) {
      console.warn('Storage save error for viewed archives:', e);
    }
  };

  const logEvent = (source, message, level = 'info') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    const eventObj = { id: Date.now() + Math.random(), time: timeStr, source, message, level };
    
    sessionEvents.unshift(eventObj);
    if (sessionEvents.length > 200) sessionEvents.pop();

    // Notify event log UI if available
    if (typeof window.onNewSessionEvent === 'function') {
      window.onNewSessionEvent(eventObj);
    }
  };

  const getSessionEvents = () => sessionEvents;

  const clearSessionEvents = () => {
    sessionEvents = [];
    logEvent('SYSTEM', 'Local session event log purged by operator');
  };

  return {
    getPreferences,
    savePreferences,
    getDiveHistory,
    saveCompletedDive,
    getViewedArchives,
    markArchiveViewed,
    logEvent,
    getSessionEvents,
    clearSessionEvents
  };
})();

window.Storage = Storage;
