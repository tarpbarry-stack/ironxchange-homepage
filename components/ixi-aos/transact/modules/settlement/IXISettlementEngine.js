const clean = (value) => String(value ?? "").trim();
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const money = (value) => Math.round(num(value) * 100) / 100;
const arr = (value) => (Array.isArray(value) ? value : []);
const INACTIVE = new Set([
  "draft",
  "submitted",
  "rejected",
  "void",
  "reversed",
  "cancelled",
]);
const COST_TYPES = new Set([
  "expense",
  "bill",
  "supplier-invoice",
  "work-order",
  "time-entry",
  "material-usage",
  "technology-work-order",
  "freight",
  "rental-expense",
]);
const INCOME_TYPES = new Set(["rental-income", "service-invoice", "invoice"]);

export function financialDocumentOf(record = {}) {
  const envelope = record?.record || record;
  const source =
    envelope?.financialDocument ||
    envelope?.document?.financialDocument ||
    envelope?.document ||
    envelope;
  return {
    ...source,
    metadata: { ...(envelope?.metadata || {}), ...(source?.metadata || {}) },
  };
}

export function financialAmount(record = {}) {
  const source = financialDocumentOf(record);
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

export function financialType(record = {}) {
  const source = financialDocumentOf(record);
  return clean(
    source.documentType ||
      source.type ||
      source.transactModule ||
      source.metadata?.transactModule,
  ).toLowerCase();
}

export function isActiveSettlementRecord(record = {}) {
  return !INACTIVE.has(
    clean(financialDocumentOf(record)?.financialState).toLowerCase(),
  );
}

export function buildIXISettlementExpenseLedger(financialRecords = []) {
  return arr(financialRecords)
    .map((record, index) => {
      const source = financialDocumentOf(record);
      const type = financialType(source);
      const state = clean(source.financialState).toLowerCase();
      const isSeparateSellingCost = Boolean(
        source.metadata?.settlementCost ||
        source.metadata?.sellingCost ||
        source.settlementCost ||
        source.metadata?.commission,
      );
      const cost =
        COST_TYPES.has(type) &&
        !source.metadata?.acquisitionCost &&
        !source.acquisitionCost &&
        !isSeparateSellingCost;
      const income =
        INCOME_TYPES.has(type) &&
        source.metadata?.assetIncome !== false &&
        !source.metadata?.assetSale;
      if (!cost && !income) return null;
      const included = isActiveSettlementRecord(source);
      const counterparty = arr(source.references).find((ref) =>
        ["vendor", "payee", "customer"].includes(
          clean(ref?.role).toLowerCase(),
        ),
      );
      return {
        ledgerItemId:
          clean(source.financialDocumentId) ||
          `${type}-${clean(source.documentNumber) || index + 1}`,
        financialDocumentId: clean(source.financialDocumentId),
        type,
        date: clean(
          source.occurredAt ||
            source.invoiceDate ||
            source.date ||
            source.audit?.createdAt,
        ).slice(0, 10),
        label: clean(
          source.description ||
            source.memo ||
            source.billRecord?.bill?.description ||
            source.expense?.description ||
            source.documentNumber ||
            source.financialDocumentId ||
            "FINANCIAL RECORD",
        ),
        counterpartyLabel: clean(
          source.vendorName ||
            source.customerName ||
            source.billRecord?.vendor?.label ||
            counterparty?.label,
        ),
        amount: financialAmount(source),
        direction: income ? "income" : "cost",
        state: state || "unknown",
        included,
        exclusionReason: included
          ? ""
          : `STATE ${state || "UNKNOWN"} IS NOT ECONOMIC`,
        paidByLabel: clean(source.metadata?.paidByLabel || source.payerLabel),
        paymentStatus: clean(
          source.metadata?.paymentStatus || source.paymentStatus,
        ),
        source: "canonical",
      };
    })
    .filter(Boolean);
}

export function calculateIXICommissionRows(rows = [], basis = {}) {
  const salePrice = money(basis.salePrice);
  const grossProfit = money(basis.grossProfit);
  const netProfit = money(basis.netProfit ?? grossProfit);
  return arr(rows).map((row, index) => {
    const method = clean(
      row.calculationMethod || row.basis || "fixed",
    ).toLowerCase();
    const targetAmount = money(row.targetAmount);
    const basisAmount =
      method === "sale-price"
        ? salePrice
        : method === "gross-profit"
          ? grossProfit
          : method === "net-profit"
            ? netProfit
            : method === "above-target"
              ? money(Math.max(0, salePrice - targetAmount))
              : 0;
    const calculatedAmount = ["fixed", "manual"].includes(method)
      ? money(row.fixedAmount ?? row.amount)
      : money((basisAmount * num(row.ratePercent)) / 100);
    const finalAmount =
      row.finalApprovedAmount !== "" && row.finalApprovedAmount != null
        ? money(row.finalApprovedAmount)
        : money(Math.max(0, calculatedAmount + num(row.adjustmentAmount)));
    return {
      ...row,
      commissionId: clean(row.commissionId) || `COM-${index + 1}`,
      recipientLabel: clean(row.recipientLabel),
      recipientPassportId: clean(row.recipientPassportId),
      commissionType: clean(row.commissionType || "salesperson"),
      calculationMethod: method,
      basisAmount,
      ratePercent: num(row.ratePercent),
      fixedAmount: money(row.fixedAmount ?? row.amount),
      targetAmount,
      calculatedAmount,
      adjustmentAmount: money(row.adjustmentAmount),
      finalAmount,
      payerEntityLabel: clean(row.payerEntityLabel),
      payerEntityPassportId: clean(row.payerEntityPassportId),
      economicTreatment: clean(
        row.economicTreatment || "machine-selling-expense",
      ),
      status: clean(row.status || "projected"),
      dueDate: clean(row.dueDate),
      reference: clean(row.reference),
      conditions: clean(row.conditions),
      notes: clean(row.notes),
      included:
        row.included !== false &&
        !["void", "reversed", "cancelled"].includes(
          clean(row.status).toLowerCase(),
        ),
    };
  });
}

const manualTotal = (rows) =>
  money(
    arr(rows)
      .filter(
        (row) =>
          row?.included !== false &&
          !["void", "reversed", "cancelled"].includes(
            clean(row?.status).toLowerCase(),
          ),
      )
      .reduce((sum, row) => sum + num(row.finalAmount ?? row.amount), 0),
  );

export function projectIXIAssetSettlement({
  sale = {},
  acquisition = {},
  financialRecords = [],
  manual = {},
} = {}) {
  const records = arr(financialRecords);
  const invoiceId = clean(
    sale?.financialBinding?.financialDocumentId ||
      sale?.identity?.financialInvoiceId ||
      sale?.identity?.saleId,
  );
  const receipts = records.filter(
    (record) =>
      financialType(record) === "payment" &&
      isActiveSettlementRecord(record) &&
      clean(financialDocumentOf(record)?.paymentDirection).toLowerCase() ===
        "inflow" &&
      clean(financialDocumentOf(record)?.sourceFinancialDocumentId) ===
        invoiceId,
  );
  const credits = records.filter(
    (record) =>
      financialType(record) === "credit" &&
      isActiveSettlementRecord(record) &&
      clean(financialDocumentOf(record)?.sourceFinancialDocumentId) ===
        invoiceId,
  );
  const salePrice = money(sale.sale?.salePrice ?? sale.totals?.total);
  const collected = money(
    receipts.reduce((sum, record) => sum + financialAmount(record), 0),
  );
  const credited = money(
    credits.reduce((sum, record) => sum + financialAmount(record), 0),
  );
  const acquisitionCost = money(
    acquisition.acquisition?.currentAcquisitionBasis ??
      acquisition.acquisition?.directAcquisitionCost,
  );
  const makeReadyCost = money(
    acquisition.makeReady?.actualTotal ??
      acquisition.acquisition?.estimatedMakeReady,
  );
  const expenseLedger = buildIXISettlementExpenseLedger(records);
  const canonicalCosts = money(
    expenseLedger
      .filter((item) => item.direction === "cost" && item.included)
      .reduce((sum, item) => sum + item.amount, 0),
  );
  const assetIncome = money(
    expenseLedger
      .filter((item) => item.direction === "income" && item.included)
      .reduce((sum, item) => sum + item.amount, 0),
  );
  const expenseAdjustments = arr(manual.expenseAdjustments).map(
    (item, index) => ({
      ...item,
      adjustmentId: clean(item.adjustmentId) || `EXP-ADJ-${index + 1}`,
      label: clean(item.label || "SETTLEMENT EXPENSE ADJUSTMENT"),
      amount: money(item.amount),
      included: item.included !== false,
      source: "manual-adjustment",
    }),
  );
  const postAcquisitionCosts = money(
    canonicalCosts + manualTotal(expenseAdjustments),
  );
  const grossInvestedCost = money(
    acquisitionCost + makeReadyCost + postAcquisitionCosts,
  );
  const netEconomicInvestment = money(grossInvestedCost - assetIncome);
  const canonicalSellingCosts = money(
    records
      .filter(
        (record) =>
          isActiveSettlementRecord(record) &&
          (financialDocumentOf(record)?.metadata?.settlementCost ||
            financialDocumentOf(record)?.metadata?.sellingCost ||
            financialDocumentOf(record)?.settlementCost),
      )
      .reduce((sum, record) => sum + financialAmount(record), 0),
  );
  const sellingCosts = money(
    manual.sellingCosts === "" || manual.sellingCosts == null
      ? canonicalSellingCosts
      : manual.sellingCosts,
  );
  const profitBeforeCommission = money(
    salePrice - sellingCosts - netEconomicInvestment,
  );
  const salesOrder = records
    .map(financialDocumentOf)
    .find(
      (document) =>
        financialType(document) === "sales-order" &&
        (!sale?.identity?.dealId ||
          clean(
            document?.salesOrder?.identity?.dealId ||
              document?.metadata?.dealId,
          ) === clean(sale.identity.dealId)),
    );
  const canonicalCommissions = arr(
    salesOrder?.salesOrder?.compensation?.commissions ||
      salesOrder?.compensation?.commissions,
  );
  const commissionSource = arr(manual.commissions).length
    ? manual.commissions
    : canonicalCommissions;
  const commissions = calculateIXICommissionRows(commissionSource, {
    salePrice,
    grossProfit: profitBeforeCommission,
    netProfit: profitBeforeCommission,
  });
  const commissionTotal = money(
    commissions
      .filter(
        (item) =>
          item.included && item.economicTreatment !== "company-overhead",
      )
      .reduce((sum, item) => sum + item.finalAmount, 0),
  );
  const companyCommissionTotal = money(
    commissions
      .filter(
        (item) =>
          item.included && item.economicTreatment === "company-overhead",
      )
      .reduce((sum, item) => sum + item.finalAmount, 0),
  );
  const lienPayoffs = manualTotal(manual.liabilities);
  const thirdPartyDisbursements = manualTotal(manual.disbursements);
  const outstandingReimbursements = money(
    arr(manual.reimbursements)
      .filter((item) => item.status !== "paid" && item.included !== false)
      .reduce((sum, item) => sum + num(item.amount), 0),
  );
  const priorDistributions = manualTotal(manual.priorDistributions);
  const netSaleValue = money(salePrice - sellingCosts - commissionTotal);
  const economicProfit = money(netSaleValue - netEconomicInvestment);
  const cashAvailableBeforeOwners = money(
    Math.max(
      0,
      collected -
        sellingCosts -
        commissionTotal -
        lienPayoffs -
        thirdPartyDisbursements -
        priorDistributions,
    ),
  );
  return {
    salePrice,
    collected,
    credited,
    buyerBalance: money(Math.max(0, salePrice - collected - credited)),
    acquisitionCost,
    makeReadyCost,
    postAcquisitionCosts,
    assetIncome,
    grossInvestedCost,
    netEconomicInvestment,
    sellingCosts,
    commissionTotal,
    companyCommissionTotal,
    lienPayoffs,
    thirdPartyDisbursements,
    outstandingReimbursements,
    priorDistributions,
    netSaleValue,
    profitBeforeCommission,
    economicProfit,
    cashAvailableBeforeOwners,
    expenseLedger,
    expenseAdjustments,
    commissions,
  };
}

function capitalDelta(event = {}) {
  if (Number.isFinite(Number(event.capitalDelta)))
    return num(event.capitalDelta);
  const type = clean(event.type).toLowerCase();
  if (
    ["capital-contribution", "additional-capital", "capital-added"].includes(
      type,
    )
  )
    return num(event.amount);
  if (["capital-return", "capital-withdrawal", "distribution"].includes(type))
    return -num(event.amount);
  return 0;
}

export function calculateIXISettlementWaterfall({
  owners = [],
  projection = {},
  capitalEvents = [],
  reimbursements = [],
  priorDistributions = [],
  returnCapitalFirst = true,
  retainedProceeds = 0,
} = {}) {
  const normalized = arr(owners).map((owner, index) => ({
    ownerId: clean(owner.ownerId) || `OWNER-${index + 1}`,
    partyPassportId: clean(owner.partyPassportId),
    partyId: clean(owner.partyId),
    label: clean(owner.partyLabel || owner.label),
    settlementSharePercent: num(
      owner.settlementSharePercent ?? owner.legalOwnershipPercent,
    ),
    profitSharePercent: num(
      owner.profitSharePercent ??
        owner.settlementSharePercent ??
        owner.legalOwnershipPercent,
    ),
    lossSharePercent: num(
      owner.lossSharePercent ??
        owner.settlementSharePercent ??
        owner.legalOwnershipPercent,
    ),
    legalOwnershipPercent: num(owner.legalOwnershipPercent),
    openingCapital: money(owner.initialContribution),
  }));
  const capitalBy = new Map(
    normalized.map((owner) => [owner.ownerId, owner.openingCapital]),
  );
  for (const event of arr(capitalEvents)) {
    const ownerId = clean(
      event.ownerId ||
        normalized.find(
          (owner) => owner.partyId && owner.partyId === clean(event.partyId),
        )?.ownerId ||
        normalized.find((owner) => owner.label === clean(event.partyLabel))
          ?.ownerId,
    );
    const delta = capitalDelta(event);
    if (ownerId && delta)
      capitalBy.set(ownerId, money(num(capitalBy.get(ownerId)) + delta));
  }
  const reimbursementsByOwner = new Map(),
    priorByOwner = new Map();
  for (const item of arr(reimbursements))
    if (item.status !== "paid" && item.included !== false)
      reimbursementsByOwner.set(
        clean(item.ownerId),
        money(
          num(reimbursementsByOwner.get(clean(item.ownerId))) +
            num(item.amount),
        ),
      );
  for (const item of arr(priorDistributions))
    if (item.included !== false)
      priorByOwner.set(
        clean(item.ownerId),
        money(num(priorByOwner.get(clean(item.ownerId))) + num(item.amount)),
      );
  const shareTotal = normalized.reduce(
    (sum, owner) => sum + owner.settlementSharePercent,
    0,
  );
  const profitShareTotal = normalized.reduce(
    (sum, owner) => sum + owner.profitSharePercent,
    0,
  );
  const lossShareTotal = normalized.reduce(
    (sum, owner) => sum + owner.lossSharePercent,
    0,
  );
  const capitalTotal = normalized.reduce(
    (sum, owner) => sum + Math.max(0, num(capitalBy.get(owner.ownerId))),
    0,
  );
  const reimbursementTotal = Array.from(reimbursementsByOwner.values()).reduce(
    (sum, amount) => sum + amount,
    0,
  );
  const retained = money(Math.max(0, retainedProceeds));
  const availableCash = money(
    Math.max(0, num(projection.cashAvailableBeforeOwners) - retained),
  );
  const afterReimbursements = money(
    Math.max(0, availableCash - reimbursementTotal),
  );
  const economicLoss = money(Math.max(0, -num(projection.economicProfit)));
  const capitalAfterLossTotal = money(
    normalized.reduce(
      (sum, owner) =>
        sum +
        Math.max(
          0,
          num(capitalBy.get(owner.ownerId)) -
            (lossShareTotal
              ? (economicLoss * owner.lossSharePercent) / lossShareTotal
              : 0),
        ),
      0,
    ),
  );
  const capitalReturnPool = returnCapitalFirst
    ? money(
        Math.min(
          afterReimbursements,
          economicLoss > 0 ? capitalAfterLossTotal : capitalTotal,
        ),
      )
    : 0;
  const residualProfitPool = money(
    Math.max(0, afterReimbursements - capitalReturnPool),
  );
  const rows = normalized.map((owner) => {
    const capitalOutstanding = Math.max(0, num(capitalBy.get(owner.ownerId)));
    const allocatedLoss = lossShareTotal
      ? money((economicLoss * owner.lossSharePercent) / lossShareTotal)
      : 0;
    const capitalAfterLoss = money(
      Math.max(0, capitalOutstanding - allocatedLoss),
    );
    const capitalBasis =
      economicLoss > 0 ? capitalAfterLossTotal : capitalTotal;
    const capitalWeight =
      economicLoss > 0 ? capitalAfterLoss : capitalOutstanding;
    const capitalReturn = capitalBasis
      ? money((capitalReturnPool * capitalWeight) / capitalBasis)
      : 0;
    const profitShare = profitShareTotal
      ? money(
          (residualProfitPool * owner.profitSharePercent) / profitShareTotal,
        )
      : 0;
    const reimbursement = money(reimbursementsByOwner.get(owner.ownerId));
    const prior = money(priorByOwner.get(owner.ownerId));
    const grossEntitlement = money(reimbursement + capitalReturn + profitShare);
    const finalDue = money(Math.max(0, grossEntitlement - prior));
    const lossShortfall = money(
      Math.max(0, allocatedLoss - capitalOutstanding),
    );
    return {
      ...owner,
      capitalOutstanding,
      capitalAfterLoss,
      reimbursement,
      capitalReturn,
      profitShare,
      allocatedLoss,
      lossShortfall,
      priorDistributions: prior,
      grossEntitlement,
      finalDue,
      paid: 0,
      balanceDue: finalDue,
    };
  });
  const totalFinalDue = money(
    rows.reduce((sum, owner) => sum + owner.finalDue, 0),
  );
  const unallocatedCash = money(availableCash - totalFinalDue);
  const totalLossShortfall = money(
    rows.reduce((sum, owner) => sum + owner.lossShortfall, 0),
  );
  return {
    shareTotal: money(shareTotal),
    profitShareTotal: money(profitShareTotal),
    lossShareTotal: money(lossShareTotal),
    capitalTotal: money(capitalTotal),
    capitalAfterLossTotal,
    reimbursementTotal: money(reimbursementTotal),
    availableCash,
    retainedProceeds: retained,
    capitalReturnPool,
    residualProfitPool,
    economicLoss,
    totalLossShortfall,
    capitalCallRequired: false,
    owners: rows,
    totalFinalDue,
    unallocatedCash,
    balanced: Math.abs(totalFinalDue + unallocatedCash - availableCash) < 0.01,
  };
}

export function getIXISettlementBlockers({
  sale = {},
  projection = {},
  waterfall = {},
  liabilities = [],
  commissions = [],
  disbursements = [],
} = {}) {
  const blockers = [];
  if (
    (!sale?.identity?.saleId && !sale?.identity?.number) ||
    clean(sale?.status).toLowerCase() !== "sold"
  )
    blockers.push("COMPLETED SOLD CLOSEOUT REQUIRED");
  if (num(projection.buyerBalance) > 0.005)
    blockers.push("BUYER BALANCE OUTSTANDING");
  if (Math.abs(num(waterfall.shareTotal) - 100) > 0.01)
    blockers.push("SETTLEMENT SHARES MUST TOTAL 100%");
  if (Math.abs(num(waterfall.profitShareTotal ?? 100) - 100) > 0.01)
    blockers.push("PROFIT SHARES MUST TOTAL 100%");
  if (Math.abs(num(waterfall.lossShareTotal ?? 100) - 100) > 0.01)
    blockers.push("LOSS SHARES MUST TOTAL 100%");
  if (!waterfall.balanced) blockers.push("SETTLEMENT OUT OF BALANCE");
  if (
    arr(liabilities).some(
      (item) => num(item.amount) > 0 && !clean(item.payeeLabel || item.label),
    )
  )
    blockers.push("PAYOFF PAYEE REQUIRED");
  if (
    arr(commissions).some(
      (item) =>
        item.included !== false &&
        num(item.finalAmount) > 0 &&
        !clean(item.recipientLabel),
    )
  )
    blockers.push("COMMISSION RECIPIENT REQUIRED");
  if (
    arr(disbursements).some(
      (item) =>
        item.included !== false &&
        num(item.amount) > 0 &&
        !clean(item.payeeLabel),
    )
  )
    blockers.push("DISBURSEMENT PAYEE REQUIRED");
  return blockers;
}

export default {
  projectIXIAssetSettlement,
  calculateIXISettlementWaterfall,
  calculateIXICommissionRows,
  buildIXISettlementExpenseLedger,
  getIXISettlementBlockers,
};
