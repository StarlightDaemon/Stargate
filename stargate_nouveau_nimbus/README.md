# Stargate : Le Nimbus Florié (Art Nouveau Botanical Portal)

> **Operator Verification Note:** Direct operator testing confirmed this build is fully functional end-to-end — manual dial, three-stage activation (Buildup &rarr; Breakthrough &rarr; Sustained Active), disengage, and quick-dial auto-dial all working as intended. This build represents this project's fourth deliberate departure from the digital-glow HUD register (Art Nouveau / Belle Époque poster aesthetic), and specifically the first deliberately maximalist-scope build in this line — incorporating expanded feature depth, `localStorage` session persistence, coupled simulated telemetry, and a deeply cross-referenced in-universe archive. The operator evaluated the build and found it completely successful.

---

**Persistence:** `localStorage` only, under the single key `nouveau_nimbus_session_v1`: dial history, discovered and bookmarked archive entries, session logs, operator notes, colour mood, motion intensity, gaslight flicker and a last-saved timestamp. Gate state and the safety interlock are not persisted.

## Overview

**Stargate: Le Nimbus Florié** is an interactive Belle Époque aetheric transit portal interface set in Paris (circa 1900), styled after the poster compositions of Alphonse Mucha, the curvilinear cast-iron architecture of Hector Guimard, and the botanical glasswork of Victor Horta and Émile Gallé.

### Key Highlights
- **Authentic Art Nouveau Poster Composition:** Dominant halo nimbus portal gateway framed by organic whiplash curves, mineral jewel-tone palettes, and integrated Belle Époque typography.
- **Lithographic 2-Pass Locking Mechanism:** Physical metaphor grounded in Solnhofen limestone lithography (Crayon Gras contour drawing followed by mineral color wash settling in perfect registration).
- **The Ennead of Botanical Phases:** 9 botanical and entomological motifs with specific harmonic frequencies (396 Hz to 963 Hz) requiring a 7-glyph sequence (*Septet of Harmony*).
- **Three-Stage Staged Activation:** Explicit Buildup (2.0s), Breakthrough radiant flash (0.8s), and Sustained Active vortex flow.
- **Negative Auto-Fire Safeguard & Botanical Safety Latch:** Sequences hold strictly in `PENDING` until operator engagement; safety latch defaults to RELEASED (open).
- **8 Preloaded Quick-Dial Destinations:** Spanning Tier I (Regional Métropolitain) and Tier II (Deep Aetheric Sanctuaries) with staged per-segment auto-dialing.
- **22 Cross-Referenced In-Universe Archive Folios:** Fully hyperlinked relational lore covering stations, founders, flora, patents, and treaties.
- **Coupled Simulated Telemetry Engine:** Live interconnected physical parameters (Viscosity, Resonance, Pressure, Luminance, Chroma, Pollen Drift).
- **Single-Session Persistence:** LocalStorage state preservation across page reloads.
- **Synthesized Web Audio Engine:** Multi-channel procedural audio for crayon friction, glass beading bells, stone press settling thuds, harmonium drone, and breakthrough chords.

---

## Local Development & Execution

To run the lightweight static server:
```bash
node server.js
```
Then open `http://localhost:8088/` (or `http://localhost:8090/`) in your browser.

To run automated end-to-end verification via Puppeteer:
```bash
node test/verify.js
```
