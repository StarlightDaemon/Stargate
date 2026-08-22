/**
 * TX-77 'AURA' Fast-Neutron Annular Resonator
 * Quick-Dial Preset Library & Automated Stepped Sequencer
 */

class PresetSequencer {
  constructor() {
    this.presets = {
      'CRIT-A01': {
        id: 'CRIT-A01',
        name: 'Standard Annular Resonant Cold Start',
        tier: 'Tier 1: Verified Baseline',
        channels: [0, 2, 4, 5, 7, 9], // α, γ, ε, ζ, θ, κ
        targetPower: 420.0,
        marginPcm: 2200,
        desc: 'Verified cold-start resonance alignment with symmetric 6-bank flux distribution.'
      },
      'CRIT-B04': {
        id: 'CRIT-B04',
        name: 'Low-Beta Flux Bridge Calibration',
        tier: 'Tier 1: Verified Baseline',
        channels: [1, 3, 4, 6, 8, 9], // β, δ, ε, η, ι, κ
        targetPower: 385.0,
        marginPcm: 1950,
        desc: 'Optimized for high delayed-neutron precursor stability during moderator flow transition.'
      },
      'CRIT-C09': {
        id: 'CRIT-C09',
        name: 'Isotope Synthesis Steady-State',
        tier: 'Tier 1: Verified Baseline',
        channels: [0, 1, 5, 6, 7, 8], // α, β, ζ, η, θ, ι
        targetPower: 410.0,
        marginPcm: 2100,
        desc: 'High thermal-flux trap focus for deep subsurface actinide transmutation.'
      },
      'EXP-X12': {
        id: 'EXP-X12',
        name: 'Fast-Neutron Resonance Surge',
        tier: 'Tier 2: Experimental Regime',
        channels: [2, 3, 5, 7, 8, 9], // γ, δ, ζ, θ, ι, κ
        targetPower: 445.0,
        marginPcm: 1450,
        desc: 'Provisional high-temperature fast-neutron run with reduced Doppler margin.'
      },
      'EXP-Y07': {
        id: 'EXP-Y07',
        name: 'Asymmetric Flux Horizon Regime',
        tier: 'Tier 2: Experimental Regime',
        channels: [0, 1, 3, 4, 5, 6], // α, β, δ, ε, ζ, η
        targetPower: 395.0,
        marginPcm: 1600,
        desc: 'Evaluates azimuthal flux tilt compensation across Sector 09 reflector boundary.'
      },
      'EXP-Z99': {
        id: 'EXP-Z99',
        name: 'Deep Subsurface Harmonic Inversion',
        tier: 'Tier 2: Experimental Regime',
        channels: [1, 2, 4, 6, 7, 9], // β, γ, ε, η, θ, κ
        targetPower: 430.0,
        marginPcm: 1550,
        desc: 'Resonant acoustic-hydraulic coupling test at maximum deep-bore pressure.'
      }
    };

    this.isRunning = false;
    this.currentStep = 0;
    this.sequenceTimeout = null;
  }

  getPreset(presetId) {
    return this.presets[presetId] || null;
  }

  executePreset(presetId, onStepCallback, onCompleteCallback) {
    const preset = this.getPreset(presetId);
    if (!preset) return false;

    // Reset reactor to clean start first
    window.reactorPhysics.scram();
    this.isRunning = true;
    this.currentStep = 0;

    const runNextChannel = () => {
      if (!this.isRunning) return;
      if (this.currentStep >= preset.channels.length) {
        this.isRunning = false;
        if (onCompleteCallback) onCompleteCallback(preset);
        return;
      }

      const channelId = preset.channels[this.currentStep];
      const calib = window.reactorPhysics.calibrateChannel(channelId);
      if (onStepCallback) onStepCallback('WITHDRAWING', channelId, this.currentStep);

      // Step 1: Rod withdrawal motion wait (~280ms)
      this.sequenceTimeout = setTimeout(() => {
        if (!this.isRunning) return;
        if (onStepCallback) onStepCallback('STABILIZING', channelId, this.currentStep);

        // Step 2: Flux stabilization wait (~320ms)
        this.sequenceTimeout = setTimeout(() => {
          if (!this.isRunning) return;
          window.reactorPhysics.confirmChannelLock(channelId);
          if (onStepCallback) onStepCallback('LOCKED', channelId, this.currentStep);

          this.currentStep++;
          // Pause between channels (~180ms)
          this.sequenceTimeout = setTimeout(runNextChannel, 180);
        }, 320);
      }, 280);
    };

    runNextChannel();
    return true;
  }

  stop() {
    this.isRunning = false;
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
      this.sequenceTimeout = null;
    }
  }
}

window.PresetSequencer = PresetSequencer;
