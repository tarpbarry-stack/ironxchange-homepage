const clean = (value) => String(value ?? "").trim();
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const money = (value) => Math.round(num(value) * 100) / 100;
const arr = (value) => (Array.isArray(value) ? value : []);

export const IXI_TREASURY_ACCOUNT_SCHEMA = "ixi-treasury-account-v2";
export const IXI_TREASURY_RECON_SCHEMA = "ixi-treasury-reconciliation-v2";
export const IXI_TREASURY_ACCOUNT_TYPES = Object.freeze([
  "checking",
  "savings",
  "cash",
  "clearing",
  "money-market",
]);

export function createIXITreasuryAccount({ context = {}, input = {} } = {}) {
  const stamp = Date.now(),
    type = IXI_TREASURY_ACCOUNT_TYPES.includes(clean(input.accountType))
      ? clean(input.accountType)
      : "checking";
  return {
    schema: IXI_TREASURY_ACCOUNT_SCHEMA,
    identity: {
      accountId: "",
      number: clean(input.number) || `CASH-${String(stamp).slice(-6)}`,
    },
    account: {
      name: clean(input.name),
      accountType: type,
      institution: clean(input.institution),
      last4: clean(input.last4).slice(-4),
      currency: clean(input.currency || "USD").toUpperCase(),
      active: true,
    },
    context: {
      entityPassportId: clean(context.entity?.passportId),
      locationPassportId: clean(context.location?.passportId),
      primaryPassportId: clean(context.primary?.passportId),
    },
    opening: {
      effectiveDate: clean(input.openingDate),
      amount: money(input.openingBalance),
      source: clean(input.openingSource || "bank-statement"),
      reference: clean(input.openingReference),
      documentName: clean(input.documentName),
      financialDocumentId: "",
      posted: false,
    },
    control: {
      allowNegative: Boolean(input.allowNegative),
      minimumCash: Math.max(0, money(input.minimumCash)),
    },
    audit: {
      createdAt: new Date().toISOString(),
      createdByPassportId: clean(context.actor?.passportId),
      updatedAt: new Date().toISOString(),
    },
  };
}

export function validateIXITreasuryAccount(record = {}) {
  const errors = {};
  if (!clean(record.account?.name)) errors.name = "required";
  if (!/^[A-Z]{3}$/.test(clean(record.account?.currency)))
    errors.currency = "invalid";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean(record.opening?.effectiveDate)))
    errors.openingDate = "required";
  if (!Number.isFinite(Number(record.opening?.amount)))
    errors.openingBalance = "required";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function createIXITreasuryReconciliation({
  account = {},
  input = {},
} = {}) {
  const statement = money(input.statementBalance),
    book = money(input.bookBalance),
    deposits = money(input.depositsInTransit),
    outstanding = money(input.outstandingPayments),
    other = money(input.otherReconcilingItems),
    adjustedBank = money(statement + deposits - outstanding + other),
    difference = money(book - adjustedBank);
  return {
    schema: IXI_TREASURY_RECON_SCHEMA,
    identity: { reconciliationId: "", number: "" },
    accountId: clean(account.identity?.accountId),
    statement: {
      date: clean(input.statementDate),
      balance: statement,
      reference: clean(input.statementReference),
    },
    book: { balance: book },
    reconciling: {
      depositsInTransit: deposits,
      outstandingPayments: outstanding,
      otherReconcilingItems: other,
      adjustedBankBalance: adjustedBank,
      difference,
    },
    status: Math.abs(difference) < 0.005 ? "reconciled" : "out-of-balance",
    notes: clean(input.notes),
  };
}

export function validateIXITreasuryReconciliation(record = {}) {
  const errors = {};
  if (!clean(record.accountId)) errors.account = "required";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean(record.statement?.date)))
    errors.statementDate = "required";
  if (!Number.isFinite(Number(record.statement?.balance)))
    errors.statementBalance = "required";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function unwrapIXIFinancialDocument(value = {}) {
  return (
    value?.financialDocument ||
    value?.record?.financialDocument ||
    value?.data?.record?.financialDocument ||
    value
  );
}
export function hydrateIXITreasuryAccounts(records = []) {
  return arr(records)
    .map(unwrapIXIFinancialDocument)
    .filter(
      (document) =>
        clean(document.documentType) === "treasury-account" &&
        document.treasuryAccount,
    )
    .map((document) => ({
      ...document.treasuryAccount,
      identity: {
        ...document.treasuryAccount.identity,
        accountId: clean(document.financialDocumentId),
      },
      financialBinding: {
        financialDocumentId: clean(document.financialDocumentId),
      },
    }));
}
export function hydrateIXITreasuryReconciliations(records = []) {
  return arr(records)
    .map(unwrapIXIFinancialDocument)
    .filter(
      (document) =>
        clean(document.documentType) === "treasury-reconciliation" &&
        document.treasuryReconciliation,
    )
    .map((document) => ({
      ...document.treasuryReconciliation,
      identity: {
        ...document.treasuryReconciliation.identity,
        reconciliationId: clean(document.financialDocumentId),
      },
      financialBinding: {
        financialDocumentId: clean(document.financialDocumentId),
      },
    }));
}
export default {
  createIXITreasuryAccount,
  validateIXITreasuryAccount,
  createIXITreasuryReconciliation,
  validateIXITreasuryReconciliation,
  hydrateIXITreasuryAccounts,
  hydrateIXITreasuryReconciliations,
};
