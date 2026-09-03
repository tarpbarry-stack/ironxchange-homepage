import {
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference,
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";
import { patchIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";
import {
  createIXICollectionCase,
  validateIXICollectionCase,
} from "./IXICollectionsContract";

const clean = (value) => String(value ?? "").trim();
const money = (value) => Math.round(Number(value || 0) * 100) / 100;

function storedRecord(response = {}) {
  return response?.data?.record || response?.record || {};
}

function documentOf(response = {}) {
  const stored = storedRecord(response);
  return (
    stored?.financialDocument ||
    response?.financialDocument ||
    response?.document ||
    {}
  );
}

function documentIdOf(response = {}) {
  return clean(
    documentOf(response)?.financialDocumentId || response?.documentId,
  );
}

function pushReference(references, reference) {
  if (!reference) return;
  const key = [
    reference.passportId,
    reference.externalId,
    reference.role,
    reference.label,
  ]
    .map(clean)
    .join("|");
  if (
    !references.some(
      (item) =>
        [item.passportId, item.externalId, item.role, item.label]
          .map(clean)
          .join("|") === key,
    )
  )
    references.push(reference);
}

function buildReferences({
  object = {},
  context = {},
  receivable = {},
  collection = {},
} = {}) {
  const references = [];
  pushReference(
    references,
    createIXIAosFinancialObjectReference({
      object: context.primary || object,
      role: "object",
    }),
  );
  pushReference(
    references,
    createIXIAosFinancialObjectReference({
      object: context.entity || {},
      role: "entity",
    }),
  );
  pushReference(
    references,
    createIXIAosFinancialObjectReference({
      object: context.location || {},
      role: "location",
    }),
  );
  pushReference(
    references,
    createIXIAosFinancialObjectReference({
      object: context.actor || {},
      role: "employee",
    }),
  );
  const customerPassportId = clean(
    receivable.customerPassportId || collection.customer?.passportId,
  );
  const customerLabel = clean(
    receivable.customerLabel || collection.customer?.label,
  );
  if (customerPassportId || customerLabel)
    pushReference(references, {
      passportId: customerPassportId,
      externalId: clean(
        receivable.customerId || collection.customer?.customerId,
      ),
      role: "customer",
      label: customerLabel,
      objectType: "entity",
    });
  return references;
}

export async function createIXICollectionCaseCommand({
  object = {},
  context = {},
  receivable = {},
  input = {},
  metadata = {},
  apiBaseUrl = "",
  headers = {},
  signal,
} = {}) {
  const draft = createIXICollectionCase({ context, receivable, input });
  const check = validateIXICollectionCase(draft);
  if (!check.valid) {
    const error = new Error("Collection case is incomplete");
    error.validation = check;
    throw error;
  }
  const commandId = draft.identity.clientRequestId;
  const references = buildReferences({
    object,
    context,
    receivable,
    collection: draft,
  });
  const noticeObjectId = clean(
    context.primary?.objectId ||
      context.primary?.passportId ||
      object.objectId ||
      object.passportId,
  );

  return runIXIActionNoticeLifecycle({
    objectId: noticeObjectId,
    commandId,
    source: "ixi-transact-collections",
    savingMessage: "OPENING COLLECTION CASE...",
    successMessage: (result) =>
      `COLLECTION ${clean(result?.record?.identity?.number) || "OPENED"}`,
    errorMessage: "COLLECTION SAVE FAILED",
    operation: async () => {
      const response = await createIXIAosObjectFinancialDocument({
        object,
        documentType: "collection",
        input: {
          currency: "USD",
          description: `Collections · ${receivable.customerLabel || "Customer"} · ${receivable.invoiceNumber || receivable.invoiceId}`,
          sourceFinancialDocumentId: clean(receivable.invoiceId),
          entityPassportId: clean(context.entity?.passportId),
          actorPassportId: clean(context.actor?.passportId),
          collectionCase: draft,
          references,
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
          customerLabel: clean(receivable.customerLabel),
        },
        apiBaseUrl,
        headers,
        signal,
      });
      const stored = storedRecord(response);
      const document = documentOf(response);
      const financialId = documentIdOf(response);
      if (!financialId)
        throw new Error(
          "Collection was not bound to a canonical IXI Financial document.",
        );
      const canonical = document.collectionCase || draft;
      return {
        record: {
          ...canonical,
          financialBinding: {
            financialDocumentId: financialId,
            revision: Number(stored?.server?.revision || 1),
          },
        },
        response,
      };
    },
  });
}

export async function updateIXICollectionCaseCommand({
  record = {},
  action = "update",
  metadata = {},
  signal,
} = {}) {
  const financialDocumentId = clean(
    record?.financialBinding?.financialDocumentId ||
      record?.identity?.financialDocumentId ||
      record?.identity?.collectionId,
  );
  if (!financialDocumentId)
    throw new Error("Collection case is not bound to IXI Financial.");
  const commandId =
    globalThis.crypto?.randomUUID?.() || `COLL-UPDATE-${Date.now()}`;
  const response = await patchIXIAosFinancialDocument({
    financialDocumentId,
    expectedRevision: record?.financialBinding?.revision,
    commandId,
    idempotencyKey: `ixi-collection:${action}:${commandId}`,
    patch: { collectionCase: record, status: clean(record.status || "open") },
    metadata: { ...metadata, transactModule: "collections", action },
    signal,
  });
  const stored = storedRecord(response);
  return {
    ...(stored?.financialDocument?.collectionCase || record),
    financialBinding: {
      financialDocumentId,
      revision: Number(
        stored?.server?.revision || record?.financialBinding?.revision || 0,
      ),
    },
  };
}

export async function recordIXICollectionPayment({
  object = {},
  context = {},
  receivable = {},
  collection = {},
  input = {},
  metadata = {},
  apiBaseUrl = "",
  headers = {},
  signal,
} = {}) {
  const amount = money(input.amount);
  if (!(amount > 0))
    throw new Error("Payment amount must be greater than zero");
  if (amount > money(receivable.balance))
    throw new Error("Payment cannot exceed the open receivable balance");
  if (!clean(input.reference)) throw new Error("Payment reference is required");
  const commandId = clean(input.clientRequestId) || `COLL-PAY-${Date.now()}`;
  const references = buildReferences({
    object,
    context,
    receivable,
    collection,
  });
  return createIXIAosObjectFinancialDocument({
    object,
    documentType: "payment",
    input: {
      currency: clean(receivable.currency || "USD"),
      amount,
      description: `A/R receipt · ${receivable.invoiceNumber || receivable.invoiceId}`,
      financialState: "received",
      paymentDirection: "inflow",
      paymentMethod: clean(input.method || "wire"),
      transactionReference: clean(input.reference),
      occurredAt: clean(input.date) || new Date().toISOString(),
      sourceFinancialDocumentId: clean(receivable.invoiceId),
      metadata: { ...metadata, transactModule: "collections", arPayment: true, collectionId: collection.identity?.collectionId },
      references,
    },
    additionalReferences: references,
    commandId,
    idempotencyKey: `ixi-collection-payment:${commandId}`,
    metadata: {
      ...metadata,
      transactModule: "collections",
      arPayment: true,
      collectionId: collection.identity?.collectionId,
      relatedInvoiceId: receivable.invoiceId,
    },
    apiBaseUrl,
    headers,
    signal,
  });
}

export async function recordIXICollectionCredit({
  object = {},
  context = {},
  receivable = {},
  collection = {},
  input = {},
  metadata = {},
  apiBaseUrl = "",
  headers = {},
  signal,
} = {}) {
  const amount = money(input.amount);
  if (!(amount > 0)) throw new Error("Credit amount must be greater than zero");
  if (amount > money(receivable.balance))
    throw new Error("Credit cannot exceed the open receivable balance");
  const commandId = clean(input.clientRequestId) || `COLL-CREDIT-${Date.now()}`;
  const references = buildReferences({
    object,
    context,
    receivable,
    collection,
  });
  if (!clean(input.reason)) throw new Error("Credit reason is required");
  return createIXIAosObjectFinancialDocument({
    object,
    documentType: "credit",
    input: {
      currency: clean(receivable.currency || "USD"),
      amount,
      description: clean(
        input.description ||
          input.reason ||
          `A/R credit · ${receivable.invoiceNumber || receivable.invoiceId}`,
      ),
      financialState: "receivable-credit",
      reasonCode: clean(input.reason),
      sourceFinancialDocumentId: clean(receivable.invoiceId),
      metadata: { ...metadata, transactModule: "collections", arCredit: true, writeOff: Boolean(input.writeOff), collectionId: collection.identity?.collectionId },
      references,
    },
    additionalReferences: references,
    commandId,
    idempotencyKey: `ixi-collection-credit:${commandId}`,
    metadata: {
      ...metadata,
      transactModule: "collections",
      arCredit: true,
      writeOff: Boolean(input.writeOff),
      collectionId: collection.identity?.collectionId,
      relatedInvoiceId: receivable.invoiceId,
    },
    apiBaseUrl,
    headers,
    signal,
  });
}

export default {
  createIXICollectionCaseCommand,
  updateIXICollectionCaseCommand,
  recordIXICollectionPayment,
  recordIXICollectionCredit,
};
