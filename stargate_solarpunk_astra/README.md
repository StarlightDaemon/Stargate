# The Loamwake Commons

The Loamwake Commons is an independent, fictional community soil-restoration exchange. A luminous root-union instrument connects neighbors through four small agreements, while a living field ledger links places, organisms, restoration practices, and observations. It is a decorative, self-contained static website with original names and drawn symbols.

## Visit and operate

Run `node server.cjs` from this directory and open [the local station](http://localhost:4177). The site also works on a static host; it has no production dependencies, external fonts, network services, or build step. Set the `PORT` environment variable to choose another local port.

1. Choose four signs in **Compose route**. Each manual root union takes 900 ms.
2. The fourth sign leaves the route **ready**. Choose **Open exchange** in **Tend passage** to activate it.
3. Watch a 2,100 ms buildup, an 800 ms breakthrough, then the sustained exchange. **Disengage** releases every union and stops its sound immediately.

Stewards’ tracings replay four signs at 480 ms each. They also stop at ready. The resting-soil hold starts released; engaging it blocks opening with a highlighted message and, when sound is enabled, a dissonant tone. Sound begins only after interaction. The sound control can mute it at any time. The field ledger keeps a disengage control available while that alternate view is open.

## A root-to-root agreement

The invented root-union technique borrows the branching and fusion gesture of biological anastomosis. Two local paths approach a junction, their tones converge, and one quarter of the instrument’s inner ring holds the connection. Each address sign adds a distinct bundle; the ring does real incremental work. Opening draws additional filaments inward, produces a bright contact wave with a chord, and settles into an orbital field with a quieter sustained harmony.

The asymmetrical composition places a pale community folio beside a large dark instrument sheet. The folio gives stewardship and destination choices a human context; the instrument reserves its lower edge for two clearly named control clusters. All imagery is screen-native SVG linework and flat color. No photographic materials or cultural ceremonial imagery are simulated.

## Field ledger

Nine entries form a relational archive with 27 typed outgoing connections and generated backlinks. Search spans titles, classifications, summaries, and body text. Follow connections in either direction, bookmark useful entries, filter bookmarks, or trace a route directly from either place entry. Places connect to organisms and practices; observation records cross-reference both places, and the instrument’s mechanism is explained in its own linked entry.

## Persistence

Only these three localStorage keys are used:

| Key | Stored content | Written when |
| --- | --- | --- |
| `loamwake.preferences.v1` | `{ muted: boolean }` | Sound preference changes |
| `loamwake.ledger.v1` | `{ bookmarks: string[], lastEntry: string }` | A ledger entry is selected or bookmarked |
| `loamwake.lastExchange.v1` | `{ address: number[], routeName: string }` | An exchange reaches sustained active |

Reload always starts idle with no address and the hold released. Activation, partial tracings, the current view, search, and the bookmark filter are never restored. Invalid stored values are ignored; unavailable storage leaves the visit usable in memory. Clearing these three keys resets the saved preferences and ledger.

## Accessibility and verification

All controls are native buttons, links, or inputs with visible keyboard focus. Status changes are announced through a polite live region and paired with text. Reduced motion removes the sustained decorative rotation and shortens the pointer transition; progressive root growth and stage captions remain. The interface stacks into a flowing layout on small screens.

The state machine advances from elapsed time inside one animation frame loop. It schedules no transition timers. Disengage clears all sequence state, resets paths and the pointer, cancels audio automation, stops and disconnects every oscillator, and disconnects the output gain. A read-only `loamwakeSnapshot()` reports state for local verification.

Puppeteer verification screenshots, browser profiles, and run logs belong in the ignored `test/` directory. `preview.png` is the sole committed image, sized 800 × 450. See the changelog for measured verification results. Automated dispatched-event checks are evidence, but operator hands-on testing remains the real final check and has not been replaced or claimed by the automated run.
