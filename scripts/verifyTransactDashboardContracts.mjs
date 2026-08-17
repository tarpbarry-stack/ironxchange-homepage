import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function importSource(relativePath) {
  const absolute = path.resolve(process.cwd(), relativePath);
  const source = await fs.readFile(absolute, "utf8");
  const encoded = Buffer.from(`${source}\n//# sourceURL=${pathToFileURL(absolute).href}`).toString("base64");
  return import(`data:text/javascript;base64,${encoded}`);
}

const adapter = await importSource("components/ixi-transact-dashboard/data/IXITransactDesktopWorkspaceAdapter.js");
const executiveAdapter = await importSource("components/ixi-transact-dashboard/data/IXITransactDashboardProjectionAdapter.js");
const queryContract = await importSource("components/ixi-transact-dashboard/data/IXITransactDashboardQueryContract.js");
const actionRegistry = await importSource("components/ixi-transact-dashboard/data/IXITransactRecordActionRegistry.js");

const emptyExecutive = executiveAdapter.createIXIExecutiveDesktopModel({});
assert.equal(emptyExecutive.kpis.revenue, null, "Missing Executive revenue must remain unknown, not fabricated zero.");
assert.equal(emptyExecutive.kpis.cash, null, "Missing Executive cash must remain unknown, not fabricated zero.");
assert.equal(emptyExecutive.financialPosition.assets, null, "Missing balance-sheet truth must remain unknown.");

const emptyAR = adapter.createIXIARDesktopModel({});
assert.deepEqual(emptyAR.receivables, [], "A/R must render empty records safely.");
assert.equal(emptyAR.totals.totalAR, null, "Missing A/R truth must remain unknown, not fabricated zero.");
assert.equal(emptyAR.pagination.hasNext, false, "Missing A/R pagination must be safe.");

const emptyAP = adapter.createIXIAPDesktopModel({});
assert.deepEqual(emptyAP.payables, [], "A/P must render empty records safely.");
assert.equal(emptyAP.pagination.hasPrevious, false, "Missing A/P pagination must be safe.");

const emptyPO = adapter.createIXIPurchaseOrdersDesktopModel({});
assert.deepEqual(emptyPO.purchaseOrders, [], "Purchase Orders must render empty records safely.");
assert.equal(emptyPO.pagination.totalCount, null, "Missing PO count must remain unknown.");

const emptyOperations = adapter.createIXIOperationsDesktopModel({});
assert.deepEqual(emptyOperations.workOrders, [], "Work Orders must render empty records safely.");
assert.equal(emptyOperations.pagination.cursor, "", "Missing Work Order cursor must normalize safely.");

const noStatement = adapter.createIXIReconciliationDesktopModel({
  treasury: { accounts: [{ accountId: "CASH-1", name: "Operating", bookBalance: 1000, lastStatementBalance: null }] }
});
assert.equal(noStatement.accounts[0].status, "needs-statement", "No statement evidence must never be called reconciled.");
assert.equal(noStatement.accounts[0].difference, null, "Difference is unknown without statement evidence.");
assert.equal(noStatement.summary.needsStatement, 1);

const outOfBalance = adapter.createIXIReconciliationDesktopModel({
  treasury: { accounts: [{ accountId: "CASH-2", name: "Operating", bookBalance: 1000, lastStatementBalance: 975 }] }
});
assert.equal(outOfBalance.accounts[0].status, "out-of-balance");
assert.equal(outOfBalance.accounts[0].difference, 25);
assert.equal(outOfBalance.summary.openDifference, 25);

const balanced = adapter.createIXIReconciliationDesktopModel({
  treasury: { accounts: [{ accountId: "CASH-3", name: "Operating", bookBalance: 1000, lastStatementBalance: 1000 }] }
});
assert.equal(balanced.accounts[0].status, "reconciled");
assert.equal(balanced.summary.reconciled, 1);

const normalizedActions = actionRegistry.normalizeIXITransactRecordActions([
  { id: "record-ar-payment", enabled: true },
  { id: "record-ar-payment", enabled: true },
  { id: "void-po", allowed: false, reason: "Closed period" },
  { id: "server-injected-javascript", enabled: true }
]);
assert.deepEqual(normalizedActions.map(action => action.id), ["record-ar-payment", "void-po"], "Only known action IDs may reach desktop controls and duplicates are removed.");
assert.equal(normalizedActions[0].requiresInput, true, "A/R payment must require structured input.");
assert.equal(normalizedActions[1].enabled, false, "Server-disabled known action must remain disabled.");
assert.equal(normalizedActions[1].dangerous, true, "Destructive action classification is owned by the client registry.");
assert.deepEqual(actionRegistry.getUnknownIXITransactRecordActionIds([{id:"server-injected-javascript"}]), ["server-injected-javascript"], "Unknown server action IDs must be detectable and discarded.");
assert.equal(actionRegistry.canExecuteIXITransactRecordAction({id:"issue-po",enabled:true}), true);
assert.equal(actionRegistry.canExecuteIXITransactRecordAction({id:"record-ap-payment",enabled:true}), false, "Input-required financial mutation is never directly executable without an input workflow.");

assert.deepEqual(queryContract.getIXITransactWorkspaceIncludes("reconciliation"), ["treasury", "attention"]);
assert.deepEqual(queryContract.getIXITransactWorkspaceIncludes("purchase-orders"), ["purchase-orders", "attention"]);

const invalid = queryContract.validateIXITransactDashboardQuery(queryContract.createIXITransactDashboardQuery());
assert.equal(invalid.ok, false, "Financial dashboard query requires authorized entity and period.");
assert.ok(invalid.errors.some(error => error.code === "entity-scope-required"));
assert.ok(invalid.errors.some(error => error.code === "period-required"));

const valid = queryContract.validateIXITransactDashboardQuery(queryContract.createIXITransactDashboardQuery({
  scope: { entityPassportIds: ["passport:entity:test"] },
  period: { accountingPeriod: "2026-08" },
  include: ["ar"]
}));
assert.equal(valid.ok, true, "Authorized entity + period query must validate.");

console.log("IXI TRAN$ACT dashboard contract verification passed.");
