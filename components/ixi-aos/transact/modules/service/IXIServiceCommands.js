import {createIXIAosObjectFinancialDocument,createIXIAosFinancialObjectReference} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import {createIXIServiceDraft,validateIXIService} from "./IXIServiceContract";
const clean=v=>String(v??"").trim();

export async function createIXIServiceRecord({object={},context={},workOrder={},input={},metadata={}}={}){
  const draft=createIXIServiceDraft({context,workOrder,input});
  const check=validateIXIService(draft);
  if(!check.valid){const error=new Error("Service entry incomplete");error.validation=check;throw error;}
  const refs=[];
  for(const [candidate,role] of [[context.location||{},"location"],[context.actor||{},"employee"]]){
    const ref=createIXIAosFinancialObjectReference({object:candidate,role});if(ref)refs.push(ref);
  }
  if(clean(input.vendorPassportId))refs.push({passportId:clean(input.vendorPassportId),role:"vendor",label:clean(input.vendorLabel),objectType:"vendor"});
  if(clean(draft.context.workOrderId||draft.context.workOrderNumber))refs.push({role:"work-order",label:draft.context.workOrderNumber,objectType:"work-order",externalId:draft.context.workOrderId||draft.context.workOrderNumber});
  const response=await createIXIAosObjectFinancialDocument({
    object,
    documentType:"service-order",
    input:{
      vendorId:draft.service.vendorId,
      vendorName:draft.service.vendorLabel,
      description:draft.service.description,
      transactionDate:draft.service.serviceDate,
      amount:draft.service.amount,
      currency:draft.service.currency,
      category:draft.service.category,
      referenceNumber:draft.service.referenceNumber,
      serviceLocation:draft.service.serviceLocation,
      notes:draft.service.notes,
      attachments:draft.attachments,
      reconciliation:draft.reconciliation,
      references:refs
    },
    additionalReferences:refs,
    metadata:{...metadata,transactModule:"service",serviceSchema:draft.schema,workOrderId:draft.context.workOrderId,workOrderNumber:draft.context.workOrderNumber}
  });
  return {draft:{...draft,status:"posted"},response};
}

export default {createIXIServiceRecord};