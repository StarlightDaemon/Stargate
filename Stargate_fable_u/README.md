# HELIORA · Threshold Annulus

An interactive novelty website: a ring-shaped dialing instrument that attunes
seven-sigil addresses ("cants"), locks seven **Annular Seals** one by one,
strikes open a molten travel-well (the **Wellglass**) with a dramatic
**Sunstrike**, and is sealed again by a literal eclipse — the **Umbral
Occulter**, a dark disc that transits across the open well.

Entirely client-side and dependency-free: hand-written HTML, CSS, and ES
modules. The instrument is SVG, the portal is a WebGL fragment shader, and
every sound is synthesized at runtime with the Web Audio API. No build step,
no network requests, no assets.

## Run it

Serve the directory with any static file server (ES modules need `http://`):

```
python -m http.server 8000
# then open http://localhost:8000
```

## How to operate the instrument

- **Dial a cant** — click seven sigils on the ring, pick a known cant from
  the Codex, or press *Drift Cant* for a random one.
- Every cant must close with **Solyn**, the origin sigil (the gold-rimmed
  plaque). The ring refuses repeats and a premature origin.
- When the seventh seal locks, the **Sunstrike** opens the Wellglass. The
  aperture holds for 38 seconds.
- **Seal Threshold** sends the Umbral Occulter across the well to quench it.
  Let stability lapse instead and the well collapses ungently.
- One codex entry, *Cor-Avenna*, is recorded as lost — dial it and see.

Keys: `R` drift cant · `S` seal · `Esc` release · `M` sound · `H` primer.

## The lexicon

| Term | Meaning |
| --- | --- |
| Heliora / the Annulus | the ring instrument itself |
| Sigil | one of thirty procedurally generated heliographic glyphs |
| Cant | a seven-sigil address: six waypoints + Solyn |
| Annular Seals I–VII | the seven locking pylons on the outer rim |
| Meridian Claw | the top pointer that reads the band |
| Sunstrike | the opening energy burst |
| Wellglass | the open portal surface |
| Umbral Occulter | the eclipse-disc closing mechanism |

All destinations are fictional. This is an original fan-tribute interpretation
of the "ring gate" idea with its own symbols, names, and visual language.
