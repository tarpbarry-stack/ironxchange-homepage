import {useMemo,useState} from "react";
import IXIMachineRail from "../../IXIMachineRail";
import {createIXITransactContext} from "./IXITransactContext";
import {getIXITransactModules} from "./IXITransactModuleRegistry";
import {createIXITechnologyWorkDraft} from "./modules/IXITransactTechnologyWork";
import IXIWorkOrderApp from "./modules/work-order/IXIWorkOrderApp";
import IXINoteApp from "./modules/note/IXINoteApp";
import IXIPhotoApp from "./modules/photo/IXIPhotoApp";

const clean=value=>String(value??"").trim();
const GROUPS=[
 {id:"work",label:"WORK",sub:"Operate this object"},
 {id:"spend",label:"SPEND",sub:"Costs and obligations"},
 {id:"buy",label:"BUY",sub:"Request and commit"},
 {id:"sell",label:"SELL",sub:"Revenue documents"},
 {id:"settle",label:"SETTLE",sub:"Close the transaction"}
];
const ICONS={"work-order":"WO","technology-work":"TW",time:"TM",material:"PT",expense:"EX",bill:"BL",receipt:"RC","purchase-order":"PO",quote:"QT",invoice:"IN",settlement:"ST"};

function addUnique(values=[],id=""){
 const key=clean(id);if(!key)return Array.isArray(values)?values:[];
 return [...new Set([...(Array.isArray(values)?values:[]),key])];
}

export default function IXITransactApp({
 object={},actor={},entity={},activeWorkOrder=null,permissions=[],onClose=null,onOpenModule=null,
 onSendFront=null,onSendBack=null,onCycleColor=null,onCycleOutline=null,armedDestination="",onSendToArmedDestination=null
}){
 const context=useMemo(()=>createIXITransactContext({object,actor,entity,activeWorkOrder,permissions}),[object,actor,entity,activeWorkOrder,permissions]);
 const modules=useMemo(()=>getIXITransactModules({objectType:context.primary.objectType,permissions:context.permissions}),[context]);
 const[moduleId,setModuleId]=useState("");
 const[workOrderSnapshot,setWorkOrderSnapshot]=useState(null);
 const active=modules.find(item=>item.id===moduleId)||null;
 const noteOpen=moduleId==="work-order-note";
 const photoOpen=moduleId==="work-order-photo";
 const compactHeader=Boolean(active)||noteOpen||photoOpen;
 const resolvedWorkOrder=workOrderSnapshot||context.activeWorkOrder||null;
 const originLabel=clean(context.primary?.label)||"AOS OBJECT";
 const originType=clean(context.primary?.objectType)||"OBJECT";
 const locationLabel=clean(context.location?.label);
 const actorLabel=clean(context.actor?.displayName||context.actor?.name||context.actor?.label);
 const grouped=GROUPS.map(group=>({...group,items:modules.filter(item=>item.group===group.id)})).filter(group=>group.items.length);

 function open(item){
  setModuleId(item.id);
  const launchPayload=item.id==="technology-work"?{technologyWork:createIXITechnologyWorkDraft(context)}:{};
  onOpenModule?.(item,context,launchPayload);
 }

 function workOrderAction(actionId,workOrder,workContext,payload={}){
  if(actionId==="note"){setWorkOrderSnapshot(workOrder||resolvedWorkOrder||null);setModuleId("work-order-note");return;}
  if(actionId==="photo"){setWorkOrderSnapshot(workOrder||resolvedWorkOrder||null);setModuleId("work-order-photo");return;}
  onOpenModule?.({id:actionId,label:String(actionId||"").toUpperCase(),group:"work-order-action",documentType:actionId},workContext,{workOrder,...payload});
 }

 async function saveNote(note,input,response){
  const noteId=clean(note?.identity?.noteId)||clean(note?.identity?.clientRequestId)||`NOTE-${Date.now()}`;
  const attachment=note?.note?.attachments?.[0]||null;
  const current=resolvedWorkOrder||{};
  const next={...current,references:{...(current.references||{}),noteIds:addUnique(current.references?.noteIds,noteId)},notesProjection:[...(Array.isArray(current.notesProjection)?current.notesProjection:[]),{...note,identity:{...(note.identity||{}),noteId}}],activityProjection:[...(Array.isArray(current.activityProjection)?current.activityProjection:[]),{activityId:`ACT-${noteId}`,type:"note-added",noteId,noteType:note?.note?.type||"work-note",title:note?.note?.title||"",body:note?.note?.body||"",occurredAt:note?.audit?.createdAt||new Date().toISOString(),actorLabel:note?.audit?.createdByLabel||actorLabel}],documentProjection:attachment?[...(Array.isArray(current.documentProjection)?current.documentProjection:[]),{documentId:`NOTE-ATTACH:${noteId}:${attachment.fileName||"attachment"}`,title:attachment.fileName||"Note attachment",fileName:attachment.fileName||"",type:attachment.mimeType?.startsWith("image/")?"photo":"other",issuer:note?.audit?.createdByLabel||"",relatedType:"note",relatedId:noteId,relatedLabel:note?.note?.title||noteId,date:note?.audit?.createdAt||new Date().toISOString(),addedBy:note?.audit?.createdByLabel||"",mimeType:attachment.mimeType||"",size:Number(attachment.size||0),persistenceState:attachment.status||"local-pending-upload"}]:current.documentProjection};
  setWorkOrderSnapshot(next);
  onOpenModule?.({id:"note-save",label:"SAVE NOTE",group:"work-order-action",documentType:"note"},context,{workOrder:next,note:{...note,identity:{...(note.identity||{}),noteId}},input,response,activity:next.activityProjection?.at?.(-1)});
  setModuleId("work-order");
 }

 async function savePhoto(photo,input,response){
  const photoId=clean(photo?.identity?.photoId)||clean(photo?.identity?.clientRequestId)||`PHOTO-${Date.now()}`;
  const current=resolvedWorkOrder||{};
  const media=Array.isArray(photo?.photo?.media)?photo.photo.media:[];
  const attachmentIds=media.reduce((ids,item)=>addUnique(ids,item.mediaId),current.references?.attachmentIds||[]);
  const documents=media.map((item,index)=>({documentId:item.mediaId||`${photoId}-MEDIA-${index+1}`,title:photo?.photo?.title||item.fileName||`Photo ${index+1}`,fileName:item.fileName||"",type:"photo",typeLabel:photo?.photo?.type==="damage"?"DAMAGE":photo?.photo?.type==="before-after"?"BEFORE / AFTER":photo?.photo?.type==="reference"?"REFERENCE":"WORK PHOTO",issuer:photo?.audit?.createdByLabel||"",relatedType:"photo",relatedId:photoId,relatedLabel:photo?.photo?.title||photoId,date:photo?.photo?.occurredAt||photo?.audit?.createdAt||new Date().toISOString(),addedBy:photo?.audit?.createdByLabel||"",mimeType:item.mimeType||"image/jpeg",size:Number(item.size||0),previewUrl:item.previewUrl||"",persistenceState:item.status||"local-pending-upload"}));
  const next={...current,references:{...(current.references||{}),photoIds:addUnique(current.references?.photoIds,photoId),attachmentIds},photoProjection:[...(Array.isArray(current.photoProjection)?current.photoProjection:[]),{...photo,identity:{...(photo.identity||{}),photoId}}],documentProjection:[...(Array.isArray(current.documentProjection)?current.documentProjection:[]),...documents],activityProjection:[...(Array.isArray(current.activityProjection)?current.activityProjection:[]),{activityId:`ACT-${photoId}`,type:"photo-added",photoId,photoType:photo?.photo?.type||"work-photo",title:photo?.photo?.title||"",count:media.length,occurredAt:photo?.photo?.occurredAt||new Date().toISOString(),actorLabel:photo?.audit?.createdByLabel||actorLabel}]};
  setWorkOrderSnapshot(next);
  onOpenModule?.({id:"photo-save",label:"SAVE PHOTO",group:"work-order-action",documentType:"photo"},context,{workOrder:next,photo:{...photo,identity:{...(photo.identity||{}),photoId}},input,response,activity:next.activityProjection?.at?.(-1),documents});
  setModuleId("work-order");
 }

 return <div className={`ixi-transact-app ixi-transact-v13 board-color-none board-outline-1 ${compactHeader?"module-open":"home-open"}`}>
  <header className="tx-header">
   <div className="tx-brand"><span>IXI TRAN$ACT</span>{!compactHeader?<small>OBJECT-CONTEXT TRANSACTIONS</small>:null}</div>
   <button className="tx-close" type="button" onClick={()=>onClose?.()} aria-label="Close TRAN$ACT">×</button>
  </header>
  <main className="tx-body">
   {noteOpen?<IXINoteApp context={context} workOrder={resolvedWorkOrder||{}} onCancel={()=>setModuleId("work-order")} onSave={saveNote}/>:
   photoOpen?<IXIPhotoApp context={context} workOrder={resolvedWorkOrder||{}} onCancel={()=>setModuleId("work-order")} onSave={savePhoto}/>:
   active?.id==="work-order"?<IXIWorkOrderApp context={context} initialWorkOrder={resolvedWorkOrder} onBack={()=>setModuleId("")} onCreate={(draft,workContext)=>{setWorkOrderSnapshot(draft);onOpenModule?.({id:"work-order-create",label:"CREATE WORK ORDER",group:"work",documentType:"work-order"},workContext,{workOrder:draft})}} onAction={workOrderAction}/>:
   active?<div className="tx-module"><button className="tx-back" onClick={()=>setModuleId("")}>‹ TRAN$ACT</button><div className="tx-module-title"><span>{active.group.toUpperCase()}</span><strong>{active.label}</strong></div><div className="tx-module-placeholder"><b>{active.label}</b><span>MODULE CHASSIS READY</span><small>{active.documentType} · {originLabel}</small></div></div>:
   <div className="tx-home">
    <section className="tx-origin"><div className="origin-mark">$</div><div className="origin-copy"><small>TRANSACT FROM</small><strong>{originLabel}</strong><span>{originType.toUpperCase()}</span></div><div className="origin-lock">CONTEXT<br/>LOCKED</div></section>
    {(locationLabel||actorLabel)?<div className="tx-context-line">{locationLabel?<span>⌖ {locationLabel}</span>:null}{actorLabel?<span>◎ {actorLabel}</span>:null}</div>:null}
    {resolvedWorkOrder?<button className="tx-active-work" onClick={()=>{setWorkOrderSnapshot(resolvedWorkOrder);open({id:"work-order",label:"CONTINUE WORK",group:"work",documentType:"work-order"})}}><div><small>ACTIVE WORK ORDER</small><strong>{clean(resolvedWorkOrder?.identity?.number||resolvedWorkOrder?.workOrderNumber||resolvedWorkOrder?.number||resolvedWorkOrder?.id)||"WORK ORDER"}</strong><span>{clean(resolvedWorkOrder?.work?.description||resolvedWorkOrder?.title||resolvedWorkOrder?.description)||"IN PROGRESS"}</span></div><b>OPEN ›</b></button>:null}
    <div className="tx-section-label">CREATE / RECORD</div>
    <div className="tx-groups">{grouped.map(group=><section className="tx-group" key={group.id}><div className="group-head"><div><strong>{group.label}</strong><small>{group.sub}</small></div><span>{group.items.length}</span></div><div className="group-actions">{group.items.map(item=><button key={item.id} onClick={()=>open(item)}><i>{ICONS[item.id]||"•"}</i><span><b>{item.label}</b><small>{item.documentType}</small></span><em>›</em></button>)}</div></section>)}</div>
   </div>}
  </main>
  <IXIMachineRail listing={object} saved={false} boardColor="none" boardOutline={1} machineFace={0} onSendFront={onSendFront} onSendBack={onSendBack} onCycleColor={onCycleColor} onCycleOutline={onCycleOutline} armedDestination={armedDestination} onSendToArmedDestination={onSendToArmedDestination}/>
  <style jsx>{`
   .ixi-transact-app,.ixi-transact-app *{box-sizing:border-box}.ixi-transact-app{position:relative;width:298px;height:471px;overflow:hidden;border:1px solid #303432;border-radius:14px;background:#090b0a;color:#f2f4f2;font-family:"Arial Narrow",Arial,sans-serif;box-shadow:0 20px 48px rgba(0,0,0,.58),inset 0 1px rgba(255,255,255,.035)}
   .tx-header{position:absolute;inset:0 0 auto;height:39px;padding:0 8px 0 10px;border-bottom:1px solid rgba(255,255,255,.075);display:flex;justify-content:space-between;align-items:center;z-index:4;background:linear-gradient(180deg,#101311,#090b0a)}.module-open .tx-header{height:31px}.tx-brand span{display:block;color:#ffc400;font-size:9px;font-weight:950;letter-spacing:.07em}.tx-brand small{display:block;margin-top:2px;color:rgba(255,255,255,.28);font-size:4.5px;font-weight:900;letter-spacing:.07em}.tx-close{width:23px;height:23px;padding:0;border:1px solid rgba(255,255,255,.12);border-radius:5px;background:#0b0d0c;color:#ffc400;font-size:16px;font-weight:950;line-height:1;cursor:pointer}.tx-close:hover{border-color:rgba(255,196,0,.35);background:rgba(255,196,0,.05)}
   .tx-body{position:absolute;top:39px;bottom:19px;left:0;right:0;overflow-y:auto;overflow-x:hidden;padding:7px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.15) transparent}.module-open .tx-body{top:31px;padding:5