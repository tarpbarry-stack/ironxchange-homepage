import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  classifyIXIMachineCostRecord,
  getIXIMachineCostBasis
} from "../components/ixi-aos/transact/IXIMachineCostBasisEngine.js";

const read = path => fs.readFileSync(path, "utf8");

function record(id, documentType, amount, extra = {}) {
  return {
    id,
    number: id.toUpperCase(),
    documentType,
    amount,
    status: "posted",
    revision: 1,
    occurredAt: "2026-01-01T12:00:00.000Z",
    source: {},
    document: {},
    ...extra
  };
}

test("F$2 calculates invested cost without mixing in revenue or projections", () => {
  const projection = getIXIMachineCostBasis({ records: [
    record("acq", "asset-acquisition", 41500),
    record("acq", "asset-acquisition", 40000, { revision: 0 }),
    record("freight", "bill", 1600, { document: { metadata: { acquisitionCategory: "freight" } } }),
    record("repair", "expense", 5200, { title: "Hydraulic repair" }),
    record("po", "purchase-order", 1000),
    record("quote", "service-quote", 9000),
    record("income", "rental-income", 5000),
    record("void", "bill", 300, { status: "void" }),
    record("unknown", "journal-entry", 50)
  ] });

  assert.equal(projection.totalInvested, 48300);
  assert.equal(projection.acquisition, 41500);
  assert.equal(projection.additionalCosts, 6800);
  assert.equal(projection.committed, 1000);
  assert.equal(projection.planned, 9000);
  assert.equal(projection.reviewCount, 1);
  assert.equal(projection.reviewAmount, 50);
});

test("F$2 subtracts machine cost credits and treats paid bills as incurred", () => {
  assert.deepEqual(
    classifyIXIMachineCostRecord(record("credit", "credit", 750, { title: "Freight credit" })),
    { state: "actual", category: "freight", amount: -750, reason: "credit" }
  );
  assert.equal(
    classifyIXIMachineCostRecord(record("bill", "bill", 800, { status: "paid" })).state,
    "actual"
  );
});

test("F$2 is a peer machine face with traceable TRAN$ACT drill-down", () => {
  const face = read("components/ixi-aos/transact/IXIMachineCostBasis.jsx");
  const consoleRuntime = read("components/ixi-aos/transact/IXITransactObjectConsole.jsx");
  const directory = read("components/ixi-machine-console/IXIMachineWorkspaceDirectory.jsx");

  assert.match(face, /getIXITransactRecordIndex\(financialRecords\)/);
  assert.match(face, /getIXIMachineCostBasis\(index\)/);
  assert.match(face, /TOTAL INVESTED/);
  assert.match(face, /INCURRED COST · PAID \+ UNPAID/);
  assert.match(face, /ACQUISITION/);
  assert.match(face, /ADDED COSTS/);
  assert.match(face, /COMMITTED/);
  assert.match(face, /PLANNED/);
  assert.match(face, /source: "machine-cost-basis-f2"/);
  assert.match(face, /width:298px;height:471px/);
  assert.match(directory, /COST_BASIS:\s*"machine-cost-basis"/);
  assert.match(directory, /label:\s*"F\$2"/);
  assert.match(consoleRuntime, /COST_BASIS\]:\s*5/);
  assert.match(consoleRuntime, /workspaceId === MACHINE_WORKSPACE_IDS\.COST_BASIS/);
});
