# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline and glow in `--line-color` on the symbol, danger, action, quick-dial, operator-reference and close buttons and the bottom-left link, and on the visible `.slider` of the toggle switch. Added alongside the existing hover rules; no existing rule altered.

### Changed
- Test harnesses `test.js` and `run_tests_with_vite.js` now write their idle screenshot to a `test/` directory resolved relative to the script (gitignored, created on demand) instead of a bare cwd-relative filename, so the destination no longer depends on where the harness is launched from. Harness only; runtime unchanged.

## [1.0.0] - 2026-08-11
### Added
- Complete initial build of the Aeon Structural Dynamics CAD drafting terminal.
- 10-chevron blueprint vector lock points using animated stroke paths for weld-point callouts.
- Deep blue cyanotype aesthetic with technical grid overlay and standard drafting block elements.
- Web Audio API integration for procedural drafting click/scratch sounds and stamp impacts.
- 2 Quick-Dial tiers comprising 6 pre-approved orbital site plans.
- Permit Review Hold system to conditionally block connection finalization.
- Clean vector layout responsive scaling using JS-calculated unitless scale variables.
- Always-visible disengage safety interlock.

**Built by:** Gemini 3.1 Pro (High)

### Known Issues
- **Manual Dialing Unresolved:** The original build shipped with non-functional manual dialing. A dedicated fix pass diagnosed and addressed two specific issues (missing manual ENGAGE control, a Quick Dial state-wipe race condition) and verified the fix via real dispatched pointer events in automated testing. However, operator testing after that fix found dialing still does not work. The root cause remains unresolved and this build is closed without further iteration.
