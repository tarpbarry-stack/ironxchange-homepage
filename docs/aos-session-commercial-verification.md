# AOS Session Commercial Verification

## Ownership and base

- Owner: Agent 2 — session placement and independent release gate
- Branch: `aos/session-commercial-verification`
- Verified GitHub `main` base: `ecd11820473771f3eb4b4707f4cf2642cf18d5b3`
- Verified IX-Core GitHub `main`: `fe5eb2a2cbb0150156dbc1087a534104dd4ff8d7`
- Audited local IX-Core commit: `3b7071e9bf88c2b454726bb34071997d95ae4efb` (same tree as remote `main`, divergent commit identity)
- No IX-Core, production data, Passport, deployment, registry, or card-runtime mutation is authorized by this branch.

## Current violation map

| Area | Current evidence | Doctrine conflict |
| --- | --- | --- |
| Placement identity | `pages/aos/work.js` stores one `__ixi_aos_work_layout__` record under a user ID | Missing tenant, workspace, session, canonical object, and explicit placement-scope identity |
| Canonical key | Saved placement arrays contain both Sharetribe listing IDs and MOS object IDs | Listing alias remains a primary placement key |
| Session origin | `containerReturnSnapshotsRef` records per-container, memory-only snapshots | No immutable origin per canonical object for the session |
| Refresh | Layout survives through `ixi-machine-state`; return snapshots do not | Refresh can preserve current placement while destroying recall origin |
| Personal/shared scope | No explicit placement-scope record exists | Collaboration semantics are ambiguous |
| Placement stores | `workspacePlacements` is the sole React placement object; `machineContainers` aliases it; `ixiCardState[__ixi_aos_work_layout__]` is the remote layout record | One unversioned record mixes board, pocket, stack, System Index, and container placement without a session boundary |
| Placement refs | `hasAppliedRemoteLayoutRef` gates hydration, `workspaceLayoutSaveQueueRef` serializes saves, and `containerReturnSnapshotsRef` stores undo state | The first two are mechanics; the last is competing, refresh-unsafe recall truth |
| Hydration | `validWorkspaceObjectIds` concatenates System Index object IDs, MOS object IDs, and machine listing IDs, then defaults missing machines to `indexEquipment` and missing MOS objects to `board` | Admission is not normalized before origin capture and can establish placement under an alias |
| Board/Recall/Return | Board and Recall mutate placement and use container snapshots | Return and recall-to-start are conflated |
| Equipment | Equipment uses dedicated listing-keyed movement helpers | System Index behavior is not normalized to canonical object placement |
| Exclusive movement | `clearContainerChildrenToParent()` calls `commitMosContainerPlacement()` | A workspace-facing command mutates durable exclusive containment |
| Durable edge mutation | Accepted container drop calls `createMosRelationship()` | One gesture combines workspace placement with a durable edge command; must remain explicitly classified as a durable-connect operation, not Board/Recall/Return |
| Persistence authority | IX-Core `ixi-machine-state` is keyed by caller-supplied `userId` and `listingId` | It is not the authenticated, revision-safe scoped session store required for commercial release |

## Binding session lifecycle

1. A session begins only after authentication, tenant selection, workspace selection, canonical identity admission, and authoritative placement readback succeed.
2. The authenticated session service issues `sessionId`, `startedAt`, and `expiresAt`. The frontend does not invent an expiration policy.
3. Normal route refresh reuses the same unexpired `sessionId` and hydrates the same scope revision.
4. A session ends on explicit end, logout, authenticated-session revocation, or server-issued `expiresAt`.
5. A new origin may be captured only for a new session or the first canonical-object admission into the active session.
6. Objects loaded later are admitted once using their first authorized resolved surface. Re-admission cannot overwrite origin.
7. A preview may establish origin but remains `preview` until explicitly summoned as the operating card.
8. Personal placement uses a scope owned by one authenticated actor. Another actor cannot mutate it.
9. Shared placement uses an explicit collaboration scope. Every mutation requires server authorization and revision enforcement.
10. Successful undo consumes its operation snapshot. Ending or expiring the session clears abandoned snapshots.

## Standalone engine contract

`IXIAosSessionPlacementEngine.mjs` is deliberately pure and storage agnostic.

It accepts canonical `objectId` values only and provides:

- create session;
- admit object once;
- read stable scope and placement identity;
- move the active operating card;
- set active summoned context;
- capture one operation-specific undo snapshot;
- undo that operation;
- recall objects to immutable session origin;
- reorder a surface;
- serialize a revision-bearing persistence payload;
- validate and hydrate after refresh;
- safely end the session.

It has no imports from relationship, object-creation, Passport, Sharetribe, card-number, or customer-label code.

## Integration boundary for Agent 1 / designated owner

Integration may occur only after Agent 1 supplies a canonical admission map:

```text
workspace presentation ID -> canonical objectId
```

The designated integrator must then:

1. Hydrate the session after canonical identity and layout readback.
2. Convert legacy listing-keyed placement once at admission; never store the alias in session state.
3. Admit every visible, tucked, stacked, pocketed, previewed, and later-loaded canonical object.
4. Replace `containerReturnSnapshotsRef` with engine operations.
5. Keep Board, Recall-to-start, undo, sort, pocket, and stack commands inside this engine.
6. Persist through a new authenticated endpoint keyed by the engine `scopeKey` with expected-revision enforcement.
7. Treat a card-in-card durable-connect gesture separately from workspace-only commands.
8. Never call object provisioning, Passport creation, relationship mutation, or exclusive placement from a workspace-only command.

## Release blockers

- No authenticated, tenant/workspace/session/scope-keyed persistence endpoint exists.
- Existing placement is still listing-ID keyed for machines.
- Agent 1 canonical registry/admission work is not integrated.
- `containerReturnSnapshotsRef` remains active in `pages/aos/work.js`.
- `clearContainerChildrenToParent()` still invokes legacy exclusive placement.
- The temporary `contains` vocabulary remains active.
- Existing duplicate production identity has not been proven reconciled.
- Cloned-production census, backup integrity, rollback proof, and browser commercial acceptance have not been supplied.

Until these blockers are closed, the production decision is **REJECT**.

## Files changed in Agent 2 scope

| File | Purpose |
| --- | --- |
| `components/ixi-mos/workspace/IXIAosSessionPlacementEngine.mjs` | Pure session-placement state machine and validation contract |
| `tests/ixi-aos-session-placement-engine.test.mjs` | Unit invariants for lifecycle, origin, undo, sorting, persistence, and scope isolation |
| `tests/ixi-aos-session-commercial-story.test.mjs` | Synthetic Star & Sons/Wichita Falls placement-only story |
| `docs/aos-session-commercial-verification.md` | Audit, lifecycle, integration contract, evidence, and release gate |

No shared Agent 1 registry, card-normalization, identity, or integration file was changed.

## Board / Recall / Return proof boundary

| Operation | Engine field changed | Forbidden state absent from engine |
| --- | --- | --- |
| Board or other visual move | `currentSurface`, `activeSummonedContext`, `visualOrder`, `operatingState` | objects, Passports, aliases, ownership, edges, labels |
| Recall-to-start | Restores only `sessionOrigin` fields | `returnSnapshot` is not consulted and durable truth is unavailable |
| Return / one-operation undo | Restores and consumes matching `returnSnapshot` | `sessionOrigin` is not rewritten and durable truth is unavailable |
| Sort | `visualOrder` for the complete current surface membership | surface, origin, context, identity, and graph state |
| Summon context | `activeSummonedContext`; a move call controls visual surface | customer labels are not keys and durable edges are unavailable |

The module has no imports. Persistence is delegated to a future authenticated adapter and requires the adapter's authoritative `expectedRevision`; the engine never invents one.

## Tests added

The 16 focused tests cover:

- exact tenant/workspace/session/object/scope identity;
- personal/shared scope separation and shared-authorization mismatch;
- preview and later-load first admission;
- immutable session origin on repeated admission;
- move and summon context isolation;
- operation-specific snapshot and idempotent retry;
- undo versus recall-to-start separation;
- sorting-only behavior and complete-membership enforcement;
- persistence round-trip and cross-scope rejection;
- required authoritative revision;
- end-session cleanup and expiration;
- canonical object-key validation;
- dependency-free source verification that forbids network or browser-storage calls;
- a synthetic Star & Sons/Wichita Falls story with unchanged synthetic durable census.

These are module-level proofs. They are not a substitute for a deployed preview, authenticated persistence endpoint, canonical-admission integration, or cloned-production data.

## Commands and results

| Command | Result |
| --- | --- |
| `git fetch origin main` and GitHub commit verification | Frontend base `ecd11820473771f3eb4b4707f4cf2642cf18d5b3` confirmed |
| `git fetch origin main` in IX-Core | Remote `main` `fe5eb2a2cbb0150156dbc1087a534104dd4ff8d7`; audited local commit `3b7071e...` has the same tree but is not the same commit |
| `git switch -c aos/session-commercial-verification ecd118204...` | Branch created at the verified frontend base |
| `node --check components/ixi-mos/workspace/IXIAosSessionPlacementEngine.mjs` | PASS |
| `node --test tests/ixi-aos-session-placement-engine.test.mjs tests/ixi-aos-session-commercial-story.test.mjs` | PASS — 16 tests, 16 pass, 0 fail |
| `node --test tests/*.test.mjs` | PASS — 490 tests, 490 pass, 0 fail; Node emitted existing typeless-package warnings for several `.js` ES modules |
| `npm test` in IX-Core | PASS — 170 tests, 170 pass, 0 fail; no IX-Core files changed |
| `npm run build` | FAIL — compile completed with warnings, then page-data collection failed because `pages/api/ixi-state.js` imports missing `getUserIxiState` / `saveUserIxiPatch` exports and `/live` lacks `clientId` |

The build failure is a release blocker even though it is outside the new standalone module.

## Cross-repository doctrine compliance matrix

| Doctrine area | Agree? | Repository evidence | Required amendment | Deployment blocker? |
|---|---:|---|---|---:|
| Nameless IX-Core | Yes | Frontend `pages/aos/work.js` emits `relationshipType: "contains"`; IX-Core `mos/relationships/relationshipService.js` requires a user-defined relationship name; `mos/objects/objectTemplates.js` contains platform business labels | Replace the temporary literal with stable neutral behavior/definition IDs and make visible labels optional tenant data | Yes |
| Canonical identity | Yes | `pages/aos/work.js` builds one placement array from System Index object IDs, MOS object IDs, and Sharetribe listing IDs | Agent 1 must normalize all admission to one `objectId` before session hydration and deduplicate active presentation | Yes |
| Alias normalization | Yes | Machine placement remains listing-keyed and historical Passport/alias coverage is not proven by a complete released-shape census | Agent 1/identity owner must deliver one authoritative alias index with zero/multi-match blocking | Yes |
| Cards as presentation | Yes | `components/ixi-aos/card-runtime/IXIAosOperatingCardResolver.mjs` falls back to Card 017 for `canContain` and Card 007 otherwise | Agent 1/card owner must remove semantic selection from accidental capability state | Yes |
| Actor authority separation | Yes | `IXIAosCardTemplateAdapter.js` derives `canCreate` from `canContain`; `useIXIAosWorkspaceRegistry.js` injects both true | Agent 1 and IX-Core policy owner must separate structural capability from governed actor authorization | Yes |
| Neutral durable graph | Yes | IX-Core `containerService.js` ends prior `contained-in` edges and overwrites `directContainerId`; generic relationships require a label | IX-Core owner must provide unnamed, revision-safe, non-destructive neutral edges and retain structural cycle policy separately | Yes |
| System Index projections | Yes | `lib/mos/buildAosSystemIndexes.js` declares `directContainerId` canonical; Equipment follows a special listing path in `pages/aos/work.js` | Agent 1/IX-Core projection owners must use canonical object references and stable projection definitions | Yes |
| Workspace/session separation | Yes | `containerReturnSnapshotsRef` is memory-only; `clearContainerChildrenToParent()` calls durable exclusive placement; `/ixi-machine-state` is caller-keyed and unrevisioned | Integrate this engine only after canonical admission and add an authenticated, revision-safe scoped store; remove legacy workspace mutation | Yes |
| Legacy migration | Yes | Production duplicate identity reconciliation, source-binding repair, and parent-to-edge translation reports were not supplied | Migration owner must provide verified backups, quarantine decisions, census, registry integrity, and rollback artifacts | Yes |
| Acceptance tests | Yes | Module tests pass; the branch is not deployed and production mutation is forbidden; frontend production build currently fails | Run complete browser/API/data proof on a safe preview backed by a cloned production census, then verify exact promotion commits | Yes |

## Star & Sons / Wichita Falls acceptance report

Production was inspected read-only at `https://preview.ironxchange.com/aos/work`. The page loaded an authenticated Star & Sons workspace and displayed Equipment and Locations rails with existing previews. No card was moved, no edge was created or ended, and no production data was changed.

| Required proof | Result | Evidence / reason |
| --- | --- | --- |
| 1. Baseline object and Passport counts | BLOCKED | UI showed 23 total assets, but that is not an authoritative object/Passport census |
| 2–4. Summon existing ripper and place in Wichita Falls | NOT RUN | Would mutate the current production workspace and potentially durable graph; branch is not deployed |
| 5–8. Same object/Passport and unchanged counts | BLOCKED | Requires authoritative before/after APIs and a safe test environment |
| 9–10. Equipment and Wichita Falls previews | PARTIAL READ-ONLY EVIDENCE | Both rails showed existing previews, including ripper-labelled entries; canonical identity equality was not exposed in the UI |
| 11. One active operating card per scope | BLOCKED | Current production code lacks explicit placement scope and canonical deduplication proof |
| 12–15. Context calls, recall, and operation undo | MODEL PASS / LIVE BLOCKED | Standalone tests pass; integration is intentionally absent pending Agent 1 agreement |
| 16–17. End only Wichita Falls edge | NOT RUN | Durable production mutation prohibited; neutral edge endpoint remains incomplete |
| 18. Refresh preserves same session | MODEL PASS / LIVE BLOCKED | Engine round-trip passes; no compliant persistence endpoint exists |
| 19. Separate personal scope | MODEL PASS / LIVE BLOCKED | Isolation unit test passes; production has no explicit scope record |
| 20. Authorized shared scope | MODEL PASS / LIVE BLOCKED | Unit test requires a matching server decision; production shared-placement authorization is absent |

Additional acceptance status:

| Case | Status |
| --- | --- |
| Tucked and later-loaded objects | Unit-level first-admission proof passes; integrated hydration blocked |
| Multiple previews | Re-admission deduplicates one session object; real projection identity proof blocked |
| Nested cards | Engine accepts opaque canonical surfaces; full recursive browser story blocked |
| Self-nesting and structural cycles | IX-Core owner; not a session-engine mutation |
| Allowed neutral cycles / bounded traversal | Existing generic traversal is bounded and cycle-safe by inspection; commercial neutral-edge proof blocked |
| Alias conflict failure | Agent 1/identity owner; not proven end-to-end |
| Server authorization denial | Personal/shared engine defenses pass; authoritative persistence denial path missing |
| Customer label rename | Engine behavior is ID-only; cross-repository rename proof blocked by label-keyed code |

## Exact release blockers and owners

1. **Agent 1 / canonical identity:** canonical admission map, historical alias coverage, deduplication, and zero unresolved identity conflicts.
2. **IX-Core owner:** authenticated and revision-safe session-placement endpoint; unnamed neutral-edge contract; removal of ordinary AOS dependence on exclusive `directContainerId`.
3. **Agent 1 / card and projection integration:** remove `canContain => canCreate`, capability-selected card semantics, listing-keyed Equipment special path, and temporary `contains` bridge.
4. **Migration/release owner:** verified production backup, Passport-registry backup, cloned-production census, duplicate reconciliation report, migration output, and rollback artifacts.
5. **Designated shared-file integrator:** integrate the standalone module into `pages/aos/work.js` only after agreement with Agent 1.
6. **Frontend build owner:** repair the missing `lib/ixi-store` exports and provide the `/live` build-time `clientId` configuration or an environment-safe implementation.
7. **Agent 2 release gate:** rerun the complete 20-step commercial browser story on a safe preview at the exact frontend and IX-Core commits, record all commands/outputs, and compare object/Passport counts.

## No assumptions and release decision

- The repository proves useful identity, edge, authorization, traversal, and projection foundations; it does not prove full V1.1 compliance.
- A UI asset count is not assumed to equal an IX-Core object count or Passport-registry count.
- Existing ripper-labelled previews are not assumed to share canonical identity without API evidence.
- A client-provided shared authorization-decision object is defense in depth, not server authority.
- Passing synthetic/session unit tests is not assumed to certify production behavior.
- The IX-Core local checkout has the same tree as remote `main` but a divergent commit hash; exact production deployment was not proven.

Production readiness decision: **REJECT**.

No production mutation, production-data repair, push to `main`, branch push, or deployment occurred during this work.

## Agent 1 integration-candidate review — 2026-09-07

This section supersedes the earlier frontend-candidate status while preserving the base-commit violation map above.

### Provenance and independent verification

- Remote frontend branch: `aos/commercial-work-normalization`
- Frontend commit: `cffc23ec8f9fcb3ad02931c5443d33e989afe2d5`
- Verified tree: `2a5599f3be5f8243e563b44b4b03c0bbaa24320e`
- Verified parent/base: `ecd11820473771f3eb4b4707f4cf2642cf18d5b3`
- `git diff --check ecd11820..cffc23ec`: PASS
- Agent 1 frontend suite independently rerun: 502 passed, 0 failed
- Controlled full build independently rerun with `NEXT_PUBLIC_SHARETRIBE_CLIENT_ID=ixi-controlled-build-verification`: PASS; 96/96 static pages generated
- Agent 1 and Agent 2 commits produce a clean Git merge tree without shared-file conflicts
- Combined Agent 1 + Agent 2 tree suite: 518 passed, 0 failed

The claimed local provenance commit `621b4af1bec552b060ed4cb7d4d11816418e1e01` is not available in this repository, but the published commit and claimed tested tree SHA match exactly.

The paired IX-Core commits `9eac236` and `114227c` are not present in the local IX-Core repository, remote `main`, or any advertised GitHub remote ref. Cross-repository implementation verification is therefore blocked.

### Frontend improvements independently confirmed

- Canonical admission is authenticated and read-only at `/mos/v1/identity/admit`.
- The AOS registry is keyed by canonical `objectId`, with separate Passport, listing, historical, and verified-external alias indexes.
- Alias and active-object collisions fail closed.
- The exact active `"contains"` membership literal is removed from AOS movement and registry code.
- `aos.rail-membership.v1` is the active technical behavior ID.
- The legacy clear-to-parent write path and browser legacy containment routes are removed.
- Capability no longer automatically promotes create or TRAN$ACT authority in the reviewed runtime paths.
- The established private machine-card path and canonical object identity coexist.
- `/api/ixi-state` was removed, resolving the previous missing-export build failure.

### Integration blockers found by Agent 2

1. **No stable drag operation command ID.** `pages/aos/work.js` calls `createAosMembershipRelationship()` without `commandId`. The browser client therefore generates a new command ID for each retry. A retry must reuse the session operation ID.
2. **Stale full-layout success race.** Relationship persistence is asynchronous, then saves the captured `nextPlacements` snapshot. A later user movement can be overwritten when the older request completes.
3. **Stale full-layout rollback race.** Relationship failure restores and persists the entire captured `previousPlacements` object. That can undo unrelated movements made while the request was pending. Rollback must use the operation-specific session snapshot for the affected canonical object only.
4. **Rail Passport mismatch is not rejected.** `IXIAosMembershipBridge.mjs` reduces relationship and projection members to `objectId` without validating the supplied Passport against canonical admission.
5. **Relationship readback is incomplete.** `ixiMosBrowserGatewayClient.js` verifies relationship ID, source Object, target Object, and behavior ID, but not source Passport, target Passport, definition ID, or order key.
6. **Zero-listing workspaces do not hydrate.** `pages/aos/work.js` returns from placement hydration whenever `workspaceListings.length` is zero, even when canonical AOS objects and System Indexes exist.
7. **Presentation still depends on the literal object classification `"machine"`.** `resolveAosCanonicalPresentation()` requires both `objectType === "machine"` and a listing to preserve the established machine card. The technical presentation/source adapter should control presentation; changing customer classification must not change it.
8. **Retired Passport birth remains active outside AOS.** `ensurePassportForMachine.js`, `ensurePassportForMachineServer.js`, Post Free, URL Import, and bulk upload still call `/passport/ensure`. The IX-Core v1.1 release contract requires governed listing/upload admission instead.
9. **Permanent Passport deletion remains active.** `pages/api/auction-object/disposition.js` calls `DELETE /passport/by-source/sharetribe-listing/:id`, contrary to permanent-identity doctrine.
10. **Session persistence is still legacy.** `pages/aos/work.js` continues to persist one caller/user-keyed `__ixi_aos_work_layout__` record through `ixiMachineStateClient`. It has no tenant/workspace/session/personal-or-shared identity and no authoritative placement revision.

### Updated integration ruling

Agent 1's frontend candidate is materially improved and its published tests/build are genuine. It is approved as an input to the controlled integration branch, not for production promotion.

The designated integration must wire canonical admission into `IXIAosSessionPlacementEngine`, use immutable `sessionOrigin`, use `returnSnapshot` for per-operation rollback, provide stable operation IDs to durable edge commands, and persist through the missing authenticated revision-safe session-placement endpoint.

Production readiness remains **REJECT** until the paired IX-Core commits are published and verified, the ten blockers above are closed or formally assigned outside the release, production backups/census/rollback evidence exist, and the cloned-production Wichita Falls commercial story passes without Object or Passport growth.
