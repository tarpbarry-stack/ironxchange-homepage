const clean = value => String(value ?? "").trim();
const number = value => (Number.isFinite(Number(value)) ? Number(value) : 0);
const money = value => Math.round(number(value) * 100) / 100;
const array = value => (Array.isArray(value) ? value : []);
const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

export const IXI_ASSET_SALE_SCHEMA = "ixi-asset-sale-v2";
export const IXI_ASSET_SALE_TYPES = Object.freeze([
  "sale",
  "auction-sale",
  "trade",
  "transfer",
  "total-loss",
  "scrap",
  "other",
]);

export function financialDocumentOf(record = {}) {
  const envelope = record?.record || record;
  return object(
    envelope?.financialDocument ||
      envelope?.document?.financialDocument ||
      envelope?.document ||
      envelope,
  );
}

function financialAmount(record = {}) {
  const document = financialDocumentOf(record);
  const total = Number(document?.totals?.total ?? document?.amount);
  if (Number.isFinite(total)) return money(Math.abs(total));
  return money(
    array(document?.lines).reduce(
      (sum, line) => sum + Math.abs(number(line?.amount)),
      0,
    ),
  );
}

function receiptFromFinancialRecord(record = {}) {
  const document = financialDocumentOf(record);
  if (clean(document.documentType).toLowerCase() !== "payment") return null;
  if (clean(document.paymentDirection).toLowerCase() !== "inflow") return null;
  if (["draft", "submitted", "void", "reversed"].includes(clean(document.financialState).toLowerCase())) return null;
  return {
    paymentId: clean(document.financialDocumentId),
    date: clean(document.occurredAt).slice(0, 10),
    amount: financialAmount(document),
    method: clean(document.paymentMethod || "payment"),
    reference: clean(document.transactionReference || document.documentNumber),
    recordedAt: clean(document.updatedAt || document.occurredAt),
  };
}

function creditFromFinancialRecord(record = {}) {
  const document = financialDocumentOf(record);
  if (clean(document.documentType).toLowerCase() !== "credit") return null;
  if (["draft", "submitted", "rejected", "void", "reversed"].includes(clean(document.financialState).toLowerCase())) return null;
  return {
    creditId: clean(document.financialDocumentId),
    date: clean(document.occurredAt).slice(0, 10),
    amount: financialAmount(document),
    reference: clean(document.transactionReference || document.documentNumber),
  };
}

export function projectIXIAssetSaleCollection({
  sourceInvoice = {},
  financialRecords = [],
  receipts = [],
} = {}) {
  const invoiceId = clean(
    sourceInvoice?.financialBinding?.financialDocumentId ||
      sourceInvoice?.financialDocumentId,
  );
  const canonical = array(financialRecords)
    .filter(record => clean(financialDocumentOf(record)?.sourceFinancialDocumentId) === invoiceId)
    .map(receiptFromFinancialRecord)
    .filter(Boolean);
  const credits = array(financialRecords)
    .filter(record => clean(financialDocumentOf(record)?.sourceFinancialDocumentId) === invoiceId)
    .map(creditFromFinancialRecord)
    .filter(Boolean);
  const merged = new Map();
  [...canonical, ...array(receipts)].forEach(receipt => {
    const id = clean(receipt?.paymentId || receipt?.reference || receipt?.recordedAt);
    if (id) merged.set(id, receipt);
  });
  const normalizedReceipts = [...merged.values()];
  const invoiceTotal = money(
    sourceInvoice?.totals?.customerTotal ??
      sourceInvoice?.totals?.total ??
      sourceInvoice?.amount,
  );
  const amountReceived = money(
    normalizedReceipts.reduce((sum, receipt) => sum + number(receipt?.amount), 0),
  );
  const creditedAmount = money(
    credits.reduce((sum, credit) => sum + number(credit?.amount), 0),
  );
  const balanceDue = money(Math.max(0, invoiceTotal - amountReceived - creditedAmount));
  return {
    status: balanceDue <= 0.005 ? "paid" : amountReceived > 0 ? "partial" : "unpaid",
    receipts: normalizedReceipts,
    amountReceived,
    credits,
    creditedAmount,
    balanceDue,
    invoiceTotal,
  };
}

export function createIXIAssetSaleDraft({ context = {}, input = {} } = {}) {
  const primary = object(context.primary);
  const actor = object(context.actor);
  const sourceInvoice = object(input.sourceInvoice);
  const collection = projectIXIAssetSaleCollection({
    sourceInvoice,
    financialRecords: input.financialRecords,
    receipts: input.receipts,
  });
  const now = new Date().toISOString();
  const invoiceId = clean(
    input.sourceFinancialDocumentId ||
      sourceInvoice?.financialBinding?.financialDocumentId ||
      sourceInvoice?.financialDocumentId,
  );
  const invoiceNumber = clean(sourceInvoice?.documentNumber);
  return {
    schema: IXI_ASSET_SALE_SCHEMA,
    identity: {
      dealId: clean(input.dealId),
      saleId: invoiceId,
      financialInvoiceId: invoiceId,
      number: clean(input.number || (invoiceNumber ? `SALE-${invoiceNumber}` : "")),
      clientRequestId: clean(input.clientRequestId) || `SALE-${Date.now()}`,
    },
    context: {
      assetPassportId: clean(primary.passportId),
      assetObjectId: clean(primary.objectId),
      assetObjectType: clean(primary.objectType),
      assetLabel: clean(primary.label),
      entityPassportId: clean(context.entity?.passportId),
      locationPassportId: clean(context.location?.passportId),
      locationLabel: clean(context.location?.label),
      actorPassportId: clean(actor.passportId),
      actorId: clean(actor.employeeId || actor.userId || actor.id),
      actorLabel: clean(actor.displayName || actor.name || actor.label),
    },
    sale: {
      type: IXI_ASSET_SALE_TYPES.includes(clean(input.type)) ? clean(input.type) : "sale",
      buyerPassportId: clean(input.buyerPassportId),
      buyerId: clean(input.buyerId),
      buyerLabel: clean(input.buyerLabel),
      buyerContact: clean(input.buyerContact),
      buyerEmail: clean(input.buyerEmail),
      buyerPhone: clean(input.buyerPhone),
      saleDate: clean(input.saleDate),
      salePrice: collection.invoiceTotal,
      currency: clean(sourceInvoice.currency || "USD").toUpperCase(),
      terms: clean(input.terms || sourceInvoice.paymentTerms || "DUE ON SALE"),
      dueDate: clean(input.dueDate || sourceInvoice.dueDate).slice(0, 10),
      buyerPoNumber: clean(input.buyerPoNumber || sourceInvoice.externalReference),
      billOfSaleNumber: clean(input.billOfSaleNumber),
      assetCostBasis: money(input.assetCostBasis),
      invoiceNumber,
      hoursAtSale: number(input.hoursAtSale),
      milesAtSale: number(input.milesAtSale),
      notes: clean(input.notes),
    },
    collection,
    documents: array(input.documents),
    passportState: {
      ownershipState: "sold",
      custodyState: "buyer",
      effectiveDate: clean(input.saleDate),
    },
    settlement: { status: "not-started", settlementId: "" },
    status: collection.balanceDue <= 0.005 ? "sold" : "collection-open",
    audit: {
      createdAt: now,
      createdBy: clean(actor.passportId || actor.employeeId || actor.userId),
      createdByLabel: clean(actor.displayName || actor.name || actor.label),
      updatedAt: now,
    },
    activity: [],
  };
}

export function validateIXIAssetSale(record = {}, sourceInvoice = {}) {
  const errors = {};
  const invoiceState = clean(sourceInvoice?.financialState).toLowerCase();
  if (!clean(record.context?.assetPassportId || record.context?.assetObjectId)) errors.asset = "required";
  if (!clean(record.identity?.financialInvoiceId)) errors.invoice = "required";
  if (!clean(record.sale?.invoiceNumber)) errors.invoiceNumber = "required";
  if (!clean(record.sale?.buyerLabel)) errors.buyer = "required";
  if (!clean(record.sale?.saleDate)) errors.saleDate = "required";
  if (!["billed", "partially-collected", "collected"].includes(invoiceState)) errors.invoiceState = "invoice-must-be-issued";
  if (number(record.collection?.balanceDue) > 0.005) errors.collection = "buyer-balance-outstanding";
  if (clean(record.collection?.status) !== "paid") errors.collectionStatus = "payment-required";
  return { valid: Object.keys(errors).length === 0, errors };
}

export default {
  createIXIAssetSaleDraft,
  validateIXIAssetSale,
  projectIXIAssetSaleCollection,
  IXI_ASSET_SALE_SCHEMA,
};
