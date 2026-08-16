const clean = value => String(value ?? "").trim();

function finiteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return Math.round(finiteNumber(value) * 100) / 100;
}

function validDateOnly(value) {
  const candidate = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return false;
  const date = new Date(`${candidate}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

export const IXI_PURCHASE_SCHEMA = "ixi-purchase-v1";

export const IXI_PURCHASE_REQUEST_TYPES = Object.freeze([
  "purchase-request",
  "purchase-order"
]);

export const IXI_PURCHASE_PRIORITIES = Object.freeze([
  "normal",
  "high",
  "critical"
]);

function normalizeRequestType(value) {
  return value === "purchase-order" ? "purchase-order" : "purchase-request";
}

function normalizePriority(value) {
  const candidate = clean(value).toLowerCase();
  return IXI_PURCHASE_PRIORITIES.includes(candidate) ? candidate : "normal";
}

function normalizeCurrency(value) {
  const candidate = clean(value || "USD").toUpperCase();
  return /^[A-Z]{3}$/.test(candidate) ? candidate : "USD";
}

function normalizeLine(line = {}, index = 0) {
  // Preserve the signed numeric values in the canonical draft so validation can
  // reject bad input. Do not silently coerce a negative price/quantity to zero.
  const quantity = finiteNumber(line.quantity);
  const estimatedUnitCost = money(line.estimatedUnitCost);

  return {
    lineId: clean(line.lineId) || `LINE-${index + 1}`,
    description: clean(line.description),
    quantity,
    unit: clean(line.unit || "EA").toUpperCase(),
    estimatedUnitCost,
    estimatedTotal: money(quantity * estimatedUnitCost)
  };
}

export function createIXIPurchaseDraft({
  context = {},
  workOrder = {},
  input = {}
} = {}) {
  const requestType = normalizeRequestType(input.requestType);
  const items = (Array.isArray(input.items) ? input.items : [])
    .map(normalizeLine)
    .filter(line => line.description || line.quantity || line.estimatedUnitCost);

  const subtotal = money(
    items.reduce((sum, line) => sum + line.estimatedTotal, 0)
  );

  const estimatedShipping = money(input.estimatedShipping);
  const estimatedTotal = money(subtotal + estimatedShipping);

  const workOrderId = clean(workOrder.identity?.workOrderId);
  const workOrderNumber = clean(
    workOrder.identity?.number ||
      workOrder.workOrderNumber ||
      workOrder.number
  );

  return {
    schema: IXI_PURCHASE_SCHEMA,
    identity: {
      purchaseId: clean(input.purchaseId),
      purchaseNumber: clean(input.purchaseNumber),
      clientRequestId: clean(input.clientRequestId)
    },
    context: {
      primaryPassportId: clean(context.primary?.passportId),
      primaryObjectId: clean(context.primary?.objectId),
      entityPassportId: clean(context.entity?.passportId),
      locationPassportId: clean(context.location?.passportId),
      employeePassportId: clean(context.actor?.passportId),
      employeeId: clean(context.actor?.employeeId || context.actor?.userId),
      workOrderId,
      workOrderNumber
    },
    purchase: {
      requestType,
      vendorId: clean(input.vendorId),
      vendorPassportId: clean(input.vendorPassportId),
      vendorLabel: clean(input.vendorLabel),
      neededByDate: clean(input.neededByDate),
      priority: normalizePriority(input.priority),
      chargeTo: clean(input.chargeTo) || workOrderNumber,
      costCode: clean(input.costCode),
      currency: normalizeCurrency(input.currency),
      items,
      subtotal,
      estimatedShipping,
      estimatedTotal,
      notes: clean(input.notes),
      attachments: Array.isArray(input.attachments) ? input.attachments : []
    },
    reconciliation: {
      billMatchStatus: "unmatched",
      linkedBillIds: [],
      receiptMatchStatus: "unmatched",
      linkedReceiptIds: []
    },
    financial: {
      state: requestType === "purchase-order" ? "committed" : "requested",
      requestedAmount: estimatedTotal,
      committedAmount: requestType === "purchase-order" ? estimatedTotal : 0
    },
    status: "draft",
    createdAt: clean(input.createdAt) || new Date().toISOString()
  };
}

export function validateIXIPurchase(draft = {}) {
  const errors = {};
  const purchase = draft.purchase || {};
  const items = Array.isArray(purchase.items) ? purchase.items : [];

  if (!clean(purchase.vendorLabel)) {
    errors.vendor = "required";
  }

  if (!validDateOnly(purchase.neededByDate)) {
    errors.neededByDate = clean(purchase.neededByDate) ? "invalid" : "required";
  }

  if (!IXI_PURCHASE_REQUEST_TYPES.includes(clean(purchase.requestType))) {
    errors.requestType = "invalid";
  }

  if (!IXI_PURCHASE_PRIORITIES.includes(clean(purchase.priority))) {
    errors.priority = "invalid";
  }

  if (!/^[A-Z]{3}$/.test(clean(purchase.currency))) {
    errors.currency = "invalid";
  }

  if (finiteNumber(purchase.estimatedShipping) < 0) {
    errors.estimatedShipping = "invalid";
  }

  const validItems = items.filter(line =>
    clean(line.description) &&
    finiteNumber(line.quantity) > 0 &&
    finiteNumber(line.estimatedUnitCost) >= 0
  );

  if (!validItems.length) {
    errors.items = "required";
  }

  const invalidLine = items.find(line =>
    !clean(line.description) ||
    finiteNumber(line.quantity) <= 0 ||
    finiteNumber(line.estimatedUnitCost) < 0 ||
    !clean(line.unit)
  );

  if (invalidLine) {
    errors.itemLine = "invalid";
  }

  if (finiteNumber(purchase.subtotal) < 0 || finiteNumber(purchase.estimatedTotal) < 0) {
    errors.total = "invalid";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export default {
  createIXIPurchaseDraft,
  validateIXIPurchase
};
