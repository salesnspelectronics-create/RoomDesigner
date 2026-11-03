'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{boot}=require('./dom-harness.cjs'),{root}=require('./model-harness.cjs');
test('all current published library assets and mappings match offline fallback and sanitize',async()=>{
 const h=await boot();try{const {w}=h,manifest=JSON.parse(fs.readFileSync(path.join(root,'data/svg-library.json'))),map=JSON.parse(fs.readFileSync(path.join(root,'data/equipment-svg-map.json')));assert.ok(manifest.symbols.length>=163);assert.deepEqual(JSON.parse(JSON.stringify(w.SvgLibraryBuiltin.map)),map);
 for(const e of manifest.symbols){const svg=fs.readFileSync(path.join(root,e.filePath),'utf8');assert.ok(w.SvgEngine.sanitize(svg),e.id);assert.equal(w.SvgLibraryBuiltin.assets[e.id].replace(/\r\n/g,'\n').trimEnd(),svg.replace(/\r\n/g,'\n').trimEnd());for(const type of e.assignedEquipmentTypes)if(Object.hasOwn(map,type))assert.equal(map[type],e.id)}
 }finally{h.close()}
});
test('current application places independent catalog devices, renders artwork and undoes insertion',async()=>{
 const h=await boot();try{const {a,w}=h;assert.equal(a.doc.devices.length,0);a.addDevice(0);const first=a.doc.devices[0];assert.ok(first.realAssetId);assert.equal(w.document.querySelectorAll('#drawing g[data-kind="device"]').length,1);a.addDevice(0);assert.equal(a.doc.devices.length,2);assert.notEqual(a.doc.devices[0].id,a.doc.devices[1].id);a.doc.devices[0].ports.push({id:'test',name:'Test',type:'power',side:'top'});assert.equal(a.doc.devices[1].ports.length,0);assert.equal(a.catalog[0].ports.length,0);a.performUndo();assert.equal(a.doc.devices.length,1)}finally{h.close()}
});
