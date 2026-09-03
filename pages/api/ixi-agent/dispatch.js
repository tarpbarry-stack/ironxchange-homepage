const { requestDispatch } = require("../../../lib/ixi-agent/ixiAgentBridge");

function clean(value) {
  return String(value ?? "").trim();
}

function expectedOrigin(req) {
  const proto = clean(req.headers?.["x-forwarded-proto"]).split(",")[0] || "https";
  const host = clean(req.headers?.["x-forwarded-host"]).split(",")[0] || clean(req.headers?.host);
  return host ? `${proto}://${host}` : "";
}

function mutationOriginIsValid(req) {
  const origin = clean(req.headers?.origin);
  if (!origin) return true;
  return origin === expectedOrigin(req);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: { code: "IXI_AGENT_METHOD_NOT_ALLOWED", message: "POST required." } });
  }

  if (!mutationOriginIsValid(req)) {
    return res.status(403).json({ ok: false, error: { code: "IXI_AGENT_ORIGIN_DENIED", message: "Cross-origin dispatch denied." } });
  }

  const ticketId = clean(req.body?.ticketId);
  const expectedRevision = Number(req.body?.expectedRevision);
  if (!ticketId || !Number.isInteger(expectedRevision) || expectedRevision < 1) {
    return res.status(400).json({
      ok: false,
      error: { code: "IXI_AGENT_DISPATCH_INPUT_INVALID", message: "ticketId and current expectedRevision are required." }
    });
  }

  try {
    const result = await requestDispatch({
      ticketId,
      expectedRevision,
      requestedBy: "ixi-ticket-owner",
      source: clean(req.body?.source) || "ticket-command"
    });

    return res.status(200).json({
      ok: true,
      contract: "ixi-agent-dispatch",
      contractVersion: "1.0.0",
      operation: "dispatch-requested",
      ...result
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      ok: false,
      contract: "ixi-agent-dispatch",
      error: {
        code: error.code || "IXI_AGENT_DISPATCH_FAILED",
        message: error.message || "Ticket dispatch failed.",
        details: error.details || null
      }
    });
  }
}
