# IXI TRAN$ACT — ACCOUNTING DASHBOARD FUNCTIONALITY SPEC

**Canonical page name:** `IXI TRAN$ACT`  
**Audience:** Product, design, frontend, backend, QA, accounting domain reviewers.  
**Purpose:** Define exactly what the full-size dashboard must do, what each workspace means, and how users move through the system.

---

# 1. PRIMARY USER PROMISE

The page should answer this question every time it opens:

> **What is happening financially, what needs attention, and what can I do about it right now?**

The dashboard is a command center for office/financial users. It must be powerful without becoming an accounting maze.

---

# 2. DEFAULT LANDING EXPERIENCE

On entry:

1. Resolve authorized entity scope.
2. Resolve default accounting/reporting period.
3. Load Executive Summary projection.
4. Load attention/exception counts.
5. Display data freshness timestamp.
6. If financial setup is incomplete, show setup state instead of fake zeros.

Default page hierarchy:

```text
Top scope bar
KPI row
Executive trends
Cash / A/R / A/P attention
Profitability
Financial position
Exception / action panel
```

---

# 3. GLOBAL SCOPE BAR

Controls:

- Entity
- Period/date range
- Location
- Search
- Filters
- Export
- Notifications
- User/role

Rules:

- Scope changes affect every compatible widget.
- The currently active entity/period is always visible.
- Any chart/table with a different date semantic must state it clearly.
- Closed period status must be visible when relevant.

---

# 4. EXECUTIVE SUMMARY FUNCTIONALITY

## KPI cards

Required first release:

- Revenue
- Net Income
- Net Margin
- Cash Balance
- Open A/R
- Open A/P

Each KPI shows:

```text
current value
comparison value
variance / trend
period label
status if exceptional
```

Click behavior:

- Revenue → P&L revenue section
- Net Income → P&L
- Cash → Treasury
- A/R → Collections
- A/P → Payables

## Executive trends

Revenue + Net Income trend:

- monthly default
- optional weekly/quarterly later
- hover exact values
- click month to scope reports

Revenue segmentation:

- Equipment Sales
- Rental Revenue
- Service Revenue
- other configured revenue classes

Segments must come from COA/account mappings, not hard-coded labels when company configuration changes.

---

# 5. ATTENTION CENTER

The dashboard must aggregate actionable exceptions.

Priority order:

1. Critical accounting/control failures
2. Cash / bank reconciliation failures
3. Overdue receivables / broken promises
4. Overdue or high-risk payables
5. Approval queues
6. Posting exceptions
7. Close blockers
8. Informational notices

User can:

- open source record
- assign/claim item when supported
- dismiss informational notice where policy allows
- filter by severity / owner / workspace

No alert should dead-end.

---

# 6. MONEY IN — COLLECTIONS / A/R

The A/R workspace answers:

> Who owes us, how much, how late, what did they promise, what is disputed, and who owns the follow-up?

## Summary metrics

- Total A/R
- Current
- 1–30
- 31–60
- 61–90
- 90+
- Due today
- Overdue
- Promises due
- Broken promises
- Disputed amount

## Primary table

Columns:

```text
Customer
Invoice/Source
Original Amount
Payments
Credits
Open Balance
Due Date
Days Past Due
Aging Bucket
Promise Status
Dispute Status
Collector
Next Action
```

## Row actions

Based on authority:

- Open Collection Case
- Log Contact
- Promise to Pay
- Record Dispute
- Escalate
- Post Customer Payment
- Post Credit / authorized write-off
- Open source Invoice / Sale / Service Invoice

Rules:

- Promise does not reduce A/R.
- Dispute does not reduce A/R.
- Payment/credit must flow through Financial commands.

---

# 7. MONEY OUT — PAYABLES / A/P

The A/P workspace answers:

> What do we owe, what is due, what needs approval, what is on hold, what does not match, and what is scheduled to leave cash?

## Summary metrics

- Total A/P
- Due today
- Due 7 days
- Due 30 days
- Overdue
- Needs approval
- Match exceptions
- On hold
- Scheduled payments

## Primary table

```text
Vendor
Bill
PO
Original Amount
Paid
Vendor Credits
Open Balance
Due Date
Approval
Match
Hold
Scheduled Payment
```

## Row actions

- Open Bill
- Approve / Return / Reject when authorized
- Review PO match
- Put on Hold / Release Hold
- Dispute
- Schedule Payment
- Post Payment
- Apply Vendor Credit

Rules:

- Approval does not reduce A/P.
- Scheduling does not reduce A/P.
- Hold/dispute does not reduce A/P.
- Payment/credit does.

---

# 8. TREASURY

The Treasury workspace answers:

> How much cash do we have, where is it, what is coming, what is leaving, and are our bank books reconciled?

## Summary metrics

- Total Book Cash
- Available Cash
- Expected In 7 Days
- Expected In 30 Days
- Scheduled Out 7 Days
- Scheduled Out 30 Days
- Forecast Ending Cash
- Unreconciled Accounts

## Account table

```text
Account
Institution
Last 4
Type
Book Balance
Statement Balance
Available
Last Reconciled
Difference
```

## Account actions

- View Activity
- Reconcile
- Internal Transfer
- Authorized Adjustment
- Opening Balance only during initial setup/correction workflow

Rules:

- Never expose casual Edit Balance.
- Internal transfers are zero net company cash.
- Reconciliation difference is explained, not overwritten.

## Cash forecast

Horizons:

- 7 days
- 30 days
- 60 days
- 90 days

Inputs:

- open receivables due
- payment promises where treated as forecast only
- scheduled A/P
- recurring/known obligations where canonical
- settlement payouts where approved/scheduled

Forecast is decision support, not posted cash.

---

# 9. GENERAL LEDGER

The GL workspace answers:

> Did every Financial Document receive the correct accounting treatment and are the books internally controlled?

## Summary controls

- Unposted Financial Documents
- Posting Exceptions
- Journal Balance Status
- A/R Control Difference
- A/P Control Difference
- Cash Control Difference
- Bank Reconciliation Status
- Current Period Status

## Journal table

```text
JE Number
Date
Period
Source
Description
Debit Total
Credit Total
Posting Rule
Status
Posted By
```

Row drill:

- journal lines
- dimensions
- source Financial Document
- original TRAN$ACT record
- evidence
- reversal history

## Posting exception queue

Exception shows:

- source record
- proposed accounting context
- missing/ambiguous classification
- reason it could not auto-post
- allowed resolution

Accounting can:

- classify this transaction
- update future mapping if authorized
- post after validation

No browser guess should silently clear an exception.

---

# 10. ADJUSTMENTS

Authorized accountants can create manual adjusting journals.

Required:

- period/date
- description
- debit line(s)
- credit line(s)
- reason
- attachment/evidence where policy requires
- preparer
- approver where required

System requirements:

- debits = credits
- closed-period policy enforced
- immutable posted entry
- correction via reversal/new JE

Support auto-reverse metadata for accrual entries.

---

# 11. PERIOD CLOSE

The Close workspace is a controlled checklist, not a single button.

Required checks:

```text
All journals balanced
No unposted required Financial Documents
No unresolved posting exceptions
A/R subledger agrees to GL
A/P subledger agrees to GL
Treasury cash agrees to GL
Required bank accounts reconciled
Required adjustments posted/approved
No blocking prior-period items
```

If blocked:

- show blocker count
- show exact blocker
- link to resolution workspace

If ready:

- show Ready to Close
- require proper authority
- create close record/snapshot
- lock normal posting into the period

Reopen, if supported later, must itself be an authorized auditable event.

---

# 12. FINANCIAL REPORTING

## Profit & Loss

Functions:

- current period
- YTD
- comparative prior period
- account-group expansion
- drill to journal/source

## Balance Sheet

Functions:

- as-of period/date
- Assets / Liabilities / Equity
- current earnings presentation
- balance difference control

## Cash Flow

Functions:

- Operating
- Investing
- Financing
- internal transfers excluded
- unclassified cash highlighted

## Trial Balance

Functions:

- account
- debit
- credit
- difference
- source drill

## Profitability

Group by:

- Asset / Passport
- Location
- Customer
- Work Order / Service
- Rental
- other supported dimensions

Values:

- Revenue
- Expense/Cost
- Net Income
- Margin

---

# 13. ASSET PROFITABILITY FLOW

Example user flow:

```text
Profitability
→ Group By Asset
→ CAT 336
→ Revenue / Cost / Margin
→ Expand Cost
→ Repairs & Maintenance
→ JE-28491
→ BILL-19483
→ WO-1058
→ CAT 336 Passport
→ supporting invoice / receiving / notes
```

This source chain should be available without manually searching five modules.

---

# 14. CUSTOMER FINANCIAL VIEW

Customer drill should aggregate:

- lifetime invoiced
- lifetime collected
- open A/R
- overdue
- average days to pay when enough data exists
- broken promises
- disputes
- service revenue
- rental revenue
- equipment-sale revenue
- profitability where dimensional data supports it

Future policy can expose customer-credit warnings to sales/service workflows.

---

# 15. VENDOR FINANCIAL VIEW

Vendor drill should aggregate:

- lifetime bills
- open A/P
- overdue
- scheduled payments
- credits
- disputed bills
- PO volume
- match exception rate when supported
- spend by category
- spend by asset/location

---

# 16. ASSET FINANCIAL VIEW

Asset drill should aggregate:

- Acquisition snapshot
- capitalized initial costs
- in-service date
- lifetime repairs/maintenance
- rental income
- service-related economics where applicable
- sale/disposition
- settlement
- book accounting values when fixed-asset subsystem exists
- profitability

Do not confuse Acquisition cost with lifetime economic cost.

---

# 17. SEARCH

Global search supports:

- record number
- vendor/customer name
- asset make/model
- serial number
- Passport ID
- invoice number
- PO number
- Work Order number
- journal number

Search result categories should be grouped and clearly labeled.

---

# 18. SAVED VIEWS

Future/phase-two function:

User can save filter/table/report states such as:

- `My Overdue A/R`
- `Bills Due This Week`
- `Midland Yard Profitability`
- `Owner Close Review`

Saved views contain UI scope only. They do not snapshot financial truth unless explicitly saved as a report snapshot.

---

# 19. EXPORT

Minimum export actions:

- CSV/Excel table detail
- PDF report
- Print

Exported report must state:

- IXI TRAN$ACT
- entity
- period/as-of date
- filters
- currency
- generated by
- generated at
- open/closed period status

---

# 20. LANGUAGE

The full-size dashboard should support the same translation doctrine as V13 modules:

- single business logic
- single data contract
- localized labels/text
- no duplicated Spanish component tree

Mexican Spanish is the default Spanish target where TRAN$ACT currently supports Spanish.

---

# 21. EMPTY / SETUP STATES

Examples:

## No financial accounts

```text
CASH / TREASURY
No Financial Accounts Configured
+ Add Bank Account
+ Add Cash Account
```

## No Chart of Accounts

```text
GENERAL LEDGER
Accounting setup required.
Configure Chart of Accounts before posting.
```

## No activity in period

Say `NO ACTIVITY` rather than presenting fake `0` comparisons that imply data was successfully loaded.

---

# 22. DATA FRESHNESS

Every full-size page should be capable of showing:

```text
Data Source: IXI Financial
Last Refresh: timestamp
Projection Version
Status: Current / Refreshing / Stale / Partial / Error
```

For stale/partial/error state, do not silently continue presenting data as current.

---

# 23. PERMISSION EXPERIENCE

Examples:

## A/R collector

Can see A/R and post authorized customer payment. Cannot see Period Close.

## A/P clerk

Can enter/review Bills and schedule allowed payments. Cannot approve beyond authority.

## Controller

Can manage GL mappings, adjustments, reconciliation and close.

## Owner/CFO

Can see all reporting and high-dollar approval/settlement/close controls.

The visible UX follows permissions, but server enforcement remains authoritative.

---

# 24. FULL USER FLOW — DAILY ACCOUNTING

```text
Open IXI TRAN$ACT
   ↓
Review Attention
   ↓
Resolve A/R / A/P / bank / posting items
   ↓
Run or review payments/collections
   ↓
Refresh projections
   ↓
Review cash position
   ↓
Review profitability / reporting
```

---

# 25. FULL USER FLOW — MONTH END

```text
Review A/R aging
Review A/P aging
Reconcile bank/cash accounts
Resolve posting exceptions
Post adjustments/accruals
Confirm control accounts
Review Trial Balance
Review P&L / Balance Sheet
Review close checklist
   ↓
CLOSE PERIOD
   ↓
Generate management reports
```

---

# 26. FULL USER FLOW — OWNER

```text
Open Executive Summary
   ↓
Revenue / Profit / Cash / A/R / A/P
   ↓
Attention panel
   ↓
High-dollar approval / settlement / exception
   ↓
Profitability by asset/location/customer
   ↓
Cash forecast
   ↓
Financial statements
```

The owner should not have to navigate the Journal unless investigating a number.

---

# 27. UX ACCEPTANCE CRITERIA

The page fails if:

- the default screen is just a giant table,
- users must re-enter known context,
- users cannot drill from totals to sources,
- field-sized V13 buttons are simply enlarged across desktop,
- accounting concepts are exposed to users who do not need them,
- balances are locally editable,
- summary charts disagree with card/subledger calculations,
- errors render as legitimate zeros,
- filters are ambiguous,
- a closed period can be silently changed.

The page succeeds when the user can move from **company-level financial condition → specific action → source evidence** without leaving the IXI financial system.
