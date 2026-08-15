const clean=value=>String(value??"").trim();
const num=value=>Number.isFinite(Number(value))?Number(value):0;
const obj=value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};

export const IXI_MATERIAL_SOURCE=Object.freeze(["inventory","manual"]);
export const IXI_MATERIAL_UNITS=Object.freeze(["EA","FT","YD"]);
export const IXI_MATERIAL_CONDITIONS=Object.freeze(["good","used","reconditioned","damaged","other"]);

export function createIXIMaterialDraft({context={},workOrder={},input={}}={}){
  const source=obj(input);
  const quantity=Math.max(0,num(source.quantity));
  const unitCost=Math.max(0,num(source.unitCost));
  const extendedCost=Math.round(quantity*unitCost*100)/100;
  return {
    schema:"ixi-material-usage-v1",
    identity:{materialUsageId:""},
    context:{
      primaryPassportId:clean(context?.primary?.passportId),
      primaryObjectId:clean(context?.primary?.objectId),
      entityPassportId:clean(context?.entity?.passportId),
      locationPassportId:clean(context?.location?.passportId),
      employeePassportId:clean(context?.actor?.passportId),
      employeeId:clean(context?.actor?.employeeId||context?.actor?.userId),
      workOrderId:clean(workOrder?.identity?.workOrderId),
      workOrderNumber:clean(workOrder?.identity?.number||workOrder?.workOrderNumber||workOrder?.number)
    },
    material:{
      source:IXI_MATERIAL_SOURCE.includes(clean(source.source))?clean(source.source):"manual",
      inventoryItemId:clean(source.inventoryItemId),
      inventoryPassportId:clean(source.inventoryPassportId),
      description:clean(source.description),
      sku:clean(source.sku),
      quantity,
      unit:IXI_MATERIAL_UNITS.includes(clean(source.unit).toUpperCase())?clean(source.unit).toUpperCase():"EA",
      unitCost,
      extendedCost,
      sourceLocationId:clean(source.sourceLocationId),
      sourceLocationLabel:clean(source.sourceLocationLabel),
      dateUsed:clean(source.dateUsed),
      condition:IXI_MATERIAL_CONDITIONS.includes(clean(source.condition))?clean(source.condition):"good",
      referenceNotes:clean(source.referenceNotes),
      notes:clean(source.notes)
    },
    attachments:Array.isArray(source.attachments)?source.attachments:[],
    inventoryAdjustment:clean(source.source)==="inventory"?{
      required:true,
      direction:"decrement",
      inventoryItemId:clean(source.inventoryItemId),
      inventoryPassportId:clean(source.inventoryPassportId),
      quantity,
      unit:IXI_MATERIAL_UNITS.includes(clean(source.unit).toUpperCase())?clean(source.unit).toUpperCase():"EA",
      sourceLocationId:clean(source.sourceLocationId),
      status:"pending"
    }:{required:false,status:"not-required"},
    status:"draft",
    createdAt:new Date().toISOString()
  };
}

export function validateIXIMaterial(material={}){
  const m=obj(material.material),errors={};
  if(!clean(m.description))errors.description="required";
  if(!(num(m.quantity)>0))errors.quantity="required";
  if(!(num(m.unitCost)>=0))errors.unitCost="required";
  if(!clean(m.dateUsed))errors.dateUsed="required";
  if(clean(m.source)==="inventory"&&!clean(m.sourceLocationLabel)&&!clean(m.sourceLocationId))errors.sourceLocation="required";
  return {valid:Object.keys(errors).length===0,errors};
}

export default {createIXIMaterialDraft,validateIXIMaterial,IXI_MATERIAL_SOURCE,IXI_MATERIAL_UNITS,IXI_MATERIAL_CONDITIONS};