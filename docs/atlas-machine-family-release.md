# Atlas Machine Card families — release evidence

Built September 20, 2026. PR #400 targets `main`.

## Scope

- Private inventory, Auction and URL-reference workbenches use the production Machine Card and family Console router.
- Four selectable faces, Inspect/Operate, geometry-based callouts, seven size settings, five-panel Console limit, local sample receipts and reset.
- Inventory, Auction and URL Import header Help enters the corresponding family lesson. Search, System Index, family navigation and related guides preserve access to the full Atlas.
- A URL import remains an origin, not a new family or ownership grant. Private samples use private access and no public channel. Edits retain Object, Passport, source and ownership.
- The explicit demo capability blocks real machine writes, global owner-action bridge registration, financial workspace mounts, analytics and sharing. Sample callbacks handle bid packs and closeout.
- Auction removal wording now matches the endpoint: listing removal preserves the permanent Passport.
- Existing unconnected EMAIL/TEXT/PDF face shortcuts are described honestly. They are not represented as completed delivery workflows.

## Verification completed

- Required paired gate: **610 frontend tests and 418 backend tests passed**, pinned core `373bd009bdf6644940e17390b2bf3b2a12fdae45`. The branch incorporates main through `5ccb2d5d` and preserves its separate administrator prerequisites.
- Runtime regression verifies that the actual private runtime saves a non-owned sample without invoking the production writer, registering global actions or mounting financial work. The normal runtime still invokes its writer exactly once.
- Boundary regression verifies that linked navigation is blocked while nested photo/editor controls retain their events.
- Ownership, reset isolation, contextual links, malformed-link fallback and cross-Atlas search tests pass.
- Production builds and both PR CI workflows passed on intermediate candidates. Final candidate CI is tracked on the PR.
- Browser on candidate `9d580a2861bdae8892a25b01b56e54af00e22f0b`: Private hours saved as 4900; seller description saved and appeared in the attached Console; Send produced a local receipt; Auction bid-pack edit saved; closeout Cancel returned to the choices; confirmed removal produced a simulated receipt with Passport preserved.
- Browser layout checks on candidate `5557f36fe5d47c23bc94bc1a58405ebfd2da3b26`: 320, 375 and 430 px frames had document widths equal to their scroll widths (305, 360 and 415 px with desktop scrollbars). The card assembly has its own horizontal scrolling region.
- Final reference layout on candidate `ffd8d5105115bb5cee43aadfe6729234b852e9f9`: 320 px frame, document and scroll widths both 305 px.
- Temporary responsive review page was removed from the release source. It exists only on historical preview deployments.

## Remaining release checks

The shared browser repeatedly returned CDP input/evaluation/screenshot timeouts and browser-recovery errors. A refresh restored some operations, but final browser verification could not be completed reliably. No browser-control fallback or synthetic screenshot was used.

Before merge: verify final visual layout, photo arrows, private placement indicator, all family faces, callout alignment through size changes, Operate/Reset, source-note edits and full navigation. Recheck narrow-screen interactions; the completed width checks are layout evidence, not physical-phone touch testing. Confirm final PR CI is green and update the branch if main advances.

After merge: verify the deployed SHA/alias and run the required actual AOS/TRAN$ACT browser checks, including fresh and independent second visits and gateway timings. This Atlas release changes no backend data or tenant permissions; preserve the current paired backend release and its existing recovery proof.

Until these checks are completed, this is a tested release candidate, not a verified production release.
