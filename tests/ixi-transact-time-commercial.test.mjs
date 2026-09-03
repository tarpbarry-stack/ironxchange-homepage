import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");

test("TIME uses stable commands and the canonical IX-Core identity", async () => {
  const commands = await read("components/ixi-aos/transact/modules/time/IXITimeEntryCommands.js");
  assert.match(commands, /IXI_TIME_COMMAND_ID_REQUIRED/u);
  assert.match(commands, /idempotencyKey: `ixi-time:\$\{commandId\}`/u);
  assert.match(commands, /document\.financialDocumentId/u);
  assert.match(commands, /document\.documentNumber/u);
  assert.doesNotMatch(commands, /`TIME-\$\{Date\.now\(\)\}`/u);
});

test("TIME persists field capture without inventing accounting rates", async () => {
  const commands = await read("components/ixi-aos/transact/modules/time/IXITimeEntryCommands.js");
  assert.match(commands, /hourlyRate: 0/u);
  assert.match(commands, /laborRateAuthority: "ix-financial"/u);
  assert.match(commands, /sourceFinancialDocumentId/u);
  assert.match(commands, /timeEntry: draft/u);
  assert.match(commands, /attachments: draft\.attachments/u);
});

test("live TIME is one revision-controlled server record from start through finish", async () => {
  const commands = await read("components/ixi-aos/transact/modules/time/IXITimeEntryCommands.js");
  const app = await read("components/ixi-aos/transact/modules/time/IXITimeStandaloneApp.jsx");
  assert.match(commands, /createIXITimeSessionRecord/u);
  assert.match(commands, /patchIXIAosFinancialDocument/u);
  assert.match(commands, /expectedRevision/u);
  assert.match(app, /await createIXITimeSessionRecord/u);
  assert.match(app, /await updateIXITimeSessionRecord/u);
  assert.match(app, /status: "recorded"/u);
  assert.match(app, /clearIXITimeSession\(context\);[\s\S]*setScreen\("saved"\)/u);
});

test("employee Passport history controls cross-object active timer continuity", async () => {
  const app = await read("components/ixi-aos/transact/modules/time/IXITimeStandaloneApp.jsx");
  const parent = await read("components/ixi-aos/transact/IXITransactApp.jsx");
  assert.match(app, /loadIXIAosPassportFinancialDocuments/u);
  assert.match(app, /\["running", "paused", "stopped"\]/u);
  assert.match(app, /replaceIXITimeSession/u);
  assert.match(parent, /financialRecords=\{financialRecords\}/u);
  assert.match(parent, /await onFinancialRecordsChange\?\.\(\)/u);
});

test("all TIME entry points provide retry-stable request identities", async () => {
  const embedded = await read("components/ixi-aos/transact/modules/time/IXITimeEntryApp.jsx");
  const work = await read("components/ixi-aos/transact/modules/work-order/IXIWorkOrderApp.jsx");
  const tech = await read("components/ixi-aos/transact/modules/tech-work-order/IXITechWorkOrderApp.jsx");
  assert.match(embedded, /clientRequestId: requestIdRef\.current/u);
  assert.match(work, /clientRequestId: `\$\{session\.sessionId\}:\$\{action\}/u);
  assert.match(tech, /clientRequestId: `\$\{session\.sessionId\}:\$\{action\}/u);
});
