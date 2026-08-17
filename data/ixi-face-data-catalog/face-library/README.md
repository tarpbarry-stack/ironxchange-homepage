# IXI Company Face Library

Status: **runtime/domain contract implemented; IX-Core persistence endpoint required**

## Doctrine

A Face is the application module attached to an IXI object/card. Face 1 remains the primary bounded object face. Face 2+ are application faces. `$ TRAN$ACT` is one separate universal transaction module and may provide authorized read projections to faces.

The Company Face Library owns reusable customer Face Apps. It does not own object truth, financial truth, identity truth or authorization truth.

## Trust boundary

Browser -> `/api/ixi-face-library/*` -> explicit Vercel allowlist proxy -> IX-Core `/aos/face-library/*` -> durable server persistence.

The browser MUST NOT:

- persist the Face Library in localStorage/sessionStorage;
- decide actor identity, company/entity identity, roles or effective permissions;
- publish a Face without server-side validation;
- mutate an immutable published version;
- create arbitrary financial projections;
- attach a Face by guessing business meaning from labels.

IX-Core/AWS MUST resolve the authenticated actor, tenant/entity, effective permissions, object definitions, authorized Face Data Manifest and durable audit state.

## Lifecycle

`DRAFT -> VALIDATE -> PUBLISH -> ACTIVE -> RETIRE`

Published and retired versions are immutable. Editing an active Face creates a new draft version. Publication switches the active version pointer only after validation succeeds. Old versions remain auditable/recoverable.

## Concurrency

All mutating routes support optimistic concurrency through `ETag` / `If-Match`. Conflicting edits must return HTTP `409` or `412`; clients must never silently overwrite a newer draft.

All consequential POST/PUT/DELETE operations support an `Idempotency-Key` so retries cannot duplicate publications or assignments.

## Permissions

Authoring actions are separate from data scopes and assignment scopes.

Actions:

- `library.view`
- `face.create`
- `face.edit`
- `face.clone`
- `face.publish`
- `face.retire`
- `face.assign`
- `face.unassign`
- `face.permissions.manage`

A user permitted to build a Face does not automatically gain access to financial/HR/legal data, and a user permitted to view a Face does not automatically gain TRAN$ACT execution privileges.

Explicit deny always wins.

## Assignment

Assignments target stable identity only:

- `objectDefinitionIds[]`
- `requiredCapabilities[]`
- optionally explicit `objectIds[]`

No assignment behavior may infer object meaning from customer labels such as PEOPLE, PROJECT, EQUIPMENT, CUSTOMER, etc.

## Runtime

`resolveAuthorizedFaceRuntimeSet()` applies defense in depth after the server response:

1. object Authorized Face Data Manifest must be authorized;
2. assignment must match stable definition/capability identity;
3. Face must reference an active immutable published version;
4. current data scopes must permit every requested capability;
5. Face App authorization engine must approve all required data/permission requirements.

A failed check removes the Face from the runtime set rather than rendering sensitive placeholders.

## Server endpoints

See `api-contract.json`.

## Current implementation

Frontend/domain/runtime:

- `components/ixi-aos/face-library/IXIFaceLibraryContract.js`
- `components/ixi-aos/face-library/IXIFaceLibraryPolicyEngine.js`
- `components/ixi-aos/face-library/IXIFaceLibraryVersionEngine.js`
- `components/ixi-aos/face-library/IXIFaceLibraryAssignmentEngine.js`
- `components/ixi-aos/face-library/IXIFaceLibraryValidationEngine.js`
- `components/ixi-aos/face-library/IXIFaceLibraryRuntimeResolver.js`
- `components/ixi-aos/face-library/IXIFaceLibraryClient.js`
- `pages/api/ixi-face-library/[...path].js`

The currently connected `tarpbarry-stack/ixi-core` GitHub repository does not match the current production IX-Core architecture used by AOS/TRAN$ACT, so the durable server implementation must be installed in the authoritative production IX-Core codebase rather than silently written into an obsolete/minimal backend tree.
