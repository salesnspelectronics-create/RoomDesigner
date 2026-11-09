/* Detail leaders prefer obstacle-free routes; if none exists, always fall back to a visible route. */
(function(g){
 const cache=new Map();
 function route(source,target,walls,devices=[]){
  const key=JSON.stringify([source,target,walls,devices]);if(cache.has(key))return cache.get(key);
  const boxes=[...walls.map((w,i)=>({id:'wall-'+i,minX:Math.min(w.a.x,w.b.x)-2,maxX:Math.max(w.a.x,w.b.x)+2,minY:Math.min(w.a.y,w.b.y)-2,maxY:Math.max(w.a.y,w.b.y)+2})),...devices];
  const points=box=>[['left',{x:box.x,y:box.y+box.h/2}],['right',{x:box.x+box.w,y:box.y+box.h/2}],['top',{x:box.x+box.w/2,y:box.y}],['bottom',{x:box.x+box.w/2,y:box.y+box.h}]];
  const ends=points(target),starts=points(source);const pairs=starts.flatMap(([side,a])=>ends.map(([endSide,b])=>({side,a,endSide,b,length:Math.abs(a.x-b.x)+Math.abs(a.y-b.y)}))).sort((a,b)=>a.length-b.length);
  let result=null;for(const p of pairs.slice(0,8)){
   // Keep all architectural obstacles; if an endpoint overlaps a wall, fail closed rather than routing through it.
   const active=boxes;
   const path=g.CableRouting.safeRoute({a:p.a,b:p.b,sourceSide:p.side,targetSide:p.endSide,sourceId:'source',targetId:'target',rects:[...active,{id:'source',minX:source.x,maxX:source.x+source.w,minY:source.y,maxY:source.y+source.h},{id:'target',minX:target.x,maxX:target.x+target.w,minY:target.y,maxY:target.y+target.h}]});
   if(path){result=path;break}
  }
  if(!result&&pairs.length){
   // Visual detail leaders must never disappear. When every collision-free
   // route is blocked, use a simple orthogonal fallback and allow it to cross
   // walls/devices; the user can reposition the detail card afterward.
   const p=pairs[0],horizontalFirst=Math.abs(p.a.x-p.b.x)>=Math.abs(p.a.y-p.b.y);
   const elbow=horizontalFirst?{x:p.b.x,y:p.a.y}:{x:p.a.x,y:p.b.y};
   result=g.CableRouting.simplify([p.a,elbow,p.b],true);
  }
  if(cache.size>100)cache.clear();cache.set(key,result);return result;
 }
 g.DetailRouting={route};if(typeof module!=='undefined')module.exports=g.DetailRouting;
})(globalThis);
