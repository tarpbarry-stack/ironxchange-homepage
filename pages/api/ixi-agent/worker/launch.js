const {
  getTicket,
  leaseExpired,
  requestDispatch
} = require("../../../../lib/ixi-agent/ixiAgentBridge");

export const config = {
  api: { bodyParser: { sizeLimit: "256kb" } }
};

function clean(value) {
  return String(value ?? "").trim();
}

function expectedOrigin(req) {
  const proto = clean(req.headers?.["x-forwarded-proto"]).split(",")[0] || "https";
  const host = clean(req.headers?.["x-forwarded-host"]).split(",")[0] || clean(req.headers?.host);
  return host ? `${proto}://${host}` : "";
}

function sameOrigin(req) {
  const origin = clean(req.headers?.origin);
  if (!origin) return true;
  return origin === expectedOrigin(req);
}

function readiness() {
  return {
    ok: true,
    service: "ixi-connected-chat-dispatch",
    contractVersion: "1.0.0",
    mode: "connected-chat",
    readyForExecution: true,
    requiresNewGithubCredentials: false,
    requiresOpenAIWorkerCredentials: false,
    intakeRoute: "/api/ixi-agent/chat/next"
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method === "GET") return res.status(200).json(readiness());

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: { code: "IXI_AGENT_METHOD_NOT_ALLOWED", message: "GET or POST required." } });
  }
  if (!sameOrigin(req)) {
    return res.status(403).json({ ok: false, error: { code: "IXI_AGENT_ORIGIN_DENIED", message: "Cross-origin Ticket dispatch denied." } });
  }

  const ticketId = clean(req.body?.ticketId);
  const expectedRevision = Number(req.body?.expectedRevision);
  if (!ticketId || !Number.isInteger(expectedRevision) || expectedRevision < 1) {
    return res.status(400).json({ ok: false, error: { code: "IXI_AGENT_DISPATCH_INPUT_INVALID", message: "ticketId and expectedRevision are required." } });
  }

  try {
    const recovery = req.body?.recovery === true;
    if (recovery) {
      const ticket = await getTicket(ticketId);
      if (Number(ticket.revision) !== expectedRevision) {
        return res.status(409).json({ ok: false, error: { code: "IXI_AGENT_RECOVERY_REVISION_CONFLICT", message: "Ticket revision changed before recovery dispatch." } });
      }
      if (!leaseExpired(ticket)) {
        return res.status(409).json({ ok: false, error: { code: "IXI_AGENT_RECOVERY_NOT_AVAILABLE", message: "Ticket has an active execution lease and cannot be recovered." } });
      }
      return res.status(202).json({
        ok: true,
        ticket,
        mode: "connected-chat-recovery",
        message: "Recoverable Ticket is available to connected Chat and remains WORKING until Chat reclaims it."
      });
    }

    const result = await requestDispatch({
      ticketId,
      expectedRevision,
      requestedBy: "owner",
      source: clean(req.body?.source) || "ticket-command"
    });

    return res.status(202).json({
      ok: true,
      ...result,
      mode: "connected-chat",
      message: "Ticket queued for connected Chat. It remains READY until Chat claims it."
    });
  } catch (error) {
    return res.status(Number(error.status) || 500).json({
      ok: false,
      error: {
        code: error.code || "IXI_AGENT_DISPATCH_FAILED",
        message: error.message || "IXI connected Chat dispatch failed.",
        details: error.details || null
      }
    });
  }
}
