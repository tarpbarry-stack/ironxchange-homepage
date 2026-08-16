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
          financialState: "receivable",
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

      const id = clean(response?.document?.documentId || response?.financialDocument?.documentId || response?.documentId || cmd);
      const number = clean(response?.document?.documentNumber || response?.financialDocument?.documentNumber) || `SINV-${id.replace(/^SINV-/i, "").slice(-6).toUpperCase()}`;
      const occurredAt = new Date().toISOString();
      return {
        record: {
          ...draft,
          identity: { ...draft.identity, serviceInvoiceId: id, number },
          timeline: [...(draft.timeline || []), { activityId: `ACT-SINV-CREATE-${Date.now()}`, type: "service-invoice-created", occurredAt, actorLabel: draft.context.actorLabel }],
          audit: { ...draft.audit, updatedAt: occurredAt }
        },
        response
      };
    }
  });
}

export default { createIXIServiceInvoice };
