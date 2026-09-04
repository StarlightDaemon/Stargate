# Changelog

All notable changes to the Aethel-Ring Collider (ARC) Synchrotron Portal Gateway will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-09-04

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline (2px `--neon-cyan`, 3px offset) with a cyan glow on every `button`, the corner attribution link and range inputs, plus a cyan outline on the `.toggle-switch-label` when the quench-interlock checkbox is focused. Added alongside the existing rules; no existing rule altered.
- `prefers-reduced-motion: reduce` slows the collider badge pulse to 12s. Dial and activation feedback are untouched.

### Fixed
- The quench-interlock toggle checkbox (`.toggle-switch-input`) was `display: none`, which removed it from the accessibility tree and the tab order. It is now visually hidden instead (1px, clipped, absolutely positioned inside `.toggle-switch-container`, which became `position: relative`), so it is reachable by Tab and toggles with Space while the styled label still draws it.

### Changed
- Test harness `verify.js`: the hardcoded Chrome path constant was replaced by `resolveChrome()`, which takes `CHROME_PATH` or `PUPPETEER_EXECUTABLE_PATH`, falls back to puppeteer's own `executablePath()`, and otherwise fails with an explicit error naming `CHROME_PATH`. It now also writes its run log to the gitignored `test/test_results.json`, created on demand, instead of `test_results.json` at the build root. Harness only; runtime unchanged.

## [1.1.0] - 2026-08-15

**Built by:** Claude Opus (auto-dial staging fix; original build by Gemini 3.7 Flash (High Reasoning))

### Fixed
- **Quick-Dial Instant-Jump Bug**: `loadTargetCoordinates` previously assigned all 6 locked sectors wholesale and set `ARMED` synchronously, bypassing the per-sector dipole lock audio, coil-intensity ramp, and canvas lock progression that manual steering uses.
- **Injection Sequencer Replay**: quick-dial targets now step each sector through the exact same select/engage lock path as a manual dial (`selectSector` + `engageSelectedSector`), one dipole every 300ms — in-universe, even with pre-computed target optics the superconducting dipoles must energize in ring order; the injection sequencer steps them at machine cadence rather than operator speed.
- Replay lands in the identical `COLLISION ARMED` state as manual steering and **never auto-fires** the collision (asserted at completion +1s, portal radius 0, trigger enabled but unpressed).
- `EMERGENCY BEAM DUMP` (and lattice clear / step-back) remains fully functional **during** a replay: aborting mid-sequence cancels all pending sequencer steps and returns cleanly to `STANDBY` (new automated test).

### Changed
- Verification suite: added staged-replay sampling test, two mid-replay screenshots at distinct lock counts, and a mid-replay beam-dump test; registry quick-dial assertion re-timed for the ~1.8s sequencer; corner version tag assertions updated to v1.1.0.

## [1.0.0] - 2026-08-15

**Built by:** Gemini 3.7 Flash (High Reasoning)

### Added
- **Aethel-Ring Collider (ARC) Core Control Room**: Synchrotron particle accelerator control interface for the Aethelgard High-Energy Inversion Laboratory (AHEIL).
- **Physics-Accurate Synchrotron Ring Visualization**: 16-sector superconducting bending magnet ring, ultra-high vacuum beam channel, circulating relativistic particle bunch visualization with synchrotron radiation emission.
- **Transverse Lattice Vector Steering**: 6-sector steering dipole coordinate locking mechanism grounded in beam dynamics and transverse phase-space phase-matching.
- **Visible Collision Event Particle Tracker**: Dynamic canvas rendering counter-propagating beam collisions, Cherenkov ionization rings, relativistic hadronic jet tracks, muon drift lines, and quantum topological portal horizon at Aperture Zero.
- **Never Auto-Fire Safety Guarantee**: Locking the 6th sector arms the beam into a `COLLISION ARMED / PENDING` state without auto-firing; activation is strictly triggered by manual operator input on the dedicated `TRIGGER BEAM COLLISION` control.
- **Always-Reachable Beam Dump / Disengage**: Instantaneous beam abort switch that dumps the circulating beam into the graphite absorber block and resets the lattice.
- **Quench Protection Safety Interlock**: Subsystem that defaults to RELEASED (inactive). When active, it immediately blocks beam injection with high-visibility trip banners and audible cryogenic warning alarms.
- **Full Web Audio Synthesis Engine**: Zero external audio dependencies. Procedural superconducting magnet coil hum, stochastic Poisson particle detector clicks, RF cavity acceleration chirps, sub-bass collision crescendo, and cryogenic helium venting.
- **Collision Target Registry**: Searchable, filterable catalog of 14 calibrated destination nodes across Tier 1 (Validated Leptonic Channels), Tier 2 (Heavy Hadronic Resonances), and Tier 3 (Exotic Singularity Inversions) with 1-click Quick-Dial.
- **Synoptic Tunnel Schematic**: Alternate live view displaying the linear booster injector, RF acceleration cavities, quadrupole doublet lattice, and real-time Betatron phase-space oscillation plot.
- **Diagnostic Telemetry Dashboard**: Real-time updating telemetry for Beam Energy (TeV), Peak Luminosity, Magnet Current (kA), Superfluid Cryogenic Helium Temperature (K), and Ultra-High Vacuum Pressure (mbar).
- **Collision Event History Ledger**: Timestamped log recording integrated luminosity, invariant mass resonances, and beam dump records.
- **Operator Reference Manual (`?`)**: Modal walk-through for manual steering, quick-dialing, quench protection, and beam abort protocols.
- **Responsive 1080p/4K Layout**: Dynamic unitless scale calculation (`--ui-scale`) preventing CSS unit division bugs, corner attribution link (`StarlightDaemon`), and version tag (`v1.0.0`).
