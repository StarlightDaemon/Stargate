# Changelog

All notable changes to the Argos DeepScope Interferometric Technosignature Console will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Shared source preview — 2026-11-08

**Performed by:** Codex maintenance session.

- Routed `npm run dev` through shared loopback serving, preserving default port `5173` with `PORT`, `--port` and `-p` overrides. Documented the owned original-suite qualification command.
- Preserved dependency declarations, lockfiles and Vite build output. The retained built-preview specialist path now explicitly binds `127.0.0.1:4173` and fails on port conflicts.
- Both transports passed the full original suite, 15 public assets and strict cancellation/restart checks in run `42514572291`, job `128834661714`. Shared serving and cleanup passed. The isolated historical Vite security listener exceeded its 10-second close bound and was terminated as a recorded **FAIL**; that baseline cleanup failure remains visible and is not a functional-suite failure.
- This source security migration does not grant built-artifact, sound, operator, merge or deployment acceptance.

### Shared verification dependencies — 2026-11-08

- Removed duplicate `puppeteer` declarations in favor of the repository's locked development tools. Package commands and non-dependency metadata are preserved; install shared tools with `npm ci --ignore-scripts` at the repository root before browser verification.
- Adopted exact npm-generated manifest and lockfile bytes from hosted run `42512175752`, job `128827397973`, after byte-count and SHA-256 verification. This candidate passed clean install, installed-tree validation, native CommonJS/ES-module resolution and a full audit with zero findings.
- Raised the existing Vite 6 minimum to `^6.4.4` and refreshed `source-map-js` within supported ranges. Vite commands and build behavior remain unchanged by this dependency patch; serving security is a separate qualification.
- This dependency qualification does not grant functional, visual, sound, operator or release acceptance. Existing known issues and historical operator dispositions are preserved; merge and deployment remain on HOLD.

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline in the theme's own `--accent` (so it follows the cyan/amber/emerald/violet palette) with the accent glow on every `button`, `a` and `input`. Added alongside the existing rules; no existing rule altered.
- `prefers-reduced-motion: reduce` slows the header emblem ring and aperture lens rings to 90s, the emblem core to 8s, and the status/alert heartbeat dots and toast icon to 4s. The amber dish-verification pulse, the engage pulse and the JS-driven stage transitions are untouched.

### Changed
- `version.json` restructured to the catalog's common shape: `version`, `model` and `built` at top level (the former `build_model` key renamed to `model` and `release_date` moved to `built`, values kept verbatim), with `name`, `short_name`, `array_elements`, `address_length`, `default_safety_hold` and `observatory` preserved under a `meta` object. Version value unchanged.

### Browser icon compatibility — 2026-11-08

**Performed by:** Codex maintenance session.

- Added a local SVG favicon using the existing palette and deep-space receiver motif,
  with an explicit HTML icon link to prevent the missing favicon request.

### Preset cancellation correction — 2026-11-08

**Performed by:** Codex maintenance session.

- Disengage now cancels the pending dish-verification timer and invalidates old
  dialing callbacks, preventing a cancelled preset from restoring a carrier or
  interfering with a newly started sequence. Normal dish pacing and activation
  stages remain unchanged; original builder attribution is preserved.

## [1.0.0] - 2026-08-22

**Built by:** Gemini 3.7 Flash (High reasoning)

> **Direct Operator Verification:** Confirmed fully functional end-to-end via direct operator testing as part of a three-variant page composition experiment. Manual 7-carrier dialing, 10-dish coincidence verification, 3-stage aperture activation sequence (Buildup, Breakthrough, Sustained Active), disengage/flush cycles, and quick-dial auto-dialing were verified working as intended. Testing also validated the broader integrated experience beyond the core loop, including the Signal Classification & RFI Triage Lab, 10-Dish Physical Array Geometry Map, 25+ Record Historical Archive, and display/audio theme settings.

### Added
- **Observatory Identity**: Argos DeepScope Interferometric Synthesis Observatory (ADISO) & Sector Tau-7 Deep Technosignature Array.
- **Polar Waterfall Spectrogram Ring**: Real-time canvas-driven 360-degree frequency allocation with radial waterfall stream, shifting cosmic noise floor, and live candidate narrowband arc resolution.
- **10-Dish Multi-Baseline Coincidence-Locking Mechanism**: 10-dish synthetic baseline cross-correlation ($D_{01}$ to $D_{10}$) verifying spatial coincidence and phase coherence against terrestrial RFI before locking each coordinate into the 7-slot address register.
- **Novel Sonic Architecture (Web Audio API)**: Cryogenic HEMT cooler cycle, dish-tracking servo pulses, 10-step harmonic coincidence ticks, crystalline coordinate lock chimes, RFI rejection buzz, 3-stage activation buildup Shepard sweep, breakthrough singularity chord, and active relativistic aperture drone.
- **Three-Stage Activation Sequence**: Timed, distinctly observable sequence through Stage 1 Buildup (1.8s, SNR ramp to 99.4 dB, cryogenic surge), Stage 2 Breakthrough (0.8s, singularity beam flash, phase breakthrough), and Stage 3 Sustained Active Technosignature Link with relativistic event horizon dynamics.
- **Post-Detection Verification Hold**: Safety interlock subsystem defaulting to **RELEASED**, enforcing SETI Protocol 4 multi-array confirmation when engaged.
- **Quick-Dial Archived Database**: 6 preloaded targets across Tier 1 (Verified Technosignatures) and Tier 2 (Unconfirmed Deep Anomalies), featuring visible per-symbol auto-dialing and coincidence verification.
- **Symmetrical Command-Wall Composition**: Symmetrical mission-control data wall providing visual balance while preserving prominent, high-contrast operational controls for the core loop.
- **Signal Classification & Triage Station**: Interactive lab for inspecting candidates with genuine RFI rejection path (e.g., Starlink Ku-Band Chirp dismissed via parallax delay failure).
- **Interferometry Baseline Geometry Visualizer**: Interactive 10-dish array layout map with delay lines and synthetic UV spatial frequency coverage.
- **Historical Detection Archive**: Searchable and filterable database containing 25+ technosignature candidates and RFI records with frequency, drift rate, SNR, and array configuration metadata.
- **Operator Reference Manual (`?`)**: Full modal reference covering core dialing, coincidence verification, safety interlock, and auxiliary systems.
- **Settings & Theme Engine**: Color grading (Deep Cyan, Phosphor Amber, Spectral Emerald, Supernova Violet), audio volume control, scanline intensity, and motion settings.
- **Zero-Scroll Viewport Scaling**: Unitless CSS custom-property scaling engine ensuring pixel-perfect 1920x1080 and 3840x2160 (4K) operation without page scrolling.
