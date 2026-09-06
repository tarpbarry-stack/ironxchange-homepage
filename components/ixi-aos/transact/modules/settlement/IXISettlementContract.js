const clean = (value) => String(value ?? "").trim();
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const arr = (value) => (Array.isArray(value) ? value : []);
const money = (value) => Math.round(num(value) * 100) / 100;

export const IXI_SETTLEMENT_SCHEMA = "ixi-asset-settlement-v2";
export const IXI_SETTLEMENT_STATUSES = Object.freeze([
  "draft",
  "ready",
  "approved",
  "partially-paid",
  "settled",
  "reopened",
  "superseded",
]);

function normalizeMoneyRows(rows = [], prefix = "ROW") {
  return arr(rows).map((row, index) => ({
    ...row,
    rowId:
      clean(
        row.rowId ||
          row.liabilityId ||
          row.disbursementId ||
          row.reimbursementId ||
          row.distributionId,
      ) || `${prefix}-${index + 1}`,
    amount: money(row.amount),
    included: row.included !== false,
    status: clean(row.status || "open"),
  }));
}

export function createIXISettlementDraft({
  context = {},
  sale = {},
  acquisition = {},
  projection = {},
  waterfall = {},
  input = {},
} = {}) {
  const actor = context.actor || {};
  const now = new Date().toISOString();
  return {
    schema: IXI_SETTLEMENT_SCHEMA,
    version: 1,
    identity: {
      dealId: clean(input.dealId || sale.identity?.dealId),
      settlementId: clean(input.settlementId),
      number: clean(input.number),
      clientRequestId: clean(input.clientRequestId) || `STL-${Date.now()}`,
    },
    context: {
      assetPassportId: clean(
        sale.context?.assetPassportId || context.primary?.passportId,
      ),
      assetObjectId: clean(
        sale.context?.assetObjectId || context.primary?.objectId,
      ),
      assetLabel: clean(sale.context?.assetLabel || context.primary?.label),
      entityPassportId: clean(context.entity?.passportId),
      entityLabel: clean(context.entity?.label || context.entity?.companyName),
      actorPassportId: clean(actor.passportId),
      actorId: clean(actor.employeeId || actor.userId),
      actorLabel: clean(actor.displayName || actor.name || actor.label),
    },
    references: {
      saleId: clean(sale.identity?.saleId),
      saleNumber: clean(sale.identity?.number),
      acquisitionId: clean(acquisition.identity?.acquisitionId),
      acquisitionNumber: clean(acquisition.identity?.number),
    },
    projection: { ...projection },
    waterfall: { ...waterfall },
    controls: {
      preparedBy: clean(actor.displayName || actor.name || actor.label),
      reviewedBy: clean(input.reviewedBy),
      approvedBy: "",
      approvedAt: "",
      approvalNote: clean(input.approvalNote),
      returnCapitalFirst: input.returnCapitalFirst !== false,
      canonicalCalculation: false,
      calculationVersion: "settlement-v2",
    },
    liabilities: normalizeMoneyRows(input.liabilities, "PAYOFF"),
    commissions: arr(projection.commissions),
    disbursements: normalizeMoneyRows(input.disbursements, "DISB"),
    expenseAdjustments: normalizeMoneyRows(input.expenseAdjustments, "EXP-ADJ"),
    reimbursements: normalizeMoneyRows(input.reimbursements, "REIMB"),
    priorDistributions: normalizeMoneyRows(input.priorDistributions, "PRIOR"),
    capitalEvents: arr(input.capitalEvents),
    retainedProceeds: money(input.retainedProceeds),
    ownerPayments: [],
    recipientPayments: [],
    documents: arr(input.documents),
    status: "draft",
    paymentStatus: "unpaid",
    correction: {
      reopenedAt: "",
      reopenedBy: "",
      reason: "",
      supersedesVersion: null,
    },
    audit: {
      createdAt: now,
      createdBy: clean(actor.passportId || actor.employeeId || actor.userId),
      createdByLabel: clean(actor.displayName || actor.name || actor.label),
      updatedAt: now,
    },
    activity: [],
  };
}

export function validateIXISettlement(record = {}, blockers = []) {
  const errors = {};
  if (!clean(record.references?.saleId || record.references?.saleNumber))
    errors.sale = "required";
  if (!clean(record.context?.assetPassportId || record.context?.assetObjectId))
    errors.asset = "required";
  if (Math.abs(num(record.waterfall?.shareTotal) - 100) > 0.01)
    errors.shares = "must-total-100";
  if (Math.abs(num(record.waterfall?.profitShareTotal ?? 100) - 100) > 0.01)
    errors.profitShares = "must-total-100";
  if (Math.abs(num(record.waterfall?.lossShareTotal ?? 100) - 100) > 0.01)
    errors.lossShares = "must-total-100";
  if (!record.waterfall?.balanced) errors.balance = "out-of-balance";
  if (
    arr(record.commissions).some(
      (row) =>
        row.included !== false &&
        num(row.finalAmount) > 0 &&
        !clean(row.recipientLabel),
    )
  )
    errors.commissions = "recipient-required";
  if (
    arr(record.disbursements).some(
      (row) =>
        row.included !== false && num(row.amount) > 0 && !clean(row.payeeLabel),
    )
  )
    errors.disbursements = "payee-required";
  if (arr(blockers).length) errors.blockers = arr(blockers);
  return { valid: Object.keys(errors).length === 0, errors };
}

export default {
  createIXISettlementDraft,
  validateIXISettlement,
  IXI_SETTLEMENT_SCHEMA,
  IXI_SETTLEMENT_STATUSES,
};
