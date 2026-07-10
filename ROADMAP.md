# GATE DIALING COMPUTER — Feature Roadmap

Living backlog of planned features, adjustments, and refinements for the fan
Stargate dialing-computer site. Single-page vanilla HTML/CSS/JS, no build step.

> Sources, provenance, licensing, and attribution for everything below live in
> **[RESEARCH.md](RESEARCH.md)** — check it before adopting any third-party code or asset.

Effort key: **S** ≈ an afternoon · **M** ≈ a day · **L** ≈ multi-session.

---

## ✅ Done

- **Wormhole FX polish** (2026-06-30) — kawoosh rebuilt as an in-SVG unstable-vortex
  eruption (shock ring + turbulent core + flash); active event horizon now has an
  animated fractal-displacement shimmer, luminance pulse, and expanding surface
  ripples; `establishWormhole()` reordered for a seamless vortex→puddle settle.

---

## The original three (from the direction menu)

1. **Authentic glyph art** · M — replace the Unicode/Greek placeholder glyphs
   (`addresses.js`) with real Stargate constellation symbols, wiring in the SVG
   glyph sets already in `references/vectors/` (`symbol_set_1/2.svg`, detailed-glyph
   gate SVGs). Biggest authenticity win.
2. **Iris system** · M — build out `toggleIris()` (currently a stub in `engine.js`)
   into a real closing-shield animation over the event horizon, with a UI control.
3. **Physics & audio realism** · M — smooth the ring deceleration curve (hard 30°
   friction threshold today), give chevron 9 (master/last lock) a distinct dramatic
   moment, and make the ring-rotation rumble sustain the full spin instead of the
   0.5s clip that truncates.

---

## Backlog — first ten

### Gameplay & drama
4. **Incoming wormhole — "Unscheduled Off-World Activation"** · M — gate dials *in*:
   chevrons light without ring spin, red-alert klaxon, `INCOMING WORMHOLE` banner,
   iris-close prompt. Wires up the dormant `alarm` sound slot (`audio.js`, currently `null`).
5. **Dial failure & malfunction states** · M — chevron fails to lock / vortex
   collapse / `NO SUCH ADDRESS`. Adds stakes to a currently always-succeeds sequence.
6. **38-minute wormhole limit** · S — live countdown while active, auto-disconnect +
   warning near expiry.
7. **MALP / telemetry readout** · M — post-connection panel expanding `destInfo`:
   `SEND MALP` action revealing destination atmosphere/temp/hazard + camera-static frame.

### Content & data
8. **Custom address book** · M — add/edit/delete/name user gate addresses, persisted
   to `localStorage`, with JSON import/export. Addresses are hardcoded today.
9. **Point-of-Origin selectable + glyph-grid fix** · S — glyph grid loops `1..38` so
   glyph 0 (PoO) can't be entered manually (audit gap); make it clickable and let the
   user pick which gate they dial *from*.

### UX & accessibility
10. **Audio controls (mute + volume) & gesture-resume** · S — no way to silence/adjust
    procedural audio today; also handle `AudioContext` resume on first gesture.
11. **`prefers-reduced-motion` + accessibility pass** · S–M — degrade the heavy
    shimmer/kawoosh gracefully; ARIA labels, focus rings, expanded keyboard control.
12. **Responsive / mobile layout** · M — the fixed three-column desktop grid breaks on
    phones; reflow into stacked/collapsible panels.

### Visual atmosphere
13. **Retro CRT aesthetic toggle (+ optional boot sequence)** · S–M — optional
    scanline/phosphor-flicker/vignette overlay + a BIOS-style boot sequence on load.

### Bonus candidates
- Persistent dialing **history log** with timestamps.
- Subtle **screen-shake** on chevron lock / kawoosh.
- Consolidated **settings panel** (speed + sound + theme + motion + CRT).

---

## Backlog — research-derived ten

See **RESEARCH.md** for sources, licensing, and attribution.

### Authenticity / immersion
14. **Voice chevron announcements** · S — the iconic control-room callouts
    ("Chevron one... encoded." / "...locked." / "Wormhole established.") via the
    browser **Web Speech API** (`speechSynthesis`) — no audio assets, CSP-safe.
    Toggleable. Cheapest big authenticity payoff.
15. **Correct per-network glyph counts & rules** · M — make the existing cosmetic
    themes mechanically real: each network gets its own glyph count, point-of-origin
    symbol, and 7/8/9-chevron addressing logic.
16. **Ambient computer chrome** · S–M — segment-display counters, idle blinky
    light-bars, a scrolling hex "computer working" log, and telemetry that lives even
    when idle.

### Gameplay systems
17. **Gate power / capacitor charge** · M — a capacitor charge meter that
    must be high enough to engage and depletes with distance; 8- and 9-chevron dials
    cost more power. Turns ENGAGE into a resource decision.
18. **Stellar-drift recalibration** · S–M — stored addresses can go "stale"
    (`DRIFT ERROR`), requiring a recalibration pass (a computed drift equation) before
    they'll lock. Pairs with #8 address book.
19. **Self-destruct / auto-destruct sequence** · M — two-code authorization + audible
    countdown + base-wide alert state. Complements #4 incoming-wormhole alarm.
20. **Console login + personnel rank/clearance** · S–M — a boot login (name + rank) that
    gates privileged actions (self-destruct, aborting an incoming dial). Light RPG framing.

### Discovery & sharing
21. **Gate-network "known worlds" map** · L — a spatial galaxy/network view to browse
    and dial worlds, distinct from the flat address book (#8): dialed-world history,
    7/8/9-chevron reachability.
22. **Shareable / deep-linkable addresses** · S — encode a dialed address in the URL
    hash so anyone can open a "dial this" link and watch it dial. Web-native virality;
    trivial with no backend.
23. **PWA — installable & offline** · S — add a web-app manifest + a small service
    worker so the site installs to home screen and runs offline. Fits the zero-backend,
    `default-src 'self'` architecture cleanly.

### Bonus (research-surfaced)
- **DHD input mode** — the hemispherical Dial Home Device with the central activation
  crystal, as an alternate input surface to the computer console.
- **Glyph codex / tooltips** — hover a glyph → its constellation name + which addresses
  use it.
- **Matter-buffer / "38 Minutes" easter eggs** — a Puddle-Jumper-stuck-in-the-aperture
  or stored-traveler flavor event.
