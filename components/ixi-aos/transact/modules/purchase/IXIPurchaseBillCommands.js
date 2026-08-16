import {
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference,
  mergeIXIAosFinancialReferences
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";

import {
  runIXIActionNoticeLifecycle
} from "../../../../ixi-object-system/IXIActionNoticeEngine";

const clean = value => String(value ?? "").trim();
const money = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
};

function getFinancialDocumentId(response = {}) {
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

function createExternalReference({
  role = "",
  externalId = "",
  label = "",
  objectType = ""
} = {}) {
  if (!clean(role) || !clean(externalId)) return null;
  return {
    role: clean(role),
    externalId: clean(externalId),
    label: clean(label),
    objectType: clean(objectType)
  };
}

function buildReferences(context = {}, record = {}) {
  const references = [];

  for (const [candidate, role] of [
    [context.entity || {}, "entity"],
    [context.location || {}, "location"],
    [context.actor || {}, "employee"]
  ]) {
    const reference = createIXIAosFinancialObjectReference({ object: candidate, role });
    if (reference) references.push(reference);
  }

  const workOrderId = clean(record?.context?.workOrderId);
  const workOrderNumber = clean(record?.context?.workOrderNumber);
  const workOrderReference = createExternalReference({
    role: "work-order",
    externalId: workOrderId || workOrderNumber,
    label: workOrderNumber,
    objectType: "work-order"
  });
  if (workOrderReference) references.push(workOrderReference);

  const purchaseReference = createExternalReference({
    role: "purchase-order",
    externalId:
      clean(record?.financialLinks?.poDocumentId) ||
      clean(record?.identity?.poNumber) ||
      clean(record?.identity?.purchaseId),
    label:
      clean(record?.identity?.poNumber) ||
      clean(record?.identity?.requestNumber),
    objectType: "purchase-order"
  });
  if (purchaseReference) references.push(purchaseReference);

  return mergeIXIAosFinancialReferences(references);
}

export async function matchIXIPurchaseBill({
  object = {},
  context = {},
  record = {},
  invoiceNumber = "",
  invoiceDate = "",
  amount = 0,
  existingBillDocumentId = "",
  metadata = {},
  signal = undefined
} = {}) {
  const resolvedAmount = money(amount);
  const resolvedInvoiceNumber = clean(invoiceNumber);
  const resolvedExistingBillId = clean(existingBillDocumentId);

  if (!(resolvedAmount > 0)) {
    const error = new Error("Bill amount must be greater than zero.");
    error.code = "IXI_PURCHASE_BILL_AMOUNT_REQUIRED";
    throw error;
  }

  if (resolvedExistingBillId) {
    return {
      billDocumentId: resolvedExistingBillId,
      response: null,
      created: false
    };
  }

  if (!resolvedInvoiceNumber) {
    const error = new Error("Invoice number is required to create a new Bill match.");
    error.code = "IXI_PURCHASE_BILL_INVOICE_REQUIRED";
    throw error;
  }

  const purchaseId = clean(
    record?.identity?.purchaseId ||
    record?.identity?.poNumber ||
    record?.identity?.requestNumber
  );
  const commandId = `${purchaseId}:bill:${resolvedInvoiceNumber}`;
  const originatingObjectId = clean(
    context.primary?.objectId ||
    context.primary?.id ||
    context.primary?.passportId ||
    object?.objectId ||
    object?.id ||
    object?.passportId
  );
  const references = buildReferences(context, record);
  const purchase = record?.purchase || {};

  return runIXIActionNoticeLifecycle({
    objectId: originatingObjectId,
    commandId,
    source: "ixi-transact-purchase-bill-match",
    savingMessage: "MATCHING VENDOR BILL...",
    successMessage: result => `BILL ${resolvedInvoiceNumber || result?.billDocumentId || "MATCHED"} MATCHED`,
    errorMessage: error => clean(error?.message) || "BILL MATCH FAILED",
    operation: async () => {
      const response = await createIXIAosObjectFinancialDocument({
        object,
        documentType: "bill",
        commandId,
        idempotencyKey: `ixi-transact-purchase:${commandId}`,
        signal,
        input: {
          vendorName: clean(purchase.vendorLabel),
          documentNumber: resolvedInvoiceNumber,
          documentDate:
            clean(invoiceDate) ||
            new Date().toISOString().slice(0, 10),
          currency: clean(purchase.currency) || "USD",
          subtotal: resolvedAmount,
          total: resolvedAmount,
          status: "open",
          financialState: "billed",
          description: `Vendor bill matched to ${clean(record?.identity?.poNumber || record?.identity?.requestNumber)}`,
          workOrderId: clean(record?.context?.workOrderId),
          workOrderNumber: clean(record?.context?.workOrderNumber),
          references
        },
        additionalReferences: references,
        metadata: {
          ...metadata,
          transactModule: "purchase",
          purchaseRecordId: purchaseId,
          purchaseOrderNumber: clean(record?.identity?.poNumber),
          purchaseOrderDocumentId: clean(record?.financialLinks?.poDocumentId),
          invoiceNumber: resolvedInvoiceNumber,
          originatingObjectId
        }
      });

      const billDocumentId = getFinancialDocumentId(response);
      if (!billDocumentId) {
        const error = new Error("Bill persistence did not return a canonical document ID.");
        error.code = "IXI_PURCHASE_BILL_ID_MISSING";
        throw error;
      }

      return {
        billDocumentId,
        response,
        created: true
      };
    }
  });
}

export default {
  matchIXIPurchaseBill
};
