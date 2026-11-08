# Development and verification

Use Node.js 24 and Git. The shared tools use Node built-ins and need no package
installation. Exhibit application code remains independent; these tools are
never browser dependencies and are not copied into the Pages site.

## Current rollout status

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
failures and HTTP errors. It uses an installed Puppeteer module; install it via
an existing approved exhibit dependency workflow, or set STARGATE_PUPPETEER_MODULE
to that installed module's absolute path. PUPPETEER_EXECUTABLE_PATH may select
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

--suites runs the original Aetheric and Bathyscaphe suites against shared serving.
Install each exhibit's locked dependencies with npm ci first. Missing dependencies
are ENVIRONMENT-BLOCKED; failed original assertions are FAIL. Other exhibits keep
UNVERIFIED adapter entries. Logs/screenshots are saved beside the JSON report.
test:pilots compares the original suites against historical/shared handlers and
also exercises their self-hosting test commands. Historical handlers are loaded
read-only from baseline commit 8c3f718c3e31cd19c169c7cf87ab2feeee7242c1; use a full
checkout containing that commit. They are never restored as active launchers.
Solarpunk has historical changelog evidence but no original tracked executable
suite; check-pilot-browsers.js supplies current supplementary interaction evidence.

The separate test:preview:handlers command tests request handlers without HTTP
transport. It is supplementary evidence. It does not replace test:preview,
which exercises real sockets, symlinks/junctions, port conflicts and lifecycle.
The preview-tools PR workflow runs those tests on Linux and Windows without
installing npm packages. A separate browser job installs the existing locked
Aetheric Puppeteer dependency and runs `node scripts/check-pilot-browsers.js`
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

## Known rollout limitations

The recovery session could execute Node, Git, handlers and static checks, but
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
Automated checks do not establish sound quality, visual or hands-on acceptance. Operator
qualification, broader consolidation and publication remain on HOLD.

## Dependency reconciliation — 2026-11-07

PR #9 explicitly incorporates PR #8's exact source-map-js 1.2.2 lock correction
from e2e2374892c34d153aae02bdfed5b6738cec4404. This is reused work, not an
independent fix. PR #8 remains open and unchanged; its eventual supersession
needs an explicit disposition. PR #7 is stacked on #8 and contains accessibility
changes, which are not copied here. Its release-audit file also changes, so
review the combined audit diff before any later integration. PR #6 changes
apiculture's proxy-addr dependency and is unrelated to the flagship findings.
Neither #6 nor #7 is merged or modified by this campaign.

The flagship's development minima are raised to Vite ^8.3.3 and Vitest ^4.1.12.
Its npm-generated lock updates the matching Vitest family and Rolldown bindings;
runtime dependencies are unchanged. The candidate was generated with npm in
read-only hosted CI because local registry DNS is blocked, reviewed, then
committed for fresh npm ci, audit, tests and build through the existing release
workflow. Historical green PR checks are not current security qualification.
Merge and deployment remain HOLD regardless of automated CI results.
