/* Validate a release or materialize a browser export for review/commit. Never pushes. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),input=process.argv[2],check=!input||input==='--check';
const dom=new JSDOM('',{runScripts:'outside-only'});dom.window.eval(fs.readFileSync(path.join(root,'svg-engine.js'),'utf8'));
try{
 const bundle=check?{manifest:JSON.parse(fs.readFileSync(path.join(root,'data/svg-library.json'))),map:JSON.parse(fs.readFileSync(path.join(root,'data/equipment-svg-map.json')))}:JSON.parse(fs.readFileSync(path.resolve(input),'utf8'));
 const {manifest,map}=bundle;
 if(manifest?.schemaVersion!==1||!Number.isInteger(manifest.version)||manifest.version<1||!Array.isArray(manifest.symbols)||manifest.symbols.length>2000||!map||typeof map!=='object'||Array.isArray(map))throw Error('Invalid manifest or map');
 const ids=new Set(),paths=new Set(),assets=Object.create(null),writes=[];
 for(const e of manifest.symbols){
  if(!/^[\w-]+$/.test(e.id)||['__proto__','constructor','prototype'].includes(e.id)||ids.has(e.id)||typeof e.name!=='string'||!e.name.trim()||!/^assets\/svg\/(equipment|architecture|electrical|custom)\/[\w-]+\.svg$/.test(e.filePath)||paths.has(e.filePath)||!Number.isInteger(e.version)||e.version<1||![e.defaultWidth,e.defaultHeight].every(x=>Number.isFinite(x)&&x>0)||!Array.isArray(e.assignedEquipmentTypes)||!e.assignedEquipmentTypes.every(x=>typeof x==='string'))throw Error('Invalid entry: '+e.id);
  if(!e.filePath.startsWith('assets/svg/'+e.category+'/'))throw Error('Category mismatch: '+e.id);
  ids.add(e.id);paths.add(e.filePath);dom.window.SvgEngine.viewBox(e.viewBox);
  const target=path.resolve(root,e.filePath);if(!target.startsWith(root+path.sep))throw Error('Unsafe asset path');
  const raw=check?fs.readFileSync(target,'utf8'):bundle.files?.[e.filePath],safe=dom.window.SvgEngine.sanitize(raw);if(!safe)throw Error('Unsafe SVG: '+e.id);
  const actual=dom.window.SvgEngine.parse(safe).documentElement.getAttribute('viewBox');if(JSON.stringify(Array.from(dom.window.SvgEngine.viewBox(actual)))!==JSON.stringify(Array.from(dom.window.SvgEngine.viewBox(e.viewBox))))throw Error('ViewBox mismatch: '+e.id);
  assets[e.id]=safe;writes.push([target,safe+'\n']);
 }
 for(const [type,id]of Object.entries(map)){if(['__proto__','constructor','prototype'].includes(type)||id!==null&&!ids.has(id))throw Error('Invalid type mapping: '+type)}
 for(const e of manifest.symbols){const expected=Object.keys(map).filter(type=>map[type]===e.id).sort();if(JSON.stringify(expected)!==JSON.stringify([...e.assignedEquipmentTypes].sort()))throw Error('Assignments disagree: '+e.id)}
 if(!check){
  // Complete validation precedes every mutation. Existing unrelated files are retained.
  for(const [target,safe]of writes){fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,safe)}
  fs.writeFileSync(path.join(root,'data/svg-library.json'),JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(path.join(root,'data/equipment-svg-map.json'),JSON.stringify(map,null,2)+'\n');
  fs.writeFileSync(path.join(root,'data/svg-library-builtin.js'),'/* Generated offline fallback for the published library. */\nglobalThis.SvgLibraryBuiltin='+JSON.stringify({manifest,map,assets})+';\n');
 }
 console.log(`PASS: ${ids.size} SVGs and ${Object.keys(map).length} mappings validated${check?'':' and prepared for review'}`);
}catch(e){console.error(e.message);process.exitCode=1}finally{dom.window.close()}
