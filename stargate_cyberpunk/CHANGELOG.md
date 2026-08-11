# Changelog

All notable changes to DEADRINGER (stargate_cyberpunk) are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-11

**Built by:** Claude Fable 5

Two passes: a compliance pass (model attribution, versioning, corner marks
and operator reference) and a clipart-residue rendering pass on the rig's
dressing (verified via the `?rig=all` bench, 3/3).

### Added

- Operator reference: a collapsed circular `?` control fixed top-right opens
  "Taped inside the lid", an in-universe card in v.'s voice walking the rig's
  own dial sequence — arming a route off the ROUTES board (including the
  struck-through ones the rig will not stop you dialing), the full NEG forgery
  hop by hop, percussively repairing the segment C cold-spool stall, ticket
  replay via RES and the GHOST KEYS reader, and cover/lever/CUT discipline
  against the ~2 minute session expiry. Dismissable by the SHUT IT button,
  backdrop click, or `Escape`.
- Corner marks: build credit `StarlightDaemon` bottom-left linking to
  <https://github.com/StarlightDaemon> (`target="_blank"`,
  `rel="noopener noreferrer"`), version label bottom-right. Both sized in the
  stage's `--u` scale unit so they track the rest of the console from 1080p
  through 4K.
- `version.json` and this changelog.

### Changed

- Hoist and slack chains rebuilt as actual link geometry (`chainRun` in
  `js/ring.js`): alternating face-on ovals and edge-on bars laid along each
  run with per-link jitter, upper rims catching the cage lamp — replacing the
  dashed-stroke lines that read as clip art. The taut hoist runs hang
  near-straight under load with one lazy bow; the slack run keeps its
  quadratic droop over the beam, dimmed.
- Aperture guard cover's hazard stripes hand-placed: seven stripes of no two
  the same width or opacity, thinner where the paint gave up, replacing the
  uniform repeating gradient — plus a `::after` wear overlay (paint rubbed
  through where thumbs land, grime gathering low, lamp catching the top edge).
- Ghost-key chip edge contacts beveled: each pin now carries a lit edge and a
  shadowed root under a single bench-light sheen instead of a flat two-tone
  stripe; burned chips keep a deadened version of the same treatment.
- Rig cable overlay given `.cbl-hi` lamp-side sheen paths offset along each
  run — a cable is a cylinder, not a stroke — with the warm-jacketed run's
  sheen tinted to match.

### Verified (no change required)

- Single-viewport fit: the stage measures exactly 1920x1080 at 1080p with every
  dial control (OPTERM keys, routes board, ghost-key reader, bench lever, CUT)
  above the fold, and scales cleanly to a proportional 3840x2160 via the
  `--u: min(1vw, 1.77778vh)` scale unit. The lore section below the fold is
  deliberate and is not part of the dial path.

## [1.0.0] - 2026-07-20

**Built by:** Claude Fable 5

Initial release (commit `447e0db`).

### Added

- DEADRINGER: salvaged Kessler–Voss Orbital SPINDLE aperture A7-113, re-hung on
  a chain gantry in a flooded sub-basement below the waterline because the ring
  drinks three hundred kilowatts when it lights.
- Dialing as forgery — nobody on the crew holds a KV credential. The rig probes
  a chain of derelict exchanges, answers their challenges with ghosted responses
  lifted from captured traffic, and pins a route hop by hop before the dead
  network notices it never authenticated anyone.
- Fast dial as session-ticket resumption: a completed dial caches a warm ticket,
  and physical ghost-key chips carry captured sessions for routes worth keeping
  warm. Seat a chip in the reader, hit RES, skip the negotiation entirely.
- Salvage detail: three replacement emitter segments with the wrong-colour pilot
  diodes, a segment C cold-spool stall repaired by hitting it, and a segment E
  that is beyond fixing.
- KV OPTERM 220 CRT terminal, routes board, ghost-key rack and reader, ring
  current meter, guarded aperture lever, and CUT.
- Vanilla ES modules, no build step: SVG ring, canvas portal field, DOM rig.
  Closed-form wall-clock simulation driven by a worker heartbeat so sequences
  survive hidden/throttled tabs.
- `?rig` test bench drives the full sequence via real dispatched pointer events
  hit-tested at each control's rendered position.
