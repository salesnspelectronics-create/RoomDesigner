const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test'),crypto=require('node:crypto');
const c={};for(const file of ['data/svg-library-builtin.js','data/equipment-catalog-builtin.js','cable-routing.js','connection-model.js','equipment-release.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),c);
test('Power Terminal has seven combined buses and a separate power input, matching published and offline data',()=>{
 const json=JSON.parse(fs.readFileSync('data/equipment-catalog.json')),entry=json.entries.find(t=>t.code==='POWER-TERMINAL'),item=c.RoomEquipment.defaults().find(t=>t.code===entry.code);
 assert.equal(entry.name,'پاور ترمینال');assert.equal(entry.nameEn,'Power Terminal');assert.equal(entry.ports.length,8);assert.equal(entry.ports.filter(p=>p.type==='rs485_power').length,7);assert.equal(entry.ports.filter(p=>p.type==='power').length,1);assert.equal(new Set(entry.ports.map(p=>p.id)).size,8);
 assert.deepEqual(JSON.parse(JSON.stringify(item.ports)),entry.ports);assert.equal(item.w,84);assert.equal(item.h,148);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(entry.originalFilePath)).digest('hex'),entry.sourceSha256);
 const manifest=JSON.parse(fs.readFileSync('data/svg-library.json')),mapping=JSON.parse(fs.readFileSync('data/equipment-svg-map.json')),symbol=manifest.symbols.find(t=>t.id===entry.assetId),raw=fs.readFileSync(symbol.filePath,'utf8');
 assert.equal(mapping[entry.assetId],entry.assetId);assert.equal(c.SvgLibraryBuiltin.map[entry.assetId],entry.assetId);assert.equal(c.SvgLibraryBuiltin.assets[entry.assetId]+'\n',raw);assert.ok(!/<image|data:image|script/i.test(raw));
});
test('saved catalogs gain the terminal exactly once without replacing current devices or custom templates',()=>{
 const old=c.RoomEquipment.defaults().filter(t=>t.code!=='POWER-TERMINAL');old[0].name='Edited name';old.push({kind:'custom',name:'Custom item',ports:[]});
 const updated=c.RoomEquipment.appendMissingDefaults(old);assert.equal(updated.filter(t=>t.code==='POWER-TERMINAL').length,1);assert.equal(updated[0].name,'Edited name');assert.ok(updated.some(t=>t.name==='Custom item'));assert.equal(c.RoomEquipment.appendMissingDefaults(updated),updated);
});
