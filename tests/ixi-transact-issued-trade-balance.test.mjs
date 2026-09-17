import test from "node:test";
import assert from "node:assert/strict";
import { createIXIAssetSaleDraft, projectIXIAssetSaleCollection, isIXIAssetSaleCollectionReady, getIXISaleCloseoutTrades, defaultIXIMachineSalePrice, validateIXIAssetSale } from "../components/ixi-aos/transact/modules/sold/IXIAssetSaleContract.js";
import { classifyIXIMachineCostRecord } from "../components/ixi-aos/transact/IXIMachineCostBasisEngine.js";
test("issued-invoice trade credit reduces cash due without becoming machine cost or cash received", () => {
  const sourceInvoice = { financialDocumentId: "test-invoice", totals: { total: 75000 }, metadata: {} };
  const credit = { financialDocumentId: "test-trade", documentType: "credit", creditType: "trade-credit", financialState: "incurred", sourceFinancialDocumentId: "test-invoice", totals: { total: 65000 }, metadata: { tradeCredit: true } };
  const payment = { financialDocumentId: "test-wire", documentType: "payment", financialState: "paid", paymentDirection: "inflow", sourceFinancialDocumentId: "test-invoice", totals: { total: 10000 } };
  const result = projectIXIAssetSaleCollection({ sourceInvoice, financialRecords: [credit, payment] });
  assert.equal(result.balanceDue, 0); assert.equal(result.amountReceived, 10000); assert.equal(result.tradeValue, 65000);
  assert.equal(isIXIAssetSaleCollectionReady(result), true);
  const sale = createIXIAssetSaleDraft({ input: { sourceInvoice, financialRecords: [credit, payment], machineSalePrice: 75000 } });
  assert.equal(sale.sale.salePrice, 75000, "the trade credit is already included in the gross issued invoice");
  sale.sale.machineSalePrice = 140000;
  assert.ok(validateIXIAssetSale(sale, sourceInvoice).errors.machineSalePrice);
  assert.equal(classifyIXIMachineCostRecord({ ...credit, status: "INCURRED", amount: 65000, document: credit }).state, "excluded");
  const fullTrade = projectIXIAssetSaleCollection({ sourceInvoice, financialRecords: [{ ...credit, totals: { total: 75000 } }] });
  assert.equal(isIXIAssetSaleCollectionReady(fullTrade), true);
  const ordinaryCredit = projectIXIAssetSaleCollection({ sourceInvoice, financialRecords: [{ ...credit, creditType: "revenue-credit", totals: { total: 75000 } }] });
  assert.equal(isIXIAssetSaleCollectionReady(ordinaryCredit), false);
});

test("closeout carries the invoice's machine subtotal and only active trades for this invoice", () => {
  const trade = { tradeId: "test-trade", passportId: "test-machine", allowance: 65000 };
  const invoice = { financialDocumentId: "test-invoice", metadata: { commercialBreakdown: { subtotal: 75000 } } };
  const credit = { financialDocumentId: "test-credit", sourceFinancialDocumentId: "test-invoice", creditType: "trade-credit", financialState: "incurred", tradeCorrection: { trade } };
  assert.equal(defaultIXIMachineSalePrice(invoice), 75000);
  assert.equal(defaultIXIMachineSalePrice({ totals: { total: 85000 } }), "", "an unknown machine subtotal must be reviewed");
  assert.deepEqual(getIXISaleCloseoutTrades(invoice, [credit, { ...credit, financialState: "void" }, { ...credit, sourceFinancialDocumentId: "another-invoice" }]), [{ ...trade, tradeCreditId: "test-credit" }]);
  const original = { ...invoice, totals: { total: 10000 }, metadata: { ...invoice.metadata, trades: [trade] } };
  assert.equal(createIXIAssetSaleDraft({ input: { sourceInvoice: original } }).sale.salePrice, 75000, "an original trade deducted before issue still restores gross sale value");
});
