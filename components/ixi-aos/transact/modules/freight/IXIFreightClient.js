const clean = value => String(value ?? "").trim();

async function request(path, { method = "GET", body, signal } = {}) {
  const response = await fetch(`/api/ixi/freight/${path.replace(/^\/+/, "")}`, {
    method,
    credentials:"include",
    headers:{ Accept:"application/json", ...(body === undefined ? {} : { "Content-Type":"application/json" }) },
    body:body === undefined ? undefined : JSON.stringify(body),
    signal
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok !== true) {
    const problem = payload?.error || payload?.errors?.[0] || {};
    const error = new Error(clean(problem.message) || "IXI Freight request failed.");
    error.code = clean(problem.code) || "IXI_FREIGHT_REQUEST_FAILED";
    error.status = response.status;
    error.details = problem.details || null;
    throw error;
  }
  return payload;
}

export async function loadIXIFreightOrders(passportId, { signal } = {}) {
  const id = clean(passportId);
  if (!id) throw new Error("Machine Passport is required for Freight.");
  const payload = await request(`assets/${encodeURIComponent(id)}/orders`, { signal });
  return Array.isArray(payload.orders) ? payload.orders : [];
}

export async function createIXIFreightOrder(input, { signal } = {}) {
  const payload = await request("orders", { method:"POST", body:input, signal });
  return payload.freightOrder;
}

export async function amendIXIFreightOrder(freightOrderId, input, { signal } = {}) {
  return runIXIFreightAction(freightOrderId, "amend", input, { signal });
}

export async function runIXIFreightAction(freightOrderId, action, body = {}, { signal } = {}) {
  const id = clean(freightOrderId);
  if (!id) throw new Error("Freight Order ID is required.");
  const payload = await request(`orders/${encodeURIComponent(id)}/${encodeURIComponent(action)}`, { method:"POST", body, signal });
  return payload.freightOrder;
}

export async function loadIXIFreightEvents(freightOrderId, { signal } = {}) {
  const payload = await request(`orders/${encodeURIComponent(clean(freightOrderId))}/events`, { signal });
  return Array.isArray(payload.events) ? payload.events : [];
}

export default { loadIXIFreightOrders, createIXIFreightOrder, amendIXIFreightOrder, runIXIFreightAction, loadIXIFreightEvents };
