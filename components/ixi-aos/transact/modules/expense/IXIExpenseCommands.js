import {
  createIXIAosExpense,
  createIXIAosFinancialObjectReference
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";

import {
  runIXIActionNoticeLifecycle
} from "../../../../ixi-object-system/IXIActionNoticeEngine";

import {
  createIXIExpenseDraft,
  validateIXIExpense
} from "./IXIExpenseContract";

const clean = value => String(value ?? "").trim();

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
        status: "posted",
        vendor: draft.expense.vendor,
        category: draft.expense.category,
        expenseDate: draft.expense.expenseDate,
        paymentMethod: draft.expense.paymentMethod,
        referenceNumber: draft.expense.referenceNumber,
        notes: draft.expense.notes,
        attachments: draft.attachments,
        references: additionalReferences,
        relationships: {
          workOrderId: draft.context.workOrderId,
          workOrderNumber: draft.context.workOrderNumber,
          reimbursementRequired: draft.reimbursement.required,
          reimbursementEmployeePassportId: draft.reimbursement.employeePassportId,
          reimbursementEmployeeId: draft.reimbursement.employeeId
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

  return {
    draft: {
      ...draft,
      identity: {
        ...draft.identity,
        expenseId,
        number: clean(draft.identity.number) || expenseId
      },
      status: "posted"
    },
    response
  };
}

export default {
  createIXIExpense
};
