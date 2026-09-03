import {
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference,
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";
import {
  createIXIAssetSaleDraft,
  validateIXIAssetSale,
} from "./IXIAssetSaleContract";
const clean = (v) => String(v ?? "").trim();
const storedRecord = response => response?.data?.record || response?.record || {};
const documentOf = response => storedRecord(response)?.financialDocument || response?.financialDocument || response?.document || {};
const documentIdOf = response => clean(documentOf(response)?.financialDocumentId || response?.documentId);
function push(refs, ref) {
  if (!ref) return;
  const key = [ref.passportId, ref.externalId, ref.role, ref.label]
    .map(clean)
    .join("|");
  if (
    !refs.some(
      (x) =>
        [x.passportId, x.externalId, x.role, x.label].map(clean).join("|") ===
        key,
    )
  )
    refs.push(ref);
}
function refsFor(context = {}, record = {}, object = {}) {
  const refs = [];
  push(
    refs,
    createIXIAosFinancialObjectReference({
      object: context.primary || object,
      role: "asset",
    }),
  );
  push(
    refs,
    createIXIAosFinancialObjectReference({
      object: context.entity || {},
      role: "entity",
    }),
  );
  push(
    refs,
    createIXIAosFinancialObjectReference({
      object: context.location || {},
      role: "location",
    }),
  );
  push(
    refs,
    createIXIAosFinancialObjectReference({
      object: context.actor || {},
      role: "employee",
    }),
  );
  if (record.sale?.buyerLabel)
    push(refs, {
      role: "customer",
      label: record.sale.buyerLabel,
      objectType: "entity",
      passportId: record.sale.buyerPassportId,
      externalId: record.sale.buyerId,
    });
  return refs;
}
export async function createIXIAssetSale({
  object = {},
  context = {},
  input = {},
  metadata = {},
  apiBaseUrl = "",
  headers = {},
  signal,
} = {}) {
  const draft = createIXIAssetSaleDraft({ context, input }),
    check = validateIXIAssetSale(draft);
  if (!check.valid) {
    const e = new Error("SOLD record is incomplete");
    e.validation = check;
    throw e;
  }
  const commandId = draft.identity.clientRequestId,
    resolved = {
      ...object,
      passportId: clean(object.passportId || draft.context.assetPassportId),
      objectId: clean(object.objectId || draft.context.assetObjectId),
      objectType: clean(object.objectType || draft.context.assetObjectType),
      label: clean(object.label || draft.context.assetLabel),
    },
    notice = clean(resolved.objectId || resolved.passportId);
  return runIXIActionNoticeLifecycle({
    objectId: notice,
    commandId,
    source: "ixi-transact-sold",
    savingMessage: "RECORDING SOLD...",
    successMessage: (r) =>
      `SOLD ${clean(r?.record?.identity?.number) || "RECORDED"}`,
    errorMessage: "SOLD SAVE FAILED",
    operation: async () => {
      const refs = refsFor(context, draft, resolved),
        response = await createIXIAosObjectFinancialDocument({
          object: resolved,
          documentType: "invoice",
          input: {
            currency: "USD",
            amount: draft.sale.salePrice,
            description: `Asset Sale · ${draft.context.assetLabel} · ${draft.sale.buyerLabel}`,
            status: "issued",
            financialState: "receivable",
            invoiceType: "asset-sale",
            assetSale: draft.sale,
            metadata: { ...metadata, transactModule: "sold", assetSale: true, assetSaleRecord: draft, invoiceType: "asset-sale" },
            attachments: draft.documents,
            references: refs,
          },
          additionalReferences: refs,
          commandId,
          idempotencyKey: `ixi-asset-sale:${commandId}`,
          metadata: {
            ...metadata,
            transactModule: "sold",
            recordSchema: draft.schema,
            assetSale: true,
            assetSaleRecord: draft,
            assetPassportId: draft.context.assetPassportId,
            buyerLabel: draft.sale.buyerLabel,
            saleDate: draft.sale.saleDate,
          },
          apiBaseUrl,
          headers,
          signal,
        });
      const financialId = documentIdOf(response),
        number = `SALE-${financialId
          .replace(/^SALE-/i, "")
          .slice(-6)
          .toUpperCase()}`,
        at = new Date().toISOString();
      if (!financialId) throw new Error("Asset sale was not bound to a canonical IXI Financial invoice.");
      return {
        record: {
          ...draft,
          identity: {
            ...draft.identity,
            saleId: financialId,
            number,
            financialInvoiceId: financialId,
          },
          status: "sold",
          activity: [
            {
              eventId: `SALE-CREATE-${Date.now()}`,
              type: "asset-sold",
              occurredAt: at,
              actorLabel: draft.context.actorLabel,
            },
          ],
          audit: { ...draft.audit, updatedAt: at },
        },
        response,
      };
    },
  });
}
export async function recordIXIAssetSaleReceipt({
  object = {},
  context = {},
  sale = {},
  input = {},
  metadata = {},
  apiBaseUrl = "",
  headers = {},
  signal,
} = {}) {
  const amount = Math.round(Number(input.amount || 0) * 100) / 100;
  if (!(amount > 0))
    throw new Error("Receipt amount must be greater than zero");
  if (!clean(input.reference)) throw new Error("Receipt reference is required");
  const commandId = clean(input.clientRequestId) || `SALE-PAY-${Date.now()}`,
    refs = refsFor(context, sale, object);
  const response = await createIXIAosObjectFinancialDocument({
    object,
    documentType: "payment",
    input: {
      currency: "USD",
      amount,
      description: `Asset sale receipt · ${sale.identity?.number || "SALE"}`,
      financialState: "received",
      paymentDirection: "inflow",
      paymentMethod: clean(input.method || "wire"),
      transactionReference: clean(input.reference),
      occurredAt: clean(input.date),
      sourceFinancialDocumentId: clean(sale?.financialBinding?.financialDocumentId || sale.identity?.financialInvoiceId || sale.identity?.saleId),
      metadata: { ...metadata, transactModule: "sold", assetSalePayment: true, saleId: sale.identity?.saleId },
      references: refs,
    },
    additionalReferences: refs,
    commandId,
    idempotencyKey: `ixi-asset-sale-payment:${commandId}`,
    metadata: {
      ...metadata,
      transactModule: "sold",
      assetSalePayment: true,
      saleId: sale.identity?.saleId,
      saleNumber: sale.identity?.number,
    },
    apiBaseUrl,
    headers,
    signal,
  });
  return {
    response,
    payment: {
      paymentId: documentIdOf(response) || commandId,
      date: clean(input.date),
      amount,
      method: clean(input.method || "wire"),
      reference: clean(input.reference),
      recordedAt: new Date().toISOString(),
    },
  };
}
export default { createIXIAssetSale, recordIXIAssetSaleReceipt };
