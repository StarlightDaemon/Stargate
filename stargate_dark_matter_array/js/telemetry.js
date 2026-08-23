/**
 * BOREAS-IX Coupled Physics Telemetry Simulation Engine
 * Computes physically coupled variables (temperature, pressure, drift field, muon flux, exclusion level).
 */

class TelemetryEngine {
  constructor() {
    this.state = {
      cryoTempK: 165.20,
      vacuumPressureMbar: 1.24e-9,
      driftVoltageKv: -10.50,
      muonVetoRateHz: 0.038,
      ambientGammaRateHz: 14.22,
      targetMassTonnes: 3.50,
      exclusionLimitSigma: 0.00,
      backgroundRejectionPct: 99.9994,
      darkMatterFluxEventsSec: 0.0,
      overburdenMwe: 4200, // meters water equivalent
      apertureState: 'STANDBY' // 'STANDBY', 'PENDING', 'BUILDUP', 'BREAKTHROUGH', 'ACTIVE'
    };

    this.subscribers = [];
    this.timeStep = 0;
    this.intervalId = null;
    this.startSimulation();
  }

  startSimulation() {
    this.intervalId = setInterval(() => {
      this.tick();
    }, 100);
  }

  tick() {
    this.timeStep += 0.1;

    // Atmospheric cosmic variation (slow sinusoidal swell + micro jitter)
    const cosmicSwell = Math.sin(this.timeStep * 0.05) * 0.006 + (Math.random() - 0.5) * 0.003;
    this.state.muonVetoRateHz = Math.max(0.015, +(0.038 + cosmicSwell).toFixed(3));

    // Gamma background coupled to muon shower secondary interactions
    const gammaJitter = (Math.random() - 0.5) * 0.25;
    this.state.ambientGammaRateHz = +(14.22 + (this.state.muonVetoRateHz - 0.038) * 45 + gammaJitter).toFixed(2);

    // Temperature fluctuation (PID cooling cycle response around 165.20 K)
    const tempDrift = Math.sin(this.timeStep * 0.08) * 0.018 + (Math.random() - 0.5) * 0.004;
    this.state.cryoTempK = +(165.20 + tempDrift).toFixed(2);

    // Vacuum insulation pressure coupled to cryostat temperature (outgassing law)
    const tempDelta = this.state.cryoTempK - 165.20;
    const baseP = 1.24e-9;
    const coupledP = baseP * (1 + tempDelta * 2.5);
    this.state.vacuumPressureMbar = coupledP;

    // Aperture & Locking coupled states
    const lockedCount = window.dmDiscrimination ? window.dmDiscrimination.getLockedCount() : 0;
    
    if (this.state.apertureState === 'STANDBY') {
      this.state.exclusionLimitSigma = +(lockedCount * 0.42 + (Math.random() * 0.05)).toFixed(2);
      this.state.driftVoltageKv = -10.50;
      this.state.darkMatterFluxEventsSec = 0.0;
    } else if (this.state.apertureState === 'PENDING') {
      this.state.exclusionLimitSigma = +(2.85 + (Math.random() * 0.08)).toFixed(2);
      this.state.driftVoltageKv = -10.50;
      this.state.darkMatterFluxEventsSec = 0.0;
    } else if (this.state.apertureState === 'BUILDUP') {
      // Handled during buildup animation
    } else if (this.state.apertureState === 'ACTIVE') {
      this.state.driftVoltageKv = -12.00;
      this.state.exclusionLimitSigma = +(5.12 + Math.sin(this.timeStep * 2) * 0.08).toFixed(2);
      this.state.darkMatterFluxEventsSec = +(124.5 + Math.sin(this.timeStep * 4) * 18.2 + (Math.random() - 0.5) * 10).toFixed(1);
      this.state.backgroundRejectionPct = 99.99999;
    }

    this.notify();
  }

  setApertureState(state, customSigma = null) {
    this.state.apertureState = state;
    if (customSigma !== null) {
      this.state.exclusionLimitSigma = customSigma;
    }
    this.notify();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    callback(this.state);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => cb(this.state));
  }
}

window.dmTelemetry = new TelemetryEngine();
