const { launchTicketWorker } = require("../../../../lib/ixi-agent/ixiAgentWorker");

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

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: { code: "IXI_AGENT_METHOD_NOT_ALLOWED", message: "POST required." } });
  }
  if (!sameOrigin(req)) {
    return res.status(403).json({ ok: false, error: { code: "IXI_AGENT_ORIGIN_DENIED", message: "Cross-origin worker launch denied." } });
  }

  const ticketId = clean(req.body?.ticketId);
  const expectedRevision = Number(req.body?.expectedRevision);
  if (!ticketId || !Number.isInteger(expectedRevision) || expectedRevision < 1) {
    return res.status(400).json({ ok: false, error: { code: "IXI_AGENT_LAUNCH_INPUT_INVALID", message: "ticketId and expectedRevision are required." } });
  }

  try {
    const result = await launchTicketWorker({
      ticketId,
      expectedRevision,
      source: clean(req.body?.source) || "ticket-command"
    });
    return res.status(202).json(result);
  } catch (error) {
    return res.status(Number(error.status) || 500).json({
      ok: false,
      error: {
        code: error.code || "IXI_AGENT_WORKER_LAUNCH_FAILED",
        message: error.message || "IXI Agent Worker launch failed.",
        details: error.details || null
      }
    });
  }
}
