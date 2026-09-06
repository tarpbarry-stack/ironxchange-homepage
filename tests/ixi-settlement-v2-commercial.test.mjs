import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateIXICommissionRows,
  calculateIXISettlementWaterfall,
  projectIXIAssetSettlement,
} from "../components/ixi-aos/transact/modules/settlement/IXISettlementEngine.js";
import {
  createIXIAssetAcquisitionDraft,
  hydrateIXIAssetAcquisitionRecord,
} from "../components/ixi-aos/transact/modules/asset-acquisition/IXIAssetAcquisitionContract.js";
import { addIXIOwnershipCapitalEvent } from "../components/ixi-aos/transact/modules/asset-acquisition/IXIAssetAcquisitionRecordEngine.js";
import { createIXIGLChart } from "../components/ixi-aos/transact/modules/general-ledger/IXIGeneralLedgerContract.js";
import { classifyIXIFinancialDocument } from "../components/ixi-aos/transact/modules/general-ledger/IXIGLPostingEngine.js";
import { readFile } from "node:fs/promises";

const context = {
  primary: { passportId: "pass_asset", objectId: "asset_1", label: "544K II" },
  entity: { passportId: "pass_entity", label: "IXI" },
  actor: { passportId: "pass_actor", label: "Operator" },
};
const sale = {
  identity: { saleId: "ifd_invoice", number: "INV-1", dealId: "deal_1" },
  context: { assetPassportId: "pass_asset" },
  sale: { salePrice: 100000 },
  status: "sold",
  financialBinding: { financialDocumentId: "ifd_invoice" },
};
const acquisition = {
  identity: { acquisitionId: "ifd_acq" },
  acquisition: { currentAcquisitionBasis: 70000 },
  makeReady: { actualTotal: 5000 },
  ownership: {
    owners: [
      {
        ownerId: "a",
        partyLabel: "A",
        legalOwnershipPercent: 50,
        settlementSharePercent: 50,
        profitSharePercent: 70,
        lossSharePercent: 20,
        initialContribution: 40000,
      },
      {
        ownerId: "b",
        partyLabel: "B",
        legalOwnershipPercent: 50,
        settlementSharePercent: 50,
        profitSharePercent: 30,
        lossSharePercent: 80,
        initialContribution: 35000,
      },
    ],
  },
};
const records = [
  {
    financialDocument: {
      financialDocumentId: "pay",
      documentType: "payment",
      financialState: "paid",
      paymentDirection: "inflow",
      sourceFinancialDocumentId: "ifd_invoice",
      totals: { total: 100000 },
    },
  },
  {
    financialDocument: {
      financialDocumentId: "draft-cost",
      documentType: "expense",
      financialState: "draft",
      totals: { total: 9999 },
      references: [{ passportId: "pass_asset", role: "asset" }],
    },
  },
  {
    financialDocument: {
      financialDocumentId: "cost",
      documentType: "expense",
      financialState: "incurred",
      totals: { total: 5000 },
      references: [{ passportId: "pass_asset", role: "asset" }],
    },
  },
];

test("repeatable commissions support mixed machine-specific calculation methods", () => {
  const rows = calculateIXICommissionRows(
    [
      {
        recipientLabel: "Seller",
        calculationMethod: "sale-price",
        ratePercent: 2,
      },
      {
        recipientLabel: "Broker",
        calculationMethod: "fixed",
        fixedAmount: 750,
      },
      {
        recipientLabel: "Bounty",
        calculationMethod: "above-target",
        targetAmount: 90000,
        ratePercent: 10,
      },
    ],
    { salePrice: 100000, grossProfit: 20000 },
  );
  assert.deepEqual(
    rows.map((x) => x.finalAmount),
    [2000, 750, 1000],
  );
});
test("inactive expenses remain visible but excluded from Settlement economics", () => {
  const projection = projectIXIAssetSettlement({
    sale,
    acquisition,
    financialRecords: records,
  });
  assert.equal(projection.expenseLedger.length, 2);
  assert.equal(
    projection.expenseLedger.find((x) => x.financialDocumentId === "draft-cost")
      .included,
    false,
  );
  assert.equal(projection.postAcquisitionCosts, 5000);
});
test("losses reduce capital by loss share and expose unfunded shortfall", () => {
  const projection = {
    cashAvailableBeforeOwners: 30000,
    economicProfit: -50000,
  };
  const result = calculateIXISettlementWaterfall({
    owners: acquisition.ownership.owners,
    projection,
  });
  assert.equal(result.owners[0].allocatedLoss, 10000);
  assert.equal(result.owners[1].allocatedLoss, 40000);
  assert.equal(result.totalLossShortfall, 5000);
  assert.equal(result.capitalCallRequired, false);
  assert.equal(result.balanced, true);
});
test("ownership events maintain independent legal settlement profit and loss shares", () => {
  const base = {
    ownership: {
      owners: [
        {
          ownerId: "a",
          partyLabel: "A",
          legalOwnershipPercent: 100,
          settlementSharePercent: 100,
          profitSharePercent: 100,
          lossSharePercent: 100,
          initialContribution: 1,
        },
      ],
      events: [],
    },
  };
  const next = addIXIOwnershipCapitalEvent(base, {
    partyLabel: "B",
    counterpartyLabel: "A",
    ownershipPercentChange: 25,
    settlementSharePercentChange: 20,
    profitSharePercentChange: 10,
    lossSharePercentChange: 30,
    effectiveDate: "2026-09-06",
    reference: "TRANSFER",
  });
  assert.deepEqual(
    [
      next.ownership.legalOwnershipTotal,
      next.ownership.settlementShareTotal,
      next.ownership.profitShareTotal,
      next.ownership.lossShareTotal,
    ],
    [100, 100, 100, 100],
  );
});
test("Acquisition v3 preserves funding provenance and active-only paid totals", () => {
  const draft = createIXIAssetAcquisitionDraft({
    context,
    input: {
      sellerLabel: "Seller",
      purchaseDate: "2026-09-06",
      purchasePrice: 100,
      owners: [
        {
          partyLabel: "IXI",
          legalOwnershipPercent: 100,
          settlementSharePercent: 100,
          profitSharePercent: 100,
          lossSharePercent: 100,
        },
      ],
      payments: [
        {
          date: "2026-09-06",
          amount: 100,
          payerLabel: "IXI",
          payerPassportId: "payer",
          payeeLabel: "Seller",
          payeePassportId: "seller",
          cashAccountLabel: "Operating",
          status: "paid",
        },
        {
          date: "2026-09-06",
          amount: 50,
          payerLabel: "IXI",
          status: "reversed",
        },
      ],
    },
  });
  const hydrated = hydrateIXIAssetAcquisitionRecord(draft);
  assert.equal(hydrated.funding.amountPaid, 100);
  assert.equal(hydrated.funding.payments[0].cashAccountLabel, "Operating");
  assert.equal(hydrated.ownership.profitShareTotal, 100);
});

test("unapplied customer deposits post to cash and deposit liability", () => {
  const chart = createIXIGLChart({ entityPassportId: "pass_entity" });
  const result = classifyIXIFinancialDocument({
    chart,
    record: {
      financialDocumentId: "deposit-1",
      documentType: "payment",
      financialState: "paid",
      paymentDirection: "inflow",
      occurredAt: "2026-09-06",
      totals: { total: 82000 },
      metadata: { customerDeposit: true },
    },
  });
  assert.equal(result.status, "ready");
  assert.equal(result.ruleId, "unapplied-customer-deposit");
  assert.deepEqual(
    result.journal.lines.map((line) => [
      line.accountCode,
      line.debit,
      line.credit,
    ]),
    [
      ["1010", 82000, 0],
      ["2300", 0, 82000],
    ],
  );
});

test("deposit application relieves the liability and customer receivable", () => {
  const chart = createIXIGLChart({ entityPassportId: "pass_entity" });
  const result = classifyIXIFinancialDocument({
    chart,
    record: {
      financialDocumentId: "apply-1",
      documentType: "credit",
      financialState: "approved",
      occurredAt: "2026-09-06",
      sourceFinancialDocumentId: "ifd_invoice",
      totals: { total: 82000 },
      metadata: {
        customerDepositApplication: true,
        customerDepositFinancialDocumentId: "deposit-1",
      },
    },
  });
  assert.equal(result.status, "ready");
  assert.equal(result.ruleId, "customer-deposit-application");
  assert.deepEqual(
    result.journal.lines.map((line) => [
      line.accountCode,
      line.debit,
      line.credit,
    ]),
    [
      ["2300", 82000, 0],
      ["1100", 0, 82000],
    ],
  );
});

test("customer deposits support partial allocation while retaining the canonical balance", async () => {
  const commands = await readFile(
    new URL(
      "../components/ixi-aos/transact/modules/collections/IXICollectionsCommands.js",
      import.meta.url,
    ),
    "utf8",
  );
  const app = await readFile(
    new URL(
      "../components/ixi-aos/transact/modules/collections/IXICollectionsApp.jsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(commands, /remainingUnapplied/);
  assert.match(commands, /"partially-applied"/);
  assert.match(app, /Math\.min\(/);
});
