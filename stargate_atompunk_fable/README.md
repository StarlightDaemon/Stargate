# AUREOLE — Meadowlark Atomic Exposition · Threshold Pavilion

A purely decorative novelty website in the **Atompunk** register: a 1950s
atomic-age exhibition console, Console No. 2 of the (fictional) Meadowlark
Atomic Exposition's Threshold Pavilion. The ring is a seven-shell Bohr model
drawn as glowing schematic line-work on a midnight-teal ground with
turquoise, coral, and butter-cream light — Googie starbursts, a cantilevered
boomerang console, dial-and-lamp instrumentation, and a Geiger-tick ambient.
Fully client-side, no networking; all isotopes, destinations, and
institutions are invented. Nothing here reproduces any franchise's assets.

**Built by:** Claude Fable 5.1 (`claude-fable-5-1`). The reasoning level is
not observable from inside the build session and is therefore not recorded.

**Status:** implemented and self-tested with a Puppeteer harness (104/104
checks, 15 named screenshots); **direct operator hands-on testing has not yet
been performed** — automated passes are necessary but not sufficient, and
this line should be updated once a person has actually dialed it.

## The conceit

An address is a set of seven isotopes, one per Bohr shell, K outward to Q.
Seating an isotope means the next empty shell **hunts for that isotope's
resonance** — its electron races, the orbit wobbles, a resonance arc sweeps
the shell, the meter needle climbs — and then **captures** it: the electron
drops into its seat with a starburst pop, the shell lights, a proton joins
the nucleus, the shell's manifest lamp comes on, and the isotope's emission
line appears on the spectrograph strip. Seven seated shells leave the console
*ready* and nothing more: only **EXCITE** opens the threshold.

## Controls (two clusters for the core loop)

1. **Isotope selector** — twelve isotopes on a starburst. Press one to seat
   it in the next shell. Clicks faster than the hunt are queued in order,
   never dropped; duplicates are refused.
2. **Excitation cluster** — **EXCITE** (the only trigger), **DISCHARGE**
   (drops every shell, never locked out — from pending, mid-buildup, open, or
   mid-cam), and the **Lead Shutter** interlock, released by default. Engaged,
   it refuses captures, cams, and excitation with a blinking warning and a
   buzzer.

Secondary: five **preset cams** (quick-dial), a resonance meter, shell
manifest, countdown, spectrograph, telemetry, teletype, guide (`?`), sound.

## Excitation: three real stages

- **Buildup (2.3 s)** — the shells contract toward the nucleus, electrons
  accelerate, the nucleus swells, a theremin glide rises with widening
  vibrato and a rising noise bed, the countdown runs T−2.3 → 0.
- **Breakthrough (0.7 s)** — a cream flash fills the aperture with coral rays,
  sixteen starburst spikes shoot out past the outer shell, the shells snap
  back outward, a noise burst and a bright chord land together.
- **Sustained open** — a slowly rotating turquoise/coral/cream corona with
  sparks spiralling outward, a breathing starburst halo, electrons orbiting
  fast, a warm detuned hum with slow vibrato, and faster Geiger ticks.

Measured from screenshots on the verified run (mean luminance over the inner
80% of the aperture): pending 44 · buildup 72 · breakthrough 221 · active 176 —
every pair at least 25 apart.

## Preset cams (quick-dial) and their justification

A cam is a pre-cut tuning profile. The servo runs straight to each cam stop
instead of hunting for resonance by hand, so a cam seats a shell in about
0.6 s instead of about 1.3 s — but a cam cannot skip a stop, so it still walks
every shell in order with the same capture staging. Verified: 7 shells in
4.07 s at cam pace vs 8.9 s by hand, every step ≥ 0.5 s apart. Landing state
is *pending*; no auto-fire; DISCHARGE cancels the remaining stops. One cam,
**MOONGLOW COURT**, has not answered since the '57 season: it seats and
excites normally, then collapses after breakthrough with no answering
resonance.

## Composition (and why)

Deliberately asymmetric, in the Googie manner: the ring sits large and
off-centre to the left, the isotope selector is a starburst hanging in the
upper right beside a boomerang outline, and the excitation cluster, meter,
telemetry, and teletype ride a cantilevered wedge that sweeps up from the
lower right. The spectrograph strip runs along the top of the ring, the shell
manifest stands as a slim column between ring and console, and the preset
cams sit as a radio-style pushbutton row under the ring. The intent was to
avoid the symmetric hero-and-wings skeleton; the core controls (selector,
EXCITE, DISCHARGE, shutter) stay the brightest, largest, most saturated
objects on the page at any density.

## Rendering register

Everything is flat fill, stroke, and glow. No chrome, Bakelite, or metal is
simulated; the ring's rotational symmetry is carried by motion (seven
electrons at different rates and alternating senses, shell contraction,
a rotating halo) rather than by shading. Text labels are HTML positioned over
the SVG, not SVG text. Googie is a commercial architectural style with no
political content; nothing here draws on any living sacred or ceremonial
tradition.

## Running and testing

```bash
npm run serve
```

Serves at `http://localhost:8733/` (plain Node, no dependencies).

```bash
npm install
npm test
```

`npm test` starts its own server on port 8753, drives system Chrome through
`puppeteer-core`, hit-tests every control at its rendered position before
clicking it, times each capture from outside the page, measures the aperture
from screenshots, and writes 15 screenshots plus `test/last-run.log`.
Viewport fit is a JS-computed bare `--fit` ratio; verified at 1920×1080
(`--fit` 1) and 3840×2160 (`--fit` 2).

## Files

`index.html`, `style.css`, `app.js` (state machine, ring, aperture, fit),
`audio.js` (procedural Web Audio), `isotopes.js` (isotope table and cams),
`server.js`, `test/run-tests.mjs`, `favicon.svg`, `version.json`,
`CHANGELOG.md`.
