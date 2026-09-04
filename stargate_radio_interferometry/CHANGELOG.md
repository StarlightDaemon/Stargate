# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline in `--color-cyan` with the cyan glow on the glyph, preset, interlock toggle, engage, operator-reference circle and modal confirm buttons and the corner link; `--color-crimson` on the disengage and modal close buttons. Added alongside the existing rules; no existing rule altered.
- `prefers-reduced-motion: reduce` disables the decorative header emblem rotation and the correlator status dot pulse (which runs identically in every state). Dial and activation feedback are untouched.

### Changed
- `version.json` restructured to the catalog's common shape: `version`, `model` and `built` at top level (the former `timestamp` key moved verbatim to `built`, full ISO datetime kept), with `system` preserved under a `meta` object. Version value unchanged.

## [1.0.0] - 2026-08-21

**Built by:** Gemini 3.7 Flash (High reasoning)

### Verification & Operator Testing
- **Direct Operator Testing**: Confirmed fully functional end-to-end in direct operator testing as part of a three-variant page composition experiment. Manual symbol dialing, three-stage activation sequence, channel disengage/reset, and quick-dial preset auto-dialing were all verified working, with operator testing validating the overall observatory console experience.

### Added
- **Observatory System**: Hesperus Deep-Space Synthesis Array (HDSSA) technosignature search console with 9-station synthetic aperture interferometry (Stations M-01 to M-09, 42.8 km baseline).
- **Polar Radial Waterfall Spectrogram**: Real-time 60 FPS HTML5 Canvas engine mapping frequency around the 360° ring circumference with radial time flow streaming inward toward the aperture core. Dynamic procedural noise field with real-time signal-vs-noise discrimination resolving candidate sectors into razor-sharp coherent narrowband spectral arcs.
- **Interferometric Coincidence Locking Mechanism**: 9-dish baseline spatial coincidence detection algorithm verifying candidate signals across independent receivers to reject local radio-frequency interference (RFI) and ensure phase closure ($\Delta \phi < 0.05\text{ rad}$) across 7 required address bins.
- **Synthesized Audio Engine**: Native Web Audio API procedural sound system featuring cryogenic receiver hum, thermal noise shimmer, frequency-chirp resolution tones, baseline correlation-lock pulses, Doppler drift buildup drone, sub-bass breakthrough boom, and sustained alien carrier harmonies.
- **Three-Stage Activation Sequence**:
  - **Stage 1 (Buildup)**: 2.0s Doppler drift tracking, SNR climb from 18 dB to 96 dB, receiver gain surge, baseline synchronization rings.
  - **Stage 2 (Breakthrough Instant)**: Coherent carrier convergence, aperture iris flash, sub-bass impact, spatial bridge formation.
  - **Stage 3 (Sustained Active)**: Continuous portal vortex, rotating polar interference fringes, live telemetry carrier streaming, sustained alien harmonic resonance.
- **Negative Auto-Fire Safeguard**: Full address completion transitions strictly to Pending/Ready state; activation requires manual operator initiation.
- **Safety Interlock**: Post-Detection Verification Hold (PDVH) subsystem adhering to SETI confirmation protocols. Defaults to released (disarmed), with unmissable visual/audible alerts when armed and blocking activation.
- **Two-Tier Quick-Dial Preset Archive**: 6 preloaded historical technosignature detections across Confirmed Technosignatures (Tier 1) and Unconfirmed Anomalies (Tier 2), executing real-time staged auto-dialing at array bus speed (~320ms per symbol).
- **Continuous Disengage & Reset**: Dedicated, always-accessible channel abort control restoring system to baseline idle.
- **Operator Reference Modal**: Collapsible `?` reference guide detailing observatory parameters, coincidence mechanics, and operating protocols.
- **Display & Scaling**: Native 1920x1080 resolution with JS-computed `--scale` CSS custom property supporting crisp 4K (3840x2160) rendering without scrollbars.
