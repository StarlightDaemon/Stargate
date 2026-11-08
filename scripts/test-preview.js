"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const { startPreview, selectExhibit } = require("./preview.js");
const ROOT = path.resolve(__dirname, "..");
fs.mkdirSync(path.join(ROOT, "test"), { recursive: true });

function request(url, pathname = "/", method = "GET", headers = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const req = http.request({ hostname: target.hostname, port: target.port, path: pathname, method, headers }, res => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.setTimeout(3000, () => req.destroy(new Error("HTTP test timed out")));
    req.on("error", reject); req.end();
  });
}
async function fixture(t) {
  const base = fs.mkdtempSync(path.join(ROOT, "test", "preview-"));
  const root = path.join(base, "exhibit");
  fs.mkdirSync(root);
  const contents = { "index.html": "<h1>Preview fixture</h1>", "app.js": "export const ready = true;",
    "style.css": "body { color: cyan; }", "data.json": "{\"ok\":true}", "hello world.svg": "<svg/>",
    "café.txt": "decoded", "server.js": "private server", ".env": "test fixture only",
    "package.json": "{}", "test.js": "private harness", "private.pem": "fixture", "untracked.js": "not public" };
  for (const [name, content] of Object.entries(contents)) fs.writeFileSync(path.join(root, name), content);
  fs.mkdirSync(path.join(root, "assets")); fs.writeFileSync(path.join(root, "assets", "font.woff2"), Buffer.from([0, 1, 2, 3]));
  fs.mkdirSync(path.join(root, "nested")); fs.writeFileSync(path.join(root, "nested", "index.html"), "nested");
  const files = [...Object.keys(contents).filter(f => f !== "untracked.js"), "assets/font.woff2", "nested/index.html", "missing.js", "escape/index.html", "internal/font.woff2"];
  const preview = await startPreview({ root, files, port: 0 });
  t.after(() => preview.close());
  return { ...preview, base, root, files, contents };
}
test("GET/HEAD deliver exact bytes, MIME and safe cache headers; queries and decoding work", async t => {
  const f = await fixture(t);
  for (const [name, type] of [["index.html", "text/html"], ["app.js", "text/javascript"], ["style.css", "text/css"], ["data.json", "application/json"], ["hello world.svg", "image/svg+xml"], ["café.txt", "text/plain"], ["assets/font.woff2", "font/woff2"]]) {
    const r = await request(f.url, "/" + name.split("/").map(encodeURIComponent).join("/") + "?v=1");
    assert.equal(r.status, 200, name); assert.deepEqual(r.body, fs.readFileSync(path.join(f.root, name)));
    assert.ok(r.headers["content-type"].startsWith(type)); assert.equal(r.headers["x-content-type-options"], "nosniff");
    assert.equal(r.headers["cache-control"], "no-store");
  }
  const head = await request(f.url, "/", "HEAD");
  assert.equal(head.status, 200); assert.equal(head.body.length, 0);
  assert.equal(Number(head.headers["content-length"]), Buffer.byteLength(f.contents["index.html"]));
  assert.equal((await request(f.url, "/nested/")).body.toString(), "nested");
  fs.writeFileSync(path.join(f.root, "app.js"), "changed");
  assert.equal((await request(f.url, "/app.js")).body.toString(), "changed", "Tracked-file edits appear without restart");
});
test("raw, encoded and sibling traversal never escape the selected directory", async t => {
  const f = await fixture(t);
  for (const p of ["/../README.md", "/../exhibit-sibling/index.html", "/%2e%2e/index.html", "/a/../../index.html", "/./index.html", "/assets/../index.html"]) {
    const r = await request(f.url, p); assert.equal(r.status, 403, p); assert.equal(r.body.toString(), "Forbidden\n");
  }
});
test("malformed and ambiguous URLs return bounded errors without paths", async t => {
  const f = await fixture(t);
  for (const p of ["/%ZZ", "/%c0%af", "/%2e%2e%2findex.html", "/%252e%252e/index.html", "/%5c..%5cindex.html", "/index.html?bad=%ZZ", "/%00.js", "/C:/private.js", "//elsewhere/index.html", "http://elsewhere/index.html"]) {
    const r = await request(f.url, p); assert.equal(r.status, 400, p); assert.equal(r.body.toString(), "Bad Request\n");
  }
});
test("private files, development scripts, dotfiles and Windows aliases are forbidden", async t => {
  const f = await fixture(t);
  for (const p of ["/.git/config", "/.env", "/server.js", "/package.json", "/test.js", "/private.pem", "/scripts/app.js", "/node_modules/app.js", "/test/report.json", "/NUL.txt", "/index.html.", "/index.html%20"]) {
    const r = await request(f.url, p); assert.equal(r.status, 403, p);
  }
  for (const p of ["/untracked.js", "/missing.js", "/does-not-exist.html", "/assets"]) assert.ok([403,404].includes((await request(f.url, p)).status), p);
});
test("unsupported methods and foreign Host are refused", async t => {
  const f = await fixture(t);
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS", "TRACE"]) {
    const r = await request(f.url, "/", method); assert.equal(r.status, 405, method); assert.equal(r.headers.allow, "GET, HEAD");
  }
  assert.equal((await request(f.url, "/", "GET", { Host: "attacker.example" })).status, 403);
  assert.equal(f.server.address().address, "127.0.0.1");
});
test("directory links (including Windows junctions) cannot escape or alias public files", async t => {
  const f = await fixture(t);
  const outside = path.join(f.base, "outside"); fs.mkdirSync(outside); fs.writeFileSync(path.join(outside, "index.html"), "outside secret fixture");
  // Junctions exercise Windows containment without requiring symlink elevation.
  fs.symlinkSync(outside, path.join(f.root, "escape"), process.platform === "win32" ? "junction" : "dir");
  fs.symlinkSync(path.join(f.root, "assets"), path.join(f.root, "internal"), process.platform === "win32" ? "junction" : "dir");
  assert.equal((await request(f.url, "/escape/index.html")).status, 403);
  assert.equal((await request(f.url, "/internal/font.woff2")).status, 403);
  await assert.rejects(startPreview({ root: path.join(f.root, "escape"), files: ["index.html"], port: 0 }), /Linked roots/);
});
test("port conflicts reject, and shutdown releases the listening port", async t => {
  const f = await fixture(t); const port = f.server.address().port;
  await assert.rejects(startPreview({ root: f.root, files: f.files, port }), { code: "EADDRINUSE" });
  const second = await startPreview({ root: f.root, files: f.files, port: 0 });
  const releasedPort = second.server.address().port; await second.close();
  const replacement = await startPreview({ root: f.root, files: f.files, port: releasedPort }); await replacement.close();
  for (const invalid of [-1, 65536, 1.5, NaN, "3000"]) await assert.rejects(startPreview({ root: f.root, files: f.files, port: invalid }), /Port/);
});
test("selection requires an exact active static exhibit", () => {
  for (const name of [undefined, ".", "..", "../Stargate", "stargate_bathyscaphe_pilot_f", "Stargate_OG", "_sequestered", "stargate_expressionism_fable", "stargate_salvage_terminal"]) assert.throws(() => selectExhibit(name));
  assert.ok(selectExhibit("stargate_bathyscaphe_pilot").files.includes("src/js/app.js"));
});
test("three pilots deliver every allowed tracked asset byte-for-byte", async t => {
  for (const name of ["stargate_aetheric_telegraph", "stargate_bathyscaphe_pilot", "stargate_solarpunk_astra"]) {
    const selection = selectExhibit(name); const p = await startPreview({ ...selection, port: 0 });
    try {
      for (const file of selection.files) {
        const r = await request(p.url, "/" + file.split("/").map(encodeURIComponent).join("/"));
        assert.equal(r.status, 200, `${name}/${file}`); assert.deepEqual(r.body, fs.readFileSync(path.join(selection.root, file)), `${name}/${file}`);
      }
      t.diagnostic(`${name}: ${selection.files.length} resources matched source bytes`);
      assert.equal((await request(p.url, "/server.js")).status, 403);
      assert.equal((await request(p.url, "/../stargate_bathyscaphe_pilot_fable/index.html")).status, 403);
    } finally { await p.close(); }
  }
});
test("CLI rejects unknown options and reports port conflicts without private paths", async t => {
  const f = await fixture(t);
  async function run(args) {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [path.join(__dirname, "preview.js"), ...args], { cwd: ROOT, windowsHide: true });
      let output = ""; child.stdout.on("data", c => output += c); child.stderr.on("data", c => output += c);
      const timer = setTimeout(() => { child.kill(); reject(new Error("CLI timeout")); }, 5000);
      child.on("error", reject); child.on("close", code => { clearTimeout(timer); resolve({ code, output }); });
    });
  }
  assert.notEqual((await run(["--host", "0.0.0.0"])).code, 0);
  const conflict = await run(["--exhibit", "stargate_solarpunk_astra", "--port", String(f.server.address().port)]);
  assert.equal(conflict.code, 1); assert.match(conflict.output, /port is already in use/); assert.ok(!conflict.output.includes(ROOT));
});
test("existing pilot launch commands use the shared security policy and PORT override", { timeout: 20000 }, async () => {
  for (const [folder, file] of [["stargate_aetheric_telegraph", "server.js"], ["stargate_bathyscaphe_pilot", "server.js"], ["stargate_solarpunk_astra", "server.cjs"], ["stargate_bibliographic_depository", "server.js"]]) {
    const child = spawn(process.execPath, [file], { cwd: path.join(ROOT, folder), env: { ...process.env, PORT: "0" }, windowsHide: true });
    const closed = new Promise(resolve => child.once("close", resolve));
    try {
      const url = await new Promise((resolve, reject) => {
        let output = "";
        const timer = setTimeout(() => reject(new Error(`Launcher timeout: ${folder}`)), 5000);
        child.stdout.on("data", data => {
          output += data;
          const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
          if (match) { clearTimeout(timer); resolve(match[0]); }
        });
        child.stderr.on("data", data => { clearTimeout(timer); reject(new Error(String(data))); });
        child.once("error", error => { clearTimeout(timer); reject(error); });
        child.once("close", () => { clearTimeout(timer); reject(new Error("Launcher exited before serving")); });
      });
      assert.deepEqual((await request(url)).body, fs.readFileSync(path.join(ROOT, folder, "index.html")));
      assert.equal((await request(url, "/", "POST")).status, 405);
      assert.equal((await request(url, "/" + file)).status, 403);
      assert.equal((await request(url, "/../README.md")).status, 403);
      assert.equal((await request(url, "/../stargate_bathyscaphe_pilot_fable/index.html")).status, 403);
    } finally { child.kill(); await closed; }
  }
});
