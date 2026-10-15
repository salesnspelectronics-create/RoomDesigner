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
 const body=source.indexOf('{',start);let depth=0,quote='',escape=false;
 for(let i=body;i<source.length;i++){
  const c=source[i];
  if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue}
  if(c==="'"||c==='"'||c==='\x60'){quote=c;continue}
  if(c==='{')depth++;else if(c==='}'&&!--depth)return source.slice(start,i+1);
 }
 throw Error('Unterminated '+name);
}
function context(code,globals={}){const sandbox={...globals};vm.createContext(sandbox);vm.runInContext(code,sandbox);return sandbox}
test('source includes stable project export/import and undo APIs',()=>{
 for(const name of ['snapshot','validateRoomDocument','prepareRoomImport','applyRoomImport','performUndo','performRedo','groupAllSelected','ungroupSelected'])assert.ok(source.includes('function '+name+'('),name);
});
test('revision snapshot includes layers, active layer, without nested revisions',()=>{
 const scope=context(extractFunction('snapshot'));const d={name:'demo',date:'2026-10-15',devices:[{id:'a'}],cables:[],walls:[],layers:[{id:'main',name:'original',locked:true}],activeLayer:'main',revisions:[{snapshot:{revisions:[]}}]};
 const snap=scope.snapshot(d);assert.equal(snap.schemaVersion,3);assert.equal(snap.activeLayer,'main');assert.equal(snap.layers[0].locked,true);
 assert.equal('revisions' in snap,false);
 d.layers[0].name='changed';d.devices[0].id='changed';
 assert.equal(snap.layers[0].name,'original');assert.equal(snap.devices[0].id,'a');
});
test('UIDs are unique across a large batch',()=>{
 const uidSource=source.slice(source.indexOf('const issuedIds=new Set()'),source.indexOf('function uid()'))+extractFunction('uid');
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
 assert.match(impl,/if\(old===null\)safeStorage\.removeItem\(key\)/);
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
 let documentEpoch=0,drawingChangedSinceStartup=false,persistTimer=null;
 `+extractFunction('applyRoomImport')+`
 function state(){return {id:doc.id,history:[...history],epoch:documentEpoch}}
 `,{safeStorage,populateDesktopToolbox:()=>{},setTool:()=>{},updateHistoryControls:()=>{},render:()=>{},clearPointerState:()=>{},clearTimeout:()=>{},saveAuto:()=>{ops.push('saved')},close:()=>{},notify:()=>{},ops});
 return {sandbox,persisted,ops,initial};
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
