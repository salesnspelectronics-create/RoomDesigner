'use strict';
// Development dependency: npm install --no-save --package-lock=false playwright
// Run: node tests/layers-group.browser.test.cjs
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..');
const expose=`window.audit={get doc(){return doc},set doc(v){doc=v},get selection(){return selection},set selection(v){selection=v},get multiSelection(){return multiSelection},get drag(){return drag},render,groupAllSelected,selectAllObjects,clipboardSelection,snapshot,performUndo,performRedo,ungroupSelected,saveAuto};`;
let server,browser;
(async()=>{
 server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(req.url==='/'?'/index.html':req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
  try{let content=fs.readFileSync(file);if(file.endsWith('index.html'))content=Buffer.from(content.toString().replace('})();</script>',expose+'})();</script>'));
   res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'application/javascript':file.endsWith('.json')?'application/json':'image/svg+xml');res.end(content)
  }catch{res.writeHead(404);res.end()}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 browser=await chromium.launch({headless:true,...(process.env.TEST_BROWSER_PATH?{executablePath:process.env.TEST_BROWSER_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('rd_active_user','Regression'));
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.waitForFunction(()=>window.audit);
 await page.evaluate(()=>{
  const device=(id,x)=>({id,name:id,kind:'custom',x,y:200,w:80,h:50,ports:[{id:'p'+id,name:'LAN',type:'ethernet',side:'bottom'}],layerId:'main'});
  audit.doc={schema:'room-designer/v0.3',id:'regression',name:'Groups',date:'2026-10-18',devices:[device('a',200),device('b',400)],
   walls:[{id:'w1',shapeId:'shape',a:{x:100,y:350},b:{x:300,y:350},layerId:'other'},{id:'w2',shapeId:'shape',a:{x:300,y:350},b:{x:300,y:400},layerId:'other'}],
   cables:[{id:'c',a:{dev:'a',port:'pa'},b:{dev:'b',port:'pb'},type:'ethernet',waypoints:[{x:300,y:280}],layerId:'main'}],
   layers:[{id:'main',name:'Main',visible:true},{id:'other',name:'Other',visible:true}],activeLayer:'main'};
  audit.selectAllObjects();audit.groupAllSelected();
 });
 const groupId=await page.evaluate(()=>audit.doc.devices[0].groupId);
 assert.ok(groupId);
 const toggle=async(kind,id)=>page.locator(`[data-layer-action="objToggle"][data-layer-kind="${kind}"][data-layer-id="${id}"]`).click();
 const select=async(kind,id,options)=>page.locator(`[data-tree-kind="${kind}"][data-tree-id="${id}"]`).click(options);
 const checkGroup=async()=>assert.equal(await page.evaluate(id=>[...audit.doc.devices,...audit.doc.walls,...audit.doc.cables].every(x=>x.groupId===id),groupId),true);
 for(const [kind,id] of [['device','a'],['wall','shape'],['cable','c']]){
  await toggle(kind,id);await checkGroup();
  assert.equal(await page.evaluate(({kind,id})=>{const objects=kind==='device'?audit.doc.devices:kind==='cable'?audit.doc.cables:audit.doc.walls;return objects.filter(x=>(kind==='wall'?x.shapeId||x.id:x.id)===id).every(x=>x.visible===false)},{kind,id}),true);
  if(kind!=='wall')assert.equal(await page.locator(`#drawing [data-kind="${kind}"][data-id="${id}"]`).count(),0);
  await toggle(kind,id);await checkGroup();
  await select(kind,id);
  assert.deepEqual(await page.evaluate(()=>audit.selection),{kind:'group',id:groupId},'Layers must select the whole group after Hide/Show');
  assert.equal(await page.evaluate(()=>{const c=audit.clipboardSelection();return c.devices.length+c.walls.length+c.cables.length}),5,'copy includes all group members across layers');
 }
 for(const id of ['main','other']){
  await page.locator(`[data-layer-action="toggle"][data-layer-id="${id}"]`).click();
  await page.locator(`[data-layer-action="toggle"][data-layer-id="${id}"]`).click();await checkGroup();
 }
 await select('device','a');
 const before=await page.evaluate(()=>JSON.parse(JSON.stringify(audit.snapshot(audit.doc))));
 const center=await page.locator('#drawing [data-kind="device"][data-id="a"] .body').boundingBox();
 await page.mouse.move(center.x+center.width/2,center.y+center.height/2);await page.mouse.down();
 assert.equal(await page.evaluate(()=>audit.drag?.kind),'group');
 await page.mouse.move(center.x+center.width/2+40,center.y+center.height/2+25,{steps:4});await page.mouse.up();
 const moved=await page.evaluate(()=>JSON.parse(JSON.stringify(audit.snapshot(audit.doc))));
 const dx=moved.devices[0].x-before.devices[0].x,dy=moved.devices[0].y-before.devices[0].y;
 assert.ok(dx>0&&dy>0);
 const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} must equal ${b} within floating-point tolerance`);
 for(let i=0;i<2;i++){near(moved.devices[i].x-before.devices[i].x,dx);near(moved.devices[i].y-before.devices[i].y,dy);near(moved.walls[i].a.x-before.walls[i].a.x,dx);near(moved.walls[i].b.y-before.walls[i].b.y,dy)}
 near(moved.cables[0].waypoints[0].x-before.cables[0].waypoints[0].x,dx);
 near(moved.cables[0].waypoints[0].y-before.cables[0].waypoints[0].y,dy);
 await page.evaluate(()=>audit.performUndo());
 assert.deepEqual(await page.evaluate(()=>JSON.parse(JSON.stringify(audit.snapshot(audit.doc)))),before);
 await page.evaluate(()=>audit.performRedo());
 assert.deepEqual(await page.evaluate(()=>JSON.parse(JSON.stringify(audit.snapshot(audit.doc)))),moved);
 await select('device','a');await select('device','b',{modifiers:['Control']});
 const multi=await page.evaluate(()=>audit.multiSelection);
 assert.deepEqual(multi,{devices:['a'],walls:['shape'],cables:['c']},'modifier selection expands the group then toggles the clicked member');
 await select('device','a');await page.evaluate(()=>audit.ungroupSelected());
 assert.equal(await page.evaluate(()=>[...audit.doc.devices,...audit.doc.walls,...audit.doc.cables].some(x=>x.groupId)),false);
 await page.evaluate(()=>{audit.performUndo();audit.render()});await checkGroup();
 await page.evaluate(()=>audit.saveAuto());await page.reload();await page.waitForFunction(()=>window.audit);await checkGroup();
 await select('device','a');assert.deepEqual(await page.evaluate(()=>audit.selection),{kind:'group',id:groupId});
 assert.deepEqual(errors,[]);
 console.log('PASS: object/layer Hide/Show, group selection/copy/drag, mixed cross-layer members, Undo/Redo, modifier selection, Ungroup and save/reload');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();if(server)server.close()});
