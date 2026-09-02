# IXI AOS Face Data — Two-Source Doctrine

## Core law

The **Object is the truth**.

A Face may display factual information about an Object from only two source classes:

1. **TRAN$ACT** — records and authorized projections created against the Object, including work orders, expenses, sales, technical tickets, freight tickets, inspections, reviews and other TRAN$ACT documents/events.
2. **Permissioned user-maintained fields** — customer-defined fields and values entered or edited by an authorized user for the Object / Face experience.

Customers may define, add, remove, rename, arrange and edit the fields they choose to capture. That freedom does not create a third source class; it remains permissioned user-maintained field data.

## What is not a third factual source

The Face Data Catalog may expose relationships, media, object definitions, labels, card geometry, Face definitions, capabilities, aggregates, permissions and other system context. These remain valid and useful for authorization, navigation, presentation and operation, but they do not become independent factual Face-data origins.

## 007 / TRAN$ACT

The `$ TRAN$ACT` launcher is an operating surface attached to the permanent Object. TRAN$ACT records created for that Object may be projected back onto authorized Faces. Faces do not directly mutate TRAN$ACT financial truth.

## 009 / customer Face fields

Customer-defined Face fields are maintained by permissioned users and stored against the Object contract. A customer can change what they capture without changing the Object's immutable identity.

## Authorization rule

`faceApp.dataCapabilities` may resolve only to:

- `field:*` capabilities present in the authorized manifest; or
- authorized TRAN$ACT `projection:*` capabilities present in the authorized manifest.

Relationships, platform capabilities and other contextual capabilities may still appear as required/optional capabilities. They cannot masquerade as factual `dataCapabilities`.

## Identity rule

Neither source class creates or replaces Object identity. The permanent `objectId` and Passport bind both sources to the same Object.
