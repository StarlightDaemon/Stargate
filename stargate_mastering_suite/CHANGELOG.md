# Changelog

All notable changes to the Axiom Audio Research & Mastering Facility (Portal Dialing Suite) project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-15

**Built by:** Claude Opus (auto-dial staging fix; original build by Gemini 3.7 Flash (High))

### Fixed
- **Quick-Dial Preset Instant-Jump Bug**: loading a preset previously patched all 7 channels in a single synchronous pass and snapped straight to `ARMED_READY`, bypassing the per-channel relay audio, SVG cable snap, and `PATCHING` state progression that manual patching uses.
- **Servo Patchbay Recall**: presets now replay their stored routing snapshot through the exact same per-channel lock path as a manual patch (`toggleChannelPatch`), one cable every 280ms — in-universe, the MK-IX's motorized patchbay re-seats each cable at servo speed: faster than any engineer's hands, but still one jack at a time with full relay thud and cable-snap feedback per channel.
- Recall lands in the identical `ARMED_READY` state as manual patching and **never auto-prints** (strict no-auto-fire guarantee preserved and re-verified).
- `FEED CUT / MASTER UNPATCH` remains fully functional **during** a recall: cutting mid-sequence cancels all pending servo steps and returns cleanly to `IDLE_STANDBY` (new automated test).

### Changed
- Test rig: added staged-recall test with in-progress screenshot sampling and a mid-recall FEED CUT test; preset assertions re-timed for the ~2s servo recall; version badge assertions updated to v1.1.0.

## [1.0.0] - 2026-08-15

**Built by:** Gemini 3.7 Flash (High)

### Added
- Original audio engineering console identity: "Axiom Sound Labs // Quantum Mastering Array MK-IX".
- 10-Channel Harmonic Patchbay with custom sonic glyphs (`∿`, `⎍`, `⋔`, `◈`, `⨁`, `∾`, `⨂`, `⋇`, `⨀`, `⨝`) spanning 32 Hz to 16 kHz.
- Functioning polar spectrum analyzer & radial VU meter ring acting as an active audio instrument.
- Central multi-mode oscilloscope and Lissajous phase correlation vectorscope.
- 7-Bus Master Summing Array with animated SVG patch cables and snapping recoil physics.
- Polyphonic Web Audio API synthesis engine with real-time harmonic generation, tape relay thuds, and dynamic limiter saturation.
- Two distinct named control clusters: "Harmonic Channel Patchbay" and "Master Transport & Summing Deck".
- Strictly guarded non-auto-firing activation logic requiring manual "BOUNCE / PRINT MASTER" engagement.
- High-energy visual activation sequence featuring converging harmonic beams, polar phase vortex, and pinned VU meter ladders.
- Always-accessible "FEED CUT / MASTER UNPATCH" emergency kill-switch.
- Master Limiter / Safety Interlock defaulting to RELEASED (OFF) with visual and audible feedback when clamping.
- 6 preloaded Quick-Dial session presets split into 2 tiers (Calibrated Broadcast Stems vs. Experimental / Overdriven Routing).
- Operator reference overlay modal triggered by the fixed top-right `?` button.
- Clean responsive viewport auto-scaling (1920x1080 to 4K 3840x2160) without unit mismatch pitfalls.
- Corner displays with "StarlightDaemon" link and "v1.0.0" label.
