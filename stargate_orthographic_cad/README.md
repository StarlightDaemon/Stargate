# Stargate Orthographic CAD Terminal (`stargate_orthographic_cad`)

> **Status: Operator Verified & Certified Functional (v1.0.0)**  
> Direct operator testing has confirmed this build is fully operational across the entire functional loop: manual dialing, three-stage activation sequence (Buildup, Breakthrough, Sustained Active), disengage/reset, and quick-dial auto-dialing.  
> **Milestone:** This is the first fully successful build in this Blueprint theme's history after three prior closed attempts.

---

## Overview

A digital CAD architectural & engineering drafting terminal operated by the **Aethelgard-Voss Structural Telemetrics & CAD Engineering Bureau** (Division of Astrometric Infrastructure, Spec `AV-CAD-STG-9042-REV-D`).

### Key Features
- **Screen-Native Blueprint Aesthetic**: Deep Prussian-blue field (`#050e1a`, `#071526`), radiant pale-cyan/white vector line-work (`#5de6ff`, `#e0f7ff`), ISO 128 title blocks, and real-time CAD cursor coordinates. Zero faux physical paper textures.
- **Annotated Technical Drawing Stargate Ring**: Integrated SVG stator ring, rotating precision vector rotor with 24 original geometric coordinate sectors (`V-00` to `V-24`), dimension strings (`Ø 12,850 mm`, `Ø 9,400 mm`, `R 4,700 mm`), and section-callout circle `SEC A-A [1:10]`.
- **8-Caliper Orthographic Inscription Locking**: 8 radial caliper nodes (Alpha through Theta at 45° intervals) accepting 7 coordinate constraints. Real-time animated vector leader lines draft to the caliper head with coordinate brackets `[X, Y, θ]` and plotter-pen/servo-snap audio.
- **Three-Stage Vector Activation Sequence**:
  - **Stage 1 (Buildup - 2.0s)**: Collimating laser rays, accelerating wireframe contour rings, rising harmonic audio drone.
  - **Stage 2 (Breakthrough Instant - t=2.2s)**: Radiant photon singularity flash, wireframe-to-solid manifold resolution, expanding shockwave isobar ripples.
  - **Stage 3 (Sustained Active State)**: Multi-arm logarithmic plasma vortex, 150+ orbiting streamline particles, stable telemetric lock (`4.881 TeV`, `99.8% Warp Flux`).
- **Negative Auto-Fire Guarantee**: Completing the 7th lock halts in `READY` state without auto-firing.
- **Sequential Quick-Dial Preset Engine**: 6 preloaded destinations across 2 visual tiers (Primary Orthogonal Stations and Deep-Sector Relays) executing genuine sequential auto-dialing (600ms per lock) before halting in `READY` state.
- **Structural Safety Interlock**: Section 14-B Permit Review Hold toggle (defaults to `RELEASED`) blocking activation with bold visual alert banners when engaged.
- **Universal Disengage**: Always reachable to collapse the aperture and reset all calipers back to `IDLE`.

---

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run automated end-to-end test suite (Puppeteer)
npm test
```


## Shared verification dependencies — 2026-11-08

Browser verification uses the shared tools installed at the repository root. Run `npm ci --ignore-scripts` there before using this exhibit's verification commands, with system Chrome configured as required by the harness. Existing package commands and application assets are unchanged by this dependency maintenance.

Normal source preview uses the shared loopback server: `npm run dev` opens `http://127.0.0.1:5173`. Set `PORT` or pass `-- --port NUMBER` (also `-p`) to select another port; an explicit argument takes precedence. Invalid or occupied ports fail instead of selecting another interface or port. Only tracked public assets are served; development files, raw traversal and unsupported methods are refused.

`npm test` now owns both loopback comparison listeners and the browser. It runs the unchanged original suite through the qualification adapter, including public-asset and security probes. Run `npm ci --ignore-scripts` in this directory before this comparison; the retained `vite` dependency supplies the historical package transport. Direct historical test files remain preserved as evidence, rather than the supported test entry point.

`npm run build` still produces Vite's `dist/` artifact. `npm run preview` still serves that built artifact, explicitly on `127.0.0.1:4173` with strict port selection; `-- --port NUMBER` selects another port. This audited Vite built-preview path is a deliberate specialist exception to shared source serving. It requires the local Vite installation and separate built-artifact qualification; it is not a deployment command.

Source-serving qualification: hosted run `42512882276`, job `128829555762`, passed the full original suite on installed package and shared transports, public assets and cancellation observations. Built-artifact, sound and operator acceptance are separate; merge and deployment remain on HOLD.
