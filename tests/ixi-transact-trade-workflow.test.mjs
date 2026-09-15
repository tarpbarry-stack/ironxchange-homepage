import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const load = async (path) =>
  import(
    `data:text/javascript;base64,${Buffer.from(await readFile(new URL(path, import.meta.url), "utf8")).toString("base64")}`
  );
const { saveTradeMachine, finalizeTradeInventory } = await load(
  "../lib/server/onboarding/tradeMachineWorkflow.js",
);
const sale = await load(
  "../components/ixi-aos/transact/modules/equipment-sale/IXIEquipmentSaleContract.js",
);
const acquisition = await load(
  "../components/ixi-aos/transact/modules/asset-acquisition/IXIAssetAcquisitionContract.js",
);
const sold = await load(
  "../components/ixi-aos/transact/modules/sold/IXIAssetSaleContract.js",
);
const { documentPrintFields } =
  await import("../components/ixi-command-center/IXITransactExportModel.mjs");

function fixture({ ambiguous = false } = {}) {
  const row = {
    tradeId: "trade-001",
    dealId: "deal-001",
    machine: {
      year: "2019",
      make: "Mahindra",
      model: "6075",
      hours: "0",
      serialNumber: "MU4S1560",
    },
    allowanceCents: 2061900,
  };
  let reserved = false,
    created = 0,
    resource,
    confirmed = false;
  const sdk = {
    ownListings: {
      createDraft: async (input, query) => {
        assert.equal(query.expand, true);
        created++;
        resource = {
          id: { uuid: "listing-001" },
          attributes: { ...input, state: "draft" },
        };
        if (ambiguous) {
          ambiguous = false;
          throw new Error("Response lost");
        }
        return { data: { data: resource } };
      },
      query: async () => ({
        data: { data: resource ? [resource] : [], meta: { totalPages: 1 } },
      }),
      show: async () => ({ data: { data: resource } }),
      update: async (input) => {
        resource.attributes.publicData = {
          ...resource.attributes.publicData,
          ...input.publicData,
        };
        return {};
      },
    },
  };
  const core = async (action, input) => {
    if (action === "reserve") {
      const first = !reserved;
      reserved = true;
      return { row, createGranted: first };
    }
    if (action === "acquired") {
      if (input.acquisitionId !== "acq-001")
        throw new Error("Acquisition not verified");
      confirmed = true;
      return { row };
    }
    if (action === "complete") {
      Object.assign(row, {
        listingId: input.listing.listingId,
        objectId: "machine-001",
        passportId: "pass-001",
      });
      return { row };
    }
  };
  return {
    sdk,
    core,
    row,
    types: {
      UUID: class {
        constructor(uuid) {
          this.uuid = uuid;
        }
      },
    },
    normalizeListing: (resource) => ({ listingId: resource.id.uuid }),
    input: {
      tradeId: row.tradeId,
      dealId: row.dealId,
      machine: row.machine,
      outgoingPassportId: "outgoing-passport",
    },
    get created() {
      return created;
    },
    get resource() {
      return resource;
    },
    get confirmed() {
      return confirmed;
    },
  };
}

test("new trade is private, pending, has no photos or price, and replays the same listing", async () => {
  const f = fixture();
  await saveTradeMachine(f);
  await saveTradeMachine(f);
  assert.equal(f.created, 1);
  assert.equal(f.resource.attributes.state, "draft");
  assert.equal(f.resource.attributes.publicData.ownershipStatus, "pending");
  assert.equal(f.resource.attributes.publicData.passportId, "pass-001");
  assert.equal(f.resource.attributes.price, undefined);
  assert.equal(f.resource.attributes.images, undefined);
});
test("lost Sharetribe response recovers the persisted trade marker without a second create", async () => {
  const f = fixture({ ambiguous: true });
  await assert.rejects(saveTradeMachine(f), /Response lost/);
  await saveTradeMachine(f);
  assert.equal(f.created, 1);
  assert.equal(f.row.listingId, "listing-001");
});
test("unresolved or incomplete recovery never issues another create", async () => {
  const f = fixture();
  await f.core("reserve", {});
  await assert.rejects(saveTradeMachine(f), /still being verified/);
  assert.equal(f.created, 0);
  f.sdk.ownListings.query = async () => ({ data: { data: [] } });
  await assert.rejects(saveTradeMachine(f), /complete machine list/);
});
test("only verified acquisition promotes the same machine into owned inventory", async () => {
  const f = fixture();
  await saveTradeMachine(f);
  await assert.rejects(
    finalizeTradeInventory({ ...f, input: { acquisitionId: "unverified" } }),
    /not verified/,
  );
  assert.equal(f.resource.attributes.publicData.ownershipStatus, "pending");
  await finalizeTradeInventory({ ...f, input: { acquisitionId: "acq-001" } });
  assert.equal(f.confirmed, true);
  assert.equal(f.created, 1);
  assert.equal(f.resource.attributes.publicData.ownershipStatus, "owned");
});
test("any number of itemized trades determines credits without reducing incoming basis twice", () => {
  const trades = [
    { tradeId: "a", allowance: 20619 },
    { tradeId: "b", allowance: 20619 },
  ];
  const record = sale.createIXIEquipmentSaleDraft({
    input: { trades, totals: { subtotal: 126238, tradeAllowance: 1 } },
  });
  assert.equal(record.totals.total, 85000);
  assert.equal(record.totals.tradeAllowance, 41238);
  const three = sale.updateIXIEquipmentSale(record, {
    ...sale.saleInputFromRecord(record),
    trades: [...trades, { tradeId: "c", allowance: 5000 }],
  });
  assert.equal(three.totals.total, 80000);
  const acq = acquisition.createIXIAssetAcquisitionDraft({
    input: {
      purchasePrice: 20619,
      acquisitionType: "trade-in",
      trade: {
        dealId: "deal-001",
        tradeId: "a",
        allowance: 20619,
        sourceFinancialDocumentId: "order-001",
      },
    },
  });
  assert.equal(acq.acquisition.directAcquisitionCost, 20619);
  assert.equal(acq.acquisition.tradeAllowance, 0);
  assert.equal(acq.trade.tradeId, "a");
  assert.equal(acq.acquisition.sourceFinancialDocumentId, "order-001");
});
test("SOLD accepts gross equipment price with net cash paid, and retains separate trade value", () => {
  const invoice = {
    financialDocumentId: "invoice-001",
    financialState: "collected",
    occurredAt: "2026-01-05",
    totals: { total: 85000 },
    metadata: { trades: [{ allowance: 20619 }, { allowance: 20619 }] },
  };
  const input = {
    sourceInvoice: invoice,
    buyerLabel: "Buyer",
    machineSalePrice: 126238,
    financialRecords: [
      {
        financialDocument: {
          financialDocumentId: "payment-001",
          sourceFinancialDocumentId: "invoice-001",
          documentType: "payment",
          paymentDirection: "inflow",
          financialState: "paid",
          totals: { total: 85000 },
        },
      },
    ],
  };
  const record = sold.createIXIAssetSaleDraft({
    context: { primary: { passportId: "outgoing" } },
    input,
  });
  assert.equal(record.sale.salePrice, 126238);
  assert.equal(record.sale.tradeValue, 41238);
  assert.equal(record.sale.saleDate, "2026-01-05");
  assert.equal(record.sale.saleDateSource, "invoice");
  assert.equal(record.passportState.effectiveDate, "2026-01-05");
  assert.equal(record.collection.amountReceived, 85000);
  assert.equal(sold.isIXIAssetSaleCollectionReady(record.collection), true);
  assert.equal(sold.validateIXIAssetSale(record, invoice).valid, true);
});
test("an all-trade closeout is ready without inventing a cash receipt; credits alone remain insufficient", () => {
  const invoice = { financialDocumentId: "invoice-full-trade", financialState: "billed", occurredAt: "2026-01-05",
    totals: { total: 0 }, metadata: { trades: [{ allowance: 10000 }] } };
  const record = sold.createIXIAssetSaleDraft({ context: { primary: { passportId: "outgoing" } },
    input: { sourceInvoice: invoice, buyerLabel: "Buyer", machineSalePrice: 10000 } });
  assert.equal(record.collection.invoiceTotal, 0);
  assert.equal(record.collection.amountReceived, 0);
  assert.equal(record.sale.salePrice, 10000);
  assert.equal(sold.isIXIAssetSaleCollectionReady(record.collection), true);
  assert.equal(sold.validateIXIAssetSale(record, invoice).valid, true);
  assert.equal(sold.isIXIAssetSaleCollectionReady({ ...record.collection, tradeValue: 0 }), false);
  assert.equal(sold.isIXIAssetSaleCollectionReady({ ...record.collection, invoiceTotal: 10000, creditedAmount: 10000 }), false);
  assert.equal(sold.isIXIAssetSaleCollectionReady({ ...record.collection, invoiceTotal: 100, balanceDue: 100 }), false);
});
test("download fields retain every trade serial and Passport", () => {
  const fields = documentPrintFields({
    raw: {
      financialDocument: {
        salesOrder: {
          trades: [
            {
              tradeId: "a",
              year: 2019,
              make: "Mahindra",
              model: "6075",
              serialNumber: "MU4S1560",
              hours: 0,
              passportId: "IXITRADE01",
              allowance: 20619,
            },
          ],
        },
      },
    },
  });
  assert.match(
    fields.find((field) => field[0] === "Trade 1")[1],
    /MU4S1560.*IXITRADE01.*20619/,
  );
});

test("existing serials use the existing-card path without reserving another machine", async () => {
  const f = fixture();
  f.sdk.ownListings.query = async () => ({ data: { data: [{ id: { uuid: "already-owned" }, attributes: { publicData: { serialNumber: f.row.machine.serialNumber } } }], meta: { totalPages: 1 } } });
  await assert.rejects(saveTradeMachine(f), /Select Existing/);
  assert.equal(f.created, 0);
});
test("a definite Sharetribe rejection releases only that attempt for a safe retry", async () => {
  const f = fixture(), calls = [];
  const original = f.core;
  f.core = async (action, input) => { calls.push({ action, input }); return original(action, input); };
  f.sdk.ownListings.createDraft = async () => { throw Object.assign(new Error("Invalid listing"), { status: 422 }); };
  await assert.rejects(saveTradeMachine(f), /Invalid listing/);
  assert.equal(calls.find(call => call.action === "create-rejected").input.statusCode, 422);
  assert.equal(f.created, 0);
});
