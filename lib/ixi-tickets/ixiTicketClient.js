const DEFAULT_BASE = "/api/ixi-tickets";

function clean(value) {
  return String(value ?? "").trim();
}

function resolveBaseUrl() {
  return clean(process.env.NEXT_PUBLIC_IXI_TICKET_API_BASE) || DEFAULT_BASE;
}

async function request(path, options = {}) {
  const response = await fetch(`${resolveBaseUrl()}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message || payload?.message || `IXI Ticket request failed (${response.status}).`
    );
    error.status = response.status;
    error.code = payload?.error?.code || payload?.code || "IXI_TICKET_REQUEST_FAILED";
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function reserveTicketNumber() {
  return request("/tickets/reserve", { method: "POST", body: "{}" });
}

export async function createRemoteTicket(ticket) {
  return request("/tickets", {
    method: "POST",
    body: JSON.stringify({ ticket })
  });
}

export async function updateRemoteTicket(ticketId, patch) {
  return request(`/tickets/${encodeURIComponent(ticketId)}`, {
    method: "PATCH",
    body: JSON.stringify({ patch })
  });
}

export async function listRemoteTickets(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") query.set(key, String(value));
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request(`/tickets${suffix}`);
}

export async function fetchRemoteTicket(ticketId) {
  return request(`/tickets/${encodeURIComponent(ticketId)}`);
}

export async function publishTicketToGithub(ticketId) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/github/publish`, {
    method: "POST",
    body: "{}"
  });
}

export async function verifyTicket(ticketId, payload = {}) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/verify`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function reopenTicket(ticketId, payload = {}) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/reopen`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getTicketApiInfo() {
  return {
    baseUrl: resolveBaseUrl(),
    configured: Boolean(clean(process.env.NEXT_PUBLIC_IXI_TICKET_API_BASE)),
    contract: "ixi-ticket-v1"
  };
}
