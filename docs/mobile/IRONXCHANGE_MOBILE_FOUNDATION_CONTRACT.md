# IronXchange Mobile Foundation Contract

Baseline: `main@7e7cb7bf026384394cc3305d986fde2b328ee981`
Branch: `mobile/commercial-aos-v1-foundation`

## Tranche 0/1 scope

This tranche proves only the mobile runtime, shell, and one real production machine card.

No Console, Stack, Search, DnD, Pocket changes, Theater changes, TRAN$ACT changes, slug redesign, mobile-only machine state, or alternate mobile card implementation is authorized in this tranche.

## Immutable desktop contracts

The following remain authoritative and unchanged:

- `components/ixi-machine-card/IXIMachineCard.js` card-family router.
- Marketplace/private/owned-private/auction card family implementations.
- Existing listing-card DOM, faces, rail, actuators, photo behavior, and business actions.
- Existing slug/detail routes.
- Existing IXI movement, container, Stack, Pocket, Console, AOS, TRAN$ACT, Passport and persistence engines.
- Existing desktop page behavior and geometry.

## Mobile architecture rule

Mobile is a presentation runtime over the same IronXchange objects and business logic. It must not create alternate machine IDs, alternate persistence, alternate card families, or a mobile-only business model.

## Tranche 1 card rule

The certification page must render the real production `IXIMachineCard` and load a real active production listing through `IXIListingsEngine`.

Marketplace native certification geometry is 300x400. The mobile shell scales the whole card plane; it does not independently resize card internals.

Target portrait widths:

- 320
- 360
- 375
- 390
- 412
- 430

The single-card shell uses 8px side gutters and caps whole-card scale at 1.4x.

## Certification gate

Tranche 1 is green only when:

1. one real production card renders at every target phone width;
2. the page has no body-level horizontal overflow;
3. the card remains the production card, not a clone;
4. the native 300x400 ratio is preserved by whole-card scaling;
5. `main` is unchanged;
6. desktop card and AOS behavior have not been modified;
7. the Next.js production build passes;
8. the foundation contract test passes;
9. owner visual inspection approves the preview.

No Tranche 2 work begins before this gate is green.
