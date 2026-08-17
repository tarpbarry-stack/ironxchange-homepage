const clean = value => String(value ?? "").trim();
const safeArray = value => Array.isArray(value) ? value : [];
const safeObject = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

export const IXI_TRANSACT_DASHBOARD_INCLUDES = Object.freeze([
  "executive",
  "attention",
  "ar",
  "ap",
  "treasury",
  "gl-controls",
  "reporting"
]);

export function normalizeIXITransactDashboardScope(scope = {}) {
  const source = safeObject(scope);
  const normalizeIds = values => Array.from(new Set(safeArray(values).map(clean).filter(Boolean)));
  return {
    entityPassportIds: normalizeIds(source.entityPassportIds),
    locationPassportIds: normalizeIds(source.locationPassportIds),
    assetPassportIds: normalizeIds(source.assetPassportIds),
    customerPassportIds: normalizeIds(source.customerPassportIds),
    vendorPassportIds: normalizeIds(source.vendorPassportIds)
  };
}

export function normalizeIXITransactDashboardPeriod(period = {}) {
  const source = safeObject(period);
  return {
    from: clean(source.from),
    through: clean(source.through),
    accountingPeriod: clean(source.accountingPeriod)
  };
}

export function createIXITransactDashboardQuery({
  scope = {},
  period = {},
  currency = "USD",
  filters = {},
  include = IXI_TRANSACT_DASHBOARD_INCLUDES
} = {}) {
  const normalizedInclude = Array.from(new Set(
    safeArray(include)
      .map(clean)
      .filter(value => IXI_TRANSACT_DASHBOARD_INCLUDES.includes(value))
  ));

  return {
    contract: "ixi-transact-dashboard-query",
    contractVersion: "1.0.0",
    scope: normalizeIXITransactDashboardScope(scope),
    period: normalizeIXITransactDashboardPeriod(period),
    currency: /^[A-Z]{3}$/.test(clean(currency).toUpperCase()) ? clean(currency).toUpperCase() : "USD",
    filters: safeObject(filters),
    include: normalizedInclude.length ? normalizedInclude : [...IXI_TRANSACT_DASHBOARD_INCLUDES]
  };
}

export function validateIXITransactDashboardQuery(query = {}) {
  const source = safeObject(query);
  const errors = [];
  if (!safeArray(source.scope?.entityPassportIds).length) {
    errors.push({ code: "entity-scope-required", message: "At least one authorized entity Passport is required." });
  }
  if (!clean(source.period?.accountingPeriod) && !clean(source.period?.through)) {
    errors.push({ code: "period-required", message: "Accounting period or through date is required." });
  }
  return { ok: errors.length === 0, errors };
}

export default {
  IXI_TRANSACT_DASHBOARD_INCLUDES,
  normalizeIXITransactDashboardScope,
  normalizeIXITransactDashboardPeriod,
  createIXITransactDashboardQuery,
  validateIXITransactDashboardQuery
};
