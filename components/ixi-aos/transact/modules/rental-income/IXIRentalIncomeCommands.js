import { createIXIAosObjectFinancialDocument, createIXIAosFinancialObjectReference } from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";
import { createIXIRentalIncomeDraft, validateIXIRentalIncome } from "./IXIRentalIncomeContract";
import { applyIXIRentalIncomeEconomics } from "./IXIRentalIncomeRecordEngine";

const clean = value => String(value ?? "").trim();

function pushUnique(refs, reference) {
  if (!reference) return;
  const key = [reference.passportId, reference.externalId, reference.role, reference.label].map(clean).join("|");
  if (!refs.some(item => [item.passportId, item.externalId, item.role, item.label].map(clean).join("|") === key)) refs.push(reference);
}

export async function createIXIRentalIncome({ object = {}, context = {}, input = {}, commandId = "", idempotencyKey = "", metadata = {}, apiBaseUrl = "", headers = {}, signal } = {}) {
  const draft = applyIXIRentalIncomeEconomics(createIXIRentalIncomeDraft({ context, input }), [], input.startDate);
  const validation = validateIXIRentalIncome(draft);
  if (!validation.valid) { const error = new Error("Rental Income is incomplete"); error.validation = validation; throw error; }

  const resolvedCommandId = clean(commandId || draft.identity.clientRequestId || `RNTINC-${Date.now()}`);
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
    source: "ixi-transact-rental-income",
    savingMessage: "STARTING RENTAL...",
    successMessage: result => `RENTAL INCOME ${clean(result?.record?.identity?.number || result?.record?.identity?.rentalIncomeId) || "STARTED"}`,
    errorMessage: "RENTAL INCOME SAVE FAILED",
    operation: async () => {
      const refs = [];
      pushUnique(refs, createIXIAosFinancialObjectReference({ object: context.primary || resolvedObject, role: "asset" }));
      pushUnique(refs, createIXIAosFinancialObjectReference({ object: context.entity || {}, role: "entity" }));
      pushUnique(refs, createIXIAosFinancialObjectReference({ object: context.location || {}, role: "location" }));
      pushUnique(refs, createIXIAosFinancialObjectReference({ object: context.actor || {}, role: "employee" }));
      if (clean(draft.customer.name)) pushUnique(refs, { role: "customer", label: draft.customer.name, objectType: "entity", passportId: draft.customer.passportId, externalId: draft.customer.customerId });

      const response = await createIXIAosObjectFinancialDocument({
        object: resolvedObject,
        documentType: "rental",
        input: {
          currency: "USD",
          amount: 0,
          description: `Rental Income · ${draft.ownedAsset.label} · ${draft.customer.name}`,
          status: "open",
          financialState: "planned",
          rentalIncome: draft,
          references: refs,
          attachments: draft.documents
        },
        additionalReferences: refs,
        commandId: resolvedCommandId,
        idempotencyKey: clean(idempotencyKey || `ixi-rental-income:${resolvedCommandId}`),
        metadata: {
          ...metadata,
          transactModule: "rental-income",
          rentalSchema: draft.schema,
          direction: "income",
          custodyState: "customer-custody",
          ownershipState: "owned",
          expectedReturnDate: draft.period.expectedReturnDate,
          customerLabel: draft.customer.name
        },
        apiBaseUrl, headers, signal
      });

      const rentalIncomeId = clean(response?.document?.documentId || response?.financialDocument?.documentId || response?.documentId || resolvedCommandId);
      const number = clean(response?.document?.documentNumber || response?.financialDocument?.documentNumber) || `RNTINC-${rentalIncomeId.replace(/^RNTINC-/i, "").slice(-6).toUpperCase()}`;
      const occurredAt = new Date().toISOString();
      const record = {
        ...draft,
        identity: { ...draft.identity, rentalIncomeId, number },
        status: "active",
        period: { ...draft.period, status: "active" },
        ownedAsset: { ...draft.ownedAsset, custodyState: "customer-custody", ownershipState: "owned" },
        activity: [{ eventId: `RINC-START-${Date.now()}`, type: "rental-started", occurredAt, actorId: draft.context.actorId, actorLabel: draft.context.actorLabel }],
        audit: { ...draft.audit, updatedAt: occurredAt }
      };
      return { record, response };
    }
  });
}

export default { createIXIRentalIncome };
