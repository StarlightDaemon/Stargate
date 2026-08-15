# Changelog

All notable changes to the Aethel-Ring Collider (ARC) Synchrotron Portal Gateway will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
