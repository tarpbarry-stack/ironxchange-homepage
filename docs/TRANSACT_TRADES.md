# TRAN$ACT itemized trade acquisition candidate

Sales Orders previously exposed one trade allowance without identities for the incoming machines. That could reduce the cash invoice while losing the incoming acquisition records and understating outgoing machine revenue.

## User flow

1. Open the outgoing machine's Sales Order and choose Add Trade or Select Existing.
2. Enter year, make, model, hours, serial, location, and allowance. Add any number of machines. Photos are optional.
3. A new machine uses authenticated Sharetribe `ownListings.createDraft`, then the existing canonical Sharetribe listing admission. Its card and Passport are attached to the saved order. Existing machines reuse their card and Passport.
4. Launch opens that exact listing for photos and other machine details. Returning to the order refreshes its photos.
5. Acquisition opens the existing full acquisition form against the incoming machine, prefilled with its allowance and linked to the order. Each incoming machine has its own acquisition identity and basis.
6. Recording the acquisition verifies the financial document before admitting the same machine to owned Equipment. An interrupted promotion offers Finish Inventory.
7. Signing and document exports identify every trade. The cash invoice deducts the allowances; outgoing machine revenue includes the noncash consideration. SOLD verifies the actual trade acquisitions and cash balance.

## Integrity and compatibility

- Sharetribe is the listing and media system. IX-Core remains the canonical Object, Passport, and financial record authority.
- Draft visibility provides privacy. Adding an incoming machine does not assert ownership.
- A durable reservation grants one Sharetribe creation attempt. A lost response recovers the owner's persisted private trade marker. A definite SDK rejection can release that attempt; ambiguous failures never blindly create a second listing.
- Serial collisions require using the existing card. Entity scope and the existing Financial gateway's active-owner boundary apply.
- Acquisition IDs are deterministic per Entity/deal/trade. A saved acquisition can be recovered if its browser acknowledgement was lost.
- Each incoming basis references its own Passport. Its linkage to the Sales Order does not charge its basis to the outgoing machine.
- Existing orders without itemized trades retain their signing package hashes and existing financial behavior.
- Issued trade invoice identities cannot be silently edited or removed. Ordinary price credits remain available. The cash-only full-return command cannot reverse an itemized trade deal without accounting for the incoming machines.
- No customer data, posted journals, posting rules, period status, or tax policy is changed by installing this source. Trade consideration is exposed in operational revenue; GL posting remains under the existing journal controls.

## Verification and release limits

The integrated candidate retains frontend main `da8f8ecb` and IX-Core main `65590546489cf47a9320a90b50ac3a5430fef8cc`, including structural membership, durable creation recovery, shared SOLD cards, and historical price/date corrections. Conflict resolution combines the historical invoice date with gross trade consideration; it does not change the original audit timestamp.

Automated tests exercise arbitrary trade counts, exact money calculations, private draft creation, response-loss recovery, duplicate prevention, acquisition lineage, stable acquisition identity, gross revenue versus net receivable, actual cash available to settlement, legacy signature compatibility, and return safeguards. The required paired stabilization gate passed: **522 frontend/integration tests and 349 backend tests**, with zero failures and zero skips, against IX-Core `de3644c9e51e74b9233e3b67712b9f7710778028`. The production build also passed.

An integration review also corrected the all-trade SOLD screen: zero cash payable remains zero, noncash value is shown separately, and the closeout button uses the same collection-readiness rule as form validation. Inventory no longer flags a recorded all-trade closeout as missing a cash receipt. A backend regression proves that a pending or reversed acquisition cannot complete SOLD, even if the trade registry previously recorded it as acquired. The existing signed HTTP/SQLite smoke test also passed on the integrated version, preserving one Passport across repeated reserve/complete requests.

The candidate has not completed browser or authenticated Sharetribe acceptance testing. The cloud browser cannot access the local preview, and the hosted branch preview requires Vercel access plus an authenticated app session and the matching backend. Before production, verify new and existing trades, photo editing, signing, acquisition recovery, and SOLD at desktop, laptop, and tablet sizes in a test Entity. Do not claim candidate tests as production evidence.

The existing Financial gateway permits active Entity owners; this feature does not widen staff access. Reverse-cash deals (trade credits exceeding the order total), lien/payoff allocation beyond the existing acquisition controls, and complete trade-deal reversals need their own explicit settlement workflows. They are not silently treated as ordinary cash-only sales.

Release the frontend and pinned IX-Core commit together using the repository's complete immutable release workflow.
