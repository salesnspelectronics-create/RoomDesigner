'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.setDefaultTimeout(10000);
let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');html=html.replace(main,main.slice(0,at)+"window.audit={get doc(){return doc},clearSelection(){selection=null;multiSelection=null},workspacePages,workspacePrintPages,positionWorkspaceView,get catalog(){return catalog},addDevice,propertyMenu,render,effectiveArtwork,validateRoomDocument,prepareRoomImport,applyRoomImport,snapshot,select(id){selection={kind:'device',id};render()}};"+main.slice(at));
await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
const arch={id:'arch',name:'تخت',kind:'bed',category:'architecture',x:-20,y:-20,w:100,h:100,ports:[],backgroundColor:'#FF0000',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10h80v80H10z" fill="none" stroke="#111"/></svg>'};const old={...arch,id:'old',name:'old',kind:'custom',category:'equipment',equipmentRelease:'nsp-equipment-260'};
await page.addInitScript(seed=>{if(!localStorage.getItem('seeded')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('seeded','1')}},{rd_storage_reset_physical_v1:'done',rd_connection_model:'physical-connections-1',rd_equipment_release:'nsp-equipment-260',rd_active_user:'Tester',rd_catalog:JSON.stringify([{kind:'custom',name:'Old equipment',ports:[],assetId:'nsp-1l'}]),rd_last:JSON.stringify({schema:'room-designer/v0.3',connectionModel:'physical-connections-1',equipmentRelease:'nsp-equipment-260',id:'test',name:'Lighting test',devices:[old,arch],cables:[],walls:[]})});
await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);


// Legacy viewport-margin placement must become one initial paper without moving its objects.
assert.equal(await page.locator('#pageBackground').getAttribute('data-columns'),'1');assert.equal(await page.locator('#pageBackground').getAttribute('data-rows'),'1');
assert.deepEqual(await page.evaluate(()=>[audit.doc.devices[0].x,audit.doc.devices[0].y]),[-20,-20]);
await page.evaluate(()=>audit.addDevice(audit.catalog.findIndex(t=>t.kind==='lighting-switch')));
assert.equal(await page.locator('#pageBackground').getAttribute('data-columns'),'1');assert.equal(await page.locator('#pageBackground').getAttribute('data-rows'),'1');
// A new empty diagram starts with exactly the origin tile, even if the viewport shows gray margins.
await page.evaluate(()=>{audit.clearSelection();audit.doc.devices=[];audit.doc.cables=[];audit.doc.walls=[];delete audit.doc.pageLayout;audit.render();audit.positionWorkspaceView(true);audit.render();audit.addDevice(audit.catalog.findIndex(t=>t.kind==='lighting-switch'))});
let bounds=await page.evaluate(()=>{const d=audit.doc.devices[0];return [d.x-d.w/2,d.y-d.h/2]});assert.ok(bounds.every(n=>n>=40));
await page.evaluate(()=>{const d=audit.doc.devices[0];d.name='A very long caption '.repeat(30);d.x=25;d.y=25;audit.render()});
assert.equal(await page.locator('#pageBackground').getAttribute('data-columns'),'1');assert.equal(await page.locator('#pageBackground').getAttribute('data-rows'),'1');
for(const [x,y,cols,rows]of [[825,200,1,1],[825.1,200,2,1],[25,200,1,1],[24.9,200,2,1],[200,1075,1,1],[200,1075.1,1,2],[200,25,1,1],[200,24.9,1,2]]){
 await page.evaluate(({x,y})=>{Object.assign(audit.doc.devices[0],{x,y,showLabel:false});audit.render()},{x,y});assert.equal(Number(await page.locator('#pageBackground').getAttribute('data-columns')),cols);assert.equal(Number(await page.locator('#pageBackground').getAttribute('data-rows')),rows);
}
// Independent right and bottom items allocate the fourth blank corner of the rectangle.
await page.evaluate(()=>{const d=audit.doc.devices[0];Object.assign(d,{x:900,y:200});audit.doc.devices.push({...structuredClone(d),id:'lower',x:200,y:1150});audit.render()});
assert.equal(await page.locator('#pageBackground').getAttribute('data-columns'),'2');assert.equal(await page.locator('#pageBackground').getAttribute('data-rows'),'2');assert.equal(await page.evaluate(()=>audit.workspacePrintPages().length),4);
await page.evaluate(()=>{audit.doc.devices.pop();Object.assign(audit.doc.devices[0],{x:200,y:200});audit.render()});assert.equal(await page.evaluate(()=>audit.workspacePrintPages().length),1);
await page.waitForTimeout(800);await page.reload();await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);assert.equal(await page.evaluate(()=>audit.workspacePrintPages().length),1);
assert.deepEqual(errors,[]);console.log('PASS: one-page legacy origin without moving objects, initial add inside paper, captions never allocate tiles, exact four-direction crossing thresholds, L-shaped occupancy closes to rectangle, shrink and reload.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
