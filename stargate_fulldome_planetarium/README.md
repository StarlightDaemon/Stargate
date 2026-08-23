# VXD-9000 Chrono-Celestial Projector Console
**Mount Tycho Zenith Fulldome Observatory & Public Sky Theatre** (`stargate_fulldome_planetarium`)

> **Operator Testing Confirmation:** Direct operator testing confirmed the build is fully functional end-to-end—manual dial, three-stage activation, disengage, and quick-dial auto-dial all operating cleanly as intended. This build was developed under freeform creative latitude (no prescribed composition, mechanism, or reuse restrictions beyond standing project functional requirements) as part of an experiment testing whether reduced prescriptive detail affects build quality.

---

## System Overview
The **VXD-9000 Chrono-Celestial Projector** is an interactive sky-projection instrument designed for high-resolution fulldome dome synthesis and real-time celestial ephemeris dialing.

### Key Architecture
- **Zenith Optical Collimator Ring**: 12 original celestial ephemeris sectors with motorized gear cage and 0–360° azimuth vernier indexing.
- **5-Vector Ephemeris Lock**: Real-time address buffer locking sectors into pending projection state.
- **Three-Stage Activation**: Buildup (~1.8s) -> Iris Breakthrough (~0.4s) -> Sustained Active Projection (10,800+ dynamic multi-spectral stars, volumetric nebulae, and laser projection rings).
- **Safety Interlock**: Defaults to **RELEASED / ARMED**.
- **Quick-Dial Archive**: 6 preloaded presets across 2 tiers (Public Sky Theatre Shows & Deep-Sky Archaeo-Astrophysics) with step-by-step animated auto-dialing.
- **Always-Reachable Disengage**: Emergency shutter reset operational across all system states.
- **Audio Engine**: 100% synthesized procedural Web Audio API soundscape.

## Local Execution
- Start server: `node scripts/server.js`
- Test suite: `node scripts/verify_e2e.js`
- Access console: [http://localhost:8092](http://localhost:8092)
