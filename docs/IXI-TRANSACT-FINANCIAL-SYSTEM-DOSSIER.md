# IXI TRAN$ACT — FINANCIAL SYSTEM DOSSIER

**Status:** Canonical master index  
**Repository:** `tarpbarry-stack/ironxchange-homepage`  
**Reason for this structure:** The original single-file dossier was too large and was physically truncated mid-`SOLD / ASSET SALE`. This file is now intentionally short and delegates the complete doctrine to four smaller authoritative volumes that GitHub can reliably return in full.

---

# READ THIS FIRST

Start with:

`docs/IXI-TRANSACT-READ-FIRST.md`

Then read all four volumes below **in order**.

## Volume I — Foundation and Operations

`docs/ixi-transact/IXI-TRANSACT-VOLUME-I-FOUNDATION-AND-OPERATIONS.md`

Covers:

- canonical AOS → TRAN$ACT → IXI Financial architecture
- runtime files
- V13 UI doctrine
- command bus / action notice system
- Work Order
- Tech Work Order
- Expense
- Purchase Order
- Bill / Invoice
- Receipt
- Time
- Part / Material
- document/photo/note relationship doctrine

## Volume II — Asset, Ownership, Rental and External Service Lifecycle

`docs/ixi-transact/IXI-TRANSACT-VOLUME-II-ASSET-OWNERSHIP-RENTAL-SERVICE.md`

Covers:

- Asset Acquisition
- in-service cutover
- ownership partners / ownership changes / buyouts
- Rental Expense
- Rental Income
- Service Quote
- Customer Service Work Order
- change-order/commercial authorization doctrine
- Service Invoice
- SOLD / Asset Sale
- Sale → receivable/payment flow
- full asset lifecycle

## Volume III — Settlement, A/R, A/P and Treasury

`docs/ixi-transact/IXI-TRANSACT-VOLUME-III-SETTLEMENT-AR-AP-TREASURY.md`

Covers:

- Settlement
- economic profit vs cash available
- liens/payoffs
- capital vs reimbursements
- owner waterfall / payouts
- Collections / A/R
- promise-to-pay and dispute doctrine
- Payables / A/P
- payment scheduling/holds/credits
- Cash / Treasury
- Opening Balance
- adjustments
- internal transfers
- reconciliation
- forecasting

## Volume IV — GL, Reporting, AWS and Enterprise Engineering Rules

`docs/ixi-transact/IXI-TRANSACT-VOLUME-IV-GL-REPORTING-AWS-ENTERPRISE.md`

Covers:

- General Ledger
- Chart of Accounts
- posting rules
- balanced Journal contract
- immutability / reversals / idempotency
- manual adjusting entries
- Period Close
- subledger controls
- Financial Reporting
- P&L / Balance Sheet / Cash Flow / Trial Balance / profitability
- AWS IXI Financial runtime contract
- Passport/reference doctrine
- authority/permissions doctrine
- audit/identity doctrine
- enterprise anti-patterns
- incomplete/verification boundaries
- build/regression method

---

# COMPLETE FOLLOW-ON DOCUMENTATION

After all four volumes, read:

`docs/IXI-TRANSACT-FINANCIAL-SYSTEM-COMPLETENESS-AUDIT.md`

Then for the full-size office/accounting page named **IXI TRAN$ACT**, read:

`docs/IXI-TRANSACT-ACCOUNTING-DASHBOARD-DOSSIER.md`

`docs/IXI-TRANSACT-ACCOUNTING-DASHBOARD-ENGINEERING-BUILD-SPEC.md`

`docs/IXI-TRANSACT-ACCOUNTING-DASHBOARD-FUNCTIONALITY-SPEC.md`

---

# CORE DOCTRINE

```text
AOS / Passport = business context and relationships
TRAN$ACT = operational/commercial truth
AWS IXI Financial = canonical financial truth
General Ledger = accounting truth
Financial Reporting = read-only accounting projection
Full-size IXI TRAN$ACT = office/accounting command center over the same domain engines
```

Do not build a parallel frontend financial ledger.
Do not reimplement card-domain equations independently in the dashboard.
Do not treat Vercel-green as proof of server-side AWS completion.
Do not skip any volume because a prior chat claims to remember the system.
