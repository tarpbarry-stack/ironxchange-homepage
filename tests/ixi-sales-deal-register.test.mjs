import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../components/ixi-aos/transact/sales/IXISalesDealEngine.js", import.meta.url), "utf8");
const engine = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

test("Passport sales register keeps simultaneous customers in separate deal threads", () => {
  const records = [
    { financialDocument: { financialDocumentId: "qt-a", documentType: "quote", quote: { identity: { dealId: "DEAL-A" }, customer: { name: "Alpha" }, totals: { total: 100 }, status: "sent", audit: { updatedAt: "2026-09-01" } } } },
    { financialDocument: { financialDocumentId: "qt-b", documentType: "quote", quote: { identity: { dealId: "DEAL-B" }, customer: { name: "Beta" }, totals: { total: 110 }, status: "draft", audit: { updatedAt: "2026-09-02" } } } },
  ];
  const deals = engine.buildIXISalesDealRegister(records);
  assert.equal(deals.length, 2);
  assert.deepEqual(new Set(deals.map(deal => deal.customer)), new Set(["Alpha", "Beta"]));
});

test("linked Quote, Sales Order, signed package, Invoice, Sold, and Settlement form one deal", () => {
  const records = [
    { financialDocument: { financialDocumentId: "qt-1", documentType: "quote", quote: { identity: { dealId: "DEAL-ONE" }, customer: { name: "Buyer" }, status: "converted", audit: { updatedAt: "2026-09-01" } } } },
    { financialDocument: { financialDocumentId: "so-1", documentType: "sales-order", sourceFinancialDocumentId: "qt-1", salesOrder: { identity: { dealId: "DEAL-ONE" }, customer: { name: "Buyer" }, signing: { signedAt: "2026-09-02", signedPackageHash: "abc" }, status: "signed", audit: { updatedAt: "2026-09-02" } } } },
    { financialDocument: { financialDocumentId: "inv-1", documentType: "invoice", sourceFinancialDocumentId: "so-1", metadata: { dealId: "DEAL-ONE", customer: { name: "Buyer" } }, totals: { total: 100 }, updatedAt: "2026-09-03" } },
    { financialDocument: { financialDocumentId: "sale-1", documentType: "invoice", sourceFinancialDocumentId: "inv-1", metadata: { dealId: "DEAL-ONE", assetSale: true, assetSaleRecord: { identity: { dealId: "DEAL-ONE" }, sale: { buyerLabel: "Buyer", salePrice: 100 }, status: "sold", audit: { updatedAt: "2026-09-04" } } } } },
    { financialDocument: { financialDocumentId: "stl-1", documentType: "settlement", sourceFinancialDocumentId: "sale-1", metadata: { dealId: "DEAL-ONE" }, assetSettlement: { identity: { dealId: "DEAL-ONE" }, status: "approved", audit: { updatedAt: "2026-09-05" } } } },
  ];
  const [deal] = engine.buildIXISalesDealRegister(records);
  assert.equal(engine.buildIXISalesDealRegister(records).length, 1);
  assert.equal(deal.currentStage, "settlement");
  assert.deepEqual(Object.keys(deal.stageRecords), ["quote", "sales-order", "signed", "invoice", "sold", "settlement"]);
});

test("legacy direct Invoice remains an addressable standalone deal", () => {
  const deals = engine.buildIXISalesDealRegister([{ financialDocument: { financialDocumentId: "ifd-12345678", documentType: "invoice", financialState: "draft", metadata: { transactModule: "equipment-sale", customer: { name: "Clements Farm" } }, totals: { total: 82000 }, updatedAt: "2026-09-05" } }]);
  assert.equal(deals.length, 1);
  assert.equal(deals[0].customer, "Clements Farm");
  assert.equal(deals[0].stageRecords.invoice.number, "DRAFT INV-12345678");
});

test("exact stage readback retains canonical document identity and revision", () => {
  const records = [{ server: { revision: 7 }, financialDocument: { financialDocumentId: "so-exact", documentType: "sales-order", metadata: { dealId: "DEAL-EXACT" }, salesOrder: { identity: { dealId: "DEAL-EXACT" }, customer: { name: "Exact Buyer" }, status: "draft", audit: { updatedAt: "2026-09-05" } } } }];
  const [deal] = engine.buildIXISalesDealRegister(records);
  const order = engine.recordForIXISalesStage(deal, "sales-order");
  assert.equal(order.financialBinding.financialDocumentId, "so-exact");
  assert.equal(order.financialBinding.revision, 7);
});

test("a lost opportunity is terminal without creating a sold stage", () => {
  const [deal] = engine.buildIXISalesDealRegister([{ financialDocument: { financialDocumentId: "qt-lost", documentType: "quote", metadata: { dealId: "DEAL-LOST", dealStatus: "lost" }, quote: { identity: { dealId: "DEAL-LOST" }, customer: { name: "Former Buyer" }, status: "declined", audit: { updatedAt: "2026-09-05" } } } }]);
  assert.equal(deal.terminal, true);
  assert.equal(deal.status, "lost");
  assert.equal(deal.stageRecords.sold, undefined);
});
