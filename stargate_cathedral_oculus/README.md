# The Grand Vitrarium of Lumisfer (`stargate_cathedral_oculus`)

> **Direct Operator Testing Confirmation**: Direct operator testing confirmed this build is fully functional end-to-end—manual dial, three-stage activation, disengage, and quick-dial auto-dial all working as intended. This build represents the project's second deliberate departure from the digital-glow HUD register into a Gothic stained-glass architectural aesthetic, confirmed successful in direct testing.

An interactive novelty portal-dialing website set within a Gothic Cathedral sanctuary console, featuring the Great Rose Window (Oculus) constructed with flat leaded stained glass, structural lead came tracery, acoustic cathedral sound synthesis, and liturgical controls.

## Features
- **Gothic Cathedral Facade Elevation**: Soaring vertical hierarchy with lancet bays, carved stone tracery spandrels, candlelit ambient atmosphere, and the crowning Rose Window Oculus.
- **Flat Leaded Stained-Glass Rendering**: Saturated jewel-toned flat glass panes divided by heavy dark structural lead came lines and warm backlit luminescence.
- **Two-Stage Locking**: Glass pane seating (crystal chime) followed by lead came soldering & sealing (flux hiss + lock ping).
- **Non-Auto-Firing Activation**: 7-light sequence arrives in PENDING state; manual ignition executes three explicit stages: BUILDUP (1.8s) -> BREAKTHROUGH (1.2s) -> SUSTAINED ACTIVE.
- **Quick-Dial Presets**: 8 preloaded destinations across 2 tiers with genuine visible per-light auto-dial sequencing.
- **Safety Interlock**: Chantry Anathema Latch (defaults to released).
- **Web Audio Synthesis**: Procedural wine-glass resonance, bronze cathedral toll bells, 32-foot pipe organ pedals, and soldering flux sizzle.
- **Operator Codex**: Collapsible illuminated manuscript reference overlay.

## Running Locally
```bash
npm start
# or select a port: npm start -- --port 8081
```
Open `http://127.0.0.1:8080` in your browser.


## Shared verification dependencies — 2026-11-08

Browser verification uses the shared tools installed at the repository root. Run `npm ci --ignore-scripts` there before using this exhibit's verification commands, with system Chrome configured as required by the harness. Existing package commands and application assets are unchanged by this dependency maintenance.

Normal `npm start` uses the shared loopback preview on port `8080`. Set `PORT` or pass `-- --port NUMBER` (also `-p`); explicit arguments take precedence. Invalid or occupied ports fail. Only tracked public assets are served; development files, raw traversal and unsupported methods are refused.

`npm test` owns both loopback comparison listeners and the browser while retaining all original assertions. Run `npm ci --ignore-scripts` here before comparison; retained `http-server` supplies the historical package transport. Use this supported test entry point instead of invoking the historical embedded listener directly.

Source-serving qualification passed the original 32/32 records on both transports, eight public assets and cancellation observations in run `42512882276`, job `128829555716`. Paired screenshots also showed intermittent top-title clipping in both transports; that existing visual limitation remains unresolved. Sound/operator acceptance, merge and deployment remain on HOLD.
