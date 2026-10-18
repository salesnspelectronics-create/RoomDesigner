// RD-019: run with "node --test tests/regression.test.mjs" (Node 18+).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';

const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function extractFunction(name){
 const start=source.indexOf('function '+name+'(');
 assert.ok(start>=0,name+' exists');
 const isAsync=source.slice(Math.max(0,start-6),start)==='async ';
 const body=source.indexOf('{',start);let depth=0,quote='',escape=false;
 for(let i=body;i<source.length;i++){
  const c=source[i];
  if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue}
  if(c==="'"||c==='"'||c==='\x60'){quote=c;continue}
  if(c==='{')depth++;else if(c==='}'&&!--depth)return (isAsync?'async ':'')+source.slice(start,i+1);
 }
 throw Error('Unterminated '+name);
}
function context(code,globals={}){const sandbox={...globals};vm.createContext(sandbox);vm.runInContext(code,sandbox);return sandbox}
test('source includes stable project export/import and undo APIs',()=>{
 for(const name of ['snapshot','validateRoomDocument','prepareRoomImport','applyRoomImport','performUndo','performRedo','groupAllSelected','ungroupSelected'])assert.ok(source.includes('function '+name+'('),name);
});

function layerSelectionHarness(){
 const doc={devices:[{id:'a',groupId:'g',layerId:'main'},{id:'b',groupId:'g',layerId:'main'},{id:'solo',layerId:'main'}],walls:[{id:'w1',shapeId:'shape',groupId:'g',layerId:'other'},{id:'w2',shapeId:'shape',groupId:'g',layerId:'other'}],cables:[{id:'c',groupId:'g',layerId:'main'}],layers:[{id:'main',visible:true},{id:'other',visible:true}],activeLayer:'main'};
 const functions=['ensureLayers','objectLayer','layerObject','layerVisible','layerLocked','allGroupElements','groupOfTarget','selectLayerObject','layerEdit'].map(extractFunction).join('\n');
 return context('let selection=null,multiSelection=null;'+functions+'\nfunction state(){return {selection,multiSelection}}',{
  doc,device:id=>doc.devices.find(d=>d.id===id),setTool:()=>{},render:()=>{},checkpoint:()=>{},scheduleSave:()=>{}
 });
}
test('Layers selects the persistent group after object and layer Hide/Show',()=>{
 const h=layerSelectionHarness();
 for(const [kind,id] of [['device','a'],['wall','shape'],['cable','c']]){
  h.layerEdit('objToggle',id,kind);
  assert.equal(h.layerVisible(h.layerObject(kind,id)),false);
  h.layerEdit('objToggle',id,kind);
  assert.equal(h.layerVisible(h.layerObject(kind,id)),true);
  h.selectLayerObject(kind,id);
  assert.equal(h.state().selection.kind,'group');assert.equal(h.state().selection.id,'g');
 }
 h.layerEdit('toggle','other');h.layerEdit('toggle','other');h.selectLayerObject('wall','shape');
 assert.equal(h.state().selection.id,'g');assert.equal(h.doc.activeLayer,'other');
 assert.ok([...h.doc.devices.slice(0,2),...h.doc.walls,...h.doc.cables].every(x=>x.groupId==='g'));
});
test('Layers modifier selection expands groups into actual unique member IDs',()=>{
 const h=layerSelectionHarness();h.selectLayerObject('device','a');h.selectLayerObject('device','b',true);
 assert.equal(h.state().selection,null);
 assert.deepEqual(JSON.parse(JSON.stringify(h.state().multiSelection)),{devices:['a'],walls:['shape'],cables:['c']});
 h.selectLayerObject('device','b',true);
 assert.deepEqual(Array.from(h.state().multiSelection.devices),['a','b']);
});
test('Layers preserves ordinary selection for ungrouped objects and ignores missing IDs',()=>{
 const h=layerSelectionHarness();h.selectLayerObject('device','solo');
 assert.equal(h.state().selection.kind,'device');assert.equal(h.state().selection.id,'solo');
 h.selectLayerObject('device','missing');assert.equal(h.state().selection.id,'solo');
});
test('revision snapshot includes layers, active layer, without nested revisions',()=>{
 const scope=context(extractFunction('snapshot'));const d={name:'demo',date:'2026-10-15',devices:[{id:'a'}],cables:[],walls:[],layers:[{id:'main',name:'original',locked:true}],activeLayer:'main',revisions:[{snapshot:{revisions:[]}}]};
 const snap=scope.snapshot(d);assert.equal(snap.schemaVersion,3);assert.equal(snap.activeLayer,'main');assert.equal(snap.layers[0].locked,true);
 assert.equal('revisions' in snap,false);
 d.layers[0].name='changed';d.devices[0].id='changed';
 assert.equal(snap.layers[0].name,'original');assert.equal(snap.devices[0].id,'a');
});
test('UIDs are unique across a large batch',()=>{
 const uidSource='const issuedIds=new Set();let fallbackIdSequence=0;'+extractFunction('uid');
 const scope=context(uidSource,{crypto:{randomUUID}});
 const ids=new Set(Array.from({length:2000},()=>scope.uid()));
 assert.equal(ids.size,2000);assert.ok([...ids].every(id=>id.startsWith('x')));
});
test('corrupted local JSON keeps the original and returns fallback',()=>{
 const raw={'rd_types':'{broken'},safeStorage={getItem:key=>raw[key]??null};
 const scope=context('const invalidLocalData=new Set();'+extractFunction('readLocalJSON'),{safeStorage});
 const fallback={safe:true};
 assert.equal(scope.readLocalJSON('rd_types',fallback,()=>true),fallback);
 assert.equal(raw.rd_types,'{broken');
});
test('layer lock, cable hit testing and archive guards are present',()=>{
 assert.match(source,/function layerLocked\(/);
 assert.match(source,/some\(x=>layerLocked\(x\)\|\|x\.locked\)/);
 assert.match(source,/const MAX_EMBEDDED_REVISIONS=20/);
 assert.match(source,/if\(!layerVisible\(c\)\)continue/);
});

test('failed import write is tracked for rollback, including the failing key',()=>{
 const i=source.indexOf('function applyRoomImport(candidate)');
 const j=source.indexOf("$('fileInput').addEventListener",i);
 assert.ok(i>=0&&j>i);
 const impl=source.slice(i,j);
 assert.match(impl,/applied\.push\(key\);if\(!safeStorage\.setItem\(key,value\)\)/);
 assert.match(impl,/rollbackStorage\(\)/);
 assert.match(impl,/old===null\?safeStorage\.removeItem\(key\):safeStorage\.setItem\(key,old\)/);
});

function importHarness(failKey=null){
 const persisted=new Map([['rd_last','{"old":true}'],['rd_types','{"oldType":true}']]);
 let failed=false;
 const safeStorage={
  getItem:key=>persisted.has(key)?persisted.get(key):null,
  setItem(key,value){if(key===failKey&&!failed){failed=true;return false}persisted.set(key,String(value));return true},
  removeItem:key=>{persisted.delete(key);return true}
 };
 const ops=[];
 const initial={id:'before',devices:[],cables:[],walls:[]};
 const sandbox=context(`
 let doc={id:'before',devices:[],cables:[],walls:[]},types={old:true},catalog=[];
 let selection=null,multiSelection=null,history=['previous'],redoHistory=[],drag=null,wallGesture=null,wallStart=null,polyPreview=null,start=null,routePoints=[],previewPoint=null,cableGesture=null,tool='select',resizeMode=false;
 let documentEpoch=0,drawingChangedSinceStartup=false,persistTimer=null,manualSaveFailed=false;
 `+extractFunction('applyRoomImport')+`
 function state(){return {id:doc.id,history:[...history],epoch:documentEpoch}}
 `,{safeStorage,populateDesktopToolbox:()=>{},setTool:()=>{},updateHistoryControls:()=>{},render:()=>{},clearPointerState:()=>{},clearTimeout:()=>{},saveAuto:()=>{ops.push('saved')},persistenceStatus:()=>{},close:()=>{},notify:()=>{},ops});
 return {sandbox,persisted,ops,initial,safeStorage};
}
test('injected import write failure restores document, history and stored keys',()=>{
 const h=importHarness('rd_types');
 assert.throws(()=>h.sandbox.applyRoomImport({doc:{id:'incoming',devices:[],cables:[]},types:{new:true},catalog:[],typesJSON:'{"new":true}',catalogJSON:null}),/ناموفق/);
 assert.equal(h.sandbox.state().id,'before');
 assert.deepEqual(Array.from(h.sandbox.state().history),['previous']);
 assert.equal(h.persisted.get('rd_last'),'{"old":true}');
 assert.equal(h.persisted.get('rd_types'),'{"oldType":true}');
 assert.equal(h.ops.length,0);
});
test('successful import clears history and queues mirror save after replacing the document',()=>{
 const h=importHarness();
 h.sandbox.applyRoomImport({doc:{id:'incoming',devices:[],cables:[]},types:{new:true},catalog:[],typesJSON:'{"new":true}',catalogJSON:null});
 assert.equal(h.sandbox.state().id,'incoming');
 assert.equal(h.sandbox.state().history.length,0);
 assert.deepEqual(h.ops,['saved']);
 assert.equal(h.persisted.get('rd_types'),'{"new":true}');
});

function mirrorHarness(){
 const writes=[],status=[];
 let release,notifyStarted;
 const started=new Promise(resolve=>{notifyStarted=resolve});
 const gate=new Promise(resolve=>{release=resolve});
 const ctx=context(`
 let doc={id:'a',name:'A',date:'today'},documentEpoch=0,mirrorGeneration=0,mirrorPending=false,mirrorSaveOk=false,primarySaveOk=true,mirrorQueue=Promise.resolve();
 `+extractFunction('saveAuto')+`
 function change(next){doc=next}
 function state(){return {mirrorPending,mirrorSaveOk,documentEpoch,mirrorGeneration}}
 function done(){return mirrorQueue}
 `,{
  safeStorage:{setItem:()=>true},mirrorOperation:async (_mode,value)=>{writes.push(JSON.parse(value).id);if(writes.length===1){notifyStarted();await gate}return true},
  persistenceStatus:()=>status.push('updated'),
  $:()=>({textContent:''}),notify:()=>{}
 });
 return {ctx,writes,status,release,started};
}
test('consecutive saves serialize IndexedDB writes and retain latest generation',async()=>{
 const h=mirrorHarness();
 h.ctx.saveAuto();h.ctx.change({id:'b',name:'B',date:'today'});h.ctx.saveAuto();
 await h.started;
 assert.deepEqual(h.writes,['a']);
 h.release();await h.ctx.done();
 assert.deepEqual(h.writes,['a','b']);
 assert.equal(h.ctx.state().mirrorPending,false);
 assert.equal(h.ctx.state().mirrorSaveOk,true);
 assert.equal(h.ctx.state().mirrorGeneration,2);
});
test('late recovery cannot overwrite a newer unsaved drawing',async()=>{
 let release;
 const pending=new Promise(resolve=>{release=resolve});
 const c=context(`
 let doc={id:'current',devices:[],cables:[]},documentEpoch=0,drawingChangedSinceStartup=false,mirrorQueue=Promise.resolve();
 `+extractFunction('recoverMirrorOnStartup')+`
 function edit(){documentEpoch++;drawingChangedSinceStartup=true;doc={id:'edited',devices:[],cables:[]}}
 function state(){return doc.id}
 `,{
 mirrorOperation:async()=>await pending,
 validateRoomDocument:x=>x,
 readLocalJSON:()=>null,render:()=>{},updateHistoryControls:()=>{},notify:()=>{}
 });
 const recovery=c.recoverMirrorOnStartup();
 c.edit();release(JSON.stringify({id:'stale',devices:[],cables:[]}));
 await recovery;
 assert.equal(c.state(),'edited');
});

test('rollback failure identifies damaged storage keys and prevents success notification',()=>{
 const h=importHarness('rd_types');
 h.persisted.set('rd_catalog','old');
 const originalSet=h.safeStorage;
 // The harness exposes the same storage object to the imported function.
 originalSet.setItem=(key,value)=>{
  if(key==='rd_types'&&value==='{"new":true}')return false;
  if(key==='rd_last'&&value==='{"old":true}')return false;
  h.persisted.set(key,String(value));return true;
 };
 assert.throws(()=>h.sandbox.applyRoomImport({doc:{id:'incoming',devices:[],cables:[]},types:{new:true},catalog:[],typesJSON:'{"new":true}',catalogJSON:null}),/بازگردانی اطلاعات مرورگر ناموفق بود.*rd_last/);
 assert.equal(h.sandbox.state().id,'before');
 assert.equal(h.ops.length,0);
});

test('undo rejects invalid history without mutating stacks',()=>{
 const c=context("let doc={id:'current',devices:[],cables:[]},history=['{invalid'],redoHistory=[],selection=null,multiSelection=null;"+
 extractFunction('applyHistoryStep')+extractFunction('performUndo')+
 "function state(){return {id:doc.id,history:[...history],redoHistory:[...redoHistory]}}",
 {validateRoomDocument:x=>x,notify:()=>{},clearPointerState:()=>{},scheduleSave:()=>{},render:()=>{},updateHistoryControls:()=>{}});
 c.performUndo();
 assert.equal(c.state().id,'current');
 assert.deepEqual(Array.from(c.state().history),['{invalid']);
 assert.equal(c.state().redoHistory.length,0);
});
test('undo and redo round-trip a valid snapshot',()=>{
 const before={id:'before',devices:[],cables:[],walls:[]};
 const after={id:'after',devices:[],cables:[],walls:[]};
 const code="let doc="+JSON.stringify(after)+",history=["+JSON.stringify(JSON.stringify(before))+"],redoHistory=[],selection=null,multiSelection=null;"+
 extractFunction('applyHistoryStep')+extractFunction('performUndo')+extractFunction('performRedo')+
 "function state(){return {id:doc.id,history:[...history],redoHistory:[...redoHistory]}}";
 const c=context(code,{validateRoomDocument:x=>x,notify:()=>{},clearPointerState:()=>{},scheduleSave:()=>{},render:()=>{},updateHistoryControls:()=>{}});
 c.performUndo();assert.equal(c.state().id,'before');
 c.performRedo();assert.equal(c.state().id,'after');
});


test('backup status does not treat stale IndexedDB success as current while a new save is pending',()=>{
 const backup={style:{},setAttribute(name,value){this[name]=value}};
 const c=context(
  'let mirrorSaveOk=true,mirrorPending=true,manualSaveFailed=false;'+
  extractFunction('persistenceStatus')+
  'function setState(saved,pending){mirrorSaveOk=saved;mirrorPending=pending}',
  {$:()=>backup}
 );
 c.persistenceStatus(false);
 assert.notEqual(backup.style.display,'none','stale mirror success must not hide backup warning');
 assert.match(backup.title,/ذخیره پایدار ناموفق/);
 c.setState(true,false);
 c.persistenceStatus(false);
 assert.equal(backup.style.display,'none','completed successful backup can be marked durable');
 c.setState(false,true);
 c.persistenceStatus(true);
 assert.equal(backup.style.display,'none','successful primary write is already durable');
 c.setState(false,false);
 c.persistenceStatus(false);
 assert.notEqual(backup.style.display,'none','both failed writes must expose backup action');
});


test('rejected mirror recovery is handled without overwriting current drawing',async()=>{
 const c=context(
  "let doc={id:'current',devices:[],cables:[]},documentEpoch=0,drawingChangedSinceStartup=false,mirrorQueue=Promise.resolve();"+
  extractFunction('recoverMirrorOnStartup')+
  "function state(){return doc.id}",
  {mirrorOperation:async()=>{throw Error('IndexedDB failed')},validateRoomDocument:x=>x,readLocalJSON:()=>null,render:()=>{},updateHistoryControls:()=>{},notify:()=>{}}
 );
 await assert.doesNotReject(c.recoverMirrorOnStartup());
 assert.equal(c.state(),'current');
});
