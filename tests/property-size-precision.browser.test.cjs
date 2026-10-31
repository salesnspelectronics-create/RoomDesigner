'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.setDefaultTimeout(10000);
let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');html=html.replace(main,main.slice(0,at)+"window.audit={get doc(){return doc},get catalog(){return catalog},addDevice,propertyMenu,render,effectiveArtwork,validateRoomDocument,prepareRoomImport,applyRoomImport,snapshot,select(id){selection={kind:'device',id};render()}};"+main.slice(at));
await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
const arch={id:'arch',name:'تخت',kind:'bed',category:'architecture',x:180,y:180,w:100,h:100,ports:[],backgroundColor:'#FF0000',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10h80v80H10z" fill="none" stroke="#111"/></svg>'};const old={...arch,id:'old',name:'old',kind:'custom',category:'equipment',equipmentRelease:'nsp-equipment-260'};
await page.addInitScript(seed=>{if(!localStorage.getItem('seeded')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('seeded','1')}},{rd_storage_reset_physical_v1:'done',rd_connection_model:'physical-connections-1',rd_equipment_release:'nsp-equipment-260',rd_active_user:'Tester',rd_catalog:JSON.stringify([{kind:'custom',name:'Old equipment',ports:[],assetId:'nsp-1l'}]),rd_last:JSON.stringify({schema:'room-designer/v0.3',connectionModel:'physical-connections-1',equipmentRelease:'nsp-equipment-260',id:'test',name:'Lighting test',devices:[old,arch],cables:[],walls:[]})});
await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);


const root=page.locator('#deskProperties');
await page.evaluate(()=>audit.addDevice(audit.catalog.findIndex(t=>t.kind==='lighting-switch'&&t.gangCount===8)));
assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).w),100);assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).h),50);
await page.evaluate(()=>{const d=audit.doc.devices.at(-1);Object.assign(d,{x:123.456789,y:234.567891,w:78.123456,h:46.987654});audit.render()});
for(const [key,value] of Object.entries({x:'84.4',y:'211.07',w:'78.12',h:'46.99'}))assert.equal(await root.locator('[data-desk-prop="'+key+'"]').inputValue(),value);
assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).x),123.456789);
for(const mode of ['code','real','iconic']){
 await root.locator('[data-desk-prop="displayMode"]').selectOption(mode);
 const size=await page.evaluate(()=>{const d=audit.doc.devices.at(-1);return [d.w,d.h]});assert.deepEqual(size,mode==='code'?[50,25]:[100,50]);
}
for(const key of ['w','h']){const field=root.locator('[data-desk-prop="'+key+'"]');assert.equal(await field.getAttribute('min'),'1');await field.fill('1');await field.press('Tab');assert.equal(await page.evaluate(key=>audit.doc.devices.at(-1)[key],key),1)}
await root.locator('[data-desk-prop="w"]').fill('50');await root.locator('[data-desk-prop="h"]').fill('25');
for(const mode of ['code','real','iconic']){await root.locator('[data-desk-prop="displayMode"]').selectOption(mode);assert.deepEqual(await page.evaluate(()=>{const d=audit.doc.devices.at(-1);return [d.w,d.h]}),mode==='code'?[50,25]:[100,50])}
await root.locator('[data-desk-prop="x"]').fill('12.34567');await root.locator('[data-desk-prop="x"]').press('Tab');assert.equal(await root.locator('[data-desk-prop="x"]').inputValue(),'12.35');assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).x),62.35);
for(const n of [1,2,3,4,6]){await page.evaluate(n=>audit.addDevice(audit.catalog.findIndex(t=>t.kind==='lighting-switch'&&t.gangCount===n)),n);for(const mode of ['code','real','iconic']){await root.locator('[data-desk-prop="displayMode"]').selectOption(mode);assert.deepEqual(await page.evaluate(()=>{const d=audit.doc.devices.at(-1);return [d.w,d.h]}),mode==='code'?[50,25]:[50,50])}}await page.evaluate(()=>audit.saveAuto?.());await page.screenshot({path:'work/properties-size-precision.png'});
assert.deepEqual(errors,[]);console.log('PASS: 100×50 eight-gang default, two-decimal displayed geometry without mutating stored precision, 1-unit dimensions, standard dimensions reset across all modes, rounded manual numeric entry.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
