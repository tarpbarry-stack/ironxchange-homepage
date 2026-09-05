const clean = value => String(value ?? "").trim();
const sourceObject = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const numeric = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = value => Math.round((numeric(value) + Number.EPSILON) * 100) / 100;
const array = value => Array.isArray(value) ? value : [];
const now = () => new Date().toISOString();
const today = () => now().slice(0, 10);

export const IXI_DEAL_TYPES = Object.freeze(["standard-sale", "rental-purchase-option"]);
export const IXI_RPO_FREQUENCIES = Object.freeze(["weekly", "biweekly", "monthly", "quarterly", "custom"]);

function dealType(value) {
  const normalized = clean(value).toLowerCase();
  return IXI_DEAL_TYPES.includes(normalized) ? normalized : "standard-sale";
}

function normalizeRPO(value = {}) {
  const source = sourceObject(value);
  const purchaseCreditType = clean(source.purchaseCreditType).toLowerCase() === "percent" ? "percent" : "amount";
  const paymentFrequency = clean(source.paymentFrequency).toLowerCase();
  return {
    startDate: clean(source.startDate), firstPaymentDate: clean(source.firstPaymentDate), finalOptionDate: clean(source.finalOptionDate),
    termMonths: numeric(source.termMonths), paymentFrequency: IXI_RPO_FREQUENCIES.includes(paymentFrequency) ? paymentFrequency : "monthly", paymentCount: numeric(source.paymentCount),
    initialPayment: money(source.initialPayment), periodicPayment: money(source.periodicPayment), taxPerPayment: money(source.taxPerPayment), recurringFees: money(source.recurringFees),
    purchaseCreditType, purchaseCreditAmount: money(source.purchaseCreditAmount), purchaseCreditPercent: numeric(source.purchaseCreditPercent),
    optionPrice: money(source.optionPrice), currentPayoff: money(source.currentPayoff), earlyBuyoutTerms: clean(source.earlyBuyoutTerms),
    deliveryTerms: clean(source.deliveryTerms), returnTerms: clean(source.returnTerms), maintenanceResponsibility: clean(source.maintenanceResponsibility),
    insuranceRequirements: clean(source.insuranceRequirements), usageLimit: clean(source.usageLimit), excessUsageRate: clean(source.excessUsageRate),
    lateFeeTerms: clean(source.lateFeeTerms), defaultTerms: clean(source.defaultTerms), notes: clean(source.notes)
  };
}

function normalizeAdditionalTerms(value = []) {
  return array(value).map((term, index) => {
    const source = sourceObject(term);
    return {
      termId: clean(source.termId) || `TERM-${index + 1}`,
      label: clean(source.label), value: clean(source.value),
      scope: ["transaction", "rpo", "invoice"].includes(clean(source.scope)) ? clean(source.scope) : "transaction",
      customerFacing: source.customerFacing !== false
    };
  }).filter(term => term.label || term.value);
}

export const IXI_QUOTE_SCHEMA = "ixi-equipment-quote-v1";
export const IXI_QUOTE_STATUSES = Object.freeze(["draft", "prepared", "sent", "viewed", "accepted", "declined", "expired", "superseded", "converted"]);

function field(source, ...keys) {
  for (const key of keys) {
    const value = clean(source?.[key]);
    if (value) return value;
  }
  return "";
}

function assetSnapshot(object = {}, context = {}) {
  const source = sourceObject(object);
  const fields = sourceObject(source.fields);
  const publicData = sourceObject(source?.attributes?.publicData || source.publicData);
  const primary = sourceObject(context.primary);
  return {
    passportId: clean(primary.passportId || source.passportId),
    objectId: clean(primary.objectId || source.objectId || source.mosObjectId),
    objectType: clean(primary.objectType || source.objectType || source.type || "machine"),
    label: clean(primary.label || source.displayName || source.title || source.name),
    year: field(source, "year") || field(fields, "year") || field(publicData, "year"),
    make: field(source, "make", "manufacturer") || field(fields, "make", "manufacturer") || field(publicData, "make", "manufacturer"),
    model: field(source, "model") || field(fields, "model") || field(publicData, "model"),
    serialNumber: field(source, "serialNumber", "serial", "vin") || field(fields, "serialNumber", "serial", "vin") || field(publicData, "serialNumber", "serial", "vin"),
    stockNumber: field(source, "stockNumber", "stock") || field(fields, "stockNumber", "stock") || field(publicData, "stockNumber", "stock"),
    hours: field(source, "hours") || field(fields, "hours") || field(publicData, "hours"),
    location: clean(context?.location?.label || fields.location || source.location),
    condition: field(source, "condition") || field(fields, "condition") || field(publicData, "condition")
  };
}

function brandSnapshot(context = {}, object = {}) {
  const entity = sourceObject(context.entity);
  const source = sourceObject(object);
  return {
    companyName: clean(entity.companyName || entity.displayName || entity.name || entity.label || source.companyName || source.sellerCompany || "IRONXCHANGE"),
    legalName: clean(entity.legalName),
    logoUrl: clean(entity.logoUrl || entity.logo || source.sellerLogo || source.logoUrl),
    accentColor: clean(entity.accentColor || entity.brandColor || "#ffc400"),
    phone: clean(entity.phone || entity.businessPhone),
    email: clean(entity.email || entity.businessEmail),
    website: clean(entity.website),
    address: clean(entity.address || entity.officeLocation)
  };
}

function normalizeAmounts(input = {}) {
  const subtotal = money(input.subtotal ?? input.quotedPrice ?? input.price);
  const tax = money(input.tax);
  const freight = money(input.freight);
  const fees = money(input.fees);
  const tradeAllowance = money(input.tradeAllowance);
  return { subtotal, tax, freight, fees, tradeAllowance, total: money(subtotal + tax + freight + fees - tradeAllowance) };
}

export function getIXIQuoteCompleteness(record = {}) {
  const customer = sourceObject(record.customer);
  const asset = sourceObject(record.asset);
  const commercial = sourceObject(record.commercial);
  const presentation = sourceObject(record.presentation);
  const checks = [
    ["customer", Boolean(clean(customer.name)), "Customer name"],
    ["contact", Boolean(clean(customer.phone || customer.email)), "Customer phone or email"],
    ["asset", Boolean(clean(asset.label || asset.passportId)), "Equipment"],
    ["serial", Boolean(clean(asset.serialNumber)), "Serial / VIN"],
    ["price", numeric(record?.totals?.subtotal) > 0, "Quoted price"],
    ["date", Boolean(clean(commercial.quoteDate)), "Quote date"],
    ["validity", Boolean(clean(commercial.validThrough)), "Valid-through date"],
    ["terms", Boolean(clean(commercial.paymentTerms)), "Payment terms"],
    ["condition", Boolean(clean(presentation.conditionTerms)), "Condition / warranty"],
    ["seller", Boolean(clean(record?.brand?.companyName)), "Company branding"]
  ];
  const complete = checks.filter(([, ok]) => ok).length;
  return {
    percent: Math.round((complete / checks.length) * 100),
    missing: checks.filter(([, ok]) => !ok).map(([, , label]) => label),
    formalReady: complete === checks.length
  };
}

export function createIXIQuoteDraft({ context = {}, object = {}, input = {} } = {}) {
  const actor = sourceObject(context.actor);
  const primary = sourceObject(context.primary);
  const timestamp = now();
  const totals = normalizeAmounts(input);
  return {
    schema: IXI_QUOTE_SCHEMA,
    identity: {
      dealId: clean(input.dealId),
      quoteId: clean(input.quoteId),
      financialDocumentId: clean(input.financialDocumentId),
      number: clean(input.number),
      revision: Math.max(1, numeric(input.revision || 1)),
      clientRequestId: clean(input.clientRequestId) || globalThis.crypto?.randomUUID?.() || `QT-${Date.now()}-${Math.random().toString(16).slice(2)}`
    },
    context: {
      primaryPassportId: clean(primary.passportId),
      primaryObjectId: clean(primary.objectId),
      primaryObjectType: clean(primary.objectType),
      entityPassportId: clean(context?.entity?.passportId),
      actorPassportId: clean(actor.passportId),
      actorId: clean(actor.employeeId || actor.userId || actor.id),
      actorLabel: clean(actor.displayName || actor.name || actor.label)
    },
    brand: { ...brandSnapshot(context, object), ...sourceObject(input.brand) },
    dealType: dealType(input.dealType),
    customer: {
      passportId: clean(input.customerPassportId),
      customerId: clean(input.customerId),
      name: clean(input.customerName),
      contactName: clean(input.customerContactName),
      phone: clean(input.customerPhone),
      email: clean(input.customerEmail),
      address: clean(input.customerAddress),
      cityStateZip: clean(input.customerCityStateZip)
    },
    asset: { ...assetSnapshot(object, context), ...sourceObject(input.asset) },
    commercial: {
      quoteDate: clean(input.quoteDate),
      validThrough: clean(input.validThrough),
      currency: clean(input.currency || "USD").toUpperCase(),
      paymentTerms: clean(input.paymentTerms),
      depositTerms: clean(input.depositTerms),
      deliveryTerms: clean(input.deliveryTerms),
      tradeDescription: clean(input.tradeDescription)
    },
    totals,
    rpo: normalizeRPO(input.rpo),
    additionalTerms: normalizeAdditionalTerms(input.additionalTermsRows),
    presentation: {
      headline: clean(input.headline || "EQUIPMENT QUOTATION"),
      customerMessage: clean(input.customerMessage),
      equipmentDescription: clean(input.equipmentDescription),
      conditionTerms: clean(input.conditionTerms),
      warrantyTerms: clean(input.warrantyTerms),
      additionalTerms: clean(input.additionalTerms),
      internalNotes: clean(input.internalNotes)
    },
    acceptance: { status: "pending", acceptedBy: "", acceptedAt: "", method: "", snapshot: null },
    related: { salesOrderId: "", invoiceId: "", soldSheetId: "" },
    revisions: array(input.revisions),
    documents: array(input.documents),
    status: IXI_QUOTE_STATUSES.includes(clean(input.status)) ? clean(input.status) : "draft",
    audit: { createdAt: timestamp, createdBy: clean(actor.passportId || actor.employeeId || actor.userId), createdByLabel: clean(actor.label || actor.displayName || actor.name), updatedAt: timestamp },
    activity: []
  };
}

export function updateIXIQuoteDraft(record = {}, { context = {}, object = {}, input = {} } = {}) {
  const next = createIXIQuoteDraft({ context, object, input: { ...input, clientRequestId: record?.identity?.clientRequestId } });
  return {
    ...next,
    identity: { ...next.identity, ...sourceObject(record.identity), revision: Math.max(1, numeric(input.revision || record?.identity?.revision || 1)) },
    financialBinding: record.financialBinding,
    acceptance: sourceObject(record.acceptance),
    related: sourceObject(record.related),
    revisions: array(record.revisions),
    activity: array(record.activity),
    audit: { ...sourceObject(record.audit), updatedAt: now() },
    status: IXI_QUOTE_STATUSES.includes(clean(input.status)) ? clean(input.status) : clean(record.status || "draft")
  };
}

export function quoteInputFromRecord(record = {}) {
  return {
    dealId: record?.identity?.dealId || "",
    dealType: dealType(record?.dealType),
    customerPassportId: record?.customer?.passportId || "",
    customerId: record?.customer?.customerId || "",
    customerName: record?.customer?.name || "",
    customerContactName: record?.customer?.contactName || "",
    customerPhone: record?.customer?.phone || "",
    customerEmail: record?.customer?.email || "",
    customerAddress: record?.customer?.address || "",
    customerCityStateZip: record?.customer?.cityStateZip || "",
    quoteDate: record?.commercial?.quoteDate || "",
    validThrough: record?.commercial?.validThrough || "",
    currency: record?.commercial?.currency || "USD",
    paymentTerms: record?.commercial?.paymentTerms || "",
    depositTerms: record?.commercial?.depositTerms || "",
    deliveryTerms: record?.commercial?.deliveryTerms || "",
    tradeDescription: record?.commercial?.tradeDescription || "",
    quotedPrice: record?.totals?.subtotal || "",
    tax: record?.totals?.tax || "",
    freight: record?.totals?.freight || "",
    fees: record?.totals?.fees || "",
    tradeAllowance: record?.totals?.tradeAllowance || "",
    headline: record?.presentation?.headline || "EQUIPMENT QUOTATION",
    customerMessage: record?.presentation?.customerMessage || "",
    equipmentDescription: record?.presentation?.equipmentDescription || "",
    conditionTerms: record?.presentation?.conditionTerms || "",
    warrantyTerms: record?.presentation?.warrantyTerms || "",
    additionalTerms: record?.presentation?.additionalTerms || "",
    rpo: normalizeRPO(record?.rpo),
    additionalTermsRows: normalizeAdditionalTerms(record?.additionalTerms),
    internalNotes: record?.presentation?.internalNotes || "",
    status: record?.status || "draft",
    asset: sourceObject(record.asset),
    brand: sourceObject(record.brand),
    documents: array(record.documents)
  };
}

export const IXIQuoteDefaults = Object.freeze({ quoteDate: today(), validThrough: "", paymentTerms: "", depositTerms: "", deliveryTerms: "" });

export default { IXI_QUOTE_SCHEMA, IXI_QUOTE_STATUSES, IXI_DEAL_TYPES, IXI_RPO_FREQUENCIES, createIXIQuoteDraft, updateIXIQuoteDraft, quoteInputFromRecord, getIXIQuoteCompleteness };
