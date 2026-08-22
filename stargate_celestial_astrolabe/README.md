# Stargate Celestial Astrolabe (Series IX)

**Hyperion Astronavigation Institute // R/V Tethys-V // Bridge Navigational Division**

> **Operator Verification Note:** Direct operator testing confirmed the build fully functional end-to-end — manual star-fix dialing, three-stage activation (Buildup, Breakthrough, Sustained Active), disengage field collapse, and quick-dial auto-dialing sequence were all verified working, along with all secondary telemetry panels (Horizon Sky-Dome, Dead-Reckoning Plotter, Deep Ephemeris Catalog, and Instrument Settings).

---

## Overview

The **Series IX Digital Astrolabe** is a precision celestial navigation positioning instrument and novelty portal-dialing console designed for deep-space environments where conventional beacon or GPS-equivalent systems are unavailable.

It solves the inverse celestial navigation problem: utilizing **known** star positions against stereographic altitude circles (almucantars) on a fixed plate (**Tympan**) using a rotating star wheel (**Rete**) to resolve the observer's unknown Galactic Latitude, Longitude, and Gyro Heading vector, unlocking a stabilized hyper-spatial transit conduit.

## Core Navigation Loop

1. **Sighting Sights (`[01] NAV-STAR SIGHT SELECTOR`)**: Sighted stars command the Rete to rotate and align with target altitude circles along the sighting meridian alidade.
2. **7-Star Multi-Parameter Fix**: Sighting 7 stars mathematically resolves the Marcq Saint-Hilaire intercept matrix to sub-arcsecond precision.
3. **Transit Actuation (`[02] PORTAL ACTUATION`)**: 
   - Lands in `PENDING` state with zero auto-fire.
   - Stage 1: **Buildup** (1.8s) — Gimbal spin-up and coordinate convergence.
   - Stage 2: **Breakthrough** (0.8s) — Optical singularity shockwave and iris dilation.
   - Stage 3: **Sustained Active** — Continuous stabilized portal vortex with streaming telemetry.
4. **Emergency Disengage**: Always accessible to collapse the warp field and vent hydraulic pressure.

## Quick-Dial Presets

Features 6 preloaded logs across Tier 1 (Verified Fixes) and Tier 2 (Provisional Sightings) with real star-by-star sequential auto-dialing.

## Secondary Telemetry Panels

- **Horizon Sky-Dome**: Live fish-eye alt-azimuth celestial sky view with cardinal compass bearings.
- **Dead-Reckoning Plotter**: Real-time inertial drift tracking vs star-fix intercepts with uncertainty ellipses.
- **Deep Ephemeris Catalog**: Searchable and filterable table of 40+ catalogued astronomical bodies.
- **Synthesizer & Settings**: Real-time Web Audio controls and CRT phosphor scanline toggle.

## Technical Specifications

- **Tech Stack**: HTML5, Canvas 2D, Vanilla CSS3 (Custom Properties & Glassmorphism), ES6 JavaScript, Web Audio API.
- **Scaling**: Optimized for 1920x1080 non-scrolling baseline, scaling smoothly to 4K (3840x2160).
- **Attribution**: Built by Gemini 3.7 Flash.
