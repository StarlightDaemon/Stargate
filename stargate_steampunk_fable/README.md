# PERPETUA — The Aldercroft Concordance Engine

> A fictional steam-and-clockwork calculating engine, rendered entirely as glowing schematic line-work. Purely decorative novelty site — no backend, no networking, nothing real.

> **Status:** v1.0.0. A successful second attempt at this genre: it avoids
> the simulated-material rendering that ended a prior Steampunk try, and
> takes a calculating-engine identity distinct from the genre's other
> success (a telegraph/dispatch console).
>
> **Correction (2026-09-02):** the "operator-verified 2026-09-01" line
> originally recorded here (commit `72e57fc0`) was a prose-only status
> assertion written at build time — not evidence, despite the name. No
> hands-on testing had actually happened; the build had only the harness's
> own automated Puppeteer run behind it, and was pushed live on that alone.
> Genuine confirmation came later: on 2026-09-02 the operator directly
> tested this build by hand and confirmed the full loop (manual dial,
> three-stage activation, disengage, quick-dial auto-dial) working as
> intended.

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

**Persistence:** `localStorage` only, under the single key `perpetua.v1`: settings (theme, density, motion, master/ambient/mechanism/bell volumes), the last 40 dial history entries and archive entries already viewed.

## Running

```
npm run serve
```

Then open http://localhost:8661/. Tests (Puppeteer against system Chrome):

```
npm install
npm test
```

## Credits

Built by Claude Fable 5 (reasoning level not recorded at build time). See `CHANGELOG.md` and `version.json`.
