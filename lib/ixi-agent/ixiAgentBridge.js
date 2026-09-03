const { getIXICoreBaseUrl } = require("../ixi-tickets/ixiTicketProxy");

const READY_STATUSES = new Set(["ready-for-chat", "reopened"]);
const REPOSITORIES = ["ironxchange-homepage", "ixi-core", "other"];

function clean(value) {
  return String(value ?? "").trim();
}

function nowIso() {
  return new Date().toISOString();
}

function addSeconds(iso, seconds) {
  return new Date(new Date(iso).getTime() + seconds * 1000).toISOString();
}

function requestId(prefix = "ixi-agent") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clampLeaseSeconds(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 900;
  return Math.min(3600, Math.max(60, Math.floor(parsed)));
}

async function ticketRequest(path, { method = "GET", body } = {}) {
  const hasBody = body !== undefined;
  const response = await fetch(`${getIXICoreBaseUrl()}/tickets/v1${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "x-request-id": requestId(),
      "x-ixi-source": "ixi-agent-gateway-v1",
      ...(hasBody ? { "Content-Type": "application/json" } : {})
    },
    ...(hasBody ? { body: JSON.stringify(body) } : {})
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(payload?.error?.message || `IXI Agent Gateway request failed (${response.status}).`);
    error.status = response.status;
    error.code = payload?.error?.code || "IXI_AGENT_UPSTREAM_FAILED";
    error.details = payload?.error?.details || null;
    throw error;
  }

  return payload;
}

function extractTicket(payload) {
  return payload?.ticket || payload?.data?.ticket || payload?.data || payload || null;
}

function extractTickets(payload) {
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

async function getTicket(ticketId) {
  const id = clean(ticketId);
  if (!id) throw new Error("ticketId is required.");
  return extractTicket(await ticketRequest(`/tickets/${encodeURIComponent(id)}`));
}

async function listReadyTickets({ repository, limit = 250 } = {}) {
  const repos = clean(repository) ? [clean(repository)] : REPOSITORIES;
  const statuses = ["ready-for-chat", "reopened"];
  const rows = [];

  for (const repo of repos) {
    for (const status of statuses) {
      const query = new URLSearchParams({ repository: repo, status, limit: String(limit) });
      const found = extractTickets(await ticketRequest(`/tickets?${query.toString()}`));
      rows.push(...found);
    }
  }

  const deduped = new Map();
  for (const ticket of rows) {
    const previous = deduped.get(ticket.ticketId);
    if (!previous || Number(ticket.revision || 0) > Number(previous.revision || 0)) {
      deduped.set(ticket.ticketId, ticket);
    }
  }

  return Array.from(deduped.values()).sort((a, b) => {
    const priority = { critical: 4, high: 3, normal: 2, low: 1 };
    const p = (priority[b.priority] || 0) - (priority[a.priority] || 0);
    if (p) return p;
    return String(a.audit?.createdAt || "").localeCompare(String(b.audit?.createdAt || ""));
  });
}

function buildWorkPacket(ticket) {
  const execution = ticket?.metadata?.execution || {};
  return {
    contract: "ixi-agent-work-packet",
    contractVersion: "1.0.0",
    ticketId: ticket.ticketId,
    displayNumber: ticket.displayNumber,
    revision: ticket.revision,
    status: ticket.status,
    repository: ticket.repository,
    type: ticket.type,
    priority: ticket.priority,
    executionClass: ticket.executionClass,
    headline: ticket.headline || "",
    originalRequest: ticket.originalRequest || "",
    editSections: Array.isArray(ticket.editSections) ? ticket.editSections : [],
    attachments: Array.isArray(ticket.attachments) ? ticket.attachments : [],
    context: ticket.context || {},
    authority: ticket.authority || {},
    execution: {
      assignedTo: execution.assignedTo || "",
      agentId: execution.agentId || "",
      runId: execution.runId || "",
      claimedAt: execution.claimedAt || "",
      startedAt: execution.startedAt || "",
      leaseExpiresAt: execution.leaseExpiresAt || ""
    },
    audit: ticket.audit || {}
  };
}

async function requestDispatch({ ticketId, expectedRevision, requestedBy = "owner", source = "ticket-command" }) {
  const ticket = await getTicket(ticketId);
  if (!READY_STATUSES.has(ticket.status)) {
    const error = new Error("Only READY FOR CHAT or REOPENED Tickets can be dispatched.");
    error.status = 409;
    error.code = "IXI_AGENT_DISPATCH_STATE_INVALID";
    throw error;
  }
  if (Number(expectedRevision) !== Number(ticket.revision)) {
    const error = new Error("Ticket revision changed before dispatch.");
    error.status = 409;
    error.code = "IXI_AGENT_DISPATCH_REVISION_CONFLICT";
    throw error;
  }

  const requestedAt = nowIso();
  const next = extractTicket(await ticketRequest(`/tickets/${encodeURIComponent(ticket.ticketId)}`, {
    method: "PATCH",
    body: {
      expectedRevision: ticket.revision,
      patch: {
        metadata: {
          ...(ticket.metadata || {}),
          dispatch: {
            ...(ticket.metadata?.dispatch || {}),
            state: "queued",
            requestedAt,
            requestedBy: clean(requestedBy) || "owner",
            source: clean(source) || "ticket-command"
          }
        }
      }
    }
  }));

  return {
    ticket: next,
    dispatch: next?.metadata?.dispatch || {},
    workPacket: buildWorkPacket(next)
  };
}

async function claimTicket({ ticketId, expectedRevision, agentId, runId, leaseSeconds = 900 }) {
  const ticket = await getTicket(ticketId);
  if (!READY_STATUSES.has(ticket.status)) {
    const error = new Error("Ticket is not available for claim.");
    error.status = 409;
    error.code = "IXI_AGENT_CLAIM_STATE_INVALID";
    throw error;
  }
  if (Number(expectedRevision) !== Number(ticket.revision)) {
    const error = new Error("Ticket revision changed before claim.");
    error.status = 409;
    error.code = "IXI_AGENT_CLAIM_REVISION_CONFLICT";
    throw error;
  }

  const claimedAt = nowIso();
  const lease = clampLeaseSeconds(leaseSeconds);
  const resolvedAgentId = clean(agentId);
  const resolvedRunId = clean(runId);
  if (!resolvedAgentId || !resolvedRunId) throw new Error("agentId and runId are required to claim a Ticket.");

  const claimed = extractTicket(await ticketRequest(`/tickets/${encodeURIComponent(ticket.ticketId)}`, {
    method: "PATCH",
    body: {
      expectedRevision: ticket.revision,
      patch: {
        status: "working",
        metadata: {
          ...(ticket.metadata || {}),
          dispatch: {
            ...(ticket.metadata?.dispatch || {}),
            state: "claimed",
            claimedAt,
            claimedBy: resolvedAgentId,
            runId: resolvedRunId
          },
          execution: {
            ...(ticket.metadata?.execution || {}),
            assignedTo: resolvedAgentId,
            agentId: resolvedAgentId,
            runId: resolvedRunId,
            claimedAt,
            startedAt: claimedAt,
            lastHeartbeatAt: claimedAt,
            leaseExpiresAt: addSeconds(claimedAt, lease),
            leaseSeconds: lease,
            source: "ixi-agent-gateway-v1"
          }
        }
      }
    }
  }));

  return {
    ticket: claimed,
    workPacket: buildWorkPacket(claimed)
  };
}

async function heartbeatTicket({ ticketId, expectedRevision, agentId, runId, leaseSeconds = 900 }) {
  const ticket = await getTicket(ticketId);
  const execution = ticket.metadata?.execution || {};
  if (ticket.status !== "working") {
    const error = new Error("Only WORKING Tickets can receive a heartbeat.");
    error.status = 409;
    error.code = "IXI_AGENT_HEARTBEAT_STATE_INVALID";
    throw error;
  }
  if (Number(expectedRevision) !== Number(ticket.revision)) {
    const error = new Error("Ticket revision changed before heartbeat.");
    error.status = 409;
    error.code = "IXI_AGENT_HEARTBEAT_REVISION_CONFLICT";
    throw error;
  }
  if (clean(execution.agentId) !== clean(agentId) || clean(execution.runId) !== clean(runId)) {
    const error = new Error("Heartbeat does not match the active Ticket lease.");
    error.status = 409;
    error.code = "IXI_AGENT_HEARTBEAT_LEASE_MISMATCH";
    throw error;
  }

  const heartbeatAt = nowIso();
  const lease = clampLeaseSeconds(leaseSeconds);
  const updated = extractTicket(await ticketRequest(`/tickets/${encodeURIComponent(ticket.ticketId)}`, {
    method: "PATCH",
    body: {
      expectedRevision: ticket.revision,
      patch: {
        metadata: {
          ...(ticket.metadata || {}),
          execution: {
            ...execution,
            lastHeartbeatAt: heartbeatAt,
            leaseExpiresAt: addSeconds(heartbeatAt, lease),
            leaseSeconds: lease
          }
        }
      }
    }
  }));

  return { ticket: updated, workPacket: buildWorkPacket(updated) };
}

async function submitAgentCloseout({ ticketId, expectedRevision, agentId, runId, closeout = {} }) {
  const ticket = await getTicket(ticketId);
  const execution = ticket.metadata?.execution || {};
  if (ticket.status !== "working" && ticket.status !== "pr-open") {
    const error = new Error("Only WORKING or PR OPEN Tickets can be closed out.");
    error.status = 409;
    error.code = "IXI_AGENT_CLOSEOUT_STATE_INVALID";
    throw error;
  }
  if (Number(expectedRevision) !== Number(ticket.revision)) {
    const error = new Error("Ticket revision changed before closeout.");
    error.status = 409;
    error.code = "IXI_AGENT_CLOSEOUT_REVISION_CONFLICT";
    throw error;
  }
  if (clean(execution.agentId) !== clean(agentId) || clean(execution.runId) !== clean(runId)) {
    const error = new Error("Closeout does not match the active Ticket lease.");
    error.status = 409;
    error.code = "IXI_AGENT_CLOSEOUT_LEASE_MISMATCH";
    throw error;
  }

  const normalizedCloseout = {
    ...closeout,
    execution: {
      ...(closeout.execution || {}),
      agentId: clean(agentId),
      runId: clean(runId),
      leaseClaimedAt: execution.claimedAt || "",
      finalHeartbeatAt: execution.lastHeartbeatAt || ""
    }
  };

  const result = await ticketRequest(`/tickets/${encodeURIComponent(ticket.ticketId)}/closeout`, {
    method: "POST",
    body: { expectedRevision: ticket.revision, closeout: normalizedCloseout }
  });

  const closedOut = extractTicket(result);
  return { ticket: closedOut, workPacket: buildWorkPacket(closedOut) };
}

module.exports = {
  buildWorkPacket,
  claimTicket,
  getTicket,
  heartbeatTicket,
  listReadyTickets,
  requestDispatch,
  submitAgentCloseout
};
