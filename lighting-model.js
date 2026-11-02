/* Shared semantic lighting/request panels: independent icons and model references; no physical ports yet. */
(function(global){
'use strict';
const counts=global.EquipmentCatalogBuiltin.entries.filter(t=>t.kind==='lighting-switch').map(t=>t.gangCount);
const entryForCount=n=>global.EquipmentCatalogBuiltin.entries.find(t=>t.kind==='lighting-switch'&&t.gangCount===n);
const standardSize=(d,mode)=>{const entry=global.RoomEquipment.definitionFor(d),v=resolve(d),size={...v.displaySizes[mode]};if(mode==='real'&&v.realAspectRatio)size.h=size.w/v.realAspectRatio;if(mode==='iconic'&&v.iconLayout)size.h=size.w*v.iconLayout.height/v.iconLayout.width;return size};
const icons=global.EquipmentCatalogBuiltin.icons;
const iconId=id=>global.EquipmentCatalogBuiltin.iconAliases?.[id]||id;
const isIcon=id=>icons.some(icon=>icon.id===iconId(id));
const iconChoices=d=>icons.filter(icon=>!icon.productIds||icon.productIds.includes(global.RoomEquipment.definitionFor(d)?.catalogId));
const modes=['code','iconic','real'];
const modesFor=d=>global.RoomEquipment?.typeFor(d)?.displayModes||modes;
const defaultModeFor=d=>global.RoomEquipment?.typeFor(d)?.defaultDisplayMode||'iconic';
const models=global.EquipmentCatalogBuiltin.models;
const modelsFor=d=>global.RoomEquipment.modelsFor({...d,kind:d.kind||'lighting-switch'});
const variant=(n,model)=>global.RoomEquipment.variantFor({kind:'lighting-switch',gangCount:n},model);
const resolve=d=>global.RoomEquipment.variantFor({...d,kind:d.kind||'lighting-switch'},d.lightingModel);
const unitName=d=>global.RoomEquipment.typeFor(d)?.controlLabel||'پل';
function canonicalTitle(d){const resolved=resolve(d),entry=global.RoomEquipment.definitionFor({...d,kind:d.kind||'lighting-switch'}),directions=global.RoomEquipment.orientationsFor({...d,kind:d.kind||'lighting-switch'});return (entry?.name||'کلید')+(global.RoomEquipment.typeFor(d)?.titleIncludesModel===false?'':' - '+resolved.modelName)+(directions.length>1?' - '+directions.find(o=>o.id===resolved.orientation).name:'')}
function displayName(d){return d.name??canonicalTitle(d)}
const appearanceKeys=['borderColor','borderWidth','borderVisible','backgroundColor','backgroundVisible','codeColor'];
function appearanceModePatch(d,mode){const current=d.displayMode||'iconic',appearanceByMode={...(d.appearanceByMode||{}),[current]:Object.fromEntries(appearanceKeys.filter(key=>d[key]!=null).map(key=>[key,d[key]]))},defaults={borderColor:'#000000',borderWidth:2,borderVisible:true,backgroundColor:mode==='code'?'#ffffff':global.RoomEquipment.definitionFor(d)?.iconicBackgroundColor||'#000000',backgroundVisible:true,codeColor:'#000000'};return {...defaults,...Object.fromEntries(appearanceKeys.filter(key=>appearanceByMode[mode]?.[key]!=null).map(key=>[key,appearanceByMode[mode][key]])),appearanceByMode}}

let resolveAsset=id=>global.SvgLibraryBuiltin?.assets[id];
const setAssetResolver=resolver=>{resolveAsset=resolver};
const isSwitch=d=>global.RoomEquipment?.typeFor(d)?.renderer==='panel'||['lighting-switch','request-switch'].includes(d?.kind);
const color=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(value||'')?value:fallback;
function borderPolicy(d){return models.find(m=>m.id===resolve(d)?.modelId)?.iconicBorder||{color:'#000000',width:2,visibility:'without-background',editable:true}}
function configuration(d,palettePreview=false){
 const count=global.RoomEquipment?.typeFor(d)?.iconEditor===false?0:global.RoomEquipment?.familyFor(d)?.controlCount??(counts.includes(d.gangCount)?d.gangCount:1),iconColor=color(d.iconColor,'#ffffff'),resolved=resolve({...d,gangCount:count}),lightingModel=resolved.modelId,displayMode=(palettePreview?modes:modesFor(d)).includes(d.displayMode)?d.displayMode:defaultModeFor(d),border=displayMode==='iconic'?borderPolicy(d):null;
 const textFields=global.RoomEquipment.typeFor(d)?.fields||[],fieldFontSize=f=>{const label=resolved.iconLayout?.labels?.find(l=>l.fieldId===f.id),face=resolved.iconLayout,scale=face?Math.min((d.w||resolved.displaySizes.iconic.w)/face.width,(d.h||resolved.displaySizes.iconic.h)/face.height):1;return Number.isFinite(d[f.fontSizeField])&&d[f.fontSizeField]>=f.minFontSize&&d[f.fontSizeField]<=f.maxFontSize?Math.round(d[f.fontSizeField]):Math.max(1,Math.round(label?.fontSize*scale||12))};
 return {...Object.fromEntries(textFields.filter(f=>f.type==='text').flatMap(f=>[[f.id,d[f.id]??f.defaultValue??''],...(f.colorField?[[f.colorField,color(d[f.colorField],f.defaultColor||'#ffffff')]]:[]),...(f.fontSizeField?[[f.fontSizeField,fieldFontSize(f)]]:[])])),lightingModel,orientation:resolved.orientation,installationDirection:resolved.installationDirection,showCode:d.showCode!==false,codeFontSize:Number.isFinite(d.codeFontSize)&&d.codeFontSize>=1&&d.codeFontSize<=200?Math.round(d.codeFontSize):7,codeColor:color(d.codeColor,'#000000'),displayMode,code:resolved.code,realAssetId:resolved.assetId,faceLayoutVersion:2,gangCount:count,gangIcons:Array.from({length:count},(_,i)=>isIcon(d.gangIcons?.[i])?iconId(d.gangIcons[i]):'bulb'),borderWidth:border?border.width:Number.isFinite(d.borderWidth)&&d.borderWidth>=.1&&d.borderWidth<=100?d.borderWidth:2,borderVisible:border?border.visibility==='always'||d.backgroundVisible===false:d.borderVisible!==false,backgroundVisible:d.backgroundVisible!==false,borderColor:border?border.visibility==='always'?border.color:color(d.autoOutlineColor,'#000000'):color(d.borderColor,'#000000'),backgroundColor:color(d.backgroundColor,displayMode==='code'?'#ffffff':global.RoomEquipment.definitionFor(d)?.iconicBackgroundColor||'#000000'),iconColor,gangIconColors:Array.from({length:count},(_,i)=>color(d.gangIconColors?.[i],iconColor))};
}
function borderControls(d){const c=configuration(d);return {visibility:c.displayMode==='code',color:c.displayMode==='code'||c.displayMode==='iconic'&&borderPolicy(d).visibility!=='always'&&!c.backgroundVisible,width:c.displayMode==='code'}}
// Effective inspector state is distinct from the saved preference for another display mode.
function appearanceState(d){const c=configuration(d),code=c.displayMode==='code',iconic=c.displayMode==='iconic',border=borderControls(d);return {
 borderVisible:{applicable:code||iconic&&c.borderVisible,checked:(code||iconic)&&c.borderVisible,editable:border.visibility},
 backgroundVisible:{applicable:code||iconic,checked:(code||iconic)&&c.backgroundVisible,editable:code||iconic},
 showCode:{applicable:code,checked:code&&c.showCode,editable:code},
 detailViewEnabled:{applicable:code,checked:code&&d.detailView?.enabled===true,editable:code}
};}
// Centers normalized from the face bounds (not the padded artboard) of the supplied NSP SVGs.
const faceRatio=698.1099853515625/343.6600036621094;
const faceSize=(count,definition=entryForCount(count))=>definition?.iconLayout?{width:definition.iconLayout.width,height:definition.iconLayout.height}:({width:count===8?100*faceRatio:100,height:100});
const centers={
 1:[[50,50]],2:[[29.07,50],[71.51,50]],3:[[24.42,52.61],[50,52.61],[75.58,52.61]],
 4:[[30.61,32.46],[72.46,32.46],[30.61,68.01],[72.46,68.01]],
 6:[[31.71,26.53],[68.97,26.53],[31.71,51.30],[68.97,51.30],[31.71,74.83],[68.97,74.83]],
 // Four gangs on the left, then four on the right, each group ordered by row.
 8:[[30.90,32.09],[72.97,32.09],[30.90,66.22],[72.97,66.22],[131.05,32.09],[173.27,32.09],[131.05,66.22],[173.27,66.22]]
};
function layout(count,definition=entryForCount(count)){const config=definition?.iconLayout,size=config?.iconSize||20;return (config?.centers||centers[count]||centers[1]).map(([x,y])=>({x:x-size/2,y:y-size/2,width:size,height:size}));}
function ensureLayout(doc){let changed=false;for(const d of doc.devices||[]){if(!isSwitch(d))continue;const defaultInk=global.RoomEquipment.definitionFor(d)?.iconicBackgroundColor;if(defaultInk&&d.iconicAppearanceVersion!==1){if(d.displayMode==='iconic'&&(!d.backgroundColor||d.backgroundColor.toLowerCase()==='#000000'))d.backgroundColor=defaultInk;if(d.appearanceByMode?.iconic?.backgroundColor?.toLowerCase()==='#000000')d.appearanceByMode.iconic.backgroundColor=defaultInk;d.iconicAppearanceVersion=1;changed=true}if(d.faceLayoutVersion===2)continue;if(d.gangCount===8&&Math.abs(d.w/d.h-1)<.01)d.w=d.h*faceRatio;d.faceLayoutVersion=2;changed=true;}return changed;}
function iconSvg(id,ink='#ffffff'){const svg=(resolveAsset((icons.find(x=>x.id===iconId(id))||icons[0]).assetId)||'').replace(/#111111/g,color(ink,'#ffffff'));return svg.replace('viewBox="0 0 64 64"','viewBox="4 1 56 62"');}
function artwork(d,palettePreview=false){
 const config=configuration(d,palettePreview);if(config.displayMode==='real')return resolveAsset(config.realAssetId)||'';const definition=global.RoomEquipment.definitionFor({...d,kind:d.kind||'lighting-switch'}),resolvedDefinition={...definition,iconLayout:resolve(d).iconLayout},face=faceSize(config.gangCount,resolvedDefinition),width=Number.isFinite(d.w)&&d.w>0?d.w:face.width,height=Number.isFinite(d.h)&&d.h>0?d.h:face.height,sx=width/face.width,sy=height/face.height,scale=Math.min(sx,sy),positions=layout(config.gangCount,resolvedDefinition);
 const stroke=config.borderVisible?Math.min(config.borderWidth*scale,width,height):0,inset=stroke/2;
 const fixedAsset=resolve(d).fixedArtworkAssetId&&resolveAsset(resolve(d).fixedArtworkAssetId),fixed=fixedAsset?fixedAsset.replace(/#111111/g,config.iconColor):null;
 const template=resolve(d).iconicAssetId&&resolveAsset(resolve(d).iconicAssetId),symbol=template?template.replace(/#111111/g,config.iconColor):null;
 // Match the actual object bounds while keeping each icon's aspect ratio intact.
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+width+' '+height+'"><rect x="'+inset+'" y="'+inset+'" width="'+(width-stroke)+'" height="'+(height-stroke)+'" fill="'+(config.backgroundVisible?config.backgroundColor:'none')+'" stroke="'+(config.borderVisible?config.borderColor:'none')+'" stroke-width="'+stroke+'"/>'+(config.displayMode==='iconic'&&fixed?'<svg x="0" y="0" width="'+width+'" height="'+height+'" viewBox="'+fixed.match(/viewBox="([^"]+)"/)[1]+'">'+fixed.slice(fixed.indexOf('>')+1,fixed.lastIndexOf('</svg>'))+'</svg>':'')+(config.displayMode==='code'?(config.showCode?'<text x="'+width/2+'" y="'+height/2+'" dominant-baseline="central" text-anchor="middle" font-family="Arial,sans-serif" font-size="'+config.codeFontSize+'" fill="'+config.codeColor+'">'+config.code+'</text>':''):symbol?'<svg x="0" y="0" width="'+width+'" height="'+height+'" viewBox="0 0 100 100">'+symbol.slice(symbol.indexOf('>')+1,symbol.lastIndexOf('</svg>'))+'</svg>':config.gangIcons.map((id,i)=>{const svg=iconSvg(id,config.gangIconColors[i]),p=positions[i],size=p.width*scale,x=(p.x+p.width/2)*sx-size/2,y=(p.y+p.height/2)*sy-size/2;return '<svg x="'+x+'" y="'+y+'" width="'+size+'" height="'+size+'" viewBox="4 1 56 62">'+svg.slice(svg.indexOf('>')+1,svg.lastIndexOf('</svg>'))+'</svg>'}).join(''))+(config.displayMode==='iconic'?(resolvedDefinition?.iconLayout?.labels||[]).map(label=>{const field=(global.RoomEquipment.typeFor(d)?.fields||[]).find(f=>f.id===label.fieldId),fontSize=field?.fontSizeField?config[field.fontSizeField]:label.fontSize*scale,fontScale=fontSize/(label.fontSize*scale),value=String(label.fieldId?config[label.fieldId]??label.text:label.text),escape=value=>String(value).replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])),ink=label.fieldId?config[(global.RoomEquipment.typeFor(d)?.fields||[]).find(f=>f.id===label.fieldId)?.colorField]||config.iconColor:config.iconColor,content=label.flow==='vertical'?Array.from(value).map((letter,i)=>'<tspan x="'+label.x*sx+'" dy="'+(i?label.lineHeight*sy*fontScale:0)+'">'+escape(letter)+'</tspan>').join(''):escape(value);return '<text x="'+label.x*sx+'" y="'+label.y*sy+'" text-anchor="middle" font-family="Arial,sans-serif" font-weight="'+(label.fontWeight||'normal')+'" font-size="'+fontSize+'" fill="'+ink+'">'+content+'</text>'}).join(''):'')+'</svg>';
}

function paletteArtwork(d){return artwork({...d,displayMode:'iconic',backgroundVisible:false,borderVisible:true,borderWidth:2,borderColor:'#e1edf5',autoOutlineColor:'#e1edf5',iconColor:'#e1edf5',gangIconColors:Array(d.gangCount||0).fill('#e1edf5')},true)}

global.LightingModel={paletteArtwork,counts,unitName,standardSize,borderPolicy,borderControls,appearanceState,icons,iconId,isIcon,iconChoices,modes,modesFor,models,modelsFor,displayName,canonicalTitle,appearanceModePatch,variant,setAssetResolver,isSwitch,configuration,layout,faceSize,faceRatio,ensureLayout,iconSvg,artwork};
})(globalThis);
