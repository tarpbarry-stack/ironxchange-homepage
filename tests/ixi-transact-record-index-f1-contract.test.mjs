import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = path => fs.readFileSync(path, "utf8");

test("F$1 is a peer machine workspace, never a TRAN$ACT application", () => {
  const consoleRuntime = read(
    "components/ixi-aos/transact/IXITransactObjectConsole.jsx"
  );
  const directory = read(
    "components/ixi-machine-console/IXIMachineWorkspaceDirectory.jsx"
  );

  assert.match(
    consoleRuntime,
    /MACHINE_CONSOLE_FACES\s*=\s*\[\s*2,\s*3,\s*4,\s*5,\s*6\s*\]/
  );
  assert.match(directory, /TRANSACT:\s*"transact"/);
  assert.match(directory, /FINANCIAL:\s*"financial-record-index"/);
  assert.match(directory, /label:\s*"TRAN\$ACT"/);
  assert.match(directory, /label:\s*"F\$1"/);
  assert.match(consoleRuntime, /FINANCIAL\]:\s*4/);
  assert.match(consoleRuntime, /workspaceId === MACHINE_WORKSPACE_IDS\.FINANCIAL/);
  assert.match(consoleRuntime, /financialRecords=\{financialRecords\}/);
});

test("machine workspace tiles reorder and persist independently by console slot", () => {
  const consoleRuntime = read(
    "components/ixi-aos/transact/IXITransactObjectConsole.jsx"
  );
  const directory = read(
    "components/ixi-machine-console/IXIMachineWorkspaceDirectory.jsx"
  );

  assert.match(directory, /DndContext/);
  assert.match(directory, /SortableContext/);
  assert.match(directory, /useSortable/);
  assert.match(directory, /onWorkspaceOrderChange\?\.\(next\)/);
  assert.match(consoleRuntime, /machineWorkspaceOrderBySlot/);
  assert.match(consoleRuntime, /\[slotId\]: nextOrder/);
  assert.match(consoleRuntime, /machineWorkspaceOrderBySlot\?\.\[slot\.slotId\]/);
});

test("$F1 indexes authoritative records without copying them", () => {
  const source = read(
    "components/ixi-aos/transact/IXITransactRecordIndex.jsx"
  );

  assert.match(source, /getIXITransactRecordIndex\(records = \[\]\)/);
  assert.match(source, /financialDocumentOf\(item\)/);
  assert.match(source, /documentNumber/);
  assert.match(source, /financialDocumentId/);
  assert.match(source, /category: mapped\.category/);
  assert.match(source, /recordsForCategory\.length/);
  assert.match(source, /recordsForCategory\.reduce/);
  assert.match(source, /totalAmount:\s*money\(/);
  assert.match(source, /record\.costBasis\.state === "actual"/);
  assert.match(source, /invoice:\s*\{ category: "receivable", moduleId: "invoice" \}/);
  assert.match(source, /CUSTOMER INVOICES/);
  assert.match(source, /BILLS \/ PAYABLES/);
  assert.match(source, /TOTAL IN MACHINE/);
  assert.match(source, /formatMoney\(index\.totalAmount\)/);
  assert.match(source, /grid-template-columns:82px minmax\(0,1fr\)/);
  assert.match(source, /txri-total-kpi\{border-color:rgba\(255,196,0,\.68\)/);
  assert.doesNotMatch(source, /<span>OPEN<\/span>/);
  assert.match(source, /IXI MACHINE · F\$1/);
  assert.match(source, /NO MACHINE RECORDS/);
  assert.match(source, /packageAllocationByPassport/u);
  assert.match(source, /documentType === "asset-acquisition"/u);
});

test("$F1 drills from categories to numbered records and existing apps", () => {
  const source = read(
    "components/ixi-aos/transact/IXITransactRecordIndex.jsx"
  );

  assert.match(source, /setCategoryId\(item\.id\)/);
  assert.match(source, /setRecordId\(item\.id\)/);
  assert.match(source, /OPEN APP/);
  assert.match(source, /getIXITransactModule\(moduleId\)/);
  assert.match(source, /financialRecord: target\?\.source/);
  assert.match(source, /financialDocument: target\?\.document/);
  assert.match(source, /source: "machine-financial-face-f1"/);
  assert.match(source, /if \(recordId\) setRecordId\(""\)/);
});

test("$F1 routes Tech Work records back to Technology Work", async () => {
  const routingSource = read(
    "components/ixi-aos/transact/IXITransactRecordRouting.js"
  );
  const routing = await import(
    `data:text/javascript;base64,${Buffer.from(routingSource).toString("base64")}`
  );

  assert.equal(
    routing.resolveIXITransactRecordModuleId({
      documentType: "work-order",
      document: {
        documentNumber: "TECHWO-0DB964",
        metadata: { transactModule: "tech-work-order" },
        techWorkOrder: { schema: "ixi-tech-work-order-v1" }
      },
      embedded: { schema: "ixi-tech-work-order-v1" },
      fallbackModuleId: "work-order"
    }),
    "technology-work"
  );
  assert.equal(
    routing.resolveIXITransactRecordModuleId({
      documentType: "work-order",
      document: { documentNumber: "TECHWO-LEGACY" },
      fallbackModuleId: "work-order"
    }),
    "technology-work"
  );
  assert.equal(
    routing.resolveIXITransactRecordModuleId({
      documentType: "work-order",
      document: { documentNumber: "WO-88F3B2E5" },
      embedded: { schema: "ixi-work-order-v1" },
      fallbackModuleId: "work-order"
    }),
    "work-order"
  );
});

test("$F1 opens existing modules inside the selected console slot", () => {
  const consoleRuntime = read(
    "components/ixi-aos/transact/IXITransactObjectConsole.jsx"
  );
  const app = read(
    "components/ixi-aos/transact/IXITransactApp.jsx"
  );

  assert.match(consoleRuntime, /openConsoleModule\(slotId, item, payload = \{\}\)/);
  assert.match(consoleRuntime, /initialModuleId=\{consoleModule\.moduleId\}/);
  assert.match(consoleRuntime, /returnToClose/);
  assert.match(consoleRuntime, /closeConsoleModule\(slot\.slotId\)/);
  assert.match(consoleRuntime, /recordsForConsoleModule\(slot\.slotId\)/);
  assert.match(app, /initialModuleId = ""/);
  assert.match(app, /useState\(\(\) => clean\(initialModuleId\)\)/);
  assert.match(app, /if \(returnToClose\)/);
});
