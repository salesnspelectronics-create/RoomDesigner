'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),test=require('node:test'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),context={};
for(const f of ['data/svg-library-builtin.js','data/equipment-catalog-builtin.js','cable-routing.js','connection-model.js','equipment-release.js'])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),context);
const model=context.RoomConnections,plain=x=>JSON.parse(JSON.stringify(x));
test('initialization marker preserves existing drawings, users and archives and never deletes recovery DB',async()=>{
 const values=new Map([['rd_last','old drawing'],['rd_profiles','old projects'],['rd_users','old users'],['rd_connection_backup_v1','old backup'],['another_app_setting','keep']]);
 const before=[...values],s={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v))};
 const idb={deleteDatabase(){throw Error('Recovery must never be erased')}};
 assert.equal(model.resetBrowserData(s,idb),true);assert.equal(await model.recoveryReset,true);
 for(const [key,value]of before)assert.equal(s.getItem(key),value);
 assert.equal(s.getItem(model.resetKey),'done');assert.equal(model.resetBrowserData(s,idb),false);
});

function storage(seed={},fail=()=>false){const data=new Map(Object.entries(seed));return {data,getItem:k=>data.get(k)??null,setItem(k,v){if(fail(k))throw Error('quota');data.set(k,String(v))},removeItem:k=>data.delete(k)}}
function legacy(){const device={id:'main',kind:'custom',equipmentRelease:context.RoomEquipment.release,assetId:'nsp-ac12ch',name:'Edited main',x:150,y:220,w:120,h:85,ports:[{id:'power',name:'Power',type:'power',side:'top'},{id:'r1',name:'R1',type:'rs485',side:'bottom'}]};return {schema:'room-designer/v0.3',name:'Existing drawing',devices:[device,{id:'bed',kind:'bed',x:10,y:10,w:20,h:30,ports:[]}],walls:[{id:'wall',a:{x:0,y:0},b:{x:5,y:5}}],layers:[{id:'main',name:'Main'}],cables:[{id:'old-wire',a:{dev:'main',port:'power'},b:{dev:'main',port:'r1'},type:'rs485'}],revisions:[{number:1,snapshot:{devices:[device],cables:[],walls:[]}}]}}
test('five separate physical connection types; published catalog equals offline data',()=>{
 assert.deepEqual(plain(model.colors),{power:'#DC2626',rs485:'#16A34A',do:'#D97706',di:'#0891B2',ethernet:'#2563EB'});
 assert.equal(Object.keys(model.types()).length,5);
 const json=JSON.parse(fs.readFileSync(path.join(root,'data/equipment-catalog.json')));assert.deepEqual(plain(context.EquipmentCatalogBuiltin),json);assert.equal(json.entries.length,31);
 for(const e of json.entries)for(const p of e.ports)assert.ok(Object.hasOwn(model.types(),p.type));
 assert.equal(model.consumers().length,6);for(const t of model.consumers())assert.ok(t.svgAssetId);
});
 test('legacy migration preserves geometry, names, profiles and shortcuts with current connection contract',()=>{
 const old=legacy(),seed={rd_last:JSON.stringify(old),rd_profiles:JSON.stringify({saved:old}),rd_shortcuts:JSON.stringify([{id:'s',data:old}]),rd_catalog:'[]'},s=storage(seed);
 assert.equal(model.migrateStorage(s),true);
 for(const doc of [JSON.parse(s.getItem('rd_last')),JSON.parse(s.getItem('rd_profiles')).saved,JSON.parse(s.getItem('rd_shortcuts'))[0].data]){
  assert.equal(doc.connectionModel,model.version);assert.equal(doc.cables.length,0);assert.deepEqual(doc.walls,old.walls);assert.deepEqual(doc.layers,old.layers);assert.equal(doc.devices[0].name,'Edited main');assert.equal(doc.devices[0].x,150);assert.equal(doc.devices[0].ports[0].type,'rs485');assert.equal(doc.devices[1].ports.length,0);
 }
 const after=JSON.stringify([...s.data]);assert.equal(model.migrateStorage(s),false);assert.equal(JSON.stringify([...s.data]),after);
});
test('persistent write failures roll back without legacy archives',()=>{
 const seed={rd_last:JSON.stringify(legacy()),rd_catalog:'[]',rd_types:'{}'};
 const denied=storage(seed,k=>k==='rd_types');assert.throws(()=>model.migrateStorage(denied),/quota/);assert.deepEqual(Object.fromEntries(denied.data),seed);
 let failed=false;const s=storage(seed,k=>k==='rd_last'&&!failed&&(failed=true));assert.throws(()=>model.migrateStorage(s),/quota/);for(const [k,v]of Object.entries(seed))assert.equal(s.getItem(k),v);assert.equal(s.getItem('rd_connection_model'),null);model.migrateStorage(s);assert.ok(![...s.data.keys()].some(k=>k.includes('backup')));
});
test('new-model document links and per-device edits survive normalization and legacy input is not mutated',()=>{
 const input=legacy(),original=JSON.stringify(input),reset=model.resetDocument(input);assert.equal(JSON.stringify(input),original);
 reset.devices[0].ports.push({id:'out',name:'R1',type:'do',side:'bottom'});reset.devices.push({id:'lamp',kind:'load-light',category:'loads',name:'Lamp',ports:[{id:'lamp-port',type:'do',name:'DO',side:'top'}]});reset.cables.push({id:'new-link',a:{dev:'main',port:'out'},b:{dev:'lamp',port:'lamp-port'},type:'do'});
 assert.deepEqual(plain(model.resetDocument(reset)),plain(reset));
});
test('disabled catalog relays are not silently added to existing devices',()=>{
 const d={connectionModel:model.version,devices:[{id:'main12',code:'AC12CH',ports:[{id:'bus12',name:'RS-485',type:'rs485',side:'top'}]}],cables:[]};
 const before=JSON.stringify(d);assert.equal(model.ensureRelayPorts(d),false);assert.equal(JSON.stringify(d),before);
});
