'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),context={};
for(const file of ['data/svg-library-builtin.js','data/equipment-catalog-builtin.js','cable-routing.js','connection-model.js','equipment-release.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const api=context.RoomEquipment;
test('missing ports use legacy defaults, explicit empty ports stay empty, and arrays are independent',()=>{
 const source=context.EquipmentCatalogBuiltin.entries[0];const original=source.ports;delete source.ports;
 assert.equal(JSON.stringify(api.defaults()[0].ports.map(p=>p.type)),JSON.stringify(['rs485_power']));
 try{source.ports=[];assert.equal(api.defaults()[0].ports.length,0)}finally{source.ports=original}
 const first=api.defaults().find(t=>t.code==='AC12CH'),second=api.defaults().find(t=>t.code==='AC12CH');first.ports[0].name='Changed';
 assert.equal(second.ports[0].name,'RS-485 + Power');assert.equal(context.EquipmentCatalogBuiltin.entries.find(t=>t.code==='AC12CH').ports[0].name,'RS-485 + Power');
});
test('explicit ports update saved catalog templates while preserving edited identities',()=>{
 const saved=api.defaults();const actuator=saved.find(t=>t.code==='AC12CH');actuator.name='Edited actuator';actuator.ports=[{id:'old',name:'Ethernet',type:'ethernet',side:'left'}];
 const upgraded=api.appendMissingDefaults(saved),updated=upgraded.find(t=>t.code==='AC12CH');assert.equal(updated.name,'Edited actuator');assert.equal(updated.ports.length,15);assert.equal(updated.ports[0].type,'rs485_power');assert.equal(actuator.ports.length,1);assert.equal(api.appendMissingDefaults(upgraded),upgraded);
});
test('both actuator models have exact identities, source hashes, published artwork and offline mappings',()=>{
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/equipment-catalog.json'))),manifest=JSON.parse(fs.readFileSync(path.join(root,'data/svg-library.json'))),map=JSON.parse(fs.readFileSync(path.join(root,'data/equipment-svg-map.json')));
 assert.equal(catalog.entries.length,30);
 for(const [code,name,nameEn,file]of [['AC12CH','مین 12 کانال','Actuator 12 CH','AC12CH.svg'],['AC4CH','مین 4 کانال','Actuator 4 CH','Main4C.svg']]){
  const entry=catalog.entries.find(t=>t.code===code),model=api.defaults().find(t=>t.code===code);
  assert.equal(entry.name,name);assert.equal(entry.nameEn,nameEn);assert.equal(entry.sourceFile,file);
  entry.ports.filter(p=>p.type!=='di').forEach((p,i)=>{assert.equal(p.id,i?'relay-'+String(i).padStart(2,'0'):'rs485-power');assert.equal(p.name,i?'R'+i:'RS-485 + Power');assert.equal(p.type,i?'do':'rs485_power');assert.equal(p.side,!i||code==='AC12CH'&&i<=2?'top':'bottom')});
  assert.deepEqual(entry.ports.filter(p=>p.type==='di'),[{id:'sensor-01',name:'S1',type:'di',side:'top'},{id:'sensor-02',name:'S2',type:'di',side:'top'}]);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,entry.originalFilePath))).digest('hex'),entry.sourceSha256);
  const symbol=manifest.symbols.find(s=>s.id===entry.assetId);
  assert.equal(map[entry.assetId],symbol.id);assert.equal(context.SvgLibraryBuiltin.assets[symbol.id]+'\n',fs.readFileSync(path.join(root,symbol.filePath),'utf8'));
  assert.equal(model.ports.length,code==='AC12CH'?15:7);assert.equal(model.ports[0].type,'rs485_power');assert.equal(JSON.stringify(model.ports),JSON.stringify(entry.ports));assert.equal(model.svgMode,'stretch');assert.equal(model.showLabel,true);assert.ok(model.svg);
 }
});
test('upgrading a saved catalog preserves edited models and custom equipment and adds models only once',()=>{
 const old=api.defaults().filter(t=>!['AC12CH','AC4CH'].includes(t.code));old[0].name='Edited existing name';old.push({name:'User device',kind:'custom',svg:'user artwork',ports:[{name:'BUS',type:'any',side:'left'}]});
 const before=JSON.stringify(old),upgraded=api.appendMissingDefaults(old);
 assert.equal(JSON.stringify(old),before);assert.equal(upgraded.length,37);assert.equal(upgraded[0],old[0]);assert.equal(upgraded[26],old[26]);assert.equal(api.appendMissingDefaults(upgraded),upgraded);
});
