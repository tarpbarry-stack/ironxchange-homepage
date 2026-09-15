# AOS repair 2: creation and attachment recovery

Candidate review, 15 September 2026. Paired drafts: [frontend PR 353](https://github.com/tarpbarry-stack/ironxchange-homepage/pull/353) and [IX-Core PR 66](https://github.com/tarpbarry-stack/ixi-core/pull/66). No merge, production deployment, or customer-data mutation is part of this build.

The frontend pins IX-Core `a585b9b1e0b3d9ad1fc52fc6f01e0ef43b687542`. It also retains frontend main `86e9734ed3146304e2efee40e505016468762ed0`, including the latest SOLD inventory-context and financial-date corrections. Both candidates retain the previous membership-compatibility repair.

## Problem corrected

Container Save previously provisioned an Object and Passport, then made a separate relationship request. A generic child could fail its parent's policy after identity was already saved. Identity recovery did not finish attachment. A failed layout or refresh could also leave the browser unable to confirm or resume the save.

## Customer behavior

1. Container + still creates only a local draft. Choosing a card creates no permanent identity.
2. A parent index's explicit membership policy supplies the allowed classifications and customer definitions. One unambiguous choice can be preselected; multiple choices require selection. Card design and customer wording do not supply classification.
3. Save checks the current parent, its canonical Passport, Entity and authority, and the resolved child definition, required fields and business identifiers before creating identity. New indexes require explicit membership configuration using supported classifications and active definitions from the same Entity. Archived definitions cannot be used for new Objects. The unused name-only index-creation path has been removed.
4. IX-Core records one durable save intent, including the intended parent and one reserved Object ID. Identity creation reuses the existing Object/Passport services. The reserve occurs at Save and does not create an Object during presentation or placement.
5. Attachment must pass the current membership policy and Object authority. A success receipt includes the canonical identity and persisted membership. An invalid direct machine connection remains invalid.
6. Interrupted requests appear in **UNFINISHED SAVES** for their original authenticated creator. **FINISH SAVE** resumes the recorded request, including after a page refresh. It never substitutes a new draft, Object or Passport.
7. The request leaves that list only after workspace placement and environment readback succeed and the client acknowledges it. Financial addressability does not create financial transactions.

If configuration changes while a save is incomplete, recovery can remain blocked until the authorized configuration is corrected. The saved Object and request are retained. A completed creation replay does not restore a relationship deliberately ended later.

## Recovery and authority

The durable command has pending, processing, failed and completed states. A two-minute lease prevents overlapping active attempts. A reserved Object ID also prevents a resumed stale worker from creating a second Object after another process finishes. A completed identity command cannot be changed to failed by that stale worker.

Recovery is limited to the original creator and Entity with current creation authority. Parent authority is checked before identity writes. When a birth stopped before a Passport existed, that creator's recorded intent authorizes finishing the same identity; full Object authority is then checked before attachment or successful return. Other users cannot list or resume the request. Existing general Object access rules remain enforced.

The old identity-recovery path also omitted the Entity argument now required by Passport ensure/verification. Those calls now carry the verified Entity, and recovered Objects persist TRAN$ACT eligibility.

The concurrency evidence targets the production SQLite storage path. This is a recoverable operation across stores, not a claim of one atomic transaction spanning SQLite and the Passport registry.

## Verification

Targeted tests establish:

- Wrong class, missing root policy, invalid parent Passport, denied parent authority and incomplete customer-definition fields fail before saving a child.
- Attachment failure resumes the same Object and Passport with one active intended membership.
- Parent-policy changes reject an invalid pending attachment without replacing identity.
- Lost HTTP responses, a process exit after Passport creation, and an authenticated recovery before Passport creation preserve intended identity.
- Concurrent requests share one lease. A separate stale process cannot overwrite or duplicate a completed reserved Object.
- Signed HTTP routes deny another Entity's creation/recovery access.
- The production workspace creation hook recovers a failed layout from a fresh session and reads the saved relationship back.
- The production editor accepts the verified draft-to-permanent ID transition and rejects an unrelated draft receipt.
- Membership-review corrections and open SOLD worksheet preservation remain covered by the paired suite.

The required paired gate passed **509 frontend/integration tests and 326 IX-Core tests**, with zero failures and zero skips, against the exact backend commit pinned above. All three backend GitHub workflows passed. Final published frontend CI/build results are recorded in the PR descriptions for the exact published commits.

## Remaining acceptance before release

These are candidate source, isolated authenticated HTTP/SQLite, process and build results. They do not establish successful use from the customer's logged-in browser.

The paired candidate still needs an accessible authenticated environment with its matching backend. Exercise actual index creation, child creation, interruption/retry, refresh, another session, invalid-member review, Board, Recall and Return. Verify the same machine opens the same authorized financial records through Equipment, a named location, its listing card and Desktop. Compare acquisition costs, receipts, journals and accounting-period status before and after workspace actions.

Production installation additionally requires the existing complete-release workflow, release-specific recovery evidence, installed source manifests, service health and post-install customer-task verification. This report does not claim an outage cause or a production repair.
