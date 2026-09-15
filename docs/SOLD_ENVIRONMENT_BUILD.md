# SOLD environment and inventory lifecycle

Candidate build; not a production release.

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

## Candidate delivered on September 15, 2026

The frontend pins merged IX-Core commit `e04a3347386ee6afc400079803c6e36f1b3a7153` in `config/ixi-core-release.json`. Backend PR #67 passed its GitHub checks and was merged with the user's publication and main-merge approval.

| Area | Implemented behavior |
| --- | --- |
| Record sold | Existing TRAN$ACT invoice closeout requires canonical collection evidence, an explicit machine price and matching machine/invoice identity. Audit actor and entity come from the authenticated server context. |
| Inventory | Completed sales are excluded from owned listings, the AOS inventory view and public availability. Settlement remains independent. Canonical objects and durable relationships are retained. |
| Sold environment | `/sold` reuses the private card shell, movement controls, pockets and stacks. Research filters include machine, serial/Passport, buyer, salesperson, dates, price and settlement. Paging preserves other pages' card placements. |
| Card front | SOLD, photo, machine identity, original date, machine price, buyer, salesperson, settlement and TRAN$ACT access. Historical missing values are labeled rather than invented. |
| Transaction continuity | A successful sale broadcasts an inventory refresh. An open worksheet stays mounted until closed. SOLD opens Transaction History. A failed AOS refresh offers retry without asking the operator to record the sale again. |
| Adjustments | A linked customer credit reduces revenue. A separate refund records money actually returned and requires its payment reference. Recording a refund does not send money. |
| Return | A full linked return credit plus explicit possession confirmation restores private inventory. Original invoice, receipt and adjustment records remain. Refund liability can remain open independently. |
| Settlement | Customer credits/refunds affect the settlement projection and available funds; prior owner distributions remain recorded. A changed sale requires settlement review. |
| Concurrency | Durable sale locks, conditional balance counters, stable commands, request fingerprints and revisions prevent competing writes from consuming the same machine or remaining credit/refund balance. |
| Historical entry | Original business dates determine inventory order. Same-day return/resale sequences retain separate cycles. Incomplete recorded sales are held out of available stock and flagged for reconciliation. |

## Verification evidence

| Check | Local result |
| --- | --- |
| Required exact paired gate | **PASS:** 491 frontend tests and 308 backend tests; zero failures. |
| Additional existing SOLD closeout contract file | **PASS:** run explicitly with the new SOLD inventory tests. |
| Production frontend compilation | **PASS:** Next.js optimized production build, including `/sold` and its API routes. Temporary verification route removed. |
| Actual storage workflow | **PASS:** HTTP → real financial provider → DynamoDB Local → inventory response; sale, credit, actual refund and private return. Original invoice revisions retained. |
| Storage contention | **PASS:** competing credits, refunds and machine sales; losing transaction rolled back; retries did not duplicate charges. |
| Production writes | **None:** no customer transactions, accounting periods, historical records or production releases changed. |

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

## Remaining before production

1. **Publish and merge the paired release.** The user explicitly approved publication and merge to main. Backend PR #67 is merged; the frontend must use that exact backend revision and pass the paired gate before its merge.
2. **Hosted browser verification.** The available browser blocked local HTTP and local-file previews. Server rendering succeeded, but this is not visual or interactive verification. Check desktop, laptop and tablet layouts, long buyer/seller names, movement, paging, photos, transaction tabs and keyboard operation against a hosted candidate with an isolated test company.
3. **Existing-history reconciliation.** Read original 2026 acquisitions, invoices, receipts, returns and seller evidence without altering them. Review missing lineage, older credits and missing machine prices. Older invoice totals must not be assumed to be machine prices. Any historical correction/backfill needs a separately reviewed migration; this candidate has made none.
4. **Operational and performance checks.** Verify real company membership/listing bindings, all public/detail entry points, returned-machine publication behavior, and inventory refresh across sessions. Measure query volume and latency with representative history and concurrent users. Current inventory reads project company documents on demand; simultaneous requests are coalesced, but no 1,000-seat throughput claim has been established.
5. **Coordinated release and recovery.** Use the existing complete frontend/backend release workflow, verified recovery and bounded health checks. Confirm installed source, canonical-data integrity and the actual AOS/TRAN$ACT sale-and-return flow after activation.

The candidate has passed local source and storage checks. It is not a deployed or production-certified release, and the tests do not establish a zero-defect guarantee.
