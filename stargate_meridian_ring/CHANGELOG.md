# Changelog

All notable changes to MERIDIAN RING are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.1.0] - 2026-08-16

**Built by:** Claude Fable 5

- Renamed the build folder from `Stargate_fable` to `stargate_meridian_ring`,
  matching the lowercase-with-underscore naming convention used across the
  rest of the repository (history preserved via `git mv`).
- Backfilled model attribution and version history: this changelog and
  `version.json` now record v1.0.0 (the original build) and this pass as
  v1.1.0.
- Added a fixed corner display: a low-opacity version readout
  (bottom-right) and a "StarlightDaemon" credit link to
  `https://github.com/StarlightDaemon` (bottom-left), styled in the
  console's own cyan/amber-on-slate palette.
- Added an Operator Reference: a small circular "?" button fixed at the
  top-right corner that opens a dismissible in-voice overlay (close button,
  backdrop click, or `Esc`) covering manual dial (sigil matrix / ring-click
  entry into the address register, rotate-and-clamp sequence, keystone
  ignition), fast dial (registered destinations, RANDOM vector), conduit
  interactions (probe, transit, stability auto-seal, SEAL RING, ABORT), and
  the remaining console controls (CLEAR, sound toggle, system log).
- No changes to any existing gate mechanic, visual, sound, or lore/copy.

## [1.0.0] - 2026-07-17

**Built by:** Claude Fable 5

Original release. A fully client-side, dependency-free ring-gate dialing
console:

- 36 procedurally generated original sigils from a seeded six-family stroke
  grammar.
- A rotating glyph band that dials a seven-sigil address under an apex
  reader (alternating direction per sigil), with eight hold-clamps seating
  in symmetric order ending on the bottom keystone.
- Conduit ignition (turbulent overshooting plume into a counter-rotating,
  rippling event-horizon surface) and sealing (conduit collapse plus a
  twelve-plate mechanical iris).
- Fully synthesized Web Audio sound design (servo grind, clamp thunks,
  ignition surge, horizon loop, seal whoosh) with no audio files.
- A console UI: sigil keypad, ring-click entry, address register, six
  fictional registered destinations, random-vector dial, abort, probe/transit
  interactions, a stability countdown with auto-seal, a system log, and an
  operator handbook.
