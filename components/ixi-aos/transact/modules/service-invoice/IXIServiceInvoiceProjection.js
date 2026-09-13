import { buildIXIReceivableProjection } from "../collections/IXICollectionsProjectionEngine.js";
export function hydrateIXIServiceInvoice(record = {}, records = []) {
  const document = record.financialDocument || record.record?.financialDocument || {};
  const server = record.server || record.record?.server || {};
  const draft = document.serviceInvoice;
  if (!draft) return null;
  const pool = [record, ...records.filter(item => (item.financialDocument || item.record?.financialDocument)?.financialDocumentId !== document.financialDocumentId)];
  const payment = buildIXIReceivableProjection({ financialRecords: pool }).receivables.find(item => item.invoiceId === document.financialDocumentId);
  const received = payment?.received ?? 0;
  const balance = ["void", "reversed"].includes(document.financialState) ? 0 : payment?.balance ?? document.totals?.total ?? document.amount ?? draft.charges.amountDue;
  return { ...draft,
    identity: { ...draft.identity, serviceInvoiceId: document.financialDocumentId, number: document.documentNumber },
    status: document.financialState === "draft" ? "draft" : ["void", "reversed"].includes(document.financialState) ? "void" : "issued",
    financialBinding: { financialDocumentId: document.financialDocumentId, revision: server.revision },
    ar: { ...draft.ar, amountReceived: received, balanceDue: balance, status: balance <= 0 ? "paid" : received > 0 ? "partial" : "open" }
  };
}

