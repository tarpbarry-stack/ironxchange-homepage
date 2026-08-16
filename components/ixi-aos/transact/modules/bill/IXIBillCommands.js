import {
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference,
  mergeIXIAosFinancialReferences
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";

import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";
import { createIXIBillRecord, validateIXIBillInput } from "./IXIBillContract";
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

  const clientRequestId = clean(input.clientRequestId);
  const originId = originObjectId(context, object);
  const references = buildReferences({ context, input });

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
        idempotencyKey: clientRequestId ? `ixi-bill:${clientRequestId}` : "",
        signal,
        input: {
          vendorId: clean(input.vendorId),
          vendorName: clean(input.vendorLabel),
          documentNumber: clean(input.invoiceNumber),
          documentDate: clean(input.invoiceDate),
          dueDate: clean(input.dueDate),
          currency: clean(input.currency || "USD").toUpperCase(),
          subtotal: numeric(input.amount),
          total: numeric(input.amount),
          status: "open",
          financialState: "billed",
          description: clean(input.description),
          notes: clean(input.notes),
          category: clean(input.category),
          attachments: Array.isArray(input.attachments) ? input.attachments : [],
          references
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

      const billDocumentId = getDocumentId(response);
      if (!billDocumentId) {
        const error = new Error("Bill persistence did not return a document identity.");
        error.code = "IXI_BILL_DOCUMENT_ID_MISSING";
        throw error;
      }

      const billNumber = getDocumentNumber(response, `BILL-${Date.now().toString().slice(-5)}`);
      const base = createIXIBillRecord({
        context,
        input: { ...input, billDocumentId, billNumber },
        financialDocument: { documentId: billDocumentId, documentNumber: billNumber }
      });
      const record = initializeIXIBillApproval(base, policy);
      return { response, record };
    }
  });
}

export async function createIXIBillPayment({
  object = {}, context = {}, record = {}, input = {}, metadata = {}, signal = undefined
} = {}) {
  const amount = numeric(input.amount);
  const method = clean(input.method);
  if (!(amount > 0) || !method) {
    const error = new Error("Payment amount and payment method are required.");
    error.code = "IXI_BILL_PAYMENT_VALIDATION_FAILED";
    throw error;
  }

  const originId = originObjectId(context, object);
  const commandId = `${clean(record?.identity?.billRecordId || record?.identity?.billDocumentId)}:${clean(input.reference) || amount}`;
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
          documentDate: clean(input.paidDate) || new Date().toISOString().slice(0, 10),
          currency: clean(record?.bill?.currency || "USD"),
          subtotal: amount,
          total: amount,
          status: "posted",
          financialState: "paid",
          description: `Payment for ${clean(record?.identity?.billNumber || record?.identity?.invoiceNumber)}`,
          paymentMethod: method,
          paymentReference: clean(input.reference),
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

export default { createIXIBill, createIXIBillPayment };
