import {
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference,
  mergeIXIAosFinancialReferences
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { patchIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";

import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";
import { createIXIBillRecord, createIXIBillInvoiceFingerprint, validateIXIBillInput } from "./IXIBillContract";
import { initializeIXIBillApproval } from "./IXIBillRecordEngine";

const clean = value => String(value ?? "").trim();
const numeric = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function getDocumentId(response = {}) {
  return clean(
    response.financialDocument?.documentId ||
    response.financialDocument?.id ||
    response.record?.documentId ||
    response.record?.id ||
    response.document?.documentId ||
    response.document?.id ||
    response.id
  );
}

function getDocumentNumber(response = {}, fallback = "") {
  return clean(
    response.financialDocument?.documentNumber ||
    response.financialDocument?.number ||
    response.record?.documentNumber ||
    response.record?.number ||
    response.document?.documentNumber ||
    response.document?.number ||
    fallback
  );
}

function responseRecord(response = {}) {
  return response?.data?.record || response?.record || {};
}

function billAccountingTreatment(financialState = "submitted") {
  const recognized = ["billed", "incurred", "partially-paid", "paid"].includes(clean(financialState).toLowerCase());
  return { classification: recognized ? "vendor-obligation" : "vendor-bill-capture", economicEvent: recognized, createsCommitment: false, createsIncurredExpense: recognized, createsPayable: recognized, createsCashEvent: false, paymentSettlesPayable: true };
}

function financialStateFor(record = {}) {
  if (clean(record.status).toLowerCase() === "void" || clean(record?.approval?.status).toLowerCase() === "rejected") return "void";
  if (clean(record?.payment?.status).toLowerCase() === "paid") return "paid";
  if (clean(record?.payment?.status).toLowerCase() === "partial") return "partially-paid";
  if (clean(record?.approval?.status).toLowerCase() === "approved") return "billed";
  return "submitted";
}

function canonicalizeBill(draft, response) {
  const stored = responseRecord(response);
  const document = stored?.financialDocument || response?.financialDocument || {};
  const financialDocumentId = clean(document.financialDocumentId || document.documentId || getDocumentId(response));
  if (!financialDocumentId) {
    const error = new Error("IXI Financial did not return a canonical Bill identity.");
    error.code = "IXI_BILL_IDENTITY_MISSING";
    throw error;
  }
  const canonical = document.billRecord || draft;
  return {
    ...canonical,
    identity: {
      ...(canonical.identity || draft.identity),
      clientRequestId: clean(draft?.identity?.clientRequestId),
      billRecordId: financialDocumentId,
      billDocumentId: financialDocumentId,
      financialDocumentId,
      billNumber: clean(canonical?.identity?.billNumber) || `BILL-${financialDocumentId.slice(-8).toUpperCase()}`,
      invoiceNumber: clean(canonical?.identity?.invoiceNumber || document.invoiceNumber || document.documentNumber)
    },
    financialBinding: {
      financialDocumentId,
      revision: Number(stored?.server?.revision || stored?.revision || 1),
      financialLineId: clean(document?.lines?.[0]?.financialLineId),
      line: document?.lines?.[0] || null
    }
  };
}

function canonicalBillRecord(record = {}) {
  const { financialBinding: _binding, ...canonical } = record;
  return canonical;
}

function originObjectId(context = {}, object = {}) {
  return clean(
    context.primary?.objectId ||
    context.primary?.id ||
    context.primary?.passportId ||
    object.objectId ||
    object.id ||
    object.passportId
  );
}

function externalReference({ externalId = "", passportId = "", role = "", label = "", objectType = "" } = {}) {
  const resolvedRole = clean(role);
  if (!resolvedRole || (!clean(externalId) && !clean(passportId))) return null;
  return {
    ...(clean(externalId) ? { externalId: clean(externalId) } : {}),
    ...(clean(passportId) ? { passportId: clean(passportId) } : {}),
    role: resolvedRole,
    label: clean(label),
    objectType: clean(objectType)
  };
}

function buildReferences({ context = {}, input = {}, record = null } = {}) {
  const refs = [];
  for (const [candidate, role] of [
    [context.primary || {}, ""],
    [context.entity || {}, "entity"],
    [context.location || {}, "location"],
    [context.actor || {}, "employee"]
  ]) {
    const ref = createIXIAosFinancialObjectReference({ object: candidate, role });
    if (ref) refs.push(ref);
  }

  const vendor = externalReference({
    passportId: input.vendorPassportId || record?.bill?.vendorPassportId,
    externalId: input.vendorId || record?.bill?.vendorId,
    role: "vendor",
    label: input.vendorLabel || record?.bill?.vendorLabel,
    objectType: "vendor"
  });
  if (vendor) refs.push(vendor);

  const poNumber = clean(input.purchaseOrderNumber || record?.purchaseMatch?.purchaseOrderNumber);
  if (poNumber) {
    const po = externalReference({
      externalId: clean(input.purchaseOrderId || record?.purchaseMatch?.purchaseOrderId || poNumber),
      role: "purchase-order",
      label: poNumber,
      objectType: "purchase-order"
    });
    if (po) refs.push(po);
  }

  if (record?.identity?.billDocumentId) {
    const bill = externalReference({
      externalId: record.identity.billDocumentId,
      role: "bill",
      label: record.identity.billNumber || record.identity.invoiceNumber,
      objectType: "bill"
    });
    if (bill) refs.push(bill);
  }

  return mergeIXIAosFinancialReferences(refs);
}

export async function createIXIBill({
  object = {}, context = {}, input = {}, policy = undefined, metadata = {}, signal = undefined
} = {}) {
  const validation = validateIXIBillInput(input);
  if (!validation.valid) {
    const error = new Error("Bill / Invoice is incomplete or invalid.");
    error.code = "IXI_BILL_VALIDATION_FAILED";
    error.validation = validation;
    throw error;
  }

  if (!clean(context?.primary?.passportId) || !clean(context?.entity?.passportId) || !clean(context?.actor?.passportId || context?.actor?.employeeId)) {
    const error = new Error("Bill capture requires the AOS object, Entity, and employee identity.");
    error.code = "IXI_BILL_CONTEXT_REQUIRED";
    throw error;
  }

  const clientRequestId = clean(input.clientRequestId);
  const originId = originObjectId(context, object);
  const references = buildReferences({ context, input });
  const fingerprint = createIXIBillInvoiceFingerprint({ entityPassportId: context.entity?.passportId, vendorPassportId: input.vendorPassportId, vendorId: input.vendorId, vendorLabel: input.vendorLabel, invoiceNumber: input.invoiceNumber });
  const initialized = initializeIXIBillApproval(createIXIBillRecord({ context, input }), policy);
  const financialState = financialStateFor(initialized);

  return runIXIActionNoticeLifecycle({
    objectId: originId,
    commandId: clientRequestId,
    source: "ixi-transact-bill-create",
    savingMessage: "SAVING BILL...",
    successMessage: result => `BILL ${result?.record?.identity?.billNumber || result?.record?.identity?.invoiceNumber || "RECORDED"}`,
    errorMessage: error => clean(error?.message) || "BILL SAVE FAILED",
    operation: async () => {
      const response = await createIXIAosObjectFinancialDocument({
        object,
        documentType: "bill",
        commandId: clientRequestId,
        idempotencyKey: `ixi-bill:${fingerprint}`,
        signal,
        input: {
          vendorId: clean(input.vendorId),
          vendorName: clean(input.vendorLabel),
          invoiceNumber: clean(input.invoiceNumber),
          invoiceFingerprint: fingerprint,
          documentNumber: clean(input.invoiceNumber),
          occurredAt: `${clean(input.invoiceDate)}T12:00:00.000Z`,
          dueDate: clean(input.dueDate),
          currency: clean(input.currency || "USD").toUpperCase(),
          amount: numeric(input.amount),
          status: initialized.status,
          financialState,
          description: clean(input.description),
          memo: clean(input.notes),
          notes: clean(input.notes),
          category: clean(input.category),
          attachments: Array.isArray(input.attachments) ? input.attachments : [],
          references,
          sourceFinancialDocumentId: clean(input.purchaseOrderFinancialDocumentId),
          sourceDocumentId: fingerprint,
          billRecord: initialized
        },
        additionalReferences: references,
        metadata: {
          ...metadata,
          transactModule: "bill",
          invoiceNumber: clean(input.invoiceNumber),
          purchaseOrderNumber: clean(input.purchaseOrderNumber),
          originatingObjectId: originId
        }
      });

      return { response, record: canonicalizeBill(initialized, response) };
    }
  });
}

export async function updateIXIBill({ record = {}, action = "update", metadata = {}, signal } = {}) {
  const financialDocumentId = clean(record?.financialBinding?.financialDocumentId || record?.identity?.financialDocumentId || record?.identity?.billDocumentId);
  const expectedRevision = Number(record?.financialBinding?.revision);
  const storedLine = record?.financialBinding?.line;
  if (!financialDocumentId || !Number.isInteger(expectedRevision) || expectedRevision < 1 || !storedLine) {
    const error = new Error("Bill is not bound to a current IXI Financial revision.");
    error.code = "IXI_BILL_BINDING_REQUIRED";
    throw error;
  }
  const canonical = canonicalBillRecord(record);
  const financialState = financialStateFor(canonical);
  const amount = numeric(canonical?.bill?.amount);
  const fingerprint = createIXIBillInvoiceFingerprint({ entityPassportId: canonical?.context?.entityPassportId, vendorPassportId: canonical?.bill?.vendorPassportId, vendorId: canonical?.bill?.vendorId, vendorLabel: canonical?.bill?.vendorLabel, invoiceNumber: canonical?.identity?.invoiceNumber });
  const commandId = globalThis.crypto?.randomUUID?.() || `bill-update-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const response = await patchIXIAosFinancialDocument({
    financialDocumentId,
    expectedRevision,
    commandId,
    idempotencyKey: `ixi-bill:${action}:${commandId}`,
    patch: {
      financialState,
      status: canonical.status,
      occurredAt: `${clean(canonical?.bill?.invoiceDate)}T12:00:00.000Z`,
      dueDate: clean(canonical?.bill?.dueDate),
      description: clean(canonical?.bill?.description),
      memo: clean(canonical?.bill?.notes),
      vendorName: clean(canonical?.bill?.vendorLabel),
      invoiceNumber: clean(canonical?.identity?.invoiceNumber),
      documentNumber: clean(canonical?.identity?.invoiceNumber),
      invoiceFingerprint: fingerprint,
      sourceDocumentId: fingerprint,
      billRecord: canonical,
      attachments: canonical.documents || canonical?.bill?.attachments || [],
      lines: [{ ...storedLine, description: clean(canonical?.bill?.description), category: clean(canonical?.bill?.category), quantity: 1, rate: amount, amount }],
      totals: { subtotal: amount, total: amount },
      accountingTreatment: billAccountingTreatment(financialState)
    },
    metadata: { ...metadata, transactModule: "bill", action, billStatus: canonical.status, approvalStatus: canonical?.approval?.status },
    signal
  });
  return { response, record: canonicalizeBill(canonical, response) };
}

export async function createIXIBillPayment({
  object = {}, context = {}, record = {}, input = {}, metadata = {}, signal = undefined
} = {}) {
  const amount = numeric(input.amount);
  const method = clean(input.method);
  const reference = clean(input.reference);
  const remaining = Math.max(0, numeric(record?.bill?.amount) - numeric(record?.payment?.amountPaid));
  if (!(amount > 0) || amount > remaining + 0.005 || !method || !reference || clean(record?.approval?.status) !== "approved") {
    const error = new Error("Approved Bill, valid remaining amount, payment method, and transaction reference are required.");
    error.code = "IXI_BILL_PAYMENT_VALIDATION_FAILED";
    throw error;
  }

  const originId = originObjectId(context, object);
  const commandId = `${clean(record?.identity?.billRecordId || record?.identity?.billDocumentId)}:${reference}`;
  const references = buildReferences({ context, record });

  return runIXIActionNoticeLifecycle({
    objectId: originId,
    commandId,
    source: "ixi-transact-bill-payment",
    savingMessage: "RECORDING BILL PAYMENT...",
    successMessage: "BILL PAYMENT RECORDED",
    errorMessage: error => clean(error?.message) || "BILL PAYMENT FAILED",
    operation: async () => {
      const response = await createIXIAosObjectFinancialDocument({
        object,
        documentType: "payment",
        commandId,
        idempotencyKey: `ixi-bill-payment:${commandId}`,
        signal,
        input: {
          vendorName: clean(record?.bill?.vendorLabel),
          occurredAt: `${clean(input.paidDate) || new Date().toISOString().slice(0, 10)}T12:00:00.000Z`,
          currency: clean(record?.bill?.currency || "USD"),
          amount,
          paymentDirection: "outflow",
          status: "posted",
          financialState: "paid",
          description: `Payment for ${clean(record?.identity?.billNumber || record?.identity?.invoiceNumber)}`,
          paymentMethod: method,
          transactionReference: reference,
          sourceFinancialDocumentId: clean(record?.identity?.billDocumentId || record?.identity?.financialDocumentId),
          references
        },
        additionalReferences: references,
        metadata: {
          ...metadata,
          transactModule: "bill-payment",
          billDocumentId: clean(record?.identity?.billDocumentId),
          billNumber: clean(record?.identity?.billNumber),
          originatingObjectId: originId
        }
      });
      return { response };
    }
  });
}

export default { createIXIBill, updateIXIBill, createIXIBillPayment };
