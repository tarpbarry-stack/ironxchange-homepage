import {createIXIAosWorkOrder} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import {createIXIWorkOrderDraft,normalizeIXIWorkOrder} from "./IXIWorkOrderContract";

const clean=v=>String(v??"").trim();
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};

export const IXI_WORK_ORDER_COMMANDS=Object.freeze({CREATE:"CREATE_WORK_ORDER",START:"START_WORK_ORDER",SCHEDULE:"SCHEDULE_WORK_ORDER",ASSIGN:"ASSIGN_WORK_ORDER",WAIT:"WAIT_WORK_ORDER",RESUME:"RESUME_WORK_ORDER",COMPLETE:"COMPLETE_WORK_ORDER",CLOSE:"CLOSE_WORK_ORDER",CANCEL:"CANCEL_WORK_ORDER",LINK_TIME:"LINK_TIME_ENTRY",LINK_MATERIAL:"LINK_MATERIAL_RECORD",LINK_SERVICE:"LINK_SERVICE_RECORD",LINK_EXPENSE:"LINK_EXPENSE",LINK_PO:"LINK_PURCHASE_ORDER",LINK_BILL:"LINK_BILL",LINK_TECHNOLOGY:"LINK_TECHNOLOGY_WORK",ADD_ATTACHMENT:"ADD_WORK_ORDER_ATTACHMENT",ADD_NOTE:"ADD_WORK_ORDER_NOTE"});

export function createIXIWorkOrderCommand(type,{workOrder={},actor={},patch={},metadata={}}={}){
  const wo=normalizeIXIWorkOrder(workOrder);
  return {schema:"ixi-work-order-command-v1",commandType:clean(type),workOrderId:clean(wo.identity.workOrderId),workOrderNumber:clean(wo.identity.number),revision:Number(wo.revision||1),actor:obj(actor),patch:obj(patch),metadata:obj(metadata),issuedAt:new Date().toISOString()};
}

export async function createIXIWorkOrder({object={},context={},input={},commandId="",idempotencyKey="",metadata={},apiBaseUrl="",headers={},signal}={}){
  const draft=createIXIWorkOrderDraft({context,input});
  const resolvedCommandId=clean(commandId||draft.identity.clientRequestId);
  if(!resolvedCommandId){const error=new Error("A stable work-order request ID is required.");error.code="IXI_WORK_ORDER_COMMAND_ID_REQUIRED";throw error;}
  const response=await createIXIAosWorkOrder({object,input:{currency:"USD",amount:0,description:draft.work.description||draft.work.title||"Work Order",status:draft.work.status,documentNumber:draft.identity.number,workOrder:draft,references:context.references||[]},commandId:resolvedCommandId,idempotencyKey:clean(idempotencyKey)||resolvedCommandId,metadata:{...obj(metadata),transactModule:"work-order",workOrderSchema:draft.schema},apiBaseUrl,headers,signal});
  const document=response?.financialDocument||response?.record?.financialDocument||{};
  const financialDocumentId=clean(document.financialDocumentId);
  const canonical={...draft,identity:{...draft.identity,clientRequestId:resolvedCommandId,workOrderId:financialDocumentId||draft.identity.workOrderId,number:clean(document.documentNumber)||financialDocumentId||draft.identity.number},financialBinding:{financialDocumentId,revision:Number(response?.record?.server?.revision||response?.record?.revision||1)}};
  return {draft:canonical,response};
}

export function startIXIWorkOrder(workOrder,actor={}){return createIXIWorkOrderCommand(IXI_WORK_ORDER_COMMANDS.START,{workOrder,actor,patch:{work:{status:"in-progress"},dates:{startedAt:new Date().toISOString()}}})}
export function waitIXIWorkOrder(workOrder,waitingReason,actor={}){return createIXIWorkOrderCommand(IXI_WORK_ORDER_COMMANDS.WAIT,{workOrder,actor,patch:{work:{status:"waiting",waitingReason:clean(waitingReason)}}})}
export function completeIXIWorkOrder(workOrder,{actor={},disposition="",finalMachineCondition="",workPerformed="",recommendations=""}={}){return createIXIWorkOrderCommand(IXI_WORK_ORDER_COMMANDS.COMPLETE,{workOrder,actor,patch:{work:{status:"complete"},dates:{completedAt:new Date().toISOString()},result:{disposition:clean(disposition),finalMachineCondition:clean(finalMachineCondition),workPerformed:clean(workPerformed),recommendations:clean(recommendations)}}})}
export function closeIXIWorkOrder(workOrder,actor={}){return createIXIWorkOrderCommand(IXI_WORK_ORDER_COMMANDS.CLOSE,{workOrder,actor,patch:{recordStatus:"closed",dates:{closedAt:new Date().toISOString()}}})}

export default {createIXIWorkOrder,createIXIWorkOrderCommand,startIXIWorkOrder,waitIXIWorkOrder,completeIXIWorkOrder,closeIXIWorkOrder};
