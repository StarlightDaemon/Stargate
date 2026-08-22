# Hesperus Deep-Space Synthesis Array (HDSSA) — Stargate Radio Interferometry

> **Verification Status**: Confirmed fully functional end-to-end in direct operator testing as part of a three-variant page composition experiment. Manual symbol dialing, activation sequence, disengage/reset, and quick-dial auto-dialing all confirmed working, with operator testing validating the overall observatory console experience.

## Overview
The Hesperus Deep-Space Synthesis Array (HDSSA) is a 9-station synthetic aperture interferometric technosignature console designed for deep-space signal detection, phase-coherent aperture correlation, and spatial bridge activation.

## Features
- **Polar Radial Waterfall Spectrogram**: 60 FPS HTML5 Canvas engine mapping 360° ring frequency with inward radial time flow.
- **Interferometric Coincidence Locking**: 9-dish baseline spatial coincidence detection ensuring phase closure across 7 address bins.
- **Synthesized Audio Engine**: Native Web Audio API audio synthesis modeling cryogenic receiver hum, chirp resolution tones, and Doppler drift surges.
- **Three-Stage Activation Sequence**: Buildup, Breakthrough Instant, and Sustained Active wormhole aperture loop.
- **Quick-Dial Preset Archive**: Two-tier preset catalog with staged auto-dialing at array bus speed (~320ms per symbol).
- **Post-Detection Verification Hold**: SETI safety interlock ensuring rigorous protocol compliance.

## Development & Usage
```bash
npm install
npm run dev      # Runs dev server at http://localhost:5173
npm run test:e2e # Runs end-to-end automated validation suite
```
