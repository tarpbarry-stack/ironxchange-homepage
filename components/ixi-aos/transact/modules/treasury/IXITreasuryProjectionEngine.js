import {
  hydrateIXITreasuryAccounts,
  unwrapIXIFinancialDocument,
} from "./IXITreasuryContract";
const clean = (value) => String(value ?? "").trim();
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const money = (value) => Math.round(num(value) * 100) / 100;
const arr = (value) => (Array.isArray(value) ? value : []);
const doc = (value) => unwrapIXIFinancialDocument(value);
const amount = (value) =>
  money(
    doc(value)?.totals?.total ??
      doc(value)?.totals?.subtotal ??
      arr(doc(value)?.lines).reduce(
        (sum, line) => sum + Math.abs(num(line?.amount)),
        0,
      ),
  );
const id = (value) => clean(doc(value)?.financialDocumentId);
const date = (value) =>
  clean(
    doc(value)?.dueDate || doc(value)?.invoiceDate || doc(value)?.occurredAt,
  );
const valid = (value) =>
  !["void", "reversed", "rejected"].includes(
    clean(doc(value)?.financialState).toLowerCase(),
  );
function withinDays(value, days, asOf) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const delta = parsed.getTime() - asOf.getTime();
  return delta >= 0 && delta <= days * 86400000;
}
function movementDelta(value, accountId) {
  const document = doc(value),
    movement = document?.treasuryMovement || {},
    type = clean(movement.transactionClass);
  if (document?.documentType !== "payment" || !type || !valid(value)) return 0;
  const total = amount(value);
  if (type === "account-transfer") {
    if (clean(movement.fromCashAccountFinancialDocumentId) === accountId)
      return -total;
    if (clean(movement.toCashAccountFinancialDocumentId) === accountId)
      return total;
    return 0;
  }
  if (clean(movement.cashAccountFinancialDocumentId) !== accountId) return 0;
  return clean(document.paymentDirection) === "inflow" ? total : -total;
}
function sourceBalance(source, records) {
  const sourceId = id(source),
    gross = amount(source),
    settled = records
      .filter(
        (item) =>
          valid(item) &&
          clean(doc(item)?.sourceFinancialDocumentId) === sourceId &&
          ["payment", "credit"].includes(clean(doc(item)?.documentType)),
      )
      .reduce((sum, item) => sum + amount(item), 0);
  return money(Math.max(0, gross - settled));
}
function canonicalScheduledOutflows(records) {
  return records
    .map(doc)
    .filter((document) => document?.documentType === "payables-control")
    .flatMap((document) =>
      arr(document?.payablesControl?.scheduledPayments)
        .filter((item) => item.status === "scheduled")
        .map((item) => ({ date: item.date, amount: item.amount })),
    );
}
export function buildIXITreasuryProjection({
  accounts = [],
  financialRecords = [],
  scheduledOutflows = [],
  expectedInflows = [],
  asOf = new Date(),
} = {}) {
  const records = arr(financialRecords),
    canonicalAccounts = hydrateIXITreasuryAccounts(records),
    accountMap = new Map(
      [...arr(accounts), ...canonicalAccounts]
        .filter((item) => item?.account?.active !== false)
        .map((item) => [clean(item.identity?.accountId), item]),
    ),
    active = [...accountMap.values()];
  const accountRows = active.map((account) => {
    const accountId = clean(account.identity?.accountId),
      bookBalance = money(
        records.reduce((sum, item) => sum + movementDelta(item, accountId), 0),
      ),
      minimumCash = Math.max(0, money(account.control?.minimumCash));
    return {
      account,
      accountId,
      name: clean(account.account?.name),
      type: clean(account.account?.accountType),
      institution: clean(account.account?.institution),
      last4: clean(account.account?.last4),
      currency: clean(account.account?.currency || "USD"),
      bookBalance,
      minimumCash,
      availableCash: money(
        account.control?.allowNegative
          ? bookBalance
          : Math.max(0, bookBalance - minimumCash),
      ),
    };
  });
  const totalCash = money(
      accountRows.reduce((sum, item) => sum + item.bookBalance, 0),
    ),
    availableCash = money(
      accountRows.reduce((sum, item) => sum + item.availableCash, 0),
    ),
    invoices = records.filter(
      (item) => doc(item)?.documentType === "invoice" && valid(item),
    ),
    bills = records.filter(
      (item) =>
        ["bill", "supplier-invoice"].includes(doc(item)?.documentType) &&
        valid(item) &&
        ["billed", "incurred", "partially-paid"].includes(
          clean(doc(item)?.financialState),
        ),
    ),
    customIn = arr(expectedInflows),
    customOut = [
      ...canonicalScheduledOutflows(records),
      ...arr(scheduledOutflows),
    ];
  function forecast(days) {
    let incoming = 0,
      outgoing = 0;
    invoices.forEach((item) => {
      if (withinDays(date(item), days, asOf))
        incoming += sourceBalance(item, records);
    });
    bills.forEach((item) => {
      if (withinDays(date(item), days, asOf))
        outgoing += sourceBalance(item, records);
    });
    customIn.forEach((item) => {
      if (withinDays(item.date, days, asOf)) incoming += num(item.amount);
    });
    customOut.forEach((item) => {
      if (withinDays(item.date, days, asOf)) outgoing += num(item.amount);
    });
    return {
      days,
      incoming: money(incoming),
      outgoing: money(outgoing),
      net: money(incoming - outgoing),
      endingCash: money(totalCash + incoming - outgoing),
    };
  }
  const forecasts = [7, 30, 60, 90].map(forecast);
  return {
    accounts: accountRows,
    totalCash,
    availableCash,
    expectedIn7: forecasts[0].incoming,
    scheduledOut7: forecasts[0].outgoing,
    forecasts,
  };
}
export default { buildIXITreasuryProjection };
