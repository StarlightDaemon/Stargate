# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-11

**Built by:** Gemini 3.1 Pro (high reasoning)

Compliance pass: versioning, corner marks and proportional viewport fit, plus
a prior session's confirmed busy-flag ordering fix and its verification
scaffolding.

> Note: this working tree already carried an uncommitted 2-line change to
> `main.js` plus untracked test scaffolding from a prior session. Both were
> reviewed, confirmed legitimate, and are documented below as part of this
> release.

### Fixed

- `selectSymbol()` and `engage()` cleared `isBusy` only after calling
  `updateUI()`, so the refresh computed every control's disabled state while
  the terminal still read as busy; the flag is now cleared before the refresh.
  (2-line ordering fix carried in from a prior session, verified against the
  puppeteer flow test below.)
- Build-credit link was missing `rel="noopener noreferrer"` alongside
  `target="_blank"`.
- Corner version label read `v1.0.0` despite a second commit (`b373a19`) having
  shipped; it now tracks the current release (`v1.1.0`), matching
  `version.json`.

### Changed

- The terminal now scales as a single proportional unit: the layout is authored
  into a fixed 1920x1080 design box (`#fit`) scaled by `fitTerminal()`.
  Previously the gate ring was sized in `vh` and grew with the viewport while
  the UPLINK COMMAND and SIGNAL ARCHIVE clusters stayed pinned at 320 px — at
  3840x2160 the ring reached 1412 px while the clusters sat unchanged at the
  extreme left and right edges, ~2000 px from the ring they drive. The whole
  terminal now fills 4K at a clean 2x and is unchanged at 1920x1080.
- Gate ring, chevron and glyph dimensions converted from `vh` to design-box
  pixels (`--gate-size: 65vh` → `702px`, and the chevron/glyph `vh` values to
  their 1080p pixel equivalents), since viewport units inside the scaled box
  would compound with the scale factor. Rendering at 1920x1080 is byte-identical
  to before.

### Added

- `version.json` gains `name`, `device`, `date` and `model` fields.
- Verification scaffolding from the prior session's testing, kept as part of
  the record: `test.js` (puppeteer flow test — dial four symbols, engage,
  disengage, asserting control enable/disable state at each step), `server.js`
  (minimal static server on port 8000), `check.py` (port-8000 process finder),
  `screenshot.png` (captured proof), and `package.json`/`package-lock.json`
  for the puppeteer dependency. `node_modules/` is excluded via a new
  `.gitignore` — large and regenerable from the lockfile.
- Changelog entry for 1.0.1, derived from commit `b373a19` — the file had never
  been updated after the initial commit.

## [1.0.1] - 2026-08-08

**Built by:** Gemini 3.1 Pro (high reasoning)

Commit `b373a19`.

### Fixed
- Ring rotation alignment math, so the inner glyph ring seats each symbol
  correctly under its target chevron.

## [1.0.0] - 2026-08-08

**Built by:** Gemini 3.1 Pro (high reasoning)

Commit `5e5b9e1`.

### Added
- Core Erebus Signal Intercept terminal interface.
- 9-chevron ring dialing sequence with visually alternating rotation alignment.
- Complete signal degradation aesthetic (CRT scanlines, tracking artifacts, chromatic aberration).
- 4-symbol manual dial input with UPLINK COMMAND cluster.
- 6 pre-configured quick-dial frequencies spanning 3 security tiers.
- Integrated SECURITY OVERRIDE (Signal Lockout) subsystem to reject unauthorized signal connections.
- Contextual audio synthesis system for realistic terminal interaction (tones, locks, hums, and static).
- Built-in Operator Reference manual.
