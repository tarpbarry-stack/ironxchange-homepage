import test from "node:test";
import assert from "node:assert/strict";
import { projectIXIAssetSaleCollection, isIXIAssetSaleCollectionReady } from "../components/ixi-aos/transact/modules/sold/IXIAssetSaleContract.js";
import { classifyIXIMachineCostRecord } from "../components/ixi-aos/transact/IXIMachineCostBasisEngine.js";
test("issued-invoice trade credit reduces cash due without becoming machine cost or cash received", () => {
  const sourceInvoice = { financialDocumentId: "test-invoice", totals: { total: 75000 }, metadata: {} };
  const credit = { financialDocumentId: "test-trade", documentType: "credit", creditType: "trade-credit", financialState: "incurred", sourceFinancialDocumentId: "test-invoice", totals: { total: 65000 }, metadata: { tradeCredit: true } };
  const payment = { financialDocumentId: "test-wire", documentType: "payment", financialState: "paid", paymentDirection: "inflow", sourceFinancialDocumentId: "test-invoice", totals: { total: 10000 } };
  const result = projectIXIAssetSaleCollection({ sourceInvoice, financialRecords: [credit, payment] });
  assert.equal(result.balanceDue, 0); assert.equal(result.amountReceived, 10000); assert.equal(result.tradeValue, 65000);
  assert.equal(isIXIAssetSaleCollectionReady(result), true);
  assert.equal(classifyIXIMachineCostRecord({ ...credit, status: "INCURRED", amount: 65000, document: credit }).state, "excluded");
  const fullTrade = projectIXIAssetSaleCollection({ sourceInvoice, financialRecords: [{ ...credit, totals: { total: 75000 } }] });
  assert.equal(isIXIAssetSaleCollectionReady(fullTrade), true);
  const ordinaryCredit = projectIXIAssetSaleCollection({ sourceInvoice, financialRecords: [{ ...credit, creditType: "revenue-credit", totals: { total: 75000 } }] });
  assert.equal(isIXIAssetSaleCollectionReady(ordinaryCredit), false);
});
