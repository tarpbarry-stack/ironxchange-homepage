import { fetchMosCardTemplates, fetchMosCardTemplate } from "../../lib/mos/ixiMosClient";

function withLocalCardDrafts(templates = []) {
  const source=(Array.isArray(templates)?templates:[]).map(template=>{
    const slug=String(template?.templateSlug||"").trim();
    if(slug==="location-standard") return {...template,templateNumber:1,version:12,metadata:{...(template?.metadata||{}),cardLocked:true,lockedCardId:"001-v12"}};
    return template;
  });

  const baseLocation=source.find(t=>String(t?.templateSlug||"").trim()==="location-standard");
  if(baseLocation){[
    {templateNumber:2,templateSlug:"location-standard-002"},
    {templateNumber:3,templateSlug:"location-standard-003"}
  ].forEach(draft=>{if(!source.some(t=>String(t?.templateSlug||"").trim()===draft.templateSlug))source.push({...baseLocation,templateNumber:draft.templateNumber,templateSlug:draft.templateSlug,label:"Location",version:12,metadata:{...(baseLocation?.metadata||{}),cardLocked:false,localCardDraft:true,derivedFrom:"001-v12"}})});}

  const personnelDrafts=[
    {templateNumber:4,templateSlug:"personnel-container-004",variant:"summary"},
    {templateNumber:5,templateSlug:"personnel-container-005",variant:"analytic"},
    {templateNumber:6,templateSlug:"personnel-container-006",variant:"dashboard"}
  ];
  personnelDrafts.forEach(draft=>{
    if(source.some(t=>String(t?.templateSlug||"").trim()===draft.templateSlug))return;
    source.push({templateNumber:draft.templateNumber,templateSlug:draft.templateSlug,label:"Employees / Personnel Container",baseObjectType:"personnel-container",version:13,fieldSchema:[],capabilities:{canContain:true,canOpenStack:true,canMoveToBoard:true},metadata:{localCardDraft:true,v13:true,variant:draft.variant}});
  });
  return source;
}

export async function loadAosCardCatalog({entityId=null,signal=null}={}){
 const payload=await fetchMosCardTemplates({entityId,signal});
 const templates=withLocalCardDrafts(payload?.templates||[]);
 return {templates,count:templates.length};
}

export async function loadAosCardTemplate({templateSlug,version=null,entityId=null,signal=null}){
 const payload=await fetchMosCardTemplate({templateSlug,version,entityId,signal});
 return payload?.template||null;
}
