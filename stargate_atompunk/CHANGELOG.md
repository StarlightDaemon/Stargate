# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-11

**Built by:** Claude Fable 5

Compliance pass: model attribution and operator reference.

### Added

- Operator reference: a collapsed circular `?` control fixed top-right opens
  "BCAD Form 9-C · Watch Officer's Card", an in-universe induction drill for
  Station 3 "Bluff Creek" — H.T. up, laying the bearing cursor and range gate to
  straddle the station on the coarse 15°/25 mi grid, three sweep paints to a firm
  track, the interrogator CHALLENGE (and CHARLIE GLASS, dark since fifty-four,
  answering NO JOY every time), the covered INDUCT switch, and the four-slot
  magnetic drum RECALL as the only sanctioned way to skip the drill. Dismissable
  by the STOW CARD button, backdrop click, or `Escape`.
- `model` field in `version.json` and a **Built by** line per version here,
  derived from the `Co-Authored-By: Claude Fable 5` trailer on commit `2077019`.

### Verified (no change required)

- Corner marks already correct: `StarlightDaemon` bottom-left linking to
  <https://github.com/StarlightDaemon> with `target="_blank"` and
  `rel="noopener noreferrer"`, version label bottom-right, both `position: fixed`
  outside the scaled console subtree.
- Single-viewport fit: the 1840x1000 design console scales to 1.035x at
  1920x1080 and 2.078x at 3840x2160 with zero overflow and no document scroll.

## [1.0.0] - 2026-07-22

**Built by:** Claude Fable 5

### Added

- VANTAGE — Type 9 Aperture Surveillance & Induction Console: atompunk
  Cold War civil-defense radar room (Station 3 "Bluff Creek", Continental
  Threshold Warning Line, Bureau of Civil Aperture Defense, alt-1959).
- Circular PPI radar scope as the portal ring itself: rotating sweep with
  P7-phosphor persistence (blue-white flash decaying to amber trail),
  fictional threshold stations as painted blips, stateless closed-form
  canvas rendering.
- Manual dial (6 actions, 2 control clusters): H.T. up → bearing cursor →
  range gate → three sweep paints build a firm track (LOCK) → interrogator
  CHALLENGE verifies the station signature → covered INDUCT switch opens
  the aperture in the tube.
- Amber/orange Nixie-tube readouts (bearing, range, paint count, signature,
  drum slot) plus backlit legend lamps and a fault strip.
- Target log panel with five fictional stations; one dark station
  (CHARLIE GLASS) answers the interrogator NO JOY and cannot be inducted.
- Drum track store fast dial: verified firing solutions auto-write to a
  4-slot magnetic drum; RECALL replays a solution (servo-slewed gates,
  drum-replayed signature), skipping sweep acquisition. Slot 1 ships
  pre-seeded with ABLE ORCHARD.
- Interlocks: knob motion drops a building track; unverified INDUCT springs
  back; the closed cover physically shields the switch; empty drum slots
  refuse recall.
- Fluid single-viewport layout: fixed-px console proportionally scaled by a
  stage fitter from 1080p through 4K, no scrolling.
- Drill bench (`?drill=geometry|manual|store|guards|all`), hit-testing every
  control at its rendered screen position via elementFromPoint before
  dispatching real pointer/mouse event trains; 39 checks.
