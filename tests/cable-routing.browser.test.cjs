'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright'),R=require('../cable-routing.js');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.setDefaultTimeout(9000);page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.on('dialog',d=>d.accept());
 let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');
 html=html.replace(main,main.slice(0,at)+`window.routeAudit={get doc(){return doc},get mode(){return cableMode},get history(){return history},get bends(){return routePoints.map(p=>({x:p.x,y:p.y}))},reset(d){clearPointerState();doc=structuredClone(d);selection=null;multiSelection=null;history=[];redoHistory=[];setTool('select');updateHistoryControls()},setTool,render,portInfo,cableDisplayPoints,cablePathPoints,portSide,draftCablePreview,prepareRoomImport,applyRoomImport,smartRouteAllCables,optimizeConnectedPortOrder,performUndo,performRedo,points(){return doc.cables.map(c=>cableDisplayPoints(c,portInfo(device(c.a.dev),c.a.port),portInfo(device(c.b.dev),c.b.port)))}};`+main.slice(at));
 await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
 await page.addInitScript(()=>{localStorage.setItem('rd_storage_reset_physical_v1','done');localStorage.setItem('rd_active_user','Tester');localStorage.setItem('rd_equipment_release','nsp-equipment-260');localStorage.setItem('rd_connection_model','physical-connections-1')});
 await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.routeAudit);
 const scenario=await page.evaluate(()=>{const main=RoomEquipment.defaults().find(t=>t.code==='AC12CH'),loads=RoomConnections.consumers();return {schema:'room-designer/v0.3',connectionModel:RoomConnections.version,equipmentRelease:RoomEquipment.release,id:'route-test',name:'Routing test',devices:[{...main,id:'main',x:340,y:180,w:340,h:130,ports:main.ports.map(p=>({...p,catalogPortId:p.id,id:'main-'+p.id}))},{...loads[0],id:'lamp',x:400,y:540,w:60,h:60,ports:[{id:'lamp-in',name:'DO',type:'do',side:'top'}]},{...loads[2],id:'blocker',x:380,y:380,w:100,h:100,ports:[{id:'fan-in',name:'DO',type:'do',side:'top'}]}],cables:[],walls:[],layers:[{id:'main',name:'Main',visible:true}],activeLayer:'main',revisions:[]}});
 await page.locator('#deskLeft [data-section="cabling"]>summary').click();
 async function reset(){await page.evaluate(d=>routeAudit.reset(d),scenario)}
 async function mode(name){await page.locator('[data-desk-cable="'+name+'"]').click()}
 async function screen(p){return page.evaluate(p=>{const svg=document.getElementById('canvas'),q=svg.createSVGPoint();q.x=p.x;q.y=p.y;const r=q.matrixTransform(svg.getScreenCTM());return{x:r.x,y:r.y}},p)}
 async function port(id,index){return page.evaluate(({id,index})=>{const d=routeAudit.doc.devices.find(d=>d.id===id),p=routeAudit.portInfo(d,d.ports[index].id);return {x:p.x,y:p.y}}, {id,index})}
 async function click(p){const q=await screen(p);await page.mouse.click(q.x,q.y)}
 async function drag(a,b){const p=await screen(a),q=await screen(b);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(q.x,q.y,{steps:6});await page.mouse.up()}
 // Reported top-to-top bus connection: Smart Ports must not leave an exit-lead spike.
 await reset();
 const smart=await page.evaluate(()=>{
  const d=routeAudit.doc,m=d.devices[0],t=d.devices[1];d.devices=[m,t];
  Object.assign(m,{x:154,y:276,w:180,h:120,ports:[{id:'bus-a',name:'Bus',type:'rs485_power',side:'top'}]});
  Object.assign(t,{x:638,y:270,w:360,h:240,ports:[{id:'bus-b',name:'Bus',type:'rs485_power',side:'top'}]});
  d.cables=[{id:'smart-spike',a:{dev:m.id,port:'bus-a'},b:{dev:t.id,port:'bus-b'},type:'rs485_power',routeMode:'broken',autoRouting:false,waypoints:[{x:154,y:48},{x:638,y:48}]}];
  routeAudit.optimizeConnectedPortOrder();routeAudit.render();return {points:routeAudit.points()[0],devices:d.devices};
 });
 assert.equal(smart.points.length,4,'Smart Ports leaves exactly two corners, no endpoint spike');
 for(let i=1;i<smart.points.length;i++)assert.equal(R.segmentBlocked(smart.points[i-1],smart.points[i],smart.devices.map(d=>R.bounds(d,0))),false);
 await reset();const a=await port('main',6),b=await port('lamp',0);
 // A true direct cable keeps its mode, has no bends, and cannot be reshaped by dragging.
 await mode('direct');await click(a);await click(b);
 let cable=await page.evaluate(()=>routeAudit.doc.cables[0]);assert.equal(cable.routeMode,'direct');assert.deepEqual(cable.waypoints,[]);assert.equal((await page.evaluate(()=>routeAudit.points()[0])).length,2);
 const directBefore=JSON.stringify(cable),pick={x:a.x+(b.x-a.x)*.16,y:a.y+(b.y-a.y)*.16};await click(pick);await drag(pick,{x:pick.x+50,y:pick.y+30});assert.equal(JSON.stringify(await page.evaluate(()=>routeAudit.doc.cables[0])),directBefore);assert.equal(await page.locator('[data-cable-bend]').count(),0);
 // Quick-connect from Select respects the selected routing mode.
 await reset();await mode('direct');await page.evaluate(()=>routeAudit.setTool('select'));await click(a);assert.equal(await page.evaluate(()=>routeAudit.mode),'direct');await click(b);assert.equal(await page.evaluate(()=>routeAudit.doc.cables[0].routeMode),'direct');
 // Free drawing retains both user bends after completion, after a grip move and after dragging a leg.
 await reset();await mode('broken');const p1={x:750,y:300},p2={x:650,y:650};await click(a);await click(p1);await click(p2);const captured=await page.evaluate(()=>routeAudit.bends);await click(b);
 assert.deepEqual(await page.evaluate(()=>routeAudit.doc.cables[0].waypoints),captured);assert.deepEqual(await page.evaluate(()=>routeAudit.points()[0]),[a,...captured,b]);
 const middle={x:(p1.x+p2.x)/2,y:(p1.y+p2.y)/2};await click(middle);assert.equal(await page.locator('[data-cable-bend]').count(),2);
 const moved={x:790,y:280};await drag(p1,moved);let bends=await page.evaluate(()=>routeAudit.doc.cables[0].waypoints);assert.ok(Math.hypot(bends[0].x-moved.x,bends[0].y-moved.y)<1);assert.deepEqual(bends[1],captured[1]);
 const leg={x:(moved.x+p2.x)/2,y:(moved.y+p2.y)/2};await drag(leg,{x:leg.x-25,y:leg.y+30});bends=await page.evaluate(()=>routeAudit.doc.cables[0].waypoints);assert.ok(Math.hypot(bends[0].x-(moved.x-25),bends[0].y-(moved.y+30))<1);assert.ok(Math.hypot(bends[1].x-(p2.x-25),bends[1].y-(p2.y+30))<1);
 let points=await page.evaluate(()=>routeAudit.points()[0]);assert.deepEqual(points[0],a);assert.deepEqual(points.at(-1),b);const dragged=JSON.stringify(points);await page.evaluate(()=>routeAudit.performUndo());assert.notEqual(JSON.stringify(await page.evaluate(()=>routeAudit.points()[0])),dragged);await page.evaluate(()=>routeAudit.performRedo());assert.equal(JSON.stringify(await page.evaluate(()=>routeAudit.points()[0])),dragged);
 // Explicit automatic arrangement routes broken paths around EVERY body, including its endpoints.
 await page.evaluate(()=>routeAudit.smartRouteAllCables());points=await page.evaluate(()=>routeAudit.points()[0]);const bodies=scenario.devices.map(d=>R.bounds(d,0));assert.ok(points.length>2);for(let i=1;i<points.length;i++)assert.equal(R.segmentBlocked(points[i-1],points[i],bodies),false);
 await page.screenshot({path:'work/cable-safe-arrangement.png'});
 // Automatic routes invalidate their geometry cache when another item is added or moved.
 const innerLeg=points.slice(1,-2).map((p,i)=>({p,q:points[i+2]})).find(({p,q})=>Math.hypot(p.x-q.x,p.y-q.y)>80);assert.ok(innerLeg);
 const newBlock={id:'new-block',kind:'column',category:'architecture',x:(innerLeg.p.x+innerLeg.q.x)/2,y:(innerLeg.p.y+innerLeg.q.y)/2,w:28,h:28,ports:[],layerId:'main'};
 await page.evaluate(d=>{routeAudit.doc.devices.push(d);routeAudit.render()},newBlock);let rerouted=await page.evaluate(()=>routeAudit.points()[0]);assert.ok(rerouted.length>2);for(let i=1;i<rerouted.length;i++)assert.equal(R.segmentBlocked(rerouted[i-1],rerouted[i],[...bodies,R.bounds(newBlock,0)]),false);
 // An impossible overlapping port is reported, never replaced by an unsafe line.
 await page.evaluate(a=>{routeAudit.doc.devices.push({id:'cover',kind:'column',category:'architecture',x:a.x,y:a.y,w:80,h:80,ports:[],layerId:'main'});routeAudit.render()},a);assert.deepEqual(await page.evaluate(()=>routeAudit.points()[0]),[]);assert.ok((await page.locator('#drawing g[data-kind="cable"] text').textContent()).includes('مسیر کابل بسته'));assert.equal(await page.evaluate(()=>routeAudit.doc.cables.length),1);

 // A manual orthogonal draft and its finished geometry are identical; dragging a leg retains right angles.
 await reset();await mode('orthogonal');await click(a);await click(p1);await click(p2);const expected=await page.evaluate(({a,b})=>routeAudit.cablePathPoints([a,...routeAudit.bends,b],'orthogonal','bottom'),{a,b});await click(b);assert.deepEqual(await page.evaluate(()=>routeAudit.points()[0]),expected);
 const seg=R.nearestSegment(expected,{x:650,y:450}),q0=expected[seg.index],q1=expected[seg.index+1],centre={x:(q0.x+q1.x)/2,y:(q0.y+q1.y)/2};await click(centre);await drag(centre,{x:centre.x+35,y:centre.y+25});points=await page.evaluate(()=>routeAudit.points()[0]);assert.deepEqual(points[0],a);assert.deepEqual(points.at(-1),b);for(let i=1;i<points.length;i++)assert.ok(Math.abs(points[i].x-points[i-1].x)<.01||Math.abs(points[i].y-points[i-1].y)<.01);
 // No-bend orthogonal routing previews the same safe route that is committed.
 await reset();await mode('orthogonal');await click(a);const predicted=await page.evaluate(()=>{const d=routeAudit.doc.devices.find(d=>d.id==='lamp'),tip=routeAudit.portInfo(d,d.ports[0].id),src=routeAudit.doc.devices[0],at=routeAudit.portInfo(src,src.ports[6].id);return routeAudit.draftCablePreview(at,tip,[at])});await click(b);assert.deepEqual(await page.evaluate(()=>routeAudit.points()[0]),predicted);for(let i=1;i<predicted.length;i++)assert.equal(R.segmentBlocked(predicted[i-1],predicted[i],bodies),false);
 // Arrange/Smart Ports never change direct geometry or mode, and new routes survive export/import/reload.
 await mode('direct');await click(a);await click(b);const direct=await page.evaluate(()=>JSON.stringify(routeAudit.doc.cables.at(-1)));await page.evaluate(()=>routeAudit.smartRouteAllCables());assert.equal(await page.evaluate(()=>JSON.stringify(routeAudit.doc.cables.at(-1))),direct);await page.evaluate(()=>routeAudit.optimizeConnectedPortOrder());assert.equal(await page.evaluate(()=>routeAudit.doc.cables.at(-1).routeMode),'direct');assert.equal((await page.evaluate(()=>routeAudit.points().at(-1))).length,2);
 const final=await page.evaluate(()=>{const before=routeAudit.points();routeAudit.applyRoomImport(routeAudit.prepareRoomImport(JSON.parse(JSON.stringify({doc:routeAudit.doc}))));return {before,after:routeAudit.points()}});assert.deepEqual(final.after,final.before);
 await page.reload();await page.waitForFunction(()=>window.__roomStartupReady&&window.routeAudit);assert.equal(await page.evaluate(()=>routeAudit.doc.cables.at(-1).routeMode),'direct');assert.equal((await page.evaluate(()=>routeAudit.points().at(-1))).length,2);assert.deepEqual(errors,[]);
 console.log('PASS: real direct/free/orthogonal drawing, exact saved manual bends, visible-grip and segment dragging, undo/redo, safe automatic arrangement/Smart Ports, direct mode invariance, export/import/reload.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
