# Changelog

All notable changes to the Stargate Celestial Astrolabe build will be documented in this file.

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline in `--accent-cyan` with the cyan glow on the help, star-select, quick-dial item, tab, footer link, modal close and primary-action buttons and the almanac input/select; `--accent-crimson` on the disengage button and chip-remove control; and cyan on the custom switch's visible `.slider`, checkboxes and range inputs. Added alongside the existing hover rules; no existing rule altered.

### Changed
- `version.json` restructured to the catalog's common shape: `version` and `model` at top level, with `build`, `institute` and `vessel` preserved verbatim under a `meta` object. No date key existed, so no `built` field was added. Version value unchanged.
- Test harnesses `diag.js` and `test_e2e.js` (raw CDP, no puppeteer launch): the hardcoded Chrome path constant was replaced by `resolveChrome()`, which takes `CHROME_PATH` or `PUPPETEER_EXECUTABLE_PATH`, falls back to a dynamically imported puppeteer/puppeteer-core `executablePath()`, and otherwise fails with an explicit error naming `CHROME_PATH`. `test_e2e.js` additionally drops its hardcoded Windows temp-folder profile directory in favour of `os.tmpdir()`. No absolute local path remains in either harness. Harness only; runtime unchanged.

## [1.0.0] - 2026-08-22

> **Operator Verification Note:** Direct operator testing confirmed the build fully functional end-to-end — manual star-fix dialing, three-stage activation (Buildup, Breakthrough, Sustained Active), disengage field collapse, and quick-dial auto-dialing sequence were all verified working, along with all secondary telemetry panels (Horizon Sky-Dome, Dead-Reckoning Plotter, Deep Ephemeris Catalog, and Instrument Settings).

### Added
- **Astrometric Navigation Console**: Digital Rete Astrolabe positioning instrument for the Hyperion Astronavigation Institute (*R/V Tethys-V // Bridge Series IX*).
- **Functioning Digital Astrolabe**:
  - Interactive stereographic Tympan plate with almucantars (circles of equal altitude), azimuth radials, celestial equator, and sighting meridian.
  - Rotating star wheel (Rete) bearing 12 navigational star pointers with authentic astronomical metadata.
  - Rotational alignment locking mechanism: star wheel physically rotates to align star markers with target altitude circles to confirm optical locks.
- **7-Star Celestial Position Fix Engine**:
  - Mathematical Marcq Saint-Hilaire intercept matrix solver computing Galactic Latitude, Longitude, Heading Gyro, and Intercept Residuals.
  - Fix confidence telemetry dynamically updating with each sighted star.
- **Three-Stage Gateway Actuation**:
  - Staged progression: Buildup (1.8s converging telemetry & servo ramp) -> Breakthrough (optical singularity & warp aperture dilation) -> Sustained Active (stabilized conduit vortex & streaming coordinate vector).
  - Explicit pending state upon 7th star alignment with zero auto-fire.
  - Emergency Disengage control operable across all states.
- **Quick-Dial Preset Sequencer**:
  - 6 preloaded logs across Tier-1 (Verified Fixes) and Tier-2 (Provisional Sightings).
  - Genuine sequential auto-dial execution (~300ms/star) with real Rete rotational motion, landing in pending state without auto-firing.
- **Ephemeris Verification Hold (Safety Interlock)**:
  - Defaulting to Released; blocks gateway actuation when engaged with high-visibility warning annunciator.
- **Secondary Astrometric Navigation Panels**:
  - Horizon Sky-Dome projection (real-time altitude/azimuth sky dome with horizon line).
  - Dead-Reckoning & Inertial Drift Plotter (inertial track vs stellar fix intercepts).
  - Deep Ephemeris Star Catalog (searchable/filterable 40+ star database).
  - Synthesizer & Instrument Settings (volume, servo pitch, scanline effects, UI density).
- **Procedural Web Audio Synthesizer**:
  - Pure Web Audio API generating gimbal servo motors, star-lock harmonic chimes, computation data chirps, reactor drone, buildup risers, breakthrough warp bursts, and sustained portal resonance.
- **Operator Reference Overlay & Attribution**:
  - Circular `?` reference manual modal.
  - StarlightDaemon repository link (`https://github.com/StarlightDaemon`).
  - Strict 1920x1080 non-scrolling baseline scaling to 4K (3840x2160).

**Built by:** Gemini 3.7 Flash
