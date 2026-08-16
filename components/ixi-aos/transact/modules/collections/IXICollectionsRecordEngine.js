const clean = value => String(value ?? "").trim();
const arr = value => Array.isArray(value) ? value : [];
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = value => Math.round(num(value) * 100) / 100;
const now = () => new Date().toISOString();

function actor(source = {}) {
  return {
    actorId: clean(source.passportId || source.employeeId || source.userId || source.id),
    actorLabel: clean(source.displayName || source.name || source.label)
  };
}

function event(type, source = {}, extra = {}) {
  return {
    eventId: `COLL-${type.toUpperCase()}-${Date.now()}`,
    type,
    occurredAt: now(),
    ...actor(source),
    ...extra
  };
}

export function logIXICollectionContact(record = {}, input = {}, source = {}) {
  const contact = {
    contactId: clean(input.contactId) || `CONTACT-${Date.now()}`,
    type: clean(input.type || "call"),
    direction: clean(input.direction || "outbound"),
    contactName: clean(input.contactName),
    summary: clean(input.summary),
    outcome: clean(input.outcome),
    occurredAt: clean(input.occurredAt) || now(),
    ...actor(source)
  };
  const activity = event("contact-logged", source, { contactId: contact.contactId, contactType: contact.type, outcome: contact.outcome });
  return {
    ...record,
    contacts: [...arr(record.contacts), contact],
    assignment: { ...(record.assignment || {}), nextActionAt: clean(input.nextActionAt || record.assignment?.nextActionAt) },
    activity: [...arr(record.activity), activity],
    audit: { ...(record.audit || {}), updatedAt: activity.occurredAt }
  };
}

export function addIXIPromiseToPay(record = {}, input = {}, source = {}) {
  const amount = money(input.amount);
  if (!(amount > 0)) throw new Error("Promise amount must be greater than zero");
  if (!clean(input.dueDate)) throw new Error("Promise due date is required");
  const promise = {
    promiseId: clean(input.promiseId) || `PTP-${Date.now()}`,
    amount,
    dueDate: clean(input.dueDate),
    note: clean(input.note),
    status: "pending",
    createdAt: now(),
    ...actor(source)
  };
  const activity = event("promise-created", source, { promiseId: promise.promiseId, amount, dueDate: promise.dueDate });
  return {
    ...record,
    status: "promise-pending",
    promises: [...arr(record.promises), promise],
    assignment: { ...(record.assignment || {}), nextActionAt: promise.dueDate },
    activity: [...arr(record.activity), activity],
    audit: { ...(record.audit || {}), updatedAt: activity.occurredAt }
  };
}

export function resolveIXIPromise(record = {}, promiseId = "", status = "kept", source = {}) {
  const nextStatus = status === "kept" ? "kept" : "broken";
  const promises = arr(record.promises).map(item => item.promiseId === promiseId ? { ...item, status: nextStatus, resolvedAt: now() } : item);
  const activity = event(`promise-${nextStatus}`, source, { promiseId });
  const hasPending = promises.some(item => item.status === "pending");
  return {
    ...record,
    promises,
    status: hasPending ? "promise-pending" : record.disputes?.some(item => item.status === "open") ? "disputed" : "open",
    activity: [...arr(record.activity), activity],
    audit: { ...(record.audit || {}), updatedAt: activity.occurredAt }
  };
}

export function openIXICollectionDispute(record = {}, input = {}, source = {}) {
  const amount = money(input.amount);
  if (!(amount > 0)) throw new Error("Disputed amount must be greater than zero");
  const dispute = {
    disputeId: clean(input.disputeId) || `DSP-${Date.now()}`,
    amount,
    reason: clean(input.reason),
    status: "open",
    ownerId: clean(input.ownerId || record.assignment?.ownerId),
    ownerLabel: clean(input.ownerLabel || record.assignment?.ownerLabel),
    openedAt: now(),
    ...actor(source)
  };
  const activity = event("dispute-opened", source, { disputeId: dispute.disputeId, amount, reason: dispute.reason });
  return {
    ...record,
    status: "disputed",
    disputes: [...arr(record.disputes), dispute],
    activity: [...arr(record.activity), activity],
    audit: { ...(record.audit || {}), updatedAt: activity.occurredAt }
  };
}

export function resolveIXICollectionDispute(record = {}, disputeId = "", resolution = "resolved", source = {}) {
  const disputes = arr(record.disputes).map(item => item.disputeId === disputeId ? { ...item, status: "resolved", resolution: clean(resolution), resolvedAt: now() } : item);
  const activity = event("dispute-resolved", source, { disputeId, resolution: clean(resolution) });
  const hasOpen = disputes.some(item => item.status === "open");
  return {
    ...record,
    disputes,
    status: hasOpen ? "disputed" : record.promises?.some(item => item.status === "pending") ? "promise-pending" : "open",
    activity: [...arr(record.activity), activity],
    audit: { ...(record.audit || {}), updatedAt: activity.occurredAt }
  };
}

export function escalateIXICollectionCase(record = {}, input = {}, source = {}) {
  const escalation = {
    escalationId: clean(input.escalationId) || `ESC-${Date.now()}`,
    level: clean(input.level || "manager"),
    reason: clean(input.reason),
    assignedTo: clean(input.assignedTo),
    createdAt: now(),
    ...actor(source)
  };
  const activity = event("case-escalated", source, { escalationId: escalation.escalationId, level: escalation.level, reason: escalation.reason });
  return {
    ...record,
    status: "escalated",
    escalations: [...arr(record.escalations), escalation],
    assignment: { ...(record.assignment || {}), priority: "high" },
    activity: [...arr(record.activity), activity],
    audit: { ...(record.audit || {}), updatedAt: activity.occurredAt }
  };
}

export function refreshIXICollectionReceivable(record = {}, receivable = {}) {
  const balance = money(receivable.balance);
  const isPaid = balance <= 0;
  const occurredAt = now();
  return {
    ...record,
    receivable: {
      ...(record.receivable || {}),
      originalAmount: money(receivable.originalAmount),
      openBalance: balance,
      dueDate: clean(receivable.dueDate),
      agingBucket: clean(receivable.agingBucket),
      daysPastDue: num(receivable.daysPastDue)
    },
    status: isPaid ? "closed" : record.status === "closed" ? "open" : record.status,
    closedAt: isPaid ? occurredAt : "",
    audit: { ...(record.audit || {}), updatedAt: occurredAt }
  };
}

export default { logIXICollectionContact, addIXIPromiseToPay, resolveIXIPromise, openIXICollectionDispute, resolveIXICollectionDispute, escalateIXICollectionCase, refreshIXICollectionReceivable };
