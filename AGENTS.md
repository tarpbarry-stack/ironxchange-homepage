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
