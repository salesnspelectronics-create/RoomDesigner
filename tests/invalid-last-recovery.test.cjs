'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),source=html.slice(html.indexOf('let rdLastBlocked=false'),html.indexOf('const $=x=>document.getElementById(x)'));
function harness(raw){const map=new Map([['rd_last',raw]]),writes=[];const context=vm.createContext({Map,Set,JSON,Error,String,console,window:{localStorage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>{writes.push([k,v]);map.set(k,v)},removeItem:k=>{writes.push([k,null]);map.delete(k)}}}});vm.runInContext(source,context);return {map,writes,context}}
test('malformed JSON is preserved and blocked',()=>{const h=harness('{broken');vm.runInContext("readLocalJSON('rd_last',null,v=>true)",h.context);assert.equal(vm.runInContext('rdLastBlocked',h.context),true);assert.equal(vm.runInContext("safeStorage.setItem('rd_last','{}')",h.context),false);assert.equal(vm.runInContext("safeStorage.removeItem('rd_last')",h.context),false);assert.equal(h.map.get('rd_last'),'{broken');assert.equal(h.writes.length,0)});
test('invalid schema is preserved',()=>{const h=harness('{"devices":null,"cables":[]}');vm.runInContext("readLocalJSON('rd_last',null,v=>Array.isArray(v.devices)&&Array.isArray(v.cables))",h.context);assert.equal(vm.runInContext('rdLastBlocked',h.context),true);assert.equal(vm.runInContext("safeStorage.setItem('rd_last','{}')",h.context),false);assert.equal(h.map.get('rd_last'),'{"devices":null,"cables":[]}')});
test('valid document remains writable',()=>{const h=harness('{"devices":[],"cables":[]}');vm.runInContext("readLocalJSON('rd_last',null,v=>Array.isArray(v.devices)&&Array.isArray(v.cables))",h.context);assert.equal(vm.runInContext('rdLastBlocked',h.context),false);assert.equal(vm.runInContext("safeStorage.setItem('rd_last','next')",h.context),true);assert.equal(h.map.get('rd_last'),'next')});
test('autosave fails closed without mirror writes',()=>{const h=harness('{broken');vm.runInContext("readLocalJSON('rd_last',null,v=>true)",h.context);const fn=html.slice(html.indexOf('function saveAuto(){'),html.indexOf('async function recoverMirrorOnStartup()'));vm.runInContext('var manualSaveFailed=false,documentEpoch=0;var persistenceStatus=()=>{},notify=()=>{};',h.context);vm.runInContext(fn,h.context);assert.equal(vm.runInContext('saveAuto()',h.context),false);assert.equal(h.map.get('rd_last'),'{broken');assert.equal(h.writes.length,0)});
test('blocked SVG migration and explicit backup confirmation',()=>{assert.match(html,/if\(key==='rd_last'&&rdLastBlocked\)continue;/);assert.match(html,/if\(!rdLastBackupConfirmed\)/);assert.match(html,/meta\.checksum!==mirrorChecksum\(raw\)/)});

test('legacy saved product detail positions without enabled are valid; malformed enabled stays invalid',()=>{
 const fn=html.slice(html.indexOf('function validateRoomDocument(d){'),html.indexOf('function prepareRoomImport(input){'));
 assert.ok(fn.includes("v.detailView.enabled!=null&&typeof v.detailView.enabled!=='boolean'"));
 const LightingModel={isSwitch:v=>['doorbell','power-switch'].includes(v.kind),configuration:v=>({lightingModel:v.lightingModel,orientation:v.orientation}),modelsFor:v=>[{id:v.lightingModel}],modes:['code'],counts:[3],isIcon:()=>true};
 const RoomEquipment={typeFor:()=>({fields:[]}),definitionFor:()=>({}),installationDirectionsFor:()=>[],orientationsFor:v=>[{id:v.orientation}],familyFor:()=>({controlCount:3})};
 const validate=vm.runInNewContext(fn+';validateRoomDocument',{LightingModel,RoomEquipment,devicePortDefinitions:()=>[],configurablePorts:()=>false});
 const devices=['doorbell','power-switch'].map((kind,i)=>({id:'saved-'+i,kind,x:100,y:100,w:50,h:25,ports:[],detailView:{x:10,y:20,w:70,h:80},gangCount:3,gangIcons:['a','b','c'],lightingModel:'negin',orientation:'portrait'}));
 const saved={schema:'room-designer/v0.3',devices,cables:[],walls:[],pageLayout:{version:1,originX:0,originY:0}};
 assert.equal(validate(saved).devices.length,2);
 devices[0].detailView.enabled=false;assert.equal(validate(saved).devices.length,2);
 devices[0].detailView.enabled=true;assert.equal(validate(saved).devices.length,2);
 devices[0].detailView.enabled='true';assert.throws(()=>validate(saved),/جزئیات محصول/);
});
