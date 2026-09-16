# TRAN$ACT app opening latency repair

## Measured problem

An authenticated Freight worksheet reopen on preview.ironxchange.com took
9,684 ms from clicking FREIGHT until the existing order queue and
`+ NEW FREIGHT REQUEST` control were visible. This is one observed browser
measurement, not a service-level percentile.

Both the Financial and Freight gateways called `/aos/onboarding/bootstrap`
before every upstream request. That endpoint ensures onboarding and loads
the entire AOS environment, including inventory and per-object discovery.
Opening Freight performs several such requests concurrently. This repeated
work predates the trade acquisition feature.

## Repair boundaries

- Every request still resolves the authenticated Sharetribe session.
- Signed `/aos/context` resolves the active company, account, tenant, and
  membership without provisioning or loading the estate. Authority is not cached.
- Only Financial access entry may fall back to governed onboarding, and only
  for the explicit `404 AOS_ACCOUNT_NOT_FOUND` result. Authorization failures,
  missing entities, missing routes, and outages remain errors.
- Company header metadata comes from the server-resolved Entity. The gateway
  exposes the existing minimal operating context, not private Entity fields.
- Upstream financial and freight authorization, Passport ownership checks,
  request bodies, command IDs, revision checks, and no-store responses remain.
- Gateway timing logs and Server-Timing expose phase durations only. Successful
  requests cancel their upstream timeout timers.
- No backend code, database migrations, ledger postings, financial records,
  Passport identities, period status, or customer data are changed by this repair.

## Candidate verification

- Required paired gate: 544 frontend tests and 369 backend tests passed against
  pinned backend `6cdd66a8f779825d3136d4453f2d251356f851f7`.
- 11 additional Freight identity and commercial contract tests passed.
- Next.js production build passed.
- The stale private-card source-expression assertion now executes the actual
  projection helper and proves listing provenance is separate from Object identity.

## Release acceptance

After deploying this candidate, repeat the same authenticated browser Freight
reopen measurement. Check session, context, and upstream phase timings in
runtime logs. Confirm an existing order remains readable, another Financial
worksheet loads, and AOS still opens. Record deployed measurements in the PR.
Do not mark this candidate's local results as proof of deployed behavior.
