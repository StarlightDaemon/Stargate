"use strict";
// Prepare reviewable npm candidates in ignored fixtures; never edit repository manifests.
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const { spawnSync, execFileSync } = require("node:child_process");
const ROOT = path.resolve(__dirname, "..");
const hash = file => fs.existsSync(file) ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") : null;
function parse(args) {
  const options = { generate: false, install: false, emit: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--generate-lock") options.generate = true;
    else if (args[i] === "--install") { options.install = true; options.generate = true; }
    else if (args[i] === "--emit") options.emit = true;
    else throw new Error("Usage: prepare-dependency-candidates.js [--generate-lock] [--install] [--emit]");
  }
  return options;
}
function npmCommand() {
  if (process.platform !== "win32") return { command: "npm", prefix: [] };
  const cli = [process.env.npm_execpath, path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js")].find(p => p && fs.existsSync(p));
  assert.ok(cli, "Run through npm or hosted Linux CI"); return { command: process.execPath, prefix: [cli] };
}
function main(args = process.argv.slice(2)) {
  const options = parse(args), source = ROOT;
  const files = ["package.json", "package-lock.json", "npm-shrinkwrap.json"], before = Object.fromEntries(files.map(f => [f, hash(path.join(source, f))]));
  assert.ok(before["package.json"], "Candidate requires an existing manifest");
  assert.ok(!before["npm-shrinkwrap.json"], "Review shrinkwrap projects separately");
  const pkg = JSON.parse(fs.readFileSync(path.join(source, "package.json"), "utf8"));
  pkg.dependencies = { ...pkg.dependencies, sharp: "^0.35.5" };
  pkg.devDependencies = { ...pkg.devDependencies, puppeteer: "^25.16.0", "puppeteer-core": "^25.16.0", pngjs: "^7.0.0" };
  const changes = ["Raise sharp floor to 0.35.5; add shared Puppeteer/core 25.16 and pngjs 7 development tools."];
  const base = path.join(ROOT, "test/dependency-candidates"); fs.mkdirSync(base, { recursive: true });
  const canonicalRoot = fs.realpathSync(ROOT), canonicalBase = fs.realpathSync(base);
  assert.ok(canonicalBase.startsWith(canonicalRoot + path.sep), "Ignored candidate destination must stay inside checkout");
  const output = path.join(base, "root-" + crypto.randomUUID()); fs.mkdirSync(output);
  fs.writeFileSync(path.join(output, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
  if (before["package-lock.json"]) fs.copyFileSync(path.join(source, "package-lock.json"), path.join(output, "package-lock.json"));
  const report = { sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(), options, changes,
    output: path.relative(ROOT, output).split(path.sep).join("/"), status: "PREPARED", checks: [], before,
    limitation: "Candidate generation/install is not exhibit qualification or authorization to remove dependencies. Adopt only after original-suite and command acceptance." };
  try {
    if (options.generate) {
      const npm = npmCommand(), env = { ...process.env, PUPPETEER_SKIP_DOWNLOAD: "true", npm_config_cache: path.join(output, "npm-cache"), npm_config_update_notifier: "false", NO_COLOR: "1" };
      const run = (label, command, commandArgs) => {
        const r = spawnSync(command, commandArgs, { cwd: output, env, windowsHide: true, encoding: "utf8", timeout: 180000, maxBuffer: 16 * 1024 * 1024 });
        fs.writeFileSync(path.join(output, label + ".stdout.log"), r.stdout || ""); fs.writeFileSync(path.join(output, label + ".stderr.log"), (r.stderr || "") + (r.error ? "\n" + r.error.message : ""));
        report.checks.push({ label, command: [command === process.execPath ? "node" : command, ...commandArgs.map(a => a === npm.prefix[0] ? "npm-cli.js" : a)], exitCode: r.status });
        assert.ok(!r.error && r.status === 0, label + " failed; inspect ignored evidence"); return r;
      };
      const common = ["--ignore-scripts", "--include=dev", "--include=optional", "--include=peer", "--fetch-retries=0", "--fetch-timeout=20000"];
      run("lock", npm.command, [...npm.prefix, "install", "--package-lock-only", "--no-audit", ...common]);
      const locked = hash(path.join(output, "package-lock.json"));
      if (options.install) {
        run("install", npm.command, [...npm.prefix, "ci", "--no-audit", ...common]);
        run("tree", npm.command, [...npm.prefix, "ls", "--all", "--json"]);
        assert.equal(hash(path.join(output, "package-lock.json")), locked, "Clean install must preserve candidate lock");
        {
          const smoke = "const assert=require('node:assert/strict');const sharp=require('sharp');assert.equal(require('puppeteer/package.json').version,require('puppeteer-core/package.json').version);assert.ok(require('pngjs').PNG);sharp(Buffer.from('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"2\" height=\"2\"><rect width=\"2\" height=\"2\" fill=\"red\"/></svg>')).resize(1,1).png().toBuffer({resolveWithObject:true}).then(r=>{assert.equal(r.info.width,1);assert.equal(r.info.height,1);console.log(JSON.stringify({sharp:sharp.versions,puppeteer:require('puppeteer/package.json').version,pngBytes:r.data.length}))}).catch(e=>{console.error(e);process.exitCode=1});";
          run("native-smoke", process.execPath, ["-e", smoke]);
        }
      }
      const audit = run("audit", npm.command, [...npm.prefix, "audit", "--json", ...common]);
      const parsed = JSON.parse(audit.stdout); assert.equal(parsed.metadata?.vulnerabilities?.total, 0, "Full candidate tree must audit clean");
      report.audit = parsed.metadata.vulnerabilities; report.status = options.install ? "CANDIDATE_INSTALL_PASS" : "CANDIDATE_LOCK_PASS";
    }
    report.after = Object.fromEntries(files.map(f => [f, hash(path.join(source, f))])); assert.deepEqual(report.after, before, "Tracked package metadata must remain untouched");
    report.candidate = Object.fromEntries(["package.json", "package-lock.json"].map(f => [f, { sha256: hash(path.join(output, f)), bytes: fs.existsSync(path.join(output, f)) ? fs.statSync(path.join(output, f)).size : null }]));
    if (options.emit && options.generate) for (const f of ["package.json", "package-lock.json"]) {
      const data = fs.readFileSync(path.join(output, f)).toString("base64");
      console.log("DEPENDENCY_CANDIDATE_FILE " + JSON.stringify({ exhibit: "root", file: f, ...report.candidate[f] }));
      for (let offset = 0; offset < data.length; offset += 12000) console.log("DEPENDENCY_CANDIDATE_CHUNK root " + f + " " + offset + " " + data.slice(offset, offset + 12000));
    }
    return report;
  } catch (e) { report.status = "FAIL"; report.error = e.stack; throw e; }
  finally {
    report.after = Object.fromEntries(files.map(f => [f, hash(path.join(source, f))])); report.sourceUnchanged = JSON.stringify(report.after) === JSON.stringify(before);
    fs.writeFileSync(path.join(output, "report.json"), JSON.stringify(report, null, 2)); console.log("DEPENDENCY_CANDIDATE_RESULT " + JSON.stringify(report));
  }
}
if (require.main === module) { try { main(); } catch (e) { console.error(e.message); process.exitCode = 1; } }
module.exports = { main, parse };
