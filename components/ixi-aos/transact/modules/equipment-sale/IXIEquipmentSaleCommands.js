import { createIXIAosObjectFinancialDocument, createIXIAosFinancialObjectReference, mergeIXIAosFinancialReferences } from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { patchIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";

const clean = value => String(value ?? "").trim();
const stored = record => { const { financialBinding: _binding, ...value } = record; return value; };
const invoiceNumber = value => {
  const suffix = clean(value).replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase();
  return suffix ? `INV-${suffix}` : "";
};

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

function canonicalInvoice(invoice, result) {
  const envelope = result?.record || result?.data?.record || result?.persistence?.data?.record || {};
  const document = envelope.financialDocument || result?.financialDocument || invoice || {};
  return {
    ...document,
    financialBinding: {
      financialDocumentId: clean(document.financialDocumentId),
      revision: Number(envelope?.server?.revision || invoice?.financialBinding?.revision || 1),
      line: document?.lines?.[0] || null
    }
  };
}

function invoiceDescription(record = {}) {
  const kind = record?.dealType === "rental-purchase-option" ? "RPO Invoice" : "Equipment Invoice";
  return `${kind} · ${clean(record?.asset?.label) || "Machine"} · ${clean(record?.customer?.name) || "Customer"}`;
}

function invoiceMetadata(record = {}, input = {}, invoice = {}) {
  const salesOrderId = clean(invoice?.sourceFinancialDocumentId || invoice?.metadata?.salesOrderId || record?.financialBinding?.financialDocumentId || record?.identity?.salesOrderId);
  return {
    ...(invoice?.metadata || {}),
    transactModule: "equipment-sale",
    dealId: clean(record?.identity?.dealId),
    invoiceType: record?.dealType === "rental-purchase-option" ? "rental-purchase-option" : "asset-sale",
    invoiceStatus: "draft",
    salesOrderId,
    directEntry: !salesOrderId,
    directEntryReason: clean(input.directEntryReason),
    customerPoNumber: clean(input.customerPoNumber),
    administrativeNote: clean(input.memo),
    commercialBreakdown: record?.totals || {},
    dealType: record?.dealType || "standard-sale",
    rpo: record?.rpo || {},
    additionalTerms: record?.additionalTerms || [],
    customer: record?.customer || {},
    asset: record?.asset || {},
    brand: record?.brand || {}
  };
}

export async function saveIXIEquipmentSale({ object = {}, context = {}, record = {}, action = "save", signal } = {}) {
  const id = clean(record?.financialBinding?.financialDocumentId);
  if (id) {
    const response = await patchIXIAosFinancialDocument({ financialDocumentId: id, expectedRevision: Number(record?.financialBinding?.revision), commandId: crypto.randomUUID(), idempotencyKey: `ixi-sales-order:${action}:${crypto.randomUUID()}`, patch: { salesOrder: stored(record), financialState: "committed", attachments: record?.termsDocument?.url ? [{ attachmentId: record.termsDocument.documentId, type: "terms-and-conditions", url: record.termsDocument.url, sha256: record.termsDocument.sha256, pageCount: 2 }] : [] }, metadata: { transactModule: "equipment-sale", dealId: clean(record?.identity?.dealId), dealType: record?.dealType || "standard-sale", action }, signal });
    return { response, record: canonical(record, response) };
  }
  const references = refs(context, record);
  const commandId = clean(record?.identity?.clientRequestId) || crypto.randomUUID();
  const response = await createIXIAosObjectFinancialDocument({ object, documentType: "sales-order", commandId, idempotencyKey: `ixi-sales-order:${commandId}`, signal, input: { financialState: "committed", currency: clean(record?.commercial?.currency || "USD"), occurredAt: clean(record?.commercial?.orderDate), dueDate: clean(record?.commercial?.dueDate), description: `${record?.dealType === "rental-purchase-option" ? "RPO" : "Equipment"} Sales Order · ${clean(record?.customer?.name)} · ${clean(record?.asset?.label)}`, salesOrder: stored(record), references, attachments: record?.termsDocument?.url ? [{ attachmentId: record.termsDocument.documentId, type: "terms-and-conditions", url: record.termsDocument.url, sha256: record.termsDocument.sha256, pageCount: 2 }] : [], sourceFinancialDocumentId: clean(record?.related?.quoteId) }, additionalReferences: references, metadata: { transactModule: "equipment-sale", dealId: clean(record?.identity?.dealId), dealType: record?.dealType || "standard-sale", salesOrderStatus: record.status } });
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

export async function saveIXIEquipmentInvoice({ object = {}, context = {}, record = {}, invoice = null, input = {}, signal } = {}) {
  const id = clean(invoice?.financialBinding?.financialDocumentId || invoice?.financialDocumentId);
  const linkedSalesOrderId = clean(invoice?.sourceFinancialDocumentId || invoice?.metadata?.salesOrderId);
  const amount = Number(record?.totals?.total || 0);
  const description = invoiceDescription(record);
  const metadata = invoiceMetadata(record, input, invoice || {});
  const sourceSalesOrderId = clean(linkedSalesOrderId || record?.financialBinding?.financialDocumentId || record?.identity?.salesOrderId);

  if (id) {
    if (clean(invoice?.financialState).toLowerCase() !== "draft") throw new Error("An issued Invoice is immutable. Use a credit or replacement control.");
    const commandId = crypto.randomUUID();
    const commercialPatch = linkedSalesOrderId ? {} : {
      occurredAt: clean(record?.commercial?.orderDate),
      description,
      sourceFinancialDocumentId: sourceSalesOrderId,
      paymentTerms: clean(record?.commercial?.paymentTerms),
      references: refs(context, record),
      lines: [{ ...(invoice?.lines?.[0] || {}), description, quantity: 1, rate: amount, amount, currency: clean(record?.commercial?.currency || "USD"), references: refs(context, record) }],
      totals: { subtotal: amount, total: amount }
    };
    const response = await patchIXIAosFinancialDocument({
      financialDocumentId: id,
      expectedRevision: Number(invoice?.financialBinding?.revision || 0),
      commandId,
      idempotencyKey: `ixi-equipment-invoice:${commandId}`,
      patch: { ...commercialPatch, documentNumber: clean(invoice?.documentNumber) || invoiceNumber(id), dueDate: clean(input.dueDate || record?.commercial?.dueDate), memo: clean(input.memo), externalReference: clean(input.customerPoNumber), metadata },
      metadata: { transactModule: "equipment-sale", action: linkedSalesOrderId ? "edit-linked-draft-invoice" : "edit-direct-draft-invoice" },
      signal
    });
    return { response, invoice: canonicalInvoice(invoice, response) };
  }

  const references = refs(context, record);
  const commandId = crypto.randomUUID();
  const documentNumber = invoiceNumber(commandId);
  const response = await createIXIAosObjectFinancialDocument({
    object,
    documentType: "invoice",
    commandId,
    idempotencyKey: `ixi-equipment-invoice:${commandId}`,
    signal,
    input: {
      financialState: "draft",
      documentNumber,
      currency: clean(record?.commercial?.currency || "USD"),
      occurredAt: clean(record?.commercial?.orderDate),
      dueDate: clean(input.dueDate || record?.commercial?.dueDate),
      description,
      sourceFinancialDocumentId: sourceSalesOrderId,
      memo: clean(input.memo),
      externalReference: clean(input.customerPoNumber),
      amount,
      quantity: 1,
      rate: amount,
      category: "equipment-sale",
      customerPassportId: clean(record?.customer?.passportId),
      issuedByPassportId: clean(context?.actor?.passportId),
      paymentTerms: clean(record?.commercial?.paymentTerms),
      references,
      metadata
    },
    additionalReferences: references,
    metadata: { transactModule: "equipment-sale", dealId: clean(record?.identity?.dealId), action: sourceSalesOrderId ? "create-linked-draft-invoice" : "create-direct-draft-invoice" }
  });
  return { response, invoice: canonicalInvoice(null, response) };
}
