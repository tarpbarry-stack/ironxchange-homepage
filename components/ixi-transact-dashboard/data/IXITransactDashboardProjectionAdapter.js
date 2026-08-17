const clean = value => String(value ?? "").trim();

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function moneyMetric(source, ...keys) {
  for (const key of keys) {
    const value = finiteNumber(source?.[key]);
    if (value !== null) return value;
  }
  return null;
}

export function normalizeIXITransactDashboardProjection(payload = {}) {
  const root = safeObject(payload?.data || payload?.projection || payload);
  const executive = safeObject(root.executive);
  const ar = safeObject(root.ar);
  const ap = safeObject(root.ap);
  const treasury = safeObject(root.treasury);
  const gl = safeObject(root.gl);
  const reports = safeObject(root.reports);

  return {
    generatedAt: clean(root.generatedAt),
    projectionVersion: clean(root.projectionVersion),
    lineageVersion: clean(root.lineageVersion),
    currency: clean(root.currency || "USD").toUpperCase(),
    scope: safeObject(root.scope),
    period: safeObject(root.period),
    executive: {
      revenue: moneyMetric(executive, "revenue", "revenueCurrentPeriod"),
      netIncome: moneyMetric(executive, "netIncome"),
      cash: moneyMetric(executive, "cash", "cashBalance"),
      openAr: moneyMetric(executive, "openAr", "accountsReceivable"),
      overdueAr: moneyMetric(executive, "overdueAr"),
      openAp: moneyMetric(executive, "openAp", "accountsPayable"),
      assets: moneyMetric(executive, "assets", "totalAssets"),
      liabilities: moneyMetric(executive, "liabilities", "totalLiabilities"),
      equity: moneyMetric(executive, "equity", "totalEquity"),
      closeReadiness: clean(executive.closeReadiness || executive.closeStatus)
    },
    ar: {
      ...ar,
      records: safeArray(ar.records || ar.items || ar.receivables)
    },
    ap: {
      ...ap,
      records: safeArray(ap.records || ap.items || ap.payables)
    },
    treasury: {
      ...treasury,
      accounts: safeArray(treasury.accounts),
      forecast: safeArray(treasury.forecast)
    },
    gl: {
      ...gl,
      journals: safeArray(gl.journals),
      exceptions: safeArray(gl.exceptions),
      close: safeObject(gl.close)
    },
    reports,
    attention: safeArray(root.attention || root.alerts),
    raw: root
  };
}
