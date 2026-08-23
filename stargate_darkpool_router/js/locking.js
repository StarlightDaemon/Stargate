/**
 * VALENCE-9 L-STOR Locking Engine
 * (Discrete Liquidity-Slicing & Sub-Tick Order Routing)
 * Manages 10 synthetic multi-leg asset vectors and 7-leg route pipeline.
 */

class LockingEngine {
  constructor() {
    this.instruments = [
      { id: 'inst-vix', symbol: 'Ω-VIX', name: 'Volatility Dispersion', venueTag: 'CBOE-D', baseDelta: '+0.14Δ', iconSvg: '<path d="M4 16 L10 8 L16 14 L22 6"/>' },
      { id: 'inst-swap', symbol: 'Ψ-SWAP', name: 'Cross-Venue Yield', venueTag: 'EUREX-Q', baseDelta: '-0.08Δ', iconSvg: '<path d="M6 8 L18 8 M14 4 L18 8 L14 12 M18 16 L6 16 M10 12 L6 16 L10 20"/>' },
      { id: 'inst-eth', symbol: 'Δ-ETH', name: 'Latency Arbitrage', venueTag: 'SEC4-X', baseDelta: '+0.42Δ', iconSvg: '<polygon points="12,4 20,18 4,18"/>' },
      { id: 'inst-index', symbol: 'Θ-INDEX', name: 'Decay Variance Hedge', venueTag: 'CME-GL', baseDelta: '+0.03Δ', iconSvg: '<circle cx="12" cy="12" r="8"/><line x1="4" y1="12" x2="20" y2="12"/>' },
      { id: 'inst-dark', symbol: 'Σ-DARK', name: 'Block Liquidity Core', venueTag: 'VAL-9D', baseDelta: '+0.95Δ', iconSvg: '<path d="M18 4 L6 4 L12 12 L6 20 L18 20"/>' },
      { id: 'inst-flow', symbol: 'Φ-FLOW', name: 'Institutional Flow', venueTag: 'BATS-Z', baseDelta: '-0.19Δ', iconSvg: '<circle cx="12" cy="12" r="7"/><line x1="12" y1="2" x2="12" y2="22"/>' },
      { id: 'inst-curve', symbol: 'Γ-CURVE', name: 'Nonlinear Skew Vector', venueTag: 'SGX-DR', baseDelta: '+0.31Δ', iconSvg: '<path d="M6 18 C12 18 12 6 18 6"/>' },
      { id: 'inst-collat', symbol: 'Ξ-COLLAT', name: 'Zero-Knowledge Margin', venueTag: 'ZUR-ST', baseDelta: '-0.04Δ', iconSvg: '<line x1="5" y1="6" x2="19" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="5" y1="18" x2="19" y2="18"/>' },
      { id: 'inst-spread', symbol: 'Λ-SPREAD', name: 'Inter-Exchange Spread', venueTag: 'HKEX-O', baseDelta: '+0.27Δ', iconSvg: '<path d="M4 20 L12 4 L20 20"/>' },
      { id: 'inst-basis', symbol: 'Ζ-BASIS', name: 'Perpetual Funding Basis', venueTag: 'TOK-SB', baseDelta: '-0.15Δ', iconSvg: '<path d="M6 5 L18 5 L6 19 L18 19"/>' }
    ];

    this.basketLength = 7;
    this.activeBasket = []; // Array of locked instrument objects
    this.lockedNodeIndices = []; // Maps basket index to ring node index
    this.state = 'IDLE'; // IDLE, DIALING, PENDING, BUILDUP, ACTIVE
  }

  init() {
    this.renderInstrumentSelector();
    this.renderRoutePipeline();
  }

  renderInstrumentSelector() {
    const container = document.getElementById('instrument-grid');
    if (!container) return;

    container.innerHTML = '';
    this.instruments.forEach((inst, idx) => {
      const btn = document.createElement('button');
      btn.className = 'instrument-btn';
      btn.id = `btn-${inst.id}`;
      btn.setAttribute('data-symbol', inst.symbol);
      btn.innerHTML = `
        <div class="inst-icon">
          <svg viewBox="0 0 24 24">${inst.iconSvg}</svg>
        </div>
        <div class="inst-info">
          <div class="inst-symbol">${inst.symbol}</div>
          <div class="inst-name">${inst.name}</div>
        </div>
        <div class="inst-venue">${inst.venueTag}</div>
        <div class="inst-delta">${inst.baseDelta}</div>
      `;

      btn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playChirp(1600 + idx * 80);
        this.toggleInstrument(inst);
      });

      container.appendChild(btn);
    });
  }

  renderRoutePipeline() {
    const pipeline = document.getElementById('route-pipeline');
    if (!pipeline) return;

    pipeline.innerHTML = '';
    for (let i = 0; i < this.basketLength; i++) {
      const slot = document.createElement('div');
      slot.className = 'route-slot';
      slot.id = `route-slot-${i}`;

      const lockedInst = this.activeBasket[i];
      if (lockedInst) {
        slot.classList.add('locked');
        const nodeIdx = this.lockedNodeIndices[i];
        const node = window.orderBookRing ? window.orderBookRing.nodes[nodeIdx] : null;
        const nodeName = node ? node.code : 'LOC';
        const price = node ? `$${node.currentPrice.toFixed(2)}` : '$---.--';

        slot.innerHTML = `
          <div class="slot-badge">LEG ${i + 1}</div>
          <div class="slot-symbol">${lockedInst.symbol}</div>
          <div class="slot-node">${nodeName}</div>
          <div class="slot-price">${price}</div>
          <div class="slot-status">FILLED</div>
        `;
      } else {
        slot.innerHTML = `
          <div class="slot-badge">LEG ${i + 1}</div>
          <div class="slot-symbol">---</div>
          <div class="slot-node">UNROUTED</div>
          <div class="slot-price">--.--</div>
          <div class="slot-status">OPEN</div>
        `;
      }
      pipeline.appendChild(slot);
    }
  }

  toggleInstrument(instrument) {
    if (this.state === 'BUILDUP' || this.state === 'ACTIVE') {
      return; // Cannot modify basket while route is transmitting or active
    }

    const existingIdx = this.activeBasket.findIndex(i => i.id === instrument.id);
    if (existingIdx >= 0) {
      // Unlock this instrument and any after it
      this.unlockFromIndex(existingIdx);
    } else {
      if (this.activeBasket.length < this.basketLength) {
        this.lockInstrument(instrument);
      }
    }
  }

  lockInstrument(instrument) {
    if (this.activeBasket.length >= this.basketLength) return;

    const basketIdx = this.activeBasket.length;
    // Pick an available node index
    let nodeIdx = basketIdx % 10;
    while (this.lockedNodeIndices.includes(nodeIdx) && this.lockedNodeIndices.length < 10) {
      nodeIdx = (nodeIdx + 1) % 10;
    }

    this.activeBasket.push(instrument);
    this.lockedNodeIndices.push(nodeIdx);

    // Update Ring
    if (window.orderBookRing) {
      window.orderBookRing.lockNode(nodeIdx, instrument);
    }

    // Play Sound
    if (window.soundEngine) {
      window.soundEngine.playFillChime(basketIdx);
    }

    // Update UI buttons
    const btn = document.getElementById(`btn-${instrument.id}`);
    if (btn) btn.classList.add('active-locked');

    // Add order fill entry to Microstructure Tape
    if (window.app) {
      window.app.addTapeEntry('FILL', instrument.symbol, (100 + Math.floor(Math.random() * 400)), instrument.venueTag, true);
    }

    // Check if basket is full (7/7)
    if (this.activeBasket.length === this.basketLength) {
      this.state = 'PENDING';
      if (window.orderBookRing) window.orderBookRing.setSystemState('PENDING');
      if (window.activationEngine) window.activationEngine.setReadyState(true);
    } else {
      this.state = 'DIALING';
      if (window.orderBookRing) window.orderBookRing.setSystemState('DIALING');
      if (window.activationEngine) window.activationEngine.setReadyState(false);
    }

    this.renderRoutePipeline();
  }

  unlockFromIndex(fromIdx) {
    while (this.activeBasket.length > fromIdx) {
      const poppedInst = this.activeBasket.pop();
      const poppedNodeIdx = this.lockedNodeIndices.pop();

      const btn = document.getElementById(`btn-${poppedInst.id}`);
      if (btn) btn.classList.remove('active-locked');

      if (window.orderBookRing && window.orderBookRing.nodes[poppedNodeIdx]) {
        const node = window.orderBookRing.nodes[poppedNodeIdx];
        node.locked = false;
        node.instrument = null;
        node.fillFlash = 0;
        node.bidDepth = 0.15;
        node.askDepth = 0.15;
      }
    }

    this.state = this.activeBasket.length > 0 ? 'DIALING' : 'IDLE';
    if (window.orderBookRing) window.orderBookRing.setSystemState(this.state);
    if (window.activationEngine) window.activationEngine.setReadyState(false);

    this.renderRoutePipeline();
  }

  handleNodeDirectClick(node) {
    if (this.state === 'BUILDUP' || this.state === 'ACTIVE') return;

    if (node.locked) {
      const idx = this.lockedNodeIndices.indexOf(window.orderBookRing.nodes.indexOf(node));
      if (idx >= 0) this.unlockFromIndex(idx);
    } else {
      // Find first unused instrument
      const unused = this.instruments.find(inst => !this.activeBasket.some(b => b.id === inst.id));
      if (unused) this.lockInstrument(unused);
    }
  }

  resetAll() {
    this.activeBasket = [];
    this.lockedNodeIndices = [];
    this.state = 'IDLE';

    document.querySelectorAll('.instrument-btn').forEach(btn => {
      btn.classList.remove('active-locked');
    });

    if (window.orderBookRing) {
      window.orderBookRing.unlockAllNodes();
      window.orderBookRing.setSystemState('IDLE');
    }

    if (window.activationEngine) {
      window.activationEngine.setReadyState(false);
    }

    this.renderRoutePipeline();
  }
}

window.LockingEngine = LockingEngine;
window.lockingEngine = new LockingEngine();
