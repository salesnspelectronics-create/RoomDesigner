'use strict';
const assert=require('node:assert/strict'),G=require('../polyline-editor.js');
const p=(x,y)=>({x,y});
// Independent oracle: a near-parallel return must not survive at a shared vertex.
function noReturn(ps,scale){for(let i=1;i<ps.length-1;i++){const a=ps[i-1],b=ps[i],c=ps[i+1],u=p(b.x-a.x,b.y-a.y),v=p(c.x-b.x,c.y-b.y),len=Math.hypot(u.x,u.y);assert.ok(!(u.x*v.x+u.y*v.y< -1e-7&&Math.abs(u.x*(c.y-a.y)-u.y*(c.x-a.x))/len<5.99/scale),'retrace '+JSON.stringify(ps));}}
let count=0;
for(const scale of [.1,.25,.5,1,2,8])for(const turn of [0,1,2,3])for(const mirror of [-1,1])for(const offset of [-5,-3,-.25,0,.25,3,5])for(const reverse of [false,true]){
 const transform=q=>{let x=q.x/scale*mirror,y=q.y/scale;for(let i=0;i<turn;i++)[x,y]=[-y,x];return p(x+123.456,y-987.654)};
 let raw=[p(87,64),p(520,64),p(325,347),p(520,629),p(261,629+offset)].map(transform);if(reverse)raw.reverse();
 const snapshot=JSON.stringify(raw),gesture=G.begin(raw,2),tip=transform(p(325,347));
 for(const shift of [true,false,true]){const out=G.preview(gesture,tip,{shift,scale}),clean=G.normalize(out,{scale});if(shift){noReturn(out,scale);assert.equal(out.length,4);for(let i=1;i<out.length;i++)assert.ok(Math.abs(out[i].x-out[i-1].x)<1e-7||Math.abs(out[i].y-out[i-1].y)<1e-7)}noReturn(clean,scale);assert.deepEqual(clean[0],raw[0]);assert.deepEqual(clean.at(-1),raw.at(-1));assert.deepEqual(G.normalize(clean,{scale}),clean);assert.equal(JSON.stringify(raw),snapshot);count++;}
}
// Regression for the screenshot: the bottom tail returns only three pixels off-axis.
const screenshot=[p(87,64),p(520,64),p(325,347),p(520,629),p(261,632)];
assert.deepEqual(G.preview(G.begin(screenshot,2),p(325,347),{shift:true}),[p(87,64),p(325,64),p(325,632),p(261,632)]);
// Separate close parallel runs and real narrow bends are intentional, not retraces.
const parallel=[p(0,0),p(100,0),p(100,20),p(0,20)];assert.deepEqual(G.normalize(parallel),parallel);
const narrow=[p(0,0),p(100,0),p(50,10)];assert.deepEqual(G.normalize(narrow),narrow);
// Seeded orthogonal walks with subpixel port offsets, repeated corners and retraces.
let seed=20261101;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(let k=0;k<2000;k++){const scale=[.25,1,4][k%3],ps=[p(0,0)];for(let j=0;j<12;j++){const a=ps.at(-1),step=(rnd()<.5?-1:1)*(20+Math.floor(rnd()*200))/scale;ps.push(j%2?p(a.x,a.y+step):p(a.x+step,a.y))}ps.at(-1).y+=(rnd()-.5)*8/scale;const clean=G.normalize(ps,{scale});noReturn(clean,scale);assert.deepEqual(clean[0],ps[0]);assert.deepEqual(clean.at(-1),ps.at(-1));assert.deepEqual(G.normalize(clean,{scale}),clean)}
console.log('PASS: '+count+' near-axis screenshot/reversed/mirrored/rotated/zoomed previews plus 2000 orthogonal walks, independent no-return oracle, fixed endpoints, idempotence; distinct parallel runs preserved.');
