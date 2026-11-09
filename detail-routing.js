/* Detail leaders prefer obstacle-free routes; if none exists, always fall back to a visible route. */
(function(g){
 const cache=new Map();
 function route(source,target,walls,devices=[]){
  const key=JSON.stringify([source,target,walls,devices]);if(cache.has(key))return cache.get(key);
  const boxes=[...walls.map((w,i)=>({id:'wall-'+i,minX:Math.min(w.a.x,w.b.x)-2,maxX:Math.max(w.a.x,w.b.x)+2,minY:Math.min(w.a.y,w.b.y)-2,maxY:Math.max(w.a.y,w.b.y)+2})),...devices];
  const points=box=>{const out=[],fractions=[.2,.5,.8];for(const t of fractions){out.push(['left',{x:box.x,y:box.y+box.h*t}],['right',{x:box.x+box.w,y:box.y+box.h*t}],['top',{x:box.x+box.w*t,y:box.y}],['bottom',{x:box.x+box.w*t,y:box.y+box.h}])}return out};
  const outward=side=>side==='left'?{x:-1,y:0}:side==='right'?{x:1,y:0}:side==='top'?{x:0,y:-1}:{x:0,y:1};
  const endpointPenalty=(side,from,to)=>{const v=outward(side),dx=to.x-from.x,dy=to.y-from.y,dot=dx*v.x+dy*v.y;return dot>0?0:90};
  const routeScore=path=>{let length=0,bends=0,shortPenalty=0;for(let i=1;i<path.length;i++){const seg=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);length+=seg;if(seg<22)shortPenalty+=(22-seg)*5}for(let i=1;i<path.length-1;i++){const a=path[i-1],b=path[i],c=path[i+1],cross=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);if(Math.abs(cross)>.001)bends++}return length+bends*52+shortPenalty};
  const ends=points(target),starts=points(source);const pairs=starts.flatMap(([side,a])=>ends.map(([endSide,b])=>({side,a,endSide,b,length:Math.abs(a.x-b.x)+Math.abs(a.y-b.y),preference:Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+endpointPenalty(side,a,b)+endpointPenalty(endSide,b,a)}))).sort((a,b)=>a.preference-b.preference);
  let result=null,bestScore=Infinity;for(const p of pairs.slice(0,48)){
   const active=boxes;
   const path=g.CableRouting.safeRoute({a:p.a,b:p.b,sourceSide:p.side,targetSide:p.endSide,sourceId:'source',targetId:'target',rects:[...active,{id:'source',minX:source.x,maxX:source.x+source.w,minY:source.y,maxY:source.y+source.h},{id:'target',minX:target.x,maxX:target.x+target.w,minY:target.y,maxY:target.y+target.h}]});
   if(!path)continue;const score=routeScore(path)+endpointPenalty(p.side,p.a,p.b)+endpointPenalty(p.endSide,p.b,p.a);if(score<bestScore){bestScore=score;result=path}
  }
  if(!result&&pairs.length){
   // Always keep a visible leader. Give both endpoints a short directional
   // lead so the fallback reads like a deliberate routed leader, not a raw L.
   const p=pairs[0],lead=14;
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
