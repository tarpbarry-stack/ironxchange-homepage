const clean = value => String(value ?? "").trim();
const money = value => Math.round(Number(value || 0) * 100) / 100;

export function withIXIBillBalance(record, financialRecords = []) {
  if (!record) return record;
  const id = clean(record.financialBinding?.financialDocumentId || record.identity?.billDocumentId);
  const linked = [...new Map(financialRecords.map(item => item.financialDocument || item).map(doc => [doc.financialDocumentId, doc])).values()]
    .filter(doc => clean(doc.sourceFinancialDocumentId) === id && !["void", "reversed"].includes(doc.financialState));
  const amount = doc => Number(doc.totals?.total ?? doc.amount ?? 0);
  const payments = linked.filter(doc => doc.documentType === "payment" && doc.paymentDirection === "outflow");
  const credits = linked.filter(doc => doc.documentType === "credit");
  // Legacy paid evidence stays visible until canonical payment records exist.
  const paid = payments.length ? money(payments.reduce((sum, doc) => sum + amount(doc), 0)) : money(record.payment?.amountPaid);
  const credited = money(credits.reduce((sum, doc) => sum + amount(doc), 0));
  const openBalance = money(Math.max(0, Number(record.bill?.amount || 0) - paid - credited));
  return { ...record, payment: { ...record.payment, amountPaid: paid, credited, openBalance,
    carrierCredit: money(Math.max(0, paid + credited - Number(record.bill?.amount || 0))),
    status: openBalance === 0 && (paid > 0 || credited > 0) ? "paid" : paid > 0 ? "partial" : record.payment?.status || "unpaid" } };
}
