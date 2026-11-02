'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.setDefaultTimeout(10000);
let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');html=html.replace(main,main.slice(0,at)+"window.audit={get doc(){return doc},positionWorkspaceView,workspacePages,get catalog(){return catalog},addDevice,propertyMenu,render,effectiveArtwork,validateRoomDocument,prepareRoomImport,applyRoomImport,snapshot,select(id){selection={kind:'device',id};render()}};"+main.slice(at));
await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
const arch={id:'arch',name:'تخت',kind:'bed',category:'architecture',x:180,y:180,w:100,h:100,ports:[],backgroundColor:'#FF0000',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10h80v80H10z" fill="none" stroke="#111"/></svg>'};const old={...arch,id:'old',name:'old',kind:'custom',category:'equipment',equipmentRelease:'nsp-equipment-260'};
await page.addInitScript(seed=>{if(!localStorage.getItem('seeded')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('seeded','1')}},{rd_storage_reset_physical_v1:'done',rd_connection_model:'physical-connections-1',rd_equipment_release:'nsp-equipment-260',rd_active_user:'Tester',rd_catalog:JSON.stringify([{kind:'custom',name:'Old equipment',ports:[],assetId:'nsp-1l'}]),rd_last:JSON.stringify({schema:'room-designer/v0.3',connectionModel:'physical-connections-1',equipmentRelease:'nsp-equipment-260',id:'test',name:'Lighting test',devices:[old,arch],cables:[],walls:[]})});
await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);





await page.locator('[data-section="power-switches"] summary').click();
assert.equal(await page.locator('[data-section="power-switches"] [data-symbol-code]').count(),7);
const root=page.locator('#deskProperties');
for(const [code,count] of [['CR3R-AL',3],['CR4R-AL',4],['CR-NE',0],['CR-AZ',0]]){
 await page.locator('[data-symbol-code="'+code+'"]').click();
 const d=await page.evaluate(()=>structuredClone(audit.doc.devices.at(-1)));assert.equal(d.code,code);assert.equal(d.gangCount,count);assert.equal(d.gangIcons.length,count);
 assert.equal(await root.locator('[data-desk-prop="installationDirection"]').count(),code==='CR4R-AL'?1:0);
 await root.locator('[data-inspector-tab="lighting"]').click();assert.equal(await root.locator('[data-lighting-picker]').count(),count);
 if(count){await root.locator('[data-lighting-picker="0"]').click();await page.locator('#lightingPicker-0 [data-lighting-choice="power-service-cleaning"]').click()}
 else assert.equal(await root.locator('.lighting-bulk-color').count(),0);
 await root.locator('[data-inspector-tab="general"]').click();
 for(const mode of ['code','iconic','real']){
  await root.locator('[data-desk-prop="displayMode"]').selectOption(mode);
  const dirs=code==='CR4R-AL'&&mode!=='code'?['landscape','portrait']:[null];
  for(const dir of dirs){if(dir)await root.locator('[data-desk-prop="installationDirection"]').selectOption(dir);
   const a=await page.evaluate(()=>{const d=audit.doc.devices.at(-1),v=RoomEquipment.variantFor(d);audit.validateRoomDocument(audit.doc);return {code:d.code,count:d.gangCount,icons:d.gangIcons,ratio:d.w/d.h,expected:v.realAspectRatio,svg:!!SvgEngine.sanitize(audit.effectiveArtwork(d))}});
   assert.equal(a.code,code);assert.equal(a.count,count);assert.equal(a.svg,true);if(count)assert.equal(a.icons[0],'power-service-cleaning');if(mode==='real')assert.ok(Math.abs(a.ratio-a.expected)<1e-8);
  }
 }
}
await page.waitForTimeout(900);await page.reload();await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);
const saved=await page.evaluate(()=>audit.doc.devices.filter(d=>d.kind==='power-switch').map(d=>({code:d.code,count:d.gangCount,icons:d.gangIcons})));assert.equal(saved.length,4);assert.equal(saved[1].icons[0],'power-service-cleaning');assert.equal(saved[3].count,0);await page.evaluate(()=>audit.validateRoomDocument(audit.doc));
const images=await page.evaluate(()=>RoomEquipment.defaults().filter(d=>['CR3R-AL','CR4R-AL','CR-NE','CR-AZ'].includes(d.code)).flatMap(d=>(d.code==='CR4R-AL'?['portrait','landscape']:[null]).flatMap(dir=>['iconic','real'].map(displayMode=>{const x={...d,...(dir?{installationDirection:dir}:{}),displayMode};return {title:d.code+' '+(dir||'')+' '+displayMode,svg:LightingModel.artwork({...x,...LightingModel.standardSize(x,displayMode)})}}))));
await page.setContent('<body style="display:grid;grid-template-columns:repeat(4,250px);background:#152638;gap:12px;color:white;font-family:Arial">'+images.map(s=>'<div><p>'+s.title+'</p><img style="width:245px;height:340px;object-fit:contain" src="data:image/svg+xml;base64,'+Buffer.from(s.svg).toString('base64')+'"></div>').join(''));
await page.screenshot({path:'work/power-switch-additions-gallery.png',fullPage:true});assert.deepEqual(errors,[]);console.log('PASS: four new power-switch variants, mounting identity, editable 3/4 icons, zero-command empty inspector, all modes, real aspect ratios, import validation and reload.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
