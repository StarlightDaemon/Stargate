/**
 * BOREAS-IX Relational In-Universe Archive Vault
 * Dozens of cross-referenced detection runs, calibration baselines, candidate excesses, and logs.
 */

class ArchiveManager {
  constructor() {
    this.entries = [
      // -------------------------------------------------------------
      // TIER 1: VETTED HISTORICAL RUNS & CALIBRATION BASELINES
      // -------------------------------------------------------------
      {
        id: 'RUN-1998-ALPHA',
        tier: 'TIER_1_VETTED',
        title: 'Am-Be Neutron Elastic Recoil Calibration Baseline',
        date: '1998-11-14',
        author: 'Dr. M. Chen & Cryogenic Calibration Group',
        category: 'Calibration Standard',
        exposureTonnesDays: 14.5,
        energyRange: '2.1 - 42.0 keVnr',
        significance: '4.98σ (Reference Standard)',
        status: 'Archived / Ground Truth Standard',
        channels: ['PMT-01', 'PMT-03', 'PMT-04', 'PMT-06', 'PMT-07', 'PMT-09', 'PMT-10'],
        summary: 'Pioneering cryogenic Americium-Beryllium source exposure establishing the definitive Nuclear Recoil (NR) band parameters and S1/S2 prompt-to-ionization ratio limits in ultra-pure liquid xenon.',
        details: 'The 1998 Alpha campaign provided the first high-statistics calibration of the single-scatter nuclear recoil band. A total of 14,200 pure elastic scattering events were cataloged, defining the 99.99% electron recoil rejection contour at 1.450m overburden.',
        relatedIds: ['CALIB-2022-AMBE-NEUTRON', 'NOTE-DR-VASQUEZ-FIDUCIAL', 'RUN-2014-XENON-S1']
      },
      {
        id: 'RUN-2014-XENON-S1',
        tier: 'TIER_1_VETTED',
        title: 'Dual-Phase Liquid Xenon 178nm Scintillation Benchmark',
        date: '2014-04-22',
        author: 'Dr. S. K. Thorne & TPC Instrumentation Group',
        category: 'Physical Baseline',
        exposureTonnesDays: 85.0,
        energyRange: '1.4 - 38.5 keVnr',
        significance: 'Exclusion Limit Established (< 1.2e-47 cm²)',
        status: 'Published / Physical Review D (Ref 4410.99)',
        channels: ['PMT-02', 'PMT-03', 'PMT-05', 'PMT-06', 'PMT-08', 'PMT-09', 'PMT-10'],
        summary: 'High-precision measurement of the vacuum ultraviolet (178nm) prompt photon yield under 1.2 kV/cm drift field, validating S2 electron extraction efficiency across the gas-liquid boundary.',
        details: 'Confirmed 94.2% electron extraction efficiency from liquid to gas phase. Background discrimination efficiency reached 99.999% for 5-25 keVnr nuclear recoils, verifying the 3D fiducial volume cut algorithm.',
        relatedIds: ['RUN-1998-ALPHA', 'CALIB-2020-KR83M', 'REPORT-CRYOPUMP-SERVICING']
      },
      {
        id: 'RUN-2019-AXION',
        tier: 'TIER_1_VETTED',
        title: 'Solar Axion Primakoff Scattering & Magnetic Coupling Search',
        date: '2019-09-08',
        author: 'Prof. L. Alvarez & Astroparticle Theory Branch',
        category: 'Exclusion Campaign',
        exposureTonnesDays: 240.0,
        energyRange: '0.8 - 12.0 keV',
        significance: 'Upper Limit Set (g_aγ < 0.65e-10 GeV⁻¹)',
        status: 'Published / Astroparticle Physics 88 (2019)',
        channels: ['PMT-01', 'PMT-02', 'PMT-04', 'PMT-05', 'PMT-07', 'PMT-08', 'PMT-10'],
        summary: 'Targeted search for solar axions coupling with target xenon atomic electric fields via the Primakoff effect, setting the world-leading coupling exclusion limit.',
        details: 'Over 240 tonne-days of exposure with the Water Cherenkov muon veto in continuous coincidence veto mode. No significant monochromatic excess observed at 4.2 keV, setting rigorous boundaries for QCD axion models.',
        relatedIds: ['EXCESS-4.2-KEV', 'TRANSIENT-AXION-BURST', 'INC-2021-VETO-MAINTENANCE']
      },
      {
        id: 'RUN-2024-WIMP-SHM',
        tier: 'TIER_1_VETTED',
        title: 'Standard Halo Model WIMP-Nucleon Cross-Section Baseline',
        date: '2024-03-15',
        author: 'BOREAS Collaboration / Lead Analyst E. Lindqvist',
        category: 'Dark Matter Search',
        exposureTonnesDays: 650.0,
        energyRange: '1.2 - 45.0 keVnr',
        significance: 'Exclusion Limit (σ_SI < 3.2e-48 cm² at 40 GeV/c²)',
        status: 'Published / Nature Physics 31 (2024)',
        channels: ['PMT-01', 'PMT-03', 'PMT-04', 'PMT-05', 'PMT-06', 'PMT-07', 'PMT-10'],
        summary: 'The primary 650-tonne-day blind analysis campaign measuring spin-independent dark matter interactions, defining the sensitivity frontier down to the atmospheric neutrino floor.',
        details: 'The full blinded analysis was executed under strict unblinding safety protocols. Exactly 2 unexplained events survived all fiducial, PSD, and muon veto cuts, consistent with expected radiogenic neutron background.',
        relatedIds: ['MEMO-UNBLINDING-PROTOCOL-14', 'EVENT-884-BRAVO', 'BASE-2023-RADON-PURGE']
      },
      {
        id: 'CALIB-2020-KR83M',
        tier: 'TIER_1_VETTED',
        title: 'Krypton-83m Isomeric Internal Conversion Calibration',
        date: '2020-06-11',
        author: 'Dr. S. K. Thorne',
        category: 'Calibration Standard',
        exposureTonnesDays: 5.0,
        energyRange: '9.4 keV & 32.1 keV',
        significance: '5.00σ Resolution Calibration',
        status: 'Standard Routine',
        channels: ['PMT-02', 'PMT-04', 'PMT-06', 'PMT-07', 'PMT-08', 'PMT-09', 'PMT-10'],
        summary: 'Injection of short-lived (1.83h half-life) Kr-83m into the LXe circulation loop for 3D spatial mapping of electron lifetime and electric field uniformity.',
        details: 'Provided 0.4mm spatial resolution along the 100cm drift axis. Measured electron drift lifetime of 2.1 milliseconds in purified liquid xenon.',
        relatedIds: ['RUN-2014-XENON-S1', 'NOTE-DR-VASQUEZ-FIDUCIAL']
      },
      {
        id: 'CALIB-2022-AMBE-NEUTRON',
        tier: 'TIER_1_VETTED',
        title: 'External Neutron Guide Calibration Run 2022-B',
        date: '2022-10-04',
        author: 'Cryo-Neutron Group',
        category: 'Calibration Standard',
        exposureTonnesDays: 8.2,
        energyRange: '3.0 - 50.0 keVnr',
        significance: '4.95σ Nuclear Recoil Reference',
        status: 'Archived',
        channels: ['PMT-01', 'PMT-02', 'PMT-03', 'PMT-05', 'PMT-06', 'PMT-08', 'PMT-10'],
        summary: 'Deuterium-Tritium and Am-Be neutron source deployments into the detector calibration tube guides to calibrate high-mass WIMP nuclear recoil kinematics.',
        details: 'Yielded 8,400 single-scatter nuclear recoil events. Zero muon veto coincidence triggers recorded during the beam window.',
        relatedIds: ['RUN-1998-ALPHA', 'RUN-2024-WIMP-SHM']
      },
      {
        id: 'BASE-2023-RADON-PURGE',
        tier: 'TIER_1_VETTED',
        title: 'Cryogenic Distillation Column Rn-222 Radon Purge Benchmark',
        date: '2023-01-19',
        author: 'Gas Purification & Ultra-Pure Cryo Group',
        category: 'Physical Baseline',
        exposureTonnesDays: 120.0,
        energyRange: 'N/A (Activity Budget)',
        significance: 'Radon Reduction Factor > 10,000',
        status: 'Operational Baseline',
        channels: ['PMT-01', 'PMT-04', 'PMT-05', 'PMT-07', 'PMT-08', 'PMT-09', 'PMT-10'],
        summary: 'Continuous cryogenic distillation reducing Radon-222 concentration down to 0.95 micro-Becquerel per kilogram in 3.5 tonnes of target liquid xenon.',
        details: 'Ensured that radon daughters plated on the PTFE wall reflectories do not contaminate the inner 2.0-tonne active fiducial core.',
        relatedIds: ['NOTE-DR-VASQUEZ-FIDUCIAL', 'RUN-2024-WIMP-SHM']
      },
      {
        id: 'RUN-2025-SUB-GEV-IONIZATION',
        tier: 'TIER_1_VETTED',
        title: 'Low-Threshold S2-Only Sub-GeV Light Dark Matter Run',
        date: '2025-05-18',
        author: 'Prof. L. Alvarez & Data Analysis Team',
        category: 'Dark Matter Search',
        exposureTonnesDays: 310.0,
        energyRange: '0.15 - 1.2 keV',
        significance: 'Exclusion Limit (m_DM 0.5 - 5.0 GeV/c²)',
        status: 'Pre-print BOREAS-2025-09',
        channels: ['PMT-02', 'PMT-03', 'PMT-04', 'PMT-06', 'PMT-07', 'PMT-08', 'PMT-09'],
        summary: 'Ionization-only (S2) channel analysis enabling sub-keV detection threshold to search for light dark matter particle scattering on target electrons.',
        details: 'Observed standard single-electron background rate of 1.4 e⁻/second, consistent with field-emission leakage from the extraction grid.',
        relatedIds: ['RUN-409-OMEGA', 'RUN-2019-AXION']
      },

      // -------------------------------------------------------------
      // TIER 2: UNCONFIRMED / UNDER-REVIEW CANDIDATE DATASETS
      // -------------------------------------------------------------
      {
        id: 'EVENT-884-BRAVO',
        tier: 'TIER_2_CANDIDATE',
        title: 'Anomalous 2.8 keV Diurnal Recoil Cluster (Event 884-B)',
        date: '2025-11-03',
        author: 'Lead Investigator Dr. V. Aris & Blind Analysis Panel',
        category: 'Candidate Event Cluster',
        exposureTonnesDays: 92.4,
        energyRange: '2.4 - 3.2 keVnr',
        significance: '3.82σ Local Significance (Under Review)',
        status: 'Unblinded / Active Forensic Review',
        channels: ['PMT-01', 'PMT-02', 'PMT-03', 'PMT-04', 'PMT-06', 'PMT-09', 'PMT-10'],
        summary: 'An unexplained spatial cluster of 7 pure nuclear recoil events localized inside the deep fiducial core during the November sidereal modulation peak.',
        details: 'All 7 events passed S1/S2 pulse shape discrimination (log10(S2/S1) = 2.08) with zero muon veto coincidence across the outer 120-tonne Cherenkov tank. Recoil kinematics match a 45 GeV/c² WIMP candidate.',
        relatedIds: ['RUN-2024-WIMP-SHM', 'DIURNAL-MOD-2025', 'NOTE-DR-VASQUEZ-FIDUCIAL', 'MEMO-UNBLINDING-PROTOCOL-14']
      },
      {
        id: 'RUN-409-OMEGA',
        tier: 'TIER_2_CANDIDATE',
        title: 'Low-Energy Ionization S2 Excess in Central Core',
        date: '2026-02-14',
        author: 'Detector Physics Core Team',
        category: 'Unexplained Excess',
        exposureTonnesDays: 145.0,
        energyRange: '1.2 - 2.8 keV',
        significance: '3.14σ Anomaly',
        status: 'Pending Re-Calibration',
        channels: ['PMT-01', 'PMT-03', 'PMT-05', 'PMT-06', 'PMT-07', 'PMT-08', 'PMT-09'],
        summary: 'A persistent 22% excess in single-scatter events below 3 keV, showing no spatial correlation with cathode or anode grid wire positions.',
        details: 'Tritium contamination ruled out via continuous gas getter filtration. Thermal fluctuation hypothesis disproven by cryogenic PID telemetry.',
        relatedIds: ['RUN-2025-SUB-GEV-IONIZATION', 'EXCESS-4.2-KEV', 'REPORT-CRYOPUMP-SERVICING']
      },
      {
        id: 'CANDIDATE-THETA',
        tier: 'TIER_2_CANDIDATE',
        title: 'Coincident Multi-PMT Phased Recoil Transient',
        date: '2026-04-30',
        author: 'Observatory Live Alert System',
        category: 'Candidate Event Cluster',
        exposureTonnesDays: 45.2,
        energyRange: '4.8 - 18.2 keVnr',
        significance: '4.10σ Multi-Channel Coherence',
        status: 'Pending Verification',
        channels: ['PMT-02', 'PMT-04', 'PMT-05', 'PMT-06', 'PMT-07', 'PMT-09', 'PMT-10'],
        summary: 'High-energy nuclear recoil triple-pulse sequence observed during quiet laboratory conditions with all muon veto guards fully operational.',
        details: 'The event signature exhibits rapid spatial drift along the central axis with S1 prompt timing of 1.8 nanoseconds and S2 charge yield of 4,200 photoelectrons.',
        relatedIds: ['EVENT-884-BRAVO', 'FLARE-ZEPHYR-7', 'CALIB-2022-AMBE-NEUTRON']
      },
      {
        id: 'FLARE-ZEPHYR-7',
        tier: 'TIER_2_CANDIDATE',
        title: 'Sub-GeV Dark Matter Influx Transient (Zephyr Wave)',
        date: '2026-06-19',
        author: 'Astrophysical Transient Rapid Response Group',
        category: 'Transient Event',
        exposureTonnesDays: 18.0,
        energyRange: '0.9 - 5.5 keVnr',
        significance: '3.45σ Transient Spike',
        status: 'Under Investigation',
        channels: ['PMT-01', 'PMT-02', 'PMT-03', 'PMT-04', 'PMT-05', 'PMT-07', 'PMT-08'],
        summary: 'Sudden 6-hour burst of isolated nuclear recoils coinciding with Earth crossing the suspected dark matter Galactic Stream stream velocity vector.',
        details: 'Background rates across gamma/beta channels remained constant at 14.2 Hz, while nuclear recoil channel event count jumped 400% above baseline.',
        relatedIds: ['DIURNAL-MOD-2025', 'TRANSIENT-AXION-BURST', 'CANDIDATE-THETA']
      },
      {
        id: 'DIURNAL-MOD-2025',
        tier: 'TIER_2_CANDIDATE',
        title: 'Sidereal Daily Modulation Correlation Study 2025-2026',
        date: '2026-07-02',
        author: 'Modulation Analysis Group',
        category: 'Modulation Study',
        exposureTonnesDays: 410.0,
        energyRange: '1.5 - 6.0 keVnr',
        significance: '2.95σ Annual / Diurnal Harmonic',
        status: 'Data Collection Ongoing',
        channels: ['PMT-01', 'PMT-02', 'PMT-05', 'PMT-06', 'PMT-08', 'PMT-09', 'PMT-10'],
        summary: 'Cross-correlation of low-energy single recoil event rates against Earth orbital and rotational vectors relative to the Cygnus constellation.',
        details: 'Observed phase peak at May 31st with amplitude modulation of 3.4% +/- 1.1%, consistent with galactic dark matter wind models.',
        relatedIds: ['EVENT-884-BRAVO', 'FLARE-ZEPHYR-7', 'RUN-2024-WIMP-SHM']
      },
      {
        id: 'EXCESS-4.2-KEV',
        tier: 'TIER_2_CANDIDATE',
        title: 'Monochromatic 4.2 keV Electronic Recoil Excess',
        date: '2026-05-12',
        author: 'Dr. M. Chen',
        category: 'Unexplained Excess',
        exposureTonnesDays: 180.0,
        energyRange: '4.0 - 4.4 keV',
        significance: '3.05σ Local Gaussian Peak',
        status: 'Forensic Review',
        channels: ['PMT-02', 'PMT-03', 'PMT-04', 'PMT-05', 'PMT-06', 'PMT-08', 'PMT-10'],
        summary: 'Distinct Gaussian spectral peak at 4.2 keV. Candidate hypotheses include solar axions, sterile neutrinos, or argon-37 trace contamination.',
        details: 'Argon-37 half-life decay analysis indicates source is non-exponential, disfavoring radioactive atmospheric contamination.',
        relatedIds: ['RUN-2019-AXION', 'RUN-409-OMEGA']
      },
      {
        id: 'TRANSIENT-AXION-BURST',
        tier: 'TIER_2_CANDIDATE',
        title: 'Solar Flare Coincident Primakoff Axion Pulse',
        date: '2026-08-01',
        author: 'Astroparticle Alert Network',
        category: 'Transient Event',
        exposureTonnesDays: 22.0,
        energyRange: '2.0 - 8.5 keV',
        significance: '3.60σ Solar Coincidence',
        status: 'Under Review',
        channels: ['PMT-01', 'PMT-03', 'PMT-04', 'PMT-06', 'PMT-07', 'PMT-09', 'PMT-10'],
        summary: 'Synchronized event cluster observed 8.3 minutes following an X9.2 solar flare detected by spaceborne solar observatories.',
        details: 'Coincidence timing window of 120 seconds yielded 5 candidate events inside the core fiducial volume.',
        relatedIds: ['RUN-2019-AXION', 'FLARE-ZEPHYR-7']
      },
      {
        id: 'ANOMALY-1102-KRYPTON',
        tier: 'TIER_2_CANDIDATE',
        title: 'Sub-Surface Recoil Anomaly on Inner Cathode Ring',
        date: '2026-08-10',
        author: 'Dr. V. Aris',
        category: 'Instrument Anomaly',
        exposureTonnesDays: 12.0,
        energyRange: '8.0 - 24.0 keVnr',
        significance: '2.80σ Localized Anomaly',
        status: 'Under Review',
        channels: ['PMT-03', 'PMT-04', 'PMT-05', 'PMT-06', 'PMT-07', 'PMT-08', 'PMT-10'],
        summary: 'Anomalous concentration of events near cathode ring sector PMT-05 showing atypical S1 prompt photon rise times of 0.9 ns.',
        details: 'High-voltage grid inspection scheduled to verify absence of micro-discharge sparks along the sapphire insulator rings.',
        relatedIds: ['NOTE-DR-VASQUEZ-FIDUCIAL', 'INC-2021-VETO-MAINTENANCE']
      },

      // -------------------------------------------------------------
      // PERSONNEL LOGS, PROTOCOLS & TECHNICAL REPORTS
      // -------------------------------------------------------------
      {
        id: 'NOTE-DR-VASQUEZ-FIDUCIAL',
        tier: 'TIER_1_VETTED',
        title: 'Technical Note: 3D Fiducial Core Boundary Parameterization',
        date: '2023-04-18',
        author: 'Dr. E. Vasquez (Cryostat Engineering Lead)',
        category: 'Engineering Specification',
        exposureTonnesDays: 'N/A',
        energyRange: 'Spatial Cut Definition',
        significance: 'Approved Protocol',
        status: 'Active Standard',
        channels: ['PMT-01', 'PMT-02', 'PMT-04', 'PMT-07', 'PMT-08', 'PMT-09', 'PMT-10'],
        summary: 'Mathematical formulation of the 2.0-tonne inner fiducial volume cylinder (r < 450 mm, 50 < z < 950 mm) to exclude surface radon wall events.',
        details: 'Provides the exact algorithm implemented in the discriminator hardware: events with calculated radius > 450mm from drift timing differences are automatically vetoed as wall radon contamination.',
        relatedIds: ['BASE-2023-RADON-PURGE', 'EVENT-884-BRAVO', 'MEMO-UNBLINDING-PROTOCOL-14']
      },
      {
        id: 'MEMO-UNBLINDING-PROTOCOL-14',
        tier: 'TIER_1_VETTED',
        title: 'Observatory Blind-Analysis Safety Protocol Memo #14',
        date: '2024-01-10',
        author: 'Scientific Steering Committee',
        category: 'Safety Protocol',
        exposureTonnesDays: 'N/A',
        energyRange: 'Safety Compliance',
        significance: 'Mandatory Policy',
        status: 'Active Protocol',
        channels: ['PMT-01', 'PMT-03', 'PMT-04', 'PMT-05', 'PMT-06', 'PMT-07', 'PMT-09'],
        summary: 'Institutional regulations establishing the Blind-Analysis Protocol Lock on the primary analysis console to avoid observer bias during data cuts.',
        details: 'Requires full consensus on data cuts before unblinding candidate signal regions. The hardware safety interlock defaults to RELEASED for exploratory runs but must be engaged for blinded compliance testing.',
        relatedIds: ['RUN-2024-WIMP-SHM', 'EVENT-884-BRAVO']
      },
      {
        id: 'REPORT-CRYOPUMP-SERVICING',
        tier: 'TIER_1_VETTED',
        title: 'Turbomolecular Cryopump Maintenance & Vacuum Log',
        date: '2025-08-20',
        author: 'Underground Facilities Engineering',
        category: 'Maintenance Log',
        exposureTonnesDays: 'N/A',
        energyRange: 'Telemetry Diagnostics',
        significance: 'Verified Nominal',
        status: 'Completed',
        channels: ['PMT-02', 'PMT-03', 'PMT-05', 'PMT-06', 'PMT-07', 'PMT-08', 'PMT-10'],
        summary: 'Comprehensive servicing of the dual magnetic-levitation turbomolecular cryopumps maintaining 1.2e-9 mbar insulation vacuum.',
        details: 'Replaced cryo-compressor bearings on secondary cooling loop. Baseline operating temperature stabilized at 165.20 K with +/- 0.02 K thermal margin.',
        relatedIds: ['RUN-2014-XENON-S1', 'RUN-409-OMEGA']
      },
      {
        id: 'INC-2021-VETO-MAINTENANCE',
        tier: 'TIER_1_VETTED',
        title: 'Cosmic Muon Water Cherenkov Veto PMT Array Refurbishment',
        date: '2021-08-14',
        author: 'Veto System Team',
        category: 'Maintenance Log',
        exposureTonnesDays: 'N/A',
        energyRange: 'Veto Tuning',
        significance: '99.98% Muon Rejection Restored',
        status: 'Completed',
        channels: ['PMT-01', 'PMT-02', 'PMT-03', 'PMT-04', 'PMT-07', 'PMT-08', 'PMT-09'],
        summary: 'Replacement of 12 submerged 8-inch Hamamatsu photomultiplier tubes in the 120-tonne outer water Cherenkov veto tank.',
        details: 'Confirmed 50-nanosecond coincidence timing resolution against 1,450m rock overburden cosmogenic muon flux.',
        relatedIds: ['RUN-2019-AXION', 'RUN-2024-WIMP-SHM']
      }
    ];

    // Add additional relational items to reach 36 full entries
    this.generateExtendedArchiveEntries();
  }

  generateExtendedArchiveEntries() {
    const categories = ['Calibration Standard', 'Exclusion Campaign', 'Candidate Event Cluster', 'Physical Baseline', 'Maintenance Log', 'Simulation Study'];
    const channelsPool = ['PMT-01', 'PMT-02', 'PMT-03', 'PMT-04', 'PMT-05', 'PMT-06', 'PMT-07', 'PMT-08', 'PMT-09', 'PMT-10'];
    
    const titles = [
      { id: 'RUN-2016-NEUTRINO', title: 'Solar Boron-8 Neutrino Coherent Scattering Floor Mapping', tier: 'TIER_1_VETTED' },
      { id: 'CALIB-2017-CS137', title: 'Cesium-137 Gamma Calibration Peak & Compton Band Definition', tier: 'TIER_1_VETTED' },
      { id: 'RUN-2018-SPIN-DEP', title: 'Spin-Dependent Xenon-129 / Xenon-131 Axial Coupling Search', tier: 'TIER_1_VETTED' },
      { id: 'NOTE-ELECTRODE-HIGHVOLTAGE', title: 'Electrode High-Voltage Microdischarge Mitigation Protocol', tier: 'TIER_1_VETTED' },
      { id: 'REPORT-PURITY-MONITOR', title: 'Liquid Xenon Photoelectron Lifetime In-Situ Purity Report', tier: 'TIER_1_VETTED' },
      { id: 'SIM-GEANT4-CRYOMODEL', title: 'Geant4 Underground Cosmogenic Muon Shielding Simulation v4.2', tier: 'TIER_1_VETTED' },
      { id: 'RUN-2020-LOW-MASS', title: 'Light WIMP Sub-5 GeV Search via Migdal Effect Ionization', tier: 'TIER_1_VETTED' },
      { id: 'CALIB-2021-TRITIUM', title: 'CH3T Tritiated Methane Homogeneous Beta Source Calibration', tier: 'TIER_1_VETTED' },
      { id: 'BASE-2022-LEAD-SHIELD', title: 'Ancient Roman Low-Activity Lead Shielding Attenuation Study', tier: 'TIER_1_VETTED' },
      { id: 'EVENT-912-DELTA', title: 'Triple-Coincidence Prompt Ionization Anomaly (Event 912-D)', tier: 'TIER_2_CANDIDATE' },
      { id: 'CANDIDATE-KAPPA', title: 'Correlated Dual-Core WIMP Scattering Candidate Run 2026-K', tier: 'TIER_2_CANDIDATE' },
      { id: 'EXCESS-0.8-KEV-ION', title: 'Sub-Threshold 0.8 keV Single-Electron Ionization Excess', tier: 'TIER_2_CANDIDATE' },
      { id: 'ANOMALY-CATHODE-DRIFT', title: 'Cathode Grid Micro-Drift Velocity Anomaly During Seismic Tremor', tier: 'TIER_2_CANDIDATE' },
      { id: 'RUN-2026-AXION-BURST', title: 'Search for Solar Axion Burst from Core Plasma Transients', tier: 'TIER_2_CANDIDATE' },
      { id: 'EVENT-1004-EPSILON', title: 'Isolated 34.2 keVnr High-Energy Nuclear Recoil Candidate', tier: 'TIER_2_CANDIDATE' },
      { id: 'MEMO-NEUTRINO-FLOOR', title: 'Coherent Elastic Neutrino-Nucleus Scattering (CEvNS) Boundary Review', tier: 'TIER_1_VETTED' }
    ];

    titles.forEach((item, idx) => {
      // Pick 7 unique channels
      const shuffled = [...channelsPool].sort(() => 0.5 - Math.random());
      const selectedChannels = shuffled.slice(0, 7);
      
      this.entries.push({
        id: item.id,
        tier: item.tier,
        title: item.title,
        date: `20${16 + (idx % 11)}-0${1 + (idx % 9)}-1${idx % 9}`,
        author: idx % 2 === 0 ? 'BOREAS Scientific Collaboration' : 'Dr. E. Vasquez & Cryo Group',
        category: categories[idx % categories.length],
        exposureTonnesDays: 30 + (idx * 22),
        energyRange: `${(1.1 + idx * 0.4).toFixed(1)} - ${(35.0 + idx * 1.5).toFixed(1)} keVnr`,
        significance: item.tier === 'TIER_1_VETTED' ? 'Exclusion Boundary Confirmed' : `${(2.8 + (idx % 4) * 0.4).toFixed(2)}σ Candidate`,
        status: item.tier === 'TIER_1_VETTED' ? 'Archived & Verified' : 'Under Review',
        channels: selectedChannels,
        summary: `Relational dataset ${item.id} detailing high-purity rare-event detector measurements at 1,450m rock overburden.`,
        details: `Detailed forensic telemetry for ${item.title}. Relational analysis cross-checked against baseline calibration runs with 99.999% background rejection certainty.`,
        relatedIds: ['RUN-1998-ALPHA', 'RUN-2024-WIMP-SHM', 'EVENT-884-BRAVO'].filter(r => r !== item.id)
      });
    });
  }

  getAllEntries() {
    return this.entries;
  }

  getEntryById(id) {
    return this.entries.find(e => e.id === id);
  }

  getEntriesByTier(tier) {
    if (!tier || tier === 'ALL') return this.entries;
    return this.entries.filter(e => e.tier === tier);
  }

  searchEntries(query, tier = 'ALL') {
    let filtered = this.getEntriesByTier(tier);
    if (!query || !query.trim()) return filtered;
    
    const q = query.toLowerCase().trim();
    return filtered.filter(e => 
      e.id.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.author.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
  }
}

window.dmArchive = new ArchiveManager();
