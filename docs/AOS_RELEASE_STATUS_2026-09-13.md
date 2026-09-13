# AOS stabilization: release status and one-time AWS setup

## Decision

The evidence supports repairing the existing system. A rebuild is not justified by the audited
identity census or the reproduced failures. Repeated drift has concrete causes in session recovery,
Financial source admission, order-dependent presentation, storage history amplification and partial
AWS releases. The corrective code and complete-release gate are in GitHub.

This is not a declaration that all production behavior, accounting balances, security or capacity
have been certified. Backend promotion is blocked until recovery setup is completed.

## Current evidence

- Frontend stabilization merged in PR #294 and deployed to preview.ironxchange.com at commit
  96c2c216325ab60b6267f2c92b3d4e0e27ebf387.
- Backend stabilization merged in tarpbarry-stack/ixi-core PR #52. The first complete AWS release
  stopped before installing runtime source: github-actions-ironxchange was denied s3:CreateBucket.
- 345 frontend tests, 245 backend tests and 13 integrity tests pass. Paired tests use signed HTTP
  and actual SQLite, covering stale clients, queued gestures, lost responses, restart and Return.
- The production frontend build and paired GitHub gate passed for the initial release. The follow-up
  setup separation must pass the same paired gate against its exact backend commit.
- Core PR #53 separates one-time administrator setup from ordinary SSM deployment. It verifies
  actual 35-day table recovery and an authorization probe that cannot write a Treasury record.
- The audit found no duplicate Passport IDs, shared active canonical Passports or active Objects
  without Passports. Identity preservation is also an enforced release gate.

## One-time action by an AWS administrator

Open AWS CloudShell in account **459212966383**, with an administrator allowed to configure S3,
the existing EC2-SSM-Role policies, and DynamoDB recovery. Run this pinned, reviewable setup:

```bash
curl -fsS https://raw.githubusercontent.com/tarpbarry-stack/ixi-core/da2d6456815a2580ed13cc19779e183ef4e39f75/ops/configure-runtime-recovery.sh -o /tmp/ixi-recovery-setup.sh &&
AWS_REGION=us-east-2 bash /tmp/ixi-recovery-setup.sh
```

The script checks the account and region. It creates the dedicated private versioned backup bucket,
sets encryption and retention, adds narrowly scoped recovery and atomic Treasury permissions to
the existing runtime role, and enables 35-day recovery on Financial, Freight and Tickets. It does
not grant S3/IAM administration to GitHub, replace business tables, or modify business records.
The new recovery copies and DynamoDB recovery have ongoing AWS storage charges.

Success ends with: `Private recovery storage, DynamoDB PITR, and atomic Treasury permission verified.`
Return that success line or the error, without credentials. The normal complete-release workflow can
then be resumed using the existing GitHub deployment access.

Why this requires an administrator: the connected AWS tool explicitly provides read-only audit
access. The actual GitHub deployment IAM user has EC2 read and SSM access; AWS denied bucket
creation. The recovery requirement will not be bypassed to force a backend deployment.

## Evidence still required before resuming unrestricted building

1. Successful complete backend deployment from the pinned commit.
2. Restore-verified and download-verified S3 recovery receipt, plus a successful scheduled backup.
3. Installed source manifest, bounded health probes, denied unsigned protected routes, and unchanged
   canonical Object/Passport and relationship checksums.
4. Fresh authenticated AOS movement/Return and the existing machine Financial projection in TRAN$ACT.

Keep competing agents and manual AWS overlays paused until those gates are satisfied. Future
backend changes update config/ixi-core-release.json and pass the paired complete-release workflow.

## Remaining scope limits

Public origin/SSH access, the parked bare-domain route, all accounting reconciliations and load or
disaster-recovery exercises remain separate work. Existing large idempotency history is retained;
the release stops new amplification without a database migration or destructive compaction.
