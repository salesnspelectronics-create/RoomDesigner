'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..'),browser=process.argv.includes('--browser');
const files=fs.readdirSync(path.join(root,'tests')).filter(f=>/\.test\.(cjs|mjs)$/.test(f)&&f.includes('.browser.')===browser).sort();
if(browser){for(const file of files){const result=spawnSync(process.execPath,[path.join('tests',file)],{cwd:root,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1)}}
else{const result=spawnSync(process.execPath,['--test',...files.map(f=>path.join('tests',f))],{cwd:root,stdio:'inherit'});if(result.error)throw result.error;process.exit(result.status??1)}
