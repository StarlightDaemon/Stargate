# Auto-Dial Fix Report — 2026-08-15

Fixing the quick-dial/preset instant-jump bug across 10 repos: presets must
replay the existing per-symbol lock animation (accelerated but visible),
land in the same armed/ready state as manual dialing, never auto-fire, and
keep the disengage control functional throughout.

Excluded repos (untouched, per instruction): Stargate_OG, Stargate_fable*,
*.presubtree-backup, hub/, stargate_bureaucratic_mainframe,
stargate_dieselpunk, stargate_dieselpunkv2, stargate_low_magicv2,
Stargate_low_magic, stargate_steampunk, stargate_blueprint_alpha,
stargate_blueprint_drafting, stargate_high_magic,
stargate_low_scifi_maintenance, stargate_modern, stargate_cyberpunk.

---
## 1. stargate_caissa_workstation — FIXED ✅

- **Bug confirmed as inventoried:** `loadPreset` (js/engine_state.js) pushed all 7 plies synchronously and set `LINE_PENDING_COMMIT` in one tick.
- **Fix:** `loadPreset` now replays the preset line through the existing manual per-ply lock function `dialMove`, one ply every **280ms** (~1.96s total for 7 plies — clearly faster than manual clicking, each lock distinct). A `onPresetPlyLocked` hook fires the exact same per-ply audio (clock plunge / notation tick / confirm blip) and ring prune burst as manual dialing, via a shared `playPlyLockFeedback` in app.js.
- **In-universe justification:** *Transposition-table cache replay* — the IDCA engine replays a retrograde-verified canon line from cache at full internal clock speed, but every ply still passes individual alpha-beta lock confirmation.
- **End state:** replay lands in `LINE_PENDING_COMMIT` (identical to manual, incl. depth/nodes telemetry from `dialMove`), never auto-commits.
- **Disengage during replay:** `reset()` cancels all pending replay timers; verified by new Test 9 (abort at ~2/7 plies → IDLE, no orphan timers fire afterwards).
- **Screenshot evidence (real pointer events):** `screenshots/11_replay_progress_t420.png` (SEARCHING PLY 3/7), `11_replay_progress_t950.png` (SEARCHING PLY 5/7), `12_replay_complete_pending.png` (ARMED / PENDING COMMIT) — multiple distinct in-progress states confirmed visually.
- **Regression tests:** full suite (9 tests) PASSED — negative auto-fire (Test 2 manual, Test 8 preset), interlock block, three-stage activation, dual disengage/redial cycles, mid-replay disengage.
- **Note:** pre-existing flake found: Test 4 stage sampling missed the 1s breakthrough window due to screenshot latency (fails on unmodified HEAD too — verified via stash). Fixed with absolute-clock sampling.
- **Version:** 1.0.0 → 1.1.0 (CHANGELOG + version.json, Built by: Claude Opus).
- **Commit:** `3c0aaf2`

## 2. stargate_mastering_suite — FIXED ✅

- **Bug confirmed as inventoried:** `loadPreset` (js/app.js) patched all 7 channels in one synchronous forEach and set `ARMED_READY` immediately, with a single lock sound for only the first channel.
- **Fix:** presets now call the existing manual per-channel lock function `toggleChannelPatch` once per channel at **280ms** intervals (~1.96s for 7) — full relay audio, SVG cable snap, and `PATCHING` state progression per channel, identical to manual patching.
- **In-universe justification:** *Servo patchbay recall* — the MK-IX's motorized patchbay replays a stored routing snapshot at servo speed: faster than an engineer's hands, but still one jack at a time.
- **End state:** identical `ARMED_READY` as manual patching; **never auto-prints** (asserted at completion +1s).
- **Disengage during recall:** `disengageMasterFeed` (FEED CUT) cancels pending servo timers; verified mid-recall (abort at 2/7 → IDLE_STANDBY, 0 patched/0 cables even 1.9s later).
- **Screenshot evidence (real pointer events):** `test_screenshots/06_recall_progress_early.png` (3/7 patched, in-progress banner), `06_recall_progress_late.png` (5/7 patched), `06_recall_complete_armed.png` (7/7 ARMED) — distinct in-progress states confirmed visually. (Screenshots on this canvas-heavy page take ~2s in headless, so mid-frames were captured one per recall pass at different offsets.)
- **Regression tests:** full rig PASSED — negative auto-fire (manual + preset), limiter interlock block, master print activation, both disengage/redial cycles, tier-2 preset, 4K scaling.
- **Notes:** pre-existing flake fixed: the activation check sampled `portalEnergy` before headless rAF had rendered a frame (original suite passed with exactly one frame, 0.03); now explicitly awaits two animation frames. Version badge test updated to v1.1.0 (footer, version.json, package.json bumped).
- **Version:** 1.0.0 → 1.1.0 (CHANGELOG, Built by: Claude Opus).
- **Commit:** `d4dc21a`

## 3. stargate_synchrotron_collider — FIXED ✅

- **Bug confirmed as inventoried:** `loadTargetCoordinates` (app.js) assigned all 6 locked sectors wholesale and set `ARMED` synchronously.
- **Fix:** quick-dial now steps each sector through the existing manual lock path `selectSector` + `engageSelectedSector` at **300ms** per dipole (~1.8s for 6) — full per-sector lock audio, coil-intensity ramp, detector click-rate ramp, and canvas lock progression.
- **In-universe justification:** *Injection sequencer* — even with pre-computed target optics, the AHEIL superconducting dipoles must energize in ring order; the sequencer steps them at machine cadence rather than operator speed.
- **End state:** identical `COLLISION ARMED` (trigger enabled, portal radius ~0, never auto-fires; asserted at completion +1s).
- **Disengage during replay:** `BEAM DUMP / ABORT`, `RESET LATTICE`, and `STEP BACK` all cancel pending sequencer timers; verified mid-replay (dump at 2/6 → STANDBY, 0 locked even 2s later).
- **Screenshot evidence (real pointer events):** `test_screenshots/10_quickdial_replay_early.png` (2/6 locked, trigger AWAITING), `10_quickdial_replay_late.png` (4/6 locked), `10_quickdial_replay_armed.png` (6/6 ARMED) — distinct in-progress states confirmed visually.
- **Regression tests:** full verify.js suite — all 12 results true, incl. negative auto-fire (manual + quick-dial), quench interlock block, activation portal, both dial-dump-redial passes.
- **Notes:** new end-state assertion uses portalRadius < 0.01 because the canvas radius decays asymptotically (reaches ~1e-15) after a prior collision in the same session — cosmetic float, not a live portal. Version v1.1.0 in footer/version.json/CHANGELOG, test assertion updated.
- **Version:** 1.0.0 → 1.1.0 (Built by: Claude Opus).
- **Commit:** `9f5b2cf`

## 4. stargate_meteorological_nexrad — FIXED ✅

- **Bug confirmed as inventoried:** `loadPreset` (app.js) ran a synchronous forEach → `lockGlyph`, locking all 7 chevrons in one tick.
- **Fix:** presets now call the existing manual per-glyph lock function `lockGlyph` once per vector at **280ms** intervals (~1.96s) — per-glyph radar ping, wind rumble, chevron lock animation, and TRACKING telemetry progression, identical to manual dialing.
- **In-universe justification:** *Archived storm-track replay* — the Doppler array re-acquires each stored vector on successive antenna sweeps at radar cadence; every vector still needs its own sweep lock.
- **End state:** identical `PENDING_READY` (activate button enabled, conduit NOT engaged; asserted at completion +1.2s).
- **Disengage during replay:** `DE-ENERGIZE / ABORT` cancels pending sweep timers (abort at 2/7 → 0/7, still 0 after 1.9s). Bonus: engaging the safety hold mid-replay halts remaining sweeps with a single interlock alert instead of five repeated alarms.
- **Screenshot evidence (real dispatched CDP pointer events):** `screenshot_replay_t450.png` (1/7, ISOLATING SECTOR S-01), `screenshot_replay_t1000.png` (3/7), `screenshot_replay_t1550.png` (5/7, ISOLATING SECTOR S-05) — three distinct in-progress states confirmed visually.
- **Regression tests:** full test_build.js PASSED — manual 7-glyph negative auto-fire, preset negative auto-fire, manual activation, both disengage cycles, mid-replay abort, safety-hold interlock block.
- **Version:** 1.0.1 → 1.1.0 (CHANGELOG, version.json, index version tag; Built by: Claude Opus).
- **Commit:** `cea55b9`

## 5. stargate_genomic_sequencer — FIXED ✅

- **Bug confirmed as inventoried:** `loadPreset` (app.js) ran a synchronous forEach → `lockGlyph` for all 8 glyphs.
- **Fix:** presets now call the existing manual per-glyph lock function `lockGlyph` once per locus at **260ms** intervals (~2.08s for 8) — per-locus pipette click, fluorescence lock, chevron animation, SEQUENCING telemetry, identical to manual dialing.
- **In-universe justification:** *Thermocycler program replay* — a validated primer library anneals one locus per PCR cycle at machine speed; each base still requires its own hybridization cycle.
- **End state:** identical `PENDING_READY` (synthesis button enabled, conduit NOT active; asserted at completion +1.2s).
- **Disengage during replay:** `FLOWCELL FLUSH / ABORT` cancels pending cycle timers (abort at 2/8 → 0/8, still 0 after 2s). Safety hold engaged mid-replay halts remaining cycles with one alert.
- **Screenshot evidence (real dispatched CDP pointer events):** `screenshot_replay_t400.png` (1/8, ANNEALING LOC-01), `screenshot_replay_t950.png` (3/8), `screenshot_replay_t1500.png` (5/8, ANNEALING LOC-05) — distinct in-progress states confirmed visually.
- **Regression tests:** full test_build.js PASSED — manual 8-glyph negative auto-fire, preset negative auto-fire, manual activation, both disengage cycles, mid-replay abort, thermal-overheat interlock block.
- **Ops note:** freed port 8085 by stopping the leftover caissa dev server (caissa verification already complete) so the genomic server could bind its documented port.
- **Version:** 1.0.1 → 1.1.0 (CHANGELOG, version.json, index version tag; Built by: Claude Opus).
- **Commit:** `7fe64e1`

## 6. stargate_orbital_atc — FIXED ✅

- **Bug confirmed as inventoried:** `loadPreset` (app.js) ran a synchronous forEach → `lockGlyph` for all 9 glyphs.
- **Fix:** presets now call the existing manual per-glyph lock function `lockGlyph` once per waypoint at **240ms** intervals (~2.16s for 9) — per-waypoint transponder chirp, radar lock beep, chevron animation, ROUTING telemetry, identical to manual vectoring.
- **In-universe justification:** *Filed flight-plan replay* — the flight computer executes a pre-filed departure route at autopilot cadence; every waypoint still requires its own radar lock.
- **End state:** identical `PENDING_READY` (insertion clearance NOT transmitted; asserted at completion +1.2s).
- **Disengage during replay:** `FLIGHT ABORT / VECTOR HOLD` cancels pending autopilot timers (abort at 2/9 → 0/9, still 0 after 2.1s). Safety hold engaged mid-replay halts remaining steps with one alert.
- **Screenshot evidence (real dispatched CDP pointer events):** `screenshot_replay_t400.png` (1/9, VECTORING Z-01), `screenshot_replay_t1000.png` (4/9), `screenshot_replay_t1600.png` (6/9, VECTORING Z-06) — distinct in-progress states confirmed visually.
- **Regression tests:** full test_build.js PASSED — manual 9-glyph negative auto-fire, preset negative auto-fire, manual activation, both disengage cycles, mid-replay abort, collision-safety-hold interlock block.
- **Version:** 1.0.1 → 1.1.0 (CHANGELOG, version.json, index version tag; Built by: Claude Opus).
- **Commit:** `a247a3a`

## 7. stargate_solarpunk_ecogrid — FIXED ✅

- **Bug confirmed as inventoried:** `loadPreset` (app.js) ran a synchronous forEach → `lockGlyph` for all 8 glyphs.
- **Fix:** presets now call the existing manual per-glyph lock function `lockGlyph` once per substation at **260ms** intervals (~2.08s) — per-substation grid pulse, phase-lock chime, chevron animation, ROUTING telemetry, identical to manual coupling.
- **In-universe justification:** *Stored dispatch-schedule replay* — the grid controller runs a pre-balanced dispatch schedule at relay cadence; every substation still requires its own phase lock.
- **End state:** identical `PENDING_READY` (dispatch NOT transmitted; asserted at completion +1.2s).
- **Disengage during replay:** `GRID SCRAM / BUS PURGE` cancels pending relay timers (SCRAM at 2/8 → 0/8, still 0 after 2s). Bus overload hold engaged mid-replay halts remaining relays with one alert.
- **Screenshot evidence (real dispatched CDP pointer events):** `screenshot_replay_t400.png` (1/8, COUPLING SUBSTATION 01), `screenshot_replay_t950.png` (3/8), `screenshot_replay_t1500.png` (5/8; pixels show 6/8 due to capture latency — still clearly mid-sequence) — distinct in-progress states confirmed visually.
- **Regression tests:** full test_build.js PASSED — manual 8-glyph negative auto-fire, preset negative auto-fire, manual activation, both disengage cycles, mid-replay SCRAM, bus-overload interlock block.
- **Version:** 1.0.1 → 1.1.0 (CHANGELOG, version.json, index version tag; Built by: Claude Opus).
- **Commit:** `db1474d`

## 8. stargate_epigraphic_spectrometry — FIXED ✅

- **Bug confirmed as inventoried:** `loadPreset` (app.js) ran a synchronous forEach → `lockGlyph` for all 7 glyphs.
- **Fix:** presets now call the existing manual per-glyph lock function `lockGlyph` once per glyph at **280ms** intervals (~1.96s) — per-glyph laser scan tone, crystal chime, locus chevron animation, SCANNING telemetry, identical to manual dialing.
- **In-universe justification:** *Catalogued cartouche replay* — the spectrometer traverses a fully translated cartouche from the expedition catalogue at servo-stage speed; every glyph still requires its own spectral scan lock.
- **End state:** identical `PENDING_READY` / PENDING EMISSION (golden conduit NOT opened; asserted at completion +1.2s).
- **Disengage during replay:** `PURGE SCANNER / RESET` cancels pending scan timers (purge at 2/7 → 0/7, still 0 after 1.9s). Laser overload hold engaged mid-replay halts remaining scans with one alert.
- **Screenshot evidence (real dispatched CDP pointer events):** `screenshot_replay_t450.png` (1/7, DECODING LOCUS 01), `screenshot_replay_t1000.png` (3/7), `screenshot_replay_t1550.png` (5/7, DECODING LOCUS 05) — distinct in-progress states confirmed visually.
- **Regression tests:** full test_build.js PASSED — manual 7-glyph negative auto-fire, preset negative auto-fire, manual activation (GOLDEN CONDUIT OPEN), both disengage cycles, mid-replay purge, laser-overload interlock block.
- **Version:** 1.0.1 → 1.1.0 (CHANGELOG, version.json, index version tag; Built by: Claude Opus).
- **Commit:** `05d0c47`

## 9. stargate_sonar_abyssal — FIXED ✅

- **Bug confirmed as inventoried:** `loadPreset` (app.js) ran a synchronous forEach → `lockGlyph` for all 6 glyphs.
- **Fix:** presets now call the existing manual per-glyph lock function `lockGlyph` once per bearing at **300ms** intervals (~1.8s for 6) — per-bearing sonar ping, lock chime, transducer chevron animation, DIALING telemetry, identical to manual tuning.
- **In-universe justification:** *Charted bearing-track replay* — the hydrophone array steps a surveyed acoustic track at beamformer cadence; every bearing still requires its own phase lock.
- **End state:** identical `PENDING_READY` / PENDING EMISSION (emission NOT started; asserted at completion +1.2s).
- **Disengage during replay:** `ABORT / DECAVITATE` cancels pending beam timers (abort at 2/6 → 0/6, still 0 after 1.9s). Cavitation safety hold engaged mid-replay halts remaining steps with one alert.
- **Screenshot evidence (real dispatched CDP pointer events):** `screenshot_replay_t480.png` (1/6, TUNING HYDROPHONE 01), `screenshot_replay_t1050.png` (3/6), `screenshot_replay_t1650.png` (5/6, TUNING HYDROPHONE 05) — distinct in-progress states confirmed visually.
- **Regression tests:** full test_build.js PASSED — manual 6-glyph negative auto-fire, preset negative auto-fire, manual activation (CONDUIT ACTIVE), both disengage cycles, mid-replay abort, cavitation interlock block.
- **Version:** 1.0.1 → 1.1.0 (CHANGELOG, version.json, index version tag; Built by: Claude Opus).
- **Commit:** `532c4a1`

## 10. stargate_retro — FIXED ✅

- **Bug confirmed as inventoried:** `sim.recall` (js/sim.js) set `state.live` synchronously, bypassing the entire tune → latch → strike chain manual dialing uses.
- **Fix:** recall now engages a *servo retune* that drives the existing manual path end-to-end: FIGURE knob steps one detent per **150ms** and PHASE vernier one 6° notch per **45ms** through the same `setRatioIdx`/`setPhase` functions, the ordinary `tick()` AFC sustained-tolerance latch (900ms) captures the figure, and the existing `strike()` commits it. Total ~2–3s vs tens of seconds by hand; every stage is its own visible moment on the tube. `live.source` is tagged `'recalled'` afterwards so the [RECALL] tag and flood-flash visuals are preserved.
- **In-universe justification:** the storage mesh can't repaint the deflection state wholesale — the retained trace *drives the AFC servo motors*, which re-turn the knobs at machine speed. README's fast-dial conceit rewritten to match (it previously promised "floods back instantly").
- **End state:** identical struck-live standing trace as a manual dial — AWAITING ENERGIZE; the machine **never throws ENERGIZE itself** (asserted 700ms past strike; screenshots confirm switch untouched, aperture closed).
- **Disengage during replay:** MAINS CUT cancels the servo mid-flight (bench scenario: cut at ~500ms → no live trace, no orphaned steps 2.5s later, mesh still recallable after power restore). Interlocks (HT drop / mesh engaged) halt it; grabbing either knob aborts with a MANUAL OVERRIDE log.
- **Screenshot evidence (real dispatched events via headless CDP):** `test_screenshots/01_replay_early.png` (FREE RUN mid-sweep, FIG 3:2 φ+114°, table shows Δ+78° remaining), `01_replay_mid.png` (phase arrived +36°, awaiting latch), `01_replay_latch.png` / `02_replay_complete_standing.png` (AFC LATCH, TRACE LIVE TR-03, SERVO RETUNE COMPLETE — AWAITING ENERGIZE) — distinct in-progress states confirmed visually.
- **Regression tests:** in-page bench (production DOM, real dispatched hit-tested events) **35/35 PASS** — geometry audit, full manual dial, staged recall (multiple distinct tuning states, latch before strike, no self-energize), mains-cut-during-retune, all interlock guards.
- **Environment note:** the in-app Browser pane reported a 0×0 hidden viewport this session (elementFromPoint dead), so verification ran through headless Chrome CDP at 1920×1080 — same rig as the other repos.
- **Version:** 1.0.2 → 1.1.0 (CHANGELOG, version.json, index footer; Built by: Claude Opus, original by Claude Fable).
- **Commit:** `9e64ecf`

---
## Consolidated summary

All 10 repos fixed, verified, and committed individually. None of the excluded repos were touched.
See FINAL REPORT section below.

# FINAL REPORT — 2026-08-15

| # | Repo | Fixed | Pacing | In-universe justification | Commit |
|---|------|-------|--------|---------------------------|--------|
| 1 | stargate_caissa_workstation | ✅ | 280ms/ply ×7 | Transposition-table cache replay through alpha-beta lock | `3c0aaf2` |
| 2 | stargate_mastering_suite | ✅ | 280ms/channel ×7 | Motorized patchbay servo recall, one jack at a time | `d4dc21a` |
| 3 | stargate_synchrotron_collider | ✅ | 300ms/sector ×6 | Injection sequencer energizes dipoles in ring order | `9f5b2cf` |
| 4 | stargate_meteorological_nexrad | ✅ | 280ms/vector ×7 | Archived storm-track replay, one vector per antenna sweep | `cea55b9` |
| 5 | stargate_genomic_sequencer | ✅ | 260ms/locus ×8 | Thermocycler primer-library replay, one locus per PCR cycle | `7fe64e1` |
| 6 | stargate_orbital_atc | ✅ | 240ms/waypoint ×9 | Filed flight plan executed at autopilot cadence | `a247a3a` |
| 7 | stargate_solarpunk_ecogrid | ✅ | 260ms/substation ×8 | Pre-balanced dispatch schedule at relay cadence | `db1474d` |
| 8 | stargate_epigraphic_spectrometry | ✅ | 280ms/glyph ×7 | Catalogued cartouche re-scanned at servo-stage speed | `05d0c47` |
| 9 | stargate_sonar_abyssal | ✅ | 300ms/bearing ×6 | Surveyed bearing track stepped at beamformer cadence | `532c4a1` |
| 10 | stargate_retro | ✅ | 150ms/detent + 45ms/notch + real 900ms AFC latch | Retained trace drives the AFC servo motors | `9e64ecf` |

Per-repo confirmations (all 10):
- **In-progress screenshot evidence:** captured during the replay via real dispatched events, showing ≥2 distinct mid-sequence lock states plus the armed/pending end state (paths listed in each repo section above).
- **No-auto-fire:** re-verified after the fix — every replay lands in the same pending/armed state as manual dialing and never activates on its own (asserted ≥1s after the final lock; repos 1–9 also re-ran their original manual negative auto-fire tests, repo 10 its guards scenario).
- **Disengage during replay:** re-verified — the abort control cancels all pending replay timers mid-sequence with no orphaned locks firing afterwards (new dedicated test in every repo), and existing disengage/redial cycle tests still pass.
- **Reuse, not reinvention:** every fix calls the repo's own existing manual per-symbol lock function in sequence (`dialMove`, `toggleChannelPatch`, `selectSector`+`engageSelectedSector`, `lockGlyph` ×6, `setRatioIdx`/`setPhase`+`tick()` latch+`strike()`); no new lock/animation logic was written.
- **Attribution:** each CHANGELOG gained an incremented version entry with **Built by:** Claude Opus for this fix, explicitly preserving the original builder credit; version.json updated to match.

**Excluded repos untouched — confirmed:** no commit in this session includes paths under Stargate_OG, Stargate_fable*, *.presubtree-backup, hub/, stargate_bureaucratic_mainframe, stargate_dieselpunk*, stargate_low_magicv2, Stargate_low_magic, stargate_steampunk, stargate_blueprint_alpha, stargate_blueprint_drafting, stargate_high_magic, stargate_low_scifi_maintenance, stargate_modern, or stargate_cyberpunk; their pre-existing uncommitted changes remain exactly as found. (One shared file outside the 10 repos was edited but deliberately left uncommitted: the untracked root `.claude/launch.json` gained an `augur-retro` dev-server entry used for verification.)
