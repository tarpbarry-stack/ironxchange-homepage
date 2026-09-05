const clean = value => String(value ?? "").trim();
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = value => Math.round(number(value) * 100) / 100;
const clampRate = value => Math.max(0, Math.min(99.99, number(value)));
const list = value => Array.isArray(value) ? value : [];

export const IXI_PRICING_SCHEMA = "ixi-machine-pricing-v1";
export const IXI_PRICING_SCENARIOS = Object.freeze([
  { id: "move", label: "MOVE", defaultDays: "0–30 DAYS", multiplier: 0.95 },
  { id: "market", label: "MARKET", defaultDays: "31–60 DAYS", multiplier: 1 },
  { id: "hold", label: "HOLD", defaultDays: "61–120+ DAYS", multiplier: 1.05 }
]);

function median(values = []) {
  const sorted = values.map(number).filter(value => value > 0).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return money(sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2);
}

function validComparable(item = {}) {
  return item.included !== false && number(item.price) > 0;
}

function normalizeComparable(item = {}, kind = "active") {
  return {
    id: clean(item.id),
    source: clean(item.source || (kind === "sold" ? "Ritchie Bros." : "Sandhills")),
    year: number(item.year),
    make: clean(item.make),
    model: clean(item.model),
    hours: number(item.hours),
    price: money(item.price),
    location: clean(item.location),
    url: clean(item.url),
    capturedAt: clean(item.capturedAt),
    saleDate: clean(item.saleDate),
    buyerPremium: clean(item.buyerPremium || "unknown"),
    currency: clean(item.currency || "USD").toUpperCase(),
    quality: clean(item.quality || "usable"),
    notes: clean(item.notes),
    included: item.included !== false
  };
}

export function createIXIMachinePricingFile({ subject = {}, actor = {} } = {}) {
  return {
    schema: IXI_PRICING_SCHEMA,
    revision: 0,
    status: "draft",
    selectedScenario: "market",
    subject: {
      year: number(subject.year),
      make: clean(subject.make),
      model: clean(subject.model),
      hours: number(subject.hours),
      configuration: clean(subject.configuration),
      location: clean(subject.location),
      currentAsk: money(subject.currentAsk),
      hourTolerancePercent: number(subject.hourTolerancePercent || 10),
      soldWindowMonths: [6, 12].includes(number(subject.soldWindowMonths))
        ? number(subject.soldWindowMonths)
        : 12
    },
    activeComparables: [],
    soldComparables: [],
    adjustments: {
      year: 0,
      hours: 0,
      condition: 0,
      configuration: 0,
      location: 0,
      other: 0,
      notes: ""
    },
    salesCosts: {
      commissionPercent: 0,
      slippagePercent: 0,
      platformFees: 0,
      freightContribution: 0,
      remainingWork: 0,
      warrantyReserve: 0,
      carryingCost: 0,
      other: 0
    },
    scenarios: IXI_PRICING_SCENARIOS.map(item => ({
      id: item.id,
      askingPrice: 0,
      saleDays: item.defaultDays,
      notes: ""
    })),
    history: [],
    audit: {
      createdAt: "",
      createdBy: clean(actor.label),
      updatedAt: "",
      updatedBy: clean(actor.label)
    }
  };
}

export function normalizeIXIMachinePricingFile(file = {}, defaults = {}) {
  const base = createIXIMachinePricingFile(defaults);
  const scenarioById = new Map(list(file.scenarios).map(item => [clean(item.id), item]));
  return {
    ...base,
    ...file,
    schema: IXI_PRICING_SCHEMA,
    revision: Math.max(0, number(file.revision)),
    status: clean(file.status) === "approved" ? "approved" : "draft",
    selectedScenario: IXI_PRICING_SCENARIOS.some(item => item.id === clean(file.selectedScenario))
      ? clean(file.selectedScenario)
      : "market",
    subject: { ...base.subject, ...(file.subject || {}) },
    activeComparables: list(file.activeComparables).map(item => normalizeComparable(item, "active")),
    soldComparables: list(file.soldComparables).map(item => normalizeComparable(item, "sold")),
    adjustments: { ...base.adjustments, ...(file.adjustments || {}) },
    salesCosts: { ...base.salesCosts, ...(file.salesCosts || {}) },
    scenarios: IXI_PRICING_SCENARIOS.map(meta => ({
      id: meta.id,
      askingPrice: money(scenarioById.get(meta.id)?.askingPrice),
      saleDays: clean(scenarioById.get(meta.id)?.saleDays || meta.defaultDays),
      notes: clean(scenarioById.get(meta.id)?.notes)
    })),
    history: list(file.history).slice(0, 25),
    audit: { ...base.audit, ...(file.audit || {}) }
  };
}

function cohortFor(item = {}, subject = {}) {
  const yearDelta = number(item.year) - number(subject.year);
  const tolerance = Math.max(0, number(subject.hourTolerancePercent || 10)) / 100;
  const subjectHours = number(subject.hours);
  let hourBand = "like";
  if (subjectHours && number(item.hours) < subjectHours * (1 - tolerance)) hourBand = "lower";
  if (subjectHours && number(item.hours) > subjectHours * (1 + tolerance)) hourBand = "higher";
  return { yearDelta, hourBand };
}

function summarizeActive(comparables = [], subject = {}) {
  const included = comparables.filter(validComparable);
  const cohorts = [-1, 0, 1].map(yearDelta => {
    const records = included.filter(item => cohortFor(item, subject).yearDelta === yearDelta);
    const bands = ["lower", "like", "higher"].map(hourBand => {
      const matches = records.filter(item => cohortFor(item, subject).hourBand === hourBand);
      const lowest = [...matches].sort((a, b) => number(a.price) - number(b.price))[0] || null;
      return { id: hourBand, count: matches.length, lowest };
    });
    return { yearDelta, year: number(subject.year) + yearDelta, count: records.length, bands };
  });
  return {
    count: included.length,
    low: included.length ? Math.min(...included.map(item => number(item.price))) : 0,
    median: median(included.map(item => item.price)),
    cohorts
  };
}

function summarizeSold(comparables = [], subject = {}, asOf = new Date().toISOString()) {
  const cutoff = new Date(asOf);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - number(subject.soldWindowMonths || 12));
  const included = comparables.filter(item => {
    if (!validComparable(item)) return false;
    const soldAt = Date.parse(item.saleDate);
    return !Number.isFinite(soldAt) || soldAt >= cutoff.getTime();
  });
  return {
    count: included.length,
    low: included.length ? Math.min(...included.map(item => number(item.price))) : 0,
    high: included.length ? Math.max(...included.map(item => number(item.price))) : 0,
    median: median(included.map(item => item.price))
  };
}

function fixedSalesCosts(costs = {}) {
  return money([
    costs.platformFees,
    costs.freightContribution,
    costs.remainingWork,
    costs.warrantyReserve,
    costs.carryingCost,
    costs.other
  ].reduce((sum, value) => sum + number(value), 0));
}

function adjustmentTotal(adjustments = {}) {
  return money([
    adjustments.year,
    adjustments.hours,
    adjustments.condition,
    adjustments.configuration,
    adjustments.location,
    adjustments.other
  ].reduce((sum, value) => sum + number(value), 0));
}

export function calculateIXIMachinePricing(file = {}, { investedCost = 0, asOf } = {}) {
  const normalized = normalizeIXIMachinePricingFile(file);
  const active = summarizeActive(normalized.activeComparables, normalized.subject);
  const sold = summarizeSold(normalized.soldComparables, normalized.subject, asOf);
  const adjustments = adjustmentTotal(normalized.adjustments);
  const evidenceValue = sold.median || active.median || number(normalized.subject.currentAsk) || number(investedCost);
  const adjustedMarket = money(Math.max(0, evidenceValue + adjustments));
  const fixedCosts = fixedSalesCosts(normalized.salesCosts);
  const commissionRate = clampRate(normalized.salesCosts.commissionPercent) / 100;
  const slippageRate = clampRate(normalized.salesCosts.slippagePercent) / 100;
  const denominator = (1 - commissionRate) * (1 - slippageRate);
  const breakEvenAsk = denominator > 0
    ? money((number(investedCost) + fixedCosts) / denominator)
    : 0;
  const scenarios = IXI_PRICING_SCENARIOS.map(meta => {
    const saved = normalized.scenarios.find(item => item.id === meta.id) || {};
    const suggestedAsk = money(adjustedMarket * meta.multiplier);
    const askingPrice = money(saved.askingPrice || suggestedAsk);
    const expectedClose = money(askingPrice * (1 - slippageRate));
    const commission = money(expectedClose * commissionRate);
    const sellingCosts = money(fixedCosts + commission);
    const netProceeds = money(expectedClose - sellingCosts);
    const profit = money(netProceeds - number(investedCost));
    return {
      id: meta.id,
      label: meta.label,
      askingPrice,
      suggestedAsk,
      expectedClose,
      sellingCosts,
      netProceeds,
      profit,
      marginPercent: expectedClose ? money((profit / expectedClose) * 100) : 0,
      roiPercent: number(investedCost) ? money((profit / number(investedCost)) * 100) : 0,
      saleDays: clean(saved.saleDays || meta.defaultDays),
      notes: clean(saved.notes)
    };
  });
  const selected = scenarios.find(item => item.id === normalized.selectedScenario) || scenarios[1];
  const confidence = sold.count >= 5 && active.count >= 6
    ? "STRONG"
    : sold.count >= 3 && active.count >= 3
      ? "USABLE"
      : active.count || sold.count
        ? "LIMITED"
        : "NO EVIDENCE";
  const evidenceIssues = [
    ...normalized.activeComparables.map(item => ({ ...item, kind: "active" })),
    ...normalized.soldComparables.map(item => ({ ...item, kind: "sold" }))
  ].filter(item => item.included !== false && (
    !item.source ||
    !item.year ||
    !item.model ||
    !item.price ||
    !item.url ||
    (item.kind === "active" ? !item.capturedAt : !item.saleDate)
  ));

  return {
    file: normalized,
    investedCost: money(investedCost),
    active,
    sold,
    adjustments,
    evidenceValue,
    adjustedMarket,
    fixedCosts,
    commissionRate,
    slippageRate,
    breakEvenAsk,
    scenarios,
    selected,
    confidence,
    evidenceIssues
  };
}

export function saveIXIMachinePricingRevision(file = {}, projection = {}, actor = {}, savedAt = new Date().toISOString()) {
  const normalized = normalizeIXIMachinePricingFile(file);
  const revision = normalized.revision + 1;
  const snapshot = {
    revision,
    savedAt,
    savedBy: clean(actor.label),
    status: normalized.status,
    selectedScenario: normalized.selectedScenario,
    activeCount: projection.active?.count || 0,
    soldCount: projection.sold?.count || 0,
    askingPrice: money(projection.selected?.askingPrice),
    expectedClose: money(projection.selected?.expectedClose),
    projectedProfit: money(projection.selected?.profit),
    snapshot: {
      subject: normalized.subject,
      activeComparables: normalized.activeComparables,
      soldComparables: normalized.soldComparables,
      adjustments: normalized.adjustments,
      salesCosts: normalized.salesCosts,
      scenarios: normalized.scenarios,
      selectedScenario: normalized.selectedScenario,
      status: normalized.status
    }
  };
  return {
    ...normalized,
    revision,
    history: [snapshot, ...normalized.history].slice(0, 25),
    audit: {
      createdAt: normalized.audit.createdAt || savedAt,
      createdBy: normalized.audit.createdBy || clean(actor.label),
      updatedAt: savedAt,
      updatedBy: clean(actor.label)
    }
  };
}

export function restoreIXIMachinePricingRevision(file = {}, revision = 0) {
  const normalized = normalizeIXIMachinePricingFile(file);
  const target = normalized.history.find(item => number(item.revision) === number(revision));
  if (!target?.snapshot) return normalized;
  return normalizeIXIMachinePricingFile({
    ...normalized,
    ...target.snapshot,
    revision: normalized.revision,
    history: normalized.history,
    status: "draft"
  });
}
