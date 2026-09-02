# AOS Creation Entry Audit

Branch: `feature/aos-creation-entry-unification-v1`

## Container + / manual Save

`useIXIMosObjectCreation` already enforces the correct lifecycle:

- `+` creates an `aos-draft:*` browser-memory object;
- draft IDs are not written to durable workspace layout;
- Save requires the existing draft identity and a customer name;
- Save calls `provisionAosObject()`;
- the draft is retained until provisioning, Passport, TRAN$ACT, containment and durable workspace-ID replacement succeed;
- successful Save replaces the draft ID with the authoritative permanent Object ID.

No alternate permanent create path is required.

## Object Studio

`commitAosStudioLaunch()` already terminates new permanent Studio Objects at `provisionAosObject()` after optional explicit Definition resolution. The provisioning client now applies the shared canonical creation receipt invariant.

## Bulk CSV/XLSX

Bulk intake already creates an authoritative IX-Core Import Job and executes rows server-side. Each row has a durable provisioning key and IX-Core returns row-level `objectId` / `passportId`. This branch adds explicit receipt auditing so `created` rows without both permanent identities are detectable as contract violations.

## Trusted API / Chat

`/api/aos/object-commit` already authenticates signed requests and `commitTrustedAosObject()` already forwards them to `/objects/provision`. This branch replaces its duplicate receipt logic with the same canonical receipt checker used by browser provisioning.

## Result

All supported creation entry points converge on IX-Core permanent provisioning. The remaining differences are intake UX and provenance, not Object identity semantics.
