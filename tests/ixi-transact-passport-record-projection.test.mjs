import assert from "node:assert/strict";
import test from "node:test";

import {
  getIXITransactActionableRecords,
  getIXITransactWorkspaceRecords,
  normalizeIXITransactPassportRecords
} from "../components/ixi-transact-dashboard/data/IXITransactPassportRecordProjection.mjs";
import { normalizeIXITransactDashboardProjection } from "../components/ixi-transact-dashboard/data/IXITransactDashboardProjectionAdapter.js";

const records = [
  {
    server: { updatedAt: "2026-02-04T18:00:00.000Z" },
    financialDocument: {
      financialDocumentId: "ifd_acquisition_544k",
      documentType: "asset-acquisition",
      documentNumber: "ACQ-544K",
      financialState: "posted",
      occurredAt: "2026-01-10",
      vendor: { label: "Auction Seller" },
      totals: { total: 41500 }
    }
  },
  {
    financialDocument: {
      financialDocumentId: "ifd_invoice_544k",
      documentType: "invoice",
      documentNumber: "INV-544K",
      financialState: "paid",
      occurredAt: "2026-02-04",
      customer: { label: "544K Buyer" },
      totals: { total: 62500 }
    }
  },
  {
    record: {
      financialDocument: {
        financialDocumentId: "ifd_settlement_544k",
        documentType: "settlement",
        financialState: "submitted",
        occurredAt: "2026-02-05",
        totals: { total: 21000 }
      }
    }
  }
];

test("normalizes canonical Passport records without losing completed machine history", () => {
  const normalized = normalizeIXITransactPassportRecords(records);
  assert.equal(normalized.length, 3);
  assert.equal(normalized[0].id, "ifd_settlement_544k");
  assert.equal(normalized.find(item => item.id === "ifd_invoice_544k").amount, 62500);
  assert.equal(normalized.find(item => item.id === "ifd_acquisition_544k").party, "Auction Seller");
});

test("workspace projections classify records while lifetime history remains complete", () => {
  assert.deepEqual(getIXITransactWorkspaceRecords(records, "purchasing").map(item => item.id), ["ifd_acquisition_544k"]);
  assert.deepEqual(new Set(getIXITransactWorkspaceRecords(records, "sales").map(item => item.id)), new Set(["ifd_invoice_544k", "ifd_settlement_544k"]));
  assert.equal(getIXITransactWorkspaceRecords(records, "records").length, 3);
  assert.deepEqual(getIXITransactActionableRecords(records).map(item => item.id), ["ifd_settlement_544k"]);
});

test("released IX-Core dashboard envelope maps without silently discarding evidence", () => {
  const projection = normalizeIXITransactDashboardProjection({
    ok: true,
    data: {
      generatedAt: "2026-09-09T16:00:00.000Z",
      executive: { inflow: 62500, outflow: 41500, net: 21000 },
      financialSnapshot: { currencies: ["USD"] },
      lifecycleSnapshot: { invoice: { count: 1 } },
      recentActivity: [{ id: "activity-1", title: "Invoice paid" }],
      attention: { recentActivity: [{ id: "activity-2", title: "Settlement review" }], warnings: [{ code: "CLOSE_PENDING", title: "Close pending" }] },
      domains: { receivables: { source: "lifecycleSnapshot" } },
      lineage: { sourceContractVersion: "1.0.0" }
    }
  });

  assert.equal(projection.executive.revenue, 62500);
  assert.equal(projection.executive.netIncome, 21000);
  assert.equal(projection.attention.length, 3);
  assert.equal(projection.lineageVersion, "1.0.0");
  assert.equal(projection.domains.receivables.source, "lifecycleSnapshot");
});
