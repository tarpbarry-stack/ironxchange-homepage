const crypto = require("crypto");
const { getIXICoreBaseUrl } = require("../ixi-tickets/ixiTicketProxy");
const { requestDispatch } = require("./ixiAgentBridge");
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

function buildInstructions(ticket, runId, agentId) {
  return [
    "You are an IXI production execution worker. The IXI Ticket is the authoritative work order.",
    `Ticket ID: ${ticket.ticketId}`,
    `Expected revision for claim: ${ticket.revision}`,
    `Agent ID: ${agentId}`,
    `Run ID: ${runId}`,
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

    const ticket = dispatched.ticket;
    const response = await createWorkerResponse({
      ticket,
      runId,
      agentId,
      instructions: buildInstructions(ticket, runId, agentId)
    });

    return {
      ok: true,
      ticket,
      dispatch: dispatched.dispatch,
      worker: {
        state: response.status || "queued",
        responseId: response.id,
        runId,
        agentId,
        model: response.model || clean(process.env.IXI_AGENT_MODEL) || "gpt-5.6-sol",
        launchedAt: nowIso()
      }
    };
  } catch (error) {
    if (dispatched?.ticket) await markLaunchFailure(dispatched.ticket, runId, error);
    throw error;
  }
}

module.exports = {
  getWorkerResponse,
  launchTicketWorker
};
