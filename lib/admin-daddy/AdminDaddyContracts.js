const ADMIN_SEVERITY = Object.freeze({
  INFO: "info",
  WATCH: "watch",
  ACTION: "action",
  CRITICAL: "critical"
});

const ADMIN_JOB_STATUS = Object.freeze({
  QUEUED: "queued",
  RUNNING: "running",
  SUCCEEDED: "succeeded",
  RETRYING: "retrying",
  FAILED: "failed",
  DEAD: "dead",
  CANCELLED: "cancelled"
});

const ADMIN_SOURCE_SYSTEMS = Object.freeze([
  "aos",
  "passport",
  "authority",
  "marketplace",
  "publishing",
  "sharetribe",
  "acquisition",
  "auction",
  "media",
  "transact",
  "financial",
  "infrastructure",
  "deployment",
  "communications"
]);

function clean(value) {
  return String(value ?? "").trim();
}

function createCorrelationId(prefix = "ADM") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function normalizeAdminCommand(input = {}) {
  const commandType = clean(input.commandType);
  if (!commandType) throw new Error("commandType is required");

  return {
    commandId: clean(input.commandId) || createCorrelationId("CMD"),
    commandType,
    actor: {
      passportId: clean(input.actor?.passportId),
      companyPassportId: clean(input.actor?.companyPassportId)
    },
    target: {
      type: clean(input.target?.type),
      id: clean(input.target?.id),
      passportId: clean(input.target?.passportId)
    },
    payload: input.payload && typeof input.payload === "object" ? input.payload : {},
    reason: clean(input.reason),
    source: "admin-daddy",
    correlationId: clean(input.correlationId) || createCorrelationId("ADM"),
    requestedAt: clean(input.requestedAt) || new Date().toISOString()
  };
}

function normalizeAdminEvent(input = {}) {
  const severity = Object.values(ADMIN_SEVERITY).includes(input.severity)
    ? input.severity
    : ADMIN_SEVERITY.INFO;

  return {
    eventId: clean(input.eventId) || createCorrelationId("EVT"),
    sourceSystem: clean(input.sourceSystem) || "infrastructure",
    sourceComponent: clean(input.sourceComponent),
    eventType: clean(input.eventType) || "notice",
    severity,
    title: clean(input.title) || "Admin Daddy event",
    detail: clean(input.detail),
    targetType: clean(input.targetType),
    targetId: clean(input.targetId),
    entityPassportId: clean(input.entityPassportId),
    occurredAt: clean(input.occurredAt) || new Date().toISOString(),
    correlationId: clean(input.correlationId),
    metrics: input.metrics && typeof input.metrics === "object" ? input.metrics : {},
    evidence: input.evidence && typeof input.evidence === "object" ? input.evidence : {},
    actionable: Boolean(input.actionable),
    suggestedCommand: input.suggestedCommand || null
  };
}

module.exports = {
  ADMIN_SEVERITY,
  ADMIN_JOB_STATUS,
  ADMIN_SOURCE_SYSTEMS,
  createCorrelationId,
  normalizeAdminCommand,
  normalizeAdminEvent
};
