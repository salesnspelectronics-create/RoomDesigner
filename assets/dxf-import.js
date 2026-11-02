/* Staged vector DXF import. The drawing changes only after the final callback. */
(function(global){
'use strict';
let active=null;
async function open(file,onImport){
 if(active)active.close();const dialog=document.createElement('dialog');dialog.id='dxfImportDialog';dialog.dir='rtl';
 dialog.innerHTML=`<div class="dxf-shell"><header><strong>واردکردن نقشه DXF</strong><button data-dxf-close aria-label="بستن">×</button></header><p data-dxf-name></p><p role="status" data-dxf-status>در حال خواندن هندسه…</p><div class="dxf-controls"><label>واحد فایل <select data-dxf-unit><option value="">تعیین واحد…</option value="0.1">میلی‌متر</option><option value="1">سانتی‌متر</option><option value="10">دسی‌متر</option><option value="100">متر</option><option value="2.54">اینچ</option><option value="30.48">فوت</option><option value="custom">ضریب دلخواه</option></select></label><label>ضریب به سانتی‌متر <input data-dxf-factor type="number" min="0.000001" max="100000" step="any" disabled></label><label><input type="checkbox" data-dxf-group checked> گروه‌بندی نقشه</label></div><div class="dxf-workspace"><aside><div class="dxf-layer-tools"><button data-dxf-all disabled>همه</button><button data-dxf-arch disabled>معماری</button><button data-dxf-none disabled>هیچ‌کدام</button></div><div class="dxf-layers" aria-label="لایه‌های DXF"></div></aside><section><div class="dxf-preview-tools"><button data-dxf-crop disabled aria-pressed="false">برش محدوده</button><button data-dxf-reset disabled>حذف برش</button><button data-dxf-fit disabled>نمایش کل نقشه</button></div><p class="dxf-hint">لایه‌ها را انتخاب کنید. برای جداکردن اتاق، «برش محدوده» را بزنید و روی نقشه کادر بکشید. چرخ موس: زوم؛ کشیدن در حالت عادی: جابه‌جایی نما.</p><svg class="dxf-preview" aria-label="پیش‌نمایش برداری DXF" tabindex="0"><g data-dxf-art></g><rect data-dxf-crop-box hidden></rect></svg><p data-dxf-size></p></section></div><p data-dxf-warnings></p><footer><span data-dxf-count></span><button data-dxf-close>انصراف</button><button class="primary" data-dxf-import disabled>افزودن نقشه قابل‌ویرایش</button></footer></div>`;
 document.body.append(dialog);dialog.showModal();const $=s=>dialog.querySelector(s),svg=$('.dxf-preview'),status=$('[data-dxf-status]'),layerList=$('.dxf-layers'),unit=$('[data-dxf-unit]'),factor=$('[data-dxf-factor]'),importButton=$('[data-dxf-import]');$('[data-dxf-name]').textContent=file.name;
 let parsed=null,selected=new Set(),crop=null,viewport=null,gesture=null,cropMode=false,closed=false,busy=false,current=[];
 const close=()=>{if(closed)return;closed=true;dialog.close();dialog.remove();if(active?.dialog===dialog)active=null};active={dialog,close};
 dialog.addEventListener('keydown',e=>e.stopPropagation());
 dialog.querySelectorAll('[data-dxf-close]').forEach(b=>b.onclick=close);dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 const applyViewport=()=>{if(viewport)svg.setAttribute('viewBox',[viewport.x,viewport.y,viewport.w,viewport.h].join(' '))};
 function fit(){if(!parsed)return;const b=global.RoomDXF.bounds(parsed.segments.filter(s=>selected.has(s.layer)));if(!b)return;const pad=Math.max(b.w,b.h,.001)*.05;viewport={x:b.x-pad,y:b.y-pad,w:Math.max(b.w+pad*2,.01),h:Math.max(b.h+pad*2,.01)};applyViewport()}
 function selectedSegments(){return parsed?global.RoomDXF.select(parsed,[...selected],crop):[]}
 function sync(){
  if(!parsed)return;current=selectedSegments();const f=Number(factor.value),valid=Number.isFinite(f)&&f>0&&f<=100000&&!!unit.value;
  $('[data-dxf-count]').textContent=current.length.toLocaleString('fa-IR')+' قطعه‌خط در '+selected.size.toLocaleString('fa-IR')+' لایه';
  importButton.disabled=!valid||!current.length||current.length>20000||busy;
  const bounds=global.RoomDXF.bounds(current);$('[data-dxf-size]').textContent=valid&&bounds?'ابعاد محدودهٔ ورود: '+(bounds.w*f).toLocaleString('fa-IR',{maximumFractionDigits:1})+' × '+(bounds.h*f).toLocaleString('fa-IR',{maximumFractionDigits:1})+' سانتی‌متر':'';
  if(current.length>20000)status.textContent='بیش از ۲۰ هزار قطعه‌خط انتخاب شده؛ لایه‌های کمتری انتخاب کنید یا محدوده را برش بزنید.';else status.textContent=valid?'ورود به‌صورت خطوط برداری، در لایه‌های جدا و قابل‌ویرایش انجام می‌شود.':'واحد فایل مشخص نیست؛ پیش از ورود، واحد را انتخاب کنید.';
  const r=$('[data-dxf-crop-box]');r.hidden=!crop;r.style.display=crop?'':'none';if(crop)for(const k of ['x','y','width','height'])r.setAttribute(k,crop[{width:'w',height:'h'}[k]||k]);$('[data-dxf-reset]').disabled=!crop;
 }
 function draw(){
  if(!parsed)return;const art=$('[data-dxf-art]');art.replaceChildren();const colors=['#83c5ff','#f5bf68','#8bdbb3','#c5a0f0','#eea2ae','#81d1db'];const step=Math.max(1,Math.ceil(parsed.segments.length/12000));
  const paths=new Map();for(let j=0;j<parsed.segments.length;j+=step){const s=parsed.segments[j];if(!selected.has(s.layer))continue;paths.set(s.layer,(paths.get(s.layer)||'')+'M'+s.a.x+' '+s.a.y+'L'+s.b.x+' '+s.b.y)}
  for(let i=0;i<parsed.layers.length;i++){const l=parsed.layers[i],d=paths.get(l.name);if(d){const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);p.setAttribute('fill','none');p.setAttribute('stroke',colors[i%colors.length]);p.setAttribute('stroke-width','1');p.setAttribute('vector-effect','non-scaling-stroke');art.append(p)}}
  sync();
 }
 function choose(mode){if(!parsed)return;selected=new Set(parsed.layers.filter(l=>mode==='all'||mode==='arch'&&global.RoomDXF.architectural(l.name)).map(l=>l.name));for(const input of layerList.querySelectorAll('input'))input.checked=selected.has(input.dataset.layer);fit();draw()}
 $('[data-dxf-all]').onclick=()=>choose('all');$('[data-dxf-none]').onclick=()=>choose('none');$('[data-dxf-arch]').onclick=()=>choose('arch');$('[data-dxf-fit]').onclick=fit;
 unit.onchange=()=>{factor.disabled=unit.value!=='custom';if(unit.value&&unit.value!=='custom')factor.value=unit.value;if(!unit.value)factor.value='';sync()};factor.oninput=sync;
 $('[data-dxf-crop]').onclick=()=>{cropMode=!cropMode;gesture=null;$('[data-dxf-crop]').setAttribute('aria-pressed',String(cropMode));svg.classList.toggle('cropping',cropMode)};
 $('[data-dxf-reset]').onclick=()=>{crop=null;sync()};
 function at(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())}
 svg.addEventListener('pointerdown',e=>{if(!parsed||e.button!==0||gesture||!viewport)return;e.preventDefault();gesture={id:e.pointerId,start:at(e),view:{...viewport},previous:crop?{...crop}:null,mode:cropMode?'crop':'pan',clientX:e.clientX,clientY:e.clientY};svg.setPointerCapture(e.pointerId)});
 svg.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;const a=gesture.start;if(gesture.mode==='crop'){const p=at(e);crop={x:Math.min(a.x,p.x),y:Math.min(a.y,p.y),w:Math.abs(a.x-p.x),h:Math.abs(a.y-p.y)};sync()}else{const rect=svg.getBoundingClientRect(),scale=Math.max(gesture.view.w/rect.width,gesture.view.h/rect.height);viewport={...gesture.view,x:gesture.view.x-(e.clientX-gesture.clientX)*scale,y:gesture.view.y-(e.clientY-gesture.clientY)*scale};applyViewport()}});
 function finish(e){if(!gesture||gesture.id!==e.pointerId)return;if(gesture.mode==='crop'&&(e.type==='pointercancel'||!crop||crop.w<1e-8||crop.h<1e-8))crop=gesture.previous;gesture=null;sync()}
 svg.addEventListener('pointerup',finish);svg.addEventListener('pointercancel',finish);svg.addEventListener('lostpointercapture',finish);
 svg.addEventListener('wheel',e=>{if(!viewport)return;e.preventDefault();const p=at(e),scale=e.deltaY>0?1.2:1/1.2;const w=viewport.w*scale,h=viewport.h*scale;if(w<1e-8||w>1e14)return;viewport={x:p.x+(viewport.x-p.x)*scale,y:p.y+(viewport.y-p.y)*scale,w,h};applyViewport()},{passive:false});
 importButton.onclick=async()=>{if(importButton.disabled||busy||closed)return;busy=true;sync();try{await onImport({segments:current.map(s=>({...s,a:{...s.a},b:{...s.b}})),factor:Number(factor.value),group:$('[data-dxf-group]').checked,preserveLayers:true,fileName:file.name});close()}catch(e){busy=false;sync();status.textContent='ورود انجام نشد: '+e.message}};
 try{
  if(file.size>80*1024*1024)throw Error('حداکثر اندازهٔ DXF برابر ۸۰ مگابایت است');const source=await file.text();if(closed)return;await new Promise(resolve=>setTimeout(resolve,0));if(closed)return;parsed=global.RoomDXF.parse(source);if(closed)return;
  selected=new Set(parsed.layers.filter(l=>!l.off&&!l.frozen).map(l=>l.name));
  for(const l of parsed.layers){const label=document.createElement('label'),input=document.createElement('input'),name=document.createElement('span'),count=document.createElement('small');input.type='checkbox';input.dataset.layer=l.name;input.checked=selected.has(l.name);name.textContent=l.name;name.dir='auto';count.textContent=l.count.toLocaleString('fa-IR');if(l.off||l.frozen)label.title='این لایه در فایل CAD خاموش یا منجمد است؛ برای ورود می‌توانید آن را انتخاب کنید';input.onchange=()=>{if(input.checked)selected.add(l.name);else selected.delete(l.name);fit();draw()};label.append(input,name,count);layerList.append(label)}
  if(parsed.unit){unit.value=String(parsed.unit.factor);factor.value=String(parsed.unit.factor)}
  const warnings=Object.entries(parsed.warnings);$('[data-dxf-warnings]').textContent=warnings.length?'آیتم‌های پشتیبانی‌نشده/حذف‌شده: '+warnings.map(([n,c])=>n+' ('+c.toLocaleString('fa-IR')+')').join('، '):'';
  if(parsed.segments.length>12000)$('[data-dxf-warnings]').textContent+=' پیش‌نمایش برای سرعت نمونه‌برداری شده؛ ورود از تمام خطوط انتخاب‌شده استفاده می‌کند.';
  for(const b of dialog.querySelectorAll('[data-dxf-all],[data-dxf-none],[data-dxf-arch],[data-dxf-crop],[data-dxf-fit]'))b.disabled=false;
  fit();draw();
 }catch(e){if(!closed){status.textContent='خواندن فایل انجام نشد: '+e.message;importButton.disabled=true}}
 return {close};
}
 global.RoomDXFImport={open};
})(window);
