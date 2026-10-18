'use strict';
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const test=require('node:test');
const html=readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const helper=html.slice(html.indexOf('function applyCatalogDisplay('),html.indexOf('function planSymbolCatalog('));
const add=html.slice(html.indexOf('function addDevice('),html.indexOf('const groups='));
test('adding a catalog model carries display defaults and identity to the placed device',()=>{
 const template={kind:'custom',code:'9r-alma',name:'کلید روشنایی ۹ پل ترموستاتیک',model:'الماس',category:'equipment',svg:'art',svgMode:'stretch',showLabel:true,w:150,h:90,ports:[]};
 const state={RoomEquipment:{release:'nsp-equipment-260'},catalog:[template],doc:{devices:[],activeLayer:'main'},selection:null,uid:()=> 'placed',canCreateInActiveLayer:()=>true,checkpoint(){},equipmentSvgType:t=>t.code,assignDefaultSvg(){},close(){},setTool(){},render(){},notify(){}};
 vm.createContext(state);vm.runInContext(helper+add,state);state.addDevice(0);
 const placed=state.doc.devices[0];
 for(const k of ['code','name','model','category','svgMode','showLabel','w','h'])assert.equal(placed[k],template[k]);
 assert.equal(placed.stretchSvg,true);assert.equal(placed.svg,'art');assert.equal(placed.id,'placed');assert.equal(template.id,undefined);
});
test('malformed optional defaults preserve safe device sizing and legacy defaults',()=>{
 const state={};vm.createContext(state);vm.runInContext(helper,state);
 const d={w:120,h:65};state.applyCatalogDisplay(d,{w:-1,h:Infinity,svgMode:'bad',showLabel:'yes',backgroundColor:'bad'});
 assert.deepEqual(d,{w:120,h:65});
});
