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
  const today = dateOnly(new Date().toISOString());
  const expected = dateOnly(record.period?.expectedReturnDate);
  const projectedEnd = expected && expected > today ? expected : today;
  const end = dateOnly(record.period?.actualOffRentDate || asOfDate || projectedEnd);
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
  const document = item?.financialDocument || item?.record?.financialDocument || item;
  const rentalId = clean(record.identity?.rentalExpenseId || record.identity?.number);
  const refs = arr(document.references || document.additionalReferences);
  const relatedIds = arr(document.relatedFinancialDocumentIds).map(clean);
  return clean(document.rentalExpenseId) === rentalId || clean(document.rentalId) === rentalId || clean(document.sourceFinancialDocumentId) === rentalId || relatedIds.includes(rentalId) || refs.some(ref => clean(ref.externalId) === rentalId || clean(ref.label) === rentalId);
}

function financialDocument(item = {}) {
  return item?.financialDocument || item?.record?.financialDocument || item;
}

export function applyIXIRentalExpenseEconomics(record = {}, relatedTransactions = [], asOfDate = "") {
  const periods = projectedPeriods(record, asOfDate);
  const base = round(periods * num(record.rate?.baseRate));
  const projectedOverage = round(record.usage?.projectedOverage);
  const fixedAncillary = round(
    num(record.terms?.oneTimeCharges) +
    num(record.terms?.damageWaiver) +
    num(record.terms?.insurance) +
    num(record.terms?.deliveryCharge) +
    num(record.terms?.pickupCharge) +
    num(record.terms?.environmentalFee) +
    num(record.terms?.taxesEstimate)
  );
  const ancillary = round(fixedAncillary + periods * num(record.terms?.recurringCharges));
  const projectedTotal = round(base + projectedOverage + ancillary);
  const related = arr(relatedTransactions).filter(item => relatedToRental(item, record));
  const bills = related.map(financialDocument).filter(item => ["bill", "supplier-invoice"].includes(clean(item.documentType || item.type)));
  const payments = related.map(financialDocument).filter(item => ["payment", "bill-payment"].includes(clean(item.documentType || item.type)) || clean(item.paymentStatus) === "paid");
  const billedTotal = round(bills.reduce((sum, item) => sum + num(item.amount || item.total || item.totals?.total), 0));
  const paidTotal = round(payments.reduce((sum, item) => sum + num(item.amount || item.total || item.totals?.total), 0));
  return {
    ...record,
    economics: {
      ...(record.economics || {}),
      projectedPeriods: periods,
      projectedBaseCost: base,
      projectedOverage,
      projectedTotal,
      billedTotal,
      paidTotal,
      varianceToBilled: round(billedTotal - projectedTotal),
      billIds: bills.map(item => clean(item.documentId || item.identity?.number || item.id)).filter(Boolean),
      paymentIds: payments.map(item => clean(item.documentId || item.identity?.number || item.id)).filter(Boolean)
    },
    audit: { ...(record.audit || {}), updatedAt: clean(record.audit?.updatedAt) || iso() }
  };
}

export function extendIXIRentalExpense(record = {}, { expectedReturnDate = "", notes = "" } = {}, actor = {}) {
  const nextDate = dateOnly(expectedReturnDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) throw new Error("Valid expected return date is required");
  if (nextDate < dateOnly(record.period?.startDate)) throw new Error("Expected return cannot be before rental start");
  const event = {
    eventId: `RENT-EXT-${Date.now()}`,
    type: "rental-extended",
    previousExpectedReturnDate: dateOnly(record.period?.expectedReturnDate),
    nextExpectedReturnDate: nextDate,
    notes: clean(notes),
    occurredAt: iso(),
    actorId: clean(actor.passportId || actor.employeeId || actor.userId || actor.id),
    actorLabel: clean(actor.displayName || actor.name || actor.label)
  };
  return {
    ...record,
    period: { ...(record.period || {}), expectedReturnDate: nextDate, extensions: [...arr(record.period?.extensions), event] },
    activity: [...arr(record.activity), event],
    audit: { ...(record.audit || {}), updatedAt: event.occurredAt }
  };
}

export function offRentIXIRentalExpense(record = {}, input = {}, actor = {}) {
  const actualOffRentDate = dateOnly(input.actualOffRentDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(actualOffRentDate)) throw new Error("Valid off-rent date is required");
  if (actualOffRentDate < dateOnly(record.period?.startDate)) throw new Error("Off-rent date cannot be before rental start");
  const endMeter = input.endMeter === "" || input.endMeter == null ? record.usage?.endMeter : num(input.endMeter);
  const usage = endMeter == null ? num(record.usage?.usage) : Math.max(0, num(endMeter) - num(record.usage?.startMeter));
  const overageUsage = Math.max(0, usage - num(record.rate?.includedUsage));
  const projectedOverage = round(overageUsage * num(record.rate?.overageRate));
  const occurredAt = iso();
  const event = {
    eventId: `RENT-OFF-${Date.now()}`,
    type: "off-rent",
    actualOffRentDate,
    endMeter,
    usage,
    overageUsage,
    conditionOut: clean(input.conditionOut),
    fuelIn: clean(input.fuelIn),
    returnReference: clean(input.returnReference),
    occurredAt,
    actorId: clean(actor.passportId || actor.employeeId || actor.userId || actor.id),
    actorLabel: clean(actor.displayName || actor.name || actor.label)
  };
  return {
    ...record,
    period: { ...(record.period || {}), actualOffRentDate, offRentAt: occurredAt, status: "off-rent" },
    usage: { ...(record.usage || {}), endMeter, usage, overageUsage, projectedOverage },
    terms: { ...(record.terms || {}), fuelIn: clean(input.fuelIn || record.terms?.fuelIn) },
    custody: { ...(record.custody || {}), conditionOut: clean(input.conditionOut || record.custody?.conditionOut) },
    status: "off-rent",
    activity: [...arr(record.activity), event],
    audit: { ...(record.audit || {}), updatedAt: occurredAt }
  };
}

export function closeIXIRentalExpense(record = {}, actor = {}) {
  if (!dateOnly(record.period?.actualOffRentDate)) throw new Error("Rental must be off-rent before it can be closed");
  const occurredAt = iso();
  const event = {
    eventId: `RENT-CLOSE-${Date.now()}`,
    type: "rental-closed",
    occurredAt,
    actorId: clean(actor.passportId || actor.employeeId || actor.userId || actor.id),
    actorLabel: clean(actor.displayName || actor.name || actor.label)
  };
  return { ...record, period: { ...(record.period || {}), status: "closed" }, status: "closed", activity: [...arr(record.activity), event], audit: { ...(record.audit || {}), updatedAt: occurredAt } };
}

export default { applyIXIRentalExpenseEconomics, extendIXIRentalExpense, offRentIXIRentalExpense, closeIXIRentalExpense };
