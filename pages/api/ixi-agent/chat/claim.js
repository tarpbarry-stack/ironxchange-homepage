const { claimTicket } = require("../../../../lib/ixi-agent/ixiAgentBridge");

function clean(value) {
  return String(value ?? "").trim();
}

function jsonError(res, status, code, message, details = null) {
  return res.status(status).json({ ok: false, contract: "ixi-chat-bridge", error: { code, message, details } });
}

function validRunId(value) {
  return /^ixi-chat-[A-Za-z0-9._:-]{8,120}$/.test(value);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return jsonError(res, 405, "IXI_CHAT_METHOD_NOT_ALLOWED", "GET required.");
  }

  const ticketId = clean(req.query?.ticketId);
  const expectedRevision = Number(req.query?.expectedRevision);
  const runId = clean(req.query?.runId);
  if (!ticketId || !Number.isInteger(expectedRevision) || expectedRevision < 1 || !validRunId(runId)) {
    return jsonError(res, 400, "IXI_CHAT_CLAIM_INPUT_INVALID", "ticketId, expectedRevision, and a valid ixi-chat-* runId are required.");
  }

  try {
    const result = await claimTicket({
      ticketId,
      expectedRevision,
      agentId: "chatgpt-connected-github",
      runId,
      leaseSeconds: 3600
    });

    return res.status(200).json({
      ok: true,
      contract: "ixi-chat-bridge",
      contractVersion: "1.0.0",
      ...result,
      closeoutArtifact: {
        repository: result.ticket.repository,
        path: `.ixi/ticket-closeouts/${result.ticket.ticketId}/${runId}.json`,
        format: "ixi-ticket-closeout-v1"
      }
    });
  } catch (error) {
    return jsonError(
      res,
      Number(error.status) || 500,
      error.code || "IXI_CHAT_CLAIM_FAILED",
      error.message || "Unable to claim IXI Ticket.",
      error.details || null
    );
  }
}
