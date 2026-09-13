# AOS stabilization: verified release baseline

Status: deployed and verified on September 13, 2026. The administrator recovery setup is complete.
Building can resume from this baseline through the paired release workflow. Refresh existing AOS
and TRAN$ACT browser tabs before using the release.

## Decision and retained contracts

Keep the existing system. The audit and reproduced failures support repair rather than recreating
the identity foundation. Canonical Object/Passport identities, durable relationships and commercial
lifecycle meanings are retained. Session movement and display projections do not create identity.

## Exact released versions

| Component | Released version | Evidence |
| --- | --- | --- |
| Frontend | 1d0a9d132f7cc17c24513f1887be6e1a9a9c0955 | Vercel dpl_BSZehEFEqQ7cx9eofvpQ4ALrXsu5, preview.ironxchange.com |
| IX-Core | da2d6456815a2580ed13cc19779e183ef4e39f75 | 417 installed source files verified; zero mismatches |
| Complete deployment | GitHub Actions run 34729430314 | Successful resumed deployment after administrator setup |

[Deployment run](https://github.com/tarpbarry-stack/ironxchange-homepage/actions/runs/34729430314)
and [machine-readable release evidence](./AOS_RELEASE_EVIDENCE_2026-09-13.json).
Later documentation-only commits do not change these released source versions.

## Verified behavior and recovery

- 345 frontend tests, 245 backend tests, 13 integrity tests and the frontend production build pass.
  The required paired tests use signed HTTP and actual SQLite for stale clients, queued gestures,
  lost responses, process restart and Return.
- Live AOS: Locations Board brought six existing children onto the board, increasing visible cards
  from three to nine. Placement survived a full reload. Return restored the exact original arrangement.
  OUT displayed the selected existing child; Recall restored the original arrangement, also after reload.
- Live TRAN$ACT: the previously denied existing machine scope now displays Financial CURRENT and
  its same 13 Passport records. No financial record was created or changed during verification.
- All 24 collection checksums pass. The 56 active Objects and 228 unique Passports remain intact.
  Object and relationship checksums match before deployment, after deployment and after UI movement.
- /live and /ready returned 200 in 65 ms and 5 ms in the recorded local probes. Unsigned protected
  email and journal-post requests returned 401.
- A quiesced pre-release recovery set and the first scheduled online recovery set were independently
  verified and stored as private encrypted S3 versions. Capture verifies restored data; upload is
  followed by a full download/hash check. The scheduled service exited successfully and its hourly
  timer is active. The creation-integrity timer was restored.
- Financial, Freight and Tickets have 35-day point-in-time recovery enabled from September 13.
  Enabling retention does not create recovery history before activation.
- The runtime Treasury authorization probe passed without a write. Its impossible condition prevents
  a financial record from being created or changed.
- Existing idempotency history retains 591 versions. Live verification commands advanced durable
  command state while creating zero additional whole-map history copies.

## Release discipline

One lead owns integration. Keep changes isolated and reviewable. Backend changes update
config/ixi-core-release.json and must pass the required paired contract/build gate. The single complete
deployment workflow verifies recovery before stopping writers, installs every manifest-listed source,
and verifies source, health and canonical data. Retired feature overlays must stay retired.

The one-time administrator setup was performed with the pinned
[recovery setup script](https://github.com/tarpbarry-stack/ixi-core/blob/da2d6456815a2580ed13cc19779e183ef4e39f75/ops/configure-runtime-recovery.sh).
Ordinary deployments use existing GitHub SSM access and verify runtime capabilities; they do not
need S3 or IAM administration. Runtime recovery receipts are kept outside the application at
/var/backups/ixi-core-releases/latest-recovery.json. Recovery storage has ongoing AWS charges.

## Remaining scope limits

This release verifies the targeted stabilization paths. It does not certify every accounting balance,
every commercial workflow, public-launch security or future workload capacity. Public origin/SSH
hardening, bare-domain routing, full accounting reconciliation, load testing and complete infrastructure
disaster recovery remain separate work. Existing large idempotency history was preserved; no database
migration, destructive compaction or identity recreation was performed.
