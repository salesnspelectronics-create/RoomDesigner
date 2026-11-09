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
   // Always keep a visible leader. Give both endpoints a short directional
   // lead so the fallback reads like a deliberate routed leader, not a raw L.
   const p=pairs[0],lead=18;
   const step=(pt,side,amount)=>{
    if(side==='left')return{x:pt.x-amount,y:pt.y};
    if(side==='right')return{x:pt.x+amount,y:pt.y};
    if(side==='top')return{x:pt.x,y:pt.y-amount};
    return{x:pt.x,y:pt.y+amount};
   };
   const s1=step(p.a,p.side,lead),t1=step(p.b,p.endSide,lead);
   const horizontalFirst=Math.abs(s1.x-t1.x)>=Math.abs(s1.y-t1.y);
   const elbow=horizontalFirst?{x:t1.x,y:s1.y}:{x:s1.x,y:t1.y};
   result=g.CableRouting.simplify([p.a,s1,elbow,t1,p.b],true);
  }
  if(cache.size>100)cache.clear();cache.set(key,result);return result;
 }
 g.DetailRouting={route};if(typeof module!=='undefined')module.exports=g.DetailRouting;
})(globalThis);
