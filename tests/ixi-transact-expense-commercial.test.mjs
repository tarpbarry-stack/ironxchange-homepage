import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function importSource(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

const engine = await importSource("../components/ixi-aos/transact/modules/expense/IXIExpenseRecordEngine.js");
const registry = await importSource("../components/ixi-aos/transact/modules/expense/IXIExpenseCategoryRegistry.js");
const costBasis = await importSource("../components/ixi-aos/transact/IXIMachineCostBasisEngine.js");

const sourceDocument = {
  server: { revision: 4 },
  financialDocument: {
    financialDocumentId: "fd-expense-544k-1",
    documentNumber: "EXP-00041",
    documentType: "expense",
    financialState: "incurred",
    vendor: "Wash Rack Services",
    description: "Machine cleanup",
    amount: 1200,
    occurredAt: "2026-09-05T00:00:00.000Z",
    category: "contract-labor-1099",
    paymentMethod: "company-cash",
    metadata: {
      transactModule: "expense",
      originatingPassportId: "IXIUJ68R3A",
      expenseCostPurpose: "make-ready-cleanup",
      costBasis: true
    }
  }
};

test("F$1 selection hydrates the exact canonical Expense by financial document id", () => {
  const record = engine.findIXIExpenseRecord([sourceDocument], "fd-expense-544k-1");
  assert.equal(record.identity.financialDocumentId, "fd-expense-544k-1");
  assert.equal(record.identity.number, "EXP-00041");
  assert.equal(record.context.primaryPassportId, "IXIUJ68R3A");
  assert.equal(record.expense.vendor, "Wash Rack Services");
  assert.equal(record.expense.costPurpose, "make-ready-cleanup");
  assert.equal(record.financialBinding.revision, 4);
});

test("open Expense amendment preserves the original and appends before/after evidence", () => {
  const record = engine.findIXIExpenseRecord([sourceDocument], "fd-expense-544k-1");
  const amended = engine.amendIXIExpenseRecord(record, {
    ...record.expense,
    amount: 1350,
    changeReason: "Vendor corrected the invoice",
    changeReference: "INV-885-R1",
    commandId: "amend-1"
  }, { passportId: "IXIEMP1", displayName: "Finance Manager" });
  assert.equal(amended.originalExpense.amount, 1200);
  assert.equal(amended.expense.amount, 1350);
  assert.equal(amended.amendments.length, 1);
  assert.equal(amended.amendments[0].amountDelta, 150);
  assert.deepEqual(amended.amendments[0].changes[0], {
    field: "amount",
    previousValue: 1200,
    revisedValue: 1350
  });
});

test("locked Expense cannot be overwritten and instead produces a linked delta correction", () => {
  const locked = { ...engine.findIXIExpenseRecord([sourceDocument], "fd-expense-544k-1"), status: "posted" };
  assert.throws(() => engine.amendIXIExpenseRecord(locked, { ...locked.expense, amount: 1300, changeReason: "Correction" }), /require a correction/u);
  const correction = engine.createIXIExpenseCorrection(locked, {
    ...locked.expense,
    amount: 1000,
    changeReason: "Partial vendor credit",
    changeReference: "CM-22",
    commandId: "corr-1",
    effectiveDate: "2026-09-06"
  });
  assert.equal(correction.sourceFinancialDocumentId, "fd-expense-544k-1");
  assert.equal(correction.amountDelta, -200);
  assert.equal(correction.previousExpense.amount, 1200);
  assert.equal(correction.effectiveExpense.amount, 1000);
});

test("full reversal creates a negative delta without rewriting the source", () => {
  const record = engine.findIXIExpenseRecord([sourceDocument], "fd-expense-544k-1");
  const reversal = engine.createIXIExpenseCorrection(record, {
    ...record.expense,
    fullReversal: true,
    changeReason: "Duplicate expense",
    commandId: "reverse-1"
  });
  assert.equal(reversal.type, "expense-reversal");
  assert.equal(reversal.amountDelta, -1200);
  assert.equal(reversal.effectiveExpense.amount, 0);
});

test("F$2 applies a correction delta exactly once", () => {
  const result = costBasis.getIXIMachineCostBasis({ records: [
    { id: "fd-expense-544k-1", documentType: "expense", status: "incurred", amount: 1200, document: { metadata: { costBasis: true, expenseCostPurpose: "make-ready-cleanup" } } },
    { id: "fd-correction-1", documentType: "adjustment", status: "incurred", amount: -200, document: { metadata: { costBasis: true, expenseCorrection: true, expenseCostPurpose: "make-ready-cleanup" } } }
  ] });
  assert.equal(result.totalInvested, 1000);
  assert.equal(result.actualRecords.length, 2);
});

test("company policy can extend or replace categories and attach GL mapping", () => {
  const extended = registry.getIXIExpenseCategories({
    categories: [{ id: "environmental", label: "Environmental", labelEs: "Ambiental", glAccountCode: "6810", glAccountName: "Environmental Fees" }]
  });
  assert.ok(extended.some(item => item.id === "parts-material"));
  assert.equal(extended.find(item => item.id === "environmental").glAccountCode, "6810");
  const replaced = registry.getIXIExpenseCategories({ categoryMode: "replace", categories: ["Custom Expense"] });
  assert.deepEqual(replaced.map(item => item.id), ["custom-expense"]);
});

test("Expense UI and commands enforce exact reopen, revision updates, and linked corrections", async () => {
  const app = await readFile(new URL("../components/ixi-aos/transact/modules/expense/IXIExpenseApp.jsx", import.meta.url), "utf8");
  const commands = await readFile(new URL("../components/ixi-aos/transact/modules/expense/IXIExpenseCommands.js", import.meta.url), "utf8");
  const shell = await readFile(new URL("../components/ixi-aos/transact/IXITransactApp.jsx", import.meta.url), "utf8");
  assert.match(shell, /selectedFinancialDocumentId=\{selectedFinancialDocumentId\}/u);
  assert.match(shell, /initialRecord=\{expenseSnapshot\}/u);
  assert.match(app, /mode === "missing"/u);
  assert.match(app, /IMMUTABLE ACTIVITY/u);
  assert.match(app, /CORRECT \/ REVERSE/u);
  assert.match(commands, /patchIXIAosFinancialDocument/u);
  assert.match(commands, /expectedRevision/u);
  assert.match(commands, /documentType: "adjustment"/u);
  assert.match(commands, /sourceFinancialDocumentId/u);
  assert.match(commands, /amount: correction\.amountDelta/u);
});
