# AOS repair 1 — Published candidate audit

15 September 2026. Verdict: keep both PRs in draft. Publication is complete; production release is not approved by this audit.

## Published pair

- [Frontend PR 353](https://github.com/tarpbarry-stack/ironxchange-homepage/pull/353), initially published at `3f96683748daca1fea72b58bef862bd986a2d102`.
- [IX-Core PR 66](https://github.com/tarpbarry-stack/ixi-core/pull/66), commit `89c903a79d9b011ee03b8196b9eaea75ecd07ff8`.
- The frontend pins that exact backend commit. The backend published tree is `f0115216a085de66c33a54fb7ba275863b33d81c`, identical to the previously reviewed local candidate. The initial frontend published tree is `eea454a414e87430b709551ba102afa01c230605`, identical to its local publication candidate.
- This audit correction is a follow-up on the frontend draft branch. IX-Core source is unchanged from PR 66.

## Reproduced findings and corrections

| Finding | Impact | Correction in this follow-up |
| --- | --- | --- |
| High: the page discarded the refreshed Object after a membership save | `saveAosWorkspaceObject` loaded the new environment and then replaced the saved Object with an earlier single-Object readback. This removed its membership review and could overwrite a newer revision from another session. | The handler retains the refreshed Object and its review/admission data, preserves a newer revision, and returns that accepted value. It rejects a missing or stale refresh. |
| High: an advanced revision could falsely confirm classification | `acceptIXIAosCanonicalObject` checked identity and revision but not the requested type. An incompatible backend could ignore classification while advancing the revision. | Classification success now requires the requested type in canonical readback. A mismatch preserves an explicit failure rather than reporting success. |
| Medium: frontend acceptance could disagree with IX-Core | A workspace predicate could accept a System Index drop that the canonical membership policy rejected. The frontend also accepted classification aliases that IX-Core did not use. | System Index drops must pass the canonical policy. Presentation/workspace predicates can further restrict acceptance, never widen it. Membership uses canonical `objectType` and `definitionId`. |
| Medium: legacy correction was offered on unsaved drafts | The new editor control could propose a classification through a creation path that still provisions from the draft's original type. | The correction control is limited to persisted ordinary generic Objects with a Passport. New child creation remains the next repair. |

The first three findings were demonstrated by failing automated tests against the initially published frontend. They pass after correction. The page test executes the production save handler and verifies review state plus a newer concurrent revision; it does not merely test a copied merge function.

The draft-control finding was established by tracing the editor into `commitDraftObject`, which still provisions `draft.objectType`. Its eligibility guard now has explicit persisted/draft/root/defined/typed coverage.

## Validation evidence

| Check | Result |
| --- | --- |
| Required paired gate against published backend `89c903a7` after corrections | 491 frontend/integration tests and 299 IX-Core tests passed; zero failures and zero skips |
| Frontend production build after corrections | Passed |
| Initial published frontend GitHub workflows | All four succeeded: paired stabilization, creation entry unification, card face manifest, and mobile Browse DnD |
| Published IX-Core GitHub workflows | All three succeeded: complete IX-Core tests, creation integrity, and Object contract tests |
| Initial Vercel preview | READY at the initial published frontend commit; preview target, with no production alias |
| Authenticated browser workflow | Not established. Preview access redirected to Vercel SSO; prior local inspection was blocked by browser URL policy. |

GitHub/Vercel checks for the correction commit are reported on PR 353. A successful preview build is not proof that the candidate runs with its matching backend or that customer tasks succeed.

## Remaining release blockers

1. **Creation and attachment are still incomplete.** `createChildContainerDraft` initializes a generic child and takes its definition from the selected template. It does not satisfy the parent index's membership policy before creation. `provisionPermanentObject` creates the Object/Passport and then calls attachment. A failed attachment can therefore leave an already saved Object. Stable retry keys are useful but do not establish a complete customer recovery flow.
2. **New-index configuration is not enforced on every creation path.** IX-Core still permits an index with no policy when the field is absent. The older name-based root creation path omits it. The existing-record review transition does not complete that creation contract.
3. **The paired candidate requires actual authenticated verification.** Configure an existing index, classify an existing generic member, review an invalid direct machine connection, refresh, and verify another session. Then exercise Board, Recall, Return, and retry behavior using persisted readback.
4. **Financial acceptance is outstanding.** Opening the same machine through Equipment, a named location, its listing card, and Desktop must return the same authorized financial records. Acquisition costs, receipts, journals, and accounting-period state must be compared before and after workspace actions. The current audit has not established that live evidence.
5. **Production installation remains a separate gate.** Verify the actual installed process versions, obtain release-specific recovery evidence, deploy a complete compatible runtime, and verify source manifests, service health and customer workflows. Neither branch has been merged or installed in production by this work.

The next defined repair is creation and attachment recovery across frontend and IX-Core. No customer-specific policies, classifications, relationship deletions, or production data mutations were applied during this publication/audit work.
