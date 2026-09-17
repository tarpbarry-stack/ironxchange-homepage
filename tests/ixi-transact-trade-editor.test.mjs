import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
if (!process.env.IXI_CORE_CONTRACT_ROOT) throw new Error("The pinned core checkout is required for the trade editor test.");
const { JSDOM } = require(path.join(process.env.IXI_CORE_CONTRACT_ROOT, "node_modules/jsdom"));
const dom = new JSDOM('<div id="root"></div>', { url: "https://test.invalid" });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = React;
const swc = require("next/dist/build/swc");
await swc.loadBindings();
const sourceRoot = new URL("../components/ixi-aos/transact/", import.meta.url);
const compile = (name, dependencies = {}) => {
  const file = new URL(name, sourceRoot);
  const code = swc.transformSync(fs.readFileSync(file, "utf8"), { filename: file.pathname,
    jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } }, module: { type: "commonjs" } }).code;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(id => {
    if (id in dependencies) return dependencies[id];
    if (["react", "react-dom", "react/jsx-runtime"].includes(id)) return require(id);
    throw new Error(`Unmocked component dependency: ${id}`);
  }, module, module.exports);
  return module.exports;
};
const workflow = compile("sales/IXITradeSaveWorkflow.js");
const contract = compile("modules/equipment-sale/IXIEquipmentSaleContract.js");
const soldContract = compile("modules/sold/IXIAssetSaleContract.js");
const issuedInvoiceView = compile("modules/equipment-sale/IXIIssuedInvoiceView.jsx").default;
const noop = () => null;
const access = compile("../../../lib/machine-access/IXIMachineAccess.js");
const listingProjection = compile("../../../lib/listings/normalizeSharetribeListings.js", {
  "../machine-access/IXIMachineAccess": access,
});
// Render the real price/photo face. Stubbing the whole machine card hid the
// production crash when an expanded worksheet reloaded SDK Money objects.
const privateCard = compile("../../ixi-machine-card/private/PrivateListingCard.js", {
  "next/dynamic": () => noop,
  "../../../lib/posthog": { captureIXEvent: noop },
  "../../../lib/marketplace/passportEmailEvents": { openIXIPassportEmail: noop },
  "../../../lib/listingFormatters": compile("../../../lib/listingFormatters.js"),
  "../../MachineBadges": noop,
  "./IXISoldDetails": noop,
  "../../IXIMachineRail": noop,
  "../../ixi-chassis/IXIObjectCardActuator": noop,
  "../../ixi-machine-placement/IXIMachinePlacementControl": noop,
  "../../../lib/ixvision/frameEngine": compile("../../../lib/ixvision/frameEngine.js"),
}).default;
let acquisitionProps;
const moneyInput = ({ value, onValueChange, ...props }) => React.createElement("input", { ...props, value: value ?? "", onChange: event => onValueChange(event.target.value) });
const tradeSection = compile("sales/IXITradeInSection.jsx", {
  "./IXITradeSaveWorkflow": workflow,
  "../../../ixi-machine-card/IXIMachineCard": privateCard,
  "../modules/asset-acquisition/IXIAssetAcquisitionApp": props => { acquisitionProps = props; return null; },
  "../IXIMoneyInput": moneyInput,
  "../../../ixi-object-system/IXIActionNoticeEngine": { runIXIActionNoticeLifecycle: ({ operation }) => operation() },
  "./IXITradeInSection.module.css": {},
}).default;

test("the real order editor retains expanded trade fields and Save Order persists the trade before refreshing", async () => {
  const calls = [];
  const context = { primary: { passportId: "test-outgoing", label: "Test loader" }, entity: { passportId: "test-entity" }, actor: { passportId: "test-actor" } };
  const initial = contract.createIXIEquipmentSaleDraft({ context, input: { totals: { subtotal: 75000 } } });
  initial.identity.salesOrderId = "test-order";
  initial.financialBinding = { financialDocumentId: "test-order", revision: 1 };
  const invoice = { financialDocumentId: "test-invoice", financialState: "draft", financialBinding: { financialDocumentId: "test-invoice", revision: 2 } };
  let savedOrder, savedInvoice;
  globalThis.fetch = async (_url, options) => {
    if (options.method === "GET") return { ok: true, json: async () => ({ rows: [] }) };
    const input = JSON.parse(options.body);
    calls.push("machine");
    return { ok: true, json: async () => ({ row: { ...input, passportId: "test-incoming", objectId: "test-object", listingId: "test-listing" } }) };
  };
  const app = compile("modules/equipment-sale/IXIEquipmentSaleApp.jsx", {
    "../../sales/IXITradeInSection": tradeSection,
    "../../sales/IXITradeSummary": noop,
    "./IXIIssuedInvoiceView": issuedInvoiceView,
    "../sold/IXIAssetSaleContract": soldContract,
    "../../IXIMoneyInput": { __esModule: true, default: moneyInput, IXINumericInput: moneyInput },
    "./IXIEquipmentSaleCommands": {
      saveIXIEquipmentSale: async ({ record, action }) => { calls.push(action); savedOrder = { ...record, financialBinding: { ...record.financialBinding, revision: record.financialBinding.revision + 1 } }; return { record: savedOrder }; },
      saveIXIEquipmentInvoice: async ({ record }) => { calls.push("invoice"); savedInvoice = { ...invoice, metadata: { trades: record.trades }, totals: { total: record.totals.total } }; return { invoice: savedInvoice }; },
    },
    "./IXIEquipmentSaleContract": contract,
    "./IXIEquipmentSaleStyles": noop,
    "../quote/IXIQuoteCommands": {},
    "../../sales/IXISalesDealRegister": { IXISalesStageRail: noop },
  }).default;
  const root = createRoot(document.getElementById("root"));
  const button = text => [...document.querySelectorAll("button")].find(el => el.textContent.trim() === text);
  const section = () => document.querySelector('[aria-label="Trade-in machines"]');
  const fill = async (label, value) => {
    const input = [...section().querySelectorAll("label")].find(el => el.textContent.trim() === label).querySelector("input");
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(input, value);
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
  };
  try {
    await act(async () => root.render(React.createElement(app, { context, initialRecord: initial, invoice, onRecordChange: () => calls.push("refresh") })));
    await act(async () => button("+ ADD TRADE").click());
    await fill("MAKE", "Test");
    await act(async () => button("SAVE ORDER").click());
    assert.deepEqual(calls, []);
    assert.match(section().textContent, /Complete the trade year/);
    for (const [label, value] of Object.entries({ YEAR: "2019", MAKE: "Test", MODEL: "Loader", HOURS: "4500", SERIAL: "TRADE-TEST-001", LOCATION: "Test yard", "TRADE ALLOWANCE": "65000" })) await fill(label, value);
    await act(async () => button("EXPAND").click());
    assert.equal([...section().querySelectorAll("input")].some(input => input.value === "TRADE-TEST-001"), true);
    await act(async () => button("SAVE").click());
    assert.deepEqual(calls, ["prepare-trade", "machine", "save-trades", "invoice", "refresh"]);
    assert.equal(savedOrder.trades[0].passportId, "test-incoming");
    assert.equal(savedOrder.totals.tradeAllowance, 65000);
    assert.equal(savedInvoice.totals.total, 10000);
    assert.equal(section().textContent.includes("UNSAVED TRADE"), false);
    const navigation = [];
    const orderEntry = { documentId: "test-order" };
    await act(async () => root.render(React.createElement(app, { context, initialRecord: savedOrder, invoice: savedInvoice,
      entryMode: "invoice", deal: { dealId: initial.identity.dealId, stageRecords: { "sales-order": orderEntry } },
      onOpenStage: (...args) => navigation.push(args) })));
    await act(async () => button("OPEN TRADES").click());
    assert.equal(navigation[0][0].moduleId, "sales-order");
    assert.equal(navigation[0][1].documentId, "test-order");
  } finally {
    await act(async () => root.unmount());
  }
});

test("issued order reuses an existing card, records a linked trade credit, and opens its separate acquisition", async () => {
  const calls = [];
  const context = { primary: { passportId: "test-outgoing", label: "Test loader" }, entity: { passportId: "test-entity" }, actor: { passportId: "test-actor" } };
  const original = contract.createIXIEquipmentSaleDraft({ context, input: { totals: { subtotal: 75000 } } });
  original.identity = { ...original.identity, salesOrderId: "test-order", dealId: "test-deal" };
  original.financialBinding = { financialDocumentId: "test-order", revision: 2 };
  original.customer = { ...original.customer, name: "Example buyer" };
  original.commercial = { ...original.commercial, orderDate: "2026-09-02" };
  const invoice = { financialDocumentId: "test-invoice", sourceFinancialDocumentId: "test-order", financialState: "partially-collected", totals: { total: 75000 }, financialBinding: { financialDocumentId: "test-invoice", revision: 4 } };
  const originalJSON = JSON.stringify({ original, invoice });
  let correction = { corrections: [], blockedReason: "", position: { invoiceAmount: 75000, received: 10000, credited: 0, tradeCredit: 0, balance: 65000 } };
  let machineRequest;
  const fields = { year: "2021", make: "TEST", model: "LOADER", hours: "4400", serialNumber: "EXISTING-TEST-001", location: "Test yard" };
  const storedListing = {
    id: { uuid: "existing-listing" }, type: "ownListing",
    attributes: { title: "2021 TEST LOADER", price: { _sdkType: "Money", amount: 7900000, currency: "USD" }, publicData: { ...fields, passportId: "existing-passport" } },
    relationships: { images: { data: [{ id: { uuid: "existing-photo" }, type: "image" }] } },
  };
  const included = [{ id: { uuid: "existing-photo" }, type: "image", attributes: { variants: { "listing-card": { url: "https://test.invalid/existing-photo.jpg" } } } }];
  const savedRow = () => ({ ...machineRequest, passportId: "existing-passport", objectId: "existing-object", listingId: "existing-listing" });
  const tradeRead = compile("../../../pages/api/ixi/onboarding/trades.js", {
    "sharetribe-flex-sdk": { types: { UUID: class { constructor(uuid) { this.uuid = uuid; } } } },
    "../../../../lib/server/aos/resolveAosBrowserSession": { resolveAosBrowserSession: async () => ({ sdk: { ownListings: { show: async () => ({ data: { data: storedListing, included } }) } } }) },
    "../../../../lib/server/aos/ixiMosInternalClient": {
      resolveIxCoreAosContext: async () => ({ userId: "test-user", entityId: "test-entity" }),
      requestIxCoreMos: async () => ({ rows: machineRequest ? [savedRow()] : [] }),
    },
    "../../../../lib/server/onboarding/normalizeOwnedMachineListing": {},
    "../../../../lib/server/onboarding/tradeMachineWorkflow": {},
    "../../../../lib/listings/normalizeSharetribeListings": listingProjection,
  }).default;
  globalThis.fetch = async (url, options) => {
    if (options.method === "GET") {
      if (url.includes("mode=existing")) return { ok: true, json: async () => ({ listings: [{ listingId: "existing-listing", displayName: "2021 TEST LOADER", fields }], meta: { totalPages: 1 } }) };
      let payload, status = 200;
      const res = { setHeader() {}, status(value) { status = value; return this; }, json(value) { payload = value; } };
      await tradeRead({ method: "GET", query: { dealId: "test-deal", outgoingPassportId: "test-outgoing" } }, res);
      return { ok: status === 200, json: async () => payload };
    }
    machineRequest = JSON.parse(options.body); calls.push("resolve-existing-machine");
    return { ok: true, json: async () => ({ row: savedRow() }) };
  };
  const app = compile("modules/equipment-sale/IXIEquipmentSaleApp.jsx", {
    "../../sales/IXITradeInSection": tradeSection, "../../sales/IXITradeSummary": noop,
    "./IXIIssuedInvoiceView": issuedInvoiceView, "../sold/IXIAssetSaleContract": soldContract,
    "../../IXIMoneyInput": { __esModule: true, default: moneyInput, IXINumericInput: moneyInput },
    "./IXIEquipmentSaleCommands": {
      saveIXIEquipmentSale: () => { throw new Error("Issued order must not be rewritten"); },
      saveIXIEquipmentInvoice: () => { throw new Error("Issued invoice must not be rewritten"); },
      requestIXITradeCorrection: async (orderId, input) => {
        assert.equal(orderId, "test-order");
        if (input) {
          calls.push("record-credit");
          assert.equal(input.trade.passportId, "existing-passport"); assert.equal(input.trade.allowance, 65000);
          const credit = { financialDocumentId: "test-trade-credit", documentNumber: "TC-TEST", tradeCorrection: { trade: input.trade, effectiveDate: input.effectiveDate } };
          correction = { corrections: [credit], credit, blockedReason: "", position: { invoiceAmount: 75000, received: 10000, credited: 65000, tradeCredit: 65000, balance: 0 } };
        }
        return correction;
      },
    },
    "./IXIEquipmentSaleContract": contract, "./IXIEquipmentSaleStyles": noop, "../quote/IXIQuoteCommands": {}, "../../sales/IXISalesDealRegister": { IXISalesStageRail: noop },
  }).default;
  const root = createRoot(document.getElementById("root"));
  const button = text => [...document.querySelectorAll("button")].find(el => el.textContent.trim() === text);
  try {
    await act(async () => root.render(React.createElement(app, { context, initialRecord: original, invoice, onRecordChange: () => calls.push("refresh") })));
    assert.ok(button("SELECT EXISTING"));
    await act(async () => button("SELECT EXISTING").click());
    const select = document.querySelector('[aria-label="Existing machine"]');
    await act(async () => { select.value = "existing-listing"; select.dispatchEvent(new dom.window.Event("change", { bubbles: true })); });
    const section = () => document.querySelector('[aria-label="Trade-in machines"]');
    const allowance = () => [...section().querySelectorAll("label")].find(label => label.textContent.trim() === "TRADE ALLOWANCE").querySelector("input");
    const fillAllowance = async value => act(async () => { Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(allowance(), value); allowance().dispatchEvent(new dom.window.Event("input", { bubbles: true })); });
    await fillAllowance("65001"); await act(async () => button("SAVE TRADE").click());
    assert.deepEqual(calls, []); assert.match(section().textContent, /remaining balance/);
    await fillAllowance("65000");
    await act(async () => button("SAVE TRADE").click());
    assert.deepEqual(calls, ["resolve-existing-machine", "record-credit", "refresh"]);
    assert.equal(machineRequest.existingListingId, "existing-listing");
    assert.equal(JSON.stringify({ original, invoice }), originalJSON);
    assert.match(document.body.textContent, /Original invoice \$75,000.00 · Money received \$10,000.00 · Customer balance \$0.00/);
    await act(async () => button("EXPAND").click());
    assert.equal(document.querySelectorAll('[aria-label="Trade-in machines"]').length, 1);
    assert.equal(document.querySelectorAll('[data-listing-card-id="existing-listing"]').length, 1);
    assert.equal(section().querySelector(".price-row strong").textContent, "$79,000");
    assert.equal(section().querySelector('img[src="https://test.invalid/existing-photo.jpg"]') !== null, true);
    assert.equal(storedListing.attributes.price.amount, 7900000);
    assert.equal(correction.corrections.length, 1);
    assert.deepEqual(calls, ["resolve-existing-machine", "record-credit", "refresh"]);
    await act(async () => button("ACQUISITION").click());
    assert.equal(acquisitionProps.tradeContext.sourceFinancialDocumentId, "test-trade-credit");
    assert.equal(acquisitionProps.initialInput.purchasePrice, 65000);
    assert.equal(acquisitionProps.initialInput.purchaseDate, original.commercial.orderDate);
    assert.equal(acquisitionProps.initialInput.sellerLabel, original.customer.name);
    assert.equal(acquisitionProps.initialInput.acquisitionType, "trade-in");
    assert.equal(acquisitionProps.object.passportId, "existing-passport");
    const navigation = [];
    const deal = { dealId: "test-deal", stageRecords: { "sales-order": { documentId: "test-order" } } };
    await act(async () => root.render(React.createElement(app, { key: "issued-view", context, initialRecord: original, invoice, deal,
      entryMode: "invoice", onStartStage: (...args) => navigation.push(args), onOpenStage: (...args) => navigation.push(args) })));
    assert.equal(button("SAVE INVOICE"), undefined);
    assert.equal(document.querySelector('[aria-label="Issued invoice"] dl').textContent.includes("$0.00"), true);
    assert.equal(document.querySelector('[aria-label="Issued invoice"] input'), null);
    await act(async () => button("CONTINUE TO SOLD").click());
    assert.equal(navigation[0][0].id, "sold");
    assert.equal(navigation[0][1].dealId, "test-deal");
    await act(async () => button("EXPAND").click());
    assert.equal(button("SAVE INVOICE"), undefined);
    await act(async () => button("CONTINUE TO SOLD").click());
    assert.equal(navigation[1][0].id, "sold");
    assert.deepEqual(calls, ["resolve-existing-machine", "record-credit", "refresh"]);
    assert.equal(JSON.stringify({ original, invoice }), originalJSON);
  } finally { await act(async () => root.unmount()); }
});
test("SOLD confirms acquisition in place, retries inventory without another purchase, then closes once", async () => {
  const acquisitionContract = compile("modules/asset-acquisition/IXIAssetAcquisitionContract.js");
  const acquisitionEngine = compile("modules/asset-acquisition/IXIAssetAcquisitionRecordEngine.js");
  const context = { primary: { passportId: "outgoing-machine", label: "Outgoing loader" }, entity: { passportId: "test-entity", label: "Test dealer" }, actor: { passportId: "test-actor" } };
  const trade = { tradeId: "trade-test-001", passportId: "incoming-machine", objectId: "incoming-object", listingId: "incoming-listing", year: "2021", make: "TEST", model: "LOADER", hours: "4400", serialNumber: "TEST-INCOMING", allowance: 65000 };
  const invoice = { financialDocumentId: "test-invoice", documentNumber: "INV-TEST", sourceFinancialDocumentId: "test-order", financialState: "partially-collected", occurredAt: "2026-09-02", totals: { total: 75000 }, metadata: { dealId: "test-deal", customer: { name: "Test buyer" }, commercialBreakdown: { subtotal: 75000 } } };
  const credit = { financialDocumentId: "test-credit", documentType: "credit", creditType: "trade-credit", financialState: "incurred", sourceFinancialDocumentId: "test-invoice", totals: { total: 65000 }, tradeCorrection: { trade } };
  const payment = { financialDocumentId: "test-wire", documentType: "payment", paymentDirection: "inflow", financialState: "paid", sourceFinancialDocumentId: "test-invoice", totals: { total: 10000 } };
  let acquisitions = 0, inventoryAttempts = 0, sales = 0;
  let storedAcquisition;
  const row = { ...trade, status: "identified", inventoryStatus: "pending", machine: trade };
  const acqApp = compile("modules/asset-acquisition/IXIAssetAcquisitionApp.jsx", {
    "../../IXIMoneyInput": moneyInput,
    "./IXIAssetAcquisitionContract": acquisitionContract,
    "./IXIAssetAcquisitionRecordEngine": acquisitionEngine,
    "./IXIAssetAcquisitionStyles": noop,
    "./IXIAssetAcquisitionCommands": { createIXIAssetAcquisition: async ({ input, context: incomingContext }) => {
      acquisitions++;
      assert.equal(incomingContext.primary.passportId, trade.passportId);
      assert.equal(input.clientRequestId, `trade-acquisition:${trade.tradeId}`);
      assert.equal(input.trade.sourceFinancialDocumentId, credit.financialDocumentId);
      assert.equal(input.purchasePrice, 65000);
      assert.equal(input.purchaseDate, invoice.occurredAt);
      assert.equal(input.sellerLabel, invoice.metadata.customer.name);
      assert.equal(input.tradeAllowance, "");
      storedAcquisition = acquisitionContract.createIXIAssetAcquisitionDraft({ context: incomingContext, input });
      assert.equal(storedAcquisition.acquisition.directAcquisitionCost, 65000);
      assert.equal(storedAcquisition.logistics.receivedDate, "");
      storedAcquisition.financialBinding = { financialDocumentId: "test-acquisition", revision: 1 };
      return { record: storedAcquisition };
    } },
  }).default;
  const closeoutTradeSection = compile("sales/IXITradeInSection.jsx", {
    "./IXITradeSaveWorkflow": workflow, "../../../ixi-machine-card/IXIMachineCard": privateCard,
    "../modules/asset-acquisition/IXIAssetAcquisitionApp": acqApp, "../IXIMoneyInput": moneyInput,
    "../../../ixi-object-system/IXIActionNoticeEngine": { runIXIActionNoticeLifecycle: ({ operation }) => operation() },
    "./IXITradeInSection.module.css": {},
  }).default;
  const soldApp = compile("modules/sold/IXIAssetSaleApp.jsx", {
    "./IXISaleReturnPanel": noop, "../../IXIMoneyInput": moneyInput,
    "../../sales/IXITradeInSection": closeoutTradeSection,
    "./IXIAssetSaleContract": soldContract,
    "./IXIAssetSaleCommands": { createIXIAssetSale: async ({ input }) => {
      sales++;
      assert.equal(row.inventoryStatus, "complete");
      assert.equal(input.machineSalePrice, 75000);
      const record = soldContract.createIXIAssetSaleDraft({ context, input });
      assert.equal(record.sale.salePrice, 75000);
      assert.equal(record.collection.balanceDue, 0);
      return { record, invoice };
    } },
    "../../../financial-runtime/IXIAosFinancialReadClient": {},
    "../../IXITransactRecordIndex": { getIXITransactRecordIndex: value => value },
    "../../IXIMachineCostBasisEngine": { getIXIMachineCostBasis: () => ({ totalInvested: 60000 }) },
    "../../IXITransactFilePolicy": {}, "./IXIAssetSaleStyles": noop,
  }).default;
  globalThis.fetch = async (url, options) => {
    assert.ok(url.startsWith("/api/ixi/onboarding/trades"));
    if (options.method === "GET") return { ok: true, json: async () => ({ rows: [row] }) };
    const input = JSON.parse(options.body);
    assert.equal(input.action, "acquired", "no extra trade or credit may be created");
    assert.equal(input.acquisitionId, "test-acquisition");
    inventoryAttempts++;
    if (inventoryAttempts === 1) return { ok: false, json: async () => ({ error: "Inventory response lost. Retry." }) };
    Object.assign(row, { status: "acquired", acquisitionId: "test-acquisition", inventoryStatus: "complete" });
    return { ok: true, json: async () => ({ row }) };
  };
  const root = createRoot(document.getElementById("root"));
  const button = text => [...document.querySelectorAll("button")].find(el => el.textContent.trim() === text);
  const render = records => root.render(React.createElement(soldApp, { context, sourceInvoice: invoice, financialRecords: records, dealId: "test-deal" }));
  try {
    await act(async () => render([credit, payment]));
    assert.equal(button("MARK SOLD").disabled, true);
    assert.match(document.body.textContent, /Balance cleared. Confirm the incoming trades below/);
    await act(async () => button("CONFIRM ACQUISITION").click());
    assert.equal(acquisitions, 0, "opening a review cannot record ownership");
    const review = document.querySelector('[aria-label="Confirm trade acquisition"]');
    assert.ok(review);
    await act(async () => {
      const confirm = [...review.querySelectorAll("button")].find(el => el.textContent === "CONFIRM ACQUISITION");
      confirm.click(); confirm.click();
    });
    assert.equal(acquisitions, 1);
    assert.equal(button("MARK SOLD").disabled, true);
    assert.ok(button("FINISH INVENTORY"));
    await act(async () => button("FINISH INVENTORY").click());
    assert.equal(acquisitions, 1);
    assert.equal(button("MARK SOLD").disabled, false);
    await act(async () => render([credit, { ...payment, totals: { total: 9000 } }]));
    assert.equal(button("MARK SOLD").disabled, true);
    await act(async () => render([credit, payment]));
    assert.equal(button("MARK SOLD").disabled, false);
    await act(async () => { const close = button("MARK SOLD"); close.click(); close.click(); });
    assert.equal(sales, 1);
    assert.equal(acquisitions, 1);
    assert.equal(inventoryAttempts, 2);
  } finally { await act(async () => root.unmount()); }
});
after(() => dom.window.close());
