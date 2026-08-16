import {
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";
import { createIXICollectionCase, validateIXICollectionCase } from "./IXICollectionsContract";

const clean = value => String(value ?? "").trim();
const money = value => Math.round(Number(value || 0) * 100) / 100;

function pushReference(references, reference) {
  if (!reference) return;
  const key = [reference.passportId, reference.externalId, reference.role, reference.label].map(clean).join("|");
  if (!references.some(item => [item.passportId, item.externalId, item.role, item.label].map(clean).join("|") === key)) references.push(reference);
}

function buildReferences({ object = {}, context = {}, receivable = {}, collection = {} } = {}) {
  const references = [];
  pushReference(references, createIXIAosFinancialObjectReference({ object: context.primary || object, role: "object" }));
  pushReference(references, createIXIAosFinancialObjectReference({ object: context.entity || {}, role: "entity" }));
  pushReference(references, createIXIAosFinancialObjectReference({ object: context.location || {}, role: "location" }));
  pushReference(references, createIXIAosFinancialObjectReference({ object: context.actor || {}, role: "employee" }));
  const customerPassportId = clean(receivable.customerPassportId || collection.customer?.passportId);
  const customerLabel = clean(receivable.customerLabel || collection.customer?.label);
  if (customerPassportId || customerLabel) pushReference(references, { passportId: customerPassportId, externalId: clean(receivable.customerId || collection.customer?.customerId), role: "customer", label: customerLabel, objectType: "entity" });
  return references;
}

export async function createIXICollectionCaseCommand({ object = {}, context = {}, receivable = {}, input = {}, metadata = {}, apiBaseUrl = "", headers = {}, signal } = {}) {
  const draft = createIXICollectionCase({ context, receivable, input });
  const check = validateIXICollectionCase(draft);
  if (!check.valid) {
    const error = new Error("Collection case is incomplete");
    error.validation = check;
    throw error;
  }
  const commandId = draft.identity.clientRequestId;
  const references = buildReferences({ object, context, receivable, collection: draft });
  const noticeObjectId = clean(context.primary?.objectId || context.primary?.passportId || object.objectId || object.passportId);

  return runIXIActionNoticeLifecycle({
    objectId: noticeObjectId,
    commandId,
    source: "ixi-transact-collections",
    savingMessage: "OPENING COLLECTION CASE...",
    successMessage: result => `COLLECTION ${clean(result?.record?.identity?.number) || "OPENED"}`,
    errorMessage: "COLLECTION SAVE FAILED",
    operation: async () => {
      const response = await createIXIAosObjectFinancialDocument({
        object,
        documentType: "collection",
        input: {
          currency: "USD",
          amount: money(receivable.balance),
          description: `Collections · ${receivable.customerLabel || "Customer"} · ${receivable.invoiceNumber || receivable.invoiceId}`,
          status: "open",
          financialState: "collections",
          relatedInvoiceId: clean(receivable.invoiceId),
          collectionCase: draft,
          references
        },
        additionalReferences: references,
        commandId,
        idempotencyKey: `ixi-collection:${commandId}`,
        metadata: {
          ...metadata,
          transactModule: "collections",
          recordSchema: draft.schema,
          collectionCase: true,
          relatedInvoiceId: clean(receivable.invoiceId),
          customerLabel: clean(receivable.customerLabel)
        },
        apiBaseUrl,
        headers,
        signal
      });
      const financialId = clean(response?.financialDocument?.documentId || response?.document?.documentId || response?.documentId || commandId);
      const number = `COLL-${financialId.replace(/^COLL-/i, "").slice(-6).toUpperCase()}`;
      const occurredAt = new Date().toISOString();
      return {
        record: {
          ...draft,
          identity: { ...draft.identity, collectionId: financialId, number, financialDocumentId: financialId },
          activity: [{ eventId: `COLL-CREATE-${Date.now()}`, type: "collection-case-opened", occurredAt, actorLabel: draft.context.actorLabel }],
          audit: { ...draft.audit, updatedAt: occurredAt }
        },
        response
      };
    }
  });
}

export async function recordIXICollectionPayment({ object = {}, context = {}, receivable = {}, collection = {}, input = {}, metadata = {}, apiBaseUrl = "", headers = {}, signal } = {}) {
  const amount = money(input.amount);
  if (!(amount > 0)) throw new Error("Payment amount must be greater than zero");
  if (amount > money(receivable.balance)) throw new Error("Payment cannot exceed the open receivable balance");
  const commandId = clean(input.clientRequestId) || `COLL-PAY-${Date.now()}`;
  const references = buildReferences({ object, context, receivable, collection });
  return createIXIAosObjectFinancialDocument({
    object,
    documentType: "payment",
    input: {
      currency: clean(receivable.currency || "USD"),
      amount,
      description: `A/R receipt · ${receivable.invoiceNumber || receivable.invoiceId}`,
      status: "posted",
      financialState: "received",
      direction: "in",
      method: clean(input.method || "wire"),
      reference: clean(input.reference),
      occurredAt: clean(input.date) || new Date().toISOString(),
      relatedInvoiceId: clean(receivable.invoiceId),
      relatedCollectionId: clean(collection.identity?.collectionId),
      references
    },
    additionalReferences: references,
    commandId,
    idempotencyKey: `ixi-collection-payment:${commandId}`,
    metadata: { ...metadata, transactModule: "collections", arPayment: true, collectionId: collection.identity?.collectionId, relatedInvoiceId: receivable.invoiceId },
    apiBaseUrl,
    headers,
    signal
  });
}

export async function recordIXICollectionCredit({ object = {}, context = {}, receivable = {}, collection = {}, input = {}, metadata = {}, apiBaseUrl = "", headers = {}, signal } = {}) {
  const amount = money(input.amount);
  if (!(amount > 0)) throw new Error("Credit amount must be greater than zero");
  if (amount > money(receivable.balance)) throw new Error("Credit cannot exceed the open receivable balance");
  const commandId = clean(input.clientRequestId) || `COLL-CREDIT-${Date.now()}`;
  const references = buildReferences({ object, context, receivable, collection });
  return createIXIAosObjectFinancialDocument({
    object,
    documentType: "credit",
    input: {
      currency: clean(receivable.currency || "USD"),
      amount,
      description: clean(input.description || input.reason || `A/R credit · ${receivable.invoiceNumber || receivable.invoiceId}`),
      status: "posted",
      financialState: "receivable-credit",
      direction: "out",
      reason: clean(input.reason),
      relatedInvoiceId: clean(receivable.invoiceId),
      relatedCollectionId: clean(collection.identity?.collectionId),
      references
    },
    additionalReferences: references,
    commandId,
    idempotencyKey: `ixi-collection-credit:${commandId}`,
    metadata: { ...metadata, transactModule: "collections", arCredit: true, writeOff: Boolean(input.writeOff), collectionId: collection.identity?.collectionId, relatedInvoiceId: receivable.invoiceId },
    apiBaseUrl,
    headers,
    signal
  });
}

export default { createIXICollectionCaseCommand, recordIXICollectionPayment, recordIXICollectionCredit };
