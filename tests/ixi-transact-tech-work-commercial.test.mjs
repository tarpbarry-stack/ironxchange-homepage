import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Tech Work launches and resumes from Passport-backed financial history", () => {
  const runtime = read("components/ixi-machine-card/private/IXIOwnedPrivateTransactRuntime.jsx");
  const shell = read("components/ixi-aos/transact/IXITransactApp.jsx");

  assert.match(runtime, /function findActiveTechWorkOrder/u);
  assert.match(runtime, /document\?\.techWorkOrder/u);
  assert.match(runtime, /activeTechWorkOrder=\{activeTechWorkOrder\}/u);
  assert.match(shell, /initialTechWorkOrder=\{techWorkOrderSnapshot \|\| activeTechWorkOrder\}/u);
});

test("Tech Work create uses one stable command and a server-issued canonical identity", () => {
  const commands = read("components/ixi-aos/transact/modules/tech-work-order/IXITechWorkOrderCommands.js");
  const app = read("components/ixi-aos/transact/modules/tech-work-order/IXITechWorkOrderApp.jsx");

  assert.match(commands, /workOrderType: "technology"/u);
  assert.match(commands, /techWorkOrder: draft/u);
  assert.match(commands, /idempotencyKey: clean\(idempotencyKey\) \|\| stableId/u);
  assert.match(commands, /financialDocumentId/u);
  assert.match(commands, /role: "entity"/u);
  assert.match(commands, /role: "location"/u);
  assert.match(commands, /role: "technician"/u);
  assert.doesNotMatch(app, /techWorkOrderId: `TECHWO-\$\{now\}`/u);
  assert.doesNotMatch(app, /number: `TECHWO-/u);
});

test("Tech Work lifecycle updates are revision-controlled and preserve specialized lineage", () => {
  const shell = read("components/ixi-aos/transact/IXITransactApp.jsx");
  const contract = read("components/ixi-aos/transact/modules/tech-work-order/IXITechWorkOrderContract.js");

  assert.match(shell, /expectedRevision: record\?\.financialBinding\?\.revision/u);
  assert.match(shell, /patch: \{[\s\S]*techWorkOrder: record/u);
  assert.match(shell, /financialState: action === "close" \? "closed" : "incurred"/u);
  assert.match(contract, /techWorkOrderId: resolvedTechId, workOrderId: resolvedTechId/u);
  assert.match(contract, /timeEntryIds/u);
  assert.match(contract, /materialRecordIds/u);
  assert.match(contract, /serviceRecordIds/u);
  assert.match(contract, /expenseIds/u);
  assert.match(contract, /purchaseOrderIds/u);
});

test("Tech Work only advances local state after persistence succeeds", () => {
  const app = read("components/ixi-aos/transact/modules/tech-work-order/IXITechWorkOrderApp.jsx");

  assert.match(app, /const persisted = await createIXITechWorkOrder/u);
  assert.match(app, /const canonical = persisted\.draft;[\s\S]*setRecord\(canonical\)/u);
  assert.match(app, /const persisted = await onRecordChange\?\./u);
  assert.match(app, /setRecord\(canonical\)/u);
});

test("Tech Work completion requires operator evidence", () => {
  const engine = read("components/ixi-aos/transact/modules/tech-work-order/IXITechWorkOrderEngine.js");
  const app = read("components/ixi-aos/transact/modules/tech-work-order/IXITechWorkOrderApp.jsx");

  assert.match(engine, /Work performed is required before TECHWO completion/u);
  assert.match(engine, /Completion validation is required before TECHWO completion/u);
  assert.match(app, /disabled=\{busy \|\| !clean\(completionText\)\}/u);
});
