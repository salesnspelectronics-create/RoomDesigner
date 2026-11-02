'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.setDefaultTimeout(10000);
let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');html=html.replace(main,main.slice(0,at)+"window.audit={get doc(){return doc},positionWorkspaceView,workspacePages,get catalog(){return catalog},addDevice,propertyMenu,render,effectiveArtwork,validateRoomDocument,prepareRoomImport,applyRoomImport,snapshot,select(id){selection={kind:'device',id};render()}};"+main.slice(at));
await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
const arch={id:'arch',name:'تخت',kind:'bed',category:'architecture',x:180,y:180,w:100,h:100,ports:[],backgroundColor:'#FF0000',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10h80v80H10z" fill="none" stroke="#111"/></svg>'};const old={...arch,id:'old',name:'old',kind:'custom',category:'equipment',equipmentRelease:'nsp-equipment-260'};
await page.addInitScript(seed=>{if(!localStorage.getItem('seeded')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('seeded','1')}},{rd_storage_reset_physical_v1:'done',rd_connection_model:'physical-connections-1',rd_equipment_release:'nsp-equipment-260',rd_active_user:'Tester',rd_catalog:JSON.stringify([{kind:'custom',name:'Old equipment',ports:[],assetId:'nsp-1l'}]),rd_last:JSON.stringify({schema:'room-designer/v0.3',connectionModel:'physical-connections-1',equipmentRelease:'nsp-equipment-260',id:'test',name:'Lighting test',devices:[old,arch],cables:[],walls:[]})});
await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);





await page.evaluate(()=>audit.addDevice(audit.catalog.findIndex(t=>t.code==='CR3R-AL')));const id=await page.evaluate(()=>audit.doc.devices.at(-1).id);
async function openMenu(x=700,y=500){await page.evaluate(({id,x,y})=>{audit.select(id);document.querySelector('g[data-kind="device"][data-id="'+id+'"]').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:x,clientY:y}))},{id,x,y});}
const trigger=page.locator('[data-context-action="rotation"]'),sub=page.locator('#rdRotationSubmenu');
for(const [delta,expected]of [[-90,270],[90,0],[-180,180],[180,0]]){
 await openMenu();assert.equal(await page.locator('[data-context-action="rotateLeft"],[data-context-action="rotateRight"]').count(),0);await trigger.hover();assert.equal(await sub.isVisible(),true);assert.equal(await sub.locator('button').count(),4);
 await page.locator('[data-context-rotation="'+delta+'"]').click();assert.equal(await page.evaluate(id=>audit.doc.devices.find(d=>d.id===id).rotation,id),expected);assert.equal(await page.locator('#rdObjectContextMenu').count(),0);
}
await page.locator('#undoBtn').click();assert.equal(await page.evaluate(id=>audit.doc.devices.find(d=>d.id===id).rotation,id),180);await page.locator('#redoBtn').click();assert.equal(await page.evaluate(id=>audit.doc.devices.find(d=>d.id===id).rotation,id),0);
await openMenu(1430,990);await trigger.focus();await page.keyboard.press('ArrowLeft');assert.equal(await sub.isVisible(),true);assert.equal(await page.locator('[data-context-rotation="-90"]').evaluate(n=>n===document.activeElement),true);
const bounds=await sub.boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=1440&&bounds.y+bounds.height<=1000);
await page.keyboard.press('End');assert.equal(await page.locator('[data-context-rotation="180"]').evaluate(n=>n===document.activeElement),true);await page.keyboard.press('Enter');assert.equal(await page.evaluate(id=>audit.doc.devices.find(d=>d.id===id).rotation,id),180);
await openMenu();await trigger.hover();await page.screenshot({path:'../rotation-submenu.png'});await page.keyboard.press('Escape');assert.equal(await page.locator('#rdObjectContextMenu').count(),0);
await page.evaluate(id=>{audit.doc.devices.find(d=>d.id===id).locked=true;audit.render()},id);await openMenu();assert.equal(await trigger.isDisabled(),true);
await page.evaluate(id=>{audit.doc.devices.find(d=>d.id===id).locked=false;audit.doc.layers.find(l=>l.id===audit.doc.devices.find(d=>d.id===id).layerId||l.id==='main').locked=true;audit.render()},id);await openMenu();assert.equal(await trigger.isDisabled(),true);
assert.deepEqual(errors,[]);console.log('PASS: rotation submenu hover, four signed angles, Undo/Redo, keyboard navigation, edge positioning, Escape and object/layer locks.');

}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
