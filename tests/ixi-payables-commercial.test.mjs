import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function importSource(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  return import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  );
}
const projection = await importSource(
  "../components/ixi-aos/transact/modules/payables/IXIPayablesProjectionEngine.js",
);
const policy = await importSource(
  "../components/ixi-aos/transact/modules/payables/IXIPayablesPolicyEngine.js",
);

const bill = (approvalStatus = "approved", financialState = "billed") => ({
  financialDocument: {
    financialDocumentId: "ifd_bill001",
    documentType: "bill",
    financialState,
    documentNumber: "INV-1",
    currency: "USD",
    dueDate: "2026-09-01",
    totals: { total: 1000 },
    billRecord: {
      approval: { status: approvalStatus },
      bill: { amount: 1000, dueDate: "2026-09-01", vendorLabel: "Vendor" },
    },
    references: [{ role: "entity", passportId: "pass_entity" }],
  },
});
const payment = {
  financialDocument: {
    financialDocumentId: "ifd_payment001",
    documentType: "payment",
    financialState: "paid",
    paymentDirection: "outflow",
    sourceFinancialDocumentId: "ifd_bill001",
    totals: { total: 250 },
  },
};
const credit = {
  financialDocument: {
    financialDocumentId: "ifd_credit001",
    documentType: "credit",
    financialState: "incurred",
    sourceFinancialDocumentId: "ifd_bill001",
    totals: { total: 100 },
  },
};

test("approved recognized Bills create A/P and canonical settlements reduce it", () => {
  const result = projection.buildIXIPayablesProjection({
    financialRecords: [bill(), payment, credit],
    asOf: new Date("2026-09-03T00:00:00Z"),
  });
  assert.equal(result.totals.totalAP, 650);
  assert.equal(result.payables[0].paid, 250);
  assert.equal(result.payables[0].credited, 100);
});
test("unapproved Bill capture is work queue exposure, not A/P", () => {
  const result = projection.buildIXIPayablesProjection({
    financialRecords: [bill("pending", "submitted")],
  });
  assert.equal(result.totals.totalAP, 0);
  assert.equal(result.totals.needsApproval, 1000);
  assert.equal(result.payables[0].status, "needs-approval");
});
test("payment policy requires permission, recognition, open balance, and no control block", () => {
  const context = {
    permissions: [
      "financial.payment.create",
      "financial.vendor-credit.apply",
      "financial.document.patch",
    ],
  };
  assert.equal(
    policy.getIXIPayablesPolicy({
      context,
      payable: { recognized: true, balance: 100 },
    }).canPostPayment,
    true,
  );
  assert.equal(
    policy.getIXIPayablesPolicy({
      context,
      payable: { recognized: true, balance: 100, hold: true },
    }).canPostPayment,
    false,
  );
  assert.equal(
    policy.getIXIPayablesPolicy({
      context: { permissions: [] },
      payable: { recognized: true, balance: 100 },
    }).canPostPayment,
    false,
  );
});
test("Payables commands use IX Core canonical settlement fields", async () => {
  const source = await readFile(
    new URL(
      "../components/ixi-aos/transact/modules/payables/IXIPayablesCommands.js",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(source, /paymentDirection:\s*"outflow"/u);
  assert.match(
    source,
    /sourceFinancialDocumentId:\s*clean\(payable\.billId\)/u,
  );
  assert.match(source, /transactionReference:\s*clean\(input\.reference\)/u);
  assert.match(source, /reasonCode:\s*"vendor-credit"/u);
  assert.match(source, /documentType:\s*"payables-control"/u);
  assert.match(
    source,
    /expectedRevision:\s*record\?\.financialBinding\?\.revision/u,
  );
  assert.doesNotMatch(source, /relatedBillId:/u);
});
