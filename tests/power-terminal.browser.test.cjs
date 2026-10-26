'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');
  html=html.replace(main,main.slice(0,at)+"window.navigationAudit={get doc(){return doc},get catalog(){return catalog},get view(){return view},set view(v){view=v;render()},get tool(){return tool},get start(){return start},get history(){return history},get temporaryPan(){return !!drag?.temporaryPan},addDevice,effectiveArtwork,deviceArtwork,setTool,render,portInfo};"+main.slice(at));
  await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
  await page.addInitScript(()=>{localStorage.setItem('rd_active_user','Tester');localStorage.setItem('rd_storage_reset_physical_v1','done')});
  await page.addInitScript(()=>{localStorage.setItem('rd_equipment_release','nsp-equipment-260');localStorage.setItem('rd_connection_model','physical-connections-1');localStorage.setItem('rd_catalog',JSON.stringify([{name:'Preserved custom',kind:'custom',category:'equipment',ports:[]}]))});
  await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.navigationAudit);
  if(await page.locator('#overlay.show').count())await page.locator('#closeSheet').click();page.setDefaultTimeout(8000);

  const index=await page.evaluate(()=>navigationAudit.catalog.findIndex(t=>t.code==='POWER-TERMINAL'));assert.ok(index>=0);assert.equal(await page.evaluate(()=>navigationAudit.catalog.some(t=>t.name==='Preserved custom')),true);
  const result=await page.evaluate(index=>{navigationAudit.addDevice(index);const d=navigationAudit.doc.devices.at(-1),raw=navigationAudit.deviceArtwork(d);return {id:d.id,code:d.code,name:d.name,nameEn:d.nameEn,w:d.w,h:d.h,asset:d.svgAssetId,safe:!!SvgEngine.sanitize(raw),ports:d.ports.map(p=>({id:p.id,name:p.name,type:p.type,side:p.side})),bounds:SvgEngine.bounds(raw),effectiveBox:SvgEngine.parse(navigationAudit.effectiveArtwork(d)).documentElement.getAttribute('viewBox')}},index);
  assert.equal(result.code,'POWER-TERMINAL');assert.equal(result.asset,'nsp-power-terminal');assert.equal(result.safe,true);assert.equal(result.ports.length,8);assert.equal(result.ports.filter(p=>p.type==='rs485_power').length,7);assert.equal(result.ports.filter(p=>p.type==='power').length,1);assert.equal(result.w,84);assert.equal(result.h,148);
  assert.equal(await page.locator('#drawing .port[fill="#16A34A"]').count(),7);assert.equal(await page.locator('#drawing .port[fill="#DC2626"]').count(),1);assert.ok(result.bounds);
  await page.evaluate(()=>navigationAudit.view={x:-70,y:-70,w:480,h:340});await page.screenshot({path:'work/power-terminal-preview.png'});
  await page.waitForTimeout(650);await page.reload();await page.waitForFunction(()=>window.__roomStartupReady&&window.navigationAudit);assert.equal(await page.evaluate(()=>navigationAudit.catalog.filter(t=>t.code==='POWER-TERMINAL').length),1);assert.equal(await page.evaluate(()=>navigationAudit.doc.devices.at(-1).ports.length),8);
  assert.deepEqual(errors,[]);console.log('PASS: power terminal catalog addition, sanitization, portrait dimensions, vector placement, seven green buses and red input, unique IDs and reload.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
