# Changelog

All notable changes to the Aeolos Stagnation Plenum (ASP-9) Transonic Aerodynamic Test Console will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-03

**Built by:** Gemini 3.8 Flash (High Reasoning)

### Added
- **Aeolos Stagnation Plenum (ASP-9) Test Console**: Transonic and supersonic aerodynamic wind tunnel control interface for the Aeolos High-Speed Aerodynamics Laboratory.
- **Variable-Pitch Flow-Straightener Vane & Pitot Stagnation Lock**: 12-sector circular nozzle dial ring doing genuine physical-fluidic work as symbols lock. Each sector pivot-steers flow-straightener guide vanes into calibrated pitch angles, resolves pitot-static differential pressure to stagnation equilibrium (0.00 kPa), and transitions boundary layer telemetry from turbulent vortex jitter (`TURB`) to razor-sharp laminar coherence (`LAM`).
- **Real-Time Vector Schlieren & Shadowgraph Flow Canvas**: High-performance procedural optical visualization rendering horizontal subsonic-to-supersonic flow streamlines, Prandtl-Meyer expansion fans, transonic normal shocks, and supersonic diamond shock wave lattices across the central test section.
- **Never Auto-Fire Safety Guarantee**: Locking the 6th sector brings the console into a `PLENUM ARMED / READY TO FIRE` state with zero premature activation; activation is strictly triggered by explicit operator engagement of the dedicated `INITIATE TRANSONIC RUN` control.
- **Three-Stage Activation Sequence**:
  - *Stage 1: Buildup Phase* (2.2s): Centrifugal compressor spool-up, Mach ramp ($0.20 \to 0.95$), dynamic pressure surge, vibrating streamlines, and rising pneumatic compressor whine.
  - *Stage 2: Breakthrough Instant* (0.5s): Transonic Mach 1.0 crossing, Prandtl-Glauert optical condensation flash, expanding annular vortex shock burst, and resonant sonic boom snap.
  - *Stage 3: Sustained Active State*: Continuous supersonic flow at Mach 1.45, stable diamond shock lattice, steady deep resonant tunnel roar, and 6-component strain-gauge balance oscillation in steady aerodynamic trim.
- **Always-Reachable Emergency Blowdown Dump**: Prominent hazard-striped abort lever that instantaneously vents plenum stagnation pressure, resets guide vanes to neutral, and returns the console to standby from any state.
- **Choke Gate Safety Interlock**: Subsystem defaulting to RELEASED. When engaged, it inhibits tunnel flow initiation with high-visibility amber/black hazard striping and acoustic klaxon alarms.
- **Aerodynamic Test Matrix Registry with Paced Auto-Dial**: Calibrated destination run profiles (`NACA-0012 Transonic Calibration`, `Supercritical Wing Polar`, `Waverider Hypersonic Sweep`) that step each symbol at authentic machine cadence (~350ms per sector) with staged motion and sound, landing armed without auto-firing.
- **Asymmetric Horizontal Wind Tunnel Composition**: Breaking the standard symmetric top/hero/wings layout by orienting the interface along an authentic wind tunnel axis: multi-tube manometer bank, horizontal test chamber with circular nozzle gateway, top-right azimuth dial cluster, mid-right run master console, and bottom-right 6-axis strain-gauge balance polar.
- **Pure Web Audio API Synthesis Engine**: Zero external audio dependencies. Procedural pink-noise wind rush, variable-frequency compressor spool whine, pneumatic solenoid vane clicks, resonant sonic boom impulse, and safety klaxons.
- **Dynamic Unitless CSS Scaling**: Robust responsive scaling calculating `--ui-scale` dynamically in JavaScript, preventing CSS unit division pitfalls, tested across standard desktop (1920x1080) and simulated 4K (3840x2160) viewports.
