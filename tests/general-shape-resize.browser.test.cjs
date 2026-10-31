'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.setDefaultTimeout(10000);
let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');html=html.replace(main,main.slice(0,at)+"window.audit={get doc(){return doc},positionWorkspaceView,workspacePages,get catalog(){return catalog},addDevice,propertyMenu,render,effectiveArtwork,validateRoomDocument,prepareRoomImport,applyRoomImport,snapshot,select(id){selection={kind:'device',id};render()}};"+main.slice(at));
await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
const arch={id:'arch',name:'تخت',kind:'bed',category:'architecture',x:180,y:180,w:100,h:100,ports:[],backgroundColor:'#FF0000',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10h80v80H10z" fill="none" stroke="#111"/></svg>'};const old={...arch,id:'old',name:'old',kind:'custom',category:'equipment',equipmentRelease:'nsp-equipment-260'};
await page.addInitScript(seed=>{if(!localStorage.getItem('seeded')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('seeded','1')}},{rd_storage_reset_physical_v1:'done',rd_connection_model:'physical-connections-1',rd_equipment_release:'nsp-equipment-260',rd_active_user:'Tester',rd_catalog:JSON.stringify([{kind:'custom',name:'Old equipment',ports:[],assetId:'nsp-1l'}]),rd_last:JSON.stringify({schema:'room-designer/v0.3',connectionModel:'physical-connections-1',equipmentRelease:'nsp-equipment-260',id:'test',name:'Lighting test',devices:[old,arch],cables:[],walls:[]})});
await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);




await page.locator('[data-section="general"] summary').click();
for(const [kind,segments]of [['rectangle',4],['line',1],['square',4],['circle',64]]){
 const before=await page.evaluate(()=>audit.doc.walls.length);await page.locator('[data-section="general"] [data-desk-arch="'+kind+'"]').click();assert.equal(await page.evaluate(()=>audit.doc.walls.length)-before,segments);
 const field=page.locator('#deskProperties [data-desk-prop="shapeStrokeWidth"]');assert.equal(await field.count(),1);await field.fill('5.5');await field.press('Tab');
 assert.ok(await page.evaluate(kind=>audit.doc.walls.filter(w=>w.generalShape===kind).every(w=>w.width===5.5),kind));
}
await page.locator('[data-desk-image]').click();const imageId=await page.evaluate(()=>audit.doc.devices.find(d=>d.kind==='image').id);
for(let handle=0;handle<8;handle++){
 await page.evaluate(id=>{const d=audit.doc.devices.find(d=>d.id===id);Object.assign(d,{x:350,y:300,w:240,h:160});audit.select(id);audit.positionWorkspaceView(true);audit.render()},imageId);
 const point=await page.locator('[data-resize-handle="'+handle+'"]').evaluate(n=>{const m=document.getElementById('canvas').getScreenCTM();return {x:Number(n.getAttribute('cx'))*m.a+m.e,y:Number(n.getAttribute('cy'))*m.d+m.f}});
 const directions=[[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]],v=directions[handle];await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+v[0]*20,point.y+v[1]*20,{steps:4});await page.mouse.up();
 const size=await page.evaluate(id=>{const d=audit.doc.devices.find(d=>d.id===id);return [d.w,d.h]},imageId);assert.ok(Math.abs(size[0]/size[1]-1.5)<1e-8);assert.ok(size[0]>240&&size[1]>160);
}
const root=page.locator('#deskProperties');await root.locator('[data-desk-prop="w"]').fill('300');await root.locator('[data-desk-prop="w"]').press('Tab');assert.equal(await page.evaluate(()=>audit.doc.devices.find(d=>d.kind==='image').h),200);
await root.locator('[data-desk-prop="h"]').fill('100');await root.locator('[data-desk-prop="h"]').press('Tab');assert.equal(await page.evaluate(()=>audit.doc.devices.find(d=>d.kind==='image').w),150);
await page.evaluate(()=>audit.validateRoomDocument(audit.doc));assert.deepEqual(errors,[]);console.log('PASS: all five shapes insert immediately, full-shape thickness updates, eight proportional image handles and proportional numeric dimensions.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
