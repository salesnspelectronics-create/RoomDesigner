/* Remove retired equipment while retaining current equipment and architecture. */
(function(global){
 'use strict';
 const release='nsp-equipment-260';
 const architecture=new Set(['door','window','custom-architecture','bed','single_bed','double_bed','sliding_door','circle','toilet','television','sofa','armchair','table','desk','wardrobe','washbasin','shower','bathtub','kitchen_sink','cooktop','refrigerator','dining_chair','column','stairs']);
 const isArchitecture=d=>d.category==='architecture'||architecture.has(d.kind);
 function defaults(){return global.EquipmentCatalogBuiltin.entries.map(t=>({...t,ports:(Array.isArray(t.ports)?t.ports:global.RoomConnections.equipmentPorts()).map(p=>({...p})),connectionModel:global.RoomConnections.version,category:'equipment',kind:'custom',equipmentRelease:release,svgType:t.assetId,svgAssetId:t.assetId,svgAssetVersion:1,svg:global.SvgLibraryBuiltin.assets[t.assetId],svgMode:'stretch',stretchSvg:true,showLabel:true,backgroundColor:'#ffffff',w:t.w||120,h:t.h||85}))}
 // Extend a browser's saved catalog without rerunning destructive release migration.
 function appendMissingDefaults(items){
  const explicit=new Map(global.EquipmentCatalogBuiltin.entries.filter(t=>Array.isArray(t.ports)).map(t=>[t.assetId,t.ports]));
  let changed=false;
  const updated=items.map(t=>{const ports=explicit.get(t.assetId||t.svgAssetId);if(!ports||JSON.stringify(t.ports)===JSON.stringify(ports))return t;changed=true;return {...t,ports:ports.map(p=>({...p}))}});
  const existing=new Set(items.map(t=>t.assetId||t.svgAssetId));
  const additions=defaults().filter(t=>!existing.has(t.assetId));
  return global.RoomConnections.resetCatalog(additions.length?[...updated,...additions]:changed?updated:items);
 }
 function cleanCatalog(items){return [...defaults(),...(items||[]).filter(isArchitecture)]}
 function cleanDocument(input,oldCatalog=[]){
  const d=JSON.parse(JSON.stringify(input));
  const architectureNames=new Set(oldCatalog.filter(isArchitecture).map(x=>x.name));
  function clean(s){
   if(!s||!Array.isArray(s.devices)||!Array.isArray(s.cables))throw Error('ساختار نقشه برای مهاجرت معتبر نیست');
   s.devices=s.devices.filter(x=>isArchitecture(x)||architectureNames.has(x.name)&&x.kind==='custom'||x.equipmentRelease===release);
   const ids=new Set(s.devices.map(x=>x.id));s.cables=s.cables.filter(c=>ids.has(c.a?.dev)&&ids.has(c.b?.dev));
   s.equipmentRelease=release;
   if(s.revisions!=null){if(!Array.isArray(s.revisions))throw Error('Revision نامعتبر است');for(const r of s.revisions)clean(r.snapshot)}
  }
  clean(d);return d;
 }
 function migrationState(storage){const keys=['rd_last','rd_profiles','rd_catalog','rd_shortcuts','rd_svg_drafts','rd_toolbox_order_v133','rd_types','rd_users','rd_active_user'];return Object.fromEntries(keys.map(k=>[k,storage.getItem(k)]))}
 function migrateStorage(storage){
  if(storage.getItem('rd_equipment_release')===release)return false;
  const original=migrationState(storage),parse=(key,fallback)=>original[key]===null?fallback:JSON.parse(original[key]);
  const oldCatalog=parse('rd_catalog',[]);if(!Array.isArray(oldCatalog))throw Error('کتابخانه محلی نامعتبر است');
  const writes=new Map([['rd_catalog',JSON.stringify(cleanCatalog(oldCatalog))]]);
  if(original.rd_last!==null)writes.set('rd_last',JSON.stringify(cleanDocument(parse('rd_last'),oldCatalog)));
  if(original.rd_profiles!==null){const profiles=parse('rd_profiles');if(!profiles||typeof profiles!=='object'||Array.isArray(profiles))throw Error('پروژه‌های محلی نامعتبرند');for(const key of Object.keys(profiles))profiles[key]=cleanDocument(profiles[key],oldCatalog);writes.set('rd_profiles',JSON.stringify(profiles))}
  if(original.rd_shortcuts!==null){const shortcuts=parse('rd_shortcuts');if(!Array.isArray(shortcuts))throw Error('شورتکات‌ها نامعتبرند');const next=shortcuts.map(x=>({...x,data:cleanDocument(x.data,oldCatalog)})).filter(x=>x.data.devices.length||(x.data.walls||[]).length||x.data.cables.length);writes.set('rd_shortcuts',JSON.stringify(next))}
  if(original.rd_svg_drafts!==null){let drafts;try{drafts=parse('rd_svg_drafts')}catch{}if(drafts&&typeof drafts==='object'&&Array.isArray(drafts.symbols)&&drafts.assets&&typeof drafts.assets==='object'&&!Array.isArray(drafts.assets)&&drafts.map&&typeof drafts.map==='object'&&!Array.isArray(drafts.map)){drafts.symbols=drafts.symbols.filter(x=>x&&x.category==='architecture');const ids=new Set(drafts.symbols.map(x=>x.id));drafts.assets=Object.fromEntries(Object.entries(drafts.assets).filter(([id])=>ids.has(id)));drafts.map=Object.fromEntries(Object.entries(drafts.map).filter(([type,id])=>architecture.has(type)&&ids.has(id)));writes.set('rd_svg_drafts',JSON.stringify(drafts))}}
  if(original.rd_toolbox_order_v133!==null){let order;try{order=parse('rd_toolbox_order_v133')}catch{}if(order&&typeof order==='object'&&!Array.isArray(order)&&order.items&&typeof order.items==='object'&&!Array.isArray(order.items)){delete order.items.equipment;writes.set('rd_toolbox_order_v133',JSON.stringify(order))}}
  const applied=[];
  try{for(const [key,value]of writes){applied.push(key);storage.setItem(key,value);if(storage.getItem(key)!==value)throw Error('ذخیره مهاجرت ناموفق بود')}
   storage.setItem('rd_equipment_release',release);if(storage.getItem('rd_equipment_release')!==release)throw Error('ثبت نسخه مهاجرت ناموفق بود');
  }catch(error){const failed=[];for(const key of applied.reverse()){try{if(original[key]===null)storage.removeItem(key);else storage.setItem(key,original[key])}catch{failed.push(key)}}try{storage.removeItem('rd_equipment_release')}catch{}throw Error(error.message+(failed.length?'؛ بازیابی از پشتیبان لازم است: '+failed.join(', '):''))}
  return Object.values(original).some(x=>x!==null);
 }
 global.RoomEquipment={release,defaults,appendMissingDefaults,cleanCatalog,cleanDocument,migrateStorage,isArchitecture};
})(globalThis);
