import { createIXIAosObjectFinancialDocument, createIXIAosFinancialObjectReference } from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { runIXIActionNoticeLifecycle } from "../../../ixi-object-system/IXIActionNoticeEngine";
import { createIXIRentalExpenseDraft, validateIXIRentalExpense } from "./IXIRentalExpenseContract";
import { applyIXIRentalExpenseEconomics } from "./IXIRentalExpenseRecordEngine";

const clean = value => String(value ?? "").trim();

function pushUnique(refs, reference) {
  if (!reference) return;
  const key = [reference.passportId, reference.externalId, reference.role, reference.label].map(clean).join("|");
  if (!refs.some(item => [item.passportId, item.externalId, item.role, item.label].map(clean).join("|") === key)) refs.push(reference);
}

export async function createIXIRentalExpense({ object = {}, context = {}, input = {}, commandId = "", idempotencyKey = "", metadata = {}, apiBaseUrl = "", headers = {}, signal } = {}) {
  const draft = applyIXIRentalExpenseEconomics(createIXIRentalExpenseDraft({ context, input }), [], input.startDate);
  const validation = validateIXIRentalExpense(draft);
  if (!validation.valid) { const error = new Error("Rental Expense is incomplete"); error.validation = validation; throw error; }

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
    savingMessage: "STARTING RENTAL...",
    successMessage: result => `RENTAL ${clean(result?.record?.identity?.number || result?.record?.identity?.rentalExpenseId) || "STARTED"}`,
    errorMessage: "RENTAL SAVE FAILED",
    operation: async () => {
      const refs = [];
      pushUnique(refs, createIXIAosFinancialObjectReference({ object: context.primary || resolvedObject, role: "object" }));
      pushUnique(refs, createIXIAosFinancialObjectReference({ object: context.entity || {}, role: "entity" }));
      pushUnique(refs, createIXIAosFinancialObjectReference({ object: context.location || {}, role: "location" }));
      pushUnique(refs, createIXIAosFinancialObjectReference({ object: context.actor || {}, role: "employee" }));
      if (clean(draft.vendor.name)) pushUnique(refs, { role: "vendor", label: draft.vendor.name, objectType: "entity", passportId: draft.vendor.passportId, externalId: draft.vendor.vendorId });
      if (clean(draft.rentedAsset.passportId || draft.rentedAsset.objectId || draft.rentedAsset.description)) pushUnique(refs, { role: "asset", label: draft.rentedAsset.description, objectType: draft.rentedAsset.assetType, passportId: draft.rentedAsset.passportId, externalId: draft.rentedAsset.objectId });

      const response = await createIXIAosObjectFinancialDocument({
        object: resolvedObject,
        documentType: "rental",
        input: {
          currency: "USD",
          amount: 0,
          description: `Rental Expense · ${draft.rentedAsset.description}`,
          status: "open",
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
          custodyState: "rented-in",
          ownershipState: "external-owned",
          expectedReturnDate: draft.period.expectedReturnDate
        },
        apiBaseUrl, headers, signal
      });

      const rentalExpenseId = clean(response?.document?.documentId || response?.financialDocument?.documentId || response?.documentId || resolvedCommandId);
      const number = clean(response?.document?.documentNumber || response?.financialDocument?.documentNumber) || `RNTEXP-${rentalExpenseId.replace(/^RNTEXP-/i, "").slice(-6).toUpperCase()}`;
      const occurredAt = new Date().toISOString();
      const record = {
        ...draft,
        identity: { ...draft.identity, rentalExpenseId, number },
        status: "active",
        period: { ...draft.period, status: "active" },
        activity: [{ eventId: `RENT-START-${Date.now()}`, type: "rental-started", occurredAt, actorId: draft.context.actorId, actorLabel: draft.context.actorLabel }],
        audit: { ...draft.audit, updatedAt: occurredAt }
      };
      return { record, response };
    }
  });
}

export default { createIXIRentalExpense };
