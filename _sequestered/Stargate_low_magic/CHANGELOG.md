# Changelog

All notable changes to the Wayband of Wren Alderwick are recorded here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]
Pending operator review — not yet committed or tagged.

### Changed
- Fluid, viewport-fit layout: the barn now scales with a root-relative
  `rem` unit (`clamp(16px, 0.8333vw, 32px)`) so every panel, gap and
  glyph grows proportionally from 1920×1080 up to 3840×2160 (4K)
  instead of centering in extra empty space. Diagnosed the actual
  overflow cause (the road-ledger's card list, not the rig, was the
  tallest column) and gave `#ledger-cards` and `#journal` internal
  scrollers so the primary dialing controls always fit one screen
  with no page scroll.
- Candle flames now render as a layered hot-core-plus-sheath gradient
  with a soft blur and per-socket flicker timing, replacing the flat
  single-gradient teardrop.
- Barn-wall background rebuilt as irregular-width boards with knot
  blotches and fine cross-grain hatching, replacing the uniform
  90/94/180/184/300px repeating stripe.

## [1.3.0] - 2026-07-18
### Changed
- Portal FX now fills only each radial gradient's own bounding box
  instead of the whole canvas, cutting wasted fill-rate.

## [1.2.0] - 2026-07-18
### Fixed
- Dev server now prefers `process.env.PORT` over the positional
  argument so a launcher can hand it a free port.
- Wren's Mark button scales down below 520px so it no longer overlaps
  the two lower candle sockets on narrow viewports.

## [1.1.0] - 2026-07-18
### Changed
- Post-verification polish: moth-flight timeout guard, mode-forcing
  test hook, moth seal copy, portal FX dev handle.

## [1.0.0] - 2026-07-18
### Added
- Initial scaffold: static site structure, 24-glyph chalk lexicon,
  audio synthesis, portal FX canvas, and the idle → chalking →
  primed → pouring → open → sealing state machine.
