export const IXI_FREIGHT_PURPOSES = Object.freeze([
  ["acquisition-inbound","ACQUISITION INBOUND"],
  ["sale-preparation","SALE PREPARATION"],
  ["customer-delivery","CUSTOMER DELIVERY"],
  ["yard-transfer","YARD TRANSFER"],
  ["service-outbound","SERVICE OUTBOUND"],
  ["service-return","SERVICE RETURN"],
  ["auction-move","AUCTION MOVE"],
  ["rental-delivery","RENTAL DELIVERY"],
  ["rental-return","RENTAL RETURN"],
  ["demo","DEMO"],
  ["internal-reposition","INTERNAL REPOSITION"],
  ["other","OTHER"]
]);

const clean=value=>String(value??"").trim();
const num=value=>Number.isFinite(Number(value))?Number(value):0;
const money=value=>Math.round(num(value)*100)/100;

export function getFreightEntityId(context={},object={}){
  return clean(object.entityId||object.fields?.entityId||context.entity?.entityId||context.entity?.id||context.entity?.passportId);
}

export function getFreightAsset(context={},object={}){
  const primary=context.primary||{};
  return {
    objectId:clean(primary.objectId||object.objectId||object.id),
    passportId:clean(primary.passportId||object.passportId||object.ixiPassportId),
    objectType:clean(primary.objectType||object.objectType||object.type),
    label:clean(primary.label||object.displayName||object.name||object.title),
    year:clean(object.year||object.fields?.year),
    make:clean(object.make||object.fields?.make),
    model:clean(object.model||object.fields?.model),
    serialNumber:clean(object.serialNumber||object.fields?.serialNumber||object.fields?.serial)
  };
}

export function getCurrentMoveOrigin(context={},object={}){
  return {
    objectId:clean(object.currentLocationObjectId||object.locationObjectId||object.fields?.locationObjectId||object.containerId||object.currentContainerId),
    containerId:clean(object.currentContainerId||object.containerId||object.fields?.containerId||object.locationObjectId),
    passportId:clean(context.location?.passportId||object.locationPassportId||object.fields?.locationPassportId),
    label:clean(context.location?.label||object.location||object.fields?.location||object.currentLocationLabel)
  };
}

export function calculateFreightExpected({agreedAmount=0,permitEstimate=0,escortEstimate=0,fuelSurchargeEstimate=0,otherEstimate=0,routeMiles=0}={}){
  const expectedTotal=money(num(agreedAmount)+num(permitEstimate)+num(escortEstimate)+num(fuelSurchargeEstimate)+num(otherEstimate));
  const miles=Math.max(0,num(routeMiles));
  return {expectedTotal,expectedPerMile:miles>0?money(expectedTotal/miles):0};
}

export function validateFreightDraft({asset={},destination={},execution={},mode="external-carrier"}={}){
  const errors={};
  if(!clean(asset.objectId)||!clean(asset.passportId))errors.asset="Asset Passport/object identity required.";
  if(!clean(destination.objectId||destination.containerId))errors.destination="Choose a real AOS destination.";
  if(mode==="external-carrier"&&!clean(execution.carrierPassportId||execution.carrierName))errors.carrier="Carrier is required before award/dispatch.";
  return {valid:Object.keys(errors).length===0,errors};
}
