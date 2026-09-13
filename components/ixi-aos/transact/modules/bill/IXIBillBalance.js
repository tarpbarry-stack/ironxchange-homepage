import { paymentSummary } from "../../payments/IXIPaymentModel.js";
const clean = value => String(value ?? "").trim();
const money = value => Math.round(Number(value || 0) * 100) / 100;

export function withIXIBillBalance(record, financialRecords = []) {
  if (!record) return record;
  const id = clean(record.financialBinding?.financialDocumentId || record.identity?.billDocumentId);
  const summary = paymentSummary({ financialDocumentId: id, documentType: "bill", totals: { total: record.bill?.amount }, billRecord: record }, financialRecords);
  if (!summary) return record;
  const { paid, credited, balance: openBalance } = summary;
  return { ...record, payment: { ...record.payment, amountPaid: paid, credited, openBalance,
    carrierCredit: summary.creditBalance, paidDate: summary.paidDate, method: summary.method, reference: summary.reference,
    status: openBalance === 0 && (paid > 0 || credited > 0) ? "paid" : paid > 0 ? "partial" : "unpaid" } };
}
