import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("both private machine surfaces use the Passport-backed TRAN$ACT runtime", () => {
  const face1 = read("components/ixi-machine-card/private/IXIOwnedPrivateListingRuntime.jsx");
  const face2 = read("components/ixi-machine-object/IXISellerMachineObjectFace2.js");
  const runtime = read("components/ixi-machine-card/private/IXIOwnedPrivateTransactRuntime.jsx");

  assert.match(face1, /IXIOwnedPrivateTransactRuntime/u);
  assert.match(face2, /IXIOwnedPrivateTransactRuntime/u);
  assert.match(runtime, /loadIXIAosFinancialAccessContext/u);
  assert.match(runtime, /loadIXIAosPassportFinancialDocuments/u);
  assert.match(runtime, /findActiveWorkOrder/u);
});

test("Work Order creation has canonical identity and no preview number", () => {
  const app = read("components/ixi-aos/transact/modules/work-order/IXIWorkOrderApp.jsx");
  const commands = read("components/ixi-aos/transact/modules/work-order/IXIWorkOrderCommands.js");

  assert.doesNotMatch(app, /WO-1058/u);
  assert.match(app, /createIXIWorkOrder/u);
  assert.match(commands, /resolvedCommandId/u);
  assert.match(commands, /idempotencyKey/u);
  assert.match(commands, /financialDocumentId/u);
});

test("Work Order lifecycle updates use revision-controlled financial patches", () => {
  const shell = read("components/ixi-aos/transact/IXITransactApp.jsx");
  const route = read("pages/api/ixi/financial/documents/[financialDocumentId].js");

  assert.match(shell, /patchIXIAosFinancialDocument/u);
  assert.match(shell, /expectedRevision/u);
  assert.match(shell, /financialState: id === "complete" \? "closed" : "incurred"/u);
  assert.match(route, /\["GET", "PATCH"\]/u);
});

