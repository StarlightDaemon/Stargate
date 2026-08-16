# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-16

**Built by:** Claude Fable 5

Repo-integration pass: renamed from `Stargate_fable_03` to `stargate_aethergate`,
backfilled model attribution and version history, and added the standard
corner display and operator reference overlay used across the monorepo. No
existing gate mechanic, visual, sound, or lore was altered.

### Added

- Corner display: `StarlightDaemon` credit bottom-left linking to
  <https://github.com/StarlightDaemon> (`target="_blank"`,
  `rel="noopener noreferrer"`), current version bottom-right — both
  `position: fixed`, styled in AETHERGATE's own cyan/amber console palette.
- Operator Reference: a collapsed circular `?` control fixed top-right opens
  a dismissible reference card (close button, backdrop click, or
  `Escape`) covering manual dial (sigil pad → seven-slot Destination
  Sequence → ENGAGE RING → route seals → prime seal), fast dial (RANDOM
  COORDS, Charted Destinations, CLEAR), lane-open controls (aperture
  stability, LAUNCH PROBE, SEAL PORTAL), and ABORT — in the console's own
  voice, distinct from and complementary to the existing in-header
  Operator's Manual.
- `CHANGELOG.md` and `version.json` (`name`, `device`, `version`, `date`,
  `model` fields) backfilled for v1.0.0 and this release, with `model`
  derived from the `Co-Authored-By: Claude Fable 5` trailer on the original
  build commit `d1be500`.

## [1.0.0] - 2026-07-17

**Built by:** Claude Fable 5

Initial release: AETHERGATE, an original ring-portal dialing console.

### Added

- SVG transit ring with a rotating 36-sigil track, eight mechanical locking
  seals (seven route seals plus a prime seal) with claw/lamp engage
  animations, a crown marker, and idle sheen sweeps.
- 36 procedurally generated original glyphs (fixed-seed PRNG) with invented
  names; a sigil pad, seven-slot address composer, random coordinates, and
  five fictional charted destinations.
- Full dialing state machine — idle → dialing (alternating-direction eased
  spins with per-glyph ticks) → lock-in → activation burst (screen flash,
  gate quake, WebGL surge overshoot) → active shimmering event-horizon
  shader → shutdown collapse — with abort support throughout.
- Time-based (throttle-proof) aperture stability drain with staged warnings
  and an automatic emergency seal, plus probe launches with a shader ripple
  pulse and seeded telemetry readings.
- Web Audio synthesized sound design (spin rumble, ticks, seal clunks,
  activation roar, standing hum, collapse), off by default.
- Starfield backdrop with meteors, an operations log, keyboard shortcuts,
  ARIA labels, reduced-motion support, and a Canvas2D portal fallback for
  browsers without WebGL.
