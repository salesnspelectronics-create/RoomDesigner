'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.setDefaultTimeout(10000);
let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');html=html.replace(main,main.slice(0,at)+"window.audit={get doc(){return doc},positionWorkspaceView,workspacePages,get catalog(){return catalog},addDevice,propertyMenu,render,effectiveArtwork,validateRoomDocument,prepareRoomImport,applyRoomImport,snapshot,performUndo,performRedo,portInfo,setTool,cableDisplayPoints,legacyCableDisplayPoints,normalizeCableGeometry,removeCableBendAt,selectLine(id){selection={kind:'wall',id};render()},selectCable(id){selection={kind:'cable',id};render()},get types(){return types},select(id){selection={kind:'device',id};render()}};"+main.slice(at));
await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
const arch={id:'arch',name:'تخت',kind:'bed',category:'architecture',x:180,y:180,w:100,h:100,ports:[],backgroundColor:'#FF0000',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10h80v80H10z" fill="none" stroke="#111"/></svg>'};const old={...arch,id:'old',name:'old',kind:'custom',category:'equipment',equipmentRelease:'nsp-equipment-260'};
await page.addInitScript(seed=>{if(!localStorage.getItem('seeded')){for(const[k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('seeded','1')}},{rd_storage_reset_physical_v1:'done',rd_connection_model:'physical-connections-1',rd_equipment_release:'nsp-equipment-260',rd_active_user:'Tester',rd_catalog:JSON.stringify([{kind:'custom',name:'Old equipment',ports:[],assetId:'nsp-1l'}]),rd_last:JSON.stringify({schema:'room-designer/v0.3',connectionModel:'physical-connections-1',equipmentRelease:'nsp-equipment-260',id:'test',name:'Lighting test',devices:[old,arch],cables:[],walls:[]})});
await page.goto('https://roomdesigner.test/',{timeout:30000});await page.waitForFunction(()=>window.__roomStartupReady&&window.audit);










const root=page.locator('#deskProperties'),prop=k=>root.locator('[data-desk-prop="'+k+'"]');
for(const [catalogId,model]of [['lighting-1l','negin'],['lighting-1l','azin'],['request-8r','almas'],['power-switch-3r','azin']]){
 await page.evaluate(({catalogId,model})=>audit.addDevice(audit.catalog.findIndex(t=>t.catalogId===catalogId&&t.lightingModel===model)),{catalogId,model});
 await prop('displayMode').selectOption('code');await prop('detailViewEnabled').check();assert.equal(await prop('showCode').isChecked(),true);
 await prop('displayMode').selectOption('iconic');for(const key of ['showCode','detailViewEnabled']){assert.equal(await prop(key).isChecked(),false);assert.equal(await prop(key).isDisabled(),true)}for(const key of ['codeFontSize','codeColor'])assert.equal(await prop(key).isVisible(),false);
 const az=model==='azin';assert.equal(await prop('borderVisible').isChecked(),az);assert.equal(await prop('borderVisible').isDisabled(),true);for(const key of ['borderWidth','borderColor'])assert.equal(await prop(key).isVisible(),az);if(az){assert.equal(await prop('borderColor').inputValue(),'#e9ca16');assert.equal(await prop('borderColor').isDisabled(),true);await page.screenshot({path:'work/readonly-azin-appearance.png',fullPage:true})}
 await prop('backgroundVisible').uncheck();assert.equal(await prop('backgroundColor').isVisible(),false);assert.equal(await prop('borderVisible').isChecked(),true);assert.equal(await prop('borderColor').isVisible(),true);assert.equal(await prop('borderColor').isDisabled(),az);
 await prop('displayMode').selectOption('real');for(const key of ['borderVisible','backgroundVisible','showCode','detailViewEnabled']){assert.equal(await prop(key).isChecked(),false);assert.equal(await prop(key).isDisabled(),true)}for(const key of ['borderWidth','borderColor','backgroundColor','codeFontSize','codeColor'])assert.equal(await prop(key).isVisible(),false);assert.equal(await prop('showLabel').isChecked(),true);await page.screenshot({path:'work/unsupported-real-appearance.png',fullPage:true});
 // Display state must not erase the saved choices for the applicable mode.
 assert.equal(await page.evaluate(()=>audit.doc.devices.at(-1).detailView.enabled),true);await prop('displayMode').selectOption('code');assert.equal(await prop('detailViewEnabled').isChecked(),true);assert.equal(await prop('showCode').isChecked(),true);assert.equal(await prop('backgroundVisible').isChecked(),true);assert.equal(await prop('codeFontSize').isVisible(),true);
 await prop('showCode').uncheck();await prop('displayMode').selectOption('iconic');await prop('displayMode').selectOption('code');assert.equal(await prop('showCode').isChecked(),false);assert.equal(await prop('codeFontSize').isVisible(),false);
 await page.locator('#canvas').focus();await page.evaluate(()=>{audit.doc.devices.at(-1).locked=true;audit.render()});assert.equal(await prop('backgroundVisible').isChecked(),true);assert.equal(await prop('backgroundColor').isVisible(),true);assert.equal(await prop('backgroundColor').isDisabled(),true);await page.evaluate(()=>{audit.doc.devices.at(-1).locked=false;audit.render()});
}
await page.evaluate(()=>audit.validateRoomDocument(audit.doc));assert.deepEqual(errors,[]);console.log('PASS: absent versus read-only appearance states across Negin/Almas/Azin and power switch, real/iconic/code modes, automatic fallback frames, detail toggle, lock state and retained user preferences.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
