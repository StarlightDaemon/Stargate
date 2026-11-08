"use strict";
// Collect evidence without installing packages, repairing locks or executing package scripts.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync, execFileSync } = require("node:child_process");
const ROOT = path.resolve(__dirname, "..");
const QUALIFIED = new Map([
  ["Stargate_OG", "The separate release workflow runs fresh npm ci/audit/tests/build; this collector does not replace it."],
  ["stargate_blueprint_alpha", "The separate Blueprint job runs fresh npm ci/full-tree audit and browser qualification; this collector does not replace it."],
]);
const STATUS = ["PASS", "FAIL", "SKIP", "UNVERIFIED", "ENVIRONMENT-BLOCKED"];
const digest = file => fs.existsSync(file) ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") : null;

function parseArgs(args) {
  const options = { exhibits: [], audit: true, strict: false, includeQualified: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--no-audit") options.audit = false;
    else if (args[i] === "--strict") options.strict = true;
    else if (args[i] === "--include-qualified") options.includeQualified = true;
    else if (args[i] === "--exhibit" && args[i + 1]) options.exhibits.push(args[++i]);
    else throw new Error("Usage: node scripts/check-dependency-baseline.js [--exhibit DIRECTORY|root ...] [--no-audit] [--include-qualified] [--strict]");
  }
  return options;
}

function npmCommand() {
  if (process.platform !== "win32") return { command: "npm", prefix: [] };
  const candidates = [process.env.npm_execpath, path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js")];
  const cli = candidates.find(file => file && fs.existsSync(file));
  if (!cli) throw new Error("No npm CLI JavaScript entry point is available; run this tool through npm or hosted Linux CI.");
  return { command: process.execPath, prefix: [cli] };
}

function classifyAudit(result, audit) {
  const code = result.error?.code || audit?.error?.code;
  if (code === "ENOLOCK" || code === "EUSAGE" && /lockfile|lock file/i.test(audit?.error?.summary || "")) {
    return { status: "UNVERIFIED", reason: "npm could not audit a qualified lockfile.", code };
  }
  if (result.error || /^(?:ENOTFOUND|EAI_AGAIN|EACCES|EPERM|ETIMEDOUT|ECONN\w*|EHOST\w*|ENET\w*|E401|E403|E429|E5\d\d)$/.test(code || "")) {
    return { status: "ENVIRONMENT-BLOCKED", reason: "The audit command or registry was unavailable.", code: code || "COMMAND_ERROR" };
  }
  const counts = audit?.metadata?.vulnerabilities;
  if (audit?.error || !counts || !Number.isInteger(counts.total) || counts.total < 0) {
    return { status: "FAIL", reason: "npm did not produce a valid vulnerability report.", code: code || "INVALID_AUDIT_REPORT" };
  }
  if (counts.total === 0 && result.status !== 0) {
    return { status: "FAIL", reason: "npm exited unsuccessfully despite reporting zero vulnerabilities.", counts };
  }
  if (![0, 1].includes(result.status)) return { status: "FAIL", reason: "Unexpected npm audit exit status.", counts };
  return { status: counts.total ? "FAIL" : "PASS", reason: counts.total ? "Fresh registry audit reports vulnerable packages." : "Fresh registry audit reports zero vulnerabilities.", counts };
}

function inspectManifest(folder, tracked) {
  const prefix = folder === "root" ? "" : folder + "/";
  const manifest = prefix + "package.json";
  if (!tracked.has(manifest)) return null;
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, manifest), "utf8"));
  const lock = [prefix + "npm-shrinkwrap.json", prefix + "package-lock.json"].find(file => tracked.has(file)) || null;
  const dependencies = Object.fromEntries(["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"].map(key => [key, pkg[key] || {}]));
  const entryPoints = Object.entries(pkg.scripts || {}).filter(([name, value]) => /^(?:start|dev|serve|preview)(?::|$)/.test(name) || /(?:^|\s)(?:vite|http-server|serve)(?:\s|$)|python(?:3)?\s+-m\s+http\.server/.test(value))
    .map(([name, command]) => ({ name, command, kind: /\bvite\b/.test(command) ? "vite" : /\bhttp-server\b/.test(command) ? "http-server" : /python(?:3)?\s+-m\s+http\.server/.test(command) ? "python-http-server" : /(?:^|\s)serve(?:\s|$)/.test(command) ? "serve-cli" : "project-command" }));
  return { folder, manifest, lock, dependencies, entryPoints, scripts: pkg.scripts || {},
    hasDeclaredDependencies: Object.values(dependencies).some(group => Object.keys(group).length > 0),
    before: Object.fromEntries([manifest, prefix + "package-lock.json", prefix + "npm-shrinkwrap.json"].map(file => [file, digest(path.join(ROOT, file))])) };
}

function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "hub/index.json"), "utf8"));
  // Existing gallery membership supplies scope; do not regenerate a repository inventory.
  const allowed = ["root", "Stargate_OG", ...catalog.entries.filter(e => e.status !== "retired").map(e => e.folder)];
  for (const name of options.exhibits) if (!allowed.includes(name)) throw new Error("Not an active package scope: " + name);
  const selected = options.exhibits.length ? [...new Set(options.exhibits)] : allowed;
  const tracked = new Set(execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8" }).split("\0"));
  const relativeOutput = "test/dependency-campaign/" + new Date().toISOString().replace(/[:.]/g, "-") + "-" + crypto.randomUUID();
  const output = path.join(ROOT, relativeOutput); fs.mkdirSync(output, { recursive: true });
  let npm, npmError;
  try { npm = npmCommand(); } catch (error) { npmError = error.message; }
  const npmVersion = npm ? spawnSync(npm.command, [...npm.prefix, "--version"], { encoding: "utf8", windowsHide: true, timeout: 10000 }) : null;
  const report = { schemaVersion: 1, startedAt: new Date().toISOString(),
    commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(),
    scope: "Active catalog package manifests and root tooling only. Read-only lock audits; no installed-tree or runtime exploitability claim.",
    options, node: process.version, npm: npmVersion?.status === 0 ? npmVersion.stdout.trim() : null,
    output: relativeOutput, packages: [], noManifest: [], retired: "SKIP: retired entries excluded; no files inspected or changed." };
  for (const folder of selected) {
    let row;
    try { row = inspectManifest(folder, tracked); } catch (error) {
      row = { folder, status: "FAIL", reason: "Could not parse scoped package metadata.", error: error.message };
    }
    if (!row) { report.noManifest.push(folder); continue; }
    report.packages.push(row);
    if (!row.status) {
      if (!row.hasDeclaredDependencies && !row.lock) Object.assign(row, { status: "SKIP", reason: "No dependencies declared and no tracked lock graph; no registry audit requested." });
      else if (QUALIFIED.has(folder) && !options.includeQualified) Object.assign(row, { status: "SKIP", reason: QUALIFIED.get(folder) });
      else if (!row.lock) Object.assign(row, { status: "UNVERIFIED", reason: "No tracked package-lock.json or npm-shrinkwrap.json; no lock generated and no audit attempted." });
      else if (!options.audit) Object.assign(row, { status: "UNVERIFIED", reason: "Read-only manifest/entry-point classification only; registry audit not requested." });
      else if (!npm) Object.assign(row, { status: "ENVIRONMENT-BLOCKED", reason: npmError });
      else {
        const directory = path.join(output, folder); fs.mkdirSync(directory, { recursive: true });
        row.command = ["npm", "audit", "--package-lock-only", "--json", "--include=dev", "--include=optional", "--include=peer", "--ignore-scripts", "--fetch-retries=0", "--fetch-timeout=20000"];
        const result = spawnSync(npm.command, [...npm.prefix, ...row.command.slice(1)], {
          cwd: folder === "root" ? ROOT : path.join(ROOT, folder), encoding: "utf8", timeout: 45000, maxBuffer: 12 * 1024 * 1024,
          windowsHide: true, env: { ...process.env, npm_config_cache: path.join(directory, "npm-cache"), npm_config_update_notifier: "false", NO_COLOR: "1" },
        });
        fs.writeFileSync(path.join(directory, "audit.stdout.json"), result.stdout || "");
        fs.writeFileSync(path.join(directory, "audit.stderr.log"), (result.stderr || "") + (result.error ? "\n" + result.error.message : ""));
        let audit; try { audit = JSON.parse(result.stdout); } catch {}
        Object.assign(row, classifyAudit(result, audit), { commandExitCode: result.status, signal: result.signal,
          evidence: relativeOutput + "/" + folder + "/audit.stdout.json" });
        if (audit?.vulnerabilities) row.vulnerabilities = Object.values(audit.vulnerabilities).map(v => ({ name: v.name, severity: v.severity, isDirect: v.isDirect, range: v.range, via: v.via, effects: v.effects, nodes: v.nodes, fixAvailable: v.fixAvailable }));
      }
      row.after = Object.fromEntries(Object.keys(row.before).map(file => [file, digest(path.join(ROOT, file))]));
      row.metadataUnchanged = JSON.stringify(row.before) === JSON.stringify(row.after);
      if (!row.metadataUnchanged) Object.assign(row, { status: "FAIL", reason: "Scoped manifest or lock changed during collection; investigate concurrent edits or unexpected mutation." });
    }
    console.log("DEPENDENCY_BASELINE_ITEM " + JSON.stringify({ folder, status: row.status, reason: row.reason, counts: row.counts, metadataUnchanged: row.metadataUnchanged, entryPoints: row.entryPoints }));
    if (row.vulnerabilities?.length) console.log("DEPENDENCY_BASELINE_FINDINGS " + JSON.stringify({ folder, vulnerabilities: row.vulnerabilities }));
  }
  report.summary = Object.fromEntries(STATUS.map(status => [status, report.packages.filter(row => row.status === status).length]));
  report.status = report.summary.FAIL ? "FAIL" : report.summary["ENVIRONMENT-BLOCKED"] ? "ENVIRONMENT-BLOCKED" : report.summary.UNVERIFIED ? "UNVERIFIED" : "PASS";
  report.finishedAt = new Date().toISOString();
  // A successful collection is not a clean security gate. --strict turns findings and gaps into a blocking exit.
  report.exitCode = options.strict ? report.summary.FAIL ? 1 : report.summary.UNVERIFIED || report.summary["ENVIRONMENT-BLOCKED"] ? 2 : 0 : 0;
  fs.writeFileSync(path.join(output, "report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log("DEPENDENCY_BASELINE_SUMMARY " + JSON.stringify({ status: report.status, summary: report.summary, report: relativeOutput + "/report.json", exitCode: report.exitCode, qualification: "Collection success is not a clean dependency or release acceptance result." }));
  process.exitCode = report.exitCode;
  return report;
}

if (require.main === module) { try { main(); } catch (error) { console.error(error); process.exitCode = 1; } }
module.exports = { parseArgs, classifyAudit, inspectManifest, main };
