'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),{IDBFactory}=require('fake-indexeddb'),{html}=require('./source-harness.cjs');
const open=idb=>new Promise((resolve,reject)=>{const req=idb.open('room-designer-recovery',1);req.onupgradeneeded=()=>req.result.createObjectStore('backups');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
function write(db,entries){return new Promise((resolve,reject)=>{const tx=db.transaction('backups','readwrite');for(const [key,value]of entries)tx.objectStore('backups').put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
function get(db,key){return new Promise((resolve,reject)=>{const tx=db.transaction('backups'),req=tx.objectStore('backups').get(key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
test('opening recovery DB preserves original mirror and metadata once, before subsequent mirror writes',async()=>{
 const indexedDB=new IDBFactory(),db=await open(indexedDB),old='original legacy bytes',meta={generation:8};await write(db,[['last',old],['last-meta',meta]]);db.close();
 const code=html.slice(html.indexOf('const mirrorDb='),html.indexOf('function mirrorChecksum('))+'\nglobalThis.ready=mirrorDb;';
 const boot=async()=>{const c=vm.createContext({indexedDB,RoomConnections:{recoveryReset:Promise.resolve(true)}});vm.runInContext(code,c);return await c.ready};
 const current=await boot();assert.ok(current);assert.deepEqual(await get(current,'preserved-before-v325'),{mirror:old,mirrorMeta:meta});await write(current,[['last','newer']]);current.close();
 const reopened=await boot();assert.deepEqual(await get(reopened,'preserved-before-v325'),{mirror:old,mirrorMeta:meta});assert.equal(await get(reopened,'last'),'newer');reopened.close();
});
