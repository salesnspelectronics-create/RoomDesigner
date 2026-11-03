'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function model(){const c=vm.createContext({});for(const file of ['data/svg-library-builtin.js','data/equipment-catalog-builtin.js','cable-routing.js','connection-model.js','lighting-model.js','equipment-release.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c);return c}
module.exports={model,root,plain:x=>JSON.parse(JSON.stringify(x))};
