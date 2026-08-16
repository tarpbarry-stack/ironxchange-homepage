const clean = value => String(value == null ? "" : value).trim();
const arr = value => Array.isArray(value) ? value : [];
const number = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const money = value => Math.round(number(value) * 100) / 100;

export const IXI_SERVICE_QUOTE_SCHEMA = "ixi-service-quote-v1";
export const IXI_SERVICE_QUOTE_STATUSES = Object.freeze([
  "draft",
  "sent",
  "viewed",
  "changes-requested",
  "accepted",
  "declined",
  "expired",
  "superseded",
  "converted"
]);
export const IXI_SERVICE_PRICING_TYPES = Object.freeze([
  "estimate",
  "fixed-price",
  "not-to-exceed"
]);
export const IXI_SERVICE_LINE_TYPES = Object.freeze([
  "labor",
  "part-material",
  "outside-service",
  "travel-freight",
  "other"
]);

function normalizeLine(value, index) {
  const source = value && typeof value === "object" ? value : {};
  const quantity = Math.max(0, number(source.quantity || 1));
  const unitPrice = money(source.unitPrice);
  const unitCost = money(source.unitCost);
  const type = clean(source.type);

  return {
    lineId: clean(source.lineId) || `LINE-${index + 1}`,
    type: IXI_SERVICE_LINE_TYPES.includes(type) ? type : "other",
    description: clean(source.description),
    quantity,
    unit: clean(source.unit || "each"),
    unitPrice,
    unitCost,
    customerTotal: money(quantity * unitPrice),
    estimatedCost: money(quantity * unitCost),
    taxable: source.taxable !== false,
    optional: Boolean(source.optional),
    notes: clean(source.notes)
  };
}

function normalizeOption(value, index) {
  const source = value && typeof value === "object" ? value : {};
  const lines = arr(source.lines).map((line, lineIndex) => normalizeLine(line, lineIndex));
  const customerTotal = money(lines.reduce((sum, line) => sum + line.customerTotal, 0));
  const estimatedCost = money(lines.reduce((sum, line) => sum + line.estimatedCost, 0));

  return {
    optionId: clean(source.optionId) || `OPT-${index + 1}`,
    label: clean(source.label) || `OPTION ${index + 1}`,
    description: clean(source.description),
    required: source.required !== false,
    selectionMode: clean(source.selectionMode || "included"),
    lines,
    customerTotal,
    estimatedCost,
    projectedGrossProfit: money(customerTotal - estimatedCost),
    projectedMarginPercent: customerTotal
      ? money(((customerTotal - estimatedCost) / customerTotal) * 100)
      : 0
  };
}

function normalizeDocument(value, index) {
  const source = value && typeof value === "object" ? value : {};
  return {
    documentId: clean(source.documentId) || `SQ-DOC-${index + 1}`,
    type: clean(source.type || "document"),
    fileName: clean(source.fileName),
    mimeType: clean(source.mimeType),
    size: number(source.size),
    status: clean(source.status || "local-pending-upload")
  };
}

export function createIXIServiceQuoteDraft({ context = {}, input = {} } = {}) {
  const primary = context.primary || {};
  const entity = context.entity || {};
  const location = context.location || {};
  const actor = context.actor || {};
  const options = arr(input.options).map((option, index) => normalizeOption(option, index));
  const requiredOptions = options.filter(option => option.required);
  const baseRevenue = money(requiredOptions.reduce((sum, option) => sum + option.customerTotal, 0));
  const estimatedCost = money(requiredOptions.reduce((sum, option) => sum + option.estimatedCost, 0));
  const taxAmount = money(input.taxAmount);
  const quotedRevenue = money(baseRevenue + taxAmount);
  const now = new Date().toISOString();
  const requestedPricingType = clean(input.pricingType);

  return {
    schema: IXI_SERVICE_QUOTE_SCHEMA,
    identity: {
      serviceQuoteId: clean(input.serviceQuoteId),
      number: clean(input.number),
      revision: Math.max(1, number(input.revision || 1)),
      clientRequestId: clean(input.clientRequestId) || `SQ-${Date.now()}`
    },
    context: {
      primaryPassportId: clean(primary.passportId),
      primaryObjectId: clean(primary.objectId),
      primaryObjectType: clean(primary.objectType),
      primaryLabel: clean(primary.label),
      entityPassportId: clean(entity.passportId),
      entityLabel: clean(entity.label),
      locationPassportId: clean(location.passportId),
      locationLabel: clean(location.label),
      actorPassportId: clean(actor.passportId),
      actorId: clean(actor.employeeId || actor.userId || actor.id),
      actorLabel: clean(actor.displayName || actor.name || actor.label)
    },
    customer: {
      passportId: clean(input.customerPassportId),
      customerId: clean(input.customerId),
      name: clean(input.customerName),
      contactName: clean(input.customerContactName),
      email: clean(input.customerEmail),
      phone: clean(input.customerPhone),
      poNumber: clean(input.customerPoNumber)
    },
    asset: {
      passportId: clean(input.assetPassportId || primary.passportId),
      objectId: clean(input.assetObjectId || primary.objectId),
      objectType: clean(input.assetObjectType || primary.objectType),
      label: clean(input.assetLabel || primary.label),
      serialNumber: clean(input.serialNumber),
      locationLabel: clean(input.assetLocationLabel || location.label)
    },
    request: {
      problem: clean(input.problem),
      customerScope: clean(input.customerScope),
      internalNotes: clean(input.internalNotes),
      assumptions: clean(input.assumptions),
      exclusions: clean(input.exclusions)
    },
    commercial: {
      pricingType: IXI_SERVICE_PRICING_TYPES.includes(requestedPricingType)
        ? requestedPricingType
        : "estimate",
      quoteDate: clean(input.quoteDate),
      validThrough: clean(input.validThrough),
      paymentTerms: clean(input.paymentTerms),
      depositType: clean(input.depositType || "none"),
      depositValue: money(input.depositValue),
      taxAmount,
      currency: "USD"
    },
    options,
    economics: {
      quotedRevenue,
      estimatedInternalCost: estimatedCost,
      projectedGrossProfit: money(quotedRevenue - estimatedCost),
      projectedMarginPercent: quotedRevenue
        ? money(((quotedRevenue - estimatedCost) / quotedRevenue) * 100)
        : 0,
      authorizedRevenue: 0,
      changeOrderAuthorized: 0,
      economicEvent: false
    },
    acceptance: {
      status: "pending",
      acceptedRevision: null,
      acceptedOptionIds: [],
      acceptedBy: "",
      acceptedAt: "",
      method: "",
      signatureDocumentId: "",
      customerPoNumber: ""
    },
    delivery: {
      sentAt: "",
      viewedAt: "",
      lastSentAt: "",
      channel: "",
      recipient: ""
    },
    revisions: [],
    changeOrders: [],
    related: {
      customerServiceWorkOrderId: "",
      serviceInvoiceIds: []
    },
    documents: arr(input.documents).map((document, index) => normalizeDocument(document, index)),
    status: "draft",
    audit: {
      createdAt: now,
      createdBy: clean(actor.passportId || actor.employeeId || actor.id),
      createdByLabel: clean(actor.displayName || actor.name || actor.label),
      updatedAt: now
    },
    activity: []
  };
}

export function validateIXIServiceQuote(record = {}) {
  const errors = {};
  const recordContext = record.context || {};
  const customer = record.customer || {};
  const request = record.request || {};
  const commercial = record.commercial || {};
  const options = arr(record.options);

  if (!clean(recordContext.primaryPassportId || recordContext.primaryObjectId)) errors.context = "required";
  if (!clean(customer.name)) errors.customer = "required";
  if (!clean(request.problem)) errors.problem = "required";
  if (!clean(request.customerScope)) errors.scope = "required";
  if (!options.length) errors.options = "required";
  if (!options.some(option => arr(option.lines).length)) errors.lines = "required";
  if (!clean(commercial.quoteDate)) errors.quoteDate = "required";
  if (!clean(commercial.validThrough)) errors.validThrough = "required";

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export default {
  IXI_SERVICE_QUOTE_SCHEMA,
  createIXIServiceQuoteDraft,
  validateIXIServiceQuote
};
