const clean=value=>String(value??"").trim();
const asArray=value=>Array.isArray(value)?value:[];

export const IXI_PHOTO_SCHEMA="ixi-photo-v1";
export const IXI_PHOTO_TYPES=Object.freeze(["work-photo","damage","before-after","reference"]);

function normalizePhotoType(value){
 const candidate=clean(value).toLowerCase();
 return IXI_PHOTO_TYPES.includes(candidate)?candidate:"work-photo";
}

function normalizeTags(value){
 if(Array.isArray(value))return [...new Set(value.map(clean).filter(Boolean))];
 return [...new Set(clean(value).split(",").map(clean).filter(Boolean))];
}

function normalizeMedia(media=[],photoId=""){
 return asArray(media).map((item,index)=>({
  mediaId:clean(item.mediaId||item.id)||`${photoId||"PHOTO"}-MEDIA-${index+1}`,
  fileName:clean(item.fileName||item.name)||`photo-${index+1}.jpg`,
  mimeType:clean(item.mimeType||item.type)||"image/jpeg",
  size:Number(item.size||0),
  width:Number(item.width||0),
  height:Number(item.height||0),
  previewUrl:clean(item.previewUrl),
  status:clean(item.status)||"local-pending-upload"
 }));
}

export function createIXIPhotoDraft({context={},workOrder={},input={}}={}){
 const actor=context.actor||{};
 const photoId=clean(input.photoId||input.clientRequestId);
 const workOrderId=clean(workOrder.identity?.workOrderId);
 const workOrderNumber=clean(workOrder.identity?.number||workOrder.workOrderNumber||workOrder.number);
 const occurredAt=clean(input.occurredAt)||new Date().toISOString();
 return{
  schema:IXI_PHOTO_SCHEMA,
  identity:{photoId,clientRequestId:clean(input.clientRequestId)},
  context:{
   primaryPassportId:clean(context.primary?.passportId),
   primaryObjectId:clean(context.primary?.objectId),
   primaryObjectType:clean(context.primary?.objectType),
   primaryLabel:clean(context.primary?.label),
   entityPassportId:clean(context.entity?.passportId),
   locationPassportId:clean(context.location?.passportId),
   locationLabel:clean(context.location?.label),
   employeePassportId:clean(actor.passportId),
   employeeId:clean(actor.employeeId||actor.userId),
   employeeLabel:clean(actor.displayName||actor.name||actor.label),
   workOrderId,
   workOrderNumber
  },
  photo:{
   type:normalizePhotoType(input.photoType),
   title:clean(input.title),
   description:clean(input.description),
   occurredAt,
   linkedRecordType:"work-order",
   linkedRecordId:workOrderId||workOrderNumber,
   linkedRecordLabel:workOrderNumber,
   tags:normalizeTags(input.tags),
   visibility:clean(input.visibility)||"work-order-team",
   media:normalizeMedia(input.media,photoId)
  },
  status:"draft",
  audit:{
   createdAt:occurredAt,
   createdBy:clean(actor.userId||actor.employeeId||actor.passportId),
   createdByLabel:clean(actor.displayName||actor.name||actor.label)
  }
 };
}

export function validateIXIPhoto(draft={}){
 const errors={};
 if(!asArray(draft.photo?.media).length)errors.media="required";
 if(!IXI_PHOTO_TYPES.includes(clean(draft.photo?.type)))errors.photoType="invalid";
 return{valid:Object.keys(errors).length===0,errors};
}

export default{createIXIPhotoDraft,validateIXIPhoto};
