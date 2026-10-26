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

 const scenario={schema:'room-designer/v0.3',connectionModel:'physical-connections-1',equipmentRelease:'nsp-equipment-260',id:'rotation',name:'Rotate test',devices:[{id:'a',kind:'custom',equipmentRelease:'nsp-equipment-260',name:'Source',x:240,y:240,w:120,h:80,ports:[{id:'pa',name:'Bus',type:'rs485_power',side:'right'}]},{id:'b',kind:'custom',equipmentRelease:'nsp-equipment-260',name:'Target',x:640,y:420,w:120,h:80,ports:[{id:'pb',name:'Bus',type:'rs485_power',side:'left'}]}],cables:[],walls:[],layers:[{id:'main',name:'Main',visible:true}],activeLayer:'main'};
 await page.evaluate(d=>routeAudit.reset(d),scenario);
 async function screen(p){return page.evaluate(p=>{const svg=document.getElementById('canvas'),q=svg.createSVGPoint();q.x=p.x;q.y=p.y;const r=q.matrixTransform(svg.getScreenCTM());return{x:r.x,y:r.y}},p)}
 async function click(p){const q=await screen(p);await page.mouse.click(q.x,q.y)}
 async function drag(a,b){const p=await screen(a),q=await screen(b);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(q.x,q.y,{steps:10});await page.mouse.up()}
 await click({x:300,y:240});await click({x:580,y:420});assert.equal(await page.evaluate(()=>routeAudit.doc.cables[0].routeMode),'direct');
 await click({x:440,y:330});await page.locator('#deskProp-routeMode').selectOption('broken');
 assert.equal(await page.evaluate(()=>routeAudit.doc.cables[0].routeMode),'broken');assert.equal(await page.locator('[data-cable-bend]').count(),1);
 const bend=await page.evaluate(()=>routeAudit.doc.cables[0].waypoints[0]);await drag(bend,{x:bend.x,y:bend.y+60});assert.ok((await page.evaluate(()=>routeAudit.doc.cables[0].waypoints[0].y))>bend.y+50);
 await page.evaluate(()=>{const c=routeAudit.doc.cables[0];c.waypoints=[{x:340,y:300},{x:360,y:300},{x:400,y:300},{x:460,y:360},{x:500,y:360}];c.offset=80;routeAudit.render()});
 await page.locator('#deskProp-routeMode').selectOption('orthogonal');const points=await page.evaluate(()=>routeAudit.points()[0]);assert.equal(await page.evaluate(()=>routeAudit.doc.cables[0].routeMode),'orthogonal');
 for(let i=1;i<points.length;i++){assert.ok(points[i].x===points[i-1].x||points[i].y===points[i-1].y);assert.equal(R.segmentBlocked(points[i-1],points[i],scenario.devices.map(d=>R.bounds(d,0))),false)}
 for(let i=2;i<points.length;i++){const a=points[i-2],b=points[i-1],c=points[i];assert.notEqual((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x),0,'converted orthogonal path retains only necessary corners');}
 const orthState=await page.evaluate(()=>routeAudit.doc.cables[0]);assert.deepEqual(orthState.waypoints,points.slice(1,-1));assert.equal(orthState.offset,0);
 await page.locator('#deskProp-routeMode').selectOption('direct');assert.equal((await page.evaluate(()=>routeAudit.points()[0])).length,2);
 assert.deepEqual(await page.evaluate(()=>routeAudit.doc.cables[0].waypoints),[]);assert.equal(await page.locator('[data-cable-bend]').count(),0);assert.equal(await page.evaluate(()=>routeAudit.doc.cables[0].autoRouting),false);
 // Modal offers the same conversion, preserving cable identity, type and endpoints.
 const identity=await page.evaluate(()=>{const c=routeAudit.doc.cables[0];return JSON.stringify({id:c.id,a:c.a,b:c.b,type:c.type})});
 await page.evaluate(()=>routeAudit.propertyMenu());await page.locator('#cRouteMode').selectOption('broken');await page.locator('[data-act="saveCable"]').click();
 assert.equal(await page.evaluate(()=>routeAudit.doc.cables[0].routeMode),'broken');assert.equal(await page.evaluate(()=>{const c=routeAudit.doc.cables[0];return JSON.stringify({id:c.id,a:c.a,b:c.b,type:c.type})}),identity);
 // Rotate a device by an arbitrary angle using its visible handle.
 await page.evaluate(()=>routeAudit.selected={kind:'device',id:'a'});
 let handle=page.locator('[data-rotate-kind="device"] circle');let anchor=await handle.evaluate(n=>({x:Number(n.getAttribute('cx')),y:Number(n.getAttribute('cy'))}));
 const center={x:240,y:240},angle=37*Math.PI/180,dx=anchor.x-center.x,dy=anchor.y-center.y,target={x:center.x+dx*Math.cos(angle)-dy*Math.sin(angle),y:center.y+dx*Math.sin(angle)+dy*Math.cos(angle)};
 await drag(anchor,target);assert.ok(Math.abs((await page.evaluate(()=>routeAudit.doc.devices[0].rotation))-37)<.1);
 await page.keyboard.press('Control+z');assert.equal(await page.evaluate(()=>Number(routeAudit.doc.devices[0].rotation)||0),0);await page.keyboard.press('Control+Shift+z');assert.ok(Math.abs((await page.evaluate(()=>routeAudit.doc.devices[0].rotation))-37)<.1);
 await page.evaluate(()=>routeAudit.selected={kind:'device',id:'a'});
 handle=page.locator('[data-rotate-kind="device"] circle');anchor=await handle.evaluate(n=>({x:Number(n.getAttribute('cx')),y:Number(n.getAttribute('cy'))}));
 const snapAngle=13*Math.PI/180,sdx=anchor.x-center.x,sdy=anchor.y-center.y;
 await page.keyboard.down('Shift');await drag(anchor,{x:center.x+sdx*Math.cos(snapAngle)-sdy*Math.sin(snapAngle),y:center.y+sdx*Math.sin(snapAngle)+sdy*Math.cos(snapAngle)});await page.keyboard.up('Shift');
 assert.equal(await page.evaluate(()=>routeAudit.doc.devices[0].rotation),45);await page.keyboard.press('Control+z');
 await page.evaluate(()=>{routeAudit.doc.devices[0].locked=true;routeAudit.render()});assert.equal(await page.locator('[data-rotate-kind="device"]').count(),0);
 await page.evaluate(()=>{routeAudit.doc.devices[0].locked=false;routeAudit.render()});
 // Cable text rotates separately and dragging the rotated text remains in world coordinates.
 await page.evaluate(()=>routeAudit.selected={kind:'cable',id:routeAudit.doc.cables[0].id});
 const geometry=JSON.stringify(await page.evaluate(()=>routeAudit.points()[0]));handle=page.locator('[data-rotate-kind="label"] circle');anchor=await handle.evaluate(n=>({x:Number(n.getAttribute('cx')),y:Number(n.getAttribute('cy'))}));
 const label=page.locator('[data-cable-label]'),pivot=await label.evaluate(n=>({x:Number(n.getAttribute('x')),y:Number(n.getAttribute('y'))}));
 const a=-52*Math.PI/180,lx=anchor.x-pivot.x,ly=anchor.y-pivot.y;
 await drag(anchor,{x:pivot.x+lx*Math.cos(a)-ly*Math.sin(a),y:pivot.y+lx*Math.sin(a)+ly*Math.cos(a)});
 assert.ok(Math.abs((await page.evaluate(()=>routeAudit.doc.cables[0].labelRotation))-308)<.1);assert.equal(JSON.stringify(await page.evaluate(()=>routeAudit.points()[0])),geometry);assert.ok(Math.abs(Number((await label.getAttribute('transform')).match(/rotate\(([^ ]+)/)[1])-308)<.1);
 const pos=await label.evaluate(n=>({x:Number(n.getAttribute('x')),y:Number(n.getAttribute('y'))}));await drag(pos,{x:pos.x+30,y:pos.y-20});{const off=await page.evaluate(()=>routeAudit.doc.cables[0].labelOffset);assert.ok(Math.abs(off.x-30)<.1&&Math.abs(off.y+20)<.1)};assert.equal(JSON.stringify(await page.evaluate(()=>routeAudit.points()[0])),geometry);
 const dxf=await page.evaluate(()=>routeAudit.buildDXF());assert.ok([...dxf.matchAll(/50\n([^\n]+)/g)].some(m=>Math.abs(Number(m[1])+308)<.1),'DXF retains text angle');
 const saved=await page.evaluate(()=>{const c=routeAudit.doc.cables[0];return {rotation:routeAudit.doc.devices[0].rotation,labelRotation:c.labelRotation,labelOffset:c.labelOffset,mode:c.routeMode}});
 await page.evaluate(()=>routeAudit.applyRoomImport(routeAudit.prepareRoomImport({doc:JSON.parse(JSON.stringify(routeAudit.doc))})));assert.deepEqual(await page.evaluate(()=>{const c=routeAudit.doc.cables[0];return {rotation:routeAudit.doc.devices[0].rotation,labelRotation:c.labelRotation,labelOffset:c.labelOffset,mode:c.routeMode}}),saved);
 const exported=await page.evaluate(()=>routeAudit.captureExport());assert.ok(!exported.includes('↻'));assert.ok(exported.includes('rotate('));
 const printArea=await page.evaluate(()=>routeAudit.drawingPrintBounds());assert.ok(printArea.w>0&&printArea.h>0);
 await page.waitForTimeout(650);await page.reload();await page.waitForFunction(()=>window.__roomStartupReady&&window.routeAudit);
 assert.deepEqual(await page.evaluate(()=>{const c=routeAudit.doc.cables[0];return {rotation:routeAudit.doc.devices[0].rotation,labelRotation:c.labelRotation,labelOffset:c.labelOffset,mode:c.routeMode}}),saved);
 if(await page.locator('#sheet.show').count())await page.locator('#closeSheet').click();
 await page.evaluate(()=>routeAudit.selected={kind:'cable',id:routeAudit.doc.cables[0].id});
 await page.screenshot({path:'work/rotation-controls.png'});
 assert.deepEqual(errors,[]);console.log('PASS: direct/free/orthogonal conversions in desktop and modal, free bend editing, safe orthogonal conversion, arbitrary device and independent cable-text drag rotation, rotated text dragging, Undo/Redo, DXF and import persistence.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
