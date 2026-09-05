import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = path => fs.readFileSync(path, "utf8");

test("$F1 is the default machine TRAN$ACT console face", () => {
  const consoleRuntime = read(
    "components/ixi-aos/transact/IXITransactObjectConsole.jsx"
  );
  const panel = read(
    "components/ixi-aos/transact/IXITransactConsolePanel.jsx"
  );

  assert.match(
    consoleRuntime,
    /TRANSACT_CONSOLE_FACES\s*=\s*\[\s*1,\s*2,\s*3,\s*4\s*\]/
  );
  assert.match(consoleRuntime, /face:\s*1,[\s\S]*defaultFace:\s*1/);
  assert.match(consoleRuntime, /financialRecords=\{financialRecords\}/);
  assert.match(panel, /Number\(face\) === 1/);
  assert.match(panel, /<IXITransactRecordIndex/);
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
  assert.match(source, /NO TRAN\$ACT RECORDS/);
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
  assert.match(source, /source: "transact-record-index-f1"/);
  assert.match(source, /if \(recordId\) setRecordId\("")/);
});
