const { ADMIN_SEVERITY, normalizeAdminEvent } = require("./AdminDaddyContracts");

const SEVERITY_WEIGHT = Object.freeze({
  [ADMIN_SEVERITY.CRITICAL]: 400,
  [ADMIN_SEVERITY.ACTION]: 300,
  [ADMIN_SEVERITY.WATCH]: 200,
  [ADMIN_SEVERITY.INFO]: 100
});

function clean(value) {
  return String(value ?? "").trim();
}

function fingerprint(event = {}) {
  return [
    clean(event.sourceSystem),
    clean(event.eventType),
    clean(event.targetType),
    clean(event.targetId),
    clean(event.title)
  ].join("::").toLowerCase();
}

function scoreEvent(event = {}) {
  const base = SEVERITY_WEIGHT[event.severity] || 0;
  const amount = Number(event.metrics?.amount || 0);
  const affected = Number(event.metrics?.affected || 0);
  const ageMinutes = Math.max(0, (Date.now() - new Date(event.occurredAt || Date.now()).getTime()) / 60000);
  const moneyWeight = Number.isFinite(amount) ? Math.min(Math.abs(amount) / 1000, 100) : 0;
  const affectedWeight = Number.isFinite(affected) ? Math.min(affected, 100) : 0;
  const ageWeight = event.severity === ADMIN_SEVERITY.CRITICAL ? Math.min(ageMinutes / 10, 50) : 0;
  return Math.round(base + moneyWeight + affectedWeight + ageWeight);
}

function aggregateAdminAttention(events = []) {
  const grouped = new Map();

  for (const raw of Array.isArray(events) ? events : []) {
    const event = normalizeAdminEvent(raw);
    const key = fingerprint(event);
    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, { ...event, occurrenceCount: 1, score: scoreEvent(event) });
      continue;
    }

    const newer = new Date(event.occurredAt).getTime() > new Date(current.occurredAt).getTime();
    const merged = newer ? { ...current, ...event } : { ...event, ...current };
    merged.occurrenceCount = current.occurrenceCount + 1;
    merged.score = Math.max(current.score, scoreEvent(event)) + Math.min(merged.occurrenceCount - 1, 25);
    grouped.set(key, merged);
  }

  return Array.from(grouped.values()).sort((a, b) => b.score - a.score);
}

function buildAttentionSummary(events = []) {
  const attention = aggregateAdminAttention(events);
  const counts = { critical: 0, action: 0, watch: 0, info: 0 };
  attention.forEach(item => {
    if (Object.prototype.hasOwnProperty.call(counts, item.severity)) counts[item.severity] += 1;
  });

  return {
    generatedAt: new Date().toISOString(),
    counts,
    needsYou: attention.filter(item => item.severity === ADMIN_SEVERITY.CRITICAL || item.severity === ADMIN_SEVERITY.ACTION),
    watch: attention.filter(item => item.severity === ADMIN_SEVERITY.WATCH),
    information: attention.filter(item => item.severity === ADMIN_SEVERITY.INFO),
    all: attention
  };
}

module.exports = {
  fingerprint,
  scoreEvent,
  aggregateAdminAttention,
  buildAttentionSummary
};
