# AOS session commercial integration handoff

Status: published integration candidate only. Production release is rejected
until the remaining release gates below are closed.

## Exact integration inputs

- Frontend base: `8aac4cc65d5c04d9c0714b07cb10b3b6272581b7`
- Frontend base tree: `bb507460dab3570c9b91ce66decc2b01f2064306`
- Audited session source: `787476ddc7f234f95cf5e428529a0908c0a11afc`
- Audited session source tree: `e1f326267eb000f2b28a1864f06992767ff35a61`
- Paired IX-Core: `c539e4a175563042e027a0cb8f58ad3aa3c5a242`
- Paired IX-Core tree: `3ad1848d7622d38010707f2730d8ffcd7fa61436`
- Integration branch: `aos/session-commercial-integration`

## Live architecture

`IXIAosWorkspaceSessionController.mjs` is the single integration adapter
between the live AOS workspace and authenticated IX-Core session placement.
It accepts only canonical `object_...` IDs. Open, read, command, and end calls
use the published IX-Core envelopes, stable idempotency keys, expected revision,
and `If-Match` through the authenticated browser gateway.

The controller:

- resumes the exact tenant, Entity, workspace, session, and personal/shared
  scope selected by IX-Core;
- captures `sessionOrigin` only through `object.admit`;
- keeps Recall on `object.recall` and Return on a consumed, operation-specific
  `returnSnapshot`;
- reconstructs Return eligibility from authoritative session readback after a
  route refresh;
- uses one stable card-on-card operation ID as the relationship command ID and
  for all retries;
- tracks per-object operation epochs so a stale completion cannot overwrite a
  newer movement;
- rolls back only the affected object and never restores an obsolete full
  workspace layout;
- completes sortable inserts with one complete canonical `surface.reorder`;
- admits all canonically hydrated objects, including zero-listing, tucked,
  System Index, previewed, and later-loaded objects;
- keeps rail previews separate from the one active operating placement;
- never writes the retired layout record, listing-keyed placement,
  `directContainerId`, or unrevisioned machine placement state.

Board, Recall, Return, sorting, pockets, stacks, summoning, and visual placement
use only session commands. The durable relationship path is entered only for an
accepted card-on-card connection and requires complete source and target Object
and Passport evidence.

## Verification results

Commands and observed results:

```text
node --test tests/ixi-aos-session-placement-engine.test.mjs \
  tests/ixi-aos-session-commercial-story.test.mjs
16 passed, 0 failed

node --test tests/ixi-aos-workspace-session-controller.test.mjs \
  tests/ixi-aos-workspace-session-gateway-contract.test.mjs \
  tests/ixi-aos-canonical-relationship-contract.test.mjs \
  tests/ixi-aos-container-dnd-contract.test.mjs \
  tests/ixi-aos-operating-persistence.test.mjs
40 passed, 0 failed

IXI_CORE_CONTRACT_ROOT=<exact-core-worktree> \
  node --test tests/ixi-aos-cross-repository-session-contract.test.mjs
1 passed, 0 failed

IXI_CORE_CONTRACT_ROOT=<exact-core-worktree> node --test tests/*.test.mjs
544 passed, 0 failed, 0 skipped

IX-Core: npm test
203 passed, 0 failed, 0 skipped

IXI_CORE_CONTRACT_ROOT=<exact-core-worktree> \
IXI_CORE_NODE_MODULES=<paired-core-node-modules> \
IXI_BROWSER_EXECUTABLE_PATH=<isolated-chrome-headless-shell> \
node --test tests/browser/ixi-aos-session-commercial.browser.mjs
1 passed, 0 failed, 0 skipped

NEXT_PUBLIC_SHARETRIBE_CLIENT_ID=ixi-controlled-build-verification npm run build
PASS: compiled, generated 96/96 static pages, collected build traces

git diff --check
PASS
```

The deterministic commercial story verifies one ripper Object and Passport,
multiple lightweight previews, one operating placement, immutable origin,
separate Return, personal/shared isolation, unchanged Object/Passport counts,
stable retry identity, revision conflict handling, and stale-response safety.

## Unresolved release blockers

1. The Chromium gate is closed. The browser story now runs through the actual
   frontend browser gateway client and membership bridge against a disposable
   server booted from the exact paired IX-Core worktree. It captures four
   screenshots plus JSON console, network, identity, revision, and count
   evidence. It no longer substitutes an in-browser IX-Core mock or skips when
   the executable is absent.
2. The required production-clone Star & Sons/Wichita Falls proof has not run.
3. Production census, identity-conflict report, checksummed backups, rollback
   proof, database integrity, and Passport-registry integrity remain release
   gates owned by the production release process.
4. Production deployed commit equality and strict internal-auth enforcement
   remain unverified because deployment and production access were prohibited.

## Release decision

**REJECT production release.** The browser integration candidate is verified,
but the production-clone/census/backup/rollback gates remain mandatory.

No production data, IX-Core source, AWS resource, deployment, or `main` branch
was modified by this integration work.
