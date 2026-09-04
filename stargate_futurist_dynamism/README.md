# Istituto Dinamico di Propulsione e Traslazione (IDPT)

> **Operator Review Note:** The build is complete and functional (all automated verification passed), but operator review found the overall result underwhelming — not a strong execution of the Futurist register, though no specific functional defect was identified. This session is closed and no further iteration is planned.

---

**Persistence:** `localStorage` only, under the single key `idpt_gateway_state`: theme, motion intensity, audio volumes, dial history, unlocked dossier records and the session log.

## Overview

An interactive client-side gateway-dialing terminal inspired by the visual language of Italian Futurism — featuring machine-age dynamism, diagonal force lines, chronophotographic phase capture, and radial velocity mechanics.

## Key Features

- **Chronophotographic Locking:** 10 radial kinetic stators and a 7-segment address sequence with rapid stroboscopic exposure convergence.
- **Three-Stage Activation:** Distinct Buildup (1.8s), Breakthrough (0.8s), and Sustained Active states with procedural Web Audio synthesis.
- **Safety Interlock & Heavy Disengage:** Flywheel governor clutch defaulting to RELEASED and always-reachable emergency brake.
- **Relational Archive:** 24 interconnected dossiers with bidirectional hyperlinks connecting records, incident reports, engineering profiles, and coordinates.
- **Live Coupled Telemetry:** Real-time physics simulation calculating coupled velocity, G-load, vibration harmonics, core temperature, and radial flux.
- **Session Persistence:** `localStorage` retains operator logs, dial history, theme preferences, and unlocked dossiers across reloads.
- **Engineering Blueprint Mode:** Vector technical drafting overlay displaying mechanical dimensions and optical shutter tolerances.
- **Responsive Viewport:** 1920x1080 native layout scaling cleanly up to 3840x2160 (4K).

## Running Locally

```bash
node server.js
```

Navigate to `http://localhost:3000/`.

## Running Verification Tests

```bash
node test/verify.js
```
