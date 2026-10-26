'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');
  html=html.replace(main,main.slice(0,at)+"window.navigationAudit={get doc(){return doc},get catalog(){return catalog},get view(){return view},set view(v){view=v;render()},get tool(){return tool},get start(){return start},get history(){return history},get temporaryPan(){return !!drag?.temporaryPan},setTool,render,portInfo};"+main.slice(at));
  await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
  await page.addInitScript(()=>{localStorage.setItem('rd_active_user','Tester');localStorage.setItem('rd_storage_reset_physical_v1','done')});
  await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.navigationAudit);
  if(await page.locator('#overlay.show').count())await page.locator('#closeSheet').click();page.setDefaultTimeout(8000);
  const sections=page.locator('#deskLeft details[data-section]');assert.equal(await sections.count(),5);assert.equal(await page.locator('#deskLeft details[data-section][open]').count(),0);
  await page.locator('#deskLeft [data-section="equipment"]>summary').click();
  const rows=page.locator('#deskLeft .equipment-item');assert.equal(await rows.count(),30);assert.equal(await rows.locator('img,.equipment-plus').count(),0);assert.ok((await rows.first().boundingBox()).height<65);
  await rows.filter({hasText:'AC12CH'}).click();await page.waitForFunction(()=>navigationAudit.doc.devices.length===1);
  await page.screenshot({path:'work/workspace-equipment-list.png'});
  // Keep a visible test object near the centre, away from the floating controls.
  await page.evaluate(()=>{navigationAudit.doc.devices[0].x=480;navigationAudit.doc.devices[0].y=340;navigationAudit.view={x:240,y:170,w:480,h:340}});
  const canvas=page.locator('#canvas');
  async function gridCoversCanvas(){const a=await canvas.boundingBox(),b=await page.locator('#canvasGrid').boundingBox();for(const k of ['x','y','width','height'])assert.ok(Math.abs(a[k]-b[k])<1,`${k}: canvas ${a[k]}, grid ${b[k]}`)}
  await gridCoversCanvas();
  const point=await page.locator('#drawing .port').first().boundingBox(),x=point.x+point.width/2,y=point.y+point.height/2;
  const before=await page.evaluate(()=>({view:{...navigationAudit.view},doc:JSON.stringify(navigationAudit.doc),history:navigationAudit.history.length}));
  await page.keyboard.down('Space');assert.equal(await canvas.evaluate(e=>getComputedStyle(e).cursor),'grab');await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+100,y+70,{steps:5});assert.equal(await canvas.evaluate(e=>getComputedStyle(e).cursor),'grabbing');await page.mouse.up();await page.keyboard.up('Space');
  const after=await page.evaluate(()=>({view:{...navigationAudit.view},doc:JSON.stringify(navigationAudit.doc),history:navigationAudit.history.length,tool:navigationAudit.tool}));
  assert.notEqual(before.view.x,after.view.x);assert.notEqual(before.view.y,after.view.y);assert.equal(before.view.w,after.view.w);assert.equal(after.doc,before.doc);assert.equal(after.history,before.history);assert.equal(after.tool,'select');assert.equal(await canvas.evaluate(e=>e.classList.contains('space-pan')||e.classList.contains('space-panning')),false);await gridCoversCanvas();
  // Trackpad tap/tap-and-drag is a mouse pointer stream: Ctrl on blank canvas pans.
  const ctrlBounds=await canvas.boundingBox(),cx=ctrlBounds.x+ctrlBounds.width*.8,cy=ctrlBounds.y+ctrlBounds.height*.7;
  const ctrlBefore=await page.evaluate(()=>({view:{...navigationAudit.view},doc:JSON.stringify(navigationAudit.doc),history:navigationAudit.history.length}));
  await page.keyboard.down('Control');await page.mouse.click(cx,cy);await page.mouse.move(cx,cy);await page.mouse.down({clickCount:2});assert.equal(await page.evaluate(()=>navigationAudit.temporaryPan),true);await page.mouse.move(cx-80,cy-60,{steps:4});await page.mouse.up({clickCount:2});await page.keyboard.up('Control');
  const ctrlAfter=await page.evaluate(()=>({view:{...navigationAudit.view},doc:JSON.stringify(navigationAudit.doc),history:navigationAudit.history.length}));
  assert.notEqual(ctrlAfter.view.x,ctrlBefore.view.x);assert.notEqual(ctrlAfter.view.y,ctrlBefore.view.y);assert.equal(ctrlAfter.view.w,ctrlBefore.view.w);assert.equal(ctrlAfter.doc,ctrlBefore.doc);assert.equal(ctrlAfter.history,ctrlBefore.history);await gridCoversCanvas();
  // Ctrl on a device keeps object selection behavior instead of beginning a pan.
  const body=await page.locator('#drawing g[data-kind="device"] .body').boundingBox(),objectView=await page.evaluate(()=>({...navigationAudit.view}));
  await page.keyboard.down('Control');await page.mouse.move(body.x+body.width/2,body.y+body.height/2);await page.mouse.down();assert.equal(await page.evaluate(()=>navigationAudit.temporaryPan),false);await page.mouse.up();await page.keyboard.up('Control');assert.deepEqual(await page.evaluate(()=>({...navigationAudit.view})),objectView);
  // The grid must cover the letterboxed SVG viewport even at large/negative coordinates.
  await page.evaluate(()=>navigationAudit.view={x:-3200,y:-2700,w:4800,h:3400});await gridCoversCanvas();await page.screenshot({path:'work/workspace-grid-zoomed-out.png'});
  await page.evaluate(()=>navigationAudit.view={x:240,y:170,w:480,h:340});
  const port=await page.locator('#drawing .port').first().boundingBox();
  await page.evaluate(()=>navigationAudit.setTool('cable'));await page.mouse.click(port.x+port.width/2,port.y+port.height/2);assert.ok(await page.evaluate(()=>navigationAudit.start));
  const cableBefore=await page.evaluate(()=>({start:{...navigationAudit.start},doc:JSON.stringify(navigationAudit.doc),view:{...navigationAudit.view}}));
  const bounds=await canvas.boundingBox(),px=bounds.x+bounds.width*.65,py=bounds.y+bounds.height*.65;
  await page.keyboard.down('Space');await page.mouse.move(px,py);await page.mouse.down();await page.mouse.move(px-60,py-50,{steps:4});await page.mouse.up();await page.keyboard.up('Space');
  const cableAfter=await page.evaluate(()=>({start:{...navigationAudit.start},doc:JSON.stringify(navigationAudit.doc),view:{...navigationAudit.view},tool:navigationAudit.tool}));
  assert.deepEqual(cableAfter.start,cableBefore.start);assert.equal(cableAfter.doc,cableBefore.doc);assert.equal(cableAfter.tool,'cable');assert.notEqual(cableAfter.view.x,cableBefore.view.x);await gridCoversCanvas();
  await page.keyboard.press('Escape');
  // Space remains a normal character inside text fields, and blur cancels the hand key.
  const search=page.locator('#deskToolSearch');await search.fill('AC');await search.press('Space');assert.equal(await search.inputValue(),'AC ');assert.equal(await canvas.evaluate(e=>e.classList.contains('space-pan')),false);await search.fill('');await search.blur();
  await page.keyboard.down('Space');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await canvas.evaluate(e=>e.classList.contains('space-pan')),false);await page.keyboard.up('Space');
  await page.reload();await page.waitForFunction(()=>window.__roomStartupReady);assert.equal(await page.locator('#deskLeft details[data-section][open]').count(),0);
  await page.setViewportSize({width:390,height:844});await gridCoversCanvas();
  assert.deepEqual(errors,[]);console.log('PASS: collapsed startup, compact equipment rows and placement, full viewport grid across zoom/pan/resize, Space panning over ports at zoom, Ctrl tap/drag on blank canvas with object-selection preserved, cable draft preserved, text-entry and blur handling.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
