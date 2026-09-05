import { patchIXIAosFinancialDocument } from "../../financial-runtime/IXIAosFinancialReadClient";

const clean = value => String(value ?? "").trim();

export function canCloseIXISalesDeal(deal = null) {
  if (!deal || deal.terminal || deal.stageRecords?.sold || deal.stageRecords?.settlement) return false;
  const entry = deal.records?.[0];
  if (!entry) return false;
  if (clean(entry.document?.documentType) !== "invoice") return true;
  return clean(entry.document?.financialState || "draft").toLowerCase() === "draft";
}

export async function closeIXISalesDeal(deal, { reason = "Customer opportunity closed", signal } = {}) {
  if (!canCloseIXISalesDeal(deal)) throw new Error("This deal is financially locked and cannot be marked lost. Use the applicable void, credit, or settlement control.");
  const entry = deal.records[0];
  const document = entry.document || {};
  const documentType = clean(document.documentType);
  const at = new Date().toISOString();
  const commandId = globalThis.crypto?.randomUUID?.() || `deal-close-${Date.now()}`;
  const patch = {
    metadata: { ...(document.metadata || {}), dealId: deal.dealId, dealStatus: "lost", dealClosedAt: at, dealCloseReason: clean(reason) },
  };
  if (documentType === "quote") patch.quote = { ...(document.quote || {}), dealStatus: "lost", status: "declined", audit: { ...(document.quote?.audit || {}), updatedAt: at } };
  if (documentType === "sales-order") patch.salesOrder = { ...(document.salesOrder || {}), dealStatus: "lost", status: "cancelled", audit: { ...(document.salesOrder?.audit || {}), updatedAt: at } };
  if (documentType === "invoice") patch.financialState = "voided";
  return patchIXIAosFinancialDocument({
    financialDocumentId: entry.documentId,
    expectedRevision: Number(entry.item?.server?.revision || entry.item?.record?.server?.revision || 1),
    commandId,
    idempotencyKey: `ixi-sales-deal-close:${deal.dealId}:${commandId}`,
    patch,
    metadata: { transactModule: "sales-deal-control", dealId: deal.dealId, action: "mark-lost" },
    signal,
  });
}

export default { canCloseIXISalesDeal, closeIXISalesDeal };
