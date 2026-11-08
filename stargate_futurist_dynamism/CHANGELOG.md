# Changelog

## [Unreleased]

### Shared verification dependencies — 2026-11-08

- Removed duplicate `puppeteer` declarations in favor of the repository's locked development tools. Existing package commands and non-dependency metadata are unchanged; install the shared tools with `npm ci --ignore-scripts` at the repository root before browser verification.
- Adopted the exact npm-generated manifest and lockfile emitted by hosted run `42510716794`, job `128822957920`, after byte-count and SHA-256 verification. This candidate passed a clean install, installed-tree check, native CommonJS/ES-module resolution and a full audit with zero findings. The wider candidate job failed on other targets; this entry records only this exhibit's successful candidate.
- This dependency consolidation leaves the already-qualified browser behavior and original assertions intact; it does not grant new operator or release acceptance.

### Browser icon compatibility — 2026-11-08

**Performed by:** Codex maintenance session.

- Added a local SVG favicon using the existing palette and kinetic vector motif,
  with an explicit HTML icon link to prevent the missing favicon request.

## [1.0.1] - 2026-09-04

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators (`css/futurist-core.css`): `:focus-visible` outline in `--accent-speed` on every `button`, `a` and range input, and on the `.preset-card` and `.archive-entry-item` controls. Added alongside the existing rules; no existing rule altered.
- `prefers-reduced-motion: reduce` slows the brand crest to 12s (`futurist-core.css`) and pauses the outer-teeth and flywheel-core ring rotation while the gate is idle (`futurist-ring.css`). Buildup, breakthrough and active ring feedback are untouched.
- Declared client-side persistence: `"persistence": "localStorage"` in `version.json` and a **Persistence:** line in the README naming the single key `idpt_gateway_state` (theme, motion intensity, audio volumes, dial history, unlocked dossier records, session log), read from the storage code. No storage behaviour changed.

### Fixed
- The quick-dial preset cards and the archive entry list items were plain `div`s and could not be reached or activated from the keyboard. `js/app.js` now renders them with `role="button"` and `tabindex="0"` and gives each an Enter/Space keydown handler that performs the same click behaviour (auto-dial the preset; show the dossier).

### Changed
- `version.json` restructured to the catalog's common shape: `version` and `model` at top level, with `name`, `institution`, `artisticRegister` and `description` preserved verbatim under a `meta` object. No date key existed, so no `built` field was added. Version value unchanged.

## [1.0.0] - 2026-08-23

### Initial Release: Istituto Dinamico di Propulsione e Traslazione (IDPT)
**Built by:** Gemini 3.7 Flash (High Reasoning)

> **Operator Review Note:** The build is complete and fully functional (all automated end-to-end verification tests passed with 100% success). However, operator review found the overall result underwhelming — not a strong execution of the Futurist register, though no specific functional defect was identified. Session closed with no further iteration planned.

### Key Features & Capabilities:
- **Artistic Direction & Register:** Pure Italian Futurism visual language — diagonal force lines (*linee-forza*), chronophotographic multi-exposure ghost trailing, kinetic motion fragmentation, and high-contrast machine-age chromatic palettes.
- **Content Guardrail Compliance:** Exclusively focused on peaceful machine-age locomotion, rotational dynamics, velocity transit, and chronophotographic physics; zero militaristic, political, or aggressive themes.
- **Core Mechanism & Chronophotographic Locking:**
  - 10 radial kinetic stator sectors ($V_1$ to $V_{10}$).
  - 7-segment address lock sequence.
  - Stroboscopic chronophotographic burst on segment selection that progressively converges into a sharp locked state.
  - Separate, dedicated manual activation lever that never auto-fires.
- **Three-Stage Activation Sequence:**
  - **Stage 1 (Buildup):** Rotational acceleration, multiplying motion-blur ghost traces, rising acoustic turbine harmonics.
  - **Stage 2 (Breakthrough):** Maximum angular velocity, radial force ray detonation, chronophotographic aperture rupture.
  - **Stage 3 (Sustained Active):** Continuous hypersonic velocity, dynamic luminous energy streams, deep propulsion resonance.
- **Safety Interlock & Heavy Disengage:**
  - *Freno Dinamico di Inerzia* (Flywheel Governor Interlock) defaults to **RELEASED**, blocking activation with unmissable visual and acoustic warnings if engaged.
  - Responsive disengage brake lever with multi-stage kinetic deceleration.
- **Staged Quick-Dial Presets:**
  - 6 pre-configured transit coordinates across Tier I (Sub-Orbital/Terrestrial) and Tier II (Trans-Cosmic).
  - Genuinely staged auto-dial sequence that cycles through each segment with visible chrono-bursts, landing in a pending state without auto-firing.
- **Maximalist Feature Set:**
  - **Relational Archive (Archivio Dinamico):** 24 interconnected velocity records, incident reports, engineering dossiers, and sector coordinates with clickable cross-reference links.
  - **Session Persistence (localStorage):** Retains operator logs, dial history, unlocked records, and theme preferences across reloads.
  - **Engineering Blueprint Mode (Schema Tecnico):** High-precision vector technical schematic of the flywheel and stator mechanisms.
  - **Live Coupled Telemetry:** Real-time physical simulation coupling angular velocity, centrifugal G-forces, vibration harmonics, thermal flux, and tensor field outputs.
  - **Procedural Web Audio Engine:** Self-contained polyphonic audio synthesis with customizable channel mixer.
  - **Period Themes:** 4 authentic Futurist color palettes (*Boccioni Dynamism, Balla Electric Prism, Severini Carbon, Sant'Elia Industrial*).
  - **Operator Reference:** Comprehensive dismissible reference manual styled in Futurist typography.
  - **Viewport Scaling:** Responsive 1920x1080 native layout scaling cleanly up to 3840x2160 (4K).


## Maintenance — shared preview security (2026-11-08)

**Performed by:** Codex maintenance session.

- Replaced the development handler after original-suite and asset qualification.
- Preserved the imported server contract; listener is loopback-only, malformed
  URLs and development-file requests are rejected, and methods are restricted.
