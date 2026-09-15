# SOLD environment and inventory lifecycle

The initial paired release was merged and deployed on September 15, 2026. This document records verified release evidence and the historical-price compatibility correction.

## Business contract

- RECORD SOLD stays in the TRAN$ACT sales cycle. A completed, collected sale drives inventory visibility.
- The same Object and Passport survive every sale, return, adjustment, and later acquisition.
- Company and sale/deal scope are mandatory; sold is not a global ownership label on a Passport.
- Settlement is independent of inventory. Open settlement does not retain a sold machine in owned inventory.
- The Sold front uses the existing listing card shell. It shows SOLD, actual machine sale price, original sale date, buyer, actual salesperson, and settlement open/closed.
- Recorded by/on are audit facts, separate from sold by/on. Missing historical salesperson information is not invented.
- Active inventory surfaces, previews, totals, pockets and stacks exclude sold machines. Underlying relationships and financial history remain intact.
- Existing TRAN$ACT stays open after save. Navigating to Sold is optional.
- Customer credits, customer refunds and possession returns are distinct. A partial refund does not restore owned inventory.
- A return records linked evidence and restores private inventory; it never deletes the original sale/payment.
- No test or migration may close an accounting period or manufacture a customer's sale, receipt or refund.

## Release gates

Forward sale and reverse return; duplicate/retry/concurrent submissions; zero-balance credit without cash; wrong-company access; historical effective dates; multiple sale cycles; live inventory exclusion and public detail privacy; exact paired backend tests; production build; browser verification at desktop, laptop and tablet sizes.

Production activation requires coordinated frontend/backend release, verified recovery, and read-only reconciliation of existing history before applying any derived index backfill.

## Implementation and release

The immutable backend revision is recorded in `config/ixi-core-release.json`. The initial release used backend PR #67 and frontend PR #354. Frontend PR #355 corrected issues found during the live audit. Backend PR #69 restores existing invoice machine prices on historical SOLD cards; its deployment follows the same exact paired gate and complete-runtime workflow.

| Area | Implemented behavior |
| --- | --- |
| Record sold | Existing TRAN$ACT invoice closeout requires canonical collection evidence, an explicit machine price and matching machine/invoice identity. Audit actor and entity come from the authenticated server context. |
| Inventory | Completed sales are excluded from owned listings, the AOS inventory view and public availability. Settlement remains independent. Canonical objects and durable relationships are retained. |
| Sold environment | `/sold` reuses the private card shell, movement controls, pockets and stacks. Research filters include machine, serial/Passport, buyer, salesperson, dates, price and settlement. Paging preserves other pages' card placements. |
| Card front | SOLD, photo, machine identity, original date, machine price, buyer, salesperson, settlement and TRAN$ACT access. Older machine prices resolve from the existing invoice commercial subtotal when the single-machine identity and full commercial totals reconcile. Explicit current prices stay authoritative. Truly missing facts remain labeled. |
| Transaction continuity | A successful sale broadcasts an inventory refresh. An open worksheet stays mounted until closed. SOLD opens the existing financial record index, from which original worksheets remain accessible. A failed AOS refresh offers retry without asking the operator to record the sale again. |
| Adjustments | A linked customer credit reduces revenue. A separate refund records money actually returned and requires its payment reference. Recording a refund does not send money. |
| Return | A full linked return credit plus explicit possession confirmation restores private inventory. Original invoice, receipt and adjustment records remain. Refund liability can remain open independently. |
| Settlement | Customer credits/refunds affect the settlement projection and available funds; prior owner distributions remain recorded. A changed sale requires settlement review. |
| Concurrency | Durable sale locks, conditional balance counters, stable commands, request fingerprints and revisions prevent competing writes from consuming the same machine or remaining credit/refund balance. |
| Historical entry | Original business dates determine inventory order. Same-day return/resale sequences retain separate cycles. Incomplete recorded sales are held out of available stock and flagged for reconciliation. |

## Verification evidence

| Check | Verified result |
| --- | --- |
| Required exact paired gate | **PASS for PR #355:** 497 frontend tests and 308 backend tests; zero failures. The historical-price correction adds four backend behavior tests; the exact new pair must pass CI before activation. |
| Additional existing SOLD closeout contract file | **PASS:** run explicitly with the new SOLD inventory tests. |
| Production frontend compilation | **PASS:** Next.js optimized production build, including `/sold` and its API routes. Temporary verification route removed. |
| Actual storage workflow | **PASS:** HTTP → real financial provider → DynamoDB Local → inventory response; sale, credit, actual refund and private return. Original invoice revisions retained. |
| Storage contention | **PASS:** competing credits, refunds and machine sales; losing transaction rolled back; retries did not duplicate charges. |
| Deployed source and recovery | Initial backend deployment workflow `35023054848` completed successfully after a deployment-lock retry. Verified private recovery, all 444 installed source files, healthy runtime, and unchanged canonical objects and relationships. |
| Historical data | No customer transactions, accounting periods or historical financial records were changed by the release or the price-display correction. |
| Live browser | SOLD card and photos, buyer search, settlement filtering, owned/AOS inventory exclusion, original invoice, receipt and SOLD controls verified. The company-context failure found during this audit was corrected in PR #355 and the live inventory totals were rechecked. |

Reproduce the paired gate from the frontend checkout:

```sh
IXI_CORE_CONTRACT_ROOT=/absolute/path/to/ixi-core node scripts/verify-aos-stabilization.mjs
npm run build
node --test tests/ixi-sold-closeout-contract.test.mjs tests/ixi-transact-sold-inventory.test.mjs
```

The additional database exercise runs from IX-Core with an official DynamoDB Local installation and Java available:

```sh
node scripts/verify-sold-atomicity.js /absolute/path/to/dynamodb-local
```

## Audit corrections

- **Inventory authorization:** account inventory derives its owner from the authenticated browser session and rejects a mismatched requested owner before data reads.
- **Signed company context:** availability requests first resolve the existing company and pass its Entity identity. Only an absent AOS account permits an empty projection; failed availability routes do not make sold stock available.
- **Calendar dates:** the existing financial record index uses UTC business dates so US time zones do not display the prior day.
- **Historical machine prices:** requiring the newer `machineSalePrice` field overlooked prices already stored in issued invoices. The projection now reads a reconciled, single-machine `commercialBreakdown.subtotal` and reports `salePriceSource`. Tax, freight and fees are excluded; deposits and trade allowances do not reduce the machine's sale price. No record migration or customer re-entry is required. Bare invoice totals and ambiguous multi-machine invoices are not silently treated as a machine price.

## Verification limits and remaining checks

- A live pocket movement using “Sync machine” was blocked by automatic approval review because it may persist placement. No bypass was attempted. The user has not yet approved that specific live test.
- Live sale/credit/refund/physical-return writes were exercised against isolated DynamoDB Local, not fabricated in the customer's production company.
- Remaining responsive-device and multi-page movement scenarios need an isolated hosted test company. The completed live browser checks used the available desktop session.
- Existing sale dates and salesperson evidence must be assessed independently of price display. The compatibility correction does not rewrite those facts.
- Current inventory reads project company documents on demand and coalesce simultaneous requests. No 1,000-seat throughput benchmark or zero-defect guarantee is established.
- Every backend pin change requires the exact paired tests, frontend compilation, full immutable runtime deployment, recovery, installed-source verification and live browser confirmation. Source tests and deployment status must be reported separately.
