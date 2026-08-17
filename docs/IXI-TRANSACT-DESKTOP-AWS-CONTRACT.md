# IXI TRAN$ACT V13 Desktop — AWS Server Contract

## Purpose

This document defines the server contracts required by the full-screen IXI TRAN$ACT desktop. The browser is a presentation and command client. IX-Core remains the trusted authority for financial access context, projections, canonical records, permissions, actions, commands, and durable financial truth.

## Security invariant

The browser may request a scope, period, record, search, or command. It MUST NOT choose trusted actor identity, entity authority, roles, permissions, managed Passport scope, posting authority, or destructive-action authority.

Every endpoint below must resolve trusted request context through the existing IX-Core financial access-context bridge (for example `resolveFinancialAccessContextFromRequest(req)` or its canonical successor) and independently authorize the requested operation.

Client-supplied actor/entity/roles/permissions are never authority.

## 1. GET /financial/access-context

Returns only financial entities, locations, accounting periods, and permissions available to the authenticated actor.

The desktop may persist a selected allowed scope in the URL for navigation/bookmarking. IX-Core must still re-authorize every subsequent request. A multi-entity/location request is authorized only when every requested member is allowed.

## 2. POST /financial/dashboard

Consumes contract `ixi-transact-dashboard-query` version `1.3.0`.

Supported include sections:
- `executive`
- `attention`
- `ar`
- `ap`
- `treasury`
- `gl-controls`
- `reporting`
- `operations`
- `work-orders`
- `purchase-orders`
- `assets`
- `rental`

If a requested section cannot be produced, omit it or return a warning; the desktop will mark the projection `PARTIAL` and will not fabricate zeros.

### Truth semantics

Missing or unavailable financial amounts are `null`/absent, not `0`. Zero means verified zero.

Operational commitments must remain distinct from posted economic events:
- Purchase Order commitment is not A/P until the canonical Bill event.
- Rental projected revenue is not A/R until the canonical Invoice event.
- Rental projected cost is not A/P until the canonical Bill event.
- Asset projected ready cost is operational economics, not a substitute for posted Bills/Payments/GL.

## 3. POST /financial/records/resolve

Consumes `ixi-transact-record-resolve` version `1.0.0`.

The result may include canonical `record`, `permissions`, `lineage`, and authorized `actions`. The desktop accepts only action IDs in its closed IXI action registry. Unknown server action IDs are discarded.

For an action to become executable, the canonical resolver must also return execution context sufficient for the existing TRAN$ACT command module. Normalize that context onto the resolved record under `_ixiExecution`.

### Implemented desktop command paths

The desktop dispatcher currently supports only these existing canonical command paths:

- `record-ar-payment`
- `record-ar-credit`
- `record-ap-payment`
- `record-vendor-credit`
- `issue-po`
- `match-bill`

Server authorization is necessary but not sufficient. The action must also be implemented in the closed desktop registry and must pass the typed execution preflight.

### `_ixiExecution` shape

```json
{
  "record": {
    "_ixiExecution": {
      "object": {
        "passportId": "passport:machine:...",
        "objectId": "..."
      },
      "context": {
        "entity": { "passportId": "passport:entity:..." },
        "location": { "passportId": "passport:location:..." },
        "actor": { "passportId": "passport:employee:..." }
      },
      "receivable": {
        "invoiceId": "...",
        "balance": 10000,
        "currency": "USD"
      },
      "payable": {
        "billId": "...",
        "balance": 8000,
        "currency": "USD"
      },
      "purchaseOrder": {
        "identity": { "purchaseOrderRecordId": "..." },
        "order": { "lines": [] },
        "costs": { "estimated": 0 }
      },
      "collection": {},
      "metadata": {}
    }
  },
  "actions": [
    {
      "id": "record-ar-payment",
      "enabled": true,
      "requiresInput": true,
      "inputContract": "ixi-ar-payment-input-v1"
    }
  ]
}
```

Projection rows without canonical resolver execution context must never mutate financial truth.

### Desktop execution preflight

Before dispatch, the desktop verifies:

- action ID is known and implemented;
- server action remains enabled;
- canonical object identity exists;
- trusted entity execution context exists;
- A/R commands have canonical Invoice identity and cannot exceed open receivable balance;
- A/P commands have canonical Bill identity and cannot exceed open payable balance;
- A/R and vendor credit commands have required reasons;
- PO issue has canonical PO record identity and lines;
- PO Bill match has PO identity plus vendor invoice number/date/positive amount.

A passing preflight dispatches into the existing Collections, Payables, or Purchase Order command modules. Those modules remain the business-rule and persistence authority. The desktop does not duplicate their accounting logic.

The dispatcher itself is production-gated in CI. No desktop financial action should be exposed as executable until the resolver payload, typed input workflow, canonical command dispatch, success handling, cache invalidation, and refreshed projection path are all wired together.

## 4. POST /financial/search

Consumes `ixi-transact-record-search` version `1.0.0`. Search must be limited to trusted financial scope and should resolve canonical Financial Documents, TRAN$ACT records, Passports, Work Orders, customers, vendors, assets, and journal identifiers appropriate to the actor's authority.

## 5. POST /financial/commands/create

This is the existing canonical IXI Financial write route. Desktop mutations must reuse the existing AOS Financial Runtime / Financial Command Client and this trusted IX-Core route. Do not create a desktop ledger, direct balance edit endpoint, or desktop-only accounting command system.

## 6. GET /financial/health

Returns financial-service readiness. The desktop ONLINE/DEGRADED/UNAVAILABLE indicator comes from this endpoint, not hard-coded UI state.

## Projection requirements

### A/R
Totals/aging plus canonical receivable rows with invoice/customer identity, original amount, receipts, credits, open balance, due date, aging/status, collection state, and lineage.

### A/P
Canonical Bill/vendor/PO match/approval/payment/hold/dispute state and lineage.

### Treasury
Book/available cash, accounts, forecasts, statement/reconciliation control fields. A full reconciliation worksheet should return deposits in transit, outstanding payments, other reconciling items, adjusted bank balance, and difference when evidence exists.

### GL / Close
Period state, posting readiness, exceptions, controls, journals, close readiness, and source/journal lineage.

### Reporting
P&L, Balance Sheet, Cash Flow, Trial Balance, and dimensional profitability. Browser code must not duplicate accounting equations.

### Work Orders / Operations
Work Order identity/context, labor/material/service/other actuals, and canonical references to Time, Material, Service, Expense, Purchase, Bill, Document, Photo, and Note records.

### Purchase Orders
Canonical PO lifecycle, approval, receiving, estimated/committed/billed/paid costs, variance, vendor, needed-by, Work Order/location context, and pagination.

### Assets
Canonical asset-acquisition/ownership controls: acquisition identity, asset Passport, seller, type/date, purchase price, direct acquisition cost, projected ready cost, make-ready estimates/actuals, amount paid/balance due, title/lien, delivery, ownership, and settlement controls.

### Rental
Separate owned-asset rental-income and rented-in rental-expense records. Projected economics must remain separately identified from canonical Invoice/Bill/Payment economic events.

## Failure behavior

- `401`: unauthenticated; no financial truth displayed.
- `403`: unauthorized scope/action.
- `409` or business-state error: invalid transition/period/control conflict.
- `422`: validation failure.
- `5xx`: service unavailable; only a last usable projection may remain visible, explicitly marked stale.

A successful durable financial write must not be reported as failed solely because a subsequent projection/snapshot refresh fails. Return durable command success and refresh warning separately.

## Deployment boundary

The IronXchange frontend implements these contracts and the private same-origin Vercel financial proxy. Production readiness still requires IX-Core implementation/deployment of the read/access/resolve/search contracts, server environment configuration, and live authenticated integration tests against DynamoDB-backed truth.
