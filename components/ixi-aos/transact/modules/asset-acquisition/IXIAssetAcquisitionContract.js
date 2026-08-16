const clean = value => String(value ?? "").trim();
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const obj = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const arr = value => Array.isArray(value) ? value : [];
const roundMoney = value => Math.round(num(value) * 100) / 100;

export const IXI_ASSET_ACQUISITION_SCHEMA = "ixi-asset-acquisition-v1";

export const IXI_ACQUISITION_TYPES = Object.freeze([
  "direct-purchase",
  "auction",
  "trade-in",
  "dealer",
  "private-seller",
  "entity-transfer",
  "other"
]);

export const IXI_TITLE_STATUSES = Object.freeze(["not-required", "pending", "received", "issue"]);
export const IXI_LIEN_STATUSES = Object.freeze(["none-known", "disclosed", "release-pending", "released", "disputed"]);
export const IXI_DELIVERY_STATUSES = Object.freeze(["not-picked-up", "in-transit", "received"]);

function normalizeOwner(owner = {}, index = 0) {
  const source = obj(owner);
  return {
    ownerId: clean(source.ownerId) || `OWNER-${index + 1}`,
    partyPassportId: clean(source.partyPassportId),
    partyId: clean(source.partyId),
    partyLabel: clean(source.partyLabel),
    legalOwnershipPercent: num(source.legalOwnershipPercent),
    settlementSharePercent: source.settlementSharePercent === "" || source.settlementSharePercent == null
      ? num(source.legalOwnershipPercent)
      : num(source.settlementSharePercent),
    initialContribution: roundMoney(source.initialContribution),
    contributionDate: clean(source.contributionDate),
    contributionReference: clean(source.contributionReference),
    settlementPriority: clean(source.settlementPriority || "pro-rata"),
    notes: clean(source.notes)
  };
}

function normalizePayment(payment = {}, index = 0) {
  const source = obj(payment);
  return {
    paymentEventId: clean(source.paymentEventId) || `PAY-${index + 1}`,
    date: clean(source.date),
    amount: roundMoney(source.amount),
    method: clean(source.method || "wire"),
    payerLabel: clean(source.payerLabel),
    reference: clean(source.reference),
    documentId: clean(source.documentId),
    notes: clean(source.notes)
  };
}

function normalizeEstimate(cost = {}, index = 0) {
  const source = obj(cost);
  return {
    costId: clean(source.costId) || `COST-${index + 1}`,
    category: clean(source.category || "other"),
    label: clean(source.label),
    estimatedAmount: roundMoney(source.estimatedAmount),
    notes: clean(source.notes)
  };
}

export function createIXIAssetAcquisitionDraft({ context = {}, input = {} } = {}) {
  const source = obj(input);
  const primary = obj(context.primary);
  const purchasePrice = roundMoney(source.purchasePrice);
  const buyerPremium = roundMoney(source.buyerPremium);
  const tax = roundMoney(source.tax);
  const titleFees = roundMoney(source.titleFees);
  const brokerFees = roundMoney(source.brokerFees);
  const otherAcquisitionFees = roundMoney(source.otherAcquisitionFees);
  const directAcquisitionCost = roundMoney(purchasePrice + buyerPremium + tax + titleFees + brokerFees + otherAcquisitionFees);
  const owners = arr(source.owners).map(normalizeOwner);
  const payments = arr(source.payments).map(normalizePayment);
  const makeReadyEstimates = arr(source.makeReadyEstimates).map(normalizeEstimate);
  const amountPaid = roundMoney(payments.reduce((sum, item) => sum + num(item.amount), 0));
  const estimatedMakeReady = roundMoney(makeReadyEstimates.reduce((sum, item) => sum + num(item.estimatedAmount), 0));
  const createdAt = new Date().toISOString();
  const clientRequestId = clean(source.clientRequestId) || `ACQ-${Date.now()}`;

  return {
    schema: IXI_ASSET_ACQUISITION_SCHEMA,
    identity: {
      acquisitionId: clean(source.acquisitionId),
      number: clean(source.number),
      clientRequestId
    },
    context: {
      primaryPassportId: clean(primary.passportId),
      primaryObjectId: clean(primary.objectId),
      primaryObjectType: clean(primary.objectType),
      primaryLabel: clean(primary.label),
      entityPassportId: clean(context.entity?.passportId),
      entityLabel: clean(context.entity?.label),
      locationPassportId: clean(context.location?.passportId),
      locationLabel: clean(context.location?.label),
      actorPassportId: clean(context.actor?.passportId),
      actorId: clean(context.actor?.employeeId || context.actor?.userId),
      actorLabel: clean(context.actor?.displayName || context.actor?.name || context.actor?.label)
    },
    acquisition: {
      type: IXI_ACQUISITION_TYPES.includes(clean(source.acquisitionType)) ? clean(source.acquisitionType) : "direct-purchase",
      sellerPassportId: clean(source.sellerPassportId),
      sellerId: clean(source.sellerId),
      sellerLabel: clean(source.sellerLabel),
      sourceLabel: clean(source.sourceLabel),
      sourceReference: clean(source.sourceReference),
      purchaseDate: clean(source.purchaseDate),
      invoiceNumber: clean(source.invoiceNumber),
      invoiceDate: clean(source.invoiceDate),
      invoiceAmount: roundMoney(source.invoiceAmount || purchasePrice),
      agreementNumber: clean(source.agreementNumber),
      dueDate: clean(source.dueDate),
      purchasePrice,
      buyerPremium,
      tax,
      titleFees,
      brokerFees,
      otherAcquisitionFees,
      directAcquisitionCost,
      estimatedMakeReady,
      projectedReadyCost: roundMoney(directAcquisitionCost + estimatedMakeReady)
    },
    ownership: {
      owners,
      legalOwnershipTotal: roundMoney(owners.reduce((sum, item) => sum + num(item.legalOwnershipPercent), 0)),
      settlementShareTotal: roundMoney(owners.reduce((sum, item) => sum + num(item.settlementSharePercent), 0)),
      initialCapitalTotal: roundMoney(owners.reduce((sum, item) => sum + num(item.initialContribution), 0)),
      events: []
    },
    funding: {
      payments,
      amountPaid,
      balanceDue: roundMoney(Math.max(0, directAcquisitionCost - amountPaid)),
      financed: Boolean(source.financed),
      lenderLabel: clean(source.lenderLabel),
      financingReference: clean(source.financingReference)
    },
    title: {
      titleRequired: source.titleRequired !== false,
      titleStatus: IXI_TITLE_STATUSES.includes(clean(source.titleStatus)) ? clean(source.titleStatus) : "pending",
      lienStatus: IXI_LIEN_STATUSES.includes(clean(source.lienStatus)) ? clean(source.lienStatus) : "none-known",
      sellerRepresentsClearTitle: clean(source.sellerRepresentsClearTitle || "unknown"),
      titleNumber: clean(source.titleNumber)
    },
    condition: {
      hoursAtAcquisition: num(source.hoursAtAcquisition),
      milesAtAcquisition: num(source.milesAtAcquisition),
      condition: clean(source.condition || "running"),
      knownIssues: clean(source.knownIssues)
    },
    logistics: {
      purchaseLocation: clean(source.purchaseLocation),
      deliverToPassportId: clean(source.deliverToPassportId || context.location?.passportId),
      deliverToLabel: clean(source.deliverToLabel || context.location?.label),
      freightResponsibility: clean(source.freightResponsibility || "buyer"),
      pickupDate: clean(source.pickupDate),
      expectedDeliveryDate: clean(source.expectedDeliveryDate),
      receivedDate: clean(source.receivedDate),
      deliveryStatus: IXI_DELIVERY_STATUSES.includes(clean(source.deliveryStatus)) ? clean(source.deliveryStatus) : "not-picked-up"
    },
    makeReady: {
      estimates: makeReadyEstimates,
      actuals: [],
      actualTotal: 0,
      variance: roundMoney(-estimatedMakeReady),
      inServiceDate: clean(source.inServiceDate),
      inServiceAt: "",
      inServiceBy: "",
      status: clean(source.inServiceDate) ? "closed" : "open"
    },
    documents: arr(source.documents),
    settlementTerms: {
      returnCapitalFirst: source.returnCapitalFirst !== false,
      notes: clean(source.settlementTermsNotes)
    },
    notes: clean(source.notes),
    status: "draft",
    audit: {
      createdAt,
      createdBy: clean(context.actor?.passportId || context.actor?.employeeId || context.actor?.userId),
      createdByLabel: clean(context.actor?.displayName || context.actor?.name || context.actor?.label),
      updatedAt: createdAt
    }
  };
}

export function validateIXIAssetAcquisition(record = {}) {
  const source = obj(record);
  const errors = {};
  if (!clean(source.context?.primaryPassportId || source.context?.primaryObjectId)) errors.asset = "required";
  if (!clean(source.acquisition?.sellerLabel)) errors.seller = "required";
  if (!clean(source.acquisition?.purchaseDate)) errors.purchaseDate = "required";
  if (!(num(source.acquisition?.purchasePrice) >= 0)) errors.purchasePrice = "required";
  if (Math.abs(num(source.ownership?.legalOwnershipTotal) - 100) > 0.01) errors.ownership = "must-total-100";
  if (Math.abs(num(source.ownership?.settlementShareTotal) - 100) > 0.01) errors.settlement = "must-total-100";
  return { valid: Object.keys(errors).length === 0, errors };
}

export default {
  createIXIAssetAcquisitionDraft,
  validateIXIAssetAcquisition,
  IXI_ASSET_ACQUISITION_SCHEMA
};
