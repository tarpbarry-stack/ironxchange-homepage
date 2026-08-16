# IXI TRAN$ACT — ACCOUNTING DASHBOARD ENGINEERING BUILD SPEC

**Page name:** `IXI TRAN$ACT`  
**Purpose:** Engineering implementation contract for the full-size financial/accounting workspace.  
**Dependency:** Existing TRAN$ACT domain modules + AWS IXI Financial + GL/Reporting engines.  
**Do not implement by copying V13 card JSX into one giant page.**

---

# 1. ENGINEERING GOAL

Build one durable full-screen accounting shell that consumes canonical server projections and shared TRAN$ACT domain logic.

The full-size page must provide:

- global financial scope
- executive KPIs
- cross-module navigation
- enterprise queues/tables
- record drill-down
- authorized commands
- GL/close control
- reporting
- source lineage

without creating a second accounting system.

---

# 2. PROPOSED DIRECTORY STRUCTURE

```text
components/ixi-transact-dashboard/
  IXITransactDashboardApp.jsx
  IXITransactDashboardShell.jsx
  IXITransactDashboardNavigation.jsx
  IXITransactDashboardHeader.jsx
  IXITransactDashboardFilters.jsx
  IXITransactDashboardNoticeCenter.jsx
  IXITransactDashboardRecordDrawer.jsx
  IXITransactDashboardStyles.jsx

  data/
    IXITransactDashboardClient.js
    IXITransactDashboardQueryContract.js
    IXITransactDashboardProjectionAdapter.js
    IXITransactDashboardCache.js

  executive/
    IXIExecutiveDashboard.jsx
    IXIExecutiveSelectors.js
    IXIExecutiveKpiGrid.jsx
    IXIExecutiveAttentionPanel.jsx

  ar/
    IXIAccountsReceivableWorkspace.jsx
    IXIAccountsReceivableTable.jsx
    IXIAccountsReceivableSelectors.js

  ap/
    IXIAccountsPayableWorkspace.jsx
    IXIAccountsPayableTable.jsx
    IXIAccountsPayableSelectors.js

  treasury/
    IXITreasuryWorkspace.jsx
    IXITreasuryAccountTable.jsx
    IXITreasuryForecast.jsx

  accounting/
    IXIGLDashboardWorkspace.jsx
    IXIJournalTable.jsx
    IXIPostingExceptionQueue.jsx
    IXICloseWorkspace.jsx

  reporting/
    IXIFullFinancialReportingWorkspace.jsx
    IXIReportToolbar.jsx
    IXIReportDrilldown.jsx

  profitability/
    IXIProfitabilityWorkspace.jsx
    IXIProfitabilitySelectors.js
```

Suggested page route:

```text
pages/transact/index.js
```

If the product routing doctrine chooses another URL later, keep the internal component package independent of the route.

---

# 3. DO NOT DUPLICATE DOMAIN ENGINES

Reuse/import existing domain engines where possible:

```text
components/ixi-aos/transact/modules/collections/*
components/ixi-aos/transact/modules/payables/*
components/ixi-aos/transact/modules/treasury/*
components/ixi-aos/transact/modules/general-ledger/*
components/ixi-aos/transact/modules/financial-reporting/*
```

The desktop workspace may define desktop-specific selectors and projection adapters, but business equations must remain shared.

Examples:

- A/R open balance formula should not differ between card and dashboard.
- A/P open balance formula should not differ.
- Treasury book cash must use the same transaction doctrine.
- Trial Balance must use the same posted/unreversed journal doctrine.
- P&L and Balance Sheet must use the same account-type rules.

If a domain engine is currently too coupled to card inputs, refactor the engine into a pure shared module. Do not rewrite the logic a second time.

---

# 4. DATA QUERY CONTRACT

The dashboard needs a first-class query envelope.

Proposed shape:

```js
{
  scope: {
    entityPassportIds: [],
    locationPassportIds: [],
    assetPassportIds: [],
    customerPassportIds: [],
    vendorPassportIds: []
  },
  period: {
    from: "2026-08-01",
    through: "2026-08-31",
    accountingPeriod: "2026-08"
  },
  currency: "USD",
  filters: {},
  include: [
    "executive",
    "ar",
    "ap",
    "treasury",
    "gl-controls",
    "reporting"
  ]
}
```

Server response should be projection-oriented, for example:

```js
{
  generatedAt,
  scope,
  period,
  currency,
  executive: {...},
  ar: {...},
  ap: {...},
  treasury: {...},
  gl: {...},
  reports: {...},
  attention: [...],
  lineageVersion,
  projectionVersion
}
```

Do not force the browser to discover these aggregates by joining raw documents.

---

# 5. AWS / IXI FINANCIAL READ PATH

Before production dashboard launch, establish one of these server strategies:

## Preferred

Dedicated IXI Financial reporting/projection endpoints:

```text
GET/POST /financial/dashboard
GET/POST /financial/ar
GET/POST /financial/ap
GET/POST /financial/treasury
GET/POST /financial/gl
GET/POST /financial/reports
```

or one query endpoint with `include` sections.

## Acceptable interim

AOF2 scope projection if it already returns complete entity/period aggregates efficiently.

## Not acceptable

Browser loads every raw Financial Document and recalculates company-wide accounting.

---

# 6. DASHBOARD STATE MODEL

Keep UI state separate from financial truth.

Allowed local UI state:

```text
activeWorkspace
activeEntity
activePeriod
filters
sort
pagination cursor
selectedRecordId
openDrawer
column visibility
saved view id
```

Not allowed as authoritative local state:

```text
current cash balance
open A/R balance
open A/P balance
posted GL balance
close status
payment state
```

Those come from AWS/projections and refresh after commands.

---

# 7. RECORD DRAWER / DETAIL MODEL

Desktop records should open without destroying the user's queue context.

Recommended pattern:

```text
TABLE / REPORT
   ↓ click row
RIGHT DETAIL DRAWER
   ↓
summary + activity + evidence + authorized actions
   ↓ optional
OPEN CANONICAL V13 CARD / FULL RECORD
```

The drawer receives a canonical record identifier, not a stale copied object where avoidable.

Suggested identifier envelope:

```js
{
  recordType: "bill",
  recordId: "BILL-19482",
  financialDocumentId: "...",
  passportId: "..."
}
```

---

# 8. EXECUTIVE SELECTORS

Executive selectors must be pure and testable.

Required derived metrics:

- revenue current period
- revenue prior period
- revenue variance %
- net income
- net margin
- cash balance
- open A/R
- overdue A/R
- open A/P
- A/P due 7 days
- operating cash flow
- assets
- liabilities
- equity
- current ratio when current classifications exist
- close readiness

Every KPI selector must document source fields and accounting assumptions.

---

# 9. TABLE ENGINE

Use a reusable enterprise data-grid abstraction or purpose-built compact table component that supports:

- cursor pagination
- column sorting
- server-side filtering
- sticky header
- selectable rows
- bulk action capability where safe
- column chooser
- keyboard navigation
- fixed/virtualized rows for large datasets
- responsive truncation with tooltips
- CSV export

Financial tables should remain readable at desktop density. Avoid oversized consumer dashboard rows.

---

# 10. FILTER ENGINE

Filters must serialize into the URL/query state where practical so a view can be reopened/shared.

Example:

```text
/transact?workspace=ar&entity=PASS-123&period=2026-08&aging=31-60&owner=EMP-9
```

Filter changes should:

1. update URL/query state,
2. cancel stale request,
3. fetch scoped projection,
4. preserve last usable data during loading when safe,
5. update visible filter chips,
6. never mix data from two scopes.

---

# 11. COMMAND EXECUTION

Authorized dashboard actions still go through canonical command layers.

Examples:

```text
Record customer payment
→ existing Financial payment command

Post vendor payment
→ existing A/P/Financial payment command

Post credit
→ existing credit command

Approve Bill / PO
→ canonical module/approval command

Post journal
→ IXIGeneralLedgerCommands

Close period
→ IXIGeneralLedgerCommands
```

Desktop UI is not permission to bypass the domain command layer.

Use the existing IXI Action Notice lifecycle for saving/success/error where possible, plus a full-size notification rail/toast adapter.

---

# 12. AUTHORIZATION

Every protected action must be evaluated at three levels:

```text
Company Financial Policy
        ↓
Person / Role Authority
        ↓
Record / Period State
```

Frontend hides/disables unauthorized actions for UX.

AWS must reject unauthorized commands independently.

The dashboard must never rely on hidden buttons as the security boundary.

---

# 13. PERIOD / DATE SEMANTICS

Different report families use different time semantics:

- P&L: date range
- Cash Flow: date range
- Balance Sheet: through/as-of date
- Trial Balance: through/as-of accounting period
- A/R/A/P aging: as-of date
- Treasury forecast: today forward horizon
- Close: exact accounting period

Do not force every workspace into one simplistic `from/to` behavior.

---

# 14. ACCOUNTING INTEGRITY RULES

Dashboard must preserve:

- posted/unreversed journal filtering
- balanced debit/credit enforcement
- control-account reconciliation
- closed-period lock semantics
- source Financial Document lineage
- deterministic/idempotent commands
- reversal rather than deletion
- cash internal-transfer exclusion
- current fiscal-year earnings treatment

If the UI detects missing/unknown accounting treatment, surface an exception. Do not invent a classification in the browser.

---

# 15. PROFITABILITY DIMENSIONS

Journal lines should carry dimensions rather than exploding the Chart of Accounts.

Supported/proposed dimensions:

```text
entityPassportId
locationPassportId
assetPassportId
customerPassportId
vendorPassportId
workOrderId
serviceQuoteId
serviceInvoiceId
rentalRecordId
ownerPassportId
partnerPassportId
departmentId
```

Server aggregation should accept a `groupBy` dimension.

---

# 16. ALERT / ATTENTION CONTRACT

Normalize alerts from all domains into one shape:

```js
{
  alertId,
  type,
  severity: "info" | "attention" | "warning" | "critical",
  title,
  detail,
  amount,
  dueAt,
  entityPassportId,
  sourceRecordType,
  sourceRecordId,
  workspace,
  actionLabel,
  assigneePassportId
}
```

Examples:

- `ar-overdue`
- `promise-broken`
- `bill-approval-required`
- `po-match-exception`
- `bank-unreconciled`
- `gl-posting-exception`
- `period-close-blocker`

---

# 17. RESPONSIVE / VIEWPORT SPEC

Primary target is desktop/large-display office use.

Recommended breakpoints:

```text
>= 1920px: full nav + 6 KPI cards + multi-column workspace
1440–1919: full nav + 4–6 KPI cards
1024–1439: collapsible nav + reduced columns
<1024: dashboard may become read-focused; V13 object modules remain better for action-heavy mobile use
```

Do not contort the entire desktop accounting system into a phone-first design.

---

# 18. PERFORMANCE TARGETS

Initial engineering targets:

- shell interactive quickly using cached scope metadata
- KPI projection response target < 1.5 s under normal load
- table first page target < 1.5 s
- filter update should cancel stale network requests
- virtualize tables > ~200 rendered rows
- defer heavy charts until visible
- no client aggregation over unbounded histories

Use query caching keyed by:

```text
entity scope + period + filters + projection version
```

Invalidate relevant keys after a successful financial command.

---

# 19. ERROR STATES

Required:

- no permission
- no entity selected
- no financial setup
- no Chart of Accounts
- projection unavailable
- stale projection warning
- partial data warning
- command failed
- reconciliation mismatch
- server rejected closed-period mutation

Never render `0` as if it were verified financial truth when the query actually failed.

---

# 20. EXPORT ARCHITECTURE

Exports should preferably be server-generated for large reports.

Export request must include:

```text
entity scope
period/as-of date
filters
authorized user
report version
currency
```

Server response should preserve close/report version information for reproducibility.

---

# 21. AUDIT / LINEAGE

Every drillable record should be able to expose:

- source record ID
- Financial Document ID
- Journal Entry ID(s)
- Passport references
- actor
- created/posted timestamps
- period
- rule version
- evidence documents
- reversals/credits/payments

Do not discard IDs in projection APIs just because the initial chart does not display them.

---

# 22. TEST PLAN

## Unit tests

- KPI selectors
- aging buckets
- A/R/A/P sums
- cash forecast
- P&L
- Balance Sheet
- Cash Flow classification
- Trial Balance
- profitability grouping
- filter serialization

## Contract tests

- dashboard query envelope
- projection response validation
- source-lineage completeness
- pagination cursors

## Integration tests

- payment command → A/R projection refresh
- vendor payment → A/P refresh
- reconciliation → Treasury refresh
- journal post → GL/report refresh
- period close → lock + reporting status

## Permission tests

- unauthorized user cannot execute hidden or direct API action
- scoped manager cannot read another entity
- close authority enforced server side

## Accounting regression fixtures

Maintain golden fixtures for:

- invoice + payment
- bill + payment
- partial payment
- credit memo
- internal cash transfer
- asset acquisition
- service revenue
- asset sale requiring accounting exception
- journal reversal
- period close

---

# 23. BUILD ORDER

Recommended implementation order:

```text
1. Dashboard shell / route / nav
2. Scope + period query contract
3. Executive server projection
4. Executive page
5. A/R workspace
6. A/P workspace
7. Treasury workspace
8. GL / Close workspace
9. Financial Reporting workspace
10. Drill-down drawer / source lineage
11. Attention center
12. Export
13. Saved views
14. Performance hardening
15. permissions/security audit
```

Do not start with 15 charts and then invent the data model underneath them.

---

# 24. DEFINITION OF ENGINEERING DONE

The full-size IXI TRAN$ACT dashboard is not done until:

```text
V13 desktop UI
+ server projection/read path
+ canonical command integration
+ permissions
+ deterministic selectors
+ source lineage
+ error states
+ pagination/performance
+ audit controls
+ regression tests
+ AWS integration verified
```

A green frontend build is necessary, not sufficient.
