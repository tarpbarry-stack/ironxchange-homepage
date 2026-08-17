import {
  createIXITransactDashboardQuery,
  validateIXITransactDashboardQuery
} from "./IXITransactDashboardQueryContract";

const clean = value => String(value ?? "").trim();
const safeArray = value => Array.isArray(value) ? value : [];
const safeObject = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

export class IXITransactDashboardError extends Error {
  constructor(message, { status = 0, result = null, code = "dashboard-request-failed" } = {}) {
    super(message);
    this.name = "IXITransactDashboardError";
    this.status = Number(status || 0);
    this.result = result;
    this.code = clean(code);
  }
}

export function getIXITransactDashboardEndpoint({ apiBaseUrl = "" } = {}) {
  const base = clean(apiBaseUrl).replace(/\/+$/, "");
  return base ? `${base}/financial/dashboard` : "/api/ixi-financial/financial/dashboard";
}

export function normalizeIXITransactDashboardResponse(result = {}) {
  const source = safeObject(result);
  const data = safeObject(source.data || source);
  const reporting = safeObject(data.reporting || data.reports);
  return {
    ok: source.ok === undefined ? true : source.ok === true,
    generatedAt: clean(data.generatedAt || source.generatedAt),
    scope: safeObject(data.scope),
    period: safeObject(data.period),
    accountingPeriod: clean(data.accountingPeriod || data.period?.accountingPeriod || data.period?.period),
    currency: clean(data.currency || "USD").toUpperCase(),
    executive: safeObject(data.executive),
    ar: safeObject(data.ar),
    ap: safeObject(data.ap),
    treasury: safeObject(data.treasury),
    gl: safeObject(data.gl),
    reporting,
    reports: reporting,
    operations: safeObject(data.operations),
    workOrders: safeArray(data.workOrders || data.operations?.workOrders),
    attention: safeArray(data.attention),
    permissions: safeObject(data.permissions),
    lineageVersion: clean(data.lineageVersion),
    projectionVersion: clean(data.projectionVersion),
    status: clean(data.status || "current"),
    warnings: safeArray(source.warnings || data.warnings),
    errors: safeArray(source.errors || data.errors),
    raw: result
  };
}

export async function loadIXITransactDashboardProjection({
  query = {},
  apiBaseUrl = "",
  headers = {},
  signal = undefined
} = {}) {
  const normalizedQuery = createIXITransactDashboardQuery(query);
  const validation = validateIXITransactDashboardQuery(normalizedQuery);
  if (!validation.ok) {
    throw new IXITransactDashboardError(validation.errors[0]?.message || "Dashboard query is invalid.", {
      code: validation.errors[0]?.code || "invalid-dashboard-query",
      result: validation
    });
  }

  const endpoint = getIXITransactDashboardEndpoint({ apiBaseUrl });
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-IXI-Source": "ixi-transact-dashboard",
        ...safeObject(headers)
      },
      body: JSON.stringify(normalizedQuery),
      signal
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new IXITransactDashboardError(error?.message || "IXI Financial projection request failed.", {
      code: "projection-network-failure"
    });
  }

  let raw = null;
  try {
    raw = await response.json();
  } catch {
    throw new IXITransactDashboardError(`IXI Financial returned HTTP ${response.status} without valid JSON.`, {
      status: response.status,
      code: "projection-invalid-json"
    });
  }

  const result = normalizeIXITransactDashboardResponse(raw);
  if (!response.ok || !result.ok) {
    const firstError = result.errors[0];
    throw new IXITransactDashboardError(
      clean(firstError?.message) || `IXI Financial dashboard projection failed with HTTP ${response.status}.`,
      {
        status: response.status,
        result,
        code: clean(firstError?.code || firstError?.name || "projection-server-failure")
      }
    );
  }

  return result;
}

export default {
  IXITransactDashboardError,
  getIXITransactDashboardEndpoint,
  normalizeIXITransactDashboardResponse,
  loadIXITransactDashboardProjection
};
