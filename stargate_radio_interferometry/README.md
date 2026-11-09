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
npm run dev      # Runs source preview at http://127.0.0.1:5173
npm run test:e2e # Runs end-to-end automated validation suite
```


## Shared verification dependencies — 2026-11-08

Browser verification uses the shared tools installed at the repository root. Run `npm ci --ignore-scripts` there before using this exhibit's verification commands, with system Chrome configured as required by the harness. Existing package commands and application assets are unchanged by this dependency maintenance.

Normal source preview uses shared loopback serving: `npm run dev` opens `http://127.0.0.1:5173`. Set `PORT` or pass `-- --port NUMBER` (also `-p`); explicit arguments take precedence. Invalid or occupied ports fail. Only tracked public assets are served; development files, raw traversal and unsupported methods are refused.

For complete original-suite verification from this directory, run `npm run test:e2e`. It owns its comparison listeners and browser while preserving all original assertions. Install this directory's retained Vite dependency with `npm ci --ignore-scripts` for the historical package-transport comparison; direct historical runners are not the supported verification entry point.

`npm run build` still produces Vite's `dist/` artifact. `npm run preview` still serves that artifact, explicitly on `127.0.0.1:4173` with strict port selection; `-- --port NUMBER` selects another port. This audited built-preview path is a deliberate specialist exception to shared source serving, with separate built-artifact qualification. It is not a deployment command.

Both transports passed the full original suite, eight public assets, cancellation observations and listener cleanup in run `42514572291`, job `128834661724`.

Sound/operator acceptance and built-artifact qualification remain separate; merge and deployment remain on HOLD.
