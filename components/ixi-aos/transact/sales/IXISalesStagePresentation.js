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
  const startable = !entry && canStartIXISalesStage(deal, stageId);
  const selected = activeStageId === stageId;

  if (entry) return { entry, startable: false, selected, state: "completed" };
  if (startable && selected) return { entry: null, startable: true, selected: true, state: "next" };
  if (startable) return { entry: null, startable: true, selected: false, state: "available-action" };
  return { entry: null, startable: false, selected, state: "unavailable" };
}

export default salesStagePresentation;
