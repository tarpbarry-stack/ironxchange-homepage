import { createIXIAosObjectFinancialDocument, createIXIAosFinancialObjectReference } from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { patchIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";
import { createIXIRentalIncomeDraft, validateIXIRentalIncome } from "./IXIRentalIncomeContract";
import { applyIXIRentalIncomeEconomics } from "./IXIRentalIncomeRecordEngine";

const clean = value => String(value ?? "").trim();

function pushUnique(refs, reference) {
  if (!reference) return;
  const key = [reference.passportId, reference.externalId, reference.role, reference.label].map(clean).join("|");
  if (!refs.some(item => [item.passportId, item.externalId, item.role, item.label].map(clean).join("|") === key)) refs.push(reference);
}

function responseRecord(response = {}) {
  return response?.data?.record || response?.record || {};
}

function canonicalize(draft, response) {
  const stored = responseRecord(response);
  const document = stored?.financialDocument || response?.financialDocument || {};
  const financialDocumentId = clean(document.financialDocumentId);
  if (!financialDocumentId) {
    const error = new Error("IXI Financial did not return a canonical Rental Income identity.");
    error.code = "IXI_RENTAL_INCOME_IDENTITY_MISSING";
    throw error;
  }
  const canonical = document.rentalIncome || draft;
  return {
    ...canonical,
    identity: {
      ...(canonical.identity || draft.identity),
      clientRequestId: clean(draft.identity?.clientRequestId),
      rentalIncomeId: financialDocumentId,
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

export async function createIXIRentalIncome({ object = {}, context = {}, input = {}, commandId = "", idempotencyKey = "", metadata = {}, apiBaseUrl = "", headers = {}, signal } = {}) {
  const draft = applyIXIRentalIncomeEconomics(createIXIRentalIncomeDraft({ context, input }), [], input.expectedReturnDate);
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
        documentType: "rental-income",
        input: {
          currency: "USD",
          occurredAt: `${draft.period.startDate}T12:00:00.000Z`,
          expectedAt: `${draft.period.expectedReturnDate}T12:00:00.000Z`,
          description: `Rental Income · ${draft.ownedAsset.label} · ${draft.customer.name}`,
          financialState: "committed",
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

      return { record: canonicalize(draft, response), response };
    }
  });
}

export async function updateIXIRentalIncome({ record = {}, action = "update", metadata = {}, signal } = {}) {
  const financialDocumentId = clean(record?.financialBinding?.financialDocumentId || record?.identity?.financialDocumentId || record?.identity?.rentalIncomeId);
  const expectedRevision = Number(record?.financialBinding?.revision);
  const storedLine = record?.financialBinding?.line;
  if (!financialDocumentId || !Number.isInteger(expectedRevision) || expectedRevision < 1 || !storedLine) {
    const error = new Error("Rental Income is not bound to a current IXI Financial revision.");
    error.code = "IXI_RENTAL_INCOME_BINDING_REQUIRED";
    throw error;
  }
  const canonical = canonicalRecord(record);
  const projectedRevenue = Number(canonical?.economics?.projectedRevenue || 0);
  const commandId = globalThis.crypto?.randomUUID?.() || `rental-income-update-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const response = await patchIXIAosFinancialDocument({
    financialDocumentId,
    expectedRevision,
    commandId,
    idempotencyKey: `ixi-rental-income:${action}:${commandId}`,
    patch: {
      rentalIncome: canonical,
      expectedAt: canonical?.period?.actualOffRentDate || canonical?.period?.expectedReturnDate
        ? `${canonical.period.actualOffRentDate || canonical.period.expectedReturnDate}T12:00:00.000Z`
        : "",
      financialState: canonical.status === "cancelled" ? "void" : "committed",
      lines: [{ ...storedLine, amount: projectedRevenue, quantity: 1, rate: projectedRevenue }],
      totals: {
        projectedRevenue,
        projectedTax: Number(canonical?.economics?.projectedTax || 0),
        refundableDeposit: Number(canonical?.economics?.projectedDeposit || 0),
        projectedInvoiceTotal: Number(canonical?.economics?.projectedInvoiceTotal || 0),
        subtotal: projectedRevenue,
        total: projectedRevenue
      },
      attachments: canonical.documents || []
    },
    metadata: { ...metadata, transactModule: "rental-income", action },
    signal
  });
  return { record: canonicalize(canonical, response), response };
}

export default { createIXIRentalIncome, updateIXIRentalIncome };
