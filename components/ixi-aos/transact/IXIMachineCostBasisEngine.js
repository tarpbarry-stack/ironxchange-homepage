const clean = value => String(value ?? "").trim();
const lower = value => clean(value).toLowerCase();
const money = value => Math.round((Number(value) || 0) * 100) / 100;

const VOID_STATUSES = new Set([
  "cancelled",
  "canceled",
  "declined",
  "rejected",
  "reversed",
  "void",
  "voided"
]);

const REVENUE_TYPES = new Set([
  "collection",
  "invoice",
  "payment",
  "rental-income",
  "sales-order",
  "settlement"
]);

const ACTUAL_TYPES = new Set([
  "asset-acquisition",
  "bill",
  "expense",
  "freight",
  "freight-order",
  "material-usage",
  "rental-expense",
  "time-entry"
]);

const COMMITTED_TYPES = new Set(["purchase", "purchase-order"]);
const PLANNED_TYPES = new Set(["quote", "service-quote"]);

export const COST_BASIS_CATEGORY_META = Object.freeze({
  acquisition: { label: "ACQUISITION" },
  freight: { label: "FREIGHT / DELIVERY" },
  makeReady: { label: "MAKE READY / REPAIRS" },
  material: { label: "PARTS / MATERIAL" },
  labor: { label: "LABOR / TIME" },
  fees: { label: "FEES / TAX" },
  carrying: { label: "CARRYING COST" },
  other: { label: "OTHER COST" }
});

const CATEGORY_ORDER = Object.freeze(Object.keys(COST_BASIS_CATEGORY_META));

function recordMetadata(record = {}) {
  return {
    ...(record?.source?.metadata || {}),
    ...(record?.source?.record?.metadata || {}),
    ...(record?.document?.metadata || {})
  };
}

function recordText(record = {}, metadata = {}) {
  return [
    record?.documentType,
    record?.category,
    record?.moduleId,
    record?.title,
    metadata?.transactModule,
    metadata?.acquisitionCategory,
    metadata?.costCategory,
    metadata?.costPhase,
    metadata?.expenseCategory,
    metadata?.expenseCostPurpose
  ].map(lower).join(" ");
}

function includesAny(text, terms) {
  return terms.some(term => text.includes(term));
}

function costCategory(record = {}, metadata = {}) {
  const type = lower(record.documentType);
  const text = recordText(record, metadata);
  if (type === "asset-acquisition" || includesAny(text, ["asset acquisition", "purchase price", "buyer premium"])) return "acquisition";
  if (includesAny(text, ["freight", "delivery", "haul", "shipping", "transport"])) return "freight";
  if (type === "material-usage" || includesAny(text, ["part", "material", "tire", "component"])) return "material";
  if (type === "time-entry" || includesAny(text, ["labor", "payroll", "technician", "time entry"])) return "labor";
  if (includesAny(text, ["repair", "service", "maintenance", "make ready", "make-ready", "inspection", "detail", "recondition"])) return "makeReady";
  if (includesAny(text, ["premium", "tax", "title", "registration", "broker fee", "auction fee", "document fee"])) return "fees";
  if (type === "rental-expense" || includesAny(text, ["storage", "insurance", "interest", "finance charge", "carrying", "yard fee"])) return "carrying";
  return "other";
}

function explicitCost(metadata = {}, record = {}) {
  return Boolean(
    metadata.capitalizable ||
    metadata.acquisitionCost ||
    metadata.costBasis ||
    record?.document?.acquisitionCost
  );
}

export function classifyIXIMachineCostRecord(record = {}) {
  const status = lower(record.status);
  const type = lower(record.documentType);
  const metadata = recordMetadata(record);
  const amount = money(record.amount);

  if (VOID_STATUSES.has(status) || !amount) {
    return { state: "excluded", category: "other", amount: 0, reason: "inactive" };
  }

  if (type === "credit" || metadata.credit === true || metadata.isCredit === true) {
    return {
      state: "actual",
      category: costCategory(record, metadata),
      amount: -Math.abs(amount),
      reason: "credit"
    };
  }

  if (REVENUE_TYPES.has(type) && !explicitCost(metadata, record)) {
    return { state: "excluded", category: "other", amount: 0, reason: "non-cost" };
  }

  if (COMMITTED_TYPES.has(type)) {
    return { state: "committed", category: costCategory(record, metadata), amount, reason: "commitment" };
  }

  if (PLANNED_TYPES.has(type)) {
    return { state: "planned", category: costCategory(record, metadata), amount, reason: "estimate" };
  }

  if (ACTUAL_TYPES.has(type) || explicitCost(metadata, record)) {
    return { state: "actual", category: costCategory(record, metadata), amount, reason: "incurred" };
  }

  if (["work-order", "service-order"].includes(type)) {
    return { state: "excluded", category: "makeReady", amount: 0, reason: "container" };
  }

  return { state: "review", category: costCategory(record, metadata), amount, reason: "unclassified" };
}

function dedupeRecords(records = []) {
  const recordsById = new Map();
  for (const record of Array.isArray(records) ? records : []) {
    const id = clean(record?.id);
    const key = id || `anonymous-${recordsById.size + 1}`;
    const current = recordsById.get(key);
    if (!current || Number(record?.revision || 0) >= Number(current?.revision || 0)) {
      recordsById.set(key, record);
    }
  }
  return [...recordsById.values()];
}

export function getIXIMachineCostBasis(index = {}) {
  const classified = dedupeRecords(index?.records).map(record => ({
    ...record,
    costBasis: classifyIXIMachineCostRecord(record)
  }));
  const actualRecords = classified.filter(item => item.costBasis.state === "actual");
  const committedRecords = classified.filter(item => item.costBasis.state === "committed");
  const plannedRecords = classified.filter(item => item.costBasis.state === "planned");
  const reviewRecords = classified.filter(item => item.costBasis.state === "review");
  const total = records => money(records.reduce((sum, item) => sum + item.costBasis.amount, 0));
  const categories = CATEGORY_ORDER.map(id => {
    const records = actualRecords.filter(item => item.costBasis.category === id);
    return {
      id,
      label: COST_BASIS_CATEGORY_META[id].label,
      amount: total(records),
      count: records.length,
      records
    };
  }).filter(item => item.count || item.amount);
  const totalInvested = total(actualRecords);
  const acquisition = categories.find(item => item.id === "acquisition")?.amount || 0;
  const acquisitionDates = actualRecords
    .filter(item => item.costBasis.category === "acquisition")
    .map(item => Date.parse(item.occurredAt))
    .filter(Number.isFinite);
  const acquiredAt = acquisitionDates.length
    ? new Date(Math.min(...acquisitionDates)).toISOString()
    : "";

  return {
    totalInvested,
    acquisition: money(acquisition),
    additionalCosts: money(totalInvested - acquisition),
    committed: total(committedRecords),
    planned: total(plannedRecords),
    reviewAmount: total(reviewRecords),
    reviewCount: reviewRecords.length,
    actualRecords,
    committedRecords,
    plannedRecords,
    reviewRecords,
    categories,
    acquiredAt
  };
}
