const clean = value => String(value ?? "").trim();
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = value => Math.round(num(value) * 100) / 100;
const arr = value => Array.isArray(value) ? value : [];

function typeOf(record = {}) {
  return clean(record.documentType || record.type || record.financialDocument?.documentType || record.document?.documentType).toLowerCase();
}
function sourceOf(record = {}) { return record.input || record.financialDocument?.input || record.document?.input || record; }
function idOf(record = {}) {
  return clean(record.documentId || record.id || record.financialDocument?.documentId || record.document?.documentId || record.identity?.billDocumentId || record.identity?.billRecordId);
}
function refsOf(record = {}) { return arr(sourceOf(record).references || record.references || record.financialDocument?.references); }
function refByRole(record = {}, role = "") { return refsOf(record).find(ref => clean(ref?.role).toLowerCase() === role) || null; }
function amountOf(record = {}) {
  const source = sourceOf(record);
  return money(source.total ?? source.amount ?? source.subtotal ?? record.bill?.amount ?? record.amount ?? record.financialDocument?.amount);
}
function relatedBillId(record = {}) {
  const source = sourceOf(record);
  const billRef = refsOf(record).find(ref => clean(ref?.role).toLowerCase() === "bill");
  return clean(source.relatedBillId || source.billDocumentId || record.relatedBillId || record.metadata?.billDocumentId || billRef?.externalId || billRef?.passportId);
}
function isBill(record = {}) {
  if (typeOf(record) !== "bill") return false;
  const source = sourceOf(record);
  return clean(source.status || record.bill?.status || "open").toLowerCase() !== "void";
}
function isOutgoingPayment(record = {}) {
  if (typeOf(record) !== "payment") return false;
  const source = sourceOf(record);
  const direction = clean(source.direction || record.direction).toLowerCase();
  const state = clean(source.financialState || record.financialState).toLowerCase();
  return direction === "out" || state === "paid" || Boolean(record.metadata?.billDocumentId);
}
function isVendorCredit(record = {}) {
  if (typeOf(record) !== "credit") return false;
  const source = sourceOf(record);
  const direction = clean(source.direction || record.direction || "in").toLowerCase();
  return direction !== "out" || Boolean(source.relatedBillId || record.metadata?.billDocumentId);
}
function parseDate(value = "") { const d = new Date(value); return clean(value) && !Number.isNaN(d.getTime()) ? d : null; }
export function getIXIPayablesDaysPastDue(dueDate = "", asOf = new Date()) {
  const due = parseDate(dueDate); if (!due) return 0;
  const current = asOf instanceof Date ? asOf : new Date(asOf);
  return Math.max(0, Math.floor((current.getTime() - due.getTime()) / 86400000));
}
export function getIXIPayablesAgingBucket({ dueDate = "", balance = 0, asOf = new Date() } = {}) {
  if (!(num(balance) > 0)) return "paid";
  const days = getIXIPayablesDaysPastDue(dueDate, asOf);
  if (!days) return "current";
  if (days <= 30) return "1-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}
function approvalFrom(record = {}) { return clean(record.approval?.status || sourceOf(record).approvalStatus || "approved").toLowerCase(); }
function matchFrom(record = {}) { return clean(record.purchaseMatch?.status || sourceOf(record).matchStatus || "n/a").toLowerCase(); }
export function buildIXIPayablesProjection({ financialRecords = [], payableCases = [], asOf = new Date() } = {}) {
  const records = arr(financialRecords);
  const bills = records.filter(isBill), payments = records.filter(isOutgoingPayment), credits = records.filter(isVendorCredit);
  const payables = bills.map(bill => {
    const billId = idOf(bill), source = sourceOf(bill), vendorRef = refByRole(bill, "vendor");
    const linkedPayments = payments.filter(item => relatedBillId(item) === billId);
    const linkedCredits = credits.filter(item => relatedBillId(item) === billId);
    const originalAmount = amountOf(bill), paid = money(linkedPayments.reduce((sum, item) => sum + amountOf(item), 0)), credited = money(linkedCredits.reduce((sum, item) => sum + amountOf(item), 0));
    const balance = money(Math.max(0, originalAmount - paid - credited));
    const dueDate = clean(source.dueDate || bill.bill?.dueDate), daysPastDue = getIXIPayablesDaysPastDue(dueDate, asOf), agingBucket = getIXIPayablesAgingBucket({ dueDate, balance, asOf });
    const payableCase = arr(payableCases).find(item => clean(item.payable?.billId) === billId) || null;
    const approvalStatus = approvalFrom(bill), matchStatus = matchFrom(bill);
    const hold = Boolean(payableCase?.control?.hold), disputed = Boolean(payableCase?.dispute?.open);
    const scheduled = arr(payableCase?.scheduledPayments).filter(item => item.status === "scheduled").reduce((sum, item) => sum + num(item.amount), 0);
    return {
      billId,
      billNumber: clean(source.documentNumber || source.invoiceNumber || bill.identity?.billNumber || bill.identity?.invoiceNumber || billId),
      vendorPassportId: clean(vendorRef?.passportId || bill.bill?.vendorPassportId), vendorId: clean(vendorRef?.externalId || bill.bill?.vendorId), vendorLabel: clean(vendorRef?.label || source.vendorName || bill.bill?.vendorLabel || "VENDOR"),
      entityReference: refByRole(bill, "entity"), locationReference: refByRole(bill, "location"), purchaseOrderReference: refByRole(bill, "purchase-order"),
      invoiceDate: clean(source.documentDate || bill.bill?.invoiceDate), dueDate, currency: clean(source.currency || bill.bill?.currency || "USD").toUpperCase(),
      originalAmount, paid, credited, balance, daysPastDue, agingBucket, approvalStatus, matchStatus, hold, disputed, scheduled: money(scheduled), payableCase, sourceBill: bill, payments: linkedPayments, credits: linkedCredits,
      status: balance <= 0 ? "paid" : hold ? "hold" : disputed ? "disputed" : approvalStatus === "pending" ? "needs-approval" : matchStatus === "exception" ? "match-exception" : daysPastDue > 0 ? "overdue" : scheduled > 0 ? "scheduled" : "open"
    };
  });
  const totals = payables.reduce((a, item) => {
    a.totalAP = money(a.totalAP + item.balance); if (item.agingBucket === "current") a.current = money(a.current + item.balance); if (item.agingBucket === "1-30") a.days1to30 = money(a.days1to30 + item.balance); if (item.agingBucket === "31-60") a.days31to60 = money(a.days31to60 + item.balance); if (item.agingBucket === "61-90") a.days61to90 = money(a.days61to90 + item.balance); if (item.agingBucket === "90+") a.days90plus = money(a.days90plus + item.balance); if (item.status === "overdue") a.overdue = money(a.overdue + item.balance); if (item.status === "needs-approval") a.needsApproval = money(a.needsApproval + item.balance); if (item.status === "match-exception") a.matchException = money(a.matchException + item.balance); if (item.scheduled > 0) a.scheduled = money(a.scheduled + Math.min(item.scheduled, item.balance)); return a;
  }, { totalAP: 0, current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, overdue: 0, needsApproval: 0, matchException: 0, scheduled: 0 });
  const vendorMap = new Map();
  payables.forEach(item => { const key = clean(item.vendorPassportId || item.vendorId || item.vendorLabel).toLowerCase(); if (!vendorMap.has(key)) vendorMap.set(key, { vendorLabel: item.vendorLabel, vendorPassportId: item.vendorPassportId, totalAP: 0, overdue: 0, oldestDays: 0, bills: [] }); const vendor = vendorMap.get(key); vendor.totalAP = money(vendor.totalAP + item.balance); if (item.daysPastDue) vendor.overdue = money(vendor.overdue + item.balance); vendor.oldestDays = Math.max(vendor.oldestDays, item.daysPastDue); vendor.bills.push(item); });
  return { payables: payables.sort((a,b) => b.daysPastDue-a.daysPastDue || b.balance-a.balance), vendors: Array.from(vendorMap.values()).sort((a,b)=>b.overdue-a.overdue || b.totalAP-a.totalAP), totals };
}
export default { buildIXIPayablesProjection, getIXIPayablesAgingBucket, getIXIPayablesDaysPastDue };
