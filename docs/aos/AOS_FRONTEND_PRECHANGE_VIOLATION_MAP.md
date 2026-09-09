# AOS frontend pre-change violation map

Base: `ecd11820473771f3eb4b4707f4cf2642cf18d5b3`

This map records the frontend state before implementation on
`aos/commercial-work-normalization`. Line numbers refer to the base commit.

| Concern | File and base lines | Pre-change behavior / violation |
| --- | --- | --- |
| Passport discovery | `lib/mos/ixiAosPassportPresentation.mjs:43-84` | Shared helper reads top-level Passport fields, `passport`, Sharetribe `publicData`, IXI media, provisioning metadata, and the first `ixi-passport` identity. It does not read `metadata.passportIdentity.passportId`, all Passport identities, or historical source bindings, and it silently picks the first valid value. |
| Passport discovery | `components/ixi-aos/card-runtime/IXIAosSemanticObjectPresentation.js:457-461` | Card presentation independently infers Passport presence from a smaller field set and uses that inference to grant TRAN$ACT capability. |
| Passport discovery | `components/ixi-aos/card-runtime/IXIAosCardCommandContext.jsx:35-43` | Command notice identity falls back from object identity to Passport identity, allowing a non-object identifier to become the runtime command key. |
| Passport discovery | `components/ixi-aos/card-runtime/modules/IXIAosCommercialEditorBridge.jsx:16-24` | Editor notice identity independently falls back to Passport, then business identifier/template/title. |
| Passport discovery | `components/ixi-machine-card/private/IXIOwnedPrivateListingRuntime.jsx:52-83` | Private machine TRAN$ACT adapter independently discovers Passport and object identity from listing fields and then manufactures capabilities. |
| Listing-to-object matching | `pages/aos/work.js:1276-1342` | Page-local resolver scans active objects by object ID, `metadata.sourceListingId`, one Sharetribe identity, then Passport. Collision checks exist for listing and Passport matches, but the logic is not shared with registry admission. |
| Listing-to-object matching | `components/ixi-mos/workspace/useIXIAosWorkspaceRegistry.js:54-82,134-158` | Two independent presentation matchers index listing ID and Passport. Duplicate Passport listings are silently ignored after the first match. |
| Registry insertion | `components/ixi-mos/workspace/useIXIAosWorkspaceRegistry.js:268-356` | MOS objects are inserted by `objectId`; the same machine listing is then inserted again by listing ID. System Index records are inserted through a third path. One machine can therefore have two registry entries and two card families. |
| Duplicate runtime identity | `components/ixi-mos/workspace/IXIAosWorkspaceContainerProjection.mjs:5-30` | Ad-hoc alias sets include object/listing/Passport/source values. Any overlapping value is treated as identity equality without alias kind, tenant, active-state, or collision validation. |
| Machine versus object rendering | `components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx:86-110,270-286` | A record with both `objectId` and `entityId` is routed to a numbered AOS card, while a listing-keyed copy routes through the established machine card. Rendering depends on which registry key delivered the record. |
| Machine versus object rendering | `components/ixi-chassis/IXIBoard.js:53-72,360-570` | Non-custom items use `getListingId` as operating identity and route through `IXIMachineCard`. This preserves the established machine UI only while machines remain listing-shaped/listing-keyed. |
| Machine versus object rendering | `components/ixi-machine-card/IXIMachineCard.js:36-96` | Established Private/Auction/Marketplace family selection exists and is the correct machine presentation path, but it receives listing identity rather than guaranteed canonical object identity. |
| System Index assembly | `lib/mos/buildAosSystemIndexes.js:94-143,184-296,397-486` | Durable index objects require canonical IDs, but Equipment and For Sale members remain raw Sharetribe listings, creating a parallel identity universe. Adapter identity is technical, while membership and presentation are still listing-backed. |
| System Index assembly | `components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx:53-81,408-440` | Locations are recognized partly by English title/name; Equipment and Locations are forcibly displayed as English titles and forced onto Card 018, overriding persisted customer presentation data. |
| Temporary membership bridge | `pages/aos/work.js:1611-1626,3158-3168` | Active membership reads and relationship creation directly depend on the English literal `contains`. |
| Temporary membership bridge | `components/ixi-mos/workspace/useIXIAosWorkspaceRegistry.js:126-174` | Registry independently repeats the same `contains` matching rule, spreading the bridge into another component. |
| Legacy direct parent | `lib/mos/buildAosSystemIndexes.js:126-143,305-376` | Persisted System Index membership is assembled from `directContainerId`. |
| Legacy direct parent | `components/ixi-mos/workspace/useIXIAosWorkspaceRegistry.js:54-124` | Legacy `directContainerId` remains a read path for rail membership. |
| Durable mutation from container command | `pages/aos/work.js:1647-1775` | `clearContainerChildrenToParent` calls `commitMosContainerPlacement` for every child and rewrites durable exclusive-parent state. This is not Board/Recall/Return, but it overlaps the session-engine owner and is excluded from this branch. |
| `canContain` becomes create | `components/ixi-aos/card-runtime/IXICardDefinitionEngine.js:297-300` | `canIXICardCreate` returns `canCreate || canContain`. |
| `canContain` becomes create | `components/ixi-aos/card-runtime/IXIAosCardTemplateAdapter.js:24-43` | Template adaptation promotes `canContain` into `canCreate` and receive-drop capability. |
| `canContain` becomes create | `components/ixi-aos/card-runtime/IXIAosSemanticObjectPresentation.js:425-499` | Action capabilities treat contain and Person classification as creation authority; permission aliases also include `contain`/`canContain`. |
| Forced create | `components/ixi-mos/workspace/useIXIAosWorkspaceRegistry.js:285-303` | Every MOS object receives `canContain: true` and `canCreate: true` during registry insertion. |
| Forced create and TRAN$ACT | `components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime.jsx:88-112` | Runtime overwrites every object with contain, create, TRAN$ACT, and Console permission plus `transactEligible: true`. |
| Forced create and TRAN$ACT | `components/ixi-machine-card/private/IXIOwnedPrivateListingRuntime.jsx:75-87` | Machine adapter forces create, TRAN$ACT, edit, and Console capability on the listing-derived object. |
| Card 007/017 fallback meaning | `components/ixi-aos/card-runtime/IXIAosOperatingCardResolver.mjs:45-89` | Missing presentation metadata defaults Person/Employee to Card 007 and `canContain` objects to Card 017; everything else defaults to Card 007. Identity/capability therefore determines presentation. |
| Card-specific persistence | `components/ixi-aos/cards/001/IXIAosCard001LocationV12.jsx:182-204` and generic layouts under `components/ixi-aos/cards/generic/` | Multiple visual cards upload media and construct save payloads locally. Numbered entry components mostly share `IXIAosCommercialEditorBridge`, but visual layouts still retain card-specific save paths. |
| Shared persistence path | `components/ixi-aos/card-runtime/modules/useIXIAosObjectEditSession.js:49-147` | A shared edit session exists, but falls back to calling `commitMosObjectCommand` itself when no adapter is supplied, so persistence admission is not strictly owned by the workspace boundary. |
| Board/Recall/Return | `pages/aos/work.js:1778-2185` | Board, Recall, and Return mutate only `workspacePlacements` and save the layout; they do not create/end relationships or provision objects. Their snapshot is container-scoped and temporary, which is Agent 2 scope. |
| Other workspace movement | `pages/aos/work.js:2187-2237,2840-2970,3240-3260` | Sorting, pockets, stacks, and ordinary extraction use workspace commands/layout persistence only. The protected canonical-container drop additionally creates the temporary durable membership relationship but does not provision or rewrite `directContainerId`. |

## Safety behavior that must survive replacement

- `pages/aos/work.js:1276-1342,3081-3138` fails closed for unresolved or colliding active identity.
- `pages/aos/work.js:3081-3243` contains no provisioning call and does not update `directContainerId` or append a machine.
- `lib/mos/ixiMosBrowserGatewayClient.js:732-798` requires canonical relationship readback after an idempotent command.
- `components/ixi-mos/workspace/IXIAosWorkspaceContainerProjection.mjs` prevents a placed listing and its canonical machine from rendering as two rail items, but must be replaced by canonical reference projection rather than heuristic alias overlap.

## Ownership boundary

- No IX-Core file, API contract, Passport record, production data, or AWS resource is changed here.
- Session-origin, return-snapshot, and cross-session undo semantics remain Agent 2 scope.
- The IX-Core neutral membership behavior/definition ID is unavailable at this base. The frontend may isolate the emergency bridge but must not invent its replacement.
