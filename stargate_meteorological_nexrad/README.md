# Meteorological Doppler NEXRAD Radar Stargate Console (`stargate_meteorological_nexrad`)

> **Build Status:** Confirmed functionally solid via direct operator testing (dialing, activation, and disengage fully functional). Part of the 2026-08-12 six-build batch; operator review noted a creative-diversity finding regarding shared layout composition across the batch. The batch is closed with no further iteration planned.

---

## Overview
A standalone digital/schematic Stargate dialing interface themed around severe weather meteorology, Doppler NEXRAD radar scopes, and atmospheric storm vortex conduits.

- **Port:** 8086
- **Lock Points:** 9 Doppler Radar Storm Sectors (N, NE, E, SE, S, SW, W, NW, EYE at 40° increments)
- **Address Length:** 7 Meteorological Vector Glyphs
- **Locking Gesture:** Vortex Isobar Compression Lock
- **Safety Subsystem:** Barometric Overpressure & Severe Storm Safety Hold
- **Audio:** Web Audio API atmospheric wind rumbles, Doppler radar pings, NOAA alert tones

## Quick Start
```bash
npm start
# Server listens at http://127.0.0.1:8086
```
