function clean(value) {
  return String(value ?? "").trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

/**
 * Converts the server-owned Entity Chart of Accounts into the only accounts
 * eligible for new postings. Historical ledger rows are intentionally outside
 * this policy: an inactive account remains readable, but cannot be selected.
 */
export function normalizePostingAccounts(payload) {
  const data = payload?.data || {};
  const source = safeArray(
    data?.activeAccounts?.length ? data.activeAccounts : data.accounts
  );
  const integrityErrors = [];
  const accountsByCode = new Map();
  let inactiveCount = 0;

  source.forEach((sourceAccount, index) => {
    if (sourceAccount?.active !== true) {
      inactiveCount += 1;
      return;
    }

    const account = {
      accountCode: clean(sourceAccount?.accountCode),
      accountName: clean(sourceAccount?.accountName),
      accountType: clean(sourceAccount?.accountType),
      control: clean(sourceAccount?.control),
      active: true,
      system: sourceAccount?.system === true
    };

    if (!account.accountCode || !account.accountName) {
      integrityErrors.push({
        code: "IXI_FINANCIAL_COA_ACCOUNT_IDENTITY_INVALID",
        message: `Active Chart of Accounts record ${index + 1} is missing its canonical code or name.`
      });
      return;
    }

    if (accountsByCode.has(account.accountCode)) {
      integrityErrors.push({
        code: "IXI_FINANCIAL_COA_DUPLICATE_ACCOUNT_CODE",
        message: `Active Chart of Accounts code ${account.accountCode} is duplicated.`
      });
      return;
    }

    accountsByCode.set(account.accountCode, account);
  });

  return {
    entityPassportId: clean(data?.entityPassportId),
    storageProvider: clean(data?.storageProvider),
    counts: data?.counts || {},
    inactiveCount,
    integrityErrors,
    accounts: [...accountsByCode.values()].sort((a, b) =>
      a.accountCode.localeCompare(b.accountCode)
    )
  };
}

export function makeChartIntegrityError(integrityErrors) {
  const errors = safeArray(integrityErrors);

  if (!errors.length) return null;

  const error = new Error(errors.map(item => item.message).join(" "));
  error.code = errors[0].code || "IXI_FINANCIAL_COA_INTEGRITY_ERROR";
  error.details = errors;
  return error;
}
