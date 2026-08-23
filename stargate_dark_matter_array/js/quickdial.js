/**
 * BOREAS-IX Quick-Dial Preset Auto-Sequencing Manager
 * Genuinely auto-dials historical and candidate runs step-by-step into the aperture console.
 */

class QuickDialManager {
  constructor() {
    this.isAutoDialing = false;
    this.autoDialTimeout = null;
    this.currentStep = 0;
    this.targetChannels = [];
    this.activePresetId = null;

    this.presets = [
      // Tier 1: Vetted Historical Runs
      {
        id: 'RUN-1998-ALPHA',
        tier: 'TIER_1_VETTED',
        label: 'Run 1998-Alpha (Am-Be Calibration Standard)',
        channels: ['PMT-01', 'PMT-03', 'PMT-04', 'PMT-06', 'PMT-07', 'PMT-09', 'PMT-10'],
        description: 'Standard single-scatter nuclear recoil calibration standard.'
      },
      {
        id: 'RUN-2014-XENON-S1',
        tier: 'TIER_1_VETTED',
        label: 'Run 2014-Xenon (178nm Scintillation Benchmark)',
        channels: ['PMT-02', 'PMT-03', 'PMT-05', 'PMT-06', 'PMT-08', 'PMT-09', 'PMT-10'],
        description: 'Dual-phase liquid xenon extraction efficiency benchmark.'
      },
      {
        id: 'RUN-2019-AXION',
        tier: 'TIER_1_VETTED',
        label: 'Run 2019-Axion (Solar Primakoff Baseline)',
        channels: ['PMT-01', 'PMT-02', 'PMT-04', 'PMT-05', 'PMT-07', 'PMT-08', 'PMT-10'],
        description: 'High-exposure magnetic coupling search baseline.'
      },
      {
        id: 'RUN-2024-WIMP-SHM',
        tier: 'TIER_1_VETTED',
        label: 'Run 2024-WIMP (Standard Halo Model Baseline)',
        channels: ['PMT-01', 'PMT-03', 'PMT-04', 'PMT-05', 'PMT-06', 'PMT-07', 'PMT-10'],
        description: '650 tonne-day blind analysis reference standard.'
      },
      // Tier 2: Unconfirmed Candidate Datasets
      {
        id: 'EVENT-884-BRAVO',
        tier: 'TIER_2_CANDIDATE',
        label: 'Event 884-Bravo (2.8 keV Diurnal Recoil Cluster)',
        channels: ['PMT-01', 'PMT-02', 'PMT-03', 'PMT-04', 'PMT-06', 'PMT-09', 'PMT-10'],
        description: 'Unexplained 3.82σ cluster localized in deep fiducial core.'
      },
      {
        id: 'RUN-409-OMEGA',
        tier: 'TIER_2_CANDIDATE',
        label: 'Run 409-Omega (Low-Energy Ionization Excess)',
        channels: ['PMT-01', 'PMT-03', 'PMT-05', 'PMT-06', 'PMT-07', 'PMT-08', 'PMT-09'],
        description: 'Persistent 22% single-scatter excess below 3 keV.'
      },
      {
        id: 'CANDIDATE-THETA',
        tier: 'TIER_2_CANDIDATE',
        label: 'Candidate-Theta (Multi-PMT Phased Transient)',
        channels: ['PMT-02', 'PMT-04', 'PMT-05', 'PMT-06', 'PMT-07', 'PMT-09', 'PMT-10'],
        description: 'Coincident 4.10σ multi-channel spatial recoil transient.'
      },
      {
        id: 'FLARE-ZEPHYR-7',
        tier: 'TIER_2_CANDIDATE',
        label: 'Flare-Zephyr (Sub-GeV Dark Matter Influx)',
        channels: ['PMT-01', 'PMT-02', 'PMT-03', 'PMT-04', 'PMT-05', 'PMT-07', 'PMT-08'],
        description: 'Galactic dark matter stream passage transient.'
      }
    ];
  }

  getPresets() {
    return this.presets;
  }

  getPresetById(id) {
    return this.presets.find(p => p.id === id);
  }

  startAutoDial(presetId, onStepCallback, onCompleteCallback) {
    this.abortAutoDial();

    let channels = [];
    const preset = this.getPresetById(presetId);
    if (preset) {
      channels = preset.channels;
      this.activePresetId = presetId;
    } else {
      const archiveEntry = window.dmArchive ? window.dmArchive.getEntryById(presetId) : null;
      if (archiveEntry && archiveEntry.channels) {
        channels = archiveEntry.channels;
        this.activePresetId = presetId;
      }
    }

    if (!channels || channels.length === 0) {
      console.warn('Preset not found or has no channels:', presetId);
      return false;
    }

    // Reset detector slots before auto-dialing archival dataset
    if (window.dmDiscrimination) {
      window.dmDiscrimination.clearSlots();
    }
    if (window.dmApp) {
      window.dmApp.updateSlotUI();
    }

    this.isAutoDialing = true;
    this.currentStep = 0;
    this.targetChannels = channels.slice(0, 7);

    if (window.dmLogger) {
      window.dmLogger.log('SYSTEM', `Auto-Dial initiated for archival dataset [${presetId}] (${this.targetChannels.length} channels staged)`);
    }

    const processNextStep = () => {
      if (!this.isAutoDialing) return;

      if (this.currentStep >= this.targetChannels.length) {
        // Finished all 7 channels! Land in PENDING state. NEVER AUTO-FIRE.
        this.isAutoDialing = false;
        if (window.dmLogger) {
          window.dmLogger.log('APERTURE', `Auto-Dial completed for [${this.activePresetId}]. Aperture state: PENDING (Activation required)`);
        }
        if (onCompleteCallback) onCompleteCallback(this.activePresetId);
        return;
      }

      const channelId = this.targetChannels[this.currentStep];
      const slotIndex = this.currentStep;

      // Execute simulated manual channel discrimination
      if (onStepCallback) {
        onStepCallback(channelId, slotIndex, this.currentStep + 1, this.targetChannels.length);
      }

      this.currentStep++;
      // Progressively stage next channel after realistic in-universe processing delay (380ms)
      this.autoDialTimeout = setTimeout(processNextStep, 380);
    };

    // Begin sequence
    this.autoDialTimeout = setTimeout(processNextStep, 100);
    return true;
  }

  abortAutoDial() {
    if (this.isAutoDialing) {
      this.isAutoDialing = false;
      if (this.autoDialTimeout) {
        clearTimeout(this.autoDialTimeout);
        this.autoDialTimeout = null;
      }
      if (window.dmLogger) {
        window.dmLogger.log('SYSTEM', 'Auto-Dial sequence aborted by operator.');
      }
    }
  }
}

window.dmQuickDial = new QuickDialManager();
