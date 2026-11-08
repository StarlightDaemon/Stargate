"use strict";
// Browser preservation evidence, supplementary to (not a replacement for) builder suites.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const { startPreview, selectExhibit } = require("./preview.js");
const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "test", "pilot-browser");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const pilots = [
  { name: "stargate_aetheric_telegraph", kind: "aether", server: "server.js", ready: "STAGED", active: "ACTIVE", idle: "IDLE", total: 7,
    manual: ["sol-01", "hex-02", "gim-03", "arc-04", "mec-05", "pis-06", "spk-07"].map(n => "#btn-glyph-" + n),
    preset: '#qd-card-qd-calcutta .inject-btn', open: '#dispatch-throttle-btn', stop: '#emergency-vent-btn', hold: '#safety-hold-toggle-btn' },
  { name: "stargate_bathyscaphe_pilot", kind: "bath", server: "server.js", ready: "PENDING_READY", active: "SUSTAINED_ACTIVE", idle: "IDLE", total: 8,
    manual: Array.from({ length: 8 }, (_,i) => `.waypoint-btn[data-wp-index="${i}"]`),
    drawer: '#btn-quickdial-toggle', preset: '.preset-card-btn[data-preset-id="PRESET-VER-01"]', open: '#btn-commence-descent', stop: '#btn-emergency-blow', hold: '#safety-interlock-toggle' },
  { name: "stargate_solarpunk_astra", kind: "solar", server: "server.cjs", ready: "ready", active: "active", idle: "idle", total: 4,
    manual: Array.from({ length: 4 }, (_,i) => `[data-sign="${i}"]`), preset: '[data-route="hollow"]', open: '#activate', stop: '#disengage', hold: '#hold' },
];
function legacy(pilot) {
  return new Promise((resolve, reject) => {
    const directory = path.join(ROOT, pilot.name);
    const intercepted = { ...http, createServer(handler) {
      const server = http.createServer(handler);
      server.once("error", reject);
      server.listen = () => {
        // Only the listener is redirected: loopback and an ephemeral port, never external exposure.
        http.Server.prototype.listen.call(server, 0, "127.0.0.1", () => resolve({
          url: `http://127.0.0.1:${server.address().port}`,
          close: () => new Promise(done => { server.close(done); server.closeAllConnections(); }),
        }));
        return server;
      };
      return server;
    } };
    // Historical comparison only: retired handler implementations stay in Git,
    // never in active launch commands. CI must fetch this pinned baseline commit.
    const source = execFileSync("git", ["show", `8c3f718c3e31cd19c169c7cf87ab2feeee7242c1:${pilot.name}/${pilot.server}`], { cwd: ROOT, encoding: "utf8" });
    vm.runInNewContext(source, {
      require: name => /^(?:node:)?http$/.test(name) ? intercepted : require(name),
      __dirname: directory, process: { env: {} }, console: { log() {} }, URL,
    }, { filename: pilot.server });
  });
}
async function click(page, selector) {
  await page.waitForSelector(selector, { visible: true, timeout: 10000 });
  const target = await page.$(selector); await target.scrollIntoView();
  const box = await target.boundingBox(); assert.ok(box, `Rendered control: ${selector}`);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  assert.ok(await page.evaluate((selector, x, y) => {
    const control = document.querySelector(selector), hit = document.elementFromPoint(x,y);
    return control === hit || control.contains(hit);
  }, selector, x,y), `Hit-test ${selector}`);
  await page.mouse.click(x,y);
}
async function snapshot(page, pilot) {
  return page.evaluate(kind => {
    if (kind === "aether") { const t = window.terminalInstance; return t && { state:t.state, count:t.stagedGlyphs.length, hold:t.isSafetyHoldEngaged }; }
    if (kind === "bath") return window.Dialer && { state:window.Dialer.getDialerState(), count:window.Dialer.getLockedWaypoints().length, hold:document.getElementById('safety-interlock-toggle').getAttribute('aria-checked') === 'true' };
    if (!window.loamwakeSnapshot) return null;
    const t = window.loamwakeSnapshot(); return {state:t.state, count:t.address.length, hold:t.hold};
  }, pilot.kind);
}
async function until(page, pilot, predicate, label, observations) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const value = await snapshot(page, pilot);
    if (observations && value) observations.push(value);
    if (value && predicate(value)) return value;
    await delay(80);
  }
  throw new Error(`${label}: last state ${JSON.stringify(await snapshot(page,pilot))}`);
}
async function qualify(browser, pilot, mode) {
  const server = mode === "legacy" ? await legacy(pilot) : await startPreview({ ...selectExhibit(pilot.name), port: 0 });
  const context = await browser.createBrowserContext(); const page = await context.newPage();
  const result = { exhibit:pilot.name, mode, observations:[], pageErrors:[], consoleErrors:[], failedRequests:[], httpErrors:[], screenshots:[] };
  const shot = async name => {
    const file = `${pilot.name}-${mode}-${name}.png`;
    await page.screenshot({path:path.join(OUTPUT,file)}); result.screenshots.push(file);
    // Optional connector-readable evidence when artifact downloads are unavailable.
    if (mode === "shared" && process.env.STARGATE_LOG_VISUALS === "1") {
      const jpeg = await page.screenshot({type:"jpeg", quality:65, encoding:"base64"});
      for(let offset=0;offset<jpeg.length;offset+=16000)
        console.log(`STARGATE_VISUAL ${file.replace(/\.png$/, ".jpg")} ${offset} ${jpeg.slice(offset,offset+16000)}`);
    }
  };
  page.on("pageerror", e => result.pageErrors.push(e.message));
  page.on("console", m => { if(m.type()==="error") result.consoleErrors.push(m.text()); });
  page.on("requestfailed", r => result.failedRequests.push({url:r.url().replace(server.url,"ORIGIN"), error:r.failure()?.errorText}));
  page.on("response", r => { if(r.status()>=400) result.httpErrors.push({url:r.url().replace(server.url,"ORIGIN"),status:r.status()}); });
  try {
    await page.setViewport({width:1920,height:1080});
    const response = await page.goto(server.url, {waitUntil:"networkidle0",timeout:30000}); assert.equal(response.status(),200);
    await until(page,pilot,s=>s.state===pilot.idle,"Initial idle"); await shot("idle");
    result.initial = await snapshot(page,pilot);
    for(let i=0;i<pilot.manual.length;i++) { await click(page,pilot.manual[i]); await until(page,pilot,s=>s.count===i+1,"Manual lock"); }
    await until(page,pilot,s=>s.state===pilot.ready,"Manual ready"); await delay(1000);
    result.manualReady=await snapshot(page,pilot); assert.equal(result.manualReady.state,pilot.ready,"No automatic activation"); await shot("manual-ready");
    if(result.manualReady.hold) await click(page,pilot.hold);
    await click(page,pilot.open);
    await until(page,pilot,s=>s.state===pilot.active,"Manual activation",result.observations); await shot("manual-active");
    await click(page,pilot.stop); await until(page,pilot,s=>s.state===pilot.idle&&s.count===0,"First disengage");
    if(pilot.drawer) {await click(page,pilot.drawer);await delay(350);}
    await click(page,pilot.preset);
    const staged=[]; await until(page,pilot,s=>s.state===pilot.ready,"Preset ready",staged);
    assert.ok(staged.some(s=>s.count>0&&s.count<pilot.total),"Preset had intermediate locks");
    result.presetCounts=[...new Set(staged.map(s=>s.count))]; await delay(1000);
    assert.equal((await snapshot(page,pilot)).state,pilot.ready,"Preset does not activate automatically");
    if((await snapshot(page,pilot)).hold) await click(page,pilot.hold);
    await click(page,pilot.open); await until(page,pilot,s=>s.state===pilot.active,"Preset activation");
    await click(page,pilot.stop); await until(page,pilot,s=>s.state===pilot.idle&&s.count===0,"Second disengage");
    // A third manual route checks interruption and late state callbacks separately.
    for(let i=0;i<pilot.manual.length;i++) {await click(page,pilot.manual[i]);await until(page,pilot,s=>s.count===i+1,"Cancellation route");}
    await until(page,pilot,s=>s.state===pilot.ready,"Cancellation ready");
    if((await snapshot(page,pilot)).hold) await click(page,pilot.hold);
    await click(page,pilot.open); await delay(500); await click(page,pilot.stop); await delay(8250);
    result.cancelled=await snapshot(page,pilot); assert.equal(result.cancelled.state,pilot.idle); assert.equal(result.cancelled.count,0); await shot("cancelled");
    if(pilot.kind === "aether") {
      result.cancellationDetails = await page.evaluate(async () => {
        const { soundEngine } = await import('./audio.js');
        return { timer: window.terminalInstance.ignitionTimer,
          beams: document.getElementById('active-conduit-energy-beams').children.length,
          drone: Boolean(soundEngine.activeVortexDrone), governor: Boolean(soundEngine.activeGovernorWhirl) };
      });
      assert.deepEqual(result.cancellationDetails, {timer:null, beams:0, drone:false, governor:false});
    }
    result.interactionAssertions="PASS";
  } catch(error) {result.interactionAssertions="FAIL";result.error=error.message;try{await shot("failure");}catch{}}
  finally {await context.close();await server.close();}
  return result;
}
async function main() {
  fs.mkdirSync(OUTPUT,{recursive:true});
  const report={scope:"Legacy versus shared serving: initial load, real hit-tested manual/preset activation and two disengage cycles, interrupted activation state after 8.25 seconds. Not operator, sound, visual-quality, keyboard or reduced-motion qualification.",results:[]};
  let browser;
  try {
    const puppeteer=require(process.env.STARGATE_PUPPETEER_MODULE || "puppeteer");
    browser=await puppeteer.launch({headless:true, ...(process.env.PUPPETEER_EXECUTABLE_PATH?{executablePath:process.env.PUPPETEER_EXECUTABLE_PATH}:{}),timeout:20000});
    report.browser=await browser.version();
    for(const pilot of pilots) {
      for(const mode of ["legacy","shared"]) {const result=await qualify(browser,pilot,mode);report.results.push(result);console.log(JSON.stringify(result));}
    }
    const failures=report.results.filter(r=>r.interactionAssertions!=="PASS"||r.pageErrors.length);
    report.status=failures.length?"FAIL":"PASS";
    // Network/console observations are retained independently, including baseline missing favicons.
    report.loadingObservations=report.results.filter(r=>r.consoleErrors.length||r.failedRequests.length||r.httpErrors.length).map(r=>({exhibit:r.exhibit,mode:r.mode,consoleErrors:r.consoleErrors,failedRequests:r.failedRequests,httpErrors:r.httpErrors}));
    if(report.loadingObservations.length) report.status="FAIL";
  } catch(error) {report.status="ENVIRONMENT-BLOCKED";report.error=error.message;console.error(error.message);}
  finally {if(browser)await browser.close();fs.writeFileSync(path.join(OUTPUT,"report.json"),JSON.stringify(report,null,2)+"\n");}
  console.log(`Pilot browser result: ${report.status}`);process.exitCode=report.status==="PASS"?0:1;
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports = { legacy };
