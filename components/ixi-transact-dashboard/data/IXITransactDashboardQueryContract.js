const ALLOWED_INCLUDES = Object.freeze([
  "executive",
  "ar",
  "ap",
  "treasury",
  "gl-controls",
  "reporting",
  "attention"
]);

const clean = value => String(value ?? "").trim();

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function currentPeriodKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function monthBounds(periodKey) {
  const match = clean(periodKey).match(/^(\d{4})-(\d{2})$/);
  if (!match) return { from: "", through: "" };

  const year = Number(match[1]);
  const month = Number(match[2]);
  const lastDay = new Date(year, month, 0).getDate();

  return {
    from: `${match[1]}-${match[2]}-01`,
    through: `${match[1]}-${match[2]}-${String(lastDay).padStart(2, "0")}`
  };
}

export function buildIXITransactDashboardQuery({
  entityPassportIds = [],
  locationPassportIds = [],
  assetPassportIds = [],
  customerPassportIds = [],
  vendorPassportIds = [],
  accountingPeriod = currentPeriodKey(),
  from = "",
  through = "",
  currency = "USD",
  filters = {},
  include = ALLOWED_INCLUDES
} = {}) {
  const bounds = monthBounds(accountingPeriod);

  const normalizeIds = values =>
    Array.from(new Set(safeArray(values).map(clean).filter(Boolean)));

  const resolvedInclude = Array.from(
    new Set(
      safeArray(include)
        .map(clean)
        .filter(value => ALLOWED_INCLUDES.includes(value))
    )
  );

  return {
    contract: "ixi-transact-dashboard-query",
    contractVersion: "1.0.0",
    scope: {
      entityPassportIds: normalizeIds(entityPassportIds),
      locationPassportIds: normalizeIds(locationPassportIds),
      assetPassportIds: normalizeIds(assetPassportIds),
      customerPassportIds: normalizeIds(customerPassportIds),
      vendorPassportIds: normalizeIds(vendorPassportIds)
    },
    period: {
      from: clean(from) || bounds.from,
      through: clean(through) || bounds.through,
      accountingPeriod: clean(accountingPeriod) || currentPeriodKey()
    },
    currency: clean(currency || "USD").toUpperCase(),
    filters: filters && typeof filters === "object" && !Array.isArray(filters)
      ? { ...filters }
      : {},
    include: resolvedInclude.length ? resolvedInclude : [...ALLOWED_INCLUDES]
  };
}

export function getDefaultIXITransactAccountingPeriod() {
  return currentPeriodKey();
}

export { ALLOWED_INCLUDES as IXI_TRANSACT_DASHBOARD_INCLUDES };
