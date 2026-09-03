# TRELLIS — Hollin Reach Canopy Commons · Sunspan Ring

A solarpunk portal-dialing console kept by a neighbourhood rather than a bunker: a solar-pooled ring on an Art Nouveau trellis, where every waymark you choose pledges a share of stored sun, the shares flow along visible conduits into the ring's collectors, and the span is opened together from a shared hearth. Warm daylight tonality (cream, moss, brass, terracotta, amber), curvilinear line-work, and copy that speaks of tending and sharing instead of overrides and emergencies. Digital-native and schematic throughout: no simulated wood, glass, or leaf texture, only stroke, flat fill, and glow.

> **Status: closed, complete, no further iteration planned.** The operator's verdict is that this build is functional and a legitimate execution of the solarpunk theme, but that it does not fully match the intended vision for it. It is therefore closed on creative-fit grounds, not as a technical failure — nothing here is known to be broken. This puts TRELLIS in the same bucket as the Low Sci-Fi and Dark Spooky Gothic builds: closed on a creative judgment about fit, with the work itself standing as done.
>
> Build-time evidence, unchanged: implemented and self-tested with real dispatched pointer events (102/102 automated checks, screenshots in `test/screenshots/`). Automated passes are evidence, not proof.

## What it is

- **The Sunspan Ring** is a working instrument. Seven collector bays sit on a trellis frame around a central pool. Inside them turns the **dial hoop**, carrying all fourteen waymarks. Pledging a waymark does three visible things in sequence: the hoop slews so that waymark sits under the next open bay (a heliostat turning to face its light), the share flows from the stem join along a conduit round the rim to that bay, and the bay's collector opens its five petals and holds the waymark. The pool rim around the aperture fills one seventh per share.
- **Seven shares held** leave the ring **pending**: the route is held, the pool glows, and nothing opens on its own.
- **Open the Span** (the hearth) runs a three-stage opening: **the pool gathers** (2.4 s, the aperture dims to ember while the light draws inward and rays begin to show), **sunburst** (0.7 s blazing white-gold with radial rays and an expanding flash ring), then **the span stands open** (a slowly rotating weave of amber, gold, and sage that breathes, with light-flecks drifting outward, and a draw on the stored sun).
- **Fold the Span** is always reachable, in every state. Petals close, conduits drain, the pool empties, the hoop settles home. It also cancels a walk in progress or an opening still gathering.
- **Quiet-hours latch** is the interlock. Released by default. While engaged, the hearth declines to open the span with a shaking banner over the ring, a refused-shake on the control, three low tones, and a warm line in the tending log.
- **Routes the commons has walked** are the quick-dial ledger: six remembered routes whose shares are already promised, so the ring re-pledges them **at ledger pace**, faster than by hand but still routed one waymark at a time through the same slew → flow → open sequence. A route ends held, never open.
- **Commons ledger gauges** are coupled: stored sun charges with the in-universe daylight (the sun-arc in the masthead advances one minute every two seconds) and is drawn down while the span is open; the pooled gauge tracks held shares; draw rises through the opening.
- **Sound** is fully procedural (Web Audio): wooden toks, a slew whirr that rises with distance, an ascending trickle for each conduit, a pentatonic chime per bay, a swelling chord with a slowing pulse for the gathering, a gong-bodied bloom at sunburst, a breathing drone while open, descending chimes on folding.

## Controls

Two core clusters, per the project's control-complexity cap:

1. **Waymark board** (top right): fourteen original waymark glyphs. Click seven. Clicks faster than the animation are queued, not dropped.
2. **The hearth** (far right): *Open the Span*, *Fold the Span* / *Let the ring rest*, and the *Quiet-hours latch*.

Secondary: the ledger of walked routes, the held-route strip, the tending log, the commons gauges, a `?` guide and a sound toggle on the bottom-left toolshelf.

## Composition

Deliberately not the symmetric top-bar / hero / two-wings / bottom-deck skeleton. The ring sits left of centre; one whiplash stem grows from the bottom-left corner, passes under the ring's stem join, climbs the gap between the ring and the right column, and sweeps across to the top-right corner, tying the ring to the waymark board. The right column stacks board → held route → ledger → log, and the hearth stands as its own vertical column at the far right behind a dashed border so the two core controls are never confused with telemetry.

## Running locally

```bash
npm run serve
```

Then open `http://localhost:8709/`. No build step, no dependencies for the site itself.

## Verifying

```bash
npm install
npm test
```

`test/run-tests.mjs` starts the server on port 8729, drives system Chrome through `puppeteer-core` (set `CHROME_PATH` to point elsewhere), hit-tests every control at its rendered position before clicking it with real mouse events, and measures the aperture from actual screenshots (mean luminance and warmth over the disc) so the three opening stages are proven distinct from each other, not merely from idle. It covers: cold start, 1080p and 4K fit, all-control reachability, a rapid seven-click manual dial, the no-auto-fire hold, all three stages, fold, a ledger route with mid-sequence motion captured, latch refusal and release, fold during buildup, fold mid-walk, duplicate-pledge and busy guards, guide and sound. Screenshots land in `test/screenshots/`.

## Files

- `index.html`, `style.css`, `app.js` — the console
- `waymarks.js` — the fourteen waymarks and six walked routes
- `audio.js` — procedural sound
- `server.js` — tiny static server
- `test/run-tests.mjs` — verification harness
- `version.json`, `CHANGELOG.md`
