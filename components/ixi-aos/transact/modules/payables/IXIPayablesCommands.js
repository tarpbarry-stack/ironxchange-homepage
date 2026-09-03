import {
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference,
  mergeIXIAosFinancialReferences,
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";
import { patchIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";
const clean = (value) => String(value ?? "").trim();
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
function refs({ context = {}, payable = {}, object = {} } = {}) {
  const list = [];
  for (const [candidate, role] of [
    [context.primary || object, "object"],
    [context.entity || {}, "entity"],
    [context.location || {}, "location"],
    [context.actor || {}, "employee"],
  ]) {
    const ref = createIXIAosFinancialObjectReference({
      object: candidate,
      role,
    });
    if (ref) list.push(ref);
  }
  if (payable?.vendorLabel)
    list.push({
      role: "vendor",
      label: clean(payable.vendorLabel),
      objectType: "vendor",
      passportId: clean(payable.vendorPassportId),
      externalId: clean(payable.vendorId),
    });
  if (payable?.billId)
    list.push({
      role: "bill",
      label: clean(payable.billNumber || payable.billId),
      objectType: "bill",
      externalId: clean(payable.billId),
    });
  return mergeIXIAosFinancialReferences(list);
}
function documentIdOf(response = {}) {
  return clean(
    response?.data?.record?.financialDocument?.financialDocumentId ||
      response?.record?.financialDocument?.financialDocumentId ||
      response?.financialDocument?.financialDocumentId ||
      response?.document?.financialDocumentId ||
      response?.documentId,
  );
}
function assertSettlementReady(payable = {}, input = {}, kind = "Payment") {
  const amount = Math.round(num(input.amount) * 100) / 100;
  if (!(amount > 0))
    throw new Error(`${kind} amount must be greater than zero.`);
  if (!clean(payable.billId))
    throw new Error(`${kind} requires a canonical Bill.`);
  if (
    payable.recognized === false ||
    clean(payable.approvalStatus).toLowerCase() !== "approved"
  )
    throw new Error("Bill must be approved before settlement.");
  if (amount > num(payable.balance) + 0.005)
    throw new Error(`${kind} cannot exceed the open A/P balance.`);
  return amount;
}
export async function saveIXIPayablesControl({
  object = {},
  context = {},
  payable = {},
  record = {},
  action = "update",
  signal,
} = {}) {
  const existingId = clean(record?.financialBinding?.financialDocumentId);
  const commandId =
    globalThis.crypto?.randomUUID?.() || `AP-CONTROL-${Date.now()}`;
  if (existingId) {
    const response = await patchIXIAosFinancialDocument({
      financialDocumentId: existingId,
      expectedRevision: record?.financialBinding?.revision,
      commandId,
      idempotencyKey: `ixi-ap-control:${commandId}`,
      signal,
      patch: { payablesControl: record },
      metadata: { transactModule: "payables", action },
    });
    const stored = response?.data?.record || response?.record || {};
    const control = stored?.financialDocument?.payablesControl || record;
    return {
      ...control,
      financialBinding: {
        financialDocumentId: existingId,
        revision: Number(
          stored?.server?.revision || record?.financialBinding?.revision || 0,
        ),
      },
    };
  }
  const references = refs({ context, payable, object });
  const response = await createIXIAosObjectFinancialDocument({
    object,
    documentType: "payables-control",
    commandId,
    idempotencyKey: `ixi-ap-control:${clean(context.entity?.passportId)}:${clean(payable.billId)}`,
    signal,
    input: {
      currency: clean(payable.currency || "USD"),
      sourceFinancialDocumentId: clean(payable.billId),
      entityPassportId: clean(context.entity?.passportId),
      actorPassportId: clean(context.actor?.passportId),
      payablesControl: record,
      references,
    },
    additionalReferences: references,
    metadata: { transactModule: "payables", action },
  });
  const stored = response?.data?.record || response?.record || {};
  const document =
    stored?.financialDocument || response?.financialDocument || {};
  return {
    ...(document?.payablesControl || record),
    financialBinding: {
      financialDocumentId:
        clean(document?.financialDocumentId) || documentIdOf(response),
      revision: Number(stored?.server?.revision || 1),
    },
  };
}
export async function postIXIPayablesPayment({
  object = {},
  context = {},
  payable = {},
  input = {},
  metadata = {},
  signal,
} = {}) {
  const amount = assertSettlementReady(payable, input, "Payment");
  if (payable.hold) throw new Error("Payment is on hold.");
  if (payable.disputed)
    throw new Error("Resolve the dispute before posting payment.");
  if (!clean(input.reference))
    throw new Error("Payment reference is required.");
  const commandId =
      clean(input.clientRequestId) ||
      globalThis.crypto?.randomUUID?.() ||
      `AP-PAY-${Date.now()}`,
    references = refs({ context, payable, object }),
    origin = clean(
      context.primary?.objectId ||
        context.primary?.passportId ||
        object.objectId ||
        object.passportId,
    );
  return runIXIActionNoticeLifecycle({
    objectId: origin,
    commandId,
    source: "ixi-transact-payables-payment",
    savingMessage: "POSTING A/P PAYMENT...",
    successMessage: "A/P PAYMENT POSTED",
    errorMessage: (e) => clean(e?.message) || "A/P PAYMENT FAILED",
    operation: async () => {
      const response = await createIXIAosObjectFinancialDocument({
        object,
        documentType: "payment",
        commandId,
        idempotencyKey: `ixi-ap-payment:${commandId}`,
        signal,
        input: {
          currency: clean(payable.currency || "USD"),
          amount,
          financialState: "paid",
          paymentDirection: "outflow",
          occurredAt: clean(input.date) || new Date().toISOString(),
          paymentMethod: clean(input.method || "ach"),
          transactionReference: clean(input.reference),
          description: `A/P payment · ${clean(payable.billNumber)}`,
          payerPassportId: clean(context.entity?.passportId),
          payeePassportId: clean(payable.vendorPassportId),
          employeePassportId: clean(context.actor?.passportId),
          sourceFinancialDocumentId: clean(payable.billId),
          references,
        },
        additionalReferences: references,
        metadata: {
          ...metadata,
          transactModule: "payables",
          payablesPayment: true,
          billDocumentId: clean(payable.billId),
          billNumber: clean(payable.billNumber),
        },
      });
      return {
        response,
        payment: {
          paymentId: documentIdOf(response) || commandId,
          amount,
          date: clean(input.date),
          method: clean(input.method),
          reference: clean(input.reference),
        },
      };
    },
  });
}
export async function postIXIPayablesCredit({
  object = {},
  context = {},
  payable = {},
  input = {},
  metadata = {},
  signal,
} = {}) {
  const amount = assertSettlementReady(payable, input, "Vendor credit");
  if (!clean(input.reason))
    throw new Error("Vendor credit reason is required.");
  const commandId =
      clean(input.clientRequestId) ||
      globalThis.crypto?.randomUUID?.() ||
      `AP-CREDIT-${Date.now()}`,
    references = refs({ context, payable, object }),
    origin = clean(
      context.primary?.objectId ||
        context.primary?.passportId ||
        object.objectId ||
        object.passportId,
    );
  return runIXIActionNoticeLifecycle({
    objectId: origin,
    commandId,
    source: "ixi-transact-payables-credit",
    savingMessage: "POSTING VENDOR CREDIT...",
    successMessage: "VENDOR CREDIT POSTED",
    errorMessage: (e) => clean(e?.message) || "VENDOR CREDIT FAILED",
    operation: async () => {
      const response = await createIXIAosObjectFinancialDocument({
        object,
        documentType: "credit",
        commandId,
        idempotencyKey: `ixi-ap-credit:${commandId}`,
        signal,
        input: {
          currency: clean(payable.currency || "USD"),
          amount,
          financialState: "incurred",
          occurredAt: clean(input.date) || new Date().toISOString(),
          description: `Vendor credit · ${clean(payable.billNumber)}`,
          memo: clean(input.reason),
          reasonCode: "vendor-credit",
          vendorPassportId: clean(payable.vendorPassportId),
          recordedByPassportId: clean(context.actor?.passportId),
          sourceFinancialDocumentId: clean(payable.billId),
          references,
        },
        additionalReferences: references,
        metadata: {
          ...metadata,
          transactModule: "payables",
          vendorCredit: true,
          billDocumentId: clean(payable.billId),
          billNumber: clean(payable.billNumber),
        },
      });
      return {
        response,
        credit: {
          creditId: documentIdOf(response) || commandId,
          amount,
          date: clean(input.date),
          reason: clean(input.reason),
        },
      };
    },
  });
}
export default {
  saveIXIPayablesControl,
  postIXIPayablesPayment,
  postIXIPayablesCredit,
};
