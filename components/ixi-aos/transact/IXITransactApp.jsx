import {useMemo,useState} from "react";
import IXIMachineRail from "../../IXIMachineRail";
import {createIXITransactContext} from "./IXITransactContext";
import {getIXITransactModules} from "./IXITransactModuleRegistry";
import {createIXITechnologyWorkDraft} from "./modules/IXITransactTechnologyWork";
import IXIWorkOrderApp from "./modules/work-order/IXIWorkOrderApp";
import IXINoteApp from "./modules/note/IXINoteApp";
import IXIPhotoApp from "./modules/photo/IXIPhotoApp";

const clean=value=>String(value??"").trim();

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

 function open(item){
  setModuleId(item.id);
  const launchPayload=item.id==="technology-work"?{technologyWork:createIXITechnologyWorkDraft(context)}:{};
  onOpenModule?.(item,context,launchPayload);
 }

 function workOrderAction(actionId,workOrder,workContext,payload={}){
  if(actionId==="note"){
   setWorkOrderSnapshot(workOrder||resolvedWorkOrder||null);
   setModuleId("work-order-note");
   return;
  }
  if(actionId==="photo"){
   setWorkOrderSnapshot(workOrder||resolvedWorkOrder||null);
   setModuleId("work-order-photo");
   return;
  }
  onOpenModule?.({id:actionId,label:String(actionId||"").toUpperCase(),group:"work-order-action",documentType:actionId},workContext,{workOrder,...payload});
 }

 async function saveNote(note,input,response){
  const noteId=clean(note?.identity?.noteId)||clean(note?.identity?.clientRequestId)||`NOTE-${Date.now()}`;
  const attachment=note?.note?.attachments?.[0]||null;
  const current=resolvedWorkOrder||{};
  const next={
   ...current,
   references:{...(current.references||{}),noteIds:addUnique(current.references?.noteIds,noteId)},
   notesProjection:[...(Array.isArray(current.notesProjection)?current.notesProjection:[]),{...note,identity:{...(note.identity||{}),noteId}}],
   activityProjection:[...(Array.isArray(current.activityProjection)?current.activityProjection:[]),{
    activityId:`ACT-${noteId}`,type:"note-added",noteId,noteType:note?.note?.type||"work-note",title:note?.note?.title||"",body:note?.note?.body||"",occurredAt:note?.audit?.createdAt||new Date().toISOString(),actorLabel:note?.audit?.createdByLabel||clean(context.actor?.displayName||context.actor?.name||context.actor?.label)
   }],
   documentProjection:attachment?[...(Array.isArray(current.documentProjection)?current.documentProjection:[]),{
    documentId:`NOTE-ATTACH:${noteId}:${attachment.fileName||"attachment"}`,title:attachment.fileName||"Note attachment",fileName:attachment.fileName||"",type:attachment.mimeType?.startsWith("image/")?"photo":"other",issuer:note?.audit?.createdByLabel||"",relatedType:"note",relatedId:noteId,relatedLabel:note?.note?.title||noteId,date:note?.audit?.createdAt||new Date().toISOString(),addedBy:note?.audit?.createdByLabel||"",mimeType:attachment.mimeType||"",size:Number(attachment.size||0),persistenceState:attachment.status||"local-pending-upload"
   }]:current.documentProjection
  };
  setWorkOrderSnapshot(next);
  onOpenModule?.({id:"note-save",label:"SAVE NOTE",group:"work-order-action",documentType:"note"},context,{workOrder:next,note:{...note,identity:{...(note.identity||{}),noteId}},input,response,activity:next.activityProjection?.at?.(-1)});
  setModuleId("work-order");
 }

 async function savePhoto(photo,input,response){
  const photoId=clean(photo?.identity?.photoId)||clean(photo?.identity?.clientRequestId)||`PHOTO-${Date.now()}`;
  const current=resolvedWorkOrder||{};
  const media=Array.isArray(photo?.photo?.media)?photo.photo.media:[];
  const attachmentIds=media.reduce((ids,item)=>addUnique(ids,item.mediaId),current.references?.attachmentIds||[]);
  const documents=media.map((item,index)=>({
   documentId:item.mediaId||`${photoId}-MEDIA-${index+1}`,
   title:photo?.photo?.title||item.fileName||`Photo ${index+1}`,
   fileName:item.fileName||"",
   type:"photo",
   typeLabel:photo?.photo?.type==="damage"?"DAMAGE":photo?.photo?.type==="before-after"?"BEFORE / AFTER":photo?.photo?.type==="reference"?"REFERENCE":"WORK PHOTO",
   issuer:photo?.audit?.createdByLabel||"",
   relatedType:"photo",
   relatedId:photoId,
   relatedLabel:photo?.photo?.title||photoId,
   date:photo?.photo?.occurredAt||photo?.audit?.createdAt||new Date().toISOString(),
   addedBy:photo?.audit?.createdByLabel||"",
   mimeType:item.mimeType||"image/jpeg",
   size:Number(item.size||0),
   previewUrl:item.previewUrl||"",
   persistenceState:item.status||"local-pending-upload"
  }));
  const next={
   ...current,
   references:{...(current.references||{}),photoIds:addUnique(current.references?.photoIds,photoId),attachmentIds},
   photoProjection:[...(Array.isArray(current.photoProjection)?current.photoProjection:[]),{...photo,identity:{...(photo.identity||{}),photoId}}],
   documentProjection:[...(Array.isArray(current.documentProjection)?current.documentProjection:[]),...documents],
   activityProjection:[...(Array.isArray(current.activityProjection)?current.activityProjection:[]),{
    activityId:`ACT-${photoId}`,type:"photo-added",photoId,photoType:photo?.photo?.type||"work-photo",title:photo?.photo?.title||"",count:media.length,occurredAt:photo?.photo?.occurredAt||new Date().toISOString(),actorLabel:photo?.audit?.createdByLabel||clean(context.actor?.displayName||context.actor?.name||context.actor?.label)
   }]
  };
  setWorkOrderSnapshot(next);
  onOpenModule?.({id:"photo-save",label:"SAVE PHOTO",group:"work-order-action",documentType:"photo"},context,{workOrder:next,photo:{...photo,identity:{...(photo.identity||{}),photoId}},input,response,activity:next.activityProjection?.at?.(-1),documents});
  setModuleId("work-order");
 }

 return <div className={`ixi-transact-app ixi-transact-v13 board-color-none board-outline-1 ${compactHeader?"module-open":"home-open"}`}>
  <header className="tx-header"><div className="tx-brand"><span>IXI TRAN$ACT</span>{!compactHeader?<><strong>{context.primary.label}</strong><small>{context.primary.objectType||"AOS OBJECT"}</small></>:null}</div><button className="tx-close" type="button" onClick={()=>onClose?.()} aria-label="Close TRAN$ACT">×</button></header>
  <main className="tx-body">
   {noteOpen?<IXINoteApp context={context} workOrder={resolvedWorkOrder||{}} onCancel={()=>setModuleId("work-order")} onSave={saveNote}/>:
   photoOpen?<IXIPhotoApp context={context} workOrder={resolvedWorkOrder||{}} onCancel={()=>setModuleId("work-order")} onSave={savePhoto}/>:
   active?.id==="work-order"?<IXIWorkOrderApp context={context} initialWorkOrder={resolvedWorkOrder} onBack={()=>setModuleId("")} onCreate={(draft,workContext)=>{setWorkOrderSnapshot(draft);onOpenModule?.({id:"work-order-create",label:"CREATE WORK ORDER",group:"work",documentType:"work-order"},workContext,{workOrder:draft})}} onAction={workOrderAction}/>:
   active?<div className="tx-module"><button className="tx-back" onClick={()=>setModuleId("")}>‹ TRAN$ACT</button><div className="tx-module-title"><span>{active.group.toUpperCase()}</span><strong>{active.label}</strong></div><div className="tx-module-placeholder"><b>{active.label}</b><span>MODULE CHASSIS READY</span><small>{active.documentType} · {context.primary.label}</small></div></div>:
   <>{context.activeWorkOrder?<button className="tx-open-work" onClick={()=>{setWorkOrderSnapshot(context.activeWorkOrder);open({id:"work-order",label:"CONTINUE WORK",group:"work",documentType:"work-order"})}}><span>OPEN WORK</span><strong>{clean(context.activeWorkOrder.workOrderNumber||context.activeWorkOrder.number||context.activeWorkOrder.id)||"WORK ORDER"}</strong><small>{clean(context.activeWorkOrder.title||context.activeWorkOrder.description)||"IN PROGRESS"}</small><b>CONTINUE ›</b></button>:null}<div className="tx-label">CREATE / OPEN</div><div className="tx-grid">{modules.map(item=><button key={item.id} onClick={()=>open(item)}><span>{item.group.toUpperCase()}</span><strong>{item.label}</strong><small>{item.documentType}</small></button>)}</div></>}
  </main>
  <IXIMachineRail listing={object} saved={false} boardColor="none" boardOutline={1} machineFace={0} onSendFront={onSendFront} onSendBack={onSendBack} onCycleColor={onCycleColor} onCycleOutline={onCycleOutline} armedDestination={armedDestination} onSendToArmedDestination={onSendToArmedDestination}/>
  <style jsx>{`.ixi-transact-app,.ixi-transact-app *{box-sizing:border-box}.ixi-transact-app{position:relative;width:298px;height:471px;overflow:hidden;border:1px solid #303432;border-radius:14px;background:radial-gradient(circle at 40% -8%,rgba(255,255,255,.045),transparent 30%),linear-gradient(#0c0e0d,#090b0a 55%,#0d100e);color:#f4f5f4;font-family:"Arial Narrow",Arial,sans-serif;box-shadow:0 20px 48px rgba(0,0,0,.58),inset 0 1px rgba(255,255,255,.035)}.tx-header{position:absolute;inset:0 0 auto;height:48px;padding:7px 9px;border-bottom:1px solid #292d2a;display:flex;justify-content:space-between;align-items:flex-start;z-index:4;background:linear-gradient(#0f1110,#090b0a)}.module-open .tx-header{height:31px;align-items:center;padding:0 8px}.tx-brand span{display:block;color:#ffc400;font-size:7px;font-weight:950;letter-spacing:.065em}.home-open .tx-brand strong{display:block;margin-top:3px;font-size:15px;line-height:1}.tx-brand small{display:block;margin-top:3px;color:#737975;font-size:5.5px;font-weight:900;text-transform:uppercase}.tx-close{width:25px;height:25px;padding:0;border:1px solid #353936;border-radius:5px;background:linear-gradient(#111312,#080a09);color:#ffc400;font-size:16px;font-weight:950;line-height:1}.module-open .tx-close{width:23px;height:23px}.tx-body{position:absolute;top:48px;bottom:19px;left:0;right:0;overflow-y:auto;overflow-x:hidden;padding:6px 6px 12px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.16) transparent}.module-open .tx-body{top:31px;padding:5px 7px 12px}.tx-body::-webkit-scrollbar{width:3px}.tx-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.16);border-radius:5px}.tx-label{margin:2px 2px 5px;color:#8a908c;font-size:6px;font-weight:950}.tx-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}.tx-grid button{height:57px;padding:7px;border:1px solid #303432;border-radius:6px;background:linear-gradient(#151817,#0d100e);color:#eee;text-align:left}.tx-grid button span{display:block;color:#747a76;font-size:5px;font-weight:950}.tx-grid button strong{display:block;margin-top:5px;font-size:8.5px;font-weight:950}.tx-grid button small{display:block;margin-top:3px;color:#ffc400;font-size:5px}.tx-open-work{width:100%;min-height:66px;margin-bottom:7px;padding:8px;border:1px solid rgba(255,196,0,.28);border-radius:6px;background:rgba(255,196,0,.04);color:#fff;text-align:left}.tx-open-work span{display:block;color:#ffc400;font-size:5.5px}.tx-open-work strong{display:block;margin-top:4px;font-size:10.5px}.tx-open-work small{display:block;margin-top:3px;color:#999;font-size:5.5px}.tx-back{height:24px;border:1px solid #333;border-radius:4px;background:#0a0b0b;color:#ffc400}.tx-module-title,.tx-module-placeholder{margin-top:6px;padding:8px;border:1px solid #303432;border-radius:6px;background:#101211}.tx-module-title span{font-size:5px;color:#777}.tx-module-title strong,.tx-module-placeholder>b{display:block;margin-top:3px;color:#ffc400;font-size:13px}`}</style>
 </div>;
}
