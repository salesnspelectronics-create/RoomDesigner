'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright'),R=require('../cable-routing.js');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.setDefaultTimeout(9000);page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.on('dialog',d=>d.accept());
 let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');
 html=html.replace(main,main.slice(0,at)+`window.routeAudit={get doc(){return doc},get mode(){return cableMode},get history(){return history},get bends(){return routePoints.map(p=>({x:p.x,y:p.y}))},reset(d){clearPointerState();doc=structuredClone(d);selection=null;multiSelection=null;history=[];redoHistory=[];setTool('select');updateHistoryControls()},set selected(v){selection=v;multiSelection=null;render()},propertyMenu,buildDXF,drawingPrintBounds,captureExport(){const old=file;let output;try{file=data=>output=data;downloadDrawingSvg();return output}finally{file=old}},changeCableRouteMode,setTool,render,portInfo,cableDisplayPoints,cablePathPoints,portSide,draftCablePreview,prepareRoomImport,applyRoomImport,smartRouteAllCables,optimizeConnectedPortOrder,performUndo,performRedo,points(){return doc.cables.map(c=>cableDisplayPoints(c,portInfo(device(c.a.dev),c.a.port),portInfo(device(c.b.dev),c.b.port)))}};`+main.slice(at));
 await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
 await page.addInitScript(()=>{localStorage.setItem('rd_storage_reset_physical_v1','done');localStorage.setItem('rd_active_user','Tester');localStorage.setItem('rd_equipment_release','nsp-equipment-260');localStorage.setItem('rd_connection_model','physical-connections-1')});
 await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.routeAudit);


 const base={schema:'room-designer/v0.3',connectionModel:'physical-connections-1',equipmentRelease:'nsp-equipment-260',id:'bend',name:'Bend test',devices:[{id:'a',kind:'custom',equipmentRelease:'nsp-equipment-260',name:'A',x:100,y:300,w:120,h:80,ports:[{id:'pa',type:'rs485_power',name:'Bus',side:'right'}]},{id:'b',kind:'custom',equipmentRelease:'nsp-equipment-260',name:'B',x:700,y:300,w:120,h:80,ports:[{id:'pb',type:'rs485_power',name:'Bus',side:'left'}]}],cables:[],walls:[],layers:[{id:'main',name:'Main',visible:true}],activeLayer:'main'};
 async function reset(mode,waypoints=[],autoRouting=false,locked=false){const d=structuredClone(base);d.cables=[{id:'wire',a:{dev:'a',port:'pa'},b:{dev:'b',port:'pb'},type:'rs485_power',name:'Bus',routeMode:mode,waypoints,autoRouting,locked}];await page.evaluate(d=>routeAudit.reset(d),d)}
 async function screen(p){return page.evaluate(p=>{const s=document.getElementById('canvas'),q=s.createSVGPoint();q.x=p.x;q.y=p.y;const r=q.matrixTransform(s.getScreenCTM());return{x:r.x,y:r.y}},p)}
 async function context(p){const q=await screen(p);await page.mouse.click(q.x,q.y,{button:'right'});await page.locator('#rdObjectContextMenu').waitFor()}
 async function add(p){await context(p);await page.locator('[data-context-action="addBend"]').click()}
 async function drag(a,b){const p=await screen(a),q=await screen(b);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(q.x,q.y,{steps:6});await page.mouse.up()}
 await reset('direct');await add({x:400,y:300});
 let c=await page.evaluate(()=>routeAudit.doc.cables[0]);assert.equal(c.routeMode,'broken');assert.deepEqual(c.waypoints.map(p=>({x:Math.round(p.x),y:Math.round(p.y)})),[{x:400,y:300}]);assert.equal(c.autoRouting,false);assert.equal(await page.locator('[data-cable-bend]').count(),1);
 await drag({x:400,y:300},{x:400,y:370});assert.ok(Math.abs((await page.evaluate(()=>routeAudit.doc.cables[0].waypoints[0].y))-370)<.1);
 await page.keyboard.press('Control+z');assert.deepEqual(await page.evaluate(()=>routeAudit.doc.cables[0].waypoints.map(p=>({x:Math.round(p.x),y:Math.round(p.y)}))),[{x:400,y:300}]);await page.keyboard.press('Control+z');assert.equal(await page.evaluate(()=>routeAudit.doc.cables[0].routeMode),'direct');await page.keyboard.press('Control+Shift+z');assert.equal(await page.evaluate(()=>routeAudit.doc.cables[0].routeMode),'broken');
 await reset('broken',[{x:240,y:200},{x:500,y:200}]);await add({x:360,y:202});
 c=await page.evaluate(()=>routeAudit.doc.cables[0]);assert.deepEqual(c.waypoints.map(p=>({x:Math.round(p.x),y:Math.round(p.y)})),[{x:240,y:200},{x:360,y:200},{x:500,y:200}]);
 await drag({x:360,y:200},{x:360,y:150});assert.ok(Math.abs((await page.evaluate(()=>routeAudit.doc.cables[0].waypoints[1].y))-150)<.1);
 const beforeRemoval=await page.evaluate(()=>JSON.parse(JSON.stringify(routeAudit.doc.cables[0])));
 await context({x:360,y:150});await page.locator('[data-context-action="removeBend"]').click();
 let removed=await page.evaluate(()=>routeAudit.doc.cables[0]);assert.deepEqual(removed.waypoints,beforeRemoval.waypoints.filter((_,i)=>i!==1));assert.deepEqual(removed.a,beforeRemoval.a);assert.deepEqual(removed.b,beforeRemoval.b);assert.equal(removed.id,beforeRemoval.id);
 await page.keyboard.press('Control+z');assert.deepEqual(await page.evaluate(()=>routeAudit.doc.cables[0].waypoints),beforeRemoval.waypoints);await page.keyboard.press('Control+Shift+z');assert.equal((await page.evaluate(()=>routeAudit.doc.cables[0].waypoints)).length,2);
 // Materialize an automatic orthogonal route before inserting a persistent anchor.
 await reset('orthogonal',[],true);const initial=await page.evaluate(()=>routeAudit.points()[0]);await add({x:400,y:300});c=await page.evaluate(()=>routeAudit.doc.cables[0]);assert.equal(c.routeMode,'orthogonal');assert.equal(c.autoRouting,false);assert.deepEqual(c.waypoints.map(p=>({x:Math.round(p.x),y:Math.round(p.y)})),[{x:400,y:300}]);
 await drag({x:400,y:300},{x:400,y:360});const pts=await page.evaluate(()=>routeAudit.points()[0]);assert.deepEqual(pts[0],initial[0]);assert.deepEqual(pts.at(-1),initial.at(-1));assert.ok(pts.some(p=>Math.abs(p.x-400)<.1&&Math.abs(p.y-360)<.1));
 for(let i=1;i<pts.length;i++)assert.ok(Math.abs(pts[i].x-pts[i-1].x)<.1||Math.abs(pts[i].y-pts[i-1].y)<.1);
 for(let i=2;i<pts.length;i++){const a=pts[i-2],b=pts[i-1],c=pts[i];assert.ok((b.x-a.x)*(c.x-b.x)+(b.y-a.y)*(c.y-b.y)>=0,'no reverse spike after dragging the new orthogonal anchor');}
 await add({x:400,y:360});assert.deepEqual(await page.evaluate(()=>routeAudit.points()[0]),pts,'existing anchor does not duplicate');
 await page.waitForTimeout(650);await page.reload();await page.waitForFunction(()=>window.__roomStartupReady&&window.routeAudit);assert.deepEqual(await page.evaluate(()=>routeAudit.points()[0]),pts);
 await context({x:400,y:360});await page.locator('[data-context-action="removeBend"]').click();
 const orthRemoved=await page.evaluate(()=>routeAudit.points()[0]);assert.equal(orthRemoved.length,pts.length-1);assert.ok(!orthRemoved.some(p=>Math.abs(p.x-400)<1&&Math.abs(p.y-360)<1));assert.equal(await page.evaluate(()=>routeAudit.doc.cables[0].routeMode),'orthogonal');
 // Removing an essential corner must not simply recreate that same corner.
 await reset('orthogonal',[{x:240,y:300},{x:240,y:180},{x:500,y:180},{x:500,y:300}]);
 await context({x:240,y:180});await page.locator('[data-context-action="removeBend"]').click();
 const cornerRemoved=await page.evaluate(()=>routeAudit.points()[0]);assert.ok(!cornerRemoved.some(p=>p.x===240&&p.y===180));for(let i=1;i<cornerRemoved.length;i++)assert.ok(cornerRemoved[i].x===cornerRemoved[i-1].x||cornerRemoved[i].y===cornerRemoved[i-1].y);
 await page.waitForTimeout(650);await page.reload();await page.waitForFunction(()=>window.__roomStartupReady&&window.routeAudit);assert.deepEqual(await page.evaluate(()=>routeAudit.points()[0]),cornerRemoved);
 await reset('broken',[{x:400,y:300}],false,true);await context({x:400,y:300});assert.equal(await page.locator('[data-context-action="removeBend"]').count(),0);await page.keyboard.press('Escape');
 await reset('direct',[],false,true);await context({x:400,y:300});assert.equal(await page.locator('[data-context-action="addBend"]').count(),0);
 await page.keyboard.press('Escape');await reset('direct');await page.evaluate(()=>routeAudit.selected={kind:'cable',id:'wire'});const q=await screen({x:400,y:300});await page.mouse.dblclick(q.x,q.y);assert.equal(await page.evaluate(()=>routeAudit.doc.cables[0].routeMode),'broken');assert.equal((await page.evaluate(()=>routeAudit.doc.cables[0].waypoints)).length,1);
 assert.deepEqual(errors,[]);console.log('PASS: actual context-menu insertion on direct/free/automatic orthogonal cables at pointer position, draggable anchors, clean orthogonal bends, endpoint retention, Undo/Redo, reload, duplicate prevention, locks, right-click removal, orthogonal corner removal and double-click parity.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
