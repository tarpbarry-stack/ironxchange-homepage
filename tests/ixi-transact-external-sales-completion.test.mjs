import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../components/ixi-aos/transact/modules/sold/IXIAssetSaleContract.js", import.meta.url), "utf8");
const { createIXIAssetSaleDraft, validateIXIAssetSale, getIXIAssetSaleValidationMessages } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

const invoice = {
  financialDocumentId: "ifd_existing_invoice",
  documentNumber: "",
  financialState: "collected",
  totals: { total: 75000 },
  metadata: { customer: { name: "Example Buyer" } },
};
const payment = {
  financialDocumentId: "ifd_existing_receipt",
  documentType: "payment",
  financialState: "paid",
  paymentDirection: "inflow",
  sourceFinancialDocumentId: invoice.financialDocumentId,
  totals: { total: 75000 },
};
const draft = (sourceInvoice = invoice, records = [payment]) => createIXIAssetSaleDraft({
  context: { primary: { passportId: "pass_existing_machine" } },
  input: {
    sourceInvoice,
    buyerLabel: sourceInvoice.metadata.customer.name,
    saleDate: "2026-01-05",
    machineSalePrice: 75000,
    financialRecords: records,
  },
});

test("a collected invoice without a commercial number can close using its permanent identity", () => {
  const before = structuredClone({ invoice, payment });
  const sale = draft();
  assert.equal(validateIXIAssetSale(sale, invoice).valid, true);
  assert.equal(sale.identity.financialInvoiceId, invoice.financialDocumentId);
  assert.equal(sale.identity.saleId, invoice.financialDocumentId);
  assert.equal(sale.sale.invoiceNumber, "");
  assert.equal(sale.identity.number, `SALE-${invoice.financialDocumentId}`);
  assert.equal(sale.collection.amountReceived, 75000);
  assert.equal(sale.collection.balanceDue, 0);
  assert.deepEqual(sale.documents, []);
  assert.deepEqual({ invoice, payment }, before);
});

test("removing the number requirement does not replace canonical identity, issue or collection checks", () => {
  const missingId = draft();
  missingId.identity.financialInvoiceId = "";
  assert.equal(validateIXIAssetSale(missingId, invoice).errors.invoice, "required");
  const unissued = { ...invoice, financialState: "draft" };
  assert.equal(validateIXIAssetSale(draft(unissued), unissued).errors.invoiceState, "invoice-must-be-issued");
  for (const records of [
    [],
    [{ ...payment, totals: { total: 25000 } }],
    [{ ...payment, sourceFinancialDocumentId: "ifd_other_invoice" }],
    [{ ...payment, financialState: "draft" }],
    [{ ...payment, financialState: "reversed" }],
  ]) {
    const result = validateIXIAssetSale(draft(invoice, records), invoice);
    assert.equal(result.valid, false);
    assert.equal(result.errors.collection, "buyer-balance-outstanding");
  }
});

test("closeout explains the field or action needed instead of an opaque REQUIRED message", () => {
  const sale = draft(invoice, []);
  sale.sale.saleDate = "";
  sale.sale.buyerLabel = "";
  const { errors } = validateIXIAssetSale(sale, invoice);
  assert.deepEqual(getIXIAssetSaleValidationMessages(errors), [
    "Add the buyer's name on the invoice.",
    "Enter the closed / sold date.",
    "Record the money received to clear the invoice balance.",
  ]);
  assert.equal(getIXIAssetSaleValidationMessages(errors, "es").length, 3);
  assert.ok(getIXIAssetSaleValidationMessages(errors, "es").every(message => !message.includes("required")));
});

test("SOLD requires the actual machine price and collected funds even at zero balance", () => {
  const missingPrice = draft();
  missingPrice.sale.machineSalePrice = null;
  assert.ok(validateIXIAssetSale(missingPrice, invoice).errors.machineSalePrice);
  const credited = draft();
  credited.collection.amountReceived = 0;
  credited.collection.creditedAmount = 75000;
  credited.collection.balanceDue = 0;
  assert.match(validateIXIAssetSale(credited, invoice).errors.collection, /Actual received funds/);
});
