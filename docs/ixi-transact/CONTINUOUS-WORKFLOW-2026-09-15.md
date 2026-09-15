# TRAN$ACT continuous workflow — 2026-09-15

This release removes avoidable waits without changing financial commands, accounting formulas, canonical identity, relationships, permissions or the pinned backend.

## Behavior

- Expense saves notify their caller immediately after server confirmation. The former 1,050 ms presentation timer is removed. An immediate ref guard blocks repeated same-frame clicks; an interrupted request retains its existing command and idempotency key.
- A completed worksheet save starts one shared history refresh. It does not await that refresh or reload the AOS operating environment. Shared ledger projections are invalidated so the ledger refreshes its authoritative values.
- A bounded in-memory cache retains up to 12 visited Passport histories for one verified actor/entity/permission scope. Reads are reused for 30 seconds, rechecked on activation/focus, and invalidated after a confirmed write. Late or cancelled responses cannot replace the next generation.
- During refresh, last-known history rows and totals remain readable with an explicit update notice. Refresh failure offers a read-only retry. History payment actions and exports stay disabled while these values need refresh; payment worksheets retain their own authoritative eligibility reads and server enforcement.
- Prepared document reads retain a 16-record bound and a maximum of two concurrent requests. Visible ranges preserve overlapping prefetch work. VIEW prioritizes its request and interrupts a background request when needed. Changed revisions invalidate only affected prepared records; a pending response older than history revision evidence is rejected.
- Open worksheet instances survive unchanged revisions. Dirty worksheets are excluded from automatic hydration. Existing expected-revision checks continue to govern amendments; posted corrections and payment controls are unchanged.
- Browser Performance entries `transact.history.read` and `transact.record.read` retain the latest read timing per operation. They include no financial, Passport, company or actor identifiers and do not send telemetry.

## Verification

The new continuity suite exercises the real React history hook, command center, expense form and record workspace with isolated network boundaries. It checks machine switching, saved-form retention, dirty edits, duplicate clicks, retry keys, refresh failures, stale responses, cache bounds, concurrency and revision ordering. Existing financial and canonical contract suites remain required through `scripts/verify-aos-stabilization.mjs` against the exact configured backend checkout.

Candidate checks are distinct from deployed checks. Release completion requires hosted build/certification, exact production deployment identity and authenticated AOS/TRAN$ACT browser verification. Production checks are read-only. Existing verified backup/restore and installed-backend evidence applies because this release does not change backend code or storage.

Latency goals for tab switching, prepared records and uncached reads require representative browser measurements. Passing these tests does not establish a 1,000-user capacity result or a production 95th-percentile latency guarantee.
