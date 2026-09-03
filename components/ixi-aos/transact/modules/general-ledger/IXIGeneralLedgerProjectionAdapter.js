const clean = value => String(value ?? "").trim();
const arr = value => Array.isArray(value) ? value : [];
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export function hydrateIXICanonicalJournal(document = {}) {
  return {
    schema: "ixi-journal-entry-v2",
    identity: {
      journalEntryId: clean(document.financialDocumentId),
      number: clean(document.documentNumber || document.financialDocumentId)
    },
    source: {
      financialDocumentId: clean(document.sourceFinancialDocumentId || document.sourceDocumentId),
      documentType: clean(document.sourceDocumentType),
      documentNumber: clean(document.sourceDocumentNumber)
    },
    period: clean(document.period),
    entityPassportId: clean(
      arr(document.references).find(reference => clean(reference.role) === "entity")?.passportId
    ),
    currency: clean(document.currency || "USD").toUpperCase(),
    description: clean(document.description),
    posting: {
      ruleId: clean(document.postingRuleId),
      ruleVersion: clean(document.postingRuleVersion),
      status: clean(document.financialState || document.status).toLowerCase(),
      postedAt: clean(document.metadata?.postedAt),
      reversedBy: clean(document.metadata?.reversedBy),
      reversalOf: clean(document.metadata?.reversalOf)
    },
    lines: arr(document.lines).map((line, index) => ({
      lineId: clean(line.financialLineId || line.lineId || index + 1),
      accountCode: clean(line.accountCode),
      accountName: clean(line.accountName),
      debit: num(line.debit),
      credit: num(line.credit),
      memo: clean(line.memo || line.description),
      dimensions: line.dimensions || {}
    })),
    totals: {
      debits: num(document.accounting?.totalDebit ?? document.totals?.debit),
      credits: num(document.accounting?.totalCredit ?? document.totals?.credit),
      difference: 0,
      balanced: document.accounting?.balanced === true
    },
    dimensions: document.dimensions || {},
    audit: {
      createdAt: clean(document.metadata?.createdAt || document.occurredAt),
      createdBy: clean(document.metadata?.createdBy),
      createdByLabel: clean(document.metadata?.createdByLabel),
      updatedAt: clean(document.metadata?.postedAt || document.occurredAt)
    },
    canonical: {
      financialDocumentId: clean(document.financialDocumentId),
      source: "ixi-core-dynamodb"
    }
  };
}

export function hydrateIXIGLProjection(result = {}) {
  const projection = result?.data?.projection || result?.projection || {};
  const scope = result?.data?.scope || {};
  const accounts = arr(projection.chart?.accounts);
  const journals = arr(projection.journal).map(hydrateIXICanonicalJournal);
  const period = projection.period || {};
  const endingRows = arr(projection.endingTrialBalance?.rows);
  const coreBalance = projection.balanceSheet || {};
  const natural = row => {
    if (["liability", "equity", "revenue"].includes(clean(row.accountType || row.type))) {
      return num(row.credit) - num(row.debit);
    }
    return num(row.debit) - num(row.credit);
  };
  const balanceSheet = {
    assets: endingRows.filter(row => ["asset", "contra-asset"].includes(clean(row.accountType || row.type))).map(row => ({ ...row, type: clean(row.accountType || row.type), balance: natural(row) })),
    liabilities: endingRows.filter(row => clean(row.accountType || row.type) === "liability").map(row => ({ ...row, type: "liability", balance: natural(row) })),
    equity: endingRows.filter(row => clean(row.accountType || row.type) === "equity").map(row => ({ ...row, type: "equity", balance: natural(row) })),
    totalAssets: num(coreBalance.assets),
    totalLiabilities: num(coreBalance.liabilities),
    ledgerEquity: num(coreBalance.contributedEquity),
    currentEarnings: num(coreBalance.currentEarnings),
    totalEquity: num(coreBalance.equity),
    liabilitiesAndEquity: num(coreBalance.liabilitiesAndEquity),
    difference: num(coreBalance.difference),
    balanced: coreBalance.balanced === true
  };

  return {
    scope,
    schema: clean(projection.schema),
    generatedAt: clean(projection.generatedAt),
    currency: clean(projection.currency || scope.currency || "USD").toUpperCase(),
    chart: {
      schema: clean(projection.chart?.schema || "ixi-financial-chart-of-accounts-v1"),
      entityPassportId: clean(scope.entityPassportId),
      source: clean(projection.chart?.source || "ixi-core"),
      accounts
    },
    journals,
    period: {
      schema: "ixi-accounting-period-v2",
      identity: { periodId: clean(period.closeDocumentId || `PER-${period.period || scope.period}`), number: clean(period.period || scope.period) },
      entityPassportId: clean(scope.entityPassportId),
      period: clean(period.period || scope.period),
      status: period.closed === true ? "closed" : "open",
      close: {
        financialDocumentId: clean(period.closeDocumentId),
        closedAt: clean(period.closedAt),
        closedBy: clean(period.closedBy),
        closedByLabel: clean(period.closedBy)
      }
    },
    trialBalance: projection.trialBalance || { rows: [], debits: 0, credits: 0, difference: 0, balanced: true },
    endingTrialBalance: projection.endingTrialBalance || { rows: [], debits: 0, credits: 0, difference: 0, balanced: true },
    profitAndLoss: projection.profitAndLoss || {},
    cumulativeProfitAndLoss: projection.cumulativeProfitAndLoss || {},
    balanceSheet,
    controls: projection.controls || {},
    counts: projection.counts || {},
    lineage: result?.data?.lineage || {}
  };
}

export default { hydrateIXICanonicalJournal, hydrateIXIGLProjection };
