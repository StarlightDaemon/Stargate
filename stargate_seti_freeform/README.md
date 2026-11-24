# ASBA-VESPER // Deep-Space Interferometric Technosignature Console

**Observatory:** Vesper Deep-Aperture Technosignature Observatory (VDATO)  
**Array:** Aetheris 10-Dish Synthetic Baseline Array (ADIA)  
**Version:** 1.0.0  
**Built by:** Gemini 3.7 Flash (High reasoning)

---

## Direct Operator Testing Confirmation

> **Status: Confirmed Fully Operational.**  
> Direct operator testing has personally tested and confirmed this build is fully functional end-to-end as part of a three-variant page composition experiment. The test verified manual candidate dialing, multi-dish coincidence correlation, the complete 3-stage activation event (buildup, breakthrough flash, sustained active link), instantaneous disengage/reset, and paced quick-dial auto-dialing. Testing confirmed the overall experience across all telemetry modules, including the 10-dish interferometric coincidence array, archived preset database (Tier-1 Verified and Tier-2 Unconfirmed anomalies), Doppler drift analyzer, logarithmic SNR meters, spectral profile classification, and the SETI Protocol 7.4 Post-Detection Verification Hold safety interlock.

---

## System Overview

The **Vesper Deep-Aperture Technosignature Console** is an interactive, digital schematic instrument console designed for technosignature signal-search and interferometric coincidence detection across the neutral hydrogen and hydroxyl "Water Hole" radio bands ($1.420\text{--}9.120\text{ GHz}$).

### Core Architecture & Features
- **Polar Waterfall Spectrogram Ring:** Continuous polar/radial waterfall display where frequency is mapped circumferentially ($360^\circ$) and time flows radially outward. Shifting textured background noise dissolves into sharp, glowing narrowband signal arcs upon coincidence verification.
- **10-Dish Interferometric Coincidence Matrix:** Spatially separated baseline receivers (`D-01` through `D-10`) that cross-correlate incoming wave arrivals to eliminate terrestrial radio frequency interference (RFI) ($R_{coinc} \ge 0.950$).
- **Three-Stage Staged Activation:**
  1. *Buildup ($2.6\text{s}$):* Doppler tracking lock, receiver gain climb, SNR ramp ($14\text{ dB} \to 99\text{ dB}$), and expanding radial time ripples.
  2. *Breakthrough:* Instantaneous optical shockwave flash, aperture event horizon tear, and explosive acoustic resonance impact.
  3. *Sustained Active State:* Continuous central vortex carrier link with 7 coherent laser-like beam vectors and multi-tone resonant drone.
- **Safety Interlock (SETI Protocol 7.4):** Post-Detection Verification Hold switch that defaults to released and blocks active transmissions when engaged.
- **Archived Quick-Dial Database:** 6 preloaded targets across 2 tiers featuring genuine paced auto-dialing (~$380\text{ms}$/candidate).
- **Responsive 16:9 Viewport:** Pixel-perfect zero-scroll scaling across 1080p and 4K displays.

---

## Development & Usage

```bash
# Install this exhibit's retained Vite build dependencies
npm ci --ignore-scripts

# Start local development server
npm run dev

# Run the owned comparison harness with the unchanged original suite
# Install shared tools at the repository root first.
node ../scripts/check-package-entry-security.js stargate_seti_freeform
```


## Shared verification dependencies — 2026-11-08

Browser verification uses the shared tools installed at the repository root. Run `npm ci --ignore-scripts` there before using this exhibit's verification commands, with system Chrome configured as required by the harness. Existing package commands and application assets are unchanged by this dependency maintenance.

This exhibit retains Vite for its original-server comparison and build commands; run `npm ci --ignore-scripts` in this directory for those uses.

## Source serving and retained build preview — 2026-11-08

`npm run dev` now uses the repository's shared source preview, bound to loopback at port 5173. `PORT`, `--port` and `-p` remain supported; an explicit port takes precedence over `PORT`. The shared policy serves public exhibit assets and rejects private source/test metadata, traversal, unsupported methods and foreign Host headers.

`npm run build` retains the audited Vite build. `npm run preview` deliberately remains Vite's built-`dist` preview, explicitly bound to `127.0.0.1` with strict port selection (default 4173). This specialist build contract is separate from source serving; Vite's SPA fallback is not the shared source policy.

The original `test_e2e.js` is preserved. Use the owned comparison command above for bounded loopback listeners, artifact ownership and separate original/security/cancellation results. The recorded source comparison in run `42515274539`, job `128836833598`, retains the same original fixed-350 ms manual-cadence failure in both modes, with matching public assets, security observations and preset cancellation evidence. The built-preview run's original failure is likewise retained, not relabeled as a pass.

The manual-cancellation repair passes deterministic and real in-flight browser checks in legacy/shared source modes (run `42516017150`, job `128839086446`) and built preview (job `128839086419`). Cancellation clears pending scans and dish visuals immediately and for 8.25 seconds; manual and preset restart races also pass. The separate completion-aware contract passed in job `128839086216` at 1080p and 4K: exact seven carriers, Hold block/release, three activation states and stable reset after 8.25 seconds. Measured real coincidence callbacks took 344–628 ms, explaining why the unchanged original 350 ms deadline can sample a still-pending carrier; no original delay or assertion was changed. Run `node ../scripts/check-freeform-manual-contract.js` for that supplemental contract. It does not replace the original assertions or historical operator record. Actual migrated commands pass on Linux and Windows in run `42516390075`, jobs `128840223230` and `128840223354`. Merge and deployment remain on HOLD.


### Manual scan scheduling repair

The scan now schedules its ten steps from the selection event instead of accumulating lateness across repeating callbacks. Nominal scan, settle and completion timing are unchanged. Controlled delayed-delivery and cancellation regressions pass; fresh original-suite and built-preview results are tracked separately from the historical failures above. No original assertion or delay is relaxed.

Fresh qualification in [run 42567482830](https://github.com/StarlightDaemon/Stargate/actions/runs/42567482830) passes the complete unchanged original suite in legacy/shared source modes (job `128997071192`) and built output (`128997071211`). Both source listeners clean up; built port conflict/release, exact assets, security policy and in-flight cancellation/restart checks pass. The separate 1080p/4K manual contract (`128997071194`) passes, and its six ready/active/cancelled captures were reviewed. Historical failures above remain historical; these are new executions after the repair. Browser callbacks still vary with load (311.8–384.2 ms observed), so no hard timing guarantee or sound/operator acceptance is claimed. Merge and deployment remain on HOLD.
