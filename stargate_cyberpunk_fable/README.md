# NIGHTGLASS

NIGHTGLASS is a purely decorative, fully client-side novelty website: the private access spire of **Vesper Ryn**, a fictional "lightwright" who weaves glowing threads of connection across the **Lume Lattice** — an abstract, geometric information-space rendered as layered panes of light. Visitors compose a seven-glyph route on the Weave Deck, watch the barrier ring's veil shards dissolve as each glyph resolves from static into clarity, and open the link through a staged crescendo of light and synthesized sound. Everything on the page is fiction and stagecraft: there is no backend, no networking, and no real-world technical function of any kind — only an interactive piece of cyberspace theater.

> **Status:** live · v1.0.0 · single static page, vanilla HTML/CSS/JS, no build step.
>
> **Correction (2026-09-02):** the "Operator-verified" line originally recorded here (2026-09-01, commit `7c8a18d8`) was a prose-only status assertion written at build time — not evidence, despite the name. No hands-on testing had actually happened; the build had only the harness's own automated Puppeteer run behind it, and was pushed live on that alone. Genuine confirmation came later: on 2026-09-02 the operator directly tested this build by hand and confirmed it fully functional end-to-end (manual dial, three-stage activation, disengage, quick-dial auto-dial) — a successful one-shot build by Claude Fable 5, revisiting the Cyberpunk theme under this project's digital-first, maximalist template.

## Running

```
npm run serve
```

Then open `http://localhost:8637`. The page is a single 1920×1080 stage that scales itself cleanly from small windows up through 3840×2160.

## The fiction

- **The Lume Lattice** — a luminous information-space of drifting geometry, where places are *nodes* and journeys are *threads of light*.
- **Vesper Ryn** — the spire's keeper. Their saved routes, journal, and chart of the Lattice fill the archive.
- **The Weave Deck** — ten resonance glyphs; any seven, in order, name a destination.
- **The Veil Ring** — a layered light-barrier. Each locked glyph dissolves one shard of the veil; when all seven are set the thread is complete and the link waits, pending, until *Open Link* is chosen.
- **Threads** — remembered routes replayed at loom speed: the route is recalled, not re-derived, so the deck weaves itself glyph by glyph.
- **The Drift Ward** — a hold that keeps the spire anchored during drift tides. Released by default; while engaged, the link is held closed.

## Features

- Staged activation: buildup → breakthrough → sustained open link, each visually and sonically distinct; completing a route never opens the link by itself.
- Seven preloaded threads in two tiers (anchored and frayed), each auto-weaving its route glyph by glyph.
- A cross-referenced archive of 34 nodes, routes, personas, phenomena, and fragments.
- An alternate chart view of the Lattice, distinct from the ring.
- Live ambient telemetry with genuinely coupled values (carrier, coherence, throughput, drift).
- A settings pane: four theme variants, display density, motion intensity, and layered audio levels.
- A timestamped session journal of the visitor's actual actions.
- Layered synthesized Web Audio: ambient glass-loom texture, weave chimes, and link crescendo.
- Session persistence via localStorage: preferences, weave history, and viewed archive entries survive a reload.

## Testing

```
npm install
npm test
```

The test harness drives the page in headless Chrome (`puppeteer-core`; set `CHROME_PATH` if Chrome is somewhere unusual) with real dispatched pointer events, hit-tested at rendered positions, and writes screenshots to `test/shots/`.

## Credits

Built by [StarlightDaemon](https://github.com/StarlightDaemon). All names, glyphs, places, and iconography are original to this piece.

Built by Claude Fable 5 (reasoning level not recorded at build time). See `CHANGELOG.md` and `version.json`.
