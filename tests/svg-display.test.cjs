const fs=require('fs'); const {JSDOM}=require('jsdom'); const raw=fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');const script=[...raw.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1];const expose="window.audit={get doc(){return doc},set doc(v){doc=v},get selection(){return selection},set selection(v){selection=v},get multiSelection(){return multiSelection},set multiSelection(v){multiSelection=v},get types(){return types},set types(v){types=v},get catalog(){return catalog},get history(){return history},render,checkpoint,performUndo,copyDrawing,cutDrawing,pasteDrawing,snapshot,diffSummary,findCableNear,nearPort,portInfo,layerEdit,saveAuto,typesMenu,printMenu,printNow,validateRoomDocument,svgArtwork,propertyMenu,deviceBackground,deviceTextColor,deviceEditor,addDevice};";function boot(seed={}){const dom=new JSDOM(raw.replace(/<script>[\s\S]*?<\/script>/,''),{url:'https://audit.local',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.matchMedia=()=>({matches:false,addEventListener(){}});w.structuredClone=structuredClone;w.confirm=()=>true;w.SVGElement.prototype.getScreenCTM=()=>({a:1,b:0,c:0,d:1,e:0,f:0,inverse(){return this}});w.SVGElement.prototype.createSVGPoint=()=>({x:0,y:0,matrixTransform(){return {x:this.x,y:this.y}}});for(const [k,v]of Object.entries(seed))w.localStorage.setItem(k,v);let error=null;try{w.eval(fs.readFileSync(require('node:path').join(__dirname,'..','svg-engine.js'),'utf8'));w.eval(fs.readFileSync(require('node:path').join(__dirname,'..','data/svg-library-builtin.js'),'utf8'));for(const p of ['data/equipment-catalog-builtin.js','equipment-release.js'])w.eval(fs.readFileSync(require('node:path').join(__dirname,'..',p),'utf8'));w.eval(script.slice(0,script.lastIndexOf('})();'))+expose+'})();')}catch(e){error=e.message}return {dom,w,a:w.audit,error};}


const assert=require('node:assert/strict');
(async()=>{
 const {w,a,error}=boot({rd_active_user:'Tester'});assert.equal(error,null);
 const art="<?xml version=\"1.0\"?><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><font id=\"FontID0\"><font-face font-family=\"Calibri\"/></font><style>@font-face {font-family:\"Calibri\";src:url(\"#FontID0\") format(svg)} .str0{stroke:#333333;stroke-width:2}.fil0{fill:none}.fnt0{font-size:15px;font-family:Calibri}</style></defs><rect class=\"fil0 str0\" x=\"5\" y=\"5\" width=\"90\" height=\"70\"/><text class=\"fnt0\" x=\"40\" y=\"95\">108</text></svg>";
 const safe=a.svgArtwork(art);assert.ok(safe,'user Corel SVG must be accepted');
 assert.ok(!safe.includes('@font-face'));assert.ok(!safe.includes('<font'));assert.ok(!safe.includes('<style'));
 assert.ok(safe.includes('stroke:#333333'));assert.ok(safe.includes('>108</text>'));
 a.doc={schema:'room-designer/v0.3',id:'test',name:'Test',date:'2026-10-11',devices:[{id:'d1',name:'Doorbell',kind:'doorbell',equipmentRelease:w.RoomEquipment.release,x:100,y:100,w:120,h:65,ports:[{id:'p1',name:'LAN',type:'ethernet',side:'left'}]}],cables:[],walls:[]};a.selection={kind:'device',id:'d1'};a.propertyMenu();
 const input=w.document.getElementById('deviceSvgFile');Object.defineProperty(input,'files',{value:[{name:'dorbel-c.svg',text:async()=>art}],configurable:true});
 input.dispatchEvent(new w.Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,0));
 assert.ok(a.doc.devices[0].svg);assert.ok(w.document.querySelector('#drawing image'));assert.equal(a.deviceBackground(a.doc.devices[0]),'#ffffff');
 assert.equal(w.document.getElementById('dBackground').value,'#ffffff');
 assert.match(w.document.getElementById('deviceSvgStatus').textContent,/dorbel-c/);
 w.document.querySelector('[data-act="saveDevice"]').click();
 assert.ok(a.doc.devices[0].svg);assert.equal(a.doc.devices[0].backgroundColor,'#ffffff');assert.ok(w.document.querySelector('#drawing image'));
 a.selection={kind:'device',id:'d1'};a.propertyMenu();w.document.getElementById('dBackground').value='#ddeeff';w.document.querySelector('[data-act="saveDevice"]').click();
 assert.equal(a.deviceBackground(a.doc.devices[0]),'#ddeeff');
 const snapshot=JSON.stringify(a.doc),file=w.document.getElementById('fileInput');Object.defineProperty(file,'files',{value:[{size:100,text:async()=>snapshot}],configurable:true});
 file.dispatchEvent(new w.Event('change'));await new Promise(r=>setTimeout(r,0));
 assert.equal(a.doc.devices[0].backgroundColor,'#ddeeff');assert.ok(w.document.querySelector('#drawing image'));
 w.document.body.classList.add('desktop-layout');a.selection={kind:'device',id:'d1'};a.render();const desktop=w.document.getElementById('deskProp-backgroundColor');desktop.value='#112233';desktop.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(a.doc.devices[0].backgroundColor,'#112233');assert.equal(a.deviceBackground(a.doc.devices[0]),'#112233');
 assert.equal(a.svgArtwork('<svg xmlns="http://www.w3.org/2000/svg"><style>@import "https://invalid/evil.css";</style></svg>'),null);
 assert.equal(a.svgArtwork('<svg xmlns="http://www.w3.org/2000/svg"><style>.x{fill:url(https://invalid/a)}</style><path class="x"/></svg>'),null);
 assert.equal(a.svgArtwork('<svg xmlns="http://www.w3.org/2000/svg"><script>bad</script></svg>'),null);
 a.deviceEditor();w.document.getElementById('newName').value='Library Doorbell';const libraryInput=w.document.getElementById('newSvg');Object.defineProperty(libraryInput,'files',{value:[{name:'doorbell.svg',text:async()=>art}],configurable:true});w.document.querySelector('[data-act="saveCatalog"]').click();await new Promise(r=>setTimeout(r,0));assert.ok(a.catalog.at(-1).svg);a.addDevice(a.catalog.length-1);assert.ok(a.doc.devices.at(-1).svg);assert.equal(a.deviceBackground(a.doc.devices.at(-1)),'#ffffff');
 console.log('PASS: synthetic Corel SVG accepted, selected, rendered, saved, recolored, exported/imported; desktop color edit persists; script/import/external URL rejected.');
 w.close();
})().catch(e=>{console.error(e);process.exit(1)});
