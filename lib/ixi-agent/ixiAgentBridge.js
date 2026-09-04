const { getIXICoreBaseUrl } = require("../ixi-tickets/ixiTicketProxy");

const READY_STATUSES = new Set(["ready-for-chat", "reopened"]);
const REPOSITORIES = ["ironxchange-homepage", "ixi-core", "other"];
const DISPATCH_DEDUPE_MS = 2 * 60 * 1000;

function clean(value) {
  return String(value ?? "").trim();
}

function nowIso() {
  return new Date().toISOString();
}

function toMillis(value) {
  const millis = Date.parse(clean(value));
  return Number.isFinite(millis) ? millis : 0;
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

function leaseExpired(ticket, at = Date.now()) {
  if (ticket?.status !== "working") return false;
  const expiresAt = toMillis(ticket?.metadata?.execution?.leaseExpiresAt);
  return !expiresAt || expiresAt <= at;
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

async function listTicketsByStatus(status, { repository, limit = 250 } = {}) {
  const repos = clean(repository) ? [clean(repository)] : REPOSITORIES;
  const rows = [];
  for (const repo of repos) {
    const query = new URLSearchParams({ repository: repo, status, limit: String(limit) });
    rows.push(...extractTickets(await ticketRequest(`/tickets?${query.toString()}`)));
  }
  const deduped = new Map();
  for (const ticket of rows) {
    const previous = deduped.get(ticket.ticketId);
    if (!previous || Number(ticket.revision || 0) > Number(previous.revision || 0)) deduped.set(ticket.ticketId, ticket);
  }
  return Array.from(deduped.values());
}

async function listReadyTickets({ repository, limit = 250 } = {}) {
  const rows = [
    ...(await listTicketsByStatus("ready-for-chat", { repository, limit })),
    ...(await listTicketsByStatus("reopened", { repository, limit }))
  ];

  const deduped = new Map();
  for (const ticket of rows) {
    const previous = deduped.get(ticket.ticketId);
    if (!previous || Number(ticket.revision || 0) > Number(previous.revision || 0)) deduped.set(ticket.ticketId, ticket);
  }

  return Array.from(deduped.values()).sort((a, b) => {
    const priority = { critical: 4, high: 3, normal: 2, low: 1 };
    const p = (priority[b.priority] || 0) - (priority[a.priority] || 0);
    if (p) return p;
    return String(a.audit?.createdAt || "").localeCompare(String(b.audit?.createdAt || ""));
  });
}

async function listRecoverableTickets({ repository, limit = 250 } = {}) {
  const working = await listTicketsByStatus("working", { repository, limit });
  return working.filter(ticket => leaseExpired(ticket)).sort((a, b) => {
    return toMillis(a.metadata?.execution?.leaseExpiresAt) - toMillis(b.metadata?.execution?.leaseExpiresAt);
  });
}

function buildWorkPacket(ticket) {
  const execution = ticket?.metadata?.execution || {};
  return {
    contract: "ixi-agent-work-packet",
    contractVersion: "1.1.0",
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
      lastHeartbeatAt: execution.lastHeartbeatAt || "",
      leaseExpiresAt: execution.leaseExpiresAt || "",
      leaseExpired: leaseExpired(ticket)
    },
    dispatch: ticket?.metadata?.dispatch || {},
    audit: ticket.audit || {}
  };
}

async function requestDispatch({ ticketId, expectedRevision, requestedBy = "owner", source = "ticket-command", runId = "" }) {
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

  const priorDispatch = ticket.metadata?.dispatch || {};
  const priorRequestedAt = toMillis(priorDispatch.requestedAt);
  if (priorDispatch.state === "queued" && priorRequestedAt && Date.now() - priorRequestedAt < DISPATCH_DEDUPE_MS) {
    const error = new Error("This Ticket already has an active dispatch request.");
    error.status = 409;
    error.code = "IXI_AGENT_DISPATCH_ALREADY_QUEUED";
    error.details = { runId: priorDispatch.runId || "", requestedAt: priorDispatch.requestedAt || "" };
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
            ...priorDispatch,
            state: "queued",
            requestedAt,
            requestedBy: clean(requestedBy) || "owner",
            source: clean(source) || "ticket-command",
            runId: clean(runId)
          }
        }
      }
    }
  }));

  return { ticket: next, dispatch: next?.metadata?.dispatch || {}, workPacket: buildWorkPacket(next) };
}

async function claimTicket({ ticketId, expectedRevision, agentId, runId, leaseSeconds = 900 }) {
  const ticket = await getTicket(ticketId);
  const isFreshQueueClaim = READY_STATUSES.has(ticket.status);
  const isExpiredReclaim = ticket.status === "working" && leaseExpired(ticket);
  if (!isFreshQueueClaim && !isExpiredReclaim) {
    const error = new Error(ticket.status === "working" ? "Ticket already has an active execution lease." : "Ticket is not available for claim.");
    error.status = 409;
    error.code = ticket.status === "working" ? "IXI_AGENT_CLAIM_LEASE_ACTIVE" : "IXI_AGENT_CLAIM_STATE_INVALID";
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

  const priorExecution = ticket.metadata?.execution || {};
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
            state: isExpiredReclaim ? "reclaimed" : "claimed",
            claimedAt,
            claimedBy: resolvedAgentId,
            runId: resolvedRunId
          },
          execution: {
            ...priorExecution,
            ...(isExpiredReclaim ? {
              reclaimedFrom: {
                agentId: priorExecution.agentId || "",
                runId: priorExecution.runId || "",
                leaseExpiredAt: priorExecution.leaseExpiresAt || ""
              }
            } : {}),
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

  return { ticket: claimed, workPacket: buildWorkPacket(claimed), reclaimed: isExpiredReclaim };
}

function assertActiveLease(ticket, { expectedRevision, agentId, runId, operation }) {
  const execution = ticket.metadata?.execution || {};
  if (Number(expectedRevision) !== Number(ticket.revision)) {
    const error = new Error(`Ticket revision changed before ${operation}.`);
    error.status = 409;
    error.code = `IXI_AGENT_${operation.toUpperCase()}_REVISION_CONFLICT`;
    throw error;
  }
  if (clean(execution.agentId) !== clean(agentId) || clean(execution.runId) !== clean(runId)) {
    const error = new Error(`${operation} does not match the active Ticket lease.`);
    error.status = 409;
    error.code = `IXI_AGENT_${operation.toUpperCase()}_LEASE_MISMATCH`;
    throw error;
  }
  if (leaseExpired(ticket)) {
    const error = new Error(`The Ticket execution lease expired before ${operation}. Reclaim the Ticket before continuing.`);
    error.status = 409;
    error.code = `IXI_AGENT_${operation.toUpperCase()}_LEASE_EXPIRED`;
    throw error;
  }
  return execution;
}

async function heartbeatTicket({ ticketId, expectedRevision, agentId, runId, leaseSeconds = 900 }) {
  const ticket = await getTicket(ticketId);
  if (ticket.status !== "working") {
    const error = new Error("Only WORKING Tickets can receive a heartbeat.");
    error.status = 409;
    error.code = "IXI_AGENT_HEARTBEAT_STATE_INVALID";
    throw error;
  }
  const execution = assertActiveLease(ticket, { expectedRevision, agentId, runId, operation: "heartbeat" });
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
  if (ticket.status !== "working" && ticket.status !== "pr-open") {
    const error = new Error("Only WORKING or PR OPEN Tickets can be closed out.");
    error.status = 409;
    error.code = "IXI_AGENT_CLOSEOUT_STATE_INVALID";
    throw error;
  }
  const execution = assertActiveLease(ticket, { expectedRevision, agentId, runId, operation: "closeout" });

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
  leaseExpired,
  listReadyTickets,
  listRecoverableTickets,
  requestDispatch,
  submitAgentCloseout
};
