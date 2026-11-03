'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {extractFunction}=require('./source-harness.cjs');
const c=vm.createContext({});vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../storage-safety.js'),'utf8'),c);const safety=c.RoomStorageSafety;
function storage(seed){const values=new Map(Object.entries(seed));return {values,get length(){return values.size},key:i=>[...values.keys()][i],getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v))}}
test('migration archive preserves every original byte including corrupt data and old backups; retry is immutable',()=>{
 const seed={rd_last:'{broken',rd_profiles:'projects',rd_svg_drafts:'draft',rd_equipment_backup_old:'backup',other:'keep'},s=storage(seed);
 assert.equal(safety.preserveMigration(s,'new','physical'),true);const saved=s.getItem(safety.archiveKey),bundle=JSON.parse(saved);
 for(const [key,value]of Object.entries(seed))assert.equal(s.getItem(key),value);
 assert.deepEqual(bundle.values,{rd_last:'{broken',rd_profiles:'projects',rd_svg_drafts:'draft',rd_equipment_backup_old:'backup'});
 s.setItem('rd_last','migrated');assert.equal(safety.preserveMigration(s,'new','physical'),false);assert.equal(s.getItem(safety.archiveKey),saved);
});
test('quota failure occurs before legacy values or version markers change',()=>{
 const s=storage({rd_last:'drawing'});s.setItem=()=>{throw Error('quota')};assert.throws(()=>safety.preserveMigration(s,'new','physical'),/quota/);assert.deepEqual([...s.values],[['rd_last','drawing']]);
});
test('one origin admits one writer, reopening after release works and unsupported locks fail closed',async()=>{
 let held=false;
 const locks={async request(name,options,callback){assert.equal(name,'room-designer-storage-writer');assert.equal(options.ifAvailable,true);if(held)return callback(null);held=true;try{return await callback({name})}finally{held=false}}};
 const a=await safety.acquireWriter(locks);assert.equal(a.ok,true);
 assert.equal((await safety.acquireWriter(locks)).reason,'busy');a.release();await new Promise(r=>setImmediate(r));
 const b=await safety.acquireWriter(locks);assert.equal(b.ok,true);b.release();
 assert.equal((await safety.acquireWriter()).ok,false);
 assert.equal((await safety.acquireWriter({request(){throw Error('denied')}})).ok,false);
});
test('revision captures and restores page layout, display flags and independent detail positions; old versions reset absent view fields',()=>{
 const scope=vm.createContext({normalizeSvgReferences:()=>{},RoomConnections:{version:'test'},structuredClone});vm.runInContext(extractFunction('snapshot')+'\n'+extractFunction('applyRevisionViewState'),scope);
 const d={name:'x',devices:[],cables:[],walls:[],pageLayout:{version:1,originX:0,originY:12},canvasColorMode:true,showAllProductDetails:true,productDetailPositions:{a:{x:5,y:10}}};
 const snap=scope.snapshot(d);d.pageLayout.originY=99;d.productDetailPositions.a.x=99;scope.applyRevisionViewState(d,snap);
 assert.equal(d.pageLayout.originY,12);assert.equal(d.productDetailPositions.a.x,5);assert.equal(d.canvasColorMode,true);assert.equal(d.showAllProductDetails,true);d.productDetailPositions.a.x=77;assert.equal(snap.productDetailPositions.a.x,5);
 scope.applyRevisionViewState(d,{});assert.equal('pageLayout' in d,false);assert.equal('showAllProductDetails' in d,false);
});
test('Undo retains the newest state while pruning memory-heavy older entries',()=>{
 const trim=vm.runInNewContext(extractFunction('trimHistory')+';trimHistory');const stack=Array.from({length:40},()=> 'x'.repeat(1024*1024));trim(stack);assert.equal(stack.length,16);const newest=stack.at(-1);assert.equal(newest.length,1024*1024);
});
