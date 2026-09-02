import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("private listing surfaces share one Passport-bound TRAN$ACT runtime", () => {
  const face1 = read("components/ixi-machine-card/private/IXIOwnedPrivateListingRuntime.jsx");
  const face2 = read("components/ixi-machine-object/IXISellerMachineObjectFace2.js");
  const runtime = read("components/ixi-machine-card/private/IXIOwnedPrivateTransactRuntime.jsx");
  assert.match(face1, /IXIOwnedPrivateTransactRuntime/u);
  assert.match(face2, /IXIOwnedPrivateTransactRuntime/u);
  assert.match(runtime, /loadIXIAosFinancialAccessContext/u);
  assert.match(runtime, /loadIXIAosPassportFinancialDocuments/u);
  assert.match(runtime, /THIS OBJECT NEEDS AN IXI PASSPORT/u);
});

test("work orders use durable identity, idempotency, and revision-bound updates", () => {
  const app = read("components/ixi-aos/transact/modules/work-order/IXIWorkOrderApp.jsx");
  const commands = read("components/ixi-aos/transact/modules/work-order/IXIWorkOrderCommands.js");
  const shell = read("components/ixi-aos/transact/IXITransactApp.jsx");
  assert.doesNotMatch(app, /WO-1058/u);
  assert.match(app, /createIXIWorkOrder/u);
  assert.match(commands, /resolvedCommandId/u);
  assert.match(commands, /financialDocumentId/u);
  assert.match(shell, /patchIXIAosFinancialDocument/u);
  assert.match(shell, /expectedRevision/u);
});

test("all general operational apps have implemented render paths", () => {
  const registry = read("components/ixi-aos/transact/IXITransactModuleRegistry.js");
  const shell = read("components/ixi-aos/transact/IXITransactApp.jsx");
  for (const id of ["receipt", "quote", "invoice", "freight-order"]) assert.match(registry, new RegExp(`id: "${id}"`, "u"));
  assert.match(shell, /IXIOperationalDocumentApp/u);
  assert.match(shell, /\["receipt", "quote", "invoice", "freight-order"\]/u);
});

test("financial proxy exposes Passport reads and revision-controlled patches", () => {
  const passportRoute = read("pages/api/ixi/financial/passports/[passportId]/documents.js");
  const documentRoute = read("pages/api/ixi/financial/documents/[financialDocumentId].js");
  const adapter = read("components/ixi-aos/financial-runtime/IXIAosFinancialRuntimeAdapter.js");
  assert.match(passportRoute, /financial\/passports/u);
  assert.match(documentRoute, /\["GET", "PATCH"\]/u);
  assert.match(adapter, /transactContractVersion/u);
  assert.match(adapter, /transactInput/u);
});
