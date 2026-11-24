# Orbital Air Traffic Control Radar Stargate Console (`stargate_orbital_atc`)

> **Build Status:** Confirmed functionally solid via direct operator testing (dialing, activation, and disengage fully functional). Part of the 2026-08-12 six-build batch; operator review noted a creative-diversity finding regarding shared layout composition across the batch. The batch is closed with no further iteration planned.

---

## Overview
A standalone digital/schematic Stargate dialing interface themed around aerospace air traffic control, multi-band radar surveillance, and orbital trajectory corridor clearances.

- **Port:** 8084
- **Lock Points:** 12 Orbital Waypoint Sectors (Zulu-01 through Zulu-12 at 30° increments)
- **Address Length:** 9 Flight Corridor Waypoints
- **Locking Gesture:** Radar Track Gate Acquisition & Vector Lock
- **Safety Subsystem:** Orbital Corridor Collision Safety Hold
- **Audio:** Web Audio API Mode-S transponder chirps, radar lock tones, avionics alarms

## Quick Start
```bash
npm start
# Server listens at http://127.0.0.1:8084
```


## Shared local preview

`node server.js` uses the repository shared server at `http://127.0.0.1:8084`.
`PORT` selects another port. Keep the exhibit inside the repository. Only tracked
public assets are served, with GET/HEAD, loopback binding and contained paths.
The original test suites, client sources and operator/creative-fit notes remain
unchanged; infrastructure qualification does not imply new operator acceptance.
