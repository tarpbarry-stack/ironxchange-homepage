import assert from "node:assert/strict";
import test from "node:test";

import {
  makeChartIntegrityError,
  normalizePostingAccounts
} from "../components/ixi-transact-dashboard/domain/chartOfAccountsPolicy.mjs";

test("inactive accounts remain outside the new-posting population", () => {
  const result = normalizePostingAccounts({
    data: {
      accounts: [
        { accountCode: "4000", accountName: "Revenue", active: false },
        { accountCode: "1000", accountName: "Cash", accountType: "asset", active: true }
      ]
    }
  });

  assert.deepEqual(result.accounts.map(account => account.accountCode), ["1000"]);
  assert.equal(result.inactiveCount, 1);
  assert.deepEqual(result.integrityErrors, []);
});

test("active account identity is canonicalized and sorted deterministically", () => {
  const result = normalizePostingAccounts({
    data: {
      activeAccounts: [
        { accountCode: " 4000 ", accountName: " Revenue ", active: true },
        { accountCode: "1000", accountName: "Cash", active: true, system: true }
      ]
    }
  });

  assert.deepEqual(result.accounts.map(account => account.accountCode), ["1000", "4000"]);
  assert.equal(result.accounts[1].accountName, "Revenue");
  assert.equal(result.accounts[0].system, true);
});

test("duplicate active account codes fail closed", () => {
  const result = normalizePostingAccounts({
    data: {
      accounts: [
        { accountCode: "1000", accountName: "Cash", active: true },
        { accountCode: "1000", accountName: "Other Cash", active: true }
      ]
    }
  });
  const error = makeChartIntegrityError(result.integrityErrors);

  assert.equal(result.accounts.length, 1);
  assert.equal(error.code, "IXI_FINANCIAL_COA_DUPLICATE_ACCOUNT_CODE");
  assert.match(error.message, /1000/);
});

test("malformed active identities fail closed while malformed inactive rows do not", () => {
  const malformedActive = normalizePostingAccounts({
    data: { accounts: [{ accountCode: "", accountName: "Cash", active: true }] }
  });
  const malformedInactive = normalizePostingAccounts({
    data: { accounts: [{ accountCode: "", accountName: "", active: false }] }
  });

  assert.equal(makeChartIntegrityError(malformedActive.integrityErrors).code, "IXI_FINANCIAL_COA_ACCOUNT_IDENTITY_INVALID");
  assert.equal(makeChartIntegrityError(malformedInactive.integrityErrors), null);
});
