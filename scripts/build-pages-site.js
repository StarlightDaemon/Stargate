// ============================================================
// build-pages-site.js — assembles a deployable static site for GitHub
// Pages: hub/ itself, plus every folder hub/generate.js's discovery
// pass qualifies as a gallery entry, each copied to the exact relative
// subpath its `link` field in hub/index.json already expects.
//
// This script does NOT reimplement folder discovery. It shells out to
// the existing hub/generate.js (unmodified) to (re)produce a current
// hub/index.json, then copies files based solely on what that index
// says exists. If generate.js's discovery rules change, this script
// picks that up automatically.
//
// Stargate_OG is never copied: generate.js keeps it out of `entries`
// (it's surfaced separately as `featured`, which this script ignores),
// because it's the one folder in this repo that needs an actual build
// step (tsc + vite build) rather than being served as-is.
//
// Usage: node scripts/build-pages-site.js [outputDir]
// Default outputDir: <repo root>/_site
// ============================================================

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const HUB_DIR = path.join(ROOT, "hub");
const OUTPUT_DIR = path.resolve(process.argv[2] || path.join(ROOT, "_site"));

const SKIP_ENTRIES = new Set(["node_modules", ".git", ".DS_Store"]);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP_ENTRIES.has(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

function main() {
  execFileSync(process.execPath, [path.join(HUB_DIR, "generate.js")], {
    stdio: "inherit",
  });

  const index = JSON.parse(
    fs.readFileSync(path.join(HUB_DIR, "index.json"), "utf8")
  );

  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // hub/ mirrored at the same subpath it occupies in the repo, so its
  // own relative links (../<folder>/..., ../_sequestered/<folder>/...)
  // keep resolving without any rewriting.
  copyDir(HUB_DIR, path.join(OUTPUT_DIR, "hub"));

  const copied = [];
  for (const entry of index.entries) {
    const isSequestered = entry.link.startsWith("../_sequestered/");
    const relDir = isSequestered
      ? path.join("_sequestered", entry.folder)
      : entry.folder;
    copyDir(path.join(ROOT, relDir), path.join(OUTPUT_DIR, relDir));
    copied.push(relDir);
  }

  // Root landing page: the Pages URL root has nothing else to serve
  // (hub lives at /hub/, mirroring the repo layout above), so drop in
  // a redirect. Generated into the build output only — not a repo file.
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "index.html"),
    '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=hub/"><a href="hub/">Continue to the hub</a>\n'
  );

  console.log(`\nAssembled static site at ${path.relative(ROOT, OUTPUT_DIR) || "."}`);
  console.log(`  hub/ -> hub/`);
  for (const relDir of copied) {
    console.log(`  ${relDir} -> ${relDir}/`);
  }
  console.log(`  (root) -> index.html [redirect to hub/]`);
}

main();
