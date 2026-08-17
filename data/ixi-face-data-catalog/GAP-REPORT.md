# IXI FACE DATA CATALOG — GAP REPORT

Date: 2026-08-17
Status: Repository-derived V1

This report separates what can safely power Face Apps now from what requires additional engineering.

## FACE-SAFE NOW

These already have sufficiently clear read-side semantics in current AOS code to be cataloged for Face use, subject to the object's effective permissions:

- objectId / stable object identity
- customer display name and nomenclature
- durable business identifiers
- persisted fields by stable fieldId
- field definitions, type, label, semantic/presentation role and order
- field editability/importability/exportability/API addressability metadata
- object metadata/presentation metadata
- effective object permissions
- object capabilities
- effective action capabilities
- permission-filtered object relationships
- primary image/media resolution from AOS object media
- direct visible child collections supplied to container runtime
- child aggregate groups driven by persisted aggregate metadata
- custom field definitions through the AOS object data contract

## FACE-SAFE WITH FORMAL POLICY

These have a useful read contract today, but should not be exposed broadly to customer Face Apps until explicit data scopes/permission rules are registered:

### Canonical financial snapshot

Existing read adapter:

`createIXIAosFinancialViewModel()`

Available values:

- commitment
- remaining commitment
- incurred cost
- paid
- unpaid
- projected outflow
- revenue
- collected
- receivable
- operating net
- inflow
- outflow
- neutral movement
- net movement
- fact/document counts
- financial-state breakdown
- line-type breakdown
- document-type breakdown
- recent activity
- source-owned financial facts

This is the immediate foundation for TRAN$ACT-fed Face Apps.

### Console/chassis capability

The shared console already supports a permanent Face-1/listing slot and up to five total slots. Policy/integration work is required to make universal `$ TRAN$ACT` a native console application beside Face 1 across every non-Marketplace card family.

### Action notices / presentation feedback

Useful to trusted Face Apps but not a business-data source.

## NEEDS ADAPTER

The source system exists, but we need a stable Face-facing read contract before Chat or a large hard-coded Face library should depend on it.

- universal Passport view model
- universal object lineage/history view model
- IXI Media object-level adapter beyond current machine-specific infrastructure
- document/file capability separate from transaction document records
- generic location maintenance projection
- generic asset/equipment maintenance projection
- meter history / utilization projection
- location history projection
- assignment/deployment projection
- crew membership / workforce deployment projection
- relationship-role manifest suitable for compiler binding
- recursive container descendant summary
- existing specialized Face Lab applications promoted into a formal Face App registry contract

## NEEDS SOURCE-OWNED PROJECTION

The underlying facts may exist, but a Face must not derive these ad hoc. They require canonical, source-owned definitions.

Priority TRAN$ACT projections:

- asset maintenance spend YTD
- asset lifetime maintenance/repair cost
- asset cost per hour
- asset rental income/expense performance
- project cost to date
- project labor cost
- project material cost
- project equipment cost
- project committed cost
- project billed
- project collected
- project receivable
- project projected margin
- customer receivable summary
- vendor payable summary
- location operating spend
- crew-attributable labor/equipment/material cost where attribution is supported

Priority operational projections:

- equipment utilization
- equipment downtime
- PM/service due
- active condition/fault count
- project production plan vs actual
- workforce/crew active assignment
- certification/permit expiry rollups

Rule: if a source-owned projection does not exist, a Face compiler must not invent business semantics or formulas simply because raw numeric fields exist.

## ACTION-ONLY / DO NOT TURN INTO FACE DATA

These are operational/transaction capabilities. A Face may launch approved actions, but the underlying command path is not a raw data source:

- TRAN$ACT Work Order actions
- Expense commands
- Purchase Order commands
- Bill/Invoice commands
- Time-entry commands
- Material-usage commands
- Asset Acquisition commands
- Rental transaction commands
- Service Quote/Invoice commands
- Sold/Settlement commands
- Collections/Payables commands
- Treasury commands
- General Ledger posting/close commands
- shared object command bus
- mutation engines
- object transaction engine
- financial command client

## INTERNAL — DO NOT EXPOSE TO CHAT FACE COMPILER

- AWS credentials
- database credentials
- unrestricted server endpoints
- arbitrary SQL/query execution
- raw command buses
- raw mutation engines
- unrestricted React/JavaScript execution
- server implementation internals not represented by an approved catalog capability

## PERMISSION GAP

The repository already has strong object/field/relationship effective-permission primitives and coarse TRAN$ACT module denial, but a customer Face Library needs a formal policy layer for:

- create draft
- edit draft
- clone
- publish
- retire
- assign
- manage Face permissions
- Face use/view
- data-capability visibility inside a Face
- sensitive Face section visibility
- TRAN$ACT projection visibility
- TRAN$ACT execution permissions

Read access must never imply transaction/write permission.

## FACE LIBRARY GAP

Required persistent concepts not yet proven as a complete repository system:

- company-owned Face Library
- draft vs published Face versions
- immutable/versioned publication history
- publish/retire audit trail
- assignment of Face Apps to compatible object definitions
- compatibility requirements per Face App
- system / industry / company / personal-draft scopes
- safe Chat Face Compiler API
- Face validator
- authorized Face Data Manifest API

## RECOMMENDED BUILD ORDER

1. Keep this catalog as repository truth.
2. Formalize stable Face App registry/schema.
3. Promote canonical financial snapshot into explicit permissioned Face projection registry.
4. Build relationship-role + customer-schema manifest adapter.
5. Build Face Library persistence/versioning.
6. Build Face permission policy service.
7. Build validator + compatibility engine.
8. Build authorized Face Data Manifest endpoint.
9. Integrate universal `$ TRAN$ACT` into the common non-Marketplace console while retaining Face 1.
10. Build deterministic Face Studio against the exact same contracts.
11. Add Chat/AI Face Compiler as a client of those contracts.
12. Scale hard-coded trusted Face App library from the same registry.

## KEY CONCLUSION

The repository already contains enough foundational architecture to justify building this system. The main missing work is not raw UI rendering. It is the **catalog + projection + policy + library + validation layer** that makes hundreds of trusted Face Apps and customer-authored Chat Faces safe, reusable and company-specific.
