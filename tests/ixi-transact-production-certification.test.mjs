import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("unfinished chassis are not exposed as operational TRANSACT applications", async () => {
  const registrySource = await read("components/ixi-aos/transact/IXITransactModuleRegistry.js");
  const registry = await import(`data:text/javascript;base64,${Buffer.from(registrySource).toString("base64")}`);
  const visible = registry.getIXITransactModules({ objectType: "machine" });
  const all = registry.getIXITransactModules({ objectType: "machine", includeUnavailable: true });

  assert.equal(visible.some(item => ["receipt", "service-invoice"].includes(item.id)), false);
  assert.equal(visible.some(item => item.id === "quote"), true);
  assert.equal(visible.some(item => item.id === "sales-order"), true);
  assert.equal(visible.some(item => item.id === "invoice"), true);
  assert.equal(visible.every(item => item.readiness === "operational"), true);
  assert.equal(all.find(item => item.id === "quote")?.readiness, "operational");
  assert.equal(all.find(item => item.id === "sales-order")?.documentType, "sales-order");
  assert.equal(all.find(item => item.id === "invoice")?.readiness, "operational");
  assert.equal(all.find(item => item.id === "service-invoice")?.readiness, "sales-build");
  assert.equal(all.find(item => item.id === "technology-work")?.documentType, "work-order");
  assert.equal(all.find(item => item.id === "service-quote")?.documentType, "service-quote");
});

test("Sales Order and Invoice are separate launcher entries over one canonical Equipment Sale workspace", async () => {
  const [registrySource, shell, app, context] = await Promise.all([
    read("components/ixi-aos/transact/IXITransactModuleRegistry.js"),
    read("components/ixi-aos/transact/IXITransactApp.jsx"),
    read("components/ixi-aos/transact/modules/equipment-sale/IXIEquipmentSaleApp.jsx"),
    read("components/ixi-aos/transact/IXITransactContext.js"),
  ]);
  const registry = await import(`data:text/javascript;base64,${Buffer.from(registrySource).toString("base64")}`);
  const visible = registry.getIXITransactModules({ objectType: "machine" });
  const orderIndex = visible.findIndex(item => item.id === "sales-order");
  const invoiceIndex = visible.findIndex(item => item.id === "invoice");

  assert.ok(orderIndex >= 0);
  assert.ok(invoiceIndex > orderIndex);
  assert.match(shell, /import IXIEquipmentSaleApp/u);
  assert.match(shell, /moduleId === "sales-order" \|\| moduleId === "invoice"/u);
  assert.match(shell, /initialRecord=\{salesOrderSnapshot\}/u);
  assert.match(shell, /invoice=\{salesInvoiceSnapshot\}/u);
  assert.match(shell, /initialTab=\{moduleId === "invoice" \? "invoice" : "order"\}/u);
  assert.match(app, /entryMode === "invoice"/u);
  assert.match(context, /salesTermsDocument/u);
});

test("equipment Quote is a canonical AWS-backed application with a full branded worksheet", async () => {
  const [commands, contract, app, shell] = await Promise.all([
    read("components/ixi-aos/transact/modules/quote/IXIQuoteCommands.js"),
    read("components/ixi-aos/transact/modules/quote/IXIQuoteContract.js"),
    read("components/ixi-aos/transact/modules/quote/IXIQuoteApp.jsx"),
    read("components/ixi-aos/transact/IXITransactApp.jsx")
  ]);

  assert.match(commands, /documentType:\s*"quote"/u);
  assert.match(commands, /patchIXIAosFinancialDocument/u);
  assert.match(commands, /expectedRevision/u);
  assert.match(contract, /ixi-equipment-quote-v1/u);
  assert.doesNotMatch(contract, /customer name is required|quoted price is required/iu);
  assert.match(app, /OPEN WORKSHEET/u);
  assert.match(app, /FORMAL PREVIEW/u);
  assert.match(app, /SAVE IS ALWAYS AVAILABLE/u);
  assert.match(shell, /initialRecord=\{quoteSnapshot\}/u);
});

test("Purchase Order lifecycle persists with revision control and canonical readback", async () => {
  const [commands, recordEngine, app, shell] = await Promise.all([
    read("components/ixi-aos/transact/modules/purchase-order/IXIPurchaseOrderCommands.js"),
    read("components/ixi-aos/transact/modules/purchase-order/IXIPurchaseOrderRecordEngine.js"),
    read("components/ixi-aos/transact/modules/purchase-order/IXIPurchaseOrderApp.jsx"),
    read("components/ixi-aos/transact/IXITransactApp.jsx")
  ]);

  assert.match(commands, /purchaseOrderRecord:\s*canonicalRecord\(record\)/u);
  assert.match(commands, /patchIXIAosFinancialDocument/u);
  assert.match(commands, /expectedRevision/u);
  assert.match(commands, /financialDocument\?\.financialDocumentId/u);
  assert.match(recordEngine, /hydrateIXIPurchaseOrderRecord/u);
  assert.match(recordEngine, /financialBinding/u);
  assert.match(app, /updateIXIPurchaseOrder/u);
  assert.match(shell, /initialPurchaseOrder=\{purchaseOrderSnapshot\}/u);
  assert.doesNotMatch(shell, /setModuleId\("service-invoice"\)/u);
});

test("private TRANSACT runtime reads authority and Passport history before exposing applications", async () => {
  const runtime = await read("components/ixi-machine-card/private/IXIOwnedPrivateTransactRuntime.jsx");
  assert.match(runtime, /Promise\.all\(\[/u);
  assert.match(runtime, /loadIXIAosFinancialAccessContext/u);
  assert.match(runtime, /loadIXIAosPassportFinancialDocuments/u);
  assert.match(runtime, /onFinancialRecordsChange=\{\(\) => refresh\(\)\}/u);
});
