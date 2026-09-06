import {
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference,
  mergeIXIAosFinancialReferences,
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { patchIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";
import { createIXIAssetSaleDraft, validateIXIAssetSale } from "./IXIAssetSaleContract";

const clean = value => String(value ?? "").trim();
const storedRecord = response => response?.data?.record || response?.record || {};
const documentOf = response =>
  storedRecord(response)?.financialDocument ||
  response?.financialDocument ||
  response?.document ||
  {};
const documentIdOf = response => clean(documentOf(response)?.financialDocumentId || response?.documentId);

function push(references, reference) {
  if (!reference) return;
  const key = [reference.passportId, reference.externalId, reference.role, reference.label]
    .map(clean)
    .join("|");
  if (!references.some(item =>
    [item.passportId, item.externalId, item.role, item.label].map(clean).join("|") === key
  )) references.push(reference);
}

function referencesFor(context = {}, record = {}, object = {}) {
  const references = [];
  push(references, createIXIAosFinancialObjectReference({ object: context.primary || object, role: "asset" }));
  push(references, createIXIAosFinancialObjectReference({ object: context.entity || {}, role: "entity" }));
  push(references, createIXIAosFinancialObjectReference({ object: context.location || {}, role: "location" }));
  push(references, createIXIAosFinancialObjectReference({ object: context.actor || {}, role: "employee" }));
  if (record.sale?.buyerLabel) {
    push(references, {
      role: "customer",
      label: record.sale.buyerLabel,
      objectType: "entity",
      passportId: record.sale.buyerPassportId,
      externalId: record.sale.buyerId,
    });
  }
  return references;
}

function canonicalInvoice(sourceInvoice = {}, response = null, financialState = "") {
  const stored = storedRecord(response);
  const document = documentOf(response);
  if (!clean(document.financialDocumentId)) {
    return { ...sourceInvoice, financialState: clean(financialState || sourceInvoice.financialState) };
  }
  return {
    ...sourceInvoice,
    ...document,
    financialBinding: {
      financialDocumentId: document.financialDocumentId,
      revision: Number(stored?.server?.revision || sourceInvoice?.financialBinding?.revision || 1),
      line: document?.lines?.[0] || sourceInvoice?.financialBinding?.line || null,
    },
  };
}

async function ensureInvoiceIsCollectible(sourceInvoice = {}, signal) {
  const financialState = clean(sourceInvoice?.financialState).toLowerCase();
  if (["billed", "partially-collected", "collected"].includes(financialState)) {
    return { invoice: sourceInvoice, response: null };
  }
  if (financialState !== "draft") {
    throw new Error("Customer payment requires a draft or issued Invoice.");
  }

  const financialDocumentId = clean(
    sourceInvoice?.financialBinding?.financialDocumentId ||
      sourceInvoice?.financialDocumentId,
  );
  const expectedRevision = Number(
    sourceInvoice?.financialBinding?.revision || sourceInvoice?.server?.revision || 0,
  );
  if (!financialDocumentId || expectedRevision < 1) {
    throw new Error("Customer payment requires the canonical Invoice.");
  }

  const issuedAt = new Date().toISOString();
  const commandId = clean(globalThis.crypto?.randomUUID?.()) || `INV-ISSUE-${Date.now()}`;
  const response = await patchIXIAosFinancialDocument({
    financialDocumentId,
    expectedRevision,
    commandId,
    idempotencyKey: `ixi-asset-sale-issue:${financialDocumentId}:${expectedRevision}`,
    patch: {
      status: "issued",
      financialState: "billed",
      metadata: {
        ...(sourceInvoice?.metadata || {}),
        invoiceStatus: "issued",
        issuedAt,
      },
    },
    metadata: {
      transactModule: "sold",
      action: "issue-invoice-before-receipt",
      issuedAt,
    },
    signal,
  });
  return {
    invoice: canonicalInvoice(sourceInvoice, response, "billed"),
    response,
  };
}

export async function createIXIAssetSale({
  object = {},
  context = {},
  input = {},
  metadata = {},
  headers = {},
  signal,
} = {}) {
  const draft = createIXIAssetSaleDraft({ context, input });
  const check = validateIXIAssetSale(draft, input.sourceInvoice);
  if (!check.valid) {
    const error = new Error("SOLD requires an issued Invoice with a zero customer balance.");
    error.validation = check;
    throw error;
  }
  const commandId = draft.identity.clientRequestId;
  const resolved = {
    ...object,
    passportId: clean(object.passportId || draft.context.assetPassportId),
    objectId: clean(object.objectId || draft.context.assetObjectId),
    objectType: clean(object.objectType || draft.context.assetObjectType),
    label: clean(object.label || draft.context.assetLabel),
  };
  const financialInvoiceId = clean(draft.identity.financialInvoiceId);
  const expectedRevision = Number(
    input.sourceInvoice?.financialBinding?.revision ||
      input.sourceInvoice?.server?.revision ||
      0,
  );
  if (!financialInvoiceId || !Number.isInteger(expectedRevision) || expectedRevision < 1) {
    throw new Error("SOLD closeout requires the current canonical Invoice revision.");
  }
  return runIXIActionNoticeLifecycle({
    objectId: clean(resolved.objectId || resolved.passportId),
    commandId,
    source: "ixi-transact-sold",
    savingMessage: "VERIFYING FUNDS + CLOSING SALE...",
    successMessage: result => `SOLD ${clean(result?.record?.identity?.number) || "RECORDED"}`,
    errorMessage: "SOLD CLOSEOUT FAILED",
    operation: async () => {
      const references = mergeIXIAosFinancialReferences([
        ...(Array.isArray(input.sourceInvoice?.references) ? input.sourceInvoice.references : []),
        ...referencesFor(context, draft, resolved),
      ]);
      const closedAt = new Date().toISOString();
      const soldRecord = {
        ...draft,
        identity: {
          ...draft.identity,
          saleId: financialInvoiceId,
          financialInvoiceId,
        },
        collection: { ...draft.collection, status: "paid", balanceDue: 0 },
        status: "sold",
        activity: [
          {
            eventId: `SALE-CLOSE-${Date.now()}`,
            type: "asset-sale-closed",
            occurredAt: closedAt,
            actorLabel: draft.context.actorLabel,
            invoiceNumber: draft.sale.invoiceNumber,
          },
        ],
        audit: { ...draft.audit, updatedAt: closedAt, closedAt },
      };
      const response = await patchIXIAosFinancialDocument({
        financialDocumentId: financialInvoiceId,
        expectedRevision,
        commandId,
        idempotencyKey: `ixi-asset-sale-close:${financialInvoiceId}:${expectedRevision}`,
        patch: {
          status: "closed",
          financialState: "collected",
          invoiceType: "asset-sale",
          assetSale: soldRecord.sale,
          attachments: soldRecord.documents.filter(document =>
            ["uploaded", "available", "verified"].includes(clean(document?.status).toLowerCase()),
          ),
          references,
          metadata: {
            ...(input.sourceInvoice?.metadata || {}),
            ...metadata,
            transactModule: "sold",
            dealId: clean(soldRecord.identity.dealId),
            assetSale: true,
            assetSaleRecord: soldRecord,
            invoiceType: "asset-sale",
            invoiceNumber: soldRecord.sale.invoiceNumber,
            billOfSaleNumber: soldRecord.sale.billOfSaleNumber,
            assetCostBasis: Number(soldRecord.sale.assetCostBasis || 0),
            soldAt: closedAt,
            collectionStatus: "paid",
            balanceDue: 0,
          },
        },
        metadata: {
          ...metadata,
          transactModule: "sold",
          dealId: clean(soldRecord.identity.dealId),
          recordSchema: soldRecord.schema,
          assetSale: true,
          assetPassportId: soldRecord.context.assetPassportId,
          buyerLabel: soldRecord.sale.buyerLabel,
          saleDate: soldRecord.sale.saleDate,
        },
        headers,
        signal,
      });
      const financialId = documentIdOf(response);
      if (!financialId || financialId !== financialInvoiceId) {
        throw new Error("SOLD closeout did not return the original canonical Invoice.");
      }
      const stored = storedRecord(response);
      return {
        record: {
          ...soldRecord,
          financialBinding: {
            financialDocumentId: financialId,
            revision: Number(stored?.server?.revision || expectedRevision + 1),
          },
        },
        invoice: canonicalInvoice(input.sourceInvoice, response, "collected"),
        response,
      };
    },
  });
}

export async function recordIXIAssetSaleReceipt({
  object = {},
  context = {},
  sale = {},
  sourceInvoice = {},
  input = {},
  metadata = {},
  apiBaseUrl = "",
  headers = {},
  signal,
} = {}) {
  const amount = Math.round(Number(input.amount || 0) * 100) / 100;
  if (!(amount > 0)) throw new Error("Receipt amount must be greater than zero.");
  if (!clean(input.reference)) throw new Error("Receipt reference is required.");
  const issued = await ensureInvoiceIsCollectible(sourceInvoice, signal);
  const collectibleInvoice = issued.invoice;
  const invoiceId = clean(
    collectibleInvoice?.financialBinding?.financialDocumentId ||
      collectibleInvoice?.financialDocumentId ||
      sale?.identity?.financialInvoiceId ||
      sale?.identity?.saleId,
  );
  const invoiceRevision = Number(collectibleInvoice?.financialBinding?.revision || collectibleInvoice?.server?.revision || 0);
  if (!invoiceId || invoiceRevision < 1) throw new Error("Customer payment requires the canonical Invoice.");
  const currentBalance = Number(sale?.collection?.balanceDue || 0);
  if (amount > currentBalance + 0.005) throw new Error("Receipt exceeds the open Invoice balance.");
  const commandId = clean(input.clientRequestId) || `SALE-PAY-${Date.now()}`;
  const references = referencesFor(context, sale, object);
  const response = await createIXIAosObjectFinancialDocument({
    object,
    documentType: "payment",
    input: {
      currency: clean(collectibleInvoice.currency || sale?.sale?.currency || "USD"),
      amount,
      description: `Customer receipt · ${clean(collectibleInvoice.documentNumber || sale?.sale?.invoiceNumber || invoiceId)}`,
      financialState: "paid",
      paymentDirection: "inflow",
      paymentMethod: clean(input.method || "wire"),
      transactionReference: clean(input.reference),
      occurredAt: clean(input.date),
      sourceFinancialDocumentId: invoiceId,
      metadata: {
        ...metadata,
        transactModule: "sold",
        assetSalePayment: true,
        dealId: clean(sale?.identity?.dealId),
        invoiceNumber: clean(collectibleInvoice.documentNumber),
      },
      references,
    },
    additionalReferences: references,
    commandId,
    idempotencyKey: `ixi-asset-sale-payment:${invoiceId}:${commandId}`,
    metadata: {
      ...metadata,
      transactModule: "sold",
      assetSalePayment: true,
      dealId: clean(sale?.identity?.dealId),
      invoiceId,
    },
    apiBaseUrl,
    headers,
    signal,
  });
  const payment = {
    paymentId: documentIdOf(response) || commandId,
    date: clean(input.date),
    amount,
    method: clean(input.method || "wire"),
    reference: clean(input.reference),
    recordedAt: new Date().toISOString(),
  };
  const nextBalance = Math.max(0, currentBalance - amount);
  const nextState = nextBalance <= 0.005 ? "collected" : "partially-collected";
  let invoiceResponse = null;
  let syncWarning = "";
  try {
    const invoiceCommandId = clean(globalThis.crypto?.randomUUID?.()) || `INV-COLLECT-${Date.now()}`;
    invoiceResponse = await patchIXIAosFinancialDocument({
      financialDocumentId: invoiceId,
      expectedRevision: invoiceRevision,
      commandId: invoiceCommandId,
      idempotencyKey: `ixi-invoice-collection:${invoiceId}:${payment.paymentId}`,
      patch: {
        financialState: nextState,
        metadata: {
          ...(collectibleInvoice?.metadata || {}),
          collectionStatus: nextState,
          amountReceived: Math.round((Number(sale?.collection?.amountReceived || 0) + amount) * 100) / 100,
          balanceDue: Math.round(nextBalance * 100) / 100,
          lastReceiptId: payment.paymentId,
        },
      },
      metadata: { transactModule: "sold", action: "synchronize-invoice-collection" },
      signal,
    });
  } catch (error) {
    syncWarning = clean(error?.message || "Invoice collection state will reconcile on refresh.");
  }
  return {
    response,
    invoiceIssueResponse: issued.response,
    invoiceResponse,
    invoice: canonicalInvoice(collectibleInvoice, invoiceResponse, nextState),
    payment,
    syncWarning,
  };
}

export default { createIXIAssetSale, recordIXIAssetSaleReceipt };
