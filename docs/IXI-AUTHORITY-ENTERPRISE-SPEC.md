# IXI AUTHORITY — ENTERPRISE ACCESS CONTROL SPEC

IXI Authority is the object-neutral enterprise authorization layer for AOS and TRAN$ACT.

## Core doctrine

- People receive authority.
- Objects receive policy.
- Customer-facing names do not determine security semantics.
- Explicit administrative action grants authenticated access to an existing AOS object.
- Any Passport-bearing object may carry policy.
- Container/ancestor policy may propagate to descendants.
- Sensitive objects must be filtered server-side; React hiding is never sufficient security.
- Decisions are explainable and auditable.
- Default is deny.

Every protected operation is evaluated as WHO + ACTION + TARGET + SCOPE + POLICY + RECORD STATE -> ALLOW / DENY.

## Initial capability families

AOS: discover, view, create, edit, move, archive, delete.

TRAN$ACT: open, execute.

Financial: view, create, approve, pay, GL, period close.

Authority: view, manage.

Identity: invite, suspend.

## Subjects

principal, role, group, entity-member, all-authenticated.

## Scopes

target, target-and-descendants, entity, location, selected-passports.

## TRAN$ACT administration surface

Every AOS card exposes TRAN$ACT, so ACCESS / POLICY is a universal TRAN$ACT module. An authorized administrator may grant login access to any existing AOS object by supplying an email and initial role. The object's customer-facing label/type is irrelevant.

Authorized administrators may manage object policy, roles, grants, denies, scopes, and account state. Non-admin users receive a read-only effective-access view.

## Inheritance

Policies may propagate to descendants. Enterprise structures can secure whole branches such as ACCOUNTING, LEGAL, CONFIDENTIAL ACQUISITIONS, EXECUTIVE, or any customer-defined container without individually permissioning each child.

The evaluator returns policyId, ruleId, sourcePassportId, reason, and metadata so a decision can be explained.

## Server requirements

Required IX-Core endpoints:

- GET /authority/access-context
- GET /authority/policies/:passportId
- PUT /authority/policies/:passportId
- POST /authority/evaluate
- POST /identity/principals/invite
- POST /identity/principals/:principalId/suspend

Server-side enforcement must protect AOS discovery/read, object mutation, moves, TRAN$ACT commands, IXI Financial commands, approvals, payments, GL, period close, and Authority administration.

Policy persistence must be durable, revisioned/audited, idempotent where appropriate, and protected by server-side authorization. Hard delete is not normal runtime authority.

## Compatibility

The current TRAN$ACT `deny:<moduleId>` mechanism remains supported during migration but is not the final authority model. Legacy Person/Employee cards may participate as ordinary AOS objects and must not become the permanent security ontology.

## Frontend foundation

- components/ixi-aos/authority/IXIAuthorityRegistry.js
- components/ixi-aos/authority/IXIAuthorityContract.js
- components/ixi-aos/authority/IXIAuthorityEvaluator.js
- components/ixi-aos/authority/IXIAuthorityClient.js
- components/ixi-aos/authority/IXIAuthoritySelfTest.js
- components/ixi-aos/transact/modules/access-policy/IXIAccessPolicyApp.jsx

The frontend never owns canonical authorization truth. It administers and projects the same model enforced by IX-Core.
