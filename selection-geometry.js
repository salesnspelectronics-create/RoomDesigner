/* Eight-handle resize geometry in the object's rotated local coordinates. */
(function(global){'use strict';
const directions=[[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]];
function world(o,x,y){const a=(Number(o.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return {x:o.x+x*c-y*s,y:o.y+x*s+y*c}}
function handles(o){return directions.map(([x,y])=>world(o,x*o.w/2,y*o.h/2))}
function resize(o,index,p,proportional=false,min=16){const [sx,sy]=directions[index],a=(Number(o.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),dx=p.x-o.x,dy=p.y-o.y,lx=dx*c+dy*s,ly=-dx*s+dy*c,ax=-sx*o.w/2,ay=-sy*o.h/2;let w=sx?Math.max(min,sx*(lx-ax)):o.w,h=sy?Math.max(min,sy*(ly-ay)):o.h;if(proportional){const factor=Math.max(min/o.w,min/o.h,sx?w/o.w:0,sy?h/o.h:0);w=o.w*factor;h=o.h*factor}const center=world(o,sx?ax+sx*w/2:0,sy?ay+sy*h/2:0);return {...center,w,h}}
function resizeCursor(index,rotation=0){const [x,y]=directions[index],angle=Math.atan2(y,x)*180/Math.PI+rotation,step=((Math.round(angle/45)%4)+4)%4;return ['ew-resize','nwse-resize','ns-resize','nesw-resize'][step]}
global.SelectionGeometry={directions,handles,resize,resizeCursor};
})(globalThis);
