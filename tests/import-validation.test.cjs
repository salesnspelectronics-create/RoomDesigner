
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const source=html.slice(html.indexOf('function validateRoomDocument(d)'),html.indexOf("try{const last=JSON.parse"));
function drawing(name='Current'){
 return {schema:'room-designer/v0.3',id:name,name,date:'2026-10-11',devices:[{id:'d1',name:'A',kind:'custom',x:100,y:100,w:120,h:65,ports:[{id:'p1',name:'LAN',type:'ethernet',side:'right'}]}],cables:[],walls:[],layers:[{id:'main',name:'Main',visible:true}],activeLayer:'main'};
}
function harness(){
 const state={writes:[],messages:[],failRender:false,failStorage:false,cancelled:[],handler:null};
 const nodes={fileInput:{addEventListener:(_event,handler)=>state.handler=handler}};
 const context=vm.createContext({
  console,JSON,Map,Set,Number,Object,Array,Error,Math,
  $:id=>nodes[id],defaults:{ethernet:{name:'Ethernet',color:'#17b77f'}},
  safeStorage:{setItem:(key,value)=>{state.writes.push([key,value]);return !state.failStorage}},
  svgArtwork:()=>null,
  notify:m=>state.messages.push(m),persistenceStatus:ok=>state.saved=ok,
  clearTimeout:id=>state.cancelled.push(id),close:()=>{},
  clearPointerState:()=>{},updateHistoryControls:()=>{},
  populateDesktopToolbox:()=>{context.catalog.map(x=>x.name)},
  render:()=>{if(state.failRender){state.failRender=false;throw Error('render failed')}},
  saveAuto:()=>{state.writes.push(['rd_last',JSON.stringify(context.doc)]);return !state.failStorage},
  setTool:t=>{context.tool=t;context.render()},
  doc:drawing(),types:{ethernet:{name:'Ethernet',color:'#17b77f'}},
  catalog:[{name:'Original',ports:[]}],selection:{kind:'device',id:'d1'},
  multiSelection:{devices:['d1'],walls:[],cables:[]},history:['previous'],redoHistory:['future'],
  drag:null,wallGesture:null,wallStart:null,polyPreview:null,start:null,routePoints:[],
  previewPoint:null,cableGesture:null,tool:'select',resizeMode:false,persistTimer:17
 });
 vm.runInContext(source,context);
 const before=()=>JSON.stringify({doc:context.doc,types:context.types,catalog:context.catalog,selection:context.selection,multiSelection:context.multiSelection,history:context.history,redoHistory:context.redoHistory});
 async function importFile(input,size=100){
  const target={files:[{size,text:async()=>typeof input==='string'?input:JSON.stringify(input)}],value:'selected'};
  await state.handler({target});assert.equal(target.value,'');
 }
 return {state,context,before,importFile};
}
const invalidCases=[
 ['invalid JSON','{broken'],
 ['invalid catalog type',{doc:drawing('Imported'),catalog:'invalid'}],
 ['null catalog entry',{doc:drawing('Imported'),catalog:[null]}],
 ['invalid catalog port',{doc:drawing('Imported'),catalog:[{name:'Bad',ports:[{name:'LAN',type:'ethernet',side:'diagonal'}]}]}],
 ['invalid types',{doc:drawing('Imported'),types:[]}],
 ['invalid type color',{doc:drawing('Imported'),types:{bad:{name:'Bad',color:'red" data-injected="true'}}}],
 ['invalid layers',{doc:{...drawing('Imported'),layers:[null]}}],
 ['duplicate layer IDs',{doc:{...drawing('Imported'),layers:[{id:'main',name:'A'},{id:'main',name:'B'}]}}],
 ['invalid revision snapshot',{doc:{...drawing('Imported'),revisions:[{number:1,snapshot:{devices:null,cables:[]}}]}}],
 ['missing port endpoint',{doc:{...drawing('Imported'),cables:[{id:'c1',a:{dev:'d1',port:'missing'},b:{dev:'d1',port:'p1'}}]}}],
 ['invalid SVG',{doc:{...drawing('Imported'),devices:[{...drawing().devices[0],svg:'invalid-svg'}]}}]
];
for(const [name,input] of invalidCases)test('rejected import preserves all current state: '+name,async()=>{
 const h=harness(),before=h.before();await h.importFile(input);
 assert.equal(h.before(),before);assert.equal(h.state.writes.length,0);
 assert.match(h.state.messages.at(-1),/خطا/);assert.equal(h.context.persistTimer,17);
});
test('valid envelope replaces drawing, types and catalog after validation',async()=>{
 const h=harness();await h.importFile({doc:drawing('Imported'),types:{knx:{name:'KNX',color:'#abc'}},catalog:[{name:'New',kind:'custom',ports:[{name:'BUS',type:'knx',side:'left'}]}]});
 assert.equal(h.context.doc.name,'Imported');assert.equal(h.context.types.knx.name,'KNX');assert.equal(h.context.catalog[0].name,'New');
 assert.equal(h.context.selection,null);assert.equal(h.context.multiSelection,null);assert.equal(h.context.history.length,0);assert.equal(h.context.redoHistory.length,0);
 assert.deepEqual(h.state.writes.map(x=>x[0]),['rd_types','rd_catalog','rd_last']);assert.equal(h.state.saved,true);
});
test('legacy bare drawing retains existing types and catalog',async()=>{
 const h=harness(),oldTypes=h.context.types,oldCatalog=h.context.catalog;const legacy=drawing('Legacy');delete legacy.layers;delete legacy.activeLayer;delete legacy.walls;
 await h.importFile(legacy);assert.equal(h.context.doc.name,'Legacy');assert.equal(h.context.doc.walls.length,0);
 assert.equal(h.context.types,oldTypes);assert.equal(h.context.catalog,oldCatalog);assert.deepEqual(h.state.writes.map(x=>x[0]),['rd_last']);
});
test('old revision snapshot without walls or layers remains importable',async()=>{
 const h=harness(),old=drawing('Old');delete old.layers;delete old.walls;delete old.activeLayer;
 await h.importFile({doc:{...drawing('Imported'),revisions:[{number:1,snapshot:old}]}});
 assert.equal(h.context.doc.name,'Imported');assert.equal(h.state.saved,true);
});
test('unexpected render failure rolls back model and does not write storage',async()=>{
 const h=harness(),before=h.before();h.state.failRender=true;await h.importFile({doc:drawing('Imported'),catalog:[]});
 assert.equal(h.before(),before);assert.equal(h.state.writes.length,0);assert.match(h.state.messages.at(-1),/render failed/);
});
test('oversized file is rejected without replacing current drawing',async()=>{
 const h=harness(),before=h.before();await h.importFile({doc:drawing('Imported')},25*1024*1024+1);
 assert.equal(h.before(),before);assert.equal(h.state.writes.length,0);
});
test('storage failure keeps valid imported drawing and reports unsuccessful persistence',async()=>{
 const h=harness();h.state.failStorage=true;await h.importFile({doc:drawing('Imported')});
 assert.equal(h.context.doc.name,'Imported');assert.equal(h.state.saved,false);assert.match(h.state.messages.at(-1),/ناموفق/);
});
