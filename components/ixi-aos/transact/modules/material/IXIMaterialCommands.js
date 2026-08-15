import {createIXIAosObjectFinancialDocument,createIXIAosFinancialObjectReference} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import {createIXIMaterialDraft,validateIXIMaterial} from "./IXIMaterialContract";
const clean=value=>String(value??"").trim();

export async function createIXIMaterialUsage({object={},context={},workOrder={},input={},commandId="",idempotencyKey="",metadata={},apiBaseUrl="",headers={},signal}={}){
  const draft=createIXIMaterialDraft({context,workOrder,input});
  const validation=validateIXIMaterial(draft);
  if(!validation.valid){const error=new Error("Material usage is incomplete");error.validation=validation;throw error;}
  const additionalReferences=[];
  const locationRef=createIXIAosFinancialObjectReference({object:context.location||{},role:"location"});
  if(locationRef)additionalReferences.push(locationRef);
  const employeeRef=createIXIAosFinancialObjectReference({object:context.actor||{},role:"employee"});
  if(employeeRef)additionalReferences.push(employeeRef);
  const response=await createIXIAosObjectFinancialDocument({
    object,
    documentType:"material-usage",
    input:{
      currency:"USD",
      amount:draft.material.extendedCost,
      description:draft.material.description,
      status:"posted",
      material:draft.material,
      inventoryAdjustment:draft.inventoryAdjustment,
      attachments:draft.attachments,
      references:additionalReferences
    },
    additionalReferences,
    commandId,
    idempotencyKey,
    metadata:{...metadata,transactModule:"material",materialSchema:draft.schema,workOrderId:draft.context.workOrderId,workOrderNumber:draft.context.workOrderNumber,inventoryAdjustmentRequired:Boolean(draft.inventoryAdjustment?.required)},
    apiBaseUrl,
    headers,
    signal
  });
  return {draft:{...draft,status:"posted"},response};
}

export default {createIXIMaterialUsage};