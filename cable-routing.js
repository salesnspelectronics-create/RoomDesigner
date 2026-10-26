/* Deterministic cable geometry. Manual paths are never implicitly auto-routed. */
(function(global){
 'use strict';
 const EPS=1e-7;
 function simplify(points,collapseBacktracks=false){
  const out=[];
  for(const p of points){
   if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
   const q={x:p.x,y:p.y},last=out.at(-1);if(last&&Math.hypot(q.x-last.x,q.y-last.y)<EPS)continue;
   out.push(q);
   while(out.length>=3){const [a,b,c]=out.slice(-3),cross=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x),dot=(b.x-a.x)*(c.x-b.x)+(b.y-a.y)*(c.y-b.y);if(Math.abs(cross)>EPS||(!collapseBacktracks&&dot<0))break;out.splice(out.length-2,1);if(Math.hypot(a.x-c.x,a.y-c.y)<EPS)out.pop()}
  }
  return out;
 }
 function orthogonal(points,side){
  if(points.length<2)return points.map(p=>({x:p.x,y:p.y}));
  const out=[{x:points[0].x,y:points[0].y}];let horizontal=side==='left'||side==='right';
  for(const target of points.slice(1)){
   const p=out.at(-1),q={x:target.x,y:target.y};
   if(Math.abs(p.x-q.x)>EPS&&Math.abs(p.y-q.y)>EPS)out.push(horizontal?{x:q.x,y:p.y}:{x:p.x,y:q.y});
   const prior=out.at(-1);if(Math.abs(q.x-prior.x)>EPS)horizontal=true;else if(Math.abs(q.y-prior.y)>EPS)horizontal=false;
   out.push(q);
  }
  // Keep explicit anchors, even when an anchor lies on a straight part of the path.
  return out.filter((p,i)=>!i||Math.hypot(p.x-out[i-1].x,p.y-out[i-1].y)>EPS);
 }
 function bounds(d,padding=8){
  const angle=(Number(d.rotation)||0)*Math.PI/180,c=Math.abs(Math.cos(angle)),s=Math.abs(Math.sin(angle));
  const hw=(c*d.w+s*d.h)/2+padding,hh=(s*d.w+c*d.h)/2+padding;
  return {id:d.id,minX:d.x-hw,maxX:d.x+hw,minY:d.y-hh,maxY:d.y+hh};
 }
 function segmentBlocked(a,b,rects,skipId){
  if(Math.abs(a.x-b.x)<EPS)return rects.some(r=>r.id!==skipId&&a.x>r.minX+EPS&&a.x<r.maxX-EPS&&Math.max(a.y,b.y)>r.minY+EPS&&Math.min(a.y,b.y)<r.maxY-EPS);
  if(Math.abs(a.y-b.y)<EPS)return rects.some(r=>r.id!==skipId&&a.y>r.minY+EPS&&a.y<r.maxY-EPS&&Math.max(a.x,b.x)>r.minX+EPS&&Math.min(a.x,b.x)<r.maxX-EPS);
  return true;
 }
 function crossesDevice(a,b,d){
  const angle=-(Number(d.rotation)||0)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  const local=p=>({x:(p.x-d.x)*c-(p.y-d.y)*s,y:(p.x-d.x)*s+(p.y-d.y)*c});
  const p=local(a),q=local(b);let low=0,high=1;
  for(const [axis,half]of [['x',d.w/2],['y',d.h/2]]){
   const lo=-half+EPS,hi=half-EPS,delta=q[axis]-p[axis];
   if(Math.abs(delta)<EPS){if(p[axis]<=lo||p[axis]>=hi)return false;continue;}
   const t1=(lo-p[axis])/delta,t2=(hi-p[axis])/delta;low=Math.max(low,Math.min(t1,t2));high=Math.min(high,Math.max(t1,t2));if(high<=low)return false;
  }
  return high-low>EPS&&high>EPS&&low<1-EPS;
 }
 function exit(at,side,box){
  const p={x:at.x,y:at.y};
  if(side==='left')p.x=Math.min(at.x-20,box?box.minX-2:at.x-20);
  else if(side==='right')p.x=Math.max(at.x+20,box?box.maxX+2:at.x+20);
  else if(side==='top')p.y=Math.min(at.y-20,box?box.minY-2:at.y-20);
  else p.y=Math.max(at.y+20,box?box.maxY+2:at.y+20);
  return p;
 }
 class Heap{
  constructor(){this.items=[]}
  push(v){const a=this.items;let i=a.length;a.push(v);while(i){const p=(i-1)>>1;if(a[p].f<=v.f)break;a[i]=a[p];i=p}a[i]=v}
  pop(){const a=this.items,first=a[0],last=a.pop();if(a.length){let i=0;while(2*i+1<a.length){let c=2*i+1;if(c+1<a.length&&a[c+1].f<a[c].f)c++;if(a[c].f>=last.f)break;a[i]=a[c];i=c}a[i]=last}return first}
 }
 function safeRoute({a,b,sourceId,targetId,sourceSide,targetSide,rects}){
  if(rects.length>1000)return null;
  const start=exit(a,sourceSide,rects.find(r=>r.id===sourceId)),end=exit(b,targetSide,rects.find(r=>r.id===targetId));
  if(segmentBlocked(a,start,rects,sourceId)||segmentBlocked(end,b,rects,targetId))return null;
  const free=p=>!rects.some(r=>p.x>r.minX+EPS&&p.x<r.maxX-EPS&&p.y>r.minY+EPS&&p.y<r.maxY-EPS);
  if(!free(start)||!free(end))return null;
  const xs=[start.x,end.x],ys=[start.y,end.y];
  for(const r of rects){xs.push(r.minX,r.maxX);ys.push(r.minY,r.maxY)}
  xs.push(Math.min(...xs)-24,Math.max(...xs)+24);ys.push(Math.min(...ys)-24,Math.max(...ys)+24);
  const unique=a=>[...new Set(a)].sort((a,b)=>a-b),xx=unique(xs),yy=unique(ys),nx=xx.length;
  // A hard resource bound must fail safely, never return a path through an object.
  if(nx*yy.length>300000)return null;
  const from=yy.indexOf(start.y)*nx+xx.indexOf(start.x),to=yy.indexOf(end.y)*nx+xx.indexOf(end.x),point=id=>({x:xx[id%nx],y:yy[Math.floor(id/nx)]});
  const heap=new Heap(),cost=new Map(),parent=new Map(),pointCache=new Map(),edgeCache=new Map();
  const sourceAxis=sourceSide==='left'||sourceSide==='right'?1:2,initial=from*3+sourceAxis;
  cost.set(initial,0);heap.push({state:initial,g:0,f:Math.abs(start.x-end.x)+Math.abs(start.y-end.y)});
  let goal=null;
  while(heap.items.length){
   const current=heap.pop();if(current.g!==cost.get(current.state))continue;
   const node=Math.floor(current.state/3),axis=current.state%3;if(node===to){goal=current.state;break}
   const ix=node%nx,iy=Math.floor(node/nx),p=point(node);
   for(const [dx,dy,dir]of [[-1,0,1],[1,0,1],[0,-1,2],[0,1,2]]){
    const x=ix+dx,y=iy+dy;if(x<0||x>=nx||y<0||y>=yy.length)continue;
    const next=y*nx+x,q=point(next);
    if(!pointCache.has(next))pointCache.set(next,free(q));if(!pointCache.get(next))continue;
    const edge=node<next?node+':'+next:next+':'+node;
    if(!edgeCache.has(edge))edgeCache.set(edge,!segmentBlocked(p,q,rects));if(!edgeCache.get(edge))continue;
    const state=next*3+dir,g=current.g+Math.abs(q.x-p.x)+Math.abs(q.y-p.y)+(axis!==dir?12:0);
    if(g>=(cost.get(state)??Infinity))continue;
    cost.set(state,g);parent.set(state,current.state);heap.push({state,g,f:g+Math.abs(q.x-end.x)+Math.abs(q.y-end.y)});
   }
  }
  if(goal===null)return null;
  const path=[];for(let s=goal;s!==undefined;s=parent.get(s))path.push(point(Math.floor(s/3)));path.reverse();
  const result=[a,...path,b];
  // Only endpoint leads may touch their own inflated device boxes.
  for(let i=1;i<result.length;i++){
   const skip=i===1?sourceId:i===result.length-1?targetId:undefined;
   if(segmentBlocked(result[i-1],result[i],rects,skip))return null;
  }
  // Endpoint leads can overlap the final search leg. Remove their out-and-back
  // excursions only for generated routes; the remaining segment is a subset of
  // the already validated collinear legs, so it cannot cross a new obstacle.
  return simplify(result,true);
 }
 function nearestSegment(points,p){let best=null;for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy,t=len?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len)):0,dist=Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);if(!best||dist<best.distance)best={index:i,distance:dist}}return best}
 function dragSegment(points,index,dx,dy,mode){
  const a=points[index],b=points[index+1];if(!a||!b)return points;
  if(mode==='orthogonal'){if(Math.abs(a.y-b.y)<EPS)dx=0;else if(Math.abs(a.x-b.x)<EPS)dy=0}
  const out=[...points.slice(0,index).map(p=>({...p})),{x:a.x+dx,y:a.y+dy},{x:b.x+dx,y:b.y+dy},...points.slice(index+2).map(p=>({...p}))];
  if(index===0)out.unshift({...points[0]});if(index+1===points.length-1)out.push({...points.at(-1)});
  return out;
 }
 function dragVertex(points,index,p,mode){
  const out=points.map(q=>({x:q.x,y:q.y}));if(index<1||index>=out.length-1)return out;
  if(mode!=='orthogonal'){out[index]={x:p.x,y:p.y};return out;}
  const a=out[index-1],old=out[index],b=out[index+1];
  const before=Math.abs(a.y-old.y)<EPS?{x:a.x,y:p.y}:{x:p.x,y:a.y};
  const after=Math.abs(b.y-old.y)<EPS?{x:b.x,y:p.y}:{x:p.x,y:b.y};
  const result=[...out.slice(0,index),before,{x:p.x,y:p.y},after,...out.slice(index+1)];
  // Retain the explicit draggable anchor even when it lies on a straight leg.
  return result.filter((q,i)=>!i||Math.hypot(q.x-result[i-1].x,q.y-result[i-1].y)>EPS);
 }
 const api={bounds,segmentBlocked,crossesDevice,simplify,orthogonal,safeRoute,nearestSegment,dragSegment,dragVertex};global.CableRouting=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
