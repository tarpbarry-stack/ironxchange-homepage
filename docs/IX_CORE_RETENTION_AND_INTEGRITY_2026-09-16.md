# IX-Core retention and identity integrity correction

Status: tested candidate, not installed in production. Backend PR: https://github.com/tarpbarry-stack/ixi-core/pull/71.

Backend commit: `6cdd66a8f779825d3136d4453f2d251356f851f7`; source tree: `78e043a3098d9b9a4211501016bfe8e109ab42f9`.

## Findings verified against live records

The 39 `OBJECT_PASSPORT_RECORD_MISSING` findings were false positives: every Passport exists, belongs to the same Entity as its Object, and has the matching persisted `aos-object` binding. Their primary source is `sharetribe-listing`, which the old adapter excluded.

The five `ORPHAN_AOS_PASSPORT` findings also had existing Objects: four soft-deleted Objects and one active legacy Object outside the adapter's provisioning-version filter. No identity recreation, deletion or relinking is needed to correct these findings.

The corrected read-only reconciler includes all persisted AOS source bindings and retained identity evidence. It continues to reject absent records, missing/mismatched bindings, tenant conflicts and duplicate active ownership. Retained tombstones remain visible but are not counted as additional active owners. Repeating an existing verified Passport source binding no longer rewrites timestamps or the registry file.

A minimal live snapshot containing 114 Objects, 241 Passports and 73 provisioning records was evaluated locally. The corrected tenant report checked 75 Objects (69 active, six retained), 74 Passports and 73 provisioning records, with zero findings. The inputs were unchanged. This is evidence about those records, not production deployment or a browser business-flow certification.

## Retention correction

Complete deployments currently create a staging directory before installing an exit handler, never clear their successful stages, and retain a full prior dependency directory on every release. The old standalone SQLite backup also creates a new local snapshot on each invocation.

The candidate modifies those existing paths:

- Install release cleanup handling immediately after stage creation.
- Keep npm cache inside the owned stage, and remove completed or safely rolled-back staging work.
- Keep one completed local source rollback after fresh private recovery is verified. Check sealed source inventories, reject redirected/in-use targets, and preserve unrecognized or unverified failed rollback sets for review.
- Allow a bounded transition for the sole older rollback set matching the manifest-verified previously installed commit; independently verify that set's recovery receipt before retirement.
- Check bytes and inodes before dependencies and again before interrupting services; scheduled recovery uses the same budget. The budget includes an uncompressed database snapshot, an incompressible bundle allowance, runtime restoration and reserve.
- Keep one atomic, integrity-checked diagnostic SQLite export. Failures retain the previous verified copy. The normal backup command uses complete private recovery under the production lock.
- Retire the obsolete integrity overlay deployment entry point and make its old source adapter forward to the canonical module.

Read-only capacity evaluation on the server passed: approximately 3.99 GB required before dependencies and 3.39 GB for recovery, with approximately 8.73 GB free at that observation. New external deployments may change those figures; the deployment must recalculate them.

The existing private S3 recovery lifecycle remains 35 days. No SQLite-history compaction, server resize or automatic deletion of business records is included. Interrupted/unverified releases intentionally retain evidence instead of sacrificing recovery to enforce a count.

## Validation and release boundary

The paired gate must run against this exact pinned backend. Backend coverage includes integrity detection, stable repeated bindings, local snapshot replacement, 13 Python maintenance tests, and shell exit-path checks for early failure, verified rollback and failed rollback. The final gate against this exact published backend and the updated frontend passed 527 frontend tests and 369 backend tests, with zero failures/skips. Backend GitHub contract, integrity and Passport email checks also passed.

Release through the existing `deploy-ixi-core-production.yml` complete-runtime workflow. A production release must verify private recovery, installed source, canonical identities/relationships, local health, scheduled recovery, the corrected integrity report and actual AOS/TRAN$ACT browser behavior. The earlier 6.29 GB filesystem cleanup is complete; these ongoing prevention/checker changes are a separate source release.
