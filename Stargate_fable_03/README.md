# AETHERGATE — Transit Ring Console

An original, fully client-side interactive tribute to ring-portal science
fiction. Compose a seven-sigil destination address, watch the sigil track
spin each glyph under the crown marker while mechanical seals clamp shut
one by one, then brace for the aperture surge as the event horizon forms —
and seal it back down when you're done.

## Running it

No build step, no dependencies, no server required:

- **Double-click `index.html`** — everything runs from `file://`, or
- serve the folder with any static server (`python -m http.server`) if you
  prefer.

Sound is synthesized live with the Web Audio API and is **off by default** —
toggle it with the `SOUND` chip or the `M` key.

## Features

- **36 procedurally generated sigils** — an original glyph alphabet built
  from a fixed-seed PRNG, identical on every visit, each with an invented
  name.
- **Full dialing sequence** — the sigil track spins with easing and
  per-glyph ticks, alternating direction per address position; eight
  mechanical seals (seven route seals plus the prime seal) clamp shut with
  claw animations and lamp glow.
- **Activation burst** — screen flash, gate quake, and a WebGL surge where
  the forming horizon overshoots the ring before settling.
- **Living event horizon** — a fragment shader layering flowing noise,
  concentric ripples, and rim glow (Canvas2D fallback if WebGL is missing).
- **Shutdown choreography** — turbulent collapse, staggered seal release,
  ring spin-down.
- **Control console** — sigil pad, address slots, random coordinates, five
  fictional charted destinations, abort control, and an operations log.
- **Aperture stability** — an open lane decays over ~46 s (faster on the
  unstable route) with warnings and an automatic emergency seal.
- **Probe telemetry** — launch a drone through the open portal for a
  shader ripple pulse and seeded, destination-consistent survey readings.
- **Synthesized sound design** — spin rumble, glyph ticks, seal clunks,
  activation roar, standing hum, collapse sweep. No audio files.
- **Ambience & accessibility** — idle sheen sweeps and maintenance chatter,
  twinkling starfield with meteors, keyboard shortcuts
  (`Enter`/`Esc`/`R`/`C`/`M`), ARIA labels, and `prefers-reduced-motion`
  support.

## Originality

All glyphs are procedurally generated, all destination names and lore are
invented, and every sound is synthesized in-browser. This is a fan-made
homage to a genre trope — no artwork, symbols, names, or audio from any
existing franchise are used.

## Privacy

Entirely static. No network requests, no analytics, no storage — nothing
leaves the page.
