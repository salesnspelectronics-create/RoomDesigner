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


 const scenario={schema:'room-designer/v0.3',connectionModel:'physical-connections-1',id:'quick',name:'Quick test',devices:[{id:'a',kind:'custom',name:'A',x:240,y:400,w:120,h:80,ports:[{id:'pa',name:'Bus',type:'rs485_power',side:'top'}]},{id:'b',kind:'custom',name:'B',x:640,y:200,w:120,h:80,ports:[{id:'pb',name:'Bus',type:'rs485_power',side:'top'}]}],cables:[],walls:[],layers:[{id:'main',name:'Main',visible:true}],activeLayer:'main'};
 async function click(p){const q=await page.evaluate(p=>{const s=document.getElementById('canvas'),q=s.createSVGPoint();q.x=p.x;q.y=p.y;const r=q.matrixTransform(s.getScreenCTM());return{x:r.x,y:r.y}},p);await page.mouse.click(q.x,q.y)}
 await page.evaluate(d=>routeAudit.reset(d),scenario);await click({x:240,y:360});
 const expected=await page.evaluate(()=>{const a=routeAudit.portInfo(routeAudit.doc.devices[0],'pa'),b=routeAudit.portInfo(routeAudit.doc.devices[1],'pb');return routeAudit.draftCablePreview(a,b,[a])});
 await click({x:640,y:160});assert.equal(await page.evaluate(()=>routeAudit.doc.cables[0].routeMode),'orthogonal');const pts=await page.evaluate(()=>routeAudit.points()[0]);assert.deepEqual(pts,expected);
 for(let i=1;i<pts.length;i++)assert.equal(R.segmentBlocked(pts[i-1],pts[i],scenario.devices.map(d=>R.bounds(d,0))),false);
 // An explicitly selected Direct tool still produces an exact straight segment.
 await page.evaluate(d=>{routeAudit.reset(d);routeAudit.setTool('cable')},scenario);await click({x:240,y:360});await click({x:640,y:160});assert.equal(await page.evaluate(()=>routeAudit.doc.cables[0].routeMode),'direct');assert.equal((await page.evaluate(()=>routeAudit.points()[0])).length,2);
 // Crossing only an intermediate item does not trigger the quick-connect exception.
 const middle=structuredClone(scenario);middle.devices[0].y=300;middle.devices[0].ports[0].side='right';middle.devices[1].y=300;middle.devices[1].ports[0].side='left';middle.devices.push({id:'middle',kind:'column',name:'Middle',x:440,y:300,w:100,h:160,ports:[]});
 await page.evaluate(d=>routeAudit.reset(d),middle);await click({x:300,y:300});await click({x:580,y:300});assert.equal(await page.evaluate(()=>routeAudit.doc.cables[0].routeMode),'direct');assert.equal((await page.evaluate(()=>routeAudit.points()[0])).length,2);
 assert.deepEqual(errors,[]);console.log('PASS: implicit connection reroutes only when crossing source/target bodies, preview/final match, explicitly direct remains direct, intermediate-only crossing stays direct.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
