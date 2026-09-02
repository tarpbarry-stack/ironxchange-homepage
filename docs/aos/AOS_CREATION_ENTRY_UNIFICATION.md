# AOS Creation Entry-Point Unification

## Contract

There is one permanent AOS birth boundary.

Creation channels may prepare intent differently, but they do not own separate permanent Object semantics.

Supported channels:

- container `+` / manual Save;
- Object Studio;
- Bulk CSV/XLSX import;
- trusted API;
- trusted Chat/agent integration.

Every permanent birth must terminate at the IX-Core `ixi-aos-object-provision-v1` boundary and return a verified receipt containing:

1. permanent `objectId`;
2. permanent `passportId`;
3. Object-side Passport identity matching the Passport record;
4. `transact.eligible === true` for the same Object and Passport;
5. the authenticated AOS Entity scope.

## Draft law

Container `+` is not a permanent create command.

It creates a client-only draft. The draft may be named, populated, designed and discarded without creating:

- a MOS Object;
- a Passport;
- a TRAN$ACT identity;
- durable workspace membership.

The first successful Save is the permanent birth event. A stable draft/intent identity supplies idempotency.

## Object Studio

Object Studio may optionally resolve an explicit customer Definition before permanent creation. Merely naming an Object never creates a Definition.

After Definition resolution, Object Studio uses the same provisioning client and therefore the same Object + Passport + TRAN$ACT receipt requirements.

An existing permanent Object is updated in place; its Object ID and Passport must survive the edit unchanged.

## Bulk / Excel

A file is an Import Job, not a collection of browser-created Objects.

Each valid row has a durable row key and executes independently through IX-Core provisioning. Successful rows retain their Object and Passport identities while failed/retryable rows can be retried without duplicating successful births.

A row marked `created` is not considered a complete commercial receipt unless both `objectId` and `passportId` are present. `auditAosImportJobIdentity()` enforces this client-side invariant over the authoritative IX-Core job ledger.

## Trusted API / Chat

Trusted API and Chat commits use the signed `/api/aos/object-commit` integration and a stable `requestId`. The server converts that request to the same IX-Core provisioning call and validates it with the same canonical creation receipt checker.

No "AI Object", "API Object", "Bulk Object" or "Studio Object" permanent class exists. These are provenance channels only.

## Identity and business neutrality

The permanent identity anchors are technical:

- `objectId`;
- `passportId`;
- `entityId`;
- optional explicit `definitionId`.

Customer names, categories, labels and field values are not technical foreign keys and must never be used to infer whether an Object receives a Passport or TRAN$ACT identity.

## Failure semantics

A caller must not present creation as successful when any receipt invariant fails.

Network retry uses the same idempotency identity. Bulk retries preserve successful rows. Draft UI state is replaced by the authoritative permanent Object only after the server confirms the permanent receipt.

## Next boundary

Once a permanent Object exists, presentation must hydrate from the authoritative authorized Card/Face manifest rather than from creation-channel-specific client state.
