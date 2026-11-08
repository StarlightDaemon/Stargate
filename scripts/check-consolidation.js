"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {legacy}=require('./check-pilot-browsers.js');
const {selectExhibit,startPreview}=require('./preview.js');
const ROOT=path.resolve(__dirname,'..');
const pilot={name:'stargate_bibliographic_depository',server:'server.js'};
async function main(){
 const puppeteer=require(process.env.STARGATE_PUPPETEER_MODULE||'puppeteer');
 const browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH});
 const results=[];const output=path.join(ROOT,'test','consolidation');fs.mkdirSync(output,{recursive:true});
 try{for(const mode of ['legacy','shared']){
  const selection=selectExhibit(pilot.name);
  const server=mode==='legacy'?await legacy(pilot):await startPreview({...selection,port:0});
  const context=await browser.createBrowserContext();const page=await context.newPage();
  const result={mode,assets:0,assertions:[],pageErrors:[],resources:[]};
  try{
   for(const file of selection.files){const response=await fetch(server.url+'/'+file);assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),fs.readFileSync(path.join(selection.root,file)));result.assets++;}
   // Execute every original assertion; only substitute the ephemeral server URL.
   const source=fs.readFileSync(path.join(selection.root,'test_e2e.js'),'utf8').replace('http://127.0.0.1:5173/',server.url+'/').replace('runTests();','return runTests();');
   const capture={log:(...v)=>result.assertions.push(v.join(' ')),error:(...v)=>result.assertions.push(v.join(' '))};
   await new Function('require','__dirname','console',source)(require,selection.root,capture);
   assert.ok(result.assertions.some(l=>l.includes('TEST SUMMARY:')));assert.ok(!result.assertions.some(l=>l.startsWith('[FAIL]')));
   page.on('pageerror',e=>result.pageErrors.push(e.message));
   page.on('response',r=>{if(r.status()>=400)result.resources.push(r.url().replace(server.url,'ORIGIN')+':'+r.status());});
   await page.setViewport({width:1920,height:1080});await page.goto(server.url,{waitUntil:'networkidle0'});
   await page.screenshot({path:path.join(output,mode+'-idle.png')});
   const wait=state=>page.waitForFunction(s=>window.depositoryConsole.systemState===s,{timeout:20000},state);
   for(let cycle=0;cycle<2;cycle++){
    for(let digit=0;digit<7;digit++){await page.click(`[data-digit="${digit}"]`);await page.waitForFunction(n=>window.depositoryConsole.dialedDigits.length===n,{timeout:10000},digit+1);}
    await wait('PENDING');await new Promise(r=>setTimeout(r,1000));await wait('PENDING');
    await page.click('#btn-retrieve-vault');await wait('SUSTAINED_ACTIVE');
    await page.screenshot({path:path.join(output,mode+'-active-'+cycle+'.png')});
    await page.click('#btn-disengage-vault');await wait('IDLE');
   }
   assert.deepEqual(result.pageErrors,[]);
   if(mode==='shared'){assert.equal((await fetch(server.url+'/server.js')).status,403);assert.equal((await fetch(server.url+'/',{method:'POST'})).status,405);}
   result.status='PASS';
  }catch(e){result.status='FAIL';result.error=e.message;}
  finally{await context.close();await server.close();results.push(result);console.log(JSON.stringify(result));}
 }}finally{await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({scope:'Original assertions, asset bytes and two manual cycles; resource observations retained, no operator acceptance',results},null,2));}
 process.exitCode=results.every(r=>r.status==='PASS')?0:1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
