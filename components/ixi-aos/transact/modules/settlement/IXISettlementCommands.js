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
  for (const row of [
    ...(record.commissions || []),
    ...(record.disbursements || []),
    ...(record.liabilities || []),
  ]) {
    const passportId = clean(row.recipientPassportId || row.payeePassportId);
    const label = clean(row.recipientLabel || row.payeeLabel || row.label);
    if (passportId || label)
      push(refs, {
        role: "settlement-recipient",
        label,
        objectType: "entity",
        passportId,
        externalId: clean(
          row.recipientId || row.payeeId || row.commissionId || row.rowId,
        ),
      });
  }
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
    metadata: {
      ...metadata,
      transactModule: "settlement",
      dealId: clean(record?.identity?.dealId),
      action,
    },
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

export function reopenIXISettlement(record = {}, actor = {}, reason = "") {
  if (!clean(reason)) throw new Error("A correction reason is required");
  const at = new Date().toISOString();
  return {
    ...record,
    version: Number(record.version || 1) + 1,
    status: "reopened",
    paymentStatus: clean(record.paymentStatus || "unpaid"),
    correction: {
      reopenedAt: at,
      reopenedBy: clean(actor.displayName || actor.name || actor.label),
      reopenedById: clean(actor.passportId || actor.employeeId || actor.userId),
      reason: clean(reason),
      supersedesVersion: Number(record.version || 1),
    },
    activity: [
      ...(record.activity || []),
      {
        eventId: `STL-REOPEN-${Date.now()}`,
        type: "settlement-reopened",
        occurredAt: at,
        actorLabel: clean(actor.displayName || actor.name || actor.label),
        reason: clean(reason),
      },
    ],
    audit: { ...record.audit, updatedAt: at },
  };
}

export async function recordIXISettlementRecipientPayment({
  object = {},
  context = {},
  settlement = {},
  recipient = {},
  input = {},
  metadata = {},
  apiBaseUrl = "",
  headers = {},
  signal,
} = {}) {
  if (!["approved", "partially-paid"].includes(clean(settlement.status)))
    throw new Error("Settlement must be approved before payment");
  const amount = Math.round(Number(input.amount || 0) * 100) / 100;
  const balanceDue = Number(
    recipient.balanceDue ??
      recipient.finalDue ??
      recipient.amount ??
      recipient.finalAmount ??
      0,
  );
  if (!(amount > 0))
    throw new Error("Payment amount must be greater than zero");
  if (amount > balanceDue + 0.005)
    throw new Error("Payment exceeds the recipient balance");
  if (!clean(input.reference)) throw new Error("Payment reference is required");
  const recipientId = clean(
    recipient.ownerId ||
      recipient.commissionId ||
      recipient.disbursementId ||
      recipient.liabilityId ||
      recipient.rowId,
  );
  const recipientLabel = clean(
    recipient.label || recipient.recipientLabel || recipient.payeeLabel,
  );
  const recipientPassportId = clean(
    recipient.partyPassportId ||
      recipient.recipientPassportId ||
      recipient.payeePassportId,
  );
  const recipientType = clean(
    input.recipientType ||
      recipient.recipientType ||
      (recipient.ownerId
        ? "owner"
        : recipient.commissionId
          ? "commission"
          : recipient.liabilityId
            ? "payoff"
            : "third-party"),
  );
  if (!recipientId || !recipientLabel)
    throw new Error("Settlement payment recipient is required");
  const commandId = clean(input.clientRequestId) || `STL-PAY-${Date.now()}`;
  const statementSnapshot = {
    schema: "ixi-settlement-payment-statement-v1",
    statementNumber: `${clean(settlement.identity?.number || settlement.identity?.settlementId)}-${recipientId}`,
    settlementId: clean(settlement.identity?.settlementId),
    settlementNumber: clean(settlement.identity?.number),
    recipientId,
    recipientType,
    recipientLabel,
    amount,
    currency: "USD",
    paymentDate: clean(input.date),
    paymentMethod: clean(input.method || "wire"),
    paymentReference: clean(input.reference),
    assetLabel: clean(settlement.context?.assetLabel),
    saleNumber: clean(settlement.references?.saleNumber),
    generatedAt: new Date().toISOString(),
  };
  const refs = refsFor(context, settlement, object);
  push(refs, {
    role: "payee",
    label: recipientLabel,
    objectType: "entity",
    passportId: recipientPassportId,
    externalId: recipientId,
  });
  const response = await createIXIAosObjectFinancialDocument({
    object,
    documentType: "payment",
    input: {
      currency: "USD",
      amount,
      description: `Settlement payment · ${settlement.identity?.number} · ${recipientLabel}`,
      financialState: "paid",
      paymentDirection: "outflow",
      paymentMethod: clean(input.method || "wire"),
      transactionReference: clean(input.reference),
      bankReference: clean(input.bankReference),
      checkNumber: clean(input.checkNumber),
      occurredAt: clean(input.date),
      payeePassportId: recipientPassportId,
      payerPassportId: clean(
        input.payerPassportId || context.entity?.passportId,
      ),
      sourceFinancialDocumentId: clean(
        settlement?.financialBinding?.financialDocumentId ||
          settlement.identity?.financialDocumentId ||
          settlement.identity?.settlementId,
      ),
      metadata: {
        ...metadata,
        transactModule: "settlement",
        settlementRecipientPayment: true,
        settlementOwnerPayment: recipientType === "owner",
        settlementId: settlement.identity?.settlementId,
        recipientId,
        recipientType,
        ownerId: recipientType === "owner" ? recipientId : "",
        statementSnapshot,
      },
      references: refs,
    },
    additionalReferences: refs,
    commandId,
    idempotencyKey: `ixi-settlement-recipient-payment:${commandId}`,
    metadata: {
      ...metadata,
      transactModule: "settlement",
      settlementRecipientPayment: true,
      settlementOwnerPayment: recipientType === "owner",
      settlementId: settlement.identity?.settlementId,
      recipientId,
      recipientType,
      ownerId: recipientType === "owner" ? recipientId : "",
      statementSnapshot,
    },
    apiBaseUrl,
    headers,
    signal,
  });
  return {
    response,
    payment: {
      paymentId: documentIdOf(response) || commandId,
      recipientId,
      recipientLabel,
      recipientType,
      date: clean(input.date),
      amount,
      method: clean(input.method || "wire"),
      reference: clean(input.reference),
      bankReference: clean(input.bankReference),
      checkNumber: clean(input.checkNumber),
      recordedAt: new Date().toISOString(),
    },
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
  return recordIXISettlementRecipientPayment({
    object,
    context,
    settlement,
    recipient: owner,
    input: { ...input, recipientType: "owner" },
    metadata: { ...metadata, settlementOwnerPayment: true },
    apiBaseUrl,
    headers,
    signal,
  });
}
export default {
  createIXISettlement,
  updateIXISettlement,
  approveIXISettlement,
  reopenIXISettlement,
  recordIXISettlementRecipientPayment,
  recordIXISettlementOwnerPayment,
};
