"use strict";
const fs = require("node:fs"), path = require("node:path");
const { selectExhibit, startPreview } = require("./preview.js");
const OUTPUT = path.resolve(__dirname, "../test/navigation-diagnostics");
async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const browser = await require(process.env.STARGATE_PUPPETEER_MODULE).launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
  try {
    for (const name of ["stargate_heliora_annulus", "stargate_seti_freeform"]) {
      const server = await startPreview({ ...selectExhibit(name), port: 0 });
      const context = await browser.createBrowserContext(), page = await context.newPage(), start = Date.now();
      const events = [], errors = [], pending = new Set(), result = { name, events, errors };
      const event = (kind, value) => events.push({ ms: Date.now() - start, kind, value });
      page.on("request", r => { pending.add(r.url()); event("request", r.url().replace(server.url, "ORIGIN")); });
      page.on("requestfinished", r => { pending.delete(r.url()); event("finished", r.url().replace(server.url, "ORIGIN")); });
      page.on("requestfailed", r => { pending.delete(r.url()); errors.push(r.failure()); });
      page.on("pageerror", e => errors.push(e.message));
      page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
      for (const kind of ["load", "domcontentloaded"]) page.on(kind, () => event(kind));
      try {
        await page.setViewport({ width: 1920, height: 1080 });
        const response = await page.goto(server.url, { waitUntil: "load", timeout: 45000 });
        result.status = response.status(); result.loadMs = Date.now() - start;
        await page.waitForNetworkIdle({ idleTime: 500, timeout: 15000 }); result.idleMs = Date.now() - start;
        result.document = await page.evaluate(() => ({ readyState: document.readyState, title: document.title, buttons: document.querySelectorAll("button").length,
          resources: performance.getEntriesByType("resource").map(r => ({ name: new URL(r.name).pathname, duration: r.duration })) }));
        await page.screenshot({ path: path.join(OUTPUT, name + ".png") });
        const data = await page.screenshot({ type: "jpeg", quality: 60, encoding: "base64" });
        for (let offset = 0; offset < data.length; offset += 16000) console.log("STARGATE_VISUAL " + name + "-load.jpg " + offset + " " + data.slice(offset, offset + 16000));
      } catch (error) { result.error = error.stack; }
      finally {
        result.pending = [...pending].map(url => url.replace(server.url, "ORIGIN"));
        fs.writeFileSync(path.join(OUTPUT, name + ".json"), JSON.stringify(result, null, 2)); console.log("NAVIGATION_DIAGNOSTIC " + JSON.stringify(result));
        await context.close(); await server.close();
      }
    }
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
