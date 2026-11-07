# Development and verification

Use Node.js 24 and Git. The shared tools use Node built-ins and need no package
installation. Exhibit application code remains independent; these tools are
never browser dependencies and are not copied into the Pages site.

## Current rollout status

The shared server is opt-in. The three pilot exhibits are Aetheric Telegraph,
Bathyscaphe Pilot and Solarpunk Astra. Their old servers and specialized tests
are retained pending full HTTP, browser and interaction acceptance. No pilot
package command has been redirected, and no gallery status has been changed.
Do not treat this foundation as a completed server migration.

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

The existing specialized suites are reported but not yet invoked through
adapters. Aetheric's suite owns an embedded server; Bathyscaphe's suite expects
port 3000. Their assertions must remain intact when those adapters are completed.
Solarpunk's earlier interaction evidence is documented in its changelog; a
new tracked adapter still needs to be prepared and qualified.

The separate test:preview:handlers command tests request handlers without HTTP
transport. It is supplementary evidence. It does not replace test:preview,
which exercises real sockets, symlinks/junctions, port conflicts and lifecycle.
The preview-tools PR workflow runs those tests on Linux and Windows without
installing npm packages. It neither deploys nor replaces the existing release CI.

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
Retain the old servers until those gates pass. Their previously reproduced
containment defects remain unresolved in the legacy commands while migration
is on hold. No infrastructure file has been deleted during this foundation step.
