import { createIXIAosObjectFinancialDocument, createIXIAosFinancialObjectReference } from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { patchIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";
import { createIXIServiceQuoteDraft, validateIXIServiceQuote } from "./IXIServiceQuoteContract";

const clean = value => String(value ?? "").trim();
const push = (refs, ref) => { if (ref && !refs.some(item => item.passportId === ref.passportId && item.role === ref.role)) refs.push(ref); };
const responseRecord = response => response?.data?.record || response?.record || {};

function canonicalize(draft, response) {
  const stored = responseRecord(response), document = stored?.financialDocument || response?.financialDocument || {};
  const financialDocumentId = clean(document.financialDocumentId);
  if (!financialDocumentId) { const error = new Error("IXI Financial did not return a canonical Service Quote identity."); error.code = "IXI_SERVICE_QUOTE_IDENTITY_MISSING"; throw error; }
  const canonical = document.serviceQuote || draft;
  return { ...canonical, identity: { ...(canonical.identity || draft.identity), clientRequestId: clean(draft.identity?.clientRequestId), serviceQuoteId: financialDocumentId, financialDocumentId, number: clean(document.documentNumber) || financialDocumentId }, financialBinding: { financialDocumentId, revision: Number(stored?.server?.revision || stored?.revision || 1), financialLineId: clean(document?.lines?.[0]?.financialLineId), line: document?.lines?.[0] || null } };
}
const canonicalRecord = record => { const { financialBinding: _binding, ...canonical } = record; return canonical; };

export async function createIXIServiceQuote({ object = {}, context = {}, input = {}, commandId = "", idempotencyKey = "", metadata = {}, apiBaseUrl = "", headers = {}, signal } = {}) {
  const draft = createIXIServiceQuoteDraft({ context, input }), check = validateIXIServiceQuote(draft);
  if (!check.valid) { const error = new Error("Service Quote is incomplete"); error.validation = check; throw error; }
  const cmd = clean(commandId || draft.identity.clientRequestId || `SQ-${Date.now()}`);
  const resolved = { ...object, passportId: clean(object.passportId || draft.context.primaryPassportId), objectId: clean(object.objectId || draft.context.primaryObjectId), objectType: clean(object.objectType || draft.context.primaryObjectType), label: clean(object.label || draft.context.primaryLabel) };
  return runIXIActionNoticeLifecycle({ objectId: clean(context.primary?.objectId || context.primary?.passportId || resolved.objectId || resolved.passportId), commandId: cmd, source: "ixi-transact-service-quote", savingMessage: "CREATING SERVICE QUOTE...", successMessage: result => `SERVICE QUOTE ${clean(result?.record?.identity?.number) || "CREATED"}`, errorMessage: "SERVICE QUOTE SAVE FAILED", operation: async () => {
    const refs = [];
    push(refs, createIXIAosFinancialObjectReference({ object: context.primary || resolved, role: "asset" }));
    push(refs, createIXIAosFinancialObjectReference({ object: context.entity || {}, role: "entity" }));
    push(refs, createIXIAosFinancialObjectReference({ object: context.location || {}, role: "location" }));
    push(refs, createIXIAosFinancialObjectReference({ object: context.actor || {}, role: "employee" }));
    if (draft.customer.name && draft.customer.passportId) push(refs, { role: "customer", label: draft.customer.name, objectType: "entity", passportId: draft.customer.passportId });
    const response = await createIXIAosObjectFinancialDocument({ object: resolved, documentType: "service-quote", input: { currency: "USD", occurredAt: `${draft.commercial.quoteDate}T12:00:00.000Z`, expectedAt: `${draft.commercial.validThrough}T12:00:00.000Z`, description: `Service Quote · ${draft.customer.name} · ${draft.asset.label}`, financialState: "draft", serviceQuote: draft, references: refs, attachments: draft.documents }, additionalReferences: refs, commandId: cmd, idempotencyKey: clean(idempotencyKey || `ixi-service-quote:${cmd}`), metadata: { ...metadata, transactModule: "service-quote", quoteSchema: draft.schema, pricingType: draft.commercial.pricingType, revision: draft.identity.revision, customerLabel: draft.customer.name }, apiBaseUrl, headers, signal });
    return { record: canonicalize(draft, response), response };
  } });
}

export async function updateIXIServiceQuote({ record = {}, action = "update", metadata = {}, signal } = {}) {
  const financialDocumentId = clean(record?.financialBinding?.financialDocumentId || record?.identity?.financialDocumentId || record?.identity?.serviceQuoteId);
  const expectedRevision = Number(record?.financialBinding?.revision), storedLine = record?.financialBinding?.line;
  if (!financialDocumentId || !Number.isInteger(expectedRevision) || expectedRevision < 1 || !storedLine) { const error = new Error("Service Quote is not bound to a current IXI Financial revision."); error.code = "IXI_SERVICE_QUOTE_BINDING_REQUIRED"; throw error; }
  const canonical = canonicalRecord(record), accepted = ["accepted", "converted"].includes(canonical.status);
  const serviceValue = Number(accepted ? canonical?.economics?.authorizedServiceRevenue : canonical?.economics?.quotedServiceRevenue) || 0;
  const tax = Number(accepted ? canonical?.economics?.authorizedTax : canonical?.commercial?.taxAmount) || 0;
  const customerTotal = Number(accepted ? canonical?.economics?.authorizedCustomerTotal : canonical?.economics?.customerQuoteTotal) || 0;
  const commandId = globalThis.crypto?.randomUUID?.() || `service-quote-update-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const response = await patchIXIAosFinancialDocument({ financialDocumentId, expectedRevision, commandId, idempotencyKey: `ixi-service-quote:${action}:${commandId}`, patch: { serviceQuote: canonical, financialState: accepted ? "committed" : ["declined", "expired", "superseded"].includes(canonical.status) ? "void" : "draft", lines: [{ ...storedLine, amount: serviceValue, quantity: 1, rate: serviceValue }], totals: { quotedServiceRevenue: Number(canonical?.economics?.quotedServiceRevenue || 0), authorizedServiceRevenue: accepted ? serviceValue : 0, tax, customerTotal, subtotal: serviceValue, total: serviceValue }, accountingTreatment: { classification: accepted ? "service-revenue-contract" : "service-revenue-offer", economicEvent: accepted, createsRevenueCommitment: accepted, createsBilledRevenue: false, createsReceivable: false, createsCashEvent: false, invoiceConsumesRevenueCommitment: true }, attachments: canonical.documents || [] }, metadata: { ...metadata, transactModule: "service-quote", action, quoteStatus: canonical.status, quoteRevision: canonical.identity?.revision }, signal });
  return { record: canonicalize(canonical, response), response };
}

export default { createIXIServiceQuote, updateIXIServiceQuote };
