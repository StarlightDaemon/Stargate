/**
 * AERIS Activity & Dialing History Ledger
 * Records operator actions, stator locks, power events, and transit logs.
 */

class AerisHistoryLogger {
  constructor() {
    this.logs = [];
    this.container = document.getElementById('history-log-stream');
    this.filter = 'ALL';

    // Seed with initialization entries
    this.log('SYSTEM', 'AERIS OS v4.8.2 kernel initialized. Subspace telemetry online.');
    this.log('POWER', 'Substation Omicron capacitor banks 1-4 primed (100% charge).');
    this.log('SHIELD', 'Containment Iris self-test complete: 12 titanium diaphragm blades nominal.');
  }

  log(category, message) {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

    const entry = {
      id: Date.now() + Math.random(),
      timestamp: timeStr,
      category,
      message
    };

    this.logs.unshift(entry);
    if (this.logs.length > 200) {
      this.logs.pop();
    }

    this.render();
  }

  setFilter(filter) {
    this.filter = filter;
    this.render();
  }

  clear() {
    this.logs = [];
    this.log('SYSTEM', 'Activity log cleared by operator.');
  }

  exportLog() {
    const text = this.logs.map(e => `[${e.timestamp}] [${e.category.padEnd(8, ' ')}] ${e.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AERIS_Log_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  render() {
    if (!this.container) {
      this.container = document.getElementById('history-log-stream');
      if (!this.container) return;
    }

    // Filter groups: categories without their own filter button fold into
    // the nearest button (DISENGAGE under IGNITE; telemetry INFO/WARN
    // alerts under SYSTEM) so no ledger entry is unreachable by filter.
    const filterGroups = {
      IGNITE: ['IGNITE', 'DISENGAGE'],
      SYSTEM: ['SYSTEM', 'INFO', 'WARN']
    };
    const filtered = this.logs.filter(e => {
      if (this.filter === 'ALL') return true;
      const group = filterGroups[this.filter];
      return group ? group.includes(e.category) : e.category === this.filter;
    });

    this.container.innerHTML = filtered.map(e => `
      <div class="log-entry log-${e.category.toLowerCase()}">
        <span class="log-time">[${e.timestamp}]</span>
        <span class="log-badge log-badge-${e.category.toLowerCase()}">${e.category}</span>
        <span class="log-msg">${this.escapeHtml(e.message)}</span>
      </div>
    `).join('');
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

window.aerisHistory = new AerisHistoryLogger();
