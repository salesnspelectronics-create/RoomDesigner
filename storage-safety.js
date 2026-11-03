/* One writer per origin; preserve pre-migration bytes before changing legacy data. */
(function(global){
 'use strict';
 const archiveKey='rd_preserved_migration_v325';
 async function acquireWriter(locks){
  if(!locks?.request)return {ok:false,reason:'unsupported'};
  return new Promise(resolve=>{
   try{
    locks.request('room-designer-storage-writer',{mode:'exclusive',ifAvailable:true},lock=>{
     if(!lock){resolve({ok:false,reason:'busy'});return}
     return new Promise(release=>resolve({ok:true,release}));
    }).catch(()=>resolve({ok:false,reason:'unavailable'}));
   }catch(_){resolve({ok:false,reason:'unavailable'})}
  });
 }
 function preserveMigration(storage,equipmentRelease,connectionVersion){
  if(storage.getItem('rd_equipment_release')===equipmentRelease&&storage.getItem('rd_connection_model')===connectionVersion)return false;
  // Keep the first archive immutable; never replace the only pre-migration copy.
  const existing=storage.getItem(archiveKey);
  if(existing!==null){const saved=JSON.parse(existing);if(saved.format!==1||!saved.values||typeof saved.values!=='object')throw Error('بسته حفاظت مهاجرت نامعتبر است');return false}
  const values={};
  for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith('rd_')&&key!==archiveKey)values[key]=storage.getItem(key)}
  if(!Object.keys(values).length)return false;
  const raw=JSON.stringify({format:1,createdAt:new Date().toISOString(),values});
  storage.setItem(archiveKey,raw);
  if(storage.getItem(archiveKey)!==raw)throw Error('فضای کافی برای حفاظت داده‌های پیش از مهاجرت وجود ندارد');
  return true;
 }
 global.RoomStorageSafety=Object.freeze({acquireWriter,preserveMigration,archiveKey});
})(globalThis);
