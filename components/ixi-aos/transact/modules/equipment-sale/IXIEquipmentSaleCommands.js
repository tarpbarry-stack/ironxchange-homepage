import { createIXIAosObjectFinancialDocument, createIXIAosFinancialObjectReference, mergeIXIAosFinancialReferences } from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { patchIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";

const clean = value => String(value ?? "").trim();
const stored = record => { const { financialBinding: _binding, ...value } = record; return value; };

function refs(context = {}, record = {}) {
  return mergeIXIAosFinancialReferences([
    createIXIAosFinancialObjectReference({ object: context.primary || {}, role: "asset" }),
    createIXIAosFinancialObjectReference({ object: context.entity || {}, role: "entity" }),
    createIXIAosFinancialObjectReference({ object: context.actor || {}, role: "employee" }),
    clean(record?.customer?.passportId) ? { passportId: clean(record.customer.passportId), role: "customer", label: clean(record.customer.name), objectType: "entity" } : null
  ].filter(Boolean));
}

function canonical(record, result) {
  const envelope = result?.record || result?.data?.record || result?.persistence?.data?.record || {};
  const document = envelope.financialDocument || result?.financialDocument || {};
  const value = document.salesOrder || record;
  return { ...value, identity: { ...value.identity, salesOrderId: document.financialDocumentId, financialDocumentId: document.financialDocumentId, number: document.documentNumber || value?.identity?.number }, financialBinding: { financialDocumentId: document.financialDocumentId, revision: Number(envelope?.server?.revision || 1), line: document?.lines?.[0] || null } };
}

export async function saveIXIEquipmentSale({ object = {}, context = {}, record = {}, action = "save", signal } = {}) {
  const id = clean(record?.financialBinding?.financialDocumentId);
  if (id) {
    const response = await patchIXIAosFinancialDocument({ financialDocumentId: id, expectedRevision: Number(record?.financialBinding?.revision), commandId: crypto.randomUUID(), idempotencyKey: `ixi-sales-order:${action}:${crypto.randomUUID()}`, patch: { salesOrder: stored(record), financialState: "committed", attachments: record?.termsDocument?.url ? [{ attachmentId: record.termsDocument.documentId, type: "terms-and-conditions", url: record.termsDocument.url, sha256: record.termsDocument.sha256, pageCount: 2 }] : [] }, metadata: { transactModule: "equipment-sale", action }, signal });
    return { response, record: canonical(record, response) };
  }
  const references = refs(context, record);
  const commandId = clean(record?.identity?.clientRequestId) || crypto.randomUUID();
  const response = await createIXIAosObjectFinancialDocument({ object, documentType: "sales-order", commandId, idempotencyKey: `ixi-sales-order:${commandId}`, signal, input: { financialState: "committed", currency: clean(record?.commercial?.currency || "USD"), occurredAt: clean(record?.commercial?.orderDate), dueDate: clean(record?.commercial?.dueDate), description: `Equipment Sales Order · ${clean(record?.customer?.name)} · ${clean(record?.asset?.label)}`, salesOrder: stored(record), references, attachments: record?.termsDocument?.url ? [{ attachmentId: record.termsDocument.documentId, type: "terms-and-conditions", url: record.termsDocument.url, sha256: record.termsDocument.sha256, pageCount: 2 }] : [], sourceFinancialDocumentId: clean(record?.related?.quoteId) }, additionalReferences: references, metadata: { transactModule: "equipment-sale", salesOrderStatus: record.status } });
  return { response, record: canonical(record, response) };
}

export async function createIXIEquipmentSaleSigningInvitation(record, { expiresInHours = 168 } = {}) {
  const id = clean(record?.financialBinding?.financialDocumentId);
  if (!id) throw new Error("Save the Sales Order before sending it for signature.");
  const response = await fetch(`/api/ixi/financial/sales-orders/${encodeURIComponent(id)}/signing-invitations`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ expiresInHours, commandId: crypto.randomUUID(), idempotencyKey: `ixi-sales-order-invite:${id}:${record?.financialBinding?.revision}` }) });
  const payload = await response.json();
  if (!response.ok || payload?.ok !== true) throw new Error(payload?.errors?.[0]?.message || "Signing invitation could not be created.");
  return payload.data;
}

export async function saveIXIEquipmentInvoiceDraft(invoice = {}, input = {}) {
  const id = clean(invoice?.financialBinding?.financialDocumentId || invoice?.financialDocumentId);
  const revision = Number(invoice?.financialBinding?.revision || 0);
  if (!id || revision < 1) throw new Error("The generated Invoice is not bound to IX Core.");
  if (clean(invoice.financialState).toLowerCase() !== "draft") throw new Error("An issued Invoice is immutable. Use a credit or replacement control.");
  const commandId = crypto.randomUUID();
  return patchIXIAosFinancialDocument({ financialDocumentId: id, expectedRevision: revision, commandId, idempotencyKey: `ixi-equipment-invoice-draft:${commandId}`, patch: { dueDate: clean(input.dueDate), memo: clean(input.memo), externalReference: clean(input.customerPoNumber), metadata: { ...(invoice.metadata || {}), invoiceStatus: "draft", customerPoNumber: clean(input.customerPoNumber), administrativeNote: clean(input.memo) } }, metadata: { transactModule: "equipment-sale", action: "edit-draft-invoice" } });
}
