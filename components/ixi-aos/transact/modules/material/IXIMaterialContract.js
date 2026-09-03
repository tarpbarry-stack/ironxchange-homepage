const clean = (value) => String(value ?? "").trim();
const obj = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
const finite = (value) =>
  value !== "" &&
  value !== null &&
  value !== undefined &&
  Number.isFinite(Number(value));
const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const IXI_MATERIAL_SCHEMA = "ixi-material-usage-v2";
export const IXI_MATERIAL_SOURCE = Object.freeze([
  "inventory",
  "manual",
  "purchase-order",
  "existing-supply",
]);
export const IXI_MATERIAL_UNITS = Object.freeze([
  "EA",
  "FT",
  "YD",
  "GAL",
  "QT",
  "LB",
  "OZ",
  "SET",
  "BOX",
  "ROLL",
  "LOT",
]);
export const IXI_MATERIAL_CONDITIONS = Object.freeze([
  "good",
  "used",
  "reconditioned",
  "damaged",
  "other",
]);

export function normalizeIXIMaterialSource(value = "") {
  const source = clean(value).toLowerCase();
  return IXI_MATERIAL_SOURCE.includes(source) ? source : "manual";
}

export function createIXIMaterialDraft({
  context = {},
  workOrder = {},
  input = {},
} = {}) {
  const source = obj(input);
  const quantityProvided = finite(source.quantity);
  const unitCostProvided = finite(source.unitCost);
  const quantity = quantityProvided ? Number(source.quantity) : null;
  const unitCost = unitCostProvided ? Number(source.unitCost) : null;
  const extendedCost =
    quantityProvided && unitCostProvided
      ? roundMoney(quantity * unitCost)
      : null;
  const sourceType = normalizeIXIMaterialSource(source.source);
  const primary = obj(context.primary);
  const location = obj(context.location);
  const actor = obj(context.actor);
  const entity = obj(context.entity);
  const unitCandidate = clean(source.unit).toUpperCase();
  const unit = IXI_MATERIAL_UNITS.includes(unitCandidate)
    ? unitCandidate
    : "EA";
  const availableQuantity = finite(source.availableQuantity)
    ? Number(source.availableQuantity)
    : null;
  const workOrderId = clean(
    workOrder?.financialBinding?.financialDocumentId ||
      workOrder?.identity?.workOrderId ||
      workOrder?.identity?.techWorkOrderId ||
      workOrder?.financialDocumentId,
  );

  return {
    schema: IXI_MATERIAL_SCHEMA,
    identity: {
      materialUsageId: clean(source.materialUsageId),
      clientRequestId: clean(source.clientRequestId),
      number: clean(source.number),
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
      employeePassportId: clean(source.employeePassportId || actor.passportId),
      employeeId: clean(
        source.employeeId || actor.employeeId || actor.userId || actor.id,
      ),
      employeeLabel: clean(actor.displayName || actor.name || actor.label),
      workOrderId,
      workOrderNumber: clean(
        workOrder?.identity?.number ||
          workOrder?.workOrderNumber ||
          workOrder?.number,
      ),
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
      availableQuantity,
      sourceLocationId: clean(source.sourceLocationId),
      sourceLocationLabel: clean(source.sourceLocationLabel),
      dateUsed: clean(source.dateUsed),
      condition: IXI_MATERIAL_CONDITIONS.includes(clean(source.condition))
        ? clean(source.condition)
        : "good",
      referenceNotes: clean(source.referenceNotes),
      notes: clean(source.notes),
    },
    costAttribution: {
      amount: extendedCost,
      currency: clean(source.currency || "USD").toUpperCase(),
      economicEvent: false,
      sourceDocumentType: sourceType,
      note: "Physical cost attribution only; this record does not create a second cash-spend event.",
    },
    attachments: Array.isArray(source.attachments) ? source.attachments : [],
    inventoryAdjustment:
      sourceType === "inventory"
        ? {
            required: true,
            direction: "decrement",
            inventoryItemId: clean(source.inventoryItemId),
            inventoryPassportId: clean(source.inventoryPassportId),
            quantity,
            unit,
            sourceLocationId: clean(source.sourceLocationId),
            status: "pending",
          }
        : { required: false, status: "not-required" },
    receivingConsumption:
      sourceType === "purchase-order"
        ? {
            required: true,
            purchaseOrderId: clean(source.purchaseOrderId),
            purchaseOrderNumber: clean(source.purchaseOrderNumber),
            purchaseOrderLineId: clean(source.purchaseOrderLineId),
            receivingRecordId: clean(source.receivingRecordId),
            quantity,
            unit,
            status: "pending",
          }
        : { required: false, status: "not-required" },
    status: "draft",
    createdAt: new Date().toISOString(),
  };
}

export function validateIXIMaterial(usage = {}) {
  const m = obj(usage.material);
  const errors = {};
  if (!clean(usage.context?.primaryPassportId))
    errors.primary = "passport-required";
  if (!clean(usage.context?.employeePassportId || usage.context?.employeeId))
    errors.employee = "required";
  if (!clean(m.description)) errors.description = "required";
  if (!finite(m.quantity) || !(Number(m.quantity) > 0))
    errors.quantity = "required";
  if (!finite(m.unitCost) || Number(m.unitCost) < 0)
    errors.unitCost = "required";
  if (!clean(m.dateUsed)) errors.dateUsed = "required";
  if (m.source === "inventory") {
    if (!clean(m.inventoryItemId || m.inventoryPassportId))
      errors.inventoryItem = "required";
    if (!clean(m.sourceLocationLabel || m.sourceLocationId))
      errors.sourceLocation = "required";
    if (
      !finite(m.availableQuantity) ||
      Number(m.quantity) > Number(m.availableQuantity)
    )
      errors.quantity = "exceeds-available";
  }
  if (m.source === "purchase-order") {
    if (!clean(m.purchaseOrderId || m.purchaseOrderNumber))
      errors.purchaseOrder = "required";
    if (
      !finite(m.availableQuantity) ||
      Number(m.quantity) > Number(m.availableQuantity)
    )
      errors.quantity = "exceeds-available";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export default {
  IXI_MATERIAL_SCHEMA,
  createIXIMaterialDraft,
  validateIXIMaterial,
  normalizeIXIMaterialSource,
  IXI_MATERIAL_SOURCE,
  IXI_MATERIAL_UNITS,
  IXI_MATERIAL_CONDITIONS,
};
