'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');
  html=html.replace(main,main.slice(0,at)+"window.nudgeMetrics=[];const originalNudgeRender=render;render=function(){const at=performance.now();originalNudgeRender();nudgeMetrics.push(performance.now()-at)};window.navigationAudit={get doc(){return doc},get catalog(){return catalog},get view(){return view},set view(v){view=v;render()},get tool(){return tool},get start(){return start},get history(){return history},get temporaryPan(){return !!drag?.temporaryPan},get nudge(){return !!keyboardNudge},get selected(){return multiSelection},reset(d){clearPointerState();doc=structuredClone(d);selection=null;multiSelection=null;setTool('select');render()},set selected(v){multiSelection=v;selection=null},set single(v){selection=v;multiSelection=null},addDevice,performUndo,setTool,render,portInfo};"+main.slice(at));
  await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
  await page.addInitScript(()=>{localStorage.setItem('rd_active_user','Tester');localStorage.setItem('rd_storage_reset_physical_v1','done')});
  await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.navigationAudit);
  if(await page.locator('#overlay.show').count())await page.locator('#closeSheet').click();page.setDefaultTimeout(8000);


  page.on('dialog',d=>d.accept());
  await page.evaluate(()=>{
   const t=navigationAudit.catalog.find(t=>t.code==='1L');const devices=Array.from({length:120},(_,i)=>({...structuredClone(t),id:'d'+i,x:80+(i%12)*170,y:80+Math.floor(i/12)*130,w:120,h:85,ports:t.ports.map(p=>({...p,id:'p'+i}))}));
   navigationAudit.reset({schema:'room-designer/v0.3',id:'hold-test',name:'Hold test',connectionModel:RoomConnections.version,devices,cables:[{id:'wire',a:{dev:'d0',port:'p0'},b:{dev:'d1',port:'p1'},type:'rs485_power',routeMode:'direct',name:'Bus'}],walls:[],layers:[{id:'main',visible:true}],activeLayer:'main'});navigationAudit.single={kind:'device',id:'d0'};navigationAudit.render();nudgeMetrics.length=0;
  });
  const before=await page.evaluate(()=>({x:navigationAudit.doc.devices[0].x,history:navigationAudit.history.length}));
  await page.keyboard.down('ArrowRight');
  const burst=await page.evaluate(()=>{const x=navigationAudit.doc.devices[0].x;for(let i=0;i<1000;i++)window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',code:'ArrowRight',repeat:true,bubbles:true,cancelable:true}));return {before:x,after:navigationAudit.doc.devices[0].x}});
  assert.equal(burst.before,burst.after,'OS repeats never enqueue movement');
  await page.waitForTimeout(850);
  const visual=await page.evaluate(()=>{const a=navigationAudit.portInfo(navigationAudit.doc.devices[0],'p0'),b=navigationAudit.portInfo(navigationAudit.doc.devices[1],'p1');return {actual:document.querySelector('#drawing g[data-kind="cable"] path').getAttribute('d'),expected:`M${a.x} ${a.y} L${b.x} ${b.y}`,transform:document.querySelector('#drawing g[data-id="d0"]').getAttribute('transform')}});
  assert.equal(visual.actual,visual.expected,'connected cable endpoint follows lightweight preview');assert.ok(visual.transform.startsWith('translate('));
  await page.keyboard.up('ArrowRight');
  const released=await page.evaluate(()=>({x:navigationAudit.doc.devices[0].x,history:navigationAudit.history.length,active:navigationAudit.nudge,frames:nudgeMetrics.length,ms:nudgeMetrics.reduce((a,b)=>a+b,0)}));
  assert.ok(released.x>before.x+10,'holding produces continuous motion');assert.equal(released.history,before.history+1,'one snapshot for entire hold');assert.equal(released.active,false);assert.ok(released.frames<=3,'only start/end full renders for device hold');
  await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>navigationAudit.doc.devices[0].x),released.x,'no continued movement after keyup');
  await page.keyboard.press('Control+z');assert.equal(await page.evaluate(()=>navigationAudit.doc.devices[0].x),before.x);
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(400);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.evaluate(()=>navigationAudit.nudge),false);await page.keyboard.up('ArrowDown');
  assert.deepEqual(errors,[]);console.log('PASS: 120 SVG devices, ignored 1000 OS repeats, continuous hold, one Undo snapshot, immediate keyup/blur stop. Render profile:',JSON.stringify(released));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
