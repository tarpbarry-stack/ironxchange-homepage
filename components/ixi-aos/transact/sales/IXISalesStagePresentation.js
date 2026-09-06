const clean = value => String(value ?? "").trim();

function invoiceCarriesVerifiedSignature(deal) {
  const invoice = deal?.stageRecords?.invoice?.document || {};
  const metadata = invoice?.metadata || {};
  return Boolean(
    clean(metadata.signedPackageHash) &&
    clean(invoice.sourceFinancialDocumentId || metadata.salesOrderId)
  );
}

export function isIXISalesStageCompleted(deal, stageId) {
  const records = deal?.stageRecords || {};
  if (stageId === "quote") return Boolean(records.quote || records["sales-order"] || records.invoice || records.sold || records.settlement);
  if (stageId === "sales-order") return Boolean(records["sales-order"] || records.invoice || records.sold || records.settlement);
  if (stageId === "signed") return Boolean(records.signed || invoiceCarriesVerifiedSignature(deal));
  if (stageId === "invoice") return Boolean(records.invoice || records.sold || records.settlement);
  if (stageId === "sold") return Boolean(records.sold || records.settlement);
  if (stageId === "settlement") return Boolean(records.settlement);
  return false;
}

export function canStartIXISalesStage(deal, stageId) {
  if (stageId === "quote") return Boolean(deal?.stageRecords?.["sales-order"] || deal?.stageRecords?.invoice);
  if (stageId === "sales-order") return Boolean(deal?.stageRecords?.quote || deal?.stageRecords?.invoice);
  if (stageId === "signed") return Boolean(deal?.stageRecords?.["sales-order"]);
  if (stageId === "invoice") return Boolean(deal?.stageRecords?.signed);
  if (stageId === "sold") return Boolean(deal?.stageRecords?.invoice);
  if (stageId === "settlement") return Boolean(deal?.stageRecords?.sold);
  return false;
}

export function salesStagePresentation(deal, stageId, activeStageId = "") {
  const entry = deal?.stageRecords?.[stageId] || null;
  const completed = isIXISalesStageCompleted(deal, stageId);
  const startable = !entry && canStartIXISalesStage(deal, stageId);
  const selected = activeStageId === stageId;

  if (completed) return { entry, completed: true, startable, selected, state: "completed" };
  if (startable && selected) return { entry: null, startable: true, selected: true, state: "next" };
  if (startable) return { entry: null, completed: false, startable: true, selected: false, state: "available-action" };
  return { entry: null, completed: false, startable: false, selected, state: "unavailable" };
}

export default salesStagePresentation;
