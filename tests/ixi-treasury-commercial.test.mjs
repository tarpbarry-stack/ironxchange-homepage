import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const path = (name) =>
  new URL(
    `../components/ixi-aos/transact/modules/treasury/${name}`,
    import.meta.url,
  );
const moduleFrom = (source) =>
  import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  );

const policy = await moduleFrom(
  await readFile(path("IXITreasuryPolicyEngine.js"), "utf8"),
);
const projectionSource = (
  await readFile(path("IXITreasuryProjectionEngine.js"), "utf8")
).replace(
  /import\s*\{[\s\S]*?\}\s*from\s*"\.\/IXITreasuryContract";/u,
  'const unwrapIXIFinancialDocument=value=>value?.financialDocument||value?.record?.financialDocument||value; const hydrateIXITreasuryAccounts=records=>records.map(unwrapIXIFinancialDocument).filter(document=>document?.documentType==="treasury-account"&&document.treasuryAccount).map(document=>({...document.treasuryAccount,identity:{...document.treasuryAccount.identity,accountId:document.financialDocumentId}}));',
);
const projection = await moduleFrom(projectionSource);

const account = (id, name) => ({
  financialDocument: {
    financialDocumentId: id,
    documentType: "treasury-account",
    financialState: "submitted",
    treasuryAccount: {
      identity: { accountId: id },
      account: { name, accountType: "checking", currency: "USD", active: true },
      control: { minimumCash: 100 },
    },
  },
});
const movement = (id, type, amount, direction, extra = {}) => ({
  financialDocument: {
    financialDocumentId: id,
    documentType: "payment",
    financialState: "posted",
    paymentDirection: direction,
    totals: { total: amount },
    treasuryMovement: { transactionClass: type, ...extra },
  },
});

test("Treasury derives book cash from canonical movements and transfer legs", () => {
  const records = [
      account("cash-a", "Operating"),
      account("cash-b", "Reserve"),
      movement("open-a", "opening-balance", 1000, "inflow", {
        cashAccountFinancialDocumentId: "cash-a",
      }),
      movement("open-b", "opening-balance", 500, "inflow", {
        cashAccountFinancialDocumentId: "cash-b",
      }),
      movement("fee", "cash-adjustment", 50, "outflow", {
        cashAccountFinancialDocumentId: "cash-a",
      }),
      movement("transfer", "account-transfer", 200, "outflow", {
        fromCashAccountFinancialDocumentId: "cash-a",
        toCashAccountFinancialDocumentId: "cash-b",
      }),
    ],
    result = projection.buildIXITreasuryProjection({
      financialRecords: records,
      asOf: new Date("2026-09-03T00:00:00Z"),
    });
  assert.equal(result.totalCash, 1450);
  assert.equal(
    result.accounts.find((item) => item.accountId === "cash-a").bookBalance,
    750,
  );
  assert.equal(
    result.accounts.find((item) => item.accountId === "cash-b").bookBalance,
    700,
  );
});

test("Treasury policy is explicit and deny-by-default", () => {
  assert.equal(
    policy.getIXITreasuryPolicy({ context: { permissions: [] } })
      .canPostMovements,
    false,
  );
  const granted = policy.getIXITreasuryPolicy({
    context: {
      permissions: [
        "financial.treasury.manage",
        "financial.treasury.movement.post",
        "financial.treasury.reconcile",
      ],
    },
  });
  assert.deepEqual(granted, {
    canManageAccounts: true,
    canPostMovements: true,
    canReconcile: true,
  });
});

test("Treasury commands use canonical IX-Core fields and never synthetic balances", async () => {
  const source = await readFile(path("IXITreasuryCommands.js"), "utf8");
  assert.match(source, /documentType:\s*"treasury-account"/u);
  assert.match(source, /documentType:\s*"treasury-reconciliation"/u);
  assert.match(source, /paymentDirection/u);
  assert.match(source, /treasuryMovement/u);
  assert.match(source, /fromCashAccountFinancialDocumentId/u);
  assert.match(source, /toCashAccountFinancialDocumentId/u);
  assert.match(source, /financialDocumentId/u);
  assert.doesNotMatch(source, /syntheticPayment|direction:\s*"transfer"/u);
});

test("Treasury app refreshes canonical records after every write", async () => {
  const source = await readFile(path("IXITreasuryApp.jsx"), "utf8");
  assert.match(source, /onFinancialRecordsChange/u);
  assert.match(source, /hydrateIXITreasuryAccounts/u);
  assert.match(source, /responseRecord/u);
  assert.doesNotMatch(source, /syntheticPayment/u);
});
