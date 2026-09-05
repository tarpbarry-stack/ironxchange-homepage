import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  calculateIXIMachinePricing,
  createIXIMachinePricingFile,
  restoreIXIMachinePricingRevision,
  saveIXIMachinePricingRevision
} from "../components/ixi-machine-pricing/IXIMachinePricingEngine.js";

const read = path => fs.readFileSync(path, "utf8");

function comp(id, year, hours, price, extra = {}) {
  return {
    id,
    source: "Sandhills",
    year,
    make: "Deere",
    model: "544K II",
    hours,
    price,
    url: `https://example.com/${id}`,
    capturedAt: "2026-09-05",
    included: true,
    ...extra
  };
}

test("F$3 separates active asks, sold evidence, cost basis, and selling costs", () => {
  const file = createIXIMachinePricingFile({
    subject: { year: 2020, make: "Deere", model: "544K II", hours: 5000, soldWindowMonths: 6 }
  });
  file.activeComparables = [
    comp("older", 2019, 4000, 50000),
    comp("same", 2020, 5000, 60000),
    comp("newer", 2021, 6000, 70000)
  ];
  file.soldComparables = [
    comp("sold-current", 2020, 5200, 58000, { source: "Ritchie Bros.", saleDate: "2026-07-01" }),
    comp("sold-stale", 2020, 4900, 54000, { source: "Ritchie Bros.", saleDate: "2026-01-01" })
  ];
  file.salesCosts = {
    ...file.salesCosts,
    commissionPercent: 5,
    slippagePercent: 10,
    platformFees: 1000
  };
  file.scenarios.find(item => item.id === "market").askingPrice = 62500;

  const result = calculateIXIMachinePricing(file, {
    investedCost: 48300,
    asOf: "2026-09-05T12:00:00.000Z"
  });

  assert.equal(result.active.count, 3);
  assert.equal(result.active.cohorts.find(item => item.yearDelta === 0).bands.find(item => item.id === "like").lowest.id, "same");
  assert.equal(result.sold.count, 1);
  assert.equal(result.selected.expectedClose, 56250);
  assert.equal(result.selected.sellingCosts, 3812.5);
  assert.equal(result.selected.netProceeds, 52437.5);
  assert.equal(result.selected.profit, 4137.5);
  assert.equal(result.breakEvenAsk, 57660.82);
});

test("F$3 revisions preserve evidence and can be restored without rewriting history", () => {
  const file = createIXIMachinePricingFile({ subject: { year: 2020, hours: 5000 } });
  file.activeComparables = [comp("one", 2020, 5000, 60000)];
  const projection = calculateIXIMachinePricing(file, { investedCost: 48000 });
  const saved = saveIXIMachinePricingRevision(file, projection, { label: "Pricing Manager" }, "2026-09-05T12:00:00.000Z");
  const changed = { ...saved, activeComparables: [] };
  const restored = restoreIXIMachinePricingRevision(changed, 1);

  assert.equal(saved.revision, 1);
  assert.equal(saved.history[0].savedBy, "Pricing Manager");
  assert.equal(restored.activeComparables.length, 1);
  assert.equal(restored.status, "draft");
  assert.equal(restored.history.length, 1);
});

test("F$3 is a durable peer workspace with face and pricing-file depth", () => {
  const face = read("components/ixi-machine-pricing/IXIMachinePricing.jsx");
  const engine = read("components/ixi-machine-pricing/IXIMachinePricingEngine.js");
  const consoleRuntime = read("components/ixi-aos/transact/IXITransactObjectConsole.jsx");
  const directory = read("components/ixi-machine-console/IXIMachineWorkspaceDirectory.jsx");

  assert.match(directory, /PRICING:\s*"machine-pricing"/);
  assert.match(directory, /label:\s*"F\$3"/);
  assert.match(consoleRuntime, /PRICING\]:\s*6/);
  assert.match(consoleRuntime, /machinePricingFile/);
  assert.match(consoleRuntime, /onIxiStateChange\(stateObjectId/);
  assert.match(face, /IXI MACHINE · F\$3/);
  assert.match(face, /ACTIVE MARKET/);
  assert.match(face, /SOLD RESULTS/);
  assert.match(face, /SALES COSTS/);
  assert.match(face, /SCENARIOS/);
  assert.match(face, /HISTORY/);
  assert.match(face, />CANCEL</);
  assert.match(face, />SAVE</);
  assert.match(face, /width:298px;height:471px/);
  assert.match(engine, /BREAK|breakEvenAsk/);
  assert.match(engine, /history: \[snapshot/);
  assert.doesNotMatch(face, /PUBLISH PRICE/);
});
