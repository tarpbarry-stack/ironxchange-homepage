# IXI TRAN$ACT — VOLUME IV
## General Ledger, Period Close, Financial Reporting, AWS Boundaries and Enterprise Engineering Rules

**Status:** Canonical engineering doctrine  
**Read after:** Volume III

---

# 1. GENERAL LEDGER / CLOSE

Directory:

`components/ixi-aos/transact/modules/general-ledger/`

General Ledger does not replace TRAN$ACT business records.

Doctrine:

```text
TRAN$ACT creates business truth
        ↓
IXI Financial creates canonical financial truth
        ↓
Posting Engine classifies accounting treatment
        ↓
Balanced Journal Entry
        ↓
General Ledger
```

Field users should not select debit/credit accounts.

Accounting should manage:

- Chart of Accounts
- mappings/posting rules
- exceptions
- manual adjustments
- reconciliations
- period close

## Journal identity

Canonical Journal identity:

`JE-#####`

Each posted Journal must preserve source lineage:

- source Financial Document ID
- source document type
- source document number
- accounting period
- posting rule ID/version
- entity Passport
- dimensions
- debit/credit lines
- actor/timestamp/audit

## Balanced journals only

Every posted journal must satisfy:

```text
TOTAL DEBITS = TOTAL CREDITS
```

Unbalanced journals are invalid and cannot post.

## Immutability

Posted journals are never edited or deleted.

Corrections happen through:

- reversal journal
- correcting journal

The original remains visible forever.

## Idempotency

Posting must be server-idempotent.

A retry/refresh must not create a duplicate Journal for the same source financial event and posting-rule version.

A durable identity should include the source Financial Document + posting event/rule version.

## Posting rules

Posting rules can consider:

- document type
- category
- entity
- location
- asset class
- department
- customer/vendor type
- Work Order type
- acquisition/in-service state

But business users should never be forced to understand those rules at transaction-entry time.

## Asset sale caution

Do not blindly post an equipment Sale as ordinary sales revenue when accounting classification is unknown.

Dealer inventory, fixed assets, book basis and accumulated depreciation can require different accounting treatment.

When the information is insufficient, create an **accounting exception** rather than confidently posting the wrong entry.

## Cash caution

An incoming Payment should only clear A/R when it has reliable receivable linkage.

An outgoing Payment should only clear A/P when it has payable/Bill linkage, or another explicit accounting relationship such as approved owner Settlement payout.

Unknown cash is an exception, not a guess.

---

# 2. CHART OF ACCOUNTS

The system supports a real company-defined Chart of Accounts.

Example account families:

```text
1000 CASH
1100 ACCOUNTS RECEIVABLE
1200 INVENTORY
1500 EQUIPMENT / FIXED ASSETS
1600 ACCUMULATED DEPRECIATION
2000 ACCOUNTS PAYABLE
2100 CREDIT CARDS
2200 DEBT / LOANS
3000 EQUITY
4000 REVENUE
5000 COST OF SALES
6000 OPERATING EXPENSE
```

Company labels are authoritative.

Do not infer business meaning from arbitrary user-facing names when stable semantic metadata/capabilities exist.

Use dimensions instead of exploding the Chart of Accounts into hundreds of accounts for every machine/location/customer.

Useful dimensions include:

- entityPassportId
- assetPassportId
- locationPassportId
- customerPassportId
- vendorPassportId
- workOrderId
- department / business unit
- owner/partner where appropriate

---

# 3. MANUAL / ADJUSTING JOURNAL ENTRIES

Accounting needs a controlled manual JE path.

Required data should include:

- accounting date / period
- description
- debit line(s)
- credit line(s)
- amount(s)
- reason
- supporting evidence/document
- prepared by
- approval where policy requires

Support auto-reversing accruals in the data model.

Example:

```text
AUG 31 ACCRUAL
DR Outside Service Expense
CR Accrued Liabilities

AUTO REVERSE SEP 1
DR Accrued Liabilities
CR Outside Service Expense
```

---

# 4. PERIOD CLOSE

Accounting periods should have explicit states:

```text
OPEN
CLOSE IN PROGRESS
CLOSED
REOPENED (controlled, if policy allows)
```

Closing should run a control checklist.

Examples:

- all journals balanced
- no unposted Financial Documents in scope
- no unresolved posting exceptions
- A/R subledger agrees to GL A/R control
- A/P subledger agrees to GL A/P control
- Treasury cash agrees to GL cash control
- required bank accounts reconciled
- required adjustments approved
- no unauthorized prior-period postings

If required controls fail, Close must remain blocked.

A closed period creates durable close evidence including period, actor/time, trial-balance snapshot, reconciliations/control checks, rule version and journal population.

Closed periods must not be silently rewritten by later transaction entry.

---

# 5. SUBLEDGER CONTROL

Operational subledgers and GL control accounts must reconcile.

Examples:

```text
A/R SUBLEDGER
vs
GL A/R CONTROL
→ difference must be zero

A/P SUBLEDGER
vs
GL A/P CONTROL
→ difference must be zero

TREASURY BOOK CASH
vs
GL CASH CONTROL
→ difference must be zero
```

A difference creates a control exception.

Do not hide the mismatch by changing one side to match the other.

---

# 6. FINANCIAL REPORTING

Directory:

`components/ixi-aos/transact/modules/financial-reporting/`

Reporting is read-only.

It consumes posted, unreversed Journal lines and company Chart of Accounts.

It must not:

- create transactions
- edit Financial Documents
- mutate Journals
- change closed periods

Core report families:

- Executive Summary
- Profit & Loss
- Balance Sheet
- Cash Flow
- Trial Balance
- Profitability / dimensional reporting

## P&L

For a selected period range:

```text
REVENUE
- EXPENSES
= NET INCOME
```

Support prior-period comparison and margin.

## Balance Sheet

As-of selected period:

```text
ASSETS
= LIABILITIES + EQUITY
```

Open-period Current Earnings must be presented in Equity so the statement remains balanced before formal retained-earnings/year-end closing.

Current Earnings should be fiscal-year aware, not company-lifetime income.

## Cash Flow

Cash Flow is derived from actual posted cash Journal lines.

Classifications:

- Operating
- Investing
- Financing
- Unclassified exception

Internal Treasury transfers are excluded from company-level net cash flow.

If classification is not supportable from source/counterpart metadata, show unclassified cash rather than inventing a classification.

## Trial Balance

Reporting independently verifies debit/credit totals.

If not equal, surface **OUT OF BALANCE**.

## Profitability dimensions

Use journal dimensions to report profitability by:

- asset / Passport
- location
- customer
- Work Order / service
- rental
- department
- owner/partner where properly modeled

Do not create separate spreadsheets or duplicate revenue/expense stores for each dimension.

---

# 7. FULL-SIZE IXI TRAN$ACT ACCOUNTING PAGE

The V13 cards remain object-level operational applications.

The full-size page is the office/accounting command center over the same domain engines.

It must not reimplement equations independently from the card/domain systems.

Read these separate dashboard specs:

```text
docs/IXI-TRANSACT-ACCOUNTING-DASHBOARD-DOSSIER.md
docs/IXI-TRANSACT-ACCOUNTING-DASHBOARD-ENGINEERING-BUILD-SPEC.md
docs/IXI-TRANSACT-ACCOUNTING-DASHBOARD-FUNCTIONALITY-SPEC.md
```

The full-size page should support enterprise-scale entity/period queries and drilldown rather than loading the company's full financial history into the browser.

---

# 8. AWS IXI FINANCIAL CONTRACT

Shared runtime adapter:

`components/ixi-aos/financial-runtime/IXIAosFinancialRuntimeAdapter.js`

The adapter resolves:

- object Passport
- object type
- object label
- financial reference role
- merged references
- Passport/scope snapshot targets
- Financial command execution

Conceptual command flow:

```text
V13 / full-size module
        ↓
AOS Financial Runtime Adapter
        ↓
Financial Command Client
        ↓
POST /financial/commands/create
        ↓
AWS IX-Core
        ↓
canonical financial persistence / projections
        ↓
AOF2 / scoped financial snapshot
```

Do not make browser-side success equivalent to proof that every semantic document type is registered and accepted by the production AWS server.

Server-side document vocabulary and projection behavior must be validated end-to-end.

---

# 9. SEMANTIC FINANCIAL DOCUMENT TYPES

Current architecture uses established/semantic types such as:

- expense
- purchase-order
- bill
- payment
- invoice
- work-order
- time-entry
- credit
- journal-entry
- period-close

Other TRAN$ACT control records may have operational identities outside the core Financial Document vocabulary while their money effects use canonical Financial types.

Avoid encoding accounting semantics as fake payments/bills simply because a frontend path compiles.

---

# 10. RELATIONSHIP / PASSPORT DOCTRINE

Financial facts should retain relationships to stable AOS objects using Passport identity.

Examples:

- asset
- location
- entity
- customer
- vendor
- employee
- technician
- job / Work Order
- owner/partner

One Financial Document can participate in multiple projections without being duplicated.

Example:

```text
BILL-19482
→ Vendor A/P
→ Midland Yard cost
→ CAT 336 economics
→ WO-1058 cost
→ Entity GL
```

This is one Bill with multiple relationships, not four Bills.

---

# 11. AUTHORITY / PERMISSIONS DOCTRINE

The long-term system uses layers:

```text
Company Policy
    ↓
Role / Person Authority
    ↓
Record state
    ↓
Runtime action availability
```

Examples:

- purchasing thresholds
- Bill approval authority
- variance approval
- payment authority
- write-off authority
- Settlement approval
- manual Journal authority
- period-close authority

Cards/pages should expose only the actions the current user can perform.

Centralized policy/authority enforcement is an enterprise-hardening area and must not be faked with only hidden buttons when server-side authorization matters.

---

# 12. IDENTITY / AUDIT DOCTRINE

Canonical operational identities include examples such as:

```text
WO-#####
TECHWO-######
PO-#####
BILL-#####
SQ-#####
CSWO-######
SINV-#####
SALE-#####
COLL-#####
STL-#####
JE-#####
CLOSE-YYYY-MM
```

Identity is not merely UI text. It provides lineage and idempotency anchors.

Audit history should preserve:

- created by / at
- state transitions
- approvals/rejections/returns
- financial commands
- documents
- corrections/reversals
- payouts/payments
- reconciliation/close evidence

---

# 13. ENTERPRISE ANTI-PATTERNS

Future engineers/chats must not:

- build a parallel React-only financial ledger
- calculate authoritative A/R/A/P only in the browser
- overwrite cash to match a bank statement
- mutate posted Journals
- erase source history after reversal/correction
- treat Sale price as collected cash
- treat promise-to-pay as payment
- treat dispute as credit
- treat approval or scheduling as payment
- treat Settlement approval as payout
- duplicate documents/financial records merely for visibility in multiple AOS objects
- hardcode company vocabulary from UI labels when semantic metadata exists
- infer asset-sale GL treatment without basis/classification
- load the entire company ledger into a dashboard browser session
- change V13 card geometry to solve content problems
- fork business logic by language

---

# 14. CURRENT ENTERPRISE BOUNDARIES

The system is substantial but not finished in every enterprise dimension.

Read:

`docs/IXI-TRANSACT-FINANCIAL-SYSTEM-COMPLETENESS-AUDIT.md`

Known categories requiring verification/future work include:

- production AWS support for newer semantic types/projections
- centralized permissions/policy enforcement
- production-scale financial query/read services for the full-size dashboard
- automated bank feeds and richer reconciliation
- payroll
- fixed-asset depreciation subsystem
- tax engine
- multi-entity consolidation/eliminations
- formal budgets/forecasts
- year-end retained-earnings close policy

Do not call these complete merely because the frontend builds.

---

# 15. BUILD / REGRESSION METHOD

When changing TRAN$ACT:

1. Read `docs/IXI-TRANSACT-READ-FIRST.md` and all required volumes/specs.
2. Identify which layer owns the truth being changed.
3. Inspect the existing contract/engine/commands/app/styles for that domain.
4. Reuse Financial Runtime Adapter rather than new plumbing.
5. Preserve Passport/source lineage.
6. Use deterministic pure engines for economic/accounting calculations.
7. Validate invariants and exception states.
8. Prove UI in Face Lab where appropriate.
9. Integrate into TRAN$ACT registry/runtime deliberately.
10. Run Vercel/build checks.
11. Separately validate AWS behavior for server-dependent changes.
12. Update documentation if doctrine/contracts change.

---

# 16. COMPLETE READING CHAIN

After this volume, read:

- `docs/IXI-TRANSACT-FINANCIAL-SYSTEM-COMPLETENESS-AUDIT.md`
- `docs/IXI-TRANSACT-ACCOUNTING-DASHBOARD-DOSSIER.md`
- `docs/IXI-TRANSACT-ACCOUNTING-DASHBOARD-ENGINEERING-BUILD-SPEC.md`
- `docs/IXI-TRANSACT-ACCOUNTING-DASHBOARD-FUNCTIONALITY-SPEC.md`

The four IXI TRAN$ACT volumes plus those dashboard/completeness files form the current canonical financial engineering handoff.
