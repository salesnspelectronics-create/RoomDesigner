/* Conservative local proposals, never an automatic/destructive semantic conversion. */
(function(global){
'use strict';
const kinds={dining_chair:'صندلی',round_table:'میز گرد',square_table:'میز مربع',table:'میز ناهارخوری',double_bed:'تخت دونفره',single_bed:'تخت یک‌نفره',lamp:'آباژور',door:'در لولایی',sliding_door:'در کشویی'};
function named(name){const s=name.toLowerCase();if(/slid|کشویی/.test(s))return 'sliding_door';if(/chair|صندلی/.test(s))return 'dining_chair';if(/bed|تخت/.test(s))return /single|یک/.test(s)?'single_bed':'double_bed';if(/lamp|آباژور/.test(s))return 'lamp';if(/door|درب|\bدر\b/.test(s))return 'door';if(/table|میز/.test(s))return /round|circle|گرد/.test(s)?'round_table':/square|مربع/.test(s)?'square_table':'table';return null}
function bounds(lines,indices){let x=Infinity,y=Infinity,X=-Infinity,Y=-Infinity;for(const i of indices)for(const p of [lines[i].a,lines[i].b]){x=Math.min(x,p.x);y=Math.min(y,p.y);X=Math.max(X,p.x);Y=Math.max(Y,p.y)}return {x,y,w:X-x,h:Y-y}}
function inside(a,b,pad=0){return a.x>=b.x-pad&&a.y>=b.y-pad&&a.x+a.w<=b.x+b.w+pad&&a.y+a.h<=b.y+b.h+pad}
function analyze(segments,factor){
 if(!Array.isArray(segments)||!Number.isFinite(factor)||factor<=0)return {candidates:[],limited:false};
 const lines=segments.map(s=>({...s,a:{x:s.a.x*factor,y:s.a.y*factor},b:{x:s.b.x*factor,y:s.b.y*factor}})),result=[],claimed=new Set();
 const add=(kind,indices,reason,rotation=0)=>{indices=[...new Set(indices)].filter(i=>!claimed.has(i));if(indices.length<2)return;const b=bounds(lines,indices);if(![b.x,b.y,b.w,b.h].every(Number.isFinite)||b.w<=.01||b.h<=.01)return;const candidate={id:'candidate-'+(result.length+1),kind,name:kinds[kind],indices,bounds:{x:b.x/factor,y:b.y/factor,w:b.w/factor,h:b.h/factor},reason,rotation};result.push(candidate);for(const i of indices)claimed.add(i)};
 const blocks=new Map();for(let i=0;i<lines.length;i++){const s=lines[i];for(let n=0;n<(s.blockNames||[]).length;n++){const kind=named(s.blockNames[n]);if(!kind)continue;const key=s.blockPath.split('/').slice(0,n+2).join('/');if(!blocks.has(key))blocks.set(key,{kind,indices:[]});blocks.get(key).indices.push(i);break}}
 for(const {kind,indices}of blocks.values())add(kind,indices,'نام بلوک CAD');
 if(lines.length>5000)return {candidates:result,limited:true};
 const parent=lines.map((_,i)=>i),root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i]}return i},union=(a,b)=>{parent[root(a)]=root(b)},cells=new Map(),tol=2;
 const allowed=s=>!/wall|window|glass|cols|pipe|water|sewer|sprinkl|دیوار|پنجره/i.test(s.layer||'');
 for(let i=0;i<lines.length;i++){if(claimed.has(i)||!allowed(lines[i]))continue;for(const p of [lines[i].a,lines[i].b]){const x=Math.floor(p.x/tol),y=Math.floor(p.y/tol);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const q of cells.get((x+a)+','+(y+b))||[])if(lines[q.i].layer===lines[i].layer&&Math.hypot(p.x-q.p.x,p.y-q.p.y)<=tol)union(i,q.i);const key=x+','+y;if(!cells.has(key))cells.set(key,[]);cells.get(key).push({i,p})}}
 const components=new Map();for(let i=0;i<lines.length;i++)if(!claimed.has(i)&&allowed(lines[i])){const r=root(i);if(!components.has(r))components.set(r,[]);components.get(r).push(i)}
 let parts=[...components.values()].filter(a=>a.length>=3).map(indices=>({indices,b:bounds(lines,indices),layer:lines[indices[0]].layer}));
 // Join a chair's separated back and seat only when their small, non-contained boxes touch.
 for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){const a=parts[i],b=parts[j];if(!a||!b||a.layer!==b.layer||inside(a.b,b.b)||inside(b.b,a.b))continue;const x=Math.max(a.b.x,b.b.x),y=Math.max(a.b.y,b.b.y),X=Math.min(a.b.x+a.b.w,b.b.x+b.b.w),Y=Math.min(a.b.y+a.b.h,b.b.y+b.b.h),u=bounds(lines,[...a.indices,...b.indices]);if(X-x>=-2&&Y-y>=-2&&u.w>=30&&u.h>=30&&u.w<=105&&u.h<=105){const thin=[a.b,b.b].find(q=>Math.min(q.w,q.h)<22);a.indices.push(...b.indices);a.b=u;if(thin)a.back=thin;parts[j]=null}}
 parts=parts.filter(Boolean);
 const contained=(part)=>parts.filter(p=>p.layer===part.layer&&inside(p.b,part.b,.6)).flatMap(p=>p.indices);
 // Large closed bed outlines contain pillows/blankets. Keep other furniture outside the box.
 for(const p of parts){const b=p.b,short=Math.min(b.w,b.h),long=Math.max(b.w,b.h);if(p.indices.some(i=>claimed.has(i))||!/furn|frn|bed|تخت/i.test(p.layer||''))continue;if(p.indices.length>=8&&short>=85&&short<=230&&long>=175&&long<=250){const pillows=parts.filter(q=>q!==p&&inside(q.b,b,1)&&Math.min(q.b.w,q.b.h)>15&&Math.max(q.b.w,q.b.h)<100),small=pillows[0]?.b;let rotation=0;if(small){const cx=small.x+small.w/2,cy=small.y+small.h/2,dist=[Math.abs(cy-b.y),Math.abs(cx-(b.x+b.w)),Math.abs(cy-(b.y+b.h)),Math.abs(cx-b.x)];rotation=[0,90,180,270][dist.indexOf(Math.min(...dist))]}add(short<120?'single_bed':'double_bed',contained(p),'هندسهٔ پیشنهادی تخت',rotation)}}
 for(const p of parts){if(p.indices.some(i=>claimed.has(i)))continue;const b=p.b,short=Math.min(b.w,b.h),long=Math.max(b.w,b.h),ratio=short/long,n=p.indices.length;
  if(/door|درب|کشویی/i.test(p.layer||'')){if(short<20&&long>=55&&long<=240)add('sliding_door',p.indices,'بازشوی باریک؛ نیازمند تأیید',b.h>b.w?90:0);else if(n>=12&&ratio>.75&&long>=55&&long<=180)add('door',p.indices,'قوس و بازشوی پیشنهادی');continue}
  if(!/furn|frn|chair|table|lamp|مبلمان/i.test(p.layer||''))continue;
  const cx=b.x+b.w/2,cy=b.y+b.h/2,radii=p.indices.flatMap(i=>[lines[i].a,lines[i].b]).map(q=>Math.hypot(q.x-cx,q.y-cy)),mean=radii.reduce((a,b)=>a+b,0)/radii.length,variation=Math.sqrt(radii.reduce((a,b)=>a+(b-mean)**2,0)/radii.length)/(mean||1),perimeter=p.indices.reduce((a,i)=>a+Math.hypot(lines[i].a.x-lines[i].b.x,lines[i].a.y-lines[i].b.y),0);
  const radial=n>=8&&ratio>.88&&variation<.08&&Math.abs(perimeter-2*Math.PI*mean)/(2*Math.PI*mean)<.18;
  if(radial&&long>=15&&long<=38)add('lamp',contained(p),'حلقهٔ کوچک؛ پیشنهاد آباژور');
  else if(radial&&long>=40&&long<=180)add('round_table',contained(p),'محیط دایره‌ای میز');
  else if(n===4&&ratio>.9&&long>=40&&long<=150)add('square_table',p.indices,'چهار ضلع مربع');
  else if(n>=8&&n<=40&&short>=30&&long<=105&&ratio>.7){let rotation=0;if(p.back){const dx=p.back.x+p.back.w/2-(b.x+b.w/2),dy=p.back.y+p.back.h/2-(b.y+b.h/2);rotation=Math.abs(dx)>Math.abs(dy)?dx>0?90:270:dy>0?180:0}add('dining_chair',p.indices,'نشیمن و پشتی پیشنهادی',rotation)}
 }
 return {candidates:result,limited:false};
}
const api={analyze,kinds,named};global.RoomDXFObjects=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
