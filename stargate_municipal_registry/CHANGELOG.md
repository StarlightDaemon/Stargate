# Changelog

All notable changes to the Stargate Municipal Conduit Registry Terminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
