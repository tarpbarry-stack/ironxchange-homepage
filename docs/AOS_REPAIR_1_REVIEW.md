# AOS/WORK — First repair review

Prepared 15 September 2026. Status: published draft candidate; not deployed. See [the post-publication audit](AOS_REPAIR_1_PUBLISHED_AUDIT.md) for corrections and the current release verdict.

## Decision

The first repair separates structural roles from appearance and provides an explicit correction path for existing unconfigured indexes and unclassified Objects. Invalid connections remain distinguishable from valid membership. This candidate is not a production completion claim.

The published backend candidate is `89c903a79d9b011ee03b8196b9eaea75ecd07ff8`. Its source tree exactly matches the locally verified `d5195a28dd98bb234d529400570d7b35908819bd`; publication through the GitHub integration assigned a new commit identity. The frontend pins the published commit in `config/ixi-core-release.json`. Both checkouts use branch `aos/structural-contract-compatibility`.

## Starting evidence

The inspected frontend production deployment identifies source `0fed59f785d27e9391aa23816f24e28782aeb17f`. The last successful IX-Core release receipt identifies `aecbcb904d192c1f21b795480924bd0ffe6612b3`. The receipt is evidence of that installation; the currently loaded source of every running process has not been independently established.

The authenticated customer workspace displayed Equipment contents and zero previews for Locations and Workforce. The verified private recovery snapshot from the release contained both roots without membership policies. Their active connected Objects included legacy generic records without definitions. This establishes a concrete compatibility problem in the inspected release data. It does not establish a whole-service outage cause or loss of financial records.

The recovery archive and extracted SQLite database matched their recorded checksums. No recovery data, credentials, customer identifiers, or raw financial records are included in either source repository.

## Repair contract

| Area | Candidate behavior | Evidence |
| --- | --- | --- |
| Structural role | Existing explicit role declarations remain authoritative. Card templates and presentation flags cannot promote an ordinary Object to System Index status. | Paired frontend/backend and drag-acceptance tests cover structural and appearance variants. |
| Equipment | Its registered technical adapter supplies its policy; a presentation flag is not required for onboarding or reconciliation. | Equipment onboarding tests include presentation changes. Presentation aliases alone do not confer its policy. |
| Existing unconfigured indexes | Authorized connected Objects are returned as unresolved review evidence, separate from valid member previews. | Persisted environment test begins with a legacy root lacking configuration. |
| Invalid connections | A machine directly connected to an index accepting people remains invalid and reviewable. Existing edges are preserved. | The same persisted test checks both unresolved and invalid states before and after correction. |
| Explicit correction | The shared editor configures customer index membership. An ordinary generic Object without a definition can receive an explicit supported type using the existing revisioned command. | Core mutation tests and the paired signed HTTP test verify persisted readback, guards, and identity preservation. |
| Recovery | A lost response after a successful classification save can be retried with the same command. It returns the existing result and a fresh GET readback. | Paired test uses real signed routing, idempotency records and SQLite. Revision advances once. |
| Entity boundary | A strict Entity-scoped principal cannot use a broad grant to read or modify another Entity's Object. | A previously failing paired HTTP test now rejects both operations; a core authority test covers multiple capabilities. |

The Entity boundary defect was discovered while verifying the new correction path. The failure was reproduced against an isolated backend using valid signed requests. External authority storage was stubbed; request verification, membership resolution, Object routes and persistence remained real. This finding does not establish production exploitation.

## Expected customer correction flow

1. Open the affected index's review notice. Unresolved or invalid Objects remain available to an authorized user; opening one does not approve its membership.
2. Edit the customer index and explicitly select the accepted types or existing customer definitions. No names or card templates are interpreted as business classifications.
3. Open an unclassified ordinary Object and choose its actual classification. The Object ID, Passport and relationships remain in place.
4. Save through the existing versioned command. The frontend requires persisted readback and reloads the environment to refresh membership results.
5. Verify valid previews and remaining review notices. A disallowed machine must still not appear as a legitimate direct member of a people or locations index.

This sequence is the implemented candidate workflow. Authenticated browser execution of this candidate remains a release gate.

## Verification

The required paired gate completed successfully against the local backend commit whose source tree matches the published candidate:

| Check | Result |
| --- | --- |
| Frontend AOS/TRAN$ACT and paired integration suite | 487 passed; 0 failed; 0 skipped |
| Complete IX-Core suite within the paired gate | 299 passed; 0 failed; 0 skipped |
| Frontend production build | Passed, including the final membership-editor adjustment |
| Persisted legacy correction | Same Object identities, Passport file bytes and relationships throughout; only the accepted classified member regains a preview |
| Lost save response | Retry replays the completed command; fresh GET confirms the same Object and one revision increment |
| Cross-Entity access | Signed foreign-Entity read and edit rejected; stored Object unchanged |

An old source-text assertion was replaced with a behavior assertion because drag acceptance now delegates to the shared classifier. Repository history was fetched to satisfy the existing ancestry check. No required gate was disabled or skipped.

## Remaining gates and next repair

- The browser URL policy blocked local preview inspection. Visual layout and the actual authenticated candidate correction flow are not yet verified.
- Existing-record compatibility is the scope of this candidate. Creation can still save an index without configuration in some paths, and a child can still be created before its attachment fails. These remain the next coordinated repair: validate the intended child against the parent before permanent creation and recover attachment using the same Object and Passport.
- The correction UI handles previously unclassified generic Objects. Arbitrary reclassification of established typed Objects and assignment of a new customer definition are outside this candidate.
- No customer-specific policy or classification has been guessed or applied. Existing invalid relationships have not been rewritten or deleted.
- Full release acceptance still requires current installed-process verification, recovery evidence for the eventual release, authenticated Board/Recall/Return/refresh/second-session checks, and financial record comparisons across Equipment, named location, listing card and Desktop.
- Production acquisition costs, receipts, journals and accounting-period state have not been baselined and compared in this repair. Test success must not be presented as proof of their live integrity.

## Publication status

The user explicitly authorized publication and a subsequent audit. The backend is published as [draft PR 66](https://github.com/tarpbarry-stack/ixi-core/pull/66); the frontend is published as [draft PR 353](https://github.com/tarpbarry-stack/ironxchange-homepage/pull/353). Publication does not include merging or deploying production.

The [post-publication audit](AOS_REPAIR_1_PUBLISHED_AUDIT.md) records the reproduced gaps, follow-up corrections, published-source checks and remaining release blockers. Its validation results supersede the earlier counts in this preparation report.
