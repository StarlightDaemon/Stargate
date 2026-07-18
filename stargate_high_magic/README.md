# SIDEREUM — the Ring of Seven Wards

An interactive novelty website: a ring-shaped portal-activation artifact of the
**Astrolith Order**, a fictional tradition of *sidereal high magic* — magic
written in the grammar of constellations, inlaid in silver and gold on
night-dark stone.

Inscribe seven star-sigils upon the turning band, watch the seven wards take
fire one by one, wake the Keystone, and open the Way — a shimmering veil of
starlight. Seal it again when you are done. The Order counsels against leaving
a gate open.

## Running it

This is a fully static, client-side site with **zero dependencies, no build
step, and no network access of any kind**. Serve the directory with any static
file server, or simply open `index.html` in a browser:

```
python -m http.server 8080
# then visit http://localhost:8080
```

## How the Ring works (in-universe)

- **The band** carries twenty-one star-sigils. Touch one and the band turns
  until it stands beneath the **Crown Lens** at the zenith; a ward takes fire.
- Seven sigils make a **Way**. When all seven wards burn, the **Keystone**
  at the Ring's heart wakes — touch it to open the gate.
- Ways matching the **Codex** lead to charted (entirely fictional) realms.
  Seven sigils in an unrecorded order open an *uncharted* Way — the veil
  burns violet instead of gold.
- **Sealing**: the wards release their sigils in reverse order and the veil
  collapses. `Esc` or `S` also seals an open gate.
- **Swift Working** (the fast dial): the law engraved on the Ring's own rim
  reads *"What the Ring remembers, the Ring may recall."* A Way opened once
  in full ritual leaves its echo in the stone, and can afterwards be recalled
  without the band turning at all — the wards remember their sigils unbidden.
  One Way (Vael-Tirion) was graven into the Ring's memory by the Order
  itself. Memory persists in `localStorage` and can be effaced.
- **Voces Aetheris**: entirely procedural Web Audio — dormant hum, ward
  chimes, ignition swell, open-way choir, sealing knell. Off by default;
  toggle it in the ledger.

Idle behavior is ambient only: drifting motes, a breathing glow, and the hum
(if voice is granted). The Ring never dials itself while a visitor is away.

## Dev/verification hooks (explicit only — never idle-triggered)

- `RITE.dial(id, {swift})`, `RITE.seal()`, `RITE.state()`, `RITE.codex()` in
  the console
- `Ctrl+Alt+G` — run a full rite; `Ctrl+Alt+J` — run a Swift Working
- `?rite=full` / `?rite=swift` query string — auto-run once on load
- `?tableau=open` / `?tableau=uncharted` — static preview of the open state
- `?diag=1` — canvas diagnostics via `document.title` (for `--dump-dom`)
- `?freeze=1` — halt the veil render loop after 3s (headless screenshots)
- `?veilimg=1` — mirror the veil canvas into an `<img>` (headless screenshots)

## Structure

```
index.html      markup: codex, ring stage, ledger, grimoire overlay
styles.css      night-indigo / argent / aurum theme, states, reduced-motion
js/glyphs.js    21 constellation-sigils, deterministic seeded generation
js/audio.js     procedural Web Audio (no audio files)
js/portal.js    canvas veil: motes, bloom, open shimmer, collapse; starfield
js/ring.js      the SVG artifact: rim, wards, band, lens, keystone; rotation
js/main.js      state machine, codex, memory, ritual record, dev hooks
```

Every destination is fictional. Every sigil, name, and glyph is invented for
this work.
