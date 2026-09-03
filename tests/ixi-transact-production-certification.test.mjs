import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("unfinished chassis are not exposed as operational TRANSACT applications", async () => {
  const registrySource = await read("components/ixi-aos/transact/IXITransactModuleRegistry.js");
  const registry = await import(`data:text/javascript;base64,${Buffer.from(registrySource).toString("base64")}`);
  const visible = registry.getIXITransactModules({ objectType: "machine" });
  const all = registry.getIXITransactModules({ objectType: "machine", includeUnavailable: true });

  assert.equal(visible.some(item => ["receipt", "quote", "invoice", "service-invoice"].includes(item.id)), false);
  assert.equal(visible.every(item => item.readiness === "operational"), true);
  assert.equal(all.find(item => item.id === "quote")?.readiness, "sales-build");
  assert.equal(all.find(item => item.id === "invoice")?.readiness, "sales-build");
  assert.equal(all.find(item => item.id === "service-invoice")?.readiness, "sales-build");
  assert.equal(all.find(item => item.id === "technology-work")?.documentType, "work-order");
  assert.equal(all.find(item => item.id === "service-quote")?.documentType, "service-quote");
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
