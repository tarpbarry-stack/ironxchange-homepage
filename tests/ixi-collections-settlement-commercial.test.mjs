import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function importSource(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

const collections = await importSource("../components/ixi-aos/transact/modules/collections/IXICollectionsProjectionEngine.js");
const settlement = await importSource("../components/ixi-aos/transact/modules/settlement/IXISettlementEngine.js");

test("Collections projects canonical provider records and linked A/R settlements", () => {
  const financialRecords = [
    { financialDocument: { financialDocumentId: "ifd_invoice1", documentType: "invoice", financialState: "billed", documentNumber: "INV-1", dueDate: "2026-08-01", totals: { total: 100 }, references: [{ role: "customer", passportId: "pass_customer", label: "Acme" }] } },
    { financialDocument: { financialDocumentId: "ifd_payment1", documentType: "payment", financialState: "paid", paymentDirection: "inflow", sourceFinancialDocumentId: "ifd_invoice1", totals: { total: 25 }, metadata: { arPayment: true } } },
    { financialDocument: { financialDocumentId: "ifd_credit1", documentType: "credit", financialState: "incurred", sourceFinancialDocumentId: "ifd_invoice1", totals: { total: 10 }, metadata: { arCredit: true } } },
  ];
  const result = collections.buildIXIReceivableProjection({ financialRecords, asOf: new Date("2026-09-03T00:00:00Z") });
  assert.equal(result.receivables[0].invoiceId, "ifd_invoice1");
  assert.equal(result.receivables[0].balance, 65);
  assert.equal(result.receivables[0].received, 25);
  assert.equal(result.receivables[0].credited, 10);
});

test("Settlement derives collected cash from canonical invoice-linked receipts", () => {
  const result = settlement.projectIXIAssetSettlement({
    sale: { identity: { saleId: "ifd_sale1", financialInvoiceId: "ifd_sale1" }, sale: { salePrice: 100 }, collection: { amountReceived: 0 } },
    acquisition: { acquisition: { directAcquisitionCost: 40 }, makeReady: { actualTotal: 10 } },
    financialRecords: [{ financialDocument: { documentType: "payment", financialState: "paid", paymentDirection: "inflow", sourceFinancialDocumentId: "ifd_sale1", totals: { total: 100 }, metadata: { assetSalePayment: true } } }],
  });
  assert.equal(result.collected, 100);
  assert.equal(result.buyerBalance, 0);
  assert.equal(result.cashAvailableBeforeOwners, 100);
});

test("Settlement excludes draft, void, and reversed customer consideration", () => {
  const financialRecords = [
    { financialDocument: { documentType: "payment", financialState: "paid", paymentDirection: "inflow", sourceFinancialDocumentId: "ifd_sale1", totals: { total: 60 } } },
    { financialDocument: { documentType: "payment", financialState: "draft", paymentDirection: "inflow", sourceFinancialDocumentId: "ifd_sale1", totals: { total: 40 } } },
    { financialDocument: { documentType: "payment", financialState: "reversed", paymentDirection: "inflow", sourceFinancialDocumentId: "ifd_sale1", totals: { total: 20 } } },
    { financialDocument: { documentType: "credit", financialState: "void", sourceFinancialDocumentId: "ifd_sale1", totals: { total: 10 } } },
  ];
  const result = settlement.projectIXIAssetSettlement({
    sale: { identity: { saleId: "ifd_sale1" }, sale: { salePrice: 100 }, collection: {} },
    financialRecords,
  });
  assert.equal(result.collected, 60);
  assert.equal(result.credited, 0);
  assert.equal(result.buyerBalance, 40);
});

test("Settlement never trusts an embedded browser collection total", () => {
  const result = settlement.projectIXIAssetSettlement({
    sale: {
      identity: { saleId: "ifd_sale1" },
      sale: { salePrice: 100 },
      collection: { amountReceived: 100, creditedAmount: 100 },
    },
    financialRecords: [],
  });
  assert.equal(result.collected, 0);
  assert.equal(result.credited, 0);
  assert.equal(result.buyerBalance, 100);
});

test("Collections and Settlement commands use canonical lineage and revision control", async () => {
  const collectionSource = await readFile(new URL("../components/ixi-aos/transact/modules/collections/IXICollectionsCommands.js", import.meta.url), "utf8");
  const settlementSource = await readFile(new URL("../components/ixi-aos/transact/modules/settlement/IXISettlementCommands.js", import.meta.url), "utf8");
  assert.match(collectionSource, /documentType:\s*"collection"/u);
  assert.match(collectionSource, /sourceFinancialDocumentId:\s*clean\(receivable\.invoiceId\)/u);
  assert.match(collectionSource, /expectedRevision:\s*record\?\.financialBinding\?\.revision/u);
  assert.match(collectionSource, /paymentDirection:\s*"inflow"/u);
  assert.match(collectionSource, /transactionReference:\s*clean\(input\.reference\)/u);
  assert.match(settlementSource, /documentType:\s*"settlement"/u);
  assert.match(settlementSource, /assetSettlement:\s*draft/u);
  assert.match(settlementSource, /expectedRevision:\s*record\?\.financialBinding\?\.revision/u);
  assert.match(settlementSource, /paymentDirection:\s*"outflow"/u);
  assert.match(settlementSource, /settlementOwnerPayment:\s*true/u);
});

test("TRAN$ACT hydrates Collection, Settlement, and Sale state from canonical history", async () => {
  const source = await readFile(new URL("../components/ixi-aos/transact/IXITransactApp.jsx", import.meta.url), "utf8");
  assert.match(source, /document\.documentType !== "collection"/u);
  assert.match(source, /document\.documentType === "settlement"/u);
  assert.match(source, /document\?\.metadata\?\.assetSaleRecord/u);
  assert.match(source, /setCollectionCases\(collectionCasesFromFinancial\)/u);
  assert.match(source, /setSettlementSnapshot\(settlementFromFinancial\)/u);
});
