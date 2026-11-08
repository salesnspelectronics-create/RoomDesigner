/* No drawing bytes leave this worker. Vendor files are served from this site. */
import init,{convertDwgToDxf} from './vendor/dwgdxf/dwgdxf.js';
self.onmessage=async event=>{
 let stage='input';
 try{
  if(!(event.data instanceof ArrayBuffer)||event.data.byteLength===0)throw Error('ورودی DWG نامعتبر است.');
  stage='initialization';await init();
  stage='conversion';
  const bytes=convertDwgToDxf(new Uint8Array(event.data));
  if(!bytes.length||!Number.isSafeInteger(bytes.length))throw Error('خروجی DXF معتبر نیست.');
  // Copy the exact view: WASM-owned buffers may be shared, offset or non-transferable.
  const output=new Uint8Array(bytes.length);
  output.set(bytes);
  self.postMessage({bytes:output},[output.buffer]);
 }catch(error){self.postMessage({error:String(error?.message||error||'خطای نامشخص'),stack:error?.stack||null,stage})}
};
