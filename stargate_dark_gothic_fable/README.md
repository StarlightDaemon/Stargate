# WIDDERSHINS — The Gatehouse at Corvane Hollow

A haunted-manor portal-dialing console: the gatehouse mechanism of an abandoned Victorian estate, its wrought-iron fence-ring rendered as glowing spectral schematic, which only turns widdershins and remembers the hands that turned it a century ago.

> **Status:** built and self-verified by the building session (automated Puppeteer suite, 109/109 checks, hit-tested real events, screenshot-measured stages). **Not yet confirmed by direct operator hands-on testing.** Automated passes are necessary but not sufficient in this project; the operator's own hands on the controls is the real final check.

## The register

Dark, spooky, Gothic *horror* — not Gothic cathedral architecture. Dread and
shadow, not reverence and warmth. The palette is sickly witch-fire green and
cold moonlight blue, with a single warm, guttering amber candle in the
keeper's lantern as the one point of contrast. Fog rolls and thins across the
base of the console. The sound is texture: a distant tolling bell, iron
creaking as the fence turns, a raven, wind through the gatehouse's broken
glass, the candle taking, iron slamming shut.

Everything is flat fill, stroke, and glow. No stone, iron, wax, or fog is
simulated as material: the fence is spectral line-work, the gate leaves are
ghost-light scrollwork, the fog is drifting soft light, the candle is a flat
flame with a cast glow. Decay is reframed as necromantic circuitry rather
than rendered as decay.

The horror stays atmospheric. No gore, no viscera, no depictions of death.
The darkness lives in mood, palette, shadow, and the one road nobody has
come back from.

## The mechanism

Thirteen **wards** — sigils cut into the finial plates of a circular
wrought-iron fence. An address is six wards. Pressing a ward turns the
*whole fence-ring* **widdershins** (counter-sunwise, the folklore direction
that opens the way to the otherworld; the iron will not turn the other way)
until that ward's finial reaches the **keeper's lantern** at the top of the
ring. There it **takes flame** from the candle — the finial ignites, the
candle flares — and a **ghost-chain** link binds it along the inner rail to
the last ward caught. The ring does visible work at every step: the fence
turns through a real angular distance, ratcheting; the finial lights; the
chain grows; the wardstones in the gate-book fill.

Six caught wards lift the **bar** and leave the gate *unbarred* — and
nothing more happens on its own. Only the **bell-pull** opens it.

If a ward's finial already stands at the lantern, the fence goes the full
round rather than catching in place: it will not catch without turning.

## Controls (two clusters for the core loop)

1. **The ward fence** — thirteen pickets seen face-on, at the right of the
   ring. Press one to turn the fence to it. Presses faster than the turn are
   queued in order, never dropped; a ward already caught is refused.
2. **The threshold cluster** — **RING THE BELL** (the only trigger),
   **BAR THE GATE** (drops the bar and every ward; never locked out — from
   unbarred, mid-turn, mid-bell, open, or mid-remembered-hand), and the
   **SALT LINE** interlock, unlaid by default. Laid, it refuses every turn,
   every remembered hand, and the bell, with a blinking warning and a harsh
   iron refusal that hold until the salt is swept away.

Secondary: five **remembered hands** (quick-dial keys on hooks), the
gate-book ledger, the running log, the gate-book overlay (`?`), sound.

## The bell: three real stages

- **Buildup (2.4 s)** — the bell tolls three times, the fence spins
  widdershins with rising speed, the rails go green, witch-light gathers in
  the centre of the shut gate, the candle stretches and thrashes, the fog
  rises and turns green, the moon dims, the leaves rattle.
- **Breakthrough (0.8 s)** — the leaves fling open on shrieking hinges, a
  pale flash fills the gate, sixteen witch-light rays throw past the outer
  rail, the candle is blown sideways, a raven calls.
- **Sustained open** — two counter-turning wheels of ghost-light shear past
  each other in the open gate, wisps spiral inward, the rays breathe, the
  fence keeps turning slowly widdershins, a low detuned drone with a slow
  shimmer, the wind rises, the fog thins.

Measured from screenshots on the verified run (mean luminance over the inner
80% of the gate): unbarred 15 · buildup 52 · breakthrough 237 · open 123 —
every pair at least 25 apart.

## The remembered hands (quick-dial) and their justification

The mechanism remembers hands that turned it before. Five keys hang on
hooks, each a turning the iron has done for someone: the keeper's hand,
1887; the gardener's; an unknown hand, undated; the child's; the widow's.
Lift one and the fence turns itself along the remembered groove — faster
than a living hand because it does not hesitate, but still one ward at a
time, because it still has to bring each finial to the lantern. Measured:
six wards in 5.0 s at remembered pace against 9.2 s by hand, every step at
least 0.7 s apart. It lands *unbarred*, never open; BAR THE GATE cancels the
remaining turns; it only remembers from rest.

One key, **NOBODY'S PARISH**, opens on a road no one has come back from. It
catches and rings normally, the leaves open on a grey nothing — and then
something knocks back: the leaves slam, the candle goes out, every ward goes
dark, and the candle relights a moment later.

## Composition (and why)

A gatehouse, not a dashboard. The fence-ring sits large and left of centre
with the keeper's lantern hung above it and fog rolling across its base; the
ward fence stands as a single vertical picket line beside it; the gate-book
and the bell-rope share the right-hand column, the rope hanging from the top
of the page down to the bell-pull; the five keys hang on hooks below. The
status line sits on the threshold under the salt line. There is no left
wing and no bottom deck; the composition is a tall asymmetric stack against
a big ring rather than a hero-and-wings skeleton. The core controls (the
picket line, the amber bell-pull, BAR, SALT) stay the brightest, most
saturated objects on the page at any density.

## Rendering register and content notes

Digital-native throughout: flat fill, stroke, and glow, with the ring's
rotational symmetry carried by motion (the fence turning, the chain growing,
the ghost-light on the rail) rather than shading. Text labels are HTML
positioned over the SVG, never SVG text. The build draws on generic
European folklore (widdershins, salt lines, a bell against the dark) and the
Gothic horror literary tradition; nothing here draws on any living sacred or
ceremonial tradition, and no real political content is involved.

## Running and testing

```bash
npm run serve
```

Serves at `http://localhost:8797/` (plain Node, no dependencies).

```bash
npm install
npm test
```

`npm test` starts its own server on port 8817, drives system Chrome through
`puppeteer-core`, hit-tests every control at its rendered position before
clicking it, times each catch from outside the page, checks the fence
really turned widdershins by the announced angle, measures the gate from
screenshots, and writes 15 screenshots plus `test/last-run.log`. Viewport
fit is a JS-computed bare `--fit` ratio; verified at 1920×1080 (`--fit` 1)
and 3840×2160 (`--fit` 2).

## Files

`index.html`, `style.css`, `app.js` (state machine, fence-ring, leaves,
lantern, fit), `audio.js` (procedural Web Audio), `wards.js` (wards, roads,
remembered hands), `server.js`, `test/run-tests.mjs`, `favicon.svg`,
`version.json`, `CHANGELOG.md`.
