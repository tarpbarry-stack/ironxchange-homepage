import test from "node:test";
import assert from "node:assert/strict";
import { buildMachineLedger, filterMachineLedger, moneyLabel } from "../components/ixi-command-center/IXITransactMachineLedger.mjs";
import { csvCell, machineCsv, exportDocumentSnapshot, recordEvidence, transactionLink } from "../components/ixi-command-center/IXITransactExportModel.mjs";

const record = (id, type, amount, extra = {}, revision = 1) => ({ server: { revision }, financialDocument: { financialDocumentId: id, documentNumber: id.toUpperCase(), documentType: type, ...(type === "expense" ? { paymentMethod: "company-card" } : {}), currency: "USD", financialState: "incurred", occurredAt: "2026-01-01", totals: { total: amount }, ...extra } });
const total = records => buildMachineLedger(records).totals.USD;

test("a machine's sale, payment and work-order rollup do not inflate costs or revenue", () => {
  const records = [record("acq", "asset-acquisition", 40000), record("exp", "expense", 474.66), record("wo", "work-order", 474.66), record("so", "sales-order", 80000), record("inv", "invoice", 80000), record("pay", "payment", 80000, { sourceFinancialDocumentId: "inv", paymentDirection: "inflow", financialState: "paid" })];
  assert.deepEqual(total(records), { costCents: 4047466, revenueCents: 8000000, receivedCents: 8000000, paidCents: 47466, pendingCents: 0, marginCents: 3952534, receivableCents: 0, payableCents: 0, hours: 0 });
  assert.equal(moneyLabel(47466), "$474.66");
});

test("captured bills and rental agreements are separated from recognized costs and billed revenue", () => {
  const t = total([record("submitted", "bill", 1500, { financialState: "submitted", accountingTreatment: { createsIncurredExpense: false } }), record("bill", "bill", 2000, { financialState: "billed", accountingTreatment: { createsIncurredExpense: true } }), record("rent", "rental-income", 5000), record("draft", "invoice", 700, { financialState: "draft" })]);
  assert.equal(t.costCents, 200000); assert.equal(t.pendingCents, 150000); assert.equal(t.revenueCents, 0); assert.equal(t.payableCents, 200000);
});

test("expense corrections apply signed deltas once and a reversal nets the original to zero", () => {
  const original = record("expense", "expense", 500);
  const correction = record("correction", "adjustment", -100, { sourceFinancialDocumentId: "expense", metadata: { expenseCorrection: true }, expenseCorrection: { amountDelta: -100 }, occurredAt: "2026-01-02" });
  const reversal = record("reversal", "adjustment", -400, { sourceFinancialDocumentId: "expense", metadata: { expenseCorrection: true }, expenseCorrection: { amountDelta: -400, fullReversal: true }, occurredAt: "2026-01-03" });
  assert.equal(total([original, correction]).costCents, 40000);
  assert.equal(total([original, correction, reversal]).costCents, 0);
  const invalid = buildMachineLedger([correction]);
  assert.equal(invalid.reviewRows.length, 1); assert.equal(invalid.totals.USD.costCents, 0);
});

test("credits reduce their own source side; settlements and cash never create a second economic event", () => {
  const records = [record("bill", "bill", 100), record("vendorcredit", "credit", 20, { sourceFinancialDocumentId: "bill" }), record("paid", "payment", 30, { sourceFinancialDocumentId: "bill", paymentDirection: "outflow" }), record("inv", "invoice", 500), record("credit", "credit", 50, { sourceFinancialDocumentId: "inv" }), record("receipt", "payment", 200, { sourceFinancialDocumentId: "inv", paymentDirection: "inflow" }), record("settlement", "settlement", 250)];
  const ledger = buildMachineLedger(records), t = ledger.totals.USD;
  assert.equal(t.costCents, 8000); assert.equal(t.revenueCents, 45000); assert.equal(t.payableCents, 5000); assert.equal(t.receivableCents, 25000);
  assert.equal(ledger.rows.find(row => row.id === "bill").paymentStatus, "PART PAID");
});

test("the opening balance reuses shared unpaid-expense and reimbursement payment rules", () => {
  const ledger = buildMachineLedger([
    record("unpaid", "expense", 100, { paymentMethod: "unpaid" }),
    record("reimbursement", "expense", 50, { paymentMethod: "my-money" }),
    record("cash", "expense", 25, { paymentMethod: "company-cash" }),
    record("partial", "payment", 30, { sourceFinancialDocumentId: "unpaid", paymentDirection: "outflow", financialState: "paid" })
  ]);
  assert.equal(ledger.totals.USD.costCents, 17500);
  assert.equal(ledger.totals.USD.payableCents, 12000);
  assert.equal(ledger.totals.USD.paidCents, 5500);
  assert.equal(ledger.rows.find(row => row.id === "cash").paymentStatus, "PAID");
  assert.equal(ledger.rows.find(row => row.id === "unpaid").paymentStatus, "PART PAID");
});

test("a reversed canonical bill payment does not revive an old embedded paid amount", () => {
  const ledger = buildMachineLedger([
    record("bill", "bill", 100, { billRecord: { payment: { amountPaid: 100 } } }),
    record("void-payment", "payment", 100, { sourceFinancialDocumentId: "bill", paymentDirection: "outflow", financialState: "reversed" })
  ]);
  assert.equal(ledger.totals.USD.payableCents, 10000);
  assert.equal(ledger.rows.find(row => row.id === "bill").paymentStatus, "UNPAID");
});

test("revisions are deduplicated; inactive payments are excluded; currencies are never added together", () => {
  const ledger = buildMachineLedger([record("x", "expense", 100, {}, 1), record("x", "expense", 125, {}, 2), record("eur", "expense", 80, { currency: "EUR" }), record("voidpay", "payment", 1000, { paymentDirection: "inflow", financialState: "void" })]);
  assert.equal(ledger.rows.length, 3); assert.equal(ledger.totals.USD.costCents, 12500); assert.equal(ledger.totals.EUR.costCents, 8000); assert.equal(ledger.totals.USD.receivedCents, 0);
});

test("only explicit cost-conversion lineage deduplicates cost; similar records remain independent", () => {
  assert.equal(total([record("expense", "expense", 100), record("bill", "bill", 100, { sourceFinancialDocumentId: "expense" })]).costCents, 10000);
  assert.equal(total([record("expense", "expense", 100), record("bill", "bill", 100)]).costCents, 20000);
  const ambiguous = buildMachineLedger([record("expense", "expense", 100), record("bill", "bill", 110, { sourceFinancialDocumentId: "expense" })]);
  assert.equal(ambiguous.reviewRows.length, 1);
});

test("labor hours use saved time entries; shared assets require an allocation", () => {
  const ledger = buildMachineLedger([record("time", "time-entry", 125, { totals: { total: 125, laborHours: 2.5 } }), record("shared", "expense", 800, { references: [{ role: "asset", passportId: "A" }, { role: "asset", passportId: "B" }] })], { passportId: "A" });
  assert.equal(ledger.totals.USD.hours, 2.5); assert.equal(ledger.totals.USD.costCents, 12500); assert.equal(ledger.reviewRows.length, 1);
});

test("filtered history retains lifetime running costs and reaches every row beyond fifty", () => {
  const ledger = buildMachineLedger(Array.from({ length: 120 }, (_, index) => record(`expense-${String(index).padStart(3, "0")}`, "expense", 1, { occurredAt: index < 60 ? "2025-01-01" : "2026-01-01" })));
  const filtered = filterMachineLedger(ledger.rows, { from: "2026-01-01", direction: "asc" });
  assert.equal(filtered.length, 60); assert.equal(filtered[0].runningCostCents, 6100); assert.equal(filtered.at(-1).runningCostCents, 12000);
  assert.equal(filterMachineLedger(ledger.rows, { effect: "received" }).length, 0);
});

test("CSV preserves cents, escapes commas and prevents formula execution in text fields", () => {
  assert.equal(csvCell("=HYPERLINK(\"bad\")"), '"\'=HYPERLINK(""bad"")"');
  assert.equal(csvCell(-123.45), "-123.45");
  assert.equal(csvCell("  +SUM(A1)"), '"\'  +SUM(A1)"');
  const rows = buildMachineLedger([record("id", "expense", 474.66, { vendorName: "Vendor, Inc." })]).rows;
  const csv = machineCsv(rows, { passportId: "P" }, { displayName: "Entity" });
  assert.match(csv, /474\.66/); assert.match(csv, /"Vendor, Inc\."/); assert.match(csv, /Financial document ID/);
});

test("export snapshots omit storage capabilities and private links retain protected application routing", () => {
  assert.deepEqual(exportDocumentSnapshot({ amount: 3, attachments: [{ fileName: "a.pdf", storageKey: "private/key", verification: "secret", url: "https://signed" }] }), { amount: 3, attachments: [{ fileName: "a.pdf" }] });
  assert.equal(recordEvidence({ attachments: [{ attachmentId: "one" }], billRecord: { documents: [{ attachmentId: "one" }] } }).length, 1);
  const url = new URL(transactionLink({ passportId: "IXI-123" }, { id: "ifd_1" }, "https://preview.example.com"));
  assert.equal(url.pathname, "/transact"); assert.equal(url.searchParams.get("record"), "ifd_1");
});
