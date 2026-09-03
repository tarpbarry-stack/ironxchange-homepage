const clean = value => String(value ?? "").trim();
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const arr = value => Array.isArray(value) ? value : [];
const roundMoney = value => Math.round(num(value) * 100) / 100;

export const IXI_RENTAL_EXPENSE_SCHEMA = "ixi-rental-expense-v2";
export const IXI_RENTAL_RATE_UNITS = Object.freeze(["hour", "day", "week", "month"]);
export const IXI_RENTAL_ASSET_TYPES = Object.freeze(["machine", "equipment", "vehicle", "truck", "trailer", "tool", "technology", "facility", "storage", "other"]);
export const IXI_RENTAL_STATUSES = Object.freeze(["draft", "active", "off-rent", "closed", "cancelled"]);

function normalizeCharge(item = {}, index = 0) {
  return {
    chargeId: clean(item.chargeId) || `CHG-${index + 1}`,
    type: clean(item.type || "other"),
    label: clean(item.label),
    amount: roundMoney(item.amount),
    recurrence: clean(item.recurrence || "one-time"),
    notes: clean(item.notes)
  };
}

function normalizeDocument(item = {}, index = 0) {
  return {
    documentId: clean(item.documentId) || `RENT-DOC-${index + 1}`,
    type: clean(item.type || "document"),
    fileName: clean(item.fileName),
    mimeType: clean(item.mimeType),
    size: num(item.size),
    status: clean(item.status || "local-pending-upload"),
    previewUrl: clean(item.previewUrl),
    notes: clean(item.notes)
  };
}

export function createIXIRentalExpenseDraft({ context = {}, input = {} } = {}) {
  const primary = context.primary || {};
  const now = new Date().toISOString();
  const startDate = clean(input.startDate);
  const expectedReturnDate = clean(input.expectedReturnDate);
  const rateUnit = IXI_RENTAL_RATE_UNITS.includes(clean(input.rateUnit)) ? clean(input.rateUnit) : "month";
  const baseRate = roundMoney(input.baseRate);
  const includedUsage = num(input.includedUsage);
  const overageRate = roundMoney(input.overageRate);
  const startMeter = num(input.startMeter);
  const endMeter = input.endMeter === "" || input.endMeter == null ? null : num(input.endMeter);
  const usage = endMeter == null ? 0 : Math.max(0, endMeter - startMeter);
  const overageUsage = Math.max(0, usage - includedUsage);
  const projectedOverage = roundMoney(overageUsage * overageRate);
  const charges = arr(input.charges).map(normalizeCharge);
  const oneTimeCharges = roundMoney(charges.filter(item => item.recurrence === "one-time").reduce((sum, item) => sum + item.amount, 0));
  const recurringCharges = roundMoney(charges.filter(item => item.recurrence !== "one-time").reduce((sum, item) => sum + item.amount, 0));
  const clientRequestId = clean(input.clientRequestId) || `RNTEXP-${Date.now()}`;

  return {
    schema: IXI_RENTAL_EXPENSE_SCHEMA,
    identity: {
      rentalExpenseId: clean(input.rentalExpenseId),
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
      actorLabel: clean(context.actor?.displayName || context.actor?.name || context.actor?.label),
      workOrderFinancialDocumentId: clean(input.workOrderFinancialDocumentId || context.activeWorkOrder?.financialBinding?.financialDocumentId || context.activeWorkOrder?.identity?.workOrderId)
    },
    vendor: {
      passportId: clean(input.vendorPassportId),
      vendorId: clean(input.vendorId),
      name: clean(input.vendorName),
      agreementNumber: clean(input.agreementNumber),
      contact: clean(input.vendorContact)
    },
    rentedAsset: {
      passportId: clean(input.rentedAssetPassportId),
      objectId: clean(input.rentedAssetObjectId),
      assetType: IXI_RENTAL_ASSET_TYPES.includes(clean(input.assetType)) ? clean(input.assetType) : "equipment",
      description: clean(input.assetDescription),
      serialNumber: clean(input.serialNumber),
      ownerLabel: clean(input.vendorName),
      custodyState: "rented-in",
      ownershipState: "external-owned"
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
      damageWaiver: roundMoney(input.damageWaiver),
      insurance: roundMoney(input.insurance),
      deliveryCharge: roundMoney(input.deliveryCharge),
      pickupCharge: roundMoney(input.pickupCharge),
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
      projectedOverage
    },
    custody: {
      useLocationPassportId: clean(input.useLocationPassportId || context.location?.passportId),
      useLocationLabel: clean(input.useLocationLabel || context.location?.label),
      purpose: clean(input.purpose),
      responsibleEmployeePassportId: clean(input.responsibleEmployeePassportId || context.actor?.passportId),
      responsibleEmployeeLabel: clean(input.responsibleEmployeeLabel || context.actor?.displayName || context.actor?.name || context.actor?.label),
      conditionIn: clean(input.conditionIn),
      conditionOut: clean(input.conditionOut)
    },
    economics: {
      projectionType: "rental-commitment",
      economicEvent: false,
      projectedBaseCost: 0,
      projectedOverage,
      projectedAncillaryCost: roundMoney(oneTimeCharges + recurringCharges + num(input.damageWaiver) + num(input.insurance) + num(input.deliveryCharge) + num(input.pickupCharge) + num(input.environmentalFee) + num(input.taxesEstimate)),
      projectedTotal: 0,
      billedTotal: 0,
      paidTotal: 0,
      varianceToBilled: 0,
      billIds: [],
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
    activity: []
  };
}

export function validateIXIRentalExpense(record = {}) {
  const errors = {};
  if (!clean(record.context?.primaryPassportId || record.context?.primaryObjectId)) errors.context = "required";
  if (!clean(record.context?.entityPassportId)) errors.entity = "passport-required";
  if (!clean(record.context?.actorPassportId || record.context?.actorId)) errors.actor = "identity-required";
  if (!clean(record.vendor?.name)) errors.vendor = "required";
  if (!clean(record.rentedAsset?.description)) errors.asset = "required";
  if (!clean(record.period?.startDate)) errors.startDate = "required";
  if (!(num(record.rate?.baseRate) > 0)) errors.rate = "greater-than-zero";
  if (!clean(record.period?.expectedReturnDate)) errors.expectedReturnDate = "required";
  if (record.period?.expectedReturnDate && record.period?.startDate && record.period.expectedReturnDate < record.period.startDate) errors.expectedReturnDate = "before-start";
  if (arr(record.documents).some(document => !clean(document?.storageKey || document?.key) || !["uploaded", "available", "verified"].includes(clean(document?.status).toLowerCase()))) errors.documents = "secure-upload-required";
  return { valid: Object.keys(errors).length === 0, errors };
}

export default { IXI_RENTAL_EXPENSE_SCHEMA, createIXIRentalExpenseDraft, validateIXIRentalExpense };
