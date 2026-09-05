const clean = value => String(value ?? "").trim();
const obj = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const arr = value => Array.isArray(value) ? value : [];
const money = value => Number.isFinite(Number(value)) ? Math.round(Number(value) * 100) / 100 : 0;

export function getIXIWorkOrderFinancialDocument(item = {}) {
  const record = obj(item.record || item);
  const document = obj(record.financialDocument || record.document?.financialDocument || record.document || record);
  return {
    ...document,
    metadata: { ...obj(record.metadata), ...obj(document.metadata) },
    server: obj(item.server || record.server)
  };
}

function documentId(document = {}) {
  return clean(document.financialDocumentId || document.id);
}

function embeddedWorkOrderId(document = {}) {
  return clean(
    document.sourceFinancialDocumentId ||
    document.metadata?.workOrderId ||
    document.relationships?.workOrderId ||
    document.timeEntry?.context?.workOrderId ||
    document.materialUsage?.context?.workOrderId ||
    document.serviceRecord?.context?.workOrderId ||
    document.expenseRecord?.context?.workOrderId ||
    document.purchaseRecord?.context?.workOrderId ||
    document.workOrderId
  );
}

function embeddedWorkOrderNumber(document = {}) {
  return clean(
    document.metadata?.workOrderNumber ||
    document.relationships?.workOrderNumber ||
    document.timeEntry?.context?.workOrderNumber ||
    document.materialUsage?.context?.workOrderNumber ||
    document.serviceRecord?.context?.workOrderNumber ||
    document.expenseRecord?.context?.workOrderNumber ||
    document.purchaseRecord?.context?.workOrderNumber ||
    document.workOrderNumber
  );
}

function referenceIds(workOrder = {}) {
  const refs = obj(workOrder.references);
  return new Set([
    ...arr(refs.timeEntryIds),
    ...arr(refs.materialRecordIds),
    ...arr(refs.serviceRecordIds),
    ...arr(refs.expenseIds),
    ...arr(refs.purchaseRequestIds),
    ...arr(refs.purchaseOrderIds),
    ...arr(refs.billIds),
    ...arr(refs.technologyWorkIds)
  ].map(clean).filter(Boolean));
}

function isRelated(document, workOrder, refs) {
  const id = clean(workOrder.identity?.workOrderId || workOrder.financialBinding?.financialDocumentId);
  const number = clean(workOrder.identity?.number);
  if (!id && !number) return false;
  if (documentId(document) === id) return false;
  if (refs.has(documentId(document))) return true;
  const relatedId = embeddedWorkOrderId(document);
  const relatedNumber = embeddedWorkOrderNumber(document);
  if (id && relatedId === id) return true;
  if (number && relatedNumber === number) return true;
  return arr(document.references).some(reference =>
    clean(reference.externalId || reference.financialDocumentId) === id ||
    clean(reference.label) === number
  );
}

function typeOf(document = {}) {
  return clean(document.documentType || document.metadata?.transactModule || "record").toLowerCase();
}

function categoryOf(type) {
  if (type.includes("time")) return "labor";
  if (type.includes("material")) return "materials";
  if (type.includes("service")) return "services";
  if (type.includes("purchase")) return "purchasing";
  if (type.includes("expense") || type.includes("adjustment")) return "expenses";
  if (type.includes("bill") || type.includes("invoice")) return "bills";
  return "other";
}

function amountOf(document = {}) {
  return money(
    document.amount ??
    document.total ??
    document.totals?.total ??
    document.expenseRecord?.expense?.amount ??
    document.materialUsage?.material?.extendedCost ??
    document.serviceRecord?.service?.amount ??
    document.purchaseRecord?.purchase?.estimatedTotal
  );
}

function labelOf(document = {}, type = "") {
  return clean(
    document.description ||
    document.expenseRecord?.expense?.description ||
    document.materialUsage?.material?.description ||
    document.serviceRecord?.service?.description ||
    document.timeEntry?.time?.description ||
    document.memo
  ) || type.replaceAll("-", " ").toUpperCase();
}

function dateOf(document = {}) {
  return clean(
    document.occurredAt ||
    document.transactionDate ||
    document.documentDate ||
    document.updatedAt ||
    document.server?.updatedAt
  );
}

export function getIXIWorkOrderRelatedRecords(workOrder = {}, financialRecords = []) {
  const refs = referenceIds(workOrder);
  return arr(financialRecords)
    .map(getIXIWorkOrderFinancialDocument)
    .filter(document => isRelated(document, workOrder, refs))
    .map(document => {
      const type = typeOf(document);
      return {
        id: documentId(document),
        number: clean(document.documentNumber) || documentId(document),
        type,
        category: categoryOf(type),
        label: labelOf(document, type),
        date: dateOf(document),
        amount: amountOf(document),
        status: clean(document.financialState || document.status),
        source: document
      };
    })
    .sort((left, right) => String(right.date).localeCompare(String(left.date)));
}

export function getIXIWorkOrderCostProjection(workOrder = {}, financialRecords = []) {
  const related = getIXIWorkOrderRelatedRecords(workOrder, financialRecords);
  const actualRows = related.filter(row => !["purchasing"].includes(row.category));
  const committedRows = related.filter(row => row.category === "purchasing");
  const sum = rows => money(rows.reduce((total, row) => total + row.amount, 0));
  const derived = {
    labor: sum(actualRows.filter(row => row.category === "labor")),
    materials: sum(actualRows.filter(row => row.category === "materials")),
    services: sum(actualRows.filter(row => row.category === "services")),
    expenses: sum(actualRows.filter(row => ["expenses", "bills", "other"].includes(row.category)))
  };
  const embedded = obj(workOrder.financial);
  const hasCanonicalActuals = actualRows.some(row => row.amount !== 0);
  const totals = hasCanonicalActuals
    ? derived
    : {
        labor: money(embedded.laborActual),
        materials: money(embedded.materialActual),
        services: money(embedded.serviceActual),
        expenses: money(embedded.otherActual)
      };
  return {
    totals,
    actual: money(totals.labor + totals.materials + totals.services + totals.expenses),
    committed: committedRows.length ? sum(committedRows) : money(embedded.committed),
    requested: money(embedded.requested),
    estimated: money(embedded.estimated),
    rows: related
  };
}

export function getIXIWorkOrderActivity(workOrder = {}, financialRecords = []) {
  const relatedEvents = getIXIWorkOrderRelatedRecords(workOrder, financialRecords).map(row => ({
    id: `record:${row.id}`,
    type: row.type,
    label: row.label,
    detail: `${row.number}${row.amount ? ` · $${row.amount.toFixed(2)}` : ""}`,
    occurredAt: row.date,
    actorLabel: clean(row.source?.timeEntry?.context?.employeeLabel || row.source?.expenseRecord?.context?.employeeLabel)
  }));
  const workEvents = arr(workOrder.activity?.length ? workOrder.activity : workOrder.activityProjection).map(event => ({
    id: clean(event.activityId),
    type: clean(event.type),
    label: clean(event.label || event.type).replaceAll("-", " ").toUpperCase(),
    detail: clean(event.detail || event.note),
    occurredAt: clean(event.occurredAt),
    actorLabel: clean(event.actor?.label || event.actorLabel)
  }));
  const amendments = arr(workOrder.amendments).map(event => ({
    id: clean(event.amendmentId),
    type: clean(event.type),
    label: "WORK DATE AMENDED",
    detail: `${clean(event.previousValue)} → ${clean(event.revisedValue)} · ${clean(event.reason)}`,
    occurredAt: clean(event.occurredAt),
    actorLabel: clean(event.actorLabel)
  }));
  return [...workEvents, ...amendments, ...relatedEvents]
    .filter(event => event.id || event.occurredAt)
    .sort((left, right) => String(right.occurredAt).localeCompare(String(left.occurredAt)));
}

export function getIXIWorkOrderRelationships(workOrder = {}, financialRecords = []) {
  return {
    records: getIXIWorkOrderRelatedRecords(workOrder, financialRecords),
    notes: arr(workOrder.noteProjection),
    photos: arr(workOrder.photoProjection),
    documents: arr(workOrder.documentProjection)
  };
}

export default {
  getIXIWorkOrderRelatedRecords,
  getIXIWorkOrderCostProjection,
  getIXIWorkOrderActivity,
  getIXIWorkOrderRelationships
};
