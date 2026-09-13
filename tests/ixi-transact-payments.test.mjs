import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = new URL("../components/ixi-aos/transact/", import.meta.url);
async function sourceUrl(url) {
  let source = await readFile(url, "utf8");
  for (const match of [...source.matchAll(/from ["'](\.[^"']+)["']/g)]) source = source.replace(match[0], `from "${await sourceUrl(new URL(match[1], url))}"`);
  return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}
const load = async path => import(await sourceUrl(new URL(path, base)));
const model = await load("payments/IXIPaymentModel.js");
const { withIXIBillBalance } = await load("modules/bill/IXIBillBalance.js");
const { getIXIWorkOrderCostProjection } = await load("modules/work-order/IXIWorkOrderProjectionEngine.js");
const { classifyIXIFinancialDocument } = await load("modules/general-ledger/IXIGLPostingEngine.js");
const { buildIXIPayablesProjection } = await load("modules/payables/IXIPayablesProjectionEngine.js");
const source = (id = "bill-1", type = "bill", extra = {}) => ({ server: { revision: 2, entityPassportId: "IXIENTITY001" }, financialDocument: { financialDocumentId: id, documentType: type, financialState: "incurred", occurredAt: "2026-02-01T12:00:00Z", currency: "USD", totals: { total: 1000 }, references: [{ role: "entity", passportId: "IXIENTITY001" }], billRecord: { approval: { status: "approved" } }, ...extra } });
const pay = (id, amount, extra = {}) => source(id, "payment", { sourceFinancialDocumentId: "bill-1", financialState: "paid", paymentDirection: "outflow", occurredAt: "2026-03-15T12:00:00Z", paymentMethod: "CHECK", transactionReference: "CK-104", totals: { total: amount }, lines: [{ financialLineId: `${id}-line`, amount, quantity: 1, rate: amount }], ...extra });

test("one payment produces the same balance/date/method in every projection, without duplicate counting", () => {
  const bill = source(), payment = pay("pay-1", 250.07);
  const records = [bill, payment, payment];
  const summary = model.paymentSummary(bill, records);
  assert.equal(summary.status, "PARTIALLY PAID"); assert.equal(summary.paid, 250.07); assert.equal(summary.balance, 749.93);
  assert.equal(summary.paidDate, "2026-03-15"); assert.equal(summary.method, "CHECK"); assert.equal(summary.reference, "CK-104");
  const projected = withIXIBillBalance({ financialBinding: { financialDocumentId: "bill-1" }, bill: { amount: 1000 }, payment: {} }, records);
  assert.equal(projected.payment.paidDate, summary.paidDate); assert.equal(projected.payment.openBalance, summary.balance);
});

test("a correction replaces a payment revision; a void reopens the balance without reviving legacy evidence", () => {
  const bill = source("bill-1", "bill", { billRecord: { payment: { amountPaid: 1000 } } });
  const old = pay("pay-1", 1000), corrected = { ...pay("pay-1", 700), server: { revision: 3 } };
  assert.equal(model.paymentSummary(bill, [old, corrected]).paid, 700);
  const voided = { ...pay("pay-1", 700, { financialState: "void" }), server: { revision: 4 } };
  const summary = model.paymentSummary(bill, [old, corrected, voided]);
  assert.equal(summary.status, "UNPAID"); assert.equal(summary.balance, 1000); assert.equal(summary.allPayments.length, 1);
});

test("a vendor credit preserves cash already paid and is distinguishable from payment", () => {
  const bill = source(), credit = source("credit-1", "credit", { sourceFinancialDocumentId: "bill-1", totals: { total: 200 } });
  const paid = model.paymentSummary(bill, [pay("pay-1", 1000), credit]);
  assert.equal(paid.paid, 1000); assert.equal(paid.creditBalance, 200);
  const credited = model.paymentSummary(bill, [source("credit-full", "credit", { sourceFinancialDocumentId: "bill-1", totals: { total: 1000 } })]);
  assert.equal(credited.status, "CREDITED"); assert.equal(credited.paid, 0);
});

test("paid-at-entry Expenses remain paid; an unknown historical payment date is never invented", () => {
  const expense = source("expense-1", "expense", { paymentMethod: "company-card" });
  const summary = model.paymentSummary(expense, []);
  assert.equal(summary.status, "PAID"); assert.equal(summary.balance, 0); assert.equal(summary.paidAtEntry, true); assert.equal(summary.paidDate, "");
  assert.equal(model.paymentSummary(source("expense-2", "expense", { paymentMethod: "unpaid" }), []).status, "UNPAID");
  assert.equal(model.paymentSummary(source("expense-3", "expense", { paymentMethod: "my-money" }), []).reimbursement, true);
});

test("unpaid expenses and reimbursements settle through A/P and do not add cost to the Work Order", () => {
  const expense = source("expense-1", "expense", { paymentMethod: "unpaid", metadata: { workOrderId: "wo-1" }, expense: { vendor: "Repair Shop" } });
  const payment = pay("pay-1", 400, { sourceFinancialDocumentId: "expense-1", metadata: { workOrderId: "wo-1", sourceDocumentType: "expense" } });
  const projection = buildIXIPayablesProjection({ financialRecords: [expense, payment] });
  assert.equal(projection.payables[0].balance, 600);
  const costs = getIXIWorkOrderCostProjection({ identity: { workOrderId: "wo-1" } }, [expense, payment]);
  assert.equal(costs.actual, 1000);
});

test("payment date validation accepts historical dates, rejects impossible dates and preserves optional references", () => {
  const input = { amount: "0.07", paidDate: "2026-01-01", method: "CASH", reference: "" };
  assert.equal(model.validatePaymentDraft(input, .07), "");
  for (const date of ["", "2026-02-30", "2026-13-01"]) assert.match(model.validatePaymentDraft({ ...input, paidDate: date }, 1), /date/);
  assert.match(model.validatePaymentDraft({ ...input, amount: 2 }, 1), /more than/);
});

test("unpaid Expense and its payment produce one expense and one A/P settlement in GL", () => {
  const expense = source("expense-1", "expense", { paymentMethod: "unpaid", metadata: { glAccountCode: "6110" } });
  const payment = pay("pay-1", 1000, { sourceFinancialDocumentId: "expense-1", metadata: { sourceDocumentType: "expense" } });
  const expensePost = classifyIXIFinancialDocument({ record: expense });
  const paymentPost = classifyIXIFinancialDocument({ record: payment });
  assert.equal(expensePost.status, "ready", JSON.stringify(expensePost));
  assert.equal(paymentPost.status, "ready", JSON.stringify(paymentPost));
  const e = expensePost.journal.lines, p = paymentPost.journal.lines;
  assert.equal(e.find(line => line.accountCode === "2000").credit, 1000);
  assert.equal(p.find(line => line.accountCode === "2000").debit, 1000);
  assert.equal(p.filter(line => line.accountCode.startsWith("6")).length, 0);
});

test("payment corrections retain line identities and allocations while preserving exact cents", () => {
  const lines = model.correctedPaymentLines({ lines: [{ financialLineId: "a", amount: 60 }, { financialLineId: "b", amount: 40 }] }, 123.07, "2026-01-14", "ACH");
  assert.deepEqual(lines.map(line => line.financialLineId), ["a", "b"]);
  assert.equal(Math.round(lines.reduce((sum, line) => sum + line.amount, 0) * 100), 12307);
  const tiny = model.correctedPaymentLines({ lines: [1, 1, 1, 1].map((amount, index) => ({ financialLineId: String(index), amount })) }, .02, "2026-01-14", "CASH");
  assert.ok(tiny.every(line => line.amount >= 0));
  assert.equal(tiny.reduce((sum, line) => sum + Math.round(line.amount * 100), 0), 2);
});

async function commands(dependencies) {
  const source = await readFile(new URL("payments/IXIPaymentCommands.js", base), "utf8");
  const code = source.replace(/^import[\s\S]*?;\n/gm, "").replace(/export /g, "");
  const deps = { ...model, ...dependencies };
  return new Function(...Object.keys(deps), `${code}\nreturn { saveIXIPayment, voidIXIPayment };`)(...Object.values(deps));
}
test("save records historical payment once with a stable retry key, and legacy expense edits never create cash", async () => {
  const writes = [], patches = [];
  const api = await commands({ createIXIAosObjectFinancialDocument: async input => { writes.push(input); return { ok: true }; }, patchIXIAosFinancialDocument: async input => { patches.push(input); return { ok: true }; } });
  const input = { amount: 1000, paidDate: "2026-01-04", method: "ACH", reference: "" };
  const args = { source: source(), records: [], input, context: {}, object: { passportId: "IXIMACHINE1" }, capabilities: { "financial.payment.create": true }, commandId: "retry-1" };
  await api.saveIXIPayment(args); await api.saveIXIPayment(args);
  assert.equal(writes[0].idempotencyKey, writes[1].idempotencyKey); assert.equal(writes[0].input.occurredAt, "2026-01-04T12:00:00.000Z");
  assert.equal(writes[0].input.sourceFinancialDocumentId, "bill-1"); assert.equal(writes[0].input.transactionReference, "");
  await api.saveIXIPayment({ ...args, source: source("expense-1", "expense", { paymentMethod: "company-card" }), capabilities: { "financial.document.patch": true } });
  assert.equal(writes.length, 2); assert.equal(patches.length, 1); assert.equal(patches[0].patch.expensePayment.paidDate, "2026-01-04");
});

test("insufficient access and held payments never reach a write", async () => {
  const api = await commands({ createIXIAosObjectFinancialDocument: async () => assert.fail("unauthorized write") });
  const args = { source: source(), records: [], input: { amount: 100, paidDate: "2026-01-04", method: "ACH" }, context: {}, object: {}, commandId: "test", capabilities: {} };
  await assert.rejects(api.saveIXIPayment(args), /access/);
  await assert.rejects(api.saveIXIPayment({ ...args, capabilities: { "financial.payment.create": true }, records: [source("hold", "payables-control", { sourceFinancialDocumentId: "bill-1", payablesControl: { control: { hold: true } } })] }), /hold/);
});
