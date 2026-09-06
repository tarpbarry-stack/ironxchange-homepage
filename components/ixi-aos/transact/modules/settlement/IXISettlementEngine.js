const clean = (v) => String(v ?? "").trim();
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const money = (v) => Math.round(num(v) * 100) / 100;
const arr = (v) => (Array.isArray(v) ? v : []);
const document = (record = {}) => {
  const envelope = record?.record || record;
  const source = envelope?.financialDocument || envelope?.document?.financialDocument || envelope?.document || envelope;
  return { ...source, metadata: { ...(envelope?.metadata || {}), ...(source?.metadata || {}) } };
};
function amount(r = {}) {
  const source = document(r);
  return money(
    source?.totals?.total ??
      source?.totals?.subtotal ??
      source.amount ??
      source.financial?.amount ??
      source.bill?.amount ??
      source.expense?.amount ??
      source.payment?.amount ??
      source.economics?.amount ??
      0,
  );
}
function type(r = {}) {
  const source = document(r);
  return clean(
    source.documentType || source.type || source.transactModule || source.metadata?.transactModule,
  ).toLowerCase();
}
const metadata = record => document(record)?.metadata || {};
const activeFinancialRecord = record => ![
  "draft",
  "submitted",
  "rejected",
  "void",
  "reversed",
].includes(clean(document(record)?.financialState).toLowerCase());
export function projectIXIAssetSettlement({
  sale = {},
  acquisition = {},
  financialRecords = [],
  manual = {},
} = {}) {
  const records = arr(financialRecords),
    saleFinancialDocumentId = clean(sale?.financialBinding?.financialDocumentId || sale?.identity?.financialInvoiceId || sale?.identity?.saleId),
    canonicalReceipts = records.filter(record => type(record) === "payment" && activeFinancialRecord(record) && clean(document(record)?.paymentDirection).toLowerCase() === "inflow" && clean(document(record)?.sourceFinancialDocumentId) === saleFinancialDocumentId),
    canonicalCredits = records.filter(record => type(record) === "credit" && activeFinancialRecord(record) && clean(document(record)?.sourceFinancialDocumentId) === saleFinancialDocumentId),
    salePrice = money(sale.sale?.salePrice),
    collected = canonicalReceipts.length ? money(canonicalReceipts.reduce((sum, record) => sum + amount(record), 0)) : money(sale.collection?.amountReceived),
    credited = canonicalCredits.length ? money(canonicalCredits.reduce((sum, record) => sum + amount(record), 0)) : money(sale.collection?.creditedAmount),
    acqDirect = money(acquisition.acquisition?.directAcquisitionCost),
    makeReady = money(
      acquisition.makeReady?.actualTotal ||
        acquisition.acquisition?.estimatedMakeReady,
    ),
    postCosts = records
      .filter(
        (r) =>
          [
            "expense",
            "bill",
            "work-order",
            "time-entry",
            "material-usage",
            "technology-work-order",
          ].includes(type(r)) &&
          !metadata(r).acquisitionCost &&
          !document(r).acquisitionCost,
      )
      .reduce((s, r) => s + amount(r), 0),
    assetIncome = records
      .filter(
        (r) =>
          ["rental-income", "service-invoice", "invoice"].includes(type(r)) &&
          metadata(r).assetIncome !== false &&
          !metadata(r).assetSale,
      )
      .reduce((s, r) => s + amount(r), 0),
    sellingCosts = money(
      manual.sellingCosts ??
        records
          .filter(
            (r) =>
              metadata(r).settlementCost ||
              metadata(r).sellingCost ||
              document(r).settlementCost,
          )
          .reduce((s, r) => s + amount(r), 0),
    ),
    liens = money(
      manual.lienPayoffs ??
        arr(manual.liabilities).reduce((s, x) => s + num(x.amount), 0),
    ),
    reimbursements = money(
      arr(manual.reimbursements)
        .filter((x) => x.status !== "paid")
        .reduce((s, x) => s + num(x.amount), 0),
    ),
    priorDistributions = money(
      arr(manual.priorDistributions).reduce((s, x) => s + num(x.amount), 0),
    ),
    grossInvested = money(acqDirect + makeReady + postCosts),
    netEconomicInvestment = money(grossInvested - assetIncome),
    netSaleValue = money(salePrice - sellingCosts),
    economicProfit = money(netSaleValue - netEconomicInvestment),
    cashAvailableBeforeOwners = money(
      Math.max(0, collected - sellingCosts - liens),
    ),
    buyerBalance = money(Math.max(0, salePrice - collected - credited));
  return {
    salePrice,
    collected,
    credited,
    buyerBalance,
    acquisitionCost: acqDirect,
    makeReadyCost: makeReady,
    postAcquisitionCosts: money(postCosts),
    assetIncome: money(assetIncome),
    grossInvestedCost: grossInvested,
    netEconomicInvestment,
    sellingCosts,
    lienPayoffs: liens,
    outstandingReimbursements: reimbursements,
    priorDistributions,
    netSaleValue,
    economicProfit,
    cashAvailableBeforeOwners,
  };
}
function capitalDelta(e = {}) {
  if (Number.isFinite(Number(e.capitalDelta))) return num(e.capitalDelta);
  const t = clean(e.type).toLowerCase();
  if (
    ["capital-contribution", "additional-capital", "capital-added"].includes(t)
  )
    return num(e.amount);
  if (["capital-return", "capital-withdrawal"].includes(t))
    return -num(e.amount);
  return 0;
}
export function calculateIXISettlementWaterfall({
  owners = [],
  projection = {},
  capitalEvents = [],
  reimbursements = [],
  priorDistributions = [],
  returnCapitalFirst = true,
} = {}) {
  const normalized = arr(owners).map((o, i) => ({
    ownerId: clean(o.ownerId) || `OWNER-${i + 1}`,
    partyPassportId: clean(o.partyPassportId),
    partyId: clean(o.partyId),
    label: clean(o.partyLabel || o.label),
    settlementSharePercent: num(
      o.settlementSharePercent ?? o.legalOwnershipPercent,
    ),
    legalOwnershipPercent: num(o.legalOwnershipPercent),
    openingCapital: money(o.initialContribution),
  }));
  const capitalBy = new Map(
    normalized.map((o) => [o.ownerId, o.openingCapital]),
  );
  for (const e of arr(capitalEvents)) {
    const id = clean(e.ownerId),
      delta = capitalDelta(e);
    if (!id || !delta) continue;
    capitalBy.set(id, money(num(capitalBy.get(id)) + delta));
  }
  const reimbBy = new Map(),
    priorBy = new Map();
  for (const x of arr(reimbursements))
    if (x.status !== "paid")
      reimbBy.set(
        clean(x.ownerId),
        money(num(reimbBy.get(clean(x.ownerId))) + num(x.amount)),
      );
  for (const x of arr(priorDistributions))
    priorBy.set(
      clean(x.ownerId),
      money(num(priorBy.get(clean(x.ownerId))) + num(x.amount)),
    );
  const shareTotal = normalized.reduce(
      (s, o) => s + o.settlementSharePercent,
      0,
    ),
    capitalTotal = normalized.reduce(
      (s, o) => s + Math.max(0, num(capitalBy.get(o.ownerId))),
      0,
    ),
    reimbTotal = Array.from(reimbBy.values()).reduce((s, x) => s + x, 0),
    available = money(projection.cashAvailableBeforeOwners),
    afterReimb = money(Math.max(0, available - reimbTotal)),
    capitalPool = returnCapitalFirst
      ? money(Math.min(afterReimb, capitalTotal))
      : 0,
    residual = money(Math.max(0, afterReimb - capitalPool));
  const rows = normalized.map((o) => {
      const capitalOutstanding = Math.max(0, num(capitalBy.get(o.ownerId))),
        capitalReturn = capitalTotal
          ? money(capitalPool * (capitalOutstanding / capitalTotal))
          : 0,
        profitShare = shareTotal
          ? money(residual * (o.settlementSharePercent / shareTotal))
          : 0,
        reimbursement = money(reimbBy.get(o.ownerId)),
        prior = money(priorBy.get(o.ownerId)),
        grossEntitlement = money(reimbursement + capitalReturn + profitShare),
        finalDue = money(Math.max(0, grossEntitlement - prior));
      return {
        ...o,
        capitalOutstanding,
        reimbursement,
        capitalReturn,
        profitShare,
        priorDistributions: prior,
        grossEntitlement,
        finalDue,
        paid: 0,
        balanceDue: finalDue,
      };
    }),
    totalFinalDue = money(rows.reduce((s, x) => s + x.finalDue, 0)),
    unallocatedCash = money(Math.max(0, available - totalFinalDue));
  return {
    shareTotal: money(shareTotal),
    capitalTotal: money(capitalTotal),
    reimbursementTotal: money(reimbTotal),
    availableCash: available,
    capitalReturnPool: capitalPool,
    residualProfitPool: residual,
    owners: rows,
    totalFinalDue,
    unallocatedCash,
    balanced: Math.abs(totalFinalDue + unallocatedCash - available) < 0.01,
  };
}
export function getIXISettlementBlockers({
  sale = {},
  projection = {},
  waterfall = {},
  liabilities = [],
} = {}) {
  const blockers = [];
  if ((!sale?.identity?.saleId && !sale?.identity?.number) || clean(sale?.status).toLowerCase() !== "sold")
    blockers.push("COMPLETED SOLD CLOSEOUT REQUIRED");
  if (num(projection.buyerBalance) > 0.005)
    blockers.push("BUYER BALANCE OUTSTANDING");
  if (arr(liabilities).some((x) => x.status !== "paid" && num(x.amount) > 0))
    blockers.push("LIEN / PAYOFF OPEN");
  if (Math.abs(num(waterfall.shareTotal) - 100) > 0.01)
    blockers.push("SETTLEMENT SHARES MUST TOTAL 100%");
  if (!waterfall.balanced) blockers.push("SETTLEMENT OUT OF BALANCE");
  return blockers;
}
export default {
  projectIXIAssetSettlement,
  calculateIXISettlementWaterfall,
  getIXISettlementBlockers,
};
