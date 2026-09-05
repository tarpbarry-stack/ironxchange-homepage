import {
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference,
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";
import { patchIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";
import {
  createIXISettlementDraft,
  validateIXISettlement,
} from "./IXISettlementContract";
const clean = (v) => String(v ?? "").trim();
const storedRecord = (response = {}) =>
  response?.data?.record || response?.record || {};
const documentOf = (response = {}) =>
  storedRecord(response)?.financialDocument ||
  response?.financialDocument ||
  response?.document ||
  {};
const documentIdOf = (response = {}) =>
  clean(documentOf(response)?.financialDocumentId || response?.documentId);
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
      object: context.actor || {},
      role: "employee",
    }),
  );
  for (const o of record.waterfall?.owners || [])
    push(refs, {
      role: "owner",
      label: o.label,
      objectType: "entity",
      passportId: o.partyPassportId,
      externalId: o.ownerId,
    });
  return refs;
}
export async function createIXISettlement({
  object = {},
  context = {},
  sale = {},
  acquisition = {},
  projection = {},
  waterfall = {},
  input = {},
  blockers = [],
  metadata = {},
  apiBaseUrl = "",
  headers = {},
  signal,
} = {}) {
  const draft = createIXISettlementDraft({
      context,
      sale,
      acquisition,
      projection,
      waterfall,
      input,
    }),
    check = validateIXISettlement(draft, blockers);
  if (!check.valid) {
    const e = new Error("Settlement cannot be prepared");
    e.validation = check;
    throw e;
  }
  const commandId = draft.identity.clientRequestId,
    resolved = {
      ...object,
      passportId: clean(object.passportId || draft.context.assetPassportId),
      objectId: clean(object.objectId || draft.context.assetObjectId),
      label: clean(object.label || draft.context.assetLabel),
    },
    notice = clean(resolved.objectId || resolved.passportId);
  return runIXIActionNoticeLifecycle({
    objectId: notice,
    commandId,
    source: "ixi-transact-settlement",
    savingMessage: "PREPARING SETTLEMENT...",
    successMessage: (r) =>
      `SETTLEMENT ${clean(r?.record?.identity?.number) || "PREPARED"}`,
    errorMessage: "SETTLEMENT SAVE FAILED",
    operation: async () => {
      const refs = refsFor(context, draft, resolved),
        saleFinancialDocumentId = clean(
          sale?.financialBinding?.financialDocumentId ||
            sale?.identity?.financialInvoiceId ||
            sale?.identity?.saleId,
        ),
        response = await createIXIAosObjectFinancialDocument({
          object: resolved,
          documentType: "settlement",
          input: {
            currency: "USD",
            description: `Asset Settlement · ${draft.context.assetLabel} · ${draft.references.saleNumber}`,
            sourceFinancialDocumentId: saleFinancialDocumentId,
            entityPassportId: clean(context.entity?.passportId),
            actorPassportId: clean(context.actor?.passportId),
            assetSettlement: draft,
            references: refs,
          },
          additionalReferences: refs,
          commandId,
          idempotencyKey: `ixi-settlement:${clean(context.entity?.passportId)}:${saleFinancialDocumentId}`,
          metadata: {
            ...metadata,
            transactModule: "settlement",
            dealId: clean(draft?.identity?.dealId),
            recordSchema: draft.schema,
            saleId: draft.references.saleId,
            saleNumber: draft.references.saleNumber,
            assetPassportId: draft.context.assetPassportId,
          },
          apiBaseUrl,
          headers,
          signal,
        });
      const stored = storedRecord(response),
        document = documentOf(response),
        id = documentIdOf(response);
      if (!id)
        throw new Error(
          "Settlement was not bound to a canonical IXI Financial document.",
        );
      return {
        record: {
          ...(document.assetSettlement || draft),
          financialBinding: {
            financialDocumentId: id,
            revision: Number(stored?.server?.revision || 1),
          },
        },
        response,
      };
    },
  });
}
export async function updateIXISettlement({
  record = {},
  action = "update",
  metadata = {},
  signal,
} = {}) {
  const financialDocumentId = clean(
    record?.financialBinding?.financialDocumentId ||
      record?.identity?.financialDocumentId ||
      record?.identity?.settlementId,
  );
  if (!financialDocumentId)
    throw new Error("Settlement is not bound to IXI Financial.");
  const commandId =
    globalThis.crypto?.randomUUID?.() || `STL-UPDATE-${Date.now()}`;
  const response = await patchIXIAosFinancialDocument({
    financialDocumentId,
    expectedRevision: record?.financialBinding?.revision,
    commandId,
    idempotencyKey: `ixi-settlement:${action}:${commandId}`,
    patch: { assetSettlement: record, status: clean(record.status) },
    metadata: { ...metadata, transactModule: "settlement", dealId: clean(record?.identity?.dealId), action },
    signal,
  });
  const stored = storedRecord(response);
  return {
    ...(stored?.financialDocument?.assetSettlement || record),
    financialBinding: {
      financialDocumentId,
      revision: Number(
        stored?.server?.revision || record?.financialBinding?.revision || 0,
      ),
    },
  };
}
export function approveIXISettlement(record = {}, actor = {}, note = "") {
  const at = new Date().toISOString();
  return {
    ...record,
    status: "approved",
    controls: {
      ...record.controls,
      approvedBy: clean(actor.displayName || actor.name || actor.label),
      approvedById: clean(actor.passportId || actor.employeeId || actor.userId),
      approvedAt: at,
      approvalNote: clean(note || record.controls?.approvalNote),
    },
    activity: [
      ...(record.activity || []),
      {
        eventId: `STL-APP-${Date.now()}`,
        type: "settlement-approved",
        occurredAt: at,
        actorLabel: clean(actor.displayName || actor.name || actor.label),
      },
    ],
    audit: { ...record.audit, updatedAt: at },
  };
}
export async function recordIXISettlementOwnerPayment({
  object = {},
  context = {},
  settlement = {},
  owner = {},
  input = {},
  metadata = {},
  apiBaseUrl = "",
  headers = {},
  signal,
} = {}) {
  if (
    settlement.status !== "approved" &&
    settlement.status !== "partially-paid"
  )
    throw new Error("Settlement must be approved before owner payment");
  const amount = Math.round(Number(input.amount || 0) * 100) / 100;
  if (!(amount > 0))
    throw new Error("Owner payment amount must be greater than zero");
  if (amount > Number(owner.balanceDue || 0) + 0.005)
    throw new Error("Owner payment exceeds settlement balance");
  if (!clean(input.reference))
    throw new Error("Owner payment reference is required");
  const commandId = clean(input.clientRequestId) || `STL-PAY-${Date.now()}`,
    refs = refsFor(context, settlement, object);
  push(refs, {
    role: "owner",
    label: owner.label,
    objectType: "entity",
    passportId: owner.partyPassportId,
    externalId: owner.ownerId,
  });
  const response = await createIXIAosObjectFinancialDocument({
    object,
    documentType: "payment",
    input: {
      currency: "USD",
      amount,
      description: `Settlement payout · ${settlement.identity?.number} · ${owner.label}`,
      financialState: "paid",
      paymentDirection: "outflow",
      paymentMethod: clean(input.method || "wire"),
      transactionReference: clean(input.reference),
      occurredAt: clean(input.date),
      sourceFinancialDocumentId: clean(
        settlement?.financialBinding?.financialDocumentId ||
          settlement.identity?.financialDocumentId ||
          settlement.identity?.settlementId,
      ),
      metadata: { ...metadata, transactModule: "settlement", settlementOwnerPayment: true, settlementId: settlement.identity?.settlementId, ownerId: owner.ownerId },
      references: refs,
    },
    additionalReferences: refs,
    commandId,
    idempotencyKey: `ixi-settlement-owner-payment:${commandId}`,
    metadata: {
      ...metadata,
      transactModule: "settlement",
      settlementOwnerPayment: true,
      settlementId: settlement.identity?.settlementId,
      ownerId: owner.ownerId,
    },
    apiBaseUrl,
    headers,
    signal,
  });
  return {
    response,
    payment: {
      paymentId: documentIdOf(response) || commandId,
      ownerId: owner.ownerId,
      ownerLabel: owner.label,
      date: clean(input.date),
      amount,
      method: clean(input.method || "wire"),
      reference: clean(input.reference),
      recordedAt: new Date().toISOString(),
    },
  };
}
export default {
  createIXISettlement,
  updateIXISettlement,
  approveIXISettlement,
  recordIXISettlementOwnerPayment,
};
