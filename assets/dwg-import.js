/* Thumbnail first; full conversion is an explicit, cancellable operation. */
(function(global){
'use strict';
const workerURL=new URL('./dwg-worker.mjs?v=347',document.currentScript.src);
let active=null;
async function convert(file){
 if(active)throw Error('فایل DWG دیگری در حال بررسی است.');
 if(!file.size)throw Error('فایل DWG خالی است.');
 const signature=new TextDecoder('ascii').decode(await file.slice(0,6).arrayBuffer());
 if(!['AC1012','AC1014','AC1015','AC1018','AC1021','AC1024','AC1027','AC1032'].includes(signature))throw Error('نسخهٔ DWG پشتیبانی نمی‌شود؛ خروجی ASCII DXF بگیرید.');
 if(active)throw Error('فایل DWG دیگری در حال بررسی است.');
 const dialog=document.createElement('dialog');dialog.dir='rtl';dialog.id='dwgImportDialog';
 dialog.innerHTML=`<div class="dwg-shell"><header><strong>پیش‌نمایش سریع DWG · آزمایشی</strong><button type="button" data-dwg-cancel aria-label="بستن">×</button></header><p data-dwg-name></p><p role="status" data-dwg-status>در حال خواندن تصویر ذخیره‌شدهٔ نقشه…</p><div class="dwg-preview" hidden><img alt="تصویر کوچک ذخیره‌شده داخل DWG"></div><p data-dwg-info></p><p>این تصویر کوچک برای بررسی اولیه است؛ مقیاس و مختصات قابل‌اعتماد برای انتخاب دستگاه یا برش دقیق ندارد.</p><p data-dwg-warning>ورود دقیق محدوده از فایل بزرگ هنوز آماده نیست. تبدیل کامل با روش قبلی انجام می‌شود و ممکن است با محدودیت حافظه روبه‌رو شود.</p><footer><button type="button" data-dwg-cancel>انصراف</button><button type="button" data-dwg-diagnostics hidden>دانلود گزارش خطا</button><button type="button" data-dwg-convert disabled>شروع تبدیل کامل به DXF</button></footer></div>`;
 dialog.querySelector('[data-dwg-name]').textContent=file.name+' · '+(file.size/1024/1024).toFixed(1)+' MB';
 document.body.append(dialog);dialog.showModal();
 return new Promise((resolve,reject)=>{
  let worker=null,timer=null,tick=null,finished=false,busy=false,imageURL=null,lastDiagnostic=null,generation=0;
  const $=s=>dialog.querySelector(s),status=$('[data-dwg-status]'),start=$('[data-dwg-convert]');
  const stop=()=>{generation++;clearTimeout(timer);clearInterval(tick);worker?.terminate();worker=null;busy=false};
  const finish=(error,result)=>{if(finished)return;finished=true;stop();if(imageURL)URL.revokeObjectURL(imageURL);dialog.close();dialog.remove();active=null;error?reject(error):resolve(result)};
  active={dialog};
  const cancel=()=>finish(new DOMException('تبدیل لغو شد.','AbortError'));
  dialog.querySelectorAll('[data-dwg-cancel]').forEach(button=>button.onclick=cancel);
  dialog.addEventListener('cancel',event=>{event.preventDefault();cancel()});
  dialog.addEventListener('keydown',event=>event.stopPropagation());
  function failure(error,stage='conversion'){
   if(finished)return;stop();start.disabled=false;start.textContent='تلاش دوباره برای تبدیل کامل';
   const message=String(error?.message||error||'خطای نامشخص');
   status.textContent='تبدیل کامل انجام نشد: '+message+' — می‌توانید گزارش خطا را دریافت کنید یا انصراف بزنید.';
   lastDiagnostic={time:new Date().toISOString(),stage,message,stack:error?.stack||null,fileName:file.name,fileSize:file.size,signature};
   $('[data-dwg-diagnostics]').hidden=false;
   global.dispatchEvent(new CustomEvent('room-dwg-error',{detail:lastDiagnostic}));
  }
  $('[data-dwg-diagnostics]').onclick=()=>{if(!lastDiagnostic)return;const url=URL.createObjectURL(new Blob([JSON.stringify({schema:'roomdesigner-dwg-diagnostic/v1',version:'V347',...lastDiagnostic},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='roomdesigner-dwg-diagnostic.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)};
  start.onclick=async()=>{
   if(finished||busy)return;
   if(file.size>80*1024*1024&&!confirm('تبدیل کامل این فایل بزرگ ممکن است چند گیگابایت حافظه مصرف کند و متوقف شود. ادامه می‌دهید؟'))return;
   busy=true;start.disabled=true;const began=Date.now(),token=++generation;
   status.textContent='در حال خواندن فایل برای تبدیل کامل…';
   tick=setInterval(()=>{status.textContent='در حال تبدیل کامل محلی به DXF… '+Math.floor((Date.now()-began)/1000)+' ثانیه؛ انصراف در دسترس است.'},1000);
   timer=setTimeout(()=>failure(Error('مهلت دو دقیقه‌ای تبدیل تمام شد؛ پردازش متوقف شد.'),'timeout'),120000);
   try{
    const buffer=await file.arrayBuffer();if(finished||token!==generation)return;
    worker=new Worker(workerURL,{type:'module'});
    worker.onerror=event=>{event.preventDefault();if(token===generation)failure(Error(event.message||'موتور DWG بارگذاری نشد.'),'worker')};
    worker.onmessage=event=>{
     if(finished||token!==generation)return;const data=event.data;
     if(data?.error){const error=Error(data.error);if(data.stack)error.stack=data.stack;failure(error,data.stage||'conversion');return}
     if(!(data?.bytes instanceof Uint8Array)||!data.bytes.length){failure(Error('خروجی تبدیل DWG معتبر نیست.'));return}
     finish(null,new File([data.bytes],file.name.replace(/\.dwg$/i,'')+'.dxf',{type:'application/dxf'}));
    };
    worker.postMessage(buffer,[buffer]);
   }catch(error){if(token===generation)failure(error)}
  };
  (async()=>{try{
   const preview=await global.RoomDWGPreview.read(file);if(finished)return;
   if(preview){imageURL=URL.createObjectURL(preview.blob);$('.dwg-preview img').src=imageURL;$('.dwg-preview').hidden=false;status.textContent='تصویر ذخیره‌شده آماده است؛ تبدیل کامل شروع نشده است.';$('[data-dwg-info]').textContent='وضوح تصویر: '+preview.width+' × '+preview.height+' پیکسل · دادهٔ خوانده‌شده: '+(preview.bytesRead/1024).toFixed(1)+' کیلوبایت';}
   else status.textContent='تصویر PNG ذخیره‌شدهٔ قابل‌نمایش در این فایل پیدا نشد. می‌توانید تبدیل کامل را امتحان کنید.';
  }catch(error){if(!finished)status.textContent='خواندن پیش‌نمایش ممکن نشد: '+String(error?.message||error)}finally{if(!finished)start.disabled=false}})();
 });
}
global.RoomDWGImport={convert};
})(window);
