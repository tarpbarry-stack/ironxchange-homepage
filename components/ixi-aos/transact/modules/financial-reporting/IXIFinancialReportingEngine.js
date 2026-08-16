const clean = value => String(value ?? "").trim();
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = value => Math.round(num(value) * 100) / 100;
const arr = value => Array.isArray(value) ? value : [];

function periodInRange(period, fromPeriod, toPeriod) {
  const p = clean(period);
  if (!p) return false;
  if (fromPeriod && p < fromPeriod) return false;
  if (toPeriod && p > toPeriod) return false;
  return true;
}

function fiscalStartPeriod(throughPeriod = "", fiscalYearStartMonth = 1) {
  const match = /^(\d{4})-(\d{2})$/.exec(clean(throughPeriod));
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const startMonth = Math.min(12, Math.max(1, Number(fiscalYearStartMonth) || 1));
  const fiscalYear = month >= startMonth ? year : year - 1;
  return `${fiscalYear}-${String(startMonth).padStart(2, "0")}`;
}

function isPostedJournal(journal = {}) {
  return journal.posting?.status === "posted" && !clean(journal.posting?.reversedBy);
}

function accountMap(chart = {}) {
  return new Map(arr(chart.accounts).map(account => [clean(account.code), account]));
}

function eligibleJournals(journals = [], fromPeriod = "", toPeriod = "") {
  return arr(journals).filter(journal => isPostedJournal(journal) && periodInRange(journal.period, fromPeriod, toPeriod));
}

function lineNaturalAmount(line = {}, account = {}) {
  const type = clean(account.type).toLowerCase();
  if (["liability", "equity", "revenue", "contra-asset"].includes(type)) return money(num(line.credit) - num(line.debit));
  return money(num(line.debit) - num(line.credit));
}

function accountTotals(journals = [], chart = {}) {
  const accounts = accountMap(chart);
  const totals = new Map();
  for (const journal of arr(journals)) {
    for (const line of arr(journal.lines)) {
      const code = clean(line.accountCode);
      if (!code) continue;
      const account = accounts.get(code) || { code, name: clean(line.accountName) || code, type: "unknown", control: "" };
      const current = totals.get(code) || { accountCode: code, accountName: account.name || code, type: account.type || "unknown", control: account.control || "", debit: 0, credit: 0, balance: 0 };
      current.debit = money(current.debit + num(line.debit));
      current.credit = money(current.credit + num(line.credit));
      current.balance = money(current.balance + lineNaturalAmount(line, account));
      totals.set(code, current);
    }
  }
  return [...totals.values()].sort((a, b) => a.accountCode.localeCompare(b.accountCode));
}

export function buildIXIIncomeStatement({ journals = [], chart = {}, fromPeriod = "", toPeriod = "" } = {}) {
  const selected = eligibleJournals(journals, fromPeriod, toPeriod);
  const totals = accountTotals(selected, chart);
  const revenue = totals.filter(row => row.type === "revenue" && Math.abs(row.balance) > 0.004);
  const expenses = totals.filter(row => row.type === "expense" && Math.abs(row.balance) > 0.004);
  const totalRevenue = money(revenue.reduce((sum, row) => sum + row.balance, 0));
  const totalExpenses = money(expenses.reduce((sum, row) => sum + row.balance, 0));
  const netIncome = money(totalRevenue - totalExpenses);
  const marginPercent = totalRevenue ? money((netIncome / totalRevenue) * 100) : 0;
  return { fromPeriod, toPeriod, revenue, expenses, totalRevenue, totalExpenses, netIncome, marginPercent };
}

export function buildIXIBalanceSheet({ journals = [], chart = {}, throughPeriod = "", fiscalYearStartMonth = 1 } = {}) {
  const selected = eligibleJournals(journals, "", throughPeriod);
  const totals = accountTotals(selected, chart);
  const assets = totals.filter(row => ["asset", "contra-asset"].includes(row.type) && Math.abs(row.balance) > 0.004);
  const liabilities = totals.filter(row => row.type === "liability" && Math.abs(row.balance) > 0.004);
  const equity = totals.filter(row => row.type === "equity" && Math.abs(row.balance) > 0.004);
  const totalAssets = money(assets.reduce((sum, row) => sum + (row.type === "contra-asset" ? -row.balance : row.balance), 0));
  const totalLiabilities = money(liabilities.reduce((sum, row) => sum + row.balance, 0));
  const ledgerEquity = money(equity.reduce((sum, row) => sum + row.balance, 0));
  const fiscalFromPeriod = fiscalStartPeriod(throughPeriod, fiscalYearStartMonth);
  const earnings = buildIXIIncomeStatement({ journals, chart, fromPeriod: fiscalFromPeriod, toPeriod: throughPeriod });
  const currentEarnings = money(earnings.netIncome);
  const totalEquity = money(ledgerEquity + currentEarnings);
  const liabilitiesAndEquity = money(totalLiabilities + totalEquity);
  const difference = money(totalAssets - liabilitiesAndEquity);
  return { throughPeriod, fiscalFromPeriod, fiscalYearStartMonth, assets, liabilities, equity, totalAssets, totalLiabilities, ledgerEquity, currentEarnings, totalEquity, liabilitiesAndEquity, difference, balanced: Math.abs(difference) < 0.005 };
}

function counterpartCodes(journal = {}, cashCodes = new Set()) {
  return arr(journal.lines).map(line => clean(line.accountCode)).filter(code => code && !cashCodes.has(code));
}

function classifyCashJournal(journal = {}, chart = {}, cashCodes = new Set()) {
  const accounts = accountMap(chart);
  const sourceType = clean(journal.source?.documentType).toLowerCase();
  const ruleId = clean(journal.posting?.ruleId).toLowerCase();
  if (ruleId.includes("transfer")) return "transfer";
  const counterparts = counterpartCodes(journal, cashCodes).map(code => accounts.get(code) || { code, type: "unknown", control: "" });
  if (counterparts.some(account => ["fixed-asset", "inventory"].includes(clean(account.control)))) return "investing";
  if (counterparts.some(account => ["debt", "equity"].includes(clean(account.control))) || ruleId.includes("settlement")) return "financing";
  if (counterparts.some(account => ["ar", "ap", "credit-card", "expense", "revenue"].includes(clean(account.control))) || ["invoice", "bill", "expense", "payment", "credit"].includes(sourceType)) return "operating";
  return "unclassified";
}

export function buildIXICashFlow({ journals = [], chart = {}, fromPeriod = "", toPeriod = "" } = {}) {
  const selected = eligibleJournals(journals, fromPeriod, toPeriod);
  const cashCodes = new Set(arr(chart.accounts).filter(account => clean(account.control) === "cash").map(account => clean(account.code)));
  const sections = { operating: [], investing: [], financing: [], unclassified: [], transfer: [] };
  for (const journal of selected) {
    const cashLines = arr(journal.lines).filter(line => cashCodes.has(clean(line.accountCode)));
    if (!cashLines.length) continue;
    const cashChange = money(cashLines.reduce((sum, line) => sum + num(line.debit) - num(line.credit), 0));
    if (Math.abs(cashChange) < 0.005) continue;
    const classification = classifyCashJournal(journal, chart, cashCodes);
    sections[classification].push({ journalEntryId: clean(journal.identity?.journalEntryId), number: clean(journal.identity?.number), sourceNumber: clean(journal.source?.documentNumber), sourceType: clean(journal.source?.documentType), description: clean(journal.description), period: clean(journal.period), amount: cashChange });
  }
  function total(key) { return money(sections[key].reduce((sum, row) => sum + row.amount, 0)); }
  const operating = total("operating");
  const investing = total("investing");
  const financing = total("financing");
  const unclassified = total("unclassified");
  return { fromPeriod, toPeriod, sections, operating, investing, financing, unclassified, netChange: money(operating + investing + financing + unclassified), internalTransfersExcluded: sections.transfer.length };
}

function dimensionValue(line = {}, journal = {}, dimension = "") {
  return clean(line.dimensions?.[dimension] || journal.dimensions?.[dimension]);
}

export function buildIXIProfitability({ journals = [], chart = {}, fromPeriod = "", toPeriod = "", dimension = "assetPassportId" } = {}) {
  const selected = eligibleJournals(journals, fromPeriod, toPeriod);
  const accounts = accountMap(chart);
  const groups = new Map();
  for (const journal of selected) {
    for (const line of arr(journal.lines)) {
      const account = accounts.get(clean(line.accountCode));
      if (!account || !["revenue", "expense"].includes(clean(account.type))) continue;
      const key = dimensionValue(line, journal, dimension);
      if (!key) continue;
      const group = groups.get(key) || { key, revenue: 0, expense: 0, netIncome: 0, marginPercent: 0, journalIds: new Set() };
      const value = lineNaturalAmount(line, account);
      if (account.type === "revenue") group.revenue = money(group.revenue + value);
      else group.expense = money(group.expense + value);
      group.journalIds.add(clean(journal.identity?.journalEntryId));
      groups.set(key, group);
    }
  }
  return [...groups.values()].map(group => ({ ...group, journalIds: [...group.journalIds], netIncome: money(group.revenue - group.expense), marginPercent: group.revenue ? money(((group.revenue - group.expense) / group.revenue) * 100) : 0 })).sort((a, b) => b.netIncome - a.netIncome);
}

export function buildIXITrialBalanceReport({ journals = [], chart = {}, throughPeriod = "" } = {}) {
  const selected = eligibleJournals(journals, "", throughPeriod);
  const rows = accountTotals(selected, chart).filter(row => Math.abs(row.debit) + Math.abs(row.credit) > 0.004);
  const debits = money(rows.reduce((sum, row) => sum + row.debit, 0));
  const credits = money(rows.reduce((sum, row) => sum + row.credit, 0));
  const difference = money(debits - credits);
  return { throughPeriod, rows, debits, credits, difference, balanced: Math.abs(difference) < 0.005 };
}

export function buildIXIFinancialExecutiveSummary({ journals = [], chart = {}, fromPeriod = "", toPeriod = "", priorFromPeriod = "", priorToPeriod = "", fiscalYearStartMonth = 1 } = {}) {
  const income = buildIXIIncomeStatement({ journals, chart, fromPeriod, toPeriod });
  const priorIncome = priorFromPeriod || priorToPeriod ? buildIXIIncomeStatement({ journals, chart, fromPeriod: priorFromPeriod, toPeriod: priorToPeriod }) : null;
  const balance = buildIXIBalanceSheet({ journals, chart, throughPeriod: toPeriod, fiscalYearStartMonth });
  const cashFlow = buildIXICashFlow({ journals, chart, fromPeriod, toPeriod });
  const revenueVariance = priorIncome ? money(income.totalRevenue - priorIncome.totalRevenue) : 0;
  const incomeVariance = priorIncome ? money(income.netIncome - priorIncome.netIncome) : 0;
  return { income, priorIncome, balance, cashFlow, revenueVariance, incomeVariance };
}

export default {
  buildIXIIncomeStatement,
  buildIXIBalanceSheet,
  buildIXICashFlow,
  buildIXIProfitability,
  buildIXITrialBalanceReport,
  buildIXIFinancialExecutiveSummary
};
