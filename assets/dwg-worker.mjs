/* No drawing bytes leave this worker. Vendor files are served from this site. */
import init,{convertDwgToDxf} from './vendor/dwgdxf/dwgdxf.js';
self.onmessage=async event=>{
 try{
  if(!(event.data instanceof ArrayBuffer)||event.data.byteLength>25*1024*1024)throw Error('ورودی DWG نامعتبر است.');
  await init();
  const bytes=convertDwgToDxf(new Uint8Array(event.data));
  if(!bytes.length||bytes.length>80*1024*1024)throw Error('خروجی DXF بیش از حد مجاز است.');
  self.postMessage({bytes},[bytes.buffer]);
 }catch(error){self.postMessage({error:'تبدیل DWG انجام نشد؛ فایل را در نرم‌افزار CAD به ASCII DXF تبدیل کنید.'})}
};
