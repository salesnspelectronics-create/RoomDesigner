'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');
  html=html.replace(main,main.slice(0,at)+"window.navigationAudit={get doc(){return doc},get catalog(){return catalog},get view(){return view},set view(v){view=v;render()},get tool(){return tool},get start(){return start},get history(){return history},get temporaryPan(){return !!drag?.temporaryPan},get selected(){return multiSelection},reset(d){clearPointerState();doc=structuredClone(d);selection=null;multiSelection=null;setTool('select');render()},set selected(v){multiSelection=v;selection=null},set single(v){selection=v;multiSelection=null},addDevice,performUndo,setTool,render,portInfo};"+main.slice(at));
  await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
  await page.addInitScript(()=>{localStorage.setItem('rd_active_user','Tester');localStorage.setItem('rd_storage_reset_physical_v1','done')});
  await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.navigationAudit);
  if(await page.locator('#overlay.show').count())await page.locator('#closeSheet').click();page.setDefaultTimeout(8000);

  page.on('dialog',d=>d.accept());
  const fixture={schema:'room-designer/v0.3',id:'keyboard-test',name:'Keyboard test',devices:[{id:'a',name:'A',kind:'equipment',x:280,y:250,w:160,h:80,ports:[{id:'pa',type:'do',name:'R1',side:'bottom'}]},{id:'b',name:'B',kind:'equipment',x:600,y:320,w:90,h:90,ports:[{id:'pb',type:'do',name:'In',side:'top'}]},{id:'hidden',kind:'equipment',x:100,y:100,w:40,h:40,ports:[],layerId:'hidden'}],walls:[{id:'w1',shapeId:'shape',a:{x:50,y:450},b:{x:250,y:450},width:6},{id:'w2',shapeId:'shape',a:{x:250,y:450},b:{x:250,y:500},width:6}],cables:[{id:'c',a:{dev:'a',port:'pa'},b:{dev:'b',port:'pb'},routeMode:'direct',type:'do'}],layers:[{id:'main',visible:true},{id:'hidden',visible:false}],activeLayer:'main'};
  await page.evaluate(d=>{navigationAudit.reset(d);navigationAudit.view={x:0,y:0,w:960,h:680}},fixture);
  const canvas=page.locator('#canvas');
  await canvas.click({position:{x:30,y:30}});
  const persian=await page.evaluate(()=>{const e=new KeyboardEvent('keydown',{key:'ش',code:'KeyA',ctrlKey:true,bubbles:true,cancelable:true});document.activeElement.dispatchEvent(e);return {prevented:e.defaultPrevented,selected:navigationAudit.selected}});
  assert.equal(persian.prevented,true,'Persian-layout Ctrl+A must suppress browser Select All');
  assert.deepEqual(persian.selected,{devices:['a','b'],walls:['shape'],cables:['c']});
  await page.keyboard.press('Control+a');
  assert.deepEqual(await page.evaluate(()=>navigationAudit.selected),{devices:['a','b'],walls:['shape'],cables:['c']});
  assert.equal(await page.evaluate(()=>window.getSelection().toString()),'');
  await page.keyboard.press('Delete');assert.deepEqual(await page.evaluate(()=>({d:navigationAudit.doc.devices.map(d=>d.id),w:navigationAudit.doc.walls.length,c:navigationAudit.doc.cables.length})),{d:['hidden'],w:0,c:0});
  await page.keyboard.press('Control+z');assert.equal(await page.evaluate(()=>navigationAudit.doc.devices.length),3);
  const search=page.locator('#deskToolSearch');await search.fill('AC12CH');await search.press('Control+a');await search.press('Backspace');assert.equal(await search.inputValue(),'');await search.blur();
  async function screen(p){return page.evaluate(p=>{const s=document.getElementById('canvas'),q=s.createSVGPoint();q.x=p.x;q.y=p.y;const r=q.matrixTransform(s.getScreenCTM());return{x:r.x,y:r.y}},p)}
  async function resize(rotation,idx,shift){
   await page.evaluate(({d,rotation})=>{navigationAudit.reset(d);navigationAudit.doc.devices[0].rotation=rotation;navigationAudit.render()}, {d:fixture,rotation});
   const center=await screen({x:280,y:250});await page.mouse.click(center.x,center.y);
   const sx=idx===0||idx===3?-1:1,sy=idx<2?-1:1,ang=rotation*Math.PI/180;
   const world=(x,y)=>({x:280+x*Math.cos(ang)-y*Math.sin(ang),y:250+x*Math.sin(ang)+y*Math.cos(ang)});
   const a=await screen(world(sx*80,sy*40)),b=await screen(world(sx*120,sy*48));
   if(shift)await page.keyboard.down('Shift');await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:5});await page.mouse.up();if(shift)await page.keyboard.up('Shift');
   return page.evaluate(()=>{const d=navigationAudit.doc.devices[0];return {w:d.w,h:d.h,x:d.x,y:d.y}});
  }
  for(const rotation of [0,35])for(const idx of [0,1,2,3]){
   const result=await resize(rotation,idx,true);assert.ok(Math.abs(result.w/result.h-2)<1e-7);assert.ok(result.w>200);assert.equal(result.x,280);assert.equal(result.y,250);
  }
  const free=await resize(0,2,false);assert.ok(Math.abs(free.w/free.h-2)>.1);
  await page.keyboard.press('Control+z');assert.equal(await page.evaluate(()=>navigationAudit.doc.devices[0].w),160);

  // More than sixteen additions never wrap onto occupied items, including varying sizes.
  const placed=await page.evaluate(d=>{
   navigationAudit.reset({...d,devices:[],cables:[],walls:[]});navigationAudit.view={x:0,y:0,w:960,h:680};
   const indices=['AC12CH','AC4CH'].map(code=>navigationAudit.catalog.findIndex(t=>t.code===code));
   for(let i=0;i<25;i++)navigationAudit.addDevice(indices[i%indices.length]);
   return navigationAudit.doc.devices.map(d=>({id:d.id,x:d.x,y:d.y,w:d.w,h:d.h}));
  },fixture);
  assert.equal(placed.length,25);
  function overlap(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)/2&&Math.abs(a.y-b.y)<(a.h+b.h)/2}
  for(let i=0;i<placed.length;i++)for(let j=0;j<i;j++)assert.equal(overlap(placed[i],placed[j]),false,`new placement ${i+1} overlaps ${j+1}`);
  const before=placed.at(-1);await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowDown');await page.keyboard.press('Shift+ArrowLeft');
  let moved=await page.evaluate(()=>{const d=navigationAudit.doc.devices.at(-1);return{x:d.x,y:d.y}});assert.deepEqual(moved,{x:before.x-9,y:before.y+1});
  await page.keyboard.press('Control+z');moved=await page.evaluate(()=>{const d=navigationAudit.doc.devices.at(-1);return{x:d.x,y:d.y}});assert.deepEqual(moved,{x:before.x+1,y:before.y+1});
  await page.keyboard.press('Control+a');const beforeAll=await page.evaluate(()=>navigationAudit.doc.devices.map(d=>({x:d.x,y:d.y})));await page.keyboard.press('Shift+ArrowUp');
  assert.deepEqual(await page.evaluate(()=>navigationAudit.doc.devices.map(d=>({x:d.x,y:d.y}))),beforeAll.map(p=>({x:p.x,y:p.y-10})));
  await page.evaluate(()=>{navigationAudit.doc.devices[0].locked=true});const lockedBefore=await page.evaluate(()=>JSON.stringify(navigationAudit.doc));await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>JSON.stringify(navigationAudit.doc)),lockedBefore);
  await search.fill('abc');await search.press('ArrowLeft');assert.equal(await page.evaluate(()=>JSON.stringify(navigationAudit.doc)),lockedBefore);await search.fill('');await search.blur();
  await page.evaluate(()=>navigationAudit.addDevice(navigationAudit.catalog.findIndex(t=>t.code==='AC4CH')));
  assert.equal(await page.evaluate(()=>navigationAudit.selected),null,'adding an item clears the previous multi-selection');
  const newlyAddedBefore=await page.evaluate(()=>navigationAudit.doc.devices.map(d=>({x:d.x,y:d.y})));await page.keyboard.press('ArrowRight');
  assert.deepEqual(await page.evaluate(()=>navigationAudit.doc.devices.slice(0,-1).map(d=>({x:d.x,y:d.y}))),newlyAddedBefore.slice(0,-1));
  // Group/wall movement retains attached doors and shifts selected manual cable bends.
  await page.evaluate(d=>{navigationAudit.reset(d);navigationAudit.doc.devices.push({id:'door',kind:'door',x:150,y:450,w:60,h:30,ports:[],attachedWallId:'w1'});navigationAudit.doc.devices[0].groupId='g';navigationAudit.doc.walls.forEach(w=>w.groupId='g');navigationAudit.doc.cables[0].groupId='g';navigationAudit.doc.cables[0].waypoints=[{x:400,y:400}];navigationAudit.single={kind:'group',id:'g'}},fixture);
  await page.keyboard.press('ArrowRight');
  assert.deepEqual(await page.evaluate(()=>({a:navigationAudit.doc.devices[0].x,b:navigationAudit.doc.devices[1].x,door:navigationAudit.doc.devices.at(-1).x,wall:navigationAudit.doc.walls[0].a.x,bend:navigationAudit.doc.cables[0].waypoints[0].x})),{a:281,b:600,door:151,wall:51,bend:401});
  assert.deepEqual(errors,[]);console.log('PASS: 25 nonoverlapping additions, single/multiple/group arrow nudges, attached doors, locks, Undo, text-field isolation, Ctrl+A canvas selection, grouped walls, hidden-layer exclusion, Delete/Undo, text-field selection, Shift proportional resize at all four corners and rotation, unrestricted resize and Undo.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
