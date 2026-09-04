const clean = value => String(value ?? "").trim();
const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = value => Math.round((number(value) + Number.EPSILON) * 100) / 100;
const today = () => new Date().toISOString().slice(0, 10);
const array = value => Array.isArray(value) ? value : [];

export const IXI_EQUIPMENT_SALE_SCHEMA = "ixi-equipment-sales-order-v1";

function totals(source = {}) {
  const subtotal = money(source.subtotal);
  const tax = money(source.tax);
  const freight = money(source.freight);
  const fees = money(source.fees);
  const tradeAllowance = money(source.tradeAllowance);
  const deposit = money(source.deposit);
  const total = money(subtotal + tax + freight + fees - tradeAllowance);
  return { subtotal, tax, freight, fees, tradeAllowance, deposit, total, balanceDue: money(Math.max(0, total - deposit)) };
}

function dealType(value) { return clean(value).toLowerCase() === "rental-purchase-option" ? "rental-purchase-option" : "standard-sale"; }
function rpo(value = {}) {
  const source = object(value);
  return {
    startDate: clean(source.startDate), firstPaymentDate: clean(source.firstPaymentDate), finalOptionDate: clean(source.finalOptionDate),
    termMonths: number(source.termMonths), paymentFrequency: clean(source.paymentFrequency || "monthly"), paymentCount: number(source.paymentCount),
    initialPayment: money(source.initialPayment), periodicPayment: money(source.periodicPayment), taxPerPayment: money(source.taxPerPayment), recurringFees: money(source.recurringFees),
    purchaseCreditType: clean(source.purchaseCreditType).toLowerCase() === "percent" ? "percent" : "amount", purchaseCreditAmount: money(source.purchaseCreditAmount), purchaseCreditPercent: number(source.purchaseCreditPercent),
    optionPrice: money(source.optionPrice), currentPayoff: money(source.currentPayoff), earlyBuyoutTerms: clean(source.earlyBuyoutTerms), deliveryTerms: clean(source.deliveryTerms), returnTerms: clean(source.returnTerms),
    maintenanceResponsibility: clean(source.maintenanceResponsibility), insuranceRequirements: clean(source.insuranceRequirements), usageLimit: clean(source.usageLimit), excessUsageRate: clean(source.excessUsageRate),
    lateFeeTerms: clean(source.lateFeeTerms), defaultTerms: clean(source.defaultTerms), notes: clean(source.notes)
  };
}
function additionalTerms(value = []) { return array(value).map((term, index) => ({ termId: clean(term?.termId) || `TERM-${index + 1}`, label: clean(term?.label), value: clean(term?.value), scope: ["transaction", "rpo", "invoice"].includes(clean(term?.scope)) ? clean(term.scope) : "transaction", customerFacing: term?.customerFacing !== false })).filter(term => term.label || term.value); }

export function createIXIEquipmentSaleDraft({ context = {}, quote = null, input = {} } = {}) {
  const source = object(quote);
  const configuredTerms = object(context?.entity?.salesTermsDocument);
  return {
    schema: IXI_EQUIPMENT_SALE_SCHEMA,
    identity: { salesOrderId: "", financialDocumentId: "", number: "", revision: 1, clientRequestId: globalThis.crypto?.randomUUID?.() || `SO-${Date.now()}` },
    context: { primaryPassportId: clean(context?.primary?.passportId), primaryObjectId: clean(context?.primary?.objectId), primaryObjectType: clean(context?.primary?.objectType), entityPassportId: clean(context?.entity?.passportId), actorPassportId: clean(context?.actor?.passportId), actorId: clean(context?.actor?.employeeId || context?.actor?.userId), actorLabel: clean(context?.actor?.label) },
    brand: { ...object(source.brand), companyName: clean(source?.brand?.companyName || context?.entity?.companyName), legalName: clean(source?.brand?.legalName || context?.entity?.legalName), logoUrl: clean(source?.brand?.logoUrl || context?.entity?.logoUrl), accentColor: clean(source?.brand?.accentColor || context?.entity?.accentColor || "#ffc400"), phone: clean(source?.brand?.phone || context?.entity?.phone), email: clean(source?.brand?.email || context?.entity?.email), address: clean(source?.brand?.address || context?.entity?.address) },
    dealType: dealType(input.dealType || source.dealType),
    customer: { ...object(source.customer), ...object(input.customer) },
    asset: { ...object(source.asset), passportId: clean(source?.asset?.passportId || context?.primary?.passportId), label: clean(source?.asset?.label || context?.primary?.label), ...object(input.asset) },
    commercial: { orderDate: clean(input.orderDate || today()), dueDate: clean(input.dueDate), currency: clean(input.currency || source?.commercial?.currency || "USD"), paymentTerms: clean(input.paymentTerms || source?.commercial?.paymentTerms), depositTerms: clean(input.depositTerms || source?.commercial?.depositTerms), deliveryTerms: clean(input.deliveryTerms || source?.commercial?.deliveryTerms), tradeDescription: clean(input.tradeDescription || source?.commercial?.tradeDescription) },
    totals: totals({ ...object(source.totals), ...object(input.totals) }),
    rpo: rpo({ ...object(source.rpo), ...object(input.rpo) }),
    additionalTerms: additionalTerms(input.additionalTerms || source.additionalTerms),
    termsDocument: { documentId: clean(configuredTerms.documentId), version: clean(configuredTerms.version), sha256: clean(configuredTerms.sha256), url: clean(configuredTerms.url), pageCount: Number(configuredTerms.pageCount || 0) },
    signing: { status: "not-sent", tokenVersion: 0, expiresAt: "", sentAt: "", signedAt: "" },
    related: { quoteId: clean(source?.identity?.quoteId || source?.identity?.financialDocumentId), invoiceId: "", invoiceNumber: "", soldSheetId: "", settlementId: "" },
    status: "draft",
    activity: [],
    audit: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  };
}

export function saleInputFromRecord(record = {}) {
  return {
    dealType: dealType(record?.dealType), rpo: rpo(record?.rpo), additionalTerms: additionalTerms(record?.additionalTerms),
    customerName: clean(record?.customer?.name), contactName: clean(record?.customer?.contactName), customerEmail: clean(record?.customer?.email), customerPhone: clean(record?.customer?.phone), customerAddress: clean(record?.customer?.address),
    serialNumber: clean(record?.asset?.serialNumber), stockNumber: clean(record?.asset?.stockNumber),
    orderDate: clean(record?.commercial?.orderDate), dueDate: clean(record?.commercial?.dueDate), paymentTerms: clean(record?.commercial?.paymentTerms), depositTerms: clean(record?.commercial?.depositTerms), deliveryTerms: clean(record?.commercial?.deliveryTerms), tradeDescription: clean(record?.commercial?.tradeDescription),
    subtotal: record?.totals?.subtotal ?? "", tax: record?.totals?.tax ?? "", freight: record?.totals?.freight ?? "", fees: record?.totals?.fees ?? "", tradeAllowance: record?.totals?.tradeAllowance ?? "", deposit: record?.totals?.deposit ?? ""
  };
}

export function updateIXIEquipmentSale(record = {}, input = {}) {
  return {
    ...record,
    dealType: dealType(input.dealType),
    customer: { ...object(record.customer), name: clean(input.customerName), contactName: clean(input.contactName), email: clean(input.customerEmail), phone: clean(input.customerPhone), address: clean(input.customerAddress) },
    asset: { ...object(record.asset), serialNumber: clean(input.serialNumber), stockNumber: clean(input.stockNumber) },
    commercial: { ...object(record.commercial), orderDate: clean(input.orderDate), dueDate: clean(input.dueDate), paymentTerms: clean(input.paymentTerms), depositTerms: clean(input.depositTerms), deliveryTerms: clean(input.deliveryTerms), tradeDescription: clean(input.tradeDescription) },
    totals: totals(input),
    rpo: rpo(input.rpo),
    additionalTerms: additionalTerms(input.additionalTerms),
    audit: { ...object(record.audit), updatedAt: new Date().toISOString() }
  };
}

export function getIXIEquipmentSaleReadiness(record = {}) {
  const terms = object(record.termsDocument);
  const checks = [
    ["Customer", clean(record?.customer?.name)], ["Customer email or phone", clean(record?.customer?.email || record?.customer?.phone)],
    ["Machine Passport", clean(record?.context?.primaryPassportId)], ["Serial / VIN", clean(record?.asset?.serialNumber)],
    ["Price", number(record?.totals?.subtotal) > 0], ["Payment terms", clean(record?.commercial?.paymentTerms)],
    ["Two-page counsel terms", clean(terms.documentId) && clean(terms.url) && /^[a-f0-9]{64}$/i.test(clean(terms.sha256)) && Number(terms.pageCount) === 2]
  ];
  if (dealType(record?.dealType) === "rental-purchase-option") checks.push(
    ["RPO start date", clean(record?.rpo?.startDate)], ["RPO term", number(record?.rpo?.termMonths) > 0],
    ["RPO payment schedule", number(record?.rpo?.periodicPayment) > 0 && number(record?.rpo?.paymentCount) > 0],
    ["RPO purchase option", number(record?.rpo?.optionPrice) >= 0 && clean(record?.rpo?.finalOptionDate)],
    ["RPO return terms", clean(record?.rpo?.returnTerms)]
  );
  return { ready: checks.every(([, ok]) => Boolean(ok)), missing: checks.filter(([, ok]) => !ok).map(([label]) => label), percent: Math.round(checks.filter(([, ok]) => Boolean(ok)).length / checks.length * 100) };
}
