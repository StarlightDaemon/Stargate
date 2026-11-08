# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — development-server security

### Shared verification dependencies — 2026-11-08

- Removed duplicate `puppeteer` declarations in favor of the repository's locked development tools. Package commands and non-dependency metadata are preserved; install shared tools with `npm ci --ignore-scripts` at the repository root before browser verification.
- Adopted exact npm-generated manifest and lockfile bytes from hosted run `42512175752`, job `128827397973`, after byte-count and SHA-256 verification. This candidate passed clean install, installed-tree validation, native CommonJS/ES-module resolution and a full audit with zero findings.
- This dependency qualification does not grant functional, visual, sound, operator or release acceptance. Existing known issues and historical operator dispositions are preserved; merge and deployment remain on HOLD.

### Explicit activation and cancellation repair — 2026-11-08

**Performed by:** Codex maintenance session.

- Presets retain the four visible symbol-seeking steps and now stop pending. The
  operator must press `ENGAGE_LINK` to activate, as with manual dialing.
- The existing link control reads `CANCEL_LINK` during seeking, a partial
  address, activation buildup, or rejection, and remains reachable. Cancellation
  clears the address and owned workflow timers; generation checks prevent an old
  preset or rejection callback from changing a replacement attempt.
- Active disconnect retains its degradation animation and stops the hum. No
  visual assets, layout, URLs, original attribution or original suite changed.
- Audio cleanup owns the fading oscillator instead of looking up a mutable
  current oscillator after a delay. A reproduced stop/restart race previously
  stopped the replacement hum and left the old one running. Delayed lock tones
  and transient sources are now cancelled with their abandoned workflow.
- An offline probe using the actual workflow methods reproduced both baseline
  defects (automatic activation and ineffective busy cancellation), then passed
  exact-address cancellation/restart with the repair. Separate hosted browser
  regression coverage includes explicit activation, real-pointer cancellation,
  rejection/restart, two manual cycles and 8.25-second idle checks. Hosted results
  are recorded separately; full operator and sound acceptance remain separate.

### Fixed

- Replaced the development handler with the shared secure preview launcher after
  historical/shared qualification. Raw HTTP requests previously returned parent
  and sibling files outside this exhibit, exposed the server source and accepted
  POST. The replacement rejects those requests and binds only to loopback.
- Preserved `node server.js` and default port 8000; added the shared `PORT`
  override. The published application, styles, original test flow, version and
  original build attribution are unchanged.

### Verification

- Pre-replacement comparison matched all five public assets byte-for-byte,
  checked all seven expected diagnostics from the original test flow, and passed
  two hit-tested manual dial/activate/disconnect cycles under each server.
- Manual completion remained pending until explicit activation. Desktop screenshots
  and JSON reports are retained outside tracked content. Full animation, sound,
  responsive and operator acceptance remain separate.

### Known issues — separate functional work

- Quick-dial presets automatically activate after dialing. Reproduced under both
  the historical and shared handlers; this violates the explicit-activation
  requirement and is not repaired by the server-security change.
- Both handlers report the existing missing `/favicon.ico` resource.

### Browser icon compatibility — 2026-11-08

**Performed by:** Codex maintenance session.

- Added a local SVG favicon using the existing palette and intercept waveform motif,
  with an explicit HTML icon link to prevent the missing favicon request.

## [1.1.1] - 2026-09-04

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- The standard viewport meta tag (`width=device-width, initial-scale=1.0`), which was absent from `index.html`.
- Keyboard focus indicators: `:focus-visible` outline (2px `--text`, 3px offset) on every `button` and `a`. Added alongside the existing hover rules; no existing rule altered.
- `prefers-reduced-motion: reduce` pauses only the gate's rapid position jitter (`gateShake`) during the seeking state, which is a vestibular trigger redundant with the tracking-line scan and chevron flicker that still convey seeking. Every other state animation is untouched.

### Changed
- `version.json` restructured to the catalog's common shape: `version`, `model` and `built` at top level (the former `date` key moved verbatim to `built`), with `name` and `device` preserved under a `meta` object. Version value unchanged.

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
