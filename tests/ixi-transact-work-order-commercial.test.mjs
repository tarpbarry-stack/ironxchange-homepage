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

test("Work Order keeps the historical business date separate from its audit timestamp", async () => {
  const { createIXIWorkOrderDraft } = await importSource(
    "components/ixi-aos/transact/modules/work-order/IXIWorkOrderContract.js"
  );
  const draft = createIXIWorkOrderDraft({
    context: {
      launchedAt: "2026-09-05T16:20:00.000Z",
      actor: { passportId: "IXIGHMQNQH" }
    },
    input: { performedOn: "2025-11-13", description: "Replaced filters" }
  });

  assert.equal(draft.dates.performedOn, "2025-11-13");
  assert.equal(draft.dates.requestedAt, "2026-09-05T16:20:00.000Z");
  assert.equal(draft.audit.createdAt, "2026-09-05T16:20:00.000Z");
});

test("changing an open Work Order date requires a reason and appends an immutable amendment", async () => {
  const { createIXIWorkOrderDraft, amendIXIWorkPerformedDate } = await importSource(
    "components/ixi-aos/transact/modules/work-order/IXIWorkOrderContract.js"
  );
  const original = createIXIWorkOrderDraft({
    context: { launchedAt: "2026-09-05T16:20:00.000Z" },
    input: { performedOn: "2025-11-13" }
  });

  assert.throws(
    () => amendIXIWorkPerformedDate(original, {
      performedOn: "2025-11-14",
      amendedAt: "2026-09-05T17:00:00.000Z"
    }),
    error => error.code === "IXI_WORK_DATE_REASON_REQUIRED"
  );

  const revised = amendIXIWorkPerformedDate(original, {
    performedOn: "2025-11-14",
    reason: "Corrected from shop log",
    actor: { passportId: "IXIGHMQNQH", displayName: "Shop Manager" },
    amendedAt: "2026-09-05T17:00:00.000Z"
  });

  assert.equal(revised.dates.performedOn, "2025-11-14");
  assert.equal(revised.audit.createdAt, original.audit.createdAt);
  assert.equal(revised.audit.updatedAt, "2026-09-05T17:00:00.000Z");
  assert.deepEqual(
    revised.amendments[0],
    {
      amendmentId: revised.amendments[0].amendmentId,
      type: "work-performed-date-amendment",
      field: "dates.performedOn",
      previousValue: "2025-11-13",
      revisedValue: "2025-11-14",
      reason: "Corrected from shop log",
      occurredAt: "2026-09-05T17:00:00.000Z",
      actorId: "IXIGHMQNQH",
      actorLabel: "Shop Manager"
    }
  );
});

test("future dates are rejected and completed Work Order dates are frozen", async () => {
  const { createIXIWorkOrderDraft, amendIXIWorkPerformedDate, validateIXIWorkPerformedDate } = await importSource(
    "components/ixi-aos/transact/modules/work-order/IXIWorkOrderContract.js"
  );
  assert.equal(
    validateIXIWorkPerformedDate("2026-09-06", { today: "2026-09-05" }).code,
    "IXI_WORK_DATE_FUTURE"
  );
  const complete = createIXIWorkOrderDraft({
    context: { launchedAt: "2026-09-05T16:20:00.000Z" },
    input: { performedOn: "2025-11-13", status: "complete" }
  });
  assert.throws(
    () => amendIXIWorkPerformedDate(complete, {
      performedOn: "2025-11-14",
      reason: "Correction",
      amendedAt: "2026-09-05T17:00:00.000Z"
    }),
    error => error.code === "IXI_WORK_DATE_LOCKED"
  );
});

test("Work Performed Date is indexed, editable, revision controlled, and bilingual", () => {
  const app = read("components/ixi-aos/transact/modules/work-order/IXIWorkOrderApp.jsx");
  const commands = read("components/ixi-aos/transact/modules/work-order/IXIWorkOrderCommands.js");
  const shell = read("components/ixi-aos/transact/IXITransactApp.jsx");

  assert.match(app, /type="date"/u);
  assert.match(app, /FECHA DEL TRABAJO REALIZADO/u);
  assert.match(app, /REASON FOR CHANGE/u);
  assert.match(app, /amendIXIWorkPerformedDate/u);
  assert.match(commands, /occurredAt:`\$\{draft\.dates\.performedOn\}T12:00:00\.000Z`/u);
  assert.match(commands, /workPerformedOn:draft\.dates\.performedOn/u);
  assert.match(shell, /id === "work-date-amend"/u);
  assert.match(shell, /expectedRevision/u);
});

test("closing a TRANSACT surface clears any shared transient action notice", () => {
  const provider = read("components/ixi-aos/card-runtime/IXIAosCardCommandContext.jsx");

  assert.match(provider, /externalUpdateRef/u);
  assert.match(provider, /currentNotice\?\.message/u);
  assert.match(provider, /updateExternalState\(currentObjectId, \{ actionNotice: null \}\)/u);
});

test("Work Order operating changes are reasoned, attributable, and immutable after close", async () => {
  const contractPath = "components/ixi-aos/transact/modules/work-order/IXIWorkOrderContract.js";
  const engine = await importSourceWithDependency(
    "components/ixi-aos/transact/modules/work-order/IXIWorkOrderRecordEngine.js",
    contractPath,
    /from "\.\/IXIWorkOrderContract"/u
  );
  const { createIXIWorkOrderDraft } = await importSource(contractPath);
  const original = createIXIWorkOrderDraft({
    context: {
      launchedAt: "2026-09-05T10:00:00.000Z",
      actor: { passportId: "IXIMANAGER", displayName: "Shop Manager" }
    },
    input: { description: "Replace filters", status: "in-progress" }
  });

  assert.throws(
    () => engine.assignIXIWorkOrderTechnician(original, {
      technician: { passportId: "IXITECH", label: "Technician" }
    }),
    error => error.code === "IXI_WORK_ORDER_REASON_REQUIRED"
  );

  const assigned = engine.assignIXIWorkOrderTechnician(original, {
    technician: { passportId: "IXITECH", label: "Technician" },
    reason: "Assigned by shop lead",
    actor: { passportId: "IXIMANAGER", displayName: "Shop Manager" },
    occurredAt: "2026-09-05T10:05:00.000Z"
  });
  assert.equal(assigned.people.assignedTo[0].passportId, "IXITECH");
  assert.equal(assigned.activity.at(-1).type, "work-order-technician-assigned");
  assert.equal(assigned.activity.at(-1).actor.passportId, "IXIMANAGER");

  const completed = engine.completeIXIWorkOrderRecord(assigned, {
    workPerformed: "Replaced engine and hydraulic filters",
    disposition: "fully-functioning",
    finalMachineCondition: "operable",
    recommendations: "Recheck at next service interval",
    actor: { passportId: "IXITECH", displayName: "Technician" },
    occurredAt: "2026-09-05T12:00:00.000Z"
  });
  assert.equal(completed.recordStatus, "closed");
  assert.equal(completed.result.workPerformed, "Replaced engine and hydraulic filters");
  assert.equal(completed.people.completedBy.passportId, "IXITECH");
  assert.throws(
    () => engine.updateIXIWorkOrderDetails(completed, { reason: "Overwrite" }),
    error => error.code === "IXI_WORK_ORDER_LOCKED"
  );
});

test("Cost, Activity, and Related projections are scoped to the Work Order", async () => {
  const projection = await importSource(
    "components/ixi-aos/transact/modules/work-order/IXIWorkOrderProjectionEngine.js"
  );
  const workOrder = {
    identity: { workOrderId: "FD-WO-1", number: "WO-100" },
    financial: { estimated: 900, requested: 100 },
    activity: [{ activityId: "EV-1", label: "WORK ORDER CREATED", occurredAt: "2026-09-05T10:00:00.000Z" }],
    noteProjection: [{ identity: { noteId: "NOTE-1" }, note: { body: "Filter replaced" } }],
    documentProjection: [],
    photoProjection: []
  };
  const records = [
    { financialDocument: { financialDocumentId: "MAT-1", documentType: "material-usage", amount: 250, description: "Filters", sourceFinancialDocumentId: "FD-WO-1", occurredAt: "2026-09-05T11:00:00.000Z" } },
    { financialDocument: { financialDocumentId: "EXP-1", documentType: "expense", amount: 75, description: "Shop supplies", metadata: { workOrderNumber: "WO-100" }, occurredAt: "2026-09-05T11:30:00.000Z" } },
    { financialDocument: { financialDocumentId: "OTHER-1", documentType: "expense", amount: 999, metadata: { workOrderId: "FD-OTHER" } } }
  ];

  const cost = projection.getIXIWorkOrderCostProjection(workOrder, records);
  assert.equal(cost.actual, 325);
  assert.equal(cost.totals.materials, 250);
  assert.equal(cost.totals.expenses, 75);
  assert.equal(cost.rows.length, 2);
  assert.equal(projection.getIXIWorkOrderActivity(workOrder, records).length, 3);
  assert.equal(projection.getIXIWorkOrderRelationships(workOrder, records).notes.length, 1);
});

test("Work Order UI has real operating tabs and preserves the record during refresh", () => {
  const app = read("components/ixi-aos/transact/modules/work-order/IXIWorkOrderApp.jsx");
  const shell = read("components/ixi-aos/transact/IXITransactApp.jsx");
  const runtime = read("components/ixi-machine-card/private/IXIOwnedPrivateTransactRuntime.jsx");

  assert.match(app, /IXIWorkOrderCostView/u);
  assert.match(app, /IXIWorkOrderActivityView/u);
  assert.match(app, /IXIWorkOrderRelatedView/u);
  assert.match(app, /assignIXIWorkOrderTechnician/u);
  assert.match(app, /completeIXIWorkOrderRecord/u);
  assert.match(app, /verifyIXIPassport/u);
  assert.doesNotMatch(app, /emitAction\(actionId, workOrder\)/u);
  assert.match(shell, /financialRecords=\{financialRecords\}/u);
  assert.match(runtime, /current\.access[\s\S]*refreshing: true/u);
});
