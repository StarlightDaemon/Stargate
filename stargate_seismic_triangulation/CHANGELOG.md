# Changelog

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators (`css/theme.css`): `:focus-visible` outline in `--cyan-primary` with the small cyan glow on every `button`. Added alongside the existing hover rules; no existing rule altered.
- `prefers-reduced-motion: reduce` (`css/layout.css`) slows the ambient idle heartbeat `.status-dot` to 6s. The sync pulse, armed pulse and button jitter in `components.css` are untouched.

### Changed
- `version.json` restructured to the catalog's common shape: `version`, `model` and `built` at top level (the former `timestamp` key moved verbatim to `built`, full ISO datetime kept), with `build_name` and `system_id` preserved under a `meta` object. Version value unchanged.
- Test harness `scripts/verify.js`: the hardcoded Chrome/Edge candidate list was replaced by `resolveChrome()`, which takes `CHROME_PATH` or `PUPPETEER_EXECUTABLE_PATH`, falls back to puppeteer's own `executablePath()`, and otherwise fails with an explicit error naming `CHROME_PATH`. No absolute local path remains in the harness. Harness only; runtime unchanged.

## [1.0.0] - 2026-08-22

**Built by:** Gemini 3.7 Flash (High Reasoning)

> **Operator Verification Note:** Direct operator testing confirmed the build is fully functional end-to-end — manual dial, three-stage activation (Buildup, Breakthrough, Sustained Active), network disengage/abort, and quick-dial auto-dial sequencing are all operating as intended.

### Initial Release: Cascadia Lithospheric Seismo-Acoustic Array (CLSA-9)

- **Identity & System**: Developed authentic digital geophysics console for the Cascadia Lithospheric Seismo-Acoustic Array (CLSA-9 / Subduction Geophysics & Teleseismic Observatory).
- **Asymmetric Composition**: Implemented an L-Framed Deep Seismology Depth Matrix (62% dominant lithospheric triangulation aperture and live waveform waterfall, 38% tactical operations & fault link control column), explicitly breaking away from the 5-zone symmetric template.
- **Seismic Triangulation Ring**: 10 radial borehole/broadband seismo-stations with real-time P/S wave-propagation circle generation, dynamic ray-vector drawing, error ellipse contraction, and focal mechanism moment tensor inversion.
- **Locking Mechanism**: Original "Phase-Coherence Cross-Correlation Lock" requiring 7 stations for full hypocenter resolution, with harmonic phase snapping and acoustic synchronization pings.
- **Activation Lifecycle**: Staged 3-phase activation (Buildup, Breakthrough, Sustained Active) triggered strictly via manual `ESTABLISH FAULT LINK` control with confirmed negative auto-fire protection.
- **Quick-Dial Preloaded Presets**: 6 fault presets across 2 tiers (Monitored Subduction Faults vs. Deep Mantle Ultra-Active Zones) with authentic non-instantaneous sequential auto-dial playback.
- **Safety Interlock**: "Crustal Shear Lockout" defaulting to RELEASED (safe), featuring unmissable audio-visual alert states when engaged.
- **Audio Synthesizer**: Native Web Audio API procedural synthesis for infrasonic sub-bass tremor hum, phase-lock chirps, breakthrough rupture shockwave, and sustained harmonic resonance.
- **Scalability & UX**: Strict 16:9 1920x1080 native fit with JS-computed scale transform up to 4K (3840x2160), operator reference modal (`?`), and attribution links.
