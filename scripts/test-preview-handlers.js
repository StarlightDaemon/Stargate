"use strict";
// Additional offline evidence. This does NOT replace test-preview.js's real HTTP/link tests.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Writable } = require("node:stream");
const { startPreview, selectExhibit, requestPath } = require("./preview.js");

function dispatch(preview, url, method = "GET", host = new URL(preview.url).host) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const response = new Writable({ write(chunk, encoding, next) { chunks.push(Buffer.from(chunk)); next(); } });
    response.headersSent = false;
    response.writeHead = (status, headers) => { response.status = status; response.headers = Object.fromEntries(Object.entries(headers).map(([k,v]) => [k.toLowerCase(),v])); response.headersSent = true; };
    response.on("error", reject);
    response.on("finish", () => resolve({ status: response.status, headers: response.headers, body: Buffer.concat(chunks) }));
    preview.server.emit("request", { url, method, headers: { host } }, response);
  });
}
test("offline URL validation preserves raw traversal evidence", () => {
  for (const p of ["/../index.html", "/%2e%2e/index.html", "/a/../../index.html", "/server.js", "/server.cjs", "/serve.js", "/dev-serve.cjs", "/.git/config", "/package-lock.json", "/test/report.json"]) assert.equal(requestPath(p).status, 403, p);
  for (const p of ["/%ZZ", "/%2e%2e%2findex.html", "/%252e%252e/index.html", "/%5cindex.html", "/%00.js", "http://example/index.html"]) assert.equal(requestPath(p).status, 400, p);
});
for (const exhibit of ["stargate_aetheric_telegraph", "stargate_bathyscaphe_pilot", "stargate_solarpunk_astra", "stargate_erebus_signal", "stargate_reactor_criticality", "stargate_blueprint_alpha", "stargate_synchrotron_collider", "stargate_sigint_cryptanalysis", "stargate_konstrukt_transit", "stargate_epigraphic_spectrometry", "stargate_genomic_sequencer", "stargate_windtunnel_aerodynamics", "stargate_canopy_commons", "stargate_dark_gothic_fable", "stargate_nouveau_nimbus", "stargate_futurist_dynamism", "stargate_caissa_workstation", "stargate_dark_matter_array", "stargate_meteorological_nexrad", "stargate_orbital_atc", "stargate_solarpunk_ecogrid", "stargate_sonar_abyssal", "stargate_municipal_registry", "stargate_apiculture_telemetry", "stargate_steampunk_fable", "stargate_ukiyo_waystation_fable"]) {
  test(`offline handlers: ${exhibit} source bytes and security responses`, { timeout: 10000 }, async t => {
    const selection = selectExhibit(exhibit);
    const preview = await startPreview({ ...selection, port: 0 });
    t.after(() => preview.close());
    for (const file of selection.files) {
      const r = await dispatch(preview, "/" + file.split("/").map(encodeURIComponent).join("/"));
      assert.equal(r.status, 200, file); assert.deepEqual(r.body, fs.readFileSync(path.join(selection.root, file)), file);
    }
    const head = await dispatch(preview, "/", "HEAD");
    assert.equal(head.status, 200); assert.equal(head.body.length, 0);
    assert.equal(Number(head.headers["content-length"]), fs.statSync(path.join(selection.root, "index.html")).size);
    assert.equal((await dispatch(preview, "/", "POST")).status, 405);
    assert.equal((await dispatch(preview, "/", "GET", "example.invalid")).status, 403);
    for (const p of ["/../README.md", "/../stargate_bathyscaphe_pilot_fable/index.html", "/server.js", "/server.cjs"]) assert.equal((await dispatch(preview, p)).status, 403, p);
    assert.equal((await dispatch(preview, "/%ZZ")).status, 400);
    assert.equal((await dispatch(preview, "/absent-public-file.js")).status, 404);
    t.diagnostic(`${selection.files.length} files matched; HTTP transport, browser execution and symlinks are separately gated.`);
  });
}
