const { getWorkerResponse } = require("../../../../lib/ixi-agent/ixiAgentWorker");

function clean(value) {
  return String(value ?? "").trim();
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "IXI_AGENT_METHOD_NOT_ALLOWED", message: "GET required." } });
  }
  const responseId = clean(req.query?.responseId);
  if (!responseId) {
    return res.status(400).json({ ok: false, error: { code: "IXI_AGENT_RESPONSE_ID_REQUIRED", message: "responseId is required." } });
  }
  try {
    const response = await getWorkerResponse(responseId);
    return res.status(200).json({
      ok: true,
      worker: {
        responseId: response.id,
        status: response.status,
        model: response.model,
        createdAt: response.created_at,
        completedAt: response.completed_at || null,
        error: response.error || null,
        incompleteDetails: response.incomplete_details || null
      }
    });
  } catch (error) {
    return res.status(Number(error.status) || 500).json({ ok: false, error: { code: error.code || "IXI_AGENT_STATUS_FAILED", message: error.message || "Worker status failed." } });
  }
}
