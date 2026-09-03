const DEFAULT_BASE = "/api/ixi-tickets";

function clean(value) {
  return String(value ?? "").trim();
}

function resolveBaseUrl() {
  return clean(process.env.NEXT_PUBLIC_IXI_TICKET_API_BASE) || DEFAULT_BASE;
}

function errorMessage(payload, status) {
  return (
    payload?.error?.message ||
    payload?.errors?.[0]?.message ||
    payload?.message ||
    `IXI Ticket request failed (${status}).`
  );
}

async function request(path, options = {}) {
  const hasBody = options.body !== undefined;
  const response = await fetch(`${resolveBaseUrl()}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(errorMessage(payload, response.status));
    error.status = response.status;
    error.code =
      payload?.error?.code ||
      payload?.errors?.[0]?.code ||
      payload?.code ||
      "IXI_TICKET_REQUEST_FAILED";
    error.details = payload?.error?.details || payload?.errors?.[0]?.details || null;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function extractTicket(payload) {
  return payload?.ticket || payload?.data?.ticket || payload?.data || payload || null;
}

export function extractTickets(payload) {
  const candidates = [
    payload?.tickets,
    payload?.data?.tickets,
    payload?.data?.items,
    payload?.items,
    Array.isArray(payload?.data) ? payload.data : null,
    Array.isArray(payload) ? payload : null
  ];

  return candidates.find(Array.isArray) || [];
}

export async function reserveTicketNumber(source = "internal-chat") {
  return request("/tickets/reserve", {
    method: "POST",
    body: JSON.stringify({ source })
  });
}

export async function createRemoteTicket(ticket) {
  return request("/tickets", {
    method: "POST",
    body: JSON.stringify({ ticket })
  });
}

export async function updateRemoteTicket(ticketId, patch, expectedRevision) {
  if (!ticketId) throw new Error("Ticket ID is required for update.");
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
    throw new Error("A valid Ticket revision is required for update.");
  }

  return request(`/tickets/${encodeURIComponent(ticketId)}`, {
    method: "PATCH",
    body: JSON.stringify({ patch, expectedRevision })
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
  if (!ticketId) throw new Error("Ticket ID is required for load.");
  return request(`/tickets/${encodeURIComponent(ticketId)}`);
}

export async function ensureRemoteDraft(ticket) {
  if (!ticket?.ticketId) {
    throw new Error("Ticket ID is required before AWS synchronization.");
  }

  let remote = null;

  try {
    remote = extractTicket(await fetchRemoteTicket(ticket.ticketId));
  } catch (error) {
    if (error.status !== 404) throw error;
  }

  if (!remote) {
    return extractTicket(await createRemoteTicket({
      ...ticket,
      status: "draft"
    }));
  }

  if (remote.status !== "draft") return remote;

  return extractTicket(await updateRemoteTicket(
    ticket.ticketId,
    {
      headline: ticket.headline,
      repository: ticket.repository,
      type: ticket.type,
      priority: ticket.priority,
      executionClass: ticket.executionClass,
      originalRequest: ticket.originalRequest,
      editSections: ticket.editSections,
      attachments: ticket.attachments,
      context: ticket.context,
      metadata: ticket.metadata || {}
    },
    remote.revision
  ));
}

export async function setRemoteTicketReady(ticket) {
  const remote = await ensureRemoteDraft(ticket);
  if (!remote?.ticketId) throw new Error("AWS did not return the synchronized Ticket.");
  if (remote.status !== "draft") return remote;

  const queuedAt = new Date().toISOString();
  return extractTicket(await updateRemoteTicket(
    remote.ticketId,
    {
      status: "ready-for-chat",
      metadata: {
        ...(remote.metadata || {}),
        execution: {
          ...(remote.metadata?.execution || {}),
          queuedAt
        }
      }
    },
    remote.revision
  ));
}

export async function startRemoteTicket(ticket, options = {}) {
  if (!ticket?.ticketId) throw new Error("Ticket ID is required to request dispatch.");

  let remote = ticket;
  if (remote.status === "draft" || !Number.isInteger(remote.revision)) {
    remote = await setRemoteTicketReady(remote);
  }
  if (!["ready-for-chat", "reopened"].includes(remote.status)) return remote;

  const response = await fetch("/api/ixi-agent/worker/launch", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ticketId: remote.ticketId,
      expectedRevision: remote.revision,
      source: clean(options.source) || "ticket-command"
    })
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Ticket worker launch failed (${response.status}).`);
    error.status = response.status;
    error.code = payload?.error?.code || "IXI_AGENT_WORKER_LAUNCH_FAILED";
    error.details = payload?.error?.details || null;
    throw error;
  }

  return payload?.ticket || payload?.data?.ticket || payload?.data || remote;
}

export async function rateRemoteTicket(ticket, review = {}) {
  if (!ticket?.ticketId) throw new Error("Ticket ID is required for rating.");
  if (!Number.isInteger(ticket.revision) || ticket.revision < 1) {
    throw new Error("A synchronized Ticket revision is required for rating.");
  }
  const score = Number(review.score);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error("Ticket rating must be from 1 to 5.");
  }
  return extractTicket(await updateRemoteTicket(
    ticket.ticketId,
    {
      metadata: {
        ...(ticket.metadata || {}),
        userReview: {
          score,
          note: clean(review.note),
          ratedAt: new Date().toISOString()
        }
      }
    },
    ticket.revision
  ));
}

export async function submitTicketCloseout(ticketId, expectedRevision, closeout = {}) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/closeout`, {
    method: "POST",
    body: JSON.stringify({ expectedRevision, closeout })
  });
}

export async function verifyTicket(ticketId, payload = {}) {
  const expectedRevision = payload.expectedRevision ?? payload.revision;
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
    throw new Error("A valid Ticket revision is required for verification.");
  }

  return request(`/tickets/${encodeURIComponent(ticketId)}/verify`, {
    method: "POST",
    body: JSON.stringify({
      expectedRevision,
      decision: payload.decision || "approve",
      note: payload.note || ""
    })
  });
}

export async function reopenTicket(ticketId, payload = {}) {
  const expectedRevision = payload.expectedRevision ?? payload.revision;
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
    throw new Error("A valid Ticket revision is required to reopen.");
  }

  return request(`/tickets/${encodeURIComponent(ticketId)}/reopen`, {
    method: "POST",
    body: JSON.stringify({
      expectedRevision,
      note: payload.note || ""
    })
  });
}

export async function publishTicketToGithub(ticketId) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/github/publish`, {
    method: "POST",
    body: "{}"
  });
}

export function getTicketApiInfo() {
  const baseUrl = resolveBaseUrl();
  return {
    baseUrl,
    configured: clean(process.env.NEXT_PUBLIC_IXI_TICKET_API_DISABLED) !== "1",
    contract: "ixi-ticket-v1",
    transport: baseUrl === DEFAULT_BASE ? "server-proxy" : "configured-base"
  };
}
