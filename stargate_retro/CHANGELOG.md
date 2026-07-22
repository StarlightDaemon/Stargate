# Changelog

All notable changes to AUGUR (stargate_retro) are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/).

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
