const { normalizeAdminEvent, ADMIN_SEVERITY } = require("./AdminDaddyContracts");

function clean(value) {
  return String(value ?? "").trim();
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function serviceEvent({ service, state, latencyMs, errorRate, detail, occurredAt }) {
  const normalizedState = clean(state).toLowerCase();
  const severity = normalizedState === "failed"
    ? ADMIN_SEVERITY.CRITICAL
    : normalizedState === "degraded"
      ? ADMIN_SEVERITY.ACTION
      : normalizedState === "unknown"
        ? ADMIN_SEVERITY.WATCH
        : ADMIN_SEVERITY.INFO;

  return normalizeAdminEvent({
    sourceSystem: "infrastructure",
    sourceComponent: clean(service),
    eventType: "service-health",
    severity,
    title: `${clean(service) || "Service"} ${normalizedState || "unknown"}`,
    detail: clean(detail),
    targetType: "service",
    targetId: clean(service),
    occurredAt,
    metrics: {
      latencyMs: asNumber(latencyMs),
      errorRate: asNumber(errorRate)
    },
    actionable: severity !== ADMIN_SEVERITY.INFO
  });
}

function jobEvent(job = {}) {
  const status = clean(job.status).toLowerCase();
  const severity = status === "dead"
    ? ADMIN_SEVERITY.CRITICAL
    : status === "failed"
      ? ADMIN_SEVERITY.ACTION
      : status === "retrying"
        ? ADMIN_SEVERITY.WATCH
        : ADMIN_SEVERITY.INFO;

  return normalizeAdminEvent({
    sourceSystem: clean(job.system) || "infrastructure",
    sourceComponent: clean(job.jobType) || "job",
    eventType: `job-${status || "unknown"}`,
    severity,
    title: `${clean(job.jobType) || "Job"} ${status || "unknown"}`,
    detail: clean(job.lastError),
    targetType: "job",
    targetId: clean(job.jobId),
    occurredAt: job.completedAt || job.startedAt || job.createdAt,
    correlationId: clean(job.correlationId),
    metrics: { attempts: asNumber(job.attempts) },
    evidence: { targetId: clean(job.targetId) },
    actionable: status === "dead" || status === "failed",
    suggestedCommand: job.retryable ? { commandType: `${clean(job.system)}.retry`, target: { type: "job", id: clean(job.jobId) } } : null
  });
}

function dataQualityEvent(input = {}) {
  return normalizeAdminEvent({
    sourceSystem: clean(input.sourceSystem) || "aos",
    sourceComponent: clean(input.sourceComponent) || "data-quality",
    eventType: clean(input.eventType) || "data-quality-exception",
    severity: input.severity || ADMIN_SEVERITY.WATCH,
    title: clean(input.title) || "Data quality exception",
    detail: clean(input.detail),
    targetType: clean(input.targetType),
    targetId: clean(input.targetId),
    entityPassportId: clean(input.entityPassportId),
    occurredAt: input.occurredAt,
    metrics: { affected: asNumber(input.affected) },
    evidence: input.evidence,
    actionable: Boolean(input.actionable),
    suggestedCommand: input.suggestedCommand || null
  });
}

module.exports = {
  serviceEvent,
  jobEvent,
  dataQualityEvent
};
