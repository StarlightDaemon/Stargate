# Changelog

All notable changes to the **Stargate: Le Nimbus Florié (Art Nouveau Botanical Portal)** project will be documented in this file.

## [1.0.1] - 2026-09-04

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline in `--teal-deep` with a soft shadow on the nav ribbon, operator reference, activate, clear-sequence, modal close, litho plate and archive category buttons, the archive search input, the footer credit link, range inputs and the safety latch; `--vermeil-gold-light` on the disengage button; `--rose-deep` on the codex link. Added alongside the existing rules; no existing rule altered.
- Declared client-side persistence: `"persistence": "localStorage"` in `version.json` and a **Persistence:** line in the README naming the single key `nouveau_nimbus_session_v1` (dial history, discovered and bookmarked archive entries, session logs, operator notes, colour mood, motion intensity, gaslight flicker, last-saved timestamp; gate state and the safety interlock are not persisted), read from the storage code. No storage behaviour changed.

### Fixed
- The botanical safety latch (`#safety-latch-toggle`) was a plain `div` and could not be reached or activated from the keyboard. `index.html` now gives it `role="button"` and `tabindex="0"`, and `js/app.js` adds an Enter/Space keydown handler that toggles the latch exactly as a click does, stopping propagation so the window-level Enter/Space activate shortcut does not fire on top of it.
- The quick-dial preset cards (`.preset-card`) and the archive codex nav items (`.archive-nav-item`) were plain `div`s, created in `js/app.js`, and could not be reached or activated from the keyboard. `js/app.js` now sets `role="button"` and `tabindex="0"` on each as it is created, and adds an Enter/Space keydown handler that performs the same action as the existing click handler (trigger the preset's auto-dial; open the archive entry), stopping propagation so the window-level Enter/Space activate shortcut does not fire on top of it. Completes the keyboard-accessibility pass started with the safety latch above. Built by Claude Sonnet 5, 2026-09-04. Version number left unchanged; whether this warrants a bump is for operator review.

## [1.0.0] - 2026-08-22

**Built by:** Gemini 3.7 Flash

> **Operator Verification Note:** Direct operator testing confirmed this build fully functional end-to-end — manual dial, three-stage activation (Buildup, Breakthrough, Sustained Active), disengage, and quick-dial auto-dial all working as intended. This represents this project's fourth deliberate departure from the digital-glow HUD register (Art Nouveau / Belle Époque poster aesthetic), and specifically the first deliberately maximalist-scope build in this line — incorporating expanded feature depth, localStorage session persistence, coupled simulated telemetry, and a deeply cross-referenced in-universe archive on top of standard artistic-register requirements. The operator evaluated the build and found it completely successful.

### Added
- **Art Nouveau Belle Époque Aesthetic Register**: Complete visual design grounded in Alphonse Mucha, École de Nancy, and Hector Guimard traditions, featuring organic whiplash curves, floriated borders, gilded cartouches, jewel-tone mineral palettes, and halo/nimbus poster framing.
- **Lithographic 2-Pass Locking Mechanism**: Physical metaphor grounded in chromolithography, drawing greasy crayon contours before floating rich mineral pigment washes in perfect registration.
- **Ennead & Septet Gateway System**: 9-segment halo ring (*Ennead of Botanical Phases*) requiring a 7-glyph sequence (*Septet of Harmony*) across 9 original botanical and entomological motifs.
- **Three-Stage Staged Activation**: Explicit Buildup (1.8s blooming tendrils and incandescent gaslights), Breakthrough (radiant aperture flash and glass-bell crescendo), and Sustained Active (flowing aetheric ripples and luminous spore drift).
- **Negative Auto-Fire Safeguard**: Sequences hold in `PENDING / ENGAGED REGISTRATION` until the user manually triggers the gilded activation control.
- **Botanical Safety Interlock**: Gilded safety latch defaulting to RELEASED (disengaged), preventing inadvertent aperture activation when set.
- **Auto-Dial Quick Presets**: 6+ preloaded destinations across 2 tiers (Tier I: Regional Métropolitain, Tier II: Deep Aetheric Sanctuaries) with authentic step-by-step visual sequencing.
- **Cross-Referenced Archive Codex**: 20+ deeply linked in-universe entries detailing stations, founders, botanical curiosities, transit history, and lithographic patents with bidirectional navigation.
- **Simulated Coupled Telemetry**: Interconnected physical metrics (Aetheric Viscosity, Nimbus Harmonic Resonance, Luminance Flux, Litho-Pressure, Chroma Purity, Pollen Drift) with dynamic responsive relationships.
- **Session Persistence**: Full single-session persistence via browser `localStorage` saving dial history, user bookmarks, notes, active color moods, audio mix, and motion preferences.
- **Synthesized Web Audio Engine**: Layered soundscape including lithographic crayon friction, crystal glass beading bells, stone-press thuds, warm organ/harp drone, and triumphant breakthrough chords.
- **Period Color Moods**: 4 selectable authentic palettes (*Vermeil & Teal de Nancy*, *Secession Rose & Obsidian*, *Verdigris & Absinthe*, *Gold Leaf & Sèvres Azure*).
- **Operator Reference & Operational Folio**: Belle Époque reference overlay (`?` button) and live timestamped session event logger.
- **Universal Viewport Scaling**: Flawless scaling from 1080p to 4K (3840x2160) without scroll.
