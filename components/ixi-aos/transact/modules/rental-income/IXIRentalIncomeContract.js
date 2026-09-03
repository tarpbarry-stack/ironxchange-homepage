const clean = value => String(value ?? "").trim();
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const arr = value => Array.isArray(value) ? value : [];
const roundMoney = value => Math.round(num(value) * 100) / 100;

export const IXI_RENTAL_INCOME_SCHEMA = "ixi-rental-income-v2";
export const IXI_RENTAL_INCOME_RATE_UNITS = Object.freeze(["hour", "day", "week", "month"]);
export const IXI_RENTAL_INCOME_STATUSES = Object.freeze(["draft", "active", "off-rent", "closed", "cancelled"]);

function normalizeCharge(item = {}, index = 0) {
  return {
    chargeId: clean(item.chargeId) || `RINC-CHG-${index + 1}`,
    type: clean(item.type || "other"),
    label: clean(item.label),
    amount: roundMoney(item.amount),
    recurrence: clean(item.recurrence || "one-time"),
    notes: clean(item.notes)
  };
}

function normalizeDocument(item = {}, index = 0) {
  return {
    documentId: clean(item.documentId) || `RINC-DOC-${index + 1}`,
    type: clean(item.type || "document"),
    fileName: clean(item.fileName),
    mimeType: clean(item.mimeType),
    size: num(item.size),
    status: clean(item.status || "local-pending-upload"),
    previewUrl: clean(item.previewUrl),
    notes: clean(item.notes)
  };
}

export function createIXIRentalIncomeDraft({ context = {}, input = {} } = {}) {
  const primary = context.primary || {};
  const now = new Date().toISOString();
  const startDate = clean(input.startDate);
  const expectedReturnDate = clean(input.expectedReturnDate);
  const rateUnit = IXI_RENTAL_INCOME_RATE_UNITS.includes(clean(input.rateUnit)) ? clean(input.rateUnit) : "month";
  const baseRate = roundMoney(input.baseRate);
  const includedUsage = num(input.includedUsage);
  const overageRate = roundMoney(input.overageRate);
  const startMeter = num(input.startMeter);
  const endMeter = input.endMeter === "" || input.endMeter == null ? null : num(input.endMeter);
  const usage = endMeter == null ? 0 : Math.max(0, endMeter - startMeter);
  const overageUsage = Math.max(0, usage - includedUsage);
  const projectedOverageRevenue = roundMoney(overageUsage * overageRate);
  const charges = arr(input.charges).map(normalizeCharge);
  const oneTimeCharges = roundMoney(charges.filter(item => item.recurrence === "one-time").reduce((sum, item) => sum + item.amount, 0));
  const recurringCharges = roundMoney(charges.filter(item => item.recurrence !== "one-time").reduce((sum, item) => sum + item.amount, 0));
  const clientRequestId = clean(input.clientRequestId) || `RNTINC-${Date.now()}`;

  return {
    schema: IXI_RENTAL_INCOME_SCHEMA,
    identity: {
      rentalIncomeId: clean(input.rentalIncomeId),
      number: clean(input.number),
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
      actorId: clean(context.actor?.employeeId || context.actor?.userId || context.actor?.id),
      actorLabel: clean(context.actor?.displayName || context.actor?.name || context.actor?.label)
    },
    customer: {
      passportId: clean(input.customerPassportId),
      customerId: clean(input.customerId),
      name: clean(input.customerName),
      contact: clean(input.customerContact),
      rentalAgreementNumber: clean(input.rentalAgreementNumber)
    },
    ownedAsset: {
      passportId: clean(input.assetPassportId || primary.passportId),
      objectId: clean(input.assetObjectId || primary.objectId),
      objectType: clean(input.assetObjectType || primary.objectType),
      label: clean(input.assetLabel || primary.label),
      serialNumber: clean(input.serialNumber),
      ownershipState: "owned",
      custodyState: "customer-custody"
    },
    period: {
      startDate,
      expectedReturnDate,
      actualOffRentDate: clean(input.actualOffRentDate),
      offRentAt: "",
      status: "active",
      extensions: []
    },
    rate: {
      baseRate,
      unit: rateUnit,
      includedUsage,
      includedUsageUnit: clean(input.includedUsageUnit || "hours"),
      overageRate,
      minimumPeriods: Math.max(0, num(input.minimumPeriods || 1))
    },
    terms: {
      deposit: roundMoney(input.deposit),
      deliveryCharge: roundMoney(input.deliveryCharge),
      pickupCharge: roundMoney(input.pickupCharge),
      damageWaiverCharge: roundMoney(input.damageWaiverCharge),
      insuranceCharge: roundMoney(input.insuranceCharge),
      environmentalFee: roundMoney(input.environmentalFee),
      taxesEstimate: roundMoney(input.taxesEstimate),
      fuelReturnRequirement: clean(input.fuelReturnRequirement),
      fuelOut: clean(input.fuelOut),
      fuelIn: clean(input.fuelIn),
      otherTerms: clean(input.otherTerms),
      charges,
      oneTimeCharges,
      recurringCharges
    },
    usage: {
      meterType: clean(input.meterType || "hours"),
      startMeter,
      endMeter,
      usage,
      overageUsage,
      projectedOverageRevenue
    },
    custody: {
      customerLocation: clean(input.customerLocation),
      jobOrPurpose: clean(input.jobOrPurpose),
      deliveryResponsibility: clean(input.deliveryResponsibility || "owner"),
      responsibleContact: clean(input.responsibleContact),
      conditionOut: clean(input.conditionOut),
      conditionIn: clean(input.conditionIn)
    },
    economics: {
      projectionType: "rental-revenue",
      economicEvent: true,
      recognitionState: "contracted-not-billed",
      projectedBaseRevenue: 0,
      projectedOverageRevenue,
      projectedAncillaryRevenue: roundMoney(oneTimeCharges + num(input.deliveryCharge) + num(input.pickupCharge) + num(input.damageWaiverCharge) + num(input.insuranceCharge) + num(input.environmentalFee)),
      recurringRevenuePerPeriod: recurringCharges,
      projectedRecurringRevenue: 0,
      projectedTax: roundMoney(input.taxesEstimate),
      projectedDeposit: roundMoney(input.deposit),
      projectedInvoiceTotal: 0,
      projectedRevenue: 0,
      invoicedRevenue: 0,
      receivedRevenue: 0,
      outstandingReceivable: 0,
      varianceToInvoiced: 0,
      invoiceIds: [],
      paymentIds: []
    },
    documents: arr(input.documents).map(normalizeDocument),
    notes: clean(input.notes),
    status: "active",
    audit: {
      createdAt: now,
      createdBy: clean(context.actor?.passportId || context.actor?.employeeId || context.actor?.userId || context.actor?.id),
      createdByLabel: clean(context.actor?.displayName || context.actor?.name || context.actor?.label),
      updatedAt: now
    },
    activity: [{
      eventId: `RINC-START-${clientRequestId}`,
      type: "rental-started",
      occurredAt: now,
      actorId: clean(context.actor?.passportId || context.actor?.employeeId || context.actor?.userId || context.actor?.id),
      actorLabel: clean(context.actor?.displayName || context.actor?.name || context.actor?.label)
    }]
  };
}

export function validateIXIRentalIncome(record = {}) {
  const errors = {};
  if (!clean(record.context?.primaryPassportId || record.context?.primaryObjectId)) errors.asset = "required";
  if (!clean(record.context?.entityPassportId)) errors.entity = "required";
  if (!clean(record.context?.actorPassportId || record.context?.actorId)) errors.actor = "required";
  if (!clean(record.customer?.name)) errors.customer = "required";
  if (!clean(record.period?.startDate)) errors.startDate = "required";
  if (!clean(record.period?.expectedReturnDate)) errors.expectedReturnDate = "required";
  if (record.period?.expectedReturnDate && record.period?.startDate && record.period.expectedReturnDate < record.period.startDate) errors.expectedReturnDate = "before-start";
  if (!(num(record.rate?.baseRate) > 0)) errors.rate = "required";
  if (arr(record.documents).some(item => !clean(item.storageKey || item.key) || !["uploaded", "available", "verified"].includes(clean(item.status).toLowerCase()))) errors.documents = "upload-required";
  return { valid: Object.keys(errors).length === 0, errors };
}

export default { IXI_RENTAL_INCOME_SCHEMA, createIXIRentalIncomeDraft, validateIXIRentalIncome };
