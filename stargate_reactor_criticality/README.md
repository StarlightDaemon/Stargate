# TX-77 'AURA' Fast-Neutron Annular Resonator // Criticality HMI

> **Build Status:** Complete and functional. Confirmed by operator — manual dial, 3-stage activation sequence, emergency SCRAM disengage, and quick-dial auto-sequencer are all verified and working as intended.

## Overview
A digital reactor Human-Machine Interface (HMI) for the **TX-77 'AURA' Fast-Neutron Annular Resonator** at the **Kallio Deep Bore Subsurface Research Complex (Sector 09-Subterranean)**, operated by the **Nordic Criticality Research Directorate (NCRD / Valo Atomic Authority)**.

## Key Features
- **Asymmetric Command Matrix:** 62% Annular Core vector scope on left, 38% stacked command & telemetry deck on right.
- **Physics-Grounded Locking Mechanism:** 10 radial control rod banks with 2-step rod withdrawal and local flux stabilization wait ($\pm 0.05\%$ variance) to lock 6-channel address.
- **Three-Stage Staged Activation:** Reactivity Buildup ($k_{\text{eff}} \to 1.000$) $\to$ Prompt Cherenkov Breakthrough Flash $\to$ Sustained Controlled Criticality ($420.0\text{ MWth}$).
- **Safety Interlocks & SCRAM:** Reactor Protection System (RPS) Hold (defaults to RELEASED) and instant Emergency SCRAM rod drop.
- **Quick-Dial Preset Sequencer:** Automated stepped rod sequencing across Tier 1 (Verified Baselines) and Tier 2 (Experimental Regimes).
- **Secondary Telemetry Panels:** Live thermal-hydraulics, Xenon-135 transient decay tracking, axial core elevation cross-section, searchable configuration archive, terminal event log, and procedural Web Audio synthesizer.

## Running Locally
```bash
# Start static server
node scripts/server.js

# Or open index.html in modern browser
```
Open `http://localhost:8080/` or `http://127.0.0.1:8080/`.

The development command uses the repository's shared preview tool. Keep the
parent repository available for local development. `PORT` overrides the default
8080; the listener binds only to loopback and serves tracked public assets using
GET/HEAD and the shared containment policy. The published experience remains static.

Run the original engine integration suite with `node tests/integration_test.js`
from this directory. From the repository root, `node scripts/check-reactor-security.js`
also compares historical/shared HTTP serving and real browser interactions using
the browser environment documented in `scripts/MAINTENANCE.md`. These checks keep
operator acceptance separate and retain baseline resource/UI findings in reports.
