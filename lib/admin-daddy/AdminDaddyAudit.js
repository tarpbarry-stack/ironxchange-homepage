const { createCorrelationId } = require("./AdminDaddyContracts");

const AUDIT_STATUS = Object.freeze({
  REQUESTED: "requested",
  AUTHORIZED: "authorized",
  DENIED: "denied",
  STARTED: "started",
  SUCCEEDED: "succeeded",
  FAILED: "failed"
});

function clean(value) {
  return String(value ?? "").trim();
}

function buildAuditRecord(input = {}) {
  return {
    eventId: clean(input.eventId) || createCorrelationId("AUD"),
    correlationId: clean(input.correlationId) || createCorrelationId("ADM"),
    actorPassportId: clean(input.actorPassportId),
    actorCompanyPassportId: clean(input.actorCompanyPassportId),
    capability: clean(input.capability),
    commandType: clean(input.commandType),
    targetType: clean(input.targetType),
    targetId: clean(input.targetId),
    reason: clean(input.reason),
    requestedAt: clean(input.requestedAt) || new Date().toISOString(),
    completedAt: clean(input.completedAt),
    status: Object.values(AUDIT_STATUS).includes(input.status) ? input.status : AUDIT_STATUS.REQUESTED,
    before: input.before ?? null,
    after: input.after ?? null,
    error: input.error ?? null,
    sessionId: clean(input.sessionId),
    sourceIp: clean(input.sourceIp),
    metadata: input.metadata && typeof input.metadata === "object" ? input.metadata : {}
  };
}

/**
 * Persistence is intentionally injected. Admin Daddy must not silently invent
 * a browser/session audit store. IX-Core should provide the durable append-only
 * writer before destructive command adapters are enabled.
 */
async function appendAuditRecord(record, { writer } = {}) {
  const normalized = buildAuditRecord(record);
  if (typeof writer !== "function") {
    const error = new Error("Durable Admin Daddy audit writer is not configured.");
    error.code = "ADMIN_DADDY_AUDIT_WRITER_REQUIRED";
    throw error;
  }
  await writer(normalized);
  return normalized;
}

module.exports = {
  AUDIT_STATUS,
  buildAuditRecord,
  appendAuditRecord
};
