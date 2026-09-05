const clean = value => String(value ?? "").trim();
const array = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const money = value => Math.round((Number(value) || 0) * 100) / 100;
const now = () => new Date().toISOString();
const CATEGORY_ALIASES = Object.freeze({ "parts-fittings": "parts-material", supplies: "supplies-consumables", fuel: "fuel-fluids" });
const categoryId = value => CATEGORY_ALIASES[clean(value).toLowerCase()] || clean(value).toLowerCase();

export const IXI_EXPENSE_LOCKED_STATES = Object.freeze([
  "paid", "posted", "reconciled", "settled", "closed", "void", "voided", "reversed"
]);

function envelope(record = {}) {
  return record?.record || record || {};
}

export function expenseFinancialDocument(record = {}) {
  const source = envelope(record);
  const document = source?.financialDocument || source?.document?.financialDocument || source?.document || source;
  return { ...document, metadata: { ...object(source?.metadata), ...object(document?.metadata) } };
}

function revisionOf(record = {}) {
  const source = envelope(record);
  return Number(source?.server?.revision || record?.server?.revision || source?.revision || 1);
}

function actorOf(actor = {}) {
  return {
    actorId: clean(actor.passportId || actor.employeeId || actor.userId || actor.id),
    actorLabel: clean(actor.displayName || actor.name || actor.label)
  };
}

function expenseFromDocument(document = {}) {
  const stored = object(document.expenseRecord);
  const details = object(stored.expense);
  return {
    vendor: clean(details.vendor || document.vendor),
    description: clean(details.description || document.description || document.memo),
    amount: money(details.amount ?? document.amount ?? document.totalAmount ?? document.totals?.total),
    currency: clean(details.currency || document.currency || "USD").toUpperCase(),
    category: categoryId(details.category || document.category || document.metadata?.expenseCategory),
    costPurpose: clean(details.costPurpose || stored.accounting?.costPurpose || document.costPurpose || document.metadata?.expenseCostPurpose || "other"),
    expenseDate: clean(details.expenseDate || document.expenseDate || document.occurredAt).slice(0, 10),
    paymentMethod: clean(details.paymentMethod || document.paymentMethod || "other"),
    referenceNumber: clean(details.referenceNumber || document.referenceNumber || document.externalReference),
    notes: clean(details.notes || document.notes || document.memo),
    receiptRequired: Boolean(details.receiptRequired ?? document.receiptRequired)
  };
}

function correctionDocuments(financialRecords = [], sourceFinancialDocumentId = "") {
  return array(financialRecords).map(item => ({ item, document: expenseFinancialDocument(item) })).filter(({ document }) => {
    return Boolean(document?.metadata?.expenseCorrection) && clean(document.sourceFinancialDocumentId) === clean(sourceFinancialDocumentId);
  }).sort((left, right) => String(left.document.occurredAt || "").localeCompare(String(right.document.occurredAt || "")));
}

export function isIXIExpenseLocked(record = {}) {
  return IXI_EXPENSE_LOCKED_STATES.includes(clean(record.status).toLowerCase());
}

export function hydrateIXIExpenseRecord(financialRecord = {}, financialRecords = []) {
  const source = envelope(financialRecord);
  const document = expenseFinancialDocument(financialRecord);
  const embedded = object(document.expenseRecord);
  const financialDocumentId = clean(document.financialDocumentId || embedded.identity?.financialDocumentId || embedded.identity?.expenseId);
  if (!financialDocumentId) return null;
  const baseExpense = expenseFromDocument(document);
  const corrections = correctionDocuments(financialRecords, financialDocumentId).map(({ item, document: correction }) => ({
    ...object(correction.expenseCorrection),
    correctionDocumentId: clean(correction.financialDocumentId),
    correctionNumber: clean(correction.documentNumber),
    revision: revisionOf(item)
  }));
  const latestCorrection = corrections.at(-1);
  const effectiveExpense = latestCorrection?.effectiveExpense ? {
    ...baseExpense,
    ...object(latestCorrection.effectiveExpense)
  } : baseExpense;
  const references = array(document.references || document.additionalReferences);
  const primaryReference = references.find(item => ["asset", "object", "machine"].includes(clean(item.role).toLowerCase())) || {};
  const entityReference = references.find(item => clean(item.role).toLowerCase() === "entity") || {};
  const employeeReference = references.find(item => clean(item.role).toLowerCase() === "employee") || {};
  const status = latestCorrection?.fullReversal ? "reversed" : clean(document.financialState || document.status || embedded.status || "incurred").toLowerCase();
  return {
    schema: clean(embedded.schema || document.metadata?.expenseSchema || "ixi-expense-v2"),
    identity: {
      ...object(embedded.identity),
      expenseId: financialDocumentId,
      financialDocumentId,
      number: clean(document.documentNumber || embedded.identity?.number || financialDocumentId),
      clientRequestId: clean(embedded.identity?.clientRequestId || document.metadata?.clientRequestId)
    },
    context: {
      ...object(embedded.context),
      primaryPassportId: clean(embedded.context?.primaryPassportId || document.metadata?.originatingPassportId || primaryReference.passportId),
      primaryObjectType: clean(embedded.context?.primaryObjectType || document.metadata?.originatingObjectType || primaryReference.objectType),
      primaryLabel: clean(embedded.context?.primaryLabel || primaryReference.label),
      entityPassportId: clean(embedded.context?.entityPassportId || entityReference.passportId),
      employeePassportId: clean(embedded.context?.employeePassportId || employeeReference.passportId),
      employeeLabel: clean(embedded.context?.employeeLabel || employeeReference.label),
      workOrderId: clean(embedded.context?.workOrderId || document.relationships?.workOrderId),
      workOrderNumber: clean(embedded.context?.workOrderNumber || document.relationships?.workOrderNumber)
    },
    originalExpense: object(embedded.originalExpense).vendor ? object(embedded.originalExpense) : baseExpense,
    expense: effectiveExpense,
    accounting: {
      ...object(embedded.accounting),
      category: effectiveExpense.category,
      costPurpose: effectiveExpense.costPurpose,
      glAccountCode: clean(latestCorrection?.accounting?.glAccountCode || embedded.accounting?.glAccountCode || document.metadata?.glAccountCode),
      glAccountName: clean(latestCorrection?.accounting?.glAccountName || embedded.accounting?.glAccountName || document.metadata?.glAccountName)
    },
    reimbursement: object(embedded.reimbursement).status ? object(embedded.reimbursement) : object(document.reimbursement),
    attachments: array(embedded.attachments).length ? array(embedded.attachments) : array(document.attachments),
    amendments: array(embedded.amendments),
    corrections,
    status,
    audit: {
      ...object(embedded.audit),
      createdAt: clean(embedded.audit?.createdAt || document.createdAt || source?.server?.createdAt),
      updatedAt: clean(embedded.audit?.updatedAt || document.updatedAt || source?.server?.updatedAt),
      createdBy: clean(embedded.audit?.createdBy || document.createdBy)
    },
    financialBinding: {
      financialDocumentId,
      revision: revisionOf(financialRecord),
      lines: array(document.lines),
      totals: object(document.totals),
      metadata: object(document.metadata),
      financialState: clean(document.financialState || document.status || "incurred")
    }
  };
}

export function findIXIExpenseRecord(financialRecords = [], selectedFinancialDocumentId = "") {
  const selectedId = clean(selectedFinancialDocumentId);
  if (!selectedId) return null;
  const records = array(financialRecords);
  const selected = records.find(item => clean(expenseFinancialDocument(item).financialDocumentId) === selectedId);
  if (!selected) return null;
  const selectedDocument = expenseFinancialDocument(selected);
  const sourceId = selectedDocument?.metadata?.expenseCorrection ? clean(selectedDocument.sourceFinancialDocumentId) : selectedId;
  const original = records.find(item => {
    const document = expenseFinancialDocument(item);
    return clean(document.financialDocumentId) === sourceId && clean(document.documentType).toLowerCase() === "expense";
  });
  return original ? hydrateIXIExpenseRecord(original, records) : null;
}

export function amendIXIExpenseRecord(record = {}, input = {}, actor = {}) {
  if (isIXIExpenseLocked(record)) throw new Error("Locked expenses require a correction or reversal.");
  const previous = object(record.expense);
  const next = {
    ...previous,
    vendor: clean(input.vendor),
    description: clean(input.description),
    amount: money(input.amount),
    currency: clean(input.currency || previous.currency || "USD").toUpperCase(),
    category: clean(input.category),
    costPurpose: clean(input.costPurpose || "other"),
    expenseDate: clean(input.expenseDate).slice(0, 10),
    paymentMethod: clean(input.paymentMethod),
    referenceNumber: clean(input.referenceNumber),
    notes: clean(input.notes),
    receiptRequired: Boolean(input.receiptRequired)
  };
  const changes = Object.keys(next).filter(key => String(previous[key] ?? "") !== String(next[key] ?? "")).map(key => ({
    field: key,
    previousValue: previous[key] ?? "",
    revisedValue: next[key] ?? ""
  }));
  if (!changes.length) throw new Error("Change at least one expense field before saving.");
  if (!clean(input.changeReason)) throw new Error("A change reason is required.");
  const occurredAt = now();
  const amendment = {
    amendmentId: clean(input.commandId) || `EXP-AMEND-${Date.now()}`,
    type: "expense-amendment",
    reason: clean(input.changeReason),
    reference: clean(input.changeReference),
    changes,
    amountDelta: money(next.amount - money(previous.amount)),
    occurredAt,
    ...actorOf(actor)
  };
  return {
    ...record,
    schema: "ixi-expense-v3",
    originalExpense: object(record.originalExpense).vendor ? record.originalExpense : previous,
    expense: next,
    accounting: {
      ...object(record.accounting),
      category: next.category,
      costPurpose: next.costPurpose,
      glAccountCode: clean(input.glAccountCode || record.accounting?.glAccountCode),
      glAccountName: clean(input.glAccountName || record.accounting?.glAccountName)
    },
    amendments: [...array(record.amendments), amendment],
    attachments: array(input.attachments).length ? array(input.attachments) : array(record.attachments),
    reimbursement: next.paymentMethod === "my-money" ? {
      required: true,
      employeePassportId: clean(record.context?.employeePassportId),
      employeeId: clean(record.context?.employeeId),
      employeeLabel: clean(record.context?.employeeLabel),
      amount: next.amount,
      currency: next.currency,
      status: "owed"
    } : {
      required: false,
      employeePassportId: "",
      employeeId: "",
      employeeLabel: "",
      amount: 0,
      currency: next.currency,
      status: "not-applicable"
    },
    audit: { ...object(record.audit), updatedAt: occurredAt, updatedBy: amendment.actorId, updatedByLabel: amendment.actorLabel }
  };
}

export function createIXIExpenseCorrection(record = {}, input = {}, actor = {}) {
  if (!clean(record?.financialBinding?.financialDocumentId)) throw new Error("Expense correction requires a canonical source document.");
  if (!clean(input.changeReason)) throw new Error("A correction reason is required.");
  const previous = object(record.expense);
  const fullReversal = Boolean(input.fullReversal);
  const effectiveExpense = fullReversal ? { ...previous, amount: 0 } : {
    ...previous,
    vendor: clean(input.vendor),
    description: clean(input.description),
    amount: money(input.amount),
    currency: clean(input.currency || previous.currency || "USD").toUpperCase(),
    category: clean(input.category),
    costPurpose: clean(input.costPurpose || "other"),
    expenseDate: clean(input.expenseDate).slice(0, 10),
    paymentMethod: clean(input.paymentMethod),
    referenceNumber: clean(input.referenceNumber),
    notes: clean(input.notes)
  };
  const changes = Object.keys(effectiveExpense).filter(key => String(previous[key] ?? "") !== String(effectiveExpense[key] ?? "")).map(key => ({
    field: key,
    previousValue: previous[key] ?? "",
    revisedValue: effectiveExpense[key] ?? ""
  }));
  if (!fullReversal && !changes.length) throw new Error("Change at least one expense field before saving the correction.");
  const occurredAt = now();
  return {
    correctionId: clean(input.commandId) || `EXP-CORR-${Date.now()}`,
    type: fullReversal ? "expense-reversal" : "expense-correction",
    sourceFinancialDocumentId: record.financialBinding.financialDocumentId,
    sourceExpenseNumber: clean(record.identity?.number),
    reason: clean(input.changeReason),
    reference: clean(input.changeReference),
    effectiveDate: clean(input.effectiveDate || occurredAt).slice(0, 10),
    previousExpense: previous,
    effectiveExpense,
    accounting: {
      category: effectiveExpense.category,
      costPurpose: effectiveExpense.costPurpose,
      glAccountCode: clean(input.glAccountCode || record.accounting?.glAccountCode),
      glAccountName: clean(input.glAccountName || record.accounting?.glAccountName)
    },
    attachments: array(input.attachments),
    changes,
    amountDelta: money(effectiveExpense.amount - money(previous.amount)),
    fullReversal,
    occurredAt,
    ...actorOf(actor)
  };
}

export default {
  hydrateIXIExpenseRecord,
  findIXIExpenseRecord,
  amendIXIExpenseRecord,
  createIXIExpenseCorrection,
  isIXIExpenseLocked
};
