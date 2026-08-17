# IXI FACE DATA CATALOG — SYSTEM CAPABILITY INVENTORY

Date: 2026-08-17
Status: Repository-derived V1

This inventory maps current repository systems to the data/capability surfaces available to future IXI Face Apps and the Chat/AI Face Compiler.

## 1. AOS object data contract

Primary sources:

- `components/ixi-aos/card-runtime/IXIAosObjectDataContract.js`
- `components/ixi-aos/card-runtime/IXIAosSemanticObjectPresentation.js`
- `components/ixi-aos/card-runtime/IXICardDefinitionEngine.js`

Current usable contract:

- stable `objectId`
- customer display name / singular / plural nomenclature
- persisted `fields`
- `fieldDefinitions`
- stable `fieldId`
- customer `label`
- `fieldType`
- semantic/presentation roles
- presentation order
- editability
- importability
- exportability
- API addressability
- import aliases
- persisted durable `businessIdentifiers[]`
- synthetic `businessIdentifier` editor field
- object metadata
- presentation metadata
- object capabilities
- effective permissions
- relationships
- primary media/image
- child aggregate metadata

Important existing doctrine in code:

- One persisted object contract serves manual creation, Object Studio, Excel/CSV import, API/AWS and card editing.
- Customer vocabulary is presentation truth.
- Stable identifiers/roles are machine truth.
- Business meaning must not be inferred from customer labels.
- Capabilities describe behavior.
- Effective permissions decide what the current actor may see/do.
- Explicit denial wins.

## 2. AOS permissions already present

`IXIAosSemanticObjectPresentation.js` currently resolves generic effective permissions from multiple migration-compatible shapes:

- `object.effectivePermissions`
- `object.permissions`
- `object.authorization.permissions`
- `object.access.permissions`
- `metadata.effectivePermissions`
- `definition.permissions`

Current authorization-aware surfaces include:

- object view
- create/add/contain
- edit/write
- TRAN$ACT capability
- console access
- delete/remove
- hide
- field visibility/editability
- relationship visibility
- media visibility

This is a strong runtime foundation, but it is not yet a complete company Face Library permission system.

## 3. Relationships

Current source:

- `IXIAosSemanticObjectPresentation.getObjectRelationships()`
- AOS relationship runtime/UI
- shared object system/container infrastructure

The Face layer can already consume relationship labels/targets after effective-permission filtering.

Required next step: expose stable relationship role/capability metadata in the authorized Face Data Manifest so a Chat compiler binds to semantic relationship identity rather than customer-facing labels.

## 4. Containers and aggregates

Primary sources:

- `components/ixi-object-system/IXIContainerEngine.js`
- `components/ixi-object-system/IXICollectionDeckEngine.js`
- `components/ixi-aos/card-runtime/IXIAosSemanticObjectPresentation.js`
- AOS container runtime

Current Face-safe behavior includes direct visible children and child aggregate groups generated from persisted field aggregate metadata.

Current supported aggregate reading discovered in the semantic presentation runtime includes count-by-value / count-each-value style aggregation.

Rule: direct children are truth. Recursive total descendants require an explicit source-owned projection and must never be guessed by a renderer.

## 5. Face runtime

Primary sources:

- `components/ixi-aos/face-runtime/IXIAosFaceDefinitionEngine.js`
- `components/ixi-aos/face-runtime/IXIAosFaceRuntime.jsx`
- `components/ixi-aos/face-runtime/IXIAosFaceModuleRuntime.jsx`
- `components/ixi-aos/console-runtime/IXIAosObjectConsole.jsx`

Existing doctrine:

- Face 1 and Face 2+ share one authoring contract.
- Face 1 is primary / bounded / Object operating rail.
- Face 2+ are application Faces / may scroll / no Object operating rail.
- A Face is the app module in AOS product terms.
- Specialized external renderers can occupy the application Face runtime.

Current built-in declarative primitives:

- field / object-field
- summary / metric
- relationships
- notes
- section

The runtime already provides a path for trusted hard-coded Face Apps through specialized renderers while retaining declarative Face definitions for simpler apps.

## 6. V12 primary card geometry library

Repository path:

`components/ixi-aos/cards/`

Current numbered geometry library discovered:

`001` through `017`.

These are neutral primary-card geometries, not business ontology names. Variants (for example 007 A/B/C or vehicle-specific field configuration on 009) remain configurations/variants of the underlying geometry rather than separate business types.

## 7. Console / chassis

Primary source:

`components/ixi-chassis/IXIObjectConsoleEngine.js`

Current constraints:

- minimum console depth: 1
- maximum console depth: 5
- one permanent Listing/Face-1 slot
- Face 1 is the primary listing/object slot
- additional module/Face slots can exist left/right

Architectural target confirmed by product doctrine:

- every non-Marketplace card Face exposes `$ TRAN$ACT`
- activating `$` opens TRAN$ACT as a native console application beside visible Face 1
- TRAN$ACT must not replace Face 1
- Marketplace remains excluded
- avoid nesting a second TRAN$ACT console inside the object console; converge on one chassis/slot system

## 8. IXI TRAN$ACT action system

Primary sources:

- `components/ixi-aos/transact/IXITransactModuleRegistry.js`
- `components/ixi-aos/transact/IXITransactContext.js`
- `components/ixi-aos/transact/IXITransactApp.jsx`
- `components/ixi-aos/transact/modules/`

Current registry exposes 22 transaction application IDs:

1. work-order
2. expense
3. technology-work
4. time
5. material
6. asset-acquisition
7. rental-expense
8. rental-income
9. service-quote
10. service-invoice
11. sold
12. collections
13. payables
14. treasury
15. general-ledger
16. financial-reporting
17. bill
18. receipt
19. purchase-order
20. quote
21. invoice
22. settlement

These are actions/application surfaces inside the single TRAN$ACT system. They are **not** separate AOS Face Apps for the purpose of object Face composition.

TRAN$ACT context already carries object/passport/entity/location/actor/work-order/permission references.

Current registry permission behavior supports module denial using `deny:<moduleId>`. This is useful but too coarse to become the final Face-data policy system.

## 9. Canonical TRAN$ACT / Financial read side

Primary source:

`components/ixi-aos/financial-runtime/IXIAosFinancialSnapshotRuntime.js`

This is one of the most important discoveries for the future Face system.

The file explicitly establishes that the Face must **not calculate**:

- commitment
- incurred cost
- paid/unpaid
- revenue
- receivable
- operating net
- recursive financial fact deduplication

Those values belong to the Financial Engine.

The canonical `createIXIAosFinancialViewModel()` already exposes:

### Scope

- passportId
- rootPassportId
- scopePassportIds

### Payable/cost side

- commitment
- remainingCommitment
- incurredCost
- paid
- unpaid
- projectedOutflow

### Revenue/receivable side

- revenue
- collected
- receivable

### Operating result

- operatingNet

### Financial movement

- inflow
- outflow
- neutral
- net

### Counts

- factCount
- documentCount

### Breakdowns

- byFinancialState
- byLineType
- byDocumentType

### Detail

- recentActivity
- raw facts

This read model is immediately valuable to Face Apps, subject to formal permission policy.

## 10. TRAN$ACT specialized engines

The `components/ixi-aos/transact/modules/` tree contains substantial app/contract/command/record/policy/projection infrastructure, including asset acquisition, bills, collections, customer service work order adapters, documents, expenses, financial reporting, general ledger, materials, notes, payables, photos, purchase orders and additional modules.

Rule for Face Catalog integration:

- Command engines are never raw Face data sources.
- Record engines are source-system internals unless a stable read contract exists.
- Existing Projection Engines are candidates for Face-safe exposure after permission/shape review.
- Canonical source-owned read models are preferred over Face-owned calculations.

## 11. Existing Face Lab application surfaces

`pages/facelab/` currently exposes application/test surfaces including at least:

- asset acquisition
- bill
- collections
- documents
- financial reporting
- general ledger
- material
- note
- payables
- photo
- purchase
- rental expense

The full directory should remain a continuing inventory source as Face Apps are promoted into the formal registry.

## 12. IXI Media

Primary source:

`components/machine-media/`

Discovered infrastructure:

- MachineMediaWorkbench
- createMachineMediaModel
- machineMediaIdentity
- machineMediaVerification
- machineMediaSharetribeAdapter
- workbench reducer/notices

This is a significant existing system, but currently machine-oriented. It should not be treated as a generic object-file API until a universal Face-facing adapter is defined.

Critical migration doctrine remains: legacy/current Sharetribe listing galleries must remain untouched; only objects with valid IXI Media identity/manifests use the IXI Media read path.

## 13. Passport

Current component source found:

`components/passport/PassportPresentationCard.jsx`

Passport identity exists more broadly in object/TRAN$ACT contexts, but the Face Catalog still needs a universal, explicit Passport read contract describing which Passport fields/history are safe for company Face Apps.

## 14. Shared object-system infrastructure

`components/ixi-object-system/` contains major cross-cutting infrastructure including:

- action notice engine
- collection deck engine
- command bus
- container engine
- drag type engine
- lineage engine
- machine mutation command bus
- machine mutation engine
- object engine
- object rail
- object transaction engine

Not all of this is Face data. In particular command/mutation/transaction infrastructure should stay behind controlled action APIs. Lineage/container/collection data should receive explicit Face-safe adapters.

## 15. Maintenance

Current AOS maintenance source found:

`components/ixi-aos/maintenance-runtime/IXIAosLocationMaintenanceRuntime.js`

Maintenance/condition information is present but the repository does not yet expose a broad, canonical Face Data Catalog projection for equipment/project/location maintenance. This is a priority adapter/projection gap for future hard-coded maintenance Face Apps.

## 16. Required next catalog layers

Repository inventory alone cannot tell us every customer-specific field or relationship because the server is deliberately generic and customer definitions live in AWS/account data.

The complete runtime system therefore needs two layers:

### IXI System Catalog

Versioned repository truth describing supported data contracts, projections, actions, permissions and Face App requirements.

### Authorized Customer Face Data Manifest

Generated at runtime from:

- IXI System Catalog
- customer object definitions
- customer field definitions
- customer relationship definitions
- customer capabilities
- approved TRAN$ACT projections
- current user's effective permissions

The Chat/AI Face Compiler receives only the second layer.

## 17. Non-negotiable security boundary

The Face compiler must never receive:

- raw AWS credentials
- arbitrary database access
- arbitrary SQL
- unrestricted command bus access
- unrestricted mutation engines
- raw financial write clients
- customer React/JavaScript execution privileges

The compiler may select/configure trusted hard-coded Face Apps or create validated declarative Face App definitions from the authorized catalog.
