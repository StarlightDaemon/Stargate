# MERIDIAN — Transit Artifact Console

An interactive novelty portal-dialing website. High Sci-Fi theme, ancient-megastructure
register: **Transit Artifact M-1 “Meridian”** is a 2.1-million-year-old torus of
scale-invariant grey glass recovered at Sol–Earth L4, and this page is the human research
console bolted around it.

Everything here is fictional and fully client-side: **no backend, no server process, no
network calls, no messaging, no real addresses.** State that persists (the geodesic cache,
the sound preference) lives in `localStorage` only.

**Persistence:** `localStorage` only, under `meridian.geodesic-cache.v1` (up to 8 cold-solved route ids with solve timestamps, the basis of fast dial) and `meridian.sound.v1` (`on`/`off` sound preference).

## Running it

Static files, zero dependencies, no build step. Serve the directory with any static file
server and open `index.html`:

```
python -m http.server 8123
# → http://localhost:8123/
```

(Any static server works; opening via `file://` fails only because ES modules require an
HTTP origin.)

## The fiction, briefly

Meridian does not store addresses — it **solves** them. A destination is a nine-glyph
*metric signature* (eight manifold marks + the fixed ERIDU local invariant). Dialing means
numerically relaxing a traversable wormhole metric until nine topological invariants
converge, one anchor at a time.

- **COLD SOLVE** — an unsolved route. The bands search solution space; ~15–20 s of
  relaxation passes while the solution residual decays.
- **LATTICE RECALL** — the fast-dial mode, with an in-universe mechanism: a solved route is
  imprinted permanently in the Artifact's lattice. Recall performs no search — one memory
  sweep, then the nine invariants lock in rapid playback (~3.5 s), visually and audibly
  distinct from a cold solve (violet anchors, sweep blur, playback chimes).
- The aperture, open, is a **lens**, not a liquid: the destination's sky seen through a
  compiled metric — photon ring, chromatic fringing at the rim, slow differential swirl.
- One route, APERTURE PRIME, is always **refused**. Meridian has never been wrong. It has
  occasionally declined.

## Controls

- **Route catalog** — dial any surveyed destination. A violet `RECALL` badge marks routes
  already imprinted (fast dial). Cache persists across visits; purge it with the
  engineering button at the bottom of the console.
- **Signature composer** — hand-enter 8 glyphs and `COMPILE METRIC`. A signature matching a
  surveyed route dials it; an unknown signature fails with a **NO SOLUTION — METRIC
  DIVERGES** sequence after three invariants.
- **Sound** — all audio is synthesized (Web Audio), off by default, toggle top right.
- **Idle behavior** — ambient only: slow band drift, faint vacuum speckle, telemetry
  jitter. A live visitor never sees an automatic dialing sequence, no matter how long the
  page sits open.

## Testing trigger (not user-facing)

For engineering/diagnostic use only, never triggered by inactivity:

- open `/?diag` — runs one COLD SOLVE → collapse → LATTICE RECALL → collapse cycle, with a
  visible `DIAGNOSTIC ROUTINE` badge, or
- call `window.__meridian.diag()` from the devtools console.

## Architecture

Vanilla ES modules, no framework, no dependencies, no build step.

| module | role |
| --- | --- |
| `js/glyphs.js` | 36-glyph procedural alphabet (seeded, deterministic, six structural families) |
| `js/ring.js` | SVG ring: three counter-rotating glyph bands, nine invariant anchors |
| `js/portal.js` | canvas aperture: vacuum speckle, strain, Null Bloom ignition, lensed sky |
| `js/dialer.js` | dialing state machine (solve / recall / diverge / refuse / open / collapse) |
| `js/audio.js` | Web Audio synth: hum, rotation noise, convergence chimes, ignition, refusal |
| `js/destinations.js` | fictional route catalog (signatures, hazards, palettes, probe flavor) |
| `js/cache.js` | geodesic cache (localStorage) — the substrate of fast dialing |
| `js/telemetry.js` | readouts + station log |
| `js/selftest.js` | `?diag` engineering routine |
| `js/main.js` | UI construction, wiring, single rAF loop |

`prefers-reduced-motion` is honored throughout (calmer drift, no flicker, fades instead of
ignition/collapse).

All glyphs, names, destinations and sounds are original to this project.
