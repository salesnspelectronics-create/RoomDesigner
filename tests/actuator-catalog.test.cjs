'use strict';
// V325: AC4CH/combined RS485+Power were retired. Test current physical hardware contract.
const test=require('node:test'),assert=require('node:assert/strict'),{model,plain}=require('./model-harness.cjs');
test('current 12-channel actuator exposes thirteen disabled definitions; instances start with independent empty ports',()=>{
 const c=model(),entry=c.EquipmentCatalogBuiltin.entries.find(e=>e.catalogId==='actuator-12ch');assert.equal(entry.code,'AC12CH');assert.equal(entry.ports.length,13);assert.equal(entry.ports[0].type,'rs485');assert.equal(entry.ports.filter(p=>p.type==='do').length,12);assert.ok(entry.ports.every(p=>p.enabled===false));
 const a=c.RoomEquipment.defaults().find(e=>e.catalogId===entry.catalogId),b=c.RoomEquipment.defaults().find(e=>e.catalogId===entry.catalogId);a.ports.push({id:'user'});assert.equal(b.ports.length,0);assert.equal(entry.ports.length,13);
});
test('catalog refresh is deterministic, does not mutate input and keeps architecture and loads',()=>{
 const c=model(),old=c.RoomEquipment.defaults();old.push({kind:'bed',category:'architecture',name:'Custom plan',ports:[]});old.push(c.RoomConnections.consumers()[0]);const before=JSON.stringify(old),updated=c.RoomEquipment.appendMissingDefaults(old);
 assert.equal(JSON.stringify(old),before);assert.ok(updated.some(x=>x.name==='Custom plan'));assert.ok(updated.some(x=>x.kind==='load-light'));assert.deepEqual(plain(c.RoomEquipment.appendMissingDefaults(updated)),plain(updated));
});
