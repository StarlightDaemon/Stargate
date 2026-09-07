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
// Stargate_OG is the one exception to that: generate.js keeps it out of
// `entries` (it's surfaced separately as `featured`) because it's the one
// folder in this repo that needs an actual build step (tsc + vite build)
// rather than being served as-is. So it isn't copied from source like the
// entries are — its already-built dist/ contents are copied instead, to
// the path the featured link expects. The build itself is the caller's
// job (CI runs it immediately before this script); dist/ is never
// committed to the repo.
//
// Usage: node scripts/build-pages-site.js [outputDir]
// Default outputDir: <repo root>/_site
// ============================================================

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const HUB_DIR = path.join(ROOT, "hub");
const PAGES_DIR = path.join(ROOT, "pages");
const OG_DIR = path.join(ROOT, "Stargate_OG");
const OG_DIST_DIR = path.join(OG_DIR, "dist");
const OG_PREVIEW_CANDIDATES = ["preview.png", "preview.jpg", "preview.jpeg"];
const OUTPUT_DIR = path.resolve(process.argv[2] || path.join(ROOT, "_site"));
const SITE_ORIGIN = "https://starlightdaemon.github.io";
const BASE_PATH = "/Stargate/";

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative);
}

function nearestExistingAncestor(candidate) {
  let current = candidate;
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) return current;
    current = parent;
  }
  return current;
}

function assertSafeOutputDir(outputDir) {
  const resolvedRoot = path.resolve(ROOT);
  const resolvedOutput = path.resolve(outputDir);
  if (!isWithin(resolvedRoot, resolvedOutput)) {
    throw new Error(
      `Refusing to replace output directory outside the repository: ${resolvedOutput}`
    );
  }

  const relative = path.relative(resolvedRoot, resolvedOutput);
  const firstSegment = relative.split(path.sep)[0];
  if (firstSegment.toLowerCase() === ".git") {
    throw new Error(`Refusing to replace output directory inside .git: ${resolvedOutput}`);
  }

  const rootReal = fs.realpathSync(resolvedRoot);
  const existingAncestor = nearestExistingAncestor(resolvedOutput);
  const ancestorReal = fs.realpathSync(existingAncestor);
  if (ancestorReal !== rootReal && !isWithin(rootReal, ancestorReal)) {
    throw new Error(
      `Refusing output directory whose real path leaves the repository: ${resolvedOutput}`
    );
  }

  const tracked = execFileSync(
    "git",
    ["-C", resolvedRoot, "ls-files", "--", relative.split(path.sep).join("/")],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  ).trim();
  if (tracked) {
    throw new Error(
      `Refusing to replace output directory containing tracked files: ${resolvedOutput}`
    );
  }
}

// Test-output and editor/agent session directories are never part of the
// served site. Verification screenshots and run logs live under these
// names inside build folders (see STARGATE_BUILD_STANDARDS.md section 3), and
// `scripts` covers per-build harness / dev-server code. This set is only
// ever applied inside a copied folder (hub/, each gallery entry, OG dist/),
// never at the repo root, so the repo's own scripts/ is unaffected.
const SKIP_ENTRIES = new Set([
  "node_modules",
  ".git",
  ".DS_Store",
  "test",
  "tests",
  "verify",
  "screenshots",
  "test_screenshots",
  "test_artifacts",
  "test-artifacts",
  ".claude",
  "scripts",
]);

const SKIP_FILES = new Set([
  "README.md",
  "CHANGELOG.md",
  "package.json",
  "package-lock.json",
  "npm-shrinkwrap.json",
]);

const ROOT_DEVELOPMENT_FILE = /^(?:(?:test|verify|diag|audit)(?:[_-].*)?|.*[_-](?:test|spec)|run[_-]?tests?(?:[_-].*)?|server)\.(?:[cm]?js|ts|html)$/i;

// Google Fonts requests disclose a visitor's IP address to a third party and
// make each standalone build depend on an off-site render-blocking resource.
// The source builds already declare usable local fallback stacks, so Pages
// artifacts intentionally omit those remote font links/imports. This applies
// only to copied HTML/CSS output; it does not rewrite a build's source files.
function withoutHostedGoogleFonts(source, extension) {
  if (extension === ".html") {
    return source.replace(/\s*<link\b[^>]*(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>\s*/gi, "\n");
  }
  if (extension === ".css") {
    return source.replace(/@import\s+url\(\s*["']?https:\/\/fonts\.googleapis\.com\/[^)]*\)\s*;\s*/gi, "");
  }
  return source;
}

function copyDir(src, dest, relativePath = "") {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP_ENTRIES.has(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d, path.join(relativePath, entry.name));
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name)) continue;
      if (relativePath === "" && ROOT_DEVELOPMENT_FILE.test(entry.name)) continue;
      const extension = path.extname(entry.name).toLowerCase();
      if (extension === ".html" || extension === ".css") {
        fs.writeFileSync(d, withoutHostedGoogleFonts(fs.readFileSync(s, "utf8"), extension));
      } else {
        fs.copyFileSync(s, d);
      }
    }
  }
}

function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    "\"": "&quot;",
  })[character]);
}

function writeSitemap(index) {
  const hubUrl = `${SITE_ORIGIN}${BASE_PATH}hub/`;
  const references = [
    index.featured?.link,
    ...index.entries.map((entry) => entry.link),
  ].filter(Boolean);
  const urls = [hubUrl, ...references.map((reference) => new URL(reference, hubUrl).href)];
  const uniqueUrls = [...new Set(urls)];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...uniqueUrls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
    '</urlset>',
    '',
  ].join("\n");
  fs.writeFileSync(path.join(OUTPUT_DIR, "sitemap.xml"), xml);
}

function main() {
  execFileSync(process.execPath, [path.join(HUB_DIR, "generate.js")], {
    stdio: "inherit",
  });

  const index = JSON.parse(
    fs.readFileSync(path.join(HUB_DIR, "index.json"), "utf8")
  );

  assertSafeOutputDir(OUTPUT_DIR);
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

  // Featured app: the CONTENTS of Stargate_OG/dist/ (index.html + assets/)
  // land directly in _site/Stargate_OG/, not nested under another dist/,
  // so the featured link hub/generate.js already emits
  // (../Stargate_OG/index.html, resolved from _site/hub/) hits a real file.
  // Vite is configured with base: './', so index.html's asset references
  // are relative and survive this move unchanged.
  if (!fs.existsSync(path.join(OG_DIST_DIR, "index.html"))) {
    throw new Error(
      `Missing ${path.relative(ROOT, OG_DIST_DIR)}/index.html — build the ` +
        `featured app first (cd Stargate_OG && npm ci && npm run build). ` +
        `Without it the hub's featured link would deploy broken.`
    );
  }
  copyDir(OG_DIST_DIR, path.join(OUTPUT_DIR, "Stargate_OG"));

  // The featured card's hero image (../Stargate_OG/preview.png) lives in
  // OG's source root, not in dist/ — vite has no public/ dir to sweep it
  // in — so it's copied alongside the build output.
  const ogPreview = OG_PREVIEW_CANDIDATES.find((c) =>
    fs.existsSync(path.join(OG_DIR, c))
  );
  if (ogPreview) {
    fs.copyFileSync(
      path.join(OG_DIR, ogPreview),
      path.join(OUTPUT_DIR, "Stargate_OG", ogPreview)
    );
  }

  // Pages-only root surfaces stay separate from hub/ source so the same
  // project-base-aware 404, redirect, crawler policy, and .nojekyll marker
  // are assembled consistently in local verification and CI.
  copyDir(PAGES_DIR, OUTPUT_DIR);
  writeSitemap(index);

  console.log(`\nAssembled static site at ${path.relative(ROOT, OUTPUT_DIR) || "."}`);
  console.log(`  hub/ -> hub/`);
  for (const relDir of copied) {
    console.log(`  ${relDir} -> ${relDir}/`);
  }
  console.log(`  Stargate_OG/dist/ -> Stargate_OG/ [built output]`);
  if (ogPreview) {
    console.log(`  Stargate_OG/${ogPreview} -> Stargate_OG/${ogPreview}`);
  }
  console.log(`  pages/ -> (root) [redirect, 404, robots, .nojekyll]`);
  console.log(`  (generated) -> sitemap.xml [${index.entries.length + (index.featured ? 2 : 1)} URLs]`);
}

if (require.main === module) main();

module.exports = { assertSafeOutputDir };
