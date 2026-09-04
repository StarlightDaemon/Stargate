# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

**Built by:** Claude Fable 5.1 (catalog-wide maintenance commits of 2026-09-04). Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Declared client-side persistence: `"persistence": "localStorage"` in `version.json` and a **Persistence:** line in the README naming `hg.visited` (ids of destinations already reached) and `hg.muted` (`"1"`/`"0"`; audio stays muted unless explicitly `"0"`), read from the storage code. No storage behaviour changed.

### Changed
- `version.json` restructured to the catalog's common shape: `version`, `model` and `built` at top level (the former `date` key moved verbatim to `built`), with `name` and `device` preserved under a `meta` object. Version value unchanged.

## [1.1.0] - 2026-08-16

**Built by:** Claude Sonnet 5

Repo-integration pass: rename, attribution/version backfill, corner display,
operator reference overlay. No dial mechanic, visual, sound, or in-universe
copy was altered.

### Added

- Corner display: `StarlightDaemon` bottom-left, linking to
  <https://github.com/StarlightDaemon> with `target="_blank"` and
  `rel="noopener noreferrer"`, and the current version bottom-right — both
  `position: fixed`, low-opacity, styled to the ring's own cyan/amber palette.
- Operator reference: a collapsed circular `?` control fixed top-right, just
  under the status bar, opens "OPERATOR REFERENCE — TERMINAL VII" — an
  in-voice walkthrough of the seven-lock manual dial (six destination glyphs
  plus the closing ◈ Solyn origin lock), the SURVEY DIAL vs. archive-`R`
  fast-addressing distinction, ABORT vs. DISENGAGE CONDUIT, and the aperture
  shield's role against an unscheduled inbound breach. Dismissible by its
  CLOSE button, backdrop click, or `Escape`.
- `CHANGELOG.md` (this file) and `version.json` with a `model` field,
  backfilling the project's version history.

### Changed

- Renamed the project folder from `Stargate_fable_02` to
  `stargate_heliacal_ring` to match this repo's lowercase-slug convention.
  History preserved as a tracked rename.

## [1.0.0] - 2026-07-17

**Built by:** Claude Fable 5

Initial build. A fully client-side ring-gate dialing terminal: a ring-shaped
device with 38 procedurally generated glyphs, nine mechanical lock lugs, a
seven-glyph address system (six destination glyphs plus a closing
point-of-origin lock), a breach-surge activation, a shimmering
per-destination-tinted conduit, survey probes with fictional telemetry, a
closing aperture shield, unscheduled inbound breach events, and a fully
procedural Web Audio soundscape. Zero dependencies, no build step, no
network use.
