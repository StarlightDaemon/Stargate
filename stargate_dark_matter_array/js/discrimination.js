/**
 * BOREAS-IX Background-Rejection Discrimination Engine
 * Physics-grounded rare-event discrimination for Dual-Phase Liquid Xenon TPC.
 */

class DiscriminationEngine {
  constructor() {
    // 10 PMT Channels with localized PMT array geometry
    this.channels = [
      { id: 'PMT-01', name: 'Alpha-Core', ring: 'Top-Inner', angle: 0, baseRate: 3.8, glyph: 'ξ-101' },
      { id: 'PMT-02', name: 'Polar-North', ring: 'Top-Outer', angle: 36, baseRate: 5.2, glyph: 'ψ-204' },
      { id: 'PMT-03', name: 'Equator-East', ring: 'Barrel-Mid', angle: 72, baseRate: 4.1, glyph: 'ζ-319' },
      { id: 'PMT-04', name: 'Deep-Fiducial', ring: 'Active-Core', angle: 108, baseRate: 2.9, glyph: 'ω-412' },
      { id: 'PMT-05', name: 'Cathode-Ring', ring: 'Bottom-Outer', angle: 144, baseRate: 6.4, glyph: 'λ-528' },
      { id: 'PMT-06', name: 'Anode-Grid', ring: 'Top-Mesh', angle: 180, baseRate: 5.9, glyph: 'θ-633' },
      { id: 'PMT-07', name: 'Equator-West', ring: 'Barrel-Mid', angle: 216, baseRate: 4.4, glyph: 'μ-742' },
      { id: 'PMT-08', name: 'Veto-Coincidence', ring: 'Shield-Guard', angle: 252, baseRate: 7.8, glyph: 'δ-815' },
      { id: 'PMT-09', name: 'Polar-South', ring: 'Bottom-Outer', angle: 288, baseRate: 4.7, glyph: 'χ-909' },
      { id: 'PMT-10', name: 'Chamber-Floor', ring: 'Bottom-Inner', angle: 324, baseRate: 3.1, glyph: 'Ω-770' }
    ];

    // 7 Address Target Slots
    this.slotCount = 7;
    this.lockedSlots = Array(this.slotCount).fill(null);

    // Rejection thresholds
    this.thresholds = {
      maxLogRatioNR: 2.55,      // Nuclear Recoil (NR) band maximum log10(S2/S1)
      minLogRatioNR: 1.60,      // Nuclear Recoil (NR) band minimum log10(S2/S1)
      minMuonVetoDtNs: 50.0,    // Cosmic muon coincidence veto window (+/- 50ns)
      maxFiducialRadiusMm: 450, // Radial cut (Cryostat wall R = 500mm)
      minDepthZMm: 50,          // Z top cut
      maxDepthZMm: 950,         // Z bottom cathode cut
      minEnergyKeVnr: 1.2,      // ROI minimum energy
      maxEnergyKeVnr: 48.0      // ROI maximum energy
    };

    // Test simulation overrides
    this.forceRejectionMode = false; // When visitor toggles "SIMULATE NOISE SPIKE / VETO EVENT"
    this.discriminationInProgress = false;
    this.currentDiscrimination = null;
  }

  getChannel(channelId) {
    return this.channels.find(c => c.id === channelId) || this.channels[0];
  }

  isSlotFull() {
    return this.lockedSlots.every(slot => slot !== null);
  }

  getNextEmptySlotIndex() {
    return this.lockedSlots.findIndex(slot => slot === null);
  }

  generateCandidatePulse(channelId, forceReject = false) {
    const ch = this.getChannel(channelId);
    
    if (forceReject || this.forceRejectionMode) {
      // Generate a background event that fails one of the discrimination criteria
      const rejectType = Math.random() < 0.4 ? 'MUON_VETO' : (Math.random() < 0.5 ? 'ELECTRON_RECOIL' : 'WALL_RADON');
      
      if (rejectType === 'MUON_VETO') {
        const dt = (Math.random() * 35).toFixed(1);
        return {
          channel: ch,
          s1: Math.floor(40 + Math.random() * 60),
          s2: Math.floor(1500 + Math.random() * 2000),
          logRatio: 2.1,
          muonVetoDt: parseFloat(dt), // Violates minMuonVetoDtNs
          radialPos: Math.floor(150 + Math.random() * 200),
          depthZ: Math.floor(200 + Math.random() * 500),
          energyKeVnr: parseFloat((12.4 + Math.random() * 10).toFixed(1)),
          expectedResult: 'FAIL',
          failReason: `Cosmic Muon Veto Coincidence Guard Triggered (Δt = ${dt} ns < 50.0 ns)`
        };
      } else if (rejectType === 'ELECTRON_RECOIL') {
        const logRatio = (2.85 + Math.random() * 0.45).toFixed(2);
        return {
          channel: ch,
          s1: Math.floor(20 + Math.random() * 40),
          s2: Math.floor(12000 + Math.random() * 15000),
          logRatio: parseFloat(logRatio), // Violates maxLogRatioNR (Gamma/Beta ER background)
          muonVetoDt: parseFloat((120 + Math.random() * 200).toFixed(1)),
          radialPos: Math.floor(100 + Math.random() * 250),
          depthZ: Math.floor(200 + Math.random() * 500),
          energyKeVnr: parseFloat((18.0 + Math.random() * 12).toFixed(1)),
          expectedResult: 'FAIL',
          failReason: `Electron Recoil ER-Band Background [log₁₀(S2/S1) = ${logRatio} > 2.55]`
        };
      } else {
        const r = Math.floor(465 + Math.random() * 30);
        return {
          channel: ch,
          s1: Math.floor(35 + Math.random() * 45),
          s2: Math.floor(2200 + Math.random() * 3000),
          logRatio: 2.15,
          muonVetoDt: parseFloat((150 + Math.random() * 150).toFixed(1)),
          radialPos: r, // Violates maxFiducialRadiusMm (surface wall contamination)
          depthZ: Math.floor(200 + Math.random() * 500),
          energyKeVnr: parseFloat((9.5 + Math.random() * 8).toFixed(1)),
          expectedResult: 'FAIL',
          failReason: `Fiducial Boundary Violation - Surface Wall Contamination (r = ${r} mm > 450 mm)`
        };
      }
    }

    // High purity Nuclear Recoil (NR) Candidate (Pass Path)
    const s1 = Math.floor(18 + Math.random() * 55);
    const s2 = Math.floor(s1 * (80 + Math.random() * 70));
    const logRatio = parseFloat(Math.log10(s2 / s1).toFixed(2));
    const muonVetoDt = parseFloat((120 + Math.random() * 350).toFixed(1));
    const radialPos = Math.floor(50 + Math.random() * 360);
    const depthZ = Math.floor(120 + Math.random() * 750);
    const energyKeVnr = parseFloat((3.5 + Math.random() * 28.5).toFixed(1));

    return {
      channel: ch,
      s1,
      s2,
      logRatio,
      muonVetoDt,
      radialPos,
      depthZ,
      energyKeVnr,
      expectedResult: 'PASS',
      failReason: null
    };
  }

  evaluateDiscrimination(candidate) {
    const checks = {
      psdCheck: candidate.logRatio >= this.thresholds.minLogRatioNR && candidate.logRatio <= this.thresholds.maxLogRatioNR,
      muonVetoCheck: Math.abs(candidate.muonVetoDt) >= this.thresholds.minMuonVetoDtNs,
      fiducialCheck: candidate.radialPos <= this.thresholds.maxFiducialRadiusMm && candidate.depthZ >= this.thresholds.minDepthZMm && candidate.depthZ <= this.thresholds.maxDepthZMm,
      energyCheck: candidate.energyKeVnr >= this.thresholds.minEnergyKeVnr && candidate.energyKeVnr <= this.thresholds.maxEnergyKeVnr
    };

    const passed = checks.psdCheck && checks.muonVetoCheck && checks.fiducialCheck && checks.energyCheck;
    
    let reason = null;
    if (!passed) {
      if (!checks.muonVetoCheck) {
        reason = `Cosmic Muon Veto Coincidence (Δt = ${candidate.muonVetoDt} ns < 50.0 ns)`;
      } else if (!checks.psdCheck) {
        reason = `Electron Recoil ER-Band Rejection [log₁₀(S2/S1) = ${candidate.logRatio}]`;
      } else if (!checks.fiducialCheck) {
        reason = `Wall Radon Contamination Cut (r = ${candidate.radialPos} mm)`;
      } else {
        reason = `Energy Window Exclusion (${candidate.energyKeVnr} keVnr)`;
      }
    }

    return {
      passed,
      checks,
      reason,
      candidate
    };
  }

  lockSlot(slotIndex, candidateData) {
    if (slotIndex < 0 || slotIndex >= this.slotCount) return false;
    this.lockedSlots[slotIndex] = {
      slotIndex,
      channel: candidateData.channel,
      energyKeVnr: candidateData.energyKeVnr,
      logRatio: candidateData.logRatio,
      s1: candidateData.s1,
      s2: candidateData.s2,
      muonVetoDt: candidateData.muonVetoDt,
      glyph: candidateData.channel.glyph,
      timestamp: Date.now()
    };
    return true;
  }

  clearSlots() {
    this.lockedSlots = Array(this.slotCount).fill(null);
  }

  getLockedCount() {
    return this.lockedSlots.filter(s => s !== null).length;
  }

  setForceRejectionMode(enabled) {
    this.forceRejectionMode = !!enabled;
  }
}

window.dmDiscrimination = new DiscriminationEngine();
