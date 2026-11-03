'use strict';
// Requires installed Chromium: npm run test:browser:install
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.join(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}try{const data=fs.readFileSync(file);res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'application/javascript':'application/octet-stream');res.end(data)}catch{res.writeHead(404);res.end()}});
 let browser;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));browser=await chromium.launch({headless:true,...(process.env.TEST_BROWSER_PATH?{executablePath:process.env.TEST_BROWSER_PATH}:{})});const context=await browser.newContext(),first=await context.newPage(),url='http://127.0.0.1:'+server.address().port;
  await first.goto(url);await first.waitForFunction(()=>window.__roomStartupReady);assert.equal(await first.locator('#roomWriterBlocked').count(),0);
  await first.evaluate(()=>localStorage.setItem('rd_writer_test','keep'));
  const second=await context.newPage();await second.goto(url);await second.locator('#roomWriterBlocked').waitFor();assert.equal(await second.evaluate(()=>localStorage.getItem('rd_writer_test')),'keep');
  await first.close();await second.reload();await second.waitForFunction(()=>window.__roomStartupReady);assert.equal(await second.locator('#roomWriterBlocked').count(),0);assert.equal(await second.evaluate(()=>localStorage.getItem('rd_writer_test')),'keep');
  console.log('PASS: real two-tab writer exclusion and ownership after closing first tab');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
