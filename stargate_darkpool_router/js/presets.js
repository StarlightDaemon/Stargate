/**
 * VALENCE-9 Strategy Preset Deck & Auto-Dial Engine
 * Manages 6 preloaded strategies across 2 tiers with genuine step-by-step auto-dial sequencing.
 */

class PresetEngine {
  constructor() {
    this.presets = [
      // Tier 1: Institutional Backtested Alpha Baskets
      {
        id: 'preset-alpha7',
        tier: 1,
        tierName: 'TIER 1: BACKTESTED ALPHA',
        name: 'ALPHA-7 NEUTRAL ARB',
        desc: 'Zero-Beta Statistical Parity Route',
        sharpe: '4.82',
        latency: '0.38 μs',
        symbols: ['Ω-VIX', 'Δ-ETH', 'Σ-DARK', 'Φ-FLOW', 'Ψ-SWAP', 'Γ-CURVE', 'Λ-SPREAD']
      },
      {
        id: 'preset-omega',
        tier: 1,
        tierName: 'TIER 1: BACKTESTED ALPHA',
        name: 'OMEGA-MOMENTUM SWEEP',
        desc: 'High-Beta Dark Liquidity Drain',
        sharpe: '4.15',
        latency: '0.41 μs',
        symbols: ['Σ-DARK', 'Φ-FLOW', 'Δ-ETH', 'Ζ-BASIS', 'Θ-INDEX', 'Ω-VIX', 'Ξ-COLLAT']
      },
      {
        id: 'preset-gamma',
        tier: 1,
        tierName: 'TIER 1: BACKTESTED ALPHA',
        name: 'DELTA-GAMMA STRANGLE',
        desc: 'Non-Linear Volatility Squeeze',
        sharpe: '3.94',
        latency: '0.44 μs',
        symbols: ['Γ-CURVE', 'Ω-VIX', 'Θ-INDEX', 'Δ-ETH', 'Ψ-SWAP', 'Λ-SPREAD', 'Σ-DARK']
      },
      // Tier 2: Experimental High-Risk Squeeze Vectors
      {
        id: 'preset-qdisp',
        tier: 2,
        tierName: 'TIER 2: HIGH-RISK SQUEEZE',
        name: 'QUANTUM DISPERSION 9',
        desc: 'Microstructure Latency Dislocation',
        sharpe: '6.20',
        latency: '0.29 μs',
        symbols: ['Ξ-COLLAT', 'Ζ-BASIS', 'Ψ-SWAP', 'Ω-VIX', 'Δ-ETH', 'Γ-CURVE', 'Φ-FLOW']
      },
      {
        id: 'preset-basis',
        tier: 2,
        tierName: 'TIER 2: HIGH-RISK SQUEEZE',
        name: 'SYNTHETIC BASIS SWAP',
        desc: 'Cross-Venue Funding Rate Capture',
        sharpe: '5.40',
        latency: '0.32 μs',
        symbols: ['Ζ-BASIS', 'Ψ-SWAP', 'Λ-SPREAD', 'Σ-DARK', 'Θ-INDEX', 'Δ-ETH', 'Ω-VIX']
      },
      {
        id: 'preset-siphon',
        tier: 2,
        tierName: 'TIER 2: HIGH-RISK SQUEEZE',
        name: 'BLACK-SWAN SIPHON',
        desc: 'Aggressive Dark Pool Liquidity Siphon',
        sharpe: '7.10',
        latency: '0.24 μs',
        symbols: ['Φ-FLOW', 'Σ-DARK', 'Ξ-COLLAT', 'Γ-CURVE', 'Ω-VIX', 'Ζ-BASIS', 'Δ-ETH']
      }
    ];

    this.autoDialTimeout = null;
    this.isAutoDialing = false;
    this.currentPresetId = null;
  }

  init() {
    this.renderPresets();
  }

  renderPresets() {
    const tier1Container = document.getElementById('presets-tier1');
    const tier2Container = document.getElementById('presets-tier2');
    if (!tier1Container || !tier2Container) return;

    tier1Container.innerHTML = '';
    tier2Container.innerHTML = '';

    this.presets.forEach(preset => {
      const card = document.createElement('div');
      card.className = `preset-card tier-${preset.tier}`;
      card.id = `card-${preset.id}`;
      card.innerHTML = `
        <div class="preset-header">
          <div class="preset-title-wrap">
            <span class="preset-name">${preset.name}</span>
            <span class="preset-desc">${preset.desc}</span>
          </div>
          <div class="preset-metrics">
            <span class="metric-tag">SHARPE <b>${preset.sharpe}</b></span>
            <span class="metric-tag">${preset.latency}</span>
          </div>
        </div>
        <div class="preset-symbols-preview">
          ${preset.symbols.map(s => `<span class="sym-badge">${s}</span>`).join('')}
        </div>
        <button class="preset-dispatch-btn" id="btn-${preset.id}">
          <span class="dispatch-icon">▶</span> AUTO-DISPATCH BASKET
        </button>
      `;

      const btn = card.querySelector(`#btn-${preset.id}`);
      btn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playPresetClick();
        this.startAutoDial(preset);
      });

      if (preset.tier === 1) {
        tier1Container.appendChild(card);
      } else {
        tier2Container.appendChild(card);
      }
    });
  }

  startAutoDial(preset) {
    // If active or buildup, ignore
    if (window.activationEngine && (window.activationEngine.state === 'ACTIVE' || window.activationEngine.state === 'BUILDUP')) {
      return;
    }

    this.stopAutoDial();
    this.isAutoDialing = true;
    this.currentPresetId = preset.id;

    // Reset current locks cleanly
    if (window.lockingEngine) {
      window.lockingEngine.resetAll();
    }

    // Highlight active preset card
    document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('card-dispatching'));
    const card = document.getElementById(`card-${preset.id}`);
    if (card) card.classList.add('card-dispatching');

    let step = 0;
    const stepInterval = 280; // 280ms per leg (genuinely sequenced, not instant)

    const stepNext = () => {
      if (!this.isAutoDialing) return;

      if (step < preset.symbols.length) {
        const symbol = preset.symbols[step];
        const inst = window.lockingEngine.instruments.find(i => i.symbol === symbol);
        if (inst) {
          window.lockingEngine.lockInstrument(inst);
        }
        step++;
        this.autoDialTimeout = setTimeout(stepNext, stepInterval);
      } else {
        // Complete - landed in PENDING state (NO auto-fire)
        this.isAutoDialing = false;
        if (card) card.classList.remove('card-dispatching');
      }
    };

    this.autoDialTimeout = setTimeout(stepNext, 50);
  }

  stopAutoDial() {
    this.isAutoDialing = false;
    if (this.autoDialTimeout) {
      clearTimeout(this.autoDialTimeout);
      this.autoDialTimeout = null;
    }
    document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('card-dispatching'));
  }
}

window.PresetEngine = PresetEngine;
window.presetEngine = new PresetEngine();
