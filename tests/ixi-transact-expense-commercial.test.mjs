import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Expense launches from the Passport-backed private TRANSACT runtime", () => {
  const runtime = read("components/ixi-machine-card/private/IXIOwnedPrivateTransactRuntime.jsx");
  const registry = read("components/ixi-aos/transact/IXITransactModuleRegistry.js");

  assert.match(runtime, /loadIXIAosPassportFinancialDocuments/u);
  assert.match(runtime, /financialRecords: state\.records/u);
  assert.match(registry, /id: "expense", label: "EXPENSE"/u);
});

test("Expense command binds Entity, Passport, Object and optional Work Order", () => {
  const commands = read("components/ixi-aos/transact/modules/expense/IXIExpenseCommands.js");

  assert.match(commands, /role: "entity"/u);
  assert.match(commands, /originatingPassportId/u);
  assert.match(commands, /originatingObjectType/u);
  assert.match(commands, /workOrderId/u);
  assert.match(commands, /workOrderNumber/u);
  assert.match(commands, /reimbursement: draft\.reimbursement/u);
});

test("Expense sends canonical accounting fields and a stable idempotency identity", () => {
  const commands = read("components/ixi-aos/transact/modules/expense/IXIExpenseCommands.js");
  const app = read("components/ixi-aos/transact/modules/expense/IXIExpenseApp.jsx");

  assert.match(commands, /financialState: "incurred"/u);
  assert.match(commands, /occurredAt: `\$\{draft\.expense\.expenseDate\}T00:00:00\.000Z`/u);
  assert.match(commands, /externalReference: draft\.expense\.referenceNumber/u);
  assert.match(commands, /receiptRequired: draft\.expense\.receiptRequired/u);
  assert.match(commands, /idempotencyKey: stableId/u);
  assert.match(app, /createClientRequestId/u);
  assert.match(app, /commandId: requestRef\.current/u);
});

test("successful Expense save refreshes the same Passport history before returning", () => {
  const shell = read("components/ixi-aos/transact/IXITransactApp.jsx");

  assert.match(
    shell,
    /id: "expense-save"[\s\S]*await onFinancialRecordsChange\?\.\(\); back\(\);/u
  );
});

test("field Expense capture stays simple and MY MONEY is explicit", () => {
  const app = read("components/ixi-aos/transact/modules/expense/IXIExpenseApp.jsx");
  const contract = read("components/ixi-aos/transact/modules/expense/IXIExpenseContract.js");

  for (const field of ["vendor", "description", "amount", "category", "paymentMethod"]) {
    assert.match(app, new RegExp(`\\[${field}, set`, "u"));
  }
  assert.match(app, /MY MONEY/u);
  assert.match(contract, /status: employeePaid \? "owed" : "not-applicable"/u);
  assert.match(contract, /Receipt is required by company policy/u);
});
