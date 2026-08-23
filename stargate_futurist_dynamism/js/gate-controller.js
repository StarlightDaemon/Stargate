/**
 * ISTITUTO DINAMICO DI PROPULSIONE E TRASLAZIONE (IDPT)
 * Gate Controller & Kinematic Sequence Manager
 * Handles Chronophotographic locking, Staged Activation, Disengage, and Presets.
 */

const STATOR_DEFINITIONS = [
  { index: 1,  name: 'Impulso',       angle: 0,   code: 'V-01' },
  { index: 2,  name: 'Vortice',       angle: 36,  code: 'V-02' },
  { index: 3,  name: 'Accelerazione', angle: 72,  code: 'V-03' },
  { index: 4,  name: 'Traiettoria',   angle: 108, code: 'V-04' },
  { index: 5,  name: 'Frequenza',     angle: 144, code: 'V-05' },
  { index: 6,  name: 'Vettore',       angle: 180, code: 'V-06' },
  { index: 7,  name: 'Centrifuga',    angle: 216, code: 'V-07' },
  { index: 8,  name: 'Momento',       angle: 252, code: 'V-08' },
  { index: 9,  name: 'Torsione',      angle: 288, code: 'V-09' },
  { index: 10, name: 'Propulsione',   angle: 324, code: 'V-10' }
];

const PRESET_TIERS = {
  tier1: [
    {
      id: 'P-01',
      name: 'Milano-Torino Veloce',
      route: 'Tratta Industriale Terrestre',
      vector: [1, 2, 4, 3, 6, 8, 5]
    },
    {
      id: 'P-02',
      name: 'Napoli Tirrenica',
      route: 'Asse Marittimo del Sud',
      vector: [2, 5, 7, 1, 8, 4, 9]
    },
    {
      id: 'P-03',
      name: 'Sub-Stratosfera Alpha',
      route: 'Vettore Ascensione Verticale',
      vector: [5, 7, 2, 8, 3, 10, 1]
    }
  ],
  tier2: [
    {
      id: 'P-04',
      name: 'Centauri-Vortice',
      route: 'Corridoio Cosmico a Frequenza Massima',
      vector: [3, 6, 8, 1, 9, 4, 10]
    },
    {
      id: 'P-05',
      name: 'Stella Dinamica Balla-09',
      route: 'Risonanza Cromatica Prismatico-Fotonica',
      vector: [8, 1, 6, 10, 2, 5, 7]
    },
    {
      id: 'P-06',
      name: 'Vettore Etereo Severini',
      route: 'Canale Asimmetrico a Spirale Conica',
      vector: [10, 4, 7, 2, 9, 3, 6]
    }
  ]
};

window.STATOR_DEFINITIONS = STATOR_DEFINITIONS;
window.PRESET_TIERS = PRESET_TIERS;

class FuturistGateController {
  constructor() {
    this.ADDRESS_LENGTH = 7;
    this.lockedSlots = [];      // Array of stator indices [1..10]
    this.state = 'idle';        // 'idle' | 'pending' | 'buildup' | 'breakthrough' | 'active'
    this.governorEngaged = false; // MUST default to false (RELEASED)
    this.autoDialTimer = null;
    this.activationTimers = [];
    this.activePresetId = null;

    this.subscribers = new Set();
  }

  init() {
    this.updateUI();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const data = {
      state: this.state,
      lockedSlots: [...this.lockedSlots],
      governorEngaged: this.governorEngaged,
      isPending: this.state === 'pending',
      isActive: this.state === 'active',
      isLockedFull: this.lockedSlots.length === this.ADDRESS_LENGTH
    };
    this.subscribers.forEach(cb => {
      try { cb(data); } catch (e) { console.error(e); }
    });
    this.updateUI();
  }

  // Stator Selection & Chronophotographic Locking
  selectStator(statorIndex) {
    if (this.state === 'buildup' || this.state === 'breakthrough' || this.state === 'active') {
      return; // Cannot modify while actively running
    }
    if (this.lockedSlots.length >= this.ADDRESS_LENGTH) {
      return; // Already full
    }

    this.lockedSlots.push(statorIndex);
    const slotIdx = this.lockedSlots.length - 1;

    // Trigger audio
    if (window.idptAudio) {
      window.idptAudio.playStatorLock(statorIndex);
    }

    // Trigger visual chronophotographic burst on the slot
    const slotEl = document.getElementById(`slot-${slotIdx}`);
    if (slotEl) {
      slotEl.classList.remove('chronoburst');
      void slotEl.offsetWidth; // Force reflow
      slotEl.classList.add('chronoburst');
    }

    // Log event
    const def = STATOR_DEFINITIONS.find(s => s.index === statorIndex);
    if (window.idptState) {
      window.idptState.logEvent('STATORE', `Blocco cronofotografico settore V-${statorIndex < 10 ? '0' + statorIndex : statorIndex} (${def ? def.name : ''}) in posizione [${this.lockedSlots.length}/7]`);
    }

    // Check if address is now complete
    if (this.lockedSlots.length === this.ADDRESS_LENGTH) {
      this.state = 'pending';
      if (window.idptState) {
        window.idptState.logEvent('SEQUENZA', 'Vettore di coordinate 7/7 agganciato. Sistema in stato PRONTO PER INNESCO.');
      }
    } else {
      this.state = 'idle';
    }

    // Update Telemetry
    if (window.idptTelemetry) {
      window.idptTelemetry.setTargetState(this.state, this.lockedSlots.length);
    }

    this.notify();
  }

  // Clear manual locks
  resetDial() {
    this.clearTimers();
    this.lockedSlots = [];
    this.state = 'idle';
    this.activePresetId = null;

    if (window.idptAudio) {
      window.idptAudio.playClick();
    }
    if (window.idptState) {
      window.idptState.logEvent('COMANDO', 'Azzeramento manuale settori statorici.');
    }
    if (window.idptTelemetry) {
      window.idptTelemetry.setTargetState('idle', 0);
    }

    this.notify();
  }

  // Actuation Trigger (Only triggered manually when pending)
  actuate() {
    if (this.state !== 'pending') return;

    // Check Governor Safety Interlock
    if (this.governorEngaged) {
      if (window.idptAudio) {
        window.idptAudio.playGovernorWarning();
      }
      if (window.idptState) {
        window.idptState.logEvent('BLOCCO', 'Tentativo di innesco respinto: FRENO DI INERZIA INNESTATO!');
      }
      const hazardEl = document.getElementById('governor-hazard-banner');
      if (hazardEl) {
        hazardEl.classList.add('visible');
        setTimeout(() => hazardEl.classList.remove('visible'), 2800);
      }
      return;
    }

    // Begin 3-Stage Activation Sequence
    this.clearTimers();

    // 1. STAGE 1: BUILDUP (1.8s)
    this.state = 'buildup';
    if (window.idptAudio) {
      window.idptAudio.playBuildupSweep(1.8);
    }
    if (window.idptTelemetry) {
      window.idptTelemetry.setTargetState('buildup', this.lockedSlots.length);
    }
    if (window.idptState) {
      window.idptState.logEvent('ACCELERAZIONE', 'Innesco cinetico avviato: accelerazione volani e convergenza linee-forza...');
    }
    this.notify();

    // 2. STAGE 2: BREAKTHROUGH (at 1.8s, lasts 0.8s)
    const tBreakthrough = setTimeout(() => {
      this.state = 'breakthrough';
      if (window.idptAudio) {
        window.idptAudio.playBreakthroughDetonation();
      }
      if (window.idptTelemetry) {
        window.idptTelemetry.setTargetState('breakthrough', this.lockedSlots.length);
      }
      if (window.idptState) {
        window.idptState.logEvent('FRATTURA', 'Raggiunta velocità di soglia! Rottura dell\'inerzia e apertura corridoio.');
      }
      this.notify();

      // 3. STAGE 3: SUSTAINED ACTIVE (at 2.6s total)
      const tActive = setTimeout(() => {
        this.state = 'active';
        if (window.idptAudio) {
          window.idptAudio.startActiveDrone();
        }
        if (window.idptTelemetry) {
          window.idptTelemetry.setTargetState('active', this.lockedSlots.length);
        }
        if (window.idptState) {
          window.idptState.logEvent('ATTIVO', 'Traslazione cinematica sostenuta a regime iperbolico.');
          window.idptState.recordDialRun({
            name: this.activePresetId ? `Vettore ${this.activePresetId}` : 'Vettore Manuale Calcolato',
            stators: [...this.lockedSlots],
            status: 'ATTIVO',
            peakRpm: 24800
          });
        }
        this.notify();
      }, 800);

      this.activationTimers.push(tActive);
    }, 1800);

    this.activationTimers.push(tBreakthrough);
  }

  // Disengage Brake (Always Reachable)
  disengage() {
    this.clearTimers();
    const wasActive = this.state === 'active' || this.state === 'buildup' || this.state === 'breakthrough';
    this.state = 'idle';
    this.lockedSlots = [];
    this.activePresetId = null;

    if (window.idptAudio) {
      window.idptAudio.playDisengage();
    }
    if (window.idptTelemetry) {
      window.idptTelemetry.setTargetState('idle', 0);
    }
    if (window.idptState) {
      window.idptState.logEvent('DISIMPEGNO', wasActive 
        ? 'Azionamento FRENO CENTRIFUGO: decelerazione immediata e arresto di sicurezza.'
        : 'Freno di disimpegno azionato. Banco di prova ripristinato.');
    }

    this.notify();
  }

  // Governor Safety Interlock Toggle (Default is false/RELEASED)
  toggleGovernor() {
    this.governorEngaged = !this.governorEngaged;
    if (window.idptAudio) {
      window.idptAudio.playClick();
    }
    if (window.idptState) {
      window.idptState.logEvent('SICUREZZA', `Freno di Inerzia (Governor): ${this.governorEngaged ? 'INNESTATO (BLOCCA INNESCO)' : 'RILASCIATO (PRONTO)'}`);
    }
    this.notify();
  }

  // Staged Quick-Dial Presets (Genuinely auto-dials step-by-step, never auto-fires)
  autoDialPreset(preset) {
    if (this.state === 'buildup' || this.state === 'breakthrough' || this.state === 'active') {
      return;
    }
    this.clearTimers();
    this.lockedSlots = [];
    this.state = 'idle';
    this.activePresetId = preset.name;
    this.notify();

    if (window.idptState) {
      window.idptState.logEvent('PRESET', `Avvio sequenza di puntamento automatico per: ${preset.name}`);
    }

    let step = 0;
    const dialStep = () => {
      if (step < preset.vector.length) {
        this.selectStator(preset.vector[step]);
        step++;
        this.autoDialTimer = setTimeout(dialStep, 220); // Visible per-segment sequence
      } else {
        // Lands in pending state, NEVER auto-fires
        this.autoDialTimer = null;
      }
    };

    this.autoDialTimer = setTimeout(dialStep, 100);
  }

  clearTimers() {
    if (this.autoDialTimer) {
      clearTimeout(this.autoDialTimer);
      this.autoDialTimer = null;
    }
    this.activationTimers.forEach(t => clearTimeout(t));
    this.activationTimers = [];
  }

  // Sync DOM with internal state
  updateUI() {
    // 1. Update Center Stage Attribute
    const stageEl = document.getElementById('center-stage');
    if (stageEl) {
      stageEl.setAttribute('data-gate-state', this.state);
    }

    // 2. Update Header Status Ribbon
    const statusRibbon = document.getElementById('header-status-indicator');
    const statusText = document.getElementById('header-status-text');
    if (statusRibbon && statusText) {
      statusRibbon.setAttribute('data-state', this.state);
      switch (this.state) {
        case 'idle':
          statusText.textContent = this.lockedSlots.length > 0 ? `IN CONFIGURAZIONE (${this.lockedSlots.length}/7)` : 'IN ROTAZIONE MINIMA';
          break;
        case 'pending':
          statusText.textContent = 'PRONTO PER INNESCO';
          break;
        case 'buildup':
          statusText.textContent = 'STAGE 1: ACCELERAZIONE DINAMICA';
          break;
        case 'breakthrough':
          statusText.textContent = 'STAGE 2: FRATTURA CINEMATICA';
          break;
        case 'active':
          statusText.textContent = 'STAGE 3: TRASLAZIONE SOSTENUTA';
          break;
      }
    }

    // 3. Update 7-Segment Address Slots
    for (let i = 0; i < this.ADDRESS_LENGTH; i++) {
      const slotEl = document.getElementById(`slot-${i}`);
      const valEl = document.getElementById(`slot-val-${i}`);
      if (slotEl && valEl) {
        if (i < this.lockedSlots.length) {
          const statorNum = this.lockedSlots[i];
          slotEl.classList.add('locked');
          valEl.textContent = `V-${statorNum < 10 ? '0' + statorNum : statorNum}`;
        } else {
          slotEl.classList.remove('locked');
          valEl.textContent = '--';
        }
      }
    }

    // 4. Update Stator Buttons in Left Panel
    STATOR_DEFINITIONS.forEach(def => {
      const btn = document.getElementById(`stator-btn-${def.index}`);
      if (btn) {
        const isLocked = this.lockedSlots.includes(def.index);
        btn.classList.toggle('selected', isLocked);
      }
    });

    // 5. Update Stator Nodes on SVG Ring
    STATOR_DEFINITIONS.forEach(def => {
      const node = document.getElementById(`ring-node-${def.index}`);
      if (node) {
        const isLocked = this.lockedSlots.includes(def.index);
        node.classList.toggle('locked', isLocked);
        node.classList.toggle('active-pulsing', isLocked && this.state === 'active');
      }
    });

    // 6. Update Actuation Lever in Right Panel
    const actuateBtn = document.getElementById('btn-actuate-lever');
    const leverStateTag = document.getElementById('lever-state-label');
    if (actuateBtn && leverStateTag) {
      actuateBtn.classList.remove('ready', 'active-running');
      if (this.state === 'pending') {
        actuateBtn.classList.add('ready');
        actuateBtn.innerHTML = `<span>INNESCO TRASLAZIONE</span> <span style="font-size:18px">▶</span>`;
        leverStateTag.textContent = 'PRONTO PER INNESCO';
        leverStateTag.style.color = 'var(--accent-speed)';
      } else if (this.state === 'buildup' || this.state === 'breakthrough') {
        actuateBtn.classList.add('active-running');
        actuateBtn.innerHTML = `<span>ACCELERAZIONE IN CORSO...</span>`;
        leverStateTag.textContent = 'INNESCO AVVIATO';
        leverStateTag.style.color = 'var(--accent-hazard)';
      } else if (this.state === 'active') {
        actuateBtn.classList.add('active-running');
        actuateBtn.innerHTML = `<span>TRASLAZIONE ATTIVA</span>`;
        leverStateTag.textContent = 'REGIME IPERBOLICO';
        leverStateTag.style.color = 'var(--accent-force)';
      } else {
        actuateBtn.innerHTML = `<span>INNESCO BLOCCATO</span>`;
        leverStateTag.textContent = this.lockedSlots.length > 0 ? `SELEZIONATI ${this.lockedSlots.length}/7` : 'COLD IDLE';
        leverStateTag.style.color = 'var(--text-muted)';
      }
    }

    // 7. Update Governor Button
    const govBtn = document.getElementById('btn-governor-toggle');
    if (govBtn) {
      govBtn.setAttribute('data-engaged', this.governorEngaged ? 'true' : 'false');
      govBtn.textContent = this.governorEngaged ? 'INNESTATO (BLOCCO)' : 'RILASCIATO';
    }

    // 8. Update Footer Ticker
    const ticker = document.getElementById('footer-ticker');
    if (ticker) {
      if (this.state === 'active') {
        ticker.innerHTML = `CORRIDOIO STABILIZZATO &bull; <span class="highlight">TRASMISSIONE VELOCE IN CORSO</span> &bull; 24,800 RPM`;
      } else if (this.state === 'pending') {
        ticker.innerHTML = `VETTORE <span class="highlight">[${this.lockedSlots.join('-')}]</span> &bull; ATTESA AZIONAMENTO LEVA`;
      } else {
        ticker.innerHTML = `ISTITUTO DINAMICO DI PROPULSIONE E TRASLAZIONE &bull; <span class="highlight">BANCO DI PROVA CINEMATICO IDPT</span>`;
      }
    }
  }
}

window.idptGate = new FuturistGateController();
