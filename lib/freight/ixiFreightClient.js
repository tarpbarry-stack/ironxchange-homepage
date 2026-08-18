const clean = value => String(value ?? "").trim();
const obj = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

export const IXI_FREIGHT_API_VERSION = "v1";

export function getIXIFreightBaseUrl() {
  const configured = clean(process.env.NEXT_PUBLIC_IXI_CORE_BASE_URL).replace(/\/+$/, "");
  return `${configured || "https://staging.ironxchange.com/ix-core"}/freight/${IXI_FREIGHT_API_VERSION}`;
}

export function createIXIFreightCommandId(prefix = "freight") {
  const random = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

export class IXIFreightError extends Error {
  constructor(message, { status = 0, code = "FREIGHT_REQUEST_FAILED", details = null } = {}) {
    super(message);
    this.name = "IXIFreightError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = "GET", body = null, signal = undefined } = {}) {
  const response = await fetch(`${getIXIFreightBaseUrl()}${path}`, {
    method,
    credentials: "include",
    headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal
  });
  let payload = null;
  try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok || payload?.ok === false) {
    throw new IXIFreightError(
      payload?.error?.message || `Freight request failed with HTTP ${response.status}.`,
      { status: response.status, code: payload?.error?.code || "FREIGHT_REQUEST_FAILED", details: payload?.error?.details || null }
    );
  }
  return payload;
}

export async function createIXIFreightOrder(input = {}, { commandId = createIXIFreightCommandId("freight-create"), signal } = {}) {
  return request("/orders", { method: "POST", body: { ...obj(input), commandId }, signal });
}

export async function fetchIXIFreightOrder(freightOrderId, { entityId = "", signal } = {}) {
  const query = entityId ? `?entityId=${encodeURIComponent(entityId)}` : "";
  return request(`/orders/${encodeURIComponent(freightOrderId)}${query}`, { signal });
}

export async function fetchIXIAssetFreightOrders(passportId, { entityId = "", signal } = {}) {
  const query = new URLSearchParams();
  if (entityId) query.set("entityId", entityId);
  return request(`/assets/${encodeURIComponent(passportId)}/orders?${query.toString()}`, { signal });
}

async function action(freightOrderId, name, body = {}, { commandId = createIXIFreightCommandId(`freight-${name}`), signal } = {}) {
  return request(`/orders/${encodeURIComponent(freightOrderId)}/${name}`, { method: "POST", body: { ...obj(body), commandId }, signal });
}

export const requestIXIFreightOrder = (id, body, options) => action(id, "request", body, options);
export const awardIXIFreightOrder = (id, body, options) => action(id, "award", body, options);
export const dispatchIXIFreightOrder = (id, body, options) => action(id, "dispatch", body, options);
export const pickupIXIFreightOrder = (id, body, options) => action(id, "pickup", body, options);
export const deliverIXIFreightOrder = (id, body, options) => action(id, "deliver", body, options);
export const reconcileIXIFreightOrder = (id, body, options) => action(id, "reconcile", body, options);

export async function createIXIAssetMove(input = {}, { commandId = createIXIFreightCommandId("asset-move"), signal } = {}) {
  const base = getIXIFreightBaseUrl().replace(/\/freight\/v1$/, "/asset-moves/v1");
  const response = await fetch(`${base}/orders`, {
    method: "POST", credentials: "include", headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ ...obj(input), commandId }), signal
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) throw new IXIFreightError(payload?.error?.message || `Asset Move failed with HTTP ${response.status}.`, { status: response.status, code: payload?.error?.code || "ASSET_MOVE_FAILED" });
  return payload;
}

export default {
  createIXIFreightOrder, fetchIXIFreightOrder, fetchIXIAssetFreightOrders,
  requestIXIFreightOrder, awardIXIFreightOrder, dispatchIXIFreightOrder,
  pickupIXIFreightOrder, deliverIXIFreightOrder, reconcileIXIFreightOrder,
  createIXIAssetMove, createIXIFreightCommandId
};
