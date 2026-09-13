import { patchIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";
import { hydrateIXIServiceInvoice } from "./IXIServiceInvoiceProjection.js";
export { hydrateIXIServiceInvoice } from "./IXIServiceInvoiceProjection.js";
import { issueIXIServiceInvoice, voidIXIServiceInvoice } from "./IXIServiceInvoiceRecordEngine";
import { createIXIAosObjectFinancialDocument, createIXIAosFinancialObjectReference } from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";
import { createIXIServiceInvoiceDraft, validateIXIServiceInvoice } from "./IXIServiceInvoiceContract";

const clean = value => String(value ?? "").trim();

function pushUnique(references, reference) {
  if (!reference) return;
  const key = [reference.passportId, reference.externalId, reference.role, reference.label].map(clean).join("|");
  if (!references.some(item => [item.passportId, item.externalId, item.role, item.label].map(clean).join("|") === key)) references.push(reference);
}

export async function createIXIServiceInvoice({ object = {}, context = {}, workOrder = {}, input = {}, commandId = "", idempotencyKey = "", metadata = {}, apiBaseUrl = "", headers = {}, signal } = {}) {
  const draft = createIXIServiceInvoiceDraft({ context, workOrder, input });
  const check = validateIXIServiceInvoice(draft);
  if (!check.valid) {
    const error = new Error("Service Invoice is incomplete or exceeds authorization.");
    error.validation = check;
    throw error;
  }
  const cmd = clean(commandId || draft.identity.clientRequestId || `SINV-${Date.now()}`);
  const resolvedObject = {
    ...object,
    passportId: clean(object.passportId || draft.context.primaryPassportId),
    objectId: clean(object.objectId || draft.context.primaryObjectId),
    objectType: clean(object.objectType || draft.context.primaryObjectType),
    label: clean(object.label || draft.context.primaryLabel)
  };
  const noticeObjectId = clean(context.primary?.objectId || context.primary?.passportId || resolvedObject.objectId || resolvedObject.passportId);

  return runIXIActionNoticeLifecycle({
    objectId: noticeObjectId,
    commandId: cmd,
    source: "ixi-transact-service-invoice",
    savingMessage: "CREATING SERVICE INVOICE...",
    successMessage: result => `SERVICE INVOICE ${clean(result?.record?.identity?.number) || "CREATED"}`,
    errorMessage: "SERVICE INVOICE SAVE FAILED",
    operation: async () => {
      const references = [];
      pushUnique(references, createIXIAosFinancialObjectReference({ object: context.primary || resolvedObject, role: "asset" }));
      pushUnique(references, createIXIAosFinancialObjectReference({ object: context.entity || {}, role: "entity" }));
      pushUnique(references, createIXIAosFinancialObjectReference({ object: context.location || {}, role: "location" }));
      pushUnique(references, createIXIAosFinancialObjectReference({ object: context.actor || {}, role: "employee" }));
      pushUnique(references, { role: "customer", label: draft.customer.name, objectType: "entity", passportId: draft.customer.passportId, externalId: draft.customer.customerId });
      pushUnique(references, { role: "work-order", label: draft.source.customerServiceWorkOrderId, objectType: "work-order", externalId: draft.source.customerServiceWorkOrderId });
      if (draft.source.serviceQuoteId || draft.source.serviceQuoteNumber) pushUnique(references, { role: "service-quote", label: draft.source.serviceQuoteNumber, objectType: "quote", externalId: draft.source.serviceQuoteId || draft.source.serviceQuoteNumber });

      const response = await createIXIAosObjectFinancialDocument({
        object: resolvedObject,
        documentType: "invoice",
        input: {
          currency: "USD",
          amount: draft.charges.amountDue,
          description: `Service Invoice · ${draft.customer.name} · ${draft.asset.label}`,
          status: "draft",
          financialState: "draft",
          documentNumber: `SINV-${cmd.replace(/[^a-zA-Z0-9]/g, "").slice(-12).toUpperCase()}`,
          occurredAt: `${draft.terms.invoiceDate}T12:00:00.000Z`,
          dueDate: draft.terms.dueDate,
          paymentTerms: draft.terms.paymentTerms,
          memo: draft.terms.memo,
          sourceFinancialDocumentId: clean(workOrder?.financialBinding?.financialDocumentId || draft.source.customerServiceWorkOrderId),
          serviceInvoice: draft,
          references,
          attachments: draft.documents
        },
        additionalReferences: references,
        commandId: cmd,
        idempotencyKey: clean(idempotencyKey || `ixi-service-invoice:${cmd}`),
        metadata: {
          ...metadata,
          transactModule: "service-invoice",
          serviceInvoiceSchema: draft.schema,
          pricingType: draft.source.pricingType,
          serviceQuoteNumber: draft.source.serviceQuoteNumber,
          customerServiceWorkOrderId: draft.source.customerServiceWorkOrderId
        },
        apiBaseUrl,
        headers,
        signal
      });

      const saved = response?.record || response?.data?.record;
      if (!saved?.financialDocument?.financialDocumentId || !saved?.server?.revision) throw new Error("Service Invoice save did not return its canonical identity and revision.");
      return { record: hydrateIXIServiceInvoice(saved), response };
    }
  });
}

export async function updateIXIServiceInvoice({ record, action, actor, reason = "" }) {
  const next = action === "issue" ? issueIXIServiceInvoice(record, actor) : voidIXIServiceInvoice(record, { reason }, actor);
  const binding = record.financialBinding || {};
  if (!binding.financialDocumentId || !binding.revision) throw new Error("Open the saved invoice before changing it.");
  const commandId = crypto.randomUUID();
  const { financialBinding, ...stored } = next;
  const response = await patchIXIAosFinancialDocument({ financialDocumentId: binding.financialDocumentId, expectedRevision: binding.revision,
    commandId, idempotencyKey: commandId, patch: { serviceInvoice: stored, financialState: action === "issue" ? "billed" : "void", status: action === "issue" ? "open" : "void" },
    metadata: { transactModule: "service-invoice", action } });
  const canonical = response?.data?.record || response?.record;
  if (!canonical?.financialDocument) throw new Error("Invoice update did not return a saved record.");
  return { record: hydrateIXIServiceInvoice(canonical), response };
}

export default { createIXIServiceInvoice, updateIXIServiceInvoice, hydrateIXIServiceInvoice };
