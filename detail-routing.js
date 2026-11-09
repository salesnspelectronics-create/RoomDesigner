/* Detail leader routing: prefer simple orthogonal routes with clean endpoint leads. */
(function(g){
 const cache=new Map();
 const EPS=.001;
 function rect(r){
  if(r&&Number.isFinite(r.minX))return r;
  return {minX:r.x,maxX:r.x+r.w,minY:r.y,maxY:r.y+r.h};
 }
 function points(box){
  const out=[],fractions=[.25,.5,.75];
  for(const t of fractions){
   out.push(['left',{x:box.x,y:box.y+box.h*t}],['right',{x:box.x+box.w,y:box.y+box.h*t}],['top',{x:box.x+box.w*t,y:box.y}],['bottom',{x:box.x+box.w*t,y:box.y+box.h}]);
  }
  return out;
 }
 function step(p,side,n){
  if(side==='left')return{x:p.x-n,y:p.y};
  if(side==='right')return{x:p.x+n,y:p.y};
  if(side==='top')return{x:p.x,y:p.y-n};
  return{x:p.x,y:p.y+n};
 }
 function simplify(path){
  const out=[];
  for(const p of path){
   if(out.length&&Math.hypot(p.x-out.at(-1).x,p.y-out.at(-1).y)<EPS)continue;
   out.push({x:p.x,y:p.y});
   while(out.length>=3){
    const a=out.at(-3),b=out.at(-2),c=out.at(-1);
    if(Math.abs((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x))>EPS)break;
    out.splice(out.length-2,1);
   }
  }
  return out;
 }
 function segmentHitsRect(a,b,r,pad=0){
  r=rect(r);const minX=r.minX-pad,maxX=r.maxX+pad,minY=r.minY-pad,maxY=r.maxY+pad;
  if(Math.abs(a.x-b.x)<EPS){
   if(a.x<=minX||a.x>=maxX)return false;
   const lo=Math.min(a.y,b.y),hi=Math.max(a.y,b.y);return hi>minY&&lo<maxY;
  }
  if(Math.abs(a.y-b.y)<EPS){
   if(a.y<=minY||a.y>=maxY)return false;
   const lo=Math.min(a.x,b.x),hi=Math.max(a.x,b.x);return hi>minX&&lo<maxX;
  }
  return false;
 }
 function hits(path,rects,pad=0){
  let n=0;
  for(let i=1;i<path.length;i++)for(const r of rects)if(segmentHitsRect(path[i-1],path[i],r,pad))n++;
  return n;
 }
 function bends(path){
  let n=0;
  for(let i=1;i<path.length-1;i++){
   const a=path[i-1],b=path[i],c=path[i+1];
   if(Math.abs((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x))>EPS)n++;
  }
  return n;
 }
 function length(path){let n=0;for(let i=1;i<path.length;i++)n+=Math.abs(path[i].x-path[i-1].x)+Math.abs(path[i].y-path[i-1].y);return n}
 function shortPenalty(path){
  let n=0;
  for(let i=1;i<path.length;i++){
   const s=Math.abs(path[i].x-path[i-1].x)+Math.abs(path[i].y-path[i-1].y);
   if(s<18)n+=(18-s)*40;
  }
  return n;
 }
 function facingPenalty(side,p,target){
  const cx=target.x+target.w/2,cy=target.y+target.h/2,dx=cx-p.x,dy=cy-p.y;
  if(side==='left')return dx<0?0:120;
  if(side==='right')return dx>0?0:120;
  if(side==='top')return dy<0?0:120;
  return dy>0?0:120;
 }
 function route(source,target,walls,devices=[]){
  const key=JSON.stringify([source,target,walls,devices]);if(cache.has(key))return cache.get(key);
  const wallRects=walls.map((w,i)=>({id:'wall-'+i,minX:Math.min(w.a.x,w.b.x)-2,maxX:Math.max(w.a.x,w.b.x)+2,minY:Math.min(w.a.y,w.b.y)-2,maxY:Math.max(w.a.y,w.b.y)+2}));
  const deviceRects=devices.map(rect),lead=18,starts=points(source),ends=points(target);
  let best=null,bestScore=Infinity,bestDeviceHits=Infinity;
  for(const [side,a] of starts)for(const [endSide,b] of ends){
   const s=step(a,side,lead),t=step(b,endSide,lead);
   const candidates=[
    simplify([a,s,{x:t.x,y:s.y},t,b]),
    simplify([a,s,{x:s.x,y:t.y},t,b])
   ];
   for(const path of candidates){
    const deviceHits=hits(path.slice(1,-1),deviceRects,2);
    const wallHits=hits(path.slice(1,-1),wallRects,0);
    const score=deviceHits*10000+wallHits*90+bends(path)*110+shortPenalty(path)+length(path)+facingPenalty(side,a,target)+facingPenalty(endSide,b,source);
    if(deviceHits<bestDeviceHits||(deviceHits===bestDeviceHits&&score<bestScore)){bestDeviceHits=deviceHits;bestScore=score;best=path}
   }
  }
  if(bestDeviceHits>0){
   for(const [side,a] of starts)for(const [endSide,b] of ends){
    const path=g.CableRouting.safeRoute({a,b,sourceSide:side,targetSide:endSide,sourceId:'source',targetId:'target',rects:[...wallRects,...deviceRects,{id:'source',minX:source.x,maxX:source.x+source.w,minY:source.y,maxY:source.y+source.h},{id:'target',minX:target.x,maxX:target.x+target.w,minY:target.y,maxY:target.y+target.h}]});
    if(!path)continue;
    const clean=simplify(path),deviceHits=hits(clean.slice(1,-1),deviceRects,2),wallHits=hits(clean.slice(1,-1),wallRects,0),score=deviceHits*10000+wallHits*90+bends(clean)*150+shortPenalty(clean)*2+length(clean)+facingPenalty(side,a,target)+facingPenalty(endSide,b,source);
    if(deviceHits<bestDeviceHits||(deviceHits===bestDeviceHits&&score<bestScore)){bestDeviceHits=deviceHits;bestScore=score;best=clean}
   }
  }
  if(cache.size>100)cache.clear();cache.set(key,best);return best;
 }
 g.DetailRouting={route};if(typeof module!=='undefined')module.exports=g.DetailRouting;
})(globalThis);
