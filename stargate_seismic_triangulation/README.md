# Cascadia Lithospheric Seismo-Acoustic Array (CLSA-9)

> **Operator Verification Note:** Direct operator testing confirmed the build is fully functional end-to-end — manual dial, three-stage activation (Buildup, Breakthrough, Sustained Active), network disengage/abort, and quick-dial auto-dial sequencing are all operating as intended.

---

## Overview

The **Cascadia Lithospheric Seismo-Acoustic Array (CLSA-9 / Subduction Geophysics & Teleseismic Observatory)** is a standalone digital seismology console designed for subduction-zone seismic triangulation and aperture fault link monitoring.

## Features

- **Asymmetric L-Framed Radar Console**: 62% dominant lithospheric triangulation aperture and live waveform waterfall, 38% tactical operations column.
- **Seismic Triangulation Ring**: 10-station radial array generating live P/S wave-propagation wavefronts, ray vectors, and focal mechanism moment-tensor inversion (beachball diagram).
- **Locking Mechanism**: "Phase-Coherence Cross-Correlation Lock" requiring 7 locked stations for full hypocenter resolution.
- **Activation Sequence**: 3-stage activation lifecycle (Buildup -> Breakthrough -> Sustained Active) strictly triggered via manual `ESTABLISH FAULT LINK` control with confirmed negative auto-fire protection.
- **Safety Interlock**: "Crustal Shear Lockout" switch defaulting to `RELEASED [ARMED]`.
- **Quick-Dial Presets**: 6 preloaded fault presets across 2 tiers with staged sequential auto-dialing (~320ms per station).
- **Web Audio API Soundscape**: Native procedural synthesis for sub-bass tremors, phase-lock chirps, breakthrough shockwave, and sustained harmonic drone.
- **Viewport Scaling**: Strict 16:9 1920x1080 native fit with JS-computed scale transform up to 4K (3840x2160).

## Running Locally

```bash
# Start server
node scripts/server.js

# Run Puppeteer verification test suite
node scripts/verify.js
```
