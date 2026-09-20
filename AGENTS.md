# AOS stabilization working rules

- Preserve the settled canonical Object/Passport, relationship and session contracts.
- Display projections and movement cannot create identity or modify durable edges.
- Keep existing card shells, customer vocabulary and commercial lifecycle semantics.
- The pinned backend is config/ixi-core-release.json. Run scripts/verify-aos-stabilization.mjs
  with IXI_CORE_CONTRACT_ROOT pointing to that exact checkout; the paired gate cannot be skipped.
- Backend releases use deploy-ixi-core-production.yml and install a complete verified manifest.
  Retired feature overlays must not be restored or copied into new workflows.
- Production completion requires backup/restore evidence, installed source verification, unchanged
  canonical data, healthy runtime, and actual AOS/TRAN$ACT browser checks.
- Distinguish candidate test results from verified deployed behavior in progress reports.

## TRAN$ACT interactive performance contract

- `/transact` starts its session access and canonical directory reads together.
  Reuse the session runtime; do not add component-level login/context checks or
  make the directory wait for dashboard, listing, media, or private-board reads.
- At cold startup, budget one access request and one governed directory bootstrap,
  then one company history read and one dashboard read for the visible workspace.
  Listing presentation enriches admitted Objects after the directory is usable.
- Mount a second workspace only when visited. Retain visited worksheets and drafts,
  but hidden screens must not start financial reads. Idle prewarming must not mount
  heavy screens or execute reports. Prefetch code only when justified.
- Server requests still authenticate and authorize freshly. Deduplicate within the
  visit/request boundary; never fix speed with cross-user caches or stale authority.
  Preserve write invalidation, abort handling, tenant fences and permanent identity.
- `tests/ixi-transact-startup-budget.test.mjs`, runtime/continuity tests and the
  pinned core's cold-bootstrap/200-object, financial and authority batch-read budgets are required paired gates.
  Fix the implementation when a budget fails; do not weaken or skip these checks.
- Measure fresh-navigation shell, directory and worksheet readiness after release,
  including an independent second visit. Warm-cache speed and skeleton rendering
  alone do not prove the fix. Record source/deployment SHAs and gateway timings.
