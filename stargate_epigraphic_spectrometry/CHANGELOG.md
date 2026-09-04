# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline (2px `--gold-bright`, 3px offset) on every `button` and `a`, plus a gold outline on the safety-hold `.slider` when its checkbox is focused. Added alongside the existing rules; no existing rule altered.
- `prefers-reduced-motion: reduce` pauses the idle `.s-bar`, `.cartouche-frame` and enabled `.btn-engage` loops. Buildup/breakthrough/active feedback is canvas-drawn by `app.js` and is unaffected.

### Fixed
- The laser-overload safety-hold checkbox was `display: none`, which removed it from the accessibility tree and the tab order. It is now visually hidden instead (1px, clipped, absolutely positioned inside `.switch-control`, which became `position: relative`), so it is reachable by Tab and toggles with Space while the styled slider still draws it.

### Changed
- Test harness `test_build.js` (raw CDP): the hardcoded Chrome path constant was replaced by `resolveChrome()`, which takes `CHROME_PATH` or `PUPPETEER_EXECUTABLE_PATH`, falls back to a dynamically required puppeteer/puppeteer-core `executablePath()`, and otherwise fails with an explicit error naming `CHROME_PATH`. It now also writes its verification screenshots to the gitignored `test/` directory, created on demand, instead of the build root. Harness only; runtime unchanged.

## [1.1.0] - 2026-08-15

**Built by:** Claude Opus (auto-dial staging fix; original build by Gemini 3.6 Flash (high reasoning))

### Fixed
- **Preset Quick-Dial Instant-Jump Bug**: loading a catalogue preset previously locked all 7 glyphs in one synchronous forEach, jumping straight to `PENDING_READY` and bypassing the per-glyph laser scan tone, crystal chime, locus chevron animation, and `SCANNING` telemetry progression that manual dialing uses.
- **Catalogued Cartouche Replay**: presets now re-scan each glyph through the exact same `lockGlyph` spectral lock as manual dialing, one glyph every 280ms — in-universe, the spectrometer traverses a fully translated cartouche from the expedition catalogue at servo-stage speed: far faster than manual transcription, but every glyph still requires its own spectral scan lock.
- Replay lands in the identical `PENDING_READY` state as manual dialing and **never opens the golden conduit on its own** (asserted at completion +1.2s).
- `PURGE / DISENGAGE` remains fully functional **during** a replay: purging mid-sequence cancels all pending scan timers and resets cleanly (new automated test). Engaging the Laser Overload Hold mid-replay halts the remaining scans with a single interlock alert.

### Changed
- Verification suite: staged-replay sampling with in-progress screenshots, mid-replay purge test; preset assertion re-timed for the ~2s replay.

## [1.0.1] - 2026-08-13

### Operator Evaluation & Status Note
- **Functional Status:** Confirmed functionally solid via live operator testing. Ancient epigraphic glyph dialing, laser focal bracket locking, activation protocol, laser overload hold, and abort/reset disengage all perform as intended with no functional defects reported.
- **Batch Evaluation Note:** Operator review noted that across the six-build batch, the overall layout composition exhibits a shared underlying arrangement reskinned per build. While chevron counts (9 loci), address lengths (7 glyphs), locking gestures, Solfeggio audio synthesis, and thematic vocabulary are genuinely differentiated, the overall page layout/composition was less differentiated across the batch than claimed.
- **Batch Status:** Batch closed. No further iteration planned.

## [1.0.0] - 2026-08-12

**Built by:** Gemini 3.6 Flash (high reasoning)

### Added
- Complete Ancient Mythic Epigraphic Spectrometry Stargate Interface (`stargate_epigraphic_spectrometry`).
- Dual Concentric Optical Epigraphic Scan Hub displaying real-time laser OCR sweeps, vector confidence matching point-clouds, and spectrographic decipherment curves.
- 9 Epigraphic Loci stationed radially around the perimeter (Loci I through IX at 40° intervals) with laser focal bracket convergence.
- 7-glyph ancient epigraphic address dialing protocol with explicit pending-ready state and non-auto-firing activation.
- Spectrographic Laser Hold interlock subsystem with audible harmonic alerts and amber laser warning banner.
- Dedicated ALWAYS-REACHABLE Abort / Laser Reset Disengage control tested through multiple full dial-disengage-redial cycles.
- Dual-tiered quick-dial epigraphic tablet archive with 6 mythic astronomical coordinate presets.
- Web Audio API golden harmonic synthesizer generating resonant crystalline chimes, optical laser sweeps, and decipherment drone.
- Operator reference modal, corner branding, and dynamic responsive scaling from 1080p to 4K UHD.
