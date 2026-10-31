'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.setDefaultTimeout(10000);
let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');html=html.replace(main,main.slice(0,at)+"window.audit={get doc(){return doc},get catalog(){return catalog},addDevice,propertyMenu,render,effectiveArtwork,validateRoomDocument,prepareRoomImport,applyRoomImport,snapshot,normalizeSvgReferences,libraryAsset,saveAuto,select(id){selection={kind:'device',id};render()}};"+main.slice(at));
await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
const arch={id:'arch',name:'تخت',kind:'bed',category:'architecture',x:180,y:180,w:100,h:100,ports:[],backgroundColor:'#FF0000',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10h80v80H10z" fill="none" stroke="#111"/></svg>'};const old={...arch,id:'old',name:'old',kind:'custom',category:'equipment',equipmentRelease:'nsp-equipment-260'};
await page.addInitScript(seed=>{if(!localStorage.getItem('seeded')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('seeded','1')}},{rd_storage_reset_physical_v1:'done',rd_connection_model:'physical-connections-1',rd_equipment_release:'nsp-equipment-260',rd_active_user:'Tester',rd_catalog:JSON.stringify([{kind:'custom',name:'Old equipment',ports:[],assetId:'nsp-1l'}]),rd_last:JSON.stringify({schema:'room-designer/v0.3',connectionModel:'physical-connections-1',equipmentRelease:'nsp-equipment-260',id:'test',name:'Lighting test',devices:[old,arch],cables:[],walls:[]})});
await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);


const root=page.locator('#deskProperties');assert.equal(await page.locator('#deskLeft summary').first().evaluate(n=>getComputedStyle(n,'::before').borderRightWidth),'2px');
assert.deepEqual(await page.evaluate(()=>audit.catalog.filter(t=>t.kind==='lighting-switch').map(t=>t.code)),['1L','2L','3L','4L','6L','7L','8L']);
for(const n of [1,2,3,4,6,8]){
 await page.evaluate(n=>audit.addDevice(audit.catalog.findIndex(t=>t.kind==='lighting-switch'&&t.gangCount===n)),n);
 assert.equal(await root.locator('[data-live-prop="gangCount"]').count(),0);
 assert.equal(await root.locator('[data-inspector-tab="lighting"]').textContent(),'اختصاصی');
 assert.equal(await root.locator('p[dir="ltr"]').count(),0);const swatch=await root.locator('[data-desk-prop="codeColor"]').boundingBox();assert.ok(swatch.width>swatch.height&&swatch.width<70);assert.equal(await root.locator('[data-desk-prop="showCode"]').isDisabled(),true);
 await root.locator('[data-desk-prop="displayMode"]').selectOption('code');
 let state=await page.evaluate(()=>{const d=audit.doc.devices.at(-1);return {code:d.code,mode:d.displayMode,art:audit.effectiveArtwork(d),ratio:d.w/d.h}});
 assert.equal(state.code,n+'L-NE');assert.equal(state.mode,'code');assert.ok(state.art.includes('>'+n+'L-NE</text>'));assert.equal((state.art.match(/<svg /g)||[]).length,1);
 assert.equal(await root.locator('[data-desk-prop="codeColor"]').isEnabled(),true);assert.equal(await root.locator('[data-inspector-tab="lighting"]').count(),1);
 await root.locator('[data-desk-prop="displayMode"]').selectOption('real');
 for(const [w,h] of [[180,35],[35,180]]){
  await root.locator('[data-desk-prop="w"]').fill(String(w));await root.locator('[data-desk-prop="h"]').fill(String(h));
  const rendered=await page.evaluate(()=>{const d=audit.doc.devices.at(-1),image=document.querySelector('g[data-kind="device"][data-id="'+d.id+'"] image');return {w:Number(image.getAttribute('width')),h:Number(image.getAttribute('height')),aspect:image.getAttribute('preserveAspectRatio'),inner:decodeURIComponent(image.getAttribute('href').split(',')[1])}});
  assert.ok(Math.abs(rendered.w-w)<1e-8);assert.ok(Math.abs(rendered.h-h)<1e-8);assert.equal(rendered.aspect,'none');assert.ok(rendered.inner.includes('preserveAspectRatio="none"'));
 }

 for(const key of ['backgroundColor','borderColor','borderVisible','backgroundVisible','showCode','codeColor'])assert.equal(await root.locator('[data-desk-prop="'+key+'"]').isDisabled(),true);
 await root.locator('[data-inspector-tab="lighting"]').click();assert.ok((await root.locator('#lightingProperties').textContent()).includes('موردی وجود ندارد'));await root.locator('[data-inspector-tab="general"]').click();
 assert.equal(await page.evaluate(()=>{const d=audit.doc.devices.at(-1);return audit.effectiveArtwork(d).includes('<path')}),true);
 assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).realAssetId),'nsp-'+n+'l');
 await root.locator('[data-inspector-tab="general"]').click();
 await root.locator('[data-desk-prop="displayMode"]').selectOption('iconic');
 await root.locator('[data-inspector-tab="lighting"]').click();assert.equal(await root.locator('[data-lighting-picker]').count(),n);
 await root.locator('[data-inspector-tab="general"]').click();
}
await root.locator('[data-desk-prop="displayMode"]').selectOption('code');
await root.locator('[data-desk-prop="codeColor"]').evaluate(n=>{n.value='#ff6600';n.dispatchEvent(new Event('input',{bubbles:true}))});
assert.ok(await page.evaluate(()=>audit.effectiveArtwork(audit.doc.devices.at(-1)).includes('#ff6600')));
// Imported inline artwork and originals are promoted once; nested revisions carry IDs only.
const refs=await page.evaluate(()=>{
 const raw='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path d="M0 0h30v20H0z" fill="#12abcd"/></svg>';
 const d={svg:raw,svgOriginal:raw},v={devices:[d,{svg:raw}],revisions:[{snapshot:{devices:[{svg:raw}]}}]};audit.normalizeSvgReferences(v);return {v,raw:audit.libraryAsset(d.svgAssetId),draft:localStorage.getItem('rd_svg_drafts')};
});assert.equal(refs.v.devices[0].svgAssetId,refs.v.devices[1].svgAssetId);assert.equal(refs.v.devices[0].svgOriginalAssetId,refs.v.devices[0].svgAssetId);assert.ok(!JSON.stringify(refs.v).includes('<svg'));assert.ok(refs.raw.includes('#12abcd'));assert.ok(refs.draft.includes('#12abcd'));
await page.evaluate(()=>audit.saveAuto());
assert.equal(await page.evaluate(()=>localStorage.getItem('rd_last').includes('<svg')),false);
assert.equal(await page.evaluate(()=>JSON.stringify(audit.snapshot(audit.doc)).includes('<svg')),false);
await root.locator('[data-desk-prop="showCode"]').uncheck();assert.ok(!(await page.evaluate(()=>audit.effectiveArtwork(audit.doc.devices.at(-1)))).includes('<text'));await root.locator('[data-desk-prop="showCode"]').check();await page.screenshot({path:'work/lighting-display-code.png'});
await root.locator('[data-desk-prop="displayMode"]').selectOption('real');await page.screenshot({path:'work/lighting-display-real.png'});
await page.evaluate(()=>audit.saveAuto());await page.reload();await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);
assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).displayMode),'real');assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).code),'8L-NE');
assert.equal(await page.locator('g[data-kind="device"] image').count()>0,true);
assert.deepEqual(errors,[]);console.log('PASS: all six variants in code/iconic/real modes, code color, conditional controls, original SVG references, deduplicated imported assets and nested revisions, reference-only saved document and reload.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
