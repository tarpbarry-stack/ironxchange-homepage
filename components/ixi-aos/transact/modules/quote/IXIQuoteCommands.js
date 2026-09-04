import {
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference,
  mergeIXIAosFinancialReferences
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { patchIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";

const clean = value => String(value ?? "").trim();
const canonicalRecord = record => { const { financialBinding: _binding, ...stored } = record; return stored; };
const responseEnvelope = response => response?.data?.record || response?.record || {};

function canonicalize(draft, response) {
  const envelope = responseEnvelope(response);
  const document = envelope?.financialDocument || response?.financialDocument || {};
  const financialDocumentId = clean(document.financialDocumentId);
  if (!financialDocumentId) throw Object.assign(new Error("IXI Financial did not return a canonical Quote identity."), { code: "IXI_QUOTE_IDENTITY_MISSING" });
  const canonical = document.quote || draft;
  return {
    ...canonical,
    identity: {
      ...(canonical.identity || draft.identity),
      clientRequestId: clean(draft?.identity?.clientRequestId),
      quoteId: financialDocumentId,
      financialDocumentId,
      number: clean(document.documentNumber) || financialDocumentId
    },
    financialBinding: {
      financialDocumentId,
      revision: Number(envelope?.server?.revision || envelope?.revision || 1),
      financialLineId: clean(document?.lines?.[0]?.financialLineId),
      line: document?.lines?.[0] || null
    }
  };
}

function references(context = {}, record = {}) {
  const candidates = [
    createIXIAosFinancialObjectReference({ object: context.primary || {}, role: "asset" }),
    createIXIAosFinancialObjectReference({ object: context.entity || {}, role: "entity" }),
    createIXIAosFinancialObjectReference({ object: context.location || {}, role: "location" }),
    createIXIAosFinancialObjectReference({ object: context.actor || {}, role: "employee" })
  ];
  if (clean(record?.customer?.passportId)) candidates.push({ passportId: clean(record.customer.passportId), role: "customer", label: clean(record.customer.name), objectType: "entity" });
  return mergeIXIAosFinancialReferences(candidates.filter(Boolean));
}

export async function createIXIQuote({ object = {}, context = {}, record = {}, signal } = {}) {
  const commandId = clean(record?.identity?.clientRequestId) || globalThis.crypto?.randomUUID?.() || `quote-${Date.now()}`;
  const refs = references(context, record);
  return runIXIActionNoticeLifecycle({
    objectId: clean(context?.primary?.objectId || context?.primary?.passportId || object?.objectId || object?.passportId),
    commandId,
    source: "ixi-transact-quote",
    savingMessage: "SAVING QUOTE...",
    successMessage: result => `QUOTE ${clean(result?.record?.identity?.number) || "SAVED"}`,
    errorMessage: error => clean(error?.message) || "QUOTE SAVE FAILED — WORK PRESERVED",
    operation: async () => {
      const response = await createIXIAosObjectFinancialDocument({
        object: { ...object, passportId: clean(context?.primary?.passportId || object?.passportId), objectId: clean(context?.primary?.objectId || object?.objectId), objectType: clean(context?.primary?.objectType || object?.objectType), label: clean(context?.primary?.label || object?.label) },
        documentType: "quote",
        commandId,
        idempotencyKey: `ixi-quote:${commandId}`,
        signal,
        input: {
          currency: clean(record?.commercial?.currency || "USD"),
          financialState: "draft",
          description: `Quote · ${clean(record?.customer?.name)} · ${clean(record?.asset?.label)}`,
          quote: canonicalRecord(record),
          references: refs,
          attachments: Array.isArray(record.documents) ? record.documents : []
        },
        additionalReferences: refs,
        metadata: { transactModule: "quote", quoteSchema: record.schema, quoteRevision: record?.identity?.revision, quoteStatus: record.status, customerLabel: clean(record?.customer?.name) }
      });
      return { response, record: canonicalize(record, response) };
    }
  });
}

export async function updateIXIQuote({ record = {}, action = "save", signal } = {}) {
  const financialDocumentId = clean(record?.financialBinding?.financialDocumentId || record?.identity?.financialDocumentId || record?.identity?.quoteId);
  const expectedRevision = Number(record?.financialBinding?.revision || 0);
  if (!financialDocumentId || !Number.isInteger(expectedRevision) || expectedRevision < 1) throw Object.assign(new Error("Quote is not bound to a current IXI Financial revision."), { code: "IXI_QUOTE_BINDING_REQUIRED" });
  const storedLine = record?.financialBinding?.line || {};
  const subtotal = Number(record?.totals?.subtotal || 0);
  const commandId = globalThis.crypto?.randomUUID?.() || `quote-update-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const response = await patchIXIAosFinancialDocument({
    financialDocumentId,
    expectedRevision,
    commandId,
    idempotencyKey: `ixi-quote:${action}:${commandId}`,
    patch: {
      quote: canonicalRecord(record),
      financialState: "draft",
      lines: [{ ...storedLine, amount: subtotal, quantity: 1, rate: subtotal }],
      totals: { subtotal, tax: Number(record?.totals?.tax || 0), freight: Number(record?.totals?.freight || 0), fees: Number(record?.totals?.fees || 0), tradeAllowance: Number(record?.totals?.tradeAllowance || 0), customerTotal: Number(record?.totals?.total || 0), total: subtotal },
      accountingTreatment: { classification: "equipment-sales-offer", economicEvent: false, createsRevenueCommitment: false, createsBilledRevenue: false, createsReceivable: false, createsCashEvent: false, salesOrderCreated: false },
      attachments: Array.isArray(record.documents) ? record.documents : []
    },
    metadata: { transactModule: "quote", action, quoteStatus: record.status, quoteRevision: record?.identity?.revision },
    signal
  });
  return { response, record: canonicalize(record, response) };
}

export default { createIXIQuote, updateIXIQuote };
