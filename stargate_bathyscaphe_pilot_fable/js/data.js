// ============================================================================
//  HADAL THRESHOLD INSTITUTE — DSV-7 "CERULEAN LANTERN" — PILOT CONSOLE
//  Static data layer: vessel constants, strata glyphs, trim channels,
//  logged dive profiles (quick-dial), colour moods and the dive archive.
//  Everything here is fictional. No real networks, no real backend.
// ============================================================================

export const VERSION = '1.0.0';

export const VESSEL = {
  institute: 'Hadal Threshold Institute',
  instituteShort: 'HTI',
  hull: 'DSV-7',
  name: 'Cerulean Lantern',
  platform: 'RV Meridian Hollow (surface tender)',
  sphere: '2.10 m acrylic observation sphere, 178 mm wall',
  ratedDepth: 11000,        // metres — certified operating depth
  crushDepth: 11900,        // metres — calculated hull failure
  gaugeMax: 12000,          // metres — instrument face range
  ringOffset: 60,           // metres the Threshold ring sits below the approach hold
  sequenceLength: 7,        // waypoints per descent profile
};

// ----------------------------------------------------------------------------
// Trim / propulsion channels — 10 channels.
//   4 main ballast tanks   (differential flooding: pitch + roll authority)
//   2 trim tanks           (fore/aft water transfer: fine pitch)
//   2 vertical thrusters   (active depth correction while settling)
//   2 horizontal thrusters (station-keeping against current)
// ----------------------------------------------------------------------------
export const CHANNELS = [
  { id: 'BT1', label: 'BALLAST FWD-P', kind: 'ballast', pos: 'fwd', side: 'port' },
  { id: 'BT2', label: 'BALLAST FWD-S', kind: 'ballast', pos: 'fwd', side: 'stbd' },
  { id: 'BT3', label: 'BALLAST AFT-P', kind: 'ballast', pos: 'aft', side: 'port' },
  { id: 'BT4', label: 'BALLAST AFT-S', kind: 'ballast', pos: 'aft', side: 'stbd' },
  { id: 'TRF', label: 'TRIM FWD',      kind: 'trim',    pos: 'fwd' },
  { id: 'TRA', label: 'TRIM AFT',      kind: 'trim',    pos: 'aft' },
  { id: 'VTP', label: 'VERT THR P',    kind: 'vthr',    side: 'port' },
  { id: 'VTS', label: 'VERT THR S',    kind: 'vthr',    side: 'stbd' },
  { id: 'HTP', label: 'HORZ THR P',    kind: 'hthr',    side: 'port' },
  { id: 'HTS', label: 'HORZ THR S',    kind: 'hthr',    side: 'stbd' },
];

// ----------------------------------------------------------------------------
// Strata glyphs — the addressing alphabet. Each glyph is a named depth
// stratum (a "bench" where the Lantern can hold neutral buoyancy). A descent
// profile is 7 glyphs in strictly increasing depth; the last is the approach
// hold above a Threshold ring.
// Glyph art: original 40x40 SVG path data.
// ----------------------------------------------------------------------------
export const GLYPHS = [
  { id: 'KEL',  name: 'Kelp Shelf',        depth: 40,    path: 'M20 4 L20 36 M12 14 Q20 20 28 14 M12 26 Q20 32 28 26 M12 20 L28 20', note: 'Photic shelf. Trim check against the tender\'s shadow.' },
  { id: 'THR',  name: 'Thermocline Bench', depth: 180,   path: 'M6 14 Q13 8 20 14 T34 14 M6 26 Q13 20 20 26 T34 26 M20 8 L20 32', note: 'Density step. First real buoyancy shift as water cools.' },
  { id: 'DUSK', name: 'Twilight Sill',     depth: 420,   path: 'M8 28 A12 12 0 0 1 32 28 M20 10 L20 16 M10 30 L30 30 M6 34 L34 34', note: 'Last of the surface light. Lamps come on here.' },
  { id: 'LANT', name: 'Lantern Line',      depth: 700,   path: 'M20 6 L26 16 L20 34 L14 16 Z M8 20 L14 20 M26 20 L32 20 M20 36 L20 38', note: 'Bioluminescence band. The vessel\'s namesake waters.' },
  { id: 'OXM',  name: 'Oxygen Minimum',    depth: 950,   path: 'M20 8 A12 12 0 1 0 20 32 A12 12 0 1 0 20 8 M12 20 L28 20 M20 14 L20 26', note: 'Sparse water. Scrubber load check.' },
  { id: 'MIDN', name: 'Midnight Gate',     depth: 1400,  path: 'M8 32 L8 14 L20 6 L32 14 L32 32 M14 32 L14 20 L26 20 L26 32', note: 'Absolute dark. Pressure exceeds 140 bar.' },
  { id: 'CALD', name: 'Caldera Rim',       depth: 2100,  path: 'M6 30 L14 12 L20 20 L26 12 L34 30 Z M14 30 L26 30', note: 'Volcanic rim. Thermal plumes disturb trim.' },
  { id: 'VENT', name: 'Vent Field',        depth: 2650,  path: 'M12 34 L12 20 M20 34 L20 14 M28 34 L28 20 M8 12 Q12 6 16 12 M24 8 Q28 2 32 8', note: 'Hydrothermal field. Hull outer skin warms 4 °C.' },
  { id: 'PLN',  name: 'Abyssal Plain',     depth: 3800,  path: 'M4 24 L36 24 M8 30 L32 30 M12 18 L28 18 M20 6 L20 12', note: 'Flat sediment. Best station-keeping in the profile.' },
  { id: 'FRAC', name: 'Fracture Terrace',  depth: 4700,  path: 'M6 8 L16 18 L12 24 L22 32 M20 6 L30 16 L26 22 L36 30 M10 34 L14 34', note: 'Stepped fault terraces. Watch lateral drift.' },
  { id: 'SCRP', name: 'Scarp Foot',        depth: 5600,  path: 'M6 34 L6 10 L18 10 L18 22 L34 22 L34 34 Z M10 30 L14 30', note: 'Base of the great scarp. Sediment plumes.' },
  { id: 'TRN',  name: 'Trench Lip',        depth: 6300,  path: 'M4 12 L14 12 L18 30 L22 30 L26 12 L36 12 M18 20 L22 20', note: 'Edge of the trench. Hull creak expected.' },
  { id: 'HDL',  name: 'Hadal Shelf',       depth: 7500,  path: 'M8 8 L8 32 M32 8 L32 32 M8 20 L32 20 M14 14 L26 26 M26 14 L14 26', note: 'Hadal zone proper. Only the Lantern goes here.' },
  { id: 'SIL',  name: 'Silence Basin',     depth: 8800,  path: 'M20 6 A14 14 0 1 0 20 34 M20 12 A8 8 0 1 1 20 28 M20 18 A2 2 0 1 0 20 22', note: 'Sediment basin with no measurable current.' },
  { id: 'DEEP', name: 'Deepmark',          depth: 9900,  path: 'M20 4 L20 36 M10 26 L20 36 L30 26 M12 10 L28 10 M14 16 L26 16', note: 'The survey\'s deepest benchmark pin.' },
  { id: 'FLR',  name: 'Threshold Floor',   depth: 10700, path: 'M6 34 L34 34 M10 34 L10 26 L30 26 L30 34 M14 26 L14 18 L26 18 L26 26 M18 18 L18 10 L22 10 L22 18', note: 'Floor of the Threshold. 97 % of rated hull load.' },
];

export const GLYPH_BY_ID = Object.fromEntries(GLYPHS.map(g => [g.id, g]));

// ----------------------------------------------------------------------------
// Dive-computer profiles (quick-dial). Two tiers:
//   'verified'     — logged, surface-audited descent profiles replayed from
//                    the dive computer at processor speed.
//   'experimental' — plotted but unconfirmed routes; replay allowed, but the
//                    computer flags margin warnings.
// ----------------------------------------------------------------------------
export const PRESETS = [
  { id: 'VF-12', tier: 'verified', name: 'Vent Field Ring',      ring: 'Ring Beta',  sequence: ['KEL','THR','DUSK','LANT','MIDN','CALD','VENT'], logged: 'D-117', pilot: 'O. Vance',  note: 'Standard hydrothermal approach. 14 logged replays.' },
  { id: 'AP-04', tier: 'verified', name: 'Abyssal Plain Ring',   ring: 'Ring Gamma', sequence: ['THR','DUSK','OXM','MIDN','CALD','VENT','PLN'],  logged: 'D-124', pilot: 'T. Okoro',  note: 'Flattest hold in the catalogue. Training profile.' },
  { id: 'FT-09', tier: 'verified', name: 'Fracture Terrace Ring', ring: 'Ring Delta', sequence: ['DUSK','LANT','MIDN','CALD','VENT','PLN','FRAC'], logged: 'D-131', pilot: 'R. Hauge',  note: 'Lateral drift corrected by HT-P bias at terrace.' },
  { id: 'TL-02', tier: 'verified', name: 'Trench Lip Ring',      ring: 'Ring Epsilon', sequence: ['LANT','MIDN','CALD','VENT','PLN','SCRP','TRN'], logged: 'D-140', pilot: 'I. Maret',  note: 'Deepest verified ring. Creak events logged at 6100 m.' },
  { id: 'SB-X1', tier: 'experimental', name: 'Silence Basin Route', ring: 'Ring Zeta (unconfirmed)', sequence: ['MIDN','CALD','VENT','PLN','FRAC','TRN','SIL'], logged: 'D-146', pilot: 'O. Vance', note: 'Ring Zeta seen once on lidar. Hold not yet audited.' },
  { id: 'DM-X3', tier: 'experimental', name: 'Deepmark Route',    ring: 'Ring Eta (unconfirmed)', sequence: ['CALD','VENT','PLN','FRAC','SCRP','HDL','DEEP'], logged: 'D-151', pilot: 'B. Szalai', note: 'Profile plotted from D-151 sphere-strain data only.' },
  { id: 'TF-X0', tier: 'experimental', name: 'Threshold Floor Route', ring: 'Ring Theta (theoretical)', sequence: ['VENT','PLN','FRAC','SCRP','TRN','SIL','FLR'], logged: 'IR-019', pilot: '—', note: 'Final ring depth 10 760 m — 97.8 % rated load. Never flown.' },
];

// ----------------------------------------------------------------------------
// Instrument colour moods
// ----------------------------------------------------------------------------
export const MOODS = {
  cerulean: { label: 'Cerulean',     accent: '#35d6ff', accent2: '#7cf3ff', warn: '#ffb347', danger: '#ff4d5e', ink: '#061722', ink2: '#0a2433', text: '#d9f6ff', dim: '#5e9cb3' },
  amber:    { label: 'Amber Deck',   accent: '#ffb23d', accent2: '#ffd58a', warn: '#ff7a3d', danger: '#ff3b3b', ink: '#1a1006', ink2: '#2a1a08', text: '#ffe9c4', dim: '#b3854e' },
  phosphor: { label: 'Phosphor',     accent: '#5cff8a', accent2: '#b8ffcc', warn: '#ffe95c', danger: '#ff5c5c', ink: '#051a0c', ink2: '#0a2a14', text: '#dcffe6', dim: '#5aa874' },
  glacier:  { label: 'Glacier',      accent: '#dbe9ff', accent2: '#ffffff', warn: '#ffc46b', danger: '#ff6b7a', ink: '#0b1220', ink2: '#141f33', text: '#f2f6ff', dim: '#7d8db0' },
  violet:   { label: 'Violet Abyss', accent: '#b88cff', accent2: '#e4d1ff', warn: '#ffb347', danger: '#ff4d7a', ink: '#120a20', ink2: '#1d1133', text: '#efe6ff', dim: '#8a73b3' },
};

// ----------------------------------------------------------------------------
// Dive archive — cross-referenced records. Types:
//   DIVE (D-), CREW LOG (CL-), INCIDENT (IR-), DISCOVERY (DS-), MAINTENANCE (MR-)
// `refs` are forward links; the archive view computes backlinks.
// ----------------------------------------------------------------------------
export const ARCHIVE = [
  // ---- Dives
  { id: 'D-101', type: 'DIVE', title: 'Shakedown to Thermocline Bench', date: '2041-03-04', depth: 180, pilot: 'Oriel Vance',
    body: 'First wet dive after sphere certification. Flooded BT1–BT4 to 38 % and held neutral at 180 m for 41 minutes. Trim tanks transferred 11 L aft to correct a persistent bow-down attitude later traced to the lamp cluster mass.', refs: ['MR-002', 'CL-001'] },
  { id: 'D-104', type: 'DIVE', title: 'Twilight Sill hold and lamp trial', date: '2041-03-19', depth: 420, pilot: 'Tamsin Okoro',
    body: 'Lamps switched on at 390 m. Neutral hold reached in 2 min 40 s after one overshoot of 9 m. Vertical thrusters used 18 % of the settle-phase energy budget.', refs: ['D-101', 'CL-003'] },
  { id: 'D-109', type: 'DIVE', title: 'Lantern Line night descent', date: '2041-04-22', depth: 700, pilot: 'Oriel Vance',
    body: 'Bioluminescent wake observed at 650–720 m. Vessel name adopted by crew vote after this dive. Hold stable; no creak events.', refs: ['DS-001', 'CL-004'] },
  { id: 'D-112', type: 'DIVE', title: 'Oxygen Minimum scrubber test', date: '2041-05-10', depth: 950, pilot: 'Ruslan Hauge',
    body: 'Extended 3 h hold to characterise scrubber performance under full cabin load. CO₂ plateaued at 2 100 ppm. Minor trim drift aft traced to condensation pooling.', refs: ['MR-005', 'D-104'] },
  { id: 'D-117', type: 'DIVE', title: 'First Threshold contact — Ring Beta', date: '2041-07-02', depth: 2710, pilot: 'Oriel Vance',
    body: 'Profile KEL→THR→DUSK→LANT→MIDN→CALD→VENT. Approach hold at 2 650 m. The ring structure resolved on lamps at 2 700 m: a 14 m circular lip of fused basalt with an inner aperture that responded to the hull aperture opening. This dive established the verified profile VF-12.', refs: ['DS-002', 'CL-007', 'IR-003', 'D-121'] },
  { id: 'D-121', type: 'DIVE', title: 'Ring Beta re-acquisition', date: '2041-07-15', depth: 2710, pilot: 'Tamsin Okoro',
    body: 'Repeat of D-117 to confirm the ring response was not a lamp reflection. Aperture response reproduced three times. Hydrothermal plume from the vent field pushed the vessel 6 m west; HT-P bias of 12 % held station.', refs: ['D-117', 'DS-002'] },
  { id: 'D-124', type: 'DIVE', title: 'Abyssal Plain Ring — Gamma', date: '2041-08-20', depth: 3860, pilot: 'Tamsin Okoro',
    body: 'Profile logged as AP-04. Flattest hold yet recorded: settle-phase oscillation under 0.4 m. Ring Gamma is larger than Beta (22 m) and partially buried in sediment.', refs: ['DS-004', 'CL-010'] },
  { id: 'D-127', type: 'DIVE', title: 'Gamma sediment survey', date: '2041-09-03', depth: 3860, pilot: 'Ione Maret',
    body: 'Dive cut short at 2 h 10 m when BT3 vent valve stuck partly open. Emergency ascent rehearsed deliberately at 3 400 m rather than waiting for a failure.', refs: ['IR-006', 'MR-009', 'D-124'] },
  { id: 'D-131', type: 'DIVE', title: 'Fracture Terrace Ring — Delta', date: '2041-10-28', depth: 4760, pilot: 'Ruslan Hauge',
    body: 'Profile FT-09. Terrace steps produce a lateral shear; horizontal thrusters ran at 30 % through the last two holds. Ring Delta sits on the third terrace and tilts 11° from horizontal.', refs: ['DS-006', 'CL-013', 'IR-008'] },
  { id: 'D-135', type: 'DIVE', title: 'Delta tilt investigation', date: '2041-11-12', depth: 4760, pilot: 'Ruslan Hauge',
    body: 'Held 9 m above Ring Delta for 50 min while strain gauges sampled the aperture response. Response is identical regardless of the vessel\'s attitude relative to the tilt.', refs: ['D-131', 'DS-006'] },
  { id: 'D-140', type: 'DIVE', title: 'Trench Lip Ring — Epsilon', date: '2042-02-07', depth: 6360, pilot: 'Ione Maret',
    body: 'Profile TL-02. First dive past 6 000 m. Creak events began at 6 100 m, 14 in total, each a relaxation of the sphere seat. Ring Epsilon is the smallest found (9 m) and the brightest in response.', refs: ['DS-008', 'IR-011', 'CL-016', 'MR-014'] },
  { id: 'D-142', type: 'DIVE', title: 'Epsilon extended hold', date: '2042-02-21', depth: 6360, pilot: 'Oriel Vance',
    body: 'Four-hour hold at the Epsilon approach depth. Cabin temperature fell to 9 °C. Pilot reported the sphere "singing" — a 41 Hz tone later matched to seat resonance.', refs: ['D-140', 'MR-014', 'CL-017'] },
  { id: 'D-146', type: 'DIVE', title: 'Silence Basin reconnaissance', date: '2042-05-30', depth: 8800, pilot: 'Oriel Vance',
    body: 'Route SB-X1 plotted live. Zero measurable current at 8 800 m — the vessel held neutral with all thrusters idle for 22 minutes. Lidar returned one possible ring lip (designated Zeta) at 8 860 m before the lamp breaker tripped.', refs: ['DS-010', 'IR-014', 'MR-018'] },
  { id: 'D-151', type: 'DIVE', title: 'Deepmark benchmark dive', date: '2042-09-11', depth: 9900, pilot: 'Benedek Szalai',
    body: 'Placed the survey\'s deepest benchmark pin. Hull load 90.4 % of rated. Sphere compression 4.2 mm. Route DM-X3 derived from this dive\'s strain data; Ring Eta inferred only from an aperture-like magnetic signature.', refs: ['DS-012', 'CL-021', 'IR-016'] },
  { id: 'D-153', type: 'DIVE', title: 'Deepmark pin verification', date: '2042-10-02', depth: 9900, pilot: 'Ione Maret',
    body: 'Confirmed the pin at 9 900 m. Hull groan at 9 650 m loud enough to be recorded on the cabin microphone; pilot elected to continue. Neutral hold achieved with 2 % thruster margin.', refs: ['D-151', 'IR-016'] },
  { id: 'D-158', type: 'DIVE', title: 'Ring Beta annual re-certification', date: '2043-03-14', depth: 2710, pilot: 'Tamsin Okoro',
    body: 'VF-12 replayed from the dive computer with the pilot\'s hands off the profile controls — first fully automated waypoint sequence. Hold precision within 0.2 m of the logged profile.', refs: ['D-117', 'MR-022', 'CL-024'] },
  { id: 'D-160', type: 'DIVE', title: 'Training dive — cadet Lindqvist', date: '2043-04-02', depth: 3860, pilot: 'Tamsin Okoro',
    body: 'AP-04 flown manually by cadet under supervision. Two shallow-glyph selection errors caught by the profile monotonic check. Hold achieved on the third attempt.', refs: ['D-124', 'CL-026'] },
  { id: 'D-164', type: 'DIVE', title: 'Epsilon aperture duration test', date: '2043-06-19', depth: 6360, pilot: 'Ione Maret',
    body: 'Aperture held open for 31 minutes, the longest sustained active period. Cabin instruments recorded a persistent 0.3 °C warming from the ring side of the sphere only.', refs: ['D-140', 'DS-008', 'DS-014'] },
  { id: 'D-169', type: 'DIVE', title: 'Zeta search — second pass', date: '2043-09-08', depth: 8800, pilot: 'Oriel Vance',
    body: 'Repeated SB-X1 with a replacement lamp breaker. No ring lip found within the 80 m lidar radius. Route remains experimental.', refs: ['D-146', 'MR-018', 'DS-010'] },
  { id: 'D-173', type: 'DIVE', title: 'Threshold Floor approach — aborted', date: '2044-01-21', depth: 9420, pilot: 'Benedek Szalai',
    body: 'Route TF-X0 attempted. Emergency ascent commanded at 9 420 m after the hull-integrity lockout engaged itself on a strain-gauge disagreement. Post-dive, gauge 3 found miscalibrated by 1.4 %.', refs: ['IR-019', 'MR-027', 'CL-030'] },

  // ---- Crew logs
  { id: 'CL-001', type: 'CREW', title: 'Vance — on the first wet dive', date: '2041-03-04', pilot: 'Oriel Vance',
    body: 'The sphere fogs for the first ten minutes and then clears as the cabin dries. I kept one hand on the vent valves the whole descent. We are learning the vessel\'s weight the way you learn a person\'s.', refs: ['D-101'] },
  { id: 'CL-003', type: 'CREW', title: 'Okoro — lamp trial notes', date: '2041-03-19', pilot: 'Tamsin Okoro',
    body: 'Overshoot of nine metres felt like a dropped floor. The correction burn is loud inside the sphere — a rising whine you feel in your teeth before you hear it.', refs: ['D-104'] },
  { id: 'CL-004', type: 'CREW', title: 'Naming the vessel', date: '2041-04-23', pilot: 'Crew vote',
    body: 'Seven votes for Cerulean Lantern, two for Meridian Seed. The wake at the Lantern Line decided it. Brenn abstained on the grounds that "she already has a hull number."', refs: ['D-109', 'DS-001'] },
  { id: 'CL-007', type: 'CREW', title: 'Vance — Ring Beta', date: '2041-07-02', pilot: 'Oriel Vance',
    body: 'I opened the aperture expecting basalt. The ring answered with a light that came from nowhere I could point the lamps. I held neutral for as long as the scrubber allowed and did not want to leave.', refs: ['D-117', 'DS-002'] },
  { id: 'CL-010', type: 'CREW', title: 'Okoro — Gamma plain', date: '2041-08-20', pilot: 'Tamsin Okoro',
    body: 'The plain is a hold you could fall asleep in. Trim tanks untouched for an hour. Ring Gamma is half under sediment, like something that was set down and forgotten.', refs: ['D-124', 'DS-004'] },
  { id: 'CL-013', type: 'CREW', title: 'Hauge — terraces', date: '2041-10-28', pilot: 'Ruslan Hauge',
    body: 'Every terrace step kicks the vessel sideways. I flew the last two holds with the horizontal thrusters biased to port the entire time. Brenn will want to see the energy log.', refs: ['D-131', 'IR-008'] },
  { id: 'CL-016', type: 'CREW', title: 'Maret — first creak', date: '2042-02-07', pilot: 'Ione Maret',
    body: 'The first creak at 6 100 m is not a sound so much as an event in the chest. Fourteen of them. The strain plot says they are nothing. The strain plot is not in the sphere.', refs: ['D-140', 'IR-011'] },
  { id: 'CL-017', type: 'CREW', title: 'Vance — the singing sphere', date: '2042-02-21', pilot: 'Oriel Vance',
    body: 'Four hours at Epsilon. Around hour three the sphere began a low continuous tone. Brenn matched it to the seat ring after the dive. I am choosing to find that comforting.', refs: ['D-142', 'MR-014'] },
  { id: 'CL-021', type: 'CREW', title: 'Szalai — Deepmark', date: '2042-09-11', pilot: 'Benedek Szalai',
    body: 'At ninety percent of rated load the vessel is very quiet, as if it too is paying attention. Placed the pin. Did not stay.', refs: ['D-151'] },
  { id: 'CL-024', type: 'CREW', title: 'Okoro — hands off', date: '2043-03-14', pilot: 'Tamsin Okoro',
    body: 'Watching the dive computer replay Vance\'s profile from two years ago, waypoint by waypoint, each tank flooding exactly as she flooded it. It felt like flying with a ghost who was better at this than me.', refs: ['D-158', 'D-117'] },
  { id: 'CL-026', type: 'CREW', title: 'Lindqvist — cadet log', date: '2043-04-02', pilot: 'Cadet E. Lindqvist',
    body: 'Selected the Thermocline glyph after the Twilight Sill and the console refused — profile must descend. Embarrassing, correct, and exactly what the interlock is for.', refs: ['D-160'] },
  { id: 'CL-030', type: 'CREW', title: 'Szalai — the abort', date: '2044-01-21', pilot: 'Benedek Szalai',
    body: 'When the lockout engaged itself I did not argue with it. Blew all ballast at 9 420 m. The ascent took forty minutes and I spent every one of them deciding I had been right.', refs: ['D-173', 'IR-019'] },

  // ---- Incident reports
  { id: 'IR-003', type: 'INCIDENT', title: 'Unplanned scrubber cycle at Ring Beta', date: '2041-07-02', depth: 2710, pilot: 'Oriel Vance',
    body: 'Scrubber entered a forced cycle during the sustained active period, raising cabin CO₂ to 3 400 ppm for 6 minutes. Cause: the pilot extended the hold past the planned scrubber service interval. Procedure amended to cap sustained active time.', refs: ['D-117', 'MR-005'] },
  { id: 'IR-006', type: 'INCIDENT', title: 'BT3 vent valve stuck open', date: '2041-09-03', depth: 3400, pilot: 'Ione Maret',
    body: 'Aft-port ballast vent failed to seat, producing a slow uncommanded descent of 0.3 m/min. Pilot elected a controlled emergency ascent. Valve seat replaced.', refs: ['D-127', 'MR-009'] },
  { id: 'IR-008', type: 'INCIDENT', title: 'Horizontal thruster thermal limit', date: '2041-10-28', depth: 4700, pilot: 'Ruslan Hauge',
    body: 'HT-P reached 88 % of thermal limit during terrace station-keeping. No damage; duty-cycle limiter added to the helm software.', refs: ['D-131', 'MR-011'] },
  { id: 'IR-011', type: 'INCIDENT', title: 'Creak-event classification', date: '2042-02-09', depth: 6100, pilot: 'Ione Maret',
    body: 'Fourteen acoustic events at 6 100–6 360 m reviewed. All correlate with sphere-seat relaxation, none with wall strain. Classified benign; added to the pilot briefing so nobody aborts on sound alone.', refs: ['D-140', 'MR-014', 'CL-016'] },
  { id: 'IR-014', type: 'INCIDENT', title: 'Lamp breaker trip at Silence Basin', date: '2042-05-30', depth: 8800, pilot: 'Oriel Vance',
    body: 'Main lamp breaker tripped at 8 860 m, ending lidar acquisition of the possible Ring Zeta lip. Cold-weld on a breaker contact. Vessel ascended on emergency lamps.', refs: ['D-146', 'MR-018'] },
  { id: 'IR-016', type: 'INCIDENT', title: 'Audible hull groan at 9 650 m', date: '2042-10-02', depth: 9650, pilot: 'Ione Maret',
    body: 'Single groan event loud enough for the cabin microphone. Strain gauges showed a 0.6 % transient. Within limits. Pilot\'s decision to continue reviewed and endorsed.', refs: ['D-153', 'D-151'] },
  { id: 'IR-019', type: 'INCIDENT', title: 'Self-engaged hull lockout — TF-X0', date: '2044-01-21', depth: 9420, pilot: 'Benedek Szalai',
    body: 'The hull-integrity lockout engaged on a 1.4 % disagreement between strain gauges 2 and 3, inhibiting final descent. Gauge 3 found miscalibrated. Lockout behaved as designed; route TF-X0 remains unflown.', refs: ['D-173', 'MR-027', 'CL-030'] },

  // ---- Discoveries
  { id: 'DS-001', type: 'DISCOVERY', title: 'Lantern Line bioluminescent band', date: '2041-04-22', depth: 700, pilot: 'Dr. Adaeze Nwosu',
    body: 'A persistent band of bioluminescent plankton between 650 and 720 m, lit by the vessel\'s own wake. Stable across seasons. Namesake of the vessel.', refs: ['D-109', 'CL-004'] },
  { id: 'DS-002', type: 'DISCOVERY', title: 'Threshold Ring Beta', date: '2041-07-02', depth: 2710, pilot: 'Dr. Adaeze Nwosu',
    body: 'A 14 m ring of fused basalt with an inner aperture that emits light when the vessel\'s pressure-hull aperture is opened within 60 m. First of the Threshold rings. Origin unknown; not a vent structure.', refs: ['D-117', 'D-121', 'DS-004'] },
  { id: 'DS-004', type: 'DISCOVERY', title: 'Threshold Ring Gamma', date: '2041-08-20', depth: 3860, pilot: 'Dr. Adaeze Nwosu',
    body: 'Second ring, 22 m, partly buried. Responds identically to Beta. Its size suggests the rings are not all one design.', refs: ['D-124', 'DS-002'] },
  { id: 'DS-006', type: 'DISCOVERY', title: 'Threshold Ring Delta', date: '2041-10-28', depth: 4760, pilot: 'Dr. Adaeze Nwosu',
    body: 'Third ring, on the third fracture terrace, tilted 11°. Response independent of vessel attitude, which rules out a simple reflective mechanism.', refs: ['D-131', 'D-135'] },
  { id: 'DS-008', type: 'DISCOVERY', title: 'Threshold Ring Epsilon', date: '2042-02-07', depth: 6360, pilot: 'Dr. Adaeze Nwosu',
    body: 'Smallest ring (9 m), brightest response. The response light has no measurable spectrum above 520 nm.', refs: ['D-140', 'D-164'] },
  { id: 'DS-010', type: 'DISCOVERY', title: 'Possible Ring Zeta (unconfirmed)', date: '2042-05-30', depth: 8860, pilot: 'Dr. Adaeze Nwosu',
    body: 'A single lidar return consistent with a ring lip at 8 860 m, lost when the lamps failed. Not reacquired on the second pass. Listed as unconfirmed.', refs: ['D-146', 'D-169', 'IR-014'] },
  { id: 'DS-012', type: 'DISCOVERY', title: 'Magnetic signature — Ring Eta (inferred)', date: '2042-09-11', depth: 9900, pilot: 'Dr. Adaeze Nwosu',
    body: 'An aperture-like magnetic anomaly near the Deepmark pin. No visual contact. Route DM-X3 exists only to find it.', refs: ['D-151'] },
  { id: 'DS-014', type: 'DISCOVERY', title: 'Asymmetric sphere warming during active hold', date: '2043-06-19', depth: 6360, pilot: 'Dr. Adaeze Nwosu',
    body: 'During the 31-minute active hold at Epsilon the sphere warmed 0.3 °C on the ring side only. Whatever the rings do, they do it with energy.', refs: ['D-164', 'DS-008'] },

  // ---- Maintenance
  { id: 'MR-002', type: 'MAINT', title: 'Lamp cluster mass rebalancing', date: '2041-03-08', pilot: 'Halvard Brenn',
    body: 'Moved 6.5 kg of lamp ballast aft to correct the bow-down attitude seen on D-101. Trim-tank default transfer reduced from 11 L to 3 L.', refs: ['D-101'] },
  { id: 'MR-005', type: 'MAINT', title: 'Scrubber canister service interval', date: '2041-07-05', pilot: 'Halvard Brenn',
    body: 'Service interval shortened from 5 h to 4 h after IR-003. Scrubber fan now reports its cycle to the console telemetry.', refs: ['IR-003', 'D-112'] },
  { id: 'MR-009', type: 'MAINT', title: 'BT3 vent valve seat replacement', date: '2041-09-05', pilot: 'Halvard Brenn',
    body: 'Replaced the aft-port vent seat and inspected all four. BT1 seat showed early wear and was replaced on the same lift.', refs: ['IR-006', 'D-127'] },
  { id: 'MR-011', type: 'MAINT', title: 'Thruster duty-cycle limiter', date: '2041-11-02', pilot: 'Halvard Brenn',
    body: 'Added a 90 % thermal duty limiter to all four thrusters in the helm software. The console now shows thruster load as a live bar.', refs: ['IR-008'] },
  { id: 'MR-014', type: 'MAINT', title: 'Sphere seat ring inspection', date: '2042-02-24', pilot: 'Halvard Brenn',
    body: 'Seat ring inspected after the Epsilon dives. Relaxation marks match the creak events. Resonance at 41 Hz confirmed on the bench. No action beyond monitoring.', refs: ['D-140', 'D-142', 'IR-011'] },
  { id: 'MR-018', type: 'MAINT', title: 'Main lamp breaker replacement', date: '2042-06-03', pilot: 'Halvard Brenn',
    body: 'Cold-welded breaker replaced with a sealed unit. Emergency lamps rewired to a separate bus.', refs: ['IR-014', 'D-169'] },
  { id: 'MR-022', type: 'MAINT', title: 'Dive computer profile replay certification', date: '2043-03-10', pilot: 'Halvard Brenn',
    body: 'Profile replay certified for verified routes only. Replay runs each waypoint\'s ballast sequence at processor speed but never commences final descent — that remains a pilot action.', refs: ['D-158'] },
  { id: 'MR-027', type: 'MAINT', title: 'Strain gauge 3 recalibration', date: '2044-01-25', pilot: 'Halvard Brenn',
    body: 'Gauge 3 read 1.4 % high. Recalibrated and cross-checked against 1 and 2. Lockout threshold left unchanged: it did its job.', refs: ['IR-019', 'D-173'] },
];

export const ARCHIVE_BY_ID = Object.fromEntries(ARCHIVE.map(e => [e.id, e]));

export const ARCHIVE_TYPES = {
  DIVE: 'Dive record',
  CREW: 'Crew log',
  INCIDENT: 'Incident report',
  DISCOVERY: 'Discovery',
  MAINT: 'Maintenance',
};

// Operator reference content
export const REFERENCE = [
  { h: 'What this console is', p: 'The pilot console of DSV-7 Cerulean Lantern, the Hadal Threshold Institute\'s single-pilot bathyscaphe. You fly the vessel down a descent profile of seven depth holds, then commence the final descent to a Threshold ring and open the pressure-hull aperture.' },
  { h: 'Core dial (two clusters)', p: 'DESCENT PROFILE (left): select seven strata glyphs in increasing depth. Each selection floods ballast, overshoots, and settles into a neutral-buoyancy hold at the exact depth — that settle is the lock. HELM (bottom): COMMENCE FINAL DESCENT is the only activation control; EMERGENCY ASCENT blows all ballast and is never disabled.' },
  { h: 'The gauge', p: 'The ring around the observation sphere is the crush-depth instrument: current depth against the 11 000 m rated depth, with the red band above it. Locked waypoints appear as ticks; the planned profile is drawn as a faint arc to the target.' },
  { h: 'Activation stages', p: 'BUILDUP — descent accelerates, hull load climbs, light fades. BREAKTHROUGH — the ring answers and the aperture opens. SUSTAINED — stable hold inside the ring with live telemetry. Locking the seventh waypoint never activates anything by itself.' },
  { h: 'Dive computer', p: 'Replays a logged profile from the vessel\'s own dive computer at processor speed — each waypoint still floods and settles, just faster. Verified profiles are audited; experimental routes carry margin warnings. Replay ends in the same pending state; it never commences descent.' },
  { h: 'Hull-integrity lockout', p: 'A safety interlock that inhibits final descent. It is released by default every time the console loads. If engaged, the helm flashes red and the commence control refuses.' },
  { h: 'Secondary panels', p: 'ARCHIVE — cross-referenced dive, crew, incident, discovery and maintenance records; entries you have read are marked and remembered. VESSEL — engineering cross-section with live tank and thruster state. DIVE COMPUTER — logged profiles and your own persisted dive history. SESSION LOG — timestamped record of your actions. SETTINGS — density, motion, audio layers, colour mood.' },
  { h: 'Time compression', p: 'Dive time runs at ×240 compression so a full profile fits a few minutes of console time: one real second is four dive minutes. Vertical speed is reported in dive-time metres per minute. Dive-computer replays run at processor speed and show REPLAY instead of a rate.' },
  { h: 'Persistence', p: 'Preferences, dive history and read archive entries are stored in this browser\'s localStorage only. No server, no network. Clear them from Settings.' },
];
