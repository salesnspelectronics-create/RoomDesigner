'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),test=require('node:test'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),context={};
for(const f of ['data/svg-library-builtin.js','data/equipment-catalog-builtin.js','cable-routing.js','connection-model.js','equipment-release.js'])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),context);
const model=context.RoomConnections,plain=x=>JSON.parse(JSON.stringify(x));
test('explicit browser reset removes only this application data and recovery database once',async()=>{
 const values=new Map([['rd_last','old drawing'],['rd_profiles','old projects'],['rd_users','old users'],['rd_connection_backup_v1','old backup'],['another_app_setting','keep']]);
 const s={get length(){return values.size},key:i=>[...values.keys()][i],getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 let deleted=0;const idb={deleteDatabase(name){assert.equal(name,'room-designer-recovery');deleted++;const req={};queueMicrotask(()=>req.onsuccess());return req}};
 assert.equal(model.resetBrowserData(s,idb),true);assert.equal(await model.recoveryReset,true);
 for(const key of ['rd_last','rd_profiles','rd_users','rd_connection_backup_v1'])assert.equal(s.getItem(key),null);
 assert.equal(s.getItem('another_app_setting'),'keep');assert.equal(s.getItem(model.resetKey),'done');assert.equal(JSON.parse(s.getItem('rd_catalog')).length,36);
 s.setItem('rd_last','new drawing');assert.equal(model.resetBrowserData(s,idb),false);assert.equal(s.getItem('rd_last'),'new drawing');assert.equal(deleted,1);
});
function storage(seed={},fail=()=>false){const data=new Map(Object.entries(seed));return {data,getItem:k=>data.get(k)??null,setItem(k,v){if(fail(k))throw Error('quota');data.set(k,String(v))},removeItem:k=>data.delete(k)}}
function legacy(){const device={id:'main',kind:'custom',equipmentRelease:context.RoomEquipment.release,assetId:'nsp-ac12ch',name:'Edited main',x:150,y:220,w:120,h:85,ports:[{id:'power',name:'Power',type:'power',side:'top'},{id:'r1',name:'R1',type:'rs485',side:'bottom'}]};return {schema:'room-designer/v0.3',name:'Existing drawing',devices:[device,{id:'bed',kind:'bed',x:10,y:10,w:20,h:30,ports:[]}],walls:[{id:'wall',a:{x:0,y:0},b:{x:5,y:5}}],layers:[{id:'main',name:'Main'}],cables:[{id:'old-wire',a:{dev:'main',port:'power'},b:{dev:'main',port:'r1'},type:'rs485'}],revisions:[{number:1,snapshot:{devices:[device],cables:[],walls:[]}}]}}
test('exactly six agreed connection types and all 30 explicit catalog port definitions',()=>{
 assert.deepEqual(plain(model.colors),{power:'#DC2626',rs485:'#7C3AED',rs485_power:'#16A34A',do:'#D97706',di:'#0891B2',ethernet:'#2563EB'});
 assert.equal(Object.keys(model.types()).length,6);
 const json=JSON.parse(fs.readFileSync(path.join(root,'data/equipment-catalog.json')));assert.deepEqual(plain(context.EquipmentCatalogBuiltin),json);assert.equal(json.entries.length,30);
 for(const entry of json.entries){if(!['POWER-TERMINAL','POWER-SUPPLY'].includes(entry.code))assert.deepEqual(entry.ports[0],plain(model.equipmentPorts()[0]));assert.equal(entry.ports.length,entry.code==='AC12CH'?15:entry.code==='AC4CH'?7:entry.code==='POWER-TERMINAL'?8:1)}
 assert.equal(model.consumers().length,6);for(const t of model.consumers()){assert.equal(t.category,'loads');assert.equal(t.ports[0].type,['load-smoke','load-motion'].includes(t.kind)?'di':'do');assert.ok(t.svg.includes('<svg'))}
});
test('one-time reset covers drawing, profiles, revisions, shortcuts and custom catalog without losing geometry or names',()=>{
 const old=legacy(),seed={rd_last:JSON.stringify(old),rd_profiles:JSON.stringify({saved:old}),rd_shortcuts:JSON.stringify([{id:'shortcut',name:'Saved shortcut',data:old}]),rd_types:JSON.stringify({rs232:{name:'RS-232',color:'#000'},oldcustom:{name:'Old type',color:'#fff'}}),rd_catalog:JSON.stringify([{name:'Edited catalog model',kind:'custom',assetId:'nsp-ac12ch',ports:old.devices[0].ports},{name:'Custom object',kind:'custom',ports:old.devices[0].ports}])},s=storage(seed);
 assert.equal(model.migrateStorage(s),true);assert.equal(model.backupKey,undefined);assert.ok(![...s.data.keys()].some(k=>k.includes('backup')));
 for(const doc of [JSON.parse(s.getItem('rd_last')),JSON.parse(s.getItem('rd_profiles')).saved,JSON.parse(s.getItem('rd_shortcuts'))[0].data]){
  assert.equal(doc.connectionModel,model.version);assert.equal(doc.cables.length,0);assert.deepEqual(doc.walls,old.walls);assert.deepEqual(doc.layers,old.layers);assert.equal(doc.devices[0].name,'Edited main');assert.equal(doc.devices[0].x,150);assert.equal(doc.devices[0].ports.length,15);assert.equal(doc.devices[0].ports[0].type,'rs485_power');assert.equal(doc.devices[1].ports.length,0);assert.equal(doc.revisions[0].snapshot.devices[0].ports[0].type,'rs485_power');
 }
 const catalog=JSON.parse(s.getItem('rd_catalog'));assert.equal(catalog.length,37);assert.equal(catalog[0].name,'Edited catalog model');assert.equal(catalog[1].name,'Custom object');assert.ok(catalog.filter(t=>t.category!=='loads'&&!['POWER-TERMINAL','POWER-SUPPLY'].includes(t.code)).every(t=>t.ports[0].type==='rs485_power'&&t.ports.slice(1).every(p=>p.type==='do'||p.type==='di')));
 assert.deepEqual(JSON.parse(s.getItem('rd_types')),plain(model.types()));const after=JSON.stringify([...s.data]);assert.equal(model.migrateStorage(s),false);assert.equal(JSON.stringify([...s.data]),after);
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
test('existing mains gain missing relays once without changing bus IDs or existing wiring',()=>{
 const d={connectionModel:model.version,devices:[{id:'main12',code:'AC12CH',ports:[{id:'bus12',name:'RS-485 + Power',type:'rs485_power',side:'top'}]},{id:'main4',svgType:'nsp-ac4ch',ports:[{id:'bus4',name:'RS-485 + Power',type:'rs485_power',side:'top'}]}],cables:[{id:'bus-link',type:'rs485_power',a:{dev:'main12',port:'bus12'},b:{dev:'main4',port:'bus4'}}]};
 const cables=JSON.stringify(d.cables);assert.equal(model.ensureRelayPorts(d),true);assert.equal(d.devices[0].ports.length,15);assert.equal(d.devices[1].ports.length,7);assert.equal(d.devices[0].ports[0].id,'bus12');assert.equal(d.devices[1].ports[0].id,'bus4');assert.equal(JSON.stringify(d.cables),cables);
 for(const v of d.devices){const outputs=v.code==='AC12CH'?12:4;assert.equal(new Set(v.ports.map(p=>p.id)).size,v.ports.length);v.ports.slice(1).forEach((p,i)=>{assert.equal(p.type,i>=outputs?'di':'do');assert.equal(p.side,i>=outputs||v.code==='AC12CH'&&i<2?'top':'bottom');assert.equal(p.name,i>=outputs?'S'+(i-outputs+1):'R'+(i+1))})}
 assert.equal(model.ensureRelayPorts(d),false);assert.equal(JSON.stringify(d.cables),cables);
});
