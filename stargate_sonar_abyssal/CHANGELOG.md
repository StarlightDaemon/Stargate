# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-09-04

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline (2px `--sonar-cyan`, 3px offset) with a cyan glow on every `button` and the daemon link, plus a cyan outline on the safety-hold `.slider` when its checkbox is focused. Added alongside the existing rules; no existing rule altered.
- `prefers-reduced-motion: reduce` slows the core reticle to 10s and the status heartbeat dot to 6s. Dial and activation feedback are untouched.

### Fixed
- The safety-hold interlock checkbox was `display: none`, which removed it from the accessibility tree and the tab order. It is now visually hidden instead (1px, clipped, absolutely positioned inside `.switch-control`, which became `position: relative`), so it is reachable by Tab and toggles with Space while the styled slider still draws it.

### Changed
- Test harness `test_build.js` (raw CDP): the hardcoded Chrome path constant was replaced by `resolveChrome()`, which takes `CHROME_PATH` or `PUPPETEER_EXECUTABLE_PATH`, falls back to a dynamically required puppeteer/puppeteer-core `executablePath()`, and otherwise fails with an explicit error naming `CHROME_PATH`. It now also writes its verification screenshots to the gitignored `test/` directory, created on demand, instead of the build root. Harness only; runtime unchanged.

## [1.1.0] - 2026-08-15

**Built by:** Claude Opus (auto-dial staging fix; original build by Gemini 3.6 Flash (high reasoning))

### Fixed
- **Preset Quick-Dial Instant-Jump Bug**: loading a charted preset previously locked all 6 bearing glyphs in one synchronous forEach, jumping straight to `PENDING_READY` and bypassing the per-bearing sonar ping, lock chime, transducer chevron animation, and `DIALING` telemetry progression that manual tuning uses.
- **Charted Bearing-Track Replay**: presets now re-tune each hydrophone bearing through the exact same `lockGlyph` phase lock as manual dialing, one bearing every 300ms — in-universe, the array steps a surveyed acoustic track at beamformer cadence: far faster than manual tuning, but every bearing still requires its own phase lock.
- Replay lands in the identical `PENDING_READY` state as manual dialing and **never starts emission on its own** (asserted at completion +1.2s).
- `DISENGAGE / ABORT` remains fully functional **during** a replay: aborting mid-sequence cancels all pending beam timers and resets cleanly (new automated test). Engaging the Cavitation Safety Hold mid-replay halts the remaining beam steps with a single interlock alert.

### Changed
- Verification suite: staged-replay sampling with in-progress screenshots, mid-replay abort test; preset assertion re-timed for the ~1.8s replay.

## [1.0.1] - 2026-08-13

### Operator Evaluation & Status Note
- **Functional Status:** Confirmed functionally solid via live operator testing. Dialing sequence, acoustic frequency locking, activation protocol, cavitation safety hold, and emergency abort/disengage all perform as intended with no functional defects reported.
- **Batch Evaluation Note:** Operator review noted that across the six-build batch, the overall layout composition exhibits a shared underlying arrangement reskinned per build. While chevron counts (8 hydrophones), address lengths (6 frequencies), locking gestures, audio synthesis, and thematic vocabulary are genuinely differentiated, the overall page layout/composition was less differentiated across the batch than claimed.
- **Batch Status:** Batch closed. No further iteration planned.

## [1.0.0] - 2026-08-12

**Built by:** Gemini 3.6 Flash (high reasoning)

### Added
- Complete Deep-Sea Nautical Sonar Command Console Stargate Interface (`stargate_sonar_abyssal`).
- Real-time 360° circular vector Sonar Sweep display with active acoustic echo returns, bathymetric depth soundings, and Doppler shift arcs.
- 8-point Hydrophone Transducer array (Bearings 000° through 315°) with acoustic resonant frequency lock.
- 6-glyph acoustic signature dialing protocol with explicit pending-ready state and non-auto-firing activation.
- Cavitation Safety Hold interlock subsystem with audible/visual claxon alerts.
- Dedicated ALWAYS-REACHABLE Abort / Decavitate Disengage control tested through multiple full dial-disengage-redial cycles.
- Dual-tiered quick-dial hydro-acoustic signature library with 6 abyssal destination presets.
- Web Audio API acoustic synthesizer generating authentic sonar pings, cavitation noise, and transducer resonance.
- Operator reference modal, corner branding, and dynamic responsive scaling from 1080p to 4K UHD.
