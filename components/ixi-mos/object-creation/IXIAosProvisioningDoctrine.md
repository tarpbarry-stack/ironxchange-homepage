# IXI AOS Object Provisioning Doctrine

## Purpose

This document defines the permanent creation boundary for customer-defined IXI AOS objects.

The provisioning layer is infrastructure. It must not infer customer business meaning from names, labels, card titles, categories, field labels, container names, presentation vocabulary, or any IXI-authored business taxonomy.

Examples of prohibited infrastructure logic include checking for words such as `equipment`, `truck`, `welder`, `yard`, `job`, `employee`, or any other customer-facing noun.

## Draft boundary

Pressing `+`, opening Object Studio, adding a row to an import preview, or otherwise beginning creation produces a draft only.

A draft may have a `draftId` used for client-side state and idempotent commit correlation. It is not a permanent AOS Object and must not receive a permanent `objectId`, IXI Passport, or TRAN$ACT financial identity.

An abandoned draft creates no durable object.

## Permanent creation boundary

A permanent object is created only after the customer has supplied a real `displayName` and the persisted definition's required creation rules have been satisfied.

Business Identifier requirements are definition-driven. They are not universal IXI vocabulary.

A successful permanent creation must establish the following invariant:

- permanent AOS `objectId`
- permanent IXI `passportId`
- durable Object-to-Passport link
- same object becomes addressable by IXI TRAN$ACT

A newly provisioned object must not be reported as successfully created without Passport identity.

## Identity separation

Three identities may coexist and must not be conflated:

- customer business identifier: customer-owned operating nomenclature
- `objectId`: AOS internal durable identity
- `passportId`: IXI cross-system identity

Customer names and business identifiers remain authoritative customer data.

## Business-neutral contract

The provisioning contract may understand technical fields such as:

- `entityId`
- `definitionId`
- `definitionKey`
- `displayName`
- `businessIdentifiers`
- `fields`
- `media`
- `cardTemplateSlug`
- `cardTemplateVersion`
- `actorId`
- `source`
- `sourceReference`
- `draftId`
- `metadata`

It must not branch on customer vocabulary.

## Idempotency

Every permanent create command requires a stable provisioning key.

Repeated submission of the same commit intent must return the same permanent Object and Passport rather than create duplicates.

This requirement applies to:

- double-click Save
- browser retry
- network timeout retry
- Object Studio Launch retry
- Chat/API retry
- spreadsheet/bulk row retry

## Edit behavior

Editing a permanent object's name, fields, media, card design, Faces, or placement must never create a new Passport.

Passport identity follows the durable object identity, not its presentation.

## Archive/delete behavior

Archive/soft-delete must not silently erase or reuse Passport identity. Historical financial, document, audit, and relationship references must remain coherent according to permissions and retention policy.

## Bulk import

Bulk import is a collection of independently idempotent object provisioning commands.

Each import receives an import identity and each accepted row receives a stable row identity/provisioning key.

Large imports must be resumable. A failure on one row must not require recreating already successful rows.

## TRAN$ACT

Passport identity makes the object financially addressable. It does not fabricate financial activity.

A new object may correctly have an empty TRAN$ACT snapshot until source-owned financial records exist.

## Cards and Faces

Cards and Faces do not provision identity.

They consume the already-provisioned object and its authorized data.

The `$` TRAN$ACT actuator is presentation of an object capability, not the creator of the object's financial identity.

## Source ownership

The provisioning layer owns object birth and identity establishment only.

Other domains continue to own their truth:

- AOS Object Service owns persisted object state
- Passport owns cross-system identity
- IXI Media owns canonical media manifests
- TRAN$ACT owns authorized financial projections
- Relationship Service owns relationships
- Container/Projection Services own container state and aggregates
- Face Library owns Face definitions, assignment, and runtime compatibility
