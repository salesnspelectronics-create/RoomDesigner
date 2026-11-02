/* Shared editable-polyline geometry. No DOM, storage, or application state. */
(function(root){'use strict';
const EPS=1e-8,copy=p=>({x:p.x,y:p.y}),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),freeze=ps=>Object.freeze(ps.map(p=>Object.freeze(copy(p))));
function validate(points){if(!Array.isArray(points)||points.length<2||points.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw Error('Invalid polyline');}
function scaleOf(options){return Number.isFinite(options?.scale)&&options.scale>0?options.scale:1;}
function mergeEdited(points,index,tolerance){const out=points.map(copy);if(!Number.isInteger(index)||index<0||index>=out.length)return out;let target=-1,best=tolerance;out.forEach((p,i)=>{const d=distance(p,out[index]);if(i!==index&&d<=best){target=i;best=d;}});if(target<0)return out;out[index]=copy(out[target]);if(index>0&&index<out.length-1){const lo=Math.min(index,target),hi=Math.max(index,target);out.splice(lo,hi-lo);}return out;}
function linearClean(points,tolerance,retraceTolerance){
 const out=[];
 for(let at=0;at<points.length;at++){
  out.push(copy(points[at]));
  while(out.length>=3){
   const [a,b,c]=out.slice(-3),dx=c.x-a.x,dy=c.y-a.y,length=Math.hypot(dx,dy);
   const ux=b.x-a.x,uy=b.y-a.y,vx=c.x-b.x,vy=c.y-b.y,leg=Math.hypot(ux,uy);
   // A return stroke can miss its incoming axis by a few screen pixels.
   // Testing against the short a-c chord magnifies that error and leaves a long tail.
   const retrace=leg>EPS&&ux*vx+uy*vy<0&&Math.abs(ux*(c.y-a.y)-uy*(c.x-a.x))/leg<=retraceTolerance;
   if(retrace){
    const before=out[out.length-4],after=points[at+1];
    // Keep an orthogonal junction square while preserving both fixed endpoints.
    if(before&&Math.abs(uy)<=EPS&&Math.abs(before.x-a.x)<=EPS&&Math.abs(c.y-a.y)<=retraceTolerance)a.y=c.y;
    else if(before&&Math.abs(ux)<=EPS&&Math.abs(before.y-a.y)<=EPS&&Math.abs(c.x-a.x)<=retraceTolerance)a.x=c.x;
    else if(after&&Math.abs(vy)<=EPS&&Math.abs(after.x-c.x)<=EPS&&Math.abs(c.y-a.y)<=retraceTolerance)c.y=a.y;
    else if(after&&Math.abs(vx)<=EPS&&Math.abs(after.y-c.y)<=EPS&&Math.abs(c.x-a.x)<=retraceTolerance)c.x=a.x;
   }
   if(retrace||length<=EPS||distance(a,b)<=EPS||distance(b,c)<=EPS||Math.abs((b.x-a.x)*dy-(b.y-a.y)*dx)/length<=tolerance)out.splice(out.length-2,1);
   else break;
  }
 }
 if(out.length===2&&distance(out[0],out[1])<=EPS)out[1]=copy(points.at(-1));
 return out;
}
function eraseLoop(points){const n=points.length;for(let i=0;i<n-2;i++)for(let j=i+2;j<n;j++){if(i===0&&j===n-1)continue;if(distance(points[i],points[j])<=EPS)return [...points.slice(0,i+1),...points.slice(j+1)];}
for(let i=0;i<n-3;i++){const a=points[i],b=points[i+1],ux=b.x-a.x,uy=b.y-a.y,l1=Math.hypot(ux,uy);if(l1<=EPS)continue;for(let j=i+2;j<n-1;j++){const c=points[j],d=points[j+1],vx=d.x-c.x,vy=d.y-c.y,l2=Math.hypot(vx,vy);if(l2<=EPS||Math.abs(ux*vy-uy*vx)>EPS*l1*l2||Math.abs((c.x-a.x)*uy-(c.y-a.y)*ux)>EPS*l1)continue;const t0=((c.x-a.x)*ux+(c.y-a.y)*uy)/(l1*l1),t1=((d.x-a.x)*ux+(d.y-a.y)*uy)/(l1*l1);if(Math.min(1,Math.max(t0,t1))-Math.max(0,Math.min(t0,t1))<=EPS/l1)continue;const u0=((a.x-c.x)*vx+(a.y-c.y)*vy)/(l2*l2),u1=((b.x-c.x)*vx+(b.y-c.y)*vy)/(l2*l2),entry=Math.max(0,Math.min(u0,u1)),q={x:c.x+entry*vx,y:c.y+entry*vy};return [...points.slice(0,i+1),q,...points.slice(j+1)];}}return null;}
function normalize(points,options={}){validate(points);const tolerance=(options.tolerancePx??2)/scaleOf(options),merge=(options.mergePx??6)/scaleOf(options);let out=mergeEdited(points,options.editedIndex,merge);const first=copy(out[0]),last=copy(out.at(-1));if(options.collinear===false)return out;out=linearClean(out,tolerance,merge);if(options.deep!==false){for(let pass=0;pass<points.length;pass++){const next=eraseLoop(out);if(!next)break;out=linearClean(next,tolerance,merge);}}if(out.length<2)out=[first,last];out[0]=first;out[out.length-1]=last;return out;}
function begin(points,index,midpoint=false){validate(points);if(!Number.isInteger(index)||index<0||index>=points.length-(midpoint?1:0))throw Error('Invalid edit index');const original=freeze(points),base=points.map(copy);let freeBase=null,freeIndex=index;if(midpoint){const a=base[index],b=base[index+1];base.splice(++index,0,{x:(a.x+b.x)/2,y:(a.y+b.y)/2});}else if(base.length===3&&index===1){freeBase=base.map(copy);const [a,p,b]=base;base.splice(1,1,{x:(a.x+p.x)/2,y:(a.y+p.y)/2},p,{x:(p.x+b.x)/2,y:(p.y+b.y)/2});index=2;}return {originalPoints:original,index,basePoints:freeze(base),freeIndex:freeBase?freeIndex:index,freeBasePoints:freeze(freeBase||base),snapMode:null};}
function axisPoint(anchor,p){return Math.abs(p.x-anchor.x)>=Math.abs(p.y-anchor.y)?{x:p.x,y:anchor.y}:{x:anchor.x,y:p.y};}
function snap(points,index,p,options={}){validate(points);const out=points.map(copy);out[index]=copy(p);if(index===0||index===out.length-1){if(options.shift)out[index]=axisPoint(points[index===0?1:index-1],p);return normalize(out,{...options,editedIndex:index,collinear:!!options.shift});}const scale=scaleOf(options);const merged=mergeEdited(out,index,6/scale);if(merged.length<out.length)return normalize(merged,options);if(!options.shift)return out;const a=points[index-1],b=points[index+1],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;if(l2<=EPS)return normalize(out,options);const den=distance(a,p)*distance(b,p);if(den<=EPS)return normalize(out,options);const angle=Math.acos(Math.max(-1,Math.min(1,((a.x-p.x)*(b.x-p.x)+(a.y-p.y)*(b.y-p.y))/den)));
let straight=points.length===3||angle>=Math.PI*.75;if(points.length!==3&&options.previousMode&&Math.abs(angle-Math.PI*.75)<Math.PI/60)straight=options.previousMode==='straight';options.onMode?.(straight?'straight':'orthogonal');if(straight){const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l2));out[index]={x:a.x+t*dx,y:a.y+t*dy};return normalize(out,options);}const tolerance=6/scale;let bends;if(Math.abs(dy)<=tolerance)bends=[{x:a.x,y:p.y},{x:b.x,y:p.y}];else if(Math.abs(dx)<=tolerance)bends=[{x:p.x,y:a.y},{x:p.x,y:b.y}];else{const candidates=[{x:a.x,y:b.y},{x:b.x,y:a.y}],penalty=q=>{let score=0;const before=points[index-2],after=points[index+2];if(before&&Math.abs((a.x-before.x)*(q.x-a.x)+(a.y-before.y)*(q.y-a.y))>EPS)score++;if(after&&Math.abs((b.x-q.x)*(after.x-b.x)+(b.y-q.y)*(after.y-b.y))>EPS)score++;return score;};candidates.sort((q,r)=>penalty(q)-penalty(r)||distance(q,p)-distance(r,p));bends=[candidates[0]];}out.splice(index,1,...bends);return normalize(out,options);}
function preview(gesture,p,options={}){if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return gesture.originalPoints.map(copy);const shift=!!options.shift;if(!shift)gesture.snapMode=null;const points=shift?gesture.basePoints:gesture.freeBasePoints,index=shift?gesture.index:gesture.freeIndex;return snap(points,index,p,{...options,deep:points.length<=200,previousMode:gesture.snapMode,onMode:mode=>gesture.snapMode=mode});}
function connect(points,target,orthogonal=false){const out=points.map(copy),a=out.at(-1);if(!a)return [copy(target)];if(orthogonal&&Math.abs(a.x-target.x)>EPS&&Math.abs(a.y-target.y)>EPS){const before=out.at(-2),horizontal=before?Math.abs(a.x-before.x)>=Math.abs(a.y-before.y):Math.abs(target.x-a.x)<Math.abs(target.y-a.y);out.push(horizontal?{x:a.x,y:target.y}:{x:target.x,y:a.y});}if(distance(out.at(-1),target)>EPS)out.push(copy(target));return out;}
const api=Object.freeze({begin,preview,snap,normalize,axisPoint,connect});root.PolylineEditor=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
