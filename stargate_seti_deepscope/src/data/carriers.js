// 18 Harmonic Carrier Sectors for Argos DeepScope Console
export const CARRIER_SECTORS = [
  { id: 'c01', symbol: 'Ψ₁', name: 'Carrier Tau-1', freq: 1420.115, offset: '-290 kHz', angle: 0 },
  { id: 'c02', symbol: 'Ω₂', name: 'Carrier Tau-2', freq: 1420.245, offset: '-160 kHz', angle: 20 },
  { id: 'c03', symbol: 'Ξ₃', name: 'Carrier Tau-3', freq: 1420.320, offset: '-85 kHz', angle: 40 },
  { id: 'c04', symbol: 'Φ₄', name: 'Carrier Tau-4', freq: 1420.405, offset: '0 kHz [H-Line]', angle: 60 },
  { id: 'c05', symbol: 'Δ₅', name: 'Carrier Tau-5', freq: 1420.510, offset: '+105 kHz', angle: 80 },
  { id: 'c06', symbol: 'Σ₆', name: 'Carrier Tau-6', freq: 1420.685, offset: '+280 kHz', angle: 100 },
  { id: 'c07', symbol: 'Λ₇', name: 'Carrier Tau-7', freq: 1420.820, offset: '+415 kHz', angle: 120 },
  { id: 'c08', symbol: 'Θ₈', name: 'Carrier Tau-8', freq: 1420.950, offset: '+545 kHz', angle: 140 },
  { id: 'c09', symbol: 'Γ₉', name: 'Carrier Tau-9', freq: 1612.231, offset: 'OH MASER 1', angle: 160 },
  { id: 'c10', symbol: 'Π₁₀', name: 'Carrier Tau-10', freq: 1665.402, offset: 'OH MAIN 1', angle: 180 },
  { id: 'c11', symbol: 'Υ₁₁', name: 'Carrier Tau-11', freq: 1667.359, offset: 'OH MAIN 2', angle: 200 },
  { id: 'c12', symbol: 'Ζ₁₂', name: 'Carrier Tau-12', freq: 1720.530, offset: 'OH SAT 2', angle: 220 },
  { id: 'c13', symbol: 'Ϙ₁₃', name: 'Carrier Tau-13', freq: 1775.105, offset: '+354 MHz', angle: 240 },
  { id: 'c14', symbol: 'Ϡ₁₄', name: 'Carrier Tau-14', freq: 1820.405, offset: '+400 MHz', angle: 260 },
  { id: 'c15', symbol: 'Ϛ₁₅', name: 'Carrier Tau-15', freq: 1885.620, offset: '+465 MHz', angle: 280 },
  { id: 'c16', symbol: 'Ϧ₁₆', name: 'Carrier Tau-16', freq: 1940.330, offset: '+520 MHz', angle: 300 },
  { id: 'c17', symbol: 'Ϩ₁₇', name: 'Carrier Tau-17', freq: 2010.500, offset: '+590 MHz', angle: 320 },
  { id: 'c18', symbol: 'Ϫ₁₈', name: 'Carrier Tau-18', freq: 2150.750, offset: '+730 MHz', angle: 340 }
];

// Quick-Dial Targets across 2 Tiers
export const QUICKDIAL_PRESETS = [
  // TIER 1: VERIFIED TECHNOSIGNATURES
  {
    id: 'tgt-kepler452b',
    tier: 1,
    name: 'Kepler-452b Coherent Relay',
    constellation: 'Cygnus (α=19h44m, δ=+44°16\')',
    freq: '1420.405 MHz',
    snr: '64.8 dB',
    drift: '-0.012 Hz/s',
    carriers: ['c04', 'c02', 'c06', 'c08', 'c10', 'c12', 'c14']
  },
  {
    id: 'tgt-trappist1e',
    tier: 1,
    name: 'TRAPPIST-1e Relativistic Nexus',
    constellation: 'Aquarius (α=23h06m, δ=-05°02\')',
    freq: '1667.359 MHz',
    snr: '78.2 dB',
    drift: '-0.005 Hz/s',
    carriers: ['c11', 'c03', 'c05', 'c07', 'c09', 'c13', 'c15']
  },
  {
    id: 'tgt-vega9',
    tier: 1,
    name: 'Vega-IX Harmonic Beacon',
    constellation: 'Lyra (α=18h36m, δ=+38°47\')',
    freq: '1612.231 MHz',
    snr: '91.4 dB',
    drift: '+0.000 Hz/s',
    carriers: ['c09', 'c01', 'c04', 'c06', 'c10', 'c16', 'c18']
  },
  {
    id: 'tgt-cygnus-x',
    tier: 1,
    name: 'Cygnus-X Tau Transmitter',
    constellation: 'Cygnus (α=20h21m, δ=+40°26\')',
    freq: '1420.820 MHz',
    snr: '52.6 dB',
    drift: '-0.028 Hz/s',
    carriers: ['c07', 'c02', 'c04', 'c08', 'c12', 'c14', 'c17']
  },

  // TIER 2: UNCONFIRMED DEEP ANOMALIES
  {
    id: 'tgt-tabby',
    tier: 2,
    name: 'Tabby\'s Variable Pulse (KIC 8462852)',
    constellation: 'Cygnus (α=20h06m, δ=+44°27\')',
    freq: '1720.530 MHz',
    snr: '34.2 dB',
    drift: '-0.084 Hz/s',
    carriers: ['c12', 'c01', 'c05', 'c07', 'c11', 'c15', 'c18']
  },
  {
    id: 'tgt-proxima-b',
    tier: 2,
    name: 'Proxima-b Micro-Chirp Anomaly',
    constellation: 'Centaurus (α=14h29m, δ=-62°40\')',
    freq: '1420.115 MHz',
    snr: '28.6 dB',
    drift: '+0.112 Hz/s',
    carriers: ['c01', 'c03', 'c06', 'c09', 'c12', 'c15', 'c17']
  },
  {
    id: 'tgt-oumuamua',
    tier: 2,
    name: 'Oumuamua Hyperbolic Ping',
    constellation: 'Pegasus (Interstellar Trajectory)',
    freq: '1885.620 MHz',
    snr: '41.0 dB',
    drift: '-0.320 Hz/s',
    carriers: ['c15', 'c02', 'c04', 'c08', 'c10', 'c13', 'c16']
  }
];

// Candidates for Live Triage / RFI Lab (Real Rejection Path Included!)
export const TRIAGE_CANDIDATES = [
  {
    id: 'SIG-904',
    name: 'Starlink Ku-Band Chirp Leak',
    freq: '1420.310 MHz',
    bandwidth: '2.4 kHz',
    drift: '-1.450 Hz/s (High LEO Doppler)',
    snr: '48.2 dB',
    dispersion: '0.01 pc/cm³ (Terrestrial/LEO)',
    parallaxDelay: '142.8 ps (Spherical Near-Field Failure)',
    classification: 'RFI',
    status: 'PENDING_REVIEW',
    notes: 'Near-field parallax detected across D01-D10 baselines. Doppler drift matches 550km LEO orbital pass. REJECTION REQUIRED.'
  },
  {
    id: 'SIG-812',
    name: 'Atacama Weather Radar 2nd Harmonic',
    freq: '1420.650 MHz',
    bandwidth: '15.0 kHz (Wideband)',
    drift: '0.000 Hz/s',
    snr: '62.0 dB',
    dispersion: '0.00 pc/cm³ (Ground Level)',
    parallaxDelay: '890.4 ps (Local Ground Multipath)',
    classification: 'RFI',
    status: 'PENDING_REVIEW',
    notes: 'Severe spatial mismatch across antenna array. Local ground station artifact.'
  },
  {
    id: 'SIG-728',
    name: 'Deep Cygnus Narrowband Pulse',
    freq: '1420.405 MHz',
    bandwidth: '0.45 Hz (Ultra-Narrowband)',
    drift: '-0.012 Hz/s (Barycentric Corrected)',
    snr: '64.8 dB',
    dispersion: '24.8 pc/cm³ (Interstellar Medium)',
    parallaxDelay: '0.000 ps (Perfect Plane Wave)',
    classification: 'VERIFIED',
    status: 'PENDING_REVIEW',
    notes: 'Phase coherence matches 100% across all 45 baseline pairs. Candidate technosignature.'
  },
  {
    id: 'SIG-650',
    name: 'GPS L1 Intermodulation Spurt',
    freq: '1612.190 MHz',
    bandwidth: '4.8 kHz',
    drift: '-0.880 Hz/s',
    snr: '39.4 dB',
    dispersion: '0.02 pc/cm³ (MEO Orbit)',
    parallaxDelay: '98.2 ps (MEO Near-Field)',
    classification: 'RFI',
    status: 'PENDING_REVIEW',
    notes: 'Orbital satellite signature. Terrestrial interference rejection path.'
  },
  {
    id: 'SIG-519',
    name: 'Aquarius Relay Harmonic Stream',
    freq: '1667.359 MHz',
    bandwidth: '0.38 Hz (Ultra-Narrowband)',
    drift: '-0.005 Hz/s',
    snr: '78.2 dB',
    dispersion: '32.1 pc/cm³ (Interstellar Medium)',
    parallaxDelay: '0.000 ps (Plane Wave)',
    classification: 'VERIFIED',
    status: 'PENDING_REVIEW',
    notes: 'Non-terrestrial origin confirmed. Multi-dish phase lock holds continuously.'
  }
];

// Historical Archive Data (25+ Records)
export const ARCHIVE_RECORDS = [
  { time: '2026-08-21 23:40', id: 'SIG-728', target: 'Kepler-452b Relay', freq: '1420.405', drift: '-0.012', snr: '64.8', dm: '24.8', class: 'VERIFIED', carriers: ['c04', 'c02', 'c06', 'c08', 'c10', 'c12', 'c14'] },
  { time: '2026-08-21 21:15', id: 'SIG-904', target: 'Starlink LEO Pass', freq: '1420.310', drift: '-1.450', snr: '48.2', dm: '0.01', class: 'RFI', carriers: [] },
  { time: '2026-08-20 18:22', id: 'SIG-519', target: 'TRAPPIST-1e Nexus', freq: '1667.359', drift: '-0.005', snr: '78.2', dm: '32.1', class: 'VERIFIED', carriers: ['c11', 'c03', 'c05', 'c07', 'c09', 'c13', 'c15'] },
  { time: '2026-08-20 14:02', id: 'SIG-812', target: 'Atacama Radar', freq: '1420.650', drift: '0.000', snr: '62.0', dm: '0.00', class: 'RFI', carriers: [] },
  { time: '2026-08-19 09:44', id: 'SIG-440', target: 'Vega-IX Beacon', freq: '1612.231', drift: '+0.000', snr: '91.4', dm: '18.4', class: 'VERIFIED', carriers: ['c09', 'c01', 'c04', 'c06', 'c10', 'c16', 'c18'] },
  { time: '2026-08-18 04:12', id: 'SIG-391', target: 'Tabby Transient', freq: '1720.530', drift: '-0.084', snr: '34.2', dm: '42.6', class: 'UNCONFIRMED', carriers: ['c12', 'c01', 'c05', 'c07', 'c11', 'c15', 'c18'] },
  { time: '2026-08-17 22:50', id: 'SIG-650', target: 'GPS L1 Bleed', freq: '1612.190', drift: '-0.880', snr: '39.4', dm: '0.02', class: 'RFI', carriers: [] },
  { time: '2026-08-16 19:30', id: 'SIG-312', target: 'Cygnus-X Carrier', freq: '1420.820', drift: '-0.028', snr: '52.6', dm: '28.9', class: 'VERIFIED', carriers: ['c07', 'c02', 'c04', 'c08', 'c12', 'c14', 'c17'] },
  { time: '2026-08-15 15:10', id: 'SIG-289', target: 'Proxima Anomaly', freq: '1420.115', drift: '+0.112', snr: '28.6', dm: '12.0', class: 'UNCONFIRMED', carriers: ['c01', 'c03', 'c06', 'c09', 'c12', 'c15', 'c17'] },
  { time: '2026-08-14 11:22', id: 'SIG-210', target: 'Geostationary Sat', freq: '1420.550', drift: '-0.010', snr: '55.3', dm: '0.05', class: 'RFI', carriers: [] },
  { time: '2026-08-13 08:05', id: 'SIG-198', target: 'Oumuamua Hyperbolic', freq: '1885.620', drift: '-0.320', snr: '41.0', dm: '14.2', class: 'UNCONFIRMED', carriers: ['c15', 'c02', 'c04', 'c08', 'c10', 'c13', 'c16'] },
  { time: '2026-08-12 03:19', id: 'SIG-175', target: 'Tau Ceti-e Carrier', freq: '1420.245', drift: '-0.018', snr: '61.2', dm: '19.5', class: 'VERIFIED', carriers: ['c02', 'c04', 'c06', 'c08', 'c10', 'c12', 'c14'] },
  { time: '2026-08-11 20:44', id: 'SIG-160', target: 'Microwave Oven EMI', freq: '1420.900', drift: '+0.420', snr: '70.1', dm: '0.00', class: 'RFI', carriers: [] },
  { time: '2026-08-10 16:33', id: 'SIG-142', target: 'Gliese-667Cc Pulse', freq: '1665.402', drift: '+0.002', snr: '68.9', dm: '27.4', class: 'VERIFIED', carriers: ['c10', 'c01', 'c03', 'c07', 'c11', 'c13', 'c17'] },
  { time: '2026-08-09 12:15', id: 'SIG-120', target: 'Iridium Flare', freq: '1612.300', drift: '-2.100', snr: '84.0', dm: '0.01', class: 'RFI', carriers: [] },
  { time: '2026-08-08 07:50', id: 'SIG-105', target: 'HD 40307g Beacon', freq: '1775.105', drift: '-0.008', snr: '59.4', dm: '35.0', class: 'VERIFIED', carriers: ['c13', 'c02', 'c05', 'c08', 'c11', 'c14', 'c16'] },
  { time: '2026-08-07 01:28', id: 'SIG-094', target: 'Ross 128b Harmonic', freq: '1820.405', drift: '+0.014', snr: '54.0', dm: '16.7', class: 'VERIFIED', carriers: ['c14', 'c04', 'c07', 'c09', 'c12', 'c15', 'c18'] },
  { time: '2026-08-06 18:05', id: 'SIG-081', target: 'Military UHF Leak', freq: '1420.150', drift: '+0.000', snr: '67.8', dm: '0.00', class: 'RFI', carriers: [] },
  { time: '2026-08-05 14:40', id: 'SIG-069', target: 'Wolf 1061c Burst', freq: '1940.330', drift: '-0.022', snr: '47.1', dm: '22.3', class: 'UNCONFIRMED', carriers: ['c16', 'c01', 'c03', 'c06', 'c10', 'c13', 'c17'] },
  { time: '2026-08-04 10:12', id: 'SIG-055', target: 'LHS 1140b Carrier', freq: '2010.500', drift: '-0.004', snr: '72.5', dm: '38.8', class: 'VERIFIED', carriers: ['c17', 'c02', 'c05', 'c08', 'c11', 'c14', 'c16'] },
  { time: '2026-08-03 05:22', id: 'SIG-042', target: 'Airport Radar S-Band', freq: '2150.750', drift: '+0.000', snr: '89.1', dm: '0.00', class: 'RFI', carriers: [] },
  { time: '2026-08-02 23:55', id: 'SIG-030', target: 'TRAPPIST-1d Relay', freq: '1420.405', drift: '-0.006', snr: '63.0', dm: '31.9', class: 'VERIFIED', carriers: ['c04', 'c01', 'c06', 'c09', 'c11', 'c13', 'c15'] },
  { time: '2026-08-01 19:18', id: 'SIG-019', target: 'KIC 8462852 IR Spike', freq: '1667.359', drift: '-0.145', snr: '36.8', dm: '44.0', class: 'UNCONFIRMED', carriers: ['c11', 'c02', 'c05', 'c08', 'c12', 'c14', 'c17'] },
  { time: '2026-07-31 15:02', id: 'SIG-012', target: 'Cellular Band E-GSM', freq: '1885.620', drift: '+0.000', snr: '76.4', dm: '0.00', class: 'RFI', carriers: [] },
  { time: '2026-07-30 08:30', id: 'SIG-005', target: 'Alpha Centauri-A Test', freq: '1420.405', drift: '+0.000', snr: '95.0', dm: '4.3', class: 'VERIFIED', carriers: ['c04', 'c02', 'c06', 'c08', 'c10', 'c12', 'c14'] }
];
