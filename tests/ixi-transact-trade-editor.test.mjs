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
const noop = () => null;
let acquisitionProps;
const moneyInput = ({ value, onValueChange, ...props }) => React.createElement("input", { ...props, value: value ?? "", onChange: event => onValueChange(event.target.value) });
const tradeSection = compile("sales/IXITradeInSection.jsx", {
  "./IXITradeSaveWorkflow": workflow,
  "../../../ixi-machine-card/IXIMachineCard": noop,
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
  const invoice = { financialDocumentId: "test-invoice", sourceFinancialDocumentId: "test-order", financialState: "partially-collected", totals: { total: 75000 }, financialBinding: { financialDocumentId: "test-invoice", revision: 4 } };
  const originalJSON = JSON.stringify({ original, invoice });
  let correction = { corrections: [], blockedReason: "", position: { invoiceAmount: 75000, received: 10000, credited: 0, tradeCredit: 0, balance: 65000 } };
  let machineRequest;
  const fields = { year: "2021", make: "TEST", model: "LOADER", hours: "4400", serialNumber: "EXISTING-TEST-001", location: "Test yard" };
  globalThis.fetch = async (url, options) => {
    if (options.method === "GET") return { ok: true, json: async () => url.includes("mode=existing")
      ? { listings: [{ listingId: "existing-listing", displayName: "2021 TEST LOADER", fields }], meta: { totalPages: 1 } } : { rows: [] } };
    machineRequest = JSON.parse(options.body); calls.push("resolve-existing-machine");
    return { ok: true, json: async () => ({ row: { ...machineRequest, passportId: "existing-passport", objectId: "existing-object", listingId: "existing-listing" } }) };
  };
  const app = compile("modules/equipment-sale/IXIEquipmentSaleApp.jsx", {
    "../../sales/IXITradeInSection": tradeSection, "../../sales/IXITradeSummary": noop,
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
    await act(async () => button("EXPAND").click());
    assert.ok([...section().querySelectorAll("input")].some(input => input.value === fields.serialNumber));
    await act(async () => button("SAVE").click());
    assert.deepEqual(calls, ["resolve-existing-machine", "record-credit", "refresh"]);
    assert.equal(machineRequest.existingListingId, "existing-listing");
    assert.equal(JSON.stringify({ original, invoice }), originalJSON);
    assert.match(document.body.textContent, /Original invoice \$75,000.00 · Money received \$10,000.00 · Customer balance \$0.00/);
    await act(async () => button("ACQUISITION").click());
    assert.equal(acquisitionProps.tradeContext.sourceFinancialDocumentId, "test-trade-credit");
    assert.equal(acquisitionProps.initialInput.purchasePrice, 65000);
    assert.equal(acquisitionProps.object.passportId, "existing-passport");
  } finally { await act(async () => root.unmount()); }
});
after(() => dom.window.close());
