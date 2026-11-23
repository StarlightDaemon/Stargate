# Stargate

A public gallery of original, client-side "portal console" builds. Each `stargate_*` folder is a small, self-contained, framework-free HTML/CSS/JS build. The gallery site is published to GitHub Pages (https://starlightdaemon.github.io/Stargate/).

**Before creating or fixing any build, read `STARGATE_BUILD_STANDARDS.md`.** It is the authority for builds: required files, content safety, rendering register, functional requirements, known pitfalls and the gallery status model.

## Run and test

- A build needs no install or build step: open its `index.html`, or serve its folder.
- Root tooling: `npm ci` installs `sharp`, which only `scripts/capture-previews.js` needs. The checks below run without it.
- Check the gallery catalog is current: `npm run gallery:check`. After adding or changing a build, regenerate it with `npm run gallery:generate`.
- Hub security check: `npm run security:hub` (`:strict` for the strict variant).
- Pages output guard test: `npm run test:pages-output-guard`.
- Full Pages build, as CI does it (`.github/workflows/deploy-pages.yml`):
  1. `npm ci && npm run build` inside `Stargate_OG/` (the featured build has its own package and build).
  2. From the repo root: `node scripts/build-pages-site.js _site`, then `node scripts/audit-pages-release.js _site`.

  The output folder must be inside the repository, and `_site/` must never be committed.

  The workflow runs on every push but builds and deploys only from `main`. CI doesn't run the three local checks above, so run them yourself before committing.

## Layout

- `hub/`: the gallery site. It scans every build and generates `hub/index.json`.
- `stargate_*/`: individual builds, each servable on its own with its own `README.md`, `CHANGELOG.md`, `version.json` and `preview.png`.
- `Stargate_OG/`: the featured flagship build (has its own npm build).
- `_sequestered/`: retired builds, kept for the record.
- `scripts/`: Pages build, release audit, preview capture and repo-state tools.
- Folders with their own `.git` inside this tree (for example `stargate_audit`, the `stargate_*_check` folders, `stargate_pattern_audit*`, `stargate_blueprint_astra`, `*.presubtree-backup`) are separate review histories. Don't commit into them from here, merge them, or treat them as builds.

## Key rules

- Main branch is `main`. Agent work goes on `<agent>/<task>` branches in their own worktrees.
- **Every push to `main` deploys the live public site immediately, with no review gate.** Commit locally only. Pushing is the owner's explicit decision, never part of "finishing" a task.
- Scope every commit with an explicit pathspec to the files you worked on (never a bare `git commit` or `--amend`), then check `git show --stat`.
- Sibling folders have near-identical names (a build and its `_fable` or `_gemini` variant). Before touching files, confirm the exact target folder and cross-check its `version.json` `model` field.
- Every build needs `README.md` (its H1 is the gallery-inclusion gate), `CHANGELOG.md`, `version.json` and `.gitignore` from its first commit. Verification screenshots and logs are never committed; the only committed image is an 800×450 `preview.png`.
- The repository is public. Before any commit, check your files for absolute local paths, usernames, credentials, references to other projects or private tooling, and anything unrelated to the build.
- No `Co-Authored-By` or other agent attribution lines in commits; the `commit-msg` hook enforces this. Never bypass it. (Build attribution goes in the build's own `CHANGELOG.md` and `version.json`, as the standards describe.)

## Records and hand-over

There is no central open-loops file. A build's gallery status (live, known-issue, retired) is set in the `STATUS_OVERRIDES` and `SEQUESTERED_STATUS` tables in `hub/generate.js`; unlisted builds default to `live`. `hub/index.json` is the generated output: change the tables, then run `npm run gallery:generate`. The reasons for a known issue, and each build's history, are in its `CHANGELOG.md`. Claims and hand-over notes go in `../../HANDOFF.md`: the workspace folder two levels above the repo or worktree root. It's outside Git, so every worktree sees the same file.

## Working in parallel

One agent per worktree. Before starting, read the Claims section of `../../HANDOFF.md` and `git worktree list`, then add your claim line there; mark it done when you finish. Don't edit files another claim covers, and leave other agents' uncommitted work in the main checkout untouched.
