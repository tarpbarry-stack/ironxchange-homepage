const { heartbeatTicket } = require("../../../../lib/ixi-agent/ixiAgentBridge");

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
    return jsonError(res, 400, "IXI_CHAT_HEARTBEAT_INPUT_INVALID", "ticketId, expectedRevision, and a valid ixi-chat-* runId are required.");
  }

  try {
    const result = await heartbeatTicket({
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
      ...result
    });
  } catch (error) {
    return jsonError(
      res,
      Number(error.status) || 500,
      error.code || "IXI_CHAT_HEARTBEAT_FAILED",
      error.message || "Unable to renew IXI Ticket lease.",
      error.details || null
    );
  }
}
