const clean = value => String(value ?? "").trim();
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
export const money = value => Math.round(number(value) * 100) / 100;

export const IXI_FREIGHT_PURPOSES = Object.freeze([
  "acquisition-inbound", "sale-preparation", "customer-delivery", "yard-transfer",
  "service-outbound", "service-return", "auction-move", "rental-delivery",
  "rental-return", "demo", "internal-reposition", "other"
]);

export const IXI_FREIGHT_ACTION_BY_STATUS = Object.freeze({
  draft:"request", requested:"award", awarded:"dispatch", dispatched:"pickup",
  "picked-up":"deliver", "in-transit":"deliver"
});

export function createIXIFreightOrderInput({ context = {}, object = {}, input = {} } = {}) {
  const fields = object.fields || {};
  return {
    commandId:clean(input.commandId),
    asset:{
      objectId:clean(context.primary?.objectId || object.objectId || object.mosObjectId),
      passportId:clean(context.primary?.passportId || object.passportId),
      label:clean(context.primary?.label || object.displayName || object.title),
      objectType:clean(context.primary?.objectType || object.objectType || "machine"),
      year:clean(fields.year || object.year), make:clean(fields.make || object.make), model:clean(fields.model || object.model),
      serialNumber:clean(fields.serialNumber || object.serialNumber), weight:number(input.weight)
    },
    purpose:clean(input.purpose || "other"),
    route:{
      origin:{ objectId:clean(input.originObjectId), label:clean(input.originLabel), address:clean(input.originAddress) },
      destination:{ containerId:clean(input.destinationObjectId), objectId:clean(input.destinationObjectId), label:clean(input.destinationLabel), address:clean(input.destinationAddress) },
      routeMiles:number(input.routeMiles), mileageBasis:clean(input.mileageBasis || "route"), manualOverride:Boolean(input.manualOverride)
    },
    execution:{
      mode:clean(input.mode || "external-carrier"), carrierPassportId:clean(input.carrierPassportId), carrierName:clean(input.carrierName),
      truckPassportId:clean(input.truckPassportId), trailerPassportId:clean(input.trailerPassportId), driverPassportId:clean(input.driverPassportId),
      requestedPickupAt:clean(input.requestedPickupAt), scheduledPickupAt:clean(input.scheduledPickupAt), expectedDeliveryAt:clean(input.expectedDeliveryAt)
    },
    economics:{
      quotedAmount:money(input.quotedAmount), agreedAmount:money(input.agreedAmount), permitEstimate:money(input.permitEstimate),
      escortEstimate:money(input.escortEstimate), fuelSurchargeEstimate:money(input.fuelSurchargeEstimate), otherEstimate:money(input.otherEstimate)
    },
    metadata:{ payer:clean(input.payer || "company"), customerRebill:Boolean(input.customerRebill), acquisitionCost:clean(input.purpose)==="acquisition-inbound", notes:clean(input.notes) }
  };
}

export function validateIXIFreightOrderInput(payload = {}) {
  const errors = {};
  if (!clean(payload?.asset?.passportId)) errors.asset = "Machine IXI Passport is required.";
  if (!clean(payload?.route?.origin?.label || payload?.route?.origin?.address || payload?.route?.origin?.objectId)) errors.origin = "Origin is required.";
  if (!clean(payload?.route?.destination?.label || payload?.route?.destination?.address || payload?.route?.destination?.objectId)) errors.destination = "Destination is required.";
  if (!IXI_FREIGHT_PURPOSES.includes(clean(payload.purpose))) errors.purpose = "Purpose is invalid.";
  if (payload.execution?.mode === "external-carrier" && !clean(payload.execution?.carrierName)) errors.carrierName = "Carrier is required for an external load.";
  if (number(payload.economics?.agreedAmount) < 0) errors.agreedAmount = "Agreed amount cannot be negative.";
  return { valid:Object.keys(errors).length===0, errors };
}

export function invoiceCharges(input = {}) {
  const charges = {
    freight:money(input.freight), permits:money(input.permits), escort:money(input.escort), detention:money(input.detention),
    fuelSurcharge:money(input.fuelSurcharge), other:money(input.other)
  };
  return { charges, amount:money(Object.values(charges).reduce((sum, value)=>sum+value,0)) };
}

export function freightVariance(order = {}) {
  const expected = money(order?.economics?.expectedTotal);
  const actual = money(order?.economics?.actualTotal);
  const variance = money(actual - expected);
  const tolerance = Math.max(50, Math.abs(expected) * 0.05);
  return { expected, actual, variance, tolerance, approvalRequired:Math.abs(variance)>tolerance };
}

export default { createIXIFreightOrderInput, validateIXIFreightOrderInput, invoiceCharges, freightVariance };
