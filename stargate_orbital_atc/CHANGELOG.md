# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline in `--radar-cyan` with a cyan glow on the help, glyph, engage, preset and modal-close buttons and the daemon link; `--alarm-red` with a red glow on the abort button and banner dismiss. Added alongside the existing rules; no existing rule altered.
- `prefers-reduced-motion: reduce` disables the ambient core reticle pulse in the radar corridor. Dial and activation feedback are untouched.

### Changed
- Test harness `test_build.js` (raw CDP): the hardcoded Chrome path constant was replaced by `resolveChrome()`, which takes `CHROME_PATH` or `PUPPETEER_EXECUTABLE_PATH`, falls back to a dynamically required puppeteer/puppeteer-core `executablePath()`, and otherwise fails with an explicit error naming `CHROME_PATH`. It now also writes its verification screenshots to the gitignored `test/` directory, created on demand, instead of the build root. Harness only; runtime unchanged.

## [1.1.0] - 2026-08-15

**Built by:** Claude Opus (auto-dial staging fix; original build by Gemini 3.6 Flash (high reasoning))

### Fixed
- **Preset Quick-Dial Instant-Jump Bug**: loading an orbital preset previously locked all 9 waypoint glyphs in one synchronous forEach, jumping straight to `PENDING_READY` and bypassing the per-waypoint transponder chirp, radar lock beep, chevron animation, and `ROUTING` telemetry progression that manual vectoring uses.
- **Filed Flight-Plan Replay**: presets now acquire each waypoint through the exact same `lockGlyph` acquisition as manual vectoring, one waypoint every 240ms — in-universe, the flight computer executes a pre-filed departure route at autopilot cadence: far faster than manual vectoring, but every waypoint still requires its own radar lock.
- Replay lands in the identical `PENDING_READY` state as manual vectoring and **never transmits insertion clearance on its own** (asserted at completion +1.2s).
- `ABORT / FLIGHT CANCEL` remains fully functional **during** a replay: aborting mid-sequence cancels all pending autopilot steps and resets cleanly (new automated test). Engaging the Collision Safety Hold mid-replay halts the remaining steps with a single interlock alert.

### Changed
- Verification suite: staged-replay sampling with in-progress screenshots, mid-replay abort test; preset assertion re-timed for the ~2.2s replay.

## [1.0.1] - 2026-08-13

### Operator Evaluation & Status Note
- **Functional Status:** Confirmed functionally solid via live operator testing. Flight corridor waypoint dialing, radar track gate acquisition, orbital insertion activation, collision safety hold, and flight abort disengage all perform as intended with no functional defects reported.
- **Batch Evaluation Note:** Operator review noted that across the six-build batch, the overall layout composition exhibits a shared underlying arrangement reskinned per build. While chevron counts (12 waypoints), address lengths (9 waypoints), locking gestures, transponder avionics audio synthesis, and thematic vocabulary are genuinely differentiated, the overall page layout/composition was less differentiated across the batch than claimed.
- **Batch Status:** Batch closed. No further iteration planned.

## [1.0.0] - 2026-08-12

**Built by:** Gemini 3.6 Flash (high reasoning)

### Added
- Complete Orbital / Air Traffic Control Radar Stargate Console (`stargate_orbital_atc`).
- Multi-Band Aerospace Radar Scope displaying real-time orbital craft vectors, IFF Mode-S transponder codes, and flight corridor clearance rings.
- 12 Orbital Waypoint Sectors stationed radially around the perimeter (Waypoints Zulu-01 through Zulu-12 at 30° intervals) with radar track gate acquisition.
- 9-waypoint flight corridor route address dialing protocol with explicit pending-ready state and non-auto-firing activation.
- Orbital Corridor Collision Safety Hold subsystem with audible avionics alerts and ice-blue flight interlock warning banner.
- Dedicated ALWAYS-REACHABLE Flight Abort / Vector Hold Disengage control tested through multiple full dial-disengage-redial cycles.
- Dual-tiered quick-dial orbital flight plan archive with 6 orbital transfer corridor presets.
- Web Audio API aerospace avionics synthesizer generating transponder chirps, glass-cockpit alert beeps, and rocket orbital burn rumble.
- Operator reference modal, corner branding, and dynamic responsive scaling from 1080p to 4K UHD.
