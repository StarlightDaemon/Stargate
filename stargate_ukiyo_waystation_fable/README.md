# Kagerō Road Waystation Registry

> **Status note:** this build is closed as a single, one-off attempt; no further
> iteration is planned. Operator review found it did not meet expectations
> compared to a sibling build on the same brief — in particular, the
> quick-dial (traveler's token) auto-dial behavior did not read as present or
> working during real use, even though the build's own automated Puppeteer
> verification reported specific staged auto-dial timing. That discrepancy
> between automated verification and operator experience is unresolved.
>
> **v1.0.1 fix pass, 2026-08-25.** After the close-out above, a targeted fix
> pass shipped as v1.0.1 (see CHANGELOG.md). It made the ring itself the
> primary locus of dialing feedback — the aperture now builds the destination
> print layer by layer as each impression lands — and it stopped manual clicks
> that arrive while the wheel is still turning from being silently discarded;
> those are now queued and replayed through the normal registration path.
> This note records that the fix pass happened. It does **not** claim the
> quick-dial discrepancy described above was resolved by it: v1.0.1 was
> verified by the automated suite only, and no operator has redialed this
> build by hand since. The status note above stands as written.

An interactive novelty portal-dialing console rendered as a Japanese woodblock print.
The **Kagerō-kaidō** — the Shimmer Road — is a legendary route whose ten waystations
are joined not by footpath but by printed passage: the Lantern Wardens who keep the
road maintain a great **Registry Dial**, a carved ring of ten travel-glyphs. To open
the way to a station, a warden locks that station's seven-glyph address one impression
at a time, exactly the way a woodblock print is pulled — the sumi key-block outline
first, then each color block stamped down in careful registration — until the
station's print resolves and the road stands ready. Only the vermillion **Warden's
Seal** may then break the passage open; a wave crests inward from the rim of the
dial and breaks into open water, and the way is live until the **Release Cord**
is drawn.

Everything on the page is flat, bold, outlined color — no gradients-as-lighting,
no digital glow — in the classic gamut of indigo, ochre, vermillion, sumi black,
and warm paper. All audio is synthesized in-browser: woodblock thuds, paper
rustle, a bronze bell, wind and water. No backend, no network calls, no state
that outlives the page.

## Running it

Serve the folder with any static file server and open it in a browser, e.g.:

```
python -m http.server 8613
```

then visit `http://localhost:8613/`. The console is composed for a 1920×1080
viewport and scales cleanly up to 3840×2160.

## Operating the dial

- Click glyphs on the Registry Dial to lock a seven-impression address, or click
  a traveler's token to let the wardens' pre-cut blocks stamp an address for you.
- A full address leaves the road **registered, never open** — press the square
  vermillion Warden's Seal to begin the opening.
- The knotted Release Cord disengages at any moment, even mid-passage.
- If the Barrier Writ has been posted (an unfavorable omen closes the pass), the
  Seal will refuse until the writ is lifted. The pass stands open by default.
