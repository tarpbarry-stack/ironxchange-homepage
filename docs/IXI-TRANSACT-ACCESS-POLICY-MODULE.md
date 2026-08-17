# IXI TRAN$ACT — ACCESS / POLICY

`ACCESS / POLICY` is the TRAN$ACT security application for an AOS Passport-bearing object or container.

It is intentionally generic. Authority is attached to stable Passport identity and AOS structural relationships, not customer vocabulary. A customer may call a secured container Employees, Welders, Field Techs, Legal, Acquisitions, Yard 3, or anything else.

## Backend authority

The frontend is not an authorization engine. IX-Core remains authoritative for:

- Cognito JWT verification
- IXI Identity and active Membership resolution
- IXI → AOS Entity binding
- target and ancestor Passport graph resolution
- explicit allow / deny evaluation
- policy precedence
- immutable policy revisions
- AOS discover/view/edit/move/delete enforcement

## Browser contract

TRAN$ACT calls same-origin Next.js API routes under `/api/ixi/authority/*`. Those routes proxy to IX-Core using an HttpOnly Cognito access-token cookie. The browser never posts trusted roles, permissions, entity ownership, ancestor lists, or server authority context.

## UI behavior

The app is readable by an authenticated principal. Mutating controls appear only when the authenticated access context includes `authority.manage`.

The first UI exposes:

- current policy status and revision
- target vs descendant propagation
- existing explicit allow/deny rules
- subject types: role, person/principal, group, all authenticated
- core AOS and TRAN$ACT capabilities
- rule removal through revisioned policy replacement
- admin notes

Future expansions should consume authoritative server registries for role/group/principal pickers and invitation workflows rather than hard-coding customer nomenclature.
