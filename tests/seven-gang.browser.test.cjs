'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.setDefaultTimeout(10000);
let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');html=html.replace(main,main.slice(0,at)+"window.audit={get doc(){return doc},get catalog(){return catalog},addDevice,propertyMenu,render,effectiveArtwork,validateRoomDocument,prepareRoomImport,applyRoomImport,snapshot,select(id){selection={kind:'device',id};render()}};"+main.slice(at));
await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
const arch={id:'arch',name:'تخت',kind:'bed',category:'architecture',x:180,y:180,w:100,h:100,ports:[],backgroundColor:'#FF0000',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10h80v80H10z" fill="none" stroke="#111"/></svg>'};const old={...arch,id:'old',name:'old',kind:'custom',category:'equipment',equipmentRelease:'nsp-equipment-260'};
await page.addInitScript(seed=>{if(!localStorage.getItem('seeded')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('seeded','1')}},{rd_storage_reset_physical_v1:'done',rd_connection_model:'physical-connections-1',rd_equipment_release:'nsp-equipment-260',rd_active_user:'Tester',rd_catalog:JSON.stringify([{kind:'custom',name:'Old equipment',ports:[],assetId:'nsp-1l'}]),rd_last:JSON.stringify({schema:'room-designer/v0.3',connectionModel:'physical-connections-1',equipmentRelease:'nsp-equipment-260',id:'test',name:'Lighting test',devices:[old,arch],cables:[],walls:[]})});
await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);


await page.locator('#deskLeft [data-section="equipment"] summary').click();
const tile=page.locator('#deskLeft [data-symbol-code="7L"]');assert.equal(await tile.count(),1);assert.equal(await tile.locator('img').evaluate(async n=>{await n.decode();return n.naturalWidth>0}),true);
await tile.hover();await page.waitForTimeout(600);assert.equal(await page.locator('#toolSymbolPreview small').textContent(),'7L');await tile.click();
assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).gangCount),7);assert.deepEqual(await page.evaluate(()=>{const d=audit.doc.devices.at(-1);return [d.w,d.h]}),[50,70]);
const root=page.locator('#deskProperties');assert.deepEqual(await root.locator('[data-desk-prop="lightingModel"] option').evaluateAll(nodes=>nodes.map(n=>n.value)),['negin','azin']);
await root.locator('[data-inspector-tab="lighting"]').click();assert.equal(await root.locator('[data-lighting-picker]').count(),7);
await root.locator('[data-lighting-picker="6"]').click();await page.locator('[data-lighting-gang="6"][data-lighting-choice="spot"]').click();assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).gangIcons[6]),'spot');
await root.locator('[data-inspector-tab="general"]').click();
for(const model of ['negin','azin']){
 await root.locator('[data-desk-prop="lightingModel"]').selectOption(model);
 await root.locator('[data-desk-prop="displayMode"]').selectOption('code');assert.ok((await page.evaluate(()=>audit.effectiveArtwork(audit.doc.devices.at(-1)))).includes('>7L-'+(model==='azin'?'AZ':'NE')+'</text>'));
 await root.locator('[data-desk-prop="displayMode"]').selectOption('real');
 assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).realAssetId),'nsp-7l'+(model==='azin'?'-azin':''));
 assert.deepEqual(await page.evaluate(()=>{const d=audit.doc.devices.at(-1);return [d.w,d.h]}),[50,70]);
 await page.evaluate(()=>audit.validateRoomDocument(audit.doc));
}
await page.waitForTimeout(800);await page.reload();await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).code),'7L-AZ');assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).gangIcons[6]),'spot');
const gallery=await page.evaluate(()=>['negin','azin','iconic'].map(model=>({name:model,svg:audit.effectiveArtwork({kind:'lighting-switch',gangCount:7,lightingModel:model==='iconic'?'negin':model,displayMode:model==='iconic'?'iconic':'real',w:50,h:70,equipmentRelease:audit.catalog[0].equipmentRelease})})));
await page.setContent('<html><body style="background:#ccc;font:16px Arial;display:flex;gap:20px">'+gallery.map(({name,svg})=>'<div><p>7L '+name+'</p><img width="260" height="364" src="data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)+'"></div>').join('')+'</body></html>');await page.locator('img').evaluateAll(nodes=>Promise.all(nodes.map(n=>n.decode())));await page.screenshot({path:'work/seven-gang-gallery.png'});
assert.deepEqual(errors,[]);console.log('PASS: seven-gang toolbox/hover/insertion, seven independent icons, both model references and code suffixes, standard portrait sizing, import validation and reload.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
