const crypto = require("crypto");
const { getIXICoreBaseUrl } = require("../ixi-tickets/ixiTicketProxy");
const { getTicket, leaseExpired, requestDispatch } = require("./ixiAgentBridge");
const { createWorkerResponse, getWorkerResponse } = require("./ixiAgentOpenAI");

function clean(value) {
  return String(value ?? "").trim();
}

function nowIso() {
  return new Date().toISOString();
}

function makeRunId() {
  return `ixi-run-${crypto.randomUUID()}`;
}

function buildInstructions(ticket, runId, agentId, { recovery = false } = {}) {
  return [
    "You are an IXI production execution worker. The IXI Ticket is the authoritative work order.",
    `Ticket ID: ${ticket.ticketId}`,
    `Expected revision for claim: ${ticket.revision}`,
    `Agent ID: ${agentId}`,
    `Run ID: ${runId}`,
    recovery ? "This is an expired-lease recovery run. The previous execution lease is abandoned; do not assume any prior work succeeded unless the Ticket closeout/audit proves it." : "This is a fresh dispatch run.",
    "Your first IXI Ticket action MUST be claim_ticket using exactly those identifiers. If claim fails, stop and do no work.",
    "Use the full work packet returned by claim_ticket as the frozen scope. Never silently broaden it.",
    "Use the execution MCP for real repository/system actions. Never fabricate changes, commits, PRs, deployments, or tests.",
    "Renew heartbeat_ticket during long-running work using the newest Ticket revision returned by the prior Ticket tool call.",
    "If the execution lease expires, stop. The Ticket must be explicitly reclaimed before work continues.",
    "If blocked, report the exact blocker and remaining risk; do not claim success.",
    "When work is actually complete, call submit_ticket_closeout using the newest Ticket revision and the same agentId/runId.",
    "Closeout must contain exact files changed, tests, before/after, risks, notes, editResults, any PR/commit references, and your 1-5 result/confidence rating.",
    "The owner performs final verification and closure. Execute the Ticket; do not merely describe how it could be done."
  ].join("\n");
}

async function markLaunchFailure(ticket, runId, error) {
  if (!ticket?.ticketId || !Number.isInteger(ticket.revision)) return;
  try {
    await fetch(`${getIXICoreBaseUrl()}/tickets/v1/tickets/${encodeURIComponent(ticket.ticketId)}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-request-id": `ixi-worker-fail-${Date.now()}`,
        "x-ixi-source": "ixi-agent-worker-v1"
      },
      body: JSON.stringify({
        expectedRevision: ticket.revision,
        patch: {
          metadata: {
            ...(ticket.metadata || {}),
            dispatch: {
              ...(ticket.metadata?.dispatch || {}),
              state: "launch-failed",
              runId,
              failedAt: nowIso(),
              failureCode: error?.code || "IXI_AGENT_LAUNCH_FAILED",
              failureMessage: clean(error?.message).slice(0, 1000)
            }
          }
        }
      })
    });
  } catch {
    // Failure telemetry must never mask the original launch error.
  }
}

async function startResponseForTicket(ticket, runId, agentId, recovery) {
  const response = await createWorkerResponse({
    ticket,
    runId,
    agentId,
    instructions: buildInstructions(ticket, runId, agentId, { recovery })
  });
  return {
    ok: true,
    ticket,
    worker: {
      state: response.status || "queued",
      responseId: response.id,
      runId,
      agentId,
      model: response.model || clean(process.env.IXI_AGENT_MODEL) || "gpt-5.6-sol",
      recovery,
      launchedAt: nowIso()
    }
  };
}

async function launchTicketWorker({ ticketId, expectedRevision, source = "ticket-command" }) {
  const runId = makeRunId();
  const agentId = "ixi-openai-worker";
  let dispatched = null;

  try {
    dispatched = await requestDispatch({
      ticketId,
      expectedRevision,
      requestedBy: "owner",
      source: clean(source) || "ticket-command",
      runId
    });
    const result = await startResponseForTicket(dispatched.ticket, runId, agentId, false);
    return { ...result, dispatch: dispatched.dispatch };
  } catch (error) {
    if (dispatched?.ticket) await markLaunchFailure(dispatched.ticket, runId, error);
    throw error;
  }
}

async function recoverTicketWorker({ ticketId, expectedRevision }) {
  const runId = makeRunId();
  const agentId = "ixi-openai-worker";
  const ticket = await getTicket(ticketId);
  if (Number(ticket.revision) !== Number(expectedRevision)) {
    const error = new Error("Ticket revision changed before recovery launch.");
    error.status = 409;
    error.code = "IXI_AGENT_RECOVERY_REVISION_CONFLICT";
    throw error;
  }
  if (ticket.status !== "working" || !leaseExpired(ticket)) {
    const error = new Error("Only a WORKING Ticket with an expired or missing execution lease can be recovered.");
    error.status = 409;
    error.code = "IXI_AGENT_RECOVERY_NOT_ELIGIBLE";
    throw error;
  }
  try {
    return await startResponseForTicket(ticket, runId, agentId, true);
  } catch (error) {
    await markLaunchFailure(ticket, runId, error);
    throw error;
  }
}

module.exports = {
  getWorkerResponse,
  launchTicketWorker,
  recoverTicketWorker
};
