# Verification report — DSV-7 Cerulean Lantern v1.0.0

Generated 2026-08-23T08:48:06.652Z against http://127.0.0.1:8747/

## 1. Cold start @ 1920×1080
  ✔ cold start is idle with empty profile — phase=idle seq=[] depth=0 m
  ✔ hull-integrity lockout DEFAULTS TO RELEASED — sim.lockout=false checkbox=false label="RELEASED"
  ✔ commence disabled at cold start, emergency ascent armed
  ✔ stage scale at 1920×1080 — viewport 1920×1080 → --ui-scale=1 transform=matrix(1, 0, 0, 1, 0, 0)
  ✔ no scrolling needed for the core interface — {"sw":1920,"sh":1080,"cw":1920,"ch":1080}
  📷 01_cold_start_1080p.png — idle, ambient only
  ✔ idle state never auto-dials (4 s observed) — phase=idle seq=0 depth=0
  ✔ corner display: ? / StarlightDaemon link / version — {"help":true,"author":"https://github.com/StarlightDaemon rel=noopener noreferrer","version":"v1.0.0"}

## 2. Manual dial — cycle 1 (Abyssal Plain profile, 7 waypoints)
  ✔ select waypoint 1 THR: hit-test at (332,278) box 187×91 — elementFromPoint → span.g-name
  ✔ lock 1 started (ballast flood) — phase=locking bt1=0 msg="WP 1 · FLOODING BALLAST → THERMOCLINE BENCH 180 m"
  📷 02_lock_flood_stage.png — WP1 flooding: depth 182 m, ballast filling
  ✔ selection during trim sequence is refused — TRIM SEQUENCE IN PROGRESS (MIDN)
  📷 03_lock_settle_stage.png — WP1 settling: depth 180 m, VTP 0.01, TRIM SEQUENCE IN PROGRESS
  ✔ neutral-buoyancy hold confirmed at waypoint 1 — hold 180 m, depth 180 m, phase=idle, hull 1.7 %
  ✔ attempt shallower stratum KEL after THR hold: hit-test at (137,278) box 187×91 — elementFromPoint → span
  ✔ profile monotonic check rejects a shallower stratum — PROFILE MUST DESCEND (KEL)
  ✔ select waypoint 2 DUSK: hit-test at (137,372) box 187×80 — elementFromPoint → span
  ✔ lock 2 started (ballast flood) — phase=locking bt1=0.29 msg="WP 2 · FLOODING BALLAST → TWILIGHT SILL 420 m"
  ✔ neutral-buoyancy hold confirmed at waypoint 2 — hold 420 m, depth 420 m, phase=idle, hull 3.8 %
  ✔ select waypoint 3 OXM: hit-test at (137,465) box 187×91 — elementFromPoint → span.g-name
  ✔ lock 3 started (ballast flood) — phase=locking bt1=0.3 msg="WP 3 · FLOODING BALLAST → OXYGEN MINIMUM 950 m"
  ✔ neutral-buoyancy hold confirmed at waypoint 3 — hold 950 m, depth 950 m, phase=idle, hull 8.5 %
  ℹ telemetry at 950 m: pressure 96.7 bar, water 3.31 °C, light 0 lux, hull 8.5 %
  ✔ select waypoint 4 MIDN: hit-test at (332,465) box 187×91 — elementFromPoint → span
  ✔ lock 4 started (ballast flood) — phase=locking bt1=0.33 msg="WP 4 · FLOODING BALLAST → MIDNIGHT GATE 1 400 m"
  📷 03b_lock_settle_wp4.png — WP4 settling toward 1 400 m: depth 1400 m, thrusters 0.48
  ✔ neutral-buoyancy hold confirmed at waypoint 4 — hold 1400 m, depth 1400 m, phase=idle, hull 12.5 %
  ✔ select waypoint 5 CALD: hit-test at (137,558) box 187×80 — elementFromPoint → span.g-depth
  ✔ lock 5 started (ballast flood) — phase=locking bt1=0.36 msg="WP 5 · FLOODING BALLAST → CALDERA RIM 2 100 m"
  ✔ neutral-buoyancy hold confirmed at waypoint 5 — hold 2100 m, depth 2100 m, phase=idle, hull 18.8 %
  ✔ select waypoint 6 VENT: hit-test at (332,558) box 187×80 — elementFromPoint → span.g-depth
  ✔ lock 6 started (ballast flood) — phase=locking bt1=0.4 msg="WP 6 · FLOODING BALLAST → VENT FIELD 2 650 m"
  ✔ neutral-buoyancy hold confirmed at waypoint 6 — hold 2650 m, depth 2650 m, phase=idle, hull 23.7 %
  ✔ select waypoint 7 PLN: hit-test at (137,651) box 187×91 — elementFromPoint → span.g-depth
  ✔ lock 7 started (ballast flood) — phase=locking bt1=0.43 msg="WP 7 · FLOODING BALLAST → ABYSSAL PLAIN 3 800 m"
  ✔ neutral-buoyancy hold confirmed at waypoint 7 — hold 3800 m, depth 3800 m, phase=pending, hull 34.1 %
  ✔ profile complete → PENDING (not active) — phase=pending hold=3800 m aperture=0
  ✔ COMMENCE FINAL DESCENT armed in pending state
  ℹ core loop: 7 waypoint clicks + 1 activation = 8 actions, 2 clusters (DESCENT PROFILE, HELM)
  📷 04_pending_profile_complete.png — 7/7 locked, approach hold 3800 m, ring 3860 m

## 3. Negative test — completion must NOT auto-fire
  ✔ no activation for 4.5 s after 7th lock — phase=pending aperture=0 glow=0
  ✔ stray click on the observation sphere: hit-test at (960,482) box 660×660 — elementFromPoint → canvas#viewport
  ✔ stray click on a glyph while pending: hit-test at (332,651) box 187×91 — elementFromPoint → span.g-name
  ✔ stray events (Enter, Space, sphere click, glyph click) do not activate — phase=pending lastLog=REJECT: PROFILE COMPLETE — COMMENCE OR ASCEND (FRAC)

## 4. Safety interlock — engage, attempt, verify block, release
  ✔ engage hull-integrity lockout: hit-test at (1358,970) box 150×114 — elementFromPoint → span.lk-switch
  ✔ lockout engaged via real click — label="ENGAGED"
  ✔ press COMMENCE with lockout engaged: hit-test at (883,970) box 244×114 — elementFromPoint → span.hb-title
  ✔ activation blocked; unmissable banner shown — phase=pending banner visible=true commence class=helm-btn helm-commence lockout-blocked
  📷 05_lockout_blocked.png — lockout engaged — descent inhibited banner
  ✔ release lockout: hit-test at (1358,970) box 150×114 — elementFromPoint → span.lk-switch
  ✔ lockout released, banner cleared

## 5. Activation — three distinct stages
  ✔ COMMENCE FINAL DESCENT: hit-test at (883,970) box 244×114 — elementFromPoint → span.hb-title
  ✔ BUILDUP stage entered — from 3800 m
  📷 06_stage_buildup.png — buildup t≈1.1 s: depth 3817 m, lightDim 0.46, glow 0.19, hull 34.2 %
  📷 07_stage_breakthrough.png — breakthrough t≈0.35 s: depth 3860 m, aperture 0.83, glow 0.89
  📷 08_stage_sustained_active.png — sustained active t≈2.5 s: depth 3860 m, aperture 1, hull 34.6 %
  ✔ three stages observed in order — buildup depth 3817 → breakthrough 3860 → active 3860 m
  ✔ stage screenshots are pixel-distinct from each other — diff fraction buildup↔breakthrough 0.497, breakthrough↔active 0.334, buildup↔active 0.289, cold↔active 0.290
  ℹ sphere mean luminance: cold 57.0, buildup 18.4, breakthrough 75.1, active 46.4
  ✔ buildup darker than idle (ambient light dimming with depth)
  ✔ breakthrough brighter than buildup (aperture + flash)
  ✔ sustained active holds depth with aperture open (+2 s) — depth 3860 m, hold 3860 m, helm="ACTIVE · RING HOLD 3 860 m"
  ✔ EMERGENCY ASCENT remains enabled while active

## 6. Disengage — emergency ascent from active (cycle 1 complete)
  ✔ EMERGENCY ASCENT while active: hit-test at (1144,970) box 250×114 — elementFromPoint → span.hb-sub
  ✔ ascending; profile cleared immediately — depth 1339 m, bt1 0.07
  📷 09_emergency_ascent.png — blow all ballast: depth 1339 m, ballast 0.07
  ✔ surfaced → idle, commence disabled again — depth 0
  ✔ dive recorded to persisted pilot record — history entries: 1

## 7. Redial via DIVE COMPUTER quick-dial (verified TL-02) — cycle 2
  ✔ open DIVE COMPUTER tab: hit-test at (1445,32) box 135×33 — elementFromPoint → button.tab
  ✔ quick-dial tiers present — verified 4, experimental 3, panel text 1611 chars
  📷 10_panel_dive_computer.png — quick-dial tiers + pilot record
  ✔ replay TL-02 Trench Lip Ring: hit-test at (988,463) box 515×162 — elementFromPoint → div.pr-seq
  ✔ replay started (panel closed, sequence running) — auto=true phase=idle
  📷 11_replay_wp2.png — replay in progress: 1/7 locked, phase=idle, depth 700 m
  📷 12_replay_wp4.png — replay in progress: 3/7 locked, phase=locking, depth 2109 m
  📷 13_replay_wp6.png — replay in progress: 5/7 locked, phase=locking, depth 5617 m
  ✔ replay is visibly staged, not an instant jump — locked count at samples: 1 → 3 → 5
  ✔ replay lands PENDING with the logged profile — seq=LANT→MIDN→CALD→VENT→PLN→SCRP→TRN hold 6300 m
  ✔ replay never auto-fires (3 s observed) — phase=pending
  📷 14_replay_pending.png — TL-02 replay complete — pending, awaiting pilot
  ✔ COMMENCE FINAL DESCENT (cycle 2): hit-test at (883,970) box 244×114 — elementFromPoint → span.hb-title
  ✔ second activation reaches sustained active — ring depth 6360 m, hull 57.3 %, pressure 649.1 bar
  📷 15_active_cycle2_trench_lip.png — active at 6360 m, hull 57.3 %
  ✔ open VESSEL cross-section while active: hit-test at (1332,32) box 79×33 — elementFromPoint → button.tab
  ✔ cross-section shows live ballast fill while active — BT1 fill rect height 46.40581818179658
  📷 15b_panel_vessel_live_active.png — cross-section live during ring hold
  ✔ close VESSEL: hit-test at (1696,125) box 37×35 — elementFromPoint → button.panel-close
  ✔ EMERGENCY ASCENT (cycle 2): hit-test at (1144,970) box 250×114 — elementFromPoint → span.hb-sub
  ✔ cycle 2 disengaged → idle

## 8. Disengage mid-replay + mid-manual (always reachable)
  ✔ open DIVE COMPUTER: hit-test at (1445,32) box 135×33 — elementFromPoint → button.tab
  ✔ replay experimental SB-X1: hit-test at (463,684) box 515×184 — elementFromPoint → div.pr-meta
  ✔ EMERGENCY ASCENT during replay: hit-test at (1144,970) box 250×114 — elementFromPoint → span.hb-sub
  ✔ replay aborted by emergency ascent — had 1 locked when aborted
  ✔ manual WP1 LANT: hit-test at (332,370) box 187×78 — elementFromPoint → span
  ✔ manual WP2 CALD: hit-test at (137,558) box 187×80 — elementFromPoint → span.g-depth
  ✔ EMERGENCY ASCENT during a trim sequence: hit-test at (1144,970) box 250×114 — elementFromPoint → span.hb-sub
  ✔ ascent interrupts an in-progress lock
  ✔ pilot record accumulates — aborted@2070m | aborted SB-X1@1728m | ring hold TL-02@6360m | ring hold@3860m

## 9. Secondary panels — each opened and screenshotted
  ✔ open DIVE ARCHIVE: hit-test at (1243,32) box 87×33 — elementFromPoint → button.tab
  ✔ open archive record D-117: hit-test at (462,459) box 514×34 — elementFromPoint → span.ar-title
  ✔ archive record opened with cross-references — "First Threshold contact — Ring Beta" refs+backlinks=10
  ✔ follow cross-reference → DS-002: hit-test at (983,472) box 468×29 — elementFromPoint → span.ar-title
  ✔ cross-reference navigation works, backlinks computed — now at DS-002 "Threshold Ring Beta", referenced-by 4; viewed persisted: D-117,DS-002
  ℹ archive lists 55 records
  ✔ DIVE ARCHIVE renders real content (not blank) — 3239 chars of text, 1560×900 px
  📷 16_panel_archive.png — DIVE ARCHIVE
  ✔ close DIVE ARCHIVE: hit-test at (1696,125) box 37×35 — elementFromPoint → button.panel-close
  ✔ DIVE ARCHIVE closed
  ✔ open VESSEL CROSS-SECTION: hit-test at (1332,32) box 79×33 — elementFromPoint → button.tab
  ✔ cross-section SVG populated — 111 SVG nodes
  ✔ VESSEL CROSS-SECTION renders real content (not blank) — 747 chars of text, 1560×900 px
  📷 16_panel_vessel.png — VESSEL CROSS-SECTION
  ✔ close VESSEL CROSS-SECTION: hit-test at (1696,125) box 37×35 — elementFromPoint → button.panel-close
  ✔ VESSEL CROSS-SECTION closed
  ✔ open DIVE COMPUTER: hit-test at (1445,32) box 135×33 — elementFromPoint → button.tab
  ✔ DIVE COMPUTER renders real content (not blank) — 1865 chars of text, 1560×900 px
  📷 16_panel_computer.png — DIVE COMPUTER
  ✔ close DIVE COMPUTER: hit-test at (1696,125) box 37×35 — elementFromPoint → button.panel-close
  ✔ DIVE COMPUTER closed
  ✔ open SESSION LOG: hit-test at (1577,32) box 117×33 — elementFromPoint → button.tab
  ✔ session log has real entries — 97 entries; first: "console online — DSV-7 Cerulean Lantern · session 1 on this device · lockout RELEASED"
  ✔ SESSION LOG renders real content (not blank) — 7173 chars of text, 1560×900 px
  📷 16_panel_log.png — SESSION LOG
  ✔ close SESSION LOG: hit-test at (1696,125) box 37×35 — elementFromPoint → button.panel-close
  ✔ SESSION LOG closed
  ✔ open SETTINGS: hit-test at (1688,32) box 93×33 — elementFromPoint → button.tab
  ✔ switch mood → amber: hit-test at (354,264) box 102×66 — elementFromPoint → span.sw
  ✔ mood applied live
  ✔ density → dense: hit-test at (1224,248) box 76×35 — elementFromPoint → button
  ✔ motion → high: hit-test at (396,394) box 65×35 — elementFromPoint → button
  ✔ toggle hull-groan audio layer: hit-test at (1674,554) box 60×24 — elementFromPoint → button.on
  ✔ SETTINGS renders real content (not blank) — 1108 chars of text, 1560×900 px
  📷 16_panel_settings.png — SETTINGS
  ✔ close SETTINGS: hit-test at (1696,125) box 37×35 — elementFromPoint → button.panel-close
  ✔ SETTINGS closed
  ✔ open operator reference (?): hit-test at (1882,34) box 40×40 — elementFromPoint → button#help-btn.corner
  ✔ operator reference overlay renders — 9 sections, 2574 chars
  📷 17_operator_reference.png — help overlay
  ✔ dismiss operator reference: hit-test at (1456,187) box 37×35 — elementFromPoint → button#help-close.panel-close
  ✔ operator reference dismissed
  📷 18_amber_dense_mood.png — amber mood, dense density (settings applied)

## 10. Persistence across reload (localStorage)
  ℹ localStorage keys: {"lantern.v1.sessions":1,"lantern.v1.prefs":150,"lantern.v1.history":586,"lantern.v1.viewed":18}
  ✔ preferences survive reload — {"mood":"amber","density":"dense","motion":"high","hist":4,"viewed":2,"lockout":false,"groans":false,"sessions":2}
  ✔ dive history and viewed archive entries survive reload — history 4, viewed 2, device sessions 2
  ✔ lockout is NOT persisted — released again after reload
  ✔ open settings: hit-test at (1682,32) box 93×33 — elementFromPoint → button.tab
  ✔ mood → cerulean: hit-test at (249,264) box 88×66 — elementFromPoint → span.sw
  ✔ density → standard: hit-test at (1130,248) box 101×35 — elementFromPoint → button
  ✔ motion → normal: hit-test at (315,394) box 86×35 — elementFromPoint → button
  ✔ close settings: hit-test at (1696,125) box 37×35 — elementFromPoint → button.panel-close

## 11. Simulated 4K (3840×2160)
  ✔ stage scales ×2 at 4K — viewport 3840×2160 → --ui-scale=2 transform=matrix(2, 0, 0, 2, 0, 0)
  📷 20_4k_cold.png — 3840×2160 idle
  ✔ 4K screenshot dimensions — 3840×2160
  ✔ open DIVE COMPUTER at 4K: hit-test at (2889,63) box 270×66 — elementFromPoint → button.tab
  ✔ replay VF-12 at 4K (hit-test at scaled position): hit-test at (925,584) box 1030×323 — elementFromPoint → div.pr-seq
  📷 21_4k_pending.png — VF-12 pending at 4K
  ✔ COMMENCE at 4K: hit-test at (1766,1940) box 488×228 — elementFromPoint → span.hb-title
  📷 22_4k_active.png — active at 4K
  ✔ EMERGENCY ASCENT at 4K: hit-test at (2288,1940) box 500×228 — elementFromPoint → span.hb-sub

## 12. Non-16:9 viewports — background fill check
  📷 23_ultrawide_2560x1080.png — 2560×1080 → --ui-scale=1.0000 transform=matrix(1, 0, 0, 1, 0, 0)
  ✔ 2560×1080: edges filled with theme background, no blank space — edge samples [[10,35,51],[9,34,48],[4,15,22],[5,18,25],[11,37,53],[4,18,26],[8,30,42],[7,30,41]]; left/right bands {"side":"left/right bands","left":[8,30,42],"right":[7,30,42]}
  📷 24_narrow_1280x1024.png — 1280×1024 → --ui-scale=0.6667 transform=matrix(0.666667, 0, 0, 0.666667, 0, 0)
  ✔ 1280×1024: edges filled with theme background, no blank space — edge samples [[9,35,50],[9,35,49],[4,15,22],[5,17,24],[12,43,59],[4,18,26],[8,31,42],[8,29,40]]; top/bottom bands {"side":"top/bottom bands","top":[11,39,54],"bottom":[4,17,25]}
  📷 25_tall_1920x1200.png — 1920×1200 → --ui-scale=1.0000 transform=matrix(1, 0, 0, 1, 0, 0)
  ✔ 1920×1200: edges filled with theme background, no blank space — edge samples [[10,36,50],[9,34,48],[4,15,22],[5,17,25],[11,43,58],[4,18,26],[8,30,42],[6,29,41]]; top/bottom bands {"side":"top/bottom bands","top":[10,38,53],"bottom":[4,16,24]}

## 13. Metadata
  ✔ version.json has BOTH "version" and "model" — version="1.0.0" model="Claude Fable 5 (high reasoning)"
  ✔ CHANGELOG v1.0.0 with Built-by line
  ✔ no page errors / console errors during the whole run — none

# RESULT: 133 passed, 0 failed
