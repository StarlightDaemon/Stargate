#!/usr/bin/env node
"use strict";
// A reporting front door, not a claim of operator qualification or identical exhibit tests.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const crypto = require("node:crypto");
const { execFileSync, spawnSync } = require("node:child_process");
const { selectExhibit, startPreview } = require("./preview.js");
const ROOT = path.resolve(__dirname, "..");

function metadata(root, tracked) {
  const errors = [];
  for (const file of ["README.md", "CHANGELOG.md", "version.json", ".gitignore"]) {
    if (!tracked.includes(file) || !fs.existsSync(path.join(root, file))) errors.push(`Missing tracked ${file}`);
  }
  if (fs.existsSync(path.join(root, "version.json"))) {
    try {
      const value = JSON.parse(fs.readFileSync(path.join(root, "version.json"), "utf8"));
      for (const key of ["version", "model"]) if (typeof value[key] !== "string" || !value[key].trim()) errors.push(`version.json needs a nonempty ${key}`);
    } catch { errors.push("Invalid version.json"); }
  }
  if (fs.existsSync(path.join(root, "README.md"))) {
    const text = fs.readFileSync(path.join(root, "README.md"), "utf8");
    if (!/^#\s+\S.+\r?\n[\s\S]*\S/m.test(text)) errors.push("README needs an H1 and body");
  }
  if (fs.existsSync(path.join(root, "CHANGELOG.md")) && !fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8").includes("**Built by:**")) errors.push("CHANGELOG lacks original builder attribution");
  return errors;
}
function staticReferences(root, files) {
  const errors = [], external = new Set(); let count = 0;
  const available = new Set(files);
  const patterns = {
    ".html": /\b(?:href|src|poster)\s*=\s*["']([^"']+)["']/gi,
    ".css": /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi,
    ".js": /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["'](\.{1,2}\/[^"']+)["']/g,
    ".mjs": /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["'](\.{1,2}\/[^"']+)["']/g,
  };
  for (const file of files) {
    const pattern = patterns[path.extname(file).toLowerCase()]; if (!pattern) continue;
    const source = fs.readFileSync(path.join(root, file), "utf8");
    for (const match of source.matchAll(pattern)) {
      const ref = (match[1] ?? match[2] ?? match[3]).trim();
      if (/^(?:https?:)?\/\//i.test(ref)) { external.add(ref); continue; }
      if (/^[a-z][a-z0-9+.-]*:/i.test(ref) || ref.startsWith("#")) continue;
      const plain = ref.split(/[?#]/, 1)[0]; if (!plain) continue;
      count++;
      let decoded;
      try { decoded = decodeURIComponent(plain); } catch { errors.push(`${file}: malformed reference ${ref}`); continue; }
      if (decoded.includes("\\") || decoded.includes("\0")) { errors.push(`${file}: invalid reference ${ref}`); continue; }
      let relative = path.posix.normalize(decoded.startsWith("/") ? decoded.slice(1) : path.posix.join(path.posix.dirname(file), decoded));
      if (relative.endsWith("/")) relative += "index.html";
      if (!available.has(relative) && available.has(relative + "/index.html")) relative += "/index.html";
      if (!available.has(relative) || !fs.existsSync(path.join(root, relative))) errors.push(`${file}: missing, non-public, or case-mismatched resource ${ref}`);
    }
  }
  return { errors, count, external: [...external] };
}
function get(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, res => { let bytes = 0; res.on("data", c => bytes += c.length); res.on("end", () => resolve({ status: res.statusCode, bytes })); });
    req.setTimeout(5000, () => req.destroy(Object.assign(new Error("HTTP timeout"), { code: "ETIMEDOUT" })));
    req.on("error", reject);
  });
}
function parseArgs(args) {
  const options = { exhibits: [], http: false, browser: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--http") options.http = true;
    else if (args[i] === "--browser") options.browser = true;
    else if (args[i] === "--exhibit" && args[i+1]) options.exhibits.push(args[++i]);
    else if (args[i] === "--changed" && args[i+1] && !options.changed) options.changed = args[++i];
    else throw new Error("Usage: node scripts/verify.js [--exhibit EXACT_DIRECTORY ... | --changed REF] [--http] [--browser]");
  }
  if (options.changed && options.exhibits.length) throw new Error("Choose --changed or --exhibit, not both.");
  return options;
}
async function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "hub/index.json"), "utf8"));
  const records = catalog.entries.filter(e => e.status !== "retired" && e.link === `../${e.folder}/index.html`);
  let selected = records;
  if (options.exhibits.length) {
    for (const name of options.exhibits) if (!records.some(e => e.folder === name)) throw new Error(`Not an eligible static exhibit: ${name}`);
    selected = records.filter(e => options.exhibits.includes(e.folder));
  }
  if (options.changed) {
    const ref = execFileSync("git", ["rev-parse", "--verify", "--end-of-options", `${options.changed}^{commit}`], { cwd: ROOT, encoding: "utf8" }).trim();
    const changed = execFileSync("git", ["diff", "--name-only", "-z", ref, "--"], { cwd: ROOT, encoding: "utf8" }).split("\0").filter(Boolean);
    const shared = changed.some(p => /^(?:scripts\/|hub\/|pages\/|\.github\/|package(?:-lock)?\.json$|STARGATE_BUILD_STANDARDS\.md$)/.test(p));
    selected = shared ? records : records.filter(e => changed.some(p => p.startsWith(e.folder + "/")));
  }
  const report = { schemaVersion: 1, startedAt: new Date().toISOString(), commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(),
    scope: "Source metadata, literal references and optionally HTTP/browser loading. No interaction or operator acceptance is inferred.", options, checks: [], exhibits: [] };
  const record = (list, check, status, details) => list.push({ check, status, details });
  for (const [name, command] of [["gallery", ["hub/generate.js", "--check"]], ["output-guard", ["scripts/test-build-pages-output-guard.js"]], ["hub-security", ["scripts/audit-hub-security.js", "--strict"]]]) {
    const r = spawnSync(process.execPath, command, { cwd: ROOT, encoding: "utf8", timeout: 15000, windowsHide: true });
    record(report.checks, name, r.error ? "ENVIRONMENT-BLOCKED" : r.status === 0 ? "PASS" : "FAIL", (r.stdout || "") + (r.stderr || "") + (r.error?.message || ""));
  }
  record(report.checks, "retired", "SKIP", `${catalog.entries.filter(e => e.status === "retired").length} retired entries retain their historical disposition.`);
  record(report.checks, "featured", "UNVERIFIED", "Stargate_OG retains its npm ci, npm test, npm run build workflow; this command does not replace it.");
  record(report.checks, "pages-release", "UNVERIFIED", "Build Stargate_OG and run the existing Pages assembler and release audit separately.");
  let browser, browserBlock;
  if (options.browser) {
    try {
      const puppeteer = require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer");
      browser = await puppeteer.launch({ headless: true, ...(process.env.PUPPETEER_EXECUTABLE_PATH ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH } : {}), timeout: 15000 });
    } catch (error) { browserBlock = error.message; }
  }
  try {
    for (const entry of selected) {
      const item = { exhibit: entry.folder, catalogStatus: entry.status, checks: [] }; report.exhibits.push(item);
      let selection;
      try { selection = selectExhibit(entry.folder); } catch (error) { record(item.checks, "selection", "FAIL", error.message); continue; }
      const tracked = execFileSync("git", ["ls-files", "-z", "--", entry.folder], { cwd: ROOT, encoding: "utf8" }).split("\0").filter(p => p.startsWith(entry.folder + "/")).map(p => p.slice(entry.folder.length + 1));
      const issues = metadata(selection.root, tracked);
      record(item.checks, "metadata", issues.length ? "FAIL" : "PASS", issues);
      const refs = staticReferences(selection.root, selection.files);
      record(item.checks, "static-references", refs.errors.length ? "FAIL" : "PASS", refs);
      let preview;
      if (options.http || browser) {
        try {
          preview = await startPreview({ ...selection, port: 0 });
          if (options.http) {
            let checked = 0; const errors = [];
            for (const file of selection.files) {
              const r = await get(preview.url + "/" + file.split("/").map(encodeURIComponent).join("/")); checked++;
              if (r.status !== 200) errors.push(`${file}: HTTP ${r.status}`);
            }
            record(item.checks, "http-resources", errors.length ? "FAIL" : "PASS", { checked, errors });
          }
          if (browser) {
            const page = await browser.newPage();
            try {
              const errors = [];
              page.on("pageerror", e => errors.push(e.message));
              page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
              page.on("requestfailed", r => errors.push(`${r.url()}: ${r.failure()?.errorText}`));
              page.on("response", r => { if (r.status() >= 400) errors.push(`${r.url()}: HTTP ${r.status()}`); });
              await page.setViewport({ width: 1920, height: 1080 });
              const response = await page.goto(preview.url, { waitUntil: "networkidle0", timeout: 15000 });
              record(item.checks, "browser-load", errors.length || response.status() !== 200 ? "FAIL" : "PASS", { errors, status: response.status(), viewport: "1920x1080", qualification: "initial loading only" });
            } finally { await page.close(); }
          }
        } catch (error) {
          record(item.checks, "runtime-check", ["EACCES", "EPERM", "EADDRINUSE", "ENOTFOUND"].includes(error.code) ? "ENVIRONMENT-BLOCKED" : "FAIL", error.message);
        } finally { if (preview) await preview.close(); }
      }
      if (!options.http) record(item.checks, "http-resources", "UNVERIFIED", "Not requested; use --http.");
      if (!options.browser || browserBlock) record(item.checks, "browser-load", browserBlock ? "ENVIRONMENT-BLOCKED" : "UNVERIFIED", browserBlock || "Not requested; use --browser with an installed Puppeteer and browser.");
      let pkg = {}; try { pkg = JSON.parse(fs.readFileSync(path.join(selection.root, "package.json"), "utf8")); } catch {}
      record(item.checks, "existing-tests", "UNVERIFIED", { scripts: pkg.scripts || {}, reason: "Harness adapters require verified pilot migration; no existing assertions have been removed or executed here." });
      record(item.checks, "interaction-and-operator", "UNVERIFIED", "Dialing, activation, cancellation, sound, keyboard, reduced motion and hands-on acceptance are separate gates.");
    }
  } finally { if (browser) await browser.close(); }
  const checks = [...report.checks, ...report.exhibits.flatMap(e => e.checks)];
  report.summary = Object.fromEntries(["PASS", "FAIL", "SKIP", "UNVERIFIED", "ENVIRONMENT-BLOCKED"].map(s => [s, checks.filter(c => c.status === s).length]));
  report.exitCode = report.summary.FAIL ? 1 : report.summary.UNVERIFIED || report.summary["ENVIRONMENT-BLOCKED"] ? 2 : 0;
  const directory = path.join(ROOT, "test", "verification"); fs.mkdirSync(directory, { recursive: true });
  const filename = path.join(directory, `${Date.now()}-${crypto.randomUUID()}.json`);
  fs.writeFileSync(filename, JSON.stringify(report, null, 2) + "\n");
  for (const c of report.checks) console.log(`${c.status.padEnd(19)} repository: ${c.check}`);
  for (const e of report.exhibits) for (const c of e.checks) console.log(`${c.status.padEnd(19)} ${e.exhibit}: ${c.check}${c.status === "FAIL" ? " " + JSON.stringify(c.details) : ""}`);
  console.log(JSON.stringify(report.summary)); console.log(`Report: ${path.relative(ROOT, filename)}`);
  process.exitCode = report.exitCode;
  return report;
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { metadata, staticReferences, parseArgs, main };
