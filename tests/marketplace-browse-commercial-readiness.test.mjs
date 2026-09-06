import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  matchesMarketplaceRanges,
  sortMarketplaceListings,
  validateMarketplaceRangeFilters
} from "../lib/marketplace/marketplaceBrowseFilters.mjs";
import {
  calculateDealSheet,
  calculateMonthlyPayment,
  sanitizeDealSheetDecimal
} from "../lib/marketplace/dealSheetMath.mjs";

test("NEWEST means newest model year, with unknown years last and stable ties", () => {
  const listings = [
    { id: "cat", year: 2024 },
    { id: "deere", year: 2022 },
    { id: "komatsu", year: 2024 },
    { id: "yanmar", year: "" }
  ];

  assert.deepEqual(
    sortMarketplaceListings(listings, "newest").map(item => item.id),
    ["cat", "komatsu", "deere", "yanmar"]
  );
});

test("commercial range parser accepts dealer-formatted price values", () => {
  const validation = validateMarketplaceRangeFilters({
    priceMin: "$100,000",
    priceMax: "250000"
  }, 2026);

  assert.equal(validation.valid, true);
  assert.equal(validation.values.priceMin, 100000);
  assert.equal(validation.values.priceMax, 250000);
  assert.equal(
    matchesMarketplaceRanges(
      { year: 2024, price: "$148,000", hours: "2,500 Hrs" },
      validation.values
    ),
    true
  );
});

test("invalid and reversed ranges report errors instead of becoming NaN filters", () => {
  const invalid = validateMarketplaceRangeFilters({ priceMin: "abc" }, 2026);
  const reversed = validateMarketplaceRangeFilters({
    hoursMin: "5000",
    hoursMax: "1000"
  }, 2026);

  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.priceMin, "ENTER NUMBERS ONLY");
  assert.equal(reversed.valid, false);
  assert.match(reversed.message, /MINIMUM CANNOT EXCEED MAXIMUM/u);
});

test("Deal Sheet separates purchase total, credits, and amount financed", () => {
  const deal = calculateDealSheet({
    offer: 100000,
    repairs: 5000,
    tax: 6000,
    slip: 1500,
    miles: 1000,
    loadedRate: 4,
    permits: 0,
    downPayment: 15000,
    tradeCredit: 10000,
    annualRate: 7.5
  });

  assert.equal(deal.freight, 4000);
  assert.equal(deal.purchaseTotal, 116500);
  assert.equal(deal.credits, 25000);
  assert.equal(deal.amountFinanced, 91500);
  assert.equal(
    Math.round(deal.payments[60]),
    Math.round(calculateMonthlyPayment(91500, 7.5, 60))
  );
});

test("Deal Sheet bounds credits and malformed rate input", () => {
  const deal = calculateDealSheet({
    offer: 100000,
    downPayment: 90000,
    tradeCredit: 90000
  });

  assert.equal(deal.credits, 100000);
  assert.equal(deal.amountFinanced, 0);
  assert.equal(sanitizeDealSheetDecimal("7..5x"), "7.5");
  assert.equal(sanitizeDealSheetDecimal("999"), "50");
});

test("Park Brake is persisted and guards mechanical commands without pointer blocking", () => {
  const page = fs.readFileSync("pages/browse-v2.js", "utf8");
  const workspace = fs.readFileSync(
    "components/ixi-chassis/IXIWorkspaceEngine.js",
    "utf8"
  );
  const controls = fs.readFileSync(
    "components/IXIRelationshipControls.js",
    "utf8"
  );

  assert.match(workspace, /workspaceSettings\?\.parkBrakeOn === true/u);
  assert.match(workspace, /onSaveWorkspaceSettings\(\{\s*parkBrakeOn:/u);
  assert.match(page, /function blockMechanicalMutation\(\)/u);
  assert.match(page, /sensors=\{workspaceParkBrakeOn \? \[\] : sensors\}/u);
  assert.match(page, /function executeIXITransaction[\s\S]*blockMechanicalMutation/u);
  assert.match(page, /function rotatePocket[\s\S]*blockMechanicalMutation/u);
  assert.ok(
    page.indexOf("setWorkspaceSettings(nextSettings)") <
      page.indexOf("if (!ixiUserId)", page.indexOf("function saveWorkspaceSettings")),
    "workspace controls must update locally before identity-gated persistence"
  );
  assert.match(controls, /onClick=\{onToggleParkBrake\}/u);
  assert.doesNotMatch(page, /parkBrake[\s\S]{0,100}pointer-events:\s*none/u);
});

test("Browse catalogue has durable cache, stale serving, and timing headers", () => {
  const api = fs.readFileSync("pages/api/listings.js", "utf8");

  assert.match(api, /getCache/u);
  assert.match(api, /waitUntil/u);
  assert.match(api, /X-IXI-Catalog-Cache/u);
  assert.match(api, /Server-Timing/u);
  assert.match(api, /stale-while-revalidate=604800/u);
  assert.match(api, /marketplace_catalogue_served/u);
});
