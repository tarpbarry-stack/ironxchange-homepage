# IXI TRAN$ACT V13 Desktop — AWS Server Contract

## Purpose

This document defines the server contracts required by the full-screen IXI TRAN$ACT desktop. The browser is a presentation and command client. IX-Core remains the trusted authority for financial access context, projections, canonical records, permissions, actions, commands, and durable financial truth.

## Security invariant

The browser may request a scope, period, record, search, or command. It MUST NOT choose trusted actor identity, entity authority, roles, permissions, managed Passport scope, posting authority, or destructive-action authority.

Every endpoint below must resolve trusted request context through the existing IX-Core financial access-context bridge (for example `resolveFinancialAccessContextFromRequest(req)` or its canonical successor) and independently authorize the requested operation.

Client-supplied actor/entity/roles/permissions are never authority.

## 1. GET /financial/access-context

Returns only financial entities, locations, accounting periods, and permissions available to the authenticated actor.

Expected response shape:

```json
{
  "ok": true,
  "data": {
    "actor": { "passportId": "passport:employee:...", "label": "User" },
    "entities": [{ "passportId": "passport:entity:...", "label": "IRONXCHANGE LLC", "isDefault": true }],
    "locations": [{ "passportId": "passport:location:...", "label": "MIDLAND", "isDefault": false }],
    "periods": [{ "accountingPeriod": "2026-08", "label": "AUG 2026", "from": "2026-08-01", "through": "2026-08-31", "status": "open", "isDefault": true }],
    "defaultEntityPassportId": "passport:entity:...",
    "defaultLocationPassportId": "",
    "defaultAccountingPeriod": "2026-08",
    "permissions": {},
    "generatedAt": "2026-08-17T00:00:00.000Z"
  }
}
```

The desktop may persist a selected allowed scope in the URL for navigation/bookmarking. IX-Core must still re-authorize every subsequent request. A multi-entity/location request is authorized only when every requested member is allowed.

## 2. POST /financial/dashboard

Consumes contract `ixi-transact-dashboard-query` version `1.3.0`.

```json
{
  "contract": "ixi-transact-dashboard-query",
  "contractVersion": "1.3.0",
  "scope": {
    "entityPassportIds": ["passport:entity:..."],
    "locationPassportIds": [],
    "assetPassportIds": [],
    "customerPassportIds": [],
    "vendorPassportIds": []
  },
  "period": { "from": "", "through": "", "accountingPeriod": "2026-08" },
  "currency": "USD",
  "filters": { "workspace": "executive" },
  "include": ["executive", "attention", "ar", "ap", "treasury", "gl-controls", "reporting"]
}
```

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

The endpoint should return only requested sections plus shared envelope/lineage metadata. If a requested section cannot be produced, omit it or return a warning; the desktop will mark the projection `PARTIAL` and will not fabricate zeros.

### Truth semantics

Missing or unavailable financial amounts are `null`/absent, not `0`. Zero means verified zero.

Operational commitments must remain distinct from posted economic events:
- Purchase Order commitment is not A/P until the canonical Bill event.
- Rental projected revenue is not A/R until the canonical Invoice event.
- Rental projected cost is not A/P until the canonical Bill event.
- Asset projected ready cost is operational economics, not a substitute for posted Bills/Payments/GL.

## 3. POST /financial/records/resolve

Consumes `ixi-transact-record-resolve` version `1.0.0`.

```json
{
  "contract": "ixi-transact-record-resolve",
  "contractVersion": "1.0.0",
  "identifier": {
    "recordType": "invoice",
    "recordId": "...",
    "financialDocumentId": "...",
    "passportId": "..."
  },
  "scope": {},
  "period": {}
}
```

Expected result may include canonical `record`, `permissions`, `lineage`, and authorized `actions`. Example action:

```json
{
  "id": "record-ar-payment",
  "enabled": true,
  "requiresInput": true,
  "inputContract": "ixi-ar-payment-input-v1"
}
```

The desktop accepts only action IDs in its closed IXI action registry. Unknown server action IDs are discarded. IX-Core still owns state/permission authorization; the client registry owns which UI behavior exists and which actions are destructive/input-required.

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
