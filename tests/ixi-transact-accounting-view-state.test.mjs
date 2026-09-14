import test from "node:test";
import assert from "node:assert/strict";
import { accountingViewState, closeReviewItems } from "../components/ixi-transact-dashboard/domain/accountingViewState.mjs";

const payload = { data: { projection: { period: { period: "2026-09", closed: true }, currency: "USD", profitAndLoss: { netIncome: -76 } } } };

test("period changes, failed refreshes and loading cannot display old balances or enable posting", () => {
  for (const options of [{ loading: true }, { error: new Error("offline") }, { period: "2026-10" }, { currency: "EUR" }]) {
    const state = accountingViewState({ payload, period: "2026-09", ...options });
    assert.equal(state.ready, false);
    assert.deepEqual(state.projection, {});
    assert.notEqual(state.status, "OPEN");
    assert.notEqual(state.status, "CLOSED");
  }
});

test("only an explicit period state from the matching response can be open or closed", () => {
  assert.equal(accountingViewState({ payload, period: "2026-09" }).status, "CLOSED");
  const open = structuredClone(payload);
  open.data.projection.period.closed = false;
  assert.equal(accountingViewState({ payload: open, period: "2026-09" }).status, "OPEN");
  delete open.data.projection.period.closed;
  assert.equal(accountingViewState({ payload: open, period: "2026-09" }).ready, false);
  assert.equal(accountingViewState({ period: "2026-09" }).status, "UNAVAILABLE");
});

test("reconciliation preserves missing evidence and unposted acquisition exceptions", () => {
  assert.equal(closeReviewItems({}), null);
  const controls = { closeCertification: { counts: { unpostedEconomicDocuments: 1 }, exceptions: [{ code: "UNPOSTED_ECONOMIC_DOCUMENT", financialDocumentId: "acq-1", documentType: "asset-acquisition" }] } };
  const review = closeReviewItems(controls);
  assert.equal(review.counts[0].value, 1);
  assert.equal(review.counts[1].value, undefined);
  assert.equal(review.balances[0].balanced, undefined);
  assert.equal(review.exceptions[0].financialDocumentId, "acq-1");
  assert.deepEqual(controls.closeCertification.counts, { unpostedEconomicDocuments: 1 });
});
