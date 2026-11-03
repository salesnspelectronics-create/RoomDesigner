/* Bounded ASCII DXF reference geometry. No network or DOM dependencies. */
(function(global){
'use strict';
const LIMIT=200000,MAX_RECORDS=500000,MAX_PAIRS=6000000;
const unitTable={1:{factor:2.54,name:'اینچ'},2:{factor:30.48,name:'فوت'},4:{factor:.1,name:'میلی‌متر'},5:{factor:1,name:'سانتی‌متر'},6:{factor:100,name:'متر'},14:{factor:10,name:'دسی‌متر'}};
const identity=[1,0,0,1,0,0];
function multiply(a,b){return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]}
function point(m,p){return {x:m[0]*p.x+m[2]*p.y+m[4],y:m[1]*p.x+m[3]*p.y+m[5]}}
function value(r,code,fallback=''){const p=r.pairs.find(p=>p[0]===code);return p?p[1]:fallback}
function number(r,code,fallback=0){const v=value(r,code,null);return v===null?fallback:Number(v)}
function parse(source){
 if(typeof source!=='string'||/^AutoCAD Binary DXF/i.test(source)||source.includes('\0'))throw Error('این ورودی DXF متنی نیست؛ خروجی ASCII DXF را انتخاب کنید');
 const lines=source.replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n');if(lines.length>MAX_PAIRS*2)throw Error('تعداد داده‌های DXF بیش از حد مجاز است');
 const roots=[],blocks=new Map(),layerMeta=new Map(),warnings={},segments=[];let section='',pending=false,current=null,block=null,polyline=null,recordCount=0,unitCode=0,headerKey='',eof=false,invalid=0,activeBlockNames=[],activeBlockPath='';
 const warn=type=>warnings[type]=(warnings[type]||0)+1;
 function accept(r){
  if(!r)return;if(++recordCount>MAX_RECORDS)throw Error('تعداد آبجکت‌های DXF بیش از حد مجاز است');
  if(section==='TABLES'&&r.type==='LAYER'){const name=value(r,2,'0'),color=number(r,62,7),flags=number(r,70);layerMeta.set(name,{name,off:color<0,frozen:!!(flags&1),color:Math.abs(color)});return}
  if(section!=='BLOCKS'&&section!=='ENTITIES')return;
  if(section==='BLOCKS'&&r.type==='BLOCK'){block={name:value(r,2),base:{x:number(r,10),y:number(r,20)},entities:[]};if(!block.name)return;blocks.set(block.name,block);polyline=null;return}
  if(r.type==='ENDBLK'){block=null;polyline=null;return}
  const target=section==='BLOCKS'?block?.entities:roots;if(!target)return;
  if(r.type==='VERTEX'&&polyline){polyline.vertices.push({x:number(r,10),y:number(r,20),z:number(r,30),bulge:number(r,42)});return}
  if(r.type==='SEQEND'){polyline=null;return}
  polyline=null;if(r.type==='POLYLINE'){r.vertices=[];polyline=r}target.push(r);
 }
 for(let i=0;i+1<lines.length;i+=2){const rawCode=lines[i].trim(),v=lines[i+1].trim();if(!/^\d+$/.test(rawCode)){if(!rawCode&&!v)continue;throw Error('ساختار جفت‌داده DXF معتبر نیست')}const code=Number(rawCode);
  if(code===0){accept(current);current=null;if(v==='SECTION'){pending=true;continue}if(v==='ENDSEC'){section='';block=null;polyline=null;continue}if(v==='EOF'){eof=true;break}if(!pending&&section!=='HEADER')current={type:v,pairs:[],id:recordCount};continue}
  if(pending&&code===2){section=v;pending=false;continue}
  if(section==='HEADER'){if(code===9)headerKey=v;else if(headerKey==='$INSUNITS'&&code===70)unitCode=Number(v);continue}
  if(current)current.pairs.push([code,v]);
 }
 if(!eof)throw Error('پایان فایل DXF یافت نشد؛ فایل کامل ASCII DXF را انتخاب کنید');
 function add(a,b,m,layer,shapeId){const aa=point(m,a),bb=point(m,b);aa.y=-aa.y;bb.y=-bb.y;if(![aa.x,aa.y,bb.x,bb.y].every(Number.isFinite)){invalid++;return}if(Math.hypot(aa.x-bb.x,aa.y-bb.y)<1e-9)return;if(segments.length>=LIMIT)throw Error('هندسه بیش از ۲۰۰ هزار قطعه‌خط دارد؛ ابتدا نقشه یا لایه‌های کمتری را در CAD خروجی بگیرید');segments.push({a:aa,b:bb,layer,shapeId,...(activeBlockNames.length?{blockNames:[...activeBlockNames],blockPath:activeBlockPath}:{})})}
 function edge(a,b,bulge,m,l,id){if(!Number.isFinite(bulge)||Math.abs(bulge)<1e-10){add(a,b,m,l,id);return}const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<1e-10)return;const k=(1-bulge*bulge)/(4*bulge),c={x:(a.x+b.x)/2-dy*k,y:(a.y+b.y)/2+dx*k},start=Math.atan2(a.y-c.y,a.x-c.x),theta=4*Math.atan(bulge),radius=Math.hypot(a.x-c.x,a.y-c.y),n=Math.max(2,Math.ceil(Math.abs(theta)/(Math.PI/36)));let prev=a;for(let i=1;i<=n;i++){const t=start+theta*i/n,p=i===n?b:{x:c.x+radius*Math.cos(t),y:c.y+radius*Math.sin(t)};add(prev,p,m,l,id);prev=p}}
 function poly(vertices,closed,m,l,id){for(let i=1;i<vertices.length;i++)edge(vertices[i-1],vertices[i],vertices[i-1].bulge||0,m,l,id);if(closed&&vertices.length>1)edge(vertices.at(-1),vertices[0],vertices.at(-1).bulge||0,m,l,id)}
 function walk(list,m,parentLayer,stack,prefix){
  for(let i=0;i<list.length;i++){activeBlockNames=stack;activeBlockPath=prefix;const r=list[i],own=value(r,8,'0'),l=own==='0'&&parentLayer?parentLayer:own,id=prefix+'/'+i;
   if(number(r,60)===1)continue;
   let em=m;if(['LWPOLYLINE','POLYLINE','ARC','CIRCLE','INSERT'].includes(r.type)){if(Math.abs(number(r,210))>1e-9||Math.abs(number(r,220))>1e-9){warn('NON-XY OCS');continue}if(number(r,230,1)<0)em=multiply(m,[-1,0,0,1,0,0])}
   if(r.type==='LINE'){const z0=number(r,30),z1=number(r,31);if(!Number.isFinite(z0)||!Number.isFinite(z1)||Math.abs(z0)>1e-9||Math.abs(z1)>1e-9){warn('NON-XY LINE');continue}add({x:number(r,10,NaN),y:number(r,20,NaN)},{x:number(r,11,NaN),y:number(r,21,NaN)},m,l,id);continue}
   if(r.type==='LWPOLYLINE'){const elevation=number(r,38);if(!Number.isFinite(elevation)||Math.abs(elevation)>1e-9){warn('NON-XY POLYLINE');continue}const v=[];for(const [c,n]of r.pairs){if(c===10)v.push({x:Number(n),y:NaN,bulge:0});else if(c===20&&v.length)v.at(-1).y=Number(n);else if(c===42&&v.length)v.at(-1).bulge=Number(n)}poly(v,!!(number(r,70)&1),em,l,id);continue}
   if(r.type==='POLYLINE'&&(number(r,70)&80)){warn('POLYLINE MESH');continue}
   if(r.type==='POLYLINE'){const elevation=number(r,30);if(!Number.isFinite(elevation)||Math.abs(elevation)>1e-9||r.vertices.some(v=>!Number.isFinite(v.z)||Math.abs(v.z)>1e-9)){warn('NON-XY POLYLINE');continue}poly(r.vertices,!!(number(r,70)&1),em,l,id);continue}
   if(r.type==='ARC'||r.type==='CIRCLE'||r.type==='ELLIPSE'){const centerZ=number(r,30),majorAxisZ=r.type==='ELLIPSE'?number(r,31):0;if(!Number.isFinite(centerZ)||!Number.isFinite(majorAxisZ)||Math.abs(centerZ)>1e-9||Math.abs(majorAxisZ)>1e-9){warn('NON-XY CURVE');continue}}
   if(r.type==='ARC'||r.type==='CIRCLE'){const cx=number(r,10),cy=number(r,20),radius=number(r,40);if(!Number.isFinite(radius)||radius<=0){invalid++;continue}const start=r.type==='CIRCLE'?0:number(r,50)*Math.PI/180;let span=r.type==='CIRCLE'?Math.PI*2:((number(r,51)-number(r,50))%360+360)%360*Math.PI/180;if(span===0)span=Math.PI*2;const n=Math.max(2,Math.ceil(span/(Math.PI/36)));let prev={x:cx+radius*Math.cos(start),y:cy+radius*Math.sin(start)};for(let j=1;j<=n;j++){const p={x:cx+radius*Math.cos(start+span*j/n),y:cy+radius*Math.sin(start+span*j/n)};add(prev,p,em,l,id);prev=p}continue}
   if(r.type==='ELLIPSE'){if(Math.abs(number(r,210))>1e-9||Math.abs(number(r,220))>1e-9){warn('NON-XY OCS');continue}const c={x:number(r,10),y:number(r,20)},u={x:number(r,11),y:number(r,21)},ratio=number(r,40,1),v={x:-u.y*ratio,y:u.x*ratio},start=number(r,41),end=number(r,42,Math.PI*2),span=end>start?end-start:end-start+Math.PI*2,n=Math.max(2,Math.min(144,Math.ceil(span/(Math.PI/36))));let prev=null;for(let j=0;j<=n;j++){const t=start+span*j/n,p={x:c.x+u.x*Math.cos(t)+v.x*Math.sin(t),y:c.y+u.y*Math.cos(t)+v.y*Math.sin(t)};if(prev)add(prev,p,em,l,id);prev=p}continue}
   if(r.type==='INSERT'){const name=value(r,2),b=blocks.get(name);if(!b){warn('MISSING BLOCK');continue}if(stack.includes(name)||stack.length>=8){warn('RECURSIVE BLOCK');continue}const sx=number(r,41,1),sy=number(r,42,1),t=number(r,50)*Math.PI/180,co=Math.cos(t),si=Math.sin(t),columns=number(r,70,1),rows=number(r,71,1);if(!Number.isInteger(columns)||!Number.isInteger(rows)||columns<1||rows<1||columns*rows>100){warn('INSERT ARRAY LIMIT');continue}for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){const px=col*number(r,44)-b.base.x,py=row*number(r,45)-b.base.y,local=[co*sx,si*sx,-si*sy,co*sy,number(r,10)+co*sx*px-si*sy*py,number(r,20)+si*sx*px+co*sy*py];walk(b.entities,multiply(em,local),l,[...stack,name],id+':'+row+':'+col)}continue}
   warn(r.type);
  }
 }
 walk(roots,identity,null,[],'root');if(!segments.length)throw Error('خط یا منحنی قابل ورود در این DXF پیدا نشد');
 const layers=new Map();for(const s of segments){if(!layers.has(s.layer))layers.set(s.layer,{...(layerMeta.get(s.layer)||{name:s.layer,off:false,frozen:false,color:7}),count:0});layers.get(s.layer).count++}
 if(invalid)warnings['INVALID GEOMETRY']=invalid;
 return {segments,layers:[...layers.values()],unit:unitTable[unitCode]||null,unitCode,warnings,entityCount:recordCount};
}
function bounds(segments){if(!segments.length)return null;let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const s of segments)for(const p of [s.a,s.b]){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}return {x:minX,y:minY,w:maxX-minX,h:maxY-minY}}
function clip(segment,r){if(!r)return {...segment,a:{...segment.a},b:{...segment.b}};const a=segment.a,b=segment.b,dx=b.x-a.x,dy=b.y-a.y,p=[-dx,dx,-dy,dy],q=[a.x-r.x,r.x+r.w-a.x,a.y-r.y,r.y+r.h-a.y];let lo=0,hi=1;for(let i=0;i<4;i++){if(Math.abs(p[i])<1e-15){if(q[i]<0)return null;continue}const t=q[i]/p[i];if(p[i]<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return null}if(hi-lo<1e-12)return null;return {...segment,a:{x:a.x+lo*dx,y:a.y+lo*dy},b:{x:a.x+hi*dx,y:a.y+hi*dy}}}
function select(parsed,names,crop=null){const selected=new Set(names),result=[],parts=new Map();let previous=null;for(const s of parsed.segments)if(selected.has(s.layer)){const c=clip(s,crop);if(!c)continue;if(crop&&s.shapeId){const key=s.layer+'|'+s.shapeId,continuous=previous&&previous.key===key&&Math.hypot(previous.end.x-c.a.x,previous.end.y-c.a.y)<1e-8;if(!continuous)parts.set(key,(parts.get(key)||0)+1);c.shapeId=s.shapeId+'/clip-'+parts.get(key);previous={key,end:c.b}}else previous=null;result.push(c)}return result}
function architectural(name){return /wall|door|window|glass|furn|\bfrn\b|cols|frame|معماری|دیوار|مبلمان|پنجره|ستون/i.test(name)}
const api={parse,bounds,clip,select,architectural,unitTable,limits:{segments:LIMIT,importSegments:20000}};global.RoomDXF=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
