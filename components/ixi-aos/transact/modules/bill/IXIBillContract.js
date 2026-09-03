const clean = value => String(value ?? "").trim();
const number = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const money = value => Math.round(number(value) * 100) / 100;

export const IXI_BILL_SCHEMA = "ixi-bill-record-v2";
export const IXI_BILL_STATUSES = Object.freeze(["draft", "submitted", "approved", "void"]);
export const IXI_BILL_MATCH_STATUSES = Object.freeze(["n/a", "unmatched", "matched", "exception"]);
export const IXI_BILL_PAYMENT_STATUSES = Object.freeze(["unpaid", "scheduled", "partial", "paid", "overdue"]);

export function normalizeIXIBillFingerprintPart(value) {
  return clean(value).normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 96);
}

export function createIXIBillInvoiceFingerprint({ entityPassportId = "", vendorPassportId = "", vendorId = "", vendorLabel = "", invoiceNumber = "" } = {}) {
  return [entityPassportId, vendorPassportId || vendorId || vendorLabel, invoiceNumber]
    .map(normalizeIXIBillFingerprintPart)
    .join("|");
}

export function createIXIBillRecord({ context = {}, input = {}, financialDocument = null } = {}) {
  const now = clean(input.createdAt) || new Date().toISOString();
  const amount = money(input.amount);
  const poNumber = clean(input.purchaseOrderNumber);
  const poCommitted = money(input.poCommittedAmount);
  const receivedAmount = money(input.receivedAmount);
  const variance = poNumber ? money(amount - poCommitted) : 0;
  const hasPo = Boolean(poNumber);
  const receivedComplete = input.receivedComplete === true;
  const matchStatus = hasPo
    ? (receivedComplete && Math.abs(variance) < 0.005 ? "matched" : "exception")
    : "n/a";

  const primary = context.primary || {};
  const location = context.location || {};
  const actor = context.actor || {};

  return {
    schema: IXI_BILL_SCHEMA,
    identity: {
      billRecordId: clean(input.billRecordId || input.clientRequestId),
      billDocumentId: clean(financialDocument?.documentId || financialDocument?.id || input.billDocumentId),
      financialDocumentId: clean(financialDocument?.documentId || financialDocument?.id || input.billDocumentId),
      billNumber: clean(financialDocument?.documentNumber || financialDocument?.number || input.billNumber),
      invoiceNumber: clean(input.invoiceNumber),
      clientRequestId: clean(input.clientRequestId)
    },
    context: {
      primaryPassportId: clean(primary.passportId),
      primaryObjectId: clean(primary.objectId || primary.id),
      primaryObjectType: clean(primary.objectType),
      primaryObjectLabel: clean(primary.label),
      entityPassportId: clean(context.entity?.passportId),
      entityLabel: clean(context.entity?.label),
      locationPassportId: clean(location.passportId),
      locationObjectId: clean(location.objectId || location.id),
      locationLabel: clean(location.label),
      employeePassportId: clean(actor.passportId),
      employeeId: clean(actor.employeeId || actor.userId || actor.objectId),
      employeeLabel: clean(actor.displayName || actor.name || actor.label)
    },
    bill: {
      vendorId: clean(input.vendorId),
      vendorPassportId: clean(input.vendorPassportId),
      vendorLabel: clean(input.vendorLabel),
      description: clean(input.description),
      category: clean(input.category),
      amount,
      currency: clean(input.currency || "USD").toUpperCase(),
      invoiceDate: clean(input.invoiceDate),
      dueDate: clean(input.dueDate),
      notes: clean(input.notes),
      attachments: Array.isArray(input.attachments) ? input.attachments : []
    },
    purchaseMatch: {
      purchaseOrderId: clean(input.purchaseOrderId),
      purchaseOrderNumber: poNumber,
      poCommittedAmount: poCommitted,
      receivedAmount,
      receivedComplete,
      billedAmount: amount,
      variance,
      status: matchStatus,
      varianceApproval: null
    },
    approval: {
      status: "pending",
      requiredAuthority: money(input.requiredAuthority),
      requiredRole: clean(input.requiredRole),
      currentApproverId: clean(input.currentApproverId),
      currentApproverLabel: clean(input.currentApproverLabel),
      approvedById: "",
      approvedByLabel: "",
      approvedAt: "",
      returnedById: "",
      returnedAt: "",
      rejectedById: "",
      rejectedAt: ""
    },
    payment: {
      status: "unpaid",
      scheduledDate: "",
      paidDate: "",
      amountPaid: 0,
      method: "",
      reference: "",
      paidById: "",
      paidByLabel: ""
    },
    status: "submitted",
    documents: Array.isArray(input.attachments) ? input.attachments : [],
    related: [
      clean(primary.objectId || primary.passportId) ? { id: clean(primary.objectId || primary.passportId), label: clean(primary.label), type: clean(primary.objectType || "object") } : null,
      clean(location.objectId || location.passportId) ? { id: clean(location.objectId || location.passportId), label: clean(location.label), type: "location" } : null,
      clean(actor.employeeId || actor.userId || actor.passportId) ? { id: clean(actor.employeeId || actor.userId || actor.passportId), label: clean(actor.displayName || actor.name || actor.label), type: "employee" } : null,
      poNumber ? { id: clean(input.purchaseOrderId || poNumber), label: poNumber, type: "purchase-order" } : null
    ].filter(Boolean),
    timeline: [{
      activityId: `ACT-${clean(input.clientRequestId) || Date.now()}`,
      type: "bill-created",
      label: `Bill ${clean(input.invoiceNumber) || "created"}`,
      actorLabel: clean(actor.displayName || actor.name || actor.label),
      occurredAt: now
    }],
    audit: {
      createdAt: now,
      createdById: clean(actor.employeeId || actor.userId || actor.objectId),
      createdByLabel: clean(actor.displayName || actor.name || actor.label),
      updatedAt: now,
      version: 1
    }
  };
}

export function validateIXIBillInput(input = {}) {
  const errors = {};
  const amount = number(input.amount);
  if (!clean(input.vendorLabel)) errors.vendorLabel = "required";
  if (!clean(input.invoiceNumber)) errors.invoiceNumber = "required";
  if (!clean(input.description)) errors.description = "required";
  if (!(amount > 0)) errors.amount = "invalid";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean(input.invoiceDate))) errors.invoiceDate = "invalid";
  if (clean(input.dueDate) && !/^\d{4}-\d{2}-\d{2}$/.test(clean(input.dueDate))) errors.dueDate = "invalid";
  if (clean(input.dueDate) && clean(input.invoiceDate) && clean(input.dueDate) < clean(input.invoiceDate)) errors.dueDate = "before-invoice-date";
  if (!/^[A-Z]{3}$/.test(clean(input.currency || "USD").toUpperCase())) errors.currency = "invalid";
  if ((Array.isArray(input.attachments) ? input.attachments : []).some(item => !clean(item?.storageKey || item?.key) || !["uploaded", "available", "verified"].includes(clean(item?.status).toLowerCase()))) errors.attachments = "upload-incomplete";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function hydrateIXIBillRecord(financialRecord = {}) {
  const stored = financialRecord?.record || financialRecord;
  const document = stored?.financialDocument || financialRecord?.financialDocument || financialRecord;
  if (!document || !["bill", "supplier-invoice"].includes(clean(document.documentType).toLowerCase()) || !document.billRecord) return null;
  const record = document.billRecord;
  return {
    ...record,
    identity: {
      ...(record.identity || {}),
      billDocumentId: clean(document.financialDocumentId),
      financialDocumentId: clean(document.financialDocumentId),
      billNumber: clean(record?.identity?.billNumber) || `BILL-${clean(document.financialDocumentId).slice(-8).toUpperCase()}`,
      invoiceNumber: clean(record?.identity?.invoiceNumber || document.invoiceNumber || document.documentNumber)
    },
    financialBinding: {
      financialDocumentId: clean(document.financialDocumentId),
      revision: Number(stored?.server?.revision || financialRecord?.server?.revision || 1),
      financialLineId: clean(document?.lines?.[0]?.financialLineId),
      line: document?.lines?.[0] || null
    }
  };
}

export default { createIXIBillRecord, validateIXIBillInput, hydrateIXIBillRecord, createIXIBillInvoiceFingerprint };
