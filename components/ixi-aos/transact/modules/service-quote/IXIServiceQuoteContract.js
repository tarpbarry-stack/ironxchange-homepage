const clean = value => String(value == null ? "" : value).trim();
const arr = value => Array.isArray(value) ? value : [];
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = value => Math.round((number(value) + Number.EPSILON) * 100) / 100;

export const IXI_SERVICE_QUOTE_SCHEMA = "ixi-service-quote-v2";
export const IXI_SERVICE_QUOTE_STATUSES = Object.freeze(["draft", "sent", "viewed", "changes-requested", "accepted", "declined", "expired", "superseded", "converted"]);
export const IXI_SERVICE_PRICING_TYPES = Object.freeze(["estimate", "fixed-price", "not-to-exceed"]);
export const IXI_SERVICE_LINE_TYPES = Object.freeze(["labor", "part-material", "outside-service", "travel-freight", "other"]);
export const IXI_SERVICE_DEPOSIT_TYPES = Object.freeze(["none", "fixed", "percent"]);

function normalizeLine(value, index) {
  const source = value && typeof value === "object" ? value : {};
  const quantity = Math.max(0, number(source.quantity ?? 1));
  const unitPrice = money(source.unitPrice);
  const unitCost = money(source.unitCost);
  const type = clean(source.type);
  return {
    lineId: clean(source.lineId) || `LINE-${index + 1}`,
    type: IXI_SERVICE_LINE_TYPES.includes(type) ? type : "other",
    description: clean(source.description), quantity, unit: clean(source.unit || "each"), unitPrice, unitCost,
    customerTotal: money(quantity * unitPrice), estimatedCost: money(quantity * unitCost),
    taxable: source.taxable !== false, optional: Boolean(source.optional), notes: clean(source.notes)
  };
}

function normalizeOption(value, index) {
  const source = value && typeof value === "object" ? value : {};
  const lines = arr(source.lines).map((line, lineIndex) => normalizeLine(line, lineIndex));
  const customerTotal = money(lines.reduce((sum, line) => sum + line.customerTotal, 0));
  const estimatedCost = money(lines.reduce((sum, line) => sum + line.estimatedCost, 0));
  return {
    optionId: clean(source.optionId) || `OPT-${index + 1}`,
    label: clean(source.label) || `OPTION ${index + 1}`, description: clean(source.description),
    required: source.required !== false, selectionMode: clean(source.selectionMode || "included"), lines,
    customerTotal, estimatedCost, projectedGrossProfit: money(customerTotal - estimatedCost),
    projectedMarginPercent: customerTotal ? money(((customerTotal - estimatedCost) / customerTotal) * 100) : 0
  };
}

function normalizeDocument(value, index) {
  const source = value && typeof value === "object" ? value : {};
  return {
    documentId: clean(source.documentId) || `SQ-DOC-${index + 1}`, type: clean(source.type || "document"),
    fileName: clean(source.fileName), mimeType: clean(source.mimeType), size: number(source.size),
    storageKey: clean(source.storageKey || source.key), status: clean(source.status || "local-pending-upload")
  };
}

export function createIXIServiceQuoteDraft({ context = {}, input = {} } = {}) {
  const primary = context.primary || {}, entity = context.entity || {}, location = context.location || {}, actor = context.actor || {};
  const options = arr(input.options).map((option, index) => normalizeOption(option, index));
  const required = options.filter(option => option.required);
  const quotedServiceRevenue = money(required.reduce((sum, option) => sum + option.customerTotal, 0));
  const estimatedCost = money(required.reduce((sum, option) => sum + option.estimatedCost, 0));
  const taxAmount = money(input.taxAmount);
  const customerQuoteTotal = money(quotedServiceRevenue + taxAmount);
  const requestedDepositType = clean(input.depositType || "none");
  const depositType = IXI_SERVICE_DEPOSIT_TYPES.includes(requestedDepositType) ? requestedDepositType : "none";
  const depositValue = money(input.depositValue);
  const requestedDeposit = depositType === "fixed" ? depositValue : depositType === "percent" ? money(customerQuoteTotal * depositValue / 100) : 0;
  const now = new Date().toISOString();
  const requestedPricingType = clean(input.pricingType);
  return {
    schema: IXI_SERVICE_QUOTE_SCHEMA,
    identity: { serviceQuoteId: clean(input.serviceQuoteId), financialDocumentId: clean(input.financialDocumentId), number: clean(input.number), revision: Math.max(1, number(input.revision || 1)), clientRequestId: clean(input.clientRequestId) || `SQ-${Date.now()}` },
    context: { primaryPassportId: clean(primary.passportId), primaryObjectId: clean(primary.objectId), primaryObjectType: clean(primary.objectType), primaryLabel: clean(primary.label), entityPassportId: clean(entity.passportId), entityLabel: clean(entity.label), locationPassportId: clean(location.passportId), locationLabel: clean(location.label), actorPassportId: clean(actor.passportId), actorId: clean(actor.employeeId || actor.userId || actor.id), actorLabel: clean(actor.displayName || actor.name || actor.label) },
    customer: { passportId: clean(input.customerPassportId), customerId: clean(input.customerId), name: clean(input.customerName), contactName: clean(input.customerContactName), email: clean(input.customerEmail), phone: clean(input.customerPhone), poNumber: clean(input.customerPoNumber) },
    asset: { passportId: clean(input.assetPassportId || primary.passportId), objectId: clean(input.assetObjectId || primary.objectId), objectType: clean(input.assetObjectType || primary.objectType), label: clean(input.assetLabel || primary.label), serialNumber: clean(input.serialNumber), locationLabel: clean(input.assetLocationLabel || location.label) },
    request: { problem: clean(input.problem), customerScope: clean(input.customerScope), internalNotes: clean(input.internalNotes), assumptions: clean(input.assumptions), exclusions: clean(input.exclusions) },
    commercial: { pricingType: IXI_SERVICE_PRICING_TYPES.includes(requestedPricingType) ? requestedPricingType : "estimate", quoteDate: clean(input.quoteDate), validThrough: clean(input.validThrough), paymentTerms: clean(input.paymentTerms), depositType, depositValue, requestedDeposit, taxAmount, currency: "USD" },
    options,
    economics: { quotedServiceRevenue, customerQuoteTotal, estimatedInternalCost: estimatedCost, projectedGrossProfit: money(quotedServiceRevenue - estimatedCost), projectedMarginPercent: quotedServiceRevenue ? money(((quotedServiceRevenue - estimatedCost) / quotedServiceRevenue) * 100) : 0, authorizedServiceRevenue: 0, authorizedTax: 0, authorizedCustomerTotal: 0, changeOrderAuthorized: 0, economicEvent: false },
    acceptance: { status: "pending", acceptedRevision: null, acceptedOptionIds: [], acceptedBy: "", acceptedAt: "", method: "", signatureDocumentId: "", customerPoNumber: "", snapshot: null },
    delivery: { sentAt: "", viewedAt: "", lastSentAt: "", channel: "", recipient: "" },
    revisions: [], changeOrders: [], related: { customerServiceWorkOrderId: "", serviceInvoiceIds: [] },
    documents: arr(input.documents).map((document, index) => normalizeDocument(document, index)), status: "draft",
    audit: { createdAt: now, createdBy: clean(actor.passportId || actor.employeeId || actor.id), createdByLabel: clean(actor.displayName || actor.name || actor.label), updatedAt: now }, activity: []
  };
}

export function validateIXIServiceQuote(record = {}) {
  const errors = {}, context = record.context || {}, customer = record.customer || {}, request = record.request || {}, commercial = record.commercial || {}, options = arr(record.options);
  if (!clean(context.primaryPassportId)) errors.context = "asset Passport required";
  if (!clean(context.entityPassportId)) errors.entity = "entity Passport required";
  if (!clean(context.actorPassportId || context.actorId)) errors.actor = "employee identity required";
  if (!clean(customer.name)) errors.customer = "customer required";
  if (!clean(request.problem)) errors.problem = "problem required";
  if (!clean(request.customerScope)) errors.scope = "customer-facing scope required";
  if (!options.length || !options.some(option => option.required)) errors.options = "at least one base option required";
  const lines = options.flatMap(option => arr(option.lines));
  if (!lines.length || lines.some(line => !clean(line.description) || !(Number(line.quantity) > 0) || Number(line.unitPrice) < 0 || Number(line.unitCost) < 0)) errors.lines = "each line needs description, positive quantity, and valid pricing";
  if (!(Number(record?.economics?.quotedServiceRevenue) > 0)) errors.amount = "service subtotal must be greater than zero";
  if (!clean(commercial.quoteDate) || Number.isNaN(Date.parse(commercial.quoteDate))) errors.quoteDate = "valid quote date required";
  if (!clean(commercial.validThrough) || Number.isNaN(Date.parse(commercial.validThrough)) || clean(commercial.validThrough) < clean(commercial.quoteDate)) errors.validThrough = "valid-through must be on or after quote date";
  if (Number(commercial.taxAmount) < 0) errors.taxAmount = "tax cannot be negative";
  if (commercial.depositType === "fixed" && (Number(commercial.depositValue) < 0 || Number(commercial.depositValue) > Number(record?.economics?.customerQuoteTotal))) errors.deposit = "fixed deposit must be within quote total";
  if (commercial.depositType === "percent" && (Number(commercial.depositValue) < 0 || Number(commercial.depositValue) > 100)) errors.deposit = "deposit percent must be between 0 and 100";
  if (arr(record.documents).some(document => !clean(document.storageKey) || !["uploaded", "available", "verified"].includes(clean(document.status).toLowerCase()))) errors.documents = "attachments must finish uploading before save";
  return { valid: Object.keys(errors).length === 0, errors };
}

export default { IXI_SERVICE_QUOTE_SCHEMA, createIXIServiceQuoteDraft, validateIXIServiceQuote };
