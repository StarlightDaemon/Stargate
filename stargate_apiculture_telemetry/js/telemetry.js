/**
 * IPATC APICULTURE TELEMETRY NETWORK — REAL-TIME TELEMETRY ENGINE
 * Simulates high-precision apicultural sensor arrays:
 * - 10-node radial bio-acoustic FFT spectral generation
 * - Brood-nest internal thermal mesh (34.5°C - 35.5°C homeostatic regulation)
 * - Load-cell hive differential mass (kg)
 * - Optical entrance lidar traffic (inbound / outbound counts)
 * - Swarm precursor acoustic spectral tracking (450Hz piping detector)
 */

class TelemetryEngine {
  constructor() {
    this.time = 0;
    this.ambientTemp = 22.4;
    this.barometricPressure = 1013.8;
    this.broodNestTemp = 34.85;
    this.hiveMassKg = 42.68;
    this.inboundTraffic = 284;
    this.outboundTraffic = 296;
    this.harmonicCoherence = 99.4;
    this.swarmRiskIndex = 14; // percentage
    this.listeners = new Set();

    // 10 nodes live telemetry cache
    this.nodeReadings = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      peakFreq: 220 + (i * 18) + (Math.random() * 4),
      amplitude: 0.65 + Math.random() * 0.25,
      temp: 34.7 + Math.random() * 0.3,
      correlated: false,
      confidence: 0,
      classification: 'Q-RSS' // Queen-Right Steady State
    }));

    // Start 60Hz telemetry update tick
    this.startTelemetryLoop();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => {
      try { fn(this); } catch (e) { console.error(e); }
    });
  }

  startTelemetryLoop() {
    setInterval(() => {
      this.time += 0.05;

      // Realistic micro-fluctuations
      this.broodNestTemp = 34.8 + Math.sin(this.time * 0.3) * 0.12 + (Math.random() - 0.5) * 0.04;
      this.hiveMassKg = 42.68 + Math.sin(this.time * 0.05) * 0.05 + (Math.random() - 0.5) * 0.008;
      this.inboundTraffic = Math.floor(280 + Math.sin(this.time * 0.8) * 25 + (Math.random() - 0.5) * 12);
      this.outboundTraffic = Math.floor(290 + Math.cos(this.time * 0.8) * 22 + (Math.random() - 0.5) * 10);
      this.barometricPressure = 1013.8 + Math.sin(this.time * 0.02) * 0.4;

      // Update node micro-oscillations
      this.nodeReadings.forEach((n, idx) => {
        if (!n.correlated) {
          n.peakFreq = 220 + (idx * 18) + Math.sin(this.time * 1.5 + idx) * 3;
          n.amplitude = 0.55 + Math.sin(this.time * 2 + idx) * 0.2;
          n.temp = 34.7 + Math.sin(this.time * 0.4 + idx) * 0.2;
        }
      });

      this.notify();
    }, 100);
  }

  // Generate synthetic FFT frequency bin data for canvas waveform rendering
  getNodeWaveform(nodeIndex, isLocked = false, isDialing = false, timeOffset = 0) {
    const bins = 64;
    const wave = new Float32Array(bins);
    const t = this.time + timeOffset;
    const baseFreq = this.nodeReadings[nodeIndex]?.peakFreq || 240;

    for (let i = 0; i < bins; i++) {
      const normalizedBin = i / bins;
      // Fundamental + 2nd & 3rd harmonics + noise
      let val = 0;
      if (isLocked) {
        // Crisp, fully characterized harmonic comb
        const fundamental = Math.sin(t * 8 + normalizedBin * Math.PI * 4) * 0.5;
        const h2 = Math.sin(t * 16 + normalizedBin * Math.PI * 8) * 0.3;
        const h3 = Math.sin(t * 24 + normalizedBin * Math.PI * 12) * 0.15;
        val = fundamental + h2 + h3 + (Math.random() - 0.5) * 0.04;
      } else if (isDialing) {
        // Resolving correlation pattern
        val = Math.sin(t * 12 + normalizedBin * Math.PI * 6) * 0.6 + (Math.random() - 0.5) * 0.15;
      } else {
        // Generic ambient hive hum
        val = Math.sin(t * 3 + normalizedBin * Math.PI * 2) * 0.35 + (Math.random() - 0.5) * 0.25;
      }
      wave[i] = Math.max(-1, Math.min(1, val));
    }
    return wave;
  }

  // Generate 2D thermal false-color matrix (12x12 grid) for brood nest visualization
  getBroodThermalMatrix(width = 12, height = 12) {
    const grid = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.hypot(centerX, centerY);

    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const dist = Math.hypot(x - centerX, y - centerY);
        const normDist = dist / maxDist;
        // Core is 35.2°C, perimeter drops to 28.5°C
        const baseTemp = 35.2 - normDist * 6.5;
        const noise = (Math.sin(this.time * 0.8 + x * 0.5 + y * 0.5) * 0.15) + ((Math.random() - 0.5) * 0.08);
        row.push(parseFloat((baseTemp + noise).toFixed(2)));
      }
      grid.push(row);
    }
    return grid;
  }
}

// Global telemetry singleton
window.telemetryEngine = new TelemetryEngine();
