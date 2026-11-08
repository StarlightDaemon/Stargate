# Development and verification

Use Node.js 24 and Git. Preview, static verification and handler tests use Node
built-ins. Browser tests and image tools use the shared root lockfile; run
`npm ci --ignore-scripts` from the repository root before using them. Supply an
installed Chrome through `PUPPETEER_EXECUTABLE_PATH`; installation does not fetch
a browser. The root toolchain owns Puppeteer, Puppeteer Core, pngjs and sharp.
Exhibit application code remains independent; these tools are never browser
dependencies and are not copied into the Pages site. The flagship retains its
own package installation and build workflow.

## Current rollout status

Checkpoint, 2026-11-08: all 33 original scoped server launchers have migrated to
shared serving, together with the additional Cyberpunk Fable, Steampunk Fable
and Ukiyo Waystation Fable entry points. Cerulean Lantern's migration preserves
nine public assets and the original 185/185 close-out checks in both modes;
its build suite still records 132/133 (normalized-heading mismatch) and its
stage suite 23/24 (breakthrough white-rim predicate). These original failures
remain visible and prevent a full acceptance claim. All seven additional package-source
entry points now use shared loopback serving: Blueprint Drafting, Cathedral
Oculus, Mastering Suite, Orthographic CAD, Radio Interferometry, SETI Deepscope
and SETI Freeform. The last migrated command awaits its final hosted CLI check. These counts distinguish the original
33-server scope, three additional entry points and seven package-source entries.

Orthographic CAD, Radio Interferometry, SETI Deepscope and SETI Freeform retain
Vite build and built-artifact preview as separate specialist contracts. Source
preview does not replace a build or qualify its output. The built-preview gate
runs actual npm commands, compares public dist bytes and source/built rendering,
checks Host/origin/method restrictions, and verifies port conflict and shutdown.
Its results remain separate from source-serving and original-suite evidence.

The all-active-page load gate covered 57 exhibits: 231 PASS, 0 FAIL, 1 SKIP and
116 UNVERIFIED. This covers metadata, resources and initial browser loading;
it does not qualify every original suite, interaction or operator requirement.
Original Atompunk Fable and Solarpunk Conservatory pixel assertions still record
baseline failures. Blueprint Alpha's original suite retains its historical
automatic-preset/500 ms activation contract; current staged/manual-Engage
acceptance is reported separately. Its operator-reported manual-dialing issue
is not closed by automation. Gallery dispositions and builder attribution remain
unchanged.

The root toolchain and all 35 scoped exhibit dependency candidates are adopted;
all seven package-source migrations are implemented. Four built-preview contracts
remain separate gates: Radio, Orthographic and DeepScope passed in run
`42515274539`; Freeform retains its original manual-cadence failure.
See dependency reconciliation below. Qualification evidence is preserved in the
[preview-tools workflow](../.github/workflows/preview-tools.yml),
[suite registry](suite-registry.js) and
[hosted run 42515274539](https://github.com/StarlightDaemon/Stargate/actions/runs/42515274539).
Registry eligibility is not a fresh test result. Full functional, visual, sound
and hands-on operator acceptance remain separate gates. Merge and deployment
remain **HOLD**, including after a green subset of automated checks.

## Early rollout history — 2026-11-07–08

The following records preserve the initial eight migrations and their findings.
Their ordinal counts, pending work and dependency descriptions describe those
checkpoints, not the current rollout. Later repairs retain the original evidence
in the relevant exhibit CHANGELOG and comparison reports.

The three pilots (Aetheric Telegraph, Bathyscaphe Pilot and Solarpunk Astra) now
use shared serving through their existing server.js/server.cjs commands. Ports
8420, 3000 and 4177 and PORT overrides are preserved. Keep the parent repository
tools available for local preview. Their browser applications remain independent.
The original Aetheric/Bathyscaphe assertions are retained; both suites now own
ephemeral previews and close them when finished. No gallery status changed.
Broader migration, merge and deployment remain gated on full acceptance.

The first expansion target, Bibliographic Depository, also uses shared serving
through npm start/dev and server.js (port 5173, PORT override). Its 27 original
assertions, all five public assets and two real-browser manual cycles were
qualified against historical/shared handlers before replacement. Existing missing
favicon observations remain explicit. AUREOLE's exported server API and Cerulean
Lantern's positional-port/specialist harnesses need separate adapters; they have
not been bulk-replaced. Operator acceptance and publication remain on HOLD.

Erebus Signal is the fifth shared-server exhibit. Its `node server.js` command
keeps port 8000 and now accepts `PORT`. Before replacement, raw HTTP reproduced
parent/sibling-file exposure, source exposure and unrestricted POST in the
historical handler. `node scripts/check-erebus-security.js` compares the pinned
historical handler with shared serving: five exact public assets, the retained
original flow's seven expected diagnostic values and two manual interaction cycles
per mode. The launcher security test also exercises the actual exhibit command.
The comparison reports preservation separately from functional acceptance:
Erebus presets auto-activate under both handlers, and both have a favicon 404.
These existing defects remain explicit; no full exhibit or operator pass is claimed.
The browser environment variables are the same as the pilot checks below.

Reactor Criticality is the sixth shared-server exhibit. Its nested
`node scripts/server.js` command keeps port 8080 and accepts `PORT`. The original
handler's parent/sibling/source exposure, unrestricted POST, wildcard CORS and
all-interface binding are replaced by the shared policy. The historical loader
resolves the actual script directory for nested servers. Common HTTP and hit-test
helpers are shared by the Erebus and Reactor comparison scripts.
`node scripts/check-reactor-security.js` retains the original 79-assertion engine
suite, checks 11 public assets and compares two manual browser cycles, interlock
rejection, stepped presets, three activation stages and cancellation. Stale action
labels/hidden activation banner, stale preset status after SCRAM and favicon 404
are reported as existing behavior; preservation PASS is not full exhibit acceptance.

Blueprint Alpha is the seventh shared-server exhibit. `node server.js` and
`npm start` preserve port 8088 and accept `PORT`; `npm test` owns an ephemeral
shared preview instead of another handwritten server. Historical raw HTTP
reproduced traversal/source exposure in its custom and embedded-test handlers.
The locked `serve` CLI blocked traversal but exposed development files and
accepted POST. `node scripts/check-blueprint-security.js` records these distinct
baselines, six exact public assets, original functional assertions and two
hit-tested manual cycles. The original suite's `serve` redirect incompatibility
is retained as a transport FAIL; original-suite shared/custom comparisons pass.
Actual development commands and the test-owned listener are security checked.
The self-hosted `npm test` command also runs without disabling Chrome's sandbox.
Operator-reported manual dialing remains unresolved; preset auto-activation and
favicon 404 remain explicit. Blueprint now removes unused `serve`, raises
Puppeteer to ^25.16.0 and locks its supported dependency tree, including Zod 4.6.7.
The full-tree audit (including development dependencies) blocks CI on any finding;
fresh install, dependency graph and lockfile stability are checked separately.
Historical `serve` qualification is preserved at commit
`d4ce5294bc65182bcff1a17e085a69700ecf2f10`, workflow run `42462388786`; its original
suite redirect FAIL remains evidence, while the removed CLI's current rerun is
explicitly SKIP. Custom/shared original suites and current entry-point checks
continue to run.

Synchrotron Collider is the eighth shared-server exhibit. `node server.js`
preserves port 3042 and accepts `PORT`. The historical handler exposed parent,
sibling and development files and accepted POST; its listener had no explicit
host restriction. The shared replacement rejects those requests and binds only
to loopback. `node scripts/check-synchrotron-security.js` enforces all twelve
unchanged original predicates, checks eight public assets, two manual cycles,
staged presets without auto-fire and cancellation followed by 8.25 idle seconds.
The original suite records booleans without a failing exit; the adapter enforces
every result. It borrows the existing qualified Blueprint browser dependency
without changing the target's dependencies. The original suite and application
files remain unchanged. Favicon 404 and displayed v1.1.0 versus metadata1.1.1
remain existing observations; preservation is not full operator acceptance.
Twenty-five original active server implementations remain.

## Preview one exhibit

From the repository root:

```sh
npm run preview -- --exhibit stargate_solarpunk_astra --port 4177
```

Use the exact active static exhibit directory name. The server binds only to
127.0.0.1. The default port is 4173; --port takes precedence over PORT. Port 0
selects a free port and prints its URL. Ctrl+C stops the server.

Only tracked files with supported public asset types are served. Existing
tracked files reflect edits immediately. Add new intended public files to Git
and restart to update the allowlist. Dotfiles, package manifests, development
servers, harnesses, private-key files and test directories are denied. Directory
links and symlinks are rejected, including links within an exhibit. No directory
listing or arbitrary filesystem root is offered. Directory indexes require a
trailing slash. Errors return generic messages without filesystem paths.

The source tree is trusted local developer input; do not let an untrusted
process concurrently mutate it. This is a development tool, not a production
server. Stargate_OG keeps its existing Vite development and build workflow.
Retired entries are deliberately excluded from preview selection.

## Verification reports

```sh
npm run verify
npm run verify -- --exhibit stargate_bathyscaphe_pilot --http
npm run verify -- --changed main --http --browser
npm run verify -- --exhibit stargate_aetheric_telegraph --suites
npm run test:suites -- --list
npm run test:suites -- --exhibit stargate_municipal_registry
npm run test:pilots
npm run test:preview
```

Verification checks the current gallery against discovery, existing hub security
and output safeguards, required metadata, and literal HTML/CSS/module resource
references. All active static entries are selected by default. Repeat --exhibit
for several exact targets. --changed accepts a commit/ref; shared tooling or
gallery changes select all active static entries. It examines tracked changes
relative to that ref, so stage new exhibit files first. A changed-ref selection
with no affected active exhibit checks repository safeguards only.

--http checks every allowed asset through real loopback HTTP. --browser checks
initial loading at 1920x1080 and records page errors, console errors, request
failures and HTTP errors. It uses the installed root Puppeteer module; set
STARGATE_PUPPETEER_MODULE to another qualified installed module's absolute path
when needed. PUPPETEER_EXECUTABLE_PATH may select
an installed Chrome. No browser is downloaded and no sandbox flags are disabled
by these tools. Remote font/resource failures remain visible in the report.

Each run writes a distinct JSON report under ignored test/verification/ and
prints readable check statuses. Exit codes: 0 means the reported scope has no
failed or incomplete checks; 1 means a failure; 2 means unverified or blocked
checks remain. Current reports explicitly retain UNVERIFIED entries for the
flagship build, assembled release, specialized test suites and operator testing.
An all-green metadata/resource subset is not a qualified release.

Statuses are PASS, FAIL, SKIP, UNVERIFIED and ENVIRONMENT-BLOCKED. Metadata defects
remain failures even if the root .gitignore provides equivalent ignore coverage.
Retired exhibits are SKIP, not silently repaired. Static scanning covers literal
href/src/poster attributes, CSS url() values and relative JavaScript imports;
it does not resolve arbitrary generated URLs, srcset, CSS escapes or all network
calls. Keep browser and publication audits as separate requirements.

--suites routes selected exhibits through `suite-registry.js` and
`run-qualified-suites.js`. `npm run test:suites -- --list` prints available
contracts; use repeated `--exhibit` selections or explicit `--all`. Pending
adapters remain UNVERIFIED unless deliberately selected with `--include-pending`
on `test:suites`. This option executes a checker; it does not qualify it.
Missing dependencies are ENVIRONMENT-BLOCKED; failed original assertions are
FAIL. Fresh per-run evidence under ignored `test/qualified-suites/` separates
preservation, original-suite, coverage, functional and operator status. Missing
or stale evidence cannot become PASS, and supplementary probes cannot create
an original-suite pass. Install any remaining exhibit-specific dependencies
according to its README in addition to the root toolchain.

The saved coverage ledger in `qualification-coverage.json` retains 57 active
targets and 62 recorded original harness paths; it is not a new inventory.
Fresh qualification now enables the Darkpool and Lumina original suites and
the remaining Celestial, High SciFi, Aetheric environment, Bibliographic scaffold
and Conservatory capture checks. Those last five are observational or tooling
evidence and cannot establish original-suite PASS. Registered focused regression
steps cover Blueprint Alpha, Bathyscaphe Pilot, Erebus, Reactor, Nimbus notes
and Ecogrid/SETI Freeform keyboard reachability. Municipal stage and Blueprint
Drafting current-contract routes report independent evidence. Drafting’s eight
current-contract cycles passed. Municipal’s strengthened audio/pixel check passed
in run `42515274539`, job `128836833671`: real audio starts, exactly two sustained
oscillators, muted activation with no new starts, seven stable cancellations and
unchanged stage-color thresholds. Earlier failures remain in the evidence history.
Supplementary status documents require an explicit current PASS path and fresh
evidence; they cannot override historical original failures or operator status.

test:pilots compares the original suites against historical/shared handlers and
also exercises their self-hosting test commands. Historical handlers are loaded
read-only from baseline commit 8c3f718c3e31cd19c169c7cf87ab2feeee7242c1; use a full
checkout containing that commit. They are never restored as active launchers.
Solarpunk has historical changelog evidence but no original tracked executable
suite; check-pilot-browsers.js supplies current supplementary interaction evidence.

The separate test:preview:handlers command tests request handlers without HTTP
transport. It is supplementary evidence. It does not replace test:preview,
which exercises real sockets, symlinks/junctions, port conflicts and lifecycle.
The preview-tools PR workflow runs tooling tests on Linux and Windows. Separate
browser jobs install the shared root lockfile and run the registered comparison
and regression checkers, including `node scripts/check-pilot-browsers.js`,
with STARGATE_PUPPETEER_MODULE and PUPPETEER_EXECUTABLE_PATH configured. It compares
the retained legacy handlers with shared serving, using loopback listeners.
It records real pointer interactions, staged presets, explicit activation,
disengage/redial, cancellation, runtime/resource errors and screenshots under
test/pilot-browser/. CI retains these as the pilot-browser-evidence artifact.
This supplementary checker does not replace the original exhibit suites or
qualify keyboard, reduced motion, sound, visual quality or operator acceptance.
The workflow neither deploys nor replaces the existing release CI.

## Contributor and agent workflow

1. Read STARGATE_BUILD_STANDARDS.md and verify the exact folder and builder
   metadata before edits. Keep the independent visual composition, controls,
   dialing engine, audio, storage keys and public URLs.
2. Create a new exhibit with its own README title/body, CHANGELOG and original
   builder attribution, version/model metadata and .gitignore. Declare any
   persistence based on actual code. Keep evidence in ignored test/ directories.
3. Stage new public files, preview the exact folder and run targeted verification.
   Run its specialized interaction suite separately. Capture manual and staged
   dialing, explicit activation, all three stages, two disengage/redial cycles,
   interrupted buildup followed by eight idle seconds, keyboard, reduced motion
   and relevant viewports. Automated evidence is separate from hands-on approval.
4. Maintain dependencies only where used. Use the existing lockfile and npm ci;
   run fresh npm audit before claiming dependency security. Missing registry
   access is ENVIRONMENT-BLOCKED. Do not update locks or consolidate browser
   packages without verification. Keep the flagship architecture intact.
5. Generate the gallery with npm run gallery:generate, review its diff, then run
   npm run gallery:check. Known-issue dispositions require the documented
   acceptance evidence before changing. Keep original defect history.
6. Capture previews using the established capture-previews workflow and review
   them visually. Commit only the approved 800x450 preview.png, not test images,
   browser profiles or run logs. Maintain original build attribution and record
   maintenance separately.
7. Build the flagship with npm ci, npm test and npm run build in Stargate_OG.
   Run node scripts/build-pages-site.js followed by node
   scripts/audit-pages-release.js against its output. Never substitute a dummy
   flagship build. Recheck resource URLs, artifact exclusions and browser loading.
8. Use scoped commits and reconcile overlapping PRs. Keep unavailable checks and
   operator gates explicit. Merging main may deploy Pages; merge only after
   required evidence, then verify deployment and public URLs separately.

## Recovery history and continuing acceptance limits

At the initial recovery checkpoint, the session could execute Node, Git,
handlers and static checks, but
loopback client connections were denied, test junction creation was prohibited,
Chrome could not launch and npm DNS was unavailable. Those observations do not
establish a product regression or excuse a passing HTTP/browser/security claim.
Subsequent CI passed all 17 tooling tests on Linux and Windows, including real
HTTP and filesystem-link rejection. Browser comparisons reproduced an existing
Aetheric defect under both servers: cancelling during ignition left an
uncancelled callback that restored ACTIVE with zero staged glyphs. The continuation
stores/clears that timer and checks state in its callback. Both original pilot
suites passed against legacy/shared serving before their implementations were
replaced. The compatibility launchers now use the tested shared security policy;
Aetheric's embedded test server is removed. No server path was deleted.
Bathyscaphe/Solarpunk now declare local SVG favicons. The 17 missing exhibit
.gitignore files are added; Pages assembly excludes these development files and
the release audit rejects any that leak into its output. Browser checks continue
to fail on resource errors; none are filtered to obtain a pass.
These are historical environment observations, not blanket blockers on the
subsequent hosted qualification and consolidation recorded above. Automated
checks do not establish sound quality or hands-on acceptance. Visual review must
identify the actual captures and scope reviewed. Operator qualification and
publication remain on HOLD; authorized consolidation continues with per-target
evidence and preserved failure records.

## Dependency reconciliation — updated 2026-11-08

PR #9 explicitly incorporates PR #8's exact source-map-js 1.2.2 lock correction
from e2e2374892c34d153aae02bdfed5b6738cec4404. This is reused work, not an
independent fix. PR #8 remains open and unchanged; its eventual supersession
needs an explicit disposition. PR #7 is stacked on #8 and contains accessibility
changes. On 2026-11-08 the exact three-file patch from
a26cea51dbd404c054e776a535008cc87415e63e was incorporated into this branch with
its loading/status release-audit invariants; this reuses PR #7 rather than
claiming a new fix. Combined release/browser checks remain required.

PR #6 updates Apiculture's transitive proxy-addr from 2.0.7 to 2.0.8. After
qualifying Apiculture's original suite and server, this campaign removed its
unused Express dependency and associated qs override. That removal eliminates
the dependency path addressed by PR #6; it does not merge or close the PR.
PRs #6, #7 and #8 remain unmerged and require an explicit final disposition.

The flagship's development minima are raised to Vite ^8.3.3 and Vitest ^4.1.12.
Its npm-generated lock updates the matching Vitest family and Rolldown bindings;
runtime dependencies are unchanged. The candidate was generated with npm in
read-only hosted CI because local registry DNS is blocked, reviewed, then
committed for fresh npm ci, audit, tests and build through the existing release
workflow. Historical green PR checks are not current security qualification.
Merge and deployment remain HOLD regardless of automated CI results.

The shared root toolchain uses Puppeteer/Puppeteer Core ^25.16.0, pngjs ^7.0.0
and sharp ^0.35.5. Local checkpoint `5ff28b2` adopts npm-generated manifest/lock bytes for
these 19 qualified targets (published commit IDs differ; linked hosted jobs
provide the shared evidence provenance):

- Apiculture Telemetry, Atompunk Fable, Bathyscaphe Pilot, Caissa Workstation,
  Canopy Commons, Futurist Dynamism and Konstrukt Transit.
- Nouveau Nimbus, Ukiyo Waystation, Cyberpunk Gemini, Dark Gothic Fable,
  Dark Matter Array and Fulldome Planetarium.
- Seismic Triangulation, SIGINT Cryptanalysis, Solarpunk Conservatory,
  Steampunk Fable, Ukiyo Waystation Fable and Windtunnel Aerodynamics.

Each selected candidate passed clean install, dependency graph, native CJS/ESM
root-module resolution and a zero-finding full-tree audit in
[candidate job 128822957920](https://github.com/StarlightDaemon/Stargate/actions/runs/42510716794/job/128822957920).
All 38 emitted files were validated by byte count and SHA256 before adoption;
package commands and unrelated metadata were preserved. Duplicate browser/image
dependencies were removed from these targets, with the additional Apiculture
removal described above. Atompunk and Conservatory original pixel failures
remain distinct from dependency qualification; their assertions were not weakened.

That first candidate job failed on four other empty-lock guards (Aetheric
Telegraph, Erebus Signal, Municipal Registry and Synchrotron Collider). Those
four and the other pending candidates were not covered by the first adoption.
Do not report that historical batch as wholly clean.

Local checkpoint `53ef1a2` adopts the remaining 16 candidates after
[job 128827397973](https://github.com/StarlightDaemon/Stargate/actions/runs/42512175752/job/128827397973)
passed all 35 scoped candidates. The four dependency-free anonymous manifests
legitimately produce empty npm lock graphs; the qualified guard now accepts
that exact shape without accepting missing roots in nonempty graphs. All 32
new emitted files were byte-count/SHA256 checked, installed cleanly, resolved
shared modules natively from CJS and ESM, and audited with zero findings.
The additional targets are Aetheric Telegraph, Cerulean Lantern, Blueprint Alpha,
Blueprint Drafting, Cathedral Oculus, Cyberpunk Fable, Darkpool Router, Erebus
Signal, Lumina Grove, Mastering Suite, Municipal Registry, Orthographic CAD,
Radio Interferometry, SETI Deepscope, SETI Freeform and Synchrotron Collider.
Existing commands, including Blueprint Alpha's explicit current/historical test
commands, were preserved. Five Vite trees now resolve Vite 6.4.5 and
source-map-js 1.2.2; the two retained http-server trees resolve follow-redirects
1.16.3 and qs 6.17.1. This is dependency evidence, independent of functional
failures and the separately qualified package-command serving policy.

`node scripts/check-dependency-baseline.js`
collects fresh per-tree audits without installs or lock repair; missing locks
remain UNVERIFIED and registry denial is ENVIRONMENT-BLOCKED. Fresh checks on
the adopted branch report 37 audited PASS, 0 FAIL and eight dependency-free
SKIP results in run `42514572291`, job `128834660881`. CI audits tracked empty
lock graphs too, and fails on findings, invalid locks or unavailable registry
evidence. One-off candidate-generation jobs are retired after adoption; the
preparation tools remain available for explicitly scoped future updates.
Clean dependency evidence does not establish final release acceptance.
