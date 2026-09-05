const clean = (value) => String(value ?? "").trim();
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const obj = (value) => (value && typeof value === "object" && !Array.isArray(value) ? value : {});
const arr = (value) => (Array.isArray(value) ? value : []);
const roundMoney = (value) => Math.round(num(value) * 100) / 100;

export const IXI_ASSET_ACQUISITION_SCHEMA = "ixi-asset-acquisition-v3";

export const IXI_ACQUISITION_TYPES = Object.freeze(["direct-purchase", "auction", "trade-in", "dealer", "private-seller", "entity-transfer", "other"]);

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
    settlementSharePercent: source.settlementSharePercent === "" || source.settlementSharePercent == null ? num(source.legalOwnershipPercent) : num(source.settlementSharePercent),
    initialContribution: roundMoney(source.initialContribution),
    contributionDate: clean(source.contributionDate),
    contributionReference: clean(source.contributionReference),
    settlementPriority: clean(source.settlementPriority || "pro-rata"),
    notes: clean(source.notes),
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
    notes: clean(source.notes),
  };
}

function normalizeEstimate(cost = {}, index = 0) {
  const source = obj(cost);
  return {
    costId: clean(source.costId) || `COST-${index + 1}`,
    category: clean(source.category || "other"),
    label: clean(source.label),
    estimatedAmount: roundMoney(source.estimatedAmount),
    notes: clean(source.notes),
  };
}

const PURCHASE_BASIS_FIELDS = Object.freeze([
  "purchasePrice",
  "buyerPremium",
  "auctionDocumentFees",
  "nonrecoverableTax",
  "titleFees",
  "brokerFees",
  "otherAcquisitionFees",
  "tradeAllowance",
  "sellerCredits",
]);

export const IXI_ACQUISITION_ADJUSTABLE_FIELDS = PURCHASE_BASIS_FIELDS;

export function calculateIXIAcquisitionBasis(acquisition = {}) {
  const source = obj(acquisition);
  return roundMoney(
    num(source.purchasePrice) +
      num(source.buyerPremium) +
      num(source.auctionDocumentFees) +
      num(source.nonrecoverableTax ?? source.tax) +
      num(source.titleFees) +
      num(source.brokerFees) +
      num(source.otherAcquisitionFees) -
      num(source.tradeAllowance) -
      num(source.sellerCredits),
  );
}

function purchaseSnapshot(acquisition = {}) {
  const source = obj(acquisition);
  return Object.fromEntries(PURCHASE_BASIS_FIELDS.map((field) => [field, roundMoney(source[field] ?? (field === "nonrecoverableTax" ? source.tax : 0))]));
}

export function hydrateIXIAssetAcquisitionRecord(record = {}) {
  const source = obj(record);
  const acquisition = obj(source.acquisition);
  const normalizedAcquisition = {
    ...acquisition,
    auctionDocumentFees: roundMoney(acquisition.auctionDocumentFees),
    nonrecoverableTax: roundMoney(acquisition.nonrecoverableTax ?? acquisition.tax),
    tax: roundMoney(acquisition.nonrecoverableTax ?? acquisition.tax),
    tradeAllowance: roundMoney(acquisition.tradeAllowance),
    sellerCredits: roundMoney(acquisition.sellerCredits),
  };
  const calculatedBasis = calculateIXIAcquisitionBasis(normalizedAcquisition);
  const currentAcquisitionBasis = roundMoney(acquisition.currentAcquisitionBasis ?? acquisition.directAcquisitionCost ?? calculatedBasis);
  const originalAcquisitionBasis = roundMoney(acquisition.originalAcquisitionBasis ?? acquisition.directAcquisitionCost ?? calculatedBasis);
  const legacyEstimates = arr(source.makeReady?.estimates).map(normalizeEstimate);
  return {
    ...source,
    schema: clean(source.schema) || IXI_ASSET_ACQUISITION_SCHEMA,
    acquisition: {
      ...normalizedAcquisition,
      originalPurchase: obj(acquisition.originalPurchase && Object.keys(acquisition.originalPurchase).length ? acquisition.originalPurchase : purchaseSnapshot(normalizedAcquisition)),
      originalAcquisitionBasis,
      amendmentTotal: roundMoney(acquisition.amendmentTotal),
      packageNormalizationTotal: roundMoney(acquisition.packageNormalizationTotal),
      currentAcquisitionBasis,
      directAcquisitionCost: currentAcquisitionBasis,
    },
    adjustments: arr(source.adjustments),
    packageAllocation: {
      packageId: clean(source.packageAllocation?.packageId),
      packageReference: clean(source.packageAllocation?.packageReference),
      packageTotal: roundMoney(source.packageAllocation?.packageTotal),
      allocationMethod: clean(source.packageAllocation?.allocationMethod),
      allocations: arr(source.packageAllocation?.allocations),
      events: arr(source.packageAllocation?.events),
    },
    makeReady: {
      ...(source.makeReady || {}),
      estimates: legacyEstimates,
      legacyPlanningSnapshot: legacyEstimates.length > 0,
    },
  };
}

export function createIXIAssetAcquisitionDraft({ context = {}, input = {} } = {}) {
  const source = obj(input);
  const primary = obj(context.primary);
  const purchasePrice = roundMoney(source.purchasePrice);
  const buyerPremium = roundMoney(source.buyerPremium);
  const auctionDocumentFees = roundMoney(source.auctionDocumentFees);
  const nonrecoverableTax = roundMoney(source.nonrecoverableTax ?? source.tax);
  const titleFees = roundMoney(source.titleFees);
  const brokerFees = roundMoney(source.brokerFees);
  const otherAcquisitionFees = roundMoney(source.otherAcquisitionFees);
  const tradeAllowance = roundMoney(source.tradeAllowance);
  const sellerCredits = roundMoney(source.sellerCredits);
  const originalPurchase = purchaseSnapshot({ purchasePrice, buyerPremium, auctionDocumentFees, nonrecoverableTax, titleFees, brokerFees, otherAcquisitionFees, tradeAllowance, sellerCredits });
  const directAcquisitionCost = calculateIXIAcquisitionBasis(originalPurchase);
  const owners = arr(source.owners).map(normalizeOwner);
  const payments = arr(source.payments).map(normalizePayment);
  const makeReadyEstimates = [];
  const amountPaid = roundMoney(payments.reduce((sum, item) => sum + num(item.amount), 0));
  const estimatedMakeReady = roundMoney(makeReadyEstimates.reduce((sum, item) => sum + num(item.estimatedAmount), 0));
  const createdAt = new Date().toISOString();
  const clientRequestId = clean(source.clientRequestId) || `ACQ-${Date.now()}`;

  return {
    schema: IXI_ASSET_ACQUISITION_SCHEMA,
    identity: {
      acquisitionId: clean(source.acquisitionId),
      number: clean(source.number),
      clientRequestId,
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
      actorLabel: clean(context.actor?.displayName || context.actor?.name || context.actor?.label),
    },
    acquisition: {
      type: IXI_ACQUISITION_TYPES.includes(clean(source.acquisitionType)) ? clean(source.acquisitionType) : "direct-purchase",
      sellerPassportId: clean(source.sellerPassportId),
      sellerId: clean(source.sellerId),
      sellerLabel: clean(source.sellerLabel),
      sourceLabel: clean(source.sourceLabel),
      sourceChannel: clean(source.sourceChannel || source.sourceLabel),
      sourceReference: clean(source.sourceReference),
      auctionLotNumber: clean(source.auctionLotNumber),
      purchaseDate: clean(source.purchaseDate),
      invoiceNumber: clean(source.invoiceNumber),
      invoiceDate: clean(source.invoiceDate),
      invoiceAmount: roundMoney(source.invoiceAmount || purchasePrice),
      agreementNumber: clean(source.agreementNumber),
      purchaseOrderNumber: clean(source.purchaseOrderNumber),
      dueDate: clean(source.dueDate),
      paymentTerms: clean(source.paymentTerms),
      purchasePrice,
      buyerPremium,
      auctionDocumentFees,
      nonrecoverableTax,
      tax: nonrecoverableTax,
      titleFees,
      brokerFees,
      otherAcquisitionFees,
      tradeAllowance,
      sellerCredits,
      originalPurchase,
      originalAcquisitionBasis: directAcquisitionCost,
      amendmentTotal: 0,
      packageNormalizationTotal: 0,
      currentAcquisitionBasis: directAcquisitionCost,
      directAcquisitionCost,
      estimatedMakeReady,
      projectedReadyCost: roundMoney(directAcquisitionCost + estimatedMakeReady),
    },
    ownership: {
      owners,
      legalOwnershipTotal: roundMoney(owners.reduce((sum, item) => sum + num(item.legalOwnershipPercent), 0)),
      settlementShareTotal: roundMoney(owners.reduce((sum, item) => sum + num(item.settlementSharePercent), 0)),
      initialCapitalTotal: roundMoney(owners.reduce((sum, item) => sum + num(item.initialContribution), 0)),
      events: [],
    },
    funding: {
      payments,
      amountPaid,
      balanceDue: roundMoney(Math.max(0, directAcquisitionCost - amountPaid)),
      financed: Boolean(source.financed),
      lenderLabel: clean(source.lenderLabel),
      financingReference: clean(source.financingReference),
      paymentTerms: clean(source.paymentTerms),
      dueDate: clean(source.dueDate),
    },
    title: {
      titleRequired: source.titleRequired !== false,
      titleStatus: source.titleRequired === false ? "not-required" : IXI_TITLE_STATUSES.includes(clean(source.titleStatus)) ? clean(source.titleStatus) : "pending",
      lienStatus: IXI_LIEN_STATUSES.includes(clean(source.lienStatus)) ? clean(source.lienStatus) : "none-known",
      sellerRepresentsClearTitle: clean(source.sellerRepresentsClearTitle || "unknown"),
      titleNumber: clean(source.titleNumber),
    },
    condition: {
      hoursAtAcquisition: num(source.hoursAtAcquisition),
      milesAtAcquisition: num(source.milesAtAcquisition),
      condition: clean(source.condition || "running"),
      knownIssues: clean(source.knownIssues),
      intakeExceptions: clean(source.intakeExceptions),
    },
    logistics: {
      purchaseLocation: clean(source.purchaseLocation),
      deliverToPassportId: clean(source.deliverToPassportId || context.location?.passportId),
      deliverToLabel: clean(source.deliverToLabel || context.location?.label),
      freightResponsibility: clean(source.freightResponsibility || "buyer"),
      pickupDate: clean(source.pickupDate),
      expectedDeliveryDate: clean(source.expectedDeliveryDate),
      receivedDate: clean(source.receivedDate),
      deliveryStatus: IXI_DELIVERY_STATUSES.includes(clean(source.deliveryStatus)) ? clean(source.deliveryStatus) : "not-picked-up",
    },
    makeReady: {
      // v3 never originates planning estimates here. Kept only to hydrate v2 records.
      estimates: makeReadyEstimates,
      actuals: [],
      actualTotal: 0,
      variance: roundMoney(-estimatedMakeReady),
      inServiceDate: clean(source.inServiceDate),
      inServiceAt: "",
      inServiceBy: "",
      status: clean(source.inServiceDate) ? "closed" : "open",
    },
    documents: arr(source.documents),
    control: {
      responsibleEmployeePassportId: clean(source.responsibleEmployeePassportId || context.actor?.passportId),
      responsibleEmployeeId: clean(source.responsibleEmployeeId || context.actor?.employeeId || context.actor?.userId),
      responsibleEmployeeLabel: clean(source.responsibleEmployeeLabel || context.actor?.displayName || context.actor?.name || context.actor?.label),
    },
    adjustments: [],
    packageAllocation: {
      packageId: "",
      packageReference: "",
      packageTotal: 0,
      allocationMethod: "",
      allocations: [],
      events: [],
    },
    settlementTerms: {
      returnCapitalFirst: source.returnCapitalFirst !== false,
      notes: clean(source.settlementTermsNotes),
    },
    notes: clean(source.notes),
    status: "draft",
    audit: {
      createdAt,
      createdBy: clean(context.actor?.passportId || context.actor?.employeeId || context.actor?.userId),
      createdByLabel: clean(context.actor?.displayName || context.actor?.name || context.actor?.label),
      updatedAt: createdAt,
    },
  };
}

export function validateIXIAssetAcquisition(record = {}) {
  const source = hydrateIXIAssetAcquisitionRecord(record);
  const errors = {};
  const acquisition = obj(source.acquisition);
  const funding = obj(source.funding);
  if (!clean(source.context?.primaryPassportId)) errors.asset = "passport-required";
  if (!clean(source.context?.entityPassportId)) errors.entity = "passport-required";
  if (!clean(source.context?.actorPassportId || source.context?.actorId)) errors.actor = "identity-required";
  if (!clean(source.acquisition?.sellerLabel)) errors.seller = "required";
  if (!clean(source.acquisition?.purchaseDate)) errors.purchaseDate = "required";
  if (!(num(acquisition.purchasePrice) > 0)) errors.purchasePrice = "greater-than-zero";
  if (PURCHASE_BASIS_FIELDS.some((field) => num(acquisition[field]) < 0)) errors.costs = "non-negative";
  if (num(acquisition.currentAcquisitionBasis) < 0) errors.basis = "non-negative";
  if (Math.abs(num(source.ownership?.legalOwnershipTotal) - 100) > 0.01) errors.ownership = "must-total-100";
  if (Math.abs(num(source.ownership?.settlementShareTotal) - 100) > 0.01) errors.settlement = "must-total-100";
  if (!arr(source.ownership?.owners).length || arr(source.ownership?.owners).some((owner) => !clean(owner?.partyLabel))) errors.owner = "named-owner-required";
  if (arr(funding.payments).some((payment) => !clean(payment?.date) || !(num(payment?.amount) > 0))) errors.payments = "valid-date-and-positive-amount-required";
  if (num(funding.amountPaid) > num(acquisition.directAcquisitionCost) + 0.005) errors.overpayment = "funding-exceeds-basis";
  if (funding.financed && !clean(funding.lenderLabel)) errors.lender = "required";
  if (arr(source.documents).some((document) => !clean(document?.storageKey || document?.key) || !["uploaded", "available", "verified"].includes(clean(document?.status).toLowerCase()))) errors.documents = "secure-upload-required";
  return { valid: Object.keys(errors).length === 0, errors };
}

export default {
  calculateIXIAcquisitionBasis,
  createIXIAssetAcquisitionDraft,
  hydrateIXIAssetAcquisitionRecord,
  validateIXIAssetAcquisition,
  IXI_ASSET_ACQUISITION_SCHEMA,
};
