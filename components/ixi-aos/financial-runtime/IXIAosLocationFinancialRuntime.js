import {
  createIXIAosBill,
  createIXIAosPayment,
  getIXIAosFinancialPassportId
} from "./IXIAosFinancialRuntimeAdapter";
import {
  createIXIAosFinancialViewModel
} from "./IXIAosFinancialSnapshotRuntime";

const clean = value => String(value ?? "").trim();
const asArray = value => Array.isArray(value) ? value : [];
const asObject = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export const LOCATION_FINANCIAL_RESPONSIBILITY = Object.freeze({
  TENANT: "tenant",
  LANDLORD: "landlord",
  SHARED: "shared",
  INCLUDED: "included-in-rent",
  PASS_THROUGH: "pass-through",
  OWNER: "owner"
});

export const LOCATION_OBLIGATION_STATUS = Object.freeze({
  OPEN: "open",
  SCHEDULED: "scheduled",
  AUTO: "auto",
  ACTIVE: "active",
  PAID: "paid",
  OVERDUE: "overdue"
});

export function getIXILocationOwnershipMode(object = {}) {
  const fields = asObject(object.fields);
  return clean(fields.ownershipStatus || object.ownershipStatus || "owned").toLowerCase() === "leased"
    ? "leased"
    : "owned";
}

export function getIXILocationObligations(object = {}) {
  const fields = asObject(object.fields);
  const source =
    asArray(fields.financialObligations).length ? fields.financialObligations :
    asArray(fields.obligations).length ? fields.obligations :
    asArray(object.financialObligations);

  return source.map((item, index) => {
    const row = asObject(item);
    return {
      obligationId: clean(row.obligationId || row.id || `location-obligation-${index + 1}`),
      label: clean(row.label || row.name || row.category || "OBLIGATION"),
      category: clean(row.category || row.label || "other").toLowerCase(),
      payee: clean(row.payee),
      amount: number(row.amount),
      frequency: clean(row.frequency || "monthly").toLowerCase(),
      nextDue: clean(row.nextDue || row.dueDate),
      status: clean(row.status || LOCATION_OBLIGATION_STATUS.OPEN).toLowerCase(),
      autoPay: Boolean(row.autoPay),
      ytdPaid: number(row.ytdPaid),
      accountNumber: clean(row.accountNumber || row.accountNo),
      responsibleParty: clean(
        row.responsibleParty ||
        (getIXILocationOwnershipMode(object) === "leased"
          ? LOCATION_FINANCIAL_RESPONSIBILITY.TENANT
          : LOCATION_FINANCIAL_RESPONSIBILITY.OWNER)
      ).toLowerCase(),
      relatedObjectId: clean(row.relatedObjectId),
      metadata: { ...asObject(row.metadata) }
    };
  });
}

export function createIXILocationFinancialViewModel({
  object = {},
  financialSnapshot = {},
  now = new Date()
} = {}) {
  const obligations = getIXILocationObligations(object);
  const today = now instanceof Date ? now : new Date(now);
  const nowMs = Number.isNaN(today.getTime()) ? Date.now() : today.getTime();
  const in30 = nowMs + 30 * 86400000;

  const due = obligations
    .map(item => ({
      ...item,
      dueMs: item.nextDue ? new Date(item.nextDue).getTime() : NaN
    }))
    .filter(item => !Number.isNaN(item.dueMs))
    .sort((a, b) => a.dueMs - b.dueMs);

  const unpaid = due.filter(item => item.status !== LOCATION_OBLIGATION_STATUS.PAID);
  const nextObligation = unpaid.find(item => item.dueMs >= nowMs) || unpaid[0] || null;
  const due30Days = unpaid
    .filter(item => item.dueMs >= nowMs && item.dueMs <= in30)
    .reduce((sum, item) => sum + item.amount, 0);
  const overdue = unpaid
    .filter(item => item.dueMs < nowMs)
    .reduce((sum, item) => sum + item.amount, 0);

  const canonical = createIXIAosFinancialViewModel({
    source: financialSnapshot,
    currency: clean(object.currency || object?.fields?.currency || "USD") || "USD"
  });

  const hasFinancialSnapshot = Boolean(
    canonical.documentCount ||
    canonical.factCount ||
    canonical.commitment ||
    canonical.incurredCost ||
    canonical.paid ||
    canonical.unpaid ||
    canonical.revenue ||
    canonical.inflow ||
    canonical.outflow
  );

  const scheduledYtdPaid = obligations.reduce((sum, item) => sum + item.ytdPaid, 0);

  return {
    passportId: getIXIAosFinancialPassportId(object),
    ownershipMode: getIXILocationOwnershipMode(object),
    obligations,
    nextObligation,
    due30Days,
    overdue,
    ytdPaid: hasFinancialSnapshot ? canonical.paid : scheduledYtdPaid,
    financialTotals: {
      revenueYtd: canonical.revenue || canonical.inflow,
      expensesYtd: canonical.incurredCost || canonical.outflow,
      netIncomeYtd: canonical.operatingNet || canonical.net,
      committed: canonical.commitment,
      billed: canonical.incurredCost,
      paid: canonical.paid,
      unpaid: canonical.unpaid,
      projectedOutflow: canonical.projectedOutflow,
      receivable: canonical.receivable,
      collected: canonical.collected
    },
    canonicalFinancialView: canonical,
    hasFinancialSnapshot
  };
}

function createFinancialLines(obligation) {
  return [{
    description: obligation.label,
    quantity: 1,
    rate: obligation.amount,
    amount: obligation.amount,
    currency: "USD",
    accounting: {
      category: obligation.category
    }
  }];
}

export async function postIXILocationObligationBill({
  object = {},
  obligation = {},
  apiBaseUrl = "",
  headers = {},
  signal
} = {}) {
  const row = asObject(obligation);
  if (!getIXIAosFinancialPassportId(object)) {
    throw new Error("Location Passport is required before posting a financial bill.");
  }

  return createIXIAosBill({
    object,
    input: {
      title: clean(row.label || "LOCATION OBLIGATION"),
      description: clean(row.payee || row.label),
      currency: "USD",
      dueDate: clean(row.nextDue || row.dueDate),
      lines: createFinancialLines(row),
      metadata: {
        obligationId: clean(row.obligationId || row.id),
        locationObligationId: clean(row.obligationId || row.id),
        category: clean(row.category),
        frequency: clean(row.frequency),
        responsibleParty: clean(row.responsibleParty),
        source: "location-f4-obligation"
      }
    },
    apiBaseUrl,
    headers,
    signal
  });
}

export async function recordIXILocationObligationPayment({
  object = {},
  obligation = {},
  paidAt = new Date().toISOString(),
  apiBaseUrl = "",
  headers = {},
  signal
} = {}) {
  const row = asObject(obligation);
  if (!getIXIAosFinancialPassportId(object)) {
    throw new Error("Location Passport is required before recording a financial payment.");
  }

  return createIXIAosPayment({
    object,
    input: {
      title: `PAYMENT · ${clean(row.label || "LOCATION OBLIGATION")}`,
      description: clean(row.payee || row.label),
      currency: "USD",
      amount: number(row.amount),
      occurredAt: paidAt,
      transactionDate: paidAt,
      metadata: {
        obligationId: clean(row.obligationId || row.id),
        locationObligationId: clean(row.obligationId || row.id),
        category: clean(row.category),
        responsibleParty: clean(row.responsibleParty),
        source: "location-f4-obligation"
      }
    },
    apiBaseUrl,
    headers,
    signal
  });
}
