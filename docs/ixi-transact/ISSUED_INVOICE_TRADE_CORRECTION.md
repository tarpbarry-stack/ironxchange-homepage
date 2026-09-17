# Add an omitted trade after invoice issue

An issued invoice and its signed order remain historical documents. The order's
Trade-In section now offers the existing create/select machine form for an open
issued sale. Saving records a separate, immutable `trade-credit` document linked
to the invoice, order, Deal ID and incoming canonical machine. It does not rewrite
the original order, invoice, signature package or received payment.

The machine is resolved through the existing Sharetribe onboarding workflow.
The credit uses one deterministic financial identity per company, invoice and
incoming Passport. Identical retries return the same document; changed retries
and duplicate machines are rejected. The command checks scope, open period,
remaining balance, existing trades and sale/settlement state. Its atomic write
includes the credit balance counter and a condition on the source invoice's
revision, so a concurrent invoice closeout cannot be silently crossed.

Trade credits reduce A/R but do not reduce sale revenue, reduce outgoing-machine
cost, create cash or establish ownership. The correction is shown alongside the
original invoice, and the same incoming card opens its separate acquisition and
Launch links. A corrected trade's acquisition cites the credit supplement, which
IX-Core resolves back to the original order and verified machine. SOLD rechecks
every acquisition. Settlement retains gross consideration and distributes only
actual available cash. General-ledger posting routes the noncash trade credit to
acquisition-clearing review rather than guessing a vendor or revenue-credit entry.

Tests cover the real React editor's existing-machine picker, worksheet expansion,
parent Save action, allowance bounds, linked credit, unchanged issued documents
and acquisition source. Core HTTP and contract tests cover company scope,
duplicate/retry behavior, multiple trades, invoice revision guards, acquisition
closeout checks, gross revenue, cost, SOLD inventory and settlement treatment.

Operator acceptance: open an issued invoice, choose Open Trades, Select Existing,
select the incoming machine, enter its allowance, review credit date and reason,
then Save Trade. A sale of 75,000 with a 65,000 trade and an existing 10,000 receipt
must show zero customer balance. Acquisition and SOLD remain separate actions.
No real machine, acquisition, credit, payment or closeout is entered by deployment.
