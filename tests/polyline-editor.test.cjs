 'use strict';
const assert=require('node:assert/strict'),G=require('../polyline-editor.js');
const p=(x,y)=>({x,y}),eq=(a,b)=>assert.deepEqual(a,b),normal=ps=>G.normalize(ps,{scale:1});
eq(normal([p(0,0),p(50,0),p(100,0)]),[p(0,0),p(100,0)]);
eq(normal([p(0,0),p(100,0),p(30,0),p(30,80),p(100,80),p(5,80)]),[p(0,0),p(30,0),p(30,80),p(5,80)]);
eq(normal([p(0,0),p(100,0),p(100,100),p(50,100),p(50,0),p(150,0)]),[p(0,0),p(150,0)]);
eq(normal([p(0,0),p(100,0),p(100,100),p(100,0),p(200,0)]),[p(0,0),p(200,0)]);
const closed=[p(0,0),p(100,0),p(100,100),p(0,100),p(0,0)];eq(normal(closed),closed);
const cross=[p(0,0),p(100,100),p(0,100),p(100,0)];eq(normal(cross),cross); // A crossing is not an electrical junction.
const raw=[p(0,0),p(200,0)],draft=G.begin(raw,0,true);eq(G.preview(draft,p(100,150),{shift:true}),raw);const free=G.preview(draft,p(100,150));eq(free,[p(0,0),p(100,150),p(200,0)]);const settled=G.begin(free,1);assert.ok(G.preview(settled,p(100,160),{shift:true}).length>2);eq(G.preview(settled,p(110,150)),[p(0,0),p(110,150),p(200,0)]);eq(raw,[p(0,0),p(200,0)]);
const merge=[p(0,0),p(100,100),p(200,100),p(300,0)];eq(G.preview(G.begin(merge,1),p(200,100)),[p(0,0),p(200,100),p(300,0)]);eq(G.preview(G.begin(merge,1),p(300,0)),[p(0,0),p(300,0)]);
eq(G.preview(G.begin(raw,1),p(180,70),{shift:true}),[p(0,0),p(180,0)]);
// Large and tiny coordinates, zoom-independent thresholds, all octants and repeated key toggles.
let seed=8675309;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);let cases=0;
for(let k=0;k<1200;k++){const count=2+Math.floor(random()*10),points=Array.from({length:count},()=>p(Math.round(random()*1000),Math.round(random()*1000))),index=Math.floor(random()*(count-1)),midpoint=k%2===0,g=G.begin(points,index,midpoint),snapshot=JSON.stringify(points),scale=[.1,.25,1,2,8][k%5],tip=p(random()*1400-200,random()*1400-200);for(const shift of [false,true,true,false,true]){const next=G.preview(g,tip,{shift,scale});assert.ok(next.length>=2&&next.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)));if(g.freeIndex>0&&g.freeIndex<g.freeBasePoints.length-1){eq(next[0],points[0]);eq(next.at(-1),points.at(-1));}const clean=G.normalize(next,{scale});eq(G.normalize(clean,{scale}),clean);eq(JSON.stringify(points),snapshot);cases++;}}
eq(G.connect([p(0,0),p(100,0)],p(150,50),true),[p(0,0),p(100,0),p(100,50),p(150,50)]);eq(G.axisPoint(p(0,0),p(100,20)),p(100,0));
console.log('PASS: deterministic geometry cases plus '+cases+' randomized gesture/zoom/cleanup invariants, fixed endpoints, immutable input, idempotence, closed loops, vertex merging, overlap erasure and separate crossings.');
