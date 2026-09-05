import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

async function importSource(path) {
  const source = read(path);
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

async function importSourceWithDependency(path, dependencyPath, importPattern) {
  const dependency = read(dependencyPath);
  const dependencyUrl = `data:text/javascript;base64,${Buffer.from(dependency).toString("base64")}`;
  const source = read(path).replace(importPattern, `from "${dependencyUrl}"`);
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

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
  assert.match(commands, /occurredAt: `\$\{draft\.dates\.performedOn\}T12:00:00\.000Z`/u);
  assert.match(commands, /workPerformedOn: draft\.dates\.performedOn/u);
  assert.doesNotMatch(app, /techWorkOrderId: `TECHWO-\$\{now\}`/u);
  assert.doesNotMatch(app, /number: `TECHWO-/u);
});

test("Tech Work lifecycle updates are revision-controlled and preserve specialized lineage", () => {
  const shell = read("components/ixi-aos/transact/IXITransactApp.jsx");
  const contract = read("components/ixi-aos/transact/modules/tech-work-order/IXITechWorkOrderContract.js");

  assert.match(shell, /expectedRevision: record\?\.financialBinding\?\.revision/u);
  assert.match(shell, /patch: \{[\s\S]*techWorkOrder: record/u);
  assert.match(shell, /financialState: \["complete", "close"\]\.includes\(action\) \? "closed" : "incurred"/u);
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

test("Tech Work completion requires distinct operator evidence", async () => {
  const engine = read("components/ixi-aos/transact/modules/tech-work-order/IXITechWorkOrderEngine.js");
  const app = read("components/ixi-aos/transact/modules/tech-work-order/IXITechWorkOrderApp.jsx");

  assert.match(engine, /Work performed is required before TECHWO completion/u);
  assert.match(engine, /Root cause is required before TECHWO completion/u);
  assert.match(engine, /Resolution is required before TECHWO completion/u);
  assert.match(engine, /Completion validation is required before TECHWO completion/u);
  assert.match(app, /value=\{editDraft\.workPerformed/u);
  assert.match(app, /value=\{editDraft\.rootCause/u);
  assert.match(app, /value=\{editDraft\.resolution/u);
  assert.match(app, /value=\{editDraft\.validation/u);
  assert.doesNotMatch(app, /Completed by assigned technician/u);
});

test("Tech Work operating changes require reasons and retain Passport attribution", async () => {
  const contractPath = "components/ixi-aos/transact/modules/tech-work-order/IXITechWorkOrderContract.js";
  const { createIXITechWorkOrderDraft } = await importSource(contractPath);
  const engine = await importSourceWithDependency(
    "components/ixi-aos/transact/modules/tech-work-order/IXITechWorkOrderEngine.js",
    contractPath,
    /from "\.\/IXITechWorkOrderContract"/u
  );
  const original = createIXITechWorkOrderDraft({
    context: { actor: { passportId: "IXIMANAGER", displayName: "Shop Manager" } },
    input: { description: "Install machine telematics", status: "in-progress" }
  });

  assert.throws(
    () => engine.applyIXITechWorkOrderAction({ record: original, action: "assign", payload: { technician: { passportId: "IXITECH", label: "Tech" } } }),
    /reason is required/u
  );
  const assigned = engine.applyIXITechWorkOrderAction({
    record: original,
    action: "assign",
    actor: { displayName: "Shop Manager" },
    payload: { technician: { passportId: "ixitech", label: "Technology Tech" }, reason: "Primary installer" }
  });
  assert.equal(assigned.people.assignedTo[0].passportId, "IXITECH");
  assert.equal(assigned.activityProjection.at(-1).type, "technician-assigned");

  const crewed = engine.applyIXITechWorkOrderAction({
    record: assigned,
    action: "crew",
    actor: { displayName: "Shop Manager" },
    payload: { crew: [{ passportId: "IXIHELPER", label: "Helper" }], reason: "Cable routing support" }
  });
  assert.equal(crewed.people.crew.length, 1);
  assert.equal(crewed.activityProjection.at(-1).note.includes("Cable routing support"), true);

  assert.throws(
    () => engine.applyIXITechWorkOrderAction({ record: crewed, action: "update", payload: { description: "Updated", performedOn: "2999-01-01", reason: "Correction" } }),
    /not in the future/u
  );
});

test("Tech Work uses canonical Cost, Activity, Related projections and remains open after refresh callbacks", () => {
  const app = read("components/ixi-aos/transact/modules/tech-work-order/IXITechWorkOrderApp.jsx");
  const shell = read("components/ixi-aos/transact/IXITransactApp.jsx");

  assert.match(app, /IXIWorkOrderCostView/u);
  assert.match(app, /IXIWorkOrderActivityView/u);
  assert.match(app, /IXIWorkOrderRelatedView/u);
  assert.match(app, /financialRecords=\{financialRecords\}/u);
  assert.match(app, /fetch\(`\/api\/passport/u);
  assert.doesNotMatch(app, /action: "edit-tech-work-order"/u);
  assert.match(shell, /else if \(moduleId !== "technology-work"\) setTechWorkOrderSnapshot\(null\)/u);
  assert.match(shell, /<IXITechWorkOrderApp[\s\S]*financialRecords=\{financialRecords\}/u);
});
