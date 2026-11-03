'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const R=require('../cable-routing.js');
test('dragging a new collinear orthogonal anchor creates a clean detour while retaining endpoints',()=>{
 const points=[{x:0,y:0},{x:100,y:0},{x:200,y:0}],copy=JSON.stringify(points);
 const moved=R.dragVertex(points,1,{x:100,y:50},'orthogonal');
 assert.deepEqual(moved,[{x:0,y:0},{x:0,y:50},{x:100,y:50},{x:200,y:50},{x:200,y:0}]);
 assert.equal(JSON.stringify(points),copy);
 assert.deepEqual(R.dragVertex(points,1,{x:100,y:50},'broken'),[{x:0,y:0},{x:100,y:50},{x:200,y:0}]);
});
test('quick-connect body checks distinguish endpoint interiors from edge touches, including rotated devices',()=>{
 const d={x:100,y:100,w:100,h:80,rotation:0};
 assert.equal(R.crossesDevice({x:100,y:60},{x:160,y:0},d),false,'leaves top port outward');
 assert.equal(R.crossesDevice({x:100,y:60},{x:160,y:180},d),true,'enters body from top port');
 assert.equal(R.crossesDevice({x:0,y:60},{x:200,y:60},d),false,'grazing edge');
 assert.equal(R.crossesDevice({x:0,y:0},{x:200,y:200},d),true,'diagonal through body');
 d.rotation=35;const world=p=>({x:100+p.x*Math.cos(35*Math.PI/180)-p.y*Math.sin(35*Math.PI/180),y:100+p.x*Math.sin(35*Math.PI/180)+p.y*Math.cos(35*Math.PI/180)});
 assert.equal(R.crossesDevice(world({x:0,y:-40}),world({x:0,y:-100}),d),false);
 assert.equal(R.crossesDevice(world({x:0,y:-40}),world({x:0,y:100}),d),true);
});
test('Smart Ports removes endpoint lead spikes and other collinear backtracking only in generated routes',()=>{
 const devices=[{id:'a',x:154,y:276,w:180,h:120},{id:'b',x:638,y:270,w:360,h:240}];
 const a={x:154,y:216},b={x:638,y:150},points=R.safeRoute({a,b,sourceId:'a',targetId:'b',sourceSide:'top',targetSide:'top',rects:devices.map(d=>R.bounds(d))});
 validate(points,devices);assert.deepEqual(points[0],a);assert.deepEqual(points.at(-1),b);
 assert.equal(points.length,4,'one clean bridge with no extra endpoint spike');
 for(let i=2;i<points.length;i++){const [a,b,c]=points.slice(i-2,i+1);assert.notEqual((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x),0,'no redundant collinear turn');}
 const excursion=[{x:0,y:0},{x:0,y:50},{x:0,y:20}];assert.deepEqual(R.simplify(excursion),excursion);assert.deepEqual(R.simplify(excursion,true),[{x:0,y:0},{x:0,y:20}]);
 assert.deepEqual(R.simplify([{x:0,y:0},{x:0,y:50},{x:0,y:0},{x:20,y:0}],true),[{x:0,y:0},{x:20,y:0}]);
});
function validate(points,devices){assert.ok(points?.length>=2);for(let i=1;i<points.length;i++){assert.ok(Math.abs(points[i].x-points[i-1].x)<1e-6||Math.abs(points[i].y-points[i-1].y)<1e-6,'all legs orthogonal');assert.equal(R.segmentBlocked(points[i-1],points[i],devices.map(d=>R.bounds(d,0))),false,'no body crossing')}}
test('regression: wide source and small destination no longer route through the destination body',()=>{
 const devices=[{id:'main',x:300,y:100,w:400,h:100},{id:'lamp',x:360,y:300,w:60,h:60}],a={x:300,y:150},b={x:360,y:270};
 const points=R.safeRoute({a,b,sourceId:'main',targetId:'lamp',sourceSide:'bottom',targetSide:'top',rects:devices.map(d=>R.bounds(d))});validate(points,devices);assert.deepEqual(points[0],a);assert.deepEqual(points.at(-1),b);
});
test('all 16 source/destination directions route around third-party and rotated items',()=>{
 const source={id:'a',x:100,y:100,w:60,h:80},target={id:'b',x:420,y:350,w:80,h:60},blocker={id:'block',x:260,y:225,w:120,h:100,rotation:30},devices=[source,target,blocker];
 const port=(d,side)=>({x:d.x+(side==='left'?-d.w/2:side==='right'?d.w/2:0),y:d.y+(side==='top'?-d.h/2:side==='bottom'?d.h/2:0)});
 for(const sourceSide of ['left','right','top','bottom'])for(const targetSide of ['left','right','top','bottom']){
  const args={a:port(source,sourceSide),b:port(target,targetSide),sourceId:'a',targetId:'b',sourceSide,targetSide,rects:devices.map(d=>R.bounds(d))},points=R.safeRoute(args);validate(points,devices);assert.deepEqual(R.safeRoute(args),points,'deterministic');
 }
});
test('wall barriers are avoided and impossible overlapping exits fail without an unsafe fallback',()=>{
 const a={id:'a',x:100,y:100,w:60,h:60},b={id:'b',x:400,y:100,w:60,h:60},wall={id:'wall:w',minX:240,maxX:260,minY:0,maxY:220},args={a:{x:130,y:100},b:{x:370,y:100},sourceId:'a',targetId:'b',sourceSide:'right',targetSide:'left',rects:[R.bounds(a),R.bounds(b),wall]};
 const points=R.safeRoute(args);validate(points,[a,b]);for(let i=1;i<points.length;i++)assert.equal(R.segmentBlocked(points[i-1],points[i],[wall]),false);
 const covering=R.bounds({id:'cover',x:150,y:100,w:60,h:60});assert.equal(R.safeRoute({...args,rects:[...args.rects,covering]}),null);
});
test('manual orthogonal interpolation retains exact endpoints and user anchors',()=>{
 const anchors=[{x:10,y:10},{x:100,y:35},{x:150,y:140},{x:220,y:145}],result=R.orthogonal(anchors,'bottom');assert.deepEqual(result[0],anchors[0]);assert.deepEqual(result.at(-1),anchors.at(-1));for(const p of anchors)assert.ok(result.some(q=>q.x===p.x&&q.y===p.y));
 for(let i=1;i<result.length;i++)assert.ok(result[i].x===result[i-1].x||result[i].y===result[i-1].y);
 const backtrack=[{x:0,y:0},{x:0,y:100},{x:0,y:50}];assert.deepEqual(R.simplify(backtrack),backtrack);
});
test('dragging an orthogonal leg moves both of its corners and retains the port endpoints',()=>{
 const original=[{x:0,y:0},{x:0,y:100},{x:100,y:100},{x:100,y:0}],copy=JSON.stringify(original),points=R.dragSegment(original,1,50,25,'orthogonal');
 assert.deepEqual(points,[{x:0,y:0},{x:0,y:125},{x:100,y:125},{x:100,y:0}]);assert.equal(JSON.stringify(original),copy);
 const terminal=R.dragSegment(original,0,30,20,'orthogonal');assert.deepEqual(terminal[0],original[0]);assert.deepEqual(terminal.at(-1),original.at(-1));
});
test('dragging a free leg moves only its adjacent bends; hit testing selects that actual segment',()=>{
 const points=[{x:0,y:0},{x:40,y:80},{x:100,y:80},{x:150,y:0}];assert.equal(R.nearestSegment(points,{x:70,y:81}).index,1);
 assert.deepEqual(R.dragSegment(points,1,20,30,'broken'),[{x:0,y:0},{x:60,y:110},{x:120,y:110},{x:150,y:0}]);
});
test('actual renderer: direct paths always have two endpoints and free paths preserve stored bends',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),code=source.slice(source.indexOf('function cableDisplayPoints('),source.indexOf('function draftCablePreview('));
 const c={a:{dev:'a'},b:{dev:'b'},routeMode:'direct',autoRouting:true,waypoints:[{x:500,y:500}],offset:100},a={x:10,y:10},b={x:60,y:80};
 const context={wireDrag:{cableId:"none"},portSide:()=> 'bottom',cablePathPoints:(pts,mode,side)=>mode==='orthogonal'?R.orthogonal(pts,side):pts,adaptiveCableRoute:()=>{throw Error('Manual routing must not call auto router')}};vm.createContext(context);vm.runInContext(code,context);
 assert.equal(JSON.stringify(context.cableDisplayPoints({...c,waypoints:[]},a,b)),JSON.stringify([a,b]));c.routeMode='broken';c.autoRouting=undefined;const before=JSON.stringify(c.waypoints);assert.equal(JSON.stringify(context.cableDisplayPoints(c,a,b)),JSON.stringify([a,...c.waypoints,b]));assert.equal(JSON.stringify(c.waypoints),before);
});
