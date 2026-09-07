"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.resolve(process.argv[2] || path.join(ROOT, "_site"));
const PROJECT_PREFIX = "/Stargate/";
const errors = [];
const passes = [];

function fail(message) {
  errors.push(message);
}

function pass(message) {
  passes.push(message);
}

function relativeOutput(filePath) {
  return path.relative(OUTPUT_DIR, filePath).split(path.sep).join("/");
}

function assertFile(relativePath) {
  const filePath = path.join(OUTPUT_DIR, relativePath);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    fail(`Missing output file: ${relativePath}`);
    return null;
  }
  return filePath;
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(filePath));
    else if (entry.isFile()) files.push(filePath);
  }
  return files;
}

function exactCaseExists(filePath) {
  const relative = path.relative(OUTPUT_DIR, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return false;
  let current = OUTPUT_DIR;
  for (const segment of relative.split(path.sep)) {
    const match = fs.readdirSync(current).find((name) => name === segment);
    if (!match) return false;
    current = path.join(current, match);
  }
  return fs.existsSync(current);
}

function checkReleaseShell() {
  const required = [
    "index.html",
    "404.html",
    "robots.txt",
    "sitemap.xml",
    ".nojekyll",
    "hub/index.html",
    "hub/index.json",
    "hub/assets/favicon.svg",
    "Stargate_OG/index.html",
    "Stargate_OG/preview.png",
  ];
  for (const file of required) assertFile(file);
  if (!errors.length) pass("Root, recovery, crawler, favicon, hub, and featured-app artifacts exist.");

  const hubPath = assertFile("hub/index.html");
  if (!hubPath) return;
  const html = fs.readFileSync(hubPath, "utf8");
  const invariants = [
    ["canonical URL", /<link rel="canonical" href="https:\/\/starlightdaemon\.github\.io\/Stargate\/hub\/">/],
    ["description", /<meta name="description" content="[^"]+">/],
    ["Open Graph image", /<meta property="og:image" content="https:\/\/starlightdaemon\.github\.io\/Stargate\/[^"]+">/],
    ["Twitter card", /<meta name="twitter:card" content="summary_large_image">/],
    ["skip link", /<a class="skip-link" href="#main-content">/],
  ];
  for (const [label, pattern] of invariants) {
    if (!pattern.test(html)) fail(`Hub HTML is missing its ${label}.`);
  }
  if (invariants.every(([, pattern]) => pattern.test(html))) {
    pass("Hub canonical, search/social metadata, and keyboard bypass link are present.");
  }
}

function resolveOutputReference(sourceFile, reference) {
  const withoutQuery = reference.split(/[?#]/, 1)[0];
  if (!withoutQuery || reference.startsWith("#") || /^%23/i.test(reference) || reference.startsWith("data:")) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(reference) || reference.startsWith("//")) return null;
  if (withoutQuery.startsWith(PROJECT_PREFIX)) {
    return path.join(OUTPUT_DIR, withoutQuery.slice(PROJECT_PREFIX.length));
  }
  if (withoutQuery.startsWith("/")) {
    fail(`${relativeOutput(sourceFile)} uses a site-root path outside ${PROJECT_PREFIX}: ${reference}`);
    return null;
  }
  return path.resolve(path.dirname(sourceFile), withoutQuery);
}

function checkShellReferences() {
  const htmlFiles = ["index.html", "404.html", "hub/index.html"]
    .map(assertFile)
    .filter(Boolean);
  let checked = 0;
  for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(htmlFile, "utf8");
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const target = resolveOutputReference(htmlFile, match[1]);
      if (!target) continue;
      checked += 1;
      if (!fs.existsSync(target)) fail(`${relativeOutput(htmlFile)} has a missing reference: ${match[1]}`);
      else if (!exactCaseExists(target)) fail(`${relativeOutput(htmlFile)} has a case-mismatched reference: ${match[1]}`);
    }
  }
  if (checked && !errors.length) pass(`${checked} local release-shell references resolve with exact casing.`);
}

function checkAllStaticReferences() {
  const files = walk(OUTPUT_DIR);
  const candidates = files.filter((file) => [".html", ".css", ".js", ".mjs"].includes(path.extname(file).toLowerCase()));
  const checked = new Set();
  const patterns = {
    ".html": /\b(?:href|src|poster)\s*=\s*["']([^"']+)["']/gi,
    ".css": /url\(\s*["']?([^"')]+)["']?\s*\)/gi,
    ".js": /(?:\bfrom\s*|\bimport\s*)["'](\.{1,2}\/[^"']+)["']/g,
    ".mjs": /(?:\bfrom\s*|\bimport\s*)["'](\.{1,2}\/[^"']+)["']/g,
  };
  for (const sourceFile of candidates) {
    const extension = path.extname(sourceFile).toLowerCase();
    const source = fs.readFileSync(sourceFile, "utf8");
    for (const match of source.matchAll(patterns[extension])) {
      let target = resolveOutputReference(sourceFile, match[1]);
      if (!target) continue;
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
      const key = `${relativeOutput(sourceFile)} -> ${match[1]}`;
      if (checked.has(key)) continue;
      checked.add(key);
      if (!fs.existsSync(target)) fail(`${relativeOutput(sourceFile)} has a missing local reference: ${match[1]}`);
      else if (!exactCaseExists(target)) fail(`${relativeOutput(sourceFile)} has a case-mismatched local reference: ${match[1]}`);
    }
  }
  if (checked.size && !errors.length) pass(`${checked.size} local HTML, CSS, and module references resolve with exact casing.`);
}

function checkCatalog() {
  const catalogPath = assertFile("hub/index.json");
  if (!catalogPath) return;
  let catalog;
  try {
    catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  } catch (error) {
    fail(`Unable to parse hub/index.json: ${error.message}`);
    return;
  }
  const records = [catalog.featured, ...catalog.entries].filter(Boolean);
  let checked = 0;
  for (const record of records) {
    for (const field of ["link", "preview"]) {
      if (!record[field]) continue;
      checked += 1;
      const target = path.resolve(path.dirname(catalogPath), record[field]);
      if (!fs.existsSync(target)) fail(`${record.title || record.folder} has a missing ${field}: ${record[field]}`);
      else if (!exactCaseExists(target)) fail(`${record.title || record.folder} has a case-mismatched ${field}: ${record[field]}`);
    }
  }
  if (checked && !errors.length) pass(`${checked} catalog destinations and previews resolve with exact casing.`);

  const sitemapPath = assertFile("sitemap.xml");
  if (!sitemapPath) return;
  const locations = [...fs.readFileSync(sitemapPath, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1]);
  const expectedCount = records.length + 1;
  if (locations.length !== expectedCount || new Set(locations).size !== expectedCount) {
    fail(`Sitemap has ${locations.length} URL(s); expected ${expectedCount} unique URL(s).`);
  } else if (locations.some((url) => !url.startsWith("https://starlightdaemon.github.io/Stargate/"))) {
    fail("Sitemap contains a URL outside the canonical project-site base path.");
  } else {
    pass(`Sitemap contains ${expectedCount} unique canonical project-site URLs.`);
  }
}

function checkSecurityAndSize() {
  const files = walk(OUTPUT_DIR);
  const developmentFiles = files.filter((file) => {
    const name = path.basename(file);
    const parent = path.dirname(relativeOutput(file));
    const isBuildRoot = !parent.includes("/") || parent.startsWith("_sequestered/") && parent.split("/").length === 2;
    return ["README.md", "CHANGELOG.md", "package.json", "package-lock.json", "npm-shrinkwrap.json"].includes(name) ||
      isBuildRoot && /^(?:(?:test|verify|diag|audit)(?:[_-].*)?|.*[_-](?:test|spec)|run[_-]?tests?(?:[_-].*)?|server)\.(?:[cm]?js|ts|html)$/i.test(name);
  });
  if (developmentFiles.length) {
    fail(`Development-only files shipped: ${developmentFiles.map(relativeOutput).join(", ")}`);
  } else {
    pass("No package manifests, project notes, or root-level test/diagnostic harnesses are shipped.");
  }

  const totalBytes = files.reduce((total, file) => total + fs.statSync(file).size, 0);
  const maximumBytes = 1024 ** 3;
  if (totalBytes >= maximumBytes) fail(`Published output is ${(totalBytes / 1024 ** 2).toFixed(1)} MiB (limit: 1 GiB).`);
  else pass(`Published output is ${(totalBytes / 1024 ** 2).toFixed(1)} MiB, below the 1 GiB Pages limit.`);

  const textExtensions = new Set([".html", ".js", ".css", ".json", ".svg", ".xml", ".txt"]);
  const secretPatterns = [
    ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
    ["GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{50,255})\b/],
    ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ];
  let hits = 0;
  for (const file of files) {
    if (!textExtensions.has(path.extname(file).toLowerCase())) continue;
    const source = fs.readFileSync(file, "utf8");
    for (const [label, pattern] of secretPatterns) {
      if (!pattern.test(source)) continue;
      hits += 1;
      fail(`${relativeOutput(file)} contains a value shaped like a ${label}.`);
    }
  }
  if (!hits) pass("No high-confidence secret patterns were found in browser-delivered text assets.");
}

function checkThirdPartyRuntimeResources() {
  const offenders = [];
  for (const file of walk(OUTPUT_DIR)) {
    const extension = path.extname(file).toLowerCase();
    if (![".html", ".css"].includes(extension)) continue;
    const source = fs.readFileSync(file, "utf8");
    const isRuntimeReference = extension === ".html"
      ? [...source.matchAll(/<(script|img|iframe|link)\b[^>]*>/gi)].some((match) => {
          const tag = match[0];
          const hasExternalUrl = /\b(?:src|href)\s*=\s*["']https?:\/\//i.test(tag);
          if (!hasExternalUrl) return false;
          if (match[1].toLowerCase() !== "link") return true;
          return /\brel\s*=\s*["'][^"']*\b(?:stylesheet|preconnect|modulepreload|prefetch)\b/i.test(tag);
        })
      : /(?:@import\s+(?:url\()?|url\()\s*["']?https?:\/\//i.test(source);
    if (isRuntimeReference) offenders.push(relativeOutput(file));
  }
  if (offenders.length) {
    fail(`Third-party runtime resources are shipped: ${offenders.join(", ")}`);
  } else {
    pass("No third-party fonts, scripts, stylesheets, images, or frames are loaded by the Pages artifact.");
  }
}

function report() {
  console.log("Pages release artifact audit");
  for (const message of passes) console.log(`  PASS  ${message}`);
  for (const message of errors) console.log(`  FAIL  ${message}`);
  console.log(`Summary: ${errors.length} failure(s), ${passes.length} passed control(s).`);
  if (errors.length) process.exitCode = 1;
}

if (!fs.existsSync(OUTPUT_DIR) || !fs.statSync(OUTPUT_DIR).isDirectory()) {
  console.error(`Pages output directory does not exist: ${OUTPUT_DIR}`);
  process.exit(1);
}

checkReleaseShell();
checkShellReferences();
checkAllStaticReferences();
checkCatalog();
checkSecurityAndSize();
checkThirdPartyRuntimeResources();
report();
