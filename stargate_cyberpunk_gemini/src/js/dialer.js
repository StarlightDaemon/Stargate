/**
 * Khepri Cipher Terminal - Core Dialing & Breach Controller
 * 7-Phase Polymorphic Handshake Spoofing Engine
 */

class CipherDialer {
  constructor() {
    this.vectors = [
      { id: 0, code: '\\DELTA-NULL', name: 'Zero-Vector Nullifier', parity: '0x9F', glyph: 'M11 2L2 11l9 9 9-9L11 2zm0 4l5 5-5 5-5-5 5-5z' },
      { id: 1, code: '\\HEX-PRISM', name: 'Lattice Phase Refractor', parity: '0xA3', glyph: 'M6 2l9 0 5 9-5 9-9 0-5-9 5-9zm3 4l-3 5 3 5 5 0 3-5-3-5-5 0z' },
      { id: 2, code: '\\LATTICE-SYNC', name: 'Harmonic Mesh Shifter', parity: '0x1C', glyph: 'M2 2h7v7H2zm11 0h7v7h-7zm0 11h7v7h-7zm-11 0h7v7H2zm4-4h4v4H6z' },
      { id: 3, code: '\\QUANTUM-FOLDS', name: 'Non-Euclidean Tunnel', parity: '0x7E', glyph: 'M11 2a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10z' },
      { id: 4, code: '\\CIPHER-KNOT', name: 'Asymmetric Key Untangler', parity: '0xD4', glyph: 'M4 11a7 7 0 0 1 14 0 7 7 0 0 1-14 0zm7-4a4 4 0 0 0-4 4 4 4 0 0 0 8 0 4 4 0 0 0-4-4z' },
      { id: 5, code: '\\PHASE-LOCK', name: 'Resonant Buffer Override', parity: '0x5B', glyph: 'M11 2v18M2 11h18M5 5l12 12M5 17L17 5' },
      { id: 6, code: '\\FLUX-TACHYON', name: 'Temporal Packet Injector', parity: '0x82', glyph: 'M11 2L2 14h7l-2 6 11-12h-7l2-6z' },
      { id: 7, code: '\\ENTROPY-RAIL', name: 'Thermal Noise Modulator', parity: '0x3E', glyph: 'M2 6h18M2 11h18M2 16h18M6 2v18M16 2v18' },
      { id: 8, code: '\\VORTEX-SEED', name: 'Recursive Loop Trigger', parity: '0xF1', glyph: 'M11 4a7 7 0 1 0 7 7h-3a4 4 0 1 1-4-4V4z' },
      { id: 9, code: '\\ZERO-POINT', name: 'Singularity Packet Inject', parity: '0x00', glyph: 'M11 2L2 20h18L11 2zm0 6l5 9H6l5-9z' }
    ];

    this.maxAddressLength = 7;
    this.currentAddress = []; // Array of vector IDs (0-9)
    this.stage = 'idle'; // 'idle', 'pending', 'buildup', 'breakthrough', 'active'
    this.isAutoDialing = false;
    this.autoDialTimer = null;
    this.buildupTimer = null;
    this.breakthroughTimer = null;

    // Safety Interlock: MUST default to RELEASED!
    this.isIsolatorEngaged = false;

    // DOM Elements
    this.dom = {
      vectorGrid: document.getElementById('vector-grid'),
      addressSlots: document.querySelectorAll('.address-slot'),
      btnExecute: document.getElementById('btn-execute'),
      btnPurge: document.getElementById('btn-purge'),
      toggleIsolator: document.getElementById('toggle-isolator'),
      statusDisplay: document.getElementById('breach-status-display'),
      interlockBanner: document.getElementById('interlock-alert-banner'),
      flashOverlay: document.getElementById('flash-overlay'),
      gateContainer: document.getElementById('gate-container')
    };

    this.init();
  }

  init() {
    this.renderVectorGrid();
    this.bindControls();
    this.updateUI();
  }

  renderVectorGrid() {
    if (!this.dom.vectorGrid) return;
    this.dom.vectorGrid.innerHTML = '';

    this.vectors.forEach((v) => {
      const btn = document.createElement('button');
      btn.className = 'vector-btn';
      btn.id = `btn-vector-${v.id}`;
      btn.setAttribute('data-vector-id', v.id);

      btn.innerHTML = `
        <div class="vector-top-row">
          <span class="vector-num">${String(v.id + 1).padStart(2, '0')}</span>
          <svg class="vector-glyph-icon" viewBox="0 0 22 22">
            <path d="${v.glyph}" />
          </svg>
        </div>
        <div class="vector-name">${v.code}</div>
        <div class="vector-desc">${v.name}</div>
        <div class="vector-parity">PARITY: ${v.parity}</div>
      `;

      btn.addEventListener('click', () => {
        if (window.CipherAudio) window.CipherAudio.resume();
        this.selectVectorManual(v.id);
      });

      this.dom.vectorGrid.appendChild(btn);
    });
  }

  bindControls() {
    // Execute Breach button
    if (this.dom.btnExecute) {
      this.dom.btnExecute.addEventListener('click', () => {
        if (window.CipherAudio) window.CipherAudio.resume();
        this.executeBreach();
      });
    }

    // Purge Connection button (always reachable)
    if (this.dom.btnPurge) {
      this.dom.btnPurge.addEventListener('click', () => {
        if (window.CipherAudio) window.CipherAudio.resume();
        this.disengage();
      });
    }

    // Counter-Trace Isolator (Safety Interlock)
    if (this.dom.toggleIsolator) {
      this.dom.toggleIsolator.addEventListener('click', () => {
        if (window.CipherAudio) window.CipherAudio.resume();
        this.toggleIsolator();
      });
    }
  }

  toggleIsolator() {
    this.isIsolatorEngaged = !this.isIsolatorEngaged;
    const isolator = this.dom.toggleIsolator;
    const statusText = isolator.querySelector('.isolator-status');

    if (this.isIsolatorEngaged) {
      isolator.className = 'engaged';
      statusText.textContent = 'HOLD: ENGAGED';
      if (window.AppLogger) window.AppLogger.log('WARN', 'Counter-Trace Isolator engaged [BREACH SAFETY LOCK ACTIVE]');
    } else {
      isolator.className = 'released';
      statusText.textContent = 'HOLD: RELEASED';
      if (this.dom.interlockBanner) this.dom.interlockBanner.classList.remove('visible');
      if (window.AppLogger) window.AppLogger.log('INFO', 'Counter-Trace Isolator released [READY]');
    }
    if (window.CipherAudio) window.CipherAudio.playCandidateTick();
  }

  selectVectorManual(vectorId) {
    if (this.stage === 'buildup' || this.stage === 'breakthrough' || this.stage === 'active') {
      return; // Cannot modify address while breach is underway
    }
    if (this.currentAddress.length >= this.maxAddressLength) {
      return; // Address complete
    }

    this.lockVector(vectorId);
  }

  lockVector(vectorId) {
    const slotIdx = this.currentAddress.length;
    this.currentAddress.push(vectorId);

    const vector = this.vectors.find(v => v.id === vectorId);
    const btn = document.getElementById(`btn-vector-${vectorId}`);

    // Visual candidate key cycling simulation (120ms)
    if (btn) {
      btn.classList.add('cycling');
      if (window.CipherAudio) window.CipherAudio.playCandidateTick();
      setTimeout(() => {
        btn.classList.remove('cycling');
        btn.classList.add('selected');
      }, 120);
    }

    // Sound & Ring feedback
    if (window.CipherAudio) window.CipherAudio.playHandshakeLock(slotIdx);
    if (window.CipherRing) window.CipherRing.setLayerDestabilized(slotIdx, true);
    if (window.CipherTelemetry) window.CipherTelemetry.setLockedNodes(this.currentAddress.length);

    // Logging
    if (window.AppLogger) {
      window.AppLogger.log('LOCK', `Handshake Phase ${slotIdx + 1}/7 synchronized: ${vector.code} (${vector.parity})`);
    }

    // Check if 7 nodes are now locked
    if (this.currentAddress.length === this.maxAddressLength) {
      this.stage = 'pending';
      if (window.CipherRing) window.CipherRing.setStage('pending');
      if (window.CipherTelemetry) window.CipherTelemetry.setStage('pending');
      if (window.AppLogger) {
        window.AppLogger.log('INFO', 'ALL 7 HANDSHAKE VECTORS SYNCHRONIZED // FIREWALL DESTABILIZED // AWAITING MANUAL BREACH EXECUTION');
      }
    }

    this.updateUI();
  }

  // Primary Action: Execute Breach (Never auto-fires!)
  executeBreach() {
    // Negative Case Check 1: Address must be complete
    if (this.currentAddress.length < this.maxAddressLength) {
      return;
    }
    if (this.stage !== 'pending') {
      return;
    }

    // Safety Interlock Check: If engaged, abort and show unmissable alert!
    if (this.isIsolatorEngaged) {
      if (this.dom.interlockBanner) {
        this.dom.interlockBanner.classList.add('visible');
      }
      if (window.CipherAudio) window.CipherAudio.playInterlockAlarm();
      if (window.AppLogger) {
        window.AppLogger.log('WARN', 'BREACH ABORTED: Counter-Trace Isolator is ENGAGED. Release isolator to execute payload.');
      }
      setTimeout(() => {
        if (this.dom.interlockBanner) this.dom.interlockBanner.classList.remove('visible');
      }, 3500);
      return;
    }

    // Stage 1: BUILDUP (1800ms)
    this.stage = 'buildup';
    if (this.dom.gateContainer) {
      this.dom.gateContainer.className = 'gate-buildup';
    }
    if (window.CipherRing) {
      window.CipherRing.setStage('buildup');
      window.CipherRing.buildupProgress = 0;
    }
    if (window.CipherTelemetry) window.CipherTelemetry.setStage('buildup');
    if (window.CipherAudio) window.CipherAudio.playBuildupSweep();
    if (window.AppLogger) window.AppLogger.log('BUILDUP', 'STAGE 1/3: INJECTING QUANTUM PAYLOAD... ICE COLLAPSE IN PROGRESS');

    this.updateUI();

    // Progress tick for buildup
    const startBuildup = performance.now();
    const buildupDuration = 1800;

    const tickBuildup = () => {
      if (this.stage !== 'buildup') return;
      const elapsed = performance.now() - startBuildup;
      const progress = Math.min(1.0, elapsed / buildupDuration);
      if (window.CipherRing) window.CipherRing.buildupProgress = progress;

      if (elapsed < buildupDuration) {
        requestAnimationFrame(tickBuildup);
      } else {
        // Stage 2: BREAKTHROUGH (600ms)
        this.triggerBreakthrough();
      }
    };
    requestAnimationFrame(tickBuildup);
  }

  // Stage 2: BREAKTHROUGH
  triggerBreakthrough() {
    this.stage = 'breakthrough';
    if (this.dom.gateContainer) {
      this.dom.gateContainer.className = 'gate-breakthrough';
    }
    if (this.dom.flashOverlay) {
      this.dom.flashOverlay.classList.add('active');
      setTimeout(() => {
        if (this.dom.flashOverlay) this.dom.flashOverlay.classList.remove('active');
      }, 150);
    }

    if (window.CipherRing) window.CipherRing.setStage('breakthrough');
    if (window.CipherTelemetry) window.CipherTelemetry.setStage('breakthrough');
    if (window.CipherAudio) window.CipherAudio.playBreakthroughBoom();
    if (window.AppLogger) window.AppLogger.log('BREACH', 'STAGE 2/3: PERIMETER BREACH ACHIEVED // APERTURE OPENED');

    this.updateUI();

    // Transition to Stage 3: SUSTAINED ACTIVE after 600ms
    this.breakthroughTimer = setTimeout(() => {
      this.enterSustainedActive();
    }, 600);
  }

  // Stage 3: SUSTAINED ACTIVE
  enterSustainedActive() {
    this.stage = 'active';
    if (this.dom.gateContainer) {
      this.dom.gateContainer.className = 'gate-active';
    }
    if (window.CipherRing) window.CipherRing.setStage('active');
    if (window.CipherTelemetry) window.CipherTelemetry.setStage('active');
    if (window.AppLogger) window.AppLogger.log('BREACH', 'STAGE 3/3: SUSTAINED DATA CONDUIT ACTIVE // SIPHONING PAYLOAD');

    this.updateUI();

    // Periodic packet chirps in active state
    this.activeInterval = setInterval(() => {
      if (this.stage === 'active' && window.CipherAudio) {
        window.CipherAudio.playPacketChirp();
      } else {
        clearInterval(this.activeInterval);
      }
    }, 400);
  }

  // Disengage / Purge Connection (Always reachable)
  disengage() {
    // Clear any timers
    if (this.autoDialTimer) clearTimeout(this.autoDialTimer);
    if (this.buildupTimer) clearTimeout(this.buildupTimer);
    if (this.breakthroughTimer) clearTimeout(this.breakthroughTimer);
    if (this.activeInterval) clearInterval(this.activeInterval);
    this.isAutoDialing = false;

    this.currentAddress = [];
    this.stage = 'idle';

    // Clear vector buttons selected states
    const btns = document.querySelectorAll('.vector-btn');
    btns.forEach(b => b.classList.remove('selected', 'cycling'));

    // Reset Ring & Telemetry
    if (this.dom.gateContainer) {
      this.dom.gateContainer.className = 'gate-idle';
    }
    if (window.CipherRing) window.CipherRing.resetAllLayers();
    if (window.CipherTelemetry) {
      window.CipherTelemetry.setLockedNodes(0);
      window.CipherTelemetry.setStage('idle');
    }
    if (window.CipherAudio) window.CipherAudio.playPurge();
    if (window.AppLogger) window.AppLogger.log('PURGE', 'CONNECTION PURGED // NODE RESTORED TO IDLE');

    this.updateUI();
  }

  // Quick-Dial Cached Exploit Chain (Auto-dials visibly, lands in PENDING, never auto-fires!)
  loadPresetAddress(addressArray, targetName = '') {
    this.disengage();
    this.isAutoDialing = true;

    if (window.AppLogger) {
      window.AppLogger.log('INFO', `DEPLOYING CACHED EXPLOIT CHAIN: [${targetName || 'PRESET'}]`);
    }

    let idx = 0;
    const dialNext = () => {
      if (!this.isAutoDialing) return; // Aborted by disengage
      if (idx < addressArray.length && idx < this.maxAddressLength) {
        const vId = addressArray[idx];
        this.lockVector(vId);
        idx++;
        this.autoDialTimer = setTimeout(dialNext, 260); // 260ms per node
      } else {
        this.isAutoDialing = false;
        // Notice: Lands in PENDING state! Does NOT auto-fire!
      }
    };

    this.autoDialTimer = setTimeout(dialNext, 100);
  }

  updateUI() {
    // 1. Update Address Track Slots
    if (this.dom.addressSlots) {
      this.dom.addressSlots.forEach((slot, idx) => {
        if (idx < this.currentAddress.length) {
          const vId = this.currentAddress[idx];
          const v = this.vectors.find(vec => vec.id === vId);
          slot.className = 'address-slot locked';
          slot.innerHTML = `<span style="font-size: 11px;">0${v.id + 1}</span>`;
        } else {
          slot.className = idx === this.currentAddress.length ? 'address-slot active-target' : 'address-slot';
          slot.innerHTML = `<span>${idx + 1}</span>`;
        }
      });
    }

    // 2. Update Status Display Text & Badge
    if (this.dom.statusDisplay) {
      if (this.stage === 'idle') {
        const count = this.currentAddress.length;
        this.dom.statusDisplay.textContent = count === 0 
          ? 'IDLE // AWAITING 7-PHASE VECTOR HANDSHAKE'
          : `COMPILING HANDSHAKE SPOOF [${count}/7]...`;
      } else if (this.stage === 'pending') {
        this.dom.statusDisplay.textContent = 'HANDSHAKE COMPILED // READY FOR BREACH INJECTION';
      } else if (this.stage === 'buildup') {
        this.dom.statusDisplay.textContent = 'STAGE 1/3: EXPLOIT INJECTION IN PROGRESS...';
      } else if (this.stage === 'breakthrough') {
        this.dom.statusDisplay.textContent = 'STAGE 2/3: PERIMETER BREACH ACHIEVED';
      } else if (this.stage === 'active') {
        this.dom.statusDisplay.textContent = 'STAGE 3/3: ACTIVE DATA CONDUIT // SIPHONING';
      }
    }

    // 3. Update Execute Button
    if (this.dom.btnExecute) {
      if (this.stage === 'pending') {
        this.dom.btnExecute.className = 'ready';
        this.dom.btnExecute.disabled = false;
        this.dom.btnExecute.innerHTML = '⚡ EXECUTE BREACH';
      } else if (this.stage === 'active') {
        this.dom.btnExecute.className = 'active';
        this.dom.btnExecute.disabled = true;
        this.dom.btnExecute.innerHTML = '● BREACH SUSTAINED';
      } else if (this.stage === 'buildup' || this.stage === 'breakthrough') {
        this.dom.btnExecute.className = 'active';
        this.dom.btnExecute.disabled = true;
        this.dom.btnExecute.innerHTML = '⏳ INJECTING...';
      } else {
        this.dom.btnExecute.className = '';
        this.dom.btnExecute.disabled = true;
        this.dom.btnExecute.innerHTML = '⚡ EXECUTE BREACH';
      }
    }
  }
}

// Global Export
window.CipherDialer = CipherDialer;
