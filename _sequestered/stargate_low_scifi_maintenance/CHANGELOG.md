# Changelog

All notable changes to Panel K (stargate_low_scifi_maintenance) are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/).

## [Unreleased] - proposed 1.1.0

### Fixed

- Raised guard cover could intercept the click meant for OPEN CONDUIT
  beneath it (its projected quad, or a not-yet-painted transition frame);
  the cover now takes `pointer-events:none` once raised and drops again by
  spring action on close/key-off.
- Interlocks (LINE UP, OPEN CONDUIT) read gauge needle values directly, so
  rendering starvation (hidden/throttled viewers) could stall the whole
  sequence; plenum pressure and bus volts are now closed-form functions of
  wall-clock time, with the needles just chasing the model. Added a coarse
  250 ms backstop clock alongside rAF/MessageChannel so lamps, needles, and
  the port canvas stay alive even when animation frames are fully starved.
- Gauge needles rendered on top of their own label/unit text and crossed
  through it at rest (permanently, for CARRIER BIAS, which idles at its
  0 mV center position); label/unit moved into the gauge's lower nameplate
  strip, clear of the needle's sweep.
- Pre-transit checklist items could only be toggled by their small switch;
  the printed label text now flips its own switch too.
- Ejecting an empty card slot silently did nothing; it now refuses with
  "NO CARD SEATED".

### Changed

- OPEN CONDUIT and LINE UP buttons reworked from a glossy spherical
  "gumdrop" highlight to a matte painted-metal push-cap: softer directional
  top sheen, an off-axis worn patch where a thumb actually lands, a
  debossed seam ring between cap and collar.
- Panel now scales as a single proportional unit (measured, JS-driven
  `transform: scale()` against the viewport) instead of centering at a
  fixed pixel size in empty space — fits 1920×1080 with no vertical scroll
  and grows cleanly through 3840×2160.
- Added bottom-left build credit link and bottom-right version tag
  (fixed-position, low-opacity, non-interactive beyond the link).

## [1.0.0] - 2026-07-19

### Added

- Type 44 "Panel K" conduit routing console for the Intermunicipal Conduit
  Authority, Substation 6: five-digit thumbwheel dialing with stepping-relay
  line-up and far-end proving, guarded pre-transit checklist, butterfly
  gate valve + iridescent carrier film in a round inspection port.
- Fast dial via pre-punched, supervisor-stamped route cards: gang-releases
  all five relay banks in one throw and carries pre-transit certification
  (Maintenance Order 7-C).
- Synthesized mechanical audio (key clunk, stepping ticks, motor run, seat
  clacks, buzzer), paper routing ledger, and a scrolling service log.
- Vanilla ES modules, no dependencies, fully client-side.
