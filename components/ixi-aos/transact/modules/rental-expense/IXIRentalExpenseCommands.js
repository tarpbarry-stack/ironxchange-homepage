import { createIXIAosObjectFinancialDocument, createIXIAosFinancialObjectReference } from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { patchIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";
import { createIXIRentalExpenseDraft, validateIXIRentalExpense } from "./IXIRentalExpenseContract";
import { applyIXIRentalExpenseEconomics } from "./IXIRentalExpenseRecordEngine";

const clean = value => String(value ?? "").trim();

function pushUnique(refs, reference) {
  if (!reference) return;
  const key = [reference.passportId, reference.role].map(clean).join("|");
  if (!refs.some(item => [item.passportId, item.role].map(clean).join("|") === key)) refs.push(reference);
}

function responseRecord(response = {}) {
  return response?.data?.record || response?.record || {};
}

function canonicalize(draft, response) {
  const stored = responseRecord(response);
  const document = stored?.financialDocument || response?.financialDocument || {};
  const financialDocumentId = clean(document.financialDocumentId);
  if (!financialDocumentId) {
    const error = new Error("IXI Financial did not return a canonical Rental Expense identity.");
    error.code = "IXI_RENTAL_EXPENSE_IDENTITY_MISSING";
    throw error;
  }
  const canonical = document.rentalExpense || draft;
  return {
    ...canonical,
    identity: {
      ...(canonical.identity || draft.identity),
      clientRequestId: clean(draft.identity?.clientRequestId),
      rentalExpenseId: financialDocumentId,
      financialDocumentId,
      number: clean(document.documentNumber) || financialDocumentId
    },
    financialBinding: {
      financialDocumentId,
      revision: Number(stored?.server?.revision || stored?.revision || 1),
      financialLineId: clean(document?.lines?.[0]?.financialLineId),
      line: document?.lines?.[0] || null
    }
  };
}

function canonicalRecord(record = {}) {
  const { financialBinding: _binding, ...canonical } = record;
  return canonical;
}

export async function createIXIRentalExpense({ object = {}, context = {}, input = {}, commandId = "", idempotencyKey = "", metadata = {}, apiBaseUrl = "", headers = {}, signal } = {}) {
  const draft = applyIXIRentalExpenseEconomics(createIXIRentalExpenseDraft({ context, input }), [], input.expectedReturnDate);
  const validation = validateIXIRentalExpense(draft);
  if (!validation.valid) {
    const error = new Error("Rental Expense is incomplete");
    error.validation = validation;
    throw error;
  }

  const resolvedCommandId = clean(commandId || draft.identity.clientRequestId || `RNTEXP-${Date.now()}`);
  const resolvedObject = {
    ...object,
    passportId: clean(object.passportId || draft.context.primaryPassportId),
    objectId: clean(object.objectId || draft.context.primaryObjectId),
    objectType: clean(object.objectType || draft.context.primaryObjectType),
    label: clean(object.label || draft.context.primaryLabel)
  };
  const noticeObjectId = clean(context.primary?.objectId || context.primary?.passportId || resolvedObject.objectId || resolvedObject.passportId);

  return runIXIActionNoticeLifecycle({
    objectId: noticeObjectId,
    commandId: resolvedCommandId,
    source: "ixi-transact-rental-expense",
    savingMessage: "RECORDING RENTAL COMMITMENT...",
    successMessage: result => `RENTAL ${clean(result?.record?.identity?.number) || "RECORDED"}`,
    errorMessage: "RENTAL SAVE FAILED",
    operation: async () => {
      const refs = [];
      pushUnique(refs, createIXIAosFinancialObjectReference({ object: context.primary || resolvedObject, role: clean(context.primary?.objectType) === "project" ? "job" : "asset" }));
      pushUnique(refs, createIXIAosFinancialObjectReference({ object: context.entity || {}, role: "entity" }));
      pushUnique(refs, createIXIAosFinancialObjectReference({ object: context.location || {}, role: "location" }));
      pushUnique(refs, createIXIAosFinancialObjectReference({ object: context.actor || {}, role: "employee" }));
      if (clean(draft.rentedAsset.passportId)) pushUnique(refs, { role: "rented-asset", label: draft.rentedAsset.description, objectType: draft.rentedAsset.assetType, passportId: draft.rentedAsset.passportId });

      const response = await createIXIAosObjectFinancialDocument({
        object: resolvedObject,
        documentType: "rental-expense",
        input: {
          currency: "USD",
          occurredAt: `${draft.period.startDate}T12:00:00.000Z`,
          expectedAt: `${draft.period.expectedReturnDate}T12:00:00.000Z`,
          description: `Rental Expense · ${draft.rentedAsset.description}`,
          financialState: "committed",
          rentalExpense: draft,
          references: refs,
          attachments: draft.documents
        },
        additionalReferences: refs,
        commandId: resolvedCommandId,
        idempotencyKey: clean(idempotencyKey || `ixi-rental-expense:${resolvedCommandId}`),
        metadata: {
          ...metadata,
          transactModule: "rental-expense",
          rentalSchema: draft.schema,
          direction: "expense",
          commitmentClass: "rental",
          workOrderFinancialDocumentId: draft.context.workOrderFinancialDocumentId
        },
        apiBaseUrl,
        headers,
        signal
      });
      return { record: canonicalize(draft, response), response };
    }
  });
}

export async function updateIXIRentalExpense({ record = {}, action = "update", metadata = {}, signal } = {}) {
  const financialDocumentId = clean(record?.financialBinding?.financialDocumentId || record?.identity?.financialDocumentId || record?.identity?.rentalExpenseId);
  const expectedRevision = Number(record?.financialBinding?.revision);
  const storedLine = record?.financialBinding?.line;
  if (!financialDocumentId || !Number.isInteger(expectedRevision) || expectedRevision < 1 || !storedLine) {
    const error = new Error("Rental Expense is not bound to a current IXI Financial revision.");
    error.code = "IXI_RENTAL_EXPENSE_BINDING_REQUIRED";
    throw error;
  }
  const canonical = canonicalRecord(record);
  const projectedTotal = Number(canonical?.economics?.projectedTotal || 0);
  const commandId = globalThis.crypto?.randomUUID?.() || `rental-update-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const response = await patchIXIAosFinancialDocument({
    financialDocumentId,
    expectedRevision,
    commandId,
    idempotencyKey: `ixi-rental-expense:${action}:${commandId}`,
    patch: {
      rentalExpense: canonical,
      expectedAt: canonical?.period?.actualOffRentDate || canonical?.period?.expectedReturnDate
        ? `${canonical.period.actualOffRentDate || canonical.period.expectedReturnDate}T12:00:00.000Z`
        : "",
      financialState: canonical.status === "cancelled" ? "void" : "committed",
      lines: [{ ...storedLine, amount: projectedTotal, quantity: 1, rate: projectedTotal }],
      totals: { projectedCommitment: projectedTotal, subtotal: projectedTotal, total: projectedTotal },
      attachments: canonical.documents || []
    },
    metadata: { ...metadata, transactModule: "rental-expense", action },
    signal
  });
  return { record: canonicalize(canonical, response), response };
}

export default { createIXIRentalExpense, updateIXIRentalExpense };
