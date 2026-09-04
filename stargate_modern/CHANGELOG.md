# Changelog

All notable changes to the Modern Gate Console (stargate_modern) are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/).

## [Unreleased] — catalog maintenance pass (2026-09-04)

**Built by:** Claude Sonnet 5 (catalog-wide keyboard-focus and reduced-motion CSS pass, 2026-09-04). Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diff. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline in `--cyan` with the cyan glow on the nav tabs, help-ref, preset, tool, glyph-key, power, iris, info load/fast, log filter, db load/fast, modal close and alert close buttons and the db search field, db filter select and settings inputs; `--amber` on the lock button; `--ruby` on the engage button; and cyan on the corner credit link. Added alongside the existing rules; no existing rule altered. No reduced-motion rule was added.

## [Unreleased] — proposed 1.0.1 (2026-08-07 repair pass)

Full interactive verification and repair pass against the v1.0.0 completion
report. All fixes verified with hit-tested real DOM events at 1920x1080 and
3840x2160.

### Fixed

- **Core dial (critical): ring rotation limit-cycle stall.** The ring's
  fixed minimum rotation step (0.015 rad/frame) was larger than its snap
  window (0.005 rad), so whenever the terminal residual landed between them
  the ring overshot back and forth forever. In practice nearly every glyph
  rotation stalled, wedging the gate in LOCKING permanently (motor sound
  stuck on, no recovery). The ring now snaps to target once the remaining
  distance is within one step.
- **Iris status UI inverted.** The seal/retract labels were rendered once,
  synchronously at click time, from `openProgress` — which had not moved
  yet — so a sealed iris read "OPEN / RETRACTED" and vice versa, permanently.
  The UI now follows the commanded state (SEALING... / SEALED / RETRACTING...
  / OPEN) and re-renders when the blade stroke completes.
- **Reduced Motion setting was a no-op.** The toggle set a `reduced-motion`
  body class that no CSS rule or JS code ever honored. It now neutralizes
  decorative animations/transitions and skips the ring's cinematic
  multi-spins.
- **Mission ledger: unfilterable categories.** DISENGAGE, INFO and WARN
  entries were invisible to every filter except ALL (and INFO/WARN badges
  were unstyled). DISENGAGE now folds into the IGNITE filter, INFO/WARN into
  SYSTEM, and both badges have styles.
- **Database search ignored the sector field** despite the placeholder
  advertising it ("Search designation, sector, notes...").
- **Fast-dial / lock-sequence races.** Starting a fast dial over an active
  or locking gate left the previous sequence's async chain and settle timers
  running: two lock chains could interleave, the old disengage timer could
  force the gate to IDLE mid-lock, and an abort during ignition could be
  resurrected to ACTIVE by the stale ignition timer. All sequence callbacks
  now carry a generation token and all settle timers verify state before
  applying; stale clamp-lock impulses can no longer resurrect cleared clamps.
- **Claimed iris safety interlock was missing.** ENGAGE now refuses to
  ignite through a deployed containment iris (warn alert + ledger entry),
  matching the documented "no unshielded transit" interlock. The default
  core loop (iris retracted) is unaffected.
- **Star-chart conduit beam missing for pre-existing wormholes.** The map is
  created lazily on first tab visit and was never seeded with an
  already-active destination, so its live transit conduit never appeared
  unless the map had been opened before dialing.
- **Powering off an idle gate** no longer flashes a DISENGAGING badge and
  logs a phantom "bridge collapsed" ledger entry.
- **Engaged-destination identity survives buffer edits.** The destination is
  captured at lock time, so clearing the input buffer while LOCKED no longer
  downgrades the subsequent wormhole to "CUSTOM-VEC".

### Added

- **Proportional 4K scaling.** New `#app-stage` wrapper + `fitStage()`:
  above the 1920x1080 design box the whole console scales proportionally
  (e.g. 2x at 3840x2160) with canvas backing stores scaled to stay crisp; at
  or below 1080p the native layout is unchanged. Canvas sizing and star-chart
  mouse math are stage-scale aware.
- `.claude/launch.json` dev-server config (`aeris`, port 8259).

## [1.0.0] - 2026-08-07

**Built by:** Mixed - Claude Fable 5 (initial build), later modified by Gemini 3.1 Pro

### Added

- **AERIS OS v4.8.2 Control System**: Ultra-modern, dark-mode mission control interface for the ASTRAEA Deep Resonance Laboratory (ADRL-04) Mount Erebus Polar Deep Site.
- **Harmonic Vector Annulus (HVA-900 / The Vector Ring)**:
  - Functioning mechanical display mechanism featuring a motorized rotating 20-glyph coordinate ring with inertial easing and sound.
  - Seven high-voltage harmonic stator clamps (Apex, Alpha, Beta, Gamma, Delta, Epsilon, Zeta) with radial strobe alignment, electric arcing, and luminous locked states.
  - Real-time radial Fourier oscilloscope visualizing carrier frequency stability and vector harmonics on the inner rim.
  - Multi-stage event horizon & wormhole singularity canvas with quantum foam idle state, superluminal plasma shockwave ignition burst, chromatic refraction, and stabilized vortex dynamics.
- **Containment Iris & Energy Barrier**:
  - Independent 12-blade titanium diaphragm shield with smooth sliding trigonometric geometry.
  - Safety interlocks preventing unshielded transit or hazardous aperture cycling.
- **Strict Two-Cluster Core Loop**:
  - Cluster 1: Coordinate Vector Dialpad with 20 original geometric glyphs and 6-slot vector buffer.
  - Cluster 2: Gate Power & Aperture Ignition console meeting the <= 7 discrete action budget from cold start to wormhole transit.
- **Emergency Automated Fast-Lock Protocol (EAFP)**:
  - Fast-dial preset system with pre-calibrated subspace harmonics for instant 1-click gateway engagement.
- **Searchable & Filterable Destination Database**:
  - 24 fictional destinations with rich metadata: Sector, Distance (LY), Environment, Threat Class, Address Glyphs, Carrier Frequency, and Stability Index.
- **Interactive Subspace Star-Chart / Network Map**:
  - Real-time Canvas orbital radar projection with pan/zoom, coordinate grids, stellar nodes, and glowing active subspace transit conduits.
- **Live Telemetry & Diagnostics**:
  - Real-time simulated physics engine tracking Power Bus (MW), Capacitor Charge (%), Vector Stability Index, Wave Tension, and live sparkline graphs.
- **Mission Activity & Dial Ledger**:
  - Chronological event stream with microsecond timestamps and level filtering.
- **Web Audio Procedural Synthesizer**:
  - 100% synthesized sound engine: motor rotation whirs, clamp lock clacks, resonant harmonic chimes, vortex plasma hum, hydraulic iris actuation, and alert beeps (zero external asset files).
- **System Settings & Customization**:
  - Full audio volume mix controls, UI density toggles, motion reduction, CRT scanline overlay, and glow bloom controls.
- **Operator Reference Modal**:
  - Fixed top-right circular `?` reference manual with complete in-universe operational instructions.
- **Static Attribution & Version Display**:
  - Bottom-left `StarlightDaemon` external link and bottom-right `v1.0.0` label.
