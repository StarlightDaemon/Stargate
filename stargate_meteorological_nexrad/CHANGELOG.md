# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline in `--nex-cyan` with a cyan glow on the help, glyph, preset and modal-close buttons and the daemon link; `--nex-orange` on the engage button; `--nex-red` on the abort button; `--nex-yellow` on the banner dismiss; and cyan on the safety-hold `.slider` when its checkbox is focused. Added alongside the existing rules; no existing rule altered.
- `prefers-reduced-motion: reduce` swaps the core reticle onto a slower (6s), narrower `pulse-reticle-reduced` keyframe. Dial and activation feedback are untouched.

### Fixed
- The barometric-overpressure safety-hold checkbox was `display: none`, which removed it from the accessibility tree and the tab order. It is now visually hidden instead (1px, clipped, absolutely positioned inside `.switch-control`, which became `position: relative`), so it is reachable by Tab and toggles with Space while the styled slider still draws it.

### Changed
- Test harness `test_build.js` (raw CDP): the hardcoded Chrome path constant was replaced by `resolveChrome()`, which takes `CHROME_PATH` or `PUPPETEER_EXECUTABLE_PATH`, falls back to a dynamically required puppeteer/puppeteer-core `executablePath()`, and otherwise fails with an explicit error naming `CHROME_PATH`. It now also writes its verification screenshots to the gitignored `test/` directory, created on demand, instead of the build root. Harness only; runtime unchanged.

## [1.1.0] - 2026-08-15

**Built by:** Claude Opus (auto-dial staging fix; original build by Gemini 3.6 Flash (high reasoning))

### Fixed
- **Preset Quick-Dial Instant-Jump Bug**: loading a severe-storm preset previously locked all 7 vector glyphs in one synchronous forEach, jumping straight to `PENDING_READY` and bypassing the per-glyph radar ping, chevron lock animation, and `TRACKING` telemetry progression that manual dialing uses.
- **Archived Storm-Track Replay**: presets now re-acquire each stored vector through the exact same `lockGlyph` barometric contour lock as a manual dial, one vector every 280ms — in-universe, the Doppler array replays an archived storm track on successive antenna sweeps: the volume scan runs at radar cadence, far faster than manual isolation, but every vector still needs its own sweep lock.
- Replay lands in the identical `PENDING_READY` state as manual dialing and **never engages the conduit on its own** (asserted at completion +1.2s).
- `DE-ENERGIZE / ABORT` remains fully functional **during** a replay: aborting mid-sequence cancels all pending sweep timers and resets cleanly (new automated test). Engaging the Barometric Overpressure Safety Hold mid-replay also halts the remaining sweeps with a single interlock alert.

### Changed
- Verification suite: staged-replay sampling with in-progress screenshots, mid-replay abort test; preset assertion re-timed for the ~2s replay.

## [1.0.1] - 2026-08-13

### Operator Evaluation & Status Note
- **Functional Status:** Confirmed functionally solid via live operator testing. Meteorological glyph dialing, Doppler storm sector isobar compression locking, cyclone vortex conduit activation, barometric overpressure safety hold, and radar de-energize disengage all perform as intended with no functional defects reported.
- **Batch Evaluation Note:** Operator review noted that across the six-build batch, the overall layout composition exhibits a shared underlying arrangement reskinned per build. While chevron counts (9 storm sectors), address lengths (7 weather glyphs), locking gestures, NOAA alert and wind audio synthesis, and thematic vocabulary are genuinely differentiated, the overall page layout/composition was less differentiated across the batch than claimed.
- **Batch Status:** Batch closed. No further iteration planned.

## [1.0.0] - 2026-08-12

**Built by:** Gemini 3.6 Flash (high reasoning)

### Added
- Complete Storm / Weather Tracking Meteorological Doppler NEXRAD Radar Stargate Console (`stargate_meteorological_nexrad`).
- Live Doppler NEXRAD Radar Scope with dBZ reflectivity precipitation bands, rotating vortex velocity streamlines, and storm eye aperture.
- 9 Doppler NEXRAD Radar Storm Sectors stationed radially around the perimeter (N, NE, E, SE, S, SW, W, NW, EYE at 40° intervals) with vortex isobar compression locks.
- 7-glyph meteorological vector address dialing protocol with explicit pending-ready state and non-auto-firing activation.
- Barometric Overpressure & Tornado Safety Hold subsystem with audible NOAA alert tones and Doppler crimson warning banner.
- Dedicated ALWAYS-REACHABLE Radar De-Energize / Conduit Abort Disengage control tested through multiple full dial-disengage-redial cycles.
- Dual-tiered quick-dial storm system archive with 6 severe cyclone/supercell presets.
- Web Audio API meteorological audio synthesizer generating low atmospheric barometric wind rumbles, Doppler radar sweep pings, and NOAA weather alert tones.
- Operator reference modal, corner branding, and dynamic responsive scaling from 1080p to 4K UHD.
