// Candidate Technosignature Signals and Quick-Dial Database for VDATC

export const DISH_CONFIG = [
  { id: 'D-01', name: 'Vesper Prime (North)', baseline: '0.0 km', freq: '1.420 GHz', delay: '0.00 μs', status: 'SYNCHRONIZED' },
  { id: 'D-02', name: 'Lagrange-1 West', baseline: '1,492,000 km', freq: '1.420 GHz', delay: '4.98 s', status: 'SYNCHRONIZED' },
  { id: 'D-03', name: 'Caloris Synthetic', baseline: '45,200 km', freq: '1.665 GHz', delay: '150.8 ms', status: 'SYNCHRONIZED' },
  { id: 'D-04', name: 'Argyre South Array', baseline: '78,400 km', freq: '1.667 GHz', delay: '261.5 ms', status: 'SYNCHRONIZED' },
  { id: 'D-05', name: 'Copernicus Hub LNA', baseline: '384,400 km', freq: '1.720 GHz', delay: '1.28 s', status: 'SYNCHRONIZED' },
  { id: 'D-06', name: 'Shackleton Polar', baseline: '384,400 km', freq: '2.388 GHz', delay: '1.28 s', status: 'SYNCHRONIZED' },
  { id: 'D-07', name: 'Hellas East Station', baseline: '82,100 km', freq: '4.829 GHz', delay: '273.9 ms', status: 'SYNCHRONIZED' },
  { id: 'D-08', name: 'Themis Orbit Relay', baseline: '640,000 km', freq: '6.035 GHz', delay: '2.13 s', status: 'SYNCHRONIZED' },
  { id: 'D-09', name: 'Titan Lacus Front', baseline: '1,220,000 km', freq: '8.415 GHz', delay: '4.07 s', status: 'SYNCHRONIZED' },
  { id: 'D-10', name: 'Europa Cryo-Core', baseline: '628,000,000 km', freq: '8.665 GHz', delay: '2094 s', status: 'SYNCHRONIZED' }
];

export const CANDIDATE_SIGNALS = [
  {
    id: 1,
    tag: 'Σ-1420',
    name: 'HI Neutral Hydrogen Dipole',
    frequency: '1420.4057 MHz',
    driftRate: '-0.142 Hz/s',
    snr: '+42.8 dB',
    sectorAngle: 18, // Center angle in degrees on polar ring
    color: '#00f0ff',
    glyphSvg: `<svg viewBox="0 0 40 40" class="glyph-icon"><circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/><line x1="20" y1="6" x2="20" y2="34" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="12" r="3.5" fill="currentColor"/><circle cx="20" cy="28" r="3.5" fill="currentColor"/><circle cx="20" cy="20" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`
  },
  {
    id: 2,
    tag: 'Ω-1665',
    name: 'Hydroxyl Radical OH Ground',
    frequency: '1665.4018 MHz',
    driftRate: '+0.088 Hz/s',
    snr: '+38.4 dB',
    sectorAngle: 54,
    color: '#39ff14',
    glyphSvg: `<svg viewBox="0 0 40 40" class="glyph-icon"><path d="M10 20 L20 10 L30 20 L20 30 Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="20" cy="20" r="5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="12" x2="28" y2="28" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="28" x2="28" y2="12" stroke="currentColor" stroke-width="1.5"/></svg>`
  },
  {
    id: 3,
    tag: 'Ψ-1667',
    name: 'Main Hydroxyl Resonator',
    frequency: '1667.3590 MHz',
    driftRate: '-0.210 Hz/s',
    snr: '+49.1 dB',
    sectorAngle: 90,
    color: '#00e5ff',
    glyphSvg: `<svg viewBox="0 0 40 40" class="glyph-icon"><circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="20" cy="20" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="5" y1="20" x2="35" y2="20" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="20" r="2.5" fill="currentColor"/><circle cx="32" cy="20" r="2.5" fill="currentColor"/></svg>`
  },
  {
    id: 4,
    tag: 'Φ-1720',
    name: 'Satellite Maser Transition',
    frequency: '1720.5300 MHz',
    driftRate: '+0.175 Hz/s',
    snr: '+36.9 dB',
    sectorAngle: 126,
    color: '#ffb703',
    glyphSvg: `<svg viewBox="0 0 40 40" class="glyph-icon"><polygon points="20,6 33,14 33,26 20,34 7,26 7,14" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="20" cy="20" r="4" fill="currentColor"/><line x1="20" y1="6" x2="20" y2="34" stroke="currentColor" stroke-width="1"/></svg>`
  },
  {
    id: 5,
    tag: 'Λ-2388',
    name: 'Deep S-Band Carrier Wave',
    frequency: '2388.1142 MHz',
    driftRate: '-0.064 Hz/s',
    snr: '+45.5 dB',
    sectorAngle: 162,
    color: '#06d6a0',
    glyphSvg: `<svg viewBox="0 0 40 40" class="glyph-icon"><path d="M8 32 Q20 8 32 32" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="14" r="3.5" fill="currentColor"/><line x1="14" y1="26" x2="26" y2="26" stroke="currentColor" stroke-width="1.5"/><line x1="20" y1="14" x2="20" y2="34" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/></svg>`
  },
  {
    id: 6,
    tag: 'Ξ-4829',
    name: 'Formaldehyde Inversion Node',
    frequency: '4829.6600 MHz',
    driftRate: '+0.312 Hz/s',
    snr: '+41.2 dB',
    sectorAngle: 198,
    color: '#118ab2',
    glyphSvg: `<svg viewBox="0 0 40 40" class="glyph-icon"><circle cx="20" cy="10" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="11" cy="28" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="29" cy="28" r="4" fill="none" stroke="currentColor" stroke-width="2"/><line x1="20" y1="14" x2="13" y2="25" stroke="currentColor" stroke-width="1.5"/><line x1="20" y1="14" x2="27" y2="25" stroke="currentColor" stroke-width="1.5"/><line x1="15" y1="28" x2="25" y2="28" stroke="currentColor" stroke-width="1.5"/></svg>`
  },
  {
    id: 7,
    tag: 'Γ-6035',
    name: 'Excited Maser Coherent Peak',
    frequency: '6035.0920 MHz',
    driftRate: '-0.198 Hz/s',
    snr: '+52.0 dB',
    sectorAngle: 234,
    color: '#70e000',
    glyphSvg: `<svg viewBox="0 0 40 40" class="glyph-icon"><rect x="10" y="10" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="20" cy="20" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="20" r="2" fill="currentColor"/><line x1="4" y1="20" x2="36" y2="20" stroke="currentColor" stroke-width="1"/></svg>`
  },
  {
    id: 8,
    tag: 'Δ-8415',
    name: 'X-Band Waveguide Vector',
    frequency: '8415.2045 MHz',
    driftRate: '+0.115 Hz/s',
    snr: '+47.3 dB',
    sectorAngle: 270,
    color: '#38b000',
    glyphSvg: `<svg viewBox="0 0 40 40" class="glyph-icon"><polygon points="20,8 34,32 6,32" fill="none" stroke="currentColor" stroke-width="1.5"/><polygon points="20,16 28,30 12,30" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="20" cy="24" r="2.5" fill="currentColor"/></svg>`
  },
  {
    id: 9,
    tag: 'Θ-8665',
    name: 'SHF Singularity Prism',
    frequency: '8665.6500 MHz',
    driftRate: '-0.405 Hz/s',
    snr: '+55.7 dB',
    sectorAngle: 306,
    color: '#00b4d8',
    glyphSvg: `<svg viewBox="0 0 40 40" class="glyph-icon"><circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="7" y1="13" x2="33" y2="27" stroke="currentColor" stroke-width="1.5"/><line x1="7" y1="27" x2="33" y2="13" stroke="currentColor" stroke-width="1.5"/><circle cx="20" cy="20" r="4.5" fill="currentColor"/></svg>`
  },
  {
    id: 10,
    tag: 'Ζ-9120',
    name: 'Interstellar Quantum Vector',
    frequency: '9120.3370 MHz',
    driftRate: '+0.280 Hz/s',
    snr: '+44.0 dB',
    sectorAngle: 342,
    color: '#48cae4',
    glyphSvg: `<svg viewBox="0 0 40 40" class="glyph-icon"><polygon points="20,5 31,9 35,20 31,31 20,35 9,31 5,20 9,9" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="20" cy="20" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="20" cy="20" r="2.5" fill="currentColor"/></svg>`
  }
];

export const REQUIRED_ADDRESS_LENGTH = 7;

export const QUICK_DIAL_ENTRIES = [
  // TIER 1: Confirmed Technosignature Gateways
  {
    id: 'pc-b04',
    tier: 'TIER-1 CONFIRMED',
    name: 'PROXIMA CENTAURI B-IV',
    targetCode: 'PC-B04 // HARMONIC-7',
    coords: 'RA 14h 29m 42s / Dec -62° 40\' 46"',
    distance: '4.246 ly',
    snr: '+48.2 dB',
    sequence: [1, 3, 5, 7, 2, 4, 6],
    status: 'VERIFIED TECHNOSIGNATURE',
    statusClass: 'status-verified',
    description: 'Ultra-stable narrowband harmonic beacon detected across neutral hydrogen and hydroxyl emission bands. High coincidence score on all 10 baseline receivers.'
  },
  {
    id: 'kic-846',
    tier: 'TIER-1 CONFIRMED',
    name: 'KIC 8462852 MEGASTRUCTURE',
    targetCode: 'KIC-846 // TABBY CARRIER',
    coords: 'RA 20h 06m 15s / Dec +44° 27\' 24"',
    distance: '1,470 ly',
    snr: '+54.7 dB',
    sequence: [2, 4, 6, 8, 1, 3, 5],
    status: 'VERIFIED TECHNOSIGNATURE',
    statusClass: 'status-verified',
    description: 'Aperiodic circumstellar occultation structure broadcasting modulated pulse train with quantum coherence signature.'
  },
  {
    id: 'trap-1e',
    tier: 'TIER-1 CONFIRMED',
    name: 'TRAPPIST-1E RESONANT BEACON',
    targetCode: 'TRAP-1E // WATER-HOLE 01',
    coords: 'RA 23h 06m 29s / Dec -05° 02\' 28"',
    distance: '39.46 ly',
    snr: '+62.1 dB',
    sequence: [3, 6, 9, 1, 4, 7, 10],
    status: 'VERIFIED TECHNOSIGNATURE',
    statusClass: 'status-verified',
    description: 'Ultra-coherent narrowband carrier aligned with planetary Laplace resonance frequency. Verified by secondary ground-space VLBI baseline.'
  },

  // TIER 2: Unconfirmed / Flagged Deep Anomalies
  {
    id: 'hd-164',
    tier: 'TIER-2 UNCONFIRMED',
    name: 'HD 164595 FAST BURST',
    targetCode: 'HD-164 // ANOMALY-04',
    coords: 'RA 18h 15m 17s / Dec +45° 13\' 36"',
    distance: '94.3 ly',
    snr: '+31.4 dB',
    sequence: [4, 8, 2, 6, 10, 1, 5],
    status: 'FLAGGED ANOMALY (UNRESOLVED)',
    statusClass: 'status-flagged',
    description: 'High-energy microwave transient with rapid Doppler drift. Coincidence verified on 8/10 dishes; awaiting secondary optical correlation.'
  },
  {
    id: 'ross-128',
    tier: 'TIER-2 UNCONFIRMED',
    name: 'ROSS 128 TRANSIENT SINGULARITY',
    targetCode: 'ROSS-128 // STELLAR CAVITY',
    coords: 'RA 11h 47m 44s / Dec +00° 48\' 16"',
    distance: '11.03 ly',
    snr: '+28.9 dB',
    sequence: [5, 9, 3, 7, 1, 8, 4],
    status: 'FLAGGED ANOMALY (UNRESOLVED)',
    statusClass: 'status-flagged',
    description: 'Broadband dispersed frequency burst exhibiting anomalous negative dispersion measure. Flagged for multi-epoch re-observation.'
  },
  {
    id: 'cyg-x9',
    tier: 'TIER-2 UNCONFIRMED',
    name: 'CYGNUS-X CAVITY CARRIER',
    targetCode: 'CYG-X9 // TRANSCARRIER',
    coords: 'RA 20h 32m 04s / Dec +40° 57\' 12"',
    distance: '4,600 ly',
    snr: '+34.6 dB',
    sequence: [6, 10, 4, 8, 2, 7, 3],
    status: 'FLAGGED ANOMALY (UNRESOLVED)',
    statusClass: 'status-flagged',
    description: 'Sub-hertz narrowband tone detected deep within star-forming molecular cloud. Awaiting SETI Protocol 7 international consensus review.'
  }
];
