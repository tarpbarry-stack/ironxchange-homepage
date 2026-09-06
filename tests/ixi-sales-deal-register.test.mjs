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

test("legacy Quote, Sales Order, and Invoice recover one unambiguous customer and Passport thread", () => {
  const asset = { passportId: "IXI-MACHINE-544K", serialNumber: "1DW544KZCHF681737" };
  const customer = { name: "Clements Farm" };
  const records = [
    { financialDocument: { financialDocumentId: "qt-legacy", documentType: "quote", quote: { customer, asset, totals: { total: 82000 }, status: "converted", audit: { updatedAt: "2026-09-05T10:00:00Z" } } } },
    { financialDocument: { financialDocumentId: "so-legacy", documentType: "sales-order", salesOrder: { customer, asset, totals: { total: 82000 }, status: "signed", signing: { signedAt: "2026-09-05T11:00:00Z", signedPackageHash: "sha256" }, audit: { updatedAt: "2026-09-05T11:00:00Z" } } } },
    { financialDocument: { financialDocumentId: "inv-legacy", documentType: "invoice", metadata: { transactModule: "equipment-sale", customer, asset }, totals: { total: 82000 }, updatedAt: "2026-09-05T12:00:00Z" } },
  ];
  const [deal] = engine.buildIXISalesDealRegister(records);
  assert.equal(engine.buildIXISalesDealRegister(records).length, 1);
  assert.deepEqual(Object.keys(deal.stageRecords), ["quote", "sales-order", "signed", "invoice"]);
  assert.equal(engine.recordForIXISalesStage(deal, "sales-order").financialBinding.financialDocumentId, "so-legacy");
});

test("legacy recovery refuses an ambiguous duplicate stage", () => {
  const asset = { passportId: "IXI-MACHINE-544K" };
  const customer = { name: "Clements Farm" };
  const records = [
    { financialDocument: { financialDocumentId: "qt-a", documentType: "quote", quote: { customer, asset, totals: { total: 82000 }, audit: { updatedAt: "2026-09-05T09:00:00Z" } } } },
    { financialDocument: { financialDocumentId: "qt-b", documentType: "quote", quote: { customer, asset, totals: { total: 82000 }, audit: { updatedAt: "2026-09-05T10:00:00Z" } } } },
    { financialDocument: { financialDocumentId: "so-a", documentType: "sales-order", salesOrder: { customer, asset, totals: { total: 82000 }, audit: { updatedAt: "2026-09-05T11:00:00Z" } } } },
  ];
  assert.equal(engine.buildIXISalesDealRegister(records).length, 3);
});

test("a direct Sales Order can materialize a populated editable Quote without rewriting the order", () => {
  const [deal] = engine.buildIXISalesDealRegister([{ financialDocument: {
    financialDocumentId: "so-direct",
    documentType: "sales-order",
    salesOrder: {
      identity: { dealId: "DEAL-DIRECT" },
      customer: { name: "Clements Farm", phone: "555-0100" },
      asset: { passportId: "IXI-MACHINE-544K", serialNumber: "1DW544KZCHF681737" },
      commercial: { orderDate: "2026-09-05", dueDate: "2026-09-12", paymentTerms: "Wire" },
      totals: { subtotal: 82000, total: 82000 },
      audit: { updatedAt: "2026-09-05T11:00:00Z" },
    },
  } }]);
  const draft = engine.quoteDraftForIXISalesDeal(deal);
  assert.equal(draft.identity.dealId, "DEAL-DIRECT");
  assert.equal(draft.customer.name, "Clements Farm");
  assert.equal(draft.asset.passportId, "IXI-MACHINE-544K");
  assert.equal(draft.totals.total, 82000);
  assert.equal(draft.related.salesOrderId, "so-direct");
  assert.equal(draft.financialBinding, undefined);
});

test("exact stage readback retains canonical document identity and revision", () => {
  const records = [{ server: { revision: 7 }, financialDocument: { financialDocumentId: "so-exact", documentType: "sales-order", metadata: { dealId: "DEAL-EXACT" }, salesOrder: { identity: { dealId: "DEAL-EXACT" }, customer: { name: "Exact Buyer" }, status: "draft", audit: { updatedAt: "2026-09-05" } } } }];
  const [deal] = engine.buildIXISalesDealRegister(records);
  const order = engine.recordForIXISalesStage(deal, "sales-order");
  assert.equal(order.financialBinding.financialDocumentId, "so-exact");
  assert.equal(order.financialBinding.revision, 7);
});

test("each sales module register shows only deals with that exact stage", () => {
  const records = [
    { financialDocument: { financialDocumentId: "qt-only", documentType: "quote", quote: { identity: { dealId: "DEAL-QUOTE" }, customer: { name: "Quote Only" }, status: "sent", audit: { updatedAt: "2026-09-01" } } } },
    { financialDocument: { financialDocumentId: "qt-order", documentType: "quote", quote: { identity: { dealId: "DEAL-ORDER" }, customer: { name: "Clements Farm" }, status: "converted", audit: { updatedAt: "2026-09-01" } } } },
    { financialDocument: { financialDocumentId: "so-clements", documentType: "sales-order", sourceFinancialDocumentId: "qt-order", salesOrder: { identity: { dealId: "DEAL-ORDER" }, customer: { name: "Clements Farm" }, status: "draft", audit: { updatedAt: "2026-09-02" } } } },
  ];
  const deals = engine.buildIXISalesDealRegister(records);
  assert.deepEqual(engine.dealsForIXISalesModule(deals, "quote").map(deal => deal.customer).sort(), ["Clements Farm", "Quote Only"]);
  assert.deepEqual(engine.dealsForIXISalesModule(deals, "sales-order").map(deal => deal.customer), ["Clements Farm"]);
  assert.equal(engine.dealsForIXISalesModule(deals, "invoice").length, 0);
  assert.equal(engine.dealsForIXISalesModule(deals, "sold").length, 0);
  assert.equal(engine.dealsForIXISalesModule(deals, "settlement").length, 0);
});

test("a lost opportunity is terminal without creating a sold stage", () => {
  const [deal] = engine.buildIXISalesDealRegister([{ financialDocument: { financialDocumentId: "qt-lost", documentType: "quote", metadata: { dealId: "DEAL-LOST", dealStatus: "lost" }, quote: { identity: { dealId: "DEAL-LOST" }, customer: { name: "Former Buyer" }, status: "declined", audit: { updatedAt: "2026-09-05" } } } }]);
  assert.equal(deal.terminal, true);
  assert.equal(deal.status, "lost");
  assert.equal(deal.stageRecords.sold, undefined);
});
