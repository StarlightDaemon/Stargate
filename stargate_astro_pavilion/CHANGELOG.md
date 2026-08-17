# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-08-11

**Built by:** Gemini 3.1 Pro (high reasoning)

Compliance pass: versioning, corner marks and single-viewport fit.

### Fixed

- Directory and Activity Log were clipped off the bottom of the viewport. Both
  panels are flex children intended to scroll internally, but the flex chain
  (`.panel`, `.tab-content`, `.directory-panel`, `.log-panel`, `.dest-list`,
  `.log-container`, `.input-panel`) had no `min-height: 0`, so each was floored
  at its content height and spilled past the 750 px control cluster — measured
  content ran to 1324 px against a 1080 px viewport with `body { overflow:
  hidden }`, so the lower express-token destinations and almost the whole
  activity log were simply unreachable rather than scrollable.
- Corner version label read `v1.2.0` while `HEAD` was v1.3.0; it now tracks
  the current release (`v1.4.0`).
- `version.json` still read `1.0.0`, having never been updated after the initial
  commit; it now reads `1.3.0` and carries `name`, `device` and `date` fields.

### Changed

- The pavilion now scales as a single proportional unit: the layout is authored
  into a fixed 1920x1080 design box (`#fit`) scaled by `fitPavilion()`.
  Previously every dimension was fixed pixels, so a 3840x2160 display rendered
  the same 1080p-sized console centred in dead space. It now fills 4K at a clean
  2x and is unchanged at 1920x1080. The operator-reference control and the
  corner attributions stay outside the scaled subtree so they remain pinned to
  the real viewport.

### Added

- Changelog entries for 1.1.0, 1.2.0 and 1.3.0, derived from the commit history
  (`2f564ae`, `0a6cc0e`, `d514adf`) — the file had never been updated after the
  initial commit.

## [1.3.0] - 2026-08-08

**Built by:** Gemini 3.1 Pro (high reasoning)

Commit `d514adf` — "Expand express tokens and shift palette to dusk".

### Added
- Express token classes with distinct inline SVG icons: public, standard, VIP,
  emergency and diplomatic.
- Three further destinations — Aegis Defense Perimeter (Level 5 clearance),
  Solar Core Tap (Engineering) and the 8-symbol Alpha Centauri Embassy
  (Diplomatic) — taking the directory from four entries to seven.

### Changed
- Palette shifted to a dusk treatment.

## [1.2.0] - 2026-08-08

**Built by:** Gemini 3.1 Pro (high reasoning)

Commit `0a6cc0e` — "Implement 9-chevron mechanical ring and advanced routing".

### Added
- Nine-chevron mechanical ring: eight address chevrons plus the final origin
  chevron, each locking in place as its coordinate is accepted.
- Advanced Routing toggle in the Sequence Input Console, switching the terminal
  from 4-symbol local addressing to deep-space 8-symbol addressing that engages
  all eight address chevrons.

## [1.1.0] - 2026-08-08

**Built by:** Gemini 3.1 Pro (high reasoning)

Commit `2f564ae` — "Expansion pass: glyphs, chevrons, star chart".

### Added
- Expanded glyph set to 24 unique transit symbols.
- Star Chart tab alongside the Directory, rendering the destination network as
  linked nodes over an SVG chart.
- Per-symbol and per-chevron audio: distinct selection tones and a four-step
  chevron lock progression, plus a continuous idle hum.

## [1.0.0] - 2026-08-08

**Built by:** Gemini 3.1 Pro (high reasoning)

Commit `302d31b`.

### Added
- Initial single-session build of the Astro-Transit Pavilion '64 interactive terminal.
- Bright, optimistic mid-century retrofuturism aesthetic ("World of Tomorrow").
- Core dial loop utilizing an 8-symbol Sequence Input Console.
- Literal functioning ring display utilizing CSS conic-gradients and layered depth to visualize routing progress.
- Directory & Logging Terminal displaying fictional destinations and activity tracking.
- Web Audio API integration for authentic synthesized transit tones and interface feedback.
- Express Transit Tokens system providing a lore-friendly fast-dial mechanism.
- Operator Reference guide overlay accessible via top-right interface.
- Complete responsive single-viewport layout for 1920x1080 baseline without scrolling.
