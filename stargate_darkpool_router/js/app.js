/**
 * VALENCE-9 Main Application Controller & Telemetry Stream
 * Manages responsive viewport scaling, live Level-3 order tape,
 * node latency monitors, operator manual modal, and system bootstrap.
 */

class AppController {
  constructor() {
    this.tapeEntries = [];
    this.maxTapeEntries = 18;
    this.tapeInterval = null;
    this.clockInterval = null;
    this.latencyInterval = null;
  }

  init() {
    this.setupScaling();
    this.setupClocks();
    this.setupMicrostructureTape();
    this.setupLatencyMatrix();
    this.setupOperatorModal();

    // Initialize subsystems
    if (window.orderBookRing) {
      // Ring was instantiated on canvas load
    } else {
      window.orderBookRing = new OrderBookRing('ring-canvas');
    }

    if (window.lockingEngine) window.lockingEngine.init();
    if (window.activationEngine) window.activationEngine.init();
    if (window.presetEngine) window.presetEngine.init();
    if (window.riskInterlock) window.riskInterlock.init();

    // Start background telemetry streams
    this.startTapeStream();
    this.startLatencyJitter();
  }

  setupScaling() {
    const updateScale = () => {
      const baseW = 1920;
      const baseH = 1080;
      const scaleX = window.innerWidth / baseW;
      const scaleY = window.innerHeight / baseH;
      const scale = Math.min(scaleX, scaleY);

      document.documentElement.style.setProperty('--app-scale', scale.toString());
      const container = document.getElementById('app-container');
      if (container) {
        container.style.transform = `scale(${scale})`;
      }
    };

    window.addEventListener('resize', updateScale);
    updateScale();
  }

  setupClocks() {
    const utcEl = document.getElementById('clock-utc');
    const estEl = document.getElementById('clock-est');
    const sgtEl = document.getElementById('clock-sgt');

    const updateTime = () => {
      const now = new Date();
      if (utcEl) utcEl.textContent = `${now.toUTCString().slice(17, 25)} UTC`;
      if (estEl) {
        const estStr = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
        estEl.textContent = `${estStr} EST`;
      }
      if (sgtEl) {
        const sgtStr = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Singapore', hour12: false });
        sgtEl.textContent = `${sgtStr} SGT`;
      }
    };

    updateTime();
    this.clockInterval = setInterval(updateTime, 1000);
  }

  setupMicrostructureTape() {
    this.tapeContainer = document.getElementById('order-tape-stream');
    // Pre-populate with realistic L3 market entries
    const initialVenues = ['LSE-D', 'NY4-U', 'TY3-M', 'SG1-L', 'HK1-O', 'FR2-D', 'CME-A', 'BATS-Z'];
    const initialSymbols = ['Ω-VIX', 'Δ-ETH', 'Σ-DARK', 'Φ-FLOW', 'Ψ-SWAP', 'Γ-CURVE', 'Ξ-COLLAT'];

    for (let i = 0; i < 10; i++) {
      const side = Math.random() > 0.48 ? 'BUY' : 'SELL';
      const sym = initialSymbols[Math.floor(Math.random() * initialSymbols.length)];
      const size = 100 + Math.floor(Math.random() * 850);
      const venue = initialVenues[Math.floor(Math.random() * initialVenues.length)];
      this.addTapeEntry(side, sym, size, venue, false);
    }
  }

  startTapeStream() {
    const venues = ['LSE-D', 'NY4-U', 'TY3-M', 'SG1-L', 'HK1-O', 'FR2-D', 'CME-A', 'BATS-Z', 'ZUR-Q', 'TOK-S'];
    const symbols = ['Ω-VIX', 'Δ-ETH', 'Σ-DARK', 'Φ-FLOW', 'Ψ-SWAP', 'Γ-CURVE', 'Ξ-COLLAT', 'Λ-SPREAD', 'Ζ-BASIS'];

    const nextTick = () => {
      const isBurst = window.activationEngine && (window.activationEngine.state === 'ACTIVE' || window.activationEngine.state === 'BUILDUP');
      const side = Math.random() > 0.45 ? 'BUY' : 'SELL';
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const size = 50 + Math.floor(Math.random() * (isBurst ? 1500 : 600));
      const venue = venues[Math.floor(Math.random() * venues.length)];

      this.addTapeEntry(side, sym, size, venue, isBurst);

      const delay = isBurst ? (40 + Math.random() * 80) : (400 + Math.random() * 800);
      this.tapeInterval = setTimeout(nextTick, delay);
    };

    nextTick();
  }

  addTapeEntry(side, symbol, size, venue, isSpecial = false) {
    if (!this.tapeContainer) return;

    const row = document.createElement('div');
    row.className = `tape-row side-${side.toLowerCase()} ${isSpecial ? 'tape-special' : ''}`;

    const now = new Date();
    const timeStr = `${now.toTimeString().slice(0, 8)}.${Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0')}`;

    row.innerHTML = `
      <span class="tape-time">${timeStr}</span>
      <span class="tape-side ${side === 'BUY' ? 'tag-buy' : 'tag-sell'}">${side}</span>
      <span class="tape-sym">${symbol}</span>
      <span class="tape-size">${size.toLocaleString()} LOTS</span>
      <span class="tape-venue">${venue}</span>
    `;

    this.tapeContainer.insertBefore(row, this.tapeContainer.firstChild);

    // Trim excess entries
    while (this.tapeContainer.children.length > this.maxTapeEntries) {
      this.tapeContainer.removeChild(this.tapeContainer.lastChild);
    }
  }

  setupLatencyMatrix() {
    this.latencyContainer = document.getElementById('venue-latency-grid');
    if (!this.latencyContainer) return;

    const venues = [
      { code: 'LSE', base: 0.38 },
      { code: 'NY4', base: 0.22 },
      { code: 'TY3', base: 0.45 },
      { code: 'SG1', base: 0.31 },
      { code: 'HK1', base: 0.29 },
      { code: 'FR2', base: 0.34 },
      { code: 'CME', base: 0.24 },
      { code: 'CHI', base: 0.21 },
      { code: 'ZUR', base: 0.49 },
      { code: 'TOK', base: 0.41 }
    ];

    this.latencyContainer.innerHTML = '';
    venues.forEach(v => {
      const item = document.createElement('div');
      item.className = 'latency-item';
      item.id = `latency-${v.code}`;
      item.innerHTML = `
        <span class="venue-name">${v.code}</span>
        <span class="venue-ping" id="ping-${v.code}">${v.base.toFixed(2)} μs</span>
      `;
      this.latencyContainer.appendChild(item);
    });
  }

  startLatencyJitter() {
    const venues = ['LSE', 'NY4', 'TY3', 'SG1', 'HK1', 'FR2', 'CME', 'CHI', 'ZUR', 'TOK'];
    setInterval(() => {
      venues.forEach(v => {
        const pingEl = document.getElementById(`ping-${v}`);
        if (pingEl) {
          const jitter = (Math.random() * 0.08 - 0.04);
          const current = parseFloat(pingEl.textContent);
          const next = Math.max(0.18, current + jitter);
          pingEl.textContent = `${next.toFixed(2)} μs`;
        }
      });
    }, 1200);
  }

  setupOperatorModal() {
    this.helpBtn = document.getElementById('btn-help-modal');
    this.modalOverlay = document.getElementById('operator-modal-overlay');
    this.modalCloseBtn = document.getElementById('modal-close-btn');

    if (this.helpBtn && this.modalOverlay) {
      this.helpBtn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playPresetClick();
        this.openModal();
      });
    }

    if (this.modalCloseBtn && this.modalOverlay) {
      this.modalCloseBtn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playPresetClick();
        this.closeModal();
      });
    }

    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) {
          this.closeModal();
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalOverlay && this.modalOverlay.classList.contains('modal-open')) {
        this.closeModal();
      }
    });
  }

  openModal() {
    if (this.modalOverlay) {
      this.modalOverlay.classList.add('modal-open');
    }
  }

  closeModal() {
    if (this.modalOverlay) {
      this.modalOverlay.classList.remove('modal-open');
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
  window.app.init();
});
