# Changelog

All notable changes to AUGUR (stargate_retro) are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/).

## [1.0.2] - 2026-07-22

### Changed

- Replaced click-to-position knob interaction with click-to-turn: each click
  advances the FIGURE X:Y and PHASE VERNIER knobs one fixed notch (a full
  detent for FIGURE, 6° for PHASE), wrapping indefinitely in both directions
  of travel — an operator turning a physical dial by hand, notch by notch,
  rather than pointing at a location. FIGURE's rotary switch dropped its
  270° dead-zone/end-stop in favor of a full 360° sweep across its 7 evenly
  spaced detents, matching the new indefinite-wrap behavior. Wheel and arrow
  keys remain for fine trim. Bench updated to drive clicks the same way;
  28/28.

## [1.0.1] - 2026-07-22

### Fixed

- OSCILLATOR GROUP knobs were unusable: `.knob` lacked `position: relative`,
  so both knob caps anchored to the cluster and stacked over the whole group,
  occluding the FIGURE knob and blocking every manual dial.

### Changed

- Bench drag/wheel drivers are now hit-tested via `elementFromPoint` like
  clicks (occluded controls fail honestly instead of being bypassed), and a
  geometry audit scenario checks control reachability, internal-element
  anchoring, and knob overlap. Cover occlusion checks force-settle the CSS
  transition first. Suite is 28/28.

## [1.0.0] - 2026-07-22

### Added

- Type 61 "AUGUR" Aperture Trace Console: a green-phosphor storage-oscilloscope
  gate where a destination address is a standing Lissajous figure (X:Y ratio +
  phase) and the energized figure unwinds into the luminous aperture ring.
- Round storage-tube CRT with organic beam bloom, phosphor persistence, supply
  flicker, scanlines, curvature vignette, curved-glass specular, worn bezel with
  mounting screws, and sparse vector HUD (crosshair ticks, bracket corners,
  degree-arc guide).
- Three rectangular phosphor screens: TRACE TABLE (six fictional standing
  addresses, live Δφ readout, graticule-mask row select), SUPERVISORY LOG
  (timestamped scrolling log), STORAGE MESH (retained traces with [RECALL]).
- Two control clusters: OSCILLATOR GROUP (detented FIGURE X:Y knob, continuous
  PHASE VERNIER) and APERTURE GROUP (MAINS bat toggle, six-lamp indicator row,
  STRIKE pushbutton, hinged safety-covered ENERGIZE switch).
- Manual dial (6 actions from cold): mains → figure ratio → phase until AFC
  latch → strike into mesh → raise cover → energize.
- Fast dial via genuine storage-phosphor recall: struck traces persist in the
  2.4 kV mesh (surviving a mains cycle) and flood back instantly.
- Interlocks: HT warm-up, AFC latch required to strike, live trace required to
  energize (spring-return refusal), cover physically occludes the switch,
  90 s mesh bleed with breaker drop.
- Ambient idle only: free-running 1:1 wander plus supervisory murmur; no
  auto-dial. Test bench (real dispatched events, hit-tested) behind `?trace`
  or `window.__augur.bench()`.
- Proportional 1920×1080 → 4K single-viewport scaling; worker-heartbeat sim
  clock immune to hidden-tab throttling.
