import { resolveAosBrowserSession } from "../../../lib/server/aos/resolveAosBrowserSession";
import { requestIxCoreMos, resolveIxCoreAosContext } from "../../../lib/server/aos/ixiMosInternalClient";
const { buildAttentionSummary } = require("../../../lib/admin-daddy/AdminDaddyAttentionEngine");

function normalizeMosEvent(event = {}) {
  const severity = String(event.severity || event.level || event.priority || "info").toLowerCase();
  return {
    eventId: event.eventId || event.id,
    sourceSystem: event.sourceSystem || event.system || "aos",
    sourceComponent: event.sourceComponent || event.component || "mos-events",
    eventType: event.eventType || event.type || "mos-event",
    severity: ["info", "watch", "action", "critical"].includes(severity) ? severity : "info",
    title: event.title || event.eventType || event.type || "AOS event",
    detail: event.detail || event.message || "",
    targetType: event.targetType || event.objectType || (event.objectId ? "object" : ""),
    targetId: event.targetId || event.objectId || "",
    entityPassportId: event.entityPassportId || "",
    occurredAt: event.occurredAt || event.createdAt || event.timestamp,
    correlationId: event.correlationId || event.commandId || "",
    metrics: event.metrics || {},
    evidence: event.evidence || event.metadata || {},
    actionable: Boolean(event.actionable || severity === "critical" || severity === "action"),
    suggestedCommand: event.suggestedCommand || null
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "GET required." } });
  }

  try {
    const session = await resolveAosBrowserSession(req, res);
    const context = await resolveIxCoreAosContext({ session });
    const payload = await requestIxCoreMos({
      path: `/events?entityId=${encodeURIComponent(context.entityId)}`,
      principalId: context.userId,
      entityId: context.entityId
    });
    const rawEvents = Array.isArray(payload?.events) ? payload.events : [];
    const summary = buildAttentionSummary(rawEvents.map(normalizeMosEvent));

    return res.status(200).json({
      ok: true,
      live: true,
      source: "/mos/v1/events",
      entityId: context.entityId,
      ...summary
    });
  } catch (error) {
    return res.status(Number(error?.status || 500)).json({
      ok: false,
      live: false,
      error: {
        code: error?.code || "ADMIN_DADDY_ATTENTION_FAILED",
        message: error?.message || "Admin Daddy could not load the MOS event stream."
      }
    });
  }
}
