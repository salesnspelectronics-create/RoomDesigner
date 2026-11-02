'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.setDefaultTimeout(10000);
let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');html=html.replace(main,main.slice(0,at)+"window.audit={get doc(){return doc},positionWorkspaceView,workspacePages,get catalog(){return catalog},addDevice,propertyMenu,render,effectiveArtwork,validateRoomDocument,prepareRoomImport,applyRoomImport,snapshot,drawingPrintBounds,detailCaptionPosition,select(id){selection={kind:'device',id};render()}};"+main.slice(at));
await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
const arch={id:'arch',name:'تخت',kind:'bed',category:'architecture',x:180,y:180,w:100,h:100,ports:[],backgroundColor:'#FF0000',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10h80v80H10z" fill="none" stroke="#111"/></svg>'};const old={...arch,id:'old',name:'old',kind:'custom',category:'equipment',equipmentRelease:'nsp-equipment-260'};
await page.addInitScript(seed=>{if(!localStorage.getItem('seeded')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('seeded','1')}},{rd_storage_reset_physical_v1:'done',rd_connection_model:'physical-connections-1',rd_equipment_release:'nsp-equipment-260',rd_active_user:'Tester',rd_catalog:JSON.stringify([{kind:'custom',name:'Old equipment',ports:[],assetId:'nsp-1l'}]),rd_last:JSON.stringify({schema:'room-designer/v0.3',connectionModel:'physical-connections-1',equipmentRelease:'nsp-equipment-260',id:'test',name:'Lighting test',devices:[old,arch],cables:[],walls:[]})});
await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);





await page.evaluate(()=>audit.addDevice(audit.catalog.findIndex(t=>t.code==='CR3R-AL')));
const id=await page.evaluate(()=>audit.doc.devices.at(-1).id);
const caption=page.locator('[data-device-caption="'+id+'"]');
const position=page.locator('#deskProperties [data-desk-prop="labelPosition"]:checked');
assert.equal(await position.inputValue(),'bottom');
const bottom=await caption.getAttribute('y');
await page.locator('#deskProperties [data-desk-prop=labelPosition][value=top]').check();
assert.equal(await page.evaluate(id=>audit.doc.devices.find(d=>d.id===id).labelPosition,id),'top');
assert.ok(await caption.evaluate(n=>{const b=n.getBBox(),d=n.parentElement.querySelector('.body');return b.y+b.height<=Number(d.getAttribute('y'))}));
await page.locator('#undoBtn').click();assert.equal(await caption.getAttribute('y'),bottom);
await page.locator('#redoBtn').click();await page.evaluate(id=>audit.select(id),id);assert.ok(Number(await caption.getAttribute('y'))<Number(bottom));
await page.locator('#deskProperties [data-desk-prop="showLabel"]').uncheck();assert.equal(await caption.count(),0);assert.equal(await position.isDisabled(),true);
await page.locator('#deskProperties [data-desk-prop="showLabel"]').check();assert.equal(await position.inputValue(),'top');
await page.evaluate(()=>{const copy=JSON.parse(JSON.stringify(audit.doc));audit.prepareRoomImport(copy);const bad=JSON.parse(JSON.stringify(copy));bad.devices.at(-1).labelPosition='outside';let rejected=false;try{audit.prepareRoomImport(bad)}catch{rejected=true}if(!rejected)throw Error('Invalid labelPosition accepted');});
await page.screenshot({path:'../caption-position-top.png'});
await page.waitForTimeout(800);await page.reload();await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);
await page.evaluate(id=>audit.select(id),id);assert.equal(await position.inputValue(),'top');
const svg=await page.evaluate(()=>new XMLSerializer().serializeToString(document.getElementById('canvas')));assert.ok(svg.includes('data-device-caption="'+id+'"'));
await page.locator('#deskProperties [data-desk-prop=labelPosition][value=bottom]').check();assert.ok(Number(await caption.getAttribute('y'))>await page.evaluate(id=>{const d=audit.doc.devices.find(d=>d.id===id);return d.y+d.h/2},id));
await page.evaluate(id=>{const d=audit.doc.devices.find(d=>d.id===id);d.locked=true;document.activeElement.blur();audit.render()},id);assert.equal(await position.isDisabled(),true);
await page.evaluate(id=>{const d=audit.doc.devices.find(d=>d.id===id);d.locked=false;document.activeElement.blur();audit.render()},id);
await page.setViewportSize({width:390,height:844});await page.evaluate(()=>audit.propertyMenu());
const mobile=page.locator('#mobileProperties [data-desk-prop="labelPosition"]:checked');await page.locator('#mobileProperties [data-desk-prop=labelPosition][value=top]').check();assert.equal(await mobile.inputValue(),'top');
assert.deepEqual(errors,[]);console.log('PASS: three-command power switch top/bottom captions, Undo/Redo, visibility, validation, persistence, SVG, locks and mobile inspector.');

}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
