'use strict';
const fs=require('node:fs'),path=require('node:path'),acorn=require('acorn');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const functions=new Map();
function walk(node,source){
 if(!node||typeof node!=='object')return;
 if(node.type==='FunctionDeclaration'&&node.id)functions.set(node.id.name,source.slice(node.start,node.end));
 for(const value of Object.values(node))if(Array.isArray(value)){for(const child of value)walk(child,source)}else if(value&&typeof value==='object')walk(value,source);
}
for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(match[1].trim())walk(acorn.parse(match[1],{ecmaVersion:'latest'}),match[1]);
function extractFunction(name){if(!functions.has(name))throw Error('Missing function '+name);return functions.get(name)}
module.exports={html,extractFunction};
