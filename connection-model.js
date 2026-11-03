/* Physical connections, explicit one-time browser reset and legacy-file normalization. */
(function(global){
 'use strict';
 const version='physical-connections-1';
 const resetKey='rd_storage_reset_physical_v1';
 function resetBrowserData(storage,idb=global.indexedDB){
  if(storage.getItem(resetKey)==='done')return false;
  // V325: a missing marker is never permission to erase drawings or recovery DB.
  storage.setItem(resetKey,'done');
  if(storage.getItem(resetKey)!=='done')throw Error('Storage initialization could not be recorded');
  global.RoomConnections.recoveryReset=Promise.resolve(true);
  return true;
 }

 const colors={power:'#DC2626',rs485:'#16A34A',do:'#D97706',di:'#0891B2',ethernet:'#2563EB'};
 function types(){return Object.fromEntries(Object.entries({power:'Power',rs485:'RS-485',do:'DO',di:'DI',ethernet:'Ethernet'}).map(([id,name])=>[id,{name,color:colors[id]}]))}
 const equipmentPorts=()=>[{id:'rs485',name:'RS-485',type:'rs485',side:'top'}];
 function ensureRelayPorts(d){
  let changed=false;
  for(const v of d.devices||[]){
   const entry=global.EquipmentCatalogBuiltin.entries.find(t=>['AC12CH','AC4CH'].includes(t.code)&&((t.assetId===(v.assetId||v.svgType||v.svgAssetId))||t.code===v.code));
   if(!entry||!Array.isArray(v.ports))continue;
   for(const p of entry.ports.filter(p=>p.enabled!==false&&(p.type==='do'||p.type==='di'))){
    const aliases=p.type==='di'?[p.name,p.id==='sensor-01'?'سنسور 1':'سنسور 2',p.id==='sensor-01'?'سنسور ۱':'سنسور ۲']: [p.name];
    const existing=v.ports.find(existing=>existing.type===p.type&&(existing.catalogPortId===p.id||existing.id===p.id||aliases.includes(existing.name)));
    if(existing){if(p.type==='di'&&aliases.includes(existing.name)&&existing.name!==p.name){existing.name=p.name;changed=true;}continue;}
    let id=v.id+'-'+p.id;while(v.ports.some(existing=>existing.id===id))id+='-new';
    v.ports.push({...p,id,catalogPortId:p.id});changed=true;
   }
  }
  return changed;
 }
 const loadPorts=(type='do')=>[{id:type==='di'?'digital-input':'digital-output',name:type==='di'?'Digital Input':'Digital Output',type,side:'top'}];
 function fanIcon(blades){return '<circle cx="40" cy="36" r="27"/>'+Array.from({length:blades},(_,i)=>'<path d="M38 32C18 8 52 4 49 24L43 34Z" fill="#bfd1df" transform="rotate('+i*360/blades+' 40 36)"/>').join('')+'<circle cx="40" cy="36" r="5" fill="#24374d"/>'+Array.from({length:blades-2},(_,i)=>'<path d="M'+(23+i*12)+' 67l5 5-5 5"/>').join('');}
 const symbols={
  light:'<circle cx="40" cy="32" r="18"/><path d="M29 46v10h22V46M31 62h18M35 68h10M40 4v5M12 32h5M63 32h5M18 10l5 5M62 10l-5 5"/>',
  valve:'<path d="M8 32h18v20H8zM54 32h18v20H54zM26 29l28 26V29L26 55zM40 42V17M28 17h24M34 10h12v14"/>',
  'fan-1':fanIcon(3),'fan-2':fanIcon(4),'fan-3':fanIcon(5),
  'fan-coil':'<path d="M13 13h94q5 0 5 5v40q0 5-5 5H13q-5 0-5-5V18q0-5 5-5Z"/><circle cx="35" cy="38" r="17"/><path d="M34 34c-20-14 11-24 9-8l-5 10M39 39c23-5 16 20 4 9l-7-7M32 41c-8 22-27 2-12-1l12-2M60 24h40v27H60ZM66 24v27M73 24v27M80 24v27M87 24v27M94 24v27M60 33h40M60 42h40"/><path d="M82 63v10h-9" stroke="#DC2626"/><path d="M98 63v10h9" stroke="#2563EB"/>',
  speaker:'<path d="M10 29h15l20-15v48L25 47H10zM53 27q14 11 0 22M61 17q24 21 0 42"/>',
  smoke:'<ellipse cx="40" cy="46" rx="27" ry="20"/><path d="M18 43q22 16 44 0M26 53h28M30 59h20M25 23c-8-7 7-9 0-16M40 21c-8-7 7-9 0-16M55 23c-8-7 7-9 0-16"/><circle cx="40" cy="37" r="3" fill="#0891B2"/>',
  motion:'<path d="M23 29q17-9 34 0v32q-17 11-34 0ZM23 39q17-8 34 0M23 50q17-8 34 0M34 26v40M46 26v40M15 22q-9 16 0 32M8 16q-13 22 0 44M65 22q9 16 0 32M72 16q13 22 0 44"/>'
 };
 function consumers(){return [['light','لامپ','Light','light','do'],['valve','شیر برقی','Solenoid Valve','valve','do'],['fan-coil','فن کویل','Fan Coil Unit','fan-coil','do'],['speaker','بلندگو','Speaker','speaker','do'],['smoke','سنسور دود','Smoke Sensor','smoke','di'],['motion','سنسور حرکت','Motion Sensor','motion','di']].map(([id,name,nameEn,icon,type])=>({catalogId:'load-'+id,kind:'load-'+id,category:'loads',equipmentRelease:global.RoomEquipment?.release||'nsp-equipment-260',connectionModel:version,name,nameEn,code:'',model:'',w:id==='fan-coil'?120:80,h:80,svgMode:'fit',showLabel:true,ports:id==='fan-coil'?[{id:'fan-1',name:'دور فن 1',type:'do',side:'top'},{id:'fan-2',name:'دور فن 2',type:'do',side:'top'},{id:'fan-c',name:'دور فن C',type:'do',side:'top'},{id:'hot-water',name:'لوله آب گرم',type:'do',side:'bottom'},{id:'cold-water',name:'لوله آب سرد',type:'do',side:'bottom'}]:loadPorts(type),svgAssetId:'load-'+id}))}
 function upgradeFieldDevices(d){
  let changed=false;const defaults=new Map(consumers().map(t=>[t.kind,t]));
  for(const v of d.devices||[]){
   if(typeof v?.kind!=='string')continue; // Preserve malformed legacy data without crashing every canvas render.
   const kind=v.kind==='load-fan-c'?'load-fan-3':v.kind,legacyFan=/^load-fan-[123]$/.test(kind),number=kind.slice(-1),t=defaults.get(kind)||(legacyFan?{kind,catalogId:kind,name:'دور فن '+number,nameEn:'Fan Speed '+number,svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect x="1" y="1" width="78" height="78" rx="10" fill="#fff"/><g fill="none" stroke="#24374d" stroke-width="3">'+symbols['fan-'+number]+'</g></svg>'}:null);if(!t)continue;
   if(v.kind!==kind){v.kind=kind;v.catalogId=t.catalogId;changed=true;}
   if(['دور فن C','Fan Speed C'].includes(v.name)){v.name=t.name;changed=true;}if(v.nameEn==='Fan Speed C'){v.nameEn=t.nameEn;changed=true;}
   if(kind.startsWith('load-fan-')&&v.svg?.includes('<text x="64" y="74"')){v.svg=t.svg;v.svgOriginal=t.svg;delete v.svgCrop;changed=true;}
  }return changed;
 }

 function normalizeTypes(input={}){const result={...input,...types()};delete result.rs485_power;return result}
 function normalizeDocumentTypes(d,includeHistory=true){let changed=false;for(const v of d.devices||[])for(const p of v.ports||[])if(p.type==='rs485_power'){p.type='rs485';if(p.name==='RS-485 + Power')p.name='RS-485';changed=true}for(const c of d.cables||[])if(c.type==='rs485_power'){c.type='rs485';if(c.name==='کابل RS-485 + Power')c.name='کابل RS-485';changed=true}if(includeHistory&&Array.isArray(d.revisions))for(const r of d.revisions)if(r.snapshot&&normalizeDocumentTypes(r.snapshot))changed=true;return changed}

 function resetDocument(input,inheritedCurrent=false){
  const d=JSON.parse(JSON.stringify(input));
  if(!Array.isArray(d.devices)||!Array.isArray(d.cables))throw Error('Invalid connection document');
  const current=d.connectionModel===version||inheritedCurrent;
  if(!current){
   for(const v of d.devices)v.ports=global.RoomEquipment.isArchitecture(v)||global.RoomEquipment.definitionFor(v)?[]:(v.category==='loads'?(consumers().find(t=>t.kind===v.kind)?.ports||loadPorts()):equipmentPorts()).map((p,i)=>({...p,id:v.id+'-connection-'+i}));
   d.cables=[];
  }
  d.connectionModel=version;
  normalizeDocumentTypes(d,false);ensureRelayPorts(d);upgradeFieldDevices(d);
  if(Array.isArray(d.revisions))for(const r of d.revisions)r.snapshot=resetDocument(r.snapshot,current);
  return d;
 }
 function resetCatalog(items){
 const kept=items.filter(t=>global.RoomEquipment.isArchitecture(t)||t.category==='loads').map(t=>t.category==='loads'?{...t,equipmentRelease:global.RoomEquipment.release}:t);
 const result=[...global.RoomEquipment.defaults(),...kept];
 for(const t of consumers())if(!result.some(x=>x.kind===t.kind))result.push(t);
 return JSON.stringify(result)===JSON.stringify(items)?items:result;
 }
 function migrateStorage(storage){
  if(storage.getItem('rd_connection_model')===version)return false;
  const keys=['rd_last','rd_profiles','rd_catalog','rd_types','rd_shortcuts','rd_connection_model'];
  const original=Object.fromEntries(keys.map(k=>[k,storage.getItem(k)])),writes=new Map();
  const parse=(k,fallback)=>original[k]===null?fallback:JSON.parse(original[k]);
  writes.set('rd_types',JSON.stringify(types()));
  writes.set('rd_catalog',JSON.stringify(resetCatalog(parse('rd_catalog',[]),true)));
  if(original.rd_last!==null)writes.set('rd_last',JSON.stringify(resetDocument(parse('rd_last'))));
  if(original.rd_profiles!==null){const profiles=parse('rd_profiles');for(const id of Object.keys(profiles))profiles[id]=resetDocument(profiles[id]);writes.set('rd_profiles',JSON.stringify(profiles))}
  if(original.rd_shortcuts!==null)writes.set('rd_shortcuts',JSON.stringify(parse('rd_shortcuts').map(t=>({...t,data:resetDocument(t.data)}))));
  const write=(key,value)=>{if(storage.setItem(key,value)===false||storage.getItem(key)!==value)throw Error('Connection model could not be saved')};
  const applied=[];
  try{for(const [key,value]of writes){applied.push(key);write(key,value)}write('rd_connection_model',version)}
  catch(error){for(const key of [...applied,'rd_connection_model'].reverse()){try{if(original[key]===null)storage.removeItem(key);else storage.setItem(key,original[key])}catch{}}throw error}
  return true;
 }
 global.RoomConnections={normalizeTypes,normalizeDocumentTypes,version,resetKey,resetBrowserData,recoveryReset:Promise.resolve(true),colors,types,equipmentPorts,ensureRelayPorts,upgradeFieldDevices,consumers,resetDocument,resetCatalog,migrateStorage};
})(globalThis);
