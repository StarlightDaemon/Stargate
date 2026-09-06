// ============================================================
// audit-hub-security.js — fast, dependency-free security invariants for
// the gallery hub and its Pages delivery path.
//
// This deliberately separates failures from hardening warnings:
//   node scripts/audit-hub-security.js          # fail on concrete defects
//   node scripts/audit-hub-security.js --strict # fail on warnings too
//
// Registry-backed dependency advisories are intentionally separate; run
// `npm run security:deps` and `npm run security:deps:featured` for those.
// ============================================================

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const HUB_DIR = path.join(ROOT, "hub");
const CATALOG_PATH = path.join(HUB_DIR, "index.json");
const HUB_HTML_PATH = path.join(HUB_DIR, "index.html");
const WORKFLOW_PATH = path.join(ROOT, ".github", "workflows", "deploy-pages.yml");
const ASSEMBLER_PATH = path.join(ROOT, "scripts", "build-pages-site.js");
const STRICT = process.argv.includes("--strict");

const errors = [];
const warnings = [];
const passes = [];

function error(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function pass(message) {
  passes.push(message);
}

function isInsideRoot(targetPath) {
  const relative = path.relative(ROOT, targetPath);
  return relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative);
}

function checkCatalogReference(label, reference, folder, kind) {
  if (typeof reference !== "string" || reference.length === 0) {
    error(`${label} has no ${kind} path.`);
    return;
  }
  if (
    reference.includes("\\") ||
    reference.startsWith("/") ||
    reference.startsWith("//") ||
    /^[a-z][a-z0-9+.-]*:/i.test(reference)
  ) {
    error(`${label} has a non-local ${kind} path: ${reference}`);
    return;
  }

  const expectedPrefix = reference.startsWith("../_sequestered/")
    ? `../_sequestered/${folder}/`
    : `../${folder}/`;
  if (!reference.startsWith(expectedPrefix)) {
    error(`${label} ${kind} does not match its folder: ${reference}`);
  }

  const resolved = path.resolve(HUB_DIR, reference);
  if (!isInsideRoot(resolved)) {
    error(`${label} ${kind} escapes the repository root: ${reference}`);
    return;
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    error(`${label} ${kind} target is missing: ${reference}`);
    return;
  }

  const realPath = fs.realpathSync(resolved);
  if (!isInsideRoot(realPath)) {
    error(`${label} ${kind} resolves outside the repository root: ${reference}`);
  }
}

function checkCatalog() {
  let catalog;
  try {
    catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  } catch (cause) {
    error(`Unable to parse hub/index.json: ${cause.message}`);
    return;
  }

  if (!Array.isArray(catalog.entries)) {
    error("hub/index.json entries must be an array.");
    return;
  }

  const ids = new Set();
  const folders = new Set();
  const allowedStatuses = new Set(["live", "known-issue", "retired"]);

  for (const [index, entry] of catalog.entries.entries()) {
    const label = `entries[${index}] (${entry.folder || "unknown folder"})`;
    if (typeof entry.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) {
      error(`${label} has an invalid id: ${JSON.stringify(entry.id)}`);
    } else if (ids.has(entry.id)) {
      error(`${label} duplicates id ${entry.id}.`);
    }
    ids.add(entry.id);

    if (typeof entry.folder !== "string" || entry.folder.length === 0) {
      error(`${label} has an invalid folder.`);
      continue;
    }
    if (folders.has(entry.folder)) error(`${label} duplicates folder ${entry.folder}.`);
    folders.add(entry.folder);

    if (!allowedStatuses.has(entry.status)) {
      error(`${label} has unsupported status ${JSON.stringify(entry.status)}.`);
    }
    if (typeof entry.title !== "string" || typeof entry.blurb !== "string") {
      error(`${label} must have string title and blurb fields.`);
    }

    checkCatalogReference(label, entry.link, entry.folder, "link");
    if (entry.preview !== null) {
      checkCatalogReference(label, entry.preview, entry.folder, "preview");
    }
  }

  if (catalog.featured) {
    checkCatalogReference("featured", catalog.featured.link, "Stargate_OG", "link");
    if (catalog.featured.preview !== null) {
      checkCatalogReference("featured", catalog.featured.preview, "Stargate_OG", "preview");
    }
  }

  if (errors.length === 0) {
    pass(`${catalog.entries.length} catalog entries have unique identities and contained, existing targets.`);
  }
}

function walkFiles(dir, extension) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walkFiles(filePath, extension));
    else if (entry.isFile() && filePath.endsWith(extension)) found.push(filePath);
  }
  return found;
}

function checkBrowserSurface() {
  const html = fs.readFileSync(HUB_HTML_PATH, "utf8");

  if (/<script\b(?![^>]*\bsrc\s*=)[^>]*>/i.test(html)) {
    error("hub/index.html contains an inline script.");
  }
  if (/\son[a-z]+\s*=/i.test(html)) {
    error("hub/index.html contains an inline event handler.");
  }

  const resourcePattern = /<(?:script|link|img)\b[^>]*?\b(?:src|href)\s*=\s*"([^"]+)"/gi;
  for (const match of html.matchAll(resourcePattern)) {
    const reference = match[1];
    if (reference.startsWith("data:image/svg+xml,")) continue;
    if (reference.startsWith("/") || reference.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(reference)) {
      error(`hub/index.html loads a non-local browser resource: ${reference}`);
      continue;
    }
    const resolved = path.resolve(HUB_DIR, reference);
    if (!isInsideRoot(resolved) || !fs.existsSync(resolved)) {
      error(`hub/index.html resource is missing or outside the repository: ${reference}`);
    }
  }

  const dangerousPatterns = [
    ["eval", /\beval\s*\(/],
    ["Function constructor", /\bnew\s+Function\b/],
    ["document.write", /\bdocument\.write\s*\(/],
    ["insertAdjacentHTML", /\.insertAdjacentHTML\s*\(/],
    ["outerHTML assignment", /\.outerHTML\s*=/],
  ];

  for (const filePath of walkFiles(path.join(HUB_DIR, "js"), ".js")) {
    const source = fs.readFileSync(filePath, "utf8");
    const relative = path.relative(ROOT, filePath);
    for (const [name, pattern] of dangerousPatterns) {
      if (pattern.test(source)) error(`${relative} uses ${name}.`);
    }
    for (const match of source.matchAll(/\.innerHTML\s*=\s*([^;]+);/g)) {
      if (!/^(?:""|'')$/.test(match[1].trim())) {
        error(`${relative} assigns non-empty content through innerHTML.`);
      }
    }
  }

  const csp = html.match(
    /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i
  );
  if (!csp) {
    warn("hub/index.html has no enforcing Content-Security-Policy meta tag.");
  } else {
    const requiredDirectives = [
      "default-src 'none'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "base-uri 'none'",
      "form-action 'none'",
      "object-src 'none'",
    ];
    for (const directive of requiredDirectives) {
      if (!csp[1].includes(directive)) warn(`Hub CSP is missing: ${directive}.`);
    }
    if (/['"]unsafe-(?:inline|eval)['"]/i.test(csp[1])) {
      error("Hub CSP permits unsafe-inline or unsafe-eval.");
    }
  }
  const referrer = html.match(/<meta\s+name="referrer"\s+content="([^"]+)"/i);
  if (!referrer) {
    warn("hub/index.html has no explicit referrer policy.");
  } else if (!/^(?:no-referrer|strict-origin|strict-origin-when-cross-origin)$/.test(referrer[1])) {
    warn(`Hub referrer policy is weaker than expected: ${referrer[1]}.`);
  }

  if (errors.length === 0) {
    pass("Hub scripts have no executable HTML sinks, dynamic code evaluation, or remote browser resources.");
  }
}

function checkDeliveryPath() {
  const workflow = fs.readFileSync(WORKFLOW_PATH, "utf8");
  const unpinnedActions = [];
  for (const match of workflow.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)/gm)) {
    const action = match[1];
    if (!action.startsWith("./") && !/@[a-f0-9]{40}$/i.test(action)) unpinnedActions.push(action);
  }
  if (unpinnedActions.length) {
    error(`GitHub Actions are not pinned to full commits: ${unpinnedActions.join(", ")}`);
  } else {
    pass("Every third-party GitHub Action is pinned to a full commit SHA.");
  }

  const buildStart = workflow.indexOf("\n  build:");
  const deployStart = workflow.indexOf("\n  deploy:");
  const buildBlock = buildStart >= 0
    ? workflow.slice(buildStart, deployStart > buildStart ? deployStart : workflow.length)
    : "";
  const workflowGrantsDeploy = /^permissions:\s*[\s\S]*?^\s{2}(?:pages:\s*write|id-token:\s*write)/m.test(workflow);
  const buildNarrowsPermissions = /^\s{4}permissions:/m.test(buildBlock);
  if (workflowGrantsDeploy && !buildNarrowsPermissions) {
    warn("The build job inherits Pages write and OIDC token permissions instead of declaring a narrower job policy.");
  }

  const assembler = fs.readFileSync(ASSEMBLER_PATH, "utf8");
  if (/fs\.rmSync\(OUTPUT_DIR,\s*\{\s*recursive:\s*true/.test(assembler) &&
      !/assertSafeOutputDir\(OUTPUT_DIR\)/.test(assembler)) {
    warn("The Pages assembler recursively deletes its caller-supplied output path without an explicit safety guard.");
  }
}

function checkForCommittedSecrets() {
  const textExtensions = [".html", ".js", ".css", ".svg", ".json"];
  const files = [WORKFLOW_PATH, ASSEMBLER_PATH];
  for (const extension of textExtensions) files.push(...walkFiles(HUB_DIR, extension));

  const secretPatterns = [
    ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
    ["GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{50,255})\b/],
    ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ];

  let hits = 0;
  for (const filePath of files) {
    const source = fs.readFileSync(filePath, "utf8");
    for (const [name, pattern] of secretPatterns) {
      if (!pattern.test(source)) continue;
      hits += 1;
      error(`${path.relative(ROOT, filePath)} contains a value shaped like a ${name}.`);
    }
  }
  if (hits === 0) pass("No high-confidence secret patterns were found in the hub or delivery scripts.");
}

function printResults() {
  console.log("Hub security audit");
  for (const message of passes) console.log(`  PASS  ${message}`);
  for (const message of warnings) console.log(`  WARN  ${message}`);
  for (const message of errors) console.log(`  FAIL  ${message}`);
  console.log(`Summary: ${errors.length} failure(s), ${warnings.length} warning(s), ${passes.length} passed control(s).`);

  if (errors.length || (STRICT && warnings.length)) process.exitCode = 1;
}

checkCatalog();
checkBrowserSurface();
checkDeliveryPath();
checkForCommittedSecrets();
printResults();
