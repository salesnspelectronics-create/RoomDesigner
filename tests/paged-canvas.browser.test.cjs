'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.setDefaultTimeout(10000);
let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');html=html.replace(main,main.slice(0,at)+"window.audit={get doc(){return doc},get view(){return view},positionWorkspaceView,workspacePages,workspacePrintPages,printMenu,printNow,get catalog(){return catalog},addDevice,propertyMenu,render,effectiveArtwork,validateRoomDocument,prepareRoomImport,applyRoomImport,snapshot,select(id){selection={kind:'device',id};render()}};"+main.slice(at));
await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
const arch={id:'arch',name:'تخت',kind:'bed',category:'architecture',x:180,y:180,w:100,h:100,ports:[],backgroundColor:'#FF0000',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10h80v80H10z" fill="none" stroke="#111"/></svg>'};const old={...arch,id:'old',name:'old',kind:'custom',category:'equipment',equipmentRelease:'nsp-equipment-260'};
await page.addInitScript(seed=>{if(!localStorage.getItem('seeded')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('seeded','1')}},{rd_storage_reset_physical_v1:'done',rd_connection_model:'physical-connections-1',rd_equipment_release:'nsp-equipment-260',rd_active_user:'Tester',rd_catalog:JSON.stringify([{kind:'custom',name:'Old equipment',ports:[],assetId:'nsp-1l'}]),rd_last:JSON.stringify({schema:'room-designer/v0.3',connectionModel:'physical-connections-1',equipmentRelease:'nsp-equipment-260',id:'test',name:'Lighting test',devices:[old,arch],cables:[],walls:[]})});
await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);


// The original fixture contains one modest architectural symbol inside the origin page.
assert.equal(await page.locator('#canvasGrid').getAttribute('width'),'850');assert.equal(await page.locator('#canvasGrid').getAttribute('height'),'1100');
assert.equal(await page.locator('#pageBackground').getAttribute('data-columns'),'1');assert.equal(await page.locator('#pageBackground').getAttribute('data-rows'),'1');
await page.evaluate(()=>{audit.doc.devices=[];audit.doc.cables=[];audit.doc.walls=[];audit.render();audit.addDevice(audit.catalog.findIndex(t=>t.kind==='lighting-switch'&&t.gangCount===1))});
const root=page.locator('#deskProperties');assert.equal(await root.locator('[data-desk-prop="labelFontSize"]').inputValue(),'9');
await root.locator('[data-desk-prop="labelFontSize"]').fill('14');await root.locator('[data-desk-prop="showLabel"]').uncheck();assert.equal(await root.locator('[data-desk-prop="labelFontSize"]').isDisabled(),true);await root.locator('[data-desk-prop="showLabel"]').check();assert.equal(await root.locator('[data-desk-prop="labelFontSize"]').inputValue(),'14');
for(const [x,y,cols,rows]of [[900,200,2,1],[-40,200,2,1],[200,-40,1,2],[200,1150,1,2]]){
 await page.evaluate(({x,y})=>{Object.assign(audit.doc.devices[0],{x,y,showLabel:false});audit.render()},{x,y});
 assert.equal(Number(await page.locator('#pageBackground').getAttribute('data-columns')),cols);assert.equal(Number(await page.locator('#pageBackground').getAttribute('data-rows')),rows);
}
// Force a boundary into the viewport and verify a dashed separator exists.
await page.evaluate(()=>{Object.assign(audit.doc.devices[0],{x:900,y:200});audit.render()});await page.locator('#deskZoomPercent').click();assert.ok((await page.locator('#pageDividers').getAttribute('d')).length>0);
// Continuous edge drag must move the camera and object even with a stationary pointer.
await page.evaluate(()=>{Object.assign(audit.doc.devices[0],{x:400,y:200});audit.render()});await page.locator('#deskZoomPercent').click();
const center=await page.evaluate(()=>{const d=audit.doc.devices[0],m=document.getElementById('canvas').getScreenCTM();return{x:d.x*m.a+m.e,y:d.y*m.d+m.f}}),canvas=await page.locator('#canvas').boundingBox();
await page.mouse.move(center.x,center.y);await page.mouse.down();await page.mouse.move(canvas.x+canvas.width-4,Math.max(canvas.y+80,center.y),{steps:12});const before=await page.evaluate(()=>({x:audit.doc.devices[0].x,view:audit.view.x}));await page.waitForTimeout(600);const after=await page.evaluate(()=>({x:audit.doc.devices[0].x,view:audit.view.x}));assert.ok(after.x>before.x+30);assert.ok(after.view>before.view+30);await page.mouse.up();const stopped=await page.evaluate(()=>audit.view.x);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>audit.view.x),stopped);
for(const direction of ['left','up','down']){
 await page.evaluate(()=>{Object.assign(audit.doc.devices[0],{x:400,y:200});audit.render()});await page.locator('#deskZoomPercent').click();
 const pos=await page.evaluate(()=>{const d=audit.doc.devices[0],m=document.getElementById('canvas').getScreenCTM();return{x:d.x*m.a+m.e,y:d.y*m.d+m.f}}),r=await page.locator('#canvas').boundingBox();
 await page.mouse.move(pos.x,pos.y);await page.mouse.down();await page.mouse.move(direction==='left'?r.x+4:pos.x,direction==='up'?r.y+4:direction==='down'?r.y+r.height-4:pos.y,{steps:10});
 const initial=await page.evaluate(()=>({x:audit.view.x,y:audit.view.y}));await page.waitForTimeout(300);const final=await page.evaluate(()=>({x:audit.view.x,y:audit.view.y}));assert.ok(direction==='left'?final.x<initial.x-10:direction==='up'?final.y<initial.y-10:final.y>initial.y+10);await page.mouse.up();
}
// Four paper tiles print in left-to-right, top-to-bottom order, with no workspace decorations.
await page.evaluate(()=>{Object.assign(audit.doc.devices[0],{x:900,y:1200});audit.render();audit.printMenu()});await page.locator('#pdfArea').selectOption('pages');
assert.deepEqual(await page.evaluate(()=>audit.workspacePrintPages().map(p=>[p.col,p.row])),[[0,0],[1,0],[0,1],[1,1]]);
await page.evaluate(()=>{window.printHtml='';URL.createObjectURL=blob=>{window.printBlob=blob;return 'blob:test'};window.open=()=>({});audit.printNow()});const printHtml=await page.evaluate(()=>printBlob.text());const articleAttrs=[...printHtml.matchAll(/data-page-index="(\d+)" data-page-col="(-?\d+)" data-page-row="(-?\d+)"/g)].map(m=>m.slice(1));assert.deepEqual(articleAttrs,[['1','0','0'],['2','1','0'],['3','0','1'],['4','1','1']]);assert.ok(!printHtml.includes('id="pageBackground"'));assert.ok(!printHtml.includes('data-editor-handle'));
await page.evaluate(()=>{audit.positionWorkspaceView(true);audit.render()});await page.screenshot({path:'work/paged-canvas.png'});
assert.deepEqual(errors,[]);console.log('PASS: 9-unit caption and disabled hidden size, one850×1100 page, expansion in all four directions, separators, continuous edge auto-pan/stop and row-major multipage printing without editor overlays.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
