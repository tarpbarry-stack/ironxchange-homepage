import test from "node:test";
import assert from "node:assert/strict";
import { parsePaymentDate, formatPaymentDate, paymentCalendarDays } from "../components/ixi-aos/transact/payments/IXIPaymentDate.js";
import { paymentHistorySummary } from "../components/ixi-aos/transact/payments/IXIPaymentHistory.js";
import { buildMachineLedger } from "../components/ixi-command-center/IXITransactMachineLedger.mjs";

const record = (id, type, amount = 100, extra = {}, revision = 1) => ({ server: { revision }, financialDocument: { financialDocumentId: id, documentNumber: id, documentType: type, currency: "USD", financialState: "incurred", occurredAt: "2026-02-04", totals: { total: amount }, ...extra } });
const work = record("wo", "work-order", 0, { workOrder: { identity: { workOrderId: "wo" }, work: { status: "complete" } } });
const bill = record("bill", "bill", 100, { sourceFinancialDocumentId: "wo" });
const expense = record("expense", "expense", 25, { paymentMethod: "company-card", expenseRecord: { context: { workOrderId: "wo" } } });
const payment = (amount, state = "paid", revision = 1) => record("payment", "payment", amount, { sourceFinancialDocumentId: "bill", paymentDirection: "outflow", financialState: state }, revision);

test("typed payment dates normalize common full-year formats without guessing or shifting dates", () => {
  for (const value of ["2/4/2026", "02/04/2026", "2026-02-04", "02042026", "2-4-2026"]) assert.equal(parsePaymentDate(value), "2026-02-04");
  assert.equal(formatPaymentDate("2026-02-04"), "02/04/2026");
  for (const value of ["2/30/2026", "2/29/2026", "13/1/2026", "1/0/2026", "2/4/26", "2026-02-04T00:00:00Z", "", "garbage"]) assert.equal(parsePaymentDate(value), "");
  assert.equal(parsePaymentDate("2/29/2024"), "2024-02-29");
  assert.equal(formatPaymentDate("2/30/2026"), "2/30/2026");
});

test("calendar days match real month boundaries and leap years", () => {
  assert.equal(paymentCalendarDays(2026, 1).filter(Boolean).length, 28);
  assert.equal(paymentCalendarDays(2024, 1).filter(Boolean).length, 29);
  assert.equal(paymentCalendarDays(2026, 8)[0], null);
  assert.equal(paymentCalendarDays(2026, 8)[2], "2026-09-01");
  assert.equal(paymentCalendarDays(2026, 11).at(-1), "2026-12-31");
});

test("work completion never implies payment, while linked costs roll up without double counting", () => {
  assert.equal(paymentHistorySummary(work, []).status, "NO BILLS RECORDED");
  assert.equal(paymentHistorySummary(work, [work, bill]).status, "UNPAID");
  const partial = paymentHistorySummary(work, [work, bill, expense]);
  assert.equal(partial.status, "PARTIALLY PAID"); assert.equal(partial.paid, 25); assert.equal(partial.balance, 100);
  const records = [work, bill, expense, payment(100)];
  const before = JSON.stringify(records);
  const paid = paymentHistorySummary(work, records);
  assert.equal(paid.status, "PAID"); assert.equal(paid.paid, 125); assert.equal(paid.balance, 0);
  const ledger = buildMachineLedger(records);
  assert.equal(ledger.rows.find(row => row.id === "wo").paymentStatus, "PAID");
  assert.equal(ledger.totals.USD.costCents, 12500);
  assert.equal(ledger.totals.USD.paidCents, 12500);
  assert.equal(JSON.stringify(records), before);
});

test("history follows payment corrections and voids instead of stale workflow flags", () => {
  const records = [work, bill, payment(100), payment(40, "paid", 2)];
  assert.equal(paymentHistorySummary(bill, records).status, "PARTIALLY PAID");
  assert.equal(paymentHistorySummary(work, records).paid, 40);
  records.push(payment(40, "void", 3));
  assert.equal(paymentHistorySummary(bill, records).status, "UNPAID");
  assert.equal(paymentHistorySummary(work, records).status, "UNPAID");
  const credit = record("credit", "credit", 100, { sourceFinancialDocumentId: "bill" });
  assert.equal(paymentHistorySummary(work, [work, bill, credit]).status, "CREDITED");
});

test("history retains currency boundaries and excludes unrelated machine charges", () => {
  const foreign = record("foreign", "expense", 900, { currency: "EUR", paymentMethod: "unpaid", sourceFinancialDocumentId: "wo" });
  const unrelated = record("other", "expense", 999, { paymentMethod: "unpaid", sourceFinancialDocumentId: "another-wo" });
  const summary = paymentHistorySummary(work, [work, expense, foreign, unrelated]);
  assert.equal(summary.status, "PARTIALLY PAID"); assert.equal(summary.chargeCount, 2);
  assert.equal(summary.currency, null); assert.equal(summary.total, null);
  assert.equal(summary.paid, null); assert.equal(summary.balance, null);
});

test("freight history reads the same canonical bill payments without inventing paid events", () => {
  const freight = record("freight", "freight-order", 0, { freightOrder: { identity: { freightOrderId: "FO-1" }, financialRecords: [bill] } });
  assert.equal(paymentHistorySummary(freight, [bill]).status, "UNPAID");
  assert.equal(paymentHistorySummary(freight, [bill, payment(100)]).status, "PAID");
});
