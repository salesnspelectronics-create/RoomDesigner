'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.setDefaultTimeout(10000);
let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');html=html.replace(main,main.slice(0,at)+"window.audit={get doc(){return doc},get catalog(){return catalog},addDevice,propertyMenu,render,effectiveArtwork,validateRoomDocument,prepareRoomImport,applyRoomImport,snapshot,select(id){selection={kind:'device',id};render()}};"+main.slice(at));
await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
const arch={id:'arch',name:'تخت',kind:'bed',category:'architecture',x:180,y:180,w:100,h:100,ports:[],backgroundColor:'#FF0000',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10h80v80H10z" fill="none" stroke="#111"/></svg>'};const old={...arch,id:'old',name:'old',kind:'custom',category:'equipment',equipmentRelease:'nsp-equipment-260'};
await page.addInitScript(seed=>{if(!localStorage.getItem('seeded')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('seeded','1')}},{rd_storage_reset_physical_v1:'done',rd_connection_model:'physical-connections-1',rd_equipment_release:'nsp-equipment-260',rd_shortcuts:JSON.stringify([{id:'prior',name:'Prior shortcut',data:{devices:[arch],cables:[],walls:[]}}]),rd_active_user:'Tester',rd_catalog:JSON.stringify([{kind:'custom',name:'Old equipment',ports:[],assetId:'nsp-1l'}]),rd_last:JSON.stringify({schema:'room-designer/v0.3',connectionModel:'physical-connections-1',equipmentRelease:'nsp-equipment-260',id:'test',name:'Lighting test',devices:[old,arch],cables:[],walls:[]})});
await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);


const tools=page.locator('#deskLeft');assert.equal(await page.evaluate(()=>localStorage.getItem('rd_shortcuts')),'[]');
assert.equal(await tools.locator('summary button,[data-tool-add],[data-desk-cable]').count(),0);
assert.equal(await tools.locator('[data-section="cabling"]').count(),0);
assert.equal(await tools.locator('[data-section="equipment"] summary').textContent(),'روشنایی');
assert.equal(await tools.locator('[data-section="shortcuts"] .tool-card').count(),0);
for(const id of ['architecture','equipment','loads'])await tools.locator('[data-section="'+id+'"] summary').click();
const card=tools.locator('[data-section="equipment"] .tool-card').first();
assert.equal(await card.locator('span').count(),0);
assert.equal(await tools.locator('[data-section="equipment"] .tool-grid').evaluate(n=>getComputedStyle(n).gridTemplateColumns.split(' ').length),4);
assert.equal(await tools.locator('[data-section="equipment"]').evaluate(n=>getComputedStyle(n).borderTopWidth),'0px');
assert.equal(await card.locator('img').evaluate(async n=>{await n.decode();return n.naturalWidth>0}),true);
const rect=tools.locator('[data-desk-arch="rectangle"]');assert.equal(await rect.locator('img').evaluate(async n=>{await n.decode();return n.naturalWidth>0}),true);
await rect.hover();await page.waitForTimeout(700);assert.equal(await page.locator('#toolSymbolPreview p').textContent(),'مستطیل');
const preview=await page.locator('#toolSymbolPreview').boundingBox();assert.ok(preview.width>180);assert.ok(preview.x>=0);
await card.hover();await page.waitForTimeout(300);assert.equal(await page.locator('#toolSymbolPreview small').textContent(),'1L');
await page.screenshot({path:'work/compact-toolbox-preview.png'});
await card.click();assert.equal(await page.locator('#toolSymbolPreview').count(),0);assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).code),'1L-NE');
await tools.locator('#deskToolSearch').fill('8L');assert.equal(await tools.locator('[data-section="equipment"] .tool-card:visible').count(),1);assert.equal(await tools.locator('[data-section="equipment"] .tool-card:visible').getAttribute('data-symbol-code'),'8L');
await tools.locator('#deskToolSearch').fill('');
const load=tools.locator('[data-section="loads"] .tool-card').first();
const source=await load.locator('img').getAttribute('src');const raw=decodeURIComponent(source.split(',')[1]);assert.ok(!raw.includes('<rect'));assert.ok(raw.includes('#e1edf5'));
await page.mouse.move(700,500);await rect.focus();assert.equal(await page.locator('#toolSymbolPreview').count(),1);await page.keyboard.press('Escape');assert.equal(await page.locator('#toolSymbolPreview').count(),0);
assert.deepEqual(errors,[]);console.log('PASS: compact borderless categories, four-column icon-only palette, no plus/cabling, empty shortcuts, bright transparent symbols, large hover/focus preview, search by code, and insertion.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
