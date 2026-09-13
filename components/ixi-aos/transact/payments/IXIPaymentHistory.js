import { isPaymentCharge, paymentActive, paymentDocument, paymentSummary, uniquePaymentRecords } from "./IXIPaymentModel.js";
import { getIXIWorkOrderRelatedRecords } from "../modules/work-order/IXIWorkOrderProjectionEngine.js";

const clean = value => String(value ?? "").trim();
const array = value => Array.isArray(value) ? value : [];

// Read-only status: completing work never proves that its charges were paid.
export function paymentHistorySummary(source, records = []) {
  const document = paymentDocument(source);
  if (isPaymentCharge(document)) return paymentSummary(source, records);
  const type = clean(document.documentType);
  if (!["work-order", "technology-work-order", "service-order", "freight", "freight-order"].includes(type)) return null;
  const current = uniquePaymentRecords(records);
  const work = document.workOrder || document.techWorkOrder || document.serviceOrder || document;
  const ids = new Set(getIXIWorkOrderRelatedRecords(work, current).map(row => row.id));
  const sourceId = clean(document.financialDocumentId);
  for (const record of current) {
    const child = paymentDocument(record);
    if (sourceId && clean(child.sourceFinancialDocumentId) === sourceId) ids.add(child.financialDocumentId);
  }
  const freight = document.freightOrder || document;
  for (const record of array(freight.financialRecords)) ids.add(paymentDocument(record).financialDocumentId);
  const freightId = clean(freight.identity?.freightOrderId);
  if (freightId) for (const record of current) {
    const child = paymentDocument(record);
    if (clean(child.metadata?.freightOrderId || child.freightOrderId) === freightId) ids.add(child.financialDocumentId);
  }
  const charges = current.filter(record => ids.has(paymentDocument(record).financialDocumentId) && isPaymentCharge(record) && paymentActive(record)).map(record => paymentSummary(record, current));
  const currencies = [...new Set(charges.map(item => item.currency))];
  const sum = key => Math.round(charges.reduce((total, item) => total + item[key], 0) * 100) / 100;
  const hasPaid = charges.some(item => item.paid > 0), hasBalance = charges.some(item => item.balance > 0), hasTotal = charges.some(item => item.total > 0);
  const paid = currencies.length > 1 ? null : sum("paid"), balance = currencies.length > 1 ? null : sum("balance"), total = currencies.length > 1 ? null : sum("total");
  const status = !paymentActive(document) ? "VOID" : !charges.length ? "NO BILLS RECORDED" : !hasTotal ? "NO BALANCE DUE" : hasBalance ? hasPaid ? "PARTIALLY PAID" : "UNPAID" : hasPaid ? "PAID" : "CREDITED";
  return { id: sourceId, status, aggregate: true, active: paymentActive(document), chargeCount: charges.length,
    currency: currencies.length === 1 ? currencies[0] : null, total, paid, balance,
    paidDate: charges.map(item => item.paidDate).filter(Boolean).sort().at(-1) || "" };
}
