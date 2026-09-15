import assert from "node:assert/strict";
import test from "node:test";
import { mergeVisibleAppOrder } from "../components/ixi-command-center/IXITransactAppDirectoryModel.mjs";
import { historyBalanceDisplay } from "../components/ixi-command-center/IXITransactDisplay.mjs";

test("reordering WORK retains every other app and its position", () => {
  const order = Object.freeze(["work-order", "expense", "technology-work", "time", "freight", "material"]);
  assert.deepEqual(mergeVisibleAppOrder(order, ["time", "work-order", "material", "technology-work"]),
    ["time", "expense", "work-order", "material", "freight", "technology-work"]);
  assert.equal(order[0], "work-order");
});

test("filtered reorder cannot add unknown apps or duplicate a module", () => {
  assert.deepEqual(mergeVisibleAppOrder(["work", "sell", "buy"], ["buy", "unknown", "buy", "work"]), ["buy", "sell", "work"]);
  assert.deepEqual(mergeVisibleAppOrder(["work", "sell"], []), ["work", "sell"]);
});

test("quiet balance display keeps zero, no standalone balance, and review distinct", () => {
  assert.deepEqual(historyBalanceDisplay({openCents: 0}), {label: "—", description: "Zero outstanding balance"});
  assert.equal(historyBalanceDisplay({}).label, "—");
  assert.match(historyBalanceDisplay({}).description, /No standalone balance/);
  assert.equal(historyBalanceDisplay({review: true, reason: "Payment method missing"}).label, "REVIEW");
  assert.equal(historyBalanceDisplay({review: true, reason: "Payment method missing"}).description, "Payment method missing");
});

test("nonzero balances still use their amount and never become a dash", () => {
  for (const openCents of [1, 50000, -500]) {
    const row = Object.freeze({openCents});
    assert.equal(historyBalanceDisplay(row).description, undefined);
    assert.notEqual(historyBalanceDisplay(row).label, "—");
    assert.equal(row.openCents, openCents);
  }
});
