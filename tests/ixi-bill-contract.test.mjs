import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function importSource(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

const contract = await importSource("../components/ixi-aos/transact/modules/bill/IXIBillContract.js");
const context = {
  primary: { passportId: "PASS-CAT336", objectId: "M-CAT336", objectType: "machine", label: "CAT 336" },
  entity: { passportId: "PASS-IXI", label: "IronXchange LLC" },
  location: { passportId: "PASS-MIDLAND", label: "Midland Yard" },
  actor: { passportId: "PASS-MIKE", employeeId: "EMP-MIKE", displayName: "Mike Thompson" }
};

function input(overrides = {}) {
  return { clientRequestId: "REQ-1", vendorLabel: "Hydraulic Supply Co.", invoiceNumber: "HS-78451", description: "Hydraulic repair parts", amount: 482.17, currency: "USD", invoiceDate: "2026-09-03", dueDate: "2026-10-03", attachments: [], ...overrides };
}

test("Bill capture keeps the field form simple and carries AOS, Entity, and employee lineage", () => {
  const record = contract.createIXIBillRecord({ context, input: input() });
  assert.equal(record.schema, "ixi-bill-record-v2");
  assert.equal(record.status, "submitted");
  assert.equal(record.context.primaryPassportId, "PASS-CAT336");
  assert.equal(record.context.entityPassportId, "PASS-IXI");
  assert.equal(record.context.employeePassportId, "PASS-MIKE");
  assert.equal(record.bill.amount, 482.17);
  assert.equal(record.payment.amountPaid, 0);
  assert.equal(contract.validateIXIBillInput(input()).valid, true);
});

test("Vendor invoice fingerprint is stable across case, punctuation, and whitespace", () => {
  const first = contract.createIXIBillInvoiceFingerprint({ entityPassportId: "PASS-IXI", vendorLabel: "Hydraulic Supply Co.", invoiceNumber: " HS-78451 " });
  const second = contract.createIXIBillInvoiceFingerprint({ entityPassportId: "pass-ixi", vendorLabel: "HYDRAULIC  SUPPLY CO", invoiceNumber: "hs 78451" });
  assert.equal(first, second);
});

test("Bill validation rejects bad dates, zero amounts, and browser-only files", () => {
  const result = contract.validateIXIBillInput(input({ amount: 0, dueDate: "2026-08-31", attachments: [{ fileName: "invoice.pdf", status: "local-pending-upload" }] }));
  assert.equal(result.valid, false);
  assert.equal(result.errors.amount, "invalid");
  assert.equal(result.errors.dueDate, "before-invoice-date");
  assert.equal(result.errors.attachments, "upload-incomplete");
});

test("Persisted Bill records hydrate with canonical identity and revision", () => {
  const draft = contract.createIXIBillRecord({ context, input: input() });
  const hydrated = contract.hydrateIXIBillRecord({ server: { revision: 4 }, financialDocument: { financialDocumentId: "ifd_bill001", documentType: "bill", documentNumber: "HS-78451", billRecord: draft, lines: [{ financialLineId: "ifl_1", amount: 482.17 }] } });
  assert.equal(hydrated.identity.billDocumentId, "ifd_bill001");
  assert.equal(hydrated.financialBinding.revision, 4);
  assert.equal(hydrated.financialBinding.financialLineId, "ifl_1");
});

test("Bill commands use canonical amount fields, deterministic duplicate control, and separate payment lineage", async () => {
  const source = await readFile(new URL("../components/ixi-aos/transact/modules/bill/IXIBillCommands.js", import.meta.url), "utf8");
  assert.match(source, /idempotencyKey:\s*`ixi-bill:\$\{fingerprint\}`/u);
  assert.match(source, /amount:\s*numeric\(input\.amount\)/u);
  assert.match(source, /sourceFinancialDocumentId:\s*clean\(record\?\.identity\?\.billDocumentId/u);
  assert.match(source, /updateIXIBill/u);
  assert.doesNotMatch(source, /financialState:\s*"billed"/u);
});
