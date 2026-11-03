'use strict';
const {JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path');
const {root}=require('./model-harness.cjs');
async function boot(){
 const raw=fs.readFileSync(path.join(root,'index.html'),'utf8'),script=[...raw.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('const writer=await RoomStorageSafety.acquireWriter'))[1];
 const dom=new JSDOM(raw,{url:'https://audit.local',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.matchMedia=()=>({matches:false,addEventListener(){}});w.structuredClone=structuredClone;w.confirm=()=>true;
 // DOM-only tests deliberately do not claim SVG layout or browser acceptance.
 const matrix={a:1,b:0,c:0,d:1,e:0,f:0,inverse(){return this},multiply(){return this}};
 w.SVGElement.prototype.createSVGPoint=()=>({x:0,y:0,matrixTransform(){return {x:this.x,y:this.y}}});w.SVGElement.prototype.getScreenCTM=()=>matrix;w.SVGElement.prototype.getCTM=()=>matrix;w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:0,height:0});
 Object.defineProperty(w.navigator,'locks',{value:{request:async(_name,_options,fn)=>fn({name:'test-writer'})}});
 w.localStorage.setItem('rd_active_user','Regression');
 for(const file of ['storage-safety.js','svg-engine.js','data/svg-library-builtin.js','data/equipment-catalog-builtin.js','cable-routing.js','connection-model.js','selection-geometry.js','polyline-editor.js','lighting-model.js','equipment-release.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));
 const expose=`window.audit={get doc(){return doc},set doc(v){doc=v},get selection(){return selection},set selection(v){selection=v},get catalog(){return catalog},get history(){return history},render,addDevice,prepareRoomImport,performUndo,snapshot,revisionMenu,groupAllSelected,ungroupSelected,applyRevisionViewState};`;
 await w.eval(script.slice(0,script.lastIndexOf('})();'))+expose+'})();');
 if(!w.audit){w.close();throw Error('Application did not finish startup')}
 return {w,a:w.audit,close:()=>w.close()};
}
module.exports={boot};
