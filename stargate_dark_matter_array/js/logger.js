/**
 * BOREAS-IX Session Event Logger
 * Live running timestamped recorder of user actions, discrimination results, and system state.
 */

class DarkMatterLogger {
  constructor() {
    this.logs = [];
    this.subscribers = [];
    this.filter = 'ALL';
    this.maxLogs = 200;
  }

  log(category, message, details = null) {
    const timestamp = new Date();
    const timeStr = timestamp.toTimeString().split(' ')[0] + '.' + String(timestamp.getMilliseconds()).padStart(3, '0');
    
    const entry = {
      id: 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      time: timeStr,
      iso: timestamp.toISOString(),
      category, // 'CHANNEL', 'DISCRIMINATION', 'REJECTION', 'APERTURE', 'SYSTEM', 'ARCHIVE'
      message,
      details
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    this.notify();
    return entry;
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    callback(this.getFilteredLogs());
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    const filtered = this.getFilteredLogs();
    this.subscribers.forEach(cb => cb(filtered));
  }

  setFilter(filter) {
    this.filter = filter;
    this.notify();
  }

  getFilteredLogs() {
    if (this.filter === 'ALL') return this.logs;
    return this.logs.filter(l => l.category === this.filter);
  }

  clear() {
    this.logs = [];
    this.notify();
  }

  exportText() {
    return this.logs.map(l => `[${l.time}] [${l.category}] ${l.message} ${l.details ? JSON.stringify(l.details) : ''}`).join('\n');
  }

  exportJSON() {
    return JSON.stringify(this.logs, null, 2);
  }
}

window.dmLogger = new DarkMatterLogger();
