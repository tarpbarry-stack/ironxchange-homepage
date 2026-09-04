const { getTicket, submitAgentCloseout } = require("../../../../lib/ixi-agent/ixiAgentBridge");

const REPOSITORY_MAP = Object.freeze({
  "ironxchange-homepage": "tarpbarry-stack/ironxchange-homepage"
});

function clean(value) {
  return String(value ?? "").trim();
}

function jsonError(res, status, code, message, details = null) {
  return res.status(status).json({ ok: false, contract: "ixi-chat-bridge", error: { code, message, details } });
}

function validRunId(value) {
  return /^ixi-chat-[A-Za-z0-9._:-]{8,120}$/.test(value);
}

function validCommitSha(value) {
  return /^[0-9a-f]{40}$/i.test(value);
}

function validateCloseoutArtifact(payload, { ticketId, runId, expectedRevision }) {
  if (!payload || payload.contract !== "ixi-ticket-closeout" || payload.contractVersion !== "1.0.0") {
    throw Object.assign(new Error("Closeout artifact contract is invalid."), { status: 422, code: "IXI_CHAT_CLOSEOUT_CONTRACT_INVALID" });
  }
  if (clean(payload.ticketId) !== ticketId || clean(payload.runId) !== runId) {
    throw Object.assign(new Error("Closeout artifact does not match this Ticket execution run."), { status: 409, code: "IXI_CHAT_CLOSEOUT_IDENTITY_MISMATCH" });
  }
  if (Number(payload.expectedRevision) !== expectedRevision) {
    throw Object.assign(new Error("Closeout artifact revision does not match the active Ticket revision."), { status: 409, code: "IXI_CHAT_CLOSEOUT_REVISION_MISMATCH" });
  }
  if (!clean(payload.closeout?.summary)) {
    throw Object.assign(new Error("Closeout artifact requires a summary."), { status: 422, code: "IXI_CHAT_CLOSEOUT_SUMMARY_REQUIRED" });
  }
  return payload.closeout;
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
  const commitSha = clean(req.query?.commitSha);
  if (!ticketId || !Number.isInteger(expectedRevision) || expectedRevision < 1 || !validRunId(runId) || !validCommitSha(commitSha)) {
    return jsonError(res, 400, "IXI_CHAT_CLOSEOUT_INPUT_INVALID", "ticketId, expectedRevision, runId, and a 40-character commitSha are required.");
  }

  try {
    const ticket = await getTicket(ticketId);
    const repository = REPOSITORY_MAP[ticket.repository];
    if (!repository) {
      return jsonError(res, 409, "IXI_CHAT_REPOSITORY_UNSUPPORTED", `Connected Chat V1 does not yet support repository ${ticket.repository}.`);
    }

    const artifactPath = `.ixi/ticket-closeouts/${ticketId}/${runId}.json`;
    const rawUrl = `https://raw.githubusercontent.com/${repository}/${commitSha}/${artifactPath}`;
    const upstream = await fetch(rawUrl, {
      method: "GET",
      headers: { Accept: "application/json", "User-Agent": "IXI-Ticket-Chat-Bridge/1.0" },
      cache: "no-store"
    });
    if (!upstream.ok) {
      return jsonError(res, 424, "IXI_CHAT_CLOSEOUT_ARTIFACT_UNAVAILABLE", `Closeout artifact could not be loaded from commit ${commitSha}.`, { status: upstream.status, artifactPath });
    }

    const text = await upstream.text();
    if (text.length > 131072) {
      return jsonError(res, 413, "IXI_CHAT_CLOSEOUT_ARTIFACT_TOO_LARGE", "Closeout artifact exceeds 128 KB.");
    }

    let artifact = null;
    try {
      artifact = JSON.parse(text);
    } catch {
      return jsonError(res, 422, "IXI_CHAT_CLOSEOUT_ARTIFACT_JSON_INVALID", "Closeout artifact is not valid JSON.");
    }

    const closeout = validateCloseoutArtifact(artifact, { ticketId, runId, expectedRevision });
    const result = await submitAgentCloseout({
      ticketId,
      expectedRevision,
      agentId: "chatgpt-connected-github",
      runId,
      closeout: {
        ...closeout,
        sourceArtifact: {
          repository,
          commitSha,
          path: artifactPath
        }
      }
    });

    return res.status(200).json({
      ok: true,
      contract: "ixi-chat-bridge",
      contractVersion: "1.0.0",
      ...result,
      sourceArtifact: { repository, commitSha, path: artifactPath }
    });
  } catch (error) {
    return jsonError(
      res,
      Number(error.status) || 500,
      error.code || "IXI_CHAT_CLOSEOUT_IMPORT_FAILED",
      error.message || "Unable to import IXI Ticket closeout.",
      error.details || null
    );
  }
}
