# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline (2px `--accent-cyan`, 3px offset) with the cyan glow on every `button` and `a`. Added alongside the existing rules; no existing rule altered. The eight register slots are plain `div`s without `tabindex` and are not in the tab order, so no rule targets them.
- `prefers-reduced-motion: reduce` slows the header badge icon pulse to 10s and the live stream indicator dot to 5s. Testing strobe, interlock alert pulse and ready pulse are untouched.

### Changed
- Test harness `test_suite.js`: the hardcoded Chrome path constant was replaced by `resolveChrome()`, which takes `CHROME_PATH` or `PUPPETEER_EXECUTABLE_PATH`, falls back to puppeteer's own `executablePath()`, and otherwise fails with an explicit error naming `CHROME_PATH`. It now also writes its run log to the gitignored `test/test_results.json`, created on demand, instead of `test_results.json` at the build root. Harness only; runtime unchanged.

## [1.0.0] - 2026-08-15

**Built by:** Gemini 3.7 Flash (High)

### Added
- **Facility & Identity**: Created the **Directorate of Signal Cryptanalysis & Key Recovery (DSCR) - Station VORTEX-9** cryptographic signals-intelligence workstation.
- **The Key-Space Search Ring**: Engineered a live circular key-space instrument mapping 10 rotor permutation sectors and a real-time collapsing Shannon entropy heatmap arc ($2^{32} \rightarrow 2^0$ state reduction) that resolves dynamically as keys lock.
- **Hypothesis Sampling & Eigenvalue Pinning Lock Mechanism**: Invented a cryptographic locking sequence featuring high-speed 60Hz candidate glyph strobe cycling, eigenvalue frequency matching, and crisp digital bracket pinning across 8 sub-key registers.
- **Synthesized Web Audio Engine**: Implemented a procedural Web Audio synthesizer featuring mechanical-digital micro-ticks, crystal resonance lock chirps, rising buildup sweep oscillators, sub-bass breakthrough impact, sustained plasma carrier hum, and OPSEC alarm tones.
- **Strict Non-Auto-Fire Activation Pipeline**: Guaranteed that completing the 8-key address leaves the console in an armed `READY` state without auto-firing.
- **Three-Stage Activation Sequence**:
  - *Stage 1 (Buildup - 2.5s)*: Rapid matrix decryption cascade, surging oscilloscope waves, entropy collapse, rising pitch and rotor strobe.
  - *Stage 2 (Breakthrough)*: Instantaneous quantum aperture expansion flash, synchronous sub-bass impact chord, and instant ciphertext-to-plaintext decipherment.
  - *Stage 3 (Sustained Active State)*: Continuous glowing plasma tunnel, relativistic particle lattice transport, decoded telemetry stream, and stable carrier lock (14.4 Gb/s).
- **OPSEC Channel Compromise Interlock**: Implemented a security safeguard that defaults to **RELEASED (Disarmed)**, blocking decryption with distinct visual/audio alerts when engaged.
- **Emergency Sever / Purge Keystream**: An always-active disengage control that instantly collapses active portals and resets the rotor key-space.
- **Preloaded Quick-Dial Intercepts**: Built 6 instant-load presets across two intelligence tiers (Tier 1: High-Confidence Relays; Tier 2: Suspect / Hostile Streams).
- **Control Hierarchy & Operator Reference**: Clean two-cluster core layout, top-right collapsible operator manual (`?`), bottom-right `v1.0.0` badge, and bottom-left `StarlightDaemon` attribution link.
- **Responsive Viewport Architecture**: Zero-scroll 1080p (1920x1080) native layout dynamically scaling cleanly to 4K (3840x2160) without distortion.
