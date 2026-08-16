# IXI TRAN$ACT — FULL-SIZE ACCOUNTING DASHBOARD DOSSIER

**Canonical page name:** `IXI TRAN$ACT`  
**Product class:** Full-size accounting / financial command center  
**Relationship to V13 cards:** Aggregates and navigates the same canonical systems; does not replace them.  
**Primary users:** Owner, CFO, Controller, Accounting, A/R, A/P, Treasury, authorized managers.  
**Backend authority:** AWS IX-Core / IXI Financial.  
**Design language:** V13 TRAN$ACT translated into full-screen office UI: dense, compact, durable, readable, not oversized field UI.

---

# 1. PRODUCT PURPOSE

The IXI TRAN$ACT dashboard is the full-size financial operating workspace for the business.

It exists because the 298 × 471 card modules are excellent for object-level action, but accounting/ownership also needs a wide-angle view across:

- entities
- locations
- assets
- customers
- vendors
- A/R
- A/P
- Treasury
- General Ledger
- accounting periods
- profitability dimensions
- close controls
- exceptions

The dashboard must answer, within seconds:

> What is the company worth on the books right now?  
> What did we make?  
> What cash do we have?  
> Who owes us?  
> Who do we owe?  
> What is overdue?  
> What is unapproved?  
> What is unreconciled?  
> What is unposted?  
> Are the books balanced?  
> What machines / yards / customers / service jobs are making or losing money?  
> What requires my attention today?

---

# 2. NON-NEGOTIABLE ARCHITECTURE

```text
IXI TRAN$ACT FULL-SIZE DASHBOARD
              │
              │ read/navigation/authorized commands
              ▼
      IXI Financial projections
              │
        AWS IX-Core authority
              │
              ▼
  canonical Financial Documents
              │
              ▼
       General Ledger journals
              │
              ▼
       reporting projections
```

The dashboard is **not a second financial database**.

It must not calculate authoritative A/R, A/P, cash or ledger balances from arbitrary local React arrays when server projections are available.

It must preserve source lineage all the way back to the original Bill, Expense, Sale, Service Invoice, Work Order, Payment, Passport and Journal.

---

# 3. INFORMATION ARCHITECTURE

Primary left navigation:

```text
IXI TRAN$ACT

EXECUTIVE SUMMARY

MONEY IN
  Collections / A/R
  Customer Invoices
  Asset Sales / Proceeds

MONEY OUT
  Payables / A/P
  Bills / Approvals
  Purchase Orders

CASH
  Treasury
  Bank Accounts
  Reconciliation

ACCOUNTING
  General Ledger
  Journal
  Posting Exceptions
  Adjustments
  Period Close

REPORTING
  Profit & Loss
  Balance Sheet
  Cash Flow
  Trial Balance
  Profitability

OPERATIONS / ECONOMICS
  Assets
  Locations
  Customers
  Vendors
  Service
  Rental
  Ownership / Settlement

ADMINISTRATION
  Chart of Accounts
  Posting Rules
  Financial Policy
  Permissions
  Entity / Fiscal Settings
  Report Settings
```

Navigation must be permission-aware. A salesperson should not see Period Close. A controller should.

---

# 4. GLOBAL PAGE CHROME

The dashboard shell should remain stable while the center workspace changes.

## Top bar

```text
IXI TRAN$ACT                  ENTITY: [IRONXCHANGE LLC ▼]
                              PERIOD: [AUG 2026 ▼]
[SEARCH] [FILTERS] [EXPORT] [NOTICES] [USER]
```

Required global controls:

- Entity / consolidated scope selector
- Reporting period / as-of date
- Location filter
- Department or operating group filter when supported
- Currency display
- Search
- Export
- Notification / exception count
- Current user / authority context

Search must find canonical records by number and common business identity:

- `BILL-19482`
- `PO-2048`
- `SINV-####`
- `SALE-####`
- `STL-####`
- `JE-####`
- customer
- vendor
- asset Passport
- serial number
- Work Order

---

# 5. EXECUTIVE SUMMARY — DEFAULT LANDING PAGE

The default page is a financial command center, not a spreadsheet.

## KPI row

Recommended first-row metrics:

```text
TOTAL REVENUE
NET INCOME
NET MARGIN
CASH BALANCE
OPEN A/R
OPEN A/P
```

Optional secondary KPI strip:

```text
OVERDUE A/R
DUE A/P 7 DAYS
OPERATING CASH FLOW
CURRENT RATIO
UNPOSTED FINANCIAL DOCS
CLOSE READINESS
```

Each KPI must be clickable and drill to the contributing report/queue.

## Executive charts

1. **Revenue + Net Income Trend**
2. **Revenue by Segment**
3. **Cash Flow Bridge** — Beginning Cash → Operating → Investing → Financing → Ending Cash
4. **A/R Aging**
5. **A/P Aging / Upcoming Cash Requirements**
6. **Top / Bottom Profitability** by Asset, Location, Customer or Service operation

## Attention rail

Right-side or top-right compact panel:

```text
ATTENTION
3 bank accounts unreconciled
2 A/R promises broken
4 bills pending approval
1 PO match exception
2 GL posting exceptions
August close not ready
```

Each item is an actionable link into the appropriate module/queue.

---

# 6. CORE DESKTOP WIREFRAME

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ IXI TRAN$ACT      ENTITY [IRONXCHANGE LLC ▼]    PERIOD [AUG 2026 ▼]   FILTERS  EXPORT  🔔3  USER │
├──────────────────────┬───────────────────────────────────────────────────────────────────────────────┤
│ EXECUTIVE SUMMARY    │ EXECUTIVE SUMMARY                                                             │
│                      │                                                                               │
│ MONEY IN             │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│  A/R                 │ │REVENUE │ │NET INC │ │MARGIN  │ │ CASH   │ │ A/R    │ │ A/P    │          │
│  INVOICES            │ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘          │
│  SALES               │                                                                               │
│                      │ ┌─────────────────────────────────┐ ┌──────────────────────────────────┐       │
│ MONEY OUT            │ │ REVENUE + NET INCOME TREND      │ │ REVENUE BY SEGMENT               │       │
│  A/P                 │ │                                 │ │                                  │       │
│  BILLS               │ │                                 │ │                                  │       │
│  PURCHASE ORDERS     │ └─────────────────────────────────┘ └──────────────────────────────────┘       │
│                      │                                                                               │
│ CASH                 │ ┌─────────────────────────────────┐ ┌──────────────────┐ ┌──────────────┐       │
│  TREASURY            │ │ PROFITABILITY — TOP / BOTTOM    │ │ CASH FLOW BRIDGE │ │ ATTENTION    │       │
│  RECONCILIATION      │ │                                 │ │                  │ │              │       │
│                      │ └─────────────────────────────────┘ └──────────────────┘ └──────────────┘       │
│ ACCOUNTING           │                                                                               │
│  GENERAL LEDGER      │ ┌───────────────────────────────────────────────────────────────────────┐       │
│  JOURNAL             │ │ FINANCIAL POSITION                                                    │       │
│  EXCEPTIONS          │ │ Assets | Liabilities | Equity | Working Capital | Current Ratio         │       │
│  CLOSE               │ └───────────────────────────────────────────────────────────────────────┘       │
│                      │                                                                               │
│ REPORTING            │ ┌───────────────────────────────────────────────────────────────────────┐       │
│  P&L                 │ │ INSIGHTS / VARIANCES / EXCEPTIONS                                     │       │
│  BALANCE SHEET       │ └───────────────────────────────────────────────────────────────────────┘       │
│  CASH FLOW           │                                                                               │
│  PROFITABILITY       │                                                                               │
└──────────────────────┴───────────────────────────────────────────────────────────────────────────────┘
```

---

# 7. MODULE WORKSPACES

## 7.1 Collections / A/R

Full-size workspace should show:

- Total A/R
- Current
- 1–30
- 31–60
- 61–90
- 90+
- Due today
- Promises due
- Broken promises
- Disputes
- Collection owner
- Customer exposure

Primary table columns:

```text
CUSTOMER | SOURCE | INVOICE | ORIGINAL | RECEIVED | OPEN | DUE | DAYS | STATUS | OWNER | NEXT ACTION
```

Opening a row uses a right-side detail drawer or centered record workspace that renders the same canonical Collection Case information/actions as the V13 module.

## 7.2 Payables / A/P

Metrics:

- Total A/P
- Due today
- Due 7 days
- Due 30 days
- Overdue
- Needs approval
- Match exception
- On hold
- Scheduled

Table:

```text
VENDOR | BILL | PO | ORIGINAL | PAID | CREDIT | OPEN | DUE | APPROVAL | MATCH | HOLD | PAYMENT
```

## 7.3 Treasury

Primary view:

- Total cash
- Available cash
- Restricted/reserved cash if later supported
- Expected inflows 7/30/60/90
- Scheduled outflows 7/30/60/90
- Forecast ending cash

Account table:

```text
ACCOUNT | INSTITUTION | BOOK BALANCE | STATEMENT BALANCE | AVAILABLE | LAST RECONCILED | DIFFERENCE
```

Actions:

- Add account
- Opening balance (setup only)
- Transfer
- Authorized adjustment
- Reconcile
- View activity

No `EDIT BALANCE` control.

## 7.4 General Ledger / Close

Top controls:

```text
PERIOD STATUS
UNPOSTED
POSTING EXCEPTIONS
OUT OF BALANCE
A/R CONTROL
A/P CONTROL
CASH CONTROL
BANKS RECONCILED
```

Workspaces:

- Journal
- Exceptions
- Adjustments
- Mappings
- Reconciliations
- Close Checklist

Close must remain blocked until required controls pass.

## 7.5 Financial Reporting

Full-size reporting should expand the existing V13 reports, not rewrite them.

Report navigation:

- Executive
- Profit & Loss
- Balance Sheet
- Cash Flow
- Trial Balance
- Profitability

Profitability drill dimensions:

- Asset / Passport
- Location
- Customer
- Work Order / Service
- Rental
- Vendor where meaningful
- Owner / Partner where supported by journal dimensions

---

# 8. DRILL-DOWN DOCTRINE

Every summary number should have a traceable path:

```text
KPI
 ↓
Report section
 ↓
Account / customer / vendor / asset group
 ↓
Journal line or subledger record
 ↓
Financial Document
 ↓
Source TRAN$ACT record
 ↓
AOS Object / Passport / document evidence
```

Example:

```text
REPAIRS EXPENSE $428,220
  ↓
6110 Repairs & Maintenance
  ↓
CAT 336 = $18,440
  ↓
JE-28491
  ↓
BILL-19483
  ↓
WO-1058
  ↓
CAT 336 Passport
  ↓
Invoice PDF / receiving / notes
```

This traceability is a major IXI differentiator and must not be sacrificed for prettier charts.

---

# 9. FULL-SIZE DASHBOARD VS 298 × 471 MODULES

Do not duplicate business engines.

Correct model:

```text
FULL-SIZE DASHBOARD
  uses selectors/projections/commands
        ↓
SHARED TRAN$ACT DOMAIN ENGINES
        ↓
AWS IXI FINANCIAL
```

When the user opens one specific Bill/PO/Collection/Settlement record, the full-size page may:

- render a desktop detail panel based on the same contract,
- open the canonical V13 card in a drawer/console,
- or route to a full record page later.

But the record must remain the same canonical record.

---

# 10. DESKTOP V13 VISUAL LANGUAGE

The full-size workspace should feel like V13 matured for office use:

- dark graphite/black base
- thin borders
- compact typography
- yellow active/authority accents
- green completion/healthy state
- red exception/destructive state
- cyan used sparingly for navigation/system relationships
- dense but legible tables
- low-radius panels
- subtle shadows, not glossy consumer cards
- no giant field-style button blocks
- icons small and functional
- information hierarchy through spacing, rules, type weight and accent, not oversized boxes

The dashboard should look like the same product family as V13 without pretending a 5K monitor is a 298 × 471 card.

---

# 11. USER ROLES

Minimum role experiences:

## Owner / CFO

- Full Executive
- P&L / Balance Sheet / Cash Flow
- Treasury
- Settlements
- High-dollar approvals
- Close status
- Profitability

## Controller / Accounting

- A/R / A/P
- Treasury
- GL
- Journal
- Reconciliation
- Close
- Reporting
- Posting rules

## A/R specialist

- Collections
- customer exposure
- payment posting
- promises/disputes
- limited reporting

## A/P specialist

- Bills
- Payables
- approvals/match
- payment scheduling
- vendor credits

## Manager

- scoped financial visibility
- approvals within authority
- location/asset/customer profitability as policy allows

Permissions must be server-authoritative where financial risk exists.

---

# 12. ALERT / EXCEPTION CENTER

A single cross-system Attention/Exception center should aggregate:

- overdue A/R
- broken promise to pay
- disputed customer receivable
- overdue A/P
- Bill awaiting approval
- PO match exception
- scheduled payment due
- bank unreconciled
- cash reconciliation difference
- GL unposted document
- GL posting exception
- out-of-balance control
- period-close blocker
- settlement blocker

An alert must link directly to the record/action required.

---

# 13. GLOBAL FILTERS

The dashboard must support filter intersection, not independent cosmetic filters.

Canonical filter dimensions:

- Entity
- Period / date range
- Location
- Asset / Passport
- Customer
- Vendor
- Work Order / Service Job
- Account
- Financial state
- Owner / Partner where supported

Every visible KPI/report/table should clearly indicate the active filter scope.

---

# 14. REPORT EXPORT / SHARING

Future production capability should support:

- PDF report package
- Excel/CSV detail
- Print
- saved report views
- scheduled delivery later

Exports must include:

- entity
- report name
- period
- generated at
- generated by
- currency
- active filters
- whether period is open or closed

Closed-period reporting should be reproducible from close evidence/snapshots.

---

# 15. PERFORMANCE DOCTRINE

Do not send the browser every Financial Document in company history.

Target architecture:

- server-side filtered projections
- entity/period scoped queries
- cached aggregates for executive KPIs
- cursor pagination for transaction tables
- on-demand drill detail
- deterministic IDs and source lineage

Large financial aggregation belongs on AWS/server projections, not in render loops.

---

# 16. PRODUCT FLOW

Daily office flow:

```text
OPEN IXI TRAN$ACT
   ↓
EXECUTIVE / ATTENTION SUMMARY
   ↓
choose exception or workspace
   ↓
A/R / A/P / Treasury / GL action
   ↓
canonical record command to AWS
   ↓
projection refresh
   ↓
dashboard updates
```

Month-end flow:

```text
A/R reviewed
A/P reviewed
Treasury reconciled
Posting exceptions resolved
Adjustments posted
Control accounts agree
Trial Balance balances
   ↓
REVIEW CLOSE
   ↓
CLOSE PERIOD
   ↓
Financial Reporting / board reporting
```

---

# 17. DEFINITION OF SUCCESS

The dashboard is successful when:

1. An owner can understand financial condition in under one minute.
2. Accounting can find every exception requiring action without maintaining a side spreadsheet.
3. Every KPI can drill to source evidence.
4. A/R, A/P, Cash and GL control balances reconcile to their canonical subledgers.
5. A closed period cannot be silently rewritten.
6. No dashboard action bypasses authority or audit history.
7. The full-size page and V13 cards operate on the same records and engines.
8. AWS IXI Financial remains the source of truth.
