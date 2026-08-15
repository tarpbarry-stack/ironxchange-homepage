const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const arr=v=>Array.isArray(v)?v:[];
const num=v=>Number.isFinite(Number(v))?Number(v):0;

export function getIXIWorkOrderActuals(workOrder={}){
  const f=obj(workOrder.financial);
  const laborActual=num(f.laborActual),materialActual=num(f.materialActual),serviceActual=num(f.serviceActual),otherActual=num(f.otherActual);
  return {laborActual,materialActual,serviceActual,otherActual,totalActual:Math.round((laborActual+materialActual+serviceActual+otherActual)*100)/100,committed:num(f.committed),estimated:num(f.estimated)};
}

export function getIXIWorkOrderOpenItems(workOrder={}){
  const refs=obj(workOrder.references),f=obj(workOrder.financial),items=[];
  if(arr(refs.billIds).length===0&&num(f.serviceActual)>0) items.push({type:"vendor-bill",label:"VENDOR BILL MAY BE PENDING"});
  if(arr(refs.purchaseOrderIds).length>0&&num(f.committed)>0) items.push({type:"commitment",label:"OPEN COMMITMENT"});
  if(String(f.status||"").toLowerCase()!=="complete") items.push({type:"financial",label:"FINANCIAL OPEN"});
  return items;
}

export function getIXIWorkOrderCompletionState(workOrder={}){
  const w=obj(workOrder.work),f=obj(workOrder.financial);
  return {workComplete:["complete","closed"].includes(String(w.status||"").toLowerCase()),recordClosed:String(workOrder.recordStatus||"").toLowerCase()==="closed",financialComplete:String(f.status||"").toLowerCase()==="complete"};
}

export function getIXIWorkOrderReferenceCounts(workOrder={}){
  const r=obj(workOrder.references);
  return {time:arr(r.timeEntryIds).length,materials:arr(r.materialRecordIds).length,services:arr(r.serviceRecordIds).length,expenses:arr(r.expenseIds).length,purchaseOrders:arr(r.purchaseOrderIds).length,bills:arr(r.billIds).length,technology:arr(r.technologyWorkIds).length,attachments:arr(r.attachmentIds).length,notes:arr(r.noteIds).length};
}

export default {getIXIWorkOrderActuals,getIXIWorkOrderOpenItems,getIXIWorkOrderCompletionState,getIXIWorkOrderReferenceCounts};