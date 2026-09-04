# Stargate Build Standards

Canonical, current rules for every build in this repository. Read this file
directly before starting any new build or fix pass — do not rely on a
summary of it from memory or from a prior conversation, since this file is
the single source of truth and gets updated as the project learns.

## 1. What this project is

A collection of small, independent, purely decorative novelty websites — a
symbol-address "dial to a destination" gateway concept, original names and
iconography throughout, not a reproduction of any existing copyrighted
franchise. Each build is a single self-contained static site. Live gallery:
starlightdaemon.github.io/Stargate/. Source: github.com/StarlightDaemon/Stargate
(public).

## 2. Repository rules

- This is one public monorepo. New builds are created directly inside it —
  no independent `.git` per build.
- Every push to `main` auto-deploys the live public site immediately, with
  no review gate. **Local commit only, always.** Pushing to `main` is a
  separate, explicit, deliberate decision — never assume it or do it as
  part of "finishing" a build or fix.
- Scope every commit with an explicit pathspec to the one folder/files
  actually being worked on. Never a bare `git commit` or `git commit
  --amend` — either can silently sweep up unrelated staged work elsewhere
  in the shared repo. Verify with `git show --stat` after committing that
  only the intended paths were touched.
- **Directory-collision safety, non-negotiable:** this repo has
  near-identically-named sibling folders (e.g. a build and its `_fable`
  variant). Every fix-pass handoff — not just new-build handoffs — must
  hard-verify its target working directory as literally the first action,
  before touching any file: confirm the exact path, and cross-check
  `version.json`'s `model` field or another identifying detail against the
  intended build's known identity. If it doesn't match, stop and report
  rather than proceeding.

## 3. Required files, from the start — not a close-out afterthought

Every build needs all four of these from the very first commit:

- `README.md` — a real `<h1>`/H1 matching the build's own title, followed
  by an actual body paragraph. **This is the gallery-inclusion gate** — no
  README, no gallery card, silently.
- `CHANGELOG.md` — Keep a Changelog style, starting at `[1.0.0]`, with a
  `**Built by:**` line naming the actual model and reasoning level that
  built it.
- `version.json` — both a `"version"` and a `"model"` field, matching the
  CHANGELOG.
- `.gitignore` — excluding `node_modules/`, created **before** the first
  commit, not fixed after the fact.
- **Verification screenshots and run logs are never committed.** Test
  output belongs in a directory named `test`, which the root `.gitignore`
  excludes. The only image a build commits is `preview.png`. Screenshot
  evidence satisfies the verification requirement by being observed during
  the session and summarised in the CHANGELOG, not by being checked into
  the repository. Editor and agent session files, including `.claude/`,
  are not committed either.
- **`preview.png` is committed at 800px wide by 450px tall, not at the
  build's native 1920x1080 render resolution.** This keeps the gallery
  thumbnail lightweight; it has no bearing on the resolution a build
  renders itself at for an operator.

**Model attribution must be verified, not assumed.** A safety classifier
can silently reroute execution to a different model mid-session. Before
writing any attribution, check your own current runtime identity and
report it plainly — including if it differs from what was originally
requested.

## 4. Content safety (the repo is public)

Before any commit, review your own files for: absolute local filesystem
paths, real usernames, references to any other build's folder name or this
project's internal fleet/governance structure, credentials or tokens, or
anything unrelated to this build's own self-contained content.

## 5. Rendering register — read this before choosing any visual direction

**The founding lesson of this project:** attempting to simulate
photorealistic physical material (brass, wood, painted metal) with flat
vector tools reliably reads as cheap clipart in this medium — especially on
rotationally-symmetric forms, where identical local shading repeated around
a circle defeats any single-light-source read. Several early builds failed
this way and are retired.

**Default register: digital-native.** Flat, glowing, schematic content —
vector line-work, diagrammatic readouts, screen-native glow — reads as
authentic and has worked reliably across every domain tried (scientific
instruments, signal processing, navigation, industrial control).

**This does not forbid physical/craft/historical themes** — it forbids
faking photographic material depth. A theme with a real physical-world
inspiration (Victorian engineering, a mechanical calculating engine, a
historical art movement) succeeds when rendered as clean diagrammatic
line-work or an inherently flat art tradition (a print, a poster, a
stained-glass panel), and fails when it tries to simulate a photograph of
the physical object instead.

## 6. Core functional requirements — every build, no exceptions

- **The ring is a genuine functioning instrument**, doing real visible work
  as symbols lock — never a decorative shape that lights up uniformly.
- **Locking mechanism is invented per build**, grounded in something real
  or thematically specific — not reused from any sibling build's
  vocabulary (mechanism, sound design, and visual gesture should all be
  distinct build-to-build).
- **Activation never auto-fires.** Completing the final symbol leaves the
  system pending/ready; a separate, distinct control is the only trigger.
  Test this explicitly as a negative case with real dispatched events.
- **Activation is a genuine three-stage event**, not a state-flip: BUILDUP
  (1-2s+, real rising tension), BREAKTHROUGH (a specific dramatic instant,
  audio/visual crescendo together), SUSTAINED ACTIVE (visibly/audibly
  distinct from both). Capture screenshots proving all three are visibly
  different from *each other*, not just from idle.
- **Quick-dial presets must genuinely auto-dial** — a visible per-symbol
  sequence, faster than manual but never instantaneous, with its own
  in-universe justification. Landing state, no-auto-fire, and disengage
  availability all apply identically to auto-dial as to manual dialing.
  Screenshots must prove real staged motion *during* the sequence, not
  just before/after.
- **Disengage is always reachable**, never disabled while active. Test a
  full dial-disengage-redial cycle twice with real dispatched events,
  hit-tested at actual rendered positions.
- **Safety interlock defaults to released**, never engaged by default. If
  engaged and blocking, feedback must be visually and audibly unmissable,
  and the toggle easy to find and release.
- **Control-complexity cap is on distinct control TYPES, not repetition
  count.** At most 2 named control clusters for the core loop. A visitor
  must always be able to complete a basic dial without being overwhelmed,
  regardless of how much secondary depth exists elsewhere on the page.

## 7. Composition

Avoid defaulting to a symmetric "wall of data" skeleton (top bar + centered
hero + left wing + right wing + bottom deck) — this has recurred across
many builds even when explicitly told to avoid a rut, and reads as sameness
across the catalog. Composition should be a deliberate choice suited to
the specific identity, and state its reasoning in the build report.

**Regardless of composition:** core interactive controls must stay
immediately, visually distinguishable from ambient telemetry or decorative
elements, at any density.

## 8. Known technical pitfalls

- **CSS `scale()` pitfall:** `scale()` requires a plain unitless number.
  `calc(100vw / 1920)` divides a length by a bare number, producing another
  length — CSS silently rejects it with no visible error. Either divide
  length by length (`calc(100vw / 1920px)`), or compute the ratio in JS
  and assign it as a bare custom property. Verify
  `getComputedStyle(element).transform` is not `"none"` at both 1080p and
  simulated 4K, and report the actual tested viewport dimensions.
- **Two known-unreliable verification paths in this environment** — do not
  attempt either, go straight to Puppeteer: (1) Playwright's browser
  install frequently fails; (2) the IDE's built-in browser subagent has a
  recurring internal driver-download failure. Use Puppeteer directly,
  called from your own script.
- **Automated interaction testing is necessary but not sufficient.**
  Dispatched-event test suites have repeatedly reported dialing/activation
  success that did not hold up under real hands-on use. Report genuine
  per-test evidence (actual values, named screenshots, a narrative
  end-to-end account), and flag plainly that operator hands-on testing is
  the real final check — do not present automated passes as equivalent to
  confirmed-working.
- **Anything scheduled during dialing or activation must not survive a
  disengage.** This applies to state transitions, audio, animation, and any
  other deferred side effect — not just stage transitions. Two mechanisms
  satisfy it. Either advance by comparing elapsed time inside a frame tick,
  so nothing is scheduled and there is nothing to cancel (the shape used in
  `stargate_bathyscaphe_pilot_fable/js/sim.js`). Or, if a timer is used,
  store its handle where the disengage path can reach and clear it, and
  re-check current state at the top of the callback before it acts (the
  shape used by `later(fn, ms)` and `clearTimers()` at
  `stargate_atompunk_fable/app.js:159-163`). Both halves are required, since
  either alone has failed in this catalog. Late callbacks must also not
  assume data they captured still exists, since disengage may have cleared
  it. Verify by dispatching disengage roughly half a second into buildup
  and confirming, after at least eight seconds of no further input, that
  state, visuals, and sound are all still idle.

## 9. Content-sensitivity guardrails

- If a build's visual/formal technique draws on a real historical art or
  design movement with documented political associations (e.g.
  Constructivism, Futurism), use only the *formal visual technique* —
  explicitly exclude any real political content, regime, figure, or
  symbol, and state this exclusion was followed in the build report.
- Avoid drawing on **living** sacred, ceremonial, or Indigenous cultural
  traditions as decorative source material (e.g. Aboriginal dot painting,
  Huichol yarn art) — historical Western/East Asian art *movements* (Art
  Nouveau, ukiyo-e, Bauhaus) are a different, lower-risk category since
  they're widely treated as historical design language rather than living
  sacred practice, but still deserve a moment's thought.
- If a build's theme involves hacking/security/intrusion framing, keep the
  language explicitly narrative and thematic — avoid literal, real-sounding
  technical exploit vocabulary (specific real attack-technique names,
  step-by-step-sounding phrasing). This isn't just a taste preference — it
  has triggered automated safety-classifier reroutes mid-build in this
  project before.

## 10. Gallery status model

Three tiers only: `live` / `known-issue` / `retired`. No "deprioritized" —
if a build isn't fully clean, document the specific issue under a Known
Issues section in its own CHANGELOG; that's what should drive its status,
not an external note.

`_sequestered/` is the retirement location for builds that failed
architecturally (the physical-material rendering trap) or are otherwise
formally retired. It carries a standing no-touch policy — the only
exception is an explicitly-scoped security audit.
