# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-21

### Added

- The Hollowbeck Six: a change-ringing lych-ring in a low-magic register.
  Six named bells; ring a road from the peal board and close on Grief, the
  tenor, and the tower door gives onto another parish's lych-gate.
- Manual dial (the patient way): draw the stay-bolt, pull five ropes in the
  road's order, close on Grief — 7 actions from cold.
- Fast dial (the sexton's barrel): an Ellacombe-style pinned chiming barrel;
  crank to a pinned road and drop the engage lever. Chiming taps hanging
  bells — no stays, no rhythm to keep — so it is fast by mechanism, not by
  animation speed.
- The peal board (read-only register) with five roads and one struck-through
  road, Wrycross, which answers darkly if rung by hand.
- False-change and rounds handling, interlocks (latched stays swallow pulls;
  the barrel is deaf while a way stands open), 60-second way timeout, and
  Grief tolling an open way shut.
- Procedurally seeded SVG chamber: single lantern light source with layered
  flame, uneven stone, worn limewash, irregular sallies, occlusion between
  wires, board, ropes, and barrel. No repeated tiles, no central ring shape.
- All audio synthesized with Web Audio: inharmonic bell partials, chiming
  strikes, jows, creaks, the slam.
- Dispatched-event verification bench (`?changes`, `window.__belfry.trial`),
  22 assertions across manual, chime, false, guards, and dark suites.
- Fully client-side; fictional destinations only; single-viewport 16:9
  layout scaling from 1080p to 4K; ambient-only idle state.
