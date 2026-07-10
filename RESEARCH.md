# RESEARCH & ATTRIBUTION LEDGER

Consolidated record of every idea, source, external project, and asset gathered for
the Gate Dialing Computer — with provenance and licensing, so anything we adopt can be
**properly attributed** and used cleanly.

Companion to [ROADMAP.md](ROADMAP.md) (the actionable feature backlog). This file is the
"where did it come from / can we use it" reference. **Status: documentation only — no
third-party code or assets have been adopted yet.**

Last updated: 2026-06-30.

---

## 0. Legal posture (read first)

- **Stargate** and all related marks, names, glyphs, sounds, and designs are trademarks
  of **Metro-Goldwyn-Mayer Studios Inc.** This is a **noncommercial fan project** made to
  celebrate the franchise; it is not affiliated with or endorsed by MGM.
- Treat all canon imagery/audio as **MGM-owned**. Original recreations we author
  ourselves (our SVG gate, procedural audio, CSS) are ours; screen-captured or
  wiki-sourced assets are **not** and should stay reference-only unless cleared.
- Before shipping ANY third-party asset or code, confirm its license below and add the
  required credit to a `CREDITS` section (see §6).

### Our own project's license — DECISION PENDING
This repo currently has **no `LICENSE` file**. Decide before accepting outside
contributions or borrowing licensed code:
- If we ever copy from a **GPL** project, our distributed work would
  need to be GPL too. Copying from **MIT** projects only requires preserving their notice.
- Recommendation: pick a license (MIT keeps it simple and fan-friendly) once we intend to
  reuse anything or invite contributors. Until then, keep everything original.

---

## 4. Local vendored reference assets (`references/`)

Inventory: [references/ASSET_INVENTORY.md](references/ASSET_INVENTORY.md) (gate images,
UI screengrabs, vector SVGs incl. `symbol_set_1/2.svg`, `full_gate_detailed.svg`).

- **Provenance not recorded** — almost certainly fan-wiki (Fandom / GateWorld) uploads and
  show screengrabs. Treat as **MGM copyright, reference-only.**
- **Do NOT embed these in the shipped app** without confirming each file's origin/license.
  The app currently does not serve them (they're dev reference), which is the safe posture.
- Action item: if we want authentic glyphs (idea #1), prefer **original SVGs we redraw
  ourselves** from the constellations — cleaner than shipping unknown-provenance wiki files.

---

## 6. CREDITS (to appear in-app / README when anything is adopted)

_Empty — populate as we adopt each item._ Template:

- **[Asset/Code name]** — by _[author]_, from _[URL]_, under _[license]_. Used for _[what]_.
- Stargate © Metro-Goldwyn-Mayer Studios Inc. Fan project, noncommercial, not affiliated.

---

## 7. License-verification TODO (before adopting)

- [ ] Decide our repo's own `LICENSE` (MIT recommended) before reusing any outside code.
- [ ] Trace provenance of each `references/` SVG before embedding any in the shipped app.
