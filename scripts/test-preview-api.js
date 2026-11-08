"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { once } = require("node:events");
const { createPreviewServer } = require("./preview.js");
const { request } = require("./browser-check-helpers.js");
const ROOT = path.resolve(__dirname, "..");
function fixture(t) {
  const output = path.join(ROOT, "test"); fs.mkdirSync(output, { recursive: true });
  const root = fs.mkdtempSync(path.join(output, "preview-api-"));
  fs.writeFileSync(path.join(root, "index.html"), "<p>Imported server contract</p>");
  fs.writeFileSync(path.join(root, "server.js"), "private fixture");
  const options = { root, files: ["index.html", "server.js"] };
  const servers = [];
  const create = () => { const server = createPreviewServer(options); servers.push(server); return server; };
  t.after(async () => { for (const server of servers) if (server.listening) await close(server); });
  return { options, create };
}
function close(server) {
  return new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve()); server.closeAllConnections();
  });
}

test("converted imported exhibit APIs retain native Server contracts and security", async t => {
  for (const name of ["stargate_canopy_commons", "stargate_dark_gothic_fable", "stargate_nouveau_nimbus", "stargate_futurist_dynamism"]) {
    const api = require(path.join(ROOT, name, "server.js"));
    let server;
    if (name === "stargate_futurist_dynamism") {
      assert.ok(api instanceof http.Server); assert.equal(api.listening, false); server = api.listen(0);
    } else { assert.equal(typeof api.startServer, "function"); server = api.startServer(0); }
    assert.ok(server instanceof http.Server);
    t.after(async () => { if (server.listening) await close(server); });
    if (!server.listening) await once(server, "listening");
    assert.equal(server.address().address, "127.0.0.1");
    const url = "http://127.0.0.1:" + server.address().port;
    assert.deepEqual((await request(url, "/")).body, fs.readFileSync(path.join(ROOT, name, "index.html")));
    assert.equal((await request(url, "/server.js")).status, 403);
    assert.equal((await request(url, "/%ZZ")).status, 400);
    assert.equal((await request(url, "/", "POST")).status, 405);
    await close(server);
  }
});
test("synchronous API creates an unstarted native Server and rejects unsafe listen arguments", t => {
  const { create } = fixture(t), server = create();
  assert.ok(server instanceof http.Server);
  assert.equal(server.listening, false); assert.equal(server.address(), null);
  for (const port of [-1, 65536, 1.5, NaN, Infinity, "", "pipe", " 3000", {}, null, undefined])
    assert.throws(() => server.listen(port), /Port/);
  for (const host of ["0.0.0.0", "::", "::1", "example.invalid", "", {}, null])
    assert.throws(() => server.listen(0, host), /loopback/);
  assert.throws(() => server.listen(0, "127.0.0.1", 1), /callback/);
  assert.throws(() => server.listen(0, () => {}, () => {}), /callback/);
  assert.throws(() => server.listen(0, "localhost", () => {}, 1), /Expected/);
  assert.equal(server.address(), null);
});
test("imported listen returns the same Server, binds loopback, and uses the secured HTTP handler", async t => {
  const { create, options } = fixture(t);
  for (const style of ["port", "callback", "host", "host-callback", "numeric-string"]) {
    const server = create(); let callbacks = 0;
    const listening = once(server, "listening");
    const callback = () => { callbacks++; assert.equal(server.address().address, "127.0.0.1"); };
    const returned = style === "port" ? server.listen(0)
      : style === "callback" ? server.listen(0, callback)
      : style === "host" ? server.listen(0, "localhost")
      : style === "numeric-string" ? server.listen("0", callback)
      : server.listen(0, "127.0.0.1", callback);
    assert.equal(returned, server);
    await listening;
    assert.equal(server.address().address, "127.0.0.1");
    assert.equal(callbacks, ["callback", "host-callback", "numeric-string"].includes(style) ? 1 : 0);
    const url = "http://127.0.0.1:" + server.address().port;
    const index = await request(url, "/");
    assert.equal(index.status, 200); assert.deepEqual(index.body, fs.readFileSync(path.join(options.root, "index.html")));
    assert.equal((await request(url, "/server.js")).status, 403);
    assert.equal((await request(url, "/", "POST")).status, 405);
    await close(server); assert.equal(server.listening, false); assert.equal(server.address(), null);
  }
});
test("imported API preserves occupied-port error events and releases the port on close", async t => {
  const { create } = fixture(t), first = create(), second = create();
  const listening = once(first, "listening"); first.listen(0); await listening;
  const port = first.address().port;
  const conflict = once(second, "error"); assert.equal(second.listen(port), second);
  const [error] = await conflict; assert.equal(error.code, "EADDRINUSE"); assert.equal(second.listening, false);
  await close(first);
  const restarted = once(second, "listening"); assert.equal(second.listen(port, "localhost"), second); await restarted;
  assert.equal(second.address().port, port); assert.equal(second.address().address, "127.0.0.1");
  await close(second);
});

