# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline (2px `--glow-primary`, 3px offset) on every `button`. Added alongside the existing rules; no existing rule altered.
- `prefers-reduced-motion: reduce` pauses the ambient ward-barrier rotation. The living-surface pulse and chevron seek pulse communicate active dial state and are untouched.

### Changed
- `version.json` restructured to the catalog's common shape: `version`, `model` and `built` at top level (the former `date` key moved verbatim to `built`), with `name` and `device` preserved under a `meta` object. Version value unchanged.
- Test harness `puppeteer_test.js` now writes its idle and engaged screenshots to a `test/` directory resolved relative to the script (gitignored, created on demand) instead of bare cwd-relative filenames, so the destination no longer depends on where the harness is launched from. Harness only; runtime unchanged.

## [1.2.0] - 2026-08-11

**Built by:** Gemini 3.1 Pro (high reasoning)

Compliance pass: corner marks and proportional viewport fit.

### Fixed

- Build-credit link was missing `rel="noopener noreferrer"` alongside
  `target="_blank"`.
- Corner version label still read `v1.0.0` after the 1.1.0 release; it now
  tracks the current release (`v1.2.0`), matching `version.json`.

### Fixed (continued)

- **Viewport scaling was a no-op — the declaration never parsed.** `.main-layout`
  carried `transform: scale(min(1, calc(100vw / 1100), calc(100vh / 850)))`.
  `scale()` takes a unitless `<number>`, but `100vw / 1100` is a length divided
  by a number, which is still a length — so the entire declaration was invalid
  and dropped by the browser. The responsive scaling introduced in 1.1.0 has
  therefore never applied at any viewport size; the layout has always rendered
  at a flat 1400x878. Verified by reading back `getComputedStyle(...).transform`
  as `none` and by re-testing the original expression directly.
- Separately, the `min(1, ...)` cap meant that even a parsing version could only
  ever shrink, never grow — so 3840x2160 would still have rendered the 1080p
  layout in dead space.

The expression is now `scale(min(calc(100vw / 1920px), calc(100vh / 1080px)))`
— length divided by length yields the required unitless number, measured
against the real 1920x1080 design box. Exactly 1:1 at 1080p, a clean 2x at 4K.
The operator-reference control and corner marks sit outside the transformed
subtree and stay pinned to the viewport.

### Added

- `version.json` gains `name`, `device`, `date` and `model` fields.
- Missing `stargate_lumina_grove-v1.0.0` git tag, derived from commit `bf8aa13`
  (only v1.1.0 had been tagged).

## [1.1.0] - 2026-08-10

**Built by:** Gemini 3.1 Pro (high reasoning)

### Added
- Puppeteer diagnostic script and baseline screenshots added to repository as verification artifacts.
- Implemented responsive viewport scaling to ensure the portal fits smaller 16:9 displays natively.

### Fixed
- Reduced the vertical footprint of the utility panels by 375px to fit perfectly within a standard 1080p viewport without vertical overflow.
- Resolved bloated UI spacing by tightening `.controls-panel` width, narrowing the `.symbol-grid` cell sizes, and reducing padding/margins.

## [1.0.0] - 2026-08-09

**Built by:** Gemini 3.1 Pro (high reasoning)

### Added
- Initial release of Lumina Grove portal interface.
- 9-chevron bioluminescent dial system.
- Living surface portal effect on activation.
- 6 quick-dial presets.
- Ward Lock safety system.
- Operator reference modal.
