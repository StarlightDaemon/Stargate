# Changelog

All notable changes to the Stargate Orthographic CAD Terminal project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline in `--cyan-bright` with the vector glow on the CAD icon, help, glyph-key, primary-action, toggle, preset card and secondary buttons and the starlight link; `--accent-red` on the disengage and modal close buttons. Added alongside the existing rules; no existing rule altered.
- `prefers-reduced-motion: reduce` disables the bureau badge icon pulse and the light-sweep shimmer layered on the ready-state execute button; the READY state stays communicated by the button's colour/border change and its untouched ready-pulse glow.

### Changed
- `version.json` restructured to the catalog's common shape: `version` and `model` at top level, with `name`, `bureau` and `docRef` preserved verbatim under a `meta` object. No date key existed, so no `built` field was added. Version value unchanged.

## [1.0.0] - 2026-08-21

### Milestone Note
- **Direct Operator Verification**: The operator has directly tested and confirmed this build is fully operational end-to-end (manual dial, three-stage activation sequence, disengage, and sequential quick-dial auto-dialing). This represents the first fully successful build in this Blueprint theme's history after three prior closed attempts.

### Added
- **Aethelgard-Voss CAD Architecture**: Full digital engineering terminal interface with deep Prussian-blue palette (`#071426`, `#0b203d`), radiant cyan vector line-work (`#5de6ff`, `#e0f7ff`), and ISO 128 CAD drafting conventions.
- **Annotated Technical Drawing Stargate Ring**: Integrated SVG stator ring, rotating precision vector rotor with 24 original glyph sectors, real dimension lines (`Ø 12,850 mm`, `R 4,700 mm`, `PCD 11,200 mm`), section-callout circles (`SEC A-A [1:10]`), and cross-section hatching.
- **8-Point Orthographic Caliper Inscription System**: 8 radial caliper nodes (Alpha to Theta at 45° intervals) requiring 7 spatial coordinate glyphs (6 spatial manifold vectors + 1 Origin Reference Datum).
- **Interactive Leader-Line Drafting**: Real-time vector drafting animation when a coordinate glyph is inscribed, snapping coordinate brackets `[X, Y, θ]` with plotter-pen acoustic feedback.
- **Three-Stage Vector Activation Sequence**:
  - Stage 1: *Buildup* (2.0s duration) with oscillating drafting grid, radial collimator rays, accelerating wireframe vortex, and rising harmonic audio drone.
  - Stage 2: *Breakthrough Instant* with dramatic photon singularity burst, wireframe-to-solid transition, and shockwave isobar ripple expansion.
  - Stage 3: *Sustained Active State* with energetic plasma vortex, orbiting vector flow-lines, particle streamlines, stable telemetric flux readouts, and resonant dimensional hum.
- **Sequential Quick-Dial Preset Engine**: 6 preloaded destinations across 2 visual tiers (Core Orbital Gateways and Deep-Field Astrometric Relays) featuring genuine sequential auto-dial animation (600ms per lock) ending in pending-ready state without auto-firing.
- **Structural Safety Interlock**: Structural permit review hold toggle (defaults to RELEASED) blocking activation with bold unmissable alerts when engaged.
- **Universal Disengage & Purge Control**: Always-available disengage actuator to smoothly collapse the active manifold and reset caliper locks.
- **Web Audio Generative Sound Synthesizer**: Original plotter-pen inking, piezoelectric servo clamps, buildup sweeps, breakthrough shockwaves, and ambient telemetric drone.
- **CAD Operator Guide Overlay**: Detailed technical specifications, bureau history, drafting symbols, and hotkeys.
- **Automated Continuous End-to-End Test Suite**: Complete Puppeteer test verifying viewport scaling (1080p and 4K), manual dialing, negative auto-fire, safety interlock, 3-stage activation, disengage, quick-dial presets, and redial cycle.

**Built by:** Gemini 3.7 Flash (High reasoning)
