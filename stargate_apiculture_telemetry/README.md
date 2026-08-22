# IPATC Precision Apiculture Telemetry Network (`stargate_apiculture_telemetry`)

> **Build Status Note:**
> Operator testing confirmed the core loop is technically functional (dial, activation, disengage all work), but found the overall build rough and not clear or polished enough to warrant further development. This repository represents a single, one-off attempt build and is permanently closed — no further refinement, editing, or iteration is planned against this brief.

---

## Overview

Interactive novelty portal-dialing console built for the **International Precision Apiculture Telemetry Consortium (IPATC)**. The interface monitors a 10-node radial bio-acoustic and brood-nest thermal telemetry array (`IPATC-RADIAL-10`).

## Key Features

- **Asymmetric Bi-Focal Layout**: 58% dominant bio-acoustic canvas array and 42% high-density command matrix.
- **10-Node Radial Array**: Live acoustic FFT harmonic waveforms, thermal gradient rings, and 7-symbol address system.
- **Two-Part Signature Correlation Locking**: Acquisition sweep followed by correlation-confidence ascent ($0\% \to 99.4\%$).
- **3-Stage Activation**: Buildup riser, breakthrough optical iris breach, and sustained bio-photonic vortex stream.
- **Quick-Dial Routing Hub**: 6 preloaded entries across 2 tiers with timed auto-dialing progression.
- **Biosecurity Containment Hold (BCH-9)**: Pathogen quarantine interlock blocking transmission when engaged.
- **Secondary Telemetry Drawers**: 24-station Colony Health Matrix, 2D Brood Nest Infrared Thermal Scanner, Swarm Prediction Radar, and Web Audio API synthesizer.

## Running Locally

```bash
# Start static server
node scripts/server.js

# Run Puppeteer verification test suite
node tests/e2e_verification.js
```
