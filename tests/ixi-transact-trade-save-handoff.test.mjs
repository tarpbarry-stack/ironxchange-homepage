import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), "utf8");
const workflow = await import(`data:text/javascript;base64,${Buffer.from(read("components/ixi-aos/transact/sales/IXITradeSaveWorkflow.js")).toString("base64")}`);
const sale = await import(`data:text/javascript;base64,${Buffer.from(read("components/ixi-aos/transact/modules/equipment-sale/IXIEquipmentSaleContract.js")).toString("base64")}`);
const form = { tradeId: "trade-save-001", year: "2019", make: "Test", model: "Loader", hours: "4500", serialNumber: "TRADE-TEST-001", location: "Test yard", allowance: "65000" };

function fixture({ failedAttach = false } = {}) {
  const events = [];
  let record = sale.createIXIEquipmentSaleDraft({ input: { totals: { subtotal: 75000 } } });
  let created = 0, canonicalRow;
  const callbacks = {
    form, outgoingPassportId: "outgoing-passport",
    prepareOrder: async () => { events.push("prepare"); return record; },
    saveMachine: async input => {
      events.push("machine");
      canonicalRow ||= { ...input, passportId: "incoming-passport", objectId: "incoming-object", listingId: "incoming-listing" };
      if (!created) created++;
      return { row: canonicalRow };
    },
    onMachineSaved: () => events.push("recoverable"),
    attachTrade: async trades => {
      events.push("attach");
      record = sale.updateIXIEquipmentSale(record, { ...sale.saleInputFromRecord(record), trades });
      if (failedAttach) { failedAttach = false; return null; }
      events.push("invoice");
      return record;
    },
  };
  return { callbacks, events, created: () => created, record: () => record };
}

test("Save Order completes the machine, allowance and net invoice as one workflow", async () => {
  const f = fixture();
  const saved = await workflow.saveTradeInOrder(f.callbacks);
  assert.deepEqual(f.events, ["prepare", "machine", "recoverable", "attach", "invoice"]);
  assert.equal(saved.trades.length, 1);
  assert.equal(saved.totals.tradeAllowance, 65000);
  assert.equal(saved.totals.total, 10000);
  assert.equal(saved.totals.total - 10000, 0);
});

test("an invoice failure retains the saved machine and a retry attaches the same identity once", async () => {
  const f = fixture({ failedAttach: true });
  await assert.rejects(workflow.saveTradeInOrder(f.callbacks), /needs retry/);
  const saved = await workflow.saveTradeInOrder(f.callbacks);
  assert.equal(f.created(), 1);
  assert.equal(saved.trades.length, 1);
  assert.equal(saved.trades[0].passportId, "incoming-passport");
  assert.equal(saved.totals.total, 10000);
});

test("incomplete trade fields prevent the parent order from being silently saved without them", async () => {
  for (const patch of [{ serialNumber: "" }, { allowance: "" }, { allowance: "bad" }, { hours: "" }, { year: "19" }]) {
    const f = fixture();
    await assert.rejects(workflow.saveTradeInOrder({ ...f.callbacks, form: { ...form, ...patch } }));
    assert.deepEqual(f.events, []);
  }
});

test("a mismatched machine response never attaches an unverified identity", async () => {
  const f = fixture();
  await assert.rejects(workflow.saveTradeInOrder({ ...f.callbacks, saveMachine: async () => ({ row: { tradeId: "wrong" } }) }), /identity/);
  assert.deepEqual(f.events, ["prepare"]);
});

const commandSource = read("components/ixi-aos/transact/modules/equipment-sale/IXIEquipmentSaleCommands.js")
  .replace(/import\s+[\s\S]*?from\s+"[^"]+";\n/g, "").replace(/export default[^;]+;/g, "").replace(/export /g, "");
const commands = new Function("loadIXIAosFinancialDocument", `${commandSource}\nreturn { hydrateIXIEquipmentWorkflowInvoice };`)(() => { throw new Error("Unexpected network call"); });

test("workflow invoice hydration obtains the actual revision before updating the trade allowance", async () => {
  const document = { financialDocumentId: "invoice-test", totals: { total: 75000 }, metadata: {} };
  const hydrated = await commands.hydrateIXIEquipmentWorkflowInvoice(document, async input => {
    assert.equal(input.financialDocumentId, document.financialDocumentId);
    return { financialDocument: document, server: { revision: 4 } };
  });
  assert.equal(hydrated.financialBinding.revision, 4);
  assert.equal(hydrated.financialBinding.financialDocumentId, document.financialDocumentId);
  for (const result of [null, { financialDocument: document, server: { revision: 0 } }, { financialDocument: { financialDocumentId: "other" }, server: { revision: 4 } }])
    await assert.rejects(commands.hydrateIXIEquipmentWorkflowInvoice(document, async () => result), /revision/);
});
