import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

async function importSource(path) {
  const source = read(path);
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
