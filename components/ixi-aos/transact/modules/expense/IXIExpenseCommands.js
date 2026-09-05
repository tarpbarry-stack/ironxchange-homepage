import {
  createIXIAosExpense,
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";

import {
  patchIXIAosFinancialDocument
} from "../../../financial-runtime/IXIAosFinancialReadClient";

import {
  runIXIActionNoticeLifecycle
} from "../../../../ixi-object-system/IXIActionNoticeEngine";

import {
  createIXIExpenseDraft,
  validateIXIExpense
} from "./IXIExpenseContract";

import {
  createIXIExpenseCorrection
} from "./IXIExpenseRecordEngine";

const clean = value => String(value ?? "").trim();
const array = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

function responseRecord(response = {}) {
  return response?.data?.record || response?.record || {};
}

function responseDocument(response = {}) {
  const stored = responseRecord(response);
  return stored?.financialDocument || response?.financialDocument || response?.document || {};
}

function canonicalizeExpense(record = {}, response = {}) {
  const stored = responseRecord(response);
  const document = responseDocument(response);
  const financialDocumentId = clean(document.financialDocumentId || record?.financialBinding?.financialDocumentId || record?.identity?.expenseId);
  if (!financialDocumentId) {
    const error = new Error("IXI Financial did not return a canonical Expense identity.");
    error.code = "IXI_EXPENSE_IDENTITY_MISSING";
    throw error;
  }
  const canonical = document.expenseRecord || record;
  return {
    ...canonical,
    identity: {
      ...(canonical.identity || record.identity),
      expenseId: financialDocumentId,
      financialDocumentId,
      number: clean(document.documentNumber || canonical.identity?.number || financialDocumentId)
    },
    status: clean(canonical.status || document.financialState || "incurred"),
    financialBinding: {
      financialDocumentId,
      revision: Number(stored?.server?.revision || stored?.revision || record?.financialBinding?.revision || 1),
      lines: array(document.lines),
      totals: object(document.totals),
      metadata: { ...object(record?.financialBinding?.metadata), ...object(document.metadata) },
      financialState: clean(document.financialState || record?.financialBinding?.financialState || "incurred")
    }
  };
}

function storedExpense(record = {}) {
  const { financialBinding: _financialBinding, corrections: _corrections, ...stored } = record;
  return stored;
}

function getExpenseDocumentId(response = {}) {
  return clean(
    response.financialDocument?.documentId ||
      response.financialDocument?.id ||
      response.document?.identity?.documentId ||
      response.document?.documentId ||
      response.document?.id ||
      response.record?.documentId ||
      response.record?.id ||
      response.expenseId ||
      response.id
  );
}

export async function createIXIExpense({
  object = {},
  context = {},
  workOrder = {},
  input = {},
  commandId = "",
  idempotencyKey = "",
  metadata = {},
  apiBaseUrl = "",
  headers = {},
  signal
} = {}) {
  const draft = createIXIExpenseDraft({
    context,
    workOrder,
    input
  });
  const validation = validateIXIExpense(draft);

  if (!validation.valid) {
    const error = new Error("Expense is incomplete or invalid.");
    error.code = "IXI_EXPENSE_VALIDATION_FAILED";
    error.validation = validation;
    throw error;
  }

  const stableId = clean(
    commandId ||
      idempotencyKey ||
      draft.identity.clientRequestId
  );

  if (!stableId) {
    const error = new Error("Expense requires a stable command identity.");
    error.code = "IXI_EXPENSE_COMMAND_ID_REQUIRED";
    throw error;
  }

  const originObjectId = clean(
    object?.objectId ||
    object?.id ||
    context?.primary?.objectId ||
    context?.primary?.id
  );

  const additionalReferences = [];

  const entityReference = createIXIAosFinancialObjectReference({
    object: context.entity || {},
    role: "entity"
  });
  if (entityReference) {
    additionalReferences.push(entityReference);
  }

  const locationReference = createIXIAosFinancialObjectReference({
    object: context.location || {},
    role: "location"
  });
  if (locationReference) {
    additionalReferences.push(locationReference);
  }

  const employeeReference = createIXIAosFinancialObjectReference({
    object: context.actor || {},
    role: "employee"
  });
  if (employeeReference) {
    additionalReferences.push(employeeReference);
  }

  const response = await runIXIActionNoticeLifecycle({
    objectId: originObjectId,
    commandId: stableId,
    source: "ixi-transact-expense",
    savingMessage: "RECORDING EXPENSE...",
    successMessage: result => {
      const id = getExpenseDocumentId(result);
      return id ? `EXPENSE ${id} RECORDED` : "EXPENSE RECORDED";
    },
    errorMessage: "EXPENSE SAVE FAILED",
    operation: () => createIXIAosExpense({
      object,
      input: {
        currency: draft.expense.currency,
        amount: draft.expense.amount,
        description: draft.expense.description,
        financialState: "incurred",
        occurredAt: `${draft.expense.expenseDate}T00:00:00.000Z`,
        vendor: draft.expense.vendor,
        category: draft.expense.category,
        costPurpose: draft.expense.costPurpose,
        expenseDate: draft.expense.expenseDate,
        paymentMethod: draft.expense.paymentMethod,
        referenceNumber: draft.expense.referenceNumber,
        externalReference: draft.expense.referenceNumber,
        notes: draft.expense.notes,
        memo: draft.expense.notes,
        receiptRequired: draft.expense.receiptRequired,
        attachments: draft.attachments,
        references: additionalReferences,
        relationships: {
          workOrderId: draft.context.workOrderId,
          workOrderNumber: draft.context.workOrderNumber,
          reimbursementRequired: draft.reimbursement.required,
          reimbursementEmployeePassportId: draft.reimbursement.employeePassportId,
          reimbursementEmployeeId: draft.reimbursement.employeeId
        },
        reimbursement: draft.reimbursement,
        expenseRecord: {
          ...draft,
          schema: "ixi-expense-v3",
          status: "incurred",
          originalExpense: draft.expense,
          amendments: [],
          corrections: []
        }
      },
      additionalReferences,
      commandId: stableId,
      idempotencyKey: stableId,
      metadata: {
        ...metadata,
        transactModule: "expense",
        expenseSchema: draft.schema,
        originatingPassportId: draft.context.primaryPassportId,
        originatingObjectType: draft.context.primaryObjectType,
        workOrderId: draft.context.workOrderId,
        workOrderNumber: draft.context.workOrderNumber,
        expenseCategory: draft.expense.category,
        expenseCostPurpose: draft.expense.costPurpose,
        glAccountCode: clean(draft.accounting?.glAccountCode),
        glAccountName: clean(draft.accounting?.glAccountName),
        costBasis: true,
        reimbursement: draft.reimbursement,
        clientRequestId: draft.identity.clientRequestId
      },
      apiBaseUrl,
      headers,
      signal
    })
  });

  const expenseId =
    getExpenseDocumentId(response) ||
    clean(draft.identity.expenseId) ||
    stableId;

  const committed = canonicalizeExpense({
    ...draft,
    schema: "ixi-expense-v3",
    originalExpense: draft.expense,
    amendments: [],
    corrections: [],
    identity: { ...draft.identity, expenseId, financialDocumentId: expenseId, number: clean(draft.identity.number) || expenseId },
    status: "incurred"
  }, response);

  return { draft: committed, record: committed, response };
}

export async function updateIXIExpense({ record = {}, action = "amend", metadata = {}, signal } = {}) {
  const financialDocumentId = clean(record?.financialBinding?.financialDocumentId || record?.identity?.financialDocumentId || record?.identity?.expenseId);
  const expectedRevision = Number(record?.financialBinding?.revision);
  if (!financialDocumentId || !Number.isInteger(expectedRevision) || expectedRevision < 1) {
    const error = new Error("Expense is not bound to a current IXI Financial revision.");
    error.code = "IXI_EXPENSE_BINDING_REQUIRED";
    throw error;
  }
  const details = object(record.expense);
  const commandId = globalThis.crypto?.randomUUID?.() || `EXP-UPD-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const existingLines = array(record.financialBinding?.lines);
  const response = await patchIXIAosFinancialDocument({
    financialDocumentId,
    expectedRevision,
    commandId,
    idempotencyKey: `ixi-expense:${action}:${commandId}`,
    patch: {
      amount: Number(details.amount || 0),
      description: clean(details.description),
      occurredAt: `${clean(details.expenseDate)}T00:00:00.000Z`,
      vendor: clean(details.vendor),
      category: clean(details.category),
      costPurpose: clean(details.costPurpose || "other"),
      expenseDate: clean(details.expenseDate),
      paymentMethod: clean(details.paymentMethod),
      referenceNumber: clean(details.referenceNumber),
      externalReference: clean(details.referenceNumber),
      notes: clean(details.notes),
      memo: clean(details.notes || details.description),
      receiptRequired: Boolean(details.receiptRequired),
      attachments: array(record.attachments),
      reimbursement: object(record.reimbursement),
      expenseRecord: storedExpense(record),
      ...(existingLines.length ? { lines: existingLines.map((line, index) => index === 0 ? { ...line, amount: Number(details.amount || 0), quantity: 1, rate: Number(details.amount || 0) } : line) } : {}),
      totals: { ...object(record.financialBinding?.totals), subtotal: Number(details.amount || 0), total: Number(details.amount || 0) },
      metadata: {
        ...object(record.financialBinding?.metadata),
        expenseCategory: clean(details.category),
        expenseCostPurpose: clean(details.costPurpose || "other"),
        glAccountCode: clean(record.accounting?.glAccountCode),
        glAccountName: clean(record.accounting?.glAccountName),
        costBasis: true
      }
    },
    metadata: { ...metadata, transactModule: "expense", action },
    signal
  });
  return { record: canonicalizeExpense(record, response), response };
}

export async function createIXIExpenseCorrectionDocument({ object: sourceObject = {}, context = {}, record = {}, input = {}, actor = {}, metadata = {}, signal } = {}) {
  const commandId = clean(input.commandId) || globalThis.crypto?.randomUUID?.() || `EXP-CORR-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const correction = createIXIExpenseCorrection(record, { ...input, commandId }, actor);
  const additionalReferences = [];
  for (const [source, role] of [[context.entity, "entity"], [context.location, "location"], [context.actor, "employee"]]) {
    const reference = createIXIAosFinancialObjectReference({ object: source || {}, role });
    if (reference) additionalReferences.push(reference);
  }
  const response = await createIXIAosObjectFinancialDocument({
    object: sourceObject,
    documentType: "adjustment",
    input: {
      currency: clean(record.expense?.currency || "USD"),
      amount: correction.amountDelta,
      description: `${correction.fullReversal ? "Expense reversal" : "Expense correction"} · ${clean(record.identity?.number)}`,
      memo: correction.reason,
      occurredAt: `${correction.effectiveDate}T12:00:00.000Z`,
      sourceFinancialDocumentId: correction.sourceFinancialDocumentId,
      relatedFinancialDocumentIds: [correction.sourceFinancialDocumentId],
      expenseCorrection: correction,
      attachments: array(correction.attachments),
      references: array(expenseFinancialReferences(record)),
      financialState: "incurred"
    },
    additionalReferences,
    commandId,
    idempotencyKey: `ixi-expense-correction:${correction.sourceFinancialDocumentId}:${commandId}`,
    metadata: {
      ...metadata,
      transactModule: "expense",
      expenseCorrection: true,
      correctionType: correction.type,
      sourceExpenseDocumentId: correction.sourceFinancialDocumentId,
      expenseCategory: clean(correction.effectiveExpense?.category),
      expenseCostPurpose: clean(correction.effectiveExpense?.costPurpose || "other"),
      costBasis: true,
      glAccountCode: clean(correction.accounting?.glAccountCode),
      glAccountName: clean(correction.accounting?.glAccountName)
    },
    signal
  });
  return { correction, response };
}

function expenseFinancialReferences(record = {}) {
  return [
    record.context?.primaryPassportId ? { passportId: record.context.primaryPassportId, role: "asset", label: record.context.primaryLabel, objectType: record.context.primaryObjectType } : null,
    record.context?.entityPassportId ? { passportId: record.context.entityPassportId, role: "entity" } : null,
    record.context?.employeePassportId ? { passportId: record.context.employeePassportId, role: "employee", label: record.context.employeeLabel } : null
  ].filter(Boolean);
}

export default {
  createIXIExpense,
  updateIXIExpense,
  createIXIExpenseCorrectionDocument
};
