/**
 * Khepri Cipher Terminal - Mathematically Coupled Simulated Telemetry
 * Couples trace risk, ICE integrity, connection stability, jitter, and bandwidth siphon.
 */

class CipherTelemetrySystem {
  constructor() {
    this.traceRisk = 2.0;       // 0 to 100%
    this.iceIntegrity = 100.0;   // 100% down to 0%
    this.stability = 99.8;      // 0 to 100%
    this.jitter = 1.4;          // ms
    this.bandwidth = 0.0;       // GB/s
    this.totalTransferred = 0.0;// TB
    
    this.lockedNodes = 0;
    this.totalNodes = 7;
    this.stage = 'idle';
    this.activeTime = 0;

    // DOM Elements
    this.dom = {
      traceVal: document.getElementById('telemetry-trace-val'),
      traceBar: document.getElementById('telemetry-trace-bar'),
      iceVal: document.getElementById('telemetry-ice-val'),
      iceBar: document.getElementById('telemetry-ice-bar'),
      stabilityVal: document.getElementById('telemetry-stability-val'),
      stabilityBar: document.getElementById('telemetry-stability-bar'),
      jitterVal: document.getElementById('telemetry-jitter-val'),
      bandwidthVal: document.getElementById('telemetry-bandwidth-val'),
      hexStream: document.getElementById('cache-hex-stream'),
      transferCount: document.getElementById('transfer-total-val')
    };

    this.hexChars = '0123456789ABCDEF';
    this.startLoop();
  }

  setLockedNodes(count) {
    this.lockedNodes = Math.max(0, Math.min(count, this.totalNodes));
  }

  setStage(stage) {
    this.stage = stage;
    if (stage === 'idle') {
      this.activeTime = 0;
    }
  }

  startLoop() {
    setInterval(() => {
      this.updateMetrics();
      this.render();
    }, 150);

    // Faster ticker for scrolling hex cache preview
    setInterval(() => {
      this.updateHexStream();
    }, 250);
  }

  updateMetrics() {
    // 1. ICE Integrity: Directly derived from locked node count
    const targetIce = Math.max(0, 100 - (this.lockedNodes / this.totalNodes) * 100);
    this.iceIntegrity += (targetIce - this.iceIntegrity) * 0.3;

    // 2. Trace Risk computation:
    let targetRisk = 2.0 + (this.lockedNodes * 8.0);
    if (this.stage === 'buildup') {
      targetRisk = 75.0 + Math.random() * 8.0;
    } else if (this.stage === 'breakthrough') {
      targetRisk = 88.0 + Math.random() * 4.0;
    } else if (this.stage === 'active') {
      this.activeTime += 0.15;
      targetRisk = Math.min(96.5, 84.0 + (this.activeTime * 0.35) + Math.sin(this.activeTime) * 2.0);
    } else if (this.stage === 'idle' && this.lockedNodes === 0) {
      targetRisk = 2.0;
    }
    this.traceRisk += (targetRisk - this.traceRisk) * 0.15;

    // 3. Packet Jitter computation:
    if (this.stage === 'buildup') {
      this.jitter = 12.0 + Math.random() * 8.5;
    } else if (this.stage === 'active') {
      this.jitter = 2.1 + (Math.random() - 0.5) * 0.8;
    } else {
      this.jitter = 1.2 + (this.lockedNodes * 0.4) + (Math.random() - 0.5) * 0.3;
    }

    // 4. Connection Stability: coupled to Jitter & Trace Risk
    const baseStability = 100 - (this.traceRisk * 0.35) - (this.jitter * 0.6);
    this.stability = Math.max(15.0, Math.min(99.9, baseStability + (Math.random() - 0.5) * 1.5));

    // 5. Bandwidth & Total Transfer
    if (this.stage === 'active') {
      this.bandwidth = 4.6 + Math.sin(this.activeTime * 2) * 0.9 + (Math.random() - 0.5) * 0.4;
      this.totalTransferred += (this.bandwidth * 0.15) / 1024; // convert to TB
    } else {
      this.bandwidth = 0.0;
    }
  }

  render() {
    if (!this.dom.traceVal) return;

    // Trace Risk
    this.dom.traceVal.textContent = `${this.traceRisk.toFixed(1)}%`;
    this.dom.traceBar.style.width = `${Math.min(100, this.traceRisk)}%`;
    if (this.traceRisk > 75) {
      this.dom.traceBar.className = 'meter-fill danger';
      this.dom.traceVal.className = 'telemetry-value crimson-glow';
    } else if (this.traceRisk > 45) {
      this.dom.traceBar.className = 'meter-fill warning';
      this.dom.traceVal.className = 'telemetry-value amber-glow';
    } else {
      this.dom.traceBar.className = 'meter-fill';
      this.dom.traceVal.className = 'telemetry-value';
    }

    // ICE Integrity
    this.dom.iceVal.textContent = `${this.iceIntegrity.toFixed(1)}%`;
    this.dom.iceBar.style.width = `${Math.min(100, this.iceIntegrity)}%`;

    // Stability
    this.dom.stabilityVal.textContent = `${this.stability.toFixed(1)}%`;
    this.dom.stabilityBar.style.width = `${Math.min(100, this.stability)}%`;

    // Jitter
    this.dom.jitterVal.textContent = `${this.jitter.toFixed(2)} ms`;

    // Bandwidth
    this.dom.bandwidthVal.textContent = this.bandwidth > 0 ? `${this.bandwidth.toFixed(2)} GB/s` : '0.00 GB/s';

    // Total Transferred
    if (this.dom.transferCount) {
      this.dom.transferCount.textContent = `${this.totalTransferred.toFixed(3)} TB`;
    }
  }

  updateHexStream() {
    if (!this.dom.hexStream) return;
    if (this.stage === 'active') {
      let lines = [];
      for (let l = 0; l < 9; l++) {
        const offset = (0x1000 + Math.floor(Math.random() * 0xEFFF)).toString(16).toUpperCase();
        let bytes = [];
        for (let b = 0; b < 8; b++) {
          bytes.push(this.hexChars[Math.floor(Math.random() * 16)] + this.hexChars[Math.floor(Math.random() * 16)]);
        }
        lines.push(`0x${offset}: ${bytes.join(' ')}`);
      }
      this.dom.hexStream.textContent = lines.join('\n');
    } else {
      this.dom.hexStream.textContent = `[PORTAL STANDBY: AWAITING ACTIVE PAYLOAD CONDUIT]\n\n0x0000: -- -- -- -- -- -- -- --\n0x0010: -- -- -- -- -- -- -- --\n0x0020: -- -- -- -- -- -- -- --\n0x0030: -- -- -- -- -- -- -- --\n\nFIREWALL INTEGRITY: ${this.iceIntegrity.toFixed(0)}%\nCARRIER FREQUENCY: 43.65 Hz`;
    }
  }
}

// Global Export
window.CipherTelemetrySystem = CipherTelemetrySystem;
