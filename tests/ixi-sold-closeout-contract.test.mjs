import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../components/ixi-aos/transact/modules/sold/IXIAssetSaleContract.js", import.meta.url),
  "utf8",
);
const contract = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

const sourceInvoice = {
  financialDocumentId: "ifd_invoice_1",
  documentNumber: "INV-1001",
  financialState: "billed",
  totals: { total: 82000 },
  dueDate: "2026-09-10",
  externalReference: "PO-77",
  financialBinding: { financialDocumentId: "ifd_invoice_1", revision: 4 },
};

test("SOLD carries the canonical Invoice identity and commercial terms forward", () => {
  const sale = contract.createIXIAssetSaleDraft({
    context: { primary: { passportId: "IXI544KII", label: "2017 Deere 544K II" } },
    input: {
      sourceInvoice,
      buyerLabel: "Clements Farm",
      saleDate: "2026-09-06",
      receipts: [{ paymentId: "pay-1", amount: 82000, reference: "QB-DEP-1" }],
    },
  });

  assert.equal(sale.identity.financialInvoiceId, "ifd_invoice_1");
  assert.equal(sale.sale.invoiceNumber, "INV-1001");
  assert.equal(sale.sale.salePrice, 82000);
  assert.equal(sale.sale.dueDate, "2026-09-10");
  assert.equal(sale.sale.buyerPoNumber, "PO-77");
  assert.equal(sale.collection.balanceDue, 0);
  assert.equal(contract.validateIXIAssetSale(sale, sourceInvoice).valid, true);
});

test("SOLD rejects open balances and ignores non-final consideration", () => {
  const sale = contract.createIXIAssetSaleDraft({
    context: { primary: { passportId: "IXI544KII" } },
    input: {
      sourceInvoice,
      buyerLabel: "Clements Farm",
      saleDate: "2026-09-06",
      financialRecords: [
        { financialDocument: { financialDocumentId: "pay-draft", documentType: "payment", financialState: "draft", paymentDirection: "inflow", sourceFinancialDocumentId: "ifd_invoice_1", totals: { total: 82000 } } },
        { financialDocument: { financialDocumentId: "pay-good", documentType: "payment", financialState: "paid", paymentDirection: "inflow", sourceFinancialDocumentId: "ifd_invoice_1", totals: { total: 40000 } } },
      ],
    },
  });

  assert.equal(sale.collection.amountReceived, 40000);
  assert.equal(sale.collection.balanceDue, 42000);
  assert.equal(contract.validateIXIAssetSale(sale, sourceInvoice).valid, false);
});
