const clean = value => String(value ?? "").trim();
const array = value => Array.isArray(value) ? value : [];
export const paymentDocument = item => item?.record?.financialDocument || item?.financialDocument || item || {};
export const paymentRevision = item => Number(item?.record?.server?.revision || item?.server?.revision || 0);
export const paymentAmount = item => Math.round(Number(paymentDocument(item).totals?.total ?? paymentDocument(item).amount ?? 0) * 100) / 100;
export const paymentActive = item => !["void", "reversed", "cancelled", "canceled", "rejected"].includes(clean(paymentDocument(item).financialState || paymentDocument(item).status).toLowerCase());
export const isPaymentCharge = item => ["bill", "supplier-invoice", "expense"].includes(clean(paymentDocument(item).documentType));
export const expensePaymentMethod = item => {
  const d = paymentDocument(item);
  return clean(d.paymentMethod || d.expense?.paymentMethod || d.expenseRecord?.expense?.paymentMethod).toLowerCase();
};

export function uniquePaymentRecords(records = []) {
  const map = new Map();
  for (const record of array(records)) {
    const id = clean(paymentDocument(record).financialDocumentId);
    if (id && (!map.has(id) || paymentRevision(record) >= paymentRevision(map.get(id)))) map.set(id, record);
  }
  return [...map.values()];
}

export function paymentSummary(source, records = []) {
  const document = paymentDocument(source), id = clean(document.financialDocumentId);
  if (!id || !isPaymentCharge(document)) return null;
  const expense = document.documentType === "expense";
  const method = expensePaymentMethod(document);
  const reimbursement = expense && method === "my-money";
  const paidAtEntry = expense && ["company-card", "company-cash", "other"].includes(method);
  const linked = uniquePaymentRecords(records).filter(record => clean(paymentDocument(record).sourceFinancialDocumentId) === id);
  const allPayments = linked.filter(record => paymentDocument(record).documentType === "payment" && paymentDocument(record).paymentDirection === "outflow");
  const payments = allPayments.filter(paymentActive);
  const credits = linked.filter(record => paymentDocument(record).documentType === "credit" && paymentActive(record));
  const total = paymentAmount(document);
  const legacyPaid = paidAtEntry ? total : Number(document.billRecord?.payment?.amountPaid || 0);
  // A reversed canonical payment must not revive legacy paid evidence.
  const paid = Math.round((allPayments.length ? payments.reduce((sum, item) => sum + paymentAmount(item), 0) : legacyPaid) * 100) / 100;
  const credited = Math.round(credits.reduce((sum, item) => sum + paymentAmount(item), 0) * 100) / 100;
  const balance = Math.max(0, Math.round((total - paid - credited) * 100) / 100);
  const creditBalance = Math.max(0, Math.round((paid + credited - total) * 100) / 100);
  const active = paymentActive(document);
  const status = !active ? "VOID" : total === 0 ? "NO BALANCE DUE" : balance === 0 ? (paid ? "PAID" : "CREDITED") : paid ? "PARTIALLY PAID" : "UNPAID";
  const latest = [...payments].sort((a, b) => clean(paymentDocument(b).occurredAt).localeCompare(clean(paymentDocument(a).occurredAt)))[0];
  const controls = uniquePaymentRecords(records).map(paymentDocument).filter(d => d.documentType === "payables-control" && clean(d.sourceFinancialDocumentId || d.payablesControl?.payable?.billId) === id && paymentActive(d));
  return { id, source, document, total, paid, credited, balance, creditBalance, status, active, expense, reimbursement, paidAtEntry, payments, allPayments,
    approved: expense || document.billRecord?.approval?.status === "approved",
    hold: controls.some(d => d.payablesControl?.control?.hold || d.payablesControl?.dispute?.open),
    title: clean(document.billRecord?.identity?.invoiceNumber || document.documentNumber || document.expenseRecord?.identity?.number || document.description || id),
    party: clean(reimbursement ? document.reimbursement?.employeeLabel || document.expenseRecord?.reimbursement?.employeeLabel : document.billRecord?.bill?.vendorLabel || document.vendorName || document.expense?.vendor || document.expenseRecord?.expense?.vendor || document.vendor),
    currency: clean(document.currency || "USD"),
    paidDate: clean(latest ? paymentDocument(latest).occurredAt?.slice(0, 10) : paidAtEntry ? document.expensePayment?.paidDate : document.billRecord?.payment?.paidDate),
    method: clean(latest ? paymentDocument(latest).paymentMethod : paidAtEntry ? document.expensePayment?.method || ({ "company-card": "CARD", "company-cash": "CASH", other: "OTHER" }[method]) : document.billRecord?.payment?.method),
    reference: clean(latest ? paymentDocument(latest).transactionReference : paidAtEntry ? document.expensePayment?.reference || document.expense?.referenceNumber : document.billRecord?.payment?.reference)
  };
}

export function validatePaymentDraft(input, maximum) {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) return "Enter the amount you paid.";
  if (Math.round(amount * 100) > Math.round(maximum * 100)) return "The amount is more than the balance due. Enter the amount still owed.";
  const date = clean(input.paidDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T12:00:00Z`)) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) return "Choose the date the payment was made.";
  if (!["ACH", "CHECK", "WIRE", "CARD", "CASH", "OTHER"].includes(clean(input.method).toUpperCase())) return "Choose how you paid.";
  return "";
}

export function correctedPaymentLines(document, amount, paidDate, method) {
  const lines = array(document.lines);
  if (!lines.length) throw new Error("The saved payment has no accounting lines. Reopen it to review the original record.");
  const totalCents = Math.round(Number(amount) * 100), priorTotal = lines.reduce((sum, line) => sum + Number(line.amount || 0), 0);
  if (!(priorTotal > 0) || lines.some(line => Number(line.amount) < 0)) throw new Error("The saved payment allocation needs review before its amount can be changed.");
  const allocations = lines.map((line, index) => {
    const exact = totalCents * Number(line.amount || 0) / priorTotal;
    return { index, cents: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let remaining = totalCents - allocations.reduce((sum, line) => sum + line.cents, 0);
  for (const allocation of [...allocations].sort((a, b) => b.remainder - a.remainder || a.index - b.index)) {
    if (remaining-- > 0) allocation.cents += 1;
  }
  return lines.map((line, index) => {
    const cents = allocations[index].cents;
    return { ...line, amount: cents / 100, quantity: 1, rate: cents / 100, occurredAt: `${paidDate}T12:00:00.000Z`, paymentMethod: method };
  });
}
