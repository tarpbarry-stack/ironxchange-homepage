const clean=value=>String(value??"").trim();
const asArray=value=>Array.isArray(value)?value:[];

export const IXI_NOTE_SCHEMA="ixi-note-v1";
export const IXI_NOTE_TYPES=Object.freeze(["work-note","issue","recommendation"]);

function normalizeType(value){
 const next=clean(value).toLowerCase();
 return IXI_NOTE_TYPES.includes(next)?next:"work-note";
}

function normalizeVisibility(value){
 const next=clean(value).toLowerCase();
 return next||"work-order-team";
}

export function createIXINoteDraft({context={},workOrder={},input={}}={}){
 const now=clean(input.createdAt)||new Date().toISOString();
 const workOrderId=clean(workOrder.identity?.workOrderId||workOrder.workOrderId||workOrder.id);
 const workOrderNumber=clean(workOrder.identity?.number||workOrder.workOrderNumber||workOrder.number);
 const actor=context.actor||{};
 const attachment= input.attachment && typeof input.attachment==="object" ? input.attachment : null;
 return{
  schema:IXI_NOTE_SCHEMA,
  identity:{
   noteId:clean(input.noteId),
   clientRequestId:clean(input.clientRequestId)
  },
  context:{
   primaryPassportId:clean(context.primary?.passportId),
   primaryObjectId:clean(context.primary?.objectId),
   entityPassportId:clean(context.entity?.passportId),
   locationPassportId:clean(context.location?.passportId),
   employeePassportId:clean(actor.passportId),
   employeeId:clean(actor.employeeId||actor.userId),
   workOrderId,
   workOrderNumber
  },
  note:{
   type:normalizeType(input.type),
   title:clean(input.title),
   body:clean(input.body),
   noteDate:clean(input.noteDate)||now.slice(0,10),
   visibility:normalizeVisibility(input.visibility),
   tags:asArray(input.tags).map(clean).filter(Boolean),
   voiceTranscript:clean(input.voiceTranscript),
   attachments:attachment?[attachment]:asArray(input.attachments)
  },
  flags:{
   surfaceAtCloseout:["issue","recommendation"].includes(normalizeType(input.type)),
   resolved:false
  },
  status:"draft",
  audit:{
   createdBy:clean(actor.userId||actor.employeeId||actor.passportId),
   createdByLabel:clean(actor.displayName||actor.name||actor.label),
   createdAt:now,
   updatedAt:now
  }
 };
}

export function validateIXINote(draft={}){
 const errors={};
 if(!clean(draft.note?.body))errors.body="required";
 if(!IXI_NOTE_TYPES.includes(clean(draft.note?.type)))errors.type="invalid";
 return{valid:Object.keys(errors).length===0,errors};
}

export default{createIXINoteDraft,validateIXINote};
