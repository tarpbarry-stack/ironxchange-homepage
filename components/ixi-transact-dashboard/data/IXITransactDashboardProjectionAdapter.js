const clean = value => String(value ?? "").trim();
const safeObject = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const safeArray = value => Array.isArray(value) ? value : [];
const finiteOrNull = value => Number.isFinite(Number(value)) ? Number(value) : null;

function readNumber(source, candidates = []) {
  for (const key of candidates) {
    const value = key.split(".").reduce((current, part) => current?.[part], source);
    const number = finiteOrNull(value);
    if (number !== null) return number;
  }
  return null;
}

export function createIXIExecutiveDesktopModel(projection = {}) {
  const source = safeObject(projection);
  const executive = safeObject(source.executive);
  const treasury = safeObject(source.treasury);
  const ar = safeObject(source.ar);
  const ap = safeObject(source.ap);
  const gl = safeObject(source.gl);

  return {
    currency: clean(source.currency || executive.currency || "USD").toUpperCase(),
    generatedAt: clean(source.generatedAt),
    projectionVersion: clean(source.projectionVersion),
    status: clean(source.status || "current"),
    kpis: {
      revenue: readNumber(executive, ["revenue", "current.revenue", "income.revenue", "totalRevenue"]),
      netIncome: readNumber(executive, ["netIncome", "current.netIncome", "income.netIncome"]),
      netMargin: readNumber(executive, ["netMargin", "marginPercent", "current.netMargin"]),
      cash: readNumber(executive, ["cashBalance", "cash", "current.cash", "financialPosition.cash"])
        ?? readNumber(treasury, ["totalCash", "bookCash", "summary.totalCash"]),
      openAR: readNumber(executive, ["openAR", "accountsReceivable", "current.openAR"])
        ?? readNumber(ar, ["totalAR", "open", "summary.totalAR"]),
      openAP: readNumber(executive, ["openAP", "accountsPayable", "current.openAP"])
        ?? readNumber(ap, ["totalAP", "open", "summary.totalAP"])
    },
    comparisons: safeObject(executive.comparisons),
    revenueTrend: safeArray(executive.revenueTrend || executive.trends?.revenueAndIncome),
    cashTrend: safeArray(executive.cashTrend || treasury.forecast?.series),
    profitability: safeArray(executive.profitability || source.reports?.profitability?.topBottom),
    financialPosition: {
      assets: readNumber(executive, ["assets", "financialPosition.assets"]),
      liabilities: readNumber(executive, ["liabilities", "financialPosition.liabilities"]),
      equity: readNumber(executive, ["equity", "financialPosition.equity"]),
      workingCapital: readNumber(executive, ["workingCapital", "financialPosition.workingCapital"]),
      currentRatio: readNumber(executive, ["currentRatio", "financialPosition.currentRatio"])
    },
    control: {
      periodStatus: clean(gl.periodStatus || executive.periodStatus),
      closeReady: gl.closeReady === true || executive.closeReady === true,
      postingExceptions: readNumber(gl, ["postingExceptions", "counts.exceptions"]),
      unreconciledBanks: readNumber(treasury, ["unreconciledAccounts", "summary.unreconciledAccounts"])
    },
    attention: safeArray(source.attention)
      .map(item => ({
        alertId: clean(item?.alertId || item?.id),
        type: clean(item?.type),
        severity: clean(item?.severity || "attention"),
        title: clean(item?.title || item?.label || "ATTENTION REQUIRED"),
        detail: clean(item?.detail || item?.description),
        amount: finiteOrNull(item?.amount),
        dueAt: clean(item?.dueAt),
        workspace: clean(item?.workspace),
        sourceRecordType: clean(item?.sourceRecordType),
        sourceRecordId: clean(item?.sourceRecordId),
        actionLabel: clean(item?.actionLabel || "OPEN")
      }))
      .filter(item => item.alertId || item.title)
  };
}

export function getIXIProjectionFreshness(model = {}) {
  const generatedAt = clean(model.generatedAt);
  if (!generatedAt) return { label: "UNVERIFIED", state: "unknown" };
  const timestamp = new Date(generatedAt).getTime();
  if (!Number.isFinite(timestamp)) return { label: "UNVERIFIED", state: "unknown" };
  const ageMs = Date.now() - timestamp;
  if (ageMs < 120000) return { label: "CURRENT", state: "current" };
  if (ageMs < 900000) return { label: "AGING", state: "aging" };
  return { label: "STALE", state: "stale" };
}

export default {
  createIXIExecutiveDesktopModel,
  getIXIProjectionFreshness
};
