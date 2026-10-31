'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.setDefaultTimeout(10000);
let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');html=html.replace(main,main.slice(0,at)+"window.audit={get doc(){return doc},positionWorkspaceView,workspacePages,get catalog(){return catalog},addDevice,propertyMenu,render,effectiveArtwork,validateRoomDocument,prepareRoomImport,applyRoomImport,snapshot,select(id){selection={kind:'device',id};render()}};"+main.slice(at));
await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
const arch={id:'arch',name:'تخت',kind:'bed',category:'architecture',x:180,y:180,w:100,h:100,ports:[],backgroundColor:'#FF0000',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10h80v80H10z" fill="none" stroke="#111"/></svg>'};const old={...arch,id:'old',name:'old',kind:'custom',category:'equipment',equipmentRelease:'nsp-equipment-260'};
await page.addInitScript(seed=>{if(!localStorage.getItem('seeded')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('seeded','1')}},{rd_storage_reset_physical_v1:'done',rd_connection_model:'physical-connections-1',rd_equipment_release:'nsp-equipment-260',rd_active_user:'Tester',rd_catalog:JSON.stringify([{kind:'custom',name:'Old equipment',ports:[],assetId:'nsp-1l'}]),rd_last:JSON.stringify({schema:'room-designer/v0.3',connectionModel:'physical-connections-1',equipmentRelease:'nsp-equipment-260',id:'test',name:'Lighting test',devices:[old,arch],cables:[],walls:[]})});
await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);



await page.evaluate(()=>{audit.addDevice(audit.catalog.findIndex(t=>t.kind==='lighting-switch'));audit.addDevice(audit.catalog.findIndex(t=>t.kind==='request-switch'));audit.doc.devices.forEach((d,i)=>Object.assign(d,{x:150+i*150,y:250,w:70,h:70}));audit.positionWorkspaceView(true);audit.render()});
const ids=await page.evaluate(()=>audit.doc.devices.map(d=>d.id));
async function clickItem(index,modifier){const point=await page.evaluate(id=>{const d=audit.doc.devices.find(d=>d.id===id),m=document.getElementById('canvas').getScreenCTM();return {x:d.x*m.a+m.e,y:d.y*m.d+m.f}},ids[index]);if(modifier)await page.keyboard.down(modifier);await page.mouse.click(point.x,point.y);if(modifier)await page.keyboard.up(modifier);}
const outlines=page.locator('[data-editor-handle="selection"][data-device-outline]');
await page.keyboard.press('Escape');await clickItem(0);assert.equal(await outlines.count(),1);
await clickItem(1,'Control');assert.equal(await outlines.count(),2);
await clickItem(2,'Control');assert.equal(await outlines.count(),3);
await clickItem(1,'Control');assert.equal(await outlines.count(),2);
await page.keyboard.press('Escape');await clickItem(0);await clickItem(1,'Shift');assert.equal(await outlines.count(),2);
await page.keyboard.press('Escape');await clickItem(0,'Control');await clickItem(1,'Control');assert.equal(await outlines.count(),2);
assert.deepEqual(errors,[]);console.log('PASS: plain first selection survives later Ctrl/Shift click, repeated additions and toggle removal; Ctrl-first selection still works.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
