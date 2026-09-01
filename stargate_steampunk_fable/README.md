# PERPETUA — The Aldercroft Concordance Engine

> A fictional steam-and-clockwork calculating engine, rendered entirely as glowing schematic line-work. Purely decorative novelty site — no backend, no networking, nothing real.

The Aldercroft Computation Bureau (est. 1859, Professor Imogen Aldercroft) maintains
Engine No. 3, "PERPETUA" — a room-sized analytical engine whose Mill and Store,
driven by steam through a forty-to-one main shaft, compute *traversal concordances*:
exact solutions to the Correspondence Problem. Feed eight punched index cards
through the card train, let the anticipating carriage drive the residual column to
zero, and — if the concordance proves — the Aperture at the heart of the great
Store wheel opens.

Everything on the page is drawn as technical diagram line-work and flat glowing
color, in the manner of a patent sheet or an instrument face: no simulated brass,
no painted metal, no photorealism. The site is a single static page (vanilla
HTML/CSS/JS, no build step) with synthesized Web Audio, a cross-referenced folio
archive, a schematic cross-section of the mechanism, coupled live telemetry, a
session log, and a settings panel. Session state persists in `localStorage` only.

## Running

```
npm run serve
```

Then open http://localhost:8661/. Tests (Puppeteer against system Chrome):

```
npm install
npm test
```
