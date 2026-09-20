import test from "node:test";
import assert from "node:assert/strict";
import { applyInventoryProjection, soldListingsFromProjection, querySoldListings, mergeSoldWorkspacePage } from "../lib/listings/IXISoldInventory.mjs";
import { preserveOpenInventoryTransactions, releaseClosedInventoryTransactions } from "../lib/listings/IXIInventorySession.mjs";
import { buildMachineLedger } from "../components/ixi-command-center/IXITransactMachineLedger.mjs";

const original = { id: "listing-original", passportId: "IXIMACHINE01", objectId: "object-original", title: "2018 VOLVO A25G", make: "Volvo", model: "A25G", year: "2018", serialNumber: "SERIAL-500", price: "138000", publicData: { machineAccess: "live", machineChannel: "marketplace" } };
const sale = { saleId: "ifd_sale1", passportId: "IXIMACHINE01", entityPassportId: "IXIENTITY01", saleDate: "2026-02-01", salePrice: 90000.50, buyerLabel: "Buyer A", soldByLabel: "Salesperson B", settlementStatus: "open", status: "sold" };
test("sold changes availability without replacing the Object or Passport", () => {
  const current = { IXIMACHINE01: { state: "sold" } };
  assert.equal(applyInventoryProjection([original], current).length, 0);
  const sold = soldListingsFromProjection([sale], [original])[0];
  assert.equal(sold.id, "sold:ifd_sale1");
  assert.equal(sold.sourceListingId, original.id);
  assert.equal(sold.objectId, original.objectId);
  assert.equal(sold.passportId, original.passportId);
  assert.equal(sold.price, "90000.5");
  assert.equal(original.price, "138000");
});
test("return restores private availability, preserving the original listing identity", () => {
  const [returned] = applyInventoryProjection([original], { IXIMACHINE01: { state: "owned", forcePrivate: true } });
  assert.equal(returned.id, original.id);
  assert.equal(returned.publicData.machineAccess, "private");
  assert.equal(original.publicData.machineAccess, "live");
});
test("separate sale cycles share canonical identity and retain distinct research cards", () => {
  const sales = soldListingsFromProjection([sale, { ...sale, saleId: "ifd_sale2", saleDate: "2026-08-01", buyerLabel: "Buyer C" }], [original]);
  assert.equal(new Set(sales.map(item => item.id)).size, 2);
  assert.equal(new Set(sales.map(item => item.passportId)).size, 1);
  assert.equal(querySoldListings(sales, { q: "Buyer A" }).total, 1);
  assert.equal(querySoldListings(sales, { q: "SERIAL-500", from: "2026-07-01" }).listings[0].soldSummary.buyerLabel, "Buyer C");
});
test("research filters preserve cents, unknown values and page bounds", () => {
  const rows = soldListingsFromProjection([sale, { ...sale, saleId: "ifd_sale2", passportId: "IXIUNKNOWN", salePrice: null }], [original]);
  assert.equal(querySoldListings(rows, { priceMin: 90000.25, priceMax: 90000.75 }).total, 1);
  assert.equal(querySoldListings(rows, { priceMax: 10 }).total, 0);
  assert.equal(querySoldListings(rows, { q: "Salesperson B", settlement: "closed" }).total, 0);
  assert.equal(querySoldListings(rows, { page: 999, pageSize: 1 }).page, 2);
});
test("SOLD scoreboard totals the complete date-filtered result before pagination", () => {
  const rows = soldListingsFromProjection([
    { ...sale, saleId: "before", saleDate: "2026-01-31", salePrice: 500000 },
    { ...sale, saleId: "first", saleDate: "2026-02-01", salePrice: 90000.29 },
    { ...sale, saleId: "last", saleDate: "2026-02-28", salePrice: 65000.71 },
    { ...sale, saleId: "after", saleDate: "2026-03-01", salePrice: 700000 },
  ], [original]);
  const query = { from: "2026-02-01", to: "2026-02-28", pageSize: 1 };
  const first = querySoldListings(rows, query), second = querySoldListings(rows, { ...query, page: 2, sort: "price-asc" });
  assert.equal(first.total, 2);
  assert.equal(first.listings.length, 1);
  assert.deepEqual(first.salesSummary.totals, [{ currency: "USD", amountCents: 15500100 }]);
  assert.deepEqual(second.salesSummary, first.salesSummary);
  assert.deepEqual(querySoldListings(rows, { from: "2026-02-28", to: "2026-02-28" }).salesSummary.totals, [{ currency: "USD", amountCents: 6500071 }]);
  assert.deepEqual(querySoldListings(rows, { from: "2027-01-01" }).salesSummary, { totals: [], missingPriceCount: 0, returnedCount: 0 });
});
test("SOLD scoreboard follows search and settlement filters and excludes returned sales", () => {
  const rows = soldListingsFromProjection([
    { ...sale, saleId: "paid", salePrice: 75000, settlementStatus: "closed" },
    { ...sale, saleId: "open", salePrice: 25000, buyerLabel: "Buyer C" },
    { ...sale, saleId: "return", salePrice: 100000, status: "returned" },
  ], [original]);
  assert.deepEqual(querySoldListings(rows).salesSummary, { totals: [{ currency: "USD", amountCents: 10000000 }], missingPriceCount: 0, returnedCount: 1 });
  assert.deepEqual(querySoldListings(rows, { q: "Buyer C" }).salesSummary.totals, [{ currency: "USD", amountCents: 2500000 }]);
  assert.deepEqual(querySoldListings(rows, { settlement: "closed" }).salesSummary.totals, [{ currency: "USD", amountCents: 7500000 }]);
  assert.deepEqual(querySoldListings(rows, { status: "returned" }).salesSummary.totals, []);
});
test("SOLD scoreboard separates currencies and identifies missing prices without counting them as zero", () => {
  const rows = soldListingsFromProjection([
    { ...sale, saleId: "usd", salePrice: 0.10 },
    { ...sale, saleId: "usd2", salePrice: 0.20 },
    { ...sale, saleId: "cad", salePrice: 95000.50, currency: "CAD" },
    { ...sale, saleId: "unknown", salePrice: null },
    { ...sale, saleId: "invalid", salePrice: NaN },
    { ...sale, saleId: "zero", salePrice: 0 },
  ], [original]);
  assert.deepEqual(querySoldListings(rows).salesSummary, { totals: [{ currency: "CAD", amountCents: 9500050 }, { currency: "USD", amountCents: 30 }], missingPriceCount: 2, returnedCount: 0 });
});
test("inventory refresh keeps an open worksheet mounted until the operator closes it", () => {
  const open = { "object-original": { transactOpen: true } };
  const held = preserveOpenInventoryTransactions([original], [], open);
  assert.equal(held[0].objectId, original.objectId);
  assert.equal(held[0].inventorySessionOnly, true);
  assert.equal(releaseClosedInventoryTransactions(held, open).length, 1);
  assert.equal(releaseClosedInventoryTransactions(held, {}).length, 0);
  assert.equal(preserveOpenInventoryTransactions([original], [], {}).length, 0);
});
test("customer refunds reduce received money rather than inflate machine cost payments", () => {
  const references = [{ role: "asset", passportId: "IXIMACHINE01" }];
  const ledger = buildMachineLedger([
    { financialDocumentId: "ifd_receipt", documentType: "payment", financialState: "paid", currency: "USD", paymentDirection: "inflow", totals: { total: 1000 }, references },
    { financialDocumentId: "ifd_refund", documentType: "payment", financialState: "paid", currency: "USD", paymentDirection: "outflow", totals: { total: 100 }, metadata: { customerRefund: true }, references },
  ], { passportId: "IXIMACHINE01", currency: "USD" });
  const refund = ledger.rows.find(row => row.id === "ifd_refund");
  assert.equal(refund.receivedCents, -10000);
  assert.equal(refund.paidCents, 0);
});

test("moving one result page preserves card positions on other pages and filters", () => {
  const saved = { board: ["sold:a", "sold:b"], pocketLeft: ["sold:c"], stackTop: ["sold:d"] };
  const moved = mergeSoldWorkspacePage(saved, { board: ["sold:e"], pocketLeft: ["sold:a"], stackTop: [] }, ["sold:a", "sold:e"]);
  assert.deepEqual(moved, { board: ["sold:b", "sold:e"], pocketLeft: ["sold:c", "sold:a"], stackTop: ["sold:d"] });
  const next = mergeSoldWorkspacePage(moved, { board: ["sold:c"], pocketLeft: [], stackTop: ["sold:b"] }, ["sold:b", "sold:c"]);
  assert.deepEqual(next, { board: ["sold:e", "sold:c"], pocketLeft: ["sold:a"], stackTop: ["sold:d", "sold:b"] });
  assert.deepEqual(saved.board, ["sold:a", "sold:b"]);
});
