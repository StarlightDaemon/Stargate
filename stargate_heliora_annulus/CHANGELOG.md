# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline in `--sunfire` (the instrument's own energized accent) with a warm glow on `.icon-btn`, `.act-btn`, `.opref-btn` and `#opref-close`, and a sunfire outline and text colour on `.credit`. New rules only; the existing focus, hover and reduced-motion rules are unchanged.

### Changed
- `version.json` restructured to the catalog's common shape: `version`, `model` and `built` at top level (the former `date` key moved verbatim to `built`), with `name` and `device` preserved under a `meta` object. Version value unchanged.

## [1.1.0] - 2026-08-16

**Built by:** Claude Fable 5

Monorepo integration pass: rename, model/version backfill, corner display,
operator reference.

### Added

- Corner display: `StarlightDaemon` bottom-left, linking to
  <https://github.com/StarlightDaemon> with `target="_blank"` and
  `rel="noopener noreferrer"`, and the current version number bottom-right —
  both `position: fixed`, styled in low-opacity parchment to sit quietly
  beneath the instrument without competing with it.
- Operator reference: a collapsed circular `?` control fixed top-right opens
  an "OPERATOR REFERENCE · HELIORA" overlay covering manual cant-writing
  (sigil order, no repeats, Solyn closes on the seventh seat only), the
  Codex and Drift Cant fast-dial paths, the Sunstrike strike and the
  thirty-eight-second Wellglass stability window with its danger phase and
  auto-collapse, the Umbral Occulter's Seal Threshold close versus a
  mid-dial Release, and the mute toggle and transcript log. Dismissible by
  its close button, backdrop click, or `Escape`. Distinct from — and
  additional to — the instrument's own Operator's Primer (`?`/`H` in the
  Attunement Console).
- `version.json` and this changelog, backfilled with the model attribution
  recovered from the original build commit's `Co-Authored-By: Claude Fable 5`
  trailer.

### Changed

- Directory renamed from `Stargate_fable_u` to `stargate_heliora_annulus`
  for monorepo naming consistency. No gate mechanic, visual, sound, or copy
  was altered in this pass.

## [1.0.0] - 2026-07-17

**Built by:** Claude Fable 5

### Added

- The Threshold Annulus itself: a rotating thirty-sigil band with
  procedurally generated heliographic glyphs, alternating-direction seeks,
  ratchet ticks, and a settle wobble, read by the Meridian Claw.
- Seven Annular Seal pylons that drive inward and ignite one per locked
  sigil, plus the address system: seven-sigil "cants" with validation rules
  (no repeats, origin sigil Solyn must close the cant), a Codex of six
  fictional destinations, and random drift cants.
- Sunstrike activation burst opening a WebGL portal surface (the
  Wellglass) — molten fbm-noise sun with a dark eclipse core — with screen
  flash and gate shake, plus the Umbral Occulter closing mechanism, a dark
  eclipse-disc that transits the open well, quenches it, and retracts.
- Thirty-eight-second aperture stability with a warning phase and a
  violent auto-collapse if left unsealed, and a "lost cant" (Cor-Avenna)
  that gutters instead of connecting.
- Fully synthesized Web Audio sound design (bells, ratchets, drones, burst,
  standing hum, occluder grind) and the Attunement Console (seal sockets,
  transcript log, help primer, keyboard shortcuts, mute, idle sigil
  glints, responsive narrow layout) — zero dependencies, hand-written
  HTML/CSS/ES modules, SVG instrument, WebGL shader portal.
