/* Convert DWG locally in an isolated, cancellable module worker. */
(function(global){
'use strict';
const workerURL=new URL('./dwg-worker.mjs?v=343',document.currentScript.src);
let active=null;
async function convert(file){
 if(active)throw Error('تبدیل DWG دیگری در حال انجام است.');
 if(!file.size)throw Error('فایل DWG خالی است.');if(file.size>80*1024*1024&&!confirm('فایل DWG بزرگ است؛ تبدیل در مرورگر ممکن است حافظه زیادی مصرف کند یا متوقف شود. ادامه می‌دهید؟'))throw new DOMException('انتخاب کاربر لغو شد','AbortError');
 const signature=new TextDecoder('ascii').decode(await file.slice(0,6).arrayBuffer());
 if(!['AC1012','AC1014','AC1015','AC1018','AC1021','AC1024','AC1027','AC1032'].includes(signature))throw Error('نسخهٔ DWG پشتیبانی نمی‌شود؛ خروجی ASCII DXF بگیرید.');
 if(active)throw Error('تبدیل DWG دیگری در حال انجام است.');
 const dialog=document.createElement('dialog');dialog.dir='rtl';dialog.id='dwgImportDialog';
 dialog.innerHTML='<div class="pdf-shell"><header><strong>واردکردن DWG</strong></header><p data-dwg-name></p><p role="status">در حال تبدیل محلی به DXF…</p><p>پس از تبدیل، لایه‌ها، برش و مقیاس را در پیش‌نمایش بررسی کنید. متن‌ها و بعضی آبجکت‌های CAD ممکن است منتقل نشوند.</p><footer><button type="button" data-dwg-cancel>انصراف</button></footer></div>';
 dialog.querySelector('[data-dwg-name]').textContent=file.name;
 document.body.append(dialog);dialog.showModal();
 return new Promise((resolve,reject)=>{
  let worker=null,timer=null,finished=false;
  const finish=(error,result)=>{if(finished)return;finished=true;clearTimeout(timer);worker?.terminate();dialog.close();dialog.remove();active=null;error?reject(error):resolve(result)};
  active={dialog};
  const cancel=()=>finish(new DOMException('تبدیل لغو شد.','AbortError'));
  dialog.querySelector('[data-dwg-cancel]').onclick=cancel;
  dialog.addEventListener('cancel',event=>{event.preventDefault();cancel()});
  dialog.addEventListener('keydown',event=>event.stopPropagation());
  timer=setTimeout(()=>finish(Error('تبدیل بیش از دو دقیقه طول کشید؛ فایل کوچک‌تر یا ASCII DXF انتخاب کنید.')),120000);
  (async()=>{try{
   const buffer=await file.arrayBuffer();if(finished)return;
   worker=new Worker(workerURL,{type:'module'});
   worker.onerror=event=>{event.preventDefault();finish(Error('موتور DWG بارگذاری نشد؛ مرورگر را به‌روز کنید یا خروجی DXF بگیرید.'))};
   worker.onmessage=event=>{
    const data=event.data;
    if(data?.error){finish(Error(data.error));return}
    if(!(data?.bytes instanceof Uint8Array)||!data.bytes.length||!Number.isSafeInteger(data.bytes.length)){finish(Error('خروجی تبدیل DWG معتبر نیست.'));return}
    finish(null,new File([data.bytes],file.name.replace(/\.dwg$/i,'')+'.dxf',{type:'application/dxf'}));
   };
   worker.postMessage(buffer,[buffer]);
  }catch(error){finish(error)}})();
 });
}
global.RoomDWGImport={convert};
})(window);
