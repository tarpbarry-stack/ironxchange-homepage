const clean = value => String(value ?? "").trim();
const array = value => Array.isArray(value) ? value : [];
const copy = value => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();

export function reviseIXIQuote(record = {}, nextDraft = {}, { reason = "" } = {}, actor = {}) {
  const timestamp = now();
  const previousRevision = Math.max(1, Number(record?.identity?.revision || 1));
  const revision = previousRevision + 1;
  const snapshot = copy({
    revision: previousRevision,
    status: record.status,
    customer: record.customer,
    asset: record.asset,
    commercial: record.commercial,
    totals: record.totals,
    presentation: record.presentation,
    archivedAt: timestamp
  });
  return {
    ...nextDraft,
    identity: { ...nextDraft.identity, ...record.identity, revision },
    financialBinding: record.financialBinding,
    acceptance: record.acceptance,
    related: record.related,
    status: "draft",
    revisions: [...array(record.revisions), snapshot],
    activity: [...array(record.activity), {
      eventId: `QT-REV-${Date.now()}`,
      type: "quote-revised",
      occurredAt: timestamp,
      previousRevision,
      nextRevision: revision,
      reason: clean(reason),
      actorId: clean(actor.passportId || actor.employeeId || actor.userId),
      actorLabel: clean(actor.label || actor.displayName || actor.name)
    }],
    audit: { ...(record.audit || {}), updatedAt: timestamp }
  };
}

export default { reviseIXIQuote };
