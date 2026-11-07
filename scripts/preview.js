#!/usr/bin/env node
"use strict";

// Local development only. Exhibit engines and the Pages artifact do not import this module.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { pipeline } = require("node:stream/promises");

const ROOT = path.resolve(__dirname, "..");
const TYPES = Object.freeze({
  ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".avif": "image/avif", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf",
  ".wav": "audio/wav", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".mp4": "video/mp4",
  ".webm": "video/webm", ".wasm": "application/wasm", ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json", ".txt": "text/plain; charset=utf-8",
});
const PRIVATE_DIRS = new Set(["node_modules", "test", "tests", "verify", "scripts", "screenshots",
  "test_screenshots", "test_artifacts", "test-artifacts", "coverage"]);
const PRIVATE_FILES = /^(?:readme(?:\..*)?|changelog(?:\..*)?|license(?:\..*)?|package(?:-lock)?\.json|npm-shrinkwrap\.json|.*\.lock|.*\.log|.*\.(?:pem|key|crt)|(?:dev-)?server\.[cm]?js|(?:test|verify|diag|audit)(?:[_-].*)?\.[cm]?js|.*[_-](?:test|spec)\.[cm]?js|run[_-]?tests?(?:[_-].*)?\.[cm]?js)$/i;
function within(root, file) {
  const rel = path.relative(root, file);
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}
function publicAsset(name) {
  const parts = name.split("/");
  return parts.every(p => p && p !== "." && p !== ".." && !p.startsWith(".") &&
    !PRIVATE_DIRS.has(p.toLowerCase()) && !/[\\:\x00-\x1f\x7f<>|?*]/.test(p) && !/[. ]$/.test(p) &&
    !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)) &&
    !PRIVATE_FILES.test(parts.at(-1)) && Object.hasOwn(TYPES, path.posix.extname(name).toLowerCase());
}
function trackedAssets(exhibit, repoRoot = ROOT) {
  const output = execFileSync("git", ["-C", repoRoot, "ls-files", "-z", "--", exhibit],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return output.split("\0").filter(p => p.startsWith(exhibit + "/"))
    .map(p => p.slice(exhibit.length + 1)).filter(publicAsset);
}
function selectExhibit(exhibit, repoRoot = ROOT) {
  if (typeof exhibit !== "string" || !/^[A-Za-z0-9_-]+$/.test(exhibit)) throw new Error("Select one exact active exhibit directory.");
  const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, "hub/index.json"), "utf8"));
  const entry = catalog.entries.find(e => e.folder === exhibit && e.link === `../${exhibit}/index.html` && e.status !== "retired");
  if (!entry) throw new Error("Exhibit is not an active static catalog entry. The flagship retains its Vite workflow.");
  const root = path.join(repoRoot, exhibit);
  if (fs.lstatSync(root).isSymbolicLink() || !within(fs.realpathSync(repoRoot), fs.realpathSync(root))) {
    throw new Error("Exhibit directory must be contained and must not be a link.");
  }
  const files = trackedAssets(exhibit, repoRoot);
  if (!files.includes("index.html")) throw new Error("Exhibit has no tracked public index.html.");
  return { root, files };
}
function requestPath(target) {
  if (typeof target !== "string" || !target.startsWith("/") || target.startsWith("//") || target.includes("#")) return { status: 400 };
  let decoded;
  try {
    // Validate escapes even in the query, without allowing URL's dot-segment normalization.
    decodeURIComponent(target);
    const raw = target.split("?", 1)[0];
    if (/%(?:2f|5c)/i.test(raw)) return { status: 400 };
    decoded = decodeURIComponent(raw);
  } catch { return { status: 400 }; }
  if (/[\\%:\x00-\x1f\x7f]/.test(decoded)) return { status: 400 };
  let relative = decoded.slice(1);
  if (!relative || relative.endsWith("/")) relative += "index.html";
  return publicAsset(relative) ? { relative } : { status: 403 };
}
function reply(res, method, status) {
  const body = `${http.STATUS_CODES[status]}\n`;
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...(status === 405 ? { Allow: "GET, HEAD" } : {}) });
  res.end(method === "HEAD" ? undefined : body);
}
async function openAsset(root, relative) {
  let current = root;
  for (const part of relative.split("/")) {
    current = path.join(current, part);
    if ((await fs.promises.lstat(current)).isSymbolicLink()) throw Object.assign(new Error("Link denied"), { code: "EACCES" });
  }
  const canonical = await fs.promises.realpath(current);
  if (!within(root, canonical)) throw Object.assign(new Error("Outside root"), { code: "EACCES" });
  const handle = await fs.promises.open(canonical, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try {
    const stat = await handle.stat();
    const currentStat = await fs.promises.lstat(current);
    if (!stat.isFile() || currentStat.isSymbolicLink() || stat.ino !== currentStat.ino || stat.dev !== currentStat.dev ||
        !within(root, await fs.promises.realpath(current))) throw Object.assign(new Error("Not a contained regular file"), { code: "EACCES" });
    return { handle, stat };
  } catch (error) { await handle.close(); throw error; }
}
async function startPreview({ root, files, port = 4173 }) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Port must be an integer from 0 through 65535.");
  if (!Array.isArray(files)) throw new Error("An explicit public file list is required.");
  if (fs.lstatSync(root).isSymbolicLink()) throw new Error("Linked roots are not supported.");
  root = await fs.promises.realpath(root);
  const allowed = new Set(files.filter(publicAsset));
  const server = http.createServer(async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") { reply(res, req.method, 405); return; }
    const hosts = new Set([`127.0.0.1:${server.address().port}`, `localhost:${server.address().port}`]);
    if (!hosts.has(req.headers.host?.toLowerCase())) { reply(res, req.method, 403); return; }
    const parsed = requestPath(req.url);
    if (parsed.status) { reply(res, req.method, parsed.status); return; }
    if (!allowed.has(parsed.relative)) { reply(res, req.method, 404); return; }
    let asset;
    try {
      asset = await openAsset(root, parsed.relative);
      res.writeHead(200, { "Content-Type": TYPES[path.extname(parsed.relative).toLowerCase()],
        "Content-Length": asset.stat.size, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
      if (req.method === "HEAD") res.end();
      else await pipeline(asset.handle.createReadStream({ autoClose: false }), res);
    } catch (error) {
      if (!res.headersSent) reply(res, req.method, ["ENOENT", "ENOTDIR"].includes(error.code) ? 404 : ["EACCES", "EPERM", "ELOOP"].includes(error.code) ? 403 : 500);
      else res.destroy();
    } finally { if (asset) await asset.handle.close().catch(() => {}); }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  server.timeout = 10000;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => { server.removeListener("error", reject); resolve(); });
  });
  return { server, url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  }) };
}
async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === "--help") {
    console.log("Usage: node scripts/preview.js --exhibit EXACT_DIRECTORY [--port 4173]\nLoopback only. Serves tracked public assets. Restart after adding files to Git."); return;
  }
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    if (!["--exhibit", "--port"].includes(key) || options[key] !== undefined || !args[i + 1]) throw new Error("Expected --exhibit EXACT_DIRECTORY [--port NUMBER].");
    options[key] = args[i + 1];
  }
  const value = options["--port"] ?? process.env.PORT ?? "4173";
  if (!/^\d+$/.test(value)) throw new Error("Port must be an integer from 0 through 65535.");
  const preview = await startPreview({ ...selectExhibit(options["--exhibit"]), port: Number(value) });
  console.log(`Preview ${options["--exhibit"]}: ${preview.url}`);
  let closing = false;
  const close = () => { if (!closing) { closing = true; preview.close().catch(() => { process.exitCode = 1; }); } };
  process.once("SIGINT", close); process.once("SIGTERM", close);
  preview.server.on("error", () => { console.error("Preview server failed."); process.exitCode = 1; close(); });
}
if (require.main === module) main().catch(error => {
  console.error(error.code === "EADDRINUSE" ? "Preview port is already in use." : error.code ? "Preview could not start; check the selected exhibit and local access." : error.message);
  process.exitCode = 1;
});
module.exports = { startPreview, selectExhibit, trackedAssets, publicAsset, requestPath };
