import {
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference,
  mergeIXIAosFinancialReferences
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";

import {
  runIXIActionNoticeLifecycle
} from "../../../../ixi-object-system/IXIActionNoticeEngine";

import {
  attachIXIPurchaseOrderFinancialIdentity
} from "./IXIPurchaseOrderRecordEngine";

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

function getPoNumber(response = {}, fallback = "") {
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

function buildReferences({ context = {}, record = {} } = {}) {
  const references = [];

  for (const [candidate, role] of [
    [context.entity || {}, "entity"],
    [context.location || {}, "location"],
    [context.actor || {}, "employee"]
  ]) {
    const reference = createIXIAosFinancialObjectReference({ object: candidate, role });
    if (reference) references.push(reference);
  }

  if (clean(record?.order?.vendorPassportId)) {
    references.push({
      passportId: clean(record.order.vendorPassportId),
      role: "vendor",
      label: clean(record.order.vendorLabel),
      objectType: "vendor"
    });
  }

  if (clean(record?.context?.workOrderId || record?.context?.workOrderNumber)) {
    references.push({
      externalId: clean(record.context.workOrderId || record.context.workOrderNumber),
      role: "work-order",
      label: clean(record.context.workOrderNumber),
      objectType: "work-order"
    });
  }

  if (clean(record?.identity?.sourceRequestId || record?.identity?.sourceRequestNumber)) {
    references.push({
      externalId: clean(record.identity.sourceRequestId || record.identity.sourceRequestNumber),
      role: "purchase-request",
      label: clean(record.identity.sourceRequestNumber || record.identity.sourceRequestId),
      objectType: "purchase-requisition"
    });
  }

  return mergeIXIAosFinancialReferences(references);
}

export async function issueIXIPurchaseOrder({
  object = {},
  context = {},
  record = {},
  metadata = {},
  signal = undefined
} = {}) {
  const commandId = clean(record?.identity?.purchaseOrderRecordId);
  const references = buildReferences({ context, record });
  const lines = Array.isArray(record?.order?.lines) ? record.order.lines : [];
  const total = numeric(record?.costs?.estimated);
  const originId = originObjectId(context, object);

  return runIXIActionNoticeLifecycle({
    objectId: originId,
    commandId,
    source: "ixi-transact-purchase-order-issue",
    savingMessage: "ISSUING PURCHASE ORDER...",
    successMessage: result => `PURCHASE ORDER ${result?.record?.identity?.poNumber || "ISSUED"}`,
    errorMessage: error => clean(error?.message) || "PURCHASE ORDER ISSUE FAILED",
    operation: async () => {
      const response = await createIXIAosObjectFinancialDocument({
        object,
        documentType: "purchase-order",
        commandId,
        idempotencyKey: commandId ? `ixi-po-issue:${commandId}` : "",
        signal,
        input: {
          vendorId: clean(record?.order?.vendorId),
          vendorName: clean(record?.order?.vendorLabel),
          documentDate: new Date().toISOString().slice(0, 10),
          dueDate: clean(record?.order?.neededByDate),
          currency: clean(record?.order?.currency || "USD"),
          subtotal: total,
          total,
          status: "open",
          financialState: "committed",
          description: clean(record?.order?.description) || lines.map(line => line.description).filter(Boolean).join(", "),
          notes: clean(record?.order?.businessReason),
          lines: lines.map(line => ({
            lineType: "item",
            lineId: line.lineId,
            description: line.description,
            quantity: line.orderedQuantity,
            unit: line.unit,
            unitPrice: line.unitPrice,
            amount: line.extendedAmount
          })),
          references
        },
        additionalReferences: references,
        metadata: {
          ...metadata,
          transactModule: "purchase-order",
          purchaseOrderRecordId: commandId,
          sourceRequestId: clean(record?.identity?.sourceRequestId),
          sourceRequestNumber: clean(record?.identity?.sourceRequestNumber),
          originatingObjectId: originId
        }
      });

      const documentId = getDocumentId(response);
      if (!documentId) {
        const error = new Error("Purchase Order persistence did not return a document identity.");
        error.code = "IXI_PO_DOCUMENT_ID_MISSING";
        throw error;
      }

      const fallbackNumber = clean(record?.identity?.sourceRequestNumber)
        ? clean(record.identity.sourceRequestNumber).replace(/^PR-/i, "PO-")
        : `PO-${Date.now().toString().slice(-6)}`;
      const poNumber = getPoNumber(response, fallbackNumber);
      const nextRecord = attachIXIPurchaseOrderFinancialIdentity(record, { documentId, poNumber });

      return { response, record: nextRecord };
    }
  });
}

export async function matchIXIPurchaseOrderBill({
  object = {},
  context = {},
  record = {},
  input = {},
  metadata = {},
  signal = undefined
} = {}) {
  const invoiceNumber = clean(input.invoiceNumber);
  const invoiceDate = clean(input.invoiceDate);
  const billAmount = numeric(input.amount);

  if (!invoiceNumber || !/^\d{4}-\d{2}-\d{2}$/.test(invoiceDate) || !(billAmount > 0)) {
    const error = new Error("Invoice number, invoice date, and a positive Bill amount are required.");
    error.code = "IXI_PO_BILL_VALIDATION_FAILED";
    throw error;
  }

  const commandId = `${clean(record?.identity?.purchaseOrderRecordId)}:${invoiceNumber}`;
  const references = buildReferences({ context, record });
  if (clean(record?.identity?.poDocumentId)) {
    references.push({
      externalId: clean(record.identity.poDocumentId),
      role: "purchase-order",
      label: clean(record.identity.poNumber),
      objectType: "purchase-order"
    });
  }
  const originId = originObjectId(context, object);

  return runIXIActionNoticeLifecycle({
    objectId: originId,
    commandId,
    source: "ixi-transact-purchase-order-bill",
    savingMessage: "MATCHING VENDOR BILL...",
    successMessage: `BILL ${invoiceNumber} MATCHED`,
    errorMessage: error => clean(error?.message) || "BILL MATCH FAILED",
    operation: async () => {
      const response = await createIXIAosObjectFinancialDocument({
        object,
        documentType: "bill",
        commandId,
        idempotencyKey: `ixi-po-bill:${commandId}`,
        signal,
        input: {
          vendorName: clean(record?.order?.vendorLabel),
          documentNumber: invoiceNumber,
          documentDate: invoiceDate,
          currency: clean(record?.order?.currency || "USD"),
          subtotal: billAmount,
          total: billAmount,
          status: "open",
          financialState: "billed",
          description: `Vendor bill for ${clean(record?.identity?.poNumber) || "Purchase Order"}`,
          references
        },
        additionalReferences: references,
        metadata: {
          ...metadata,
          transactModule: "purchase-order-bill-match",
          purchaseOrderRecordId: clean(record?.identity?.purchaseOrderRecordId),
          poDocumentId: clean(record?.identity?.poDocumentId),
          poNumber: clean(record?.identity?.poNumber),
          invoiceNumber,
          originatingObjectId: originId
        }
      });

      const billId = getDocumentId(response);
      if (!billId) {
        const error = new Error("Bill persistence did not return a document identity.");
        error.code = "IXI_PO_BILL_ID_MISSING";
        throw error;
      }

      return {
        response,
        bill: {
          billId,
          invoiceNumber,
          invoiceDate,
          amount: billAmount
        }
      };
    }
  });
}

export default {
  issueIXIPurchaseOrder,
  matchIXIPurchaseOrderBill
};