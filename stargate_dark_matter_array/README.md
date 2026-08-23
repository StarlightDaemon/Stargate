# BOREAS-IX Subterranean Cryogenic Dark Matter Array

> **Verification Status (v1.1.2):** Automated testing in this session confirmed that the 16:9 interface scales and centers across standard 16:9 (`1920x1080`), ultrawide (`2560x1080`), and square (`1280x1280`) viewports with themed letterbox/pillarbox backdrops and zero unstyled gaps. All 5 navigation tabs and the right-column layout alignment have passed automated headless checks. *Note:* This status is based on this session's own automated re-verification and has not yet been independently confirmed by the operator's own direct testing.

---

## Overview
The **BOREAS-IX Deep Crust Cryogenic Observatory** (`Model DM-TPC-7X`) is an interactive novelty dark-matter portal-dialing website grounded in rare-event particle physics and background-rejection science. Situated beneath 1,450 meters of mountain granite ($4,200 \text{ m.w.e.}$), the observatory operates a 3.5-tonne dual-phase liquid xenon time-projection chamber (TPC) to discern rare WIMP nuclear recoil events.

---

## Architecture & Features
- **PMT Sensor Array & Target Core:** 10 live photomultiplier tube channels (`PMT-01` to `PMT-10`) mapped to a 7-slot target coordinate address sequence (`ξ-101` through `Ω-770`).
- **Background-Rejection Discrimination Engine:** Multi-stage pipeline checking prompt scintillation ($S1$) vs drift ionization ($S2$) ratios, active cosmic-ray muon veto coincidences ($\pm 50$ns window), and 3D fiducial volume wall cuts ($r \le 450$mm).
- **Staged Aperture Activation:** Strict negative auto-fire protection on coordinate lock $\to$ 3 distinct physical stages: Buildup ($2.1\sigma \to 4.9\sigma$) $\to$ Breakthrough ($5.0\sigma$) $\to$ Sustained Active (swirling dark-matter halo vortex, $>110$ events/s).
- **Relational Archive Vault:** 36+ cross-referenced datasets across Tier 1 (Vetted Baselines) and Tier 2 (Candidate Excesses Under Review) with relational jump buttons and auto-dialing support.
- **Cryo-Engineering Cross-Section:** Interactive 2D schematic of subterranean shielding, 120-tonne water Cherenkov veto, cryostat vessels, and target chamber with inspectable telemetry cards.
- **Procedural Web Audio Engine:** Pure Web Audio API synthesis generating 55Hz cryostat hum, PMT background clicks, resonant S1/S2 dual-crystal chimes, and muon veto alert tones.
- **Safety Interlock:** `BLIND-ANALYSIS PROTOCOL LOCK` defaults to RELEASED (unlocked).
- **Session Event Logger & LocalStorage:** Real-time event recording and complete state persistence surviving browser reload.

---

## Running Locally
To launch the server:
```bash
node server.js
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

To run automated verification suites:
```bash
node test/verify_tabs.js
node test/verify_viewport_scaling.js
```
