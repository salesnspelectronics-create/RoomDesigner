'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const dom=new JSDOM('',{runScripts:'outside-only'});try{
 dom.window.eval(fs.readFileSync(path.join(__dirname,'../svg-engine.js'),'utf8'));const E=dom.window.SvgEngine;
 const raw='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs><linearGradient id="g"><stop stop-color="#000"/></linearGradient><style>.a,.b {fill:#fff}.a {stroke:#000}.c {fill:url(#g)}</style></defs><path class="a" d="M0 0h1"/><path class="b" d="M0 1h1"/><rect class="c" width="1" height="1"/></svg>';
 const clean=E.sanitize(raw);assert.ok(clean);const doc=E.parse(clean);assert.match(doc.querySelector('path').getAttribute('style'),/fill:#fff/);assert.match(doc.querySelector('path').getAttribute('style'),/stroke:#000/);assert.match(doc.querySelectorAll('path')[1].getAttribute('style'),/fill:#fff/);assert.match(doc.querySelector('rect').getAttribute('style'),/url\(#g\)/);assert.ok(E.sanitize(clean));
 for(const value of ['url(https://evil.invalid/a)','url(data:image/svg+xml,bad)','url(#g) url(https://evil.invalid/a)'])assert.equal(E.sanitize(raw.replace('url(#g)',value)),null);
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/svg-library.json'),'utf8')),c={};require('vm').runInNewContext(fs.readFileSync(path.join(__dirname,'../data/svg-library-builtin.js'),'utf8'),c);for(const e of manifest.symbols){const raw=fs.readFileSync(path.join(__dirname,'..',e.filePath),'utf8');assert.ok(E.sanitize(raw),e.id);assert.equal(c.SvgLibraryBuiltin.assets[e.id].replace(/\r\n/g,'\n').trimEnd(),raw.replace(/\r\n/g,'\n').trimEnd())}

 console.log('PASS: all published SVG assets match offline bytes; grouped selectors, cumulative declarations, white cutouts, safe internal gradients and external URL rejection');
}finally{dom.window.close()}
