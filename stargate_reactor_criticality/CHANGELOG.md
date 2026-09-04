# Changelog - TX-77 'AURA' Reactor Criticality Console & Gateway

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline in `--accent-cyan` with the cyan glow on the header, channel, RPS toggle, activate, deck tab, load-config, log mini, theme, run-preset, modal close and modal ack buttons, the archive search and filter, the settings slider, the preset dropdown, the footer author link and the check-wrap inputs; `--accent-red` with the SCRAM glow on the SCRAM button. Added alongside the existing rules; no existing rule altered.
- `prefers-reduced-motion: reduce` disables the header reactor-state beacon blink, which runs the same continuous blink in every state (only its colour changes). Dial and activation feedback are untouched.

### Changed
- Test harness `scripts/cdp_browser_capture.js` (raw CDP): the hardcoded Chrome path was replaced by `resolveChrome()`, which takes `CHROME_PATH` or `PUPPETEER_EXECUTABLE_PATH`, falls back to a dynamically required puppeteer/puppeteer-core `executablePath()`, and otherwise fails with an explicit error naming `CHROME_PATH`. It now also writes its capture output to the gitignored `test/` directory, created on demand, instead of the parent build root. Harness only; runtime unchanged.

## [1.0.0] - 2026-08-22

**Built by:** Gemini 3.7 Flash (High)  
**Operator Status:** Confirmed complete and fully functional. Manual dial, 3-stage activation sequence, emergency SCRAM disengage, and quick-dial auto-sequencing verified working as intended.

### Initial Release
- **Core Identity & Lore**: Established the Kallio Deep Bore Subsurface Research Complex (Sector 09-Subterranean), TX-77 'AURA' Fast-Neutron Annular Resonator, operated by the Nordic Criticality Research Directorate (NCRD).
- **Asymmetric Command Matrix Composition**: Structured non-five-zone asymmetric layout (62% primary annular core vector scope on left, 38% stacked command console & secondary multi-view deck on right).
- **Annular Reactor Core Vector Scope**: Interactive Canvas 2D + SVG top-down core monitor with 10 radial control rod banks ($\alpha$ through $\kappa$), dynamic 2D neutron flux diffusion mesh, and real-time Cherenkov radiation vortex.
- **Physics-Grounded Locking Mechanism**: Control rod withdrawal motion followed by local neutron flux measurement and stabilization wait ($\pm 0.05\%$ variance) with harmonic stabilization tone.
- **Three-Stage Staged Activation**: 
  - Stage 1: Subcritical Reactivity Buildup ($k_{\text{eff}} \to 1.000$, thermal power rising).
  - Stage 2: Prompt Cherenkov Breakthrough Shockwave ($480\text{nm}$ azure blue ignition, aperture dilation).
  - Stage 3: Sustained Controlled Criticality ($k_{\text{eff}} = 1.0002$, streaming telemetry, continuous vortex).
- **Negative Auto-Fire Safety**: Completed 6-channel address lock remains safely in `PENDING` state awaiting distinct manual activation command.
- **Reactor Protection System (RPS) Hold**: Safety interlock defaulting to Released/Clear, blocking activation with audio-visual warnings when engaged.
- **Emergency SCRAM**: Always-accessible emergency rod drop mechanism with pneumatic solenoid dump and alarm strobe.
- **Quick-Dial Preset Sequencer**: 6 configurations across Tier 1 (Verified Startup Baselines) and Tier 2 (Experimental Regimes) with visible, non-instant stepped auto-dialing.
- **Secondary Telemetry Panels**:
  - Live core thermal-hydraulics telemetry ($T_{\text{in}}/T_{\text{out}}$, coolant mass flow, containment pressure, $\beta_{\text{eff}}$).
  - Xenon-135 transient poisoning real-time differential decay tracking.
  - Axial Core Cross-Section elevation view with interactive pin lattice.
  - Searchable and filterable Historical Configuration Archive with 12+ verified reactor runs.
  - Startup & Criticality Event Logging system.
  - Instrumentation & Audio Settings panel.
- **Procedural Web Audio Engine**: 100% synthesized audio using Web Audio API (coolant circulation hum, stepper motor servos, flux resonance chimes, Cherenkov surge, SCRAM pneumatic slam).
- **Responsive Viewport Support**: Pixel-perfect scaling from 1080p ($1920 \times 1080$) up to 4K ($3840 \times 2160$).
