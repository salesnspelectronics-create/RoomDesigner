/* Local PDF page raster import. PDF.js is loaded only when a file is selected. */
(function(global){
'use strict';
const base=new URL('./vendor/pdfjs/',document.currentScript.src);
let library,active=null;
async function open(file,onImport){
 if(active)active.close();
 const dialog=document.createElement('dialog');dialog.id='pdfImportDialog';dialog.dir='rtl';
 dialog.innerHTML=`<div class="pdf-shell"><header><strong>واردکردن صفحات PDF</strong><button type="button" data-pdf-close aria-label="بستن">×</button></header><p data-pdf-name></p><p role="status" data-pdf-status>در حال خواندن فایل…</p><div class="pdf-toolbar"><button data-pdf-all disabled>انتخاب همه</button><button data-pdf-none disabled>پاک‌کردن انتخاب‌ها</button><label>کیفیت عکس <select data-pdf-quality><option value="1500">معمولی</option><option value="2400" selected>بالا</option><option value="3200">بسیار بالا</option></select></label></div><div class="pdf-workspace"><div class="pdf-pages" aria-label="صفحات PDF"></div><section class="pdf-editor"><div class="pdf-editor-heading"><strong data-pdf-page-title>پیش‌نمایش صفحه</strong><button data-pdf-reset disabled>حذف برش این صفحه</button></div><p class="pdf-instruction">روی تصویر کادر بکشید؛ داخل کادر را برای جابه‌جایی و دستگیره‌ها را برای تغییر اندازه بگیرید.</p><div class="pdf-preview"><div class="pdf-stage"><div class="pdf-crop" hidden></div></div></div></section></div><footer><span data-pdf-count>صفحه‌ای انتخاب نشده</span><button data-pdf-close>انصراف</button><button class="primary" data-pdf-import disabled>افزودن به بوم</button></footer></div>`;
 document.body.append(dialog);dialog.showModal();
 const $=q=>dialog.querySelector(q),status=$('[data-pdf-status]'),pages=$('.pdf-pages'),stage=$('.pdf-stage'),overlay=$('.pdf-crop'),crops=new Map(),selected=new Set([1]);
 let resizeObserver=null;
 let pdf=null,loading=null,closed=false,busy=false,current=1,previewToken=0,gesture=null,observer=null,thumbQueue=Promise.resolve();
 const errorText=e=>e?.name==='PasswordException'?'این PDF رمز دارد؛ ابتدا نسخهٔ بدون رمز آن را انتخاب کنید.':e?.name==='InvalidPDFException'?'فایل PDF معتبر یا قابل خواندن نیست.':'خواندن PDF انجام نشد. فایل دیگری انتخاب کنید.';
 const close=()=>{if(closed)return;closed=true;previewToken++;observer?.disconnect();resizeObserver?.disconnect();if(loading)loading.destroy().catch(()=>{});dialog.close();dialog.remove();if(active?.dialog===dialog)active=null};
 active={dialog,close};
 dialog.querySelectorAll('[data-pdf-close]').forEach(b=>b.onclick=close);dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 $('[data-pdf-name]').textContent=file.name;
 function fitPreview(){const canvas=stage.querySelector('canvas'),box=$('.pdf-preview');if(canvas)stage.style.width=Math.max(1,Math.min(box.clientWidth-20,(box.clientHeight-20)*canvas.width/canvas.height))+'px'}
 resizeObserver=new ResizeObserver(fitPreview);resizeObserver.observe($('.pdf-preview'));
 function crop(){return crops.get(current)||{x:0,y:0,w:1,h:1}}
 function syncCrop(){const c=crop();overlay.hidden=!crops.has(current);Object.assign(overlay.style,{left:c.x*100+'%',top:c.y*100+'%',width:c.w*100+'%',height:c.h*100+'%'});$('[data-pdf-reset]').disabled=busy||!crops.has(current);pages.querySelector('[data-pdf-page="'+current+'"] .pdf-cropped').hidden=!crops.has(current)}
 function update(){for(const card of pages.children){const n=+card.dataset.pdfPage;card.classList.toggle('active',n===current);card.querySelector('input').checked=selected.has(n)}$('[data-pdf-count]').textContent=selected.size+' صفحه انتخاب شده';$('[data-pdf-import]').disabled=busy||!selected.size;}
 async function renderCanvas(n,maxSize){const page=await pdf.getPage(n),original=page.getViewport({scale:1}),viewport=page.getViewport({scale:maxSize/Math.max(original.width,original.height)}),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(viewport.width));canvas.height=Math.max(1,Math.round(viewport.height));await page.render({canvasContext:canvas.getContext('2d'),viewport,background:'rgb(255,255,255)',annotationMode:0}).promise;return canvas}
 async function showPage(n){if(busy||closed)return;current=n;const token=++previewToken;update();$('[data-pdf-page-title]').textContent='صفحهٔ '+n;stage.style.visibility='hidden';try{const canvas=await renderCanvas(n,1200);if(closed||token!==previewToken){canvas.width=canvas.height=1;return}stage.querySelector('canvas')?.remove();stage.prepend(canvas);stage.style.aspectRatio=canvas.width+'/'+canvas.height;fitPreview();stage.style.visibility='visible';$('[data-pdf-reset]').disabled=false;syncCrop();status.textContent='صفحات موردنظر را تیک بزنید و در صورت نیاز برش دهید.'}catch(e){if(!closed&&token===previewToken)status.textContent=errorText(e)}}
 function at(e){const b=stage.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(e.clientX-b.left)/b.width)),y:Math.max(0,Math.min(1,(e.clientY-b.top)/b.height))}}

 const handleNames={nw:'گوشهٔ بالا چپ',n:'لبهٔ بالا',ne:'گوشهٔ بالا راست',e:'لبهٔ راست',se:'گوشهٔ پایین راست',s:'لبهٔ پایین',sw:'گوشهٔ پایین چپ',w:'لبهٔ چپ'};
 overlay.tabIndex=0;overlay.setAttribute('role','group');overlay.setAttribute('aria-label','کادر برش؛ برای جابه‌جایی بکشید یا از کلیدهای جهت استفاده کنید');
 for(const [key,name]of Object.entries(handleNames)){const handle=document.createElement('button');handle.type='button';handle.className='pdf-crop-handle';handle.dataset.pdfCropHandle=key;handle.setAttribute('aria-label','تغییر اندازه از '+name);overlay.append(handle)}
 function transformCrop(original,mode,dx,dy){const rect=stage.getBoundingClientRect(),minW=Math.min(1,Math.max(.005,4/rect.width)),minH=Math.min(1,Math.max(.005,4/rect.height)),clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));if(mode==='move')return {...original,x:clamp(original.x+dx,0,1-original.w),y:clamp(original.y+dy,0,1-original.h)};let left=original.x,right=left+original.w,top=original.y,bottom=top+original.h;if(mode.includes('w'))left=clamp(left+dx,0,right-minW);if(mode.includes('e'))right=clamp(right+dx,left+minW,1);if(mode.includes('n'))top=clamp(top+dy,0,bottom-minH);if(mode.includes('s'))bottom=clamp(bottom+dy,top+minH,1);return {x:left,y:top,w:right-left,h:bottom-top}}
 stage.addEventListener('pointerdown',e=>{if(busy||gesture||e.button!==0||!stage.querySelector('canvas'))return;e.preventDefault();const handle=e.target.closest('[data-pdf-crop-handle]'),inside=e.target.closest('.pdf-crop');gesture={id:e.pointerId,page:current,start:at(e),previous:crops.get(current),original:{...crop()},mode:handle?handle.dataset.pdfCropHandle:inside?'move':'draw'};stage.setPointerCapture(e.pointerId)});
 stage.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId||gesture.page!==current)return;const p=at(e),a=gesture.start;crops.set(current,gesture.mode==='draw'?{x:Math.min(a.x,p.x),y:Math.min(a.y,p.y),w:Math.abs(a.x-p.x),h:Math.abs(a.y-p.y)}:transformCrop(gesture.original,gesture.mode,p.x-a.x,p.y-a.y));syncCrop()});
 function finishCrop(e){if(!gesture||gesture.id!==e.pointerId)return;const c=crop();if(e.type!=='pointerup'||c.w<.005||c.h<.005){if(gesture.previous)crops.set(gesture.page,gesture.previous);else crops.delete(gesture.page)}gesture=null;syncCrop()}
 stage.addEventListener('pointerup',finishCrop);stage.addEventListener('pointercancel',finishCrop);stage.addEventListener('lostpointercapture',finishCrop);
 overlay.addEventListener('keydown',e=>{if(busy||!crops.has(current)||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();e.stopPropagation();const b=stage.getBoundingClientRect(),step=e.shiftKey?10:1,dx=(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0)/b.width,dy=(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0)/b.height;crops.set(current,transformCrop(crop(),e.target.dataset.pdfCropHandle||'move',dx,dy));syncCrop()});
 $('[data-pdf-reset]').onclick=()=>{crops.delete(current);syncCrop()};
 $('[data-pdf-all]').onclick=()=>{for(let i=1;i<=pdf.numPages;i++)selected.add(i);update()};$('[data-pdf-none]').onclick=()=>{selected.clear();update()};
 $('[data-pdf-import]').onclick=async()=>{
  if(busy||!selected.size||closed)return;busy=true;previewToken++;dialog.querySelectorAll('input,select,[data-pdf-all],[data-pdf-none],[data-pdf-reset]').forEach(x=>x.disabled=true);update();
  try{const result=[],order=[...selected].sort((a,b)=>a-b),quality=+$('[data-pdf-quality]').value;
   for(const n of order){if(closed)return;status.textContent='آماده‌سازی صفحهٔ '+n+' ('+(result.length+1)+' از '+order.length+')…';const source=await renderCanvas(n,quality);if(closed)return;const c=crops.get(n)||{x:0,y:0,w:1,h:1},sx=Math.floor(c.x*source.width),sy=Math.floor(c.y*source.height),w=Math.max(1,Math.min(source.width-sx,Math.round(c.w*source.width))),h=Math.max(1,Math.min(source.height-sy,Math.round(c.h*source.height))),out=document.createElement('canvas');out.width=w;out.height=h;out.getContext('2d').drawImage(source,sx,sy,w,h,0,0,w,h);const data=out.toDataURL('image/png');source.width=source.height=out.width=out.height=1;if(data.length>12000000)throw Error('حجم عکس صفحهٔ '+n+' زیاد است؛ کیفیت پایین‌تری انتخاب کنید.');result.push({data,width:w,height:h,page:n,crop:{...c},fileName:file.name})}
   if(closed)return;await onImport(result);close();
  }catch(e){if(!closed){status.textContent=e.message||errorText(e);busy=false;dialog.querySelectorAll('input,select,[data-pdf-all],[data-pdf-none]').forEach(x=>x.disabled=false);syncCrop();update()}}
 };
 try{
  if(file.size>80000000)throw Error('حجم PDF باید کمتر از ۸۰ مگابایت باشد.');
  library??=import(new URL('pdf.min.mjs',base).href).catch(error=>{library=null;throw error});const lib=await library;if(closed)return;lib.GlobalWorkerOptions.workerSrc=new URL('pdf.worker.min.mjs',base).href;
  const bytes=new Uint8Array(await file.arrayBuffer());if(closed)return;
  loading=lib.getDocument({data:bytes,cMapUrl:new URL('cmaps/',base).href,cMapPacked:true,standardFontDataUrl:new URL('standard_fonts/',base).href,wasmUrl:new URL('wasm/',base).href,isEvalSupported:false,enableXfa:false});pdf=await loading.promise;if(closed)return;
  $('[data-pdf-name]').textContent=file.name+' · '+pdf.numPages+' صفحه';
  observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);const card=entry.target,n=+card.dataset.pdfPage;thumbQueue=thumbQueue.then(async()=>{if(closed)return;try{const canvas=await renderCanvas(n,180);if(!closed)card.querySelector('.pdf-thumb').replaceChildren(canvas)}catch{}})}},{root:pages,rootMargin:'100px'});
  for(let n=1;n<=pdf.numPages;n++){const card=document.createElement('div');card.className='pdf-page';card.dataset.pdfPage=n;card.innerHTML='<button type="button" class="pdf-thumb" aria-label="پیش‌نمایش صفحه '+n+'">'+n+'</button><label><input type="checkbox" aria-label="انتخاب صفحه '+n+'">صفحهٔ '+n+'</label><small class="pdf-cropped" hidden>برش دارد</small>';card.querySelector('button').onclick=()=>showPage(n);card.querySelector('input').onchange=e=>{if(e.target.checked)selected.add(n);else selected.delete(n);update()};pages.append(card);observer.observe(card)}
  $('[data-pdf-all]').disabled=$('[data-pdf-none]').disabled=false;update();await showPage(1);
 }catch(e){if(!closed){status.textContent=e.message&&file.size>80000000?e.message:errorText(e);selected.clear();update()}}
}
global.RoomPdfImport={open};
})(globalThis);
