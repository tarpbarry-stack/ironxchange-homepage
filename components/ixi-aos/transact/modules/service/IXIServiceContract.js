const clean=v=>String(v??"").trim();
const num=v=>Number.isFinite(Number(v))?Number(v):0;

export function createIXIServiceDraft({context={},workOrder={},input={}}={}){
  const workOrderId=clean(workOrder.identity?.workOrderId);
  const workOrderNumber=clean(workOrder.identity?.number||workOrder.workOrderNumber||workOrder.number);
  return {
    schema:"ixi-service-entry-v1",
    identity:{serviceRecordId:""},
    context:{
      primaryPassportId:clean(context.primary?.passportId),
      primaryObjectId:clean(context.primary?.objectId),
      entityPassportId:clean(context.entity?.passportId),
      locationPassportId:clean(context.location?.passportId),
      employeePassportId:clean(context.actor?.passportId),
      employeeId:clean(context.actor?.employeeId),
      workOrderId,
      workOrderNumber
    },
    service:{
      vendorPassportId:clean(input.vendorPassportId),
      vendorId:clean(input.vendorId),
      vendorLabel:clean(input.vendorLabel),
      description:clean(input.description),
      serviceDate:clean(input.serviceDate),
      referenceNumber:clean(input.referenceNumber),
      amount:num(input.amount),
      currency:clean(input.currency||"USD").toUpperCase(),
      category:clean(input.category),
      serviceLocation:clean(input.serviceLocation),
      notes:clean(input.notes)
    },
    attachments:Array.isArray(input.attachments)?input.attachments:[],
    reconciliation:{
      billMatchStatus:"unmatched",
      linkedBillIds:[],
      matchKeys:{
        vendorLabel:clean(input.vendorLabel),
        referenceNumber:clean(input.referenceNumber),
        amount:num(input.amount),
        currency:clean(input.currency||"USD").toUpperCase(),
        serviceDate:clean(input.serviceDate)
      }
    },
    status:"draft",
    createdAt:new Date().toISOString()
  };
}

export function validateIXIService(draft={}){
  const errors={};
  if(!clean(draft.service?.vendorLabel))errors.vendor="required";
  if(!clean(draft.service?.description))errors.description="required";
  if(!clean(draft.service?.serviceDate))errors.serviceDate="required";
  if(!(num(draft.service?.amount)>0))errors.amount="required";
  return {valid:Object.keys(errors).length===0,errors};
}

export default {createIXIServiceDraft,validateIXIService};