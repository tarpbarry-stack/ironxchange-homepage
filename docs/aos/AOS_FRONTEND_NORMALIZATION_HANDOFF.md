# AOS frontend normalization architecture handoff

- Branch: `aos/commercial-work-normalization`
- Frontend base: `ecd11820473771f3eb4b4707f4cf2642cf18d5b3`
- Amendment base: `cffc23ec8f9fcb3ad02931c5443d33e989afe2d5`
- Paired IX-Core commits: `9eac236` and `114227c`
- Status: tested integration candidate; not deployed or merged

This branch changes only the IronXchange frontend. It does not change IX-Core,
AWS, production data, Passport records, or deployment state.

## Canonical admission

Environment hydration sends every active object through the authenticated,
read-only `POST /mos/v1/identity/admit` contract. Each request supplies the
known object ID, permanent Passport, and verified typed aliases. Every response
must return the same canonical Object, Passport, and authenticated Entity or
the workspace fails closed.

The integration consumes the exact IX-Core response envelope: canonical fields,
aliases, and resolution evidence come from `response.identity`, while the
canonical Object comes from `response.object`. Flattened responses fail closed,
and browser-discovered aliases are request hints only—not server verification.

`lib/mos/ixiAosCanonicalAdmission.mjs` then builds one in-memory registry keyed
only by `objectId`, plus separate Passport, listing, historical, and authorized
external alias indexes. Active collisions fail closed. Lookup never creates an
Object or Passport. Root objects, placements, System Index members, and rail
previews all resolve back to admitted canonical objects.

Deduplication is local to each invocation of the authenticated workspace/session
placement normalizer. It prevents a second operating card in that placement
scope without globally suppressing another user's or workspace's projection.

## Presentation and authority

Machine presentation resolves independently from identity. An admitted
IronXchange machine with a Sharetribe presentation source remains in the
established Private machine-card family and keeps its photo, faces, rail,
Console, TRAN$ACT entry, canonical object ID, and permanent Passport.
The selection uses the stable `ixi.sharetribe-owned-machine.v1` presentation
adapter identifier, never the customer's editable classification or label.

Cards 001-018 are presentation choices only. Card 007 is the neutral missing-
presentation fallback and carries no Person, type, capability, vocabulary,
identity, or authority meaning. Customer-saved titles and field labels remain
presentation data.

The frontend copies server-returned authority into `actorAuthority` solely to
decide which controls to show or invoke. It does not derive authority from
capabilities, card numbers, labels, Passport presence, or ownership-looking
facts. IX-Core authorizes every command.

## Governed rail contract

`lib/mos/IXIAosMembershipBridge.mjs` now uses only
`aos.rail-membership.v1`. A rail edge is written member/source to rail-owner/
target with both canonical Object and Passport pairs, an idempotent command ID,
and a stable order key. Relationship end and order commands carry expected
revision and idempotency headers through the authenticated gateway.

Every hydrated rail member must resolve through canonical admission. Supplied
Passport identity must match that Object. Relationship creation readback verifies
relationship ID, source and target Object IDs, behavior ID, definition ID, order
key, active status, and both endpoint Passports through fresh admission evidence.

The legacy membership literal is absent from active frontend code. The browser
client and gateway no longer expose the legacy container-place or remove-from-
container routes. Persisted System Index membership and rails consume canonical
`railProjections`; `directContainerId` is not written and is not used as new
graph truth.

## Session movement and safety

Drag/drop changes the current workspace placement and then requests one
governed edge between already-admitted objects. Unresolved identities,
Passport mismatches, entity mismatches, and duplicate active aliases fail
closed. Drag/drop does not invoke provisioning and does not mutate canonical
Object or Passport collections.

Board, Recall, Return, sorting, summoning, and rail preview rendering operate on
workspace/session placement only. The prior `clearContainerChildrenToParent()`
legacy mutation path and its universal-parent assumption are removed.

Explicit Save remains a governed creation boundary. If Save creates a child,
the subsequent rail placement uses the returned canonical Object and Passport;
rendering, lookup, and movement cannot enter that path.

Post Free and URL Import already route through authenticated listing admission.
Bulk upload now does the same using the authenticated Sharetribe session and
signed IX-Core Entity context. The generic Passport ensure routes and helpers
and the standalone legacy backfill script are removed; bounded authenticated
backfill remains under `/api/ixi/onboarding/backfill`. Auction disposition may
remove its listing presentation and media, but no longer deletes a Passport.

Workspace hydration no longer depends on a nonzero Sharetribe listing count.
Canonical AOS Objects and durable System Indexes can hydrate by themselves;
missing or unresolved listing identity never manufactures Equipment membership.

## Verification

- `git diff --check`: passed.
- `node --test tests/*.test.mjs`: 510 passed, 0 failed.
- `NEXT_PUBLIC_SHARETRIBE_CLIENT_ID=ixi-controlled-build-verification npm run build`:
  passed lint/type validation, optimized compilation, page-data collection,
  generation of 96 static pages, optimization, and trace collection.
- The orphan `/api/ixi-state` route had no repository callers, imported exports
  that never existed, and trusted a caller-supplied user ID. It was retired;
  the production bundle now contains no unresolved state-store imports or that
  unsafe API route.
- The Wichita Falls/ripper contract test projects the same admitted Object and
  Passport into Equipment and Wichita Falls as two reference-only previews,
  while retaining one operating placement and unchanged Object/Passport counts.

## Remaining release dependencies and migration risks

1. The exact frontend commit must be paired and tested with IX-Core commits
   `9eac236` and `114227c`; this frontend task did not modify or run IX-Core.
2. A read-only production identity census and the governed production-clone
   Wichita Falls proof remain release gates outside this frontend-only scope.
3. Historical active alias collisions intentionally stop admission and require
   governed repair; the frontend does not guess a winner.
4. Historical System Index records without canonical Object, Passport, Entity,
   or neutral rail projections intentionally fail or render without invented
   membership until governed migration is complete.
5. Legacy `directContainerId` may still be displayed as migration/parent
   evidence by older presentation modules, but this branch provides no active
   write route and does not use it for durable rail projection.
6. The controlled client ID proves the full build pipeline; release must provide
   the real environment configuration through the normal secret boundary.

See `docs/aos/AOS_FRONTEND_PRECHANGE_VIOLATION_MAP.md` for the exact base-commit
file and behavior census.
