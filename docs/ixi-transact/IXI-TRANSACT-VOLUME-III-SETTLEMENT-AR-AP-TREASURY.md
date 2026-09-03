# IXI TRAN$ACT — VOLUME III
## Settlement, Collections / A/R, Payables / A/P and Cash / Treasury

**Status:** Canonical engineering doctrine  
**Read after:** Volume II

---

# 1. SETTLEMENT

Directory:

`components/ixi-aos/transact/modules/settlement/`

Settlement is an owner/accounting closeout system. It consumes the canonical Sale record and the full related economic history.

It is intentionally separate from SOLD.

SOLD answers:

> What was sold, to whom, when and for how much?

Settlement answers:

> After collections, costs, debt, ownership, capital and prior distributions, what is economically due to each owner/partner and has it actually been paid?

Typical identity:

`STL-#####`

Settlement consumes:

- SALE-#####
- buyer collections / open receivable
- Asset Acquisition
- acquisition/make-ready economics
- post-acquisition costs
- asset/rental income
- selling costs
- lien/payoff obligations
- current ownership
- ownership history
- capital contributions
- owner advances/reimbursements
- prior distributions
- owner payout events

## Economic profit and cash available are different

Settlement must calculate both.

Example economic view:

```text
ACTUAL READY COST
+ POST-ACQUISITION COSTS
- ASSET INCOME
= NET ECONOMIC INVESTMENT

SALE VALUE
- SELLING COSTS
= NET SALE VALUE

NET SALE VALUE
- NET ECONOMIC INVESTMENT
= ECONOMIC PROFIT / LOSS
```

Cash settlement is different:

```text
BUYER CASH ACTUALLY RECEIVED
- SELLING COSTS PAID
- LIEN / DEBT PAYOFFS
- APPROVED OWNER REIMBURSEMENTS
= CASH AVAILABLE FOR DISTRIBUTION
```

Do not distribute uncollected sale proceeds as though cash already exists.

## Liens/payoffs

A lien/payoff reduces settlement economics/cash whether it is currently open or has already been paid.

`PAID` means it no longer blocks closing; it does not mean the payoff disappears from the waterfall.

## Owner reimbursements vs capital

An approved reimbursement is not automatically a capital-account reduction.

Capital changes only through explicit capital events.

Keep these concepts separate.

## Waterfall

The default architecture supports:

```text
available cash
→ required liabilities/payoffs
→ approved owner reimbursements
→ capital return according to agreement
→ remaining profit/loss allocation
→ less prior distributions
→ final amount due per owner
```

Legal ownership %, profit share %, loss share % and settlement share may default to the same value but must not be permanently assumed identical.

## Approval vs payout

Approving Settlement establishes entitlement.

It does not mean owners were paid.

Actual owner distributions are separate canonical payment events.

Typical states:

```text
DRAFT
READY
APPROVED
PARTIALLY PAID
SETTLED
VOID
```

Final close should block on unresolved conditions such as buyer balance, open payoff, ownership-share imbalance or waterfall imbalance according to policy.

---

# 2. COLLECTIONS / ACCOUNTS RECEIVABLE

Directory:

`components/ixi-aos/transact/modules/collections/`

Collections is an operational A/R control system sitting above canonical receivables and payments.

Doctrine:

> Invoice/Sale creates A/R. Payment reduces A/R. Collections manages the unresolved balance.

Collections does not create revenue and does not manufacture cash.

Generic receivable equation:

```text
ORIGINAL RECEIVABLE
- PAYMENTS
- APPROVED CREDITS / WRITE-OFFS
= OPEN A/R
```

Aging is derived from open balance + due date + current date.

## Command-center function

Collections should answer:

> Who owes us money, how much, how late, and what needs attention today?

Useful buckets:

- Total A/R
- Current
- 1–30
- 31–60
- 61–90
- 90+
- Due today
- Overdue
- Promises due
- Disputed
- Needs follow-up

## Collection Case

Operational case identity can be `COLL-#####` and should reference the canonical receivable rather than replacing it.

Case data can include:

- assigned collector
- contact attempts
- emails/calls/notes
- next action
- promise-to-pay events
- dispute records
- escalation
- collection status

## Promise to pay

Promise-to-pay is a first-class operational fact.

```text
PROMISED $25,000 FRIDAY
```

does not reduce A/R.

Only actual payment reduces A/R.

The system can later mark promises kept/broken based on actual payment evidence.

## Dispute

Customer disagreement does not rewrite the invoice.

A dispute records:

- disputed amount
- reason
- owner
- status
- evidence

A/R changes only if accounting posts a real credit/write-off/adjustment.

## Hard controls

- Payment cannot exceed open A/R.
- Credit/write-off cannot exceed open A/R.
- Dispute does not reduce A/R.
- Promise does not reduce A/R.
- Collections must remain generic across Sale, Service Invoice, Rental and future receivable sources.

---

# 3. PAYABLES / ACCOUNTS PAYABLE

Directory:

`components/ixi-aos/transact/modules/payables/`

Payables is the liability-side control system over canonical Bills and payments.

Doctrine:

> Bill creates the obligation. A/P manages the open obligation. Payment or vendor credit changes the liability.

Generic payable equation:

```text
BILL AMOUNT
- ACTUAL PAYMENTS
- VENDOR CREDITS
= OPEN A/P
```

A/P command center should surface:

- Total A/P
- Current
- Due today
- Due this week
- Overdue
- Needs approval
- Match exceptions
- Disputed
- Payment scheduled
- On hold

## Persistent payable control

A payable record/control view should show:

- vendor
- bill number
- original amount
- payments
- vendor credits
- open balance
- due date / aging
- approval state
- PO / three-way match state
- hold state
- dispute state
- scheduled payments
- documents/activity

## Hard controls

- Approval does not reduce A/P.
- Dispute does not reduce A/P.
- Hold does not reduce A/P.
- Scheduled payment does not reduce A/P.
- Actual payment cannot exceed open A/P.
- Vendor credit cannot exceed open A/P.
- Stacked scheduled payments must not exceed open A/P.
- A hold can block scheduling/execution according to policy.

Actual cash out must post through canonical IXI Financial payment semantics and retain related Bill/payable identity.

---

# 4. CASH / TREASURY

Directory:

`components/ixi-aos/transact/modules/treasury/`

Treasury answers:

> What cash do we have now, what is expected in, what is scheduled out, and what will cash look like over the next 7 / 30 / 60 / 90 days?

Treasury controls timing and account balances. It does not create revenue/expense truth.

## Financial Account object

Treasury requires first-class financial accounts such as:

- operating checking
- payroll checking
- savings
- cash / petty cash
- clearing
- money market

Account data includes:

- account ID
- entity / Passport relationship
- account type
- institution
- masked/last-4 identity
- currency
- opening date
- opening balance event
- current book balance
- statement balance
- reconciliation status

## Opening Balance

The first time an existing account enters IXI, establish a canonical Opening Balance.

Example:

```text
ACCOUNT
Operating Checking

AS OF
2026-08-16

OPENING BOOK BALANCE
$428,512.47

SOURCE
Bank statement
```

Opening Balance is not revenue and not a fake deposit.

After opening, do not expose casual `EDIT BALANCE`.

## Book balance equation

```text
OPENING BALANCE
+ CASH IN
- CASH OUT
± AUTHORIZED BOOK ADJUSTMENTS
= CURRENT BOOK CASH
```

## Adjustments

A real missed book-side event can create an authorized adjustment with:

- amount
- direction
- effective date
- reason/category
- actor
- supporting document

Never silently rewrite the existing balance.

## Internal transfers

A transfer between company cash accounts is a canonical transfer relationship:

```text
Operating -100,000
Payroll   +100,000
Company net cash change = 0
```

It must not appear as expense/revenue or distort company cash flow.

## Reconciliation

Bank reconciliation compares book truth to external statement truth.

```text
BANK STATEMENT BALANCE
+ deposits in transit
- outstanding payments
± reconciling items
= adjusted bank balance

compare with
IXI BOOK BALANCE
```

A difference remains an exception until explained/posted. Reconciliation must not force the ledger balance to match the bank.

Physical cash can use the same doctrine:

```text
SYSTEM CASH
vs
PHYSICAL COUNT
→ variance
→ recount or authorized variance adjustment
```

## Forecasting

Treasury can project:

- current cash
- expected A/R inflows
- promise/collection timing where appropriate as forecast, not cash truth
- scheduled A/P outflows
- settlement payouts
- loan/recurring obligations
- 7/30/60/90-day ending cash

Forecast partially paid receivables/payables using the remaining balance, not original gross amount.

## Production implementation contract

Treasury writes cross the authenticated Financial Command boundary and persist in IX-Core/DynamoDB as:

- `treasury-account` / `ixi-treasury-account-v2` — Entity-bound, non-economic account control.
- `payment.treasuryMovement` / `ixi-treasury-movement-v2` — immutable opening, adjustment, or transfer event with canonical account IDs.
- `treasury-reconciliation` / `ixi-treasury-reconciliation-v2` — immutable statement comparison using the server-verifiable book balance.

IX-Core enforces trusted Entity and actor lineage, Treasury-specific permissions, same-Entity and same-currency account checks, one opening event per account, negative-cash policy, idempotency, and immutable event history. DynamoDB writes the financial document, balance projection, opening lock, and both transfer legs in one transaction; reconciliation condition-checks the submitted book balance in that same atomic boundary. The generic document write routes reject Treasury records so callers cannot bypass the controlled command path.

The browser derives balances only from canonical IX-Core records. A command response may be displayed immediately, but it is de-duplicated by `financialDocumentId` and followed by a full financial-record refresh. No browser-local record can establish production cash truth.

---

# 5. FINANCIAL CONTROL INVARIANTS

These rules are non-negotiable:

```text
PROMISE ≠ PAYMENT
DISPUTE ≠ CREDIT
APPROVAL ≠ PAYMENT
SCHEDULED PAYMENT ≠ PAYMENT
SALE PRICE ≠ CASH RECEIVED
SETTLEMENT APPROVED ≠ OWNER PAID
BANK STATEMENT ≠ BOOK BALANCE
```

The system should represent all of these truths simultaneously rather than forcing one status field to mean everything.

Continue with **Volume IV — General Ledger, Period Close, Reporting, AWS Boundaries and Enterprise Rules**.
