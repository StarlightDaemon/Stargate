/**
 * TX-77 'AURA' Fast-Neutron Annular Resonator
 * Real-Time Reactor Physics & Point Kinetics Model
 */

class ReactorPhysicsEngine {
  constructor() {
    // 10 Radial Control Rod Banks
    this.channels = [
      { id: 0, bank: 'BANK-01', symbol: 'α', name: 'Alpha', angle: 0, targetDepth: 74.2, currentDepth: 0, fluxReading: 1.0, isCalibrating: false, isCalibrated: false },
      { id: 1, bank: 'BANK-02', symbol: 'β', name: 'Beta', angle: 36, targetDepth: 81.5, currentDepth: 0, fluxReading: 1.0, isCalibrating: false, isCalibrated: false },
      { id: 2, bank: 'BANK-03', symbol: 'γ', name: 'Gamma', angle: 72, targetDepth: 68.0, currentDepth: 0, fluxReading: 1.0, isCalibrating: false, isCalibrated: false },
      { id: 3, bank: 'BANK-04', symbol: 'δ', name: 'Delta', angle: 108, targetDepth: 92.4, currentDepth: 0, fluxReading: 1.0, isCalibrating: false, isCalibrated: false },
      { id: 4, bank: 'BANK-05', symbol: 'ε', name: 'Epsilon', angle: 144, targetDepth: 65.8, currentDepth: 0, fluxReading: 1.0, isCalibrating: false, isCalibrated: false },
      { id: 5, bank: 'BANK-06', symbol: 'ζ', name: 'Zeta', angle: 180, targetDepth: 88.3, currentDepth: 0, fluxReading: 1.0, isCalibrating: false, isCalibrated: false },
      { id: 6, bank: 'BANK-07', symbol: 'η', name: 'Eta', angle: 216, targetDepth: 72.1, currentDepth: 0, fluxReading: 1.0, isCalibrating: false, isCalibrated: false },
      { id: 7, bank: 'BANK-08', symbol: 'θ', name: 'Theta', angle: 252, targetDepth: 85.0, currentDepth: 0, fluxReading: 1.0, isCalibrating: false, isCalibrated: false },
      { id: 8, bank: 'BANK-09', symbol: 'ι', name: 'Iota', angle: 288, targetDepth: 79.6, currentDepth: 0, fluxReading: 1.0, isCalibrating: false, isCalibrated: false },
      { id: 9, bank: 'BANK-10', symbol: 'κ', name: 'Kappa', angle: 324, targetDepth: 94.5, currentDepth: 0, fluxReading: 1.0, isCalibrating: false, isCalibrated: false }
    ];

    // Selected Dial Sequence (up to 6 channels)
    this.selectedSequence = [];
    this.maxAddressLength = 6;

    // Kinetics Variables
    this.keff = 0.7500;
    this.targetKeff = 0.7500;
    this.reactivityPcm = -33333; // rho in pcm = (keff - 1) / keff * 1e5
    this.thermalPowerMw = 0.001; // MWth
    this.targetPowerMw = 0.001;
    this.periodSeconds = 999.0;
    
    // Core Thermal Hydraulics
    this.tempInlet = 285.4; // deg C
    this.tempOutlet = 286.1;
    this.coolantFlow = 14280; // kg/s
    this.primaryPressure = 155.2; // bar
    this.containmentIntegrity = 100.0; // %
    this.delayedNeutronFraction = 0.00650; // beta_eff = 650 pcm
    this.promptLifetime = 2.50e-5; // l* in seconds

    // Xenon-135 and Iodine-135 Transients
    this.iodine135 = 1.2e14; // atoms/cm3
    this.xenon135 = 2.4e13; // atoms/cm3
    this.xenonWorthPcm = -120; // pcm
    this.xenonHistory = []; // time series for graph

    // Operational States
    // 'SUBCRITICAL' | 'CALIBRATING' | 'PENDING' | 'BUILDUP' | 'BREAKTHROUGH' | 'SUSTAINED'
    this.state = 'SUBCRITICAL';
    this.rpsHoldEngaged = false; // Safety Interlock defaults to RELEASED (false)

    // Stage Timers & Progress
    this.stageTimer = 0;
    this.stageDuration = 0;
    this.cherenkovIntensity = 0.04; // 0.0 to 1.0
  }

  // Update physical kinetics step (called every frame, dt in seconds)
  update(dt) {
    // 1. Smoothly interpolate rod heights
    let totalWithdrawnFraction = 0;
    this.channels.forEach(ch => {
      const target = ch.isCalibrated ? ch.targetDepth : (ch.isCalibrating ? ch.currentDepth : 0);
      ch.currentDepth += (target - ch.currentDepth) * Math.min(1.0, dt * 5.0);
      totalWithdrawnFraction += (ch.currentDepth / 100.0) / this.channels.length;
      
      // Calculate local flux for this channel
      const localBase = 1.0 + (ch.currentDepth / 100.0) * 8.5;
      const noise = (Math.random() - 0.5) * (ch.isCalibrated ? 0.01 : 0.08);
      ch.fluxReading = Math.max(0.1, localBase + noise);
    });

    // 2. State Machine Handling
    if (this.state === 'SUBCRITICAL') {
      const calibratedCount = this.selectedSequence.length;
      // Each calibrated rod brings keff closer to 0.920
      this.targetKeff = 0.7500 + (calibratedCount / this.maxAddressLength) * 0.1700;
      this.targetPowerMw = 0.001 + (calibratedCount / this.maxAddressLength) * 0.049;
      this.cherenkovIntensity += (0.04 - this.cherenkovIntensity) * dt * 4;
    } else if (this.state === 'PENDING') {
      this.targetKeff = 0.9200;
      this.targetPowerMw = 0.050;
      this.cherenkovIntensity += (0.12 - this.cherenkovIntensity) * dt * 4;
    } else if (this.state === 'BUILDUP') {
      this.stageTimer += dt;
      const progress = Math.min(1.0, this.stageTimer / 2.2);
      this.targetKeff = 0.9200 + progress * (1.0000 - 0.9200);
      this.targetPowerMw = 0.050 * Math.exp(progress * 7.5); // climbs toward ~90 MWth
      this.cherenkovIntensity += (0.45 * progress - this.cherenkovIntensity) * dt * 6;

      if (this.stageTimer >= 2.2) {
        this.transitionToBreakthrough();
      }
    } else if (this.state === 'BREAKTHROUGH') {
      this.stageTimer += dt;
      const progress = Math.min(1.0, this.stageTimer / 1.5);
      this.targetKeff = 1.0000;
      this.targetPowerMw = 90.0 + progress * (420.0 - 90.0);
      this.cherenkovIntensity = 0.85 + Math.sin(this.stageTimer * 20) * 0.15; // brilliant flash

      if (this.stageTimer >= 1.5) {
        this.transitionToSustained();
      }
    } else if (this.state === 'SUSTAINED') {
      this.targetKeff = 1.0002;
      this.targetPowerMw = 420.0 + (Math.random() - 0.5) * 1.5;
      this.cherenkovIntensity = 0.95 + (Math.random() - 0.5) * 0.05;
    }

    // 3. Smooth point kinetics update
    this.keff += (this.targetKeff - this.keff) * Math.min(1.0, dt * 4.0);
    this.thermalPowerMw += (this.targetPowerMw - this.thermalPowerMw) * Math.min(1.0, dt * 3.5);
    this.reactivityPcm = Math.round(((this.keff - 1.0) / this.keff) * 100000);

    // 4. Update Thermal Hydraulics
    if (this.state === 'SUSTAINED' || this.state === 'BREAKTHROUGH') {
      this.tempInlet += (295.0 - this.tempInlet) * dt * 0.8;
      this.tempOutlet += (328.6 - this.tempOutlet) * dt * 0.8;
      this.coolantFlow += (18500 - this.coolantFlow) * dt * 1.2;
      this.primaryPressure += (158.4 - this.primaryPressure) * dt * 0.5;
    } else {
      this.tempInlet += (285.4 - this.tempInlet) * dt * 0.8;
      this.tempOutlet += (286.1 - this.tempOutlet) * dt * 0.8;
      this.coolantFlow += (14280 - this.coolantFlow) * dt * 1.2;
      this.primaryPressure += (155.2 - this.primaryPressure) * dt * 0.5;
    }

    // 5. Update Xenon-135 / Iodine-135 Differential Dynamics
    this.updateXenonModel(dt);
  }

  updateXenonModel(dt) {
    const fluxScale = this.thermalPowerMw / 420.0;
    const gammaI = 0.061;
    const gammaXe = 0.003;
    const lambdaI = 2.87e-5; // s^-1
    const lambdaXe = 2.09e-5; // s^-1
    const sigmaAXe = 2.6e-18; // cm2

    const dI = (gammaI * 1e16 * fluxScale - lambdaI * this.iodine135) * dt * 100;
    const dXe = (gammaXe * 1e16 * fluxScale + lambdaI * this.iodine135 - lambdaXe * this.xenon135 - sigmaAXe * fluxScale * 1e13 * this.xenon135) * dt * 100;

    this.iodine135 = Math.max(1e12, this.iodine135 + dI);
    this.xenon135 = Math.max(1e12, this.xenon135 + dXe);
    this.xenonWorthPcm = Math.round(-((this.xenon135 / 1e14) * 850));

    // Record history slice
    if (!this.lastXenonRecord || Date.now() - this.lastXenonRecord > 400) {
      this.xenonHistory.push({
        time: Date.now(),
        xenon: this.xenon135,
        iodine: this.iodine135,
        power: this.thermalPowerMw
      });
      if (this.xenonHistory.length > 50) this.xenonHistory.shift();
      this.lastXenonRecord = Date.now();
    }
  }

  // Two-part locking gesture: Step 1 (Start withdrawal), Step 2 (Stabilize flux & lock)
  calibrateChannel(channelId, onComplete = null) {
    if (this.state !== 'SUBCRITICAL' && this.state !== 'PENDING') return false;
    if (this.selectedSequence.length >= this.maxAddressLength) return false;
    
    const channel = this.channels.find(c => c.id === channelId);
    if (!channel || channel.isCalibrated || channel.isCalibrating) return false;

    channel.isCalibrating = true;
    channel.currentDepth = 0;

    if (window.hmiAudio) {
      window.hmiAudio.playRodServo(600);
    }

    return {
      channel,
      slotIndex: this.selectedSequence.length
    };
  }

  confirmChannelLock(channelId) {
    const channel = this.channels.find(c => c.id === channelId);
    if (!channel || !channel.isCalibrating || channel.isCalibrated) return false;

    channel.isCalibrating = false;
    channel.isCalibrated = true;
    channel.currentDepth = channel.targetDepth;
    this.selectedSequence.push(channel);

    if (window.hmiAudio) {
      window.hmiAudio.playFluxStabilizedChime();
    }

    // Check if address is fully completed (6 channels)
    if (this.selectedSequence.length === this.maxAddressLength) {
      // System enters PENDING CRITICALITY (Awaiting manual operator trigger)
      this.state = 'PENDING';
    }

    return true;
  }

  // Activation Lifecycle
  initiateActivation() {
    if (this.state !== 'PENDING') return { success: false, reason: 'NOT_PENDING' };
    if (this.rpsHoldEngaged) {
      if (window.hmiAudio) window.hmiAudio.playInterlockWarning();
      return { success: false, reason: 'RPS_INTERLOCK_ENGAGED' };
    }

    this.state = 'BUILDUP';
    this.stageTimer = 0;

    if (window.hmiAudio) {
      window.hmiAudio.playBuildupSound(2200);
    }

    return { success: true };
  }

  transitionToBreakthrough() {
    this.state = 'BREAKTHROUGH';
    this.stageTimer = 0;
    this.keff = 1.0000;
    this.targetKeff = 1.0000;

    if (window.hmiAudio) {
      window.hmiAudio.playCherenkovBreakthrough();
    }
  }

  transitionToSustained() {
    this.state = 'SUSTAINED';
    this.stageTimer = 0;
    this.keff = 1.0002;
    this.targetKeff = 1.0002;
  }

  // Emergency SCRAM / Rod Insertion Disengage
  scram() {
    this.state = 'SUBCRITICAL';
    this.stageTimer = 0;
    this.targetKeff = 0.7500;
    this.targetPowerMw = 0.001;

    // Slam all rods down
    this.channels.forEach(ch => {
      ch.isCalibrating = false;
      ch.isCalibrated = false;
      ch.currentDepth = 0;
    });

    this.selectedSequence = [];

    if (window.hmiAudio) {
      window.hmiAudio.playScramKlaxon();
    }
  }

  toggleRpsHold() {
    this.rpsHoldEngaged = !this.rpsHoldEngaged;
    if (window.hmiAudio) {
      window.hmiAudio.playClick();
    }
    return this.rpsHoldEngaged;
  }
}

// Singleton Physics Instance
window.ReactorPhysicsEngine = ReactorPhysicsEngine;
window.reactorPhysics = new ReactorPhysicsEngine();
