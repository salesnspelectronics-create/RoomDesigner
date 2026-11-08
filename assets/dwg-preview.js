/* Bounded reads of the DWG preview table; no geometry decoding. */
(function(global){
'use strict';
const sentinel=[31,37,109,7,212,54,40,40,157,87,202,63,157,68,16,43];
async function read(file){
 const head=new Uint8Array(await file.slice(0,32).arrayBuffer());if(head.length<32)return null;
 const address=new DataView(head.buffer).getUint32(13,true);if(address<32||address+21>file.size)return null;
 const table=new Uint8Array(await file.slice(address,address+165).arrayBuffer());
 if(!sentinel.every((v,i)=>table[i]===v))return null;
 const count=table[20];if(count>16||table.length<21+count*9)return null;
 const view=new DataView(table.buffer);
 for(let i=0;i<count;i++){
  const p=21+i*9,code=table[p],offset=view.getUint32(p+1,true),size=view.getUint32(p+5,true);
  if(code!==6||size<24||size>8*1024*1024||offset+size>file.size)continue;
  const bytes=new Uint8Array(await file.slice(offset,offset+size).arrayBuffer());
  if(![137,80,78,71,13,10,26,10].every((v,j)=>bytes[j]===v))continue;
  const dv=new DataView(bytes.buffer),width=dv.getUint32(16),height=dv.getUint32(20);
  if(!width||!height||width>8192||height>8192||width*height>16000000)continue;
  return {blob:new Blob([bytes],{type:'image/png'}),width,height,bytesRead:head.length+table.length+bytes.length};
 }
 return null;
}
global.RoomDWGPreview={read};
})(typeof window==='undefined'?globalThis:window);
