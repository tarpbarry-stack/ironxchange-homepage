import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = new URL("../components/ixi-aos/transact/", import.meta.url);
async function sourceUrl(url) {
  if (!url.pathname.endsWith(".js")) url = new URL(`${url.href}.js`);
  let source = await readFile(url, "utf8");
  for (const match of [...source.matchAll(/from ["'](\.[^"']+)["']/g)]) source = source.replace(match[0], `from "${await sourceUrl(new URL(match[1], url))}"`);
  return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}
const load = async path => import(await sourceUrl(new URL(path, base)));
const model = await load("payments/IXIPaymentModel.js");
const { formatIXIAccountingMoney } = await load("IXIMoney.js");
const { withIXIBillBalance } = await load("modules/bill/IXIBillBalance.js");
const { getIXIWorkOrderCostProjection } = await load("modules/work-order/IXIWorkOrderProjectionEngine.js");
const { classifyIXIFinancialDocument } = await load("modules/general-ledger/IXIGLPostingEngine.js");
const { buildIXIPayablesProjection } = await load("modules/payables/IXIPayablesProjectionEngine.js");
const billContract = await load("modules/bill/IXIBillContract.js");
const { applyIXIBillAction } = await load("modules/bill/IXIBillRecordEngine.js");
const source = (id = "bill-1", type = "bill", extra = {}) => ({ server: { revision: 2, entityPassportId: "IXIENTITY001" }, financialDocument: { financialDocumentId: id, documentType: type, financialState: "incurred", occurredAt: "2026-02-01T12:00:00Z", currency: "USD", totals: { total: 1000 }, references: [{ role: "entity", passportId: "IXIENTITY001" }], billRecord: { approval: { status: "approved" } }, ...extra } });
const pay = (id, amount, extra = {}) => source(id, "payment", { sourceFinancialDocumentId: "bill-1", financialState: "paid", paymentDirection: "outflow", occurredAt: "2026-03-15T12:00:00Z", paymentMethod: "CHECK", transactionReference: "CK-104", totals: { total: amount }, lines: [{ financialLineId: `${id}-line`, amount, quantity: 1, rate: amount }], ...extra });

test("Desktop accounting amounts retain exact cents instead of using rounded AOS summaries", () => {
  assert.equal(formatIXIAccountingMoney(474.66), "$474.66");
  assert.equal(formatIXIAccountingMoney(.07), "$0.07");
  assert.equal(formatIXIAccountingMoney(10500), "$10,500.00");
  assert.equal(formatIXIAccountingMoney(-500), "-$500.00");
});

test("company payment scope reuses the authenticated Entity Passport without changing Object identity", () => {
  const object = { objectId: "entity-1", passportId: "", displayName: "Company" };
  assert.deepEqual(model.paymentScopeObject(object, "company", "IXIENTITY001"), { ...object, passportId: "IXIENTITY001" });
  assert.equal(object.passportId, "");
  assert.equal(model.paymentScopeObject(object, "machine", "IXIENTITY001"), object);
  const machine = { objectId: "object-1", passportId: "IXIMACHINE1" };
  assert.equal(model.paymentScopeObject(machine, "company", "IXIENTITY001"), machine);
});

test("Desktop identity changes retain the released common payment entry and row actions", async () => {
  const desktop = await readFile(new URL("../../../ixi-command-center/IXITransactCommandCenter.jsx", new URL("payments/IXIPaymentModel.js", base)), "utf8");
  assert.match(desktop, /<IXIPaymentsPanel\b/);
  assert.match(desktop, /onClick=\{\(\) => openPaymentRecord\(\)\}[^>]*>PAYMENTS<\/button>/);
  assert.match(desktop, /onMarkPaid=\{openPaymentRecord\}/);
  assert.match(desktop, /paymentScopeObject\(buildTransactObject/);
  assert.match(desktop, /STOCK NUMBER/);
});

test("the payment shortcut inside a saved bill or expense stays on the selected charge", async () => {
  const app = await readFile(new URL("IXITransactApp.jsx", base), "utf8");
  assert.match(app, /sourceIds=\{clean\(selectedFinancialDocumentId\) && \["bill", "expense"\]\.includes\(moduleId\) \? \[clean\(selectedFinancialDocumentId\)\] : null\}/);
});

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

test("Mark Paid approves a proven legacy Freight Bill and records its payment through the existing commands", async () => {
  const freightOrderId = "FO-20260905-TEST1234";
  const context = { primary: { passportId: "IXIMACHINE1" }, entity: { passportId: "IXIENTITY001" }, actor: { passportId: "IXIAPPROVER" } };
  const billRecord = billContract.createIXIBillRecord({ context, input: { clientRequestId: `${freightOrderId}:FREIGHT-TEST`, invoiceNumber: "FREIGHT-TEST", vendorLabel: "Test Carrier", description: "Freight test", invoiceDate: "2026-02-01", dueDate: "2026-03-01", amount: 1600, purchaseOrderId: freightOrderId, purchaseOrderNumber: freightOrderId, poCommittedAmount: 0, receivedAmount: 1600 } });
  const initial = source("bill-1", "bill", { billRecord, financialState: "submitted", totals: { total: 1600 }, lines: [{ financialLineId: "freight-line", amount: 1600 }], metadata: {} });
  initial.server.storageMetadata = { source: "ixi-transact-freight", transactModule: "bill", freightOrderId };
  let current = structuredClone(initial);
  const writes = [];
  const billCode = (await readFile(new URL("modules/bill/IXIBillCommands.js", base), "utf8")).replace(/^import[\s\S]*?;\n/gm, "").replace(/export default /g, "const defaultExport = ").replace(/export /g, "");
  const updateIXIBill = new Function("patchIXIAosFinancialDocument", "createIXIBillInvoiceFingerprint", `${billCode}\nreturn updateIXIBill;`)(async args => {
    writes.push({ type: "approval", args });
    assert.equal(args.expectedRevision, 2);
    assert.equal(args.patch.billRecord.approval.status, "approved");
    assert.equal(args.patch.billRecord.approval.approvedById, "IXIAPPROVER");
    assert.equal(args.patch.billRecord.purchaseMatch.status, "n/a");
    assert.deepEqual(args.patch.billRecord.freight.legacyPurchaseMatch, initial.financialDocument.billRecord.purchaseMatch);
    assert.equal(args.metadata.purchaseOrderNumber, "");
    assert.equal(args.metadata.freightOrderId, freightOrderId);
    assert.equal(args.patch.totals.total, 1600);
    assert.equal(args.patch.lines[0].financialLineId, "freight-line");
    current = { server: { ...current.server, revision: 3, storageMetadata: { ...current.server.storageMetadata, ...args.metadata } }, financialDocument: { ...current.financialDocument, ...args.patch } };
    return { data: { record: current } };
  }, billContract.createIXIBillInvoiceFingerprint);
  const api = await commands({ hydrateIXIBillRecord: billContract.hydrateIXIBillRecord, applyIXIBillAction, updateIXIBill,
    loadIXIAosFinancialDocument: async () => current,
    createIXIAosObjectFinancialDocument: async args => {
      assert.equal(current.financialDocument.financialState, "billed", "approval must finish before payment");
      writes.push({ type: "payment", args }); return { ok: true };
    } });
  const args = { source: initial, records: [], context, object: context.primary, input: { amount: 1600, paidDate: "2026-02-04", method: "ACH" }, commandId: "freight-payment-test", capabilities: { "financial.payment.create": true, "financial.document.approve": true } };
  await api.saveIXIPayment(args);
  assert.deepEqual(writes.map(write => write.type), ["approval", "payment"]);
  assert.equal(writes[1].args.input.sourceFinancialDocumentId, "bill-1");
  assert.equal(writes[1].args.input.occurredAt, "2026-02-04T12:00:00.000Z");
  await api.saveIXIPayment(args);
  assert.deepEqual(writes.map(write => write.type), ["approval", "payment", "payment"]);
  assert.equal(writes[1].args.idempotencyKey, writes[2].args.idempotencyKey, "retry does not invent a second payment identity");
  assert.equal(billContract.hydrateIXIBillRecord(current).freight.legacyPurchaseMatch.variance, 1600);

  writes.length = 0; current = structuredClone(initial);
  await assert.rejects(api.saveIXIPayment({ ...args, capabilities: { "financial.payment.create": true } }), /needs approval/);
  assert.equal(writes.length, 0);
  current.financialDocument.sourceFinancialDocumentId = "ifd_real_purchase_order";
  await assert.rejects(api.saveIXIPayment(args), /purchase-order difference/);
  assert.equal(writes.length, 0, "real PO exceptions cannot approve or pay through the compatibility path");
});
