/**
 * D.S.T.C.L. TERMINAL OS/88-V - TERMINAL LOGGER & SYSTEM TELEMETRY
 * Handles the real-time audit log feed, timecoded bureaucratic logging,
 * status banner messages, and system clocks.
 */

class TerminalLogger {
  constructor() {
    this.logFeedEl = document.getElementById('terminal-log-feed');
    this.btnClearLog = document.getElementById('btn-clear-log');
    this.sysClockEl = document.getElementById('sys-clock');
    this.statusBanner = document.getElementById('docket-status-banner');
    this.bannerText = document.getElementById('status-banner-text');
    this.conduitStatus = document.getElementById('conduit-status-indicator');

    this.init();
  }

  init() {
    this.startClock();
    this.attachEvents();
    this.seedInitialLogs();
  }

  startClock() {
    const update = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      if (this.sysClockEl) {
        this.sysClockEl.textContent = `${h}:${m}:${s} Z`;
      }
    };
    update();
    setInterval(update, 1000);
  }

  attachEvents() {
    if (this.btnClearLog) {
      this.btnClearLog.addEventListener('click', () => {
        window.terminalAudio.playKeyClick();
        if (this.logFeedEl) {
          this.logFeedEl.innerHTML = '';
          this.logInfo('Audit log purged by console operator.');
        }
      });
    }
  }

  seedInitialLogs() {
    this.logInfo('OS/88-V (REV 4.19.8) KERNEL INITIALIZED.');
    this.logInfo('STATION CONDUIT-04E READY. COMMUTATOR BUFFER IDLE.');
    this.logInfo('COMPLIANCE CHECK: D.S.T.C.L. REGULATION § 88-12B LOADED.');
    this.logInfo('AWAITING OPERATOR DOCKET SUBMISSION...');
  }

  getTimeStr() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `[${h}:${m}:${s}]`;
  }

  addEntry(type, message) {
    if (!this.logFeedEl) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `
      <span class="log-time">${this.getTimeStr()}</span>
      <span class="log-msg">${message}</span>
    `;

    this.logFeedEl.appendChild(entry);
    this.logFeedEl.scrollTop = this.logFeedEl.scrollHeight;
  }

  logInfo(msg) { this.addEntry('info', msg); }
  logLock(msg) { this.addEntry('lock', msg); }
  logWarn(msg) { this.addEntry('warn', msg); }
  logError(msg) { this.addEntry('error', msg); }
  logSuccess(msg) { this.addEntry('success', msg); }

  setBannerStatus(text, type = 'normal') {
    if (this.bannerText) {
      this.bannerText.textContent = text;
    }
    if (this.statusBanner) {
      this.statusBanner.className = `docket-status-banner ${type}`;
    }
  }

  setConduitIndicator(text, className = 'status-idle') {
    if (this.conduitStatus) {
      this.conduitStatus.textContent = text;
      this.conduitStatus.className = `tel-val ${className}`;
    }
  }
}

window.terminalLogger = new TerminalLogger();
