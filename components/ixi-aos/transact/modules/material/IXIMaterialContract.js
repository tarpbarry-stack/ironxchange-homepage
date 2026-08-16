const clean = value => String(value ?? "").trim();
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const obj = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

export const IXI_MATERIAL_SOURCE = Object.freeze([
  "inventory",
  "purchase-order",
  "existing-supply",
  "manual"
]);

export const IXI_MATERIAL_UNITS = Object.freeze([
  "EA", "FT", "YD", "GAL", "QT", "LB", "OZ", "SET", "BOX", "ROLL", "LOT"
]);

export const IXI_MATERIAL_CONDITIONS = Object.freeze([
  "good", "used", "reconditioned", "damaged", "other"
]);

export function normalizeIXIMaterialSource(value = "") {
  const source = clean(value).toLowerCase();
  if (source === "manual") return "existing-supply";
  return IXI_MATERIAL_SOURCE.includes(source) ? source : "existing-supply";
}

export function createIXIMaterialDraft({ context = {}, workOrder = {}, input = {} } = {}) {
  const source = obj(input);
  const quantity = Math.max(0, num(source.quantity));
  const unitCost = Math.max(0, num(source.unitCost));
  const extendedCost = Math.round(quantity * unitCost * 100) / 100;
  const sourceType = normalizeIXIMaterialSource(source.source);
  const unitCandidate = clean(source.unit).toUpperCase();
  const unit = IXI_MATERIAL_UNITS.includes(unitCandidate) ? unitCandidate : "EA";
  const primary = obj(context.primary);
  const location = obj(context.location);
  const actor = obj(context.actor);
  const entity = obj(context.entity);

  return {
    schema: "ixi-material-usage-v1",
    identity: {
      materialUsageId: clean(source.materialUsageId),
      clientRequestId: clean(source.clientRequestId)
    },
    context: {
      primaryPassportId: clean(primary.passportId),
      primaryObjectId: clean(primary.objectId),
      primaryObjectType: clean(primary.objectType),
      primaryLabel: clean(primary.label),
      entityPassportId: clean(entity.passportId),
      entityLabel: clean(entity.label),
      locationPassportId: clean(location.passportId),
      locationObjectId: clean(location.objectId),
      locationLabel: clean(location.label),
      employeePassportId: clean(actor.passportId),
      employeeId: clean(actor.employeeId || actor.userId),
      employeeLabel: clean(actor.displayName || actor.name || actor.label),
      workOrderId: clean(workOrder?.identity?.workOrderId),
      techWorkOrderId: clean(workOrder?.identity?.techWorkOrderId),
      workOrderNumber: clean(workOrder?.identity?.number || workOrder?.workOrderNumber || workOrder?.number)
    },
    material: {
      source: sourceType,
      inventoryItemId: clean(source.inventoryItemId),
      inventoryPassportId: clean(source.inventoryPassportId),
      purchaseOrderId: clean(source.purchaseOrderId),
      purchaseOrderNumber: clean(source.purchaseOrderNumber),
      purchaseOrderLineId: clean(source.purchaseOrderLineId),
      receivingRecordId: clean(source.receivingRecordId),
      description: clean(source.description),
      sku: clean(source.sku),
      quantity,
      unit,
      unitCost,
      extendedCost,
      availableQuantity: Math.max(0, num(source.availableQuantity)),
      sourceLocationId: clean(source.sourceLocationId),
      sourceLocationLabel: clean(source.sourceLocationLabel),
      dateUsed: clean(source.dateUsed),
      condition: IXI_MATERIAL_CONDITIONS.includes(clean(source.condition)) ? clean(source.condition) : "good",
      referenceNotes: clean(source.referenceNotes),
      notes: clean(source.notes)
    },
    costAttribution: {
      amount: extendedCost,
      currency: clean(source.currency || "USD") || "USD",
      economicEvent: false,
      sourceDocumentType:
        sourceType === "purchase-order" ? "purchase-order" :
        sourceType === "inventory" ? "inventory" :
        "existing-supply",
      note: "Material cost is attributed to the originating AOS context; this record does not create a second cash-spend event."
    },
    attachments: Array.isArray(source.attachments) ? source.attachments : [],
    inventoryAdjustment: sourceType === "inventory" ? {
      required: true,
      direction: "decrement",
      inventoryItemId: clean(source.inventoryItemId),
      inventoryPassportId: clean(source.inventoryPassportId),
      quantity,
      unit,
      sourceLocationId: clean(source.sourceLocationId),
      status: "pending-inventory-service"
    } : {
      required: false,
      status: "not-required"
    },
    receivingConsumption: sourceType === "purchase-order" ? {
      required: true,
      purchaseOrderId: clean(source.purchaseOrderId),
      purchaseOrderNumber: clean(source.purchaseOrderNumber),
      purchaseOrderLineId: clean(source.purchaseOrderLineId),
      receivingRecordId: clean(source.receivingRecordId),
      quantity,
      unit,
      status: "pending-purchase-record-service"
    } : {
      required: false,
      status: "not-required"
    },
    status: "draft",
    createdAt: new Date().toISOString()
  };
}

export function validateIXIMaterial(material = {}) {
  const m = obj(material.material);
  const errors = {};
  if (!clean(m.description)) errors.description = "required";
  if (!(num(m.quantity) > 0)) errors.quantity = "required";
  if (!(num(m.unitCost) >= 0)) errors.unitCost = "required";
  if (!clean(m.dateUsed)) errors.dateUsed = "required";
  if (clean(m.source) === "inventory" && !clean(m.sourceLocationLabel) && !clean(m.sourceLocationId)) errors.sourceLocation = "required";
  if (clean(m.source) === "purchase-order" && !clean(m.purchaseOrderId || m.purchaseOrderNumber)) errors.purchaseOrder = "required";
  if (clean(m.source) === "purchase-order" && m.availableQuantity > 0 && num(m.quantity) > num(m.availableQuantity)) errors.quantity = "exceeds-available";
  return { valid: Object.keys(errors).length === 0, errors };
}

export default {
  createIXIMaterialDraft,
  validateIXIMaterial,
  normalizeIXIMaterialSource,
  IXI_MATERIAL_SOURCE,
  IXI_MATERIAL_UNITS,
  IXI_MATERIAL_CONDITIONS
};