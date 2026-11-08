# Changelog

All notable changes to the Stargate Municipal Conduit Registry Terminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Cancellable staged authorization — 2026-11-08

**Performed by:** Codex maintenance session.

- Diagnosed immediate `ENGAGED` state, carrier and telemetry startup in the original Engage handler; hosted observations found authorization already active at 300ms, contrary to the required distinct buildup, breakthrough and sustained phases.
- Added 1.4 seconds of amber carrier-indexing rings and accelerating existing seek chirps, followed by an 0.8-second phosphor authorization flash with the existing stamp impact. The established sustained green raster, approved stamp, carrier and live telemetry start afterward. Existing palette, terminal composition, controls and attribution are preserved.
- Stage callbacks and chirps use the cancellation generation introduced by the preset repair. REVOKE PERMIT and mid-activation Compliance Freeze invalidate pending work. Inputs cannot restart an activation already in progress; the final glyph lock establishes ready state before approval becomes available.
- Added a focused deterministic/browser regression for baseline immediate activation, stage feedback, distinct canvas frames, cancellation during both transitional stages, 8.25-second stable idle, oscillator shutdown, exact preset replacement and two manual redial cycles. Deterministic checks pass; hosted browser and visual acceptance remain pending.
- The original eight-phase verification source and positive assertions are unchanged. Its logged 600ms authorization observations now describe buildup. The explicit CURRENT adapter inserts only two sustained-stage waits and retains historical timing mismatches separately. No historical timing diagnostic is relabeled as a current-contract PASS. Merge and deployment remain on HOLD.

### Security maintenance

- Replaced the standalone development handler and the verification suite's embedded handler with the shared public-asset allowlist server. Loopback defaults, launch commands and ports 8840/8899 remain. Parent-directory reads, implementation-file exposure and unsupported request methods are denied.
- Preserved the complete original HTTP checks and eight-phase browser verification body. Added comparisons against the historical standalone and embedded transports, including exact public-asset bytes and real HTTP denial probes. Historical/shared qualification passed in hosted run 42508178082; verification of the migrated entry points is pending the follow-up hosted run.
- Retained existing application behavior and release identity. Interrupted quick-dial callbacks after disengage and qualification of three visibly distinct activation stages remain functional follow-ups; this infrastructure change does not grant operator acceptance.


**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline in `--phosphor-green-bright` with the green glow on the audio toggle, glyph, quick-dial and engage buttons and the starlight link, and on the modal dismiss button; `--amber-warning` on the help button and lockout switch; `--red-reject` on the disengage and modal close buttons. Added alongside the existing rules; no existing rule altered.
- `prefers-reduced-motion: reduce` disables the ambient screen flicker (held at 0.98 opacity). Dial and activation feedback are untouched.

### Changed
- `version.json` restructured to the catalog's common shape: `version`, `model` and `built` at top level (the former `date` key moved verbatim to `built`), with `name` and `device` preserved under a `meta` object. Version value unchanged.
- Test harness `verify_test.js` now writes its seven verification screenshots (idle, dialed, engaged, disengaged/redialed, lockout rejection, quick-dial, help modal) to the gitignored `test/` directory, created on demand, instead of the build root. Harness only; runtime unchanged.

## [1.1.0] - 2026-08-11

**Built by:** Gemini 3.6 Flash (high reasoning)

Compliance pass: proportional viewport fit.

### Changed

- The terminal now scales as a single proportional unit. `.terminal-wrapper`
  was `100vw x 100vh`, so at 3840x2160 the layout stretched but nothing inside
  it grew — canvas 596x358, chevrons 44 px, glyph buttons, footer and every
  font stayed at their 1080p pixel sizes, rendering the whole terminal at half
  apparent size on a 4K panel. It is now authored at a fixed 1920x1080 design
  box inside a `.fit-stage` centering wrapper and scaled with
  `scale(min(calc(100vw / 1920px), calc(100vh / 1080px)))` — exactly 1:1 at
  1920x1080 (verified byte-identical geometry) and a clean 2x at 3840x2160.

  Note the `/ 1920px` denominator: `scale()` takes a unitless `<number>`, so
  dividing a length by a bare number yields a length and the whole declaration
  is silently dropped. Length ÷ length is required.

### Verified (no change required)

- Model attribution present in both `version.json` and this changelog.
- Corner marks correct: `StarlightDaemon` bottom-left linking to
  <https://github.com/StarlightDaemon> with `target="_blank"` and
  `rel="noopener noreferrer"`; version label bottom-right.
- Operator reference present: circular `?` control at top-right opening the
  DITMCO Operator Manual (Form 0-A), dismissable by button and `Esc`.
- Two named control clusters, and a basic dial completes in two actions from
  cold start via the Quick-Dial Cabinet (route → SUBMIT CLEARANCE), verified
  end to end to `CONDUIT ACTIVE [ONLINE]`.

### Versioning note

The three commits after the v1.0.0 release (`e46b674` .gitignore, `c0f16fc`
local static server script, `f94c855` model-attribution docs) changed no shipped
page content, so they are not given their own version numbers here; v1.0.0 is
tagged at `cebb7ff`, the release commit.

## [1.0.0] - 2026-08-11
**Built by:** Gemini 3.6 Flash (high reasoning)

### Added
- Original bureaucratic mainframe terminal theme for the Department of Interzonal Transit & Municipal Conduit Oversight (DITMCO - Registry Division Annex 4-B).
- Form 1099-TX Clearance Application docket workflow with 8-symbol addressing and 12-slot chevron lock status matrix (8 standard fields + 4 reserved priority positions).
- Mechanical Ledger Indexing & Docket Stamp validation gesture replacing mechanical ring rotation.
- Web Audio procedural sound synthesis engine for Model M relay clicks, dot-matrix seek chirps, pneumatic bureau stamp impacts, teletype alerts, and 60Hz mainframe carrier hums.
- Dual action decks with 32 municipal bureaucratic section glyphs, Quick-Dial Cabinet (3 Tier-1 Approved Corridors & 3 Tier-2 Flagged Routes), and Conduit Authorization Console.
- Distinct Administrative Compliance Freeze (Section 44 Lockout Hold) toggle subsystem.
- Persistent Disengage control ("REVOKE PERMIT / DISENGAGE") enabling instantaneous clean teardown and immediate redial.
- Operator Reference (`?`) modal with Bureaucratic Standard Operating Procedures.
- Vector CRT Oscilloscope Canvas displaying municipal conduit raster lines, packet vectors, and event horizon authorization plane.
- Corner metadata links: `StarlightDaemon` (bottom-left) and version label `v1.0.0` (bottom-right).


## Cancellation repair — 2026-11-08

**Maintained by:** Codex maintenance session.
- Own and invalidate manual-stamp, preset, rejection and delayed-teardown callbacks. Cancellation prevents later filed glyphs; a replacement address cannot be erased by the prior teardown.
- Preserves original eight-phase assertions and existing timing/visual design. Dedicated cancellation/replacement probes wait 8.25 seconds. Three-stage activation and operator acceptance remain separate unresolved gates.
