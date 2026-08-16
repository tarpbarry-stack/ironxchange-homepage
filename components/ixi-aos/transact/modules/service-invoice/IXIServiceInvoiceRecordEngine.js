const clean = value => String(value ?? "").trim();
const arr = value => Array.isArray(value) ? value : [];
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = value => Math.round(num(value) * 100) / 100;

function actor(value = {}) {
  return {
    actorId: clean(value.passportId || value.employeeId || value.userId || value.id),
    actorLabel: clean(value.displayName || value.name || value.label)
  };
}

function event(type, actorValue = {}, extra = {}) {
  return {
    activityId: `ACT-SINV-${type.toUpperCase()}-${Date.now()}`,
    type,
    occurredAt: new Date().toISOString(),
    ...actor(actorValue),
    ...extra
  };
}

export function issueIXIServiceInvoice(record = {}, actorValue = {}) {
  if (record.status !== "draft") throw new Error("Only draft Service Invoices can be issued.");
  if (record.source?.pricingType === "not-to-exceed" && record.billingRule?.authorizationException) {
    throw new Error("Service Invoice exceeds authorized Not-To-Exceed amount. Approved Change Order required.");
  }
  const e = event("service-invoice-issued", actorValue, { amountDue: num(record.charges?.amountDue) });
  return {
    ...record,
    status: "issued",
    ar: { ...(record.ar || {}), status: num(record.ar?.balanceDue) > 0 ? "open" : "paid" },
    timeline: [...arr(record.timeline), e],
    audit: { ...(record.audit || {}), updatedAt: e.occurredAt, version: num(record.audit?.version || 1) + 1 }
  };
}

export function recordIXIServiceInvoicePayment(record = {}, input = {}, actorValue = {}) {
  if (!['issued'].includes(record.status)) throw new Error("Payment requires an issued Service Invoice.");
  const amount = money(input.amount);
  if (!(amount > 0)) throw new Error("Payment amount must be greater than zero.");
  const previous = money(record.ar?.amountReceived);
  const total = money(previous + amount);
  const due = money(record.charges?.amountDue);
  const balance = money(Math.max(0, due - total));
  const status = balance <= 0.005 ? "paid" : "partial";
  const payment = {
    paymentId: clean(input.paymentId) || `PAY-${Date.now()}`,
    amount,
    method: clean(input.method),
    reference: clean(input.reference),
    receivedAt: clean(input.receivedAt) || new Date().toISOString(),
    ...actor(actorValue)
  };
  const e = event("customer-payment-recorded", actorValue, { paymentId: payment.paymentId, amount, balanceDue: balance });
  return {
    ...record,
    ar: {
      ...(record.ar || {}),
      status,
      amountReceived: total,
      balanceDue: balance,
      payments: [...arr(record.ar?.payments), payment]
    },
    timeline: [...arr(record.timeline), e],
    audit: { ...(record.audit || {}), updatedAt: e.occurredAt, version: num(record.audit?.version || 1) + 1 }
  };
}

export function voidIXIServiceInvoice(record = {}, input = {}, actorValue = {}) {
  if (record.status === "void") return record;
  if (num(record.ar?.amountReceived) > 0.005) throw new Error("Invoice with received payments cannot be voided without reversing the payments first.");
  const e = event("service-invoice-voided", actorValue, { reason: clean(input.reason) });
  return {
    ...record,
    status: "void",
    ar: { ...(record.ar || {}), status: "open", balanceDue: 0 },
    timeline: [...arr(record.timeline), e],
    audit: { ...(record.audit || {}), updatedAt: e.occurredAt, version: num(record.audit?.version || 1) + 1 }
  };
}

export function markIXIServiceInvoiceOverdue(record = {}, at = new Date().toISOString()) {
  if (record.status !== "issued" || num(record.ar?.balanceDue) <= 0.005) return record;
  const due = clean(record.terms?.dueDate);
  if (!due || due >= String(at).slice(0, 10)) return record;
  return { ...record, ar: { ...(record.ar || {}), status: "overdue" } };
}

export default { issueIXIServiceInvoice, recordIXIServiceInvoicePayment, voidIXIServiceInvoice, markIXIServiceInvoiceOverdue };
