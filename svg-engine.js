/* Reusable SVG engine. No application state, storage, UI or network dependencies. */
(function(global){
 'use strict';
 const NS='http://www.w3.org/2000/svg';
 const allowed=new Set('svg g defs path rect circle ellipse line polyline polygon text tspan title desc clipPath mask linearGradient radialGradient stop pattern marker symbol use style metadata font font-face'.toLowerCase().split(' '));
 function parse(raw){return new DOMParser().parseFromString(raw,'image/svg+xml')}
 function serialize(root){return new XMLSerializer().serializeToString(root)}
 function viewBox(value){const b=Array.isArray(value)?value:String(value||'').trim().split(/[ ,]+/).map(Number);if(b.length!==4||!b.every(Number.isFinite)||b[2]<=0||b[3]<=0)throw Error('ViewBox نامعتبر است');return b.slice()}
 function sanitize(raw){
  if(typeof raw!=='string'||!raw||raw.length>250000||/<!ENTITY/i.test(raw))return null;
  // Permit only the standard, external SVG 1.1 DTD declaration; never resolve external entities.
  const standardDtd=/<!DOCTYPE\s+svg\s+PUBLIC\s+["']-\/\/W3C\/\/DTD SVG 1\.1\/\/EN["']\s+["']http:\/\/www\.w3\.org\/Graphics\/SVG\/1\.1\/DTD\/svg11\.dtd["']\s*>/gi;
  const withoutDtd=raw.replace(standardDtd,'');if(/<!DOCTYPE/i.test(withoutDtd))return null;
  const p=parse(withoutDtd),r=p.documentElement;if(p.querySelector('parsererror')||r.localName!=='svg'||r.namespaceURI!==NS)return null;
  const rules=new Map();
  for(const style of [...r.querySelectorAll('style')]){
   const css=(style.textContent||'').replace(/@font-face\s*\{[^{}]*\}/gi,'');
   if(/@import|url\s*\(|expression\s*\(|\\/i.test(css))return null;
   for(const match of css.matchAll(/\.([\w-]+)\s*\{([^{}]*)\}/g))rules.set(match[1],match[2].split(';').map(x=>x.trim()).filter(x=>/^(fill|stroke|stroke-width|stroke-linejoin|stroke-linecap|stroke-miterlimit|fill-rule|opacity|fill-opacity|stroke-opacity|font-size|font-family|font-weight)\s*:/i.test(x)).join(';'));
   style.remove();
  }
  // Embedded CorelDRAW font glyphs are nonessential and can contain unsupported nodes.
  for(const n of [...r.querySelectorAll('font,metadata')])n.remove();
  for(const n of [r,...r.querySelectorAll('*')]){
   if(n.namespaceURI!==NS||!allowed.has(n.localName.toLowerCase()))return null;
   for(const a of [...n.attributes]){
    if(/^on/i.test(a.name)||/javascript:|expression\s*\(|@import|\\/i.test(a.value))return null;
    if(/href/i.test(a.name)&&!/^#[\w.-]+$/.test(a.value))return null;
    if(/url\s*\(/i.test(a.value)&&!/^url\(\s*#[\w.-]+\s*\)$/.test(a.value))return null;
    if(a.name==='style'&&/url\s*\(/i.test(a.value))return null;
   }
   const css=(n.getAttribute('class')||'').split(/\s+/).map(c=>rules.get(c)).filter(Boolean).join(';');if(css)n.setAttribute('style',(n.getAttribute('style')||'')+';'+css);n.removeAttribute('class');
  }
  try{if(r.hasAttribute('viewBox'))viewBox(r.getAttribute('viewBox'));else{const w=r.hasAttribute('width')?parseFloat(r.getAttribute('width')):300,h=r.hasAttribute('height')?parseFloat(r.getAttribute('height')):150;viewBox([0,0,w,h]);r.setAttribute('viewBox',`0 0 ${w} ${h}`)}}catch{return null}
  return serialize(r);
 }
 function crop(raw,box){const safe=sanitize(raw);if(!safe)throw Error('SVG نامعتبر است');const r=parse(safe).documentElement;r.setAttribute('viewBox',viewBox(box).join(' '));r.removeAttribute('width');r.removeAttribute('height');return serialize(r)}
 function layout(raw,width,height,mode='fit'){
  const r=parse(raw).documentElement,b=viewBox(r.getAttribute('viewBox'));if(![width,height].every(x=>Number.isFinite(x)&&x>0))throw Error('ابعاد نامعتبر است');
  const k=mode==='center'?Math.min(1,width/b[2],height/b[3]):Math.min(width/b[2],height/b[3]);
  const sx=mode==='stretch'?width/b[2]:k,sy=mode==='stretch'?height/b[3]:k;
  return {box:b,sx,sy,x:(width-b[2]*sx)/2,y:(height-b[3]*sy)/2,width:b[2]*sx,height:b[3]*sy};
 }
 function image(raw,width,height,mode){const r=parse(raw).documentElement;r.setAttribute('width',width);r.setAttribute('height',height);r.setAttribute('preserveAspectRatio',mode==='stretch'?'none':'xMidYMid meet');r.removeAttribute('x');r.removeAttribute('y');return serialize(r)}
 function transform(point,d){let x=point.x-d.x,y=point.y-d.y;if(d.flipX)x=-x;if(d.flipY)y=-y;const a=(Number(d.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return {x:d.x+x*c-y*s,y:d.y+x*s+y*c}}
 function bounds(raw){
  const safe=sanitize(raw);if(!safe)throw Error('SVG نامعتبر است');
  const host=document.createElement('div');host.style.cssText='position:absolute;left:-100000px;visibility:hidden;pointer-events:none';
  const root=parse(safe).documentElement,graphic=document.importNode(root,true);graphic.setAttribute('width','1000');graphic.setAttribute('height','1000');host.append(graphic);document.body.append(host);
  try{
   const points=[],inv=graphic.getCTM()?.inverse();if(!inv)return null;
   for(const n of graphic.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line,text,use')){
    if(n.closest('defs,clipPath,mask,pattern,marker,symbol'))continue;
    const cs=getComputedStyle(n);if(cs.display==='none'||cs.visibility==='hidden'||cs.opacity==='0')continue;
    const b=n.getBBox();if(!(b.width>0||b.height>0))continue;
    const t=inv.multiply(n.getCTM()),stroke=cs.stroke==='none'?0:(parseFloat(cs.strokeWidth)||0)/2;
    // Include conservative miter/stroke padding; never silently discard white artwork.
    const pad=stroke*Math.max(1,Math.min(10,parseFloat(cs.strokeMiterlimit)||4));
    for(const [x,y] of [[b.x-pad,b.y-pad],[b.x+b.width+pad,b.y-pad],[b.x-pad,b.y+b.height+pad],[b.x+b.width+pad,b.y+b.height+pad]])points.push({x:t.a*x+t.c*y+t.e,y:t.b*x+t.d*y+t.f});
   }
   if(!points.length)return null;const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y)),w=Math.max(...points.map(p=>p.x))-x,h=Math.max(...points.map(p=>p.y))-y;
   const pad=Math.max(w,h)*.015;return viewBox([x-pad,y-pad,w+2*pad,h+2*pad]);
  }finally{host.remove()}
 }
 function clipSegment(a,b,box){const [x,y,w,h]=viewBox(box),dx=b.x-a.x,dy=b.y-a.y,p=[-dx,dx,-dy,dy],q=[a.x-x,x+w-a.x,a.y-y,y+h-a.y];let lo=0,hi=1;for(let i=0;i<4;i++){if(p[i]===0){if(q[i]<0)return null}else{const t=q[i]/p[i];if(p[i]<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return null}}return [{x:a.x+lo*dx,y:a.y+lo*dy},{x:a.x+hi*dx,y:a.y+hi*dy}]}
 function removeElement(raw,index){const r=parse(raw).documentElement,n=[...r.querySelectorAll('rect,path,polygon,circle,ellipse')][index];if(!n)throw Error('عنصر پیدا نشد');n.remove();return serialize(r)}
 global.SvgEngine=Object.freeze({sanitize,parse,serialize,viewBox,crop,layout,image,transform,bounds,removeElement,clipSegment});
})(globalThis);
