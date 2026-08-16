const clean = value => String(value ?? "").trim();

const MAX_PURCHASE_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const PURCHASE_ATTACHMENT_MIME_TYPES = Object.freeze([
  "application/pdf",
  "image/jpeg",
  "image/png"
]);

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

export const IXI_PURCHASE_SCHEMA = "ixi-purchase-v2";

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
  // Preserve signed values so validation can reject bad input instead of
  // silently converting invalid quantities/prices into legitimate zeroes.
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

  const workOrderId = clean(
    workOrder.identity?.workOrderId ||
    workOrder.workOrderId ||
    input.workOrderId
  );
  const workOrderNumber = clean(
    workOrder.identity?.number ||
    workOrder.workOrderNumber ||
    workOrder.number ||
    input.workOrderNumber
  );

  const actor = context.actor || {};
  const location = context.location || {};
  const primary = context.primary || {};

  return {
    schema: IXI_PURCHASE_SCHEMA,
    identity: {
      purchaseId: clean(input.purchaseId),
      purchaseNumber: clean(input.purchaseNumber),
      clientRequestId: clean(input.clientRequestId)
    },
    context: {
      primaryPassportId: clean(primary.passportId),
      primaryObjectId: clean(primary.objectId || primary.id),
      primaryObjectType: clean(primary.objectType),
      primaryObjectLabel: clean(primary.label),
      entityPassportId: clean(context.entity?.passportId),
      locationPassportId: clean(location.passportId),
      locationId: clean(location.objectId || location.id),
      locationLabel: clean(location.label),
      employeePassportId: clean(actor.passportId),
      employeeId: clean(actor.employeeId || actor.userId || actor.id),
      employeeLabel: clean(actor.displayName || actor.name || actor.label),
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
      whatNeeded: clean(input.whatNeeded || input.description) || items.map(line => line.description).filter(Boolean).join(", "),
      businessReason: clean(input.businessReason || input.reason || input.notes),
      shipToId: clean(input.shipToId || location.objectId || location.id),
      shipToPassportId: clean(input.shipToPassportId || location.passportId),
      shipToLabel: clean(input.shipToLabel || location.label),
      chargeTo: clean(input.chargeTo) || workOrderNumber || clean(primary.label),
      costCode: clean(input.costCode),
      currency: normalizeCurrency(input.currency),
      items,
      subtotal,
      estimatedShipping,
      estimatedTotal,
      notes: clean(input.notes),
      quoteCount: Math.max(0, Math.floor(finiteNumber(input.quoteCount))),
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
      committedAmount: requestType === "purchase-order" ? estimatedTotal : 0,
      billedAmount: 0,
      paidAmount: 0
    },
    approval: {
      state: requestType === "purchase-order" ? "direct-po-requested" : "pending-evaluation",
      requiredRole: "",
      requiredAuthority: 0,
      approvals: []
    },
    status: "draft",
    createdAt: clean(input.createdAt) || new Date().toISOString()
  };
}

export function validateIXIPurchase(draft = {}, options = {}) {
  const errors = {};
  const purchase = draft.purchase || {};
  const items = Array.isArray(purchase.items) ? purchase.items : [];
  const attachments = Array.isArray(purchase.attachments) ? purchase.attachments : [];
  const requireVendor = options.requireVendor !== false;
  const requireBusinessReason = options.requireBusinessReason !== false;

  if (!clean(draft.context?.primaryPassportId)) {
    errors.primary = "Originating AOS Passport is required";
  }

  if (requireVendor && !clean(purchase.vendorLabel)) {
    errors.vendor = "required";
  }

  if (requireBusinessReason && !clean(purchase.businessReason)) {
    errors.businessReason = "required";
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

  const invalidAttachment = attachments.find(attachment => {
    const mimeType = clean(attachment?.mimeType || attachment?.type).toLowerCase();
    const size = Number(attachment?.size || 0);

    return (
      !clean(attachment?.fileName || attachment?.name) ||
      !PURCHASE_ATTACHMENT_MIME_TYPES.includes(mimeType) ||
      !(size > 0) ||
      size > MAX_PURCHASE_ATTACHMENT_BYTES
    );
  });

  if (invalidAttachment) {
    errors.attachments = "invalid";
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
