/* Staged vector DXF import. The drawing changes only after the final callback. */
(function(global){
'use strict';
let active=null;
async function open(file,onImport){
 if(active)active.close();const dialog=document.createElement('dialog');dialog.id='dxfImportDialog';dialog.dir='rtl';
 dialog.innerHTML=`<div class="dxf-shell"><header><strong>واردکردن نقشه DXF</strong><button data-dxf-close aria-label="بستن">×</button></header><p data-dxf-name></p><p role="status" data-dxf-status>در حال خواندن هندسه…</p><div class="dxf-import-tabs" role="tablist" aria-label="بخش‌های ورود DXF"><button role="tab" data-dxf-tab="info" aria-selected="true">اطلاعات فایل</button><button role="tab" data-dxf-tab="objects" aria-selected="false">آبجکت‌ها</button></div><div data-dxf-panel="info" role="tabpanel"><div class="dxf-controls"><label>واحد فایل <select data-dxf-unit><option value="">تعیین واحد…</option><option value="0.1">میلی‌متر</option><option value="1" selected>سانتی‌متر</option><option value="10">دسی‌متر</option><option value="100">متر</option><option value="2.54">اینچ</option><option value="30.48">فوت</option><option value="custom">ضریب دلخواه</option></select></label><label>ضریب به سانتی‌متر <input data-dxf-factor type="number" min="0.000001" max="100000" step="any" value="1" disabled></label><label><input type="checkbox" data-dxf-group checked> گروه‌بندی نقشه</label><label title="در حالت عادی، نقشه در مرکز دید قرار می‌گیرد. با فعال‌کردن این گزینه، مختصات عددی فایل CAD بدون انتقال به مرکز حفظ می‌شود."><input type="checkbox" data-dxf-preserve-coordinates> حفظ موقعیت عددی نقشه در CAD</label></div><div class="dxf-workspace"><aside><div class="dxf-layer-tools"><button data-dxf-all disabled>همه</button><button data-dxf-arch disabled>معماری</button><button data-dxf-none disabled>هیچ‌کدام</button></div><div class="dxf-layers" aria-label="لایه‌های DXF"></div></aside><section><div class="dxf-preview-tools"><button data-dxf-crop disabled aria-pressed="false">برش محدوده</button><button data-dxf-reset disabled>حذف برش</button><button data-dxf-fit disabled>نمایش کل نقشه</button><button data-dxf-overlays disabled aria-pressed="false" title="فقط کادر تشخیص؛ خطوط اصلی نقشه تغییر نمی‌کنند">نمایش کادرهای تشخیص</button></div><p class="dxf-hint">لایه‌ها را انتخاب کنید. برای جداکردن اتاق، «برش محدوده» را بزنید و روی نقشه کادر بکشید. چرخ موس: زوم؛ کشیدن در حالت عادی: جابه‌جایی نما.</p><svg class="dxf-preview" aria-label="پیش‌نمایش برداری DXF" tabindex="0"><g data-dxf-art></g><g data-dxf-objects style="pointer-events:none;display:none"></g><rect data-dxf-crop-box hidden></rect></svg><p data-dxf-size></p></section></div></div><section class="dxf-recognition" data-dxf-panel="objects" role="tabpanel" hidden><strong>تشخیص آبجکت‌ها پیش از ورود</strong><p>پیشنهادها قطعی نیستند. پیشنهادها پیش‌فرض انتخاب‌اند؛ فقط موارد تیک‌خورده با آبجکت نرم‌افزار جایگزین می‌شوند؛ سایر خطوط حفظ می‌شوند.</p><button data-dxf-select-all>انتخاب همه</button><button data-dxf-select-none>لغو انتخاب همه</button><button data-dxf-recognize disabled>بررسی دوبارهٔ آبجکت‌ها</button><p data-dxf-recognition-status></p><div data-dxf-candidates></div></section><p data-dxf-warnings></p><footer><span data-dxf-count></span><button data-dxf-close>انصراف</button><button class="primary" data-dxf-import disabled>افزودن نقشه قابل‌ویرایش</button></footer></div>`;
 document.body.append(dialog);dialog.showModal();const $=s=>dialog.querySelector(s),svg=$('.dxf-preview'),status=$('[data-dxf-status]'),layerList=$('.dxf-layers'),unit=$('[data-dxf-unit]'),factor=$('[data-dxf-factor]'),importButton=$('[data-dxf-import]');$('[data-dxf-name]').textContent=file.name;
 let parsed=null,selected=new Set(),crop=null,viewport=null,gesture=null,cropMode=false,closed=false,busy=false,current=[],candidates=[],recognitionKey='',recognitionInputsKey='',recognitionTimer=null,overlaysEnabled=false;
 const recognitionInputKey=()=>JSON.stringify([[...selected].sort(),crop,unit.value,factor.value]);
 const objectsTabActive=()=>dialog.querySelector('[data-dxf-tab="objects"]')?.getAttribute('aria-selected')==='true';
 const cancelRecognition=()=>{if(recognitionTimer!==null){clearTimeout(recognitionTimer);recognitionTimer=null}};
 function scheduleRecognition(delay=0){
  cancelRecognition();if(closed||!parsed||!objectsTabActive()||recognitionKey===recognitionInputKey())return;
  const f=Number(factor.value);
  if(!unit.value||!Number.isFinite(f)||f<=0||f>100000||!current.length){$('[data-dxf-recognition-status]').textContent='برای تشخیص، واحد معتبر و حداقل یک قطعه‌خط انتخاب کنید.';return}
  if(!global.RoomDXFObjects){$('[data-dxf-recognition-status]').textContent='موتور تشخیص آبجکت‌ها در دسترس نیست.';return}
  $('[data-dxf-recognition-status]').textContent='در حال بررسی خودکار آبجکت‌های محدودهٔ انتخاب‌شده…';
  recognitionTimer=setTimeout(()=>{recognitionTimer=null;if(!closed&&objectsTabActive()&&recognitionKey!==recognitionInputKey())recognize()},delay);
 }
 const close=()=>{if(closed)return;closed=true;cancelRecognition();dialog.close();dialog.remove();if(active?.dialog===dialog)active=null};active={dialog,close};
 dialog.addEventListener('keydown',e=>e.stopPropagation());
 dialog.querySelectorAll('[data-dxf-close]').forEach(b=>b.onclick=close);dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 const applyViewport=()=>{if(viewport)svg.setAttribute('viewBox',[viewport.x,viewport.y,viewport.w,viewport.h].join(' '))};
 function fit(){if(!parsed)return;const b=global.RoomDXF.bounds(parsed.segments.filter(s=>selected.has(s.layer)));if(!b)return;const pad=Math.max(b.w,b.h,.001)*.05;viewport={x:b.x-pad,y:b.y-pad,w:Math.max(b.w+pad*2,.01),h:Math.max(b.h+pad*2,.01)};applyViewport()}
 function selectedSegments(){return parsed?global.RoomDXF.select(parsed,[...selected],crop):[]}
 function drawObjects(){
  const g=$('[data-dxf-objects]'),toggle=$('[data-dxf-overlays]');g.replaceChildren();
  toggle.disabled=!candidates.length;toggle.setAttribute('aria-pressed',String(overlaysEnabled&&candidates.length>0));
  g.style.display=overlaysEnabled&&candidates.length?'':'none';
  for(let i=0;i<candidates.length;i++){const c=candidates[i],b=c.bounds,r=document.createElementNS(svg.namespaceURI,'rect'),t=document.createElementNS(svg.namespaceURI,'text');for(const [k,v]of Object.entries({x:b.x,y:b.y,width:b.w,height:b.h,fill:c.accepted?'#31d4ad22':'#ffc35c11',stroke:c.accepted?'#31d4ad':'#ffc35c','stroke-width':2,'vector-effect':'non-scaling-stroke'}))r.setAttribute(k,v);t.setAttribute('x',b.x);t.setAttribute('y',b.y);t.setAttribute('fill','#fff');t.setAttribute('font-size',Math.max(.01,(viewport?.w||500)/70));t.textContent=String(i+1);g.append(r,t)}
 }
 function recognize(){
  cancelRecognition();if(closed||!parsed||!global.RoomDXFObjects)return;
  const f=Number(factor.value);if(!unit.value||!Number.isFinite(f)||f<=0||f>100000||!current.length){$('[data-dxf-recognition-status]').textContent='برای تشخیص، واحد معتبر و حداقل یک قطعه‌خط انتخاب کنید.';return}
  const key=recognitionInputKey(),result=global.RoomDXFObjects.analyze(current,f);candidates=result.candidates.slice(0,100).map(c=>({...c,accepted:true}));
  const list=$('[data-dxf-candidates]');list.replaceChildren();
  for(let i=0;i<candidates.length;i++){const c=candidates[i],row=document.createElement('label'),check=document.createElement('input'),number=document.createElement('span'),kind=document.createElement('select'),angle=document.createElement('select'),reason=document.createElement('small');row.className='dxf-candidate';check.type='checkbox';check.checked=c.accepted;check.dataset.candidate=c.id;check.setAttribute('aria-label','تأیید آبجکت '+(i+1));number.textContent=String(i+1);for(const [k,n]of Object.entries(global.RoomDXFObjects.kinds)){const o=new Option(n,k);kind.add(o)}kind.value=c.kind;kind.setAttribute('aria-label','نوع آبجکت '+(i+1));for(const a of [0,90,180,270])angle.add(new Option(a+'°',String(a)));angle.value=String(c.rotation);angle.setAttribute('aria-label','چرخش آبجکت '+(i+1));reason.textContent=c.reason;check.onchange=()=>{c.accepted=check.checked;drawObjects()};kind.onchange=()=>c.kind=kind.value;angle.onchange=()=>c.rotation=Number(angle.value);row.append(check,number,kind,angle,reason);list.append(row)}
  recognitionKey=key;
  $('[data-dxf-recognition-status]').textContent=candidates.length+' پیشنهاد؛ پیشنهادها انتخاب شده‌اند؛ موارد نادرست را لغو کنید.'+(result.limited?' برای بررسی هندسی، محدوده را به کمتر از ۵۰۰۰ خط کاهش دهید.':'')+(result.candidates.length>100?' فقط ۱۰۰ پیشنهاد نمایش داده شده؛ محدودهٔ کوچک‌تری انتخاب کنید.':'');drawObjects();
 }
 $('[data-dxf-recognize]').onclick=recognize;
 $('[data-dxf-overlays]').onclick=()=>{if(!candidates.length)return;overlaysEnabled=!overlaysEnabled;drawObjects()};
 for(const tab of dialog.querySelectorAll('[data-dxf-tab]'))tab.onclick=()=>{for(const t of dialog.querySelectorAll('[data-dxf-tab]'))t.setAttribute('aria-selected',String(t===tab));for(const panel of dialog.querySelectorAll('[data-dxf-panel]'))panel.hidden=panel.dataset.dxfPanel!==tab.dataset.dxfTab;if(tab.dataset.dxfTab==='objects'){overlaysEnabled=false;drawObjects();scheduleRecognition()}else cancelRecognition()};
 for(const [selector,value]of [['[data-dxf-select-all]',true],['[data-dxf-select-none]',false]])$(selector).onclick=()=>{for(const c of candidates)c.accepted=value;for(const input of $('[data-dxf-candidates]').querySelectorAll('input'))input.checked=value;drawObjects()};

 function sync(){
  if(!parsed)return;current=selectedSegments();const key=recognitionInputKey();if(key!==recognitionInputsKey){recognitionInputsKey=key;recognitionKey='';cancelRecognition();candidates=[];$('[data-dxf-candidates]').replaceChildren();$('[data-dxf-recognition-status]').textContent='انتخاب‌ها تغییر کردند؛ پیشنهادها به‌صورت خودکار تازه می‌شوند.';overlaysEnabled=false;drawObjects()}const f=Number(factor.value),valid=Number.isFinite(f)&&f>0&&f<=100000&&!!unit.value;
  $('[data-dxf-count]').textContent=current.length.toLocaleString('fa-IR')+' قطعه‌خط در '+selected.size.toLocaleString('fa-IR')+' لایه';
  importButton.disabled=!valid||!current.length||current.length>20000||busy;
  const bounds=global.RoomDXF.bounds(current);$('[data-dxf-size]').textContent=valid&&bounds?'ابعاد محدودهٔ ورود: '+(bounds.w*f).toLocaleString('fa-IR',{maximumFractionDigits:1})+' × '+(bounds.h*f).toLocaleString('fa-IR',{maximumFractionDigits:1})+' سانتی‌متر':'';
  if(current.length>20000)status.textContent='بیش از ۲۰ هزار قطعه‌خط انتخاب شده؛ لایه‌های کمتری انتخاب کنید یا محدوده را برش بزنید.';else status.textContent=valid?'ورود به‌صورت خطوط برداری، در لایه‌های جدا و قابل‌ویرایش انجام می‌شود.':'واحد فایل مشخص نیست؛ پیش از ورود، واحد را انتخاب کنید.';
  const r=$('[data-dxf-crop-box]');r.hidden=!crop;r.style.display=crop?'':'none';if(crop)for(const k of ['x','y','width','height'])r.setAttribute(k,crop[{width:'w',height:'h'}[k]||k]);$('[data-dxf-reset]').disabled=!crop;
  if(objectsTabActive()&&recognitionKey!==key)scheduleRecognition(120);
 }
 function draw(){
  if(!parsed)return;const art=$('[data-dxf-art]');art.replaceChildren();const colors=['#83c5ff','#f5bf68','#8bdbb3','#c5a0f0','#eea2ae','#81d1db'];
  // Reserve at least one preview stroke per selected layer whenever the 12,000-stroke budget allows it.
  const groups=new Map();let selectedCount=0;
  for(const s of parsed.segments)if(selected.has(s.layer)){if(!groups.has(s.layer))groups.set(s.layer,[]);groups.get(s.layer).push(s);selectedCount++}
  const kept=[...groups].slice(0,12000),extraBudget=12000-kept.length,extraWeight=kept.reduce((n,[,lines])=>n+lines.length-1,0);
  const paths=new Map();let shown=0;
  for(const [layer,lines] of kept){const quota=Math.min(lines.length,1+(extraWeight?Math.floor(extraBudget*(lines.length-1)/extraWeight):0));let d='';for(let j=0;j<quota;j++){const s=lines[Math.floor(j*lines.length/quota)];d+='M'+s.a.x+' '+s.a.y+'L'+s.b.x+' '+s.b.y}paths.set(layer,d);shown+=quota}
  for(let i=0;i<parsed.layers.length;i++){const l=parsed.layers[i],d=paths.get(l.name);if(d){const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);p.setAttribute('fill','none');p.setAttribute('stroke',colors[i%colors.length]);p.setAttribute('stroke-width','1');p.setAttribute('vector-effect','non-scaling-stroke');art.append(p)}}
  const warnings=Object.entries(parsed.warnings);$('[data-dxf-warnings]').textContent=(warnings.length?'آیتم‌های پشتیبانی‌نشده/حذف‌شده: '+warnings.map(([n,c])=>n+' ('+c.toLocaleString('fa-IR')+')').join('، '):'')+(shown<selectedCount?' پیش‌نمایش برای سرعت نمونه‌برداری شده؛ ورود از تمام خطوط انتخاب‌شده استفاده می‌کند.':'');
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
 function finish(e){if(!gesture||gesture.id!==e.pointerId)return;if(gesture.mode==='crop'&&(e.type!=='pointerup'||!crop||crop.w<1e-8||crop.h<1e-8))crop=gesture.previous;gesture=null;sync()}
 svg.addEventListener('pointerup',finish);svg.addEventListener('pointercancel',finish);svg.addEventListener('lostpointercapture',finish);
 svg.addEventListener('wheel',e=>{if(!viewport)return;e.preventDefault();const p=at(e),scale=e.deltaY>0?1.2:1/1.2;const w=viewport.w*scale,h=viewport.h*scale;if(w<1e-8||w>1e14)return;viewport={x:p.x+(viewport.x-p.x)*scale,y:p.y+(viewport.y-p.y)*scale,w,h};applyViewport()},{passive:false});
 importButton.onclick=async()=>{if(importButton.disabled||busy||closed)return;busy=true;sync();try{await onImport({segments:current.map(s=>({...s,a:{...s.a},b:{...s.b}})),factor:Number(factor.value),group:$('[data-dxf-group]').checked,preserveCoordinates:$('[data-dxf-preserve-coordinates]').checked,preserveLayers:true,fileName:file.name,objects:candidates.filter(c=>c.accepted).map(c=>({kind:c.kind,indices:c.indices,rotation:c.rotation,reason:c.reason}))});close()}catch(e){busy=false;sync();status.textContent='ورود انجام نشد: '+e.message}};
 try{
  if(file.size>80*1024*1024)throw Error('حداکثر اندازهٔ DXF برابر ۸۰ مگابایت است');const source=await file.text();if(closed)return;await new Promise(resolve=>setTimeout(resolve,0));if(closed)return;parsed=global.RoomDXF.parse(source);if(closed)return;
  selected=new Set(parsed.layers.filter(l=>!l.off&&!l.frozen).map(l=>l.name));
  for(const l of parsed.layers){const label=document.createElement('label'),input=document.createElement('input'),name=document.createElement('span'),count=document.createElement('small');input.type='checkbox';input.dataset.layer=l.name;input.checked=selected.has(l.name);name.textContent=l.name;name.dir='auto';count.textContent=l.count.toLocaleString('fa-IR');if(l.off||l.frozen)label.title='این لایه در فایل CAD خاموش یا منجمد است؛ برای ورود می‌توانید آن را انتخاب کنید';input.onchange=()=>{if(input.checked)selected.add(l.name);else selected.delete(l.name);fit();draw()};label.append(input,name,count);layerList.append(label)}
  const detectedFactor=Number(parsed.unit?.factor);const knownUnit=[...unit.options].find(option=>option.value&&option.value!=='custom'&&Number(option.value)===detectedFactor);
  unit.value='1';factor.value='1';factor.disabled=true;
  if(knownUnit&&Number.isFinite(detectedFactor)&&detectedFactor>0&&detectedFactor!==1){
   $('[data-dxf-name]').textContent+=' — واحد ثبت‌شدهٔ CAD با سانتی‌متر تفاوت دارد؛ پیش‌فرض سانتی‌متر (ضریب ۱) است. واحد صحیح را پیش از ورود تأیید کنید.';
  }else if(!knownUnit){
   $('[data-dxf-name]').textContent+=' — واحد فایل نامشخص یا پشتیبانی‌نشده است؛ پیش‌فرض سانتی‌متر (ضریب ۱) را بررسی کنید.';
  }
  for(const b of dialog.querySelectorAll('[data-dxf-all],[data-dxf-none],[data-dxf-arch],[data-dxf-crop],[data-dxf-fit],[data-dxf-recognize]'))b.disabled=false;
  fit();draw();if(objectsTabActive())scheduleRecognition();
 }catch(e){if(!closed){status.textContent='خواندن فایل انجام نشد: '+e.message;importButton.disabled=true}}
 return {close};
}
 global.RoomDXFImport={open};
})(window);
