# Changelog

All notable changes to the **VXD-9000 Chrono-Celestial Projector Console** (`stargate_fulldome_planetarium`) will be documented in this file.

## [1.0.0] - 2026-08-22

**Built by:** Gemini 3.7 Flash (High Reasoning)

> **Operator Testing Confirmation:** Direct operator testing confirmed the build is fully functional end-to-end—manual dial, three-stage activation, disengage, and quick-dial auto-dial all working as intended. This system was developed under freeform creative latitude (no prescribed composition, locking mechanism, or reuse constraints beyond standing project functional baselines) as part of an experiment testing whether reduced prescriptive detail affects build quality and reasoning depth.

### Overview
Initial operational release of the Mount Tycho Zenith Fulldome Observatory & Public Sky Theatre control interface. The VXD-9000 is an optomechanical star-ball and hex-laser fulldome celestial projection instrument designed for high-resolution deep-sky synthesis and real-time celestial ephemeris dialing.

### Key Features & Subsystems
- **Zenith Optical Collimator & Star-Ball Aperture Ring**:
  - 12 original celestial ephemeris sectors with optical reticles, azimuth angle vernier indexing (0-360°), and fiber-optic star-channel bezels.
  - 5-node Ephemeris Vector Lock mechanism with physical stepper servo alignment and mechanical focus lock.
- **Three-Stage Zenith Activation Sequence**:
  - **Stage 1: Buildup (~1.8s)**: High-voltage xenon pre-charge, starball rotation acceleration, laser pump spin-up, rising harmonic frequency sweep.
  - **Stage 2: Breakthrough (~0.4s)**: Dramatic zenith iris detonation, optical lens bloom shockwave, sub-bass resonant glass chime.
  - **Stage 3: Sustained Active**: Real-time rendering of 10,800+ dynamic twinkling multi-spectral stars, rotating celestial coordinate grid, glowing volumetric nebulae, and laser fisheye projection rings.
- **Safety Interlock System**:
  - High-Flux Xenon-Laser Shutter Interlock defaulting to **RELEASED / ARMED (Safe to Emit)**.
- **Quick-Dial Automated Ephemeris Archive**:
  - 6 presets categorized into 2 operational tiers:
    - *Tier 1: Public Educational Sky Shows* (Solstice Midnight Apex, Perseid Meteor Zenith, Boreal Aurora Veil)
    - *Tier 2: Deep-Sky Archaeo-Astrophysics* (Pleiades Void Horizon, Galactic Core Sagittarius-A*, Carina Nebula Micro-Lensing)
  - Full animated sequential auto-dialing (~400ms per glyph) that halts in PENDING state without auto-firing.
- **Always-Reachable Disengage Control**:
  - Emergency Dome Shutter Reset operational during dialing, auto-dialing, pending, buildup, and active projection states.
- **Two Core Control Clusters**:
  - `Ephemeris Sector Dialing Array` (Ring selector nodes)
  - `Zenith Master Console` (Interlock toggle, Emission Trigger, Emergency Reset)
- **Web Audio API Procedural Synthesizer**:
  - 100% synthesized sound design: stepper clicks, optical locks, buildup turbine whining, breakthrough chime, sustained cosmic harmonic drone, damper release clunk.
- **Responsive 1080p / 4K Scaling Engine**:
  - Clean virtual 1920x1080 resolution scaled dynamically via bare custom property `--app-scale` with crisp canvas rendering.
- **Operator Reference Modal (`?`) & Corner Displays**:
  - Top-right circular technical documentation modal.
  - Bottom-left `StarlightDaemon` external link (`rel="noopener noreferrer"`).
  - Bottom-right version identifier (`v1.0.0 // VXD-9000`).
