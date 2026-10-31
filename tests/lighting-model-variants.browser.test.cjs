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
await page.evaluate(()=>audit.addDevice(audit.catalog.findIndex(t=>t.kind==='lighting-switch'&&t.gangCount===1)));
assert.equal(await root.locator('[data-desk-prop="lightingModel"]').inputValue(),'negin');
assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).code),'1L-NE');
let label=await page.locator('g[data-kind="device"] text').last().textContent();assert.ok(label.endsWith(' - نگین'));
const iconic=await page.evaluate(()=>audit.effectiveArtwork(audit.doc.devices.at(-1)));
await root.locator('[data-desk-prop="lightingModel"]').selectOption('azin');
assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).code),'1L-AZ');assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).realAssetId),'nsp-1l-azin');
assert.equal(await page.evaluate(()=>audit.effectiveArtwork(audit.doc.devices.at(-1))),iconic);
assert.ok((await page.locator('g[data-kind="device"] text').last().textContent()).endsWith(' - آذین'));
await root.locator('[data-desk-prop="displayMode"]').selectOption('real');
let art=await page.evaluate(()=>audit.effectiveArtwork(audit.doc.devices.at(-1)));assert.ok(art.includes('#e9ca16'));assert.ok(art.includes('#020207'));const crop=art.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);assert.ok(crop[0]>290&&crop[0]<310&&crop[1]>240&&crop[1]<255&&crop[2]>430&&crop[2]<460);
await root.locator('[data-desk-prop="w"]').fill('90');await root.locator('[data-desk-prop="h"]').fill('75');
await root.locator('[data-desk-prop="lightingModel"]').selectOption('negin');
assert.ok(!(await page.evaluate(()=>audit.effectiveArtwork(audit.doc.devices.at(-1)))).includes('#e9ca16'));
assert.deepEqual(await page.evaluate(()=>{const d=audit.doc.devices.at(-1);return [d.w,d.h]}),[90,75]);
await root.locator('[data-desk-prop="lightingModel"]').selectOption('azin');
await page.screenshot({path:'work/lighting-azin-real.png'});
await root.locator('[data-desk-prop="displayMode"]').selectOption('code');
assert.ok((await page.evaluate(()=>audit.effectiveArtwork(audit.doc.devices.at(-1)))).includes('>1L-AZ</text>'));
await root.locator('[data-desk-prop="lightingModel"]').selectOption('negin');assert.ok((await page.evaluate(()=>audit.effectiveArtwork(audit.doc.devices.at(-1)))).includes('>1L-NE</text>'));
await page.locator('#undoBtn').click();await page.evaluate(()=>audit.select(audit.doc.devices.at(-1).id));assert.equal(await root.locator('[data-desk-prop="lightingModel"]').inputValue(),'azin');
await page.waitForTimeout(800);await page.reload();await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);
assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).lightingModel),'azin');assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).code),'1L-AZ');assert.equal(await page.evaluate(()=>localStorage.getItem('rd_last').includes('<svg')),false);
await page.evaluate(()=>audit.addDevice(audit.catalog.findIndex(t=>t.kind==='lighting-switch'&&t.gangCount===8)));
assert.deepEqual(await root.locator('[data-desk-prop="lightingModel"] option').evaluateAll(nodes=>nodes.map(n=>n.value)),['negin']);
for(const n of [2,3,4,6]){
 await page.evaluate(n=>audit.addDevice(audit.catalog.findIndex(t=>t.kind==='lighting-switch'&&t.gangCount===n)),n);
 assert.deepEqual(await root.locator('[data-desk-prop="lightingModel"] option').evaluateAll(nodes=>nodes.map(n=>n.value)),['negin','azin']);
 await root.locator('[data-desk-prop="lightingModel"]').selectOption('azin');await root.locator('[data-desk-prop="displayMode"]').selectOption('real');
 assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).realAssetId),'nsp-'+n+'l-azin');assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).code),n+'L-AZ');
 const raw=await page.evaluate(()=>audit.effectiveArtwork(audit.doc.devices.at(-1)));assert.ok(raw.includes('#e9ca16'));assert.ok(raw.includes('stroke="#fff"'));
 await page.screenshot({path:'work/lighting-azin-'+n+'l.png'});
}
const gallery=await page.evaluate(()=>[1,2,3,4,6].map(n=>({n,svg:audit.effectiveArtwork({kind:'lighting-switch',gangCount:n,lightingModel:'azin',displayMode:'real',equipmentRelease:audit.catalog[0].equipmentRelease})})));
await page.setContent('<html><body style="background:#ccc;font:16px Arial;display:flex;flex-wrap:wrap;gap:12px">'+gallery.map(({n,svg})=>'<div><p>'+n+'L-AZ</p><img width="260" height="260" src="data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)+'"></div>').join('')+'</body></html>');await page.locator('img').evaluateAll(nodes=>Promise.all(nodes.map(n=>n.decode())));await page.screenshot({path:'work/azin-vector-gallery.png'});
assert.deepEqual(errors,[]);console.log('PASS: default Negin, 1L Azin asset/model/code/derived label, unchanged iconic art, real image changes without resizing, code suffixes, Undo, reload/reference-only persistence and unavailable other Azin models.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
