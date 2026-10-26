'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let html=fs.readFileSync('index.html','utf8');const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes("(()=>{'use strict';"))[1],at=main.lastIndexOf('})();');
  html=html.replace(main,main.slice(0,at)+"window.navigationAudit={get doc(){return doc},get catalog(){return catalog},get view(){return view},set view(v){view=v;render()},get tool(){return tool},get start(){return start},get history(){return history},get temporaryPan(){return !!drag?.temporaryPan},addDevice,effectiveArtwork,deviceArtwork,defaultEquipmentDimensions,setTool,render,portInfo};"+main.slice(at));
  await page.route('https://roomdesigner.test/**',route=>{const relative=decodeURIComponent(new URL(route.request().url()).pathname).slice(1);if(!relative)return route.fulfill({contentType:'text/html',body:html});const file=path.resolve(relative);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:relative.endsWith('.js')?'application/javascript':relative.endsWith('.json')?'application/json':'image/svg+xml',body:fs.readFileSync(file)});});
  await page.addInitScript(()=>{localStorage.setItem('rd_active_user','Tester');localStorage.setItem('rd_storage_reset_physical_v1','done')});
  await page.goto('https://roomdesigner.test/');await page.waitForFunction(()=>window.__roomStartupReady&&window.navigationAudit);
  if(await page.locator('#overlay.show').count())await page.locator('#closeSheet').click();page.setDefaultTimeout(8000);

  const result=await page.evaluate(()=>{
   const out={};
   for(const code of ['1L','6R-01','TMP-7SEG']){
    navigationAudit.addDevice(navigationAudit.catalog.findIndex(t=>t.code===code));const d=navigationAudit.doc.devices.at(-1),raw=navigationAudit.deviceArtwork(d),effective=navigationAudit.effectiveArtwork(d);
    out[code]={rawBox:SvgEngine.viewBox(SvgEngine.parse(raw).documentElement.getAttribute('viewBox')),effectiveBox:SvgEngine.viewBox(SvgEngine.parse(effective).documentElement.getAttribute('viewBox')),bounds:SvgEngine.bounds(raw),w:d.w,h:d.h};
    if(code==='TMP-7SEG'){
     const legacy=raw.replace('viewBox="306.9 257.6 452.6 416.5"','viewBox="0 0 1062 1018"');
     out.thermostatLegacyBox=SvgEngine.viewBox(SvgEngine.parse(navigationAudit.effectiveArtwork({...d,svg:legacy})).documentElement.getAttribute('viewBox'));
    }
    if(code==='6R-01'){
     const legacy=raw.replace('viewBox="311.31 254.14 446.69 410.47"','viewBox="0 0 1062 1018"');
     out.legacyBox=SvgEngine.viewBox(SvgEngine.parse(navigationAudit.effectiveArtwork({...d,svg:legacy})).documentElement.getAttribute('viewBox'));
    }
   }
   out.visibleOnly=SvgEngine.bounds('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><polygon points="10,20 110,20 110,70 10,70"/><rect x="500" y="500" width="200" height="200" visibility="hidden"/></svg>');
   return out;
  });
  assert.deepEqual(result['6R-01'].rawBox,[311.31,254.14,446.69,410.47]);
  for(const code of ['1L','6R-01','TMP-7SEG']){assert.ok(result[code].bounds);assert.ok(result[code].effectiveBox[2]<470);assert.ok(result[code].effectiveBox[3]<450);}
  assert.deepEqual(result['TMP-7SEG'].rawBox,[306.9,257.6,452.6,416.5]);
  assert.ok(result.thermostatLegacyBox[2]<480&&result.thermostatLegacyBox[3]<450,'clipPath rectangle must not be mistaken for the thermostat face');
  assert.ok(result.legacyBox[2]<470&&result.legacyBox[3]<440,'legacy inline polygon SVG loses artboard padding');
  assert.ok(result.visibleOnly[2]<110&&result.visibleOnly[3]<60,'hidden artwork stays excluded');
  await page.screenshot({path:'work/thermostat-seven-segment-fixed.png'});
  const vm=require('node:vm'),offline={};vm.runInNewContext(fs.readFileSync('data/svg-library-builtin.js','utf8'),offline);
  const manifest=JSON.parse(fs.readFileSync('data/svg-library.json','utf8')),symbol=manifest.symbols.find(s=>s.id==='nsp-6r-01');
  assert.equal(symbol.version,2);assert.equal(symbol.viewBox,'311.31 254.14 446.69 410.47');
  assert.equal(offline.SvgLibraryBuiltin.assets['nsp-6r-01'].trimEnd(),fs.readFileSync(symbol.filePath,'utf8').replace(/\r\n/g,'\n').trimEnd());assert.equal(JSON.stringify(offline.SvgLibraryBuiltin.manifest),JSON.stringify(manifest));
  const thermo=manifest.symbols.find(s=>s.id==='nsp-tmp-7seg');assert.equal(thermo.version,2);assert.equal(thermo.viewBox,'306.9 257.6 452.6 416.5');
  assert.equal(offline.SvgLibraryBuiltin.assets[thermo.id].trimEnd(),fs.readFileSync(thermo.filePath,'utf8').replace(/\r\n/g,'\n').trimEnd());
  assert.deepEqual(errors,[]);console.log('PASS: single-gang, hotel-six-command and thermostat frame comparison, tightly cropped published SVG, offline parity, legacy inline bounds, hidden artwork excluded.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
