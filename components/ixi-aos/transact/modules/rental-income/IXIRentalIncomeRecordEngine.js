const clean = value => String(value ?? "").trim();
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const arr = value => Array.isArray(value) ? value : [];
const round = value => Math.round(num(value) * 100) / 100;
const iso = () => new Date().toISOString();

function dateOnly(value = "") { return clean(value).slice(0, 10); }
function asDate(value = "") { const d = new Date(`${dateOnly(value)}T12:00:00Z`); return Number.isNaN(d.getTime()) ? null : d; }
function calendarDays(startValue, endValue) {
  const start = asDate(startValue); const end = asDate(endValue);
  if (!start || !end || end < start) return 0;
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
}

function projectedPeriods(record = {}, asOfDate = "") {
  const start = dateOnly(record.period?.startDate);
  const end = dateOnly(record.period?.actualOffRentDate || asOfDate || new Date().toISOString());
  const unit = clean(record.rate?.unit || "month");
  const days = calendarDays(start, end);
  const minimum = Math.max(0, num(record.rate?.minimumPeriods || 1));
  if (!days) return minimum;
  if (unit === "day") return Math.max(minimum, days);
  if (unit === "week") return Math.max(minimum, Math.ceil(days / 7));
  if (unit === "month") return Math.max(minimum, Math.ceil(days / 30));
  if (unit === "hour") {
    const usage = num(record.usage?.usage);
    return Math.max(minimum, usage || Math.ceil(days * 24));
  }
  return Math.max(minimum, 1);
}

function relatedToRental(item = {}, record = {}) {
  const rentalId = clean(record.identity?.rentalIncomeId || record.identity?.number);
  const assetPassportId = clean(record.ownedAsset?.passportId);
  const refs = arr(item.references || item.additionalReferences || item.financial?.references);
  return clean(item.rentalIncomeId) === rentalId || clean(item.rentalId) === rentalId || refs.some(ref => clean(ref.externalId) === rentalId || clean(ref.label) === rentalId || (assetPassportId && clean(ref.passportId) === assetPassportId && clean(ref.role) === "asset"));
}

export function applyIXIRentalIncomeEconomics(record = {}, relatedTransactions = [], asOfDate = "") {
  const periods = projectedPeriods(record, asOfDate);
  const baseRevenue = round(periods * num(record.rate?.baseRate));
  const projectedOverageRevenue = round(record.usage?.projectedOverageRevenue);
  const ancillaryRevenue = round(record.economics?.projectedAncillaryRevenue);
  const projectedRevenue = round(baseRevenue + projectedOverageRevenue + ancillaryRevenue);
  const related = arr(relatedTransactions).filter(item => relatedToRental(item, record));
  const invoices = related.filter(item => ["invoice", "sales-invoice", "service-invoice"].includes(clean(item.documentType || item.type || item.financial?.documentType)));
  const payments = related.filter(item => ["customer-payment", "payment", "receipt"].includes(clean(item.documentType || item.type || item.financial?.documentType)) || clean(item.paymentStatus) === "paid");
  const invoicedRevenue = round(invoices.reduce((sum, item) => sum + num(item.amount || item.total || item.financial?.amount), 0));
  const receivedRevenue = round(payments.reduce((sum, item) => sum + num(item.amount || item.total || item.financial?.amount), 0));
  return {
    ...record,
    economics: {
      ...(record.economics || {}),
      projectedPeriods: periods,
      projectedBaseRevenue: baseRevenue,
      projectedOverageRevenue,
      projectedRevenue,
      invoicedRevenue,
      receivedRevenue,
      outstandingReceivable: round(Math.max(0, invoicedRevenue - receivedRevenue)),
      varianceToInvoiced: round(invoicedRevenue - projectedRevenue),
      invoiceIds: invoices.map(item => clean(item.documentId || item.identity?.number || item.id)).filter(Boolean),
      paymentIds: payments.map(item => clean(item.documentId || item.identity?.number || item.id)).filter(Boolean)
    },
    audit: { ...(record.audit || {}), updatedAt: clean(record.audit?.updatedAt) || iso() }
  };
}

export function extendIXIRentalIncome(record = {}, { expectedReturnDate = "", notes = "" } = {}, actor = {}) {
  const nextDate = dateOnly(expectedReturnDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) throw new Error("Valid expected return date is required");
  if (nextDate < dateOnly(record.period?.startDate)) throw new Error("Expected return cannot be before rental start");
  const event = { eventId: `RINC-EXT-${Date.now()}`, type: "rental-extended", previousExpectedReturnDate: dateOnly(record.period?.expectedReturnDate), nextExpectedReturnDate: nextDate, notes: clean(notes), occurredAt: iso(), actorId: clean(actor.passportId || actor.employeeId || actor.userId || actor.id), actorLabel: clean(actor.displayName || actor.name || actor.label) };
  return { ...record, period: { ...(record.period || {}), expectedReturnDate: nextDate, extensions: [...arr(record.period?.extensions), event] }, activity: [...arr(record.activity), event], audit: { ...(record.audit || {}), updatedAt: event.occurredAt } };
}

export function offRentIXIRentalIncome(record = {}, input = {}, actor = {}) {
  const actualOffRentDate = dateOnly(input.actualOffRentDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(actualOffRentDate)) throw new Error("Valid off-rent date is required");
  if (actualOffRentDate < dateOnly(record.period?.startDate)) throw new Error("Off-rent date cannot be before rental start");
  const endMeter = input.endMeter === "" || input.endMeter == null ? record.usage?.endMeter : num(input.endMeter);
  const usage = endMeter == null ? num(record.usage?.usage) : Math.max(0, num(endMeter) - num(record.usage?.startMeter));
  const overageUsage = Math.max(0, usage - num(record.rate?.includedUsage));
  const projectedOverageRevenue = round(overageUsage * num(record.rate?.overageRate));
  const occurredAt = iso();
  const event = { eventId: `RINC-OFF-${Date.now()}`, type: "off-rent", actualOffRentDate, endMeter, usage, overageUsage, conditionIn: clean(input.conditionIn), fuelIn: clean(input.fuelIn), returnReference: clean(input.returnReference), damageNotes: clean(input.damageNotes), occurredAt, actorId: clean(actor.passportId || actor.employeeId || actor.userId || actor.id), actorLabel: clean(actor.displayName || actor.name || actor.label) };
  return {
    ...record,
    period: { ...(record.period || {}), actualOffRentDate, offRentAt: occurredAt, status: "off-rent" },
    usage: { ...(record.usage || {}), endMeter, usage, overageUsage, projectedOverageRevenue },
    terms: { ...(record.terms || {}), fuelIn: clean(input.fuelIn || record.terms?.fuelIn) },
    custody: { ...(record.custody || {}), conditionIn: clean(input.conditionIn || record.custody?.conditionIn), damageNotes: clean(input.damageNotes) },
    ownedAsset: { ...(record.ownedAsset || {}), custodyState: "returned" },
    status: "off-rent",
    activity: [...arr(record.activity), event],
    audit: { ...(record.audit || {}), updatedAt: occurredAt }
  };
}

export function closeIXIRentalIncome(record = {}, actor = {}) {
  if (!dateOnly(record.period?.actualOffRentDate)) throw new Error("Rental must be off-rent before it can be closed");
  const occurredAt = iso();
  const event = { eventId: `RINC-CLOSE-${Date.now()}`, type: "rental-closed", occurredAt, actorId: clean(actor.passportId || actor.employeeId || actor.userId || actor.id), actorLabel: clean(actor.displayName || actor.name || actor.label) };
  return { ...record, period: { ...(record.period || {}), status: "closed" }, status: "closed", activity: [...arr(record.activity), event], audit: { ...(record.audit || {}), updatedAt: occurredAt } };
}

export default { applyIXIRentalIncomeEconomics, extendIXIRentalIncome, offRentIXIRentalIncome, closeIXIRentalIncome };
