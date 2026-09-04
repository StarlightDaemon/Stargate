# Heliacal Ring — Gate Command · Terminal VII

An original, fully client-side interactive novelty site: a ring-shaped dialing
device that opens a shimmering travel conduit. Compose a seven-glyph address,
watch the inner ring spin each glyph to the primary lock, see nine lock lugs
engage one by one, then brace for the breach surge.

Everything here — the device, the 38 glyphs, the destinations, the signals —
is invented for this piece. It is a fan tribute to the *idea* of a ring gate,
not a reproduction of any existing work's artwork, symbols, or names.

**Persistence:** `localStorage` only, under `hg.visited` (ids of destinations already reached) and `hg.muted` (`"1"` or `"0"`; audio stays muted unless this is explicitly `"0"`).

## Running it

No build step, no dependencies, no network.

- Double-click `index.html`, **or**
- serve the folder statically: `python -m http.server 8641` and open
  <http://localhost:8641>.

Sound is synthesized live with the Web Audio API and starts on your first
click or keypress (browser autoplay policy). Toggle it with the SOUND button
or <kbd>M</kbd>.

## How to dial

1. Pick six destination glyphs on the input matrix, then the ◈ **Solyn**
   point-of-origin glyph — or click an entry in the Destination Archive.
2. **INITIATE DIAL.** The ring rotates each glyph under the primary lock;
   direction alternates per lock, servo pitch follows the ring speed.
3. On the seventh lock the vector resolves. Archive addresses connect;
   unverified coordinates fault and the ring spins down.
4. While the conduit is open, launch survey probes (click the event surface
   or <kbd>P</kbd>) and read their telemetry in the event log. Every probe —
   and time itself — drains conduit stability; at zero the ring performs an
   emergency disengage.
5. **DISENGAGE CONDUIT** (or <kbd>Esc</kbd>) collapses the conduit manually.
6. The **aperture shield** (<kbd>I</kbd>) seals the opening at any time — and
   is the only thing that repels an *unscheduled inbound breach*, which the
   station occasionally detects when the ring sits idle…

Keys: <kbd>Enter</kbd> dial · <kbd>Esc</kbd> abort/disengage ·
<kbd>Backspace</kbd> undo glyph · <kbd>I</kbd> shield · <kbd>P</kbd> probe ·
<kbd>R</kbd> random archive dial · <kbd>M</kbd> sound · <kbd>H</kbd> manual.

Deep links: `?dial=<destination-id>` auto-dials on load;
`?vis=open|surge|iris&dest=<id>` jumps straight to a visual state
(destination ids: `thessa`, `karmorath`, `veiled`, `oceanus`, `cindral`,
`halcyon`, `nocturne`, `anvil`).

## Architecture

Plain HTML/CSS/JS, zero dependencies, loaded as ordinary scripts under one
`HG` namespace so the site runs from `file://` as well as any static host.

| Module | Role |
| --- | --- |
| `js/data.js` | Glyph lexicon (38 names) and the destination registry |
| `js/glyphs.js` | Seeded procedural generator for the 38 original sigils |
| `js/gate.js` | The machine: SVG ring, lock lugs, rotation, aperture shield |
| `js/portal.js` | Canvas effects: breach surge, open conduit, collapse, probe tunnel |
| `js/audio.js` | Procedural Web Audio sound design (no audio files) |
| `js/sequencer.js` | State machine: dial → resolve → surge → active → close, inbound events |
| `js/starfield.js` | Ambient parallax starfield with meteors |
| `js/ui.js` | Console: register, keypad, archive, systems, event log |
| `js/main.js` | Frame loop (rAF with hidden-tab watchdog), deep links |

Mechanical motion (ring rotation, shield travel, portal phases, stability)
is timed against the wall clock rather than accumulated frame deltas, so a
dial sequence stays correct even in a throttled background tab.

Only `localStorage` is touched (mute preference, visited destinations).
Nothing is transmitted anywhere.

## License

Original work created 2026. Do what you like with it; attribution
appreciated. No affiliation with, or endorsement by, any film or TV
franchise.
